import { expect, test } from '@playwright/test';

test('home page loads and lists scripts', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /Light Delay/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /Guion/i }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Animatic/i }).first()).toBeVisible();
	await expect(page.getByRole('heading', { name: /Scripts \/ cuts/i })).toBeVisible();
});

test('/script redirects to encoded canonical script', async ({ page }) => {
	await page.goto('/script');
	await expect(page).toHaveURL(/\/script\/script~light-delay-main-short\/?$/);
	await expect(page.getByRole('heading', { name: /Guion|Light Delay/i }).first()).toBeVisible();
});

test('festival script page loads with function assignments', async ({ page }) => {
	await page.goto('/script/script~light-delay-festival');
	await expect(page.getByRole('heading', { name: /Festival Cut/i }).first()).toBeVisible();
	await expect(page.getByRole('heading', { name: /Funciones narrativas/i })).toBeVisible();
});

test('/animatic redirects and is scoped by scriptId', async ({ page }) => {
	await page.goto('/animatic');
	await expect(page).toHaveURL(/\/animatic\/script~light-delay-main-short\/?$/);
	await expect(page.getByRole('heading', { name: /Light Delay/i }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Modo película/i })).toBeVisible();
});

test('festival animatic page loads (draft, empty shots)', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-festival');
	await expect(page.getByRole('heading', { name: /Festival Cut/i }).first()).toBeVisible();
});

test('script switcher from home opens chosen script', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel('Seleccionar guion o cut').selectOption('script:light-delay-festival');
	await expect(page).toHaveURL(/\/script\/script~light-delay-festival\/?$/);
});

test('script switcher keeps animatic section', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short');
	await page.getByLabel('Seleccionar guion o cut').selectOption('script:light-delay-festival');
	await expect(page).toHaveURL(/\/animatic\/script~light-delay-festival\/?$/);
});

test('trailer animatic reuses main frames', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-trailer');
	await expect(page.getByRole('heading', { name: /Tráiler|Light Delay/i }).first()).toBeVisible();
	await expect(page.locator('img').first()).toBeVisible();
});

test('movie player chrome matches legacy layout', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short/player');
	await expect(page.getByLabel('Reproductor del animatic')).toBeVisible();
	await expect(page.getByText(/ESCENA \d+ · TOMA \d+/i).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Reproducir o pausar' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Pantalla completa' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Editar tiempos' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Detalles de la toma' })).toBeVisible();
	await expect(page.locator('.movie-stage img, .movie-stage .missing').first()).toBeVisible();
});

test('shot details open by click and with the D shortcut', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short/player');
	await page.getByRole('button', { name: 'Reproducir o pausar' }).click();
	const toggle = page.getByRole('button', { name: 'Detalles de la toma' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByRole('heading', { name: 'Identidad y tiempo' })).toBeVisible();
	await page.keyboard.press('d');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('D');
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('provisional frames expose their source and details update with navigation', async ({
	page
}) => {
	await page.goto('/animatic/script~light-delay-main-short/player?shot=main%3Ashot-05-07');
	await page.getByRole('button', { name: 'Reproducir o pausar' }).click();
	await expect(page.getByText('PLACEHOLDER')).toBeVisible();
	await expect(page.getByText('Origen: main:shot-12-08')).toBeVisible();
	await page.getByRole('button', { name: 'Detalles de la toma' }).click();
	await expect(page.getByText('main:shot-05-07', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('needs_replacement', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Toma siguiente' }).click();
	await expect(page.getByText('main:shot-05-08', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Detalles de la toma' })).toHaveAttribute(
		'aria-expanded',
		'true'
	);
});

test('a failed shot image falls back to the generated missing-frame slate', async ({ page }) => {
	await page.route('**/assets/animatic/frames/scene-01/shot-02.png', (route) => route.abort());
	await page.goto('/animatic/script~light-delay-main-short/player?shot=main%3Ashot-01-02');
	await page.getByRole('button', { name: 'Reproducir o pausar' }).click();
	await expect(page.getByText('IMAGEN PENDIENTE')).toBeVisible();
	await expect(page.getByText('No se pudo cargar la imagen asignada')).toBeVisible();
	await expect(page.locator('img[src*="placeholder-missing-frame.png"]')).toBeVisible();
});

test('shot details remain scrollable on a mobile viewport', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/animatic/script~light-delay-main-short/player');
	await page.getByRole('button', { name: 'Reproducir o pausar' }).click();
	await page.getByRole('button', { name: 'Detalles de la toma' }).click();
	const body = page.locator('#shot-details-body');
	await expect(body).toBeVisible();
	await expect(page.getByRole('button', { name: 'Pantalla completa' })).toBeVisible();
	expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
});

test('returning from Movie mode restores the selected editor shot', async ({ page }) => {
	await page.goto('/animatic/script~light-delay-main-short/player');
	await page.getByRole('button', { name: 'Toma siguiente' }).click();
	await page.getByRole('link', { name: 'Editar tiempos' }).click();
	await expect(page).toHaveURL(/\?shot=main%3Ashot-01-02$/);
	const selectedCard = page.locator('article[id="main:shot-01-02"]');
	await expect(selectedCard).toBeInViewport();
	await expect(selectedCard).toBeFocused();
});

test('comparison route compares registered scripts and preserves selection', async ({ page }) => {
	await page.goto('/compare/script~light-delay-main-short?against=script%3Alight-delay-festival');
	await expect(page.getByRole('heading', { name: /Guion corto.*Festival Cut/i })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Canon' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Eventos principales' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Reparto' })).toBeVisible();
	await page.getByLabel('Comparar con otro guion').selectOption('script:light-delay-trailer');
	await expect(page).toHaveURL(/against=script%3Alight-delay-trailer/);
});
