import { expect, test } from '@playwright/test';

const IMAGE = '/generation/image/script~light-delay-festival-master';
const AUDIO = '/generation/audio/script~light-delay-festival-master';

test('unknown generation script returns a localized 404', async ({ page }) => {
	const response = await page.goto('/generation/image/script~does-not-exist');
	expect(response?.status()).toBe(404);
	await expect(page.getByText('Script not found.')).toBeVisible();
});

test('a registered script without a plan shows the empty-plan state', async ({ page }) => {
	await page.goto('/generation/image/script~light-delay-master-narrative');
	await expect(page.getByRole('heading', { name: 'Image generation packages' })).toBeVisible();
	await expect(page.getByText('No generation plan for this script.')).toBeVisible();
});

test('package filter query survives a medium tab change', async ({ page }) => {
	await page.goto(`${IMAGE}?filter=blocked`);
	await expect(page.getByRole('button', { name: 'Blocked' })).toBeVisible();
	await page.getByRole('link', { name: 'Video', exact: true }).click();
	await expect(page).toHaveURL(/\/generation\/video\/script~light-delay-festival-master\/?.*filter=blocked/);
	await expect(page.getByRole('heading', { name: 'Video generation packages' })).toBeVisible();
});

test('expand all opens groups first, then packages; collapse all reverses that', async ({ page }) => {
	await page.goto(IMAGE);
	const expandAll = page.locator('[data-generation-expand-all]');
	const collapseAll = page.locator('[data-generation-collapse-all]');
	const groups = page.locator('[data-generation-group]');
	const packages = page.locator('[data-generation-package]');
	await expect(groups).not.toHaveCount(0);
	await expect(packages).not.toHaveCount(0);

	await expandAll.click();
	for (const group of await groups.all()) {
		await expect(group).toHaveAttribute('aria-expanded', 'true');
	}
	for (const pkg of await packages.all()) {
		await expect(pkg).toHaveAttribute('aria-expanded', 'false');
	}

	await expandAll.click();
	for (const pkg of await packages.all()) {
		await expect(pkg).toHaveAttribute('aria-expanded', 'true');
	}

	await collapseAll.click();
	for (const pkg of await packages.all()) {
		await expect(pkg).toHaveAttribute('aria-expanded', 'false');
	}
	for (const group of await groups.all()) {
		await expect(group).toHaveAttribute('aria-expanded', 'true');
	}

	await collapseAll.click();
	for (const group of await groups.all()) {
		await expect(group).toHaveAttribute('aria-expanded', 'false');
	}
});

test('copy prompt and manifest download work from an expanded package', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto(IMAGE);
	const card = page.locator('[data-generation-package]').first();
	await card.click();
	await expect(page.getByRole('button', { name: 'Copy prompt' })).toBeVisible();
	await page.getByRole('button', { name: 'Copy prompt' }).click();
	await expect(page.getByRole('button', { name: 'Prompt copied' })).toBeVisible();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied.length).toBeGreaterThan(0);

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download prompt and reference manifest' }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(/-manifest\.json$/);
});

test('review-pending outputs and current refs are labeled on independent stills', async ({ page }) => {
	await page.goto(IMAGE);
	await expect(page.getByText('Review pending').first()).toBeVisible();
	await expect(page.getByText('Refs ready').first()).toBeVisible();
	await page.locator('[data-generation-expand-all]').click();
	await page.getByRole('heading', { name: 'festival-master:shot-plan-016b' }).click();
	await expect(page.getByText('Can generate').first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Visual continuity references' })).toBeVisible();
});

test('audio packages split text readiness from voice-sample blockers', async ({ page }) => {
	await page.goto(AUDIO);
	await expect(page.getByText('Text ready').first()).toBeVisible();
	await page.locator('[data-generation-package]').first().click();
	await expect(page.getByRole('heading', { name: 'Voice samples' })).toBeVisible();
	await page.goto(`${AUDIO}?filter=blocked`);
	const missingSample = page.getByText('Required voice sample is missing');
	if ((await missingSample.count()) > 0) {
		await expect(missingSample.first()).toBeVisible();
		await expect(page.getByText('Cannot generate').first()).toBeVisible();
	}
});
