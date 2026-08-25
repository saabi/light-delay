import type {
	ActId,
	AssetId,
	BeatId,
	CharacterId,
	CueId,
	FactionId,
	LocationId,
	ObjectId,
	ProjectId,
	SceneId,
	SequenceId,
	ShotId,
	TakeId,
	VehicleId,
	VoiceProfileId
} from './ids.ts';
import type { EntityRef, Note } from './common.ts';
import type { LanguageTag, LocalizedValue, TranslationStatus } from './i18n.ts';

export interface ScriptFile {
	schemaVersion: string;
	script: {
		id: string;
		projectId: ProjectId;
		title: string;
		version: string;
		status: 'draft' | 'review' | 'locked' | 'deprecated';
		actIds: ActId[];
	};
	acts: Act[];
	sequences: Sequence[];
	scenes: Scene[];
	beats: Beat[];
	cues: Cue[];
	shots: Shot[];
	takes: Take[];
}

export interface Act {
	id: ActId;
	number: number;
	title?: string;
	dramaticPurpose?: string;
	sequenceIds?: SequenceId[];
	sceneIds: SceneId[];
}

export interface Sequence {
	id: SequenceId;
	actId: ActId;
	order: number;
	title: string;
	summary?: string;
	sceneIds: SceneId[];
}

export interface Scene {
	id: SceneId;
	actId: ActId;
	sequenceId?: SequenceId;
	number: number;
	order: number;
	title: string;
	locationId: LocationId;
	secondaryLocationIds?: LocationId[];
	setting: {
		interiorExterior?: 'INT' | 'EXT' | 'INT_EXT';
		timeOfDay?: string;
		storyTime?: string;
		continuity?: string;
	};
	summary: string;
	dramaticPurpose?: string;
	characterIds: CharacterId[];
	objectIds?: ObjectId[];
	vehicleIds?: VehicleId[];
	factionIds?: FactionId[];
	beatIds: BeatId[];
	shotIds: ShotId[];
	targetDurationMs?: number;
	notes?: Note[];
}

export interface Beat {
	id: BeatId;
	sceneId: SceneId;
	order: number;
	title?: string;
	purpose: string;
	summary: string;
	participantRefs?: EntityRef[];
	cueIds: CueId[];
	targetDurationMs?: number;
	tension?: number;
	notes?: Note[];
}

export type Cue =
	ActionCue | DialogueCue | SoundCue | MusicCue | SilenceCue | TransitionCue | TextCue;

export interface CueBase {
	id: CueId;
	beatId: BeatId;
	order: number;
	notes?: Note[];
}

export interface ActionCue extends CueBase {
	type: 'action';
	text: string;
	participantRefs?: EntityRef[];
	objectRefs?: EntityRef[];
}

export interface DialogueVariant {
	spokenText: string;
	subtitleText?: string;
	status: TranslationStatus;
	translatorNote?: string;
	pronunciationNote?: string;
	delivery?: string;
	voiceProfileId?: VoiceProfileId;
	audioAssetId?: AssetId;
	estimatedDurationMs?: number;
}

export interface DialogueCue extends CueBase {
	type: 'dialogue';
	speakerId: CharacterId;
	addresseeIds?: CharacterId[];
	presentation:
		| 'on_screen'
		| 'off_screen'
		| 'voice_over'
		| 'radio'
		| 'intercom'
		| 'recording'
		| 'synthetic'
		| 'telepathic';
	performance?: {
		emotion?: string;
		intention?: string;
		pace?: 'slow' | 'measured' | 'normal' | 'fast';
	};
	content: LocalizedValue<DialogueVariant>;
}

export interface SoundCue extends CueBase {
	type: 'sound';
	description: string;
	soundId?: string;
	sourceRef?: EntityRef;
	audioAssetId?: AssetId;
	mode?: 'diegetic' | 'non_diegetic';
	loop?: boolean;
	gainDb?: number;
}

export interface MusicCue extends CueBase {
	type: 'music';
	description: string;
	trackAssetId?: AssetId;
	operation: 'start' | 'continue' | 'change' | 'duck' | 'swell' | 'fade_out' | 'stop';
	gainDb?: number;
}

export interface SilenceCue extends CueBase {
	type: 'silence';
	purpose?: string;
	estimatedDurationMs?: number;
}

export interface TransitionCue extends CueBase {
	type: 'transition';
	transition: 'cut' | 'match_cut' | 'crossfade' | 'fade_in' | 'fade_out' | 'cut_to_black';
	description?: string;
}

export interface TextVariant {
	text: string;
	status: TranslationStatus;
}

export interface TextCue extends CueBase {
	type: 'text';
	presentation: 'title' | 'subtitle' | 'caption' | 'interface' | 'location_card' | 'time_card';
	content: LocalizedValue<TextVariant>;
}

export interface Shot {
	id: ShotId;
	sceneId: SceneId;
	beatIds: BeatId[];
	number: number;
	order: number;
	purpose?: string;
	description: string;
	locationId?: LocationId;
	visibleRefs?: EntityRef[];
	offScreenCharacterIds?: CharacterId[];
	composition: ShotComposition;
	camera?: CameraDirection;
	durationMs: number;
	cuePlacements: CuePlacement[];
	takeIds: TakeId[];
	selectedTakeId?: TakeId;
	transitionIn?: ShotTransition;
	transitionOut?: ShotTransition;
	notes?: Note[];
}

export interface ShotComposition {
	size:
		| 'ECU'
		| 'CU'
		| 'MCU'
		| 'MS'
		| 'MLS'
		| 'LS'
		| 'ELS'
		| 'OTS'
		| 'POV'
		| 'INSERT'
		| 'AERIAL'
		| 'OTHER';
	angle?: string;
	framing?: string;
	focus?: string;
	foreground?: string;
	background?: string;
	aspectRatio?: string;
}

export interface CameraDirection {
	lensMm?: number;
	movement?:
		| 'locked'
		| 'pan'
		| 'tilt'
		| 'dolly'
		| 'tracking'
		| 'crane'
		| 'handheld'
		| 'zoom'
		| 'orbit'
		| 'other';
	movementDescription?: string;
	startFrame?: string;
	endFrame?: string;
}

export interface CuePlacementTiming {
	atMs?: number;
	sourceOffsetMs?: number;
	durationMs?: number;
	gainDb?: number;
}

export interface CuePlacement {
	cueId: CueId;
	atMs: number;
	sourceOffsetMs?: number;
	durationMs?: number;
	gainDb?: number;
	presentationOverride?: 'on_screen' | 'off_screen' | 'voice_over' | 'radio' | 'recording';
	timingByLanguage?: Record<LanguageTag, CuePlacementTiming>;
}

export interface ShotTransition {
	type: 'cut' | 'match_cut' | 'crossfade' | 'fade' | 'wipe' | 'cut_to_black';
	durationMs?: number;
	description?: string;
}

export interface Take {
	id: TakeId;
	shotId: ShotId;
	number: number;
	status: 'candidate' | 'selected' | 'rejected' | 'needs_revision' | 'archived';
	imageAssetId?: AssetId;
	videoAssetId?: AssetId;
	generation?: {
		provider?: string;
		model?: string;
		prompt?: string;
		negativePrompt?: string;
		seed?: string | number;
		referenceAssetIds?: AssetId[];
		generatedAt?: string;
	};
	review?: {
		continuityScore?: number;
		compositionScore?: number;
		characterConsistencyScore?: number;
		notes?: string;
	};
}
