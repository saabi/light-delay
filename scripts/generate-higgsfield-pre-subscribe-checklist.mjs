/**
 * Generate docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md and
 * data/production/checklists/higgsfield-pre-subscribe.json from current scripts.
 *
 * Usage: node scripts/generate-higgsfield-pre-subscribe-checklist.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const trailer = JSON.parse(readFileSync(join(ROOT, 'data/scripts/light-delay-trailer.json'), 'utf8'));
const festival = JSON.parse(readFileSync(join(ROOT, 'data/scripts/light-delay-festival.json'), 'utf8'));

const trailerShots = trailer.shots.filter((s) => !s.id.includes('-take-'));
const festivalShots = festival.shots.filter((s) => !s.id.includes('-take-'));

function getTake(script, shot) {
	return script.takes.find((t) => t.id === shot.selectedTakeId);
}

function mainRef(shot) {
	const refs = shot.sourceRefs ?? [];
	const m = refs.find((r) => r.scriptId === 'script:light-delay-main-short');
	return m?.shotId ?? null;
}

function durationMs(shot) {
	return shot.targetDurationMs ?? shot.durationMs ?? 0;
}

function sceneKey(sceneId) {
	return (sceneId ?? '').replace(/^[^:]+:scene-/, '');
}

/** Shots that should not burn Higgsfield video credits (static PNG / typography). */
function isTrailerPngSkip(shot, take) {
	if (/^trailer:shot-i-0[2-6]$/.test(shot.id)) return 'title_credits_segment_i';
	const asset = take?.imageAssetId ?? '';
	if (/animatic-title-trailer|placeholder-missing-frame/.test(asset)) {
		if (shot.id === 'trailer:shot-e-02') return 'placeholder_black_cut';
		if (/^trailer:shot-i-0[2-6]$/.test(shot.id)) return 'title_credits';
	}
	return null;
}

function isFestivalPngSkip(shot, take) {
	if (shot.id === 'festival:shot-title-01') return 'film_title_card';
	if (/^festival:shot-h-0[123]$/.test(shot.id)) return 'credits_cards';
	const asset = take?.imageAssetId ?? '';
	if (/animatic-title-film/.test(asset)) return 'film_title_card';
	return null;
}

const festivalData = festivalShots.map((s) => {
	const take = getTake(festival, s);
	return {
		id: s.id,
		main: mainRef(s),
		dur: durationMs(s),
		asset: take?.imageAssetId ?? null,
		scene: sceneKey(s.sceneId),
		pngSkip: isFestivalPngSkip(s, take)
	};
});

const trailerRows = trailerShots.map((s) => {
	const take = getTake(trailer, s);
	const refs = s.sourceRefs ?? [];
	const mainFromRef = refs.find((r) => r.scriptId?.includes('main'))?.shotId;
	return {
		id: s.id,
		scene: sceneKey(s.sceneId),
		main: mainFromRef ?? null,
		dur: durationMs(s),
		asset: take?.imageAssetId ?? null,
		pngSkip: isTrailerPngSkip(s, take)
	};
});

const mainToFestival = {};
for (const f of festivalData) {
	if (!f.main) continue;
	if (!mainToFestival[f.main]) mainToFestival[f.main] = [];
	mainToFestival[f.main].push(f.id);
}

const reuseMatrix = trailerRows.map((t) => {
	const festivalMatches = t.main ? (mainToFestival[t.main] ?? []) : [];
	const genMode = t.pngSkip ? 'png_skip' : festivalMatches.length ? 'reuse_candidate' : 'trailer_only';
	return { ...t, festivalMatches, genMode };
});

const trailerVideoGens = reuseMatrix.filter((r) => r.genMode !== 'png_skip').length;
const trailerPngSkip = reuseMatrix.filter((r) => r.genMode === 'png_skip');

const festivalMustGenerate = festivalData.filter((f) => {
	if (f.pngSkip) return false;
	const coveredByTrailer = f.main && reuseMatrix.some((t) => t.genMode !== 'png_skip' && t.main === f.main);
	return !coveredByTrailer;
});

const festivalReuseFromTrailer = festivalData.filter((f) => {
	if (f.pngSkip) return false;
	return f.main && reuseMatrix.some((t) => t.genMode !== 'png_skip' && t.main === f.main);
});

const creditEstimate = (count, res = '480p') => {
	const perShot = res === '480p' ? 12 : res === '720p' ? 26 : 36;
	return { shots: count, credits: count * perShot, note: `~${perShot} cr/shot @ 4s min bill, ${res}` };
};

