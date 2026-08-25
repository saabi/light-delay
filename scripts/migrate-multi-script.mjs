/**
 * One-shot migration: hyphen entity/script IDs → colon form; script → data/scripts/;
 * project registry + festival draft + narrative-functions + entity-variants.
 *
 * Usage: node scripts/migrate-multi-script.mjs
 *
 * Safe to re-run only if data/script.json still exists (pre-migration). After success,
 * data/script.json is deleted.
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SCRIPTS = join(DATA, 'scripts');

const MAIN_SCRIPT_ID = 'script:light-delay-main-short';
const FESTIVAL_SCRIPT_ID = 'script:light-delay-festival';
const CONTINUITY_ID = 'continuity:light-delay-primary';
const PROJECT_ID = 'project:light-delay';
const MAIN_PREFIX = 'main';
const FESTIVAL_PREFIX = 'festival';

/** Longest-first entity/project prefixes: kind-rest → kind:rest */
const ENTITY_PREFIXES = [
	'character',
	'location',
	'object',
	'vehicle',
	'faction',
	'asset',
	'voice',
	'document',
	'doc',
	'project',
	'script',
	'continuity',
	'function'
];

/** Script-owned unit prefixes (receive main: / festival: namespace). */
const SCRIPT_UNIT_PREFIXES = ['act', 'scene', 'beat', 'cue', 'shot', 'take', 'sequence'];

function load(name) {
	return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
}

function write(relPath, value) {
	const path = join(DATA, relPath);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, '\t') + '\n', 'utf8');
	console.log('wrote', relPath);
}

function rewriteEntityId(id) {
	if (typeof id !== 'string' || id.includes(':')) return id;
	// Special renames first
	if (id === 'script-light-delay-short') return MAIN_SCRIPT_ID;
	if (id === 'project-light-delay') return PROJECT_ID;
	if (id === 'doc-notas-tecnicas' || id.startsWith('doc-')) {
		return id.replace(/^doc-/, 'document:');
	}
	for (const kind of ENTITY_PREFIXES) {
		const hyphen = `${kind}-`;
		if (id.startsWith(hyphen)) {
			return `${kind}:${id.slice(hyphen.length)}`;
		}
	}
	return id;
}

function namespaceScriptUnit(id, ns) {
	if (typeof id !== 'string') return id;
	if (id.includes(':')) return id;
	for (const kind of SCRIPT_UNIT_PREFIXES) {
		const hyphen = `${kind}-`;
		if (id.startsWith(hyphen)) {
			return `${ns}:${id}`;
		}
	}
	return id;
}

function rewriteString(value, scriptNs) {
	if (typeof value !== 'string') return value;
	let next = rewriteEntityId(value);
	next = namespaceScriptUnit(next, scriptNs);
	return next;
}

function deepRewrite(value, scriptNs) {
	if (Array.isArray(value)) {
		return value.map((v) => deepRewrite(v, scriptNs));
	}
	if (value && typeof value === 'object') {
		const out = {};
		for (const [k, v] of Object.entries(value)) {
			out[k] = deepRewrite(v, scriptNs);
		}
		return out;
	}
	return rewriteString(value, scriptNs);
}

function dialogueCue(id, beatId, order, speakerId, spokenText, presentation = 'on_screen') {
	return {
		id,
		beatId,
		order,
		type: 'dialogue',
		speakerId,
		presentation,
		content: {
			sourceLanguage: 'es',
			variants: {
				es: {
					spokenText,
					status: 'source'
				}
			}
		}
	};
}

