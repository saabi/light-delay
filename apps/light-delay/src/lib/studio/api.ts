import type { ConvertSettings, QwenRegenSettings, StudioDefaults, StudioTimeline } from './types';

export const IMITATION_API = '/v1/imitation';

export class StudioApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

type JsonObject = Record<string, unknown>;

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${IMITATION_API}${path}`, init);
	const payload = (await response.json().catch(() => ({}))) as JsonObject;
	if (!response.ok) {
		throw new StudioApiError(
			response.status,
			typeof payload.error === 'string' ? payload.error : 'local tool unavailable'
		);
	}
	return payload as T;
}

export async function fetchHealth(): Promise<JsonObject> {
	return requestJson('/health');
}

export async function fetchDefaults(): Promise<StudioDefaults> {
	return requestJson('/defaults');
}

export async function fetchOutputs(): Promise<{ outputs: StudioTimeline['output'][] }> {
	return requestJson('/outputs');
}

export async function fetchTimeline(outputId: string): Promise<StudioTimeline> {
	return requestJson(`/outputs/${encodeURIComponent(outputId)}/timeline`);
}

export function chunkAudioUrl(outputId: string, cueId: string, cacheKey: string): string {
	const params = new URLSearchParams({ v: cacheKey || 'original' });
	return `${IMITATION_API}/outputs/${encodeURIComponent(outputId)}/chunks/${encodeURIComponent(cueId)}?${params}`;
}

export function takeAudioUrl(outputId: string, takeId: string): string {
	return `${IMITATION_API}/outputs/${encodeURIComponent(outputId)}/takes/${encodeURIComponent(takeId)}/audio`;
}

export function assembledUrl(outputId: string): string {
	return `${IMITATION_API}/outputs/${encodeURIComponent(outputId)}/assembled`;
}

export async function prepareModel(): Promise<JsonObject> {
	return requestJson('/prepare', { method: 'POST' });
}

export async function prepareQwenModel(lang: 'es' | 'en'): Promise<JsonObject> {
	return requestJson('/prepare-qwen', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ lang })
	});
}

export async function convertCue(
	outputId: string,
	cueId: string,
	blob: Blob,
	filename: string,
	settings: ConvertSettings
): Promise<JsonObject> {
	const params = new URLSearchParams({
		filename,
		auto_f0_adjust: settings.autoF0Adjust ? 'true' : 'false',
		semi_tone_shift: String(settings.semiToneShift),
		diffusion_steps: String(settings.diffusionSteps),
		length_adjust: String(settings.lengthAdjust),
		inference_cfg_rate: String(settings.inferenceCfgRate)
	});
	const response = await fetch(
		`${IMITATION_API}/outputs/${encodeURIComponent(outputId)}/cues/${encodeURIComponent(cueId)}/convert?${params}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': blob.type || 'application/octet-stream',
				Filename: filename
			},
			body: blob
		}
	);
	const payload = (await response.json().catch(() => ({}))) as JsonObject;
	if (!response.ok) {
		throw new StudioApiError(
			response.status,
			typeof payload.error === 'string' ? payload.error : 'local tool unavailable'
		);
	}
	return payload;
}

export async function regenerateCue(
	outputId: string,
	cueId: string,
	settings: QwenRegenSettings
): Promise<JsonObject> {
	return requestJson(
		`/outputs/${encodeURIComponent(outputId)}/cues/${encodeURIComponent(cueId)}/regenerate`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				temperature: settings.temperature,
				top_p: settings.topP,
				top_k: settings.topK,
				max_new_tokens: settings.maxNewTokens,
				repetition_penalty: settings.repetitionPenalty,
				instruct: settings.instruct,
				expressiveness_prefix: settings.expressivenessPrefix,
				default_instruct: settings.defaultInstruct
			})
		}
	);
}

export async function acceptTake(
	outputId: string,
	cueId: string,
	takeId: string
): Promise<JsonObject> {
	return requestJson(`/outputs/${encodeURIComponent(outputId)}/cues/${encodeURIComponent(cueId)}/accept`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ takeId })
	});
}

export async function restoreCue(outputId: string, cueId: string): Promise<JsonObject> {
	return requestJson(`/outputs/${encodeURIComponent(outputId)}/cues/${encodeURIComponent(cueId)}/restore`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({})
	});
}

export async function assembleOutput(outputId: string): Promise<JsonObject> {
	return requestJson(`/outputs/${encodeURIComponent(outputId)}/assemble`, { method: 'POST' });
}

export async function purgeUnreferencedTakes(
	outputId: string,
	options?: { dryRun?: boolean }
): Promise<JsonObject> {
	return requestJson(`/outputs/${encodeURIComponent(outputId)}/purge-takes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ dryRun: Boolean(options?.dryRun) })
	});
}
