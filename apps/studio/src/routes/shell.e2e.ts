import { expect, test, type Page } from '@playwright/test';
import { layoutFor, type LayoutId } from '../lib/layout';
import { historyEntries, initialEntry, saveState } from './studio-e2e';

/*
	Phase 2 (shell and identity), checked against STUDIO_DESIGN_SYSTEM.md: shell anatomy, layout from
	the root GlyphCapacitySensor, layout stability, screenplay geometry in ch, and vocabulary.
	Shares the in-memory store with the other projects, so nothing here assumes a fresh project.
*/

async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('.shell[data-layout]')).toBeVisible();
	await expect(page.getByLabel('dialogue')).toBeVisible();
	await expect(page.getByRole('button', { name: /^Cut: / })).toBeEnabled();
}

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

test('one application bar with a fixed identity slot, no second bar and no footer', async ({
	page
}) => {
	await open(page);
	const bars = page.locator('header');
	await expect(bars).toHaveCount(1);
	const bar = bars.first();
	expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(44);
	await expect(page.locator('footer')).toHaveCount(0);

	const identity = page.getByRole('link', { name: 'Studio home' });
	await expect(identity).toHaveText('Studio');
	const projectName = await page.locator('.crumb-project').textContent();
	await expect(identity).not.toContainText(projectName!);
	await expect(page.getByRole('navigation', { name: 'Location' })).toContainText(projectName!);
	await expect(page.locator('.running-header')).toContainText('Harbor Light — Scene · Feature');

	/* A single lens is not shown as a tab. */
	await expect(page.getByRole('button', { name: 'Write' })).toHaveCount(0);
});

test('the save state appears once, right after the breadcrumb', async ({ page }) => {
	await open(page);
	await page.getByLabel('dialogue').fill(`Shell save ${Date.now()}.`);
	await expect(saveState(page)).toContainText('Unsaved changes');
	await expect(page.getByRole('status')).toHaveCount(1);
	const order = await page
		.locator('header')
		.evaluate((header) =>
			[...header.children].map(
				(child) => child.getAttribute('role') ?? child.className.split(' ')[0]
			)
		);
	expect(order.indexOf('status')).toBe(order.indexOf('breadcrumb') + 1);
	await saveState(page).getByRole('button', { name: 'Save' }).click();
	await expect(saveState(page)).toHaveText('Saved');
	await expect(page.getByText('Saved', { exact: true })).toHaveCount(1);
});

test('the cut menu works from the keyboard', async ({ page }) => {
	await open(page);
	const trigger = page.getByRole('button', { name: 'Cut: Feature' });
	await trigger.focus();
	await page.keyboard.press('ArrowDown');
	const menu = page.getByRole('menu', { name: 'Cut' });
	await expect(menu).toBeVisible();
	await expect(page.getByRole('menuitemradio', { name: 'Feature' })).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(trigger).toBeFocused();

	await page.keyboard.press('Enter');
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('menuitemradio', { name: 'Trailer' })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: 'Cut: Trailer' })).toBeVisible();
	await expect(page.locator('.running-header')).toContainText('Trailer');
	await page.getByRole('button', { name: 'Cut: Trailer' }).click();
	await page.getByRole('menuitemradio', { name: 'Feature' }).click();
	await expect(page.getByRole('button', { name: 'Cut: Feature' })).toBeVisible();
});

for (const [width, height] of [
	[1920, 1000],
	[1280, 860],
	[700, 900],
	[390, 844],
	[600, 300]
])
	test(`layout at ${width}×${height} comes from measured capacity through layoutFor`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height });
		await open(page);
		const state = await layoutState(page);
		expect(state.maxChars).toBeGreaterThan(0);
		expect(state.layout).toBe(layoutFor(state));
	});

test('the layout covers the expected range of classes', async ({ page }) => {
	const seen = new Set<string>();
	for (const [width, height] of [
		[1920, 1000],
		[1280, 860],
		[700, 900],
		[390, 844],
		[600, 300]
	]) {
		await page.setViewportSize({ width, height });
		await open(page);
		seen.add((await layoutState(page)).layout);
	}
	expect([...seen].sort()).toEqual(['compact', 'narrow', 'phone', 'regular', 'wide']);
});