function buildFestivalDraft(sourceVersion) {
	const actId = `${FESTIVAL_PREFIX}:act-1`;
	const scenes = [
		{
			letter: 'a',
			number: 1,
			title: 'La misión y la anomalía',
			purpose: 'Establecer espacio, misión y peligro sin exposición.',
			targetDurationMs: 25000,
			summary: 'Proxima, Celestial Ardor y primera anomalía en el sistema diplomático.',
			locationId: 'location:proxima-dock',
			characterIds: ['character:zao', 'character:rao', 'character:harlan', 'character:voss']
		},
		{
			letter: 'b',
			number: 2,
			title: 'Zao descubre y transmite',
			purpose:
				'Zao confirma el payload, el relé y el vínculo con Harlan; transmite hacia el futuro.',
			targetDurationMs: 60000,
			summary: 'Descubrimiento del sabotaje y mensaje óptico de Zao.',
			locationId: 'location:diplomatic-core-room',
			characterIds: ['character:zao', 'character:harlan']
		},
		{
			letter: 'c',
			number: 3,
			title: 'Harlan / muerte de Zao / salto temporal',
			purpose: 'Harlan interrumpe; transmisión completa; salto a 23 h después.',
			targetDurationMs: 20000,
			summary: 'Confrontación breve, muerte elidida y overlay temporal.',
			locationId: 'location:diplomatic-core-room',
			characterIds: ['character:zao', 'character:harlan']
		},
		{
			letter: 'd',
			number: 4,
			title: 'La mitad técnica',
			purpose: 'Rao muestra lo que sabe del payload y lo que le falta; detecta la señal.',
			targetDurationMs: 50000,
			summary: 'Investigación de Rao contra reloj; detección de señal humana.',
			locationId: 'location:celestial-ardor-bridge',
			characterIds: ['character:rao', 'character:voss', 'character:harlan']
		},
		{
			letter: 'e',
			number: 5,
			title: 'La señal y la doble llave',
			purpose: 'Mensaje de Zao + verificación técnica identifica a Harlan.',
			targetDurationMs: 45000,
			summary: 'Doble llave causal; revocación; Harlan activa el override.',
			locationId: 'location:celestial-ardor-bridge',
			characterIds: ['character:rao', 'character:voss', 'character:harlan', 'character:zao']
		},
		{
			letter: 'f',
			number: 6,
			title: 'Override y cuarentena',
			purpose: 'Carrera física/digital; Rao aísla el payload; canal limpio.',
			targetDurationMs: 60000,
			summary: 'Clímax de cuarentena con saludo pasivo de Sorell como asset.',
			locationId: 'location:celestial-ardor-bridge',
			characterIds: ['character:rao', 'character:voss', 'character:harlan']
		},
		{
			letter: 'g',
			number: 7,
			title: 'Contacto / cierre',
			purpose: 'Canal limpio, respuesta Velari y cierre emocional.',
			targetDurationMs: 30000,
			summary: 'Envío, contacto y «Llegaste a tiempo».',
			locationId: 'location:velari-station',
			characterIds: ['character:rao', 'character:voss']
		}
	];

	const sceneRecords = [];
	const beats = [];
	const cues = [];

	for (const s of scenes) {
		const sceneId = `${FESTIVAL_PREFIX}:scene-${s.letter}`;
		const beatId = `${FESTIVAL_PREFIX}:beat-${s.letter}-01`;
		const cueIds = [];

		// Place dialogue only where the adaptation quotes it.
		if (s.letter === 'b') {
			const cueId = `${FESTIVAL_PREFIX}:cue-${s.letter}-01`;
			cueIds.push(cueId);
			cues.push(
				dialogueCue(
					cueId,
					beatId,
					1,
					'character:zao',
					'Si esto llega: Aqueronte está adentro. Harlan comprometió el núcleo. El registro superficial es falso. Crucen el payload con el relé físico. No apaguen la mediación.',
					'recording'
				)
			);
		}
		if (s.letter === 'd') {
			const cueId = `${FESTIVAL_PREFIX}:cue-${s.letter}-01`;
			cueIds.push(cueId);
			cues.push(
				dialogueCue(
					cueId,
					beatId,
					1,
					'character:rao',
					'Puedo aislarlo. No puedo revocar a quien lo controla.'
				)
			);
		}
		if (s.letter === 'f') {
			const cueId = `${FESTIVAL_PREFIX}:cue-${s.letter}-01`;
			cueIds.push(cueId);
			cues.push(
				dialogueCue(
					cueId,
					beatId,
					1,
					'character:harlan',
					'No voy a entregar nuestra especie a algo que no entendemos.'
				)
			);
		}
		if (s.letter === 'g') {
			const cueEnv = `${FESTIVAL_PREFIX}:cue-${s.letter}-01`;
			const cueLate = `${FESTIVAL_PREFIX}:cue-${s.letter}-02`;
			cueIds.push(cueEnv, cueLate);
			cues.push(dialogueCue(cueEnv, beatId, 1, 'character:voss', 'Envíen.'));
			cues.push(dialogueCue(cueLate, beatId, 2, 'character:voss', 'Llegaste a tiempo.'));
		}

		sceneRecords.push({
			id: sceneId,
			actId,
			number: s.number,
			order: s.number,
			title: s.title,
			locationId: s.locationId,
			setting: {
				interiorExterior: s.letter === 'a' || s.letter === 'g' ? 'INT_EXT' : 'INT',
				timeOfDay: 'DÍA'
			},
			summary: s.summary,
			dramaticPurpose: s.purpose,
			characterIds: s.characterIds,
			beatIds: [beatId],
			shotIds: [],
			targetDurationMs: s.targetDurationMs
		});

		beats.push({
			id: beatId,
			sceneId,
			order: 1,
			title: s.title,
			purpose: s.purpose,
			summary: s.summary,
			cueIds,
			targetDurationMs: s.targetDurationMs
		});
	}

	return {
		schemaVersion: '1.0.0',
		script: {
			id: FESTIVAL_SCRIPT_ID,
			projectId: PROJECT_ID,
			continuityId: CONTINUITY_ID,
			title: 'Light Delay — Festival Cut',
			version: '0.1.0-draft',
			status: 'draft',
			kind: 'festival_cut',
			targetDurationMs: 290000,
			lineage: {
				sourceScriptId: MAIN_SCRIPT_ID,
				relationship: 'adaptation',
				sourceVersion,
				notes:
					'Adaptación condensada ~4:50 según docs/light-delay-festival-cut-adaptation.md. Shots/takes pendientes.'
			},
			characterFunctionAssignments: [
				{
					functionId: 'function:piloting',
					characterId: 'character:rao',
					sourceCharacterIds: ['character:cael'],
					relationship: 'merged',
					notes: 'Cael omitido; detección/navegación absorbidas por Rao/UI.'
				},
				{
					functionId: 'function:communications',
					characterId: 'character:rao',
					sourceCharacterIds: ['character:cael'],
					relationship: 'merged',
					notes: 'Rao asume detección/comunicaciones de Cael.'
				},
				{
					functionId: 'function:command',
					characterId: 'character:voss',
					relationship: 'unchanged'
				},
				{
					functionId: 'function:investigation_payload',
					characterId: 'character:rao',
					relationship: 'unchanged'
				},
				{
					functionId: 'function:diplomatic_greeting_authorship',
					characterId: 'character:sorell',
					relationship: 'unchanged',
					notes: 'Sorell off-screen; conserva autoría del saludo pasivo como asset/UI.'
				},
				{
					functionId: 'function:override_antagonist',
					characterId: 'character:harlan',
					relationship: 'unchanged'
				}
			],
			actIds: [actId]
		},
		acts: [
			{
				id: actId,
				number: 1,
				title: 'Festival Cut',
				dramaticPurpose: 'Cadena causal condensada de ~4:50.',
				sceneIds: sceneRecords.map((s) => s.id)
			}
		],
		sequences: [],
		scenes: sceneRecords,
		beats,
		cues,
		shots: [],
		takes: []
	};
}

