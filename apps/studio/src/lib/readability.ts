/**
 * Readability preferences (STUDIO_DESIGN_SYSTEM.md § Readability preferences).
 *
 * Preferences are local to the browser: not project data and not part of any document. The same
 * `applyReadability` function runs twice: inlined into the page head by `hooks.server.ts`, so the
 * first paint already has the stored scale, contrast, spacing and face; and at runtime when the
 * user changes a preference. It must stay self-contained (no references outside its body).
 */

export const readabilityOptions = {
	scale: [1, 1.12, 1.25, 1.5, 1.75, 2],
	contrast: ['normal', 'high', 'maximum'],
	lineHeight: [1.25, 1.45, 1.65, 1.85],
	face: ['inter', 'atkinson', 'opendyslexic']
} as const;

export type Contrast = (typeof readabilityOptions.contrast)[number];
export type InterfaceFace = (typeof readabilityOptions.face)[number];

export interface Readability {
	scale: number;
	/** Unset follows the system (`prefers-contrast`). */
	contrast?: Contrast;
	lineHeight: number;
	face: InterfaceFace;
}

export const defaultReadability: Readability = { scale: 1, lineHeight: 1.45, face: 'inter' };

export const readabilityStorageKey = 'studio.readability.v1';

export const faceLabels: Record<InterfaceFace, string> = {
	inter: 'Inter',
	atkinson: 'Atkinson Hyperlegible',
	opendyslexic: 'OpenDyslexic'
};

/** CSS family name each face registers, used to wait for it before measuring. */
export const faceFamilies: Record<InterfaceFace, string> = {
	inter: 'Inter Variable',
	atkinson: 'Atkinson Hyperlegible Next',
	opendyslexic: 'OpenDyslexic'
};

export interface ReadabilityConfig {
	key: string;
	options: typeof readabilityOptions;
	defaults: Readability;
}

export const readabilityConfig: ReadabilityConfig = {
	key: readabilityStorageKey,
	options: readabilityOptions,
	defaults: defaultReadability
};

/**
 * Validates `prefs` (or the stored value when `prefs` is null), applies it to the root element and
 * returns what was applied. Invalid or missing values fall back to the defaults.
 */
export function applyReadability(
	prefs: Partial<Readability> | null,
	config: ReadabilityConfig
): Readability {
	let source: Partial<Readability> = prefs ?? {};
	if (prefs === null) {
		try {
			source = JSON.parse(localStorage.getItem(config.key) ?? '{}') ?? {};
		} catch {
			source = {};
		}
	}
	const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
		allowed.includes(value as T) ? (value as T) : fallback;
	const result: Readability = {
		scale: pick(source.scale, config.options.scale, config.defaults.scale),
		lineHeight: pick(source.lineHeight, config.options.lineHeight, config.defaults.lineHeight),
		face: pick(source.face, config.options.face, config.defaults.face)
	};
	const contrast = pick(source.contrast, config.options.contrast, undefined);
	if (contrast) result.contrast = contrast;
	const root = document.documentElement;
	root.style.setProperty('--studio-font-scale', String(result.scale));
	root.style.setProperty('--studio-line-height', String(result.lineHeight));
	if (result.contrast) root.dataset.contrast = result.contrast;
	else delete root.dataset.contrast;
	if (result.face === config.defaults.face) delete root.dataset.face;
	else root.dataset.face = result.face;
	return result;
}

/** The inline head script: applies stored preferences before the first paint. */
export const readabilityBootScript = `(${applyReadability.toString()})(null, ${JSON.stringify(
	readabilityConfig
)});`;

export function saveReadability(prefs: Readability) {
	try {
		const stored: Partial<Readability> = { ...prefs };
		localStorage.setItem(readabilityStorageKey, JSON.stringify(stored));
	} catch {
		/* Storage may be unavailable (private mode); preferences then last for this tab only. */
	}
}

export function clearReadability() {
	try {
		localStorage.removeItem(readabilityStorageKey);
	} catch {
		/* See saveReadability. */
	}
}
