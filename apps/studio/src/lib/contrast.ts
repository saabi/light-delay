/** WCAG 2.x relative luminance and contrast ratio for #rgb / #rrggbb colours. */
export function hexToRgb(hex: string): [number, number, number] {
	const value = hex.replace('#', '');
	const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
	if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Not a hex colour: ${hex}`);
	return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string) {
	const [r, g, b] = hexToRgb(hex).map((channel) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string) {
	const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
	return (a + 0.05) / (b + 0.05);
}
