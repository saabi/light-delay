import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { el, saved, saveState } from './studio-e2e';

/*
	Text kept on this device (STUDIO_DESIGN_SYSTEM.md § Never lose typed text): edits the server has
	not confirmed are mirrored to IndexedDB, survive closing the tab, are saved on the next visit,
	and never overwrite newer saved text without the author seeing both.
*/

const kept = 'Offline — kept on this device';

async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('.shell[data-layout]')).toBeVisible();
	await expect(el(page, 'dialogue').first()).toBeVisible();
	await expect(page.getByRole('button', { name: /^Cut: / })).toBeEnabled();
}

/* Saves fail as if the database were down; reading still works. */
async function blockSaves(page: Page) {
	await page.route('**/api/authoring', (route) => {
		const body = route.request().postDataJSON();
		if (body.method === 'handle' && body.args[0].type === 'SaveDraft')
			return route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'STORE_UNAVAILABLE', message: 'Database unavailable' })
			});
		return route.continue();
	});
}

/* Copies kept on this device (call only after Studio has opened its database). */
const keptCopies = (page: Page) =>
	page.evaluate(
		() =>
			new Promise<number>((resolve, reject) => {
				const opening = indexedDB.open('studio-kept-text');
				opening.onerror = () => reject(opening.error);
				opening.onsuccess = () => {
					const database = opening.result;
					const counting = database.transaction('screenplays').objectStore('screenplays').count();
					counting.onsuccess = () => {
						resolve(counting.result);
						database.close();
					};
				};
			})
	);

/* Closes a page, failing if it asks before leaving. */
async function closeWithoutAsking(page: Page) {
	let asked = false;
	page.on('dialog', (dialog) => {
		asked = true;
		void dialog.accept();
	});
	const closed = page.waitForEvent('close');
	await page.close({ runBeforeUnload: true });
	await closed;
	expect(asked).toBe(false);
}

test('text typed while saves fail is kept here, closing does not ask, and the next visit saves it', async ({
	browser
}) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await open(page);
	await blockSaves(page);
	const line = `Kept through a closed tab ${Date.now()}.`;
	await el(page, 'dialogue').first().fill(line);
	await expect(saveState(page)).toContainText(kept, { timeout: 15_000 });
	await expect(saveState(page).getByRole('button', { name: 'Retry' })).toBeVisible();
	await closeWithoutAsking(page);

	const next = await context.newPage();
	await open(next);
	await expect(el(next, 'dialogue').first()).toHaveText(line);
	await saved(next);
	await expect.poll(() => keptCopies(next)).toBe(0);
	await next.reload();
	await expect(el(next, 'dialogue').first()).toHaveText(line);
	await context.close();
});

/*
	Tab A keeps text it could not save; tab B then saves different text. A's copy must survive B's
	saves, and the next visit shows it against the saved text instead of overwriting either.
*/
async function diverge(context: BrowserContext) {
	const stamp = Date.now();
	const fromA = `From the first tab ${stamp}.`;
	const fromB = `From the second tab ${stamp}.`;
	const a = await context.newPage();
	const b = await context.newPage();
	await open(a);
	await open(b);
	await blockSaves(a);
	await el(a, 'dialogue').first().fill(fromA);
	await expect(saveState(a)).toContainText(kept, { timeout: 15_000 });
	await el(b, 'dialogue').first().fill(fromB);
	await saved(b);
	await closeWithoutAsking(a);
	await b.close();
	const page = await context.newPage();
	await page.goto('/');
	const card = page.getByRole('dialog', { name: 'Text kept on this device' });
	await expect(card).toBeVisible();
	return { page, card, fromA, fromB };
}

test('kept text that the saved text has moved past is shown against it, then restored', async ({
	browser
}) => {
	const context = await browser.newContext();
	const { page, card, fromA } = await diverge(context);
	const line = page.getByLabel('Screenplay', { exact: true }).locator('[data-kind="dialogue"]');
	await expect(line.locator('ins')).toContainText('first');
	await expect(line.locator('del')).toContainText('second');
	/* Nothing can be edited or committed until the author chooses. */
	await expect(page.getByRole('button', { name: 'Commit changes' })).toHaveCount(0);
	await expect(page.getByRole('textbox', { name: 'Screenplay text' })).toBeHidden();

	await card.getByRole('button', { name: 'Restore it' }).click();
	await expect(card).toHaveCount(0);
	await expect(el(page, 'dialogue').first()).toHaveText(fromA);
	await saved(page);
	await expect.poll(() => keptCopies(page)).toBe(0);
	await context.close();
});

test('discarding kept text keeps the saved text and forgets the copy', async ({ browser }) => {
	const context = await browser.newContext();
	const { page, card, fromB } = await diverge(context);
	await card.getByRole('button', { name: 'Discard it' }).click();
	await expect(card).toHaveCount(0);
	await expect(el(page, 'dialogue').first()).toHaveText(fromB);
	await expect.poll(() => keptCopies(page)).toBe(0);
	await page.reload();
	await expect(el(page, 'dialogue').first()).toHaveText(fromB);
	await expect(page.getByRole('dialog', { name: 'Text kept on this device' })).toHaveCount(0);
	await context.close();
});

test('an open tab’s kept text is never taken over by another tab', async ({ browser }) => {
	const context = await browser.newContext();
	const a = await context.newPage();
	await open(a);
	await blockSaves(a);
	const line = `Still being typed ${Date.now()}.`;
	await el(a, 'dialogue').first().fill(line);
	await expect(saveState(a)).toContainText(kept, { timeout: 15_000 });
	const b = await context.newPage();
	await open(b);
	await expect(el(b, 'dialogue').first()).not.toHaveText(line);
	await expect(b.getByRole('dialog', { name: 'Text kept on this device' })).toHaveCount(0);
	expect(await keptCopies(b)).toBe(1);
	await context.close();
});

test('where the browser cannot keep text, Studio says it is not saved', async ({ page }) => {
	await page.addInitScript(() =>
		Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true })
	);
	await open(page);
	await blockSaves(page);
	await el(page, 'dialogue').first().fill(`Nowhere to keep this ${Date.now()}.`);
	await expect(saveState(page)).toContainText('Not saved', { timeout: 15_000 });
	await expect(saveState(page)).not.toContainText('kept');
});
