import { expect, test, type Page } from '@playwright/test';
import {
	commit,
	commitCard,
	historyEntries,
	initialEntry,
	proposalCount,
	retry,
	saveState,
	switchCut,
	editor,
	el
} from './studio-e2e';

/*
	Regressions for the Studio Write UX review defects U1–U8
	(docs/reviews/2026-10-01-studio-write-ux-review-claude.md).
	The preview server keeps one in-memory store for the whole run and this project runs after
	authoring.e2e.ts, so these tests do not assume the initial text, revision numbers or drafts.
*/

const longDialogue =
	'Leave the channel open, and if the relay drops again, keep transmitting the same three words until someone on the other side answers.';

const initialDialogue = 'Leave the channel open.';

async function open(page: Page) {
	await page.goto('/');
	await expect(el(page, 'dialogue')).toBeVisible();
	await expect(page.getByRole('button', { name: /^Cut: / })).toBeEnabled();
	await page.evaluate(() => document.fonts.ready);
}

/* Elements whose text overflows their box, or that scroll inside themselves. */
async function clippedElements(page: Page) {
	return editor(page)
		.locator('.el')
		.evaluateAll((nodes) =>
			nodes
				.filter(
					(node) =>
						node.scrollHeight > node.clientHeight + 1 ||
						!['visible', ''].includes(getComputedStyle(node).overflowY)
				)
				.map((node) => node.textContent)
		);
}

for (const viewport of [
	{ width: 1280, height: 900 },
	{ width: 390, height: 844 }
])
	test(`U1/U4: one continuous document where every element shows all of its text, at ${viewport.width}px`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		await open(page);
		/* No form fields: one editable document, with no grips or per-element scroll bars. */
		await expect(page.locator('textarea, input')).toHaveCount(0);
		await expect(page.locator('[contenteditable="true"]')).toHaveCount(1);
		expect(await clippedElements(page)).toEqual([]);
		await el(page, 'dialogue').fill(longDialogue);
		await expect(el(page, 'dialogue')).toHaveText(longDialogue);
		expect(await clippedElements(page)).toEqual([]);
		/* The long line wraps onto several lines instead of being hidden. */
		const lines = await el(page, 'dialogue').evaluate(
			(node) => node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).fontSize)
		);
		expect(lines).toBeGreaterThan(2);
	});

test('U2: switching cut saves unsaved edits instead of discarding them', async ({ page }) => {
	await open(page);
	await el(page, 'dialogue').fill('Edited before switching cut.');
	await switchCut(page, 'Trailer');
	await expect(el(page, 'dialogue')).toHaveCount(0);
	await switchCut(page, 'Feature');
	await expect(el(page, 'dialogue')).toHaveText('Edited before switching cut.');
	await expect(saveState(page)).not.toContainText('Saving');
});

test('U2: if the edits cannot be saved, Studio stays on the current cut with the text intact', async ({
	page
}) => {
	await open(page);
	/* Only the save fails; reads still work, so switching would otherwise succeed and drop the text. */
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
	await el(page, 'dialogue').fill('Must not be lost.');
	await page.getByRole('button', { name: /^Cut: / }).click();
	await page.getByRole('menuitemradio', { name: 'Trailer' }).click();
	await expect(saveState(page).getByRole('button', { name: 'Retry' })).toBeVisible({
		timeout: 15_000
	});
	await expect(el(page, 'dialogue')).toHaveText('Must not be lost.');
	await expect(page.getByRole('button', { name: 'Cut: Feature' })).toBeVisible();

	await page.unroute('**/api/authoring');
	await retry(page);
	await expect(page.getByRole('button', { name: 'Cut: Trailer' })).toBeVisible();
	await switchCut(page, 'Feature');
	await expect(el(page, 'dialogue')).toHaveText('Must not be lost.');
});

test('U2: leaving the page with edits neither saved nor kept on this device asks first', async ({
	page
}) => {
	/* Where the browser cannot keep text (kept-text.e2e.ts covers the case where it can). */
	await page.addInitScript(() =>
		Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true })
	);
	await open(page);
	await el(page, 'dialogue').fill('Unsaved when closing.');
	const dialog = page.waitForEvent('dialog');
	await page.close({ runBeforeUnload: true });
	const prompt = await dialog;
	expect(prompt.type()).toBe('beforeunload');
	await prompt.dismiss();
});

test('U3: Inter and Courier Prime are bundled and loaded from Studio itself', async ({ page }) => {
	const fontRequests: string[] = [];
	page.on('request', (request) => {
		if (request.resourceType() === 'font') fontRequests.push(request.url());
	});
	await open(page);
	const loaded = await page.evaluate(() =>
		[...document.fonts]
			.filter((face) => face.status === 'loaded')
			.map((face) => face.family.replaceAll('"', ''))
	);
	expect(loaded).toContain('Inter Variable');
	expect(loaded).toContain('Courier Prime');
	expect(fontRequests.length).toBeGreaterThan(0);
	const origin = new URL(page.url()).origin;
	for (const url of fontRequests) expect(new URL(url).origin).toBe(origin);
	expect(fontRequests.every((url) => url.endsWith('.woff2'))).toBe(true);
});

