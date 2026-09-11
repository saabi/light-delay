# JSON Format Addendum: Multilingual Dialogue and Timed Coverage

This addendum extends `docs/JSON_FORMAT.md`. It is intentionally limited to language configuration, dialogue variants, voice models, subtitle selection, and language-dependent cue timing.

## 1. Design Requirements

- **English dialogue is the source of truth.** For every active dialogue cue, the `en` variant (the project `sourceLanguage`) is the authoritative spoken line. Spanish is a translation or adaptation, not a parallel original.
- Edit English dialogue first. After a material change to English `spokenText` or delivery, update Spanish later or mark it visibly stale with its last synchronized revision.
- On conflict between active language variants, English prevails. Deprecated cuts may retain Spanish as their historical per-cue source for provenance only.
- Preserve one dialogue cue identity across translations.
- Use [BCP 47](https://tools.ietf.org/html/bcp47) language tags such as `es`, `es-AR`, `en` or `fr-CA`.
- Distinguish spoken/dubbed text from subtitle text.
- Allow a language variant to reference its own audio and voice profile.
- Allow one visual edit to use different audio offsets/durations by language.
- Preserve a defined source language and deterministic fallback.
- Track translation status without duplicating acts, scenes, beats or shots.
- Keep dialogue language separate from application-interface language.

This matches the repository language policy in `AGENTS.md`: English first; translations must not drift silently.

## 1.1 Current Website and Document Scope

The SvelteKit interface uses Paraglide JS. Interface locale is encoded in the URL: English uses unprefixed routes and Spanish uses `/es/`. English remains the narrative and documentary source language regardless of the selected UI locale.

Structured prose documents use the same `LocalizedValue<T>` container for `title`, `summary`, and `content`. `content` is an ordered array of blocks; translated variants must preserve block count, type, and stable block ID so tables of contents, deep links, and editorial comparison remain deterministic.

```ts
export interface DocumentRecord {
  id: DocumentId;
  slug: string;
  sourceLanguage: LanguageTag;
  title: LocalizedValue<string>;
  summary?: LocalizedValue<string>;
  content: LocalizedValue<DocumentBlock[]>;
  translationStatus?: Record<LanguageTag, TranslationStatus>;
  provenance?: string[];
}
```

Entity galleries use the same co-located language maps as other story data. `data/translations/entities.en.json` is retired and empty; do not restore an overlay by id. IDs, asset links and canon relationships remain language-independent.

Story copy for the four registered scripts, optional outlines, assets, comparison taxonomy, narrative functions, entity variants, and project script labels uses **co-located** language maps on disk:

```ts
/** At least project sourceLanguage (en) required; other tags optional until translated. */
export type LocalizedString = { [tag: LanguageTag]: string | undefined };
// Example: "title": { "es": "…", "en": "…" }
```

Dialogue and text cues keep `LocalizedValue<DialogueVariant | TextVariant>` with per-language variants (`content.variants.es`, `content.variants.en`, …). Do not flatten `spokenText` into a bare language map because each variant carries status, audio, delivery, etc.

Presentation selectors (`localizeScript`, `localizeOutline`, …) resolve `LocalizedString` → flat string for the UI. Paraglide (`messages/*.json`) remains the application chrome only. `data/translations/public.en.json` is retired for story strings (empty map; do not reintroduce Spanish-keyed overlays).

`npm run validate:translations` checks inline coverage. English is always required. Spanish remains required for synchronized data, but an active outline may omit or retain older Spanish when its localization metadata explicitly says `needs_revision` or `not_started`.

At read time, language variants already live on disk; no audio or voice asset is inferred. Subtitles continue to derive from the selected dialogue variant. Unprefixed routes default story and subtitles to English, while `/es/` requests Spanish and must expose when that translation trails the English source.

## 2. Language Definitions

Add these types:

```ts
export type LanguageTag = string;

export interface LanguageDefinition {
  tag: LanguageTag;
  label: string;
  nativeLabel?: string;
  direction?: "ltr" | "rtl";
}

export interface ProjectLanguages {
  sourceLanguage: LanguageTag;
  defaultDialogueLanguage: LanguageTag;
  defaultSubtitleLanguage?: LanguageTag;
  fallbackLanguage: LanguageTag;
  supported: LanguageDefinition[];
}
```

Extend the project record:

```ts
export interface ProjectFile {
  schemaVersion: string;
  project: {
    id: ProjectId;
    title: string;
    alternateTitles?: string[];
    description?: string;

    languages: ProjectLanguages;

    canonicalScriptId: string;
    targetDurationMs?: number;
    createdAt?: string;
    updatedAt?: string;
  };
}
```

**Initial Light Delay configuration:**

```json
{
  "languages": {
    "sourceLanguage": "en",
    "defaultDialogueLanguage": "es",
    "defaultSubtitleLanguage": "es",
    "fallbackLanguage": "es",
    "supported": [
      { "tag": "es", "label": "Spanish", "nativeLabel": "Español" },
      { "tag": "en", "label": "English", "nativeLabel": "English" }
    ]
  }
}
```

`sourceLanguage` is `en` for active Light Delay material. This is an authorship decision, not a translation shortcut.

Use `es-AR` instead of `es` only if the project intends to maintain distinct regional Spanish translations. Do not introduce both until their editorial difference is real; neither supersedes the English source.

## 3. Localized Value Container

Add a generic JSON-friendly container:

```ts
export interface LocalizedValue<T> {
  sourceLanguage: LanguageTag;
  variants: Record<LanguageTag, T>;
}
```

**Fallback resolution order:**

1. Requested language
2. Requested base language (e.g., `es` for `es-AR`)
3. `sourceLanguage`
4. `project.fallbackLanguage`
5. Unresolved/error state

Do **not** silently fall back without exposing the effective language to the UI.

## 4. Dialogue Variants

Replace the previous `DialogueCue.text`, `audioAssetId`, `voiceProfileId` and language-specific delivery fields with:

```ts
export type TranslationStatus =
  | "source"
  | "draft"
  | "reviewed"
  | "approved"
  | "needs_revision";

export interface DialogueVariant {
  /** Text intended to be spoken or synthesized. */
  spokenText: string;

  /** Defaults to spokenText when omitted. */
  subtitleText?: string;

  status: TranslationStatus;

  translatorNote?: string;
  pronunciationNote?: string;

  /** Language-specific performance override. */
  delivery?: string;

  voiceProfileId?: VoiceProfileId;
  audioAssetId?: AssetId;

  estimatedDurationMs?: number;
}

export interface DialogueCue extends CueBase {
  type: "dialogue";

  speakerId: CharacterId;
  addresseeIds?: CharacterId[];

  presentation:
    | "on_screen"
    | "off_screen"
    | "voice_over"
    | "radio"
    | "intercom"
    | "recording"
    | "synthetic"
    | "telepathic";

  /** Language-independent acting intention. */
  performance?: {
    emotion?: string;
    intention?: string;
    pace?: "slow" | "measured" | "normal" | "fast";
  };

  content: LocalizedValue<DialogueVariant>;
}
```

For active material, `content.sourceLanguage` must equal the project English source language and that variant uses `status: "source"`. Deprecated cues may preserve a historical Spanish `sourceLanguage`; this is provenance, not permission to derive new canon from them.

**Example:**

```json
{
  "id": "cue-12-004",
  "beatId": "beat-12-02",
  "order": 4,
  "type": "dialogue",
  "speakerId": "character:zao",
  "presentation": "recording",
  "performance": {
    "emotion": "controlled urgency",
    "intention": "warn the bridge before the channel opens",
    "pace": "fast"
  },
  "content": {
    "sourceLanguage": "es",
    "variants": {
      "es": {
        "spokenText": "No apaguen la mediación. Aqueronte ya está adentro.",
        "status": "source",
        "audioAssetId": "audio-zao-message-es",
        "estimatedDurationMs": 6500
      },
      "en": {
        "spokenText": "Do not shut down mediation. Acheron is already inside.",
        "subtitleText": "Don't shut it down. Acheron is already inside.",
        "status": "draft",
        "audioAssetId": "audio-zao-message-en",
        "estimatedDurationMs": 6100
      }
    }
  }
}
```

## 5. Text Shown On Screen

On-screen titles, captions, location cards, and interface text may also need localization. Replace `TextCue.text` with the same container:

```ts
export interface TextVariant {
  text: string;
  status: TranslationStatus;
}

export interface TextCue extends CueBase {
  type: "text";
  presentation:
    | "title"
    | "subtitle"
    | "caption"
    | "interface"
    | "location_card"
    | "time_card"
    | "credits";

  content: LocalizedValue<TextVariant>;
}
```

*This does not require all descriptive prose or metadata to become multilingual immediately.*

## 6. Voice Profiles

Replace the single-provider fields in `VoiceProfile` with language-capable variants:

```ts
export interface VoiceProfileVariant {
  language: LanguageTag;

  provider?: string;
  model?: string;
  providerVoiceId?: string;

  sampleAssetIds?: AssetId[];
  pronunciationDictionaryAssetId?: AssetId;

  settings?: Record<string, string | number | boolean>;
}

export interface VoiceProfile {
  id: VoiceProfileId;
  characterId?: CharacterId;

  name: string;
  description?: LocalizedString;

  variants: VoiceProfileVariant[];
}
```

A character may keep a default voice profile:

```ts
export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  description: string;

  referenceAssetIds: AssetId[];
  defaultVoiceProfileId?: VoiceProfileId;

  // Remaining fields from the base specification are unchanged.
}
```

A dialogue variant can override the character default when a language needs a different model or actor.

## 7. Language-Dependent Cue Timing

Different translations rarely have identical duration. Extend `CuePlacement`:

```ts
export interface CuePlacementTiming {
  /** Position within the shot. */
  atMs?: number;

  /** Offset within the language-specific audio asset. */
  sourceOffsetMs?: number;

  durationMs?: number;
  gainDb?: number;
}

export interface CuePlacement {
  cueId: CueId;

  /** Source-language/default placement. */
  atMs: number;
  sourceOffsetMs?: number;
  durationMs?: number;
  gainDb?: number;

  presentationOverride?:
    | "on_screen"
    | "off_screen"
    | "voice_over"
    | "radio"
    | "recording";

  /** Only languages that differ from the default need entries. */
  timingByLanguage?: Record<LanguageTag, CuePlacementTiming>;
}
```

**Example of one line continuing across reaction shots:**

```json
{
  "cueId": "cue-12-004",
  "atMs": 0,
  "sourceOffsetMs": 2600,
  "durationMs": 2100,
  "timingByLanguage": {
    "en": {
      "sourceOffsetMs": 2400,
      "durationMs": 1900
    }
  },
  "presentationOverride": "recording"
}
```

*Shot duration remains part of the picture edit. Validation must report when a language-specific placement exceeds the shot boundary. It must not silently stretch the shot.*

If a translated cut eventually needs different picture timing, model that later as an explicit edit/cut variant rather than embedding several complete shot durations in every dialogue cue.

## 8. Player Language State

The application should keep these selections separate:

```ts
export interface LanguagePreferences {
  interfaceLanguage: LanguageTag;
  dialogueLanguage: LanguageTag;
  subtitleLanguage: LanguageTag | null;
}
```

**Examples:**

- Spanish dialogue, no subtitles.
- Spanish dialogue, English subtitles.
- English dialogue, Spanish subtitles.
- Source dialogue with fallback subtitles for untranslated lines.

## 9. Resolution Result

Selectors should return both the value and how it was resolved:

```ts
export interface LocalizedResolution<T> {
  requestedLanguage: LanguageTag;
  resolvedLanguage: LanguageTag;
  value: T;
  usedFallback: boolean;
}

export function resolveLocalized<T>(
  content: LocalizedValue<T>,
  requestedLanguage: LanguageTag,
  projectFallback: LanguageTag
): LocalizedResolution<T> | undefined;
```

*This lets the editor display untranslated/fallback content without breaking playback.*

## 10. Validation Additions

Add checks for:

- Project `sourceLanguage` is English (`en`);
- Source language exists in variants;
- All variant keys use supported language tags;
- `source` status appears only on the source-language (English) variant for active material;
- Non-source variants do not claim `status: "source"`;
- Referenced voice profiles support the requested language;
- Referenced audio assets exist and are audio files;
- Language timing does not exceed shot duration;
- Approved dialogue variants are non-empty;
- Subtitle fallback is visible to editors;
- A missing dub does not prevent source-language playback.

## 11. Migration of Existing Dialogue

Convert a legacy Spanish source string:

```json
"text": "Tenemos una ventana."
```

to:

```json
"content": {
  "sourceLanguage": "es",
  "variants": {
    "es": {
      "spokenText": "Tenemos una ventana.",
      "status": "source"
    }
  }
}
```

For archived extraction, preserve the original Spanish as `status: "source"` so provenance is not rewritten. For new active material, author English first and translate into Spanish later.

When revising active multilingual material, change English first, then bring Spanish up to date or mark it `needs_revision` until translated.
