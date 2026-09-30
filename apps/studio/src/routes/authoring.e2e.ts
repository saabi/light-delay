import { expect, test } from '@playwright/test';

test('saves, proposes, rejects, accepts, isolates cuts, and restores screenplay work', async ({
	page
}) => {
	await page.goto('/');
	const dialogue = page.getByLabel('dialogue');
	await expect(dialogue).toHaveValue('Leave the channel open.');
	await dialogue.fill('Keep the channel alive.');
	await expect(page.getByText('Unsaved Draft changes', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Save Draft' }).click();
	await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
	await page.reload();
	await expect(dialogue).toHaveValue('Keep the channel alive.');
	await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.reload();
	await expect(page.getByRole('heading', { name: '1 screenplay change' })).toBeVisible();
	const review = page.getByLabel('Proposal review');
	await expect(review.getByText('Revise dialogue')).toBeVisible();
	await expect(review.getByText('Before')).toBeVisible();
	await expect(review.getByText('Leave the channel open.')).toBeVisible();
	await expect(review.getByText('After')).toBeVisible();
	await expect(review.getByText('Keep the channel alive.')).toBeVisible();
	await expect(page.getByText('Proposal ready for review — not yet accepted')).toBeVisible();
	const accept = page.getByRole('button', { name: 'Accept changes' });
	await expect(accept).toBeVisible();
	const acceptColors = await accept.evaluate((element) => {
		const style = getComputedStyle(element);
		return { color: style.color, backgroundColor: style.backgroundColor };
	});
	expect(acceptColors.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	expect(acceptColors.backgroundColor).not.toBe(acceptColors.color);
	await page.getByRole('button', { name: 'Reject' }).click();
	await expect(
		page.getByText('Proposal rejected — authoritative screenplay unchanged')
	).toBeVisible();

	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(page.getByText(/Accepted into project history as revision 1/)).toBeVisible();
	await expect(dialogue).toHaveValue('Keep the channel alive.');

	await page.getByRole('button', { name: 'Trailer' }).click();
	await expect(page.getByLabel('dialogue')).toHaveCount(0);
	await page.getByRole('button', { name: 'Feature' }).click();
	await expect(page.getByLabel('dialogue')).toHaveValue('Keep the channel alive.');

	await page.getByRole('button', { name: 'History' }).click();
	await page
		.getByRole('listitem')
		.filter({ hasText: 'Initial screenplay' })
		.getByRole('button')
		.click();
	await expect(page.getByText(/Restored as new project revision 2/)).toBeVisible();
	await expect(page.getByLabel('dialogue')).toHaveValue('Leave the channel open.');
});

test('keeps unsaved editor text through exhausted retries and saves on Retry now', async ({
	page
}) => {
	await page.goto('/');
	const dialogue = page.getByLabel('dialogue');
	await expect(dialogue).toBeVisible();
	const text = `${await dialogue.inputValue()} Still here.`;
	await dialogue.fill(text);
	let unavailable = true;
	await page.route('**/api/authoring', async (route) => {
		const body = route.request().postDataJSON();
		if (unavailable && body.method === 'handle' && body.args[0].type === 'SaveDraft')
			await route.fulfill({
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'STORE_UNAVAILABLE', message: 'Database unavailable' })
			});
		else await route.continue();
	});
	await page.getByRole('button', { name: 'Save Draft' }).click();
	await expect(
		page.getByText('Database unavailable. Your unsaved work is kept in this browser.')
	).toBeVisible({ timeout: 15_000 });
	await expect(dialogue).toHaveValue(text);
	unavailable = false;
	await page.getByRole('button', { name: 'Retry now' }).click();
	await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
	await expect(dialogue).toHaveValue(text);
	await expect(page.getByRole('button', { name: 'Retry now' })).toHaveCount(0);
});
