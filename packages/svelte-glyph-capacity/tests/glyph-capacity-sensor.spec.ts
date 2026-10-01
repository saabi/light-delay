import { expect, test, type Locator, type Page } from '@playwright/test';

function sensorParts(page: Page) {
	const window = page.getByRole('group', { name: 'GlyphCapacitySensor sandbox window' });
	return {
		window,
		root: window.locator('.sensor-measurer'),
		metric: window.locator('.metric-readout'),
		capacity: window.locator('.capacity-readout')
	};
}

async function numberAttribute(locator: Locator, name: string) {
	return Number(await locator.getAttribute(name));
}

async function waitForMeasurement(page: Page) {
	const parts = sensorParts(page);
	await expect.poll(() => numberAttribute(parts.capacity, 'data-max-chars')).toBeGreaterThan(0);
	await expect.poll(() => numberAttribute(parts.capacity, 'data-max-lines')).toBeGreaterThan(0);
	return parts;
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
});

test('measures the content box: borders and padding reduce capacity, margins do not', async ({
	page
}) => {
	const { root, metric, capacity } = await waitForMeasurement(page);

	await root.evaluate((node) => {
		Object.assign((node as HTMLElement).style, {
			margin: '7.5px 3.25px 5.5px 2.25px',
			borderStyle: 'solid',
			borderWidth: '2px 4px 3px 5px',
			padding: '6.5px 8.25px 9.5px 10.75px'
		});
	});

	const expected = await root.evaluate((node) => {
		const cs = getComputedStyle(node);
		const rect = node.getBoundingClientRect();
		const px = (value: string) => Number.parseFloat(value) || 0;
		return {
			width:
				rect.width -
				px(cs.borderLeftWidth) -
				px(cs.borderRightWidth) -
				px(cs.paddingLeft) -
				px(cs.paddingRight),
			height:
				rect.height -
				px(cs.borderTopWidth) -
				px(cs.borderBottomWidth) -
				px(cs.paddingTop) -
				px(cs.paddingBottom)
		};
	});

	await expect
		.poll(() => numberAttribute(metric, 'data-capacity-width'))
		.toBeCloseTo(expected.width, 4);
	await expect
		.poll(() => numberAttribute(metric, 'data-capacity-height'))
		.toBeCloseTo(expected.height, 4);

	const glyphWidth = await numberAttribute(capacity, 'data-glyph-width');
	const lineBoxHeight = await root
		.locator(':scope > .glyph-capacity-sensor-line-box')
		.evaluate((node) => node.getBoundingClientRect().height);
	expect(await numberAttribute(capacity, 'data-max-chars')).toBe(
		Math.floor(expected.width / glyphWidth)
	);
	expect(await numberAttribute(capacity, 'data-max-lines')).toBe(
		Math.floor(expected.height / lineBoxHeight)
	);

	await page.getByLabel('Sensor capacity box').selectOption('measured-box');
	await expect
		.poll(() => numberAttribute(metric, 'data-capacity-width'))
		.toBeCloseTo(await numberAttribute(metric, 'data-container-width'), 4);
	await expect
		.poll(() => numberAttribute(metric, 'data-capacity-height'))
		.toBeCloseTo(await numberAttribute(metric, 'data-container-height'), 4);

	await page.getByLabel('Sensor capacity box').selectOption('glyph-area');
	await root.evaluate((node) => {
		Object.assign((node as HTMLElement).style, {
			boxSizing: 'border-box',
			right: 'auto',
			bottom: 'auto',
			width: '80px',
			height: '80px',
			margin: '30px',
			borderWidth: '10px',
			padding: '20px'
		});
	});
	// 80px border box − 2 × 10px border − 2 × 20px padding = 20px; the 30px margin is outside it.
	await expect.poll(() => numberAttribute(metric, 'data-capacity-width')).toBe(20);
	await expect.poll(() => numberAttribute(metric, 'data-capacity-height')).toBe(20);
});

test('updates maxLines when used line-height changes without resizing the container', async ({
	page
}) => {
	const { root, metric, capacity } = await waitForMeasurement(page);
	const initialWidth = await numberAttribute(metric, 'data-container-width');
	const initialHeight = await numberAttribute(metric, 'data-container-height');

	await root.evaluate((node) => {
		(node as HTMLElement).style.lineHeight = '2.5';
	});

	const lineBox = root.locator(':scope > .glyph-capacity-sensor-line-box');
	await expect.poll(() => lineBox.evaluate((node) => node.getBoundingClientRect().height)).toBe(40);
	const capacityHeight = await numberAttribute(metric, 'data-capacity-height');
	await expect
		.poll(() => numberAttribute(capacity, 'data-max-lines'))
		.toBe(Math.floor(capacityHeight / 40));
	expect(await numberAttribute(metric, 'data-container-width')).toBeCloseTo(initialWidth, 4);
	expect(await numberAttribute(metric, 'data-container-height')).toBeCloseTo(initialHeight, 4);

	await root.evaluate((node) => {
		(node as HTMLElement).style.lineHeight = '1.1';
	});
	await expect
		.poll(() => lineBox.evaluate((node) => node.getBoundingClientRect().height))
		.toBeLessThan(40);
	const compactLineBoxHeight = await lineBox.evaluate(
		(node) => node.getBoundingClientRect().height
	);
	await expect
		.poll(() => numberAttribute(capacity, 'data-max-lines'))
		.toBe(Math.floor(capacityHeight / compactLineBoxHeight));
});

test('tracks typeface stretch and keeps panel sensors layout-neutral', async ({ page }) => {
	const { capacity } = await waitForMeasurement(page);
	const initialGlyphWidth = await numberAttribute(capacity, 'data-glyph-width');
	const initialMaxChars = await numberAttribute(capacity, 'data-max-chars');

	await page.getByLabel('Typeface').selectOption('wide');
	await expect
		.poll(() => numberAttribute(capacity, 'data-glyph-width'))
		.toBeGreaterThan(initialGlyphWidth);
	await expect
		.poll(() => numberAttribute(capacity, 'data-max-chars'))
		.toBeLessThan(initialMaxChars);

	const panelSensors = page.locator('.panel-capacity-sensor');
	await expect(panelSensors).toHaveCount(5);
	for (let index = 0; index < 5; index += 1) {
		const sensor = panelSensors.nth(index);
		const geometry = await sensor.evaluate((node) => {
			const parent = node.parentElement!;
			const sensorRect = node.getBoundingClientRect();
			const parentRect = parent.getBoundingClientRect();
			return {
				position: getComputedStyle(node).position,
				widthDelta: Math.abs(sensorRect.width - parentRect.width),
				heightDelta: Math.abs(sensorRect.height - parentRect.height)
			};
		});
		expect(geometry.position).toBe('absolute');
		expect(geometry.widthDelta).toBeLessThan(0.01);
		expect(geometry.heightDelta).toBeLessThan(0.01);
	}
});
