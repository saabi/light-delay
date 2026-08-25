/**
 * Extract canonical JSON from legacy-site HTML + manifests.
 * Spanish dialogue only (source of truth). Does not invent translations.
 *
 * Usage: node scripts/extract-legacy.mjs
 *
 * NOTE (multi-script / ADR-0001): this extractor still emits the pre-migration
 * hyphen ID layout and writes `data/script.json`. After a fresh extract, run
 * `node scripts/migrate-multi-script.mjs` to produce `data/scripts/*.json`,
 * colon entity IDs, registry, festival draft, narrative-functions and entity-variants.
 * Prefer not re-running extract over the migrated tree until extract itself is updated.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');
const LEGACY = join(ROOT, 'legacy-site');
const SCHEMA = '1.0.0';

const SIZE_MAP = {
	PG: 'LS',
	PM: 'MS',
	PP: 'CU',
	PPP: 'ECU',
	PD: 'INSERT',
	POV: 'POV',
	OTS: 'OTS',
	TRAV: 'OTHER',
	MON: 'OTHER',
	NEGRO: 'OTHER'
};

const LOCATION_HINTS = [
	[/proxima.*muelle|estación proxima|muelle/i, 'location-proxima-dock'],
	[/estación proxima(?!.*muelle)/i, 'location-proxima-station'],
	[/puente/i, 'location-celestial-ardor-bridge'],
	[/ingenier[ií]a|sala de m[aá]quinas|m[aá]quinas/i, 'location-celestial-ardor-engineering'],
	[/n[uú]cleo diplom[aá]tico|sala del n[uú]cleo/i, 'location-diplomatic-core-room'],
	[/boca|t[uú]nel|garganta|ventana/i, 'location-velari-wormhole-mouth'],
	[/estaci[oó]n velari/i, 'location-velari-station']
];

function pad2(n) {
	return String(n).padStart(2, '0');
}

function stripTags(html) {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeText(s) {
	return (s || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function similarity(a, b) {
	const na = normalizeText(a);
	const nb = normalizeText(b);
	if (!na || !nb) return 0;
	if (na === nb) return 1;
	if (na.includes(nb) || nb.includes(na)) {
		return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
	}
	// token overlap
	const ta = new Set(na.split(' '));
	const tb = new Set(nb.split(' '));
	let inter = 0;
	for (const t of ta) if (tb.has(t)) inter++;
	return inter / Math.max(ta.size, tb.size);
}

function writeJson(name, value) {
	mkdirSync(DATA, { recursive: true });
	const path = join(DATA, name);
	writeFileSync(path, JSON.stringify(value, null, '\t') + '\n', 'utf8');
	console.log('wrote', name);
}

function parseAnimatic() {
	const html = readFileSync(join(LEGACY, 'animatic-textual.html'), 'utf8');
	const start = html.indexOf('const DATA=');
	if (start < 0) throw new Error('DATA not found in animatic-textual.html');
	const cut = html.indexOf(',KEY=', start);
	if (cut < 0) throw new Error('KEY= marker not found after DATA');
	const json = html.slice(start + 'const DATA='.length, cut);
	return JSON.parse(json);
}

function parseGuion() {
	const html = readFileSync(join(LEGACY, 'guion-30-minutos.html'), 'utf8');
	const scenes = [];
	const sceneRe = /<h2\s+class="scene"[^>]*>([\s\S]*?)<\/h2>/gi;
	const headings = [...html.matchAll(sceneRe)];
	for (let i = 0; i < headings.length; i++) {
		const headingRaw = stripTags(headings[i][1]).replace(/\s+/g, ' ');
		const m = headingRaw.match(/ESC\.\s*(\d+)\s*[—-]\s*(.+)/i);
		const number = m ? Number(m[1]) : i + 1;
		const title = m ? m[2].trim() : headingRaw;
		const start = headings[i].index + headings[i][0].length;
		const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
		const body = html.slice(start, end);

		const dialogues = [];
		for (const dm of body.matchAll(
			/<p\s+class="dialogue">\s*<span\s+class="speaker-inline">([^<]*)<\/span>([\s\S]*?)<\/p>/gi
		)) {
			const speakerRaw = stripTags(dm[1]);
			let textHtml = dm[2];
			let delivery;
			const paren = textHtml.match(/^\s*<em>\(([^)]*)\)<\/em>\s*/i);
			if (paren) {
				delivery = paren[1].trim();
				textHtml = textHtml.slice(paren[0].length);
			}
			const text = stripTags(textHtml);
			dialogues.push({ speakerRaw, text, delivery });
		}

		const actions = [];
		for (const am of body.matchAll(/<p>([\s\S]*?)<\/p>/gi)) {
			const chunk = am[1];
			if (/class="dialogue"/i.test(am[0])) continue;
			if (/^<span\s+class="speaker/i.test(chunk)) continue;
			// Prefer italic action / stage directions
			const emOnly = chunk.match(/^<em>([\s\S]*)<\/em>$/i);
			const text = stripTags(chunk);
			if (!text || text.length < 8) continue;
			if (/^(FADE|CUT TO|MIN |DIRECCI)/i.test(text)) continue;
			if (emOnly || /CELESTIAL|Proxima|Zao|Voss|Harlan|Rao|Sorell|Cael/i.test(text)) {
				actions.push(text);
			}
		}

		scenes.push({ number, title, headingRaw, dialogues, actions });
	}
	return scenes;
}

