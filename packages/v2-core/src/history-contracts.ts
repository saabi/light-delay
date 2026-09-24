import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const text = Type.String({ minLength: 1, pattern: '\\S' });
const object = <T extends Parameters<typeof Type.Object>[0]>(properties: T) =>
	Type.Object(properties, { additionalProperties: false });
export const WorldValueSchema = Type.Union([Type.String(), Type.Number(), Type.Boolean()]);
export const PrincipalSchema = object({
	kind: Type.Union(['human', 'importer', 'agent', 'system'].map((value) => Type.Literal(value))),
	id: text
});
export const OccupancySchema = object({
	entityId: text,
	nodeId: text,
	blocksTraversal: Type.Boolean(),
	reason: text
});
export const SemanticOperationSchema = Type.Union([
	object({ type: Type.Literal('SetWorldState'), key: text, value: WorldValueSchema }),
	object({ type: Type.Literal('UnsetWorldState'), key: text }),
	object({
		type: Type.Literal('SetOccupancy'),
		entityId: text,
		occupancy: Type.Array(OccupancySchema)
	})
]);
export const PreconditionSchema = Type.Union([
	object({ type: Type.Literal('WorldStateEquals'), key: text, expected: WorldValueSchema }),
	object({ type: Type.Literal('WorldStateAbsent'), key: text }),
	object({
		type: Type.Literal('OccupancyEquals'),
		entityId: text,
		expected: Type.Array(OccupancySchema)
	})
]);
const revision = Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER - 1 });
export const CommitInputSchema = object({
	baseRevision: revision,
	intent: text,
	operations: Type.Array(SemanticOperationSchema, { minItems: 1 }),
	preconditions: Type.Optional(Type.Array(PreconditionSchema))
});
export const RestoreInputSchema = object({ baseRevision: revision, intent: Type.Optional(text) });
export type SemanticOperation = Static<typeof SemanticOperationSchema>;
export type Precondition = Static<typeof PreconditionSchema>;
export type CommitInput = Static<typeof CommitInputSchema>;
export type RestoreInput = Static<typeof RestoreInputSchema>;
export type PrincipalRef = Static<typeof PrincipalSchema>;

// Reject non-JSON values before validation; never normalize NaN/undefined with JSON.stringify.
export function isJsonData(value: unknown, ancestors = new Set<object>()): boolean {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
	if (typeof value === 'number') return Number.isFinite(value);
	if (!value || typeof value !== 'object' || ancestors.has(value)) return false;
	if (
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) !== Object.prototype &&
		Object.getPrototypeOf(value) !== null
	)
		return false;
	ancestors.add(value);
	const descriptors = Object.getOwnPropertyDescriptors(value);
	const valid = Reflect.ownKeys(value).every(
		(key) =>
			typeof key === 'string' &&
			'value' in descriptors[key] &&
			((key === 'length' && Array.isArray(value)) || isJsonData(descriptors[key].value, ancestors))
	);
	const dense = !Array.isArray(value) || Object.keys(value).length === value.length;
	ancestors.delete(value);
	return valid && dense;
}
export { Value };
