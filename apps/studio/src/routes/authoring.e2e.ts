import { expect, test, type Page } from '@playwright/test';
import { authoringFixtureIds } from '@light-delay/v2-core';
import {
	commit,
	commitCard,
	historyEntries,
	initialEntry,
	proposalCount,
	retry,
	saved,
	saveState,
	switchCut,
	el
} from './studio-e2e';

async function historyCount(page: Page): Promise<number> {
	return page.evaluate(async (projectId) => {
		const response = await fetch('/api/authoring', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ method: 'listHistory', args: [projectId] })
		});
		return (await response.json()).length;
	}, authoringFixtureIds.project);
}

test('autosaves, commits through an inline review, isolates cuts, and restores', async ({
	page
}) => {
	await page.goto('/');
	const dialogue = el(page, 'dialogue');
	await expect(dialogue).toHaveText('Leave the channel open.');
	/* Nothing to commit until the text differs. */
	await expect(page.getByRole('button', { name: 'Commit changes' })).toHaveCount(0);

	await dialogue.fill('Keep the channel alive.');
	await expect(saveState(page)).toHaveText('Saving…');
	await saved(page);
	await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
	await page.reload();
	await expect(dialogue).toHaveText('Keep the channel alive.');
	await saved(page);

	/* The commit review shows the changes inline, marked by more than colour, before anything is committed. */
	const proposalsBefore = await proposalCount(page);
	await page.getByRole('button', { name: 'Commit changes' }).click();
	await expect(commitCard(page)).toContainText('1 change in Feature');
	const page_ = page.getByLabel('Screenplay');
	await expect(page_.locator('del')).toHaveText(['Leave', 'open.']);
	await expect(page_.locator('ins')).toHaveText(['Keep', 'alive.']);
	expect(
		await page_
			.locator('del')
			.first()
			.evaluate((node) => getComputedStyle(node).textDecorationLine)
	).toBe('line-through');
	expect(
		await page_
			.locator('ins')
			.first()
			.evaluate((node) => getComputedStyle(node).textDecorationLine)
	).toBe('underline');
	await expect(dialogue).toHaveCount(0);
	await commitCard(page).getByRole('button', { name: 'Cancel' }).click();
	await expect(dialogue).toHaveText('Keep the channel alive.');
	expect(await proposalCount(page)).toBe(proposalsBefore + 1);

	/* Preparing again without edits reuses the same proposal. */
	await commit(page);
	expect(await proposalCount(page)).toBe(proposalsBefore + 1);
	await expect(dialogue).toHaveText('Keep the channel alive.');
	await expect(page.getByRole('button', { name: 'Commit changes' })).toHaveCount(0);

	await switchCut(page, 'Trailer');
	await expect(el(page, 'dialogue')).toHaveCount(0);
	await switchCut(page, 'Feature');
	await expect(el(page, 'dialogue')).toHaveText('Keep the channel alive.');

	await page.getByRole('button', { name: 'History' }).click();
	await expect(historyEntries(page).first()).toContainText('Revised dialogue');
	await initialEntry(page).getByRole('button', { name: 'Restore…' }).click();
	await page.getByRole('button', { name: 'Restore this version' }).click();
	await expect(saveState(page)).toHaveText('Restored');
	await expect(historyEntries(page)).toHaveCount(3);
	await expect(el(page, 'dialogue')).toHaveText('Leave the channel open.');
});

test('Retry refreshes committed state without resending the commit', async ({ page }) => {
	await page.goto('/');
	const dialogue = el(page, 'dialogue');
	await dialogue.fill('Accepted after refresh.');
	await page.getByRole('button', { name: 'Commit changes' }).click();
	await expect(commitCard(page)).toBeVisible();
	const historyBefore = await historyCount(page);
	let acceptCount = 0;
	let readsUnavailable = false;
	await page.route('**/api/authoring', async (route) => {
		const body = route.request().postDataJSON();
		if (body.method === 'handle' && body.args[0].type === 'AcceptProposal') {
			acceptCount++;
			const response = await route.fetch();
			readsUnavailable = true;
			await route.fulfill({ response });
		} else if (readsUnavailable && body.method !== 'handle') {
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'STORE_UNAVAILABLE' })
			});
		} else await route.continue();
	});
	await commitCard(page).getByRole('button', { name: 'Commit' }).click();
	await expect(saveState(page)).toContainText('Committed · couldn’t refresh', {
		timeout: 15000
	});
	readsUnavailable = false;
	await retry(page);
	await expect(dialogue).toHaveText('Accepted after refresh.');
	expect(acceptCount).toBe(1);
	expect(await historyCount(page)).toBe(historyBefore + 1);
	await page.getByRole('button', { name: 'History' }).click();
	await expect(historyEntries(page).first()).toContainText('Revised dialogue');
});

test('Retry refreshes restored editor without resending a committed restore', async ({ page }) => {
	await page.goto('/');
	const dialogue = el(page, 'dialogue');
	const original = 'Leave the channel open.';
	await dialogue.fill('A different version for restore.');
	await commit(page);
	await expect(dialogue).toHaveText('A different version for restore.');
	await page.getByRole('button', { name: 'History' }).click();
	const historyBefore = await historyCount(page);
	let restoreCount = 0;
	let readsUnavailable = false;
	await page.route('**/api/authoring', async (route) => {
		const body = route.request().postDataJSON();
		if (body.method === 'handle' && body.args[0].type === 'RestoreScreenplay') {
			restoreCount++;
			const response = await route.fetch();
			readsUnavailable = true;
			await route.fulfill({ response });
		} else if (readsUnavailable && body.method !== 'handle') {
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'STORE_UNAVAILABLE' })
			});
		} else await route.continue();
	});
	await initialEntry(page).getByRole('button', { name: 'Restore…' }).click();
	await page.getByRole('button', { name: 'Restore this version' }).click();
	await expect(saveState(page)).toContainText('Restored · couldn’t refresh', { timeout: 15000 });
	readsUnavailable = false;
	await retry(page);
	await expect(dialogue).toHaveText(original);
	expect(restoreCount).toBe(1);
	expect(await historyCount(page)).toBe(historyBefore + 1);
});

test('keeps unsaved editor text through exhausted retries and saves on Retry', async ({ page }) => {
	await page.goto('/');
	const dialogue = el(page, 'dialogue');
	await expect(dialogue).toBeVisible();
	const text = `${await dialogue.textContent()} Still here.`;
	let unavailable = true;
	await page.route('**/api/authoring', async (route) => {
		if (unavailable)
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'STORE_UNAVAILABLE', message: 'Database unavailable' })
			});
		else await route.continue();
	});
	/* Typing autosaves; every attempt fails until the store is back. */
	await dialogue.fill(text);
	await expect(saveState(page)).toContainText('Not saved', { timeout: 15_000 });
	await expect(dialogue).toHaveText(text);
	unavailable = false;
	await retry(page);
	await expect(saveState(page)).toHaveText('Saved');
	await expect(dialogue).toHaveText(text);
	await expect(saveState(page).getByRole('button', { name: 'Retry' })).toHaveCount(0);
});
