/**
 * Build data/scripts/light-delay-trailer.json from the trailer brief and
 * reused animatic frames (imageAssetId) of the main short.
 *
 * Authority: docs/Light Delay — Tráiler de la versión de 30 minutos.md
 * Usage: node scripts/build-trailer-script.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const main = JSON.parse(
	readFileSync(join(ROOT, 'data/scripts/light-delay-main-short.json'), 'utf8')
);

const shotById = Object.fromEntries(main.shots.map((s) => [s.id, s]));
const takeById = Object.fromEntries(main.takes.map((t) => [t.id, t]));

function mainTake(shotId) {
	const shot = shotById[shotId];
	if (!shot) throw new Error(`Missing main shot ${shotId}`);
	const take = takeById[shot.selectedTakeId];
	if (!take?.imageAssetId) throw new Error(`Missing take/image for ${shotId}`);
	return { shot, take };
}

function dialogue(id, beatId, order, speakerId, spokenText, presentation, sourceCueId) {
	const cue = {
		id,
		beatId,
		order,
		type: 'dialogue',
		speakerId,
		presentation,
		content: {
			sourceLanguage: 'es',
			variants: {
				es: { spokenText, status: 'source' }
			}
		}
	};
	if (sourceCueId) {
		cue.sourceRefs = [{ scriptId: 'script:light-delay-main-short', cueId: sourceCueId }];
	}
	return cue;
}

function textCue(id, beatId, order, text, presentation = 'interface') {
	return {
		id,
		beatId,
		order,
		type: 'text',
		presentation,
		content: {
			sourceLanguage: 'es',
			variants: {
				es: { text, status: 'source' }
			}
		}
	};
}

/** Editorial map: trailer shots → main frames + compressed durations (total 90s). */
const SEGMENTS = [
	{
		key: 'a',
		title: 'Escala',
		summary: 'Negro a Proxima / Celestial Ardor; misión en V.O.',
		dramaticPurpose: 'Abrir con escala y doctrina de contacto.',
		locationId: 'location:proxima-dock',
		targetDurationMs: 8000,
		characterIds: ['character:voss', 'character:zao', 'character:rao', 'character:sorell'],
		shots: [
			{ mainShotId: 'main:shot-01-01', durationMs: 3500 },
			{ mainShotId: 'main:shot-01-08', durationMs: 4500 }
		]
	},
	{
		key: 'b',
		title: 'La misión',
		summary: 'Separación, núcleo y saludo; tarjeta PRIMER CONTACTO.',
		dramaticPurpose: 'Promesa de la misión diplomática.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 10000,
		characterIds: ['character:sorell', 'character:voss', 'character:cael', 'character:zao'],
		shots: [
			{ mainShotId: 'main:shot-02-04', durationMs: 3000 },
			{ mainShotId: 'main:shot-04-01', durationMs: 3500 },
			{ mainShotId: 'main:shot-14-05', durationMs: 3500 }
		]
	},
	{
		key: 'c',
		title: 'La anomalía',
		summary: 'Zao detecta la rama ejecutable no declarada.',
		dramaticPurpose: 'Introducir el peligro técnico.',
		locationId: 'location:diplomatic-core-room',
		targetDurationMs: 13000,
		characterIds: ['character:zao'],
		shots: [
			{ mainShotId: 'main:shot-04-02', durationMs: 4000 },
			{ mainShotId: 'main:shot-05-02', durationMs: 4500 },
			{ mainShotId: 'main:shot-05-01', durationMs: 4500 }
		]
	},
	{
		key: 'd',
		title: 'La advertencia',
		summary: 'Harlan corta wireless y COM A/B; Zao encuentra una salida por el láser exterior.',
		dramaticPurpose: 'Convertir la transmisión en una decisión bajo presión.',
		locationId: 'location:diplomatic-core-room',
		targetDurationMs: 13000,
		characterIds: ['character:zao', 'character:harlan'],
		shots: [
			{ mainShotId: 'main:shot-05-04', durationMs: 3000 },
			{ mainShotId: 'main:shot-05-07', durationMs: 3500 },
			{ mainShotId: 'main:shot-06-02', durationMs: 3500 },
			{ mainShotId: 'main:shot-06-03', durationMs: 3000 }
		]
	},
	{
		key: 'e',
		title: 'Punto de no retorno',
		summary: 'Transmisión completa; silueta O.S.; golpe a negro.',
		dramaticPurpose: 'Cierre del acto en Proxima.',
		locationId: 'location:diplomatic-core-room',
		targetDurationMs: 7000,
		characterIds: ['character:zao', 'character:harlan'],
		shots: [
			{ mainShotId: 'main:shot-06-07', durationMs: 3500 },
			{ mainShotId: 'main:shot-06-08', durationMs: 3500 }
		]
	},
	{
		key: 'f',
		title: 'La nave llega primero',
		summary: 'Cruce de la garganta; T+23 h; Elin contra reloj.',
		dramaticPurpose: 'Salto temporal y presión técnica.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 11000,
		characterIds: ['character:rao', 'character:voss', 'character:cael'],
		shots: [
			{ mainShotId: 'main:shot-07-08', durationMs: 3000 },
			{ mainShotId: 'main:shot-07-10', durationMs: 3000 },
			{ mainShotId: 'main:shot-08-01', durationMs: 2000 },
			{ mainShotId: 'main:shot-10-01', durationMs: 3000 }
		]
	},
	{
		key: 'g',
		title: 'La señal',
		summary: 'Portadora humana; OVR; fragmento de Zao.',
		dramaticPurpose: 'La advertencia alcanza a la nave.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 11000,
		characterIds: [
			'character:cael',
			'character:voss',
			'character:rao',
			'character:sorell',
			'character:zao'
		],
		shots: [
			{ mainShotId: 'main:shot-11-05', durationMs: 3000 },
			{ mainShotId: 'main:shot-12-01', durationMs: 2500 },
			{ mainShotId: 'main:shot-12-02', durationMs: 3000 },
			{ mainShotId: 'main:shot-10-06', durationMs: 2500 }
		]
	},
	{
		key: 'h',
		title: 'El reloj',
		summary: 'Montaje acelerado hacia el umbral Velari.',
		dramaticPurpose: 'Clímax sin revelar el desenlace.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 9000,
		characterIds: ['character:rao', 'character:voss', 'character:cael', 'character:sorell'],
		shots: [
			{ mainShotId: 'main:shot-14-02', durationMs: 2000 },
			{ mainShotId: 'main:shot-14-04', durationMs: 1500 },
			{ mainShotId: 'main:shot-14-06', durationMs: 1500 },
			{ mainShotId: 'main:shot-14-05', durationMs: 1500 },
			{ mainShotId: 'main:shot-16-01', durationMs: 2500 }
		]
	},
	{
		key: 'i',
		title: 'Título',
		summary: 'LIGHT DELAY / LUZ TARDÍA y lema; pulso Velari.',
		dramaticPurpose: 'Cierre de marca.',
		locationId: 'location:velari-station',
		targetDurationMs: 8000,
		characterIds: ['character:zao'],
		shots: [
			{ mainShotId: 'main:shot-16-03', durationMs: 4000 },
			{ mainShotId: 'main:shot-17-06', durationMs: 4000 }
		]
	}
];

