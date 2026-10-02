import { expect, test, type Page } from '@playwright/test';
import { historyEntries, initialEntry, retry, save, saveState, switchCut } from './studio-e2e';

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
	await expect(page.getByLabel('dialogue')).toBeVisible();
	await expect(page.getByRole('button', { name: /^Cut: / })).toBeEnabled();
	await page.evaluate(() => document.fonts.ready);
}

async function clippedTextareas(page: Page) {
	return page.locator('textarea').evaluateAll((nodes) =>
		nodes
			.map((node) => node as HTMLTextAreaElement)
			.filter((node) => node.scrollHeight > node.clientHeight + 1)
			.map((node) => node.value)
	);
}

for (const viewport of [
	{ width: 1280, height: 900 },
	{ width: 390, height: 844 }
])
	test(`U1/U4: every element shows all of its text, without resize grips, at ${viewport.width}px`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		await open(page);
		expect(await clippedTextareas(page)).toEqual([]);
		await page.getByLabel('dialogue').fill(longDialogue);
		expect(await clippedTextareas(page)).toEqual([]);
		const resize = await page
			.locator('textarea')
			.evaluateAll((nodes) => [...new Set(nodes.map((node) => getComputedStyle(node).resize))]);
		expect(resize).toEqual(['none']);
	});

test('U2: switching cut saves unsaved edits instead of discarding them', async ({ page }) => {
	await open(page);
	await page.getByLabel('dialogue').fill('Edited before switching cut.');
	await switchCut(page, 'Trailer');
	await expect(page.getByLabel('dialogue')).toHaveCount(0);
	await switchCut(page, 'Feature');
	await expect(page.getByLabel('dialogue')).toHaveValue('Edited before switching cut.');
	await expect(saveState(page)).not.toContainText('Unsaved');
});

test('U2: if the edits cannot be saved, Studio stays on the current cut with the text intact', async ({
	page
}) => {
	await open(page);
	await page.getByLabel('dialogue').fill('Must not be lost.');
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
	await page.getByRole('button', { name: /^Cut: / }).click();
	await page.getByRole('menuitemradio', { name: 'Trailer' }).click();
	await expect(saveState(page).getByRole('button', { name: 'Retry' })).toBeVisible({
		timeout: 15_000
	});
	await expect(page.getByLabel('dialogue')).toHaveValue('Must not be lost.');
	await expect(page.getByRole('button', { name: 'Cut: Feature' })).toBeVisible();

	await page.unroute('**/api/authoring');
	await retry(page);
	await expect(page.getByRole('button', { name: 'Cut: Trailer' })).toBeVisible();
	await switchCut(page, 'Feature');
	await expect(page.getByLabel('dialogue')).toHaveValue('Must not be lost.');
});

test('U2: leaving the page with unsaved edits asks first', async ({ page }) => {
	await open(page);
	await page.getByLabel('dialogue').fill('Unsaved when closing.');
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
	await page.getByLabel('dialogue').fill(accepted);
	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(saveState(page)).toHaveText('Changes accepted');

	await page.getByRole('button', { name: 'History' }).click();
	const latest = historyEntries(page).first();
	await expect(latest).toContainText('Revised dialogue');
	await expect(latest.getByText('Current text')).toBeVisible();
	await expect(latest.getByRole('button')).toHaveCount(0);

	const initial = initialEntry(page);
	await initial.getByRole('button', { name: 'Restore…' }).click();
	const preview = page.getByLabel('Restore preview');
	await expect(preview.getByText(initialDialogue)).toBeVisible();
	await expect(page.getByLabel('dialogue')).toHaveValue(accepted);
	await preview.getByRole('button', { name: 'Cancel' }).click();
	await expect(preview).toHaveCount(0);
	await expect(page.getByLabel('dialogue')).toHaveValue(accepted);

	await initial.getByRole('button', { name: 'Restore…' }).click();
	await page.getByRole('button', { name: 'Restore this version' }).click();
	await expect(saveState(page)).toHaveText('Restored');
	await expect(page.getByLabel('dialogue')).toHaveValue(initialDialogue);
	await expect(initial.getByText('Current text')).toBeVisible();
	await expect(initial.getByRole('button')).toHaveCount(0);
});

test('U6: a pending proposal is reopened, not proposed again', async ({ page }) => {
	await open(page);
	await page.getByLabel('dialogue').fill('Pending line.');
	await page.getByRole('button', { name: 'Review changes' }).click();
	await expect(page.getByRole('button', { name: 'Accept changes' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Review changes' })).toHaveCount(0);
	await page.getByLabel('Changes to review').getByRole('button', { name: 'Close' }).click();
	const reopen = page.getByRole('button', { name: 'Open review' });
	await expect(reopen).not.toHaveClass(/primary/);
	await reopen.click();
	await expect(page.getByRole('button', { name: 'Accept changes' })).toBeVisible();
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
		const dialogue = page.getByLabel('dialogue');
		await dialogue.focus();
		const outline = await dialogue.evaluate((node) => {
			const style = getComputedStyle(node);
			return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
		});
		expect(outline.style).toBe('solid');
		expect(outline.width).toBeGreaterThanOrEqual(2);
	});

test('U8: connectivity states do not move the document', async ({ page }) => {
	await open(page);
	const dialogue = page.getByLabel('dialogue');
	await dialogue.fill('Typing during an outage.');
	const before = await dialogue.boundingBox();
	await page.route('**/api/authoring', (route) =>
		route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ code: 'STORE_UNAVAILABLE', message: 'Database unavailable' })
		})
	);
	await save(page);
	await expect(saveState(page)).toContainText('Reconnecting…');
	expect(await dialogue.boundingBox()).toEqual(before);
	await expect(saveState(page)).toContainText('Not saved', { timeout: 15_000 });
	expect(await dialogue.boundingBox()).toEqual(before);
});
