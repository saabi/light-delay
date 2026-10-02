import { expect, test, type Page } from '@playwright/test';

type Value = {
	classes: string;
	capacityBox: { width: number; height: number };
	glyph: { width: number; height: number };
	text: { maxChars: number; maxLines: number };
	sizes: Record<'xSmall' | 'small' | 'medium' | 'large' | 'xLarge', boolean>;
	orientations: Record<
		'textLandscape' | 'textPortrait' | 'pixelLandscape' | 'pixelPortrait',
		boolean
	>;
};

const read = (page: Page, name: string) =>
	page.evaluate(
		(key) => (window as unknown as Record<string, unknown>)[`__${key}`],
		name
	) as Promise<Value>;
const updates = (page: Page, name: string) =>
	page.evaluate(
		(key) => (window as unknown as Record<string, unknown>)[`__${key}Updates`],
		name
	) as Promise<number>;

/* Headless Chromium hides scrollbars by default; the scrollbar case needs real ones. Scoped to this
   file because the demo scenarios are calibrated against the default (scrollbar-free) viewport. */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
test.use({
	launchOptions: {
		...(executablePath ? { executablePath } : {}),
		ignoreDefaultArgs: ['--hide-scrollbars']
	}
});

const warnings: string[] = [];
test.beforeEach(async ({ page }) => {
	warnings.length = 0;
	page.on('console', (message) => {
		if (message.type() === 'warning') warnings.push(message.text());
	});
	await page.goto('/fixtures');
	await page.evaluate(() => document.fonts.ready);
	await expect
		.poll(async () => (await read(page, 'flags'))?.text?.maxChars ?? 0)
		.toBeGreaterThan(0);
});

test('excludes a visible scrollbar from capacity', async ({ page }) => {
	const expected = await page.locator('.fixture-scroll').evaluate((node) => {
		const el = node as HTMLElement;
		const cs = getComputedStyle(el);
		const scrollbar = el.offsetWidth - el.clientWidth - 2 * parseFloat(cs.borderLeftWidth);
		return { width: el.clientWidth - 40, scrollbar };
	});
	expect(expected.scrollbar).toBe(15);
	// 400 border box − 6 border − 40 padding − 15 scrollbar; the 30px margins never count.
	await expect.poll(async () => (await read(page, 'scroll')).capacityBox.width).toBe(339);
	expect(expected.width).toBe(339);
});

test('derives size flags, classes and orientations from measured capacity', async ({ page }) => {
	for (const [width, height] of [
		[200, 100],
		[900, 100],
		[1400, 100],
		[1800, 100],
		[2400, 100],
		[300, 900]
	]) {
		await page.evaluate(
			([w, h]) =>
				(
					window as unknown as { __setFlagsSize: (width: number, height: number) => void }
				).__setFlagsSize(w, h),
			[width, height]
		);
		await expect
			.poll(async () => (await read(page, 'flags')).capacityBox.width)
			.toBeCloseTo(width, 0);
		const value = await read(page, 'flags');
		const { maxChars, maxLines } = value.text;
		expect(value.sizes).toEqual({
			xSmall: maxChars < 45,
			small: true,
			medium: maxChars >= 90,
			large: maxChars >= 135,
			xLarge: maxChars >= 180
		});
		expect(value.orientations.textLandscape).toBe(maxChars / maxLines >= 1);
		expect(value.orientations.pixelLandscape).toBe(width / height >= 1);
		for (const [flag, on] of Object.entries({ ...value.sizes, ...value.orientations }))
			expect(value.classes.split(' ').includes(flag)).toBe(on);
	}
});

test('warns once when a content-sized container oscillates, and not when it is contained', async ({
	page
}) => {
	await page.goto('/fixtures?oscillate');
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(1500);
	const oscillation = warnings.filter((text) => text.includes('oscillating'));
	expect(oscillation).toHaveLength(1);
	expect(oscillation[0]).toContain('layout-determined size');

	const before = await updates(page, 'contained');
	await page.waitForTimeout(500);
	expect(await updates(page, 'contained')).toBe(before);
});

test('does not publish a new value when nothing changed', async ({ page }) => {
	const before = await updates(page, 'flags');
	await page.waitForTimeout(500);
	expect(await updates(page, 'flags')).toBe(before);
});

test('rejects invalid breakpoints with one warning and uses the defaults', async ({ page }) => {
	const value = await read(page, 'invalid');
	expect(value.sizes.xSmall).toBe(value.text.maxChars < 45);
	expect(value.sizes.medium).toBe(value.text.maxChars >= 90);
	expect(warnings.filter((text) => text.includes('`breakpoints`'))).toHaveLength(1);
});
