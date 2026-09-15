/**
 * Minimal Black Forest Labs (BFL) API client.
 * Auth: x-key header. Credits shared with dashboard.bfl.ai.
 * Docs: https://docs.bfl.ml/
 *
 * Pattern mirrors BFL’s official samples: parse JSON safely (HTML error pages
 * are not JSON), require polling_url, poll until status leaves Pending, then
 * accept Ready or stop on Error / Failed / Moderated.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_BASE = 'https://api.bfl.ai';

export function loadEnvFile(cwd = process.cwd()) {
	const path = resolve(cwd, '.env');
	if (!existsSync(path)) return;
	const text = readFileSync(path, 'utf8');
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq <= 0) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (process.env[key] === undefined) process.env[key] = value;
	}
}

export function requireBflApiKey() {
	loadEnvFile();
	const key = process.env.BFL_API_KEY?.trim();
	if (!key) {
		throw new Error(
			'Missing BFL_API_KEY. Create a key in dashboard.bfl.ai → API → Keys, then set it in the environment or a local .env file (gitignored).'
		);
	}
	return key;
}

/** Like BFL’s as_json helper: HTML 502/proxy pages must not become JSONDecodeError. */
export async function asJson(response) {
	const text = await response.text();
	try {
		return text ? JSON.parse(text) : {};
	} catch {
		throw new Error(`Stopped: ${response.status} ${text.slice(0, 200)}`);
	}
}

export function fileToBflImagePayload(filePath) {
	const abs = resolve(filePath);
	const buf = readFileSync(abs);
	const lower = abs.toLowerCase();
	const mime =
		lower.endsWith('.jpg') || lower.endsWith('.jpeg')
			? 'image/jpeg'
			: lower.endsWith('.webp')
				? 'image/webp'
				: 'image/png';
	return `data:${mime};base64,${buf.toString('base64')}`;
}

export async function bflGetCredits(apiKey, { baseUrl = DEFAULT_BASE } = {}) {
	const res = await fetch(`${baseUrl}/v1/credits`, {
		headers: { accept: 'application/json', 'x-key': apiKey }
	});
	const body = await asJson(res);
	if (!res.ok) throw new Error(`credits ${res.status}: ${JSON.stringify(body)}`);
	return body;
}

/**
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.model endpoint slug e.g. flux-2-pro | flux-2-pro-preview | flux-2-max
 * @param {string} opts.prompt
 * @param {string[]} [opts.inputImages] up to 8 data URLs / https URLs
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @param {number} [opts.safetyTolerance] 0=strict … 5=least strict
 * @param {boolean} [opts.disablePup]
 * @param {string} [opts.outputFormat] png | jpeg | webp
 * @param {number} [opts.seed]
 */
export async function bflSubmitFlux2({
	apiKey,
	model = 'flux-2-pro',
	prompt,
	inputImages = [],
	width,
	height,
	safetyTolerance = 5,
	disablePup = true,
	outputFormat = 'png',
	seed,
	baseUrl = DEFAULT_BASE
}) {
	if (!prompt?.trim()) throw new Error('prompt is required');
	if (inputImages.length > 8) throw new Error('FLUX.2 API supports at most 8 input images');

	const payload = {
		prompt,
		disable_pup: disablePup,
		safety_tolerance: safetyTolerance,
		output_format: outputFormat
	};
	if (width) payload.width = width;
	if (height) payload.height = height;
	if (seed != null) payload.seed = seed;

	inputImages.forEach((img, i) => {
		const key = i === 0 ? 'input_image' : `input_image_${i + 1}`;
		payload[key] = img;
	});

	const res = await fetch(`${baseUrl}/v1/${model}`, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'x-key': apiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	const body = await asJson(res);
	if (!res.ok) throw new Error(`submit ${res.status}: ${JSON.stringify(body)}`);
	if (!body.polling_url) {
		throw new Error(`Submit failed: ${JSON.stringify(body)}`);
	}
	return body;
}

/**
 * Poll until status leaves Pending (BFL sample pattern).
 * Ready → return body; Error/Failed/Moderated → throw; other non-Pending → throw.
 */
export async function bflPollUntilReady(
	apiKey,
	pollingUrl,
	{ intervalMs = 2000, timeoutMs = 300_000, onStatus } = {}
) {
	const started = Date.now();
	while (true) {
		if (Date.now() - started > timeoutMs) {
			throw new Error(`poll timed out after ${timeoutMs}ms`);
		}
		const res = await fetch(pollingUrl, {
			headers: { accept: 'application/json', 'x-key': apiKey }
		});
		const body = await asJson(res);
		if (!res.ok) throw new Error(`poll ${res.status}: ${JSON.stringify(body)}`);

		const status = body.status;
		if (typeof onStatus === 'function') onStatus(status, body);

		if (status === 'Pending' || status === 'Processing' || status === 'Queued') {
			await new Promise((r) => setTimeout(r, intervalMs));
			continue;
		}
		if (status === 'Ready') return body;
		throw new Error(`Stopped: ${status} ${JSON.stringify(body)}`);
	}
}

export async function downloadToFile(url, destPath) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download ${res.status} ${url}`);
	const buf = Buffer.from(await res.arrayBuffer());
	mkdirSync(dirname(destPath), { recursive: true });
	writeFileSync(destPath, buf);
	return destPath;
}
