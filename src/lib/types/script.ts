import type {
	ActId,
	AssetId,
	BeatId,
	CharacterId,
	ContinuityId,
	CueId,
	EntityVariantId,
	FactionId,
	LocationId,
	NarrativeFunctionId,
	ObjectId,
	ProjectId,
	SceneId,
	ScriptId,
	ScriptKind,
	SequenceId,
	ShotId,
	TakeId,
	VehicleId,
	VoiceProfileId
} from './ids.ts';
import type { EntityRef, Note } from './common.ts';
import type { LanguageTag, LocalizedValue, StoryText, TranslationStatus } from './i18n.ts';
import type { ScriptLineage } from './project.ts';
import type { ComparisonProfile } from './comparison.ts';
import type { ImageEditorialStatus } from './assets.ts';

export interface ScriptSourceReference {
	kind?: 'script';
	scriptId: ScriptId;
	sceneId?: SceneId;
	beatId?: BeatId;
	cueId?: CueId;
	shotId?: ShotId;
}

export interface DocumentSourceReference {
	kind: 'document';
	documentId: string;
	anchor?: string;
}

export type SourceReference = ScriptSourceReference | DocumentSourceReference;

export interface SourceTraceable {
	sourceRefs?: SourceReference[];
}

export interface NarrativeFunction {
	id: NarrativeFunctionId;
	label: StoryText;
	description?: StoryText;
}

export interface NarrativeFunctionsFile {
	schemaVersion: string;
	functions: NarrativeFunction[];
}

export interface CharacterFunctionAssignment {
	functionId: NarrativeFunctionId;
	characterId: CharacterId;
	sourceCharacterIds?: CharacterId[];
	relationship: 'unchanged' | 'merged' | 'reassigned' | 'split' | 'new';
	notes?: StoryText;
}

export interface EntityVariant {
	id: EntityVariantId;
	entity: EntityRef;
	continuityId?: ContinuityId;
	scriptIds?: ScriptId[];
	label: StoryText;
	roleOverride?: StoryText;
	traitsOverride?: StoryText[];
	biographyOverride?: StoryText;
	descriptionOverride?: StoryText;
	appearanceOverride?: StoryText;
	costumeOverride?: StoryText;
	referenceAssetIds: AssetId[];
	notes?: Note[];
}

export interface EntityVariantsFile {
	schemaVersion: string;
	variants: EntityVariant[];
}

export interface ScriptEntityVariantSelections {
	character?: Record<CharacterId, EntityVariantId>;
	location?: Record<LocationId, EntityVariantId>;
	object?: Record<ObjectId, EntityVariantId>;
	vehicle?: Record<VehicleId, EntityVariantId>;
	faction?: Record<FactionId, EntityVariantId>;
}

export interface ScriptFile {
	schemaVersion: string;
	script: {
		id: ScriptId;
		projectId: ProjectId;
		continuityId: ContinuityId;
		title: StoryText;
		version: string;
		status: 'draft' | 'review' | 'locked' | 'deprecated';
		kind: ScriptKind;
		targetDurationMs?: number;
		lineage?: ScriptLineage;
		declaredEntityRefs?: EntityRef[];
		entityVariantSelections?: ScriptEntityVariantSelections;
		characterFunctionAssignments?: CharacterFunctionAssignment[];
		comparisonProfile?: ComparisonProfile;
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
	title?: StoryText;
	dramaticPurpose?: StoryText;
	sequenceIds?: SequenceId[];
	sceneIds: SceneId[];
}

export interface Sequence {
	id: SequenceId;
	actId: ActId;
	order: number;
	title: StoryText;
	summary?: StoryText;
	sceneIds: SceneId[];
}

export interface Scene extends SourceTraceable {
	id: SceneId;
	actId: ActId;
	sequenceId?: SequenceId;
	number: number;
	order: number;
	title: StoryText;
	locationId: LocationId;
	secondaryLocationIds?: LocationId[];
	setting: {
		interiorExterior?: 'INT' | 'EXT' | 'INT_EXT';
		timeOfDay?: StoryText;
		storyTime?: StoryText;
		continuity?: StoryText;
	};
	summary: StoryText;
	dramaticPurpose?: StoryText;
	characterIds: CharacterId[];
	objectIds?: ObjectId[];
	vehicleIds?: VehicleId[];
	factionIds?: FactionId[];
	beatIds: BeatId[];
	shotIds: ShotId[];
	targetDurationMs?: number;
	notes?: Note[];
}

export interface Beat extends SourceTraceable {
	id: BeatId;
	sceneId: SceneId;
	order: number;
	title?: StoryText;
	purpose: StoryText;
	summary: StoryText;
	participantRefs?: EntityRef[];
	cueIds: CueId[];
	targetDurationMs?: number;
	tension?: number;
	notes?: Note[];
}

export type Cue =
	ActionCue | DialogueCue | SoundCue | MusicCue | SilenceCue | TransitionCue | TextCue;

export interface CueBase extends SourceTraceable {
	id: CueId;
	beatId: BeatId;
	order: number;
	notes?: Note[];
}

export interface ActionCue extends CueBase {
	type: 'action';
	text: StoryText;
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
		emotion?: StoryText;
		intention?: StoryText;
		pace?: 'slow' | 'measured' | 'normal' | 'fast';
	};
	content: LocalizedValue<DialogueVariant>;
}

export interface SoundCue extends CueBase {
	type: 'sound';
	description: StoryText;
	soundId?: string;
	sourceRef?: EntityRef;
	audioAssetId?: AssetId;
	mode?: 'diegetic' | 'non_diegetic';
	loop?: boolean;
	gainDb?: number;
}

export interface MusicCue extends CueBase {
	type: 'music';
	description: StoryText;
	trackAssetId?: AssetId;
	operation: 'start' | 'continue' | 'change' | 'duck' | 'swell' | 'fade_out' | 'stop';
	gainDb?: number;
}

export interface SilenceCue extends CueBase {
	type: 'silence';
	purpose?: StoryText;
	estimatedDurationMs?: number;
}

export interface TransitionCue extends CueBase {
	type: 'transition';
	transition: 'cut' | 'match_cut' | 'crossfade' | 'fade_in' | 'fade_out' | 'cut_to_black';
	description?: StoryText;
}

export interface TextVariant {
	text: string;
	status: TranslationStatus;
}

export interface TextCue extends CueBase {
	type: 'text';
	presentation: 'title' | 'subtitle' | 'caption' | 'interface' | 'location_card' | 'time_card' | 'credits';
	content: LocalizedValue<TextVariant>;
}

export interface Shot extends SourceTraceable {
	id: ShotId;
	sceneId: SceneId;
	beatIds: BeatId[];
	number: number;
	order: number;
	purpose?: StoryText;
	description: StoryText;
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
	angle?: StoryText;
	framing?: StoryText;
	focus?: StoryText;
	foreground?: StoryText;
	background?: StoryText;
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
	movementDescription?: StoryText;
	startFrame?: StoryText;
	endFrame?: StoryText;
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
	description?: StoryText;
}

export interface Take {
	id: TakeId;
	shotId: ShotId;
	number: number;
	status: 'candidate' | 'selected' | 'rejected' | 'needs_revision' | 'archived';
	imageAssetId?: AssetId;
	videoAssetId?: AssetId;
	imageStatus?: ImageEditorialStatus & {
		sourceShotId?: ShotId;
	};
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
		notes?: StoryText;
	};
}
