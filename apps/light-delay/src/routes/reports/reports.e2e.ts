import { expect, test } from '@playwright/test';

test('reports hub loads', async ({ page }) => {
	await page.goto('/reports/');
	await expect(page.getByRole('heading', { name: /Informes|Reports/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /Tiempos de diálogo|Dialogue timing/i })).toBeVisible();
});

test('dynamic dialogue timing report loads', async ({ page }) => {
	await page.goto('/reports/');
	await page.getByRole('link', { name: /Tiempos de diálogo|Dialogue timing/i }).click();
	await expect(page.getByRole('heading', { name: /Tiempos de diálogo|Dialogue timing/i })).toBeVisible();
	await page.getByRole('link', { name: /Guion corto|Main short|30 min/i }).first().click();
	await expect(page.getByText(/Montaje|Montage/i).first()).toBeVisible();
});
