import type { OccupancyBlocker, WorldSnapshot } from './world.js';

import {
	CommitInputSchema,
	RestoreInputSchema,
	PrincipalSchema,
	Value,
	isJsonData
} from './history-contracts.js';
import type {
	SemanticOperation,
	Precondition,
	CommitInput,
	PrincipalRef
} from './history-contracts.js';
export type {
	SemanticOperation,
	Precondition,
	CommitInput,
	RestoreInput,
	PrincipalRef
} from './history-contracts.js';

export type RevisionNumber = number;

export interface ChangeSet {
	schemaVersion: 1;
	id: string;
	projectId: string;
	baseRevision: RevisionNumber;
	resultingRevision: RevisionNumber;
	principal: PrincipalRef;
	timestamp: string;
	intent: string;
	operations: readonly SemanticOperation[];
	preconditions: readonly Precondition[];
	restoresRevision?: RevisionNumber;
}

export interface ProjectRevision {
	projectId: string;
	number: RevisionNumber;
	changeSetId: string | null;
	timestamp: string;
	state: WorldSnapshot;
}

export type RevisionError =
	| {
			kind: 'conflict';
			code: 'STALE_BASE_REVISION';
			expectedBaseRevision: RevisionNumber;
			actualRevision: RevisionNumber;
	  }
	| {
			kind: 'precondition-failed';
			code: 'PRECONDITION_FAILED';
			precondition: Precondition;
			actual: unknown;
	  }
	| {
			kind: 'validation';
			code: 'INVALID_CHANGE_SET' | 'UNSUPPORTED_RESTORE';
			messages: readonly string[];
	  }
	| {
			kind: 'duplicate-change-set';
			code: 'DUPLICATE_CHANGE_SET';
			changeSetId: string;
	  }
	| {
			kind: 'not-found';
			code: 'REVISION_NOT_FOUND';
			revision: RevisionNumber;
	  };

export type CommitResult =
	| { ok: true; changeSet: ChangeSet; revision: ProjectRevision }
	| { ok: false; error: RevisionError };

export interface RevisionHistoryOptions {
	projectId: string;
	/** Trusted application/runtime attribution, never copied from command content. */
	trustedPrincipal: PrincipalRef;
	/** Explicitly declared state keys, including initially absent keys. */
	stateKeys?: readonly string[];
	initialTimestamp?: string;
	now?: () => string;
	idFactory?: () => string;
}

function cloneOccupancy(value: OccupancyBlocker): OccupancyBlocker {
	return { ...value };
}

function cloneOperation(operation: SemanticOperation): SemanticOperation {
	return operation.type !== 'SetOccupancy'
		? { ...operation }
		: { ...operation, occupancy: operation.occupancy.map(cloneOccupancy) };
}

function clonePrecondition(precondition: Precondition): Precondition {
	return precondition.type !== 'OccupancyEquals'
		? { ...precondition }
		: { ...precondition, expected: precondition.expected.map(cloneOccupancy) };
}

function cloneSnapshot(snapshot: WorldSnapshot): WorldSnapshot {
	return {
		...snapshot,
		state: { ...snapshot.state },
		nodes: snapshot.nodes.map((node) => ({ ...node })),
		edges: snapshot.edges.map((edge) => ({
			...edge,
			requirements: edge.requirements?.map((requirement) => ({
				...requirement,
				in: requirement.in ? [...requirement.in] : undefined
			}))
		})),
		occupancy: snapshot.occupancy.map(cloneOccupancy),
		entityLocations: { ...snapshot.entityLocations }
	};
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
	}
	return value;
}

function equivalent(left: unknown, right: unknown): boolean {
	const canonical = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(canonical);
		if (value && typeof value === 'object')
			return Object.fromEntries(
				Object.entries(value)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([key, child]) => [key, canonical(child)])
			);
		return value;
	};
	return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function sortedOccupancy(items: readonly OccupancyBlocker[]): OccupancyBlocker[] {
	return items.map(cloneOccupancy).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
}

function occupancyForEntity(snapshot: WorldSnapshot, entityId: string): OccupancyBlocker[] {
	return sortedOccupancy(snapshot.occupancy.filter((blocker) => blocker.entityId === entityId));
}

function applyOperation(snapshot: WorldSnapshot, operation: SemanticOperation): void {
	if (operation.type === 'UnsetWorldState') {
		delete snapshot.state[operation.key];
		return;
	}
	if (operation.type === 'SetWorldState') {
		snapshot.state[operation.key] = operation.value;
		return;
	}
	snapshot.occupancy = snapshot.occupancy.filter(
		(blocker) => blocker.entityId !== operation.entityId
	);
	snapshot.occupancy.push(...operation.occupancy.map(cloneOccupancy));
}

