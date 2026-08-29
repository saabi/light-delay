/**
 * Script-scoped lookup helpers for editorial reports (browser + Node safe).
 */
// @ts-nocheck

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 */
export function createScriptContext(script) {
	const sceneById = new Map(script.scenes.map((s) => [s.id, s]));
	const shotById = new Map(script.shots.map((s) => [s.id, s]));
	const takeById = new Map(script.takes.map((t) => [t.id, t]));
	const cueById = new Map(script.cues.map((c) => [c.id, c]));
	const beatById = new Map(script.beats.map((b) => [b.id, b]));
	const beatSceneId = new Map(script.beats.map((b) => [b.id, b.sceneId]));

	/** @param {import('../../src/lib/types/script.ts').Shot} shot */
	const shotScene = (shot) => sceneById.get(shot.sceneId);

	/** @param {import('../../src/lib/types/script.ts').Shot} shot */
	const selectedTake = (shot) =>
		shot.selectedTakeId ? takeById.get(shot.selectedTakeId) : undefined;

	const shotsByScene = new Map();
	for (const shot of script.shots) {
		const list = shotsByScene.get(shot.sceneId) ?? [];
		list.push(shot);
		shotsByScene.set(shot.sceneId, list);
	}
	for (const list of shotsByScene.values()) list.sort((a, b) => a.order - b.order);

	const dialogueCueIdsInScene = new Map();
	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		const sceneId = beatSceneId.get(cue.beatId);
		if (!sceneId) continue;
		const set = dialogueCueIdsInScene.get(sceneId) ?? new Set();
		set.add(cue.id);
		dialogueCueIdsInScene.set(sceneId, set);
	}

	const placedCueIds = new Set();
	for (const shot of script.shots) {
		for (const p of shot.cuePlacements) placedCueIds.add(p.cueId);
	}

	return {
		script,
		sceneById,
		shotById,
		takeById,
		cueById,
		beatById,
		beatSceneId,
		shotScene,
		selectedTake,
		shotsByScene,
		dialogueCueIdsInScene,
		placedCueIds
	};
}
