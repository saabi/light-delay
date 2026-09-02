/**
 * Copy character / location / prop sheets into higgsfield-uploads/
 * with unique filenames for external upload (Higgsfield).
 *
 * Does NOT rename or move static/assets/ sources.
 * Includes the regenerated Harlan sheet after visual redesign.
 *
 * Usage: node scripts/prepare-higgsfield-uploads.mjs
 */
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = join(ROOT, 'static', 'assets');
const OUT = join(ROOT, 'higgsfield-uploads');

const SKIP_CHARACTER_SLUGS = new Set();

/** @type {{ kind: 'character' | 'location' | 'prop' | 'brief'; slug: string; label: string; sourceRel: string }[]} */
const ENTRIES = [
	{
		kind: 'character',
		slug: 'zao',
		label: 'Zao',
		sourceRel: 'characters/zao/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'voss',
		label: 'Elias Voss',
		sourceRel: 'characters/voss/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'harlan',
		label: 'Rylen Harlan',
		sourceRel: 'characters/harlan/model-sheet-v2.png'
	},
	{
		kind: 'character',
		slug: 'rao',
		label: 'Elin Rao',
		sourceRel: 'characters/rao/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'sorell',
		label: 'Lian Sorell',
		sourceRel: 'characters/sorell/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'cael',
		label: 'Juno Cael',
		sourceRel: 'characters/cael/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'proxima-technician',
		label: 'Técnico de Proxima',
		sourceRel: 'characters/proxima-technician/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'medical-officer',
		label: 'Oficial médico',
		sourceRel: 'characters/medical-officer/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'security-crew',
		label: 'Tripulante de seguridad',
		sourceRel: 'characters/security-crew/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'earth-protesters',
		label: 'Manifestantes terrestres',
		sourceRel: 'characters/earth-protesters/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'manifestante-acheron',
		label: 'Manifestante Aqueronte',
		sourceRel: 'characters/manifestante-acheron/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'joven-contacto',
		label: 'Joven partidaria del contacto',
		sourceRel: 'characters/joven-contacto/model-sheet.png'
	},
	{
		kind: 'character',
		slug: 'periodista',
		label: 'Periodista',
		sourceRel: 'characters/periodista/model-sheet.png'
	},
	{
		kind: 'location',
		slug: 'proxima-station',
		label: 'Estación Proxima',
		sourceRel: 'locations/proxima-station/concept-sheet.png'
	},
	{
		kind: 'location',
		slug: 'proxima-dock',
		label: 'Muelle axial de Proxima',
		sourceRel: 'locations/proxima-dock/concept-sheet.png'
	},
	{
		kind: 'location',
		slug: 'celestial-ardor-bridge',
		label: 'Puente del Celestial Ardor',
		sourceRel: 'locations/celestial-ardor-bridge/concept-sheet.png'
	},
	{
		kind: 'location',
		slug: 'celestial-ardor-engineering',
		label: 'Ingeniería del Celestial Ardor',
		sourceRel: 'locations/celestial-ardor-engineering/concept-sheet.png'
	},
	{
		kind: 'location',
		slug: 'diplomatic-core-room',
		label: 'Sala del núcleo diplomático',
		sourceRel: 'locations/diplomatic-core-room/concept-sheet.png'
	},
	{
		kind: 'location',
		slug: 'velari-wormhole-mouth',
		label: 'Boca Velari del túnel',
		sourceRel: 'locations/velari-wormhole-mouth/concept-sheet.png'
	},
	{
		kind: 'location',
		slug: 'velari-station',
		label: 'Estación Velari',
		sourceRel: 'locations/velari-station/concept-sheet.png'
	},
	{
		kind: 'prop',
		slug: 'diplomatic-quantum-core',
		label: 'Núcleo cuántico diplomático',
		sourceRel: 'props/diplomatic-quantum-core/prop-sheet.png'
	},
	{
		kind: 'prop',
		slug: 'optical-contingency-transmitter',
		label: 'Transmisor óptico de contingencia',
		sourceRel: 'props/optical-contingency-transmitter/prop-sheet.png'
	},
	{
		kind: 'prop',
		slug: 'physical-override-relay',
		label: 'Relé físico del override',
		sourceRel: 'props/physical-override-relay/prop-sheet.png'
	},
	{
		kind: 'prop',
		slug: 'read-only-greeting-medium',
		label: 'Soporte de saludo de Sorell',
		sourceRel: 'props/read-only-greeting-medium/prop-sheet.png'
	},
	{
		kind: 'brief',
		slug: 'celestial-ardor-jupiter',
		label: 'Celestial Ardor bordeando Júpiter (animatic esc. 3 / toma 1)',
		sourceRel: 'animatic/frames/scene-03/shot-01.png'
	},
	{
		kind: 'brief',
		slug: 'zao-optical-contingency-transmitter',
		label: 'Zao ante el transmisor óptico de contingencia (animatic esc. 5 / toma 6)',
		sourceRel: 'animatic/frames/scene-05/shot-06.png'
	},
	{
		kind: 'brief',
		slug: 'harlan-service-hatch-com-sabotage',
		label: 'Harlan desenchufa COM A/B junto a la escotilla de servicio (animatic esc. 5 / toma 7)',
		sourceRel: 'animatic/frames/scene-05/shot-07.png'
	},
	{
		kind: 'brief',
		slug: 'celestial-ardor-bridge-service-shaft',
		label: 'Acceso de servicio oculto del puente (referencia realista)',
		sourceRel: 'locations/celestial-ardor-bridge/realistic-service-shaft-reference.png'
	},
	{
		kind: 'brief',
		slug: 'proxima-ardor-berthed',
		label: 'Proxima con Celestial Ardor atracada (bloqueo 3D, escala común)',
		sourceRel: 'locations/proxima-station/proxima-with-ardor-berthed.png'
	},
	{
		kind: 'brief',
		slug: 'blender-proxima-with-ardor-berthed',
		label: 'Proxima con Celestial Ardor atracada (viewport Blender, bloqueo)',
		sourceRel: 'locations/proxima-station/blender-proxima-with-ardor-berthed.png'
	},
	{
		kind: 'brief',
		slug: 'celestial-ardor-with-jupiter',
		label: 'Celestial Ardor con Júpiter (bloqueo 3D)',
		sourceRel: 'vehicles/celestial-ardor/celestial-ardor-with-jupiter.png'
	},
	{
		kind: 'brief',
		slug: 'proxima-station-proportional-reference',
		label: 'Proxima Station — referencia proporcional (diagrama)',
		sourceRel: 'locations/proxima-station/proportional-reference.png'
	},
	{
		kind: 'brief',
		slug: 'celestial-ardor-proportional-reference',
		label: 'Celestial Ardor — referencia proporcional (diagrama)',
		sourceRel: 'vehicles/celestial-ardor/proportional-reference.png'
	},
	{
		kind: 'brief',
		slug: 'proxima-ardor-common-scale-reference',
		label: 'Proxima + Celestial Ardor — escala común (diagrama)',
		sourceRel: 'art-bible/scale-references/proxima-ardor-common-scale-reference.png'
	}
];

