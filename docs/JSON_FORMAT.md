# JSON FORMAT for describing the narrative in a structured, editable and parseable way

The cleanest structure is:

**Act → Scene → Beat → Shot → Take**

Important terminology: what the current animatic calls a “toma” is usually a **shot**—an editorial camera unit. A **take** is one generated/filmed attempt at producing that shot. This distinction lets one shot have several candidate images or videos without duplicating the script.

Dialogue and action should live in ordered **cues** inside beats. Shots then reference the cues they cover. This allows one line of dialogue to continue across several cuts: speaker, listener reaction, insert shot, return to speaker, etc.

## Proposed files

```text
data/
├── project.json
├── script.json
├── characters.json
├── locations.json
├── objects.json
├── vehicles.json
├── factions.json
├── assets.json
└── voice-profiles.json
```

## TypeScript definitions

```ts
// IDs remain plain strings in JSON but are distinguishable in TypeScript.

export type ProjectId = string;
export type ActId = string;
export type SequenceId = string;
export type SceneId = string;
export type BeatId = string;
export type CueId = string;
export type ShotId = string;
export type TakeId = string;

export type CharacterId = string;
export type LocationId = string;
export type ObjectId = string;
export type VehicleId = string;
export type FactionId = string;
export type AssetId = string;
export type VoiceProfileId = string;

export type EntityKind =
  | "character"
  | "location"
  | "object"
  | "vehicle"
  | "faction";

export interface EntityRef {
  kind: EntityKind;
  id: string;
  role?: string;
}
```

### Project metadata

```ts
export interface ProjectFile {
  schemaVersion: string;
  project: {
    id: ProjectId;
    title: string;
    alternateTitles?: string[];
    language: string;
    description?: string;

    canonicalScriptId: string;
    targetDurationMs?: number;

    createdAt?: string;
    updatedAt?: string;
  };
}
```

### Script structure

```ts
export interface ScriptFile {
  schemaVersion: string;

  script: {
    id: string;
    projectId: ProjectId;
    title: string;
    version: string;
    status: "draft" | "review" | "locked" | "deprecated";

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
```

### Acts, optional sequences and scenes

Sequences are optional. They are useful for grouping related scenes such as departure, crossing, investigation and contact, but they do not need to be introduced where they add no value.

```ts
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
    interiorExterior?: "INT" | "EXT" | "INT_EXT";
    timeOfDay?: string;
    storyTime?: string;       // "T+29H"
    continuity?: string;      // "CONTINUO", "MÁS TARDE"
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
```

### Beats

A beat represents a coherent dramatic change: a discovery, decision, reversal, exchange or action. It can contain several dialogue and action cues and be covered by several shots.

```ts
export interface Beat {
  id: BeatId;
  sceneId: SceneId;
  order: number;

  title?: string;
  purpose: string;
  summary: string;

  participantRefs?: EntityRef[];
  cueIds: CueId[];

  // Optional editorial guidance, not authoritative timing.
  targetDurationMs?: number;
  tension?: number; // Suggested range: 0–1

  notes?: Note[];
}
```

## Cues: action, dialogue, sound and music

```ts
export type Cue =
  | ActionCue
  | DialogueCue
  | SoundCue
  | MusicCue
  | SilenceCue
  | TransitionCue
  | TextCue;

export interface CueBase {
  id: CueId;
  beatId: BeatId;
  order: number;

  notes?: Note[];
}

export interface ActionCue extends CueBase {
  type: "action";
  text: string;

  participantRefs?: EntityRef[];
  objectRefs?: EntityRef[];
}

export interface DialogueCue extends CueBase {
  type: "dialogue";

  speakerId: CharacterId;
  addresseeIds?: CharacterId[];

  text: string;
  language?: string;

  presentation:
    | "on_screen"
    | "off_screen"
    | "voice_over"
    | "radio"
    | "intercom"
    | "recording"
    | "synthetic"
    | "telepathic";

  delivery?: string;
  emotion?: string;

  // Used for generated or recorded dialogue.
  voiceProfileId?: VoiceProfileId;
  audioAssetId?: AssetId;

  estimatedDurationMs?: number;
}

export interface SoundCue extends CueBase {
  type: "sound";

  description: string;
  soundId?: string;

  sourceRef?: EntityRef;
  audioAssetId?: AssetId;

  mode?: "diegetic" | "non_diegetic";
  loop?: boolean;
  gainDb?: number;
}

export interface MusicCue extends CueBase {
  type: "music";

  description: string;
  trackAssetId?: AssetId;

  operation:
    | "start"
    | "continue"
    | "change"
    | "duck"
    | "swell"
    | "fade_out"
    | "stop";

  gainDb?: number;
}

export interface SilenceCue extends CueBase {
  type: "silence";
  purpose?: string;
  estimatedDurationMs?: number;
}

export interface TransitionCue extends CueBase {
  type: "transition";

  transition:
    | "cut"
    | "match_cut"
    | "crossfade"
    | "fade_in"
    | "fade_out"
    | "cut_to_black";

  description?: string;
}

export interface TextCue extends CueBase {
  type: "text";

  text: string;
  presentation:
    | "title"
    | "subtitle"
    | "caption"
    | "interface"
    | "location_card"
    | "time_card";
}
```

