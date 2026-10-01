import { expect, test, type Locator, type Page } from '@playwright/test';

const scenarioSelect = (page: Page) => page.getByLabel('Scenario', { exact: true });
const strategyWindow = (page: Page, name: string) => page.getByRole('group', { name });

async function openDemo(page: Page) {
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator('.glyph-capacity-demo')).toHaveAttribute('data-hydrated', 'true');
	await expect(page.locator('.glyph-capacity-demo')).toHaveAttribute(
		'data-active-scenario',
		'site-shell'
	);
}

async function selectScenario(page: Page, id: string) {
	await scenarioSelect(page).selectOption(id);
	await expect(page.locator('.glyph-capacity-demo')).toHaveAttribute('data-active-scenario', id);
}

async function setRegionSize(region: Locator, width: number, height: number) {
	await region.evaluate(
		(node, size) => {
			Object.assign((node as HTMLElement).style, {
				width: `${size.width}px`,
				height: `${size.height}px`,
				minHeight: '0'
			});
		},
		{ width, height }
	);
}

async function setRootFontSize(page: Page, size: number) {
	await page.getByLabel('Root font-size').evaluate((node, value) => {
		const input = node as HTMLInputElement;
		input.value = String(value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}, size);
	await expect(page.getByLabel('Root font-size')).toHaveValue(String(size));
}

async function computedPixels(locator: Locator, properties: Array<keyof CSSStyleDeclaration>) {
	return locator.evaluate((node, names) => {
		const style = getComputedStyle(node);
		return names.map((name) => Number.parseFloat(String(style[name])));
	}, properties);
}

test.beforeEach(async ({ page }) => {
	await openDemo(page);
});

test('switches all five strategies through every scenario without changing window geometry', async ({
	page
}) => {
	const windows = page.locator('.stage-window');
	await expect(windows).toHaveCount(5);
	const initialGeometry = await windows.evaluateAll((nodes) =>
		nodes.map((node) => {
			const rect = node.getBoundingClientRect();
			return [rect.left, rect.top, rect.width, rect.height];
		})
	);

	await selectScenario(page, 'adaptive-widgets');
	await expect(page.locator('[data-scenario="adaptive-widgets"]')).toHaveCount(5);
	await expect(page.locator('[data-widget]')).toHaveCount(30);
	await selectScenario(page, 'master-detail');
	await expect(page.locator('[data-scenario="master-detail"]')).toHaveCount(5);
	await selectScenario(page, 'collection');
	await expect(page.locator('[data-scenario="collection"]')).toHaveCount(5);
	await selectScenario(page, 'site-shell');
	await expect(page.locator('.panel-capacity-sensor')).toHaveCount(5);

	expect(
		await windows.evaluateAll((nodes) =>
			nodes.map((node) => {
				const rect = node.getBoundingClientRect();
				return [rect.left, rect.top, rect.width, rect.height];
			})
		)
	).toEqual(initialGeometry);
});

test('scales scenario typography and geometry with the root while keeping workbench chrome fixed', async ({
	page
}) => {
	const pxWindow = strategyWindow(page, '@container · px sandbox window');
	const firstWindow = page.locator('.stage-window').first();
	const geometry = async () =>
		firstWindow.evaluate((node) => {
			const rect = node.getBoundingClientRect();
			return [rect.width, rect.height];
		});
	const initialGeometry = await geometry();
	const chrome = pxWindow.locator('.stage-window__chrome');

	await selectScenario(page, 'adaptive-widgets');
	await setRootFontSize(page, 10);
	const widgetSmall = await computedPixels(pxWindow.locator('.widget').first(), [
		'paddingTop',
		'borderTopLeftRadius'
	]);
	const widgetHeadingSmall = await computedPixels(pxWindow.locator('.widget h2').first(), [
		'fontSize'
	]);
	await setRootFontSize(page, 20);
	const widgetLarge = await computedPixels(pxWindow.locator('.widget').first(), [
		'paddingTop',
		'borderTopLeftRadius'
	]);
	const widgetHeadingLarge = await computedPixels(pxWindow.locator('.widget h2').first(), [
		'fontSize'
	]);

	await selectScenario(page, 'master-detail');
	await setRootFontSize(page, 10);
	const masterSmall = await computedPixels(pxWindow.locator('.detail-header').first(), [
		'paddingTop'
	]);
	const masterHeadingSmall = await computedPixels(pxWindow.locator('.master-detail h2').first(), [
		'fontSize'
	]);
	await setRootFontSize(page, 20);
	const masterLarge = await computedPixels(pxWindow.locator('.detail-header').first(), [
		'paddingTop'
	]);
	const masterHeadingLarge = await computedPixels(pxWindow.locator('.master-detail h2').first(), [
		'fontSize'
	]);

	await selectScenario(page, 'collection');
	await setRootFontSize(page, 10);
	const collectionSmall = await computedPixels(pxWindow.locator('.collection').first(), [
		'paddingTop'
	]);
	const collectionHeadingSmall = await computedPixels(
		pxWindow.locator('.collection > header h2').first(),
		['fontSize']
	);
	const collectionButtonSmall = await computedPixels(
		pxWindow.locator('.item-actions button').first(),
		['minWidth', 'minHeight']
	);
	const collectionIconSmall = await computedPixels(pxWindow.locator('.item-actions svg').first(), [
		'width',
		'height'
	]);
	const chromeSmall = await computedPixels(chrome, ['fontSize', 'height']);
	await setRootFontSize(page, 20);
	const collectionLarge = await computedPixels(pxWindow.locator('.collection').first(), [
		'paddingTop'
	]);
	const collectionHeadingLarge = await computedPixels(
		pxWindow.locator('.collection > header h2').first(),
		['fontSize']
	);
	const collectionButtonLarge = await computedPixels(
		pxWindow.locator('.item-actions button').first(),
		['minWidth', 'minHeight']
	);
	const collectionIconLarge = await computedPixels(pxWindow.locator('.item-actions svg').first(), [
		'width',
		'height'
	]);
	const chromeLarge = await computedPixels(chrome, ['fontSize', 'height']);

	for (const [small, large] of [
		[widgetSmall, widgetLarge],
		[widgetHeadingSmall, widgetHeadingLarge],
		[masterSmall, masterLarge],
		[masterHeadingSmall, masterHeadingLarge],
		[collectionSmall, collectionLarge],
		[collectionHeadingSmall, collectionHeadingLarge],
		[collectionButtonSmall, collectionButtonLarge],
		[collectionIconSmall, collectionIconLarge]
	]) {
		large.forEach((value, index) => expect(value).toBeCloseTo(small[index] * 2, 4));
	}
	expect(chromeLarge).toEqual(chromeSmall);
	expect(await geometry()).toEqual(initialGeometry);

	await selectScenario(page, 'adaptive-widgets');
	await setRootFontSize(page, 28);
	await expect
		.poll(() =>
			pxWindow
				.locator('.widget-board')
				.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length)
		)
		.toBe(1);
});

