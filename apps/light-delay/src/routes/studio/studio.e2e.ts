import { expect, test } from '@playwright/test';

test('production preview does not advertise Studio', async ({ page }) => {
	await page.goto('/');
	const button = page.getByRole('button', { name: /Open menu|Abrir menú/i });
	if (await button.isVisible()) await button.click();
	await expect(page.getByRole('link', { name: /^Studio$/ })).toHaveCount(0);
});

test('studio fallback is generic and hides worker paths', async ({ page }) => {
	await page.goto('/studio/');
	await expect(page.getByRole('heading', { name: /Local tool unavailable|Herramienta local no disponible/i })).toBeVisible();
	await expect(page.getByText(/E:\\Models|127\.0\.0\.1:8765|\/v1\/imitation/i)).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^Studio$/ })).toHaveCount(0);
});
