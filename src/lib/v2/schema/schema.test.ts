import { describe, expect, it } from 'vitest';
import { EntitySchema, StoryEventSchema, annotationsOf, check } from './schema';

describe('v2 runtime contract proof', () => {
	it('keeps domain annotations introspectable', () => {
		expect(annotationsOf(EntitySchema).domain).toBe('core:entity');
	});

	it('validates a composable entity without exclusive class identity', () => {
		expect(check(EntitySchema, {
			id: 'entity:dragon',
			label: 'Dragon',
			roleIds: ['role:character', 'role:vehicle'],
			capabilityIds: ['capability:carrier', 'capability:rideable'],
			components: {}
		})).toBe(true);
	});

	it('represents relative story time independently from narrative order', () => {
		expect(check(StoryEventSchema, {
			id: 'event:crew-plays-zao-warning',
			worldContextId: 'context:actual',
			participantIds: ['entity:sorell'],
			temporal: { kind: 'relative', relation: 'after', eventId: 'event:zao-records-warning' },
			stateTransitionIds: [],
			createsArtifactIds: []
		})).toBe(true);
	});

	it('retains plain JSON annotations after serialization', () => {
		const roundTrip = JSON.parse(JSON.stringify(EntitySchema));
		expect(roundTrip['x-domain']).toBe('core:entity');
		expect(roundTrip.properties.roleIds.items['x-ref-kind']).toBe('core:role');
	});
});
