import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGeneratedCheck, mergeGeneratedInlineI18n } from './lib/generated-inline-i18n.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(ROOT, 'data', 'scripts', 'light-delay-long.json');
const previous = JSON.parse(readFileSync(outputPath, 'utf8'));
const checkOnly = process.argv.includes('--check');
const SCRIPT_ID = 'script:light-delay-long';
const PREFIX = 'long';
const docRef = () => ({
	kind: 'document',
	documentId: 'document:legacy-feature-beats'
});

const rows = [
	[
		1,
		1,
		'Preparativos en Proxima',
		'La tripulación completa aborda una Celestial Ardor ya destinada en Proxima. Ante el nombre y la silueta visibles, Cael comenta: «Le pusieron “Ardor”. Con esa forma. Alguien en Diseño tenía sentido del humor.» Voss responde con una mirada y Harlan apenas registra el intercambio. Zao, Sorell y Elin verifican el núcleo, el relé físico y el saludo pasivo.',
		'location:proxima-dock',
		[
			'character:zao',
			'character:voss',
			'character:harlan',
			'character:rao',
			'character:sorell',
			'character:cael',
			'character:wei',
			'character:keene',
			'character:vega',
			'character:hassan',
			'character:carvalho',
			'character:okoye',
			'character:volkov',
			'character:tanaka'
		],
		'T-2H',
		'main:scene-01'
	],
	[
		2,
		1,
		'Salida y reparto de guardias',
		'Voss fija autoridad, Cael prepara navegación, Wei toma comunicaciones y Harlan muestra una fricción todavía plausible ante la misión.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:harlan', 'character:cael', 'character:wei'],
		'T+0H',
		'main:scene-02'
	],
	[
		3,
		1,
		'Vega como peón involuntario',
		'Harlan induce a Ansel Vega a silenciar una alerta de diagnóstico aparentemente redundante; la acción abre una ventana sin convertir a Vega en cómplice.',
		'location:celestial-ardor-engineering',
		['character:harlan', 'character:vega', 'character:zao'],
		'T+12H'
	],
	[
		4,
		1,
		'Primeros picos',
		'Zao detecta consumos repetidos que no corresponden al perfil del núcleo y comienza una investigación discreta.',
		'location:celestial-ardor-engineering',
		['character:zao', 'character:volkov'],
		'T+29H',
		'main:scene-03'
	],
	[
		5,
		1,
		'La envoltura dormida',
		'Zao y Elin encuentran una envoltura no declarada. Hassan confirma que la anomalía energética es física y no sólo un artefacto de software.',
		'location:diplomatic-core-room',
		['character:zao', 'character:rao', 'character:hassan'],
		'T+40H',
		'main:scene-04'
	],
	[
		6,
		1,
		'Registro falsificable',
		'El registro superficial apunta a Sorell, pero Zao lo marca como no verificado y preserva una copia para contrastarla con el relé.',
		'location:diplomatic-core-room',
		['character:zao', 'character:rao', 'character:sorell'],
		'T+48H',
		'main:scene-04'
	],
	[
		7,
		1,
		'Despliegue hostil',
		'La envoltura revela un escaneo intrusivo. Zao avisa: «Capitán, hay un payload autónomo firmado por Sorell. La firma parece falsa. La verdadera firma apunta a—». Harlan termina una tarea legítima y llega por coincidencia al acceso con actitud rutinaria; sólo esa última frase provoca su microreacción. Sin ser visto activa el jammer y corta COM A/B. Voss sopesa que la identidad de Sorell fue falsificada pero que ella sigue implicada: la envía a verificar, la retiene y le ordena buscar a Harlan y no entrar sola.',
		'location:diplomatic-core-room',
		['character:zao', 'character:voss', 'character:sorell', 'character:harlan'],
		'T+57H43M',
		'main:scene-05'
	],
	[
		8,
		1,
		'Mensaje hacia el corredor',
		'Con wireless y COM A/B caídos, Zao usa el control cableado dedicado del láser exterior. Descarta Tierra porque recibir allí y retransmitir a la Ardor demoraría hasta después del encuentro; descarta Proxima porque Júpiter ocluye la línea de vista entre la boca local en L2 y la estación en L1. Harlan se lanza balísticamente por servicio; Sorell pierde tiempo buscándolo y avanza mano sobre mano por el cilindro central. Zao calcula la intercepción con la posición futura, captura un snapshot del manifiesto firmado por el hardware del relé —todavía asignado a Harlan—, lo adjunta y firma mensaje y adjunto con su token personal antes de barrer la elipse de incertidumbre.',
		'location:diplomatic-core-room',
		['character:zao', 'character:harlan', 'character:sorell'],
		'T+57H45M',
		'main:scene-06'
	],
	[
		9,
		1,
		'Muerte fuera de campo',
		'Harlan entra después del envío y sólo ve TRANSMITIDO. Supone en voz alta que Zao apuntó a la Tierra y se tranquiliza porque el doble retardo impediría advertir a Voss antes del encuentro. Lamenta que ella haya encontrado la evidencia y suspira antes de atacarla fuera de campo. Durante un negro sostenido se oyen un golpe corporal seco y el fin del forcejeo; la respiración de Zao cesa y confirma su muerte sin mostrar el acto. Luego borra cámaras, archivo local e índice operativo del manifiesto, sin saber que el snapshot ya salió, y regresa por servicio. Sorell encuentra el cuerpo sola, intenta reanimarla y no logra comunicarse; Harlan restaura COM A/B antes de volver al puente y construir su coartada.',
		'location:diplomatic-core-room',
		['character:zao', 'character:harlan', 'character:sorell'],
		'T+57H46M',
		'main:scene-07'
	],
	[
		10,
		1,
		'Expansión y cruce',
		'Los nodos distribuidos conectan la región navegable durante una ventana limitada. La nave cruza sin que la expansión crítica pueda cancelarse con seguridad.',
		'location:velari-wormhole-mouth',
		['character:voss', 'character:cael', 'character:wei'],
		'T+57H48M',
		'main:scene-07'
	],
	[
		11,
		2,
		'El cuerpo',
		'Tras el cruce, Keene confirma la muerte de Zao y Okoye preserva el recinto. La tripulación entiende que el asesino está a bordo.',
		'location:diplomatic-core-room',
		['character:keene', 'character:okoye', 'character:voss'],
		'DESPUÉS DEL CRUCE',
		'main:scene-08'
	],
	[
		12,
		2,
		'Investigación distribuida',
		'Voss asigna tareas separadas: Elin analiza payload, Keene examina evidencia clínica, Okoye controla accesos y Wei conserva registros de comunicación.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:rao', 'character:keene', 'character:okoye', 'character:wei'],
		'MÁS TARDE',
		'main:scene-09'
	],
	[
		13,
		2,
		'Credencial de Sorell comprometida',
		'El puente y la orden directa de Voss corroboran el trayecto de Sorell. Se bloquea su credencial falsificada sin apartarla como sospechosa; Harlan intenta explotar la incertidumbre técnica.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:harlan', 'character:sorell', 'character:okoye'],
		'MÁS TARDE',
		'main:scene-09'
	],
	[
		14,
		2,
		'Sabotaje ambiental acotado',
		'Fluctuaciones de soporte vital y navegación fuerzan a Cael, Vega y Tanaka a trabajar bajo presión; la función exacta de Tanaka sigue pendiente de definición.',
		'location:celestial-ardor-engineering',
		['character:cael', 'character:vega', 'character:tanaka'],
		'TURNO SIGUIENTE'
	],
	[
		15,
		2,
		'Elin aísla el recorrido',
		'Elin no repara el código corrupto: cartografía su recorrido y prepara una cuarentena limitada para el momento de activación.',
		'location:celestial-ardor-bridge',
		['character:rao', 'character:hassan'],
		'CONTINUO',
		'main:scene-10'
	],
	[
		16,
		2,
		'Conflicto de estrategia',
		'Harlan exige apagar toda mediación; Elin explica que hacerlo borraría evidencia y el único canal diplomático. Voss posterga una decisión irreversible.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:harlan', 'character:rao'],
		'MÁS TARDE'
	],
	[
		17,
		2,
		'Carvalho continúa el lenguaje',
		'Sorell y Carvalho verifican patrones mínimos del saludo sin alterar el soporte pasivo de sólo lectura, mientras Elin mantiene separados lenguaje y payload.',
		'location:celestial-ardor-bridge',
		['character:carvalho', 'character:sorell', 'character:rao'],
		'MÁS TARDE'
	],
	[
		18,
		2,
		'La portadora débil',
		'Wei detecta una señal humana en el corredor previsto. Cael mantiene navegación y Voss ordena conservarla sin asumir autenticidad.',
		'location:celestial-ardor-bridge',
		['character:wei', 'character:cael', 'character:voss'],
		'APROXIMACIÓN',
		'main:scene-11'
	],
	[
		19,
		3,
		'El mensaje de Zao',
		'La tripulación escucha fragmentos del mensaje. Cael verifica dispositivo y hora. Harlan objeta: «Una voz puede falsificarse». Elin responde: «No estoy verificando su voz. Estoy verificando su firma». El token personal autentica a Zao y preserva íntegros el mensaje y su adjunto.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:rao', 'character:wei', 'character:harlan'],
		'CONTINUO',
		'main:scene-12'
	],
	[
		20,
		3,
		'La doble llave',
		'El snapshot conserva la firma del hardware y todavía asigna el relé a Harlan. La auditoría independiente de Elin conecta ese circuito con el payload y el override: dispositivo y hora, autoría de Zao, manifiesto físico y auditoría convergen sin depender de un único registro.',
		'location:celestial-ardor-bridge',
		['character:rao', 'character:sorell', 'character:hassan', 'character:voss'],
		'MINUTOS DESPUÉS',
		'main:scene-12'
	],
	[
		21,
		3,
		'Harlan actúa',
		'Voss revoca la credencial de Harlan. Antes de completarse la cascada, él usa la última ventana física y, bajo 1 g, baja por el ascensor central hasta el ramal del núcleo.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:harlan', 'character:okoye'],
		'CONTINUO',
		'main:scene-13'
	],
	[
		22,
		3,
		'Decisión de Okoye',
		'Voss permanece en el puente. Okoye ejecuta la orden, intercepta a Harlan en el ramal físico y lo contiene sin convertir la escena en combate armado.',
		'location:diplomatic-core-room',
		['character:okoye', 'character:harlan', 'character:voss'],
		'CONTINUO'
	],
	[
		23,
		3,
		'Controles manuales',
		'Volkov accede a controles manuales documentados por Zao mientras Cael fuerza el mamparo desde el puente. Su especialidad definitiva queda abierta.',
		'location:diplomatic-core-room',
		['character:volkov', 'character:cael', 'character:voss'],
		'CONTINUO',
		'main:scene-14'
	],
	[
		24,
		3,
		'Cuarentena',
		'Elin confina la rama hostil al buffer preparado. Sorell aporta el saludo pasivo de sólo lectura y separa lenguaje de intrusión: PAYLOAD EN CUARENTENA / CANAL SALIENTE LIMPIO / MEDIACIÓN ACTIVA.',
		'location:diplomatic-core-room',
		['character:rao', 'character:sorell', 'character:harlan'],
		'CUENTA REGRESIVA',
		'main:scene-14'
	],
	[
		25,
		3,
		'Saludo limpio',
		'La tripulación envía matemática de reconocimiento, procedencia y solicitud de aproximación por un conducto de sólo lectura.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:rao', 'character:sorell', 'character:carvalho'],
		'DESPUÉS',
		'main:scene-15'
	],
	[
		26,
		4,
		'Reconocimiento limitado',
		'La estación Velari responde con un patrón que autoriza aproximación sin equivaler a confianza, alianza ni explicación completa.',
		'location:velari-station',
		['character:voss', 'character:cael', 'character:wei'],
		'MINUTOS DESPUÉS',
		'main:scene-16'
	],
	[
		27,
		4,
		'Emisaria',
		'Una nave emisaria distinta de la estación se aproxima. La escala humana queda subordinada al encuentro y la amenaza inmediata termina.',
		'location:velari-station',
		['character:voss', 'character:rao', 'character:sorell', 'character:cael'],
		'CONTINUO',
		'main:scene-16'
	],
	[
		28,
		4,
		'La verdad sigue viajando',
		'Con Harlan bajo custodia, Voss prepara el informe a la Tierra, adjunta la evidencia convergente y el legajo de Zao. Su retrato lo detiene; murmura «Llegaste a tiempo» y pulsa ENVIAR. No llega respuesta y las consecuencias permanecen fuera de campo.',
		'location:celestial-ardor-bridge',
		['character:voss', 'character:rao', 'character:sorell', 'character:keene', 'character:okoye'],
		'EPÍLOGO',
		'main:scene-17'
	]
];