function inferSetting(title) {
	const t = title.toUpperCase();
	let interiorExterior = 'INT';
	if (t.includes('EXT./INT') || t.includes('EXT/INT') || t.includes('INT./EXT')) {
		interiorExterior = 'INT_EXT';
	} else if (t.includes('EXT.')) {
		interiorExterior = 'EXT';
	}
	const timeOfDay = t.includes('NOCHE')
		? 'NOCHE'
		: t.includes('DÍA') || t.includes('DIA')
			? 'DÍA'
			: undefined;
	const continuity = t.includes('CONTINUO')
		? 'CONTINUO'
		: t.includes('MÁS TARDE') || t.includes('MAS TARDE')
			? 'MÁS TARDE'
			: undefined;
	const storyTime = (title.match(/T\+?\s*[\d,.]+H?/i) || [])[0];
	return { interiorExterior, timeOfDay, continuity, storyTime };
}

function inferLocationId(title) {
	for (const [re, id] of LOCATION_HINTS) {
		if (re.test(title)) return id;
	}
	return 'location-celestial-ardor-bridge';
}

function buildEntities() {
	const charManifest = JSON.parse(
		readFileSync(join(LEGACY, 'assets/characters/manifest.json'), 'utf8')
	);
	const locManifest = JSON.parse(
		readFileSync(join(LEGACY, 'assets/locations/manifest.json'), 'utf8')
	);
	const propManifest = JSON.parse(readFileSync(join(LEGACY, 'assets/props/manifest.json'), 'utf8'));
	const vehManifest = JSON.parse(
		readFileSync(join(LEGACY, 'assets/vehicles/manifest.json'), 'utf8')
	);

	const assets = [];
	const characters = [];
	const voiceProfiles = [];

	for (const c of charManifest.characters) {
		const id = `character-${c.slug}`;
		const assetId = `asset-character-${c.slug}-sheet`;
		assets.push({
			id: assetId,
			kind: 'image',
			role: 'reference',
			path: `/assets/characters/${c.file.replace(/\\/g, '/')}`,
			mimeType: 'image/png',
			title: `${c.name} model sheet`,
			width: c.dimensions?.[0],
			height: c.dimensions?.[1]
		});
		const voiceId = `voice-${c.slug}-es`;
		voiceProfiles.push({
			id: voiceId,
			characterId: id,
			name: `${c.name} (es)`,
			description: c.note,
			variants: [{ language: 'es' }]
		});
		characters.push({
			id,
			name: c.name,
			shortName: c.name.split(' ').pop(),
			role: c.role,
			description: c.note || c.role,
			factionIds:
				c.slug === 'earth-protesters' ? ['faction-acheron', 'faction-human'] : ['faction-human'],
			referenceAssetIds: [assetId],
			defaultVoiceProfileId: voiceId,
			aliases: [c.name.toUpperCase(), (c.name.split(' ').pop() || '').toUpperCase()].filter(Boolean)
		});
	}

	// Extra speakers appearing in the script but not as full model sheets
	const extras = [
		{
			id: 'character-periodista',
			name: 'Periodista',
			role: 'Voz en off de noticias',
			description: 'Narración de transmisión terrestre.'
		},
		{
			id: 'character-manifestante-acheron',
			name: 'Manifestante Aqueronte',
			role: 'Manifestante',
			description: 'Voz de la Directiva Aqueronte en transmisión.'
		},
		{
			id: 'character-joven-contacto',
			name: 'Joven partidaria del contacto',
			role: 'Manifestante',
			description: 'Voz partidaria del contacto en transmisión.'
		}
	];
	for (const e of extras) {
		characters.push({
			...e,
			factionIds: ['faction-human'],
			referenceAssetIds: [],
			aliases: [e.name.toUpperCase()]
		});
	}

	const locations = locManifest.items.map((item) => {
		const assetId = `asset-location-${item.slug}-sheet`;
		assets.push({
			id: assetId,
			kind: 'image',
			role: 'reference',
			path: `/assets/locations/${item.file.replace(/\\/g, '/')}`,
			mimeType: 'image/png',
			title: `${item.name} concept sheet`,
			width: locManifest.dimensions?.[0],
			height: locManifest.dimensions?.[1]
		});
		return {
			id: `location-${item.slug}`,
			name: item.name,
			description: item.note || item.role,
			referenceAssetIds: [assetId],
			atmosphere: item.role
		};
	});

	const objects = propManifest.items.map((item) => {
		const assetId = `asset-object-${item.slug}-sheet`;
		assets.push({
			id: assetId,
			kind: 'image',
			role: 'reference',
			path: `/assets/props/${item.file.replace(/\\/g, '/')}`,
			mimeType: 'image/png',
			title: `${item.name} prop sheet`,
			width: propManifest.dimensions?.[0],
			height: propManifest.dimensions?.[1]
		});
		return {
			id: `object-${item.slug}`,
			name: item.name,
			description: item.note || item.role,
			dramaticFunction: item.role,
			referenceAssetIds: [assetId]
		};
	});

	const vehicles = vehManifest.items.map((item) => {
		const assetId = `asset-vehicle-${item.slug}-sheet`;
		assets.push({
			id: assetId,
			kind: 'image',
			role: 'reference',
			path: `/assets/vehicles/${item.file.replace(/\\/g, '/')}`,
			mimeType: 'image/png',
			title: `${item.name} model sheet`,
			width: vehManifest.dimensions?.[0],
			height: vehManifest.dimensions?.[1]
		});
		return {
			id: `vehicle-${item.slug}`,
			name: item.name,
			description: item.note || item.role,
			factionId: item.slug.includes('velari') ? 'faction-velari' : 'faction-human',
			referenceAssetIds: [assetId]
		};
	});

	const factions = [
		{
			id: 'faction-human',
			name: 'Humanidad / misión Proxima',
			description: 'Tripulación humana y autoridades terrestres.',
			memberCharacterIds: characters
				.filter((c) => c.factionIds?.includes('faction-human'))
				.map((c) => c.id)
		},
		{
			id: 'faction-velari',
			name: 'Velari',
			description: 'Civilización alienígena del túnel y la estación remota.'
		},
		{
			id: 'faction-acheron',
			name: 'Directiva Aqueronte',
			description: 'Facción terrestre opuesta al contacto.'
		}
	];

	return { assets, characters, locations, objects, vehicles, factions, voiceProfiles };
}

