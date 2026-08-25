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
