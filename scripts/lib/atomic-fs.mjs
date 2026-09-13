/**
 * Same-directory atomic replace with EXDEV fallback (Windows cross-volume rename).
 * Partial files live next to the destination (`*.partial`); ignore them in git.
 */
import { copyFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';

/**
 * @param {string} destAbs
 * @param {(partialAbs: string) => void | Promise<void>} writePartial
 */
export async function atomicReplaceFromWriter(destAbs, writePartial) {
	const partialAbs = `${destAbs}.partial`;
	if (existsSync(partialAbs)) unlinkSync(partialAbs);
	try {
		await writePartial(partialAbs);
		try {
			renameSync(partialAbs, destAbs);
		} catch (err) {
			if (err && /** @type {NodeJS.ErrnoException} */ (err).code === 'EXDEV') {
				copyFileSync(partialAbs, destAbs);
				unlinkSync(partialAbs);
			} else {
				throw err;
			}
		}
	} catch (err) {
		try {
			if (existsSync(partialAbs)) unlinkSync(partialAbs);
		} catch {
			/* ignore cleanup */
		}
		throw err;
	}
}

/**
 * @param {string} fromAbs
 * @param {string} destAbs
 */
export async function atomicCopyFile(fromAbs, destAbs) {
	await atomicReplaceFromWriter(destAbs, (partialAbs) => {
		copyFileSync(fromAbs, partialAbs);
	});
}
