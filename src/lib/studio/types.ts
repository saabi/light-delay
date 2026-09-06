export type StudioModelState = 'unloaded' | 'loading' | 'ready' | 'error';

export type StudioMachineState =
	| 'offline'
	| 'loading'
	| 'ready'
	| 'playing'
	| 'recording'
	| 'converting'
	| 'assembling';

export type StudioReplacement = {
	status: 'accepted' | 'stale';
	takeId: string;
	acceptedAt?: string;
	stale: boolean;
} | null;

export type StudioTake = {
	takeId: string;
	createdAt?: string;
	durationSec?: number;
	stale: boolean;
	settings?: Record<string, unknown>;
	previewUrl: string;
};

export type StudioCue = {
	id: string;
	stableDialogueId?: string | null;
	speaker: string;
	engine?: string;
	text: string;
	instruct: string | null;
	recordable: boolean;
	preSilenceMs: number;
	originalSeconds: number;
	effectiveSeconds: number;
	replacement: StudioReplacement;
	takes: StudioTake[];
	cacheKey: string;
	cueFingerprint: Record<string, string>;
};

export type StudioOutput = {
	id: string;
	kind: string;
	lang: 'es' | 'en';
	label: { es: string; en: string };
	description: { es: string; en: string };
	sourceOutlineId: string;
	sourceOutlineRevision: number;
	currentOutlineRevision: number;
	sourceStatus: 'current' | 'stale';
	chunksKey: string;
	canonicalMp3Key: string;
	assembledKey: string;
	recordableSpeakers: string[];
	expectedSampleRate: number;
	expectedCueCount: number;
};

export type StudioTimeline = {
	ok: boolean;
	output: StudioOutput;
	indexFingerprint: string;
	cueCount: number;
	sampleRate: number;
	modelState: StudioModelState;
	modelError?: string | null;
	python?: string;
	cues: StudioCue[];
};

export type StudioDefaults = {
	ok: boolean;
	engine: string;
	actorNote: { es?: string; en?: string };
	seedVc: {
		f0_condition: boolean;
		auto_f0_adjust: boolean;
		semi_tone_shift: number;
		diffusion_steps: number;
		inference_cfg_rate: number;
		length_adjust: number;
	};
	bounds: {
		diffusion_steps?: { min: number; max: number };
		semi_tone_shift?: { min: number; max: number };
		length_adjust?: { min: number; max: number };
		inference_cfg_rate?: { min: number; max: number };
		maxUploadBytes: number;
		maxRecordingSeconds: number;
	};
	modelState: StudioModelState;
	modelError?: string | null;
	python?: string;
};

export type ConvertSettings = {
	autoF0Adjust: boolean;
	semiToneShift: number;
	diffusionSteps: number;
	lengthAdjust: number;
	inferenceCfgRate: number;
};
