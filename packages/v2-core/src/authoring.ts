import {
	AuthoringCommandSchema,
	TrustedExecutionContextSchema,
	type AcceptedMutation,
	type AuthoringChangeSet,
	type AuthoringCommand,
	type AuthoringOperation,
	type AuthoringPrincipal,
	type AuthoringProjectRevision,
	type AuthoringProjectState,
	type DocumentVersionScope,
	type ProjectProjection,
	type ScreenplayDraft,
	type ScreenplayElement,
	type ScreenplayProposal,
	type TrustedExecutionContext
} from './authoring-contracts.js';
import {
	findScreenplayScope,
	checkpointsForProjection,
	materializeAndValidate,
	projectAuthoringOperations,
	resolveElementState,
	resolveScreenplayElements,
	screenplayContent,
	touchedScopesForOperations,
	type ProjectStoreResolver
} from './authoring-store.js';

export type AuthoringErrorCode =
	| 'INVALID_COMMAND'
	| 'INVALID_TRUSTED_CONTEXT'
	| 'PROJECT_NOT_FOUND'
	| 'REVISION_NOT_FOUND'
	| 'DOCUMENT_VERSION_NOT_FOUND'
	| 'DRAFT_NOT_FOUND'
	| 'PROPOSAL_NOT_FOUND'
	| 'PROPOSAL_ALREADY_RESOLVED'
	| 'NO_CHANGES'
	| 'DRAFT_OWNER_MISMATCH'
	| 'INVALID_DRAFT'
	| 'CONFLICT'
	| 'STORE_REJECTED';

export type AuthoringError = {
	code: AuthoringErrorCode;
	message: string;
};

export type AuthoringCommandResult =
	| { ok: true; kind: 'draft-saved'; draft: ScreenplayDraft }
	| { ok: true; kind: 'proposal-created'; proposal: ScreenplayProposal }
	| { ok: true; kind: 'proposal-rejected'; proposal: ScreenplayProposal }
	| {
			ok: true;
			kind: 'proposal-accepted' | 'screenplay-restored';
			changeSet: AuthoringChangeSet;
			revision: AuthoringProjectRevision;
	  }
	| { ok: false; error: AuthoringError };

export interface ScreenplayView {
	projectId: string;
	projectName: string;
	documentId: string;
	documentTitle: string;
	versionId: string;
	versionLabel: string;
	projectRevision: number;
	documentVersion: number;
	elements: readonly ScreenplayElement[];
}

export interface AuthoringApplicationOptions {
	now?: () => string;
	idFactory?: (kind: 'draft' | 'proposal' | 'changeset') => string;
}

const deterministicSourcePrincipal: AuthoringPrincipal = {
	kind: 'system',
	id: 'system:deterministic-draft-diff'
};

const samePrincipal = (left: AuthoringPrincipal, right: AuthoringPrincipal) =>
	left.kind === right.kind && left.id === right.id;

function failure(code: AuthoringErrorCode, message: string): AuthoringCommandResult {
	return { ok: false, error: { code, message } };
}

function uniqueElementIds(elements: readonly ScreenplayElement[]): boolean {
	return new Set(elements.map((element) => element.id)).size === elements.length;
}

function insertAfter(order: string[], elementId: string, afterElementId: string | null): void {
	const previousIndex = order.indexOf(elementId);
	if (previousIndex >= 0) order.splice(previousIndex, 1);
	if (afterElementId === null) order.unshift(elementId);
	else order.splice(order.indexOf(afterElementId) + 1, 0, elementId);
}

