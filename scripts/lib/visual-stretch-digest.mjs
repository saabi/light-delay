/**
 * Node-only stretch digest (uses node:crypto). Do not import from browser modules.
 */
import { createHash } from 'node:crypto';
import { buildStretchDigestPayload } from './visual-stretch.mjs';

/**
 * @param {any} stretch
 * @param {{ shots?: any[], takes?: any[] }} script
 * @returns {string}
 */
export function computeStretchDigest(stretch, script) {
	const shotsById = new Map((script.shots || []).map((s) => [s.id, s]));
	const takesById = new Map((script.takes || []).map((t) => [t.id, t]));
	const payload = buildStretchDigestPayload({ stretch, shotsById, takesById });
	return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
