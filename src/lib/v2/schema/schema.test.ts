import { describe, expect, it } from 'vitest';
import { EntityContinuityRelationSchema, EntitySchema, EpistemicEventSchema, HistoryContextSchema, StoryEventSchema, annotationsOf, check } from './schema';

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
			temporal: { relations: [{ relation: 'after', eventId: 'event:zao-records-warning' }] },
			stateTransitionIds: [],
			createsArtifactIds: []
		})).toBe(true);
	});

	it('allows experienced order to run backward through world time', () => {
		expect(check(StoryEventSchema, {
			id: 'event:traveler-arrives-1955',
			worldContextId: 'context:actual',
			participantIds: ['entity:traveler'],
			temporal: {
				worldTime: { kind: 'absolute', value: '1955-11-12T06:00:00' },
				historyContextId: 'history:primary'
			},
			stateTransitionIds: [],
			createsArtifactIds: []
		})).toBe(true);
		expect(check(EntityContinuityRelationSchema, {
			entityId: 'entity:traveler',
			fromEventId: 'event:traveler-leaves-1985',
			toEventId: 'event:traveler-arrives-1955'
		})).toBe(true);
	});

	it('allows knowledge from a prior history to follow entity continuity', () => {
		expect(check(EpistemicEventSchema, {
			id: 'epistemic:traveler-remembers-original-1985',
			subjectEntityId: 'entity:traveler',
			informationRef: 'information:original-family-history',
			operation: 'remember',
			experiencedAtEventId: 'event:traveler-returns-altered-1985',
			sourceHistoryContextId: 'history:original'
		})).toBe(true);
	});

	it('supports optional branching history without imposing it on linear stories', () => {
		expect(check(HistoryContextSchema, {
			id: 'history:altered-1985',
			label: 'Altered history',
			parentHistoryContextId: 'history:original',
			divergesAtEventId: 'event:past-intervention',
			temporalModel: 'branching'
		})).toBe(true);
	});

	it('retains plain JSON annotations after serialization', () => {
		const roundTrip = JSON.parse(JSON.stringify(EntitySchema));
		expect(roundTrip['x-domain']).toBe('core:entity');
		expect(roundTrip.properties.roleIds.items['x-ref-kind']).toBe('core:role');
	});
});
