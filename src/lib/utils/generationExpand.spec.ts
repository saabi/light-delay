import { describe, expect, it } from 'vitest';
import {
	collapseNextLevel,
	expandNextLevel,
	type GenerationExpandState
} from './generationExpand';

function state(overrides: Partial<GenerationExpandState> = {}): GenerationExpandState {
	return {
		groupIds: ['g1', 'g2'],
		cardIds: ['c1', 'c2'],
		openGroupIds: new Set(['g1']),
		expandedCardIds: new Set(),
		...overrides
	};
}

describe('generation expand/collapse by level', () => {
	it('expands remaining groups first, leaving cards collapsed', () => {
		const next = expandNextLevel(state());
		expect([...next.openGroupIds]).toEqual(['g1', 'g2']);
		expect(next.expandedCardIds.size).toBe(0);
	});

	it('expands cards only after every group is open', () => {
		const next = expandNextLevel(
			state({
				openGroupIds: new Set(['g1', 'g2'])
			})
		);
		expect([...next.openGroupIds]).toEqual(['g1', 'g2']);
		expect([...next.expandedCardIds]).toEqual(['c1', 'c2']);
	});

	it('collapses expanded cards before closing groups', () => {
		const next = collapseNextLevel(
			state({
				openGroupIds: new Set(['g1', 'g2']),
				expandedCardIds: new Set(['c1'])
			})
		);
		expect([...next.openGroupIds]).toEqual(['g1', 'g2']);
		expect(next.expandedCardIds.size).toBe(0);
	});

	it('collapses groups only when no cards are expanded', () => {
		const next = collapseNextLevel(
			state({
				openGroupIds: new Set(['g1', 'g2']),
				expandedCardIds: new Set()
			})
		);
		expect(next.openGroupIds.size).toBe(0);
		expect(next.expandedCardIds.size).toBe(0);
	});
});
