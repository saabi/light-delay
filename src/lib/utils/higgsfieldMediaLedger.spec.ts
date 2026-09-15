// @ts-nocheck
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	buildDuplicatesReport,
	compareIsoTimestamps,
	inferLedgerKind,
	loadLedger,
	lookup,
	saveLedger,
	sha256File,
	shouldSkipSeedFromHistoricalUploads,
	upsertEntry
} from '../../../scripts/lib/higgsfield-media-ledger.mjs';

describe('higgsfield-media-ledger', () => {
	it('lookup returns mediaId for assetId+sha256', () => {
		const ledger = {
			schemaVersion: '1.0.0',
			workspaceId: 'ws',
			updatedAt: '2026-09-15T00:00:00Z',
			entries: [
				{
					assetId: 'asset:character-zao-sheet',
					sha256: 'a'.repeat(64),
					mediaId: 'media-zao-1',
					kind: 'image'
				}
			]
		};
		expect(lookup(ledger, 'asset:character-zao-sheet', 'a'.repeat(64))).toBe('media-zao-1');
		expect(lookup(ledger, 'asset:character-zao-sheet', 'b'.repeat(64))).toBeNull();
	});

	it('upsertEntry replaces same key and records superseded mediaId', () => {
		const ledger = {
			schemaVersion: '1.0.0',
			workspaceId: 'ws',
			updatedAt: '2026-09-15T00:00:00Z',
			entries: []
		};
		upsertEntry(ledger, {
			assetId: 'asset:x',
			sha256: 'c'.repeat(64),
			mediaId: 'm1',
			kind: 'image'
		});
		upsertEntry(ledger, {
			assetId: 'asset:x',
			sha256: 'c'.repeat(64),
			mediaId: 'm2',
			kind: 'image',
			sourceRunId: 'run:2'
		});
		expect(ledger.entries).toHaveLength(1);
		expect(ledger.entries[0].mediaId).toBe('m2');
		expect(ledger.entries[0].supersededMediaIds).toEqual(['m1']);
		expect(ledger.entries[0].sourceRunId).toBe('run:2');
	});

	it('compareIsoTimestamps prefers later completedAt for keeper selection', () => {
		expect(compareIsoTimestamps('2026-09-14T22:00:00Z', '2026-09-13T22:00:00Z')).toBeGreaterThan(0);
		expect(compareIsoTimestamps(null, '2026-09-13T22:00:00Z')).toBeLessThan(0);
	});

	it('buildDuplicatesReport lists non-keeper mediaIds', () => {
		const rows = [
			{ assetId: 'asset:a', mediaId: 'keep', when: '2026-09-14T12:00:00Z', sourceRunId: 'r2' },
			{ assetId: 'asset:a', mediaId: 'old', when: '2026-09-13T12:00:00Z', sourceRunId: 'r1' }
		];
		const keepers = [{ assetId: 'asset:a', mediaId: 'keep', sha256: 'd'.repeat(64) }];
		const report = buildDuplicatesReport(rows, keepers);
		expect(report.keepers).toEqual(keepers);
		expect(report.deleteCandidates).toEqual([
			{
				assetId: 'asset:a',
				mediaId: 'old',
				reason: 'superseded_or_non_keeper_upload_for_asset'
			}
		]);
	});

	it('shouldSkipSeedFromHistoricalUploads for seedance voice clips', () => {
		expect(
			shouldSkipSeedFromHistoricalUploads({
				metadata: { seedanceUploadPath: '/assets/voices/en/seedance-5s/Elin.mp3' }
			})
		).toBe(true);
		expect(shouldSkipSeedFromHistoricalUploads({ metadata: {} })).toBe(false);
	});

	it('inferLedgerKind uses asset kind and voice id heuristic', () => {
		expect(inferLedgerKind({ kind: 'audio' }, 'asset:x')).toBe('audio');
		expect(inferLedgerKind({}, 'asset:voice-ref-en-elin')).toBe('audio');
		expect(inferLedgerKind({}, 'asset:character-zao-sheet')).toBe('image');
	});

	it('loadLedger/saveLedger round-trip on disk', () => {
		const root = mkdtempSync(join(tmpdir(), 'hf-ledger-'));
		mkdirSync(join(root, 'data', 'production'), { recursive: true });
		const empty = loadLedger(root);
		expect(empty.entries).toEqual([]);
		upsertEntry(empty, {
			assetId: 'asset:y',
			sha256: 'e'.repeat(64),
			mediaId: 'mid',
			kind: 'image'
		});
		saveLedger(root, empty);
		const reloaded = loadLedger(root);
		expect(lookup(reloaded, 'asset:y', 'e'.repeat(64))).toBe('mid');
		const file = join(root, 'data', 'production', 'tmp-hash.bin');
		writeFileSync(file, 'hello');
		expect(sha256File(file)).toHaveLength(64);
	});
});