function resolveSpeakerId(speakerRaw, characters) {
	let name = speakerRaw
		.replace(/\(.*?\)/g, '')
		.replace(/CONT'?D\.?/gi, '')
		.trim();
	name = name.replace(/\s+/g, ' ');
	const upper = name.toUpperCase();

	const special = {
		PERIODISTA: 'character-periodista',
		'MANIFESTANTE AQUERONTE': 'character-manifestante-acheron',
		'JOVEN PARTIDARIA DEL CONTACTO': 'character-joven-contacto',
		TÉCNICO: 'character-proxima-technician',
		TECNICO: 'character-proxima-technician',
		'OFICIAL MÉDICO': 'character-medical-officer',
		'OFICIAL MEDICO': 'character-medical-officer',
		SEGURIDAD: 'character-security-crew'
	};
	if (special[upper]) return special[upper];

	for (const c of characters) {
		const aliases = [c.name, c.shortName, ...(c.aliases || [])]
			.filter(Boolean)
			.map((a) => a.toUpperCase());
		if (aliases.includes(upper)) return c.id;
		if (aliases.some((a) => upper.endsWith(a) || a.endsWith(upper))) return c.id;
	}
	// fallback slug
	const slug = upper
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `character-${slug || 'unknown'}`;
}

function presentationFromSpeaker(speakerRaw) {
	const u = speakerRaw.toUpperCase();
	if (u.includes('(V.O.)') || u.includes('(VO)')) return 'voice_over';
	if (u.includes('(O.S.)') || u.includes('(OS)')) return 'off_screen';
	return 'on_screen';
}

function extractDocuments() {
	const docs = [];
	const notasPath = join(LEGACY, 'notas-tecnicas-continuidad.html');
	try {
		const html = readFileSync(notasPath, 'utf8');
		const contentMatch = html.match(/<article[^>]*class="content"[^>]*>([\s\S]*?)<\/article>/i);
		const body = contentMatch ? contentMatch[1] : html;
		const blocks = [];
		const tokens = [...body.matchAll(/<(h2|h3|p|ul|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi)];
		for (const t of tokens.slice(0, 80)) {
			const tag = t[1].toLowerCase();
			if (tag === 'h2' || tag === 'h3') {
				blocks.push({
					type: 'heading',
					level: tag === 'h2' ? 2 : 3,
					text: stripTags(t[3]),
					id: (t[2].match(/id="([^"]+)"/) || [])[1]
				});
			} else if (tag === 'ul') {
				const items = [...t[3].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((li) =>
					stripTags(li[1])
				);
				if (items.length) blocks.push({ type: 'list', items });
			} else if (tag === 'blockquote') {
				const text = stripTags(t[3]);
				if (text) blocks.push({ type: 'blockquote', text });
			} else {
				const text = stripTags(t[3]);
				if (text && !/^←/.test(text)) blocks.push({ type: 'paragraph', text });
			}
		}
		docs.push({
			id: 'doc-notas-tecnicas',
			slug: 'notas-tecnicas-continuidad',
			title: 'Notas técnicas y continuidad',
			status: 'extracted',
			language: 'es',
			sourcePath: 'legacy-site/notas-tecnicas-continuidad.html',
			summary: 'Reglas físicas, visuales y narrativas consolidadas.',
			blocks
		});
	} catch (e) {
		docs.push({
			id: 'doc-notas-tecnicas',
			slug: 'notas-tecnicas-continuidad',
			title: 'Notas técnicas y continuidad',
			status: 'stub',
			language: 'es',
			sourcePath: 'legacy-site/notas-tecnicas-continuidad.html',
			blocks: [{ type: 'paragraph', text: `Extraction failed: ${e.message}` }]
		});
	}

	const stubs = [
		['doc-biblia-produccion', 'biblia-de-produccion', 'Biblia de producción'],
		['doc-reporte-comprensivo', 'reporte-comprensivo', 'Reporte comprensivo'],
		['doc-momentos-clave', 'momentos-clave', 'Momentos clave'],
		['doc-canon', 'canon-decisions', 'Decisiones de canon']
	];
	for (const [id, slug, title] of stubs) {
		docs.push({
			id,
			slug,
			title,
			status: 'stub',
			language: 'es',
			blocks: [
				{
					type: 'paragraph',
					text: 'Stub pendiente de extracción en Fase 2.'
				}
			]
		});
	}

	return { schemaVersion: SCHEMA, documents: docs };
}

function buildScript(animatic, guionScenes, characters) {
	const acts = [
		{
			id: 'act-1',
			number: 1,
			title: 'Embarque y tránsito',
			dramaticPurpose: 'Presentar misión, tripulación y primera anomalía.',
			sceneIds: []
		},
		{
			id: 'act-2',
			number: 2,
			title: 'Sabotaje y crisis',
			dramaticPurpose: 'Descubrir corrupción, conflicto interno y evidencia.',
			sceneIds: []
		},
		{
			id: 'act-3',
			number: 3,
			title: 'Cruce y contacto',
			dramaticPurpose: 'Ventana, contención y umbral Velari.',
			sceneIds: []
		}
	];

	const actForScene = (n) => (n <= 6 ? acts[0] : n <= 12 ? acts[1] : acts[2]);

	const scenes = [];
	const beats = [];
	const cues = [];
	const shots = [];
	const takes = [];
	const frameAssets = [];

	const guionByNum = new Map(guionScenes.map((s) => [s.number, s]));
	const mismatch = {
		animaticOnly: [],
		scriptOnly: [],
		fuzzy: [],
		placed: 0,
		unplacedAnimaticSubs: 0,
		uncoveredScriptLines: 0
	};

	let globalShotOrder = 0;

	for (const animScene of animatic) {
		const n = animScene.n;
		const guion = guionByNum.get(n);
		const sceneId = `scene-${pad2(n)}`;
		const beatId = `beat-${pad2(n)}-01`;
		const act = actForScene(n);
		act.sceneIds.push(sceneId);

		const title = guion?.title || animScene.title;
		const locationId = inferLocationId(title);
		const setting = inferSetting(title);

		const sceneCueIds = [];
		const sceneShotIds = [];
		let cueOrder = 0;

		const dialogueCues = [];
		if (guion) {
			for (const d of guion.dialogues) {
				cueOrder += 1;
				const cueId = `cue-${pad2(n)}-${pad2(cueOrder)}`;
				const speakerId = resolveSpeakerId(d.speakerRaw, characters);
				const cue = {
					id: cueId,
					beatId,
					order: cueOrder,
					type: 'dialogue',
					speakerId,
					presentation: presentationFromSpeaker(d.speakerRaw),
					performance: d.delivery ? { emotion: d.delivery } : undefined,
					content: {
						sourceLanguage: 'es',
						variants: {
							es: {
								spokenText: d.text,
								status: 'source'
							}
						}
					}
				};
				cues.push(cue);
				dialogueCues.push(cue);
				sceneCueIds.push(cueId);
			}
			for (const actionText of guion.actions.slice(0, 12)) {
				cueOrder += 1;
				const cueId = `cue-${pad2(n)}-${pad2(cueOrder)}`;
				cues.push({
					id: cueId,
					beatId,
					order: cueOrder,
					type: 'action',
					text: actionText
				});
				sceneCueIds.push(cueId);
			}
		}

		const usedCueIds = new Set();

		animScene.shots.forEach((raw, idx) => {
			const shotNum = idx + 1;
			globalShotOrder += 1;
			const shotId = `shot-${pad2(n)}-${pad2(shotNum)}`;
			const takeId = `take-${pad2(n)}-${pad2(shotNum)}-01`;
			const assetId = `asset-animatic-${pad2(n)}-${pad2(shotNum)}`;
			const [sizeCode, durationSec, description, camera, audio, subs] = raw;
			const durationMs = Math.round(Number(durationSec) * 1000);
			const path = `/assets/animatic/frames/scene-${pad2(n)}/shot-${pad2(shotNum)}.png`;

			frameAssets.push({
				id: assetId,
				kind: 'image',
				role: 'animatic',
				path,
				mimeType: 'image/png',
				title: `Animatic ${sceneId} shot ${shotNum}`,
				width: 1536,
				height: 864,
				description
			});

			const cuePlacements = [];
			const subLines = Array.isArray(subs) ? subs : [];
			for (const sub of subLines) {
				const parts = String(sub).split(/\s+[—–-]\s+/);
				const subText = parts.length > 1 ? parts.slice(1).join(' — ').trim() : String(sub).trim();
				let best = null;
				let bestScore = 0;
				for (const cue of dialogueCues) {
					if (usedCueIds.has(cue.id)) continue;
					const spoken = cue.content.variants.es.spokenText;
					const score = similarity(subText, spoken);
					if (score > bestScore) {
						bestScore = score;
						best = cue;
					}
				}
				if (best && bestScore >= 0.55) {
					usedCueIds.add(best.id);
					cuePlacements.push({
						cueId: best.id,
						atMs: 0,
						durationMs: Math.min(durationMs, 8000)
					});
					mismatch.placed += 1;
					if (bestScore < 0.9) {
						mismatch.fuzzy.push({
							shotId,
							cueId: best.id,
							score: Number(bestScore.toFixed(2)),
							animatic: subText,
							script: best.content.variants.es.spokenText
						});
					}
				} else {
					mismatch.unplacedAnimaticSubs += 1;
					mismatch.animaticOnly.push({
						shotId,
						text: subText,
						bestScore: Number(bestScore.toFixed(2)),
						bestCueId: best?.id
					});
				}
			}

			shots.push({
				id: shotId,
				sceneId,
				beatIds: [beatId],
				number: shotNum,
				order: globalShotOrder,
				description: description || '',
				locationId,
				composition: {
					size: SIZE_MAP[sizeCode] || 'OTHER',
					framing: sizeCode,
					aspectRatio: '16:9'
				},
				camera: {
					movementDescription: camera || undefined
				},
				durationMs,
				cuePlacements,
				takeIds: [takeId],
				selectedTakeId: takeId,
				notes: audio ? [{ type: 'sound', text: audio }] : undefined
			});
			sceneShotIds.push(shotId);

			takes.push({
				id: takeId,
				shotId,
				number: 1,
				status: 'selected',
				imageAssetId: assetId
			});
		});

		for (const cue of dialogueCues) {
			if (!usedCueIds.has(cue.id)) {
				mismatch.uncoveredScriptLines += 1;
				mismatch.scriptOnly.push({
					sceneId,
					cueId: cue.id,
					text: cue.content.variants.es.spokenText,
					speakerId: cue.speakerId
				});
			}
		}

		const characterIds = [
			...new Set(
				dialogueCues.map((c) => c.speakerId).filter((id) => characters.some((ch) => ch.id === id))
			)
		];

		beats.push({
			id: beatId,
			sceneId,
			order: 1,
			title: `Escena ${n}`,
			purpose: 'Unidad dramática inicial (1 beat por escena; refinable).',
			summary: animScene.title,
			cueIds: sceneCueIds
		});

		scenes.push({
			id: sceneId,
			actId: act.id,
			number: n,
			order: n,
			title,
			locationId,
			setting,
			summary: animScene.title,
			characterIds,
			beatIds: [beatId],
			shotIds: sceneShotIds,
			targetDurationMs: Math.round(Number(animScene.target) * 1000)
		});
	}

	return {
		scriptFile: {
			schemaVersion: SCHEMA,
			script: {
				id: 'script-light-delay-short',
				projectId: 'project-light-delay',
				title: 'Light Delay — Guion de cortometraje',
				version: '1.0.0-extract',
				status: 'draft',
				actIds: acts.map((a) => a.id)
			},
			acts,
			sequences: [],
			scenes,
			beats,
			cues,
			shots,
			takes
		},
		frameAssets,
		mismatch
	};
}

function writeSyncDoc(mismatch, animatic, guionScenes) {
	const lines = [];
	lines.push('# Sincronización guion ↔ animatic');
	lines.push('');
	lines.push(
		'El **guion** (`legacy-site/guion-30-minutos.html` → `data/script.json`) es la fuente de verdad narrativa. El animatic se alinea al guion; los desajustes se registran aquí sin reescribir el guion.'
	);
	lines.push('');
	lines.push('## Conteos verificados (Fase 1 extracción)');
	lines.push('');
	lines.push('| Métrica | Guion | Animatic DATA | JSON shots |');
	lines.push('| --- | ---: | ---: | ---: |');
	lines.push(`| Escenas | ${guionScenes.length} | ${animatic.length} | (ver script.scenes) |`);
	lines.push(
		`| Diálogos / subtítulos | ${guionScenes.reduce((n, s) => n + s.dialogues.length, 0)} líneas | ${mismatch.placed + mismatch.unplacedAnimaticSubs} subs | ${mismatch.placed} placements |`
	);
	lines.push('');
	lines.push('## Resumen de matching automático');
	lines.push('');
	lines.push(`- Placements aceptados (similitud ≥ 0.55): **${mismatch.placed}**`);
	lines.push(`- Subtítulos de animatic sin cue colocado: **${mismatch.unplacedAnimaticSubs}**`);
	lines.push(`- Líneas de guion sin cobertura de toma: **${mismatch.uncoveredScriptLines}**`);
	lines.push(`- Pares con match difuso (0.55–0.90): **${mismatch.fuzzy.length}**`);
	lines.push('');
	lines.push('### Diálogo en animatic ausente o distinto en el guion');
	lines.push('');
	if (!mismatch.animaticOnly.length) {
		lines.push('_Ninguno._');
	} else {
		for (const row of mismatch.animaticOnly.slice(0, 40)) {
			lines.push(
				`- \`${row.shotId}\`: «${row.text}» (mejor score ${row.bestScore}${row.bestCueId ? `, cue ${row.bestCueId}` : ''})`
			);
		}
		if (mismatch.animaticOnly.length > 40) {
			lines.push(`- … y ${mismatch.animaticOnly.length - 40} más.`);
		}
	}
	lines.push('');
	lines.push('### Diálogo en el guion sin cobertura de toma / cue placement');
	lines.push('');
	if (!mismatch.scriptOnly.length) {
		lines.push('_Ninguno._');
	} else {
		for (const row of mismatch.scriptOnly.slice(0, 40)) {
			lines.push(`- \`${row.sceneId}\` / \`${row.cueId}\` (${row.speakerId}): «${row.text}»`);
		}
		if (mismatch.scriptOnly.length > 40) {
			lines.push(`- … y ${mismatch.scriptOnly.length - 40} más.`);
		}
	}
	lines.push('');
	lines.push('### Matches difusos (revisión editorial)');
	lines.push('');
	if (!mismatch.fuzzy.length) {
		lines.push('_Ninguno._');
	} else {
		for (const row of mismatch.fuzzy.slice(0, 25)) {
			lines.push(
				`- \`${row.shotId}\` ↔ \`${row.cueId}\` (score ${row.score}): animatic «${row.animatic}» / guion «${row.script}»`
			);
		}
	}
	lines.push('');
	lines.push('### Títulos / orden / límites de escena');
	lines.push('');
	for (const a of animatic) {
		const g = guionScenes.find((s) => s.number === a.n);
		const gTitle = g?.title || '(ausente en guion)';
		if (normalizeText(a.title) !== normalizeText(gTitle.split('—')[0] || gTitle)) {
			lines.push(`- ESC. ${a.n}: animatic «${a.title}» vs guion «${gTitle}»`);
		}
	}
	lines.push('');
	lines.push('### Duraciones / objetivos');
	lines.push('');
	const totalSec = animatic.reduce((s, sc) => s + Number(sc.target || 0), 0);
	lines.push(`- Animatic: suma de \`target\` por escena = ${totalSec} s.`);
	lines.push('- Guion: objetivo declarado 30:00. Coherente a nivel meta.');
	lines.push('');
	lines.push('### Limitaciones de la extracción');
	lines.push('');
	lines.push('- Matching por similitud de texto (normalizado); no es alineación editorial humana.');
	lines.push('- Un beat por escena (placeholder); beats más finos quedan para Fase 4–5.');
	lines.push('- No se generaron traducciones; sólo variante `es` con `status: "source"`.');
	lines.push('- Assets binarios aún no copiados a `static/` (Fases 3/5).');
	lines.push('');

	writeFileSync(join(ROOT, 'docs/SCRIPT_ANIMATIC_SYNC.md'), lines.join('\n'), 'utf8');
	console.log('updated docs/SCRIPT_ANIMATIC_SYNC.md');
}

function main() {
	const animatic = parseAnimatic();
	const guionScenes = parseGuion();
	console.log(
		`animatic scenes=${animatic.length} shots=${animatic.reduce((n, s) => n + s.shots.length, 0)}`
	);
	console.log(
		`guion scenes=${guionScenes.length} dialogues=${guionScenes.reduce((n, s) => n + s.dialogues.length, 0)}`
	);

	const entities = buildEntities();
	const { scriptFile, frameAssets, mismatch } = buildScript(
		animatic,
		guionScenes,
		entities.characters
	);

	const now = new Date().toISOString().slice(0, 10);
	const project = {
		schemaVersion: SCHEMA,
		project: {
			id: 'project-light-delay',
			title: 'Light Delay',
			alternateTitles: ['Luz Tardía'],
			description:
				'Cortometraje de ciencia ficción de primer contacto; guion canónico de 17 escenas.',
			languages: {
				sourceLanguage: 'es',
				defaultDialogueLanguage: 'es',
				defaultSubtitleLanguage: 'es',
				fallbackLanguage: 'es',
				supported: [
					{ tag: 'es', label: 'Spanish', nativeLabel: 'Español' },
					{ tag: 'en', label: 'English', nativeLabel: 'English' }
				]
			},
			canonicalScriptId: 'script-light-delay-short',
			targetDurationMs: 30 * 60 * 1000,
			createdAt: now,
			updatedAt: now
		}
	};

	const assets = {
		schemaVersion: SCHEMA,
		assets: [...entities.assets, ...frameAssets]
	};

	writeJson('project.json', project);
	writeJson('script.json', scriptFile);
	writeJson('characters.json', { schemaVersion: SCHEMA, characters: entities.characters });
	writeJson('locations.json', { schemaVersion: SCHEMA, locations: entities.locations });
	writeJson('objects.json', { schemaVersion: SCHEMA, objects: entities.objects });
	writeJson('vehicles.json', { schemaVersion: SCHEMA, vehicles: entities.vehicles });
	writeJson('factions.json', { schemaVersion: SCHEMA, factions: entities.factions });
	writeJson('voice-profiles.json', {
		schemaVersion: SCHEMA,
		voiceProfiles: entities.voiceProfiles
	});
	writeJson('assets.json', assets);
	writeJson('documents.json', extractDocuments());
	writeSyncDoc(mismatch, animatic, guionScenes);

	console.log('extract complete');
	console.log(
		`placements=${mismatch.placed} animaticOnly=${mismatch.unplacedAnimaticSubs} scriptOnly=${mismatch.uncoveredScriptLines}`
	);
}

main();
