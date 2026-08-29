/**
 * Editorial report builders. Classifiers live in editorial-readiness-core.mjs.
 */
// @ts-nocheck
import { thumbnailPathForAsset } from './thumbnail-path.mjs';
import {
	BEAT_PLACEHOLDER_RE,
	countTakesNeedingRegeneration,
	REGEN_IMAGE_STATUS,
	shotCompletenessFlags,
	shotReadinessChips,
	takeNeedsRegeneration
} from './editorial-readiness-core.mjs';

export {
	BEAT_PLACEHOLDER_RE,
	countTakesNeedingRegeneration,
	REGEN_IMAGE_STATUS,
	shotCompletenessFlags,
	shotReadinessChips,
	takeNeedsRegeneration
};

export { ANIMATIC_PLACEHOLDER_ASSET_ID } from './editorial-readiness-core.mjs';

function assetPathOnDisk(projectCtx, publicPath) {
	if (!publicPath?.startsWith('/')) return false;
	if (!projectCtx.checkDisk) return true;
	return projectCtx.checkDisk(publicPath);
}

function shotMediaState(shot, take, asset) {
	const imagePath = asset?.kind === 'image' ? asset.path : undefined;
	if (!imagePath) return 'missing';
	if (take?.imageStatus && take.imageStatus.status !== 'current') return 'needs_refresh';
	return 'current';
}

function reportHeader(title, scriptId, language, generatedAt) {
	return [`# ${title} — ${scriptId}`, '', `Idioma: **${language}** · Generado: ${generatedAt}`, ''];
}

// --- Visual art ---

export function buildVisualArtReport(script, ctx, projectCtx) {
	const { assetById, entities, assets } = projectCtx;
	const missingFiles = [];
	const unknownAssetRefs = [];
	const shotsWithoutMedia = [];
	const entitiesWithoutRaster = [];

	const usedEntityIds = new Set((script.script.declaredEntityRefs ?? []).map((ref) => ref.id));
	for (const scene of script.scenes ?? []) {
		for (const id of scene.characterIds ?? []) usedEntityIds.add(id);
		if (scene.locationId) usedEntityIds.add(scene.locationId);
	}
	for (const shot of script.shots ?? []) {
		if (shot.locationId) usedEntityIds.add(shot.locationId);
		for (const ref of [...(shot.visibleRefs ?? []), ...(shot.offScreenCharacterIds ?? [])])
			usedEntityIds.add(typeof ref === 'string' ? ref : ref.id);
	}
	for (const cue of script.cues ?? []) {
		if (cue.speakerId) usedEntityIds.add(cue.speakerId);
		for (const ref of [...(cue.participantRefs ?? []), ...(cue.objectRefs ?? [])])
			usedEntityIds.add(typeof ref === 'string' ? ref : ref.id);
	}
	const scopedEntities = entities.filter((entity) => usedEntityIds.has(entity.id));
	const relevantAssetIds = new Set();
	for (const entity of scopedEntities)
		for (const assetId of entity.referenceAssetIds ?? []) relevantAssetIds.add(assetId);
	for (const take of script.takes ?? [])
		if (take.imageAssetId) relevantAssetIds.add(take.imageAssetId);
	const scopedAssets = assets.filter((asset) => relevantAssetIds.has(asset.id));

	for (const asset of scopedAssets) {
		if (asset.kind !== 'image' || !asset.path) continue;
		if (!assetPathOnDisk(projectCtx, asset.path)) {
			missingFiles.push({ assetId: asset.id, path: asset.path });
		}
	}

	for (const take of script.takes ?? []) {
		if (take.imageAssetId && !assetById.has(take.imageAssetId)) {
			unknownAssetRefs.push({
				kind: 'take',
				id: take.id,
				assetId: take.imageAssetId
			});
		}
	}

	for (const shot of script.shots ?? []) {
		if (!shot.selectedTakeId) {
			shotsWithoutMedia.push({ shotId: shot.id, reason: 'no_selected_take' });
			continue;
		}
		const take = ctx.selectedTake(shot);
		if (!take?.imageAssetId) {
			shotsWithoutMedia.push({ shotId: shot.id, reason: 'no_image_asset' });
			continue;
		}
		const asset = assetById.get(take.imageAssetId);
		if (!asset) {
			shotsWithoutMedia.push({ shotId: shot.id, reason: 'unknown_asset' });
			continue;
		}
		const state = shotMediaState(shot, take, asset);
		if (state === 'missing') {
			shotsWithoutMedia.push({ shotId: shot.id, reason: 'missing_file', assetId: asset.id });
		}
	}

	for (const entity of scopedEntities) {
		const refs = entity.referenceAssetIds ?? [];
		if (!refs.length) {
			entitiesWithoutRaster.push({ kind: entity.kind, id: entity.id, name: entity.name });
			continue;
		}
		const hasRaster = refs.some((id) => {
			const a = assetById.get(id);
			return a?.kind === 'image' && a.path?.startsWith('/assets/');
		});
		if (!hasRaster) {
			entitiesWithoutRaster.push({ kind: entity.kind, id: entity.id, name: entity.name });
		}
	}

	const missingThumbs = scopedAssets
		.filter((a) => a.kind === 'image' && a.path?.startsWith('/assets/'))
		.filter((a) => !a.path.toLowerCase().endsWith('.svg'))
		.filter((a) => {
			const thumb = thumbnailPathForAsset(a.path);
			return thumb && !assetPathOnDisk(projectCtx, thumb);
		})
		.map((a) => ({ assetId: a.id, path: a.path }));

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			missingFileCount: missingFiles.length,
			unknownRefCount: unknownAssetRefs.length,
			shotsWithoutMediaCount: shotsWithoutMedia.length,
			entitiesWithoutRasterCount: entitiesWithoutRaster.length,
			missingThumbCount: missingThumbs.length,
			consoleLine: `missing files: ${missingFiles.length}, shots w/o media: ${shotsWithoutMedia.length}, entities w/o raster: ${entitiesWithoutRaster.length}`
		},
		missingFiles,
		unknownAssetRefs,
		shotsWithoutMedia,
		entitiesWithoutRaster,
		missingThumbs
	};
}