const acts = [
	{
		id: 'long:act-1',
		number: 1,
		title: 'El cruce y el cadáver',
		dramaticPurpose: 'Presentar el conjunto, descubrir el sabotaje y aislar la misión.',
		range: [1, 10]
	},
	{
		id: 'long:act-2',
		number: 2,
		title: 'Sospecha en el vacío',
		dramaticPurpose: 'Fracturar la confianza y preparar evidencia y contención.',
		range: [11, 18]
	},
	{
		id: 'long:act-3',
		number: 3,
		title: 'Señal y supervivencia',
		dramaticPurpose: 'Autenticar la advertencia y contener el ataque humano.',
		range: [19, 25]
	},
	{
		id: 'long:act-4',
		number: 4,
		title: 'Epílogo: contacto limitado',
		dramaticPurpose: 'Abrir el horizonte Velari y preservar el costo humano.',
		range: [26, 28]
	}
].map(({ range, ...act }) => ({
	...act,
	sceneIds: rows
		.slice(range[0] - 1, range[1])
		.map((row) => `long:scene-${String(row[0]).padStart(2, '0')}`)
}));

const scenes = rows.map(
	([number, actNumber, title, summary, locationId, characterIds, storyTime, mainSceneId]) => {
		const id = `${PREFIX}:scene-${String(number).padStart(2, '0')}`;
		const sourceRefs = [docRef()];
		if (mainSceneId)
			sourceRefs.push({ scriptId: 'script:light-delay-main-short', sceneId: mainSceneId });
		return {
			id,
			actId: `${PREFIX}:act-${actNumber}`,
			number,
			order: number,
			title,
			locationId,
			setting: { storyTime },
			summary,
			dramaticPurpose: summary,
			characterIds,
			beatIds: [`${PREFIX}:beat-${String(number).padStart(2, '0')}`],
			shotIds: [],
			targetDurationMs: Math.round(6000000 / rows.length),
			sourceRefs
		};
	}
);

