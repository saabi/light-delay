import { Type, type Static } from '@sinclair/typebox';

const text = Type.String({ minLength: 1, pattern: '\\S' });
const id = Type.String({ minLength: 1, pattern: '^[a-z][a-z0-9-]*:[^\\s]+$' });
const revision = Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER - 1 });
const timestamp = Type.String({
	pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$'
});
const object = <T extends Parameters<typeof Type.Object>[0]>(properties: T) =>
	Type.Object(properties, { additionalProperties: false });

export const AuthoringPrincipalSchema = object({
	kind: Type.Union([
		Type.Literal('human'),
		Type.Literal('importer'),
		Type.Literal('agent'),
		Type.Literal('system')
	]),
	id
});

export const TrustedExecutionContextSchema = object({
	principal: AuthoringPrincipalSchema,
	requestId: id
});

export const ScreenplayElementKindSchema = Type.Union([
	Type.Literal('scene-heading'),
	Type.Literal('action'),
	Type.Literal('character'),
	Type.Literal('dialogue')
]);

export const ScreenplayElementSchema = object({
	id,
	kind: ScreenplayElementKindSchema,
	text
});

export const RemovedScreenplayElementSchema = object({
	id,
	kind: ScreenplayElementKindSchema,
	status: Type.Literal('removed')
});

export const PresentScreenplayElementSchema = object({
	id,
	kind: ScreenplayElementKindSchema,
	status: Type.Literal('present'),
	text
});

export const ScreenplayElementStateSchema = Type.Union([
	PresentScreenplayElementSchema,
	RemovedScreenplayElementSchema
]);

export const DocumentVersionScopeSchema = object({
	documentId: id,
	versionId: id
});

export const ScreenplayScopeContentSchema = object({
	order: Type.Array(id),
	elements: Type.Array(ScreenplayElementStateSchema)
});

export const ScreenplayScopeProjectionSchema = object({
	documentId: id,
	versionId: id,
	documentVersion: revision,
	order: Type.Array(id),
	elements: Type.Array(ScreenplayElementStateSchema)
});

export const ProjectProjectionSchema = object({
	schemaVersion: Type.Literal(1),
	projectId: id,
	name: text,
	documents: Type.Array(object({ id, title: text })),
	versions: Type.Array(object({ id, label: text })),
	screenplays: Type.Array(ScreenplayScopeProjectionSchema)
});

const InsertScreenplayElementSchema = object({
	type: Type.Literal('InsertScreenplayElement'),
	scope: DocumentVersionScopeSchema,
	element: ScreenplayElementSchema,
	afterElementId: Type.Union([id, Type.Null()])
});

const UpdateScreenplayElementTextSchema = object({
	type: Type.Literal('UpdateScreenplayElementText'),
	scope: DocumentVersionScopeSchema,
	elementId: id,
	text
});

const RemoveScreenplayElementSchema = object({
	type: Type.Literal('RemoveScreenplayElement'),
	scope: DocumentVersionScopeSchema,
	elementId: id
});

const MoveScreenplayElementSchema = object({
	type: Type.Literal('MoveScreenplayElement'),
	scope: DocumentVersionScopeSchema,
	elementId: id,
	afterElementId: Type.Union([id, Type.Null()])
});

const RestoreScreenplayDocumentSchema = object({
	type: Type.Literal('RestoreScreenplayDocument'),
	scope: DocumentVersionScopeSchema,
	targetRevision: revision,
	content: ScreenplayScopeContentSchema
});

export const AuthoringOperationSchema = Type.Union([
	InsertScreenplayElementSchema,
	UpdateScreenplayElementTextSchema,
	RemoveScreenplayElementSchema,
	MoveScreenplayElementSchema,
	RestoreScreenplayDocumentSchema
]);

export const AuthoringPreconditionSchema = object({
	type: Type.Literal('DocumentVersionEquals'),
	scope: DocumentVersionScopeSchema,
	expectedDocumentVersion: revision
});

export const ProposalSourceSchema = object({
	kind: Type.Literal('deterministic-draft-diff'),
	id: Type.Literal('proposer:deterministic-draft-diff-v1'),
	principal: AuthoringPrincipalSchema,
	draftId: id
});

export const ChangeSetProvenanceSchema = Type.Union([
	object({
		kind: Type.Literal('proposal-acceptance'),
		proposalId: id,
		draftId: id,
		source: ProposalSourceSchema
	}),
	object({
		kind: Type.Literal('scoped-restore'),
		targetRevision: revision,
		scope: DocumentVersionScopeSchema
	})
]);

export const AuthoringChangeSetSchema = object({
	schemaVersion: Type.Literal(1),
	id,
	projectId: id,
	baseRevision: revision,
	resultingRevision: revision,
	principal: AuthoringPrincipalSchema,
	requestId: id,
	timestamp,
	intent: text,
	operations: Type.Array(AuthoringOperationSchema),
	preconditions: Type.Array(AuthoringPreconditionSchema),
	provenance: ChangeSetProvenanceSchema
});

export const AuthoringProjectRevisionSchema = object({
	schemaVersion: Type.Literal(1),
	projectId: id,
	number: revision,
	changeSetId: Type.Union([id, Type.Null()]),
	timestamp,
	projection: ProjectProjectionSchema
});