test('raising the text scale steps the layout down and keeps Write usable', async ({ page }) => {
	await page.setViewportSize({ width: 1100, height: 900 });
	await open(page);
	const before = await layoutState(page);
	expect(before.layout).toBe('regular');
	await page.evaluate(() =>
		document.documentElement.style.setProperty('--studio-font-scale', '1.75')
	);
	/* At 175% a 1100×900 window holds about 64 characters × 22 lines: landscape and short, so the
	   documented rule makes it compact. What matters is that it steps down through layoutFor. */
	await expect.poll(async () => (await layoutState(page)).layout).not.toBe('regular');
	const after = await layoutState(page);
	expect(after.maxChars).toBeLessThan(before.maxChars);
	expect(after.layout).toBe(layoutFor(after));
	expect(['narrow', 'phone', 'compact']).toContain(after.layout);
	await expect(page.getByLabel('dialogue')).toBeVisible();
	const overflow = await page
		.locator('.app-bar')
		.evaluate((node) => node.scrollWidth - node.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});

test('the shell stays hidden until it has a layout', async ({ page }) => {
	await open(page);
	const hidden = await page.locator('.shell').evaluate((node) => {
		const layout = node.getAttribute('data-layout')!;
		node.removeAttribute('data-layout');
		const visibility = getComputedStyle(node).visibility;
		node.setAttribute('data-layout', layout);
		return visibility;
	});
	expect(hidden).toBe('hidden');
});

for (const [width, height] of [
	[1920, 1000],
	[1280, 860],
	[700, 900],
	[390, 844]
])
	test(`opening panels and menus never moves the document at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height });
		await open(page);
		const dialogue = page.getByLabel('dialogue');
		const before = await dialogue.boundingBox();
		await page.getByRole('button', { name: 'History' }).click();
		await expect(page.getByLabel('History')).toBeVisible();
		expect(await dialogue.boundingBox()).toEqual(before);
		await page.getByRole('button', { name: 'History' }).click();
		await page.getByRole('button', { name: /^Cut: / }).click();
		await expect(page.getByRole('menu', { name: 'Cut' })).toBeVisible();
		expect(await dialogue.boundingBox()).toEqual(before);
		await page.keyboard.press('Escape');
		expect(await dialogue.boundingBox()).toEqual(before);
	});

test('screenplay page geometry is set in characters of the screenplay face', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	const geometry = await page.evaluate(() => {
		const page = document.querySelector('.page') as HTMLElement;
		const probe = document.createElement('span');
		probe.textContent = '0'.repeat(100);
		probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
		page.append(probe);
		const ch = probe.getBoundingClientRect().width / 100;
		probe.remove();
		const pageBox = page.getBoundingClientRect();
		const style = getComputedStyle(page);
		const textLeft = pageBox.left + parseFloat(style.paddingLeft);
		const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
		const action = box('.element.action');
		const dialogue = box('.element.dialogue');
		const cue = box('.element.character textarea');
		return {
			page: pageBox.width / ch,
			left: parseFloat(style.paddingLeft) / ch,
			right: parseFloat(style.paddingRight) / ch,
			action: action.width / ch,
			dialogueIndent: (dialogue.left - textLeft) / ch,
			dialogueWidth: dialogue.width / ch,
			cueIndent: (cue.left - textLeft) / ch,
			fontSize: parseFloat(style.fontSize)
		};
	});
	expect(geometry.fontSize).toBe(16);
	expect(geometry.page).toBeCloseTo(85, 0);
	expect(geometry.left).toBeCloseTo(15, 1);
	expect(geometry.right).toBeCloseTo(10, 1);
	expect(geometry.action).toBeCloseTo(60, 0);
	expect(geometry.dialogueIndent).toBeCloseTo(10, 1);
	expect(geometry.dialogueWidth).toBeCloseTo(35, 1);
	expect(geometry.cueIndent).toBeCloseTo(22, 1);
});

const forbidden =
	/\b(authoritative|projection|provisional|proposal|changeset|revision|principal|schema|scope)\b|\b(element|proposal|draft|changeset|user|version|document|project):[\w-]/i;

async function visibleText(page: Page) {
	return page.evaluate(() => document.body.innerText);
}

test('normal surfaces use the plain vocabulary and never show IDs', async ({ page }) => {
	await open(page);
	expect(await visibleText(page)).not.toMatch(forbidden);

	await page.getByLabel('dialogue').fill(`Vocabulary line ${Date.now()}.`);
	expect(await visibleText(page)).not.toMatch(forbidden);

	await page.getByRole('button', { name: 'Review changes' }).click();
	await expect(page.getByLabel('Changes to review')).toBeVisible();
	expect(await visibleText(page)).not.toMatch(forbidden);

	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(saveState(page)).toHaveText('Changes accepted');
	expect(await visibleText(page)).not.toMatch(forbidden);

	await page.getByRole('button', { name: 'History' }).click();
	await expect(historyEntries(page).first()).toContainText(/^You · \d\d:\d\d/);
	expect(await visibleText(page)).not.toMatch(forbidden);

	await initialEntry(page).getByRole('button', { name: 'Restore…' }).click();
	await expect(page.getByLabel('Restore preview')).toBeVisible();
	expect(await visibleText(page)).not.toMatch(forbidden);
	await page.getByRole('button', { name: 'Cancel' }).click();
});

test('history reads newest first, in plain language', async ({ page }) => {
	await open(page);
	await page.getByLabel('dialogue').fill(`Newest ${Date.now()}.`);
	await page.getByRole('button', { name: 'Review changes' }).click();
	await page.getByRole('button', { name: 'Accept changes' }).click();
	await expect(saveState(page)).toHaveText('Changes accepted');
	await page.getByRole('button', { name: 'History' }).click();
	const entries = historyEntries(page);
	await expect(entries.first()).toContainText('Revised dialogue');
	await expect(entries.first()).toContainText('Current text');
	await expect(entries.last()).toContainText('Initial screenplay');
});
