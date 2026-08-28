import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LEGACY = join(ROOT, 'legacy-site');
const DATA = join(ROOT, 'data');
const translations = JSON.parse(
	readFileSync(join(DATA, 'translations', 'documents.en.json'), 'utf8')
);

const sources = [
	[
		'notas-tecnicas-continuidad',
		'Notas técnicas y continuidad',
		'Technical notes and continuity',
		'Reglas físicas, visuales y narrativas consolidadas.',
		'Consolidated physical, visual, and narrative rules.',
		'notas-tecnicas-continuidad.html'
	],
	[
		'biblia-de-produccion',
		'Biblia de producción',
		'Production bible',
		'Personajes, espacios, naves, sistemas y objetos con funciones dramáticas y visuales verificables.',
		'Characters, spaces, ships, systems, and objects with verifiable dramatic and visual functions.',
		'biblia-produccion.html'
	],
	[
		'reporte-comprensivo',
		'Reporte comprensivo',
		'Comprehensive report',
		'Concepto, causalidad, tránsito e infraestructura reconciliados.',
		'Reconciled concept, causality, transit, and infrastructure.',
		'reporte-comprensivo.html'
	],
	[
		'momentos-clave',
		'Momentos clave',
		'Key moments',
		'Los siete giros que sostienen la versión revisada.',
		'The seven turns supporting the revised version.',
		'momentos-clave.html'
	],
	[
		'estructura-30-minutos',
		'Estructura de 30 minutos',
		'30-minute structure',
		'Presupuesto de tiempo y arquitectura causal del cortometraje.',
		'The short film’s timing budget and causal architecture.',
		'version-acotada-30-min.html'
	]
];

const documentIdForSlug = (slug) =>
	({
		'notas-tecnicas-continuidad': 'document:notas-tecnicas',
		'biblia-de-produccion': 'document:biblia-produccion',
		'reporte-comprensivo': 'document:reporte-comprensivo',
		'momentos-clave': 'document:momentos-clave',
		'estructura-30-minutos': 'document:estructura-30-minutos'
	})[slug];

const decode = (value) =>
	value
		.replace(/&nbsp;/g, ' ')
		.replace(/&times;/g, '×')
		.replace(/&rarr;/g, '→')
		.replace(/&larr;/g, '←')
		.replace(/&mdash;/g, '—')
		.replace(/&ndash;/g, '–')
		.replace(/&sup3;/g, '³')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function text(html) {
	return decode(
		html
			.replace(/<br\s*\/?\s*>/gi, '\n')
			.replace(/<[^>]+>/g, ' ')
			.replace(/[ \t]+/g, ' ')
			.replace(/\s*\n\s*/g, '\n')
			.trim()
	);
}

function idFromAttributes(attributes, fallback) {
	return attributes.match(/\bid="([^"]+)"/i)?.[1] ?? fallback;
}

function parseTable(body, id) {
	const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
		.map((match) =>
			[...match[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)].map((cell) => text(cell[2]))
		)
		.filter((row) => row.length);
	const firstHasTh = /<tr[^>]*>[\s\S]*?<th\b/i.test(body);
	const headers = firstHasTh
		? (rows.shift() ?? [])
		: (rows[0]?.map((_, index) => `— ${index + 1}`) ?? []);
	return { type: 'table', id, headers, rows };
}

