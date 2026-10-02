import { expect, test, type Page } from '@playwright/test';
import { commit, commitCard, editor, el, saved } from './studio-e2e';

/*
	The continuous screenplay editor (STUDIO_DESIGN_SYSTEM.md § Write › Editor model): keyboard
	conventions, selection and undo across elements, paste, element actions, stable identities, and
	autosave from typing. Runs last on the shared in-memory store, so each test starts by committing
	whatever earlier tests left and works at the end of the screenplay.
*/

async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('.shell[data-layout]')).toBeVisible();
	await expect(el(page, 'dialogue').first()).toBeVisible();
	await expect(page.getByRole('button', { name: /^Cut: / })).toBeEnabled();
	if (await page.getByRole('button', { name: 'Commit changes' }).count()) await commit(page);
}

type Snapshot = { id: string; kind: string; text: string };

const snapshot = (page: Page) =>
	editor(page)
		.locator('.el')
		.evaluateAll((nodes) =>
			nodes.map((node) => ({
				id: node.getAttribute('data-id')!,
				kind: node.getAttribute('data-kind')!,
				text: node.textContent ?? ''
			}))
		);

const current = (page: Page) => editor(page).locator('.el-current');

/* Places the caret at the very end of the screenplay and starts a new element. */
async function newElementAtEnd(page: Page) {
	await editor(page).locator('.el').last().click();
	await page.keyboard.press('Control+End');
	await page.keyboard.press('Enter');
}

const savedDrafts = (page: Page) =>
	page.evaluate(async () => {
		const response = await fetch('/api/authoring', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ method: 'listDrafts', args: ['project:harbor-light'] })
		});
		return (await response.json()) as { elements: Snapshot[] }[];
	});

test('Enter, Tab and Shift+Tab follow screenplay conventions', async ({ page }) => {
	await open(page);
	const before = (await snapshot(page)).length;
	await newElementAtEnd(page);
	await page.keyboard.press('Control+Alt+1');
	await page.keyboard.type('INT. LAMP ROOM — NIGHT');
	await page.keyboard.press('Enter');
	await page.keyboard.type('Mara climbs the last steps.');
	await page.keyboard.press('Enter');
	await page.keyboard.press('Tab');
	await page.keyboard.type('Mara');
	await page.keyboard.press('Enter');
	await page.keyboard.press('Tab');
	await page.keyboard.type('(softly)');
	await page.keyboard.press('Enter');
	await page.keyboard.type('Almost there.');
	await page.keyboard.press('Enter');
	/* Action → character → transition; Shift+Tab steps back. */
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Shift+Tab');
	await expect(current(page)).toHaveAttribute('data-kind', 'character');
	await page.keyboard.press('Tab');
	await page.keyboard.type('Cut to:');
	await page.keyboard.press('Enter');
	await expect(current(page)).toHaveAttribute('data-kind', 'scene-heading');
	await expect(current(page)).toHaveAttribute('data-placeholder', 'Scene heading');

	const added = (await snapshot(page)).slice(before);
	expect(added.map(({ kind, text }) => [kind, text])).toEqual([
		['scene-heading', 'INT. LAMP ROOM — NIGHT'],
		['action', 'Mara climbs the last steps.'],
		['character', 'Mara'],
		['parenthetical', '(softly)'],
		['dialogue', 'Almost there.'],
		['transition', 'Cut to:'],
		['scene-heading', '']
	]);
	/* Cues and transitions are shown in capitals; the text keeps what was typed. */
	await expect(editor(page).locator('.el[data-kind="character"]').last()).toHaveCSS(
		'text-transform',
		'uppercase'
	);
	/* Tab on an element with text leaves the editor, so the keyboard is never trapped. */
	await editor(page).locator('.el').last().click();
	await page.keyboard.press('Backspace');
	await page.keyboard.press('Tab');
	await expect(editor(page)).not.toBeFocused();
});

test('every element type can be set from the keyboard', async ({ page }) => {
	await open(page);
	await newElementAtEnd(page);
	const kinds = ['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'];
	for (const [index, kind] of kinds.entries()) {
		await page.keyboard.press(`Control+Alt+${index + 1}`);
		await expect(current(page)).toHaveAttribute('data-kind', kind);
	}
	await page.keyboard.press('Control+z');
	await expect(current(page)).toHaveAttribute('data-kind', 'dialogue');
});

test('selection, typing over it, undo and redo work across elements', async ({ page }) => {
	await open(page);
	const before = await snapshot(page);
	/* Select from inside the first element to inside the third and type over it. */
	const elements = editor(page).locator('.el');
	await elements.nth(0).click({ position: { x: 4, y: 4 } });
	await page.keyboard.press('Home');
	await elements.nth(2).click({ position: { x: 4, y: 4 }, modifiers: ['Shift'] });
	await page.keyboard.type('X');
	const merged = await snapshot(page);
	expect(merged.length).toBe(before.length - 2);
	expect(merged[0].id).toBe(before[0].id);

	await page.keyboard.press('Control+z');
	await expect.poll(() => snapshot(page)).toEqual(before);
	await page.keyboard.press('Control+Shift+z');
	await expect.poll(() => snapshot(page)).toEqual(merged);
	await page.keyboard.press('Control+z');
	await expect.poll(() => snapshot(page)).toEqual(before);
});