const locationsFile = JSON.parse(readFileSync(join(ROOT, 'data/locations.json'), 'utf8'));
const knownLocations = new Set(locationsFile.locations.map((l) => l.id));
function resolveLocation(id, mainShotId) {
	if (knownLocations.has(id)) return id;
	const fromShot = shotById[mainShotId]?.locationId;
	if (fromShot && knownLocations.has(fromShot)) return fromShot;
	return 'location:proxima-dock';
}

const acts = [
	{
		id: 'trailer:act-1',
		number: 1,
		title: 'Tráiler ~1:30',
		dramaticPurpose: 'Promesa, amenaza y umbral sin spoilear el desenlace.',
		sceneIds: SEGMENTS.map((s) => `trailer:scene-${s.key}`)
	}
];

const scenes = [];
const beats = [];
const cues = [];
const shots = [];
const takes = [];

let globalShotOrder = 0;
let totalMs = 0;

for (const [si, seg] of SEGMENTS.entries()) {
	const sceneId = `trailer:scene-${seg.key}`;
	const beatId = `trailer:beat-${seg.key}-01`;
	const firstMain = seg.shots[0].mainShotId;
	const locationId = resolveLocation(seg.locationId, firstMain);

	const sceneShotIds = [];
	const sceneCueIds = [];

	scenes.push({
		id: sceneId,
		actId: 'trailer:act-1',
		number: si + 1,
		order: si + 1,
		title: seg.title,
		locationId,
		setting: { interiorExterior: 'INT_EXT', timeOfDay: 'CONTINUO' },
		summary: seg.summary,
		dramaticPurpose: seg.dramaticPurpose,
		characterIds: seg.characterIds,
		beatIds: [beatId],
		shotIds: sceneShotIds,
		targetDurationMs: seg.targetDurationMs,
		sourceRefs: seg.shots.map((s) => ({
			scriptId: 'script:light-delay-main-short',
			shotId: s.mainShotId
		}))
	});

	beats.push({
		id: beatId,
		sceneId,
		order: 1,
		title: seg.title,
		purpose: seg.dramaticPurpose,
		summary: seg.summary,
		cueIds: sceneCueIds
	});

	// Segment-specific cues (trailer brief copy)
	const addCue = (cue, attachShotIndex = 0) => {
		cues.push(cue);
		sceneCueIds.push(cue.id);
		const shotRef = seg.shots[Math.min(attachShotIndex, seg.shots.length - 1)];
		shotRef._placements = shotRef._placements || [];
		shotRef._placements.push({
			cueId: cue.id,
			atMs: 0,
			durationMs: Math.min(shotRef.durationMs, 4000)
		});
	};

	if (seg.key === 'a') {
		addCue(
			dialogue(
				'trailer:cue-a-01',
				beatId,
				1,
				'character:voss',
				'Primer contacto. Entramos, saludamos y escuchamos.',
				'voice_over',
				null
			),
			0
		);
	}
	if (seg.key === 'b') {
		addCue(textCue('trailer:cue-b-01', beatId, 1, 'PRIMER CONTACTO', 'title'), 1);
		addCue(
			dialogue(
				'trailer:cue-b-02',
				beatId,
				2,
				'character:sorell',
				'Esto es lenguaje. Una forma de decir quiénes somos.',
				'voice_over',
				'main:cue-01-15'
			),
			2
		);
	}
	if (seg.key === 'c') {
		addCue(
			dialogue(
				'trailer:cue-c-01',
				beatId,
				1,
				'character:zao',
				'Eso no debería estar ahí.',
				'on_screen',
				'main:cue-04-02'
			),
			0
		);
		addCue(textCue('trailer:cue-c-02', beatId, 2, 'RAMA EJECUTABLE NO DECLARADA', 'interface'), 1);
		addCue(
			dialogue(
				'trailer:cue-c-03',
				beatId,
				3,
				'character:zao',
				'No es un error.',
				'on_screen',
				'main:cue-04-02'
			),
			2
		);
	}
	if (seg.key === 'd') {
		addCue(
			dialogue(
				'trailer:cue-d-01',
				beatId,
				1,
				'character:zao',
				'La firma parece falsa. El relé físico apunta a—',
				'on_screen',
				'main:cue-05-06'
			),
			0
		);
		addCue(
			textCue('trailer:cue-d-02', beatId, 2, 'SIN ENLACE / COM A-B SIN PORTADORA', 'interface'),
			1
		);
	}
	if (seg.key === 'e') {
		addCue(textCue('trailer:cue-e-01', beatId, 1, 'TRANSMISIÓN 70%… 92%…', 'interface'), 0);
		addCue(
			dialogue(
				'trailer:cue-e-02',
				beatId,
				2,
				'character:harlan',
				'¿A quién le escribís?',
				'off_screen',
				'main:cue-06-04'
			),
			0
		);
		addCue(textCue('trailer:cue-e-03', beatId, 3, '100% — TRANSMITIDO', 'interface'), 1);
		addCue(
			dialogue(
				'trailer:cue-e-04',
				beatId,
				4,
				'character:zao',
				'Ya está hecho.',
				'on_screen',
				'main:cue-06-05'
			),
			1
		);
	}
	if (seg.key === 'f') {
		addCue(textCue('trailer:cue-f-01', beatId, 1, '23 HORAS DESPUÉS', 'time_card'), 2);
		addCue(
			textCue('trailer:cue-f-02', beatId, 2, 'CONTACTO VELARI — APROXIMACIÓN FINAL', 'time_card'),
			2
		);
		addCue(
			dialogue(
				'trailer:cue-f-03',
				beatId,
				3,
				'character:rao',
				'Sé qué hace.',
				'on_screen',
				'main:cue-10-04'
			),
			3
		);
		addCue(
			dialogue(
				'trailer:cue-f-04',
				beatId,
				4,
				'character:rao',
				'No sé quién lo controla.',
				'on_screen',
				'main:cue-10-04'
			),
			3
		);
	}
	if (seg.key === 'g') {
		addCue(
			dialogue(
				'trailer:cue-g-01',
				beatId,
				1,
				'character:cael',
				'Señal humana.',
				'on_screen',
				'main:cue-11-06'
			),
			0
		);
		addCue(
			dialogue('trailer:cue-g-02', beatId, 2, 'character:voss', '¿De dónde?', 'on_screen', null),
			0
		);
		addCue(
			dialogue(
				'trailer:cue-g-03',
				beatId,
				3,
				'character:cael',
				'De nuestro corredor de vuelo.',
				'on_screen',
				'main:cue-11-06'
			),
			0
		);
		addCue(
			textCue('trailer:cue-g-04', beatId, 4, 'ORIGEN: LÁSER EXTERIOR / CONTROL LOCAL', 'interface'),
			1
		);
		addCue(textCue('trailer:cue-g-05', beatId, 5, 'OVR-7C41 / TITULAR CIFRADO', 'interface'), 3);
		addCue(
			dialogue(
				'trailer:cue-g-06',
				beatId,
				6,
				'character:zao',
				'…no apaguen la mediación…',
				'voice_over',
				'main:cue-12-02'
			),
			2
		);
	}
	if (seg.key === 'h') {
		addCue(textCue('trailer:cue-h-01', beatId, 1, 'CANAL VELARI — 01:32', 'interface'), 0);
		addCue(
			textCue('trailer:cue-h-02', beatId, 2, 'SALUDO SORELL-ZAO / SÓLO LECTURA', 'interface'),
			3
		);
		addCue(
			dialogue(
				'trailer:cue-h-03',
				beatId,
				3,
				'character:rao',
				'Si me equivoco, hablamos por él.',
				'on_screen',
				null
			),
			1
		);
	}
	if (seg.key === 'i') {
		addCue(
			dialogue(
				'trailer:cue-i-01',
				beatId,
				1,
				'character:zao',
				'Si esto llega...',
				'voice_over',
				'main:cue-06-09'
			),
			0
		);
		addCue(textCue('trailer:cue-i-02', beatId, 2, 'LIGHT DELAY', 'title'), 0);
		addCue(textCue('trailer:cue-i-03', beatId, 3, 'LUZ TARDÍA', 'title'), 0);
		addCue(
			textCue(
				'trailer:cue-i-04',
				beatId,
				4,
				'A VECES, LLEGAR TARDE ES LLEGAR A TIEMPO.',
				'caption'
			),
			1
		);
	}

	for (const [oi, spec] of seg.shots.entries()) {
		globalShotOrder += 1;
		totalMs += spec.durationMs;
		const { shot: mainShot, take: mainTakeRec } = mainTake(spec.mainShotId);
		const shotId = `trailer:shot-${seg.key}-${String(oi + 1).padStart(2, '0')}`;
		const takeId = `trailer:take-${seg.key}-${String(oi + 1).padStart(2, '0')}-01`;
		sceneShotIds.push(shotId);

		shots.push({
			id: shotId,
			sceneId,
			beatIds: [beatId],
			number: oi + 1,
			order: globalShotOrder,
			description: mainShot.description,
			locationId: mainShot.locationId || locationId,
			composition: mainShot.composition,
			camera: mainShot.camera,
			durationMs: spec.durationMs,
			cuePlacements: spec._placements || [],
			takeIds: [takeId],
			selectedTakeId: takeId,
			sourceRefs: [
				{
					scriptId: 'script:light-delay-main-short',
					shotId: spec.mainShotId
				}
			],
			notes: [
				{
					type: 'editorial',
					text: `Reutiliza frame de ${spec.mainShotId} (asset ${mainTakeRec.imageAssetId}).`
				}
			]
		});

		takes.push({
			id: takeId,
			shotId,
			number: 1,
			status: 'selected',
			imageAssetId: mainTakeRec.imageAssetId,
			imageStatus: {
				status: 'needs_regeneration',
				reasons: ['canon_mismatch'],
				explanation:
					'Still desactualizado tras el cambio de orientación de la Ardor (cubiertas perpendiculares al progrado) y la revisión visual de exteriores; regenerar la toma.',
				replacementBrief:
					'Regenerar coherente con la arquitectura actual (empuje = arriba), encuadre y descripción de la toma; no reutilizar frames previos del animatic.'
			}
		});
	}

	// Fix beat cueIds order from sceneCueIds already populated
	beats[beats.length - 1].cueIds = sceneCueIds;
	scenes[scenes.length - 1].shotIds = sceneShotIds;
}