const payload = {
	schemaVersion: '1.0.0',
	generatedAt: new Date().toISOString(),
	strategy: {
		plan: 'higgsfield-ultra-monthly',
		subscribeWhen: 'outline_script_animatic_prompts_frozen',
		defaultResolution: '480p',
		festivalProject: 'Cinema Studio festival submission project (all competition gens in-project)'
	},
	counts: {
		trailerShots: trailerShots.length,
		festivalShots: festivalShots.length,
		trailerPngSkip: trailerPngSkip.length,
		trailerVideoGenerations: trailerVideoGens,
		festivalPngSkip: festivalData.filter((f) => f.pngSkip).length,
		festivalReuseFromTrailer: festivalReuseFromTrailer.length,
		festivalMustGenerateAfterTrailer: festivalMustGenerate.length
	},
	creditEstimates: {
		trailerPass: creditEstimate(trailerVideoGens, '480p'),
		festivalIncremental: creditEstimate(festivalMustGenerate.length, '480p'),
		combined480p: creditEstimate(trailerVideoGens + festivalMustGenerate.length, '480p'),
		ultraMonthlyAllowance: 3000
	},
	preSubscribeGates: [
		{ id: 'gate-outline-festival', path: 'data/outlines/light-delay-festival.json', status: 'review' },
		{ id: 'gate-script-festival', path: 'data/scripts/light-delay-festival.json', status: 'review', note: 'Diálogo Zao/Elin pendiente (informe gap A/B/E/F)' },
		{ id: 'gate-script-trailer', path: 'data/scripts/light-delay-trailer.json', status: 'draft_ok' },
		{ id: 'gate-animatic-refs', path: 'static/assets/animatic/', status: 'partial' },
		{ id: 'gate-hf-uploads', path: 'higgsfield-uploads/', status: 'staging' },
		{ id: 'gate-production-plans', path: 'data/production/plans/', status: 'blocked', note: 'compiledPrompt null en todas las tomas' },
		{ id: 'gate-festival-project', path: 'higgsfield.ai Cinema Studio', status: 'external', note: 'Proyecto público sin generaciones aún' }
	],
	trailer: reuseMatrix,
	festival: {
		reuseFromTrailer: festivalReuseFromTrailer.map((f) => ({
			id: f.id,
			main: f.main,
			trailerSource: reuseMatrix.find((t) => t.main === f.main && t.genMode !== 'png_skip')?.id ?? null
		})),
		mustGenerate: festivalMustGenerate.map((f) => ({ id: f.id, scene: f.scene, main: f.main, dur: f.dur })),
		pngSkip: festivalData.filter((f) => f.pngSkip).map((f) => ({ id: f.id, reason: f.pngSkip }))
	},
	trailerPngSkip: trailerPngSkip.map((r) => ({ id: r.id, reason: r.pngSkip, asset: r.asset }))
};

function mdTable(rows, cols) {
	const header = `| ${cols.map((c) => c.label).join(' | ')} |`;
	const sep = `| ${cols.map(() => '---').join(' | ')} |`;
	const body = rows
		.map((r) => `| ${cols.map((c) => String(c.get(r) ?? '').replace(/\|/g, '\\|')).join(' | ')} |`)
		.join('\n');
	return `${header}\n${sep}\n${body}`;
}

const md = `# Checklist pre-suscripción Higgsfield (Ultra × 1 mes)

Documento generado desde los guiones vigentes. Regenerar tras cambios materiales en \`light-delay-trailer.json\` o \`light-delay-festival.json\`:

\`\`\`bash
node scripts/generate-higgsfield-pre-subscribe-checklist.mjs
\`\`\`

**Estrategia:** congelar outline, guion, animatic y prompts **antes** de pagar Ultra (~3 000 cr/mes). Día de suscripción = día de generación. Referencia MCP: [\`docs/technical/HIGGSFIELD_MCP.md\`](../technical/HIGGSFIELD_MCP.md).

**Generado:** ${payload.generatedAt}

---

## Resumen de conteos

| Concepto | Cantidad |
| --- | ---: |
| Tomas tráiler (total) | ${payload.counts.trailerShots} |
| Tomas tráiler — **video HF** | **${payload.counts.trailerVideoGenerations}** |
| Tomas tráiler — **PNG estático** (no gastar crédito) | ${payload.counts.trailerPngSkip} |
| Tomas festival (total) | ${payload.counts.festivalShots} |
| Festival — reutilizar clip del tráiler (mismo \`main:shot-*\`) | ${payload.counts.festivalReuseFromTrailer} |
| Festival — **generar nuevo** tras tráiler | **${payload.counts.festivalMustGenerateAfterTrailer}** |
| Festival — PNG estático (título/créditos) | ${payload.counts.festivalPngSkip} |

### Presupuesto de créditos (orientativo @ 480p, 4 s mínimo)

| Fase | Tomas | Créditos ~ |
| --- | ---: | ---: |
| Pasada tráiler | ${payload.creditEstimates.trailerPass.shots} | ${payload.creditEstimates.trailerPass.credits} |
| Festival incremental | ${payload.creditEstimates.festivalIncremental.shots} | ${payload.creditEstimates.festivalIncremental.credits} |
| **Total 1× sin reintentos** | ${payload.creditEstimates.combined480p.shots} | **${payload.creditEstimates.combined480p.credits}** |
| Ultra mensual | — | ~${payload.creditEstimates.ultraMonthlyAllowance} |

Margen para reintentos @ 480p: ~${payload.creditEstimates.ultraMonthlyAllowance - payload.creditEstimates.combined480p.credits} cr (si no hay deriva de duración/resolución).

---

## Puertas pre-suscripción (cerrar antes de pagar)

| ID | Recurso | Estado |
| --- | --- | --- |
${payload.preSubscribeGates.map((g) => `| ${g.id} | \`${g.path}\` | ${g.status}${g.note ? ` — ${g.note}` : ''} |`).join('\n')}

