const STORAGE_KEY = 'light-delay.animatic-edits';

export type AnimaticEdits = {
	shotDurations: Record<string, number>;
};

function loadEdits(): AnimaticEdits {
	if (typeof localStorage === 'undefined') {
		return { shotDurations: {} };
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { shotDurations: {} };
		const parsed = JSON.parse(raw) as Partial<AnimaticEdits>;
		return { shotDurations: parsed.shotDurations ?? {} };
	} catch {
		return { shotDurations: {} };
	}
}

function persist(edits: AnimaticEdits) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}

let edits = $state<AnimaticEdits>(loadEdits());

export function getAnimaticEdits(): AnimaticEdits {
	return edits;
}

export function getShotDurationMs(shotId: string, canonicalMs: number): number {
	const overlay = edits.shotDurations[shotId];
	return overlay !== undefined ? overlay : canonicalMs;
}

export function setShotDurationMs(shotId: string, durationMs: number) {
	const next = Math.max(0, Math.round(durationMs));
	edits = {
		shotDurations: { ...edits.shotDurations, [shotId]: next }
	};
	persist(edits);
}

export function resetShotDuration(shotId: string) {
	const rest = { ...edits.shotDurations };
	delete rest[shotId];
	edits = { shotDurations: rest };
	persist(edits);
}

export function getEffectiveTotalMs(shots: { id: string; durationMs: number }[]): number {
	return shots.reduce((sum, shot) => sum + getShotDurationMs(shot.id, shot.durationMs), 0);
}
