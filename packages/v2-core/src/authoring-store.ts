import type { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import {
	AcceptedHistoryBundleSchema,
	AcceptedMutationSchema,
	AuthoringProjectStateSchema,
	ProjectProjectionSchema,
	ScreenplayDraftSchema,
	ScreenplayProposalSchema,
	type AcceptedHistoryBundle,
	type AcceptedMutation,
	type AuthoringChangeSet,
	type AuthoringOperation,
	type AuthoringPrecondition,
	type AuthoringProjectRevision,
	type AuthoringProjectState,
	type DocumentVersionScope,
	type ProjectProjection,
	type ScreenplayDraft,
	type ScreenplayElement,
	type ScreenplayElementState,
	type ScreenplayProposal,
	type ScreenplayScopeCheckpoint,
	type ScreenplayScopeContent,
	type ScreenplayScopeProjection
} from './authoring-contracts.js';

export interface ProjectStore {
	getHead(): Promise<AuthoringProjectState>;
	getRevision(revision: number): Promise<AuthoringProjectState | undefined>;
}

export interface HistoryStore {
	listChangeSets(): Promise<readonly AuthoringChangeSet[]>;
	exportAcceptedHistory(): Promise<AcceptedHistoryBundle>;
}

export type DraftWriteResult =
	{ ok: true } | { ok: false; code: 'DRAFT_ID_CONFLICT' | 'DRAFT_BASE_CHANGED'; message: string };

export type ProposalWriteResult =
	| { ok: true }
	| {
			ok: false;
			code: 'DUPLICATE_PROPOSAL' | 'PROPOSAL_ALREADY_RESOLVED';
			message: string;
	  };

export interface ProposalTransition {
	proposalId: string;
	expectedStatus: 'pending';
	next: ScreenplayProposal;
}

export interface DraftProposalStore {
	getDraft(draftId: string): Promise<ScreenplayDraft | undefined>;
	saveDraft(draft: ScreenplayDraft): Promise<DraftWriteResult>;
	getProposal(proposalId: string): Promise<ScreenplayProposal | undefined>;
	createProposal(proposal: ScreenplayProposal): Promise<ProposalWriteResult>;
	transitionProposal(transition: ProposalTransition): Promise<ProposalWriteResult>;
}

export interface AuthoringUnitOfWork extends ProjectStore, HistoryStore, DraftProposalStore {
	commitAccepted(
		mutation: AcceptedMutation,
		proposalTransition?: ProposalTransition
	): Promise<StoreCommitResult>;
}

export interface ProjectStoreResolver {
	forProject(projectId: string): Promise<AuthoringUnitOfWork | undefined>;
}

export type StoreCommitResult =
	| { ok: true }
	| {
			ok: false;
			code:
				| 'STALE_PROJECT_HEAD'
				| 'DUPLICATE_CHANGE_SET'
				| 'INVALID_ACCEPTED_MUTATION'
				| 'PROPOSAL_ALREADY_RESOLVED';
			message: string;
	  };

export type ProjectionResult =
	| { ok: true; projection: ProjectProjection }
	| { ok: false; code: 'INVALID_OPERATION' | 'PRECONDITION_FAILED'; message: string };

export function compareCanonicalIds(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function compareUnicodeCodePoints(left: string, right: string): number {
	const leftPoints = Array.from(left, (value) => value.codePointAt(0)!);
	const rightPoints = Array.from(right, (value) => value.codePointAt(0)!);
	for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
		if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
	}
	return leftPoints.length - rightPoints.length;
}

function materializeValue(value: unknown, ancestors: Set<object>): unknown {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) throw new Error('numbers must be finite');
		return value;
	}
	if (!value || typeof value !== 'object' || ancestors.has(value))
		throw new Error('value must be acyclic JSON data');
	const prototype = Object.getPrototypeOf(value);
	if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null)
		throw new Error('objects must have a plain prototype');
	ancestors.add(value);
	const descriptors = Object.getOwnPropertyDescriptors(value);
	const keys = Reflect.ownKeys(descriptors);
	if (keys.some((key) => typeof key !== 'string')) throw new Error('symbol keys are not supported');
	if (
		keys.some((key) => {
			const descriptor = descriptors[key as string];
			return key !== 'length' && (!('value' in descriptor) || !descriptor.enumerable);
		})
	)
		throw new Error('accessors and non-enumerable data are not supported');

	let result: unknown;
	if (Array.isArray(value)) {
		const lengthDescriptor = descriptors.length;
		if (
			!lengthDescriptor ||
			!('value' in lengthDescriptor) ||
			!Number.isSafeInteger(lengthDescriptor.value)
		)
			throw new Error('invalid array length');
		const array = new Array(lengthDescriptor.value);
		for (let index = 0; index < array.length; index += 1) {
			const descriptor = descriptors[String(index)];
			if (!descriptor || !('value' in descriptor)) throw new Error('arrays must be dense');
			array[index] = materializeValue(descriptor.value, ancestors);
		}
		if (keys.some((key) => key !== 'length' && !/^\d+$/.test(key as string)))
			throw new Error('arrays cannot have named properties');
		result = array;
	} else {
		const record: Record<string, unknown> = {};
		for (const key of keys as string[]) {
			const descriptor = descriptors[key];
			if (!('value' in descriptor)) throw new Error('accessors are not supported');
			Object.defineProperty(record, key, {
				value: materializeValue(descriptor.value, ancestors),
				enumerable: true,
				writable: true,
				configurable: true
			});
		}
		result = record;
	}
	ancestors.delete(value);
	return result;
}