function parseDocument(filename, slug) {
	const html = readFileSync(join(LEGACY, filename), 'utf8');
	const article = html.match(/<article[^>]*class="content"[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? '';
	const pattern =
		/<(h1|h2|h3|h4|p|ul|ol|blockquote|table)([^>]*)>([\s\S]*?)<\/\1>|<div([^>]*)class="[^"]*\bbeat\b[^"]*"([^>]*)>([\s\S]*?)<\/div>|<hr\s*\/?>/gi;
	const blocks = [];
	let index = 0;
	for (const match of article.matchAll(pattern)) {
		index += 1;
		const id = `${slug}:block-${String(index).padStart(3, '0')}`;
		if (/^<hr/i.test(match[0])) {
			blocks.push({ type: 'hr', id });
			continue;
		}
		if (match[6] !== undefined) {
			const title = text(match[6].match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? '');
			const body = text(
				match[6].replace(/<strong[^>]*>[\s\S]*?<\/strong>/i, '').replace(/<br\s*\/?\s*>/i, '')
			);
			blocks.push({ type: 'beat', id, title, text: body });
			continue;
		}
		const tag = match[1].toLowerCase();
		const attrs = match[2] ?? '';
		const body = match[3] ?? '';
		if (/^h[1-4]$/.test(tag))
			blocks.push({
				type: 'heading',
				id: idFromAttributes(attrs, id),
				level: Number(tag[1]),
				text: text(body)
			});
		else if (tag === 'ul' || tag === 'ol') {
			const items = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => text(item[1]));
			if (items.length) blocks.push({ type: 'list', id, ordered: tag === 'ol', items });
		} else if (tag === 'table') blocks.push(parseTable(body, id));
		else {
			const value = text(body);
			if (!value || value.startsWith('←')) continue;
			blocks.push({ type: tag === 'blockquote' ? 'blockquote' : 'paragraph', id, text: value });
		}
	}
	return blocks;
}

function reconcileSpanish(slug, blocks) {
	const byId = new Map(blocks.map((block) => [block.id, block]));
	if (slug === 'biblia-de-produccion') {
		byId.get('biblia-de-produccion:block-018').text =
			'CELESTIAL ARDOR — Interior. Cubiertas transversales al eje de empuje y tres recorridos longitudinales: cilindro central de uso cotidiano, pozo de ascensor y cilindro de servicio estrecho para tránsito balístico y bandejas técnicas. El puente se abre a un vestíbulo axial visible detrás de Voss; el acceso al cilindro de servicio queda oculto en un receso lateral. El núcleo diplomático retrofit está fuera del eje y posee accesos operativo y técnico separados. Un distribuidor próximo a mando reúne los acopladores COM A/B de cada cubierta. Durante el empuje el piso recibe 1 g; en la aproximación final y el cruce hay microgravedad.';
		byId.get('biblia-de-produccion:block-027').text =
			'LÁSER EXTERIOR DE COMUNICACIONES — sistema estándar de larga distancia de la Celestial Ardor. Su control local, alimentación y puntería usan una canalización física dedicada, separada de la malla inalámbrica y del distribuidor COM A/B. Zao lo apunta al corredor futuro de la nave usando el plan de vuelo, el tiempo lumínico, la divergencia y un barrido estrecho. Firma dispositivo y hora, pero no certifica la veracidad del mensaje.';
	}
	if (slug === 'reporte-comprensivo') {
		byId.get('reporte-comprensivo:block-032').text =
			'Como Ingeniera Jefe, el puesto asignado de Zao durante el cruce es el monitoreo del Núcleo Diplomático. Está sola donde le corresponde. Harlan conoce esa ubicación porque llega sin ser visto a la puerta del puente justo cuando Zao informa por radio que existe un payload autónomo firmado por Sorell y que la firma parece falsa. Antes de que ella pueda nombrarlo, activa remotamente un jammer y se retira hacia el acceso lateral del cilindro de servicio.';
		byId.get('reporte-comprensivo:block-034').text =
			'El jammer derriba voz, texto y la malla inalámbrica. Desde el cilindro de servicio, Harlan desconecta además los acopladores SISTEMAS DIPLOMÁTICOS — COM A/B antes de que Zao pruebe el respaldo cableado. Se impulsa balísticamente por el tubo técnico y llega antes que Sorell, que avanza por el corredor cotidiano agarrándose de las barras en microgravedad. Zao reconoce que el silencio simultáneo, justo después de su aviso abierto, significa que alguien va hacia ella. El único enlace que conserva es el control local del láser exterior estándar, cuya ruta física dedicada no pasa por la malla ni por COM A/B.';
		byId.get('reporte-comprensivo:block-042').text =
			'Harlan llega cuando la solución de puntería ya está cerrada. Ve TRANSMITIDO, pero no el corredor exacto, asesina a Zao y limpia sus huellas. Regresa rápidamente por el cilindro de servicio para reconstruir su coartada. Sorell llega más tarde por el corredor central, intenta reanimar a Zao y llama al puente, pero el jammer sigue activo. Cuando Harlan reaparece en mando dice no haberla visto; Voss lo envía con otro tripulante a buscarla. La nave cruza sin posibilidad de abortar ni regresar.';
	}
	if (slug === 'notas-tecnicas-continuidad') {
		byId.get('notas-tecnicas-continuidad:block-039').items[0] =
			'Se retiró la ocultación de la Tierra por Júpiter y la partición automática de cruce como mecanismos centrales. Harlan causa el aislamiento: activa un jammer, corta físicamente COM A/B desde el cilindro de servicio y aprovecha la microgravedad para alcanzar a Zao antes que Sorell. La vía Tierra sigue siendo inútil por demora lumínica.';
	}
	return blocks;
}

function localized(sourceValue, translatedValue, sourceLanguage = 'es') {
	return {
		sourceLanguage,
		variants:
			translatedValue === undefined
				? { [sourceLanguage]: sourceValue }
				: { [sourceLanguage]: sourceValue, en: translatedValue }
	};
}

function translatedBlocks(es, values, slug) {
	if (!Array.isArray(values) || values.length !== es.length)
		throw new Error(`${slug}: expected ${es.length} translated blocks, got ${values?.length ?? 0}`);
	return es.map((source, index) => {
		const value = values[index];
		if (source.type === 'heading' || source.type === 'paragraph' || source.type === 'blockquote')
			return { ...source, text: value };
		if (source.type === 'list') return { ...source, items: value };
		if (source.type === 'table') return { ...source, ...value };
		if (source.type === 'beat') return { ...source, ...value };
		return { ...source };
	});
}

if (process.argv.includes('--inspect')) {
	for (const [slug, , , , , filename] of sources) {
		const requested = process.argv[process.argv.indexOf('--inspect') + 1];
		if (requested && requested !== slug) continue;
		const blocks = parseDocument(filename, slug);
		console.log(JSON.stringify({ slug, count: blocks.length, blocks }, null, 2));
	}
	process.exit(0);
}

const existing = JSON.parse(readFileSync(join(DATA, 'documents.json'), 'utf8'));
const replacedIds = new Set(sources.map(([slug]) => documentIdForSlug(slug)));
const documents = [];
for (const [slug, titleEs, titleEn, summaryEs, summaryEn, filename] of sources) {
	const blocksEs = reconcileSpanish(slug, parseDocument(filename, slug));
	const blocksEn = translatedBlocks(blocksEs, translations[slug]?.blocks, slug);
	documents.push({
		id: documentIdForSlug(slug),
		slug,
		title: localized(titleEs, titleEn),
		status: 'extracted',
		sourceLanguage: 'es',
		sourcePath: `legacy-site/${filename}`,
		summary: localized(summaryEs, summaryEn),
		content: localized(blocksEs, blocksEn),
		translationStatus: { es: 'source', en: 'draft' },
		provenance: [`legacy-site/${filename}`, 'docs/CANON_DECISIONS.md', 'docs/PROJECT_STATUS.md']
	});
}

for (const old of existing.documents) {
	if (
		replacedIds.has(old.id) ||
		sources.some(([, , , , , filename]) => old.sourcePath === `legacy-site/${filename}`)
	)
		continue;
	if (old.title?.sourceLanguage) {
		const catalogLanguage = old.title.variants?.[old.sourceLanguage]
			? old.sourceLanguage
			: (Object.keys(old.title.variants ?? {})[0] ?? old.sourceLanguage ?? old.language ?? 'es');
		const availableLanguages = new Set(Object.keys(old.content?.variants ?? {}));
		const translationStatus = Object.fromEntries(
			Object.entries(old.translationStatus ?? {}).filter(([locale]) =>
				availableLanguages.has(locale)
			)
		);
		documents.push({
			...old,
			sourceLanguage: catalogLanguage,
			translationStatus: { ...translationStatus, [catalogLanguage]: 'source' }
		});
		continue;
	}
	const title = old.title;
	const summary = old.summary;
	const blocks = old.blocks ?? [];
	const sourceLanguage = old.language ?? 'es';
	documents.push({
		...old,
		title: localized(title, undefined, sourceLanguage),
		sourceLanguage,
		summary: summary ? localized(summary, undefined, sourceLanguage) : undefined,
		content: localized(blocks, undefined, sourceLanguage),
		translationStatus: { [sourceLanguage]: 'source' }
	});
}

writeFileSync(
	join(DATA, 'documents.json'),
	`${JSON.stringify({ schemaVersion: '2.0.0', documents }, null, 2)}\n`
);

const migration = {
	schemaVersion: '1.0.0',
	sourceIndex: 'legacy-site/index.html',
	pages: [
		{
			source: 'legacy-site/index.html',
			destination: '/',
			disposition: 'reconciled',
			translation: 'complete'
		},
		...sources.map(([slug, , , , , filename]) => ({
			source: `legacy-site/${filename}`,
			destination: `/documents/${slug}`,
			disposition: 'ported-reconciled',
			translation: 'complete'
		})),
		{
			source: 'legacy-site/guion-30-minutos.html',
			destination: '/script/[scriptId]',
			disposition: 'ported',
			translation: 'complete'
		},
		{
			source: 'legacy-site/animatic-textual.html',
			destination: '/animatic/[scriptId]',
			disposition: 'ported',
			translation: 'complete'
		},
		{
			source: 'legacy-site/assets/art-bible/index.html',
			destination: '/art',
			disposition: 'merged-into-entities',
			translation: 'complete'
		},
		{
			source: 'legacy-site/assets/characters/index.html',
			destination: '/entities/characters',
			disposition: 'merged-into-entities',
			translation: 'complete'
		}
	]
};
writeFileSync(join(DATA, 'legacy-text-migration.json'), `${JSON.stringify(migration, null, 2)}\n`);
console.log(`Ported ${sources.length} documents (${documents.length} registered total).`);