const beats = scenes.map((scene) => ({
	id: scene.beatIds[0],
	sceneId: scene.id,
	order: 1,
	title: scene.title,
	purpose: scene.dramaticPurpose,
	summary: scene.summary,
	participantRefs: scene.characterIds.map((id) => ({ kind: 'character', id })),
	cueIds: [],
	targetDurationMs: scene.targetDurationMs,
	sourceRefs: scene.sourceRefs
}));

const canonClaims = [
	[
		'canon:proxima-origin',
		'scientific-before-contact',
		'Proxima fue una estación científica joviana anterior al contacto.'
	],
	[
		'canon:ardor-deployment',
		'earth-built-prepositioned',
		'Celestial Ardor fue construida en la Tierra y ya estaba destinada en Proxima.'
	],
	[
		'canon:tunnel-geometry',
		'distributed-nodes',
		'La boca es un campo distribuido de nodos, no un aro.'
	],
	[
		'canon:tunnel-location',
		'sol-jupiter-l2',
		'La boca local está en una órbita halo controlada cerca de L2.'
	],
	[
		'canon:trajectory',
		'conventional-to-wormhole',
		'La nave usa propulsión convencional hasta la boca y cruza el túnel Velari.'
	],
	[
		'canon:mission-timeline',
		'57h48-signal23h15-encounter24h',
		'El tramo local dura 57 h 48 min; la señal tarda unos 23 h 15 min y el encuentro remoto ocurre a T+24 h.'
	],
	[
		'canon:ardor-gravity-operations',
		'thrust-gravity-coast-microgravity',
		'La Ardor tiene gravedad aparente bajo empuje y microgravedad durante la aproximación final y el cruce.'
	],
	[
		'canon:velari-objects',
		'station-and-emissary',
		'La estación Velari y la nave emisaria son objetos distintos.'
	],
	[
		'canon:evidence-chain',
		'relay-optical-readonly',
		'El dispositivo y la hora, la firma del token personal de Zao, el snapshot firmado por el hardware del relé, la auditoría independiente y el saludo pasivo forman evidencia complementaria.'
	],
	[
		'canon:sorell-status',
		'false-log-not-conclusive',
		'Sorell no queda culpabilizada por un único registro falsificable.'
	],
	[
		'canon:zao-transmission-mechanics',
		'jam-wired-cut-dedicated-laser',
		'Harlan corta la malla inalámbrica y COM A/B; Zao usa el láser exterior por control físico dedicado y apunta al corredor futuro de la nave.'
	],
	[
		'canon:rao-containment',
		'bounded-quarantine',
		'Elin contiene la rama hostil mediante aislamiento preparado, sin resolución mágica.'
	],
	[
		'canon:ending',
		'limited-acknowledgement',
		'La respuesta Velari es un reconocimiento limitado, no una confianza resuelta.'
	]
].map(([dimensionId, valueId, statement]) => ({
	dimensionId,
	valueId,
	statement,
	status: 'established'
}));