function main() {
	const scriptPath = join(DATA, 'script.json');
	const mainOut = join(SCRIPTS, 'light-delay-main-short.json');

	if (!existsSync(scriptPath)) {
		if (existsSync(mainOut)) {
			console.log('Already migrated (data/script.json missing, main script present). Exiting.');
			process.exit(0);
		}
		throw new Error('data/script.json not found and no migrated script present');
	}

	mkdirSync(SCRIPTS, { recursive: true });

	const projectFile = load('project.json');
	const scriptFile = load('script.json');
	const entityFiles = [
		'characters.json',
		'locations.json',
		'objects.json',
		'vehicles.json',
		'factions.json',
		'assets.json',
		'voice-profiles.json',
		'documents.json'
	];

	const rewrittenEntities = {};
	for (const name of entityFiles) {
		rewrittenEntities[name] = deepRewrite(load(name), MAIN_PREFIX);
	}

	let mainScript = deepRewrite(scriptFile, MAIN_PREFIX);
	mainScript.script = {
		...mainScript.script,
		id: MAIN_SCRIPT_ID,
		projectId: PROJECT_ID,
		continuityId: CONTINUITY_ID,
		kind: 'main_short',
		targetDurationMs: 1800000,
		status: mainScript.script.status ?? 'draft',
		title: mainScript.script.title,
		version: mainScript.script.version,
		actIds: mainScript.script.actIds
	};

	const festival = buildFestivalDraft(mainScript.script.version);

	const project = {
		schemaVersion: projectFile.schemaVersion ?? '1.0.0',
		project: {
			...deepRewrite(projectFile.project, MAIN_PREFIX),
			id: PROJECT_ID,
			canonicalScriptId: MAIN_SCRIPT_ID,
			targetDurationMs: 1800000,
			continuities: [
				{
					id: CONTINUITY_ID,
					name: 'Light Delay — continuidad primaria',
					description:
						'Continuidad narrativa del cortometraje canónico y cuts derivados (festival, trailers).'
				}
			],
			scripts: [
				{
					id: MAIN_SCRIPT_ID,
					continuityId: CONTINUITY_ID,
					label: 'Guion corto (~30 min)',
					kind: 'main_short',
					status: mainScript.script.status,
					targetDurationMs: 1800000
				},
				{
					id: FESTIVAL_SCRIPT_ID,
					continuityId: CONTINUITY_ID,
					label: 'Festival Cut (~4:50)',
					kind: 'festival_cut',
					status: 'draft',
					targetDurationMs: 290000,
					lineage: {
						sourceScriptId: MAIN_SCRIPT_ID,
						relationship: 'adaptation',
						sourceVersion: mainScript.script.version
					}
				}
			],
			updatedAt: '2026-08-25'
		}
	};

	const narrativeFunctions = {
		schemaVersion: '1.0.0',
		functions: [
			{
				id: 'function:piloting',
				label: 'Piloto / navegación',
				description: 'Detección de señal, estado de navegación y operaciones de puente asociadas.'
			},
			{
				id: 'function:communications',
				label: 'Comunicaciones',
				description: 'Detección y anuncio de señales; interfaz de comunicaciones.'
			},
			{
				id: 'function:command',
				label: 'Mando',
				description: 'Autoridad de decisión y revocación de credenciales.'
			},
			{
				id: 'function:investigation_payload',
				label: 'Investigación del payload',
				description: 'Análisis técnico del payload, disparador y cuarentena.'
			},
			{
				id: 'function:diplomatic_greeting_authorship',
				label: 'Autoría del saludo diplomático',
				description: 'Autoría del saludo pasivo limpio / read-only.'
			},
			{
				id: 'function:override_antagonist',
				label: 'Override antagonista',
				description: 'Titular del override hostil y antagonista operativo.'
			}
		]
	};

	const entityVariants = {
		schemaVersion: '1.0.0',
		variants: []
	};

	write('project.json', project);
	for (const name of entityFiles) {
		write(name, rewrittenEntities[name]);
	}
	write('narrative-functions.json', narrativeFunctions);
	write('entity-variants.json', entityVariants);
	write('scripts/light-delay-main-short.json', mainScript);
	write('scripts/light-delay-festival.json', festival);

	unlinkSync(scriptPath);
	console.log('deleted data/script.json');
	console.log('migrate-multi-script OK');
}

main();