if (totalMs !== 90000) {
	console.warn(`Warning: total duration ${totalMs}ms (expected 90000)`);
}

const file = {
	schemaVersion: '1.0.0',
	script: {
		id: 'script:light-delay-trailer',
		projectId: 'project:light-delay',
		continuityId: 'continuity:light-delay-primary',
		title: 'Light Delay — Tráiler (~1:30)',
		version: '0.2.0-draft',
		status: 'draft',
		kind: 'trailer',
		targetDurationMs: 90000,
		lineage: {
			sourceScriptId: 'script:light-delay-main-short',
			relationship: 'trailer',
			sourceVersion: '1.1.0-draft',
			notes:
				'Tráiler según docs/Light Delay — Tráiler de la versión de 30 minutos.md. Frames reutilizados del animatic principal vía imageAssetId; diálogos condensados del brief.'
		},
		declaredEntityRefs: ['zao', 'voss', 'harlan', 'rao', 'sorell', 'cael'].map((id) => ({
			kind: 'character',
			id: `character:${id}`
		})),
		comparisonProfile: {
			version: '1.1.0',
			canonClaims: main.script.comparisonProfile.canonClaims,
			eventCoverage: [
				['event:embarkation', 'reworked', ['trailer:scene-a', 'trailer:scene-b']],
				['event:anomaly-discovery', 'reworked', ['trailer:scene-c']],
				['event:zao-warning-death', 'reworked', ['trailer:scene-d', 'trailer:scene-e']],
				['event:tunnel-crossing', 'present', ['trailer:scene-f']],
				['event:investigation', 'reworked', ['trailer:scene-f']],
				['event:message-reception', 'present', ['trailer:scene-g']],
				['event:harlan-exposed', 'reworked', ['trailer:scene-g']],
				['event:quarantine', 'present', ['trailer:scene-h']],
				['event:clean-greeting', 'reworked', ['trailer:scene-h']],
				['event:first-contact', 'present', ['trailer:scene-h', 'trailer:scene-i']]
			]
				.map(([eventId, status, sceneIds]) => ({ eventId, status, sceneIds }))
				.concat({
					eventId: 'event:aftermath',
					status: 'omitted',
					note: 'El tráiler termina en el umbral del contacto.'
				})
		},
		characterFunctionAssignments: [
			{ functionId: 'function:command', characterId: 'character:voss', relationship: 'unchanged' },
			{
				functionId: 'function:investigation_payload',
				characterId: 'character:rao',
				relationship: 'unchanged'
			},
			{
				functionId: 'function:communications',
				characterId: 'character:cael',
				relationship: 'unchanged'
			},
			{
				functionId: 'function:diplomatic_greeting_authorship',
				characterId: 'character:sorell',
				relationship: 'unchanged'
			},
			{
				functionId: 'function:override_antagonist',
				characterId: 'character:harlan',
				relationship: 'unchanged',
				notes: 'En el tráiler la voz O.S. permanece deliberadamente no identificable en pantalla.'
			},
			{ functionId: 'function:piloting', characterId: 'character:cael', relationship: 'unchanged' }
		],
		actIds: ['trailer:act-1']
	},
	acts,
	sequences: [],
	scenes,
	beats,
	cues,
	shots,
	takes
};

const out = join(ROOT, 'data/scripts/light-delay-trailer.json');
writeFileSync(out, JSON.stringify(file, null, 2) + '\n', 'utf8');
console.log(
	`Wrote ${out} scenes=${scenes.length} shots=${shots.length} takes=${takes.length} cues=${cues.length} durationMs=${totalMs}`
);
