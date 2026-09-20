import { Type, type Static, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export { Type, Value, type Static, type TSchema };

export const X_DOMAIN = 'x-domain' as const;
export const X_REF_KIND = 'x-ref-kind' as const;
export const X_EDITOR = 'x-editor' as const;
export const X_SECTION = 'x-section' as const;
export const X_INFERENCE_STATUS = 'x-inference-status' as const;

export type NamespacedId = `${string}:${string}`;
export type InferenceStatus = 'explicit' | 'confirmed' | 'inferred' | 'unknown';

export function id(kind: NamespacedId) {
	return Type.String({ [X_DOMAIN]: kind, pattern: '^[^:]+:.+$' });
}

export function ref(kind: NamespacedId, options: { editor?: string; description?: string } = {}) {
	return Type.String({
		[X_REF_KIND]: kind,
		[X_EDITOR]: options.editor ?? 'reference-picker',
		...(options.description ? { description: options.description } : {})
	});
}

export const InferenceStatusSchema = Type.Union(
	['explicit', 'confirmed', 'inferred', 'unknown'].map((value) => Type.Literal(value))
);

export const EntitySchema = Type.Object({
	id: id('core:entity'),
	label: Type.String(),
	roleIds: Type.Array(ref('core:role')),
	capabilityIds: Type.Array(ref('core:capability')),
	components: Type.Record(Type.String(), Type.Unknown()),
	inferenceStatus: Type.Optional(InferenceStatusSchema)
}, { [X_DOMAIN]: 'core:entity' });

export type Entity = Static<typeof EntitySchema>;

export const WorldContextSchema = Type.Object({
	id: id('core:world-context'),
	parentContextId: Type.Optional(ref('core:world-context')),
	kind: Type.String(),
	subjectEntityId: Type.Optional(ref('core:entity')),
	profileRefs: Type.Array(ref('core:profile'))
}, { [X_DOMAIN]: 'core:world-context' });

export const TimeCoordinateSchema = Type.Union([
	Type.Object({ kind: Type.Literal('absolute'), value: Type.String() }),
	Type.Object({ kind: Type.Literal('ordinal'), order: Type.Number() }),
	Type.Object({
		kind: Type.Literal('interval'),
		start: Type.Optional(Type.String()),
		end: Type.Optional(Type.String())
	}),
	Type.Object({ kind: Type.Literal('unknown') })
], { [X_DOMAIN]: 'core:time-coordinate' });

export const TemporalRelationSchema = Type.Object({
	relation: Type.Union([
		Type.Literal('before'),
		Type.Literal('after'),
		Type.Literal('during'),
		Type.Literal('simultaneous-with')
	]),
	eventId: ref('core:story-event'),
	offset: Type.Optional(Type.Number())
}, { [X_DOMAIN]: 'core:temporal-relation' });

/**
 * World/calendar placement is intentionally independent from causal order,
 * participant-experienced continuity, and narrative presentation order.
 */
export const TemporalPlacementSchema = Type.Object({
	worldTime: Type.Optional(TimeCoordinateSchema),
	historyContextId: Type.Optional(ref('core:history-context')),
	relations: Type.Optional(Type.Array(TemporalRelationSchema))
}, { [X_DOMAIN]: 'core:temporal-placement' });

export const TemporalModelSchema = Type.Union([
	Type.Literal('linear'),
	Type.Literal('fixed-loop'),
	Type.Literal('mutable-history'),
	Type.Literal('branching'),
	Type.Literal('multiple-timelines'),
	Type.Literal('custom')
]);

export const HistoryContextSchema = Type.Object({
	id: id('core:history-context'),
	label: Type.String(),
	parentHistoryContextId: Type.Optional(ref('core:history-context')),
	divergesAtEventId: Type.Optional(ref('core:story-event')),
	temporalModel: TemporalModelSchema
}, { [X_DOMAIN]: 'core:history-context' });

export const CausalRelationSchema = Type.Object({
	fromEventId: ref('core:story-event'),
	toEventId: ref('core:story-event'),
	kind: Type.Optional(Type.String())
}, { [X_DOMAIN]: 'core:causal-relation' });

export const EntityContinuityRelationSchema = Type.Object({
	entityId: ref('core:entity'),
	fromEventId: ref('core:story-event'),
	toEventId: ref('core:story-event'),
	transitionKind: Type.Optional(Type.String())
}, { [X_DOMAIN]: 'core:entity-continuity-relation' });

export const EpistemicOperationSchema = Type.Union([
	Type.Literal('learn'),
	Type.Literal('observe'),
	Type.Literal('infer'),
	Type.Literal('believe'),
	Type.Literal('suspect'),
	Type.Literal('remember'),
	Type.Literal('doubt'),
	Type.Literal('reject'),
	Type.Literal('forget'),
	Type.Literal('revise')
]);

export const EpistemicEventSchema = Type.Object({
	id: id('core:epistemic-event'),
	subjectEntityId: ref('core:entity'),
	informationRef: ref('core:information'),
	operation: EpistemicOperationSchema,
	experiencedAtEventId: ref('core:story-event'),
	sourceEventId: Type.Optional(ref('core:story-event')),
	sourceHistoryContextId: Type.Optional(ref('core:history-context')),
	confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 }))
}, { [X_DOMAIN]: 'core:epistemic-event' });

export const StoryEventSchema = Type.Object({
	id: id('core:story-event'),
	worldContextId: ref('core:world-context'),
	participantIds: Type.Array(ref('core:entity')),
	locationRef: Type.Optional(ref('core:spatial')),
	temporal: TemporalPlacementSchema,
	stateTransitionIds: Type.Array(ref('core:state-transition')),
	createsArtifactIds: Type.Array(ref('core:artifact'))
}, { [X_DOMAIN]: 'core:story-event' });

export type StoryEvent = Static<typeof StoryEventSchema>;

export interface ContractAnnotations {
	domain?: string;
	refKind?: string;
	editor?: string;
	section?: string;
}

export function annotationsOf(schema: TSchema): ContractAnnotations {
	const raw = schema as Record<string, unknown>;
	return {
		...(typeof raw[X_DOMAIN] === 'string' ? { domain: raw[X_DOMAIN] } : {}),
		...(typeof raw[X_REF_KIND] === 'string' ? { refKind: raw[X_REF_KIND] } : {}),
		...(typeof raw[X_EDITOR] === 'string' ? { editor: raw[X_EDITOR] } : {}),
		...(typeof raw[X_SECTION] === 'string' ? { section: raw[X_SECTION] } : {})
	};
}

export function check(schema: TSchema, value: unknown): boolean {
	return Value.Check(schema, value);
}