function diffSnapshots(
	current: WorldSnapshot,
	target: WorldSnapshot
): SemanticOperation[] | RevisionError {
	if (
		current.id !== target.id ||
		!equivalent(current.nodes, target.nodes) ||
		!equivalent(current.edges, target.edges) ||
		!equivalent(current.entityLocations, target.entityLocations)
	) {
		return {
			kind: 'validation',
			code: 'UNSUPPORTED_RESTORE',
			messages: ['restore currently supports semantic world-state and occupancy differences only']
		};
	}

	const operations: SemanticOperation[] = [];
	const stateKeys = [
		...new Set([...Object.keys(current.state), ...Object.keys(target.state)])
	].sort();
	for (const key of stateKeys) {
		if (!Object.hasOwn(target.state, key)) {
			operations.push({ type: 'UnsetWorldState', key });
		} else if (!Object.hasOwn(current.state, key) || current.state[key] !== target.state[key]) {
			operations.push({ type: 'SetWorldState', key, value: target.state[key] });
		}
	}

	const entityIds = [
		...new Set([
			...current.occupancy.map((item) => item.entityId),
			...target.occupancy.map((item) => item.entityId)
		])
	].sort();
	for (const entityId of entityIds) {
		const currentOccupancy = occupancyForEntity(current, entityId);
		const targetOccupancy = occupancyForEntity(target, entityId);
		if (!equivalent(currentOccupancy, targetOccupancy))
			operations.push({ type: 'SetOccupancy', entityId, occupancy: targetOccupancy });
	}
	return operations;
}

export class InMemoryRevisionHistory {
	private readonly projectId: string;
	private readonly principal: PrincipalRef;
	private readonly stateKeys: Set<string>;
	private readonly now: () => string;
	private readonly idFactory: () => string;
	private readonly revisions: ProjectRevision[];
	private readonly changeSets = new Map<string, ChangeSet>();

	constructor(initial: WorldSnapshot, options: RevisionHistoryOptions) {
		if (!options.projectId.trim()) throw new Error('projectId must not be empty');
		if (!Number.isInteger(initial.revision) || initial.revision < 0)
			throw new Error('initial revision must be a non-negative integer');
		if (!Value.Check(PrincipalSchema, options.trustedPrincipal))
			throw new Error('trustedPrincipal is required');
		this.principal = deepFreeze({ ...options.trustedPrincipal });
		this.stateKeys = new Set(
			options.stateKeys ?? [
				...Object.keys(initial.state),
				...initial.edges.flatMap((edge) => (edge.requirements ?? []).map((r) => r.key))
			]
		);
		if (
			[...this.stateKeys].some(
				(key) => !key.trim() || ['__proto__', 'prototype', 'constructor'].includes(key)
			)
		)
			throw new Error('invalid state key');
		for (const [key, value] of Object.entries(initial.state)) {
			if (
				!this.stateKeys.has(key) ||
				!['string', 'boolean', 'number'].includes(typeof value) ||
				(typeof value === 'number' && !Number.isFinite(value))
			)
				throw new Error('invalid initial state');
		}
		const nodes = new Set(initial.nodes.map((node) => node.id));
		if (
			Object.values(initial.entityLocations).some((node) => !nodes.has(node)) ||
			initial.occupancy.some(
				(item) => !Object.hasOwn(initial.entityLocations, item.entityId) || !nodes.has(item.nodeId)
			)
		)
			throw new Error('invalid initial references');
		this.projectId = options.projectId;
		this.now = options.now ?? (() => new Date().toISOString());
		this.idFactory = options.idFactory ?? (() => `changeset:${crypto.randomUUID()}`);
		this.revisions = [
			deepFreeze({
				projectId: this.projectId,
				number: initial.revision,
				changeSetId: null,
				timestamp: options.initialTimestamp ?? this.now(),
				state: deepFreeze(cloneSnapshot(initial))
			})
		];
	}

	get current(): ProjectRevision {
		return this.revisions[this.revisions.length - 1];
	}

	get history(): readonly ProjectRevision[] {
		return [...this.revisions];
	}

	get changeSetsInOrder(): readonly ChangeSet[] {
		return this.revisions.slice(1).map((revision) => this.changeSets.get(revision.changeSetId!)!);
	}

	getRevision(number: RevisionNumber): ProjectRevision | undefined {
		return this.revisions.find((revision) => revision.number === number);
	}

