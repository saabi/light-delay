import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /Light Delay/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /Guion/i }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Animatic/i }).first()).toBeVisible();
});

test('script page loads', async ({ page }) => {
	await page.goto('/script');
	await expect(page.getByRole('heading', { name: /Guion/i }).first()).toBeVisible();
});

test('animatic page loads', async ({ page }) => {
	await page.goto('/animatic');
	await expect(page.getByRole('heading', { name: /Desglose de tomas/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /Modo película/i })).toBeVisible();
});