export function materializeJson<T = unknown>(value: unknown): T | undefined {
	try {
		return materializeValue(value, new Set()) as T;
	} catch {
		return undefined;
	}
}

export function materializeAndValidate<T>(schema: TSchema, value: unknown): T | undefined {
	const materialized = materializeJson<T>(value);
	if (materialized === undefined) return undefined;
	try {
		return Value.Check(schema, materialized) ? materialized : undefined;
	} catch {
		return undefined;
	}
}

function cloneJson<T>(value: T): T {
	const clone = materializeJson<T>(value);
	if (clone === undefined) throw new Error('internal record is not JSON data');
	return clone;
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
	}
	return value;
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value)
				.sort(([left], [right]) => compareUnicodeCodePoints(left, right))
				.map(([key, child]) => [key, canonical(child)])
		);
	return value;
}

export function observableEqual(left: unknown, right: unknown): boolean {
	return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export function scopeKey(scope: DocumentVersionScope): string {
	return JSON.stringify([scope.documentId, scope.versionId]);
}

function compareScopes(left: DocumentVersionScope, right: DocumentVersionScope): number {
	return (
		compareCanonicalIds(left.documentId, right.documentId) ||
		compareCanonicalIds(left.versionId, right.versionId)
	);
}

function matchesScope(
	projection: Pick<ScreenplayScopeProjection, 'documentId' | 'versionId'>,
	scope: DocumentVersionScope
): boolean {
	return projection.documentId === scope.documentId && projection.versionId === scope.versionId;
}

export function findScreenplayScope(
	projection: ProjectProjection,
	scope: DocumentVersionScope
): ScreenplayScopeProjection | undefined {
	return projection.screenplays.find((candidate) => matchesScope(candidate, scope));
}

export function resolveScreenplayElements(
	projection: ProjectProjection,
	scope: DocumentVersionScope
): ScreenplayElement[] | undefined {
	const screenplay = findScreenplayScope(projection, scope);
	if (!screenplay) return undefined;
	const byId = new Map(screenplay.elements.map((element) => [element.id, element]));
	return screenplay.order.flatMap((elementId) => {
		const element = byId.get(elementId);
		return element?.status === 'present'
			? [{ id: element.id, kind: element.kind, text: element.text }]
			: [];
	});
}

export function resolveElementState(
	projection: ProjectProjection,
	scope: DocumentVersionScope,
	elementId: string
): 'present' | 'removed' | 'unknown' {
	return (
		findScreenplayScope(projection, scope)?.elements.find((element) => element.id === elementId)
			?.status ?? 'unknown'
	);
}

function validateUnique(values: readonly string[]): boolean {
	return new Set(values).size === values.length;
}

function validateScopeContent(
	content: ScreenplayScopeContent,
	projection?: ProjectProjection,
	scope?: DocumentVersionScope
): string | undefined {
	if (!validateUnique(content.order)) return 'screenplay order contains duplicate element IDs';
	const elementIds = content.elements.map((element) => element.id);
	if (!validateUnique(elementIds)) return 'screenplay contains duplicate element states';
	if (
		content.order.length !== elementIds.length ||
		content.order.some((elementId) => !elementIds.includes(elementId))
	)
		return 'screenplay order and element states must contain the same IDs';
	const sorted = [...elementIds].sort(compareCanonicalIds);
	if (!observableEqual(elementIds, sorted))
		return 'screenplay element states must use canonical ASCII ID order';
	if (projection && scope) {
		for (const element of content.elements) {
			const definition = projection.screenplayElements.find(
				(candidate) => candidate.id === element.id
			);
			if (!definition) return `screenplay references unknown element identity: ${element.id}`;
			if (definition.documentId !== scope.documentId)
				return `element identity belongs to another document: ${element.id}`;
			if (definition.kind !== element.kind)
				return `element kind cannot change for stable identity ${element.id}`;
		}
	}
	return undefined;
}

export function validateProjectProjection(projection: ProjectProjection): string[] {
	const messages: string[] = [];
	const documentIds = projection.documents.map((document) => document.id);
	const versionIds = projection.versions.map((version) => version.id);
	if (!validateUnique(documentIds)) messages.push('project contains duplicate document IDs');
	if (!validateUnique(versionIds)) messages.push('project contains duplicate version IDs');
	const definitionIds = projection.screenplayElements.map((element) => element.id);
	if (!validateUnique(definitionIds))
		messages.push('project contains duplicate screenplay element IDs');
	if (!observableEqual(definitionIds, [...definitionIds].sort(compareCanonicalIds)))
		messages.push('screenplay element registry must use canonical ASCII ID order');
	for (const definition of projection.screenplayElements) {
		if (!documentIds.includes(definition.documentId))
			messages.push(`screenplay element references unknown document: ${definition.id}`);
	}
	const keys = projection.screenplays.map((screenplay) => scopeKey(screenplay));
	if (!validateUnique(keys)) messages.push('project contains duplicate screenplay scopes');
	for (const screenplay of projection.screenplays) {
		if (!documentIds.includes(screenplay.documentId))
			messages.push('screenplay references unknown document');
		if (!versionIds.includes(screenplay.versionId))
			messages.push('screenplay references unknown version');
		const message = validateScopeContent(screenplay, projection, screenplay);
		if (message) messages.push(message);
	}
	return messages;
}

function stateIndex(screenplay: ScreenplayScopeProjection, elementId: string): number {
	return screenplay.elements.findIndex((element) => element.id === elementId);
}

function insertAfter(order: string[], elementId: string, afterElementId: string | null): void {
	const existingIndex = order.indexOf(elementId);
	if (existingIndex >= 0) order.splice(existingIndex, 1);
	if (afterElementId === null) {
		order.unshift(elementId);
		return;
	}
	const anchorIndex = order.indexOf(afterElementId);
	if (anchorIndex < 0) throw new Error(`Unknown order anchor: ${afterElementId}`);
	order.splice(anchorIndex + 1, 0, elementId);
}

function contentFromScope(screenplay: ScreenplayScopeProjection): ScreenplayScopeContent {
	return {
		order: [...screenplay.order],
		elements: screenplay.elements.map((element) => ({ ...element }))
	};
}

function replaceContent(
	projection: ProjectProjection,
	screenplay: ScreenplayScopeProjection,
	content: ScreenplayScopeContent
): void {
	const message = validateScopeContent(content, projection, screenplay);
	if (message) throw new Error(message);
	screenplay.order = [...content.order];
	screenplay.elements = content.elements.map((element) => ({ ...element }));
}

function applyOperationV1(
	projection: ProjectProjection,
	operation: AuthoringOperation,
	resultingRevision: number
): void {
	const screenplay = findScreenplayScope(projection, operation.scope);
	if (!screenplay) throw new Error(`Unknown screenplay scope: ${scopeKey(operation.scope)}`);
	if (operation.type === 'RestoreScreenplayDocument') {
		replaceContent(projection, screenplay, operation.content);
		return;
	}
	const elementId =
		operation.type === 'InsertScreenplayElement' ? operation.element.id : operation.elementId;
	const index = stateIndex(screenplay, elementId);
	const state = index >= 0 ? screenplay.elements[index] : undefined;
	const definition = projection.screenplayElements.find((element) => element.id === elementId);
	if (operation.type === 'InsertScreenplayElement') {
		if (state?.status === 'present')
			throw new Error(`Element is already present: ${operation.element.id}`);
		if (definition) {
			if (definition.documentId !== operation.scope.documentId)
				throw new Error(`Element identity belongs to another document: ${elementId}`);
			if (definition.kind !== operation.element.kind)
				throw new Error(`Element kind cannot change for stable identity ${elementId}`);
		} else {
			projection.screenplayElements.push({
				id: elementId,
				documentId: operation.scope.documentId,
				kind: operation.element.kind,
				createdInRevision: resultingRevision
			});
			projection.screenplayElements.sort((left, right) => compareCanonicalIds(left.id, right.id));
		}
		if (operation.afterElementId === operation.element.id)
			throw new Error('an element cannot be ordered after itself');
		const next: ScreenplayElementState = { ...operation.element, status: 'present' };
		if (index >= 0) screenplay.elements[index] = next;
		else screenplay.elements.push(next);
		insertAfter(screenplay.order, operation.element.id, operation.afterElementId);
	} else if (operation.type === 'UpdateScreenplayElementText') {
		if (!state || state.status !== 'present')
			throw new Error(`Element is not present: ${operation.elementId}`);
		screenplay.elements[index] = { ...state, text: operation.text };
	} else if (operation.type === 'RemoveScreenplayElement') {
		if (!state || state.status !== 'present')
			throw new Error(`Element is not present: ${operation.elementId}`);
		screenplay.elements[index] = { id: state.id, kind: state.kind, status: 'removed' };
	} else {
		if (!state || state.status !== 'present')
			throw new Error(`Element is not present: ${operation.elementId}`);
		if (operation.afterElementId === operation.elementId)
			throw new Error('an element cannot be ordered after itself');
		if (operation.afterElementId !== null) {
			const anchor = screenplay.elements.find(
				(element) => element.id === operation.afterElementId && element.status === 'present'
			);
			if (!anchor) throw new Error(`Order anchor is not present: ${operation.afterElementId}`);
		}
		insertAfter(screenplay.order, operation.elementId, operation.afterElementId);
	}
	screenplay.elements.sort((left, right) => compareCanonicalIds(left.id, right.id));
}

function checkPrecondition(
	projection: ProjectProjection,
	precondition: AuthoringPrecondition
): string | undefined {
	const screenplay = findScreenplayScope(projection, precondition.scope);
	if (!screenplay) return `Unknown screenplay scope: ${scopeKey(precondition.scope)}`;
	if (screenplay.documentVersion !== precondition.expectedDocumentVersion)
		return `Document version changed from ${precondition.expectedDocumentVersion} to ${screenplay.documentVersion}`;
	return undefined;
}

function projectAuthoringOperationsV1(
	current: ProjectProjection,
	operations: readonly AuthoringOperation[],
	preconditions: readonly AuthoringPrecondition[],
	resultingRevision: number
): ProjectionResult {
	for (const precondition of preconditions) {
		const message = checkPrecondition(current, precondition);
		if (message) return { ok: false, code: 'PRECONDITION_FAILED', message };
	}
	const projection = cloneJson(current);
	const affectedScopes = new Set<string>();
	try {
		for (const operation of operations) {
			applyOperationV1(projection, operation, resultingRevision);
			affectedScopes.add(scopeKey(operation.scope));
		}
		for (const screenplay of projection.screenplays) {
			if (affectedScopes.has(scopeKey(screenplay))) screenplay.documentVersion += 1;
		}
		const messages = validateProjectProjection(projection);
		if (messages.length) throw new Error(messages.join('; '));
		return { ok: true, projection };
	} catch (error) {
		return {
			ok: false,
			code: 'INVALID_OPERATION',
			message: error instanceof Error ? error.message : 'Invalid authoring operation'
		};
	}
}

const acceptedReducers = new Map<number, typeof projectAuthoringOperationsV1>([
	[1, projectAuthoringOperationsV1] as const
]);

export function projectAuthoringOperations(
	current: ProjectProjection,
	operations: readonly AuthoringOperation[],
	preconditions: readonly AuthoringPrecondition[],
	resultingRevision: number,
	changeSetSchemaVersion = 1
): ProjectionResult {
	const reducer = acceptedReducers.get(changeSetSchemaVersion);
	if (!reducer)
		return {
			ok: false,
			code: 'INVALID_OPERATION',
			message: `Unsupported ChangeSet schema version: ${changeSetSchemaVersion}`
		};
	return reducer(current, operations, preconditions, resultingRevision);
}

export function touchedScopesForOperations(
	operations: readonly AuthoringOperation[]
): DocumentVersionScope[] {
	const scopes = new Map<string, DocumentVersionScope>();
	for (const operation of operations) scopes.set(scopeKey(operation.scope), { ...operation.scope });
	return [...scopes.values()].sort(compareScopes);
}

export function checkpointsForProjection(
	projection: ProjectProjection,
	projectRevision: number,
	operations: readonly AuthoringOperation[]
): ScreenplayScopeCheckpoint[] {
	return touchedScopesForOperations(operations).map((scope) => {
		const screenplay = findScreenplayScope(projection, scope);
		if (!screenplay) throw new Error(`Unknown checkpoint scope: ${scopeKey(scope)}`);
		return {
			schemaVersion: 1,
			projectId: projection.projectId,
			projectRevision,
			scope,
			documentVersion: screenplay.documentVersion,
			content: contentFromScope(screenplay)
		};
	});
}

function stateToRevision(state: AuthoringProjectState): AuthoringProjectRevision {
	return {
		schemaVersion: state.schemaVersion,
		projectId: state.projectId,
		number: state.number,
		changeSetId: state.changeSetId,
		timestamp: state.timestamp,
		touchedScopes: state.touchedScopes.map((scope) => ({ ...scope }))
	};
}

function materializeState(input: unknown): AuthoringProjectState | undefined {
	const state = materializeAndValidate<AuthoringProjectState>(AuthoringProjectStateSchema, input);
	if (!state || validateProjectProjection(state.projection).length) return undefined;
	if (state.projectId !== state.projection.projectId) return undefined;
	return state;
}

function materializeMutation(input: unknown): AcceptedMutation | undefined {
	return materializeAndValidate<AcceptedMutation>(AcceptedMutationSchema, input);
}

function validateRestoreReferences(
	changeSet: AuthoringChangeSet,
	projectionAt: (revision: number) => ProjectProjection | undefined
): string | undefined {
	for (const operation of changeSet.operations) {
		if (operation.type !== 'RestoreScreenplayDocument') continue;
		const target = projectionAt(operation.targetRevision);
		const targetScope = target && findScreenplayScope(target, operation.scope);
		if (!targetScope) return `Restore target revision was not found: ${operation.targetRevision}`;
		if (targetScope.documentVersion !== operation.targetDocumentVersion)
			return 'Restore target document version does not match the historical scope';
		if (!observableEqual(operation.content, contentFromScope(targetScope)))
			return 'Restore content does not match its target revision';
	}
	return undefined;
}

function validateAcceptedMutation(
	mutation: AcceptedMutation,
	current: AuthoringProjectState,
	projected: ProjectProjection
): string | undefined {
	const { changeSet, revision, checkpoints } = mutation;
	if (changeSet.projectId !== current.projectId || revision.projectId !== current.projectId)
		return 'Accepted mutation belongs to another project';
	if (changeSet.baseRevision !== current.number)
		return `Project head changed from ${changeSet.baseRevision} to ${current.number}`;
	if (changeSet.resultingRevision !== current.number + 1)
		return 'ChangeSet revision sequence is not contiguous';
	if (
		revision.number !== changeSet.resultingRevision ||
		revision.changeSetId !== changeSet.id ||
		revision.timestamp !== changeSet.timestamp
	)
		return 'ProjectRevision metadata does not match its ChangeSet';
	const expectedScopes = touchedScopesForOperations(changeSet.operations);
	if (!observableEqual(revision.touchedScopes, expectedScopes))
		return 'ProjectRevision touched scopes do not match its semantic operations';
	if (checkpoints.length !== expectedScopes.length)
		return 'Accepted mutation must store exactly one checkpoint per touched scope';
	for (let index = 0; index < expectedScopes.length; index += 1) {
		const scope = expectedScopes[index];
		const checkpoint = checkpoints[index];
		const screenplay = findScreenplayScope(projected, scope);
		if (
			!screenplay ||
			checkpoint.projectId !== current.projectId ||
			checkpoint.projectRevision !== revision.number ||
			!observableEqual(checkpoint.scope, scope) ||
			checkpoint.documentVersion !== screenplay.documentVersion ||
			!observableEqual(checkpoint.content, contentFromScope(screenplay))
		)
			return 'Scoped checkpoint does not match the projected screenplay scope';
	}
	return undefined;
}

function readAcceptedHistoryV1(materialized: unknown): AcceptedHistoryBundle {
	const history = materializeAndValidate<AcceptedHistoryBundle>(
		AcceptedHistoryBundleSchema,
		materialized
	);
	if (!history) throw new Error('Accepted history contract v1 is malformed');
	return history;
}

const acceptedHistoryReaders = new Map<number, (input: unknown) => AcceptedHistoryBundle>([
	[1, readAcceptedHistoryV1]
]);

export class InMemoryAuthoringProjectStore implements AuthoringUnitOfWork {
	private readonly initialState: AuthoringProjectState;
	private readonly revisions: AuthoringProjectRevision[];
	private readonly accepted: AcceptedMutation[] = [];
	private currentProjection: ProjectProjection;
	private drafts = new Map<string, ScreenplayDraft>();
	private proposals = new Map<string, ScreenplayProposal>();

	constructor(initialStateInput: unknown) {
		const initialState = materializeState(initialStateInput);
		if (
			!initialState ||
			initialState.number !== 0 ||
			initialState.changeSetId !== null ||
			initialState.touchedScopes.length
		)
			throw new Error('A valid initial authoring project state is required');
		this.initialState = deepFreeze(cloneJson(initialState));
		this.revisions = [deepFreeze(stateToRevision(initialState))];
		this.currentProjection = deepFreeze(cloneJson(initialState.projection));
	}

	static async fromAcceptedHistory(input: unknown): Promise<InMemoryAuthoringProjectStore> {
		const materialized = materializeJson<Record<string, unknown>>(input);
		if (!materialized || typeof materialized !== 'object')
			throw new Error('Accepted history envelope is malformed');
		const contractVersion = materialized.historyContractVersion;
		if (
			!Number.isInteger(contractVersion) ||
			!acceptedHistoryReaders.has(contractVersion as number)
		)
			throw new Error(`Unsupported accepted history contract version: ${String(contractVersion)}`);
		const acceptedRecords = Array.isArray(materialized.accepted) ? materialized.accepted : [];
		for (const record of acceptedRecords) {
			const schemaVersion = (record as { changeSet?: { schemaVersion?: unknown } })?.changeSet
				?.schemaVersion;
			if (schemaVersion !== 1)
				throw new Error(`Unsupported ChangeSet schema version: ${String(schemaVersion)}`);
		}
		const history = acceptedHistoryReaders.get(contractVersion as number)!(materialized);
		const store = new InMemoryAuthoringProjectStore({
			...history.initialRevision,
			projection: history.initialProjection
		});
		store.rehydrateAcceptedHistory(history.accepted);
		return store;
	}

	private rehydrateAcceptedHistory(acceptedRecords: readonly AcceptedMutation[]): void {
		const projections = new Map<number, ProjectProjection>([[0, this.initialState.projection]]);
		for (const record of acceptedRecords) {
			const mutation = materializeMutation(record);
			if (!mutation) throw new Error('Accepted history contains a malformed record');
			const current = this.currentState();
			const restoreError = validateRestoreReferences(mutation.changeSet, (revision) =>
				projections.get(revision)
			);
			if (restoreError) throw new Error(restoreError);
			const projected = projectAuthoringOperations(
				current.projection,
				mutation.changeSet.operations,
				mutation.changeSet.preconditions,
				mutation.changeSet.resultingRevision,
				mutation.changeSet.schemaVersion
			);
			if (!projected.ok) throw new Error(`Accepted history does not replay: ${projected.message}`);
			const validationError = validateAcceptedMutation(mutation, current, projected.projection);
			if (validationError) throw new Error(validationError);
			this.appendAccepted(mutation, projected.projection);
			projections.set(mutation.revision.number, this.currentProjection);
		}
	}

	private currentState(): AuthoringProjectState {
		const revision = this.revisions[this.revisions.length - 1];
		return {
			...cloneJson(revision),
			projection: cloneJson(this.currentProjection)
		};
	}

	private projectionAtRevision(revision: number): ProjectProjection | undefined {
		if (!Number.isInteger(revision) || revision < 0 || revision >= this.revisions.length)
			return undefined;
		let projection = cloneJson(this.initialState.projection);
		for (const mutation of this.accepted) {
			if (mutation.revision.number > revision) break;
			const projected = projectAuthoringOperations(
				projection,
				mutation.changeSet.operations,
				mutation.changeSet.preconditions,
				mutation.changeSet.resultingRevision,
				mutation.changeSet.schemaVersion
			);
			if (!projected.ok) throw new Error(`Stored history does not replay: ${projected.message}`);
			projection = projected.projection;
		}
		return projection;
	}

	private appendAccepted(mutation: AcceptedMutation, projection: ProjectProjection): void {
		this.accepted.push(deepFreeze(cloneJson(mutation)));
		this.revisions.push(deepFreeze(cloneJson(mutation.revision)));
		this.currentProjection = deepFreeze(cloneJson(projection));
	}

	async getHead(): Promise<AuthoringProjectState> {
		return deepFreeze(cloneJson(this.currentState()));
	}

	async getRevision(revision: number): Promise<AuthoringProjectState | undefined> {
		const metadata = this.revisions[revision];
		const projection = this.projectionAtRevision(revision);
		return metadata && projection ? deepFreeze(cloneJson({ ...metadata, projection })) : undefined;
	}

	async listChangeSets(): Promise<readonly AuthoringChangeSet[]> {
		return deepFreeze(cloneJson(this.accepted.map((mutation) => mutation.changeSet)));
	}

	async exportAcceptedHistory(): Promise<AcceptedHistoryBundle> {
		return deepFreeze(
			cloneJson({
				historyContractVersion: 1,
				initialRevision: stateToRevision(this.initialState),
				initialProjection: this.initialState.projection,
				accepted: this.accepted
			})
		);
	}

	async getDraft(draftId: string): Promise<ScreenplayDraft | undefined> {
		const draft = this.drafts.get(draftId);
		return draft ? deepFreeze(cloneJson(draft)) : undefined;
	}

	async saveDraft(input: ScreenplayDraft): Promise<DraftWriteResult> {
		const draft = materializeAndValidate<ScreenplayDraft>(ScreenplayDraftSchema, input);
		if (!draft) return { ok: false, code: 'DRAFT_ID_CONFLICT', message: 'Draft is malformed' };
		const existing = this.drafts.get(draft.id);
		if (
			existing &&
			(existing.projectId !== draft.projectId ||
				existing.owner.kind !== draft.owner.kind ||
				existing.owner.id !== draft.owner.id ||
				scopeKey(existing.scope) !== scopeKey(draft.scope))
		)
			return { ok: false, code: 'DRAFT_ID_CONFLICT', message: 'Draft identity already exists' };
		if (
			existing &&
			(existing.baseProjectRevision !== draft.baseProjectRevision ||
				existing.baseDocumentVersion !== draft.baseDocumentVersion)
		)
			return {
				ok: false,
				code: 'DRAFT_BASE_CHANGED',
				message: 'An existing Draft keeps the semantic base where it was started'
			};
		this.drafts.set(draft.id, deepFreeze(cloneJson(draft)));
		return { ok: true };
	}

	async getProposal(proposalId: string): Promise<ScreenplayProposal | undefined> {
		const proposal = this.proposals.get(proposalId);
		return proposal ? deepFreeze(cloneJson(proposal)) : undefined;
	}

	async createProposal(input: ScreenplayProposal): Promise<ProposalWriteResult> {
		const proposal = materializeAndValidate<ScreenplayProposal>(ScreenplayProposalSchema, input);
		if (!proposal || proposal.status !== 'pending')
			return { ok: false, code: 'DUPLICATE_PROPOSAL', message: 'Pending Proposal is malformed' };
		if (this.proposals.has(proposal.id))
			return {
				ok: false,
				code: 'DUPLICATE_PROPOSAL',
				message: `Proposal already exists: ${proposal.id}`
			};
		this.proposals.set(proposal.id, deepFreeze(cloneJson(proposal)));
		return { ok: true };
	}

	async transitionProposal(transition: ProposalTransition): Promise<ProposalWriteResult> {
		const next = materializeAndValidate<ScreenplayProposal>(
			ScreenplayProposalSchema,
			transition.next
		);
		const current = this.proposals.get(transition.proposalId);
		if (!next || next.id !== transition.proposalId || next.status === 'pending')
			return {
				ok: false,
				code: 'PROPOSAL_ALREADY_RESOLVED',
				message: 'Proposal terminal transition is malformed'
			};
		if (!current || current.status !== transition.expectedStatus)
			return {
				ok: false,
				code: 'PROPOSAL_ALREADY_RESOLVED',
				message: 'Proposal is already resolved'
			};
		this.proposals.set(next.id, deepFreeze(cloneJson(next)));
		return { ok: true };
	}

	async commitAccepted(
		mutationInput: AcceptedMutation,
		proposalTransitionInput?: ProposalTransition
	): Promise<StoreCommitResult> {
		const mutation = materializeMutation(mutationInput);
		const proposalTransition = proposalTransitionInput
			? materializeJson<ProposalTransition>(proposalTransitionInput)
			: undefined;
		if (!mutation || (proposalTransitionInput && !proposalTransition))
			return {
				ok: false,
				code: 'INVALID_ACCEPTED_MUTATION',
				message: 'Accepted mutation is malformed'
			};
		if (proposalTransition) {
			const currentProposal = this.proposals.get(proposalTransition.proposalId);
			const nextProposal = materializeAndValidate<ScreenplayProposal>(
				ScreenplayProposalSchema,
				proposalTransition.next
			);
			if (
				!currentProposal ||
				currentProposal.status !== proposalTransition.expectedStatus ||
				!nextProposal ||
				nextProposal.status !== 'accepted' ||
				nextProposal.id !== proposalTransition.proposalId ||
				nextProposal.changeSetId !== mutation.changeSet.id
			)
				return {
					ok: false,
					code: 'PROPOSAL_ALREADY_RESOLVED',
					message: 'Proposal is already resolved'
				};
		}
		const current = this.currentState();
		if (mutation.changeSet.baseRevision !== current.number)
			return {
				ok: false,
				code: 'STALE_PROJECT_HEAD',
				message: `Project head changed from ${mutation.changeSet.baseRevision} to ${current.number}`
			};
		if (this.accepted.some((record) => record.changeSet.id === mutation.changeSet.id))
			return {
				ok: false,
				code: 'DUPLICATE_CHANGE_SET',
				message: `ChangeSet already exists: ${mutation.changeSet.id}`
			};
		const restoreError = validateRestoreReferences(mutation.changeSet, (revision) =>
			this.projectionAtRevision(revision)
		);
		if (restoreError)
			return { ok: false, code: 'INVALID_ACCEPTED_MUTATION', message: restoreError };
		const projected = projectAuthoringOperations(
			current.projection,
			mutation.changeSet.operations,
			mutation.changeSet.preconditions,
			mutation.changeSet.resultingRevision,
			mutation.changeSet.schemaVersion
		);
		if (!projected.ok)
			return {
				ok: false,
				code: 'INVALID_ACCEPTED_MUTATION',
				message: projected.message
			};
		const validationError = validateAcceptedMutation(mutation, current, projected.projection);
		if (validationError)
			return {
				ok: false,
				code: 'INVALID_ACCEPTED_MUTATION',
				message: validationError
			};

		this.appendAccepted(mutation, projected.projection);
		if (proposalTransition)
			this.proposals.set(
				proposalTransition.proposalId,
				deepFreeze(cloneJson(proposalTransition.next))
			);
		return { ok: true };
	}
}

export class InMemoryProjectStoreResolver implements ProjectStoreResolver {
	private readonly stores = new Map<string, InMemoryAuthoringProjectStore>();

	constructor(initialStates: readonly unknown[]) {
		for (const input of initialStates) {
			const state = materializeState(input);
			if (!state) throw new Error('Project resolver received an invalid initial state');
			if (this.stores.has(state.projectId))
				throw new Error(`Duplicate project: ${state.projectId}`);
			this.stores.set(state.projectId, new InMemoryAuthoringProjectStore(state));
		}
	}

	async forProject(projectId: string): Promise<InMemoryAuthoringProjectStore | undefined> {
		return this.stores.get(projectId);
	}
}

export function screenplayContent(screenplay: ScreenplayScopeProjection): ScreenplayScopeContent {
	return contentFromScope(screenplay);
}

export function validateProjectionInput(input: unknown): ProjectProjection | undefined {
	const projection = materializeAndValidate<ProjectProjection>(ProjectProjectionSchema, input);
	return projection && !validateProjectProjection(projection).length ? projection : undefined;
}
