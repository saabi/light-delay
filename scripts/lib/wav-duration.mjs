/**
 * Measure PCM WAV duration from a RIFF/WAVE file on disk.
 * @param {string | import('node:fs').PathLike} filePath
 * @returns {number} duration in milliseconds (rounded)
 */
import { readFileSync } from 'node:fs';

export function measureWavDurationMs(filePath) {
	const buf = readFileSync(filePath);
	if (buf.length < 44) throw new Error(`WAV too short: ${filePath}`);
	if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
		throw new Error(`Not a RIFF/WAVE file: ${filePath}`);
	}

	let offset = 12;
	let sampleRate = 0;
	let channels = 0;
	let bitsPerSample = 0;
	let dataBytes = 0;

	while (offset + 8 <= buf.length) {
		const id = buf.toString('ascii', offset, offset + 4);
		const size = buf.readUInt32LE(offset + 4);
		const dataStart = offset + 8;
		if (id === 'fmt ') {
			channels = buf.readUInt16LE(dataStart + 2);
			sampleRate = buf.readUInt32LE(dataStart + 4);
			bitsPerSample = buf.readUInt16LE(dataStart + 14);
		} else if (id === 'data') {
			dataBytes = size;
			break;
		}
		offset = dataStart + size + (size % 2);
	}

	if (!sampleRate || !channels || !bitsPerSample || !dataBytes) {
		throw new Error(`Incomplete WAV header: ${filePath}`);
	}
	const bytesPerSample = bitsPerSample / 8;
	const frames = dataBytes / (channels * bytesPerSample);
	return Math.round((frames / sampleRate) * 1000);
}
