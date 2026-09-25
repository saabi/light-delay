import { Pool, type PoolClient } from 'pg';
import {
	AcceptedMutationSchema,
	AuthoringChangeSetSchema,
	AuthoringProjectStateSchema,
	ScreenplayDraftSchema,
	ScreenplayProposalSchema,
	ScreenplayScopeContentSchema,
	type AcceptedHistoryBundle,
	type AcceptedMutation,
	type AuthoringChangeSet,
	type AuthoringProjectState,
	type ProjectProjection,
	type ScreenplayDraft,
	type ScreenplayProposal,
	type ScreenplayScopeContent
} from './authoring-contracts.js';
import type { ScreenplayView } from './authoring.js';
import {
	InMemoryAuthoringProjectStore,
	compareCanonicalIds,
	materializeAndValidate,
	materializeJson,
	observableEqual,
	projectAuthoringOperations,
	scopeKey,
	touchedScopesForOperations,
	validateAcceptedMutation,
	validateProjectProjection,
	type AuthoringUnitOfWork,
	type DraftWriteResult,
	type ProjectStoreResolver,
	type ProposalTransition,
	type ProposalWriteResult,
	type StoreCommitResult
} from './authoring-store.js';

type Db = Pool | PoolClient;
const invalid = (message: string): StoreCommitResult => ({
	ok: false,
	code: 'INVALID_ACCEPTED_MUTATION',
	message
});
const resolved = (): ProposalWriteResult => ({
	ok: false,
	code: 'PROPOSAL_ALREADY_RESOLVED',
	message: 'Proposal is already resolved'
});

function readRecord<T>(schema: Parameters<typeof materializeAndValidate>[0], value: unknown): T {
	const record = materializeAndValidate<T>(schema, value);
	if (!record) throw new Error('Stored authoring record is malformed');
	return record;
}

function proposalBase(proposal: ScreenplayProposal): unknown {
	const { status: _status, ...rest } = proposal;
	const record = rest as Record<string, unknown>;
	delete record.resolvedAt;
	delete record.resolvedBy;
	delete record.reason;
	delete record.changeSetId;
	return record;
}