const TODO_MD = `# TODO — Higgsfield uploads

## Listo para subir (prioridad Zao / Harlan)

| Archivo | Uso en Higgsfield |
| --- | --- |
| \`characters/light-delay-character-zao.png\` | Referencia de personaje — Zao |
| \`characters/light-delay-character-harlan.png\` | Referencia de personaje — Harlan (hoja v2, diferenciada de Voss) |
| \`brief/light-delay-brief-zao-optical-contingency-transmitter.png\` | Contexto de escena — Zao en sala del núcleo |
| \`brief/light-delay-brief-harlan-service-hatch-com-sabotage.png\` | Contexto de escena — sabotaje COM A/B |
| \`brief/light-delay-brief-celestial-ardor-bridge-service-shaft.png\` | Localización — escotilla de servicio del puente |

Subir también \`characters/light-delay-character-voss.png\` si Harlan comparte plano con el capitán; comparar en Higgsfield que no colapsen identidades.

## Siguiente control

- Verificar en Higgsfield que la hoja de Harlan mantiene separación suficiente de Voss antes de autorizar generación de tomas.
- Las hojas de personaje no habilitan por sí solas regeneración de tomas; el freeze editorial del cut sigue vigente.

## Nombre de Elin resuelto

- Se conservan el nombre legal **Elin Rao**, el ID \`character:rao\`, el slug \`rao\` y los paths existentes.
- En diálogo, cartelas y texto operativo se usa **Elin**, por lo que ya no se confunde auditivamente con Zao.
`;

function destName(kind, slug) {
	return `light-delay-${kind}-${slug}.png`;
}

function folderFor(kind) {
	if (kind === 'character') return 'characters';
	if (kind === 'location') return 'locations';
	if (kind === 'brief') return 'brief';
	return 'props';
}

function main() {
	const rows = [];
	let copied = 0;
	let skipped = 0;

	for (const kind of ['characters', 'locations', 'props', 'brief']) {
		mkdirSync(join(OUT, kind), { recursive: true });
	}

	for (const entry of ENTRIES) {
		if (entry.kind === 'character' && SKIP_CHARACTER_SLUGS.has(entry.slug)) {
			skipped += 1;
			continue;
		}

		const src = join(STATIC, entry.sourceRel);
		if (!existsSync(src)) {
			throw new Error(`Missing source: ${relative(ROOT, src)}`);
		}

		const file = destName(entry.kind, entry.slug);
		const destRel = `${folderFor(entry.kind)}/${file}`;
		const dest = join(OUT, destRel);
		copyFileSync(src, dest);
		copied += 1;
		rows.push({
			file: destRel.replaceAll('\\', '/'),
			label: entry.label,
			kind: entry.kind,
			origin: `static/assets/${entry.sourceRel}`
		});
	}

	const manifestLines = [
		'# Manifest — higgsfield-uploads',
		'',
		'Copias renombradas para subir a Higgsfield. Origen canónico: `static/assets/`.',
		'',
		'| Archivo | Entidad | Tipo | Origen |',
		'| --- | --- | --- | --- |'
	];
	for (const row of rows) {
		manifestLines.push(`| \`${row.file}\` | ${row.label} | ${row.kind} | \`${row.origin}\` |`);
	}
	manifestLines.push('');

	writeFileSync(join(OUT, 'TODO.md'), TODO_MD, 'utf8');
	writeFileSync(join(OUT, 'MANIFEST.md'), manifestLines.join('\n'), 'utf8');

	const skippedNote = skipped ? ` skipped=${skipped}` : '';
	console.log(
		`prepare:higgsfield OK — copied=${copied}${skippedNote} → ${relative(ROOT, OUT)}`
	);
}

main();