export function formatVisualArtMarkdown(report) {
	const lines = reportHeader(
		'Informe de arte visual faltante o roto',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(
		`- Archivos de asset ausentes en disco: **${report.summary.missingFileCount}**`,
		`- Referencias a assets desconocidos: **${report.summary.unknownRefCount}**`,
		`- Tomas sin medio utilizable: **${report.summary.shotsWithoutMediaCount}**`,
		`- Entidades sin raster de referencia: **${report.summary.entitiesWithoutRasterCount}**`,
		`- Miniaturas faltantes (aviso): **${report.summary.missingThumbCount}**`,
		''
	);
	appendList(
		lines,
		'Archivos ausentes',
		report.missingFiles,
		(r) => `\`${r.assetId}\` → ${r.path}`
	);
	appendList(
		lines,
		'Referencias desconocidas',
		report.unknownAssetRefs,
		(r) => `${r.kind} \`${r.id}\` → ${r.assetId}`
	);
	appendList(
		lines,
		'Tomas sin medio',
		report.shotsWithoutMedia,
		(r) => `\`${r.shotId}\` (${r.reason})`
	);
	appendList(
		lines,
		'Entidades sin raster',
		report.entitiesWithoutRaster,
		(r) => `${r.kind} \`${r.id}\` (${r.name})`
	);
	return lines.join('\n');
}

// --- Image debt ---

export function buildImageDebtReport(script, ctx, projectCtx) {
	const histogram = {};
	const queue = [];
	const byReason = {};

	for (const take of script.takes) {
		const status = take.imageStatus?.status ?? 'current';
		histogram[status] = (histogram[status] ?? 0) + 1;
		if (!take.imageStatus || take.imageStatus.status === 'current') continue;
		const shot = ctx.shotById.get(take.shotId);
		const scene = shot ? ctx.shotScene(shot) : undefined;
		for (const reason of take.imageStatus.reasons ?? []) {
			byReason[reason] = (byReason[reason] ?? 0) + 1;
		}
		queue.push({
			takeId: take.id,
			shotId: take.shotId,
			shotNumber: shot?.number,
			sceneId: shot?.sceneId,
			sceneNumber: scene?.number,
			imageAssetId: take.imageAssetId,
			status: take.imageStatus.status,
			reasons: take.imageStatus.reasons,
			explanation: take.imageStatus.explanation,
			replacementBrief: take.imageStatus.replacementBrief
		});
	}

	const assetReuse = [];

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			takeCount: script.takes.length,
			histogram,
			queueCount: queue.length,
			byReason,
			consoleLine: `image debt queue: ${queue.length}/${script.takes.length}`
		},
		queue,
		byReason
	};
}

