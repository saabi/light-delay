import type { ScreenplayElement } from '@light-delay/v2-core';

/**
 * Text kept on this device (STUDIO_DESIGN_SYSTEM.md § Never lose typed text; ADR-0004 addendum).
 *
 * Every edit is mirrored to IndexedDB until the server confirms it, so text typed while Studio is
 * unreachable survives a closed tab, a reload or a crash. It is per browser profile and per cut,
 * holds only text the server has not confirmed, and is removed as soon as the server has it. Each
 * page keeps its own copy, so two tabs never overwrite each other's text; a page only ever restores
 * copies whose page has closed (each open page holds a Web Lock named after itself). When
 * IndexedDB is unavailable (private windows, blocked storage) nothing is kept, and Studio says so:
 * the save state never claims a protection that does not exist.
 */

/** What the kept text was typed on top of: the saved Draft, or the committed text when none. */
export interface KeptBase {
	draftId?: string;
	draftUpdatedAt?: string;
	documentVersion: number;
}

export interface KeptText {
	/** `cut|writer`: one copy per cut per page. */
	key: string;
	cut: string;
	/** The page that wrote it. */
	writer: string;
	/** The writer's edit counter, so a confirmed save never removes newer text. */
	editVersion: number;
	elements: ScreenplayElement[];
	base: KeptBase;
	keptAt: string;
}

export interface KeptTextStore {
	/** Every copy kept for a cut, newest first. */
	list(cut: string): Promise<KeptText[]>;
	put(record: KeptText): Promise<void>;
	/** Removes a copy; with `upTo`, only if it holds that edit or an older one (never newer text). */
	remove(key: string, upTo?: number): Promise<void>;
}

export const keptTextCut = (projectId: string, documentId: string, versionId: string) =>
	`${projectId}|${documentId}|${versionId}`;
export const keptTextKey = (cut: string, writer: string) => `${cut}|${writer}`;

const databaseName = 'studio-kept-text';
const storeName = 'screenplays';
const lockPrefix = 'studio-page:';

const request = <T>(operation: IDBRequest<T>) =>
	new Promise<T>((resolve, reject) => {
		operation.onsuccess = () => resolve(operation.result);
		operation.onerror = () => reject(operation.error);
	});

const done = (transaction: IDBTransaction) =>
	new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
	});

/** The IndexedDB store, or undefined when this browser cannot keep text. */
export async function openKeptTextStore(): Promise<KeptTextStore | undefined> {
	if (typeof indexedDB === 'undefined') return undefined;
	let database: IDBDatabase;
	try {
		const opening = indexedDB.open(databaseName, 1);
		opening.onupgradeneeded = () =>
			opening.result.createObjectStore(storeName, { keyPath: 'key' }).createIndex('cut', 'cut');
		database = await request(opening);
	} catch {
		return undefined;
	}
	const store = (mode: IDBTransactionMode) => {
		const transaction = database.transaction(storeName, mode);
		return { transaction, objects: transaction.objectStore(storeName) };
	};
	return {
		async list(cut) {
			const records = (await request(
				store('readonly').objects.index('cut').getAll(cut)
			)) as KeptText[];
			return records.sort((a, b) => b.keptAt.localeCompare(a.keptAt));
		},
		async put(record) {
			const { transaction, objects } = store('readwrite');
			objects.put(record);
			await done(transaction);
		},
		async remove(key, upTo) {
			const { transaction, objects } = store('readwrite');
			const current = (await request(objects.get(key))) as KeptText | undefined;
			if (current && (upTo === undefined || current.editVersion <= upTo)) objects.delete(key);
			await done(transaction);
		}
	};
}

export type KeptTextFinding = 'none' | 'same' | 'continues' | 'diverged';

/**
 * How kept text relates to what the server has now. `same`: the server already has this text.
 * `continues`: it was typed on top of exactly the saved state, so it is simply restored and saved.
 * `diverged`: the saved text changed since (another tab, device or a commit), so the author chooses.
 */
export function compareKeptText(
	kept: KeptText | undefined,
	saved: {
		draft?: { id: string; updatedAt: string; elements: readonly ScreenplayElement[] };
		documentVersion: number;
		elements: readonly ScreenplayElement[];
	}
): KeptTextFinding {
	if (!kept) return 'none';
	const current = saved.draft?.elements ?? saved.elements;
	const same =
		current.length === kept.elements.length &&
		current.every(
			(element, index) =>
				element.id === kept.elements[index].id &&
				element.kind === kept.elements[index].kind &&
				element.text === kept.elements[index].text
		);
	if (same) return 'same';
	const base = kept.base;
	const continues = saved.draft
		? base.draftId === saved.draft.id && base.draftUpdatedAt === saved.draft.updatedAt
		: !base.draftId && base.documentVersion === saved.documentVersion;
	return continues ? 'continues' : 'diverged';
}

/** Holds a Web Lock named after this page for as long as it is open. */
export function holdPageLock(pageId: string) {
	void navigator.locks
		?.request(`${lockPrefix}${pageId}`, () => new Promise<never>(() => {}))
		.catch(() => undefined);
}

/** Pages that are open now (in any tab of this browser profile), when the browser can tell. */
export async function openPages(): Promise<Set<string>> {
	try {
		const { held = [] } = (await navigator.locks?.query()) ?? {};
		return new Set(
			held
				.map((lock) => lock.name ?? '')
				.filter((name) => name.startsWith(lockPrefix))
				.map((name) => name.slice(lockPrefix.length))
		);
	} catch {
		return new Set();
	}
}

/** The copy to act on when a cut opens: the newest one whose page has closed. */
export function keptTextToRecover(records: readonly KeptText[], live: ReadonlySet<string>) {
	return records.find((record) => !live.has(record.writer));
}