test('U5: restore shows the text first, asks, and is not offered for the current text', async ({
	page
}) => {
	await open(page);
	const accepted = `Accepted line ${Date.now()}.`;
	await el(page, 'dialogue').fill(accepted);
	await commit(page);

	await page.getByRole('button', { name: 'History' }).click();
	const latest = historyEntries(page).first();
	await expect(latest).toContainText('Revised dialogue');
	await expect(latest.getByText('Current text')).toBeVisible();
	await expect(latest.getByRole('button')).toHaveCount(0);

	const initial = initialEntry(page);
	await initial.getByRole('button', { name: 'Restore…' }).click();
	const preview = page.getByLabel('Restore preview');
	await expect(preview.getByText(initialDialogue)).toBeVisible();
	await expect(el(page, 'dialogue')).toHaveText(accepted);
	await preview.getByRole('button', { name: 'Cancel' }).click();
	await expect(preview).toHaveCount(0);
	await expect(el(page, 'dialogue')).toHaveText(accepted);

	await initial.getByRole('button', { name: 'Restore…' }).click();
	await page.getByRole('button', { name: 'Restore this version' }).click();
	await expect(saveState(page)).toHaveText('Restored');
	await expect(el(page, 'dialogue')).toHaveText(initialDialogue);
	await expect(initial.getByText('Current text')).toBeVisible();
	await expect(initial.getByRole('button')).toHaveCount(0);
});

test('U6: the commit action appears only when there is something to commit, and is not repeated', async ({
	page
}) => {
	await open(page);
	const dialogue = el(page, 'dialogue');
	const action = page.getByRole('button', { name: 'Commit changes' });
	const committed = (await dialogue.textContent()) ?? '';
	await dialogue.fill(`${committed} Pending.`);
	await expect(action).toBeVisible();
	await expect(action).toHaveClass(/primary/);
	const before = await proposalCount(page);
	await action.click();
	await expect(commitCard(page)).toBeVisible();
	await expect(action).toHaveCount(0);
	await commitCard(page).getByRole('button', { name: 'Cancel' }).click();
	await action.click();
	await commitCard(page).getByRole('button', { name: 'Cancel' }).click();
	expect(await proposalCount(page)).toBe(before + 1);
	/* Typing the committed text back removes the action. */
	await dialogue.fill(committed);
	await expect(action).toHaveCount(0);
});

for (const viewport of [
	{ width: 1280, height: 900 },
	{ width: 390, height: 844 }
])
	test(`U7: text, target and focus floors at ${viewport.width}px`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await open(page);
		await page.getByRole('button', { name: 'History' }).click();
		await expect(page.getByLabel('History')).toBeVisible();
		const tooSmall = await page.evaluate(() => {
			const small: string[] = [];
			for (const node of document.querySelectorAll('body *')) {
				const element = node as HTMLElement;
				const hasText = [...element.childNodes].some(
					(child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
				);
				if (!hasText || element.getClientRects().length === 0) continue;
				const size = parseFloat(getComputedStyle(element).fontSize);
				if (size < 12) small.push(`${element.tagName} ${size}px "${element.textContent?.trim()}"`);
			}
			return small;
		});
		expect(tooSmall).toEqual([]);
		const smallTargets = await page.locator('button').evaluateAll((nodes) =>
			nodes
				.filter((node) => node.getClientRects().length > 0)
				.map((node) => ({
					name: node.textContent?.trim() || node.ariaLabel,
					box: node.getBoundingClientRect()
				}))
				.filter(({ box }) => box.width < 24 || box.height < 24)
				.map(({ name, box }) => `${name} ${box.width}×${box.height}`)
		);
		expect(smallTargets).toEqual([]);
		await page.getByRole('button', { name: 'History' }).click();
		/* The element holding the caret is marked, not only the caret. */
		const dialogue = el(page, 'dialogue');
		await dialogue.click();
		await expect(dialogue).toHaveClass(/el-current/);
		const outline = await dialogue.evaluate((node) => {
			const style = getComputedStyle(node);
			return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
		});
		expect(outline.style).toBe('solid');
		expect(outline.width).toBeGreaterThanOrEqual(2);
		/* The element handle shown beside it meets the target floor too. */
		const handle = await page.getByRole('button', { name: 'Dialogue actions' }).boundingBox();
		expect(handle!.width).toBeGreaterThanOrEqual(24);
		expect(handle!.height).toBeGreaterThanOrEqual(24);
	});

test('U8: connectivity states do not move the document', async ({ page }) => {
	await open(page);
	const dialogue = el(page, 'dialogue');
	const before = await dialogue.boundingBox();
	await page.route('**/api/authoring', (route) =>
		route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ code: 'STORE_UNAVAILABLE', message: 'Database unavailable' })
		})
	);
	await dialogue.fill('Typing during an outage.');
	await expect(saveState(page)).toContainText('Reconnecting…');
	expect(await dialogue.boundingBox()).toEqual(before);
	await expect(saveState(page)).toContainText('Offline — kept on this device', {
		timeout: 15_000
	});
	expect(await dialogue.boundingBox()).toEqual(before);
});
