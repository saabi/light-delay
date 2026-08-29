import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(ROOT, 'data', 'scripts', 'light-delay-main-short.json');
const archivePath = join(ROOT, 'data', 'archive', 'main-short-unplaced-action-cues.json');
const checkOnly = process.argv.includes('--check');
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const placed = new Set(script.shots.flatMap((shot) => shot.cuePlacements.map((item) => item.cueId)));
const beatById = new Map(script.beats.map((beat) => [beat.id, beat]));
const shotsByScene = new Map();
for (const shot of script.shots) {
	const list = shotsByScene.get(shot.sceneId) ?? [];
	list.push(shot.id);
	shotsByScene.set(shot.sceneId, list);
}

const orphanIds = new Set(
	script.cues
		.filter((cue) => cue.type === 'action' && !placed.has(cue.id))
		.map((cue) => cue.id)
);
if (checkOnly && orphanIds.size === 0) {
	const existing = JSON.parse(readFileSync(archivePath, 'utf8'));
	if (existing.entries?.length !== 57) throw new Error('Archive must contain exactly 57 entries.');
	const activeIds = new Set(script.cues.map((cue) => cue.id));
	if (existing.entries.some((entry) => activeIds.has(entry.cueId))) {
		throw new Error('An archived cue is still active.');
	}
	console.log('archive-main-orphan-actions check OK entries=57');
	process.exit(0);
}
if (orphanIds.size !== 57) {
	throw new Error(`Expected 57 unplaced action cues, found ${orphanIds.size}`);
}

const entries = script.cues
	.filter((cue) => orphanIds.has(cue.id))
	.map((cue) => {
		const sceneId = beatById.get(cue.beatId)?.sceneId;
		return {
			cueId: cue.id,
			sceneId,
			reason: 'duplicated_by_shot_descriptions',
			coveredByShotIds: shotsByScene.get(sceneId) ?? [],
			originalCue: cue
		};
	});
const archive = {
	schemaVersion: '1.0.0',
	archive: {
		id: 'archive:main-short-unplaced-action-cues',
		sourceScriptId: script.script.id,
		sourceScriptVersion: script.script.version,
		reason: {
			es: 'Prosa de acción heredada que duplica el desglose activo toma por toma.',
			en: 'Inherited action prose duplicated by the active shot-by-shot breakdown.'
		}
	},
	entries
};

const nextScript = structuredClone(script);
nextScript.cues = nextScript.cues.filter((cue) => !orphanIds.has(cue.id));
for (const beat of nextScript.beats) {
	beat.cueIds = beat.cueIds.filter((cueId) => !orphanIds.has(cueId));
}

const archiveJson = `${JSON.stringify(archive, null, 2)}\n`;
const scriptJson = `${JSON.stringify(nextScript, null, 2)}\n`;
if (checkOnly) {
	if (readFileSync(archivePath, 'utf8') !== archiveJson || readFileSync(scriptPath, 'utf8') !== scriptJson) {
		throw new Error('Archived action cue files are stale.');
	}
} else {
	mkdirSync(dirname(archivePath), { recursive: true });
	writeFileSync(archivePath, archiveJson, 'utf8');
	writeFileSync(scriptPath, scriptJson, 'utf8');
}
console.log(`archive-main-orphan-actions ${checkOnly ? 'check' : 'write'} OK entries=${entries.length}`);
