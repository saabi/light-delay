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
	await expect(page.getByText('Detalles de la toma')).toBeVisible();
	await expect(page.locator('.movie-stage img, .movie-stage .missing').first()).toBeVisible();
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