function deriveDraftOperations(
	base: ProjectProjection,
	scope: DocumentVersionScope,
	draftElements: readonly ScreenplayElement[]
): AuthoringOperation[] | AuthoringError {
	if (!uniqueElementIds(draftElements))
		return { code: 'INVALID_DRAFT', message: 'Draft contains duplicate screenplay element IDs' };
	const screenplay = findScreenplayScope(base, scope);
	const baseElements = resolveScreenplayElements(base, scope);
	if (!screenplay || !baseElements)
		return { code: 'DOCUMENT_VERSION_NOT_FOUND', message: 'Screenplay version was not found' };
	for (const element of draftElements) {
		const definition = base.screenplayElements.find((candidate) => candidate.id === element.id);
		if (definition && definition.documentId !== scope.documentId)
			return {
				code: 'INVALID_DRAFT',
				message: `Element identity belongs to another document: ${element.id}`
			};
		if (definition && definition.kind !== element.kind)
			return {
				code: 'INVALID_DRAFT',
				message: `Element kind cannot change for stable identity ${element.id}`
			};
	}

	const targetIds = draftElements.map((element) => element.id);
	const targetSet = new Set(targetIds);
	const operations: AuthoringOperation[] = [];
	const workingOrder = baseElements.map((element) => element.id);
	for (const element of baseElements) {
		if (!targetSet.has(element.id)) {
			operations.push({ type: 'RemoveScreenplayElement', scope, elementId: element.id });
			workingOrder.splice(workingOrder.indexOf(element.id), 1);
		}
	}

	for (let index = 0; index < draftElements.length; index += 1) {
		const element = draftElements[index];
		const state = resolveElementState(base, scope, element.id);
		if (state !== 'present') {
			const afterElementId = index === 0 ? null : targetIds[index - 1];
			operations.push({ type: 'InsertScreenplayElement', scope, element, afterElementId });
			insertAfter(workingOrder, element.id, afterElementId);
			continue;
		}
		const original = baseElements.find((candidate) => candidate.id === element.id)!;
		if (original.text !== element.text)
			operations.push({
				type: 'UpdateScreenplayElementText',
				scope,
				elementId: element.id,
				text: element.text
			});
	}

	for (let index = 0; index < targetIds.length; index += 1) {
		const elementId = targetIds[index];
		if (workingOrder[index] === elementId) continue;
		const afterElementId = index === 0 ? null : targetIds[index - 1];
		operations.push({ type: 'MoveScreenplayElement', scope, elementId, afterElementId });
		insertAfter(workingOrder, elementId, afterElementId);
	}
	return operations;
}

function isError(value: AuthoringOperation[] | AuthoringError): value is AuthoringError {
	return !Array.isArray(value);
}

export class AuthoringApplication {
	private readonly now: () => string;
	private readonly idFactory: (kind: 'draft' | 'proposal' | 'changeset') => string;

	constructor(
		private readonly stores: ProjectStoreResolver,
		options: AuthoringApplicationOptions = {}
	) {
		this.now = options.now ?? (() => new Date().toISOString());
		this.idFactory = options.idFactory ?? ((kind) => `${kind}:${globalThis.crypto.randomUUID()}`);
	}

	async getProjectHead(projectId: string): Promise<AuthoringProjectState | undefined> {
		return (await this.stores.forProject(projectId))?.getHead();
	}

	async getRevision(
		projectId: string,
		revision: number
	): Promise<AuthoringProjectState | undefined> {
		return (await this.stores.forProject(projectId))?.getRevision(revision);
	}

	async listHistory(projectId: string): Promise<readonly AuthoringChangeSet[]> {
		return (await this.stores.forProject(projectId))?.listChangeSets() ?? [];
	}

	async getDraft(projectId: string, draftId: string): Promise<ScreenplayDraft | undefined> {
		return (await this.stores.forProject(projectId))?.getDraft(draftId);
	}

	async getProposal(
		projectId: string,
		proposalId: string
	): Promise<ScreenplayProposal | undefined> {
		return (await this.stores.forProject(projectId))?.getProposal(proposalId);
	}