	commit(input: unknown): CommitResult {
		if (!isJsonData(input) || !Value.Check(CommitInputSchema, input))
			return this.invalid(
				'Malformed command; identity, timestamp and IDs are assigned by the trusted runtime'
			);
		const messages: string[] = [];
		const checkReference = (item: SemanticOperation | Precondition) => {
			if ('key' in item) {
				if (!this.stateKeys.has(item.key)) messages.push('Unknown state target: ' + item.key);
			} else {
				if (!Object.hasOwn(this.current.state.entityLocations, item.entityId))
					messages.push('Unknown entity: ' + item.entityId);
				const occupancy = 'occupancy' in item ? item.occupancy : item.expected;
				for (const blocker of occupancy) {
					if (
						blocker.entityId !== item.entityId ||
						!this.current.state.nodes.some((node) => node.id === blocker.nodeId)
					)
						messages.push('Invalid occupancy reference');
				}
				if (new Set(occupancy.map((item) => item.nodeId)).size !== occupancy.length)
					messages.push('Duplicate occupancy node');
			}
		};
		input.operations.forEach(checkReference);
		(input.preconditions ?? []).forEach(checkReference);
		if (messages.length) return this.invalid(...messages);
		return this.acceptValidated(input);
	}

	private acceptValidated(input: CommitInput): CommitResult {
		const changeSetId = this.idFactory();
		if (typeof changeSetId !== 'string' || !changeSetId.trim())
			return this.invalid('Invalid runtime changeSetId');
		if (this.changeSets.has(changeSetId))
			return {
				ok: false,
				error: { kind: 'duplicate-change-set', code: 'DUPLICATE_CHANGE_SET', changeSetId }
			};
		if (input.baseRevision !== this.current.number) {
			return {
				ok: false,
				error: {
					kind: 'conflict',
					code: 'STALE_BASE_REVISION',
					expectedBaseRevision: input.baseRevision,
					actualRevision: this.current.number
				}
			};
		}

		for (const precondition of input.preconditions ?? []) {
			const actual =
				precondition.type === 'WorldStateAbsent'
					? Object.hasOwn(this.current.state.state, precondition.key)
					: precondition.type === 'WorldStateEquals'
						? this.current.state.state[precondition.key]
						: occupancyForEntity(this.current.state, precondition.entityId);
			const expected =
				precondition.type === 'WorldStateAbsent'
					? false
					: precondition.type === 'OccupancyEquals'
						? sortedOccupancy(precondition.expected)
						: precondition.expected;
			if (!equivalent(actual, expected))
				return {
					ok: false,
					error: { kind: 'precondition-failed', code: 'PRECONDITION_FAILED', precondition, actual }
				};
		}

		const resultingRevision = this.current.number + 1;
		const projected = cloneSnapshot(this.current.state);
		projected.revision = resultingRevision;
		input.operations.forEach((operation) => applyOperation(projected, operation));
		const changeSet = deepFreeze({
			schemaVersion: 1 as const,
			id: changeSetId,
			projectId: this.projectId,
			baseRevision: input.baseRevision,
			resultingRevision,
			principal: { ...this.principal },
			timestamp: this.now(),
			intent: input.intent,
			operations: input.operations.map(cloneOperation),
			preconditions: (input.preconditions ?? []).map(clonePrecondition)
		});
		const revision = deepFreeze({
			projectId: this.projectId,
			number: resultingRevision,
			changeSetId,
			timestamp: changeSet.timestamp,
			state: deepFreeze(projected)
		});
		this.changeSets.set(changeSetId, changeSet);
		this.revisions.push(revision);
		return { ok: true, changeSet, revision };
	}

	private invalid(...messages: string[]): CommitResult {
		return { ok: false, error: { kind: 'validation', code: 'INVALID_CHANGE_SET', messages } };
	}

	restore(targetRevision: RevisionNumber, input: unknown): CommitResult {
		if (
			!isJsonData(input) ||
			!Value.Check(RestoreInputSchema, input) ||
			!Number.isSafeInteger(targetRevision) ||
			targetRevision < 0
		)
			return this.invalid('Malformed restore command');
		const target = this.getRevision(targetRevision);
		if (!target)
			return {
				ok: false,
				error: { kind: 'not-found', code: 'REVISION_NOT_FOUND', revision: targetRevision }
			};
		const operations = diffSnapshots(this.current.state, target.state);
		if (!Array.isArray(operations)) return { ok: false, error: operations };
		const command = {
			...input,
			intent: input.intent ?? `Restore revision ${targetRevision}`,
			operations
		};
		// Restoring an equivalent projection is still an attributable authoring action.
		// Empty operations are allowed only here, never through public commit input.
		const result = operations.length ? this.commit(command) : this.acceptValidated(command);
		if (result.ok) {
			const restored = deepFreeze({ ...result.changeSet, restoresRevision: targetRevision });
			this.changeSets.set(restored.id, restored);
			const revision = this.revisions[this.revisions.length - 1];
			const replaced = deepFreeze({ ...revision, changeSetId: restored.id });
			this.revisions[this.revisions.length - 1] = replaced;
			return { ok: true, changeSet: restored, revision: replaced };
		}
		return result;
	}
}
