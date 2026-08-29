import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const specs = [
	['light-delay-main-short', 'main', 'Escaleta — Light Delay: corto canónico', 'Outline — Light Delay: canonical short'],
	['light-delay-trailer', 'trailer', 'Escaleta — Light Delay: tráiler', 'Outline — Light Delay: trailer'],
	['light-delay-long', 'long', 'Escaleta — Light Delay: tratamiento largo', 'Outline — Light Delay: feature treatment']
];

for (const [slug, prefix, titleEs, titleEn] of specs) {
	const script = JSON.parse(readFileSync(join(ROOT, 'data', 'scripts', `${slug}.json`), 'utf8'));
	const eventByScene = new Map();
	for (const event of script.script.comparisonProfile?.eventCoverage ?? []) {
		for (const sceneId of event.sceneIds ?? []) {
			if (!eventByScene.has(sceneId)) eventByScene.set(sceneId, event.eventId);
		}
	}
	const orderedScenes = [...script.scenes].sort((a, b) => a.order - b.order);
	const steps = orderedScenes.map((scene, index) => {
		const step = {
			id: `${prefix}:outline-${String(index + 1).padStart(2, '0')}`,
			order: index + 1,
			title: scene.title,
			summary: scene.summary,
			importance: 'required',
			status: 'covered',
			sceneIds: [scene.id],
			beatIds: scene.beatIds,
			cueIds: script.cues.filter((cue) => scene.beatIds.includes(cue.beatId)).map((cue) => cue.id),
			shotIds: scene.shotIds
		};
		const majorEventId = eventByScene.get(scene.id);
		if (majorEventId) step.majorEventId = majorEventId;
		if (index > 0) step.dependsOnStepIds = [`${prefix}:outline-${String(index).padStart(2, '0')}`];
		return step;
	});
	const outline = {
		schemaVersion: '1.1.0',
		outline: {
			id: `outline:${slug}`,
			scriptId: script.script.id,
			title: { es: titleEs, en: titleEn },
			status: 'draft',
			version: '0.1.0'
		},
		steps
	};
	const output = `${JSON.stringify(outline, null, 2)}\n`;
	const outputPath = join(ROOT, 'data', 'outlines', `${slug}.json`);
	if (checkOnly) {
		if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) {
			throw new Error(`${outputPath} is stale`);
		}
	} else writeFileSync(outputPath, output, 'utf8');
	console.log(`${checkOnly ? 'checked' : 'wrote'} ${outputPath} steps=${steps.length}`);
}
