import { describe, expect, it } from 'vitest';
import {
	computeMargins,
	derivePanelRegions,
	selectGridForMemberCount,
	validateGridLayout
} from './visualStretch.ts';

describe('selectGridForMemberCount', () => {
	it('selects 2x2 with blank cell 4 for 3 members', () => {
		expect(selectGridForMemberCount(3)).toEqual({ rows: 2, cols: 2, blankCells: [4] });
	});

	it('selects full 2x2 with no blanks for 4 members', () => {
		expect(selectGridForMemberCount(4)).toEqual({ rows: 2, cols: 2, blankCells: [] });
	});

	it('selects 3x3 with blanks for 5 members', () => {
		expect(selectGridForMemberCount(5)).toEqual({
			rows: 3,
			cols: 3,
			blankCells: [6, 7, 8, 9]
		});
	});

	it('selects 3x3 with one blank for 8 members', () => {
		expect(selectGridForMemberCount(8)).toEqual({ rows: 3, cols: 3, blankCells: [9] });
	});

	it('selects full 3x3 for 9 members', () => {
		expect(selectGridForMemberCount(9)).toEqual({ rows: 3, cols: 3, blankCells: [] });
	});

	it('blocks 10+ by default', () => {
		expect(selectGridForMemberCount(10)).toEqual({ error: 'member_count_exceeds_default_ladder' });
	});

	it('allows 4x4 when flagged', () => {
		expect(selectGridForMemberCount(10, { allowFourByFour: true })).toEqual({
			rows: 4,
			cols: 4,
			blankCells: [11, 12, 13, 14, 15, 16]
		});
	});
});

describe('computeMargins and derivePanelRegions', () => {
	it('letterboxes 16:9 content inside a 3:2 sheet', () => {
		const margins = computeMargins({ width: 1536, height: 1024 }, '16:9');
		expect(margins.left).toBe(0);
		expect(margins.right).toBe(0);
		expect(margins.top).toBeGreaterThan(0);
		expect(margins.bottom).toBeGreaterThan(0);
	});

	it('derives three regions for 2x2 with blank cell 4', () => {
		const layout = { rows: 2, cols: 2, gutterFraction: 0.02, blankCells: [4], panelAspect: '16:9' };
		const margins = { top: 0, right: 0, bottom: 0, left: 0 };
		const regions = derivePanelRegions(layout, margins);
		expect(regions).toHaveLength(3);
		expect(regions.map((r) => r.cellIndex)).toEqual([1, 2, 3]);
		expect(regions[0].frameRegion.w).toBeGreaterThan(0);
		expect(regions[0].frameRegion.h).toBeGreaterThan(0);
	});
});

describe('validateGridLayout', () => {
	it('rejects blank on a full four-take grid', () => {
		const errors = validateGridLayout(
			{ rows: 2, cols: 2, gutterFraction: 0.02, blankCells: [4], panelAspect: '16:9' },
			4
		);
		expect(errors.some((e) => e.includes('member_mismatch') || e.includes('blank_on_full'))).toBe(
			true
		);
	});

	it('accepts pilot three-member layout', () => {
		const errors = validateGridLayout(
			{ rows: 2, cols: 2, gutterFraction: 0.02, blankCells: [4], panelAspect: '16:9' },
			3
		);
		expect(errors).toEqual([]);
	});
});