test('keeps dimension sync and durable interaction sync independent', async ({ page }) => {
	await selectScenario(page, 'adaptive-widgets');
	const px = strategyWindow(page, '@container · px sandbox window');
	const sensor = strategyWindow(page, 'GlyphCapacitySensor sandbox window');
	const pxTheme = px.locator('[data-widget="choice"] select').first();
	const sensorTheme = sensor.locator('[data-widget="choice"] select').first();

	await pxTheme.selectOption('dark');
	await expect(sensorTheme).toHaveValue('dark');

	await page.getByLabel('Sync interactions').uncheck();
	await pxTheme.selectOption('light');
	await expect(pxTheme).toHaveValue('light');
	await expect(sensorTheme).toHaveValue('dark');

	await page.getByLabel('Sync interactions').check();
	await expect(sensorTheme).toHaveValue('light');
	await expect(page.getByLabel('Sync dimensions')).toBeChecked();
});

test('uses one mobile master-detail panel and synchronizes bottom-tab state', async ({ page }) => {
	await selectScenario(page, 'master-detail');
	await expect(page.locator('.bottom-tabs')).toHaveCount(5);
	await expect(
		page.locator('[data-scenario="master-detail"] > aside:not(.hidden-pane)')
	).toHaveCount(5);
	await expect(
		page.locator('[data-scenario="master-detail"] > article:not(.hidden-pane)')
	).toHaveCount(0);

	const px = strategyWindow(page, '@container · px sandbox window');
	await px.getByRole('button', { name: /Compass audit/ }).click();
	await expect(
		page.locator('[data-scenario="master-detail"] > aside:not(.hidden-pane)')
	).toHaveCount(0);
	await expect(
		page.locator('[data-scenario="master-detail"] > article:not(.hidden-pane)')
	).toHaveCount(5);
	await expect(page.getByRole('tab', { name: 'Detail' })).toHaveCount(5);
	for (const tab of await page.getByRole('tab', { name: 'Detail' }).all()) {
		await expect(tab).toHaveAttribute('aria-selected', 'true');
	}

	await strategyWindow(page, 'GlyphCapacitySensor sandbox window')
		.getByRole('tab', { name: 'Master' })
		.click();
	await expect(
		page.locator('[data-scenario="master-detail"] > aside:not(.hidden-pane)')
	).toHaveCount(5);
});

