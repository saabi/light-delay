import { describe, expect, it } from 'vitest';
import {
	CONVERSATIONAL_GAP_MS,
	chooseShotDurationMs,
	fillContiguousSpan,
	packShotPlacements,
	resolvePlacementDurationMs
} from '$project-tools/lib/festival-master-dialogue-fit.mjs';

describe('festival-master-dialogue-fit', () => {
	it('pushes overlapping dialogue and uses measured WAV duration', () => {
		const rows = [
			{
				placement: { cueId: 'a', atMs: 0, durationMs: 1000 },
				cue: { id: 'a', type: 'dialogue' },
				durationMs: 3000,
				originalAtMs: 0
			},
			{
				placement: { cueId: 'b', atMs: 500, durationMs: 1000 },
				cue: { id: 'b', type: 'dialogue' },
				durationMs: 2000,
				originalAtMs: 500
			}
		];
		const packed = packShotPlacements(rows, { shotId: 'shot:x' });
		expect(packed.rows[0].placement.atMs).toBe(0);
		expect(packed.rows[0].placement.durationMs).toBe(3000);
		expect(packed.rows[1].placement.atMs).toBe(3000 + CONVERSATIONAL_GAP_MS);
		expect(packed.events.some((e) => e.kind === 'push-overlap' || e.kind === 'compress-gap')).toBe(
			true
		);
	});

	it('compresses idle dialogue gaps', () => {
		const rows = [
			{
				placement: { cueId: 'a', atMs: 0, durationMs: 1000 },
				cue: { id: 'a', type: 'dialogue' },
				durationMs: 1000,
				originalAtMs: 0
			},
			{
				placement: { cueId: 'b', atMs: 4000, durationMs: 1000 },
				cue: { id: 'b', type: 'dialogue' },
				durationMs: 1000,
				originalAtMs: 4000
			}
		];
		const packed = packShotPlacements(rows, { shotId: 'shot:y' });
		expect(packed.rows[1].placement.atMs).toBe(1000 + CONVERSATIONAL_GAP_MS);
		expect(packed.events.some((e) => e.kind === 'compress-gap')).toBe(true);
	});

	it('preserves suspense gaps when flagged', () => {
		const rows = [
			{
				placement: { cueId: 'a', atMs: 0, durationMs: 1000 },
				cue: { id: 'a', type: 'dialogue' },
				durationMs: 1000,
				originalAtMs: 0
			},
			{
				placement: { cueId: 'b', atMs: 3000, durationMs: 1000 },
				cue: { id: 'b', type: 'dialogue' },
				durationMs: 1000,
				originalAtMs: 3000
			}
		];
		const packed = packShotPlacements(rows, { shotId: 'shot:z', suspenseKeep: true });
		expect(packed.rows[1].placement.atMs).toBe(3000);
		expect(packed.events.some((e) => e.kind === 'preserve-suspense-gap')).toBe(true);
	});

	it('honors silence duration between lines', () => {
		const rows = [
			{
				placement: { cueId: 'a', atMs: 0, durationMs: 500 },
				cue: { id: 'a', type: 'dialogue' },
				durationMs: 500,
				originalAtMs: 0
			},
			{
				placement: { cueId: 'sil', atMs: 500, durationMs: 2000 },
				cue: { id: 'sil', type: 'silence', estimatedDurationMs: 2000 },
				durationMs: 2000,
				originalAtMs: 500
			},
			{
				placement: { cueId: 'b', atMs: 4000, durationMs: 500 },
				cue: { id: 'b', type: 'dialogue' },
				durationMs: 500,
				originalAtMs: 4000
			}
		];
		const packed = packShotPlacements(rows, { shotId: 'shot:s' });
		expect(packed.rows[1].placement.durationMs).toBe(2000);
		expect(packed.rows[2].placement.atMs).toBeGreaterThanOrEqual(
			packed.rows[1].placement.atMs + 2000
		);
	});

	it('fills contiguous span to shot duration', () => {
		const filled = fillContiguousSpan(
			[
				{ cueId: 'a', atMs: 0, durationMs: 1000 },
				{ cueId: 'b', atMs: 1100, durationMs: 500 }
			],
			2000
		);
		expect(filled[1]!.atMs + (filled[1]!.durationMs ?? 0)).toBe(2000);
	});

	it('resolvePlacementDurationMs prefers measured WAV for dialogue', () => {
		expect(
			resolvePlacementDurationMs(
				{ cueId: 'a', atMs: 0, durationMs: 100 },
				{ id: 'a', type: 'dialogue' },
				2500
			)
		).toBe(2500);
	});

	it('chooseShotDurationMs shrinks idle trails', () => {
		const ms = chooseShotDurationMs({
			contentEnd: 3200,
			previousDurationMs: 8000,
			title: false,
			hasTerminalSilence: false,
			lastDialogueEnd: 3000
		});
		expect(ms).toBeLessThan(8000);
		expect(ms).toBeGreaterThanOrEqual(3200);
	});
});
