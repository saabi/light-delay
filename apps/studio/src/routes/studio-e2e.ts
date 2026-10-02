import { expect, type Page } from '@playwright/test';

/* Shared selectors for the Studio Write browser tests. */

export const saveState = (page: Page) => page.getByRole('status');

export async function switchCut(page: Page, label: 'Feature' | 'Trailer') {
	await page.getByRole('button', { name: /^Cut: / }).click();
	await page.getByRole('menuitemradio', { name: label }).click();
	await expect(page.getByRole('button', { name: `Cut: ${label}` })).toBeVisible();
}

export async function save(page: Page) {
	await saveState(page).getByRole('button', { name: 'Save' }).click();
}

export async function retry(page: Page) {
	await saveState(page).getByRole('button', { name: 'Retry' }).click();
}

export const historyEntries = (page: Page) => page.getByLabel('History').getByRole('listitem');
export const initialEntry = (page: Page) =>
	historyEntries(page).filter({ hasText: 'Initial screenplay' });
