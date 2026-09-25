import type { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import {
	AcceptedHistoryBundleSchema,
	AcceptedMutationSchema,
	AuthoringProjectRevisionSchema,
	ProjectProjectionSchema,
	ScreenplayDraftSchema,
	ScreenplayProposalSchema,
	type AcceptedHistoryBundle,
	type AcceptedMutation,
	type AuthoringChangeSet,
	type AuthoringOperation,
	type AuthoringPrecondition,
	type AuthoringProjectRevision,
	type DocumentVersionScope,
	type ProjectProjection,
	type ScreenplayDraft,
	type ScreenplayElement,
	type ScreenplayElementState,
	type ScreenplayProposal,
	type ScreenplayScopeContent,
	type ScreenplayScopeProjection
} from './authoring-contracts.js';

export interface ProjectStore {
	getHead(): Promise<AuthoringProjectRevision>;
	getRevision(revision: number): Promise<AuthoringProjectRevision | undefined>;
}

export interface HistoryStore {
	listChangeSets(): Promise<readonly AuthoringChangeSet[]>;
	exportAcceptedHistory(): Promise<AcceptedHistoryBundle>;
}

export interface DraftProposalStore {
	getDraft(draftId: string): Promise<ScreenplayDraft | undefined>;
	saveDraft(draft: ScreenplayDraft): Promise<void>;
	getProposal(proposalId: string): Promise<ScreenplayProposal | undefined>;
	saveProposal(proposal: ScreenplayProposal): Promise<void>;
}

export interface AuthoringUnitOfWork extends ProjectStore, HistoryStore, DraftProposalStore {
	commitAccepted(
		mutation: AcceptedMutation,
		proposalUpdate?: ScreenplayProposal
	): Promise<StoreCommitResult>;
}

export interface ProjectStoreResolver {
	forProject(projectId: string): Promise<AuthoringUnitOfWork | undefined>;
}

export type StoreCommitResult =
	| { ok: true }
	| {
			ok: false;
			code: 'STALE_PROJECT_HEAD' | 'DUPLICATE_CHANGE_SET' | 'INVALID_ACCEPTED_MUTATION';
			message: string;
	  };

export type ProjectionResult =
	| { ok: true; projection: ProjectProjection }
	| { ok: false; code: 'INVALID_OPERATION' | 'PRECONDITION_FAILED'; message: string };

const codePointCompare = (left: string, right: string) =>
	left < right ? -1 : left > right ? 1 : 0;

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
				.sort(([left], [right]) => codePointCompare(left, right))
				.map(([key, child]) => [key, canonical(child)])
		);
	return value;
}