## Shots

A shot describes what appears in the finished edit. Several shots may cover one beat or even the same dialogue cue.

```ts
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

  /*
   * Places portions of dialogue/action/sound/music cues on the shot timeline.
   * This permits a single dialogue cue to continue across several cuts.
   */
  cuePlacements: CuePlacement[];

  takeIds: TakeId[];
  selectedTakeId?: TakeId;

  transitionIn?: ShotTransition;
  transitionOut?: ShotTransition;

  notes?: Note[];
}

export interface ShotComposition {
  size:
    | "ECU"    // extreme close-up
    | "CU"
    | "MCU"
    | "MS"
    | "MLS"
    | "LS"
    | "ELS"
    | "OTS"
    | "POV"
    | "INSERT"
    | "AERIAL"
    | "OTHER";

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
    | "locked"
    | "pan"
    | "tilt"
    | "dolly"
    | "tracking"
    | "crane"
    | "handheld"
    | "zoom"
    | "orbit"
    | "other";

  movementDescription?: string;
  startFrame?: string;
  endFrame?: string;
}

export interface CuePlacement {
  cueId: CueId;

  // Position within this shot.
  atMs: number;
  durationMs?: number;

  /*
   * Offset within an audio asset or continuous cue.
   * Useful when dialogue begins in one shot and continues in another.
   */
  sourceOffsetMs?: number;

  // For reaction shots while another person speaks off-screen.
  presentationOverride?:
    | "on_screen"
    | "off_screen"
    | "voice_over"
    | "radio"
    | "recording";

  gainDb?: number;
}

export interface ShotTransition {
  type:
    | "cut"
    | "match_cut"
    | "crossfade"
    | "fade"
    | "wipe"
    | "cut_to_black";

  durationMs?: number;
  description?: string;
}
```

## Takes and generated images

Each existing animatic image becomes the selected take of its corresponding shot.

```ts
export interface Take {
  id: TakeId;
  shotId: ShotId;

  number: number;
  status:
    | "candidate"
    | "selected"
    | "rejected"
    | "needs_revision"
    | "archived";

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
```

## Characters and voices

```ts
export interface CharactersFile {
  schemaVersion: string;
  characters: Character[];
}

export interface Character {
  id: CharacterId;
  name: string;
  shortName?: string;

  role: string;
  description: string;

  traits?: string[];
  appearance?: string;
  costume?: string;

  factionIds?: FactionId[];

  referenceAssetIds: AssetId[];
  voiceProfileId?: VoiceProfileId;

  aliases?: string[];
  notes?: Note[];
}

export interface VoiceProfilesFile {
  schemaVersion: string;
  voiceProfiles: VoiceProfile[];
}

export interface VoiceProfile {
  id: VoiceProfileId;
  characterId?: CharacterId;

  name: string;
  language: string;
  description?: string;

  provider?: string;
  model?: string;
  providerVoiceId?: string;

  sampleAssetIds?: AssetId[];
  pronunciationDictionaryAssetId?: AssetId;

  settings?: Record<string, string | number | boolean>;
}
```

## Locations, objects, vehicles and factions