export function formatImageDebtMarkdown(report) {
	const lines = reportHeader(
		'Cola de deuda de imagen',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(`- Tomas totales: **${report.summary.takeCount}**`);
	lines.push(`- En cola (no current): **${report.summary.queueCount}**`);
	for (const [status, count] of Object.entries(report.summary.histogram)) {
		lines.push(`- \`${status}\`: ${count}`);
	}
	lines.push('');
	appendList(
		lines,
		'Cola de regeneración / reemplazo',
		report.queue,
		(r) =>
			`**Toma ${r.shotNumber}** (\`${r.takeId}\`) escena ${r.sceneNumber} — ${r.status} [${r.reasons?.join(', ')}]`
	);
	return lines.join('\n');
}

// --- Shot completeness ---

export function buildShotCompletenessReport(script, ctx) {
	const flagged = [];
	const byScene = [];

	for (const scene of [...script.scenes].sort((a, b) => a.order - b.order)) {
		const sceneShots = ctx.shotsByScene.get(scene.id) ?? [];
		const sceneEntries = [];
		for (const shot of sceneShots) {
			const flags = shotCompletenessFlags(shot);
			if (!flags.length) continue;
			const entry = { shotId: shot.id, shotNumber: shot.number, flags };
			flagged.push(entry);
			sceneEntries.push(entry);
		}
		if (sceneEntries.length) {
			byScene.push({ sceneId: scene.id, sceneNumber: scene.number, shots: sceneEntries });
		}
	}

	const flagCounts = {};
	for (const { flags } of flagged) {
		for (const f of flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			shotCount: script.shots.length,
			flaggedShotCount: flagged.length,
			flagCounts,
			consoleLine: `incomplete shots: ${flagged.length}/${script.shots.length}`
		},
		flagged,
		byScene
	};
}

export function formatShotCompletenessMarkdown(report) {
	const lines = reportHeader(
		'Completitud de tomas',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(
		`- Tomas con deuda de metadatos: **${report.summary.flaggedShotCount}** / ${report.summary.shotCount}`
	);
	for (const [flag, count] of Object.entries(report.summary.flagCounts)) {
		lines.push(`- \`${flag}\`: ${count}`);
	}
	lines.push('');
	for (const scene of report.byScene) {
		lines.push(`### Escena ${scene.sceneNumber}`, '');
		for (const shot of scene.shots) {
			lines.push(`- Toma ${shot.shotNumber} (\`${shot.shotId}\`): ${shot.flags.join(', ')}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

// --- Cue placement ---

export function buildCuePlacementReport(script, ctx) {
	const shotsNoDialoguePlacement = [];
	const atMsZeroOnly = [];
	const missingDuration = [];
	const unplacedActionCues = [];

	for (const shot of script.shots) {
		const scene = ctx.shotScene(shot);
		const sceneDialogue = ctx.dialogueCueIdsInScene.get(shot.sceneId) ?? new Set();
		const placedDialogue = shot.cuePlacements.filter((p) => {
			const cue = ctx.cueById.get(p.cueId);
			return cue?.type === 'dialogue';
		});
		if (sceneDialogue.size > 0 && placedDialogue.length === 0) {
			shotsNoDialoguePlacement.push({ shotId: shot.id, sceneNumber: scene?.number });
		}
		for (const p of shot.cuePlacements) {
			if (p.atMs === 0 && p.durationMs === undefined) {
				atMsZeroOnly.push({ shotId: shot.id, cueId: p.cueId });
			}
			if (p.durationMs === undefined) {
				missingDuration.push({ shotId: shot.id, cueId: p.cueId, atMs: p.atMs });
			}
		}
	}

	for (const cue of script.cues) {
		if (cue.type !== 'action') continue;
		if (!ctx.placedCueIds.has(cue.id)) {
			const sceneId = ctx.beatSceneId.get(cue.beatId);
			unplacedActionCues.push({ cueId: cue.id, sceneId });
		}
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			shotsNoDialoguePlacement: shotsNoDialoguePlacement.length,
			atMsZeroOnly: atMsZeroOnly.length,
			missingDuration: missingDuration.length,
			unplacedActionCues: unplacedActionCues.length,
			consoleLine: `placement debt: ${atMsZeroOnly.length} atMs=0, ${unplacedActionCues.length} unplaced action`
		},
		shotsNoDialoguePlacement,
		atMsZeroOnly,
		missingDuration,
		unplacedActionCues
	};
}

export function formatCuePlacementMarkdown(report) {
	const lines = reportHeader(
		'Colocación de cues',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(
		`- Tomas en escena con diálogo pero sin placements de diálogo: **${report.summary.shotsNoDialoguePlacement}**`,
		`- Placements con atMs=0 sin durationMs: **${report.summary.atMsZeroOnly}**`,
		`- Placements sin durationMs: **${report.summary.missingDuration}**`,
		`- Cues de acción sin colocar: **${report.summary.unplacedActionCues}**`,
		''
	);
	appendList(
		lines,
		'Acción sin colocar',
		report.unplacedActionCues,
		(r) => `\`${r.cueId}\` (escena ${r.sceneId})`
	);
	return lines.join('\n');
}

// --- Dialogue performance ---

export function buildDialoguePerformanceReport(script) {
	const missingPerformance = [];
	const partialPerformance = [];
	const missingVariantFields = [];
	const missingAddressee = [];

	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		if (!cue.performance) {
			missingPerformance.push({ cueId: cue.id, beatId: cue.beatId });
			continue;
		}
		const gaps = [];
		if (!cue.performance.emotion) gaps.push('emotion');
		if (!cue.performance.intention) gaps.push('intention');
		if (!cue.performance.pace) gaps.push('pace');
		if (gaps.length) partialPerformance.push({ cueId: cue.id, gaps });

		const variant = cue.content.variants[cue.content.sourceLanguage];
		if (variant) {
			const vf = [];
			if (!variant.delivery) vf.push('delivery');
			if (variant.estimatedDurationMs === undefined) vf.push('estimatedDurationMs');
			if (!variant.subtitleText) vf.push('subtitleText');
			if (!variant.audioAssetId) vf.push('audioAssetId');
			if (!variant.voiceProfileId) vf.push('voiceProfileId');
			if (vf.length) missingVariantFields.push({ cueId: cue.id, fields: vf });
		}
		if (!cue.addresseeIds?.length) missingAddressee.push({ cueId: cue.id });
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			dialogueCount: script.cues.filter((c) => c.type === 'dialogue').length,
			missingPerformance: missingPerformance.length,
			partialPerformance: partialPerformance.length,
			missingVariantFields: missingVariantFields.length,
			missingAddressee: missingAddressee.length,
			consoleLine: `dialogue w/o performance: ${missingPerformance.length}`
		},
		missingPerformance,
		partialPerformance,
		missingVariantFields,
		missingAddressee
	};
}

export function formatDialoguePerformanceMarkdown(report) {
	const lines = reportHeader(
		'Interpretación y VO',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(`- Diálogos sin performance: **${report.summary.missingPerformance}**`);
	lines.push(`- Performance parcial: **${report.summary.partialPerformance}**`);
	lines.push(`- Variantes sin campos ADR: **${report.summary.missingVariantFields}**`);
	lines.push(`- Sin addresseeIds: **${report.summary.missingAddressee}**`, '');
	return lines.join('\n');
}

// --- Entity binding ---

export function buildEntityBindingReport(script, ctx) {
	const shotsMissingBinding = [];
	const actionWithoutRefs = [];

	for (const shot of script.shots) {
		const scene = ctx.shotScene(shot);
		const hasChars = (scene?.characterIds?.length ?? 0) > 0;
		const hasVisible = (shot.visibleRefs?.length ?? 0) > 0;
		const hasOffScreen = (shot.offScreenCharacterIds?.length ?? 0) > 0;
		if (hasChars && !hasVisible && !hasOffScreen) {
			shotsMissingBinding.push({ shotId: shot.id, sceneNumber: scene?.number });
		}
	}

	for (const cue of script.cues) {
		if (cue.type !== 'action') continue;
		if (!cue.participantRefs?.length && !cue.objectRefs?.length) {
			actionWithoutRefs.push({ cueId: cue.id, beatId: cue.beatId });
		}
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			shotsMissingBinding: shotsMissingBinding.length,
			actionWithoutRefs: actionWithoutRefs.length,
			consoleLine: `binding gaps: ${shotsMissingBinding.length} shots, ${actionWithoutRefs.length} action cues`
		},
		shotsMissingBinding,
		actionWithoutRefs
	};
}

export function formatEntityBindingMarkdown(report) {
	const lines = reportHeader(
		'Vinculación de entidades',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(
		`- Tomas sin visibleRefs/offScreen con personajes en escena: **${report.summary.shotsMissingBinding}**`
	);
	lines.push(
		`- Cues de acción sin participantRefs/objectRefs: **${report.summary.actionWithoutRefs}**`,
		''
	);
	return lines.join('\n');
}

// --- Scene polish ---

export function buildScenePolishReport(script) {
	const missingDramaticPurpose = [];
	const missingTimeOfDay = [];
	const missingContinuity = [];
	const placeholderBeats = [];
	const emptyCharacterIds = [];

	for (const scene of script.scenes) {
		if (!scene.dramaticPurpose?.trim())
			missingDramaticPurpose.push({ sceneId: scene.id, number: scene.number });
		if (!scene.setting?.timeOfDay)
			missingTimeOfDay.push({ sceneId: scene.id, number: scene.number });
		if (!scene.setting?.continuity)
			missingContinuity.push({ sceneId: scene.id, number: scene.number });
		if (!scene.characterIds?.length && scene.setting?.interiorExterior !== 'EXT') {
			emptyCharacterIds.push({ sceneId: scene.id, number: scene.number });
		}
	}
	for (const beat of script.beats) {
		if (BEAT_PLACEHOLDER_RE.test(beat.purpose ?? '')) {
			placeholderBeats.push({ beatId: beat.id, sceneId: beat.sceneId });
		}
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			missingDramaticPurpose: missingDramaticPurpose.length,
			missingTimeOfDay: missingTimeOfDay.length,
			missingContinuity: missingContinuity.length,
			placeholderBeats: placeholderBeats.length,
			emptyCharacterIds: emptyCharacterIds.length,
			consoleLine: `scene polish: ${missingDramaticPurpose.length} w/o dramaticPurpose`
		},
		missingDramaticPurpose,
		missingTimeOfDay,
		missingContinuity,
		placeholderBeats,
		emptyCharacterIds
	};
}

export function formatScenePolishMarkdown(report) {
	const lines = reportHeader(
		'Pulido de escena/beat',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(`- Escenas sin dramaticPurpose: **${report.summary.missingDramaticPurpose}**`);
	lines.push(`- Escenas sin timeOfDay: **${report.summary.missingTimeOfDay}**`);
	lines.push(`- Escenas sin continuity: **${report.summary.missingContinuity}**`);
	lines.push(`- Beats placeholder: **${report.summary.placeholderBeats}**`, '');
	return lines.join('\n');
}

// --- Cue coverage ---

export function buildCueCoverageReport(script) {
	const byType = {};
	for (const cue of script.cues) {
		byType[cue.type] = (byType[cue.type] ?? 0) + 1;
	}
	const soundNotes = [];
	for (const shot of script.shots) {
		for (const note of shot.notes ?? []) {
			if (note.type === 'sound' || note.type === 'music') {
				soundNotes.push({ shotId: shot.id, type: note.type, text: note.text });
			}
		}
	}
	const unusedTypes = ['sound', 'music', 'silence', 'transition', 'text'].filter((t) => !byType[t]);

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			byType,
			soundNotes: soundNotes.length,
			unusedCueTypes: unusedTypes,
			consoleLine: `cue types: ${Object.entries(byType)
				.map(([k, v]) => `${k}=${v}`)
				.join(', ')}`
		},
		byType,
		soundNotes,
		unusedCueTypes: unusedTypes
	};
}

export function formatCueCoverageMarkdown(report) {
	const lines = reportHeader(
		'Cobertura de cues',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	for (const [type, count] of Object.entries(report.byType)) {
		lines.push(`- \`${type}\`: ${count}`);
	}
	lines.push(`- Notas sound/music en tomas (sin SoundCue): **${report.summary.soundNotes}**`);
	if (report.unusedCueTypes.length) {
		lines.push(
			`- Tipos de cue sin uso: ${report.unusedCueTypes.map((t) => `\`${t}\``).join(', ')}`
		);
	}
	lines.push('');
	return lines.join('\n');
}

// --- Take workflow ---

export function buildTakeWorkflowReport(script) {
	const missingGeneration = [];
	const missingReview = [];
	const singleTakeOnly = [];
	const missingVideo = [];

	for (const take of script.takes) {
		if (!take.generation) missingGeneration.push({ takeId: take.id });
		if (!take.review) missingReview.push({ takeId: take.id });
		if (!take.videoAssetId) missingVideo.push({ takeId: take.id });
	}
	for (const shot of script.shots) {
		if ((shot.takeIds?.length ?? 0) <= 1) {
			singleTakeOnly.push({ shotId: shot.id, takeCount: shot.takeIds?.length ?? 0 });
		}
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			missingGeneration: missingGeneration.length,
			missingReview: missingReview.length,
			singleTakeOnly: singleTakeOnly.length,
			missingVideo: missingVideo.length,
			consoleLine: `take workflow: ${missingGeneration.length} w/o generation`
		},
		missingGeneration,
		missingReview,
		singleTakeOnly,
		missingVideo
	};
}

export function formatTakeWorkflowMarkdown(report) {
	const lines = reportHeader(
		'Flujo de takes',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(`- Sin generation: **${report.summary.missingGeneration}**`);
	lines.push(`- Sin review: **${report.summary.missingReview}**`);
	lines.push(`- Una sola toma candidata: **${report.summary.singleTakeOnly}**`);
	lines.push(`- Sin videoAssetId: **${report.summary.missingVideo}**`, '');
	return lines.join('\n');
}

// --- Dialogue i18n ---

export function buildDialogueI18nReport(script, ctx, projectCtx) {
	const missingVariants = [];
	const source = projectCtx.sourceLanguage;
	const targets = projectCtx.supportedLangs.filter((l) => l !== source);

	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		const missing = targets.filter((lang) => !cue.content.variants[lang]);
		if (missing.length) {
			missingVariants.push({ cueId: cue.id, missing });
		}
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			dialogueCount: script.cues.filter((c) => c.type === 'dialogue').length,
			missingVariantCount: missingVariants.length,
			targets,
			consoleLine: `dialogue without localized variant: ${missingVariants.length}`
		},
		missingVariants
	};
}

export function formatDialogueI18nMarkdown(report) {
	const lines = reportHeader(
		'Cobertura localizada de diálogo',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(
		`- Diálogos sin variante embebida (${report.summary.targets.join(', ')}): **${report.summary.missingVariantCount}**`,
		''
	);
	appendList(
		lines,
		'Detalle',
		report.missingVariants.slice(0, 40),
		(r) => `\`${r.cueId}\` falta: ${r.missing.join(', ')}`
	);
	if (report.missingVariants.length > 40)
		lines.push(`_… y ${report.missingVariants.length - 40} más_`, '');
	return lines.join('\n');
}

// --- Regen briefs ---

export function buildRegenBriefsReport(script, ctx, projectCtx) {
	const briefs = [];
	const locationName = (id) => projectCtx.locationById?.get(id)?.name ?? id;

	for (const take of script.takes) {
		if (!takeNeedsRegeneration(take)) continue;
		const shot = ctx.shotById.get(take.shotId);
		if (!shot) continue;
		const scene = ctx.shotScene(shot);
		const dialogueLines = [];
		for (const p of shot.cuePlacements) {
			const cue = ctx.cueById.get(p.cueId);
			if (cue?.type === 'dialogue') {
				const v = cue.content.variants[cue.content.sourceLanguage];
				dialogueLines.push({ cueId: cue.id, text: v?.spokenText ?? '' });
			}
		}
		briefs.push({
			takeId: take.id,
			shotId: shot.id,
			shotNumber: shot.number,
			sceneNumber: scene?.number,
			locationId: shot.locationId,
			locationName: locationName(shot.locationId),
			description: shot.description,
			purpose: shot.purpose,
			camera: shot.camera,
			composition: shot.composition,
			replacementBrief: take.imageStatus?.replacementBrief,
			dialogueLines,
			completenessFlags: shotCompletenessFlags(shot)
		});
	}

	return {
		scriptId: script.script.id,
		language: 'es',
		generatedAt: new Date().toISOString(),
		summary: {
			briefCount: briefs.length,
			consoleLine: `regen briefs: ${briefs.length}`
		},
		briefs
	};
}

export function formatRegenBriefsMarkdown(report) {
	const lines = reportHeader(
		'Briefs de regeneración',
		report.scriptId,
		report.language,
		report.generatedAt
	);
	lines.push('## Resumen', '');
	lines.push(`- Entradas en cola: **${report.summary.briefCount}**`, '');
	for (const b of report.briefs) {
		lines.push(`### Toma ${b.shotNumber} (\`${b.shotId}\`)`, '');
		lines.push(`- Escena: ${b.sceneNumber} · Lugar: ${b.locationName}`);
		lines.push(`- Descripción: ${b.description}`);
		if (b.purpose) lines.push(`- Propósito: ${b.purpose}`);
		if (b.replacementBrief) lines.push(`- Brief: ${b.replacementBrief}`);
		if (b.completenessFlags.length)
			lines.push(`- Deuda de metadatos: ${b.completenessFlags.join(', ')}`);
		if (b.dialogueLines.length) {
			lines.push('- Diálogo en toma:');
			for (const d of b.dialogueLines) lines.push(`  - ${d.text}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

function appendList(lines, title, items, fmt) {
	lines.push(`## ${title}`, '');
	if (!items?.length) {
		lines.push('_Ninguno._', '');
		return;
	}
	for (const item of items) lines.push(`- ${fmt(item)}`);
	lines.push('');
}