test('shows both master-detail panels when the stage has desktop capacity', async ({ page }) => {
	await page.setViewportSize({ width: 2000, height: 1200 });
	const firstWindow = page.locator('.stage-window').first();
	await firstWindow.evaluate((node) => {
		Object.assign((node as HTMLElement).style, { width: '1000px', height: '700px' });
	});
	await expect(page.locator('.stage-window__layout')).toHaveText([
		'desktop',
		'desktop',
		'desktop',
		'desktop',
		'desktop'
	]);
	await selectScenario(page, 'master-detail');
	await expect(page.locator('.bottom-tabs')).toHaveCount(0);
	await expect(page.locator('[data-scenario="master-detail"] > aside')).toHaveCount(5);
	await expect(page.locator('[data-scenario="master-detail"] > article')).toHaveCount(5);
});

test('sensor widget policies reach full, reduced, and minimal modes without losing values', async ({
	page
}) => {
	await selectScenario(page, 'adaptive-widgets');
	const sensor = strategyWindow(page, 'GlyphCapacitySensor sandbox window');
	const widgets = sensor.locator('[data-widget]');
	await expect(widgets).toHaveCount(6);

	for (const widget of await widgets.all()) {
		const region = widget.locator('..');
		await setRegionSize(region, 1000, 320);
		await expect(widget).toHaveAttribute('data-adaptive-mode', 'full');
		await setRegionSize(region, 320, 120);
		await expect(widget).toHaveAttribute('data-adaptive-mode', /reduced|minimal/);
		await setRegionSize(region, 180, 60);
		await expect(widget).toHaveAttribute('data-adaptive-mode', 'minimal');
	}

	const choice = sensor.locator('[data-widget="choice"]');
	await setRegionSize(choice.locator('..'), 1000, 320);
	await expect(choice).toHaveAttribute('data-adaptive-mode', 'full');
	await choice.locator('input[type="radio"][value="dark"]').check();
	await setRegionSize(choice.locator('..'), 180, 80);
	await expect(choice).toHaveAttribute('data-adaptive-mode', 'minimal');
	await expect(choice.locator('select').first()).toHaveValue('dark');
	await choice.getByRole('button', { name: 'Next digest frequency' }).click();
	await setRegionSize(choice.locator('..'), 1000, 320);
	await expect(choice.getByLabel('Monthly')).toBeChecked();
});

test('chrome reports the same outer layout branch applied by each strategy stage', async ({
	page
}) => {
	const windows = page.locator('.stage-window');
	for (const window of await windows.all()) {
		const badge = window.locator('.stage-window__layout');
		const stage = window.locator('.stage');
		await expect
			.poll(async () => await stage.getAttribute('data-layout'))
			.toBe(await badge.textContent());
	}

	await page.getByLabel('Window layout').selectOption('cascade');
	for (const window of await windows.all()) {
		const badge = window.locator('.stage-window__layout');
		const stage = window.locator('.stage');
		await expect
			.poll(async () => await stage.getAttribute('data-layout'))
			.toBe(await badge.textContent());
	}
});

test('hover-capable minimal toolbars expose accessible, dismissible labels and complete overflow', async ({
	page
}) => {
	await selectScenario(page, 'adaptive-widgets');
	const toolbar = strategyWindow(page, 'GlyphCapacitySensor sandbox window').locator(
		'[data-widget="toolbar"]'
	);
	await setRegionSize(toolbar.locator('..'), 180, 60);
	const save = toolbar.getByRole('button', { name: 'Save' });
	await save.hover();
	await expect(toolbar.getByRole('tooltip', { name: 'Save' })).toBeVisible();
	await save.focus();
	await save.press('Escape');
	await expect(toolbar.getByRole('tooltip', { name: 'Save' })).toHaveCount(0);
	await toolbar.getByRole('button', { name: /More/ }).click();
	await expect(toolbar.getByRole('menuitem')).toHaveCount(4);
});

test.describe('touch-first compact controls', () => {
	test.use({ hasTouch: true, isMobile: true, viewport: { width: 1200, height: 900 } });

	test('keeps labels instead of tooltip-dependent icon-only toolbar actions', async ({ page }) => {
		await selectScenario(page, 'adaptive-widgets');
		const toolbar = strategyWindow(page, 'GlyphCapacitySensor sandbox window').locator(
			'[data-widget="toolbar"]'
		);
		await setRegionSize(toolbar.locator('..'), 180, 60);
		await expect(toolbar).toHaveAttribute('data-adaptive-mode', 'minimal');
		await expect(toolbar.getByRole('button', { name: 'Save' })).toContainText('Save');
		await expect(toolbar.getByRole('button', { name: /More/ })).toContainText('More');
		await expect(toolbar.getByRole('tooltip')).toHaveCount(0);
	});
});