async function inTransaction<T>(
	pool: Pool,
	action: (client: PoolClient) => Promise<T>
): Promise<T> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await action(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

async function readState(
	db: Db,
	projectId: string,
	requestedRevision?: number
): Promise<AuthoringProjectState | undefined> {
	const projects = await db.query<{
		initial_revision: unknown;
		head_number: string;
		history_contract_version: number;
	}>(
		'SELECT initial_revision, head_number, history_contract_version FROM authoring_projects WHERE project_id = $1',
		[projectId]
	);
	if (!projects.rowCount) return undefined;
	if (projects.rows[0].history_contract_version !== 1)
		throw new Error(
			`Unsupported accepted history contract version: ${projects.rows[0].history_contract_version}`
		);
	const initial = readRecord<AuthoringProjectState>(
		AuthoringProjectStateSchema,
		projects.rows[0].initial_revision
	);
	const head = Number(projects.rows[0].head_number);
	const number = requestedRevision ?? head;
	if (!Number.isSafeInteger(number) || number < 0 || number > head) return undefined;
	if (number === 0) return initial;
	const revisionRows = await db.query<{ record: unknown }>(
		'SELECT record FROM authoring_revisions WHERE project_id = $1 AND number = $2',
		[projectId, number]
	);
	if (!revisionRows.rowCount) throw new Error(`Missing project revision ${number}`);
	const revision = revisionRows.rows[0].record as Omit<AuthoringProjectState, 'projection'>;
	const elements = await db.query<{
		element_id: string;
		document_id: string;
		kind: string;
		created_in_revision: string;
	}>(
		`SELECT element_id, document_id, kind, created_in_revision FROM authoring_elements
		 WHERE project_id = $1 AND created_in_revision <= $2`,
		[projectId, number]
	);
	const definitions = elements.rows
		.map((row) => ({
			id: row.element_id,
			documentId: row.document_id,
			kind: row.kind as ProjectProjection['screenplayElements'][number]['kind'],
			createdInRevision: Number(row.created_in_revision)
		}))
		.sort((a, b) => compareCanonicalIds(a.id, b.id));
	const base = initial.projection;
	let screenplays: ProjectProjection['screenplays'];
	if (requestedRevision === undefined || number === head) {
		const rows = await db.query<{
			document_id: string;
			version_id: string;
			document_version: string;
			content: ScreenplayScopeContent;
		}>(
			'SELECT document_id, version_id, document_version, content FROM authoring_scopes WHERE project_id = $1',
			[projectId]
		);
		const byScope = new Map(
			rows.rows.map((row) => [
				scopeKey({ documentId: row.document_id, versionId: row.version_id }),
				row
			])
		);
		screenplays = base.screenplays.map((scope) => {
			const row = byScope.get(scopeKey(scope));
			if (!row) throw new Error('Missing current screenplay scope');
			return {
				documentId: scope.documentId,
				versionId: scope.versionId,
				documentVersion: Number(row.document_version),
				...row.content
			};
		});
	} else {
		const rows = await db.query<{
			document_id: string;
			version_id: string;
			document_version: string;
			content: ScreenplayScopeContent;
		}>(
			`SELECT DISTINCT ON (document_id, version_id) document_id, version_id, document_version, content
			 FROM authoring_checkpoints WHERE project_id = $1 AND revision_number <= $2
			 ORDER BY document_id, version_id, revision_number DESC`,
			[projectId, number]
		);
		const byScope = new Map(
			rows.rows.map((row) => [
				scopeKey({ documentId: row.document_id, versionId: row.version_id }),
				row
			])
		);
		screenplays = base.screenplays.map((scope) => {
			const row = byScope.get(scopeKey(scope));
			return row
				? {
						documentId: scope.documentId,
						versionId: scope.versionId,
						documentVersion: Number(row.document_version),
						...row.content
					}
				: scope;
		});
	}
	const projection: ProjectProjection = { ...base, screenplayElements: definitions, screenplays };
	const state = readRecord<AuthoringProjectState>(AuthoringProjectStateSchema, {
		...revision,
		projection
	});
	const errors = validateProjectProjection(state.projection);
	if (errors.length) throw new Error(`Stored projection is invalid: ${errors.join('; ')}`);
	return state;
}

export class PostgresAuthoringProjectStore implements AuthoringUnitOfWork {
	constructor(
		private readonly pool: Pool,
		readonly projectId: string
	) {}

	private async consistentState(revision?: number): Promise<AuthoringProjectState | undefined> {
		return inTransaction(this.pool, async (client) => {
			await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
			return readState(client, this.projectId, revision);
		});
	}

	async getHead(): Promise<AuthoringProjectState> {
		const state = await this.consistentState();
		if (!state) throw new Error(`Project was not found: ${this.projectId}`);
		return state;
	}

	async getCurrentScreenplayView(scope: {
		documentId: string;
		versionId: string;
	}): Promise<ScreenplayView | undefined> {
		return inTransaction(this.pool, async (client) => {
			await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
			const rows = await client.query<{
				project_name: string;
				head_number: string;
				history_contract_version: number;
				document_title: string;
				version_label: string;
				document_version: string;
				content: unknown;
			}>(
				`SELECT p.name AS project_name, p.head_number, p.history_contract_version, d.title AS document_title,
				 v.label AS version_label, s.document_version, s.content
				 FROM authoring_scopes s
				 JOIN authoring_projects p ON p.project_id = s.project_id
				 JOIN authoring_documents d ON (d.project_id = s.project_id AND d.document_id = s.document_id)
				 JOIN authoring_versions v ON (v.project_id = s.project_id AND v.version_id = s.version_id)
				 WHERE s.project_id = $1 AND s.document_id = $2 AND s.version_id = $3`,
				[this.projectId, scope.documentId, scope.versionId]
			);
			if (!rows.rowCount) return undefined;
			const row = rows.rows[0];
			if (row.history_contract_version !== 1)
				throw new Error(
					`Unsupported accepted history contract version: ${row.history_contract_version}`
				);
			const content = readRecord<ScreenplayScopeContent>(ScreenplayScopeContentSchema, row.content);
			const byId = new Map(content.elements.map((element) => [element.id, element]));
			if (
				byId.size !== content.elements.length ||
				content.order.length !== byId.size ||
				new Set(content.order).size !== byId.size ||
				content.order.some((id) => !byId.has(id))
			)
				throw new Error('Stored screenplay order is malformed');
			const definitions = await client.query<{
				element_id: string;
				document_id: string;
				kind: string;
			}>(
				`SELECT element_id, document_id, kind FROM authoring_elements
				 WHERE project_id = $1 AND element_id = ANY($2::text[])`,
				[this.projectId, [...byId.keys()]]
			);
			if (
				definitions.rows.length !== byId.size ||
				definitions.rows.some(
					(definition) =>
						definition.document_id !== scope.documentId ||
						byId.get(definition.element_id)?.kind !== definition.kind
				)
			)
				throw new Error('Stored screenplay element identity is malformed');
			const elements = content.order.flatMap((id) => {
				const element = byId.get(id)!;
				return element.status === 'present'
					? [{ id: element.id, kind: element.kind, text: element.text }]
					: [];
			});
			return {
				projectId: this.projectId,
				projectName: row.project_name,
				documentId: scope.documentId,
				documentTitle: row.document_title,
				versionId: scope.versionId,
				versionLabel: row.version_label,
				projectRevision: Number(row.head_number),
				documentVersion: Number(row.document_version),
				elements
			};
		});
	}

	async getRevision(revision: number): Promise<AuthoringProjectState | undefined> {
		return this.consistentState(revision);
	}

	async listChangeSets(): Promise<readonly AuthoringChangeSet[]> {
		const rows = await this.pool.query<{ record: unknown }>(
			'SELECT record FROM authoring_change_sets WHERE project_id = $1 ORDER BY revision_number',
			[this.projectId]
		);
		return rows.rows.map((row) =>
			readRecord<AuthoringChangeSet>(AuthoringChangeSetSchema, row.record)
		);
	}

	async exportAcceptedHistory(): Promise<AcceptedHistoryBundle> {
		return inTransaction(this.pool, async (client) => {
			await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
			const initial = await readState(client, this.projectId, 0);
			if (!initial) throw new Error(`Project was not found: ${this.projectId}`);
			const rows = await client.query<{ change_set: unknown; revision: unknown }>(
				`SELECT c.record AS change_set, r.record AS revision FROM authoring_change_sets c
				 JOIN authoring_revisions r ON (r.project_id = c.project_id AND r.number = c.revision_number)
				 WHERE c.project_id = $1 ORDER BY c.revision_number`,
				[this.projectId]
			);
			const checkpoints = await client.query<{
				revision_number: string;
				document_id: string;
				version_id: string;
				document_version: string;
				content: ScreenplayScopeContent;
			}>(
				`SELECT revision_number, document_id, version_id, document_version, content
				 FROM authoring_checkpoints WHERE project_id = $1 ORDER BY revision_number, document_id, version_id`,
				[this.projectId]
			);
			const byRevision = new Map<number, AcceptedMutation['checkpoints']>();
			for (const row of checkpoints.rows) {
				const number = Number(row.revision_number);
				const current = byRevision.get(number) ?? [];
				byRevision.set(number, [
					...current,
					{
						schemaVersion: 1,
						projectId: this.projectId,
						projectRevision: number,
						scope: { documentId: row.document_id, versionId: row.version_id },
						documentVersion: Number(row.document_version),
						content: row.content
					}
				]);
			}
			const accepted = rows.rows.map((row) => {
				const changeSet = row.change_set as AuthoringChangeSet;
				if (changeSet?.schemaVersion !== 1)
					throw new Error(
						`Unsupported ChangeSet schema version: ${String(changeSet?.schemaVersion)}`
					);
				return readRecord<AcceptedMutation>(AcceptedMutationSchema, {
					changeSet,
					revision: row.revision,
					checkpoints: byRevision.get(changeSet.resultingRevision) ?? []
				});
			});
			const bundle: AcceptedHistoryBundle = {
				historyContractVersion: 1,
				initialRevision: {
					schemaVersion: initial.schemaVersion,
					projectId: initial.projectId,
					number: 0,
					changeSetId: null,
					timestamp: initial.timestamp,
					touchedScopes: []
				},
				initialProjection: initial.projection,
				accepted
			};
			await InMemoryAuthoringProjectStore.fromAcceptedHistory(bundle);
			return bundle;
		});
	}

	async getDraft(draftId: string): Promise<ScreenplayDraft | undefined> {
		const rows = await this.pool.query<{ record: unknown }>(
			'SELECT record FROM authoring_drafts WHERE project_id = $1 AND draft_id = $2',
			[this.projectId, draftId]
		);
		return rows.rowCount
			? readRecord<ScreenplayDraft>(ScreenplayDraftSchema, rows.rows[0].record)
			: undefined;
	}

	async listDrafts(): Promise<readonly ScreenplayDraft[]> {
		const rows = await this.pool.query<{ record: unknown }>(
			'SELECT record FROM authoring_drafts WHERE project_id = $1 ORDER BY draft_id',
			[this.projectId]
		);
		return rows.rows.map((row) => readRecord<ScreenplayDraft>(ScreenplayDraftSchema, row.record));
	}

	async saveDraft(input: ScreenplayDraft): Promise<DraftWriteResult> {
		const draft = materializeAndValidate<ScreenplayDraft>(ScreenplayDraftSchema, input);
		if (!draft || draft.projectId !== this.projectId)
			return { ok: false, code: 'DRAFT_ID_CONFLICT', message: 'Draft is malformed' };
		const result = await this.pool.query(
			`INSERT INTO authoring_drafts (project_id, draft_id, document_id, version_id, owner_kind, owner_id,
			 base_project_revision, base_document_version, record)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
			 ON CONFLICT (project_id, draft_id) DO UPDATE SET record = EXCLUDED.record
			 WHERE authoring_drafts.document_id = EXCLUDED.document_id
			 AND authoring_drafts.version_id = EXCLUDED.version_id
			 AND authoring_drafts.owner_kind = EXCLUDED.owner_kind
			 AND authoring_drafts.owner_id = EXCLUDED.owner_id
			 AND authoring_drafts.base_project_revision = EXCLUDED.base_project_revision
			 AND authoring_drafts.base_document_version = EXCLUDED.base_document_version`,
			[
				this.projectId,
				draft.id,
				draft.scope.documentId,
				draft.scope.versionId,
				draft.owner.kind,
				draft.owner.id,
				draft.baseProjectRevision,
				draft.baseDocumentVersion,
				draft
			]
		);
		if (result.rowCount) return { ok: true };
		const previous = await this.getDraft(draft.id);
		const sameIdentity =
			previous &&
			previous.scope.documentId === draft.scope.documentId &&
			previous.scope.versionId === draft.scope.versionId &&
			previous.owner.kind === draft.owner.kind &&
			previous.owner.id === draft.owner.id;
		return sameIdentity
			? {
					ok: false,
					code: 'DRAFT_BASE_CHANGED',
					message: 'An existing Draft keeps its original semantic base'
				}
			: { ok: false, code: 'DRAFT_ID_CONFLICT', message: 'Draft identity already exists' };
	}

	async getProposal(proposalId: string): Promise<ScreenplayProposal | undefined> {
		const rows = await this.pool.query<{ record: unknown }>(
			'SELECT record FROM authoring_proposals WHERE project_id = $1 AND proposal_id = $2',
			[this.projectId, proposalId]
		);
		return rows.rowCount
			? readRecord<ScreenplayProposal>(ScreenplayProposalSchema, rows.rows[0].record)
			: undefined;
	}

	async listProposals(): Promise<readonly ScreenplayProposal[]> {
		const rows = await this.pool.query<{ record: unknown }>(
			'SELECT record FROM authoring_proposals WHERE project_id = $1 ORDER BY proposal_id',
			[this.projectId]
		);
		return rows.rows.map((row) =>
			readRecord<ScreenplayProposal>(ScreenplayProposalSchema, row.record)
		);
	}

	async createProposal(input: ScreenplayProposal): Promise<ProposalWriteResult> {
		const proposal = materializeAndValidate<ScreenplayProposal>(ScreenplayProposalSchema, input);
		if (!proposal || proposal.projectId !== this.projectId || proposal.status !== 'pending')
			return { ok: false, code: 'DUPLICATE_PROPOSAL', message: 'Pending Proposal is malformed' };
		const result = await this.pool.query(
			`INSERT INTO authoring_proposals (project_id, proposal_id, document_id, version_id, status, record)
			 VALUES ($1,$2,$3,$4,'pending',$5) ON CONFLICT (project_id, proposal_id) DO NOTHING`,
			[this.projectId, proposal.id, proposal.scope.documentId, proposal.scope.versionId, proposal]
		);
		return result.rowCount
			? { ok: true }
			: {
					ok: false,
					code: 'DUPLICATE_PROPOSAL',
					message: `Proposal already exists: ${proposal.id}`
				};
	}

	async transitionProposal(transition: ProposalTransition): Promise<ProposalWriteResult> {
		const next = materializeAndValidate<ScreenplayProposal>(
			ScreenplayProposalSchema,
			transition.next
		);
		if (
			!next ||
			next.status !== 'rejected' ||
			next.id !== transition.proposalId ||
			next.projectId !== this.projectId
		)
			return resolved();
		return inTransaction(this.pool, async (client) => {
			const rows = await client.query<{ record: unknown }>(
				`SELECT record FROM authoring_proposals WHERE project_id = $1 AND proposal_id = $2
				 FOR UPDATE`,
				[this.projectId, transition.proposalId]
			);
			if (!rows.rowCount) return resolved();
			const current = readRecord<ScreenplayProposal>(ScreenplayProposalSchema, rows.rows[0].record);
			if (
				current.status !== 'pending' ||
				!observableEqual(proposalBase(current), proposalBase(next))
			)
				return resolved();
			await client.query(
				`UPDATE authoring_proposals SET status = 'rejected', record = $3
				 WHERE project_id = $1 AND proposal_id = $2 AND status = 'pending'`,
				[this.projectId, transition.proposalId, next]
			);
			return { ok: true };
		});
	}

	async commitAccepted(
		input: AcceptedMutation,
		transition?: ProposalTransition
	): Promise<StoreCommitResult> {
		const mutation = materializeAndValidate<AcceptedMutation>(AcceptedMutationSchema, input);
		const next =
			transition &&
			materializeAndValidate<ScreenplayProposal>(ScreenplayProposalSchema, transition.next);
		const acceptedNext = next && next.status === 'accepted' ? next : undefined;
		if (
			!mutation ||
			mutation.changeSet.projectId !== this.projectId ||
			(transition &&
				(!acceptedNext ||
					acceptedNext.projectId !== this.projectId ||
					acceptedNext.id !== transition.proposalId ||
					acceptedNext.changeSetId !== mutation.changeSet.id))
		)
			return invalid('Accepted mutation is malformed');
		return inTransaction(this.pool, async (client) => {
			if (transition) {
				const rows = await client.query<{ status: string; record: unknown }>(
					'SELECT status, record FROM authoring_proposals WHERE project_id = $1 AND proposal_id = $2 FOR UPDATE',
					[this.projectId, transition.proposalId]
				);
				if (!rows.rowCount || rows.rows[0].status !== 'pending')
					return {
						ok: false,
						code: 'PROPOSAL_ALREADY_RESOLVED',
						message: 'Proposal is already resolved'
					};
				const currentProposal = readRecord<ScreenplayProposal>(
					ScreenplayProposalSchema,
					rows.rows[0].record
				);
				if (
					!acceptedNext ||
					!observableEqual(proposalBase(currentProposal), proposalBase(acceptedNext)) ||
					!observableEqual(acceptedNext.resolvedBy, mutation.changeSet.principal) ||
					!observableEqual(currentProposal.operations, mutation.changeSet.operations) ||
					!observableEqual(currentProposal.preconditions, mutation.changeSet.preconditions)
				)
					return invalid('Accepted operations do not match the pending Proposal');
			}
			const scopes = touchedScopesForOperations(mutation.changeSet.operations);
			for (const scope of scopes) {
				const row = await client.query(
					`SELECT document_version FROM authoring_scopes
					 WHERE project_id = $1 AND document_id = $2 AND version_id = $3 FOR UPDATE`,
					[this.projectId, scope.documentId, scope.versionId]
				);
				if (!row.rowCount) return invalid(`Unknown screenplay scope: ${scopeKey(scope)}`);
			}
			await client.query(
				'SELECT head_number FROM authoring_projects WHERE project_id = $1 FOR UPDATE',
				[this.projectId]
			);
			const current = await readState(client, this.projectId);
			if (!current) return invalid('Project was not found');
			if (mutation.changeSet.baseRevision !== current.number)
				return {
					ok: false,
					code: 'STALE_PROJECT_HEAD',
					message: 'Project head advanced before commit'
				};
			const duplicate = await client.query(
				'SELECT 1 FROM authoring_change_sets WHERE project_id = $1 AND change_set_id = $2',
				[this.projectId, mutation.changeSet.id]
			);
			if (duplicate.rowCount)
				return { ok: false, code: 'DUPLICATE_CHANGE_SET', message: 'ChangeSet already exists' };
			for (const op of mutation.changeSet.operations) {
				if (op.type !== 'RestoreScreenplayDocument') continue;
				const historical = await readState(client, this.projectId, op.targetRevision);
				const target = historical?.projection.screenplays.find(
					(scope) => scopeKey(scope) === scopeKey(op.scope)
				);
				if (
					!target ||
					target.documentVersion !== op.targetDocumentVersion ||
					!observableEqual({ order: target.order, elements: target.elements }, op.content)
				)
					return invalid('Restore content does not match its historical target');
			}
			const projected = projectAuthoringOperations(
				current.projection,
				mutation.changeSet.operations,
				mutation.changeSet.preconditions,
				mutation.changeSet.resultingRevision,
				mutation.changeSet.schemaVersion
			);
			if (!projected.ok) return invalid(projected.message);
			const validation = validateAcceptedMutation(mutation, current, projected.projection);
			if (validation) return invalid(validation);
			await client.query(
				`INSERT INTO authoring_revisions (project_id, number, change_set_id, record)
				 VALUES ($1,$2,$3,$4)`,
				[this.projectId, mutation.revision.number, mutation.changeSet.id, mutation.revision]
			);
			await client.query(
				`INSERT INTO authoring_change_sets (project_id, change_set_id, revision_number, schema_version, record)
				 VALUES ($1,$2,$3,$4,$5)`,
				[
					this.projectId,
					mutation.changeSet.id,
					mutation.revision.number,
					mutation.changeSet.schemaVersion,
					mutation.changeSet
				]
			);
			const previous = new Set(current.projection.screenplayElements.map((element) => element.id));
			for (const element of projected.projection.screenplayElements) {
				if (previous.has(element.id)) continue;
				await client.query(
					`INSERT INTO authoring_elements (project_id, element_id, document_id, kind, created_in_revision)
					 VALUES ($1,$2,$3,$4,$5)`,
					[this.projectId, element.id, element.documentId, element.kind, element.createdInRevision]
				);
			}
			for (const checkpoint of mutation.checkpoints) {
				await client.query(
					`INSERT INTO authoring_checkpoints
					 (project_id, revision_number, document_id, version_id, document_version, content)
					 VALUES ($1,$2,$3,$4,$5,$6)`,
					[
						this.projectId,
						checkpoint.projectRevision,
						checkpoint.scope.documentId,
						checkpoint.scope.versionId,
						checkpoint.documentVersion,
						checkpoint.content
					]
				);
				await client.query(
					`UPDATE authoring_scopes SET document_version = $4, content = $5
					 WHERE project_id = $1 AND document_id = $2 AND version_id = $3`,
					[
						this.projectId,
						checkpoint.scope.documentId,
						checkpoint.scope.versionId,
						checkpoint.documentVersion,
						checkpoint.content
					]
				);
			}
			await client.query('UPDATE authoring_projects SET head_number = $2 WHERE project_id = $1', [
				this.projectId,
				mutation.revision.number
			]);
			if (transition) {
				const result = await client.query(
					`UPDATE authoring_proposals SET status = 'accepted', change_set_id = $3, record = $4
					 WHERE project_id = $1 AND proposal_id = $2 AND status = 'pending'`,
					[this.projectId, transition.proposalId, mutation.changeSet.id, next]
				);
				if (!result.rowCount) throw new Error('Proposal transition lost its lock');
			}
			return { ok: true };
		});
	}
}

export class PostgresProjectStoreResolver implements ProjectStoreResolver {
	constructor(readonly pool: Pool) {}
	async forProject(projectId: string): Promise<PostgresAuthoringProjectStore | undefined> {
		const rows = await this.pool.query('SELECT 1 FROM authoring_projects WHERE project_id = $1', [
			projectId
		]);
		return rows.rowCount ? new PostgresAuthoringProjectStore(this.pool, projectId) : undefined;
	}

	async seedProject(input: unknown): Promise<void> {
		const state = materializeAndValidate<AuthoringProjectState>(AuthoringProjectStateSchema, input);
		if (
			!state ||
			state.number !== 0 ||
			state.changeSetId !== null ||
			state.touchedScopes.length ||
			validateProjectProjection(state.projection).length
		)
			throw new Error('A valid initial authoring project state is required');
		await inTransaction(this.pool, async (client) => {
			const inserted = await client.query(
				`INSERT INTO authoring_projects (project_id, name, initial_revision)
				 VALUES ($1,$2,$3) ON CONFLICT (project_id) DO NOTHING`,
				[state.projectId, state.projection.name, state]
			);
			if (!inserted.rowCount) return;
			for (const document of state.projection.documents)
				await client.query(
					`INSERT INTO authoring_documents (project_id, document_id, kind, title)
					 VALUES ($1,$2,'screenplay',$3)`,
					[state.projectId, document.id, document.title]
				);
			for (const version of state.projection.versions)
				await client.query(
					'INSERT INTO authoring_versions (project_id, version_id, label) VALUES ($1,$2,$3)',
					[state.projectId, version.id, version.label]
				);
			for (const element of state.projection.screenplayElements)
				await client.query(
					`INSERT INTO authoring_elements (project_id, element_id, document_id, kind, created_in_revision)
					 VALUES ($1,$2,$3,$4,$5)`,
					[state.projectId, element.id, element.documentId, element.kind, element.createdInRevision]
				);
			for (const scope of state.projection.screenplays)
				await client.query(
					`INSERT INTO authoring_scopes (project_id, document_id, version_id, document_version, content)
					 VALUES ($1,$2,$3,$4,$5)`,
					[
						state.projectId,
						scope.documentId,
						scope.versionId,
						scope.documentVersion,
						{ order: scope.order, elements: scope.elements }
					]
				);
			await client.query(
				`INSERT INTO authoring_revisions (project_id, number, change_set_id, record)
				 VALUES ($1,0,NULL,$2)`,
				[
					state.projectId,
					{
						schemaVersion: state.schemaVersion,
						projectId: state.projectId,
						number: 0,
						changeSetId: null,
						timestamp: state.timestamp,
						touchedScopes: []
					}
				]
			);
		});
	}
}

export function createPostgresPool(connectionString: string): Pool {
	if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL authoring');
	const pool = new Pool({ connectionString });
	pool.on('error', () => {
		// pg removes failed idle clients from the pool. Active query errors still reach their callers.
		console.error('Studio PostgreSQL pool lost an idle connection');
	});
	return pool;
}
