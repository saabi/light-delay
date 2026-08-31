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
import { assertGeneratedCheck, mergeGeneratedInlineI18n } from './lib/generated-inline-i18n.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ROOT, 'data/scripts/light-delay-trailer.json');
const previous = JSON.parse(readFileSync(out, 'utf8'));
const checkOnly = process.argv.includes('--check');
const L = (es, en) => ({ es, en });
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

function dialogue(
	id,
	beatId,
	order,
	speakerId,
	spokenText,
	presentation,
	sourceCueId,
	spokenTextEn
) {
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
				es: { spokenText, status: 'source' },
				...(spokenTextEn ? { en: { spokenText: spokenTextEn, status: 'draft' } } : {})
			}
		}
	};
	if (sourceCueId) {
		cue.sourceRefs = [{ scriptId: 'script:light-delay-main-short', cueId: sourceCueId }];
	}
	return cue;
}

function textCue(id, beatId, order, text, presentation = 'interface', textEn) {
	return {
		id,
		beatId,
		order,
		type: 'text',
		presentation,
		content: {
			sourceLanguage: 'es',
			variants: {
				es: { text, status: 'source' },
				...(textEn ? { en: { text: textEn, status: 'draft' } } : {})
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
		dramaticPurposeEn: 'Open with scale and the contact doctrine.',
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
		dramaticPurposeEn: 'Promise the diplomatic mission.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 10100,
		characterIds: ['character:sorell', 'character:voss', 'character:cael', 'character:zao'],
		shots: [
			{ mainShotId: 'main:shot-02-04', durationMs: 3000 },
			{ mainShotId: 'main:shot-04-01', durationMs: 3500 },
			{ mainShotId: 'main:shot-14-05', durationMs: 3600 }
		]
	},
	{
		key: 'c',
		title: 'La anomalía',
		summary: 'Zao detecta la rama ejecutable no declarada.',
		dramaticPurpose: 'Introducir el peligro técnico.',
		dramaticPurposeEn: 'Introduce the technical danger.',
		locationId: 'location:diplomatic-core-room',
		targetDurationMs: 13600,
		characterIds: ['character:zao'],
		shots: [
			{ mainShotId: 'main:shot-04-02', durationMs: 4000 },
			{ mainShotId: 'main:shot-04-03', durationMs: 4500 },
			{ mainShotId: 'main:shot-05-01', durationMs: 4500 }
		]
	},
	{
		key: 'd',
		title: 'La advertencia',
		titleEn: 'The warning',
		summary: 'Alguien corta wireless y COM A/B; Zao busca una salida por el láser exterior.',
		summaryEn: 'Someone cuts wireless and COM A/B; Zao seeks a way out through the external laser.',
		dramaticPurpose: 'Convertir la transmisión en una decisión bajo presión.',
		dramaticPurposeEn: 'Turn the transmission into a decision under pressure.',
		locationId: 'location:diplomatic-core-room',
		targetDurationMs: 13000,
		characterIds: ['character:zao'],
		shots: [
			{
				mainShotId: 'main:shot-05-04',
				durationMs: 3600,
				description: 'Una mano no identificable activa el jammer y la voz de Zao se corta.',
				descriptionEn: 'An unidentifiable hand activates the jammer and Zao’s voice cuts out.',
				cameraDescription:
					'Detalle cerrado que excluye rostro, uniforme e insignias; no identifica al culpable.',
				cameraDescriptionEn:
					'Tight detail excluding face, uniform, and insignia; it does not identify the culprit.'
			},
			{ mainShotId: 'main:shot-05-06', durationMs: 3500 },
			{ mainShotId: 'main:shot-06-01', durationMs: 3500 },
			{ mainShotId: 'main:shot-06-03', durationMs: 3000 }
		]
	},
	{
		key: 'e',
		title: 'Punto de no retorno',
		titleEn: 'Point of no return',
		summary:
			'La transmisión avanza bajo presión; una presencia irrumpe y un corte breve a negro deja inciertos tanto el envío como el destino de Zao.',
		summaryEn:
			'The transmission advances under pressure; a presence intrudes and a brief cut to black leaves both the send and Zao’s fate uncertain.',
		dramaticPurpose: 'Cerrar el acto en Proxima sin confirmar si el mensaje salió ni si Zao murió.',
		dramaticPurposeEn:
			'Close the act at Proxima without confirming whether the message was sent or Zao died.',
		locationId: 'location:diplomatic-core-room',
		targetDurationMs: 7000,
		characterIds: ['character:zao'],
		shots: [
			{
				mainShotId: 'main:shot-06-09',
				durationMs: 4500,
				description:
					'El progreso del envío sube sin alcanzar una confirmación visible mientras una presencia entra fuera de foco.',
				descriptionEn:
					'Send progress rises without reaching visible confirmation while a presence enters out of focus.',
				cameraDescription:
					'Primer plano de Zao y del progreso todavía incompleto; la identidad de la figura permanece oculta.',
				cameraDescriptionEn:
					'Close-up on Zao and still-incomplete progress; the figure’s identity remains hidden.'
			},
			{
				mainShotId: 'main:shot-07-02',
				durationMs: 2500,
				description:
					'Corte breve a negro antes del ataque; la música conserva el pulso y el montaje sale del negro sin confirmar la muerte.',
				descriptionEn:
					'Brief cut to black before the attack; the score keeps its pulse and the edit leaves black without confirming death.',
				cameraDescription:
					'Negro breve; la música conserva el pulso y la imagen siguiente llega antes de que el silencio resuelva lo ocurrido.',
				cameraDescriptionEn:
					'Brief black; the score keeps its pulse and the next image arrives before silence can resolve what happened.'
			}
		]
	},
	{
		key: 'f',
		title: 'La nave llega primero',
		summary: 'Cruce de la garganta; aproximación remota bajo desaceleración; Elin contra reloj.',
		summaryEn: 'Throat crossing; remote approach under deceleration; Elin races the clock.',
		dramaticPurpose: 'Salto temporal y presión técnica.',
		dramaticPurposeEn: 'Create a temporal jump and technical pressure.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 11200,
		characterIds: ['character:rao', 'character:voss', 'character:cael'],
		shots: [
			{ mainShotId: 'main:shot-07-08', durationMs: 3000 },
			{ mainShotId: 'main:shot-07-10', durationMs: 3000 },
			{ mainShotId: 'main:shot-08-02', durationMs: 2000 },
			{ mainShotId: 'main:shot-10-01', durationMs: 3200 }
		]
	},
	{
		key: 'g',
		title: 'La amenaza',
		titleEn: 'The threat',
		summary:
			'La auditoría revela que la carga espera la apertura del canal y que alguien conserva un override anónimo.',
		summaryEn:
			'The audit reveals that the payload is waiting for the channel to open and that someone retains an anonymous override.',
		dramaticPurpose: 'Mostrar el peligro inmediato sin revelar si la advertencia de Zao llegó.',
		dramaticPurposeEn: 'Show the immediate danger without revealing whether Zao’s warning arrived.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 11600,
		characterIds: ['character:voss', 'character:rao', 'character:sorell'],
		shots: [
			{ mainShotId: 'main:shot-10-02', durationMs: 2800 },
			{ mainShotId: 'main:shot-10-03', durationMs: 3000 },
			{ mainShotId: 'main:shot-10-04', durationMs: 2800 },
			{ mainShotId: 'main:shot-10-05', durationMs: 3000 }
		]
	},
	{
		key: 'h',
		title: 'El reloj',
		summary: 'Montaje bajo desaceleración hacia el corte programado de motor y el umbral Velari.',
		summaryEn: 'Montage under deceleration toward the scheduled engine cutoff and the Velari threshold.',
		dramaticPurpose: 'Clímax sin revelar el desenlace.',
		dramaticPurposeEn: 'Build the climax without revealing its outcome.',
		locationId: 'location:celestial-ardor-bridge',
		targetDurationMs: 10000,
		characterIds: ['character:rao', 'character:voss', 'character:cael', 'character:sorell'],
		shots: [
			{
				mainShotId: 'main:shot-14-02',
				durationMs: 2000,
				description: 'Reloj inglés: VELARI CHANNEL · OPENS IN 00:48; la Ardor desacelera bajo 1 g.',
				descriptionEn: 'English clock: VELARI CHANNEL · OPENS IN 00:48; the Ardor decelerates under 1 g.'
			},
			{ mainShotId: 'main:shot-14-04', durationMs: 2500 },
			{
				mainShotId: 'main:shot-14-06',
				durationMs: 1500,
				description: 'El corte programado inicia la microgravedad: correas y cables sujetos se elevan mientras una presencia anónima busca el control físico.',
				descriptionEn: 'The scheduled cutoff begins microgravity: secured straps and cables rise as an anonymous presence seeks physical control.'
			},
			{ mainShotId: 'main:shot-14-05', durationMs: 1500 },
			{
				mainShotId: 'main:shot-16-01',
				durationMs: 2500,
				description: 'La Ardor queda diminuta ante la estación y la emisaria inmóviles; el montaje corta antes de resolver qué ocurrirá.',
				descriptionEn: 'The Ardor hangs tiny before the motionless station and emissary; the edit cuts before resolving what will happen.'
			}
		]
	},
	{
		key: 'i',
		title: 'Título y créditos',
		titleEn: 'Title and credits',
		summary: 'Escala Velari sin respuesta confirmada; LUZ TARDÍA / LIGHT DELAY, lema y créditos.',
		summaryEn: 'Velari scale with no confirmed response; LIGHT DELAY, tagline, and credits.',
		dramaticPurpose: 'Cierre de marca y créditos.',
		dramaticPurposeEn: 'Close on the brand and credits.',
		locationId: 'location:velari-station',
		targetDurationMs: 18000,
		characterIds: ['character:zao'],
		shots: [
			{
				mainShotId: 'main:shot-16-03',
				durationMs: 4000,
				description: 'Estación y emisaria conservan luces propias sin sincronizar con la Ardor; el plano no confirma respuesta.',
				descriptionEn: 'Station and emissary retain their own lights without synchronizing with the Ardor; the shot does not confirm a response.'
			},
			{
				mainShotId: 'main:shot-17-06',
				durationMs: 4000,
				description: 'Corte a negro y título LIGHT DELAY.',
				descriptionEn: 'Cut to black and LIGHT DELAY title.',
				promptKey: 'B'
			},
			{
				mainShotId: 'main:shot-17-06',
				durationMs: 2500,
				description: 'Lema en cartela tipográfica.',
				descriptionEn: 'Tagline typographic card.',
				promptKey: 'C'
			},
			{
				mainShotId: 'main:shot-17-06',
				durationMs: 2500,
				description: 'Tarjeta de crédito: escrito y producido por.',
				descriptionEn: 'Credit card: written and produced by.',
				purpose: 'Acreditar autoría y producción.',
				purposeEn: 'Credit authorship and production.',
				promptKey: 'D1'
			},
			{
				mainShotId: 'main:shot-17-06',
				durationMs: 2500,
				description: 'Tarjeta de crédito: asistencia de IA.',
				descriptionEn: 'Credit card: AI assistance.',
				purpose: 'Acreditar asistencia de modelos.',
				purposeEn: 'Credit model assistance.',
				promptKey: 'D2'
			},
			{
				mainShotId: 'main:shot-17-06',
				durationMs: 2500,
				description: 'Tarjeta de crédito: herramientas de producción.',
				descriptionEn: 'Credit card: production tools.',
				purpose: 'Acreditar esquema y herramientas.',
				purposeEn: 'Credit schema and tools.',
				promptKey: 'D3'
			}
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
		title: seg.titleEn ? L(seg.title, seg.titleEn) : seg.title,
		locationId,
		setting: { interiorExterior: 'INT_EXT', timeOfDay: 'CONTINUO' },
		summary: seg.summaryEn ? L(seg.summary, seg.summaryEn) : seg.summary,
		dramaticPurpose: seg.dramaticPurposeEn
			? L(seg.dramaticPurpose, seg.dramaticPurposeEn)
			: seg.dramaticPurpose,
		characterIds: seg.characterIds,
		beatIds: [beatId],
		shotIds: sceneShotIds,
		targetDurationMs: seg.targetDurationMs,
		sourceRefs: seg.shots
			.filter((s) => !s.promptKey)
			.map((s) => ({
				scriptId: 'script:light-delay-main-short',
				shotId: s.mainShotId
			}))
	});

	beats.push({
		id: beatId,
		sceneId,
		order: 1,
		title: seg.titleEn ? L(seg.title, seg.titleEn) : seg.title,
		purpose: seg.dramaticPurposeEn
			? L(seg.dramaticPurpose, seg.dramaticPurposeEn)
			: seg.dramaticPurpose,
		summary: seg.summaryEn ? L(seg.summary, seg.summaryEn) : seg.summary,
		cueIds: sceneCueIds
	});

	// Segment-specific cues (trailer brief copy)
	const addCue = (cue, attachShotIndex = 0, timing = undefined) => {
		cues.push(cue);
		sceneCueIds.push(cue.id);
		const shotRef = seg.shots[Math.min(attachShotIndex, seg.shots.length - 1)];
		shotRef._placements = shotRef._placements || [];
		shotRef._placements.push({
			cueId: cue.id,
			atMs: timing?.atMs ?? 0,
			durationMs: timing?.durationMs ?? Math.min(shotRef.durationMs, 4000)
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
		addCue(textCue('trailer:cue-b-01', beatId, 1, 'PRIMER CONTACTO', 'title', 'FIRST CONTACT'), 1);
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
				'La firma parece falsa. La verdadera firma apunta a—',
				'on_screen',
				'main:cue-05-06',
				'The signature looks forged. The real signature points to—'
			),
			0
		);
		addCue(
			textCue('trailer:cue-d-02', beatId, 2, 'SIN ENLACE / COM A-B SIN PORTADORA', 'interface'),
			1
		);
	}
	if (seg.key === 'e') {
		addCue(
			textCue(
				'trailer:cue-e-01',
				beatId,
				1,
				'TRANSMISIÓN 70%… 92%…',
				'interface',
				'TRANSMISSION 70%… 92%…'
			),
			0
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
			3,
			{ atMs: 0, durationMs: 1400 }
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
			3,
			{ atMs: 1400, durationMs: 1800 }
		);
	}
	if (seg.key === 'g') {
		addCue(
			dialogue(
				'trailer:cue-g-01',
				beatId,
				1,
				'character:rao',
				'Está esperando que abramos el canal.',
				'on_screen',
				'main:cue-10-04',
				'It is waiting for us to open the channel.'
			),
			0,
			{ atMs: 0, durationMs: 2400 }
		);
		addCue(
			textCue(
				'trailer:cue-g-02',
				beatId,
				2,
				'CARGA AUTÓNOMA / DISPARO: CANAL ABIERTO',
				'interface',
				'AUTONOMOUS PAYLOAD / TRIGGER: CHANNEL OPEN'
			),
			1
		);
		addCue(
			textCue(
				'trailer:cue-g-03',
				beatId,
				3,
				'OVERRIDE / TITULAR CIFRADO',
				'interface',
				'OVERRIDE / ENCRYPTED OWNER'
			),
			3
		);
	}
	if (seg.key === 'h') {
		addCue(
			textCue(
				'trailer:cue-h-01',
				beatId,
				1,
				'CANAL VELARI — 00:48',
				'interface',
				'VELARI CHANNEL — 00:48'
			),
			0
		);
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
		addCue(textCue('trailer:cue-i-02', beatId, 2, 'LUZ TARDÍA', 'title', 'LIGHT DELAY'), 1);
		addCue(
			textCue(
				'trailer:cue-i-03',
				beatId,
				3,
				'A VECES, LLEGAR TARDE ES LLEGAR A TIEMPO.',
				'caption',
				'SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME.'
			),
			2
		);
		addCue(
			textCue(
				'trailer:cue-i-04',
				beatId,
				4,
				'ESCRITO Y PRODUCIDO POR\nAUTHOR_NAME_PLACEHOLDER',
				'credits',
				'WRITTEN AND PRODUCED BY\nAUTHOR_NAME_PLACEHOLDER'
			),
			3
		);
		addCue(
			textCue(
				'trailer:cue-i-05',
				beatId,
				5,
				'ASISTENCIA DE IA\nChatGPT · Claude · Gemini · Cursor Composer',
				'credits',
				'AI ASSISTANCE\nChatGPT · Claude · Gemini · Cursor Composer'
			),
			4
		);
		addCue(
			textCue(
				'trailer:cue-i-06',
				beatId,
				6,
				'HERRAMIENTAS DE PRODUCCIÓN\nEsquema y herramientas de producción Light Delay',
				'credits',
				'PRODUCTION TOOLS\nLight Delay schema & production tools'
			),
			5
		);
	}

	for (const [oi, spec] of seg.shots.entries()) {
		globalShotOrder += 1;
		totalMs += spec.durationMs;
		const { shot: mainShot, take: mainTakeRec } = mainTake(spec.mainShotId);
		const shotId = `trailer:shot-${seg.key}-${String(oi + 1).padStart(2, '0')}`;
		const takeId = `trailer:take-${seg.key}-${String(oi + 1).padStart(2, '0')}-01`;
		const shotDescription = spec.description
			? { es: spec.description, en: spec.descriptionEn }
			: mainShot.description;
		sceneShotIds.push(shotId);

		const isTitleCreditCard = Boolean(spec.promptKey);
		const shotNotes = [];
		if (!isTitleCreditCard) {
			shotNotes.push({
				type: 'editorial',
				text: `Reutiliza frame de ${spec.mainShotId} (asset ${mainTakeRec.imageAssetId}).`
			});
		}
		if (spec.promptKey) {
			const promptBlurb = {
				B: 'Prompt B (EN on-image): trailer end brand LIGHT DELAY. See docs/TITLE_AND_CREDITS.md.',
				C: 'Prompt C (EN on-image): tagline SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME. See docs/TITLE_AND_CREDITS.md.',
				D1: 'Prompt D1 (EN on-image): WRITTEN AND PRODUCED BY. See docs/TITLE_AND_CREDITS.md.',
				D2: 'Prompt D2 (EN on-image): AI ASSISTANCE. See docs/TITLE_AND_CREDITS.md.',
				D3: 'Prompt D3 (EN on-image): PRODUCTION TOOLS. See docs/TITLE_AND_CREDITS.md.',
				E: 'Prompt E (alpha): FIRST CONTACT. See docs/TITLE_AND_CREDITS.md.'
			};
			shotNotes.push({
				type: 'production',
				status: 'open',
				priority: 'medium',
				text: L(
					promptBlurb[spec.promptKey] || `Prompt ${spec.promptKey}`,
					promptBlurb[spec.promptKey] || `Prompt ${spec.promptKey}`
				)
			});
		}
		if (seg.key === 'b' && oi === 1) {
			shotNotes.push({
				type: 'production',
				status: 'open',
				priority: 'low',
				text: L(
					'Prompt E (alpha): FIRST CONTACT overlay. Ver docs/TITLE_AND_CREDITS.md.',
					'Prompt E (alpha): FIRST CONTACT overlay. See docs/TITLE_AND_CREDITS.md.'
				)
			});
		}

		shots.push({
			id: shotId,
			sceneId,
			beatIds: [beatId],
			number: oi + 1,
			order: globalShotOrder,
			description: spec.description
				? L(spec.description, spec.descriptionEn)
				: mainShot.description,
			purpose: L(
				spec.purpose || `${seg.dramaticPurpose} La toma muestra: ${shotDescription.es}`,
				spec.purposeEn || `${seg.dramaticPurposeEn || seg.dramaticPurpose} The shot shows: ${shotDescription.en}`
			),
			locationId: mainShot.locationId || locationId,
			composition: isTitleCreditCard
				? {
						size: 'OTHER',
						framing: L('Cartela tipográfica a pantalla completa', 'Full-frame typographic card'),
						aspectRatio: '16:9'
					}
				: mainShot.composition,
			camera: isTitleCreditCard
				? {
						movement: 'locked',
						movementDescription: L('Negro / tipografía fija', 'Black field / locked typography')
					}
				: spec.cameraDescription
					? {
							...mainShot.camera,
							movementDescription: L(spec.cameraDescription, spec.cameraDescriptionEn)
						}
					: mainShot.camera,
			durationMs: spec.durationMs,
			cuePlacements: spec._placements || [],
			takeIds: [takeId],
			selectedTakeId: takeId,
			sourceRefs: isTitleCreditCard
				? undefined
				: [
						{
							scriptId: 'script:light-delay-main-short',
							shotId: spec.mainShotId
						}
					],
			notes: shotNotes
		});

		takes.push(
			isTitleCreditCard
				? (() => {
						const titleCardAssets = {
							B: 'asset:animatic-title-trailer-brand',
							C: 'asset:animatic-title-trailer-tagline'
						};
						const wiredAssetId = titleCardAssets[spec.promptKey];
						if (wiredAssetId) {
							return {
								id: takeId,
								shotId,
								number: 1,
								status: 'selected',
								imageAssetId: wiredAssetId
							};
						}
						return {
							id: takeId,
							shotId,
							number: 1,
							status: 'selected',
							imageAssetId: 'asset:animatic-placeholder-missing-frame',
							imageStatus: {
								status: 'needs_replacement',
								reasons: ['placeholder'],
								explanation: L(
									'Título/crédito; still pendiente de generación autorizada (prompt EN en notas).',
									'Title/credit; still pending authorized generation (EN prompt in notes).'
								),
								sourceShotId: shotId
							}
						};
					})()
				: {
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
					}
		);
	}

	// Fix beat cueIds order from sceneCueIds already populated
	beats[beats.length - 1].cueIds = sceneCueIds;
	scenes[scenes.length - 1].shotIds = sceneShotIds;
}

if (totalMs !== 102500) {
	throw new Error(`Unexpected total duration ${totalMs}ms (expected 102500)`);
}

const file = {
	schemaVersion: '1.1.0',
	script: {
		id: 'script:light-delay-trailer',
		projectId: 'project:light-delay',
		continuityId: 'continuity:light-delay-primary',
		title: 'Light Delay — Tráiler (~1:30)',
		version: '0.2.0-draft',
		status: 'draft',
		kind: 'trailer',
		targetDurationMs: 102500,
		lineage: {
			sourceScriptId: 'script:light-delay-main-short',
			relationship: 'trailer',
			sourceVersion: '1.1.0-draft',
			notes:
				'Tráiler según docs/Light Delay — Tráiler de la versión de 30 minutos.md. Frames reutilizados del animatic principal vía imageAssetId; diálogos condensados del brief.'
		},
		declaredEntityRefs: ['zao', 'voss', 'rao', 'sorell', 'cael'].map((id) => ({
			kind: 'character',
			id: `character:${id}`
		})),
		comparisonProfile: {
			version: '1.1.0',
			canonClaims: main.script.comparisonProfile.canonClaims.filter((claim) =>
				[
					'canon:proxima-origin',
					'canon:ardor-deployment',
					'canon:tunnel-geometry',
					'canon:tunnel-location',
					'canon:trajectory',
					'canon:ardor-gravity-operations',
					'canon:velari-objects',
					'canon:sorell-status'
				].includes(claim.dimensionId)
			),
			eventCoverage: [
				['event:embarkation', 'reworked', ['trailer:scene-a', 'trailer:scene-b']],
				['event:anomaly-discovery', 'reworked', ['trailer:scene-c']],
				['event:tunnel-crossing', 'present', ['trailer:scene-f']],
				['event:investigation', 'reworked', ['trailer:scene-f']],
				['event:message-reception', 'omitted', []],
				['event:quarantine', 'reworked', ['trailer:scene-h']],
				['event:clean-greeting', 'reworked', ['trailer:scene-h']],
				['event:first-contact', 'reworked', ['trailer:scene-h', 'trailer:scene-i']]
			]
				.map(([eventId, status, sceneIds]) => ({ eventId, status, sceneIds }))
				.concat({
					eventId: 'event:aftermath',
					status: 'omitted',
					note: L(
						'El tráiler termina en el umbral del contacto.',
						'The trailer ends at the threshold of contact.'
					)
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

const localizedFile = mergeGeneratedInlineI18n(file, previous);
const serialized = JSON.stringify(localizedFile, null, 2) + '\n';
if (checkOnly) assertGeneratedCheck(readFileSync(out, 'utf8'), serialized, 'Trailer JSON');
else writeFileSync(out, serialized, 'utf8');
console.log(
	`${checkOnly ? 'Checked' : 'Wrote'} ${out} scenes=${scenes.length} shots=${shots.length} takes=${takes.length} cues=${cues.length} durationMs=${totalMs}`
);
