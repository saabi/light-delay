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
	await expect(page.getByText('Draft saved in this Studio process', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Review changes' }).click();
	await expect(page.getByRole('heading', { name: '1 screenplay change' })).toBeVisible();
	await expect(page.getByText('Proposal ready for review — not yet accepted')).toBeVisible();
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
