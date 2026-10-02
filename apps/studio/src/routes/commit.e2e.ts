import { expect, test, type Page } from '@playwright/test';
import { commit, commitCard, el, historyEntries, saved, saveState } from './studio-e2e';

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

	/* The change is also shown where it lives, and the list jumps to it. */
	const page_ = first.getByLabel('Screenplay', { exact: true });
	const tracked = page_.locator('[data-change="revised"][data-kind="dialogue"]');
	await expect(tracked.locator('ins')).not.toHaveCount(0);
	await expect(first.getByRole('textbox', { name: 'Screenplay text' })).toBeHidden();
	await expect(first.getByRole('button', { name: 'Commit changes' })).toHaveCount(0);
	await review.getByRole('button', { name: 'Revise dialogue' }).click();
	await expect(tracked).toBeFocused();
	/* Closing the review returns to the editor with the author's text. */
	await review.getByRole('button', { name: 'Close' }).click();
	await expect(first.getByRole('textbox', { name: 'Screenplay text' })).toBeVisible();
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

test('a commit can carry a note, written in the commit card and shown in History', async ({
	page
}) => {
	await open(page);
	if (await page.getByRole('button', { name: 'Commit changes' }).count()) await commit(page);
	const note = `Mara holds the line ${Date.now()}`;
	await el(page, 'dialogue').fill(`Hold the channel ${Date.now()}.`);
	/* The note field takes focus; Enter commits, with or without a note. */
	await page.getByRole('button', { name: 'Commit changes' }).click();
	const field = commitCard(page).getByRole('textbox', { name: 'Note (optional)' });
	await expect(field).toBeFocused();
	await page.keyboard.type(note);
	await expect(field).toHaveValue(note);
	await page.keyboard.press('Enter');
	await expect(saveState(page)).toHaveText('Committed');

	await el(page, 'dialogue').fill(`Without a note ${Date.now()}.`);
	await page.getByRole('button', { name: 'Commit changes' }).click();
	await expect(field).toBeFocused();
	await expect(field).toHaveValue('');
	await page.keyboard.press('Enter');
	await expect(saveState(page)).toHaveText('Committed');

	await page.getByRole('button', { name: 'History' }).click();
	const [latest, noted] = [historyEntries(page).nth(0), historyEntries(page).nth(1)];
	await expect(latest).toContainText('Revised dialogue');
	await expect(latest).not.toContainText(note);
	await expect(noted.locator('.entry-note')).toHaveText(note);
	await expect(noted).toContainText('Revised dialogue');

	/* A restore can carry one too. */
	await noted.getByRole('button', { name: 'Preview' }).click();
	const preview = page.getByLabel('Restore preview');
	await preview.getByRole('textbox', { name: 'Note (optional)' }).fill('Back to the held line');
	await preview.getByRole('button', { name: 'Restore this version' }).click();
	await expect(saveState(page)).toHaveText('Restored');
	await expect(historyEntries(page).first().locator('.entry-note')).toHaveText(
		'Back to the held line'
	);
	await expect(historyEntries(page).first()).toContainText('Restored an earlier version');
});