export function observableEqual(left: unknown, right: unknown): boolean {
	return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export function scopeKey(scope: DocumentVersionScope): string {
	return `${scope.documentId}\u0000${scope.versionId}`;
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

function validateScopeContent(content: ScreenplayScopeContent): string | undefined {
	if (!validateUnique(content.order)) return 'screenplay order contains duplicate element IDs';
	const elementIds = content.elements.map((element) => element.id);
	if (!validateUnique(elementIds)) return 'screenplay contains duplicate element states';
	if (
		content.order.length !== elementIds.length ||
		content.order.some((elementId) => !elementIds.includes(elementId))
	)
		return 'screenplay order and element states must contain the same IDs';
	const sorted = [...elementIds].sort(codePointCompare);
	if (!observableEqual(elementIds, sorted))
		return 'screenplay element states must use code-point ID order';
	return undefined;
}

export function validateProjectProjection(projection: ProjectProjection): string[] {
	const messages: string[] = [];
	const documentIds = projection.documents.map((document) => document.id);
	const versionIds = projection.versions.map((version) => version.id);
	if (!validateUnique(documentIds)) messages.push('project contains duplicate document IDs');
	if (!validateUnique(versionIds)) messages.push('project contains duplicate version IDs');
	const keys = projection.screenplays.map((screenplay) => scopeKey(screenplay));
	if (!validateUnique(keys)) messages.push('project contains duplicate screenplay scopes');
	for (const screenplay of projection.screenplays) {
		if (!documentIds.includes(screenplay.documentId))
			messages.push('screenplay references unknown document');
		if (!versionIds.includes(screenplay.versionId))
			messages.push('screenplay references unknown version');
		const message = validateScopeContent(screenplay);
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
	screenplay: ScreenplayScopeProjection,
	content: ScreenplayScopeContent
): void {
	const message = validateScopeContent(content);
	if (message) throw new Error(message);
	screenplay.order = [...content.order];
	screenplay.elements = content.elements.map((element) => ({ ...element }));
}

function applyOperation(projection: ProjectProjection, operation: AuthoringOperation): void {
	const screenplay = findScreenplayScope(projection, operation.scope);
	if (!screenplay) throw new Error(`Unknown screenplay scope: ${scopeKey(operation.scope)}`);
	if (operation.type === 'RestoreScreenplayDocument') {
		replaceContent(screenplay, operation.content);
		return;
	}
	const elementId =
		operation.type === 'InsertScreenplayElement' ? operation.element.id : operation.elementId;
	const index = stateIndex(screenplay, elementId);
	const state = index >= 0 ? screenplay.elements[index] : undefined;
	if (operation.type === 'InsertScreenplayElement') {
		if (state?.status === 'present')
			throw new Error(`Element is already present: ${operation.element.id}`);
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
	screenplay.elements.sort((left, right) => codePointCompare(left.id, right.id));
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

export function projectAuthoringOperations(
	current: ProjectProjection,
	operations: readonly AuthoringOperation[],
	preconditions: readonly AuthoringPrecondition[]
): ProjectionResult {
	for (const precondition of preconditions) {
		const message = checkPrecondition(current, precondition);
		if (message) return { ok: false, code: 'PRECONDITION_FAILED', message };
	}
	const projection = cloneJson(current);
	const affectedScopes = new Set<string>();
	try {
		for (const operation of operations) {
			applyOperation(projection, operation);
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

function materializeRevision(input: unknown): AuthoringProjectRevision | undefined {
	const revision = materializeAndValidate<AuthoringProjectRevision>(
		AuthoringProjectRevisionSchema,
		input
	);
	if (!revision || validateProjectProjection(revision.projection).length) return undefined;
	if (revision.projectId !== revision.projection.projectId) return undefined;
	return revision;
}

function materializeMutation(input: unknown): AcceptedMutation | undefined {
	const mutation = materializeAndValidate<AcceptedMutation>(AcceptedMutationSchema, input);
	if (!mutation || validateProjectProjection(mutation.revision.projection).length) return undefined;
	return mutation;
}

export class InMemoryAuthoringProjectStore implements AuthoringUnitOfWork {
	private initialRevision: AuthoringProjectRevision;
	private revisions: AuthoringProjectRevision[];
	private changeSets: AuthoringChangeSet[] = [];
	private drafts = new Map<string, ScreenplayDraft>();
	private proposals = new Map<string, ScreenplayProposal>();

	constructor(initialRevisionInput: unknown) {
		const initialRevision = materializeRevision(initialRevisionInput);
		if (!initialRevision || initialRevision.changeSetId !== null)
			throw new Error('A valid initial authoring revision is required');
		this.initialRevision = deepFreeze(initialRevision);
		this.revisions = [this.initialRevision];
	}

	static async fromAcceptedHistory(input: unknown): Promise<InMemoryAuthoringProjectStore> {
		const history = materializeAndValidate<AcceptedHistoryBundle>(
			AcceptedHistoryBundleSchema,
			input
		);
		if (!history) throw new Error('Accepted history is malformed');
		const store = new InMemoryAuthoringProjectStore(history.initialRevision);
		await store.rehydrateAcceptedHistory(history.accepted);
		return store;
	}

	private async rehydrateAcceptedHistory(acceptedInput: unknown): Promise<void> {
		const accepted = materializeJson<AcceptedMutation[]>(acceptedInput);
		if (!accepted || !Array.isArray(accepted)) throw new Error('Accepted history is malformed');
		for (const input of accepted) {
			const mutation = materializeMutation(input);
			if (!mutation) throw new Error('Accepted history contains a malformed record');
			const current = this.revisions[this.revisions.length - 1];
			const { changeSet, revision } = mutation;
			if (
				changeSet.projectId !== current.projectId ||
				changeSet.baseRevision !== current.number ||
				changeSet.resultingRevision !== current.number + 1 ||
				revision.projectId !== current.projectId ||
				revision.number !== changeSet.resultingRevision ||
				revision.changeSetId !== changeSet.id ||
				revision.timestamp !== changeSet.timestamp ||
				this.changeSets.some((candidate) => candidate.id === changeSet.id)
			)
				throw new Error('Accepted history sequence is invalid');
			const projected = projectAuthoringOperations(
				current.projection,
				changeSet.operations,
				changeSet.preconditions
			);
			if (!projected.ok || !observableEqual(projected.projection, revision.projection))
				throw new Error('Accepted history projection does not match its record');
			this.changeSets.push(deepFreeze(changeSet));
			this.revisions.push(deepFreeze(revision));
		}
	}

	async getHead(): Promise<AuthoringProjectRevision> {
		return this.revisions[this.revisions.length - 1];
	}

	async getRevision(revision: number): Promise<AuthoringProjectRevision | undefined> {
		return this.revisions.find((candidate) => candidate.number === revision);
	}

	async listChangeSets(): Promise<readonly AuthoringChangeSet[]> {
		return [...this.changeSets];
	}

	async exportAcceptedHistory(): Promise<AcceptedHistoryBundle> {
		return cloneJson({
			initialRevision: this.initialRevision,
			accepted: this.changeSets.map((changeSet, index) => ({
				changeSet,
				revision: this.revisions[index + 1]
			}))
		});
	}

	async getDraft(draftId: string): Promise<ScreenplayDraft | undefined> {
		return this.drafts.get(draftId);
	}

	async saveDraft(input: ScreenplayDraft): Promise<void> {
		const draft = materializeAndValidate<ScreenplayDraft>(ScreenplayDraftSchema, input);
		if (!draft || draft.projectId !== this.initialRevision.projectId)
			throw new Error('Draft is malformed or belongs to another project');
		this.drafts.set(draft.id, deepFreeze(draft));
	}

	async getProposal(proposalId: string): Promise<ScreenplayProposal | undefined> {
		return this.proposals.get(proposalId);
	}

	async saveProposal(input: ScreenplayProposal): Promise<void> {
		const proposal = materializeAndValidate<ScreenplayProposal>(ScreenplayProposalSchema, input);
		if (!proposal || proposal.projectId !== this.initialRevision.projectId)
			throw new Error('Proposal is malformed or belongs to another project');
		this.proposals.set(proposal.id, deepFreeze(proposal));
	}

	async commitAccepted(
		mutationInput: AcceptedMutation,
		proposalUpdateInput?: ScreenplayProposal
	): Promise<StoreCommitResult> {
		const mutation = materializeMutation(mutationInput);
		const proposalUpdate = proposalUpdateInput
			? materializeAndValidate<ScreenplayProposal>(ScreenplayProposalSchema, proposalUpdateInput)
			: undefined;
		if (!mutation || (proposalUpdateInput && !proposalUpdate))
			return {
				ok: false,
				code: 'INVALID_ACCEPTED_MUTATION',
				message: 'Accepted mutation is malformed'
			};
		const current = this.revisions[this.revisions.length - 1];
		if (mutation.changeSet.baseRevision !== current.number)
			return {
				ok: false,
				code: 'STALE_PROJECT_HEAD',
				message: `Project head changed from ${mutation.changeSet.baseRevision} to ${current.number}`
			};
		if (this.changeSets.some((changeSet) => changeSet.id === mutation.changeSet.id))
			return {
				ok: false,
				code: 'DUPLICATE_CHANGE_SET',
				message: `ChangeSet already exists: ${mutation.changeSet.id}`
			};
		const projected = projectAuthoringOperations(
			current.projection,
			mutation.changeSet.operations,
			mutation.changeSet.preconditions
		);
		if (
			!projected.ok ||
			mutation.changeSet.projectId !== current.projectId ||
			mutation.changeSet.resultingRevision !== current.number + 1 ||
			mutation.revision.projectId !== current.projectId ||
			mutation.revision.number !== mutation.changeSet.resultingRevision ||
			mutation.revision.changeSetId !== mutation.changeSet.id ||
			mutation.revision.timestamp !== mutation.changeSet.timestamp ||
			!observableEqual(projected.projection, mutation.revision.projection)
		)
			return {
				ok: false,
				code: 'INVALID_ACCEPTED_MUTATION',
				message: projected.ok ? 'Revision does not match the complete ChangeSet' : projected.message
			};

		this.changeSets.push(deepFreeze(mutation.changeSet));
		this.revisions.push(deepFreeze(mutation.revision));
		if (proposalUpdate) this.proposals.set(proposalUpdate.id, deepFreeze(proposalUpdate));
		return { ok: true };
	}
}

export class InMemoryProjectStoreResolver implements ProjectStoreResolver {
	private readonly stores = new Map<string, InMemoryAuthoringProjectStore>();

	constructor(initialRevisions: readonly unknown[]) {
		for (const input of initialRevisions) {
			const revision = materializeRevision(input);
			if (!revision) throw new Error('Project resolver received an invalid initial revision');
			if (this.stores.has(revision.projectId))
				throw new Error(`Duplicate project: ${revision.projectId}`);
			this.stores.set(revision.projectId, new InMemoryAuthoringProjectStore(revision));
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
