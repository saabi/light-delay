import { expect, test } from '@playwright/test';

async function openNavigation(page: import('@playwright/test').Page) {
	const button = page.getByRole('button', { name: 'Open menu' });
	await button.click();
	await expect(page.getByRole('dialog', { name: 'Primary navigation' })).toBeVisible();
	return button;
}

test('public landing is English-first and has crawlable project links', async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('heading', { name: 'A message aimed at where the ship will be.' })
	).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('link', { name: 'Open the project archive' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Read the script' })).toBeVisible();
});

test('Spanish landing is prerendered and localized', async ({ page }) => {
	await page.goto('/es/');
	await expect(
		page.getByRole('heading', { name: 'Un mensaje dirigido al lugar donde estará la nave.' })
	).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	await expect(page.getByRole('link', { name: 'Abrir el archivo del proyecto' })).toBeVisible();
});

test('/script redirects to the encoded canonical script', async ({ page }) => {
	await page.goto('/script');
	await expect(page).toHaveURL(/\/script\/script~light-delay-main-short\/?$/);
	await expect(page.getByRole('heading', { name: /Light Delay/i }).first()).toBeVisible();
});

test('festival script exposes localized editorial labels', async ({ page }) => {
	await page.goto('/script/script~light-delay-festival');
	await expect(page.getByRole('heading', { name: /Festival Cut/i }).first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Narrative functions' })).toBeVisible();
});

test('/animatic redirects and is scoped by script ID', async ({ page }) => {
	await page.goto('/animatic');
	await expect(page).toHaveURL(/\/animatic\/script~light-delay-main-short\/?$/);
	await expect(page.getByRole('link', { name: 'Watch as film' })).toBeVisible();
});

test('script switcher preserves the current section', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short');
	await page
		.getByRole('complementary', { name: 'Primary navigation' })
		.getByLabel('Select a script or cut')
		.selectOption('script:light-delay-festival');
	await expect(page).toHaveURL(/\/animatic\/script~light-delay-festival\/?$/);
});

test('movie player exposes localized controls and detailed metadata', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short/player');
	await expect(page.getByLabel('Animatic player')).toBeVisible();
	await expect(page.getByText(/SCENE \d+ · TAKE \d+/i).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Play or pause' })).toBeVisible();
	const details = page.getByRole('button', { name: 'Shot details' });
	await details.click();
	await expect(details).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByRole('heading', { name: 'Identity and timing' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Take, image, and review' })).toBeVisible();
});

test('desktop project shell has a header and persistent rail without a hamburger', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/project');
	await expect(page.locator('.desktop-header')).toBeVisible();
	await expect(page.getByRole('complementary', { name: 'Primary navigation' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
});

test('mobile project navigation is a bottom sheet', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/project');
	await expect(page.locator('.desktop-header')).toBeHidden();
	const bar = page.locator('.mobile-bar');
	await expect(bar).toBeVisible();
	const barBox = await bar.boundingBox();
	expect(barBox).not.toBeNull();
	expect(Math.abs(barBox!.y + barBox!.height - 844)).toBeLessThanOrEqual(1);
	const button = await openNavigation(page);
	await expect(button).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Primary navigation' })).toBeHidden();
});

test('principal routes do not overflow a narrow viewport', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	const routes = [
		'/',
		'/project',
		'/script/script~light-delay-main-short',
		'/animatic/script~light-delay-main-short',
		'/art',
		'/entities/characters',
		'/documents/notas-tecnicas-continuidad',
		'/compare/script~light-delay-main-short?against=script%3Alight-delay-festival'
	];
	for (const route of routes) {
		await page.goto(route);
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
			`horizontal overflow on ${route}`
		).toBe(true);
	}
});

test('comparison route localizes the interface and preserves selection', async ({ page }) => {
	await page.goto('/compare/script~light-delay-main-short?against=script%3Alight-delay-festival');
	await expect(page.getByRole('heading', { name: 'Canon' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Main events' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Cast' })).toBeVisible();
	await page.getByLabel('Compare with another script').selectOption('script:light-delay-trailer');
	await expect(page).toHaveURL(/against=script%3Alight-delay-trailer/);
});

test('returning from Movie mode restores the selected editor shot', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short/player');
	await page.getByRole('button', { name: 'Next shot' }).click();
	await page.getByRole('link', { name: 'Edit timing' }).click();
	await expect(page).toHaveURL(/\?shot=main%3Ashot-01-02$/);
	await expect(page.locator('article[id="main:shot-01-02"]')).toBeFocused();
});