test('pasting several lines makes one element per line, each with its own identity', async ({
	page
}) => {
	await open(page);
	await newElementAtEnd(page);
	await page.keyboard.press('Control+Alt+2');
	const before = (await snapshot(page)).length;
	await editor(page).evaluate((node) => {
		const data = new DataTransfer();
		data.setData('text/plain', 'The beam sweeps the bay.\nA horn answers.\nMara smiles.');
		node.dispatchEvent(
			new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
		);
	});
	const after = await snapshot(page);
	expect(after.slice(before - 1).map(({ kind, text }) => [kind, text])).toEqual([
		['action', 'The beam sweeps the bay.'],
		['action', 'A horn answers.'],
		['action', 'Mara smiles.']
	]);
	expect(new Set(after.map(({ id }) => id)).size).toBe(after.length);
	await expect(current(page)).toHaveText('Mara smiles.');
});

test('Alt+↑ and Alt+↓ move the current element', async ({ page }) => {
	await open(page);
	const before = await snapshot(page);
	const last = before.length - 1;
	await editor(page).locator('.el').last().click();
	await page.keyboard.press('Alt+ArrowUp');
	const moved = await snapshot(page);
	expect(moved[last - 1]).toEqual(before[last]);
	expect(moved[last]).toEqual(before[last - 1]);
	await expect(current(page)).toHaveAttribute('data-id', before[last].id);
	await page.keyboard.press('Alt+ArrowDown');
	await expect.poll(() => snapshot(page)).toEqual(before);
});

test('the element menu opens from the handle or the keyboard', async ({ page }) => {
	await open(page);
	await newElementAtEnd(page);
	await page.keyboard.press('Control+Alt+2');
	await page.keyboard.type('The lamp hums.');
	const menu = page.getByRole('menu', { name: 'Element actions' });

	/* Keyboard: Shift+F10 opens it on the first item; arrows move; Escape returns to the text. */
	await page.keyboard.press('Shift+F10');
	await expect(menu).toBeVisible();
	await expect(menu.getByRole('menuitem', { name: 'Move up' })).toBeFocused();
	await expect(menu.getByRole('menuitemradio', { name: 'Action', exact: true })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(editor(page)).toBeFocused();
	await page.keyboard.press('Shift+F10');
	for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
	await expect(menu.getByRole('menuitemradio', { name: 'Action', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(current(page)).toHaveAttribute('data-kind', 'character');
	await expect(editor(page)).toBeFocused();

	/* Pointer: the handle beside the current element names it and opens the same menu. */
	await page.getByRole('button', { name: 'Character actions' }).click();
	await menu.getByRole('menuitemradio', { name: 'Action', exact: true }).click();
	await expect(current(page)).toHaveAttribute('data-kind', 'action');
	await page.getByRole('button', { name: 'Action actions' }).click();
	await menu.getByRole('menuitem', { name: 'Remove' }).click();
	await expect(editor(page).getByText('The lamp hums.')).toHaveCount(0);
});

test('elements keep their identities; retyping a committed one commits as removed and added', async ({
	page
}) => {
	await open(page);
	const committed = await snapshot(page);
	const dialogue = el(page, 'dialogue').first();
	const dialogueId = (await dialogue.getAttribute('data-id'))!;
	const savedIds = async () => {
		await saved(page);
		const shown = JSON.stringify((await snapshot(page)).map(({ kind, text }) => [kind, text]));
		const draft = (await savedDrafts(page)).find(
			(item) => JSON.stringify(item.elements.map(({ kind, text }) => [kind, text])) === shown
		);
		expect(draft).toBeDefined();
		return draft!.elements.map(({ id }) => id);
	};

	await dialogue.fill('The relay holds.');
	expect(await savedIds()).toEqual(committed.map(({ id }) => id));

	/* Kind is fixed per identity: a committed dialogue retyped as action is saved as a new element. */
	await page.keyboard.press('Control+Alt+2');
	await expect(current(page)).toHaveAttribute('data-kind', 'action');
	expect(await savedIds()).toEqual(
		committed.map(({ id }) => (id === dialogueId ? `${dialogueId}~action` : id))
	);
	await page.getByRole('button', { name: 'Commit changes' }).click();
	await expect(commitCard(page)).toBeVisible();
	const screenplay = page.getByLabel('Screenplay', { exact: true });
	await expect(screenplay.locator('[data-change="removed"][data-kind="dialogue"]')).toBeVisible();
	await expect(screenplay.locator('[data-change="added"][data-kind="action"]')).toContainText(
		'The relay holds.'
	);
	await commitCard(page).getByRole('button', { name: 'Cancel' }).click();

	/* Back to dialogue, it is the committed element again; undo history survived the review. */
	await el(page, 'action').filter({ hasText: 'The relay holds.' }).click();
	await page.keyboard.press('Control+Alt+5');
	await expect(current(page)).toHaveAttribute('data-kind', 'dialogue');
	expect(await savedIds()).toEqual(committed.map(({ id }) => id));
	await page.keyboard.press('Control+z');
	await expect(current(page)).toHaveAttribute('data-kind', 'action');
	await page.keyboard.press('Control+z');
	await expect(current(page)).toHaveAttribute('data-kind', 'dialogue');
	await expect(current(page)).toHaveText('The relay holds.');
	await page.keyboard.press('Control+Shift+z');
	await expect(current(page)).toHaveAttribute('data-kind', 'action');
});

test('typing autosaves, and the text is there after a reload', async ({ page }) => {
	await open(page);
	const line = `The tide turns ${Date.now()}.`;
	await newElementAtEnd(page);
	await page.keyboard.press('Control+Alt+2');
	await page.keyboard.type(line);
	await saved(page);
	await page.reload();
	await expect(editor(page).locator('.el').last()).toHaveText(line);
	await expect(editor(page).locator('.el').last()).toHaveAttribute('data-kind', 'action');
});
