import { expect, test, type Page } from '@playwright/test';
import { layoutFor, type LayoutId } from '../lib/layout';
import { el } from './studio-e2e';

/* Readability preferences (STUDIO_DESIGN_SYSTEM.md § Readability preferences). */

async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('.shell[data-layout]')).toBeVisible();
	await expect(el(page, 'dialogue')).toBeVisible();
}

async function openPanel(page: Page) {
	await page.getByRole('button', { name: 'Readability' }).click();
	const panel = page.getByRole('dialog', { name: 'Readability' });
	await expect(panel).toBeVisible();
	return panel;
}

const rootStyle = (page: Page, property: string) =>
	page.evaluate(
		(name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
		property
	);

async function layoutState(page: Page) {
	return page.locator('.shell').evaluate((node) => {
		const [maxChars, maxLines] = (node.getAttribute('data-capacity') ?? '0x0')
			.split('x')
			.map(Number);
		return {
			layout: node.getAttribute('data-layout') as LayoutId,
			maxChars,
			maxLines,
			pixelLandscape: innerWidth >= innerHeight
		};
	});
}

test('the panel opens on the current choices, closes with Escape and returns focus', async ({
	page
}) => {
	await open(page);
	const panel = await openPanel(page);
	await expect(panel.getByRole('radio', { name: '100%' })).toBeFocused();
	await expect(panel.getByRole('radio', { name: 'Normal' })).toBeChecked();
	await expect(panel.getByRole('radio', { name: '145%' })).toBeChecked();
	await expect(panel.getByRole('radio', { name: 'Inter' })).toBeChecked();
	await page.keyboard.press('Escape');
	await expect(panel).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Readability' })).toBeFocused();
});

test('text size scales the interface, steps the layout and is applied before first paint', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 860 });
	await open(page);
	const before = await layoutState(page);
	const panel = await openPanel(page);
	await panel.getByRole('radio', { name: '150%' }).check();
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize))
		.toBe('24px');
	await expect.poll(async () => (await layoutState(page)).maxChars).toBeLessThan(before.maxChars);
	const after = await layoutState(page);
	expect(after.layout).toBe(layoutFor(after));

	/* With every script file blocked, only the inline head script can apply the stored scale. */
	await page.route('**/*.js', (route) => route.abort());
	await page.reload();
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(
		'24px'
	);
});

test('secondary contrast strengthens muted text, and follows the system when unset', async ({
	page
}) => {
	await open(page);
	expect(await rootStyle(page, '--studio-text-muted')).toBe('#666661');
	const panel = await openPanel(page);
	await panel.getByRole('radio', { name: 'High' }).check();
	await expect.poll(() => rootStyle(page, '--studio-text-muted')).toBe('#45453f');
	await panel.getByRole('radio', { name: 'Maximum' }).check();
	await expect.poll(() => rootStyle(page, '--studio-text-muted')).toBe('#202124');
	await panel.getByRole('button', { name: 'Reset to defaults' }).click();
	await expect.poll(() => rootStyle(page, '--studio-text-muted')).toBe('#666661');

	await page.emulateMedia({ contrast: 'more' });
	await expect.poll(() => rootStyle(page, '--studio-text-muted')).toBe('#45453f');
	await expect(panel.getByRole('radio', { name: 'High' })).toBeChecked();
});

test('line spacing applies to the interface but not to the screenplay page', async ({ page }) => {
	await open(page);
	const panel = await openPanel(page);
	await panel.getByRole('radio', { name: '185%' }).check();
	const lineHeights = await page.evaluate(() => {
		const ratio = (node: Element) => {
			const style = getComputedStyle(node);
			return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
		};
		return {
			bar: ratio(document.querySelector('.save-state')!),
			screenplay: ratio(document.querySelector('.screenplay-editor .el')!)
		};
	});
	expect(lineHeights.bar).toBeCloseTo(1.85, 2);
	expect(lineHeights.screenplay).toBeCloseTo(1, 2);
});

test('a reading-support face loads from Studio, re-measures the layout and spares the page', async ({
	page
}) => {
	const fontRequests: string[] = [];
	page.on('request', (request) => {
		if (request.resourceType() === 'font') fontRequests.push(request.url());
	});
	await page.setViewportSize({ width: 1280, height: 860 });
	await open(page);
	const before = await layoutState(page);
	const panel = await openPanel(page);
	await panel.getByRole('radio', { name: 'OpenDyslexic' }).check();
	await expect
		.poll(() =>
			page.evaluate(() =>
				[...document.fonts].some(
					(face) => face.family.replaceAll('"', '') === 'OpenDyslexic' && face.status === 'loaded'
				)
			)
		)
		.toBe(true);
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily))
		.toMatch(/^"?OpenDyslexic/);
	/* OpenDyslexic is wider than Inter, so fewer characters fit and the sensor reports it. */
	await expect.poll(async () => (await layoutState(page)).maxChars).toBeLessThan(before.maxChars);
	const after = await layoutState(page);
	expect(after.layout).toBe(layoutFor(after));
	expect(await el(page, 'dialogue').evaluate((node) => getComputedStyle(node).fontFamily)).toMatch(
		/^"?Courier Prime/
	);
	const origin = new URL(page.url()).origin;
	expect(fontRequests.some((url) => url.includes('opendyslexic'))).toBe(true);
	for (const url of fontRequests) {
		expect(new URL(url).origin).toBe(origin);
		expect(url.endsWith('.woff2')).toBe(true);
	}

	await page.reload();
	await expect(page.locator('.shell[data-layout]')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.dataset.face)).toBe('opendyslexic');
});

test('reset returns to the defaults and forgets the stored choice', async ({ page }) => {
	await open(page);
	const panel = await openPanel(page);
	await panel
		.getByRole('group', { name: 'Text size' })
		.getByRole('radio', { name: '125%' })
		.check();
	await panel.getByRole('radio', { name: 'Atkinson Hyperlegible' }).check();
	await panel.getByRole('button', { name: 'Reset to defaults' }).click();
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(
		'16px'
	);
	expect(await page.evaluate(() => document.documentElement.dataset.face)).toBeUndefined();
	expect(await page.evaluate(() => localStorage.getItem('studio.readability.v1'))).toBeNull();
});

test('at the largest text size (200%) on a phone, the panel stays readable and on screen', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await open(page);
	const panel = await openPanel(page);
	await panel.getByRole('radio', { name: '200%' }).check();
	const box = (await panel.boundingBox())!;
	expect(box.x).toBeGreaterThanOrEqual(0);
	expect(box.x + box.width).toBeLessThanOrEqual(390);
	const bar = await page
		.locator('.app-bar')
		.evaluate((node) => node.scrollWidth - node.clientWidth);
	expect(bar).toBeLessThanOrEqual(0);
});
