import { expect, test, type Page } from '@playwright/test';
import { authoringFixtureIds } from '@light-delay/v2-core';
import { historyEntries, initialEntry, retry, save, saveState, switchCut } from './studio-e2e';

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

test('saves, proposes, rejects, accepts, isolates cuts, and restores screenplay work', async ({
	page
}) => {
	await page.goto('/');
	const dialogue = page.getByLabel('dialogue');
	await expect(dialogue).toHaveValue('Leave the channel open.');
	await dialogue.fill('Keep the channel alive.');
	await expect(saveState(page)).toContainText('Unsaved changes');
	await save(page);
	await expect(saveState(page)).toHaveText('Saved');
	await page.reload();
	await expect(dialogue).toHaveValue('Keep the channel alive.');
	await expect(saveState(page)).toHaveText('Saved');
	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.reload();
	await expect(page.getByRole('heading', { name: '1 screenplay change' })).toBeVisible();
	const review = page.getByLabel('Changes to review');
	await expect(review.getByText('Revise dialogue')).toBeVisible();
	await expect(review.getByText('Before')).toBeVisible();
	await expect(review.getByText('Leave the channel open.')).toBeVisible();
	await expect(review.getByText('After')).toBeVisible();
	await expect(review.getByText('Keep the channel alive.')).toBeVisible();
	await expect(review.getByText('Waiting for your review')).toBeVisible();
	const accept = page.getByRole('button', { name: 'Accept changes' });
	await expect(accept).toBeVisible();
	const acceptColors = await accept.evaluate((element) => {
		const style = getComputedStyle(element);
		return { color: style.color, backgroundColor: style.backgroundColor };
	});
	expect(acceptColors.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	expect(acceptColors.backgroundColor).not.toBe(acceptColors.color);
	await page.getByRole('button', { name: 'Reject' }).click();
	await expect(saveState(page)).toHaveText('Rejected · the screenplay is unchanged');

	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(saveState(page)).toHaveText('Changes accepted');
	await expect(dialogue).toHaveValue('Keep the channel alive.');

	await switchCut(page, 'Trailer');
	await expect(page.getByLabel('dialogue')).toHaveCount(0);
	await switchCut(page, 'Feature');
	await expect(page.getByLabel('dialogue')).toHaveValue('Keep the channel alive.');

	await page.getByRole('button', { name: 'History' }).click();
	await initialEntry(page).getByRole('button', { name: 'Restore…' }).click();
	await page.getByRole('button', { name: 'Restore this version' }).click();
	await expect(saveState(page)).toHaveText('Restored');
	await expect(historyEntries(page)).toHaveCount(3);
	await expect(page.getByLabel('dialogue')).toHaveValue('Leave the channel open.');
});

test('Retry refreshes accepted state without resending a committed acceptance', async ({
	page
}) => {
	await page.goto('/');
	const dialogue = page.getByLabel('dialogue');
	await dialogue.fill('Accepted after refresh.');
	await page.getByRole('button', { name: 'Review changes' }).click();
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
	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(saveState(page)).toContainText('Changes accepted · couldn’t refresh', {
		timeout: 15000
	});
	readsUnavailable = false;
	await retry(page);
	await expect(dialogue).toHaveValue('Accepted after refresh.');
	expect(acceptCount).toBe(1);
	expect(await historyCount(page)).toBe(historyBefore + 1);
	await page.getByRole('button', { name: 'History' }).click();
	await expect(historyEntries(page).first()).toContainText('Revised dialogue');
});

test('Retry refreshes restored editor without resending a committed restore', async ({ page }) => {
	await page.goto('/');
	const dialogue = page.getByLabel('dialogue');
	const original = 'Leave the channel open.';
	await dialogue.fill('A different version for restore.');
	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(dialogue).toHaveValue('A different version for restore.');
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
	await expect(dialogue).toHaveValue(original);
	expect(restoreCount).toBe(1);
	expect(await historyCount(page)).toBe(historyBefore + 1);
});

test('keeps unsaved editor text through exhausted retries and saves on Retry', async ({ page }) => {
	await page.goto('/');
	const dialogue = page.getByLabel('dialogue');
	await expect(dialogue).toBeVisible();
	const text = `${await dialogue.inputValue()} Still here.`;
	await dialogue.fill(text);
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
	await save(page);
	await expect(saveState(page)).toContainText('Not saved', { timeout: 15_000 });
	await expect(dialogue).toHaveValue(text);
	unavailable = false;
	await retry(page);
	await expect(saveState(page)).toHaveText('Saved');
	await expect(dialogue).toHaveValue(text);
	await expect(saveState(page).getByRole('button', { name: 'Retry' })).toHaveCount(0);
});
