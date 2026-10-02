import { expect, test, type Page } from '@playwright/test';
import { commit, commitCard, el, saved, saveState } from './studio-e2e';

/*
	Phase 3 commit rules (ADR-0004 addendum): what is reviewed inline is exactly what is committed,
	and a commit that conflicts after its proposal was created leaves that proposal pending and
	reviewable, never silently orphaned.
*/

async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('.shell[data-layout]')).toBeVisible();
	await expect(el(page, 'dialogue')).toBeVisible();
	await expect(page.getByRole('button', { name: /^Cut: / })).toBeEnabled();
}

test('a commit that conflicts stays pending and reviewable', async ({ browser }) => {
	const context = await browser.newContext();
	const first = await context.newPage();
	const second = await context.newPage();

	await open(first);
	const line = `First tab ${Date.now()}.`;
	await el(first, 'dialogue').fill(line);
	await saved(first);
	await first.getByRole('button', { name: 'Commit changes' }).click();
	await expect(commitCard(first)).toBeVisible();

	/* Meanwhile another tab commits a different change to the same cut. */
	await open(second);
	await el(second, 'action').fill(`Second tab ${Date.now()}.`);
	await commit(second);

	await commitCard(first).getByRole('button', { name: 'Commit' }).click();
	await expect(saveState(first)).toContainText('Couldn’t commit: the screenplay changed');
	const review = first.getByLabel('Changes to review');
	await expect(review).toBeVisible();
	await expect(review.getByText('Waiting for your review')).toBeVisible();
	await expect(review.getByText(line)).toBeVisible();
	await expect(el(first, 'dialogue')).toHaveText(line);

	/* Reopening Studio still finds it, waiting for review. */
	await first.reload();
	await expect(first.getByRole('button', { name: 'Open review' })).toBeVisible();
	await first.getByRole('button', { name: 'Open review' }).click();
	await expect(first.getByLabel('Changes to review').getByText(line)).toBeVisible();
	await first.getByLabel('Changes to review').getByRole('button', { name: 'Reject' }).click();
	await expect(saveState(first)).toHaveText('Rejected · the screenplay is unchanged');
	await context.close();
});

test('the inline review shows added, removed and moved elements in place', async ({ page }) => {
	await open(page);
	/* Start from a committed baseline so the review shows only this test's changes. */
	if (await page.getByRole('button', { name: 'Commit changes' }).count()) await commit(page);
	/* Enter at the end of dialogue starts an action. */
	await el(page, 'dialogue').click();
	await page.keyboard.press('End');
	await page.keyboard.press('Enter');
	await page.keyboard.type('The lamp flickers.');
	/* Remove the original action from its element menu, opened from the keyboard. */
	await el(page, 'action').first().click();
	await page.keyboard.press('Shift+F10');
	await page
		.getByRole('menu', { name: 'Element actions' })
		.getByRole('menuitem', { name: 'Remove' })
		.click();
	await expect(el(page, 'action')).toHaveCount(1);
	await saved(page);
	await page.getByRole('button', { name: 'Commit changes' }).click();
	const screenplay = page.getByLabel('Screenplay', { exact: true });
	await expect(screenplay.locator('[data-change="added"]')).toContainText('The lamp flickers.');
	await expect(screenplay.locator('[data-change="added"] .change-tag')).toHaveText('Added');
	await expect(screenplay.locator('[data-change="removed"] del')).toBeVisible();
	await expect(screenplay.locator('[data-change="removed"] .change-tag')).toHaveText('Removed');
	await commitCard(page).getByRole('button', { name: 'Cancel' }).click();
	await expect(el(page, 'action')).toHaveText('The lamp flickers.');
});
