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
	await expect(page.getByText('Hard science-fiction short film · In development')).toBeVisible();
	await expect(
		page.getByText(
			'Light Delay is a first-contact thriller about a crew crossing an interstellar gateway and a warning that can only catch them by traveling at the speed of light.'
		)
	).toBeVisible();
	await expect(
		page.getByText(
			"A human mission approaches an unrepeatable encounter. When an engineer discovers sabotage and internal communications fail, she must aim the ship's external laser at its future trajectory before the saboteur reaches her."
		)
	).toBeVisible();
	await expect(page.getByText('17 scenes from the main short film.')).toBeVisible();
	const archiveCard = page.locator('.cards a').filter({
		has: page.getByRole('heading', { name: 'Project archive' })
	});
	await expect(archiveCard.locator('b')).toHaveText('Open →');
	await expect(page.getByRole('link', { name: 'Read the script' })).toBeVisible();
});

test('Spanish landing is prerendered and localized', async ({ page }) => {
	await page.goto('/es/');
	await expect(
		page.getByRole('heading', { name: 'Un mensaje dirigido a donde la nave todavía no llegó.' })
	).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	await expect(
		page.getByText('Cortometraje de ciencia ficción dura · En desarrollo')
	).toBeVisible();
	await expect(
		page.getByText(
			'Una misión humana se aproxima a un encuentro irrepetible. Cuando una ingeniera descubre un sabotaje y las comunicaciones internas fallan, debe apuntar el láser exterior de la nave a su trayectoria futura antes de que el saboteador la alcance.'
		)
	).toBeVisible();
	await expect(page.getByText('17 escenas del cortometraje principal.')).toBeVisible();
	const archiveCard = page.locator('.cards a').filter({
		has: page.getByRole('heading', { name: 'Archivo del proyecto' })
	});
	await expect(archiveCard.locator('b')).toHaveText('Abrir →');
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

test('master narrative exposes its framing and keeps implementation empty', async ({ page }) => {
	await page.goto('/outline/script~light-delay-master-narrative');
	await expect(
		page.getByRole('heading', {
			name: 'Outline — Light Delay: unconstrained master narrative (WIP)'
		})
	).toBeVisible();
	await expect(
		page.getByText(
			'This master narrative is a non-canonical development branch. Its plot has not been adopted by any of the four existing versions.'
		)
	).toBeVisible();
	await expect(page.getByText('Purpose of this document', { exact: true })).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Sequence G — First contact and close' })
	).toBeVisible();
	await expect(page.getByRole('heading', { name: 'G3 — Close' })).toBeVisible();

	await page.goto('/script/script~light-delay-master-narrative');
	await expect(
		page.getByRole('heading', { name: 'Screenplay implementation has not started yet.' })
	).toBeVisible();
});

test('screenplay content defaults to the route language and preserves a manual choice', async ({
	page
}) => {
	await page.goto('/script/script~light-delay-main-short');
	await expect(
		page.getByRole('heading', { name: 'Light Delay — Short Film Screenplay' }).first()
	).toBeVisible();
	await expect(page.getByText('Boarding and transit', { exact: true })).toBeVisible();
	await expect(
		page.getByText('The signature looks forged. The real signature points to—', { exact: true })
	).toBeVisible();

	await page.getByLabel('Story and dialogue').selectOption('es');
	await expect(page.getByText('Embarque y tránsito', { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByText('Embarque y tránsito', { exact: true })).toBeVisible();

	await page.evaluate(() => localStorage.removeItem('light-delay.language'));
	await page.goto('/es/script/script~light-delay-main-short');
	await expect(page.getByText('Embarque y tránsito', { exact: true })).toBeVisible();
});

test('English public document stubs expose their draft variants', async ({ page }) => {
	await page.goto('/documents/canon-decisions');
	await expect(page.getByRole('heading', { name: 'Canon decisions' })).toBeVisible();
	await expect(page.getByText('Canonical source', { exact: true })).toBeVisible();
	await expect(page.getByText('English translation under review', { exact: true })).toBeVisible();
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
