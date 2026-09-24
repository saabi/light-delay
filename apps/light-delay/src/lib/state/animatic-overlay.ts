import type { ScriptId } from '$lib/types/ids';

export type AnimaticEdits = {
	scriptId: ScriptId;
	scriptVersion: string;
	shotDurations: Record<string, number>;
};

export function animaticStorageKey(scriptId: ScriptId, scriptVersion: string): string {
	return `light-delay.animatic-edits:${scriptId}:${scriptVersion}`;
}

export function loadAnimaticEdits(scriptId: ScriptId, scriptVersion: string): AnimaticEdits {
	const empty: AnimaticEdits = { scriptId, scriptVersion, shotDurations: {} };
	if (typeof localStorage === 'undefined') return empty;
	try {
		const raw = localStorage.getItem(animaticStorageKey(scriptId, scriptVersion));
		if (!raw) return empty;
		const parsed = JSON.parse(raw) as Partial<AnimaticEdits>;
		if (parsed.scriptId && parsed.scriptId !== scriptId) return empty;
		if (parsed.scriptVersion && parsed.scriptVersion !== scriptVersion) return empty;
		return {
			scriptId,
			scriptVersion,
			shotDurations: parsed.shotDurations ?? {}
		};
	} catch {
		return empty;
	}
}

export function persistAnimaticEdits(edits: AnimaticEdits) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(
		animaticStorageKey(edits.scriptId, edits.scriptVersion),
		JSON.stringify(edits)
	);
}

export function durationFromEdits(
	edits: AnimaticEdits,
	shotId: string,
	canonicalMs: number
): number {
	const overlay = edits.shotDurations[shotId];
	return overlay !== undefined ? overlay : canonicalMs;
}

export function withShotDuration(
	edits: AnimaticEdits,
	shotId: string,
	durationMs: number
): AnimaticEdits {
	return {
		...edits,
		shotDurations: {
			...edits.shotDurations,
			[shotId]: Math.max(0, Math.round(durationMs))
		}
	};
}

export function withoutShotDuration(edits: AnimaticEdits, shotId: string): AnimaticEdits {
	const rest = { ...edits.shotDurations };
	delete rest[shotId];
	return { ...edits, shotDurations: rest };
}

export function effectiveTotalMs(
	edits: AnimaticEdits,
	shots: { id: string; durationMs: number }[]
): number {
	return shots.reduce((sum, shot) => sum + durationFromEdits(edits, shot.id, shot.durationMs), 0);
}