```ts
export interface LocationsFile {
  schemaVersion: string;
  locations: Location[];
}

export interface Location {
  id: LocationId;
  name: string;
  description: string;

  parentLocationId?: LocationId;

  referenceAssetIds: AssetId[];

  atmosphere?: string;
  lighting?: string;
  scale?: string;

  notes?: Note[];
}

export interface ObjectsFile {
  schemaVersion: string;
  objects: StoryObject[];
}

export interface StoryObject {
  id: ObjectId;
  name: string;
  description: string;
  dramaticFunction?: string;

  ownerCharacterId?: CharacterId;
  locationId?: LocationId;

  referenceAssetIds: AssetId[];
  notes?: Note[];
}

export interface VehiclesFile {
  schemaVersion: string;
  vehicles: Vehicle[];
}

export interface Vehicle {
  id: VehicleId;
  name: string;
  description: string;

  factionId?: FactionId;
  homeLocationId?: LocationId;

  referenceAssetIds: AssetId[];
  notes?: Note[];
}

export interface FactionsFile {
  schemaVersion: string;
  factions: Faction[];
}

export interface Faction {
  id: FactionId;
  name: string;
  description: string;

  memberCharacterIds?: CharacterId[];
  referenceAssetIds?: AssetId[];
}
```

## Assets

```ts
export interface AssetsFile {
  schemaVersion: string;
  assets: Asset[];
}

export interface Asset {
  id: AssetId;

  kind:
    | "image"
    | "video"
    | "audio"
    | "voice_model"
    | "three_d_model"
    | "document"
    | "subtitle"
    | "other";

  role:
    | "reference"
    | "animatic"
    | "production"
    | "voice_sample"
    | "music"
    | "sound_effect"
    | "source"
    | "other";

  path: string;
  mimeType?: string;

  title?: string;
  description?: string;

  width?: number;
  height?: number;
  durationMs?: number;

  source?: {
    provider?: string;
    model?: string;
    generatedAt?: string;
    originalAssetId?: AssetId;
    externalId?: string;
  };

  metadata?: Record<string, string | number | boolean | null>;
}
```

## Shared notes

```ts
export interface Note {
  type:
    | "story"
    | "continuity"
    | "performance"
    | "camera"
    | "sound"
    | "vfx"
    | "production"
    | "todo";

  text: string;
  resolved?: boolean;
}
```

## Example: dialogue across several cuts

The dialogue exists once:

```json
{
  "id": "cue-12-004",
  "beatId": "beat-12-02",
  "order": 4,
  "type": "dialogue",
  "speakerId": "character-zao",
  "text": "No apaguen la mediación. Aqueronte ya está adentro.",
  "presentation": "recording",
  "audioAssetId": "audio-zao-message"
}
```

Three shots can cover different portions of it:

```json
[
  {
    "id": "shot-12-03",
    "description": "Primer plano de Voss escuchando el mensaje.",
    "visibleRefs": [
      { "kind": "character", "id": "character-voss" }
    ],
    "offScreenCharacterIds": ["character-zao"],
    "cuePlacements": [
      {
        "cueId": "cue-12-004",
        "atMs": 0,
        "sourceOffsetMs": 0,
        "durationMs": 2600,
        "presentationOverride": "recording"
      }
    ]
  },
  {
    "id": "shot-12-04",
    "description": "Harlan intenta ocultar su reacción.",
    "visibleRefs": [
      { "kind": "character", "id": "character-harlan" }
    ],
    "offScreenCharacterIds": ["character-zao"],
    "cuePlacements": [
      {
        "cueId": "cue-12-004",
        "atMs": 0,
        "sourceOffsetMs": 2600,
        "durationMs": 2100,
        "presentationOverride": "recording"
      }
    ]
  },
  {
    "id": "shot-12-05",
    "description": "La forma de onda y la firma del transmisor.",
    "visibleRefs": [
      { "kind": "object", "id": "object-optical-transmitter" }
    ],
    "offScreenCharacterIds": ["character-zao"],
    "cuePlacements": [
      {
        "cueId": "cue-12-004",
        "atMs": 0,
        "sourceOffsetMs": 4700,
        "durationMs": 1800,
        "presentationOverride": "recording"
      }
    ]
  }
]
```

This structure provides enough flexibility without requiring a full nonlinear-editing data model. It also makes the current problems measurable:

* dialogue duration versus silence per scene;
* shots containing no narrative cue;
* dialogue lines that span several cuts;
* beats with insufficient explanation;
* shots that should be split;
* scenes with excessive duration but little dramatic development;
* alternate generated takes for the same intended shot.

I would keep **cues as the narrative source** and **shots as the editorial interpretation**. That separation is the key architectural decision.
