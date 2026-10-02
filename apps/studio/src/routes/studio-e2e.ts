import { expect, type Page } from '@playwright/test';

/* Shared selectors for the Studio Write browser tests. */

export const saveState = (page: Page) => page.getByRole('status');

export async function switchCut(page: Page, label: 'Feature' | 'Trailer') {
	await page.getByRole('button', { name: /^Cut: / }).click();
	await page.getByRole('menuitemradio', { name: label }).click();
	await expect(page.getByRole('button', { name: `Cut: ${label}` })).toBeVisible();
}

/* Typing autosaves; this waits until the save state confirms it. */
export async function saved(page: Page) {
	await expect(saveState(page)).toHaveText('Saved');
}

export const commitCard = (page: Page) => page.getByRole('dialog', { name: 'Commit changes' });

/* Commit the current edits through the inline review. */
export async function commit(page: Page) {
	await page.getByRole('button', { name: 'Commit changes' }).click();
	await commitCard(page).getByRole('button', { name: 'Commit' }).click();
	await expect(saveState(page)).toHaveText('Committed');
}

export async function proposalCount(page: Page) {
	return page.evaluate(async () => {
		const response = await fetch('/api/authoring', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ method: 'listProposals', args: ['project:harbor-light'] })
		});
		return (await response.json()).length as number;
	});
}

export async function retry(page: Page) {
	await saveState(page).getByRole('button', { name: 'Retry' }).click();
}

export const historyEntries = (page: Page) => page.getByLabel('History').getByRole('listitem');
export const initialEntry = (page: Page) =>
	historyEntries(page).filter({ hasText: 'Initial screenplay' });
