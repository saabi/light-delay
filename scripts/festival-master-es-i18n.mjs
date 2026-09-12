/**
 * Export / apply Spanish fills for script:light-delay-festival-master.
 * Does not touch take generation.prompt (English-only).
 *
 * Usage:
 *   node scripts/festival-master-es-i18n.mjs export
 *   node scripts/festival-master-es-i18n.mjs apply tmp/festival-master-es-translations.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const UNITS_PATH = join(ROOT, 'tmp/festival-master-es-units.json');

function loadScript() {
	return JSON.parse(readFileSync(SCRIPT_PATH, 'utf8'));
}

function add(units, id, kind, en, meta = {}) {
	if (typeof en !== 'string' || !en.trim()) return;
	units.push({ id, kind, en, ...meta });
}

function exportUnits() {
	const f = loadScript();
	const units = [];
	add(units, 'script.title', 'meta', f.script?.title?.en);
	for (const [i, a] of (f.acts || []).entries()) {
		add(units, `acts[${i}].title`, 'act', a.title?.en, { actId: a.id });
		add(units, `acts[${i}].purpose`, 'act', a.purpose?.en, { actId: a.id });
	}
	for (const [i, s] of (f.sequences || []).entries()) {
		add(units, `sequences[${i}].title`, 'sequence', s.title?.en, { seqId: s.id });
		add(units, `sequences[${i}].summary`, 'sequence', s.summary?.en, { seqId: s.id });
	}
	for (const [i, s] of (f.scenes || []).entries()) {
		add(units, `scenes[${i}].title`, 'scene', s.title?.en, { sceneId: s.id });
		add(units, `scenes[${i}].summary`, 'scene', s.summary?.en, { sceneId: s.id });
		add(units, `scenes[${i}].dramaticPurpose`, 'scene', s.dramaticPurpose?.en, { sceneId: s.id });
		add(units, `scenes[${i}].setting.storyTime`, 'scene', s.setting?.storyTime?.en, {
			sceneId: s.id
		});
		add(units, `scenes[${i}].setting.continuity`, 'scene', s.setting?.continuity?.en, {
			sceneId: s.id
		});
	}
	for (const [i, b] of (f.beats || []).entries()) {
		add(units, `beats[${i}].title`, 'beat', b.title?.en, { beatId: b.id });
		add(units, `beats[${i}].purpose`, 'beat', b.purpose?.en, { beatId: b.id });
		add(units, `beats[${i}].summary`, 'beat', b.summary?.en, { beatId: b.id });
	}
	for (const [i, c] of (f.cues || []).entries()) {
		if (c.type === 'dialogue') {
			add(units, `cues[${i}].spoken`, 'dialogue', c.content?.variants?.en?.spokenText, {
				cueId: c.id,
				speakerId: c.speakerId,
				delivery: c.content?.variants?.en?.delivery,
				emotion: c.performance?.emotion?.en,
				intention: c.performance?.intention?.en
			});
			add(units, `cues[${i}].emotion`, 'performance', c.performance?.emotion?.en, {
				cueId: c.id
			});
			add(units, `cues[${i}].intention`, 'performance', c.performance?.intention?.en, {
				cueId: c.id
			});
		} else if (c.type === 'action') {
			add(units, `cues[${i}].text`, 'action', c.text?.en, { cueId: c.id });
		} else if (c.type === 'text') {
			const text = c.content?.variants?.en?.text ?? c.text?.en;
			add(units, `cues[${i}].text`, 'text', text, { cueId: c.id });
		} else {
			add(units, `cues[${i}].description`, 'cue-other', c.description?.en, { cueId: c.id });
			add(units, `cues[${i}].purpose`, 'cue-other', c.purpose?.en, { cueId: c.id });
			add(units, `cues[${i}].text`, 'cue-other', c.text?.en, { cueId: c.id });
		}
	}
	for (const [i, s] of (f.shots || []).entries()) {
		add(units, `shots[${i}].description`, 'shot', s.description?.en, { shotId: s.id });
		add(units, `shots[${i}].camera.movementDescription`, 'shot', s.camera?.movementDescription?.en, {
			shotId: s.id
		});
	}
	mkdirSync(join(ROOT, 'tmp'), { recursive: true });
	writeFileSync(UNITS_PATH, JSON.stringify({ count: units.length, units }, null, 2) + '\n');
	const byKind = {};
	for (const u of units) byKind[u.kind] = (byKind[u.kind] || 0) + 1;
	console.log('Wrote', UNITS_PATH, byKind, 'total', units.length);
}

function setLocalized(obj, key, es) {
	if (!obj || typeof obj !== 'object') return false;
	const cur = obj[key];
	if (!cur || typeof cur !== 'object' || typeof cur.en !== 'string') return false;
	obj[key] = { ...cur, es };
	return true;
}

function applyPath(script, id, es) {
	const shotCam = id.match(/^shots\[(\d+)\]\.camera\.movementDescription$/);
	if (shotCam) {
		const shot = script.shots[Number(shotCam[1])];
		return setLocalized(shot.camera, 'movementDescription', es);
	}
	const m = id.match(/^([a-zA-Z]+)\[(\d+)\]\.(.+)$/);
	if (id === 'script.title') return setLocalized(script.script, 'title', es);
	if (!m) throw new Error(`Unknown id ${id}`);
	const [, coll, idxStr, rest] = m;
	const idx = Number(idxStr);
	const item = script[coll][idx];
	if (!item) throw new Error(`Missing ${coll}[${idx}]`);

	if (rest === 'spoken') {
		const variants = item.content?.variants;
		if (!variants?.en) throw new Error(`No EN variant for ${id}`);
		const en = variants.en;
		variants.es = {
			spokenText: es,
			status: 'needs_revision',
			...(en.delivery ? { delivery: en.delivery } : {}),
			...(typeof en.estimatedDurationMs === 'number'
				? { estimatedDurationMs: en.estimatedDurationMs }
				: {})
		};
		return true;
	}
	if (rest === 'emotion') return setLocalized(item.performance, 'emotion', es);
	if (rest === 'intention') return setLocalized(item.performance, 'intention', es);
	if (rest === 'text' && item.type === 'text') {
		const variants = item.content?.variants;
		if (variants?.en) {
			variants.es = {
				text: es,
				status: 'needs_revision'
			};
			return true;
		}
	}
	if (rest.includes('.')) {
		const [a, b] = rest.split('.');
		return setLocalized(item[a], b, es);
	}
	return setLocalized(item, rest, es);
}

function applyTranslations(path) {
	const script = loadScript();
	const payload = JSON.parse(readFileSync(path, 'utf8'));
	const rows = Array.isArray(payload) ? payload : payload.translations || payload.units || [];
	let ok = 0;
	for (const row of rows) {
		const id = row.id;
		const es = row.es;
		if (!id || typeof es !== 'string' || !es.trim()) {
			throw new Error(`Bad translation row: ${JSON.stringify(row).slice(0, 200)}`);
		}
		if (!applyPath(script, id, es.trim())) {
			throw new Error(`Failed to apply ${id}`);
		}
		ok += 1;
	}
	script.script.localization = {
		sourceLanguage: 'en',
		translations: {
			es: {
				status: 'needs_revision',
				lastSyncedAt: new Date().toISOString().slice(0, 10),
				notes: {
					en: 'Spanish ScriptFile/storyboard fill from English source; dialogue marked needs_revision pending editorial pass.',
					es: 'Relleno ES del ScriptFile/storyboard desde la fuente inglesa; diálogo marcado needs_revision pendiente de pase editorial.'
				}
			}
		}
	};
	writeFileSync(SCRIPT_PATH, JSON.stringify(script, null, 2) + '\n', 'utf8');
	console.log(`Applied ${ok} translations → ${SCRIPT_PATH}`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'export') exportUnits();
else if (cmd === 'apply' && arg) applyTranslations(arg);
else {
	console.error('Usage: export | apply <translations.json>');
	process.exit(1);
}