### Checklist editorial (manual)

- [ ] Outline festival causalmente cerrado (\`data/outlines/light-delay-festival.json\`)
- [ ] Pasada de diálogo Zao/Elin (sec. A, B, E, F) aplicada al guion festival
- [ ] Tráiler: omisiones deliberadas verificadas (sin culpable, sin envío/muerte confirmados)
- [ ] Animatic: duraciones y \`imageAssetId\` validados (\`npm run validate\`)
- [ ] Referencias en \`higgsfield-uploads/\` completas por personaje/escena
- [ ] \`compiledPrompt\` aprobado por toma en planes de producción
- [ ] Proyecto festival Cinema Studio: brief, póster, slot WIP listo
- [ ] Runbook: gens **dentro** del proyecto festival (auditoría + grants)

---

## Tráiler — matriz por toma (${payload.counts.trailerShots})

| Toma | Escena | Main | ms | Modo | Festival paralelo |
| --- | --- | --- | ---: | --- | --- |
${reuseMatrix
	.map(
		(r) =>
			`| \`${r.id}\` | ${r.scene} | ${r.main ?? '—'} | ${r.dur} | **${r.genMode}** | ${r.festivalMatches.map((id) => `\`${id}\``).join(', ') || '—'} |`
	)
	.join('\n')}

**Modos:** \`png_skip\` = montar desde PNG en repo; \`reuse_candidate\` = gen HF en tráiler reutilizable en festival; \`trailer_only\` = solo tráiler (p. ej. montaje comprimido).

### Tráiler — PNG skip (no video HF)

${trailerPngSkip.length ? trailerPngSkip.map((r) => `- \`${r.id}\` — ${r.pngSkip} (\`${r.asset}\`)`).join('\n') : '_Ninguna_'}

---

## Festival — reutilizar desde tráiler (${payload.counts.festivalReuseFromTrailer})

| Toma festival | Main | Origen tráiler |
| --- | --- | --- |
${payload.festival.reuseFromTrailer
	.map((r) => `| \`${r.id}\` | ${r.main ?? '—'} | ${r.trailerSource ? `\`${r.trailerSource}\`` : '—'} |`)
	.join('\n')}

---

## Festival — generar nuevo tras tráiler (${payload.counts.festivalMustGenerateAfterTrailer})

Prioridad sugerida: **E → F → G** (auditoría, cuarentena, contacto), luego huecos en **D**, luego refinados en **A–C**.

| Toma | Escena | Main | ms |
| --- | --- | --- | ---: |
${payload.festival.mustGenerate
	.map((r) => `| \`${r.id}\` | ${r.scene} | ${r.main ?? '—'} | ${r.dur} |`)
	.join('\n')}

### Festival — PNG skip

${payload.festival.pngSkip.map((r) => `- \`${r.id}\` — ${r.reason}`).join('\n')}

---

## Orden de ejecución post-suscripción

1. **Día 0:** Conectar MCP; prueba de saldo; primera gen de humo en proyecto festival.
2. **Fase A — Tráiler:** ${payload.counts.trailerVideoGenerations} gens @ 480p; montar ~1:42; publicar WIP.
3. **Fase B — Festival:** ${payload.counts.festivalMustGenerateAfterTrailer} gens nuevos; reutilizar ${payload.counts.festivalReuseFromTrailer} clips del tráiler; audio IA en proyecto.
4. **Fase C — Cierre:** extender a ≥3:00; watermark; submit final + post social antes del **14 sep 2026**.

---

## JSON machine-readable

Snapshot: \`data/production/checklists/higgsfield-pre-subscribe.json\`
`;

mkdirSync(join(ROOT, 'data/production/checklists'), { recursive: true });
mkdirSync(join(ROOT, 'docs/production'), { recursive: true });
writeFileSync(join(ROOT, 'data/production/checklists/higgsfield-pre-subscribe.json'), JSON.stringify(payload, null, 2) + '\n');
writeFileSync(join(ROOT, 'docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md'), md);
console.log('Wrote docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md');
console.log('Wrote data/production/checklists/higgsfield-pre-subscribe.json');
console.log(JSON.stringify(payload.counts, null, 2));