const draftBase = {
	schemaVersion: Type.Literal(1),
	id,
	projectId: id,
	scope: DocumentVersionScopeSchema,
	owner: AuthoringPrincipalSchema,
	baseProjectRevision: revision,
	baseDocumentVersion: revision,
	elements: Type.Array(ScreenplayElementSchema),
	createdAt: timestamp,
	updatedAt: timestamp
};

export const ScreenplayDraftSchema = object({ ...draftBase, status: Type.Literal('saved') });

const proposalBase = {
	schemaVersion: Type.Literal(1),
	id,
	projectId: id,
	scope: DocumentVersionScopeSchema,
	baseProjectRevision: revision,
	baseDocumentVersion: revision,
	requestedBy: AuthoringPrincipalSchema,
	createdAt: timestamp,
	source: ProposalSourceSchema,
	operations: Type.Array(AuthoringOperationSchema, { minItems: 1 }),
	preconditions: Type.Array(AuthoringPreconditionSchema, { minItems: 1 })
};

export const ScreenplayProposalSchema = Type.Union([
	object({ ...proposalBase, status: Type.Literal('pending') }),
	object({
		...proposalBase,
		status: Type.Literal('rejected'),
		resolvedAt: timestamp,
		resolvedBy: AuthoringPrincipalSchema,
		reason: Type.Optional(text)
	}),
	object({
		...proposalBase,
		status: Type.Literal('accepted'),
		resolvedAt: timestamp,
		resolvedBy: AuthoringPrincipalSchema,
		changeSetId: id
	})
]);

export const AcceptedMutationSchema = object({
	changeSet: AuthoringChangeSetSchema,
	revision: AuthoringProjectRevisionSchema
});

export const AcceptedHistoryBundleSchema = object({
	initialRevision: AuthoringProjectRevisionSchema,
	accepted: Type.Array(AcceptedMutationSchema)
});

export const SaveDraftCommandSchema = object({
	type: Type.Literal('SaveDraft'),
	projectId: id,
	draftId: Type.Optional(id),
	scope: DocumentVersionScopeSchema,
	baseProjectRevision: revision,
	baseDocumentVersion: revision,
	elements: Type.Array(ScreenplayElementSchema)
});

export const CreateProposalCommandSchema = object({
	type: Type.Literal('CreateProposal'),
	projectId: id,
	draftId: id
});

export const RejectProposalCommandSchema = object({
	type: Type.Literal('RejectProposal'),
	projectId: id,
	proposalId: id,
	reason: Type.Optional(text)
});

export const AcceptProposalCommandSchema = object({
	type: Type.Literal('AcceptProposal'),
	projectId: id,
	proposalId: id
});

export const RestoreScreenplayCommandSchema = object({
	type: Type.Literal('RestoreScreenplay'),
	projectId: id,
	scope: DocumentVersionScopeSchema,
	targetRevision: revision,
	expectedDocumentVersion: revision,
	intent: Type.Optional(text)
});

export const AuthoringCommandSchema = Type.Union([
	SaveDraftCommandSchema,
	CreateProposalCommandSchema,
	RejectProposalCommandSchema,
	AcceptProposalCommandSchema,
	RestoreScreenplayCommandSchema
]);

export type AuthoringPrincipal = Static<typeof AuthoringPrincipalSchema>;
export type TrustedExecutionContext = Static<typeof TrustedExecutionContextSchema>;
export type ScreenplayElementKind = Static<typeof ScreenplayElementKindSchema>;
export type ScreenplayElement = Static<typeof ScreenplayElementSchema>;
export type ScreenplayElementState = Static<typeof ScreenplayElementStateSchema>;
export type DocumentVersionScope = Static<typeof DocumentVersionScopeSchema>;
export type ScreenplayScopeContent = Static<typeof ScreenplayScopeContentSchema>;
export type ScreenplayScopeProjection = Static<typeof ScreenplayScopeProjectionSchema>;
export type ProjectProjection = Static<typeof ProjectProjectionSchema>;
export type AuthoringOperation = Static<typeof AuthoringOperationSchema>;
export type AuthoringPrecondition = Static<typeof AuthoringPreconditionSchema>;
export type ProposalSource = Static<typeof ProposalSourceSchema>;
export type ChangeSetProvenance = Static<typeof ChangeSetProvenanceSchema>;
export type AuthoringChangeSet = Static<typeof AuthoringChangeSetSchema>;
export type AuthoringProjectRevision = Static<typeof AuthoringProjectRevisionSchema>;
export type ScreenplayDraft = Static<typeof ScreenplayDraftSchema>;
export type ScreenplayProposal = Static<typeof ScreenplayProposalSchema>;
export type AcceptedMutation = Static<typeof AcceptedMutationSchema>;
export type AcceptedHistoryBundle = Static<typeof AcceptedHistoryBundleSchema>;
export type SaveDraftCommand = Static<typeof SaveDraftCommandSchema>;
export type CreateProposalCommand = Static<typeof CreateProposalCommandSchema>;
export type RejectProposalCommand = Static<typeof RejectProposalCommandSchema>;
export type AcceptProposalCommand = Static<typeof AcceptProposalCommandSchema>;
export type RestoreScreenplayCommand = Static<typeof RestoreScreenplayCommandSchema>;
export type AuthoringCommand = Static<typeof AuthoringCommandSchema>;