const eventCoverage = [
	['event:embarkation', [1, 2]],
	['event:anomaly-discovery', [4, 5, 6, 7]],
	['event:zao-warning-death', [8, 9]],
	['event:tunnel-crossing', [10]],
	['event:investigation', [11, 12, 13, 14, 15, 16, 17]],
	['event:message-reception', [18, 19]],
	['event:harlan-exposed', [20, 21]],
	['event:quarantine', [22, 23, 24]],
	['event:clean-greeting', [25]],
	['event:first-contact', [26, 27]],
	['event:aftermath', [28]]
].map(([eventId, numbers]) => ({
	eventId,
	status: 'present',
	sceneIds: numbers.map((number) => `long:scene-${String(number).padStart(2, '0')}`)
}));

const characterIds = [
	'zao',
	'voss',
	'harlan',
	'sorell',
	'rao',
	'cael',
	'keene',
	'vega',
	'wei',
	'hassan',
	'carvalho',
	'okoye',
	'volkov',
	'tanaka'
].map((id) => `character:${id}`);

const script = {
	schemaVersion: '1.1.0',
	script: {
		id: SCRIPT_ID,
		projectId: 'project:light-delay',
		continuityId: 'continuity:light-delay-primary',
		title: 'Light Delay — Tratamiento de largometraje',
		version: '0.2.0-draft',
		status: 'draft',
		kind: 'long_version',
		targetDurationMs: 6000000,
		lineage: {
			sourceScriptId: 'script:light-delay-main-short',
			relationship: 'rewrite',
			sourceVersion: '1.1.0-draft',
			notes: 'Recuperación revisada mediante docs/REVISION_LARGOMETRAJE_RECUPERADO.md.'
		},
		declaredEntityRefs: characterIds.map((id) => ({ kind: 'character', id })),
		entityVariantSelections: { character: { 'character:cael': 'variant:cael-long-pilot' } },
		characterFunctionAssignments: [
			['function:command', 'character:voss', 'unchanged'],
			['function:piloting', 'character:cael', 'unchanged'],
			['function:communications', 'character:wei', 'split', ['character:cael']],
			['function:investigation_payload', 'character:rao', 'unchanged'],
			['function:diplomatic_greeting_authorship', 'character:sorell', 'unchanged'],
			['function:override_antagonist', 'character:harlan', 'unchanged'],
			['function:medical', 'character:keene', 'new'],
			['function:systems', 'character:vega', 'new'],
			['function:physics-corroboration', 'character:hassan', 'new'],
			['function:linguistic-continuity', 'character:carvalho', 'new'],
			['function:security', 'character:okoye', 'new'],
			['function:manual-controls', 'character:volkov', 'new']
		].map(([functionId, characterId, relationship, sourceCharacterIds]) => ({
			functionId,
			characterId,
			relationship,
			...(sourceCharacterIds ? { sourceCharacterIds } : {})
		})),
		comparisonProfile: { version: '1.1.0', canonClaims, eventCoverage },
		actIds: acts.map((act) => act.id)
	},
	acts,
	sequences: [],
	scenes,
	beats,
	cues: [],
	shots: [],
	takes: []
};

const localizedScript = mergeGeneratedInlineI18n(script, previous);
const serialized = `${JSON.stringify(localizedScript, null, 2)}\n`;
if (checkOnly) assertGeneratedCheck(readFileSync(outputPath, 'utf8'), serialized, 'Long JSON');
else writeFileSync(outputPath, serialized, 'utf8');
console.log(
	`build:long ${checkOnly ? 'check' : 'write'} OK scenes=${scenes.length} beats=${beats.length} crew=${characterIds.length}`
);