	async getScreenplayView(
		projectId: string,
		scope: DocumentVersionScope,
		revision?: number
	): Promise<ScreenplayView | undefined> {
		const store = await this.stores.forProject(projectId);
		if (!store) return undefined;
		const record =
			revision === undefined ? await store.getHead() : await store.getRevision(revision);
		if (!record) return undefined;
		const screenplay = findScreenplayScope(record.projection, scope);
		const elements = resolveScreenplayElements(record.projection, scope);
		const document = record.projection.documents.find(
			(candidate) => candidate.id === scope.documentId
		);
		const version = record.projection.versions.find(
			(candidate) => candidate.id === scope.versionId
		);
		if (!screenplay || !elements || !document || !version) return undefined;
		return {
			projectId,
			projectName: record.projection.name,
			documentId: document.id,
			documentTitle: document.title,
			versionId: version.id,
			versionLabel: version.label,
			projectRevision: record.number,
			documentVersion: screenplay.documentVersion,
			elements
		};
	}

	async handle(commandInput: unknown, contextInput: unknown): Promise<AuthoringCommandResult> {
		const command = materializeAndValidate<AuthoringCommand>(AuthoringCommandSchema, commandInput);
		if (!command)
			return failure(
				'INVALID_COMMAND',
				'Malformed command; principals, timestamps, accepted IDs, and provenance are trusted runtime data'
			);
		const context = materializeAndValidate<TrustedExecutionContext>(
			TrustedExecutionContextSchema,
			contextInput
		);
		if (!context)
			return failure('INVALID_TRUSTED_CONTEXT', 'Trusted execution context is malformed');
		const store = await this.stores.forProject(command.projectId);
		if (!store) return failure('PROJECT_NOT_FOUND', `Project was not found: ${command.projectId}`);

		if (command.type === 'SaveDraft') {
			if (!uniqueElementIds(command.elements))
				return failure('INVALID_DRAFT', 'Draft contains duplicate screenplay element IDs');
			const existing = command.draftId ? await store.getDraft(command.draftId) : undefined;
			if (command.draftId && !existing)
				return failure('DRAFT_NOT_FOUND', `Draft was not found: ${command.draftId}`);
			if (existing && !samePrincipal(existing.owner, context.principal))
				return failure('DRAFT_OWNER_MISMATCH', 'Draft belongs to another principal');
			if (
				existing &&
				(existing.projectId !== command.projectId ||
					existing.scope.documentId !== command.scope.documentId ||
					existing.scope.versionId !== command.scope.versionId)
			)
				return failure('INVALID_DRAFT', 'Draft scope cannot change after creation');
			if (
				existing &&
				(existing.baseProjectRevision !== command.baseProjectRevision ||
					existing.baseDocumentVersion !== command.baseDocumentVersion)
			)
				return failure(
					'INVALID_DRAFT',
					'An existing Draft keeps the semantic base where it was started; rebase requires an explicit future workflow'
				);
			const baseProjectRevision = existing?.baseProjectRevision ?? command.baseProjectRevision;
			const baseDocumentVersion = existing?.baseDocumentVersion ?? command.baseDocumentVersion;
			const baseRevision = await store.getRevision(baseProjectRevision);
			const baseScope = baseRevision && findScreenplayScope(baseRevision.projection, command.scope);
			if (!baseRevision || !baseScope || baseScope.documentVersion !== baseDocumentVersion)
				return failure(
					'DOCUMENT_VERSION_NOT_FOUND',
					'The Draft base does not identify a supported screenplay version'
				);
			const timestamp = this.now();
			const draft: ScreenplayDraft = {
				schemaVersion: 1,
				id: existing?.id ?? this.idFactory('draft'),
				projectId: command.projectId,
				scope: command.scope,
				owner: context.principal,
				baseProjectRevision,
				baseDocumentVersion,
				elements: command.elements,
				createdAt: existing?.createdAt ?? timestamp,
				updatedAt: timestamp,
				status: 'saved'
			};
			const saved = await store.saveDraft(draft);
			if (!saved.ok) return failure('INVALID_DRAFT', saved.message);
			return { ok: true, kind: 'draft-saved', draft: (await store.getDraft(draft.id))! };
		}

		if (command.type === 'CreateProposal') {
			const draft = await store.getDraft(command.draftId);
			if (!draft) return failure('DRAFT_NOT_FOUND', `Draft was not found: ${command.draftId}`);
			if (!samePrincipal(draft.owner, context.principal))
				return failure('DRAFT_OWNER_MISMATCH', 'Draft belongs to another principal');
			const baseRevision = await store.getRevision(draft.baseProjectRevision);
			if (!baseRevision)
				return failure(
					'REVISION_NOT_FOUND',
					`Draft base revision was not found: ${draft.baseProjectRevision}`
				);
			const operations = deriveDraftOperations(
				baseRevision.projection,
				draft.scope,
				draft.elements
			);
			if (isError(operations)) return { ok: false, error: operations };
			if (!operations.length)
				return failure('NO_CHANGES', 'Draft matches the authoritative screenplay');
			const proposal: ScreenplayProposal = {
				schemaVersion: 1,
				id: this.idFactory('proposal'),
				projectId: draft.projectId,
				scope: draft.scope,
				baseProjectRevision: draft.baseProjectRevision,
				baseDocumentVersion: draft.baseDocumentVersion,
				proposedBy: context.principal,
				createdAt: this.now(),
				source: {
					kind: 'draft',
					ref: { kind: 'draft', id: draft.id },
					contentAuthors: [draft.owner],
					generator: {
						id: 'proposer:deterministic-draft-diff',
						version: 1,
						principal: deterministicSourcePrincipal
					}
				},
				operations,
				preconditions: [
					{
						type: 'DocumentVersionEquals',
						scope: draft.scope,
						expectedDocumentVersion: draft.baseDocumentVersion
					}
				],
				status: 'pending'
			};
			const created = await store.createProposal(proposal);
			if (!created.ok) return failure('STORE_REJECTED', created.message);
			return { ok: true, kind: 'proposal-created', proposal };
		}

		if (command.type === 'RejectProposal') {
			const proposal = await store.getProposal(command.proposalId);
			if (!proposal)
				return failure('PROPOSAL_NOT_FOUND', `Proposal was not found: ${command.proposalId}`);
			if (proposal.status !== 'pending')
				return failure('PROPOSAL_ALREADY_RESOLVED', 'Proposal is already resolved');
			const rejected: ScreenplayProposal = {
				...proposal,
				status: 'rejected',
				resolvedAt: this.now(),
				resolvedBy: context.principal,
				...(command.reason ? { reason: command.reason } : {})
			};
			const transitioned = await store.transitionProposal({
				proposalId: proposal.id,
				expectedStatus: 'pending',
				next: rejected
			});
			if (!transitioned.ok) return failure('PROPOSAL_ALREADY_RESOLVED', transitioned.message);
			return { ok: true, kind: 'proposal-rejected', proposal: rejected };
		}

		if (command.type === 'AcceptProposal') {
			const proposal = await store.getProposal(command.proposalId);
			if (!proposal)
				return failure('PROPOSAL_NOT_FOUND', `Proposal was not found: ${command.proposalId}`);
			if (proposal.status !== 'pending')
				return failure('PROPOSAL_ALREADY_RESOLVED', 'Proposal is already resolved');
			const head = await store.getHead();
			const projected = projectAuthoringOperations(
				head.projection,
				proposal.operations,
				proposal.preconditions,
				head.number + 1
			);
			if (!projected.ok) return failure('CONFLICT', projected.message);
			const timestamp = this.now();
			const changeSet: AuthoringChangeSet = {
				schemaVersion: 1,
				id: this.idFactory('changeset'),
				projectId: proposal.projectId,
				baseRevision: head.number,
				resultingRevision: head.number + 1,
				principal: context.principal,
				requestId: context.requestId,
				timestamp,
				intent: `Accept screenplay proposal ${proposal.id}`,
				operations: proposal.operations,
				preconditions: proposal.preconditions,
				provenance: {
					kind: 'proposal-acceptance',
					proposalId: proposal.id,
					baseProjectRevision: proposal.baseProjectRevision,
					proposedBy: proposal.proposedBy,
					contentAuthors: proposal.source.contentAuthors,
					source: proposal.source
				}
			};
			const revision: AuthoringProjectRevision = {
				schemaVersion: 1,
				projectId: proposal.projectId,
				number: changeSet.resultingRevision,
				changeSetId: changeSet.id,
				timestamp,
				touchedScopes: touchedScopesForOperations(changeSet.operations)
			};
			const acceptedProposal: ScreenplayProposal = {
				...proposal,
				status: 'accepted',
				resolvedAt: timestamp,
				resolvedBy: context.principal,
				changeSetId: changeSet.id
			};
			const accepted: AcceptedMutation = {
				changeSet,
				revision,
				checkpoints: checkpointsForProjection(
					projected.projection,
					revision.number,
					changeSet.operations
				)
			};
			const stored = await store.commitAccepted(accepted, {
				proposalId: proposal.id,
				expectedStatus: 'pending',
				next: acceptedProposal
			});
			if (!stored.ok)
				return failure(
					stored.code === 'PROPOSAL_ALREADY_RESOLVED'
						? 'PROPOSAL_ALREADY_RESOLVED'
						: 'STORE_REJECTED',
					stored.message
				);
			return { ok: true, kind: 'proposal-accepted', changeSet, revision };
		}

		const target = await store.getRevision(command.targetRevision);
		if (!target)
			return failure(
				'REVISION_NOT_FOUND',
				`Target revision was not found: ${command.targetRevision}`
			);
		const targetScope = findScreenplayScope(target.projection, command.scope);
		if (!targetScope)
			return failure(
				'DOCUMENT_VERSION_NOT_FOUND',
				'Target revision does not contain the screenplay scope'
			);
		const head = await store.getHead();
		const operation: AuthoringOperation = {
			type: 'RestoreScreenplayDocument',
			scope: command.scope,
			targetRevision: command.targetRevision,
			targetDocumentVersion: targetScope.documentVersion,
			content: screenplayContent(targetScope)
		};
		const preconditions = [
			{
				type: 'DocumentVersionEquals' as const,
				scope: command.scope,
				expectedDocumentVersion: command.expectedDocumentVersion
			}
		];
		const projected = projectAuthoringOperations(
			head.projection,
			[operation],
			preconditions,
			head.number + 1
		);
		if (!projected.ok) return failure('CONFLICT', projected.message);
		const timestamp = this.now();
		const changeSet: AuthoringChangeSet = {
			schemaVersion: 1,
			id: this.idFactory('changeset'),
			projectId: command.projectId,
			baseRevision: head.number,
			resultingRevision: head.number + 1,
			principal: context.principal,
			requestId: context.requestId,
			timestamp,
			intent: command.intent ?? `Restore screenplay to project revision ${command.targetRevision}`,
			operations: [operation],
			preconditions,
			provenance: {
				kind: 'scoped-restore',
				targetRevision: command.targetRevision,
				targetDocumentVersion: targetScope.documentVersion,
				scope: command.scope
			}
		};
		const revision: AuthoringProjectRevision = {
			schemaVersion: 1,
			projectId: command.projectId,
			number: changeSet.resultingRevision,
			changeSetId: changeSet.id,
			timestamp,
			touchedScopes: touchedScopesForOperations(changeSet.operations)
		};
		const stored = await store.commitAccepted({
			changeSet,
			revision,
			checkpoints: checkpointsForProjection(
				projected.projection,
				revision.number,
				changeSet.operations
			)
		});
		if (!stored.ok) return failure('STORE_REJECTED', stored.message);
		return { ok: true, kind: 'screenplay-restored', changeSet, revision };
	}
}
