/**
 * Node-only stretch digest (uses node:crypto). Do not import from browser modules.
 */
import { createHash } from 'node:crypto';
import { buildStretchDigestPayload } from './visual-stretch.mjs';

/**
 * @param {any} stretch
 * @param {{ shots?: any[] }} script
 * @returns {string}
 */
export function computeStretchDigest(stretch, script) {
	const shotsById = new Map((script.shots || []).map(/** @param {any} s */ (s) => [s.id, s]));
	const payload = buildStretchDigestPayload({ stretch, shotsById });
	return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
