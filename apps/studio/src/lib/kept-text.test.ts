import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { ScreenplayElement } from '@light-delay/v2-core';
import { compareKeptText, keptTextToRecover, openKeptTextStore, type KeptText } from './kept-text';

const el = (id: string, text: string): ScreenplayElement => ({
	id: `element:${id}`,
	kind: 'action',
	text
});
const committed = [el('a', 'The lamp burns.'), el('b', 'A ferry passes.')];
const typed = [el('a', 'The lamp gutters.'), el('b', 'A ferry passes.')];
const draft = { id: 'draft:one', updatedAt: '2026-10-02T10:00:00.000Z', elements: committed };

const kept = (overrides: Partial<KeptText> = {}): KeptText => ({
	key: 'project|document|feature|page:one',
	cut: 'project|document|feature',
	writer: 'page:one',
	editVersion: 3,
	elements: typed,
	base: { draftId: draft.id, draftUpdatedAt: draft.updatedAt, documentVersion: 4 },
	keptAt: '2026-10-02T10:01:00.000Z',
	...overrides
});

describe('compareKeptText', () => {
	it('finds nothing to do without kept text, or when the server already has it', () => {
		expect(compareKeptText(undefined, { documentVersion: 4, elements: committed })).toBe('none');
		expect(
			compareKeptText(kept(), {
				draft: { ...draft, updatedAt: 'later', elements: typed },
				documentVersion: 4,
				elements: committed
			})
		).toBe('same');
	});

	it('continues the saved Draft it was typed on', () => {
		expect(compareKeptText(kept(), { draft, documentVersion: 4, elements: committed })).toBe(
			'continues'
		);
	});

	it('continues the committed text when there was no Draft', () => {
		const record = kept({ base: { documentVersion: 4 } });
		expect(compareKeptText(record, { documentVersion: 4, elements: committed })).toBe('continues');
		expect(compareKeptText(record, { documentVersion: 5, elements: committed })).toBe('diverged');
	});

	it('has diverged when the Draft was saved again elsewhere, or committed', () => {
		const saved = { ...draft, updatedAt: '2026-10-02T10:05:00.000Z' };
		expect(compareKeptText(kept(), { draft: saved, documentVersion: 4, elements: committed })).toBe(
			'diverged'
		);
		expect(compareKeptText(kept(), { documentVersion: 5, elements: committed })).toBe('diverged');
	});
});

describe('kept text store', () => {
	it('keeps one copy per page and lists a cut’s copies newest first', async () => {
		const store = (await openKeptTextStore())!;
		const cut = 'project|document|list';
		const older = kept({ key: `${cut}|page:one`, cut, keptAt: '2026-10-02T10:00:00.000Z' });
		const newer = kept({
			key: `${cut}|page:two`,
			cut,
			writer: 'page:two',
			keptAt: '2026-10-02T11:00:00.000Z'
		});
		await store.put(older);
		await store.put(newer);
		await store.put(kept({ key: 'other|cut|page:one', cut: 'other|cut' }));
		expect(await store.list(cut)).toEqual([newer, older]);
		await store.remove(newer.key);
		expect(await store.list(cut)).toEqual([older]);
	});

	it('a confirmed save never removes newer text', async () => {
		const store = (await openKeptTextStore())!;
		const record = kept({
			key: 'project|document|trailer|page:one',
			cut: 'project|document|trailer'
		});
		await store.put({ ...record, editVersion: 7 });
		await store.remove(record.key, 6);
		expect(await store.list(record.cut)).toHaveLength(1);
		await store.remove(record.key, 7);
		expect(await store.list(record.cut)).toHaveLength(0);
	});
});

describe('keptTextToRecover', () => {
	it('takes the newest copy whose page has closed, never a live page’s', () => {
		const one = kept({ writer: 'page:one' });
		const two = kept({ writer: 'page:two' });
		expect(keptTextToRecover([two, one], new Set(['page:two']))).toBe(one);
		expect(keptTextToRecover([two, one], new Set())).toBe(two);
		expect(keptTextToRecover([two, one], new Set(['page:one', 'page:two']))).toBeUndefined();
	});
});
