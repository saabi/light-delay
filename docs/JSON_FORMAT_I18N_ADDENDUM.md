# JSON Format Addendum: Multilingual Dialogue and Timed Coverage

This addendum extends `docs/JSON_FORMAT.md`. It is intentionally limited to language configuration, dialogue variants, voice models, subtitle selection, and language-dependent cue timing.

## 1. Design Requirements

- **Spanish dialogue is the source of truth.** For every dialogue cue, the `es` variant (or the project `sourceLanguage`, which must be Spanish for Light Delay) is the authoritative spoken line. Other language variants are translations or adaptations of that Spanish text, not parallel originals.
- Edit Spanish dialogue first. After a material change to Spanish `spokenText` (or source-language delivery that affects meaning), update or mark stale every other language variant for that cue in the same editorial pass.
- On conflict between languages, the Spanish dialogue variant prevails.
- Preserve one dialogue cue identity across translations.
- Use [BCP 47](https://tools.ietf.org/html/bcp47) language tags such as `es`, `es-AR`, `en` or `fr-CA`.
- Distinguish spoken/dubbed text from subtitle text.
- Allow a language variant to reference its own audio and voice profile.
- Allow one visual edit to use different audio offsets/durations by language.
- Preserve a defined source language and deterministic fallback.
- Track translation status without duplicating acts, scenes, beats or shots.
- Keep dialogue language separate from application-interface language.

This matches the repository language policy in `AGENTS.md` for authored content: Spanish first; other languages must not drift silently.

## 1.1 Current Website and Document Scope

The SvelteKit interface uses Paraglide JS. Interface locale is encoded in the URL: English uses unprefixed routes and Spanish uses `/es/`. This routing choice does not change authorship authority: Spanish remains the source language for narrative and project documentation.

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

Entity galleries keep Spanish records canonical and apply an English translation overlay at read time. The overlay may translate human-facing names, roles, and descriptions, but never IDs, asset links, or canon relationships.

The four registered scripts, dialogue, derived subtitles, scene/beat prose, shot/take metadata, assets, comparison taxonomy, narrative functions, and entity variants now use `data/translations/public.en.json`. Its keys are exact Spanish source strings: `npm run validate:translations` reports a changed or new Spanish string as missing and a superseded key as orphaned. This provides staleness detection without duplicating acts, scenes, beats, shots, or takes.

At read time, English dialogue and text-cue variants are injected with `status: "draft"`; no audio or voice asset is inferred. Subtitles continue to derive from the selected dialogue variant. Unprefixed English routes default story and subtitle selection to English on first visit, while `/es/` defaults them to Spanish; a later manual choice persists locally. English pages identify the translation as a draft, and Spanish remains authoritative.

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
    "sourceLanguage": "es",
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

`sourceLanguage` must remain `es` (or a Spanish regional tag such as `es-AR` if that becomes the sole Spanish source). Do not set English or another language as `sourceLanguage` to shortcut translation workflow.

Use `es-AR` instead of `es` only if the project intends to maintain distinct regional Spanish variants. Do not introduce both until their editorial difference is real. When a regional Spanish tag is the source, that tag--not generic `es` or English--is the dialogue source of truth.

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

`content.sourceLanguage` must equal the project Spanish source language. The variant keyed by that tag must use `status: "source"`. Non-Spanish variants must not use `status: "source"`.

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
    | "time_card";

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
  description?: string;

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

- Project `sourceLanguage` is Spanish (`es` or an approved regional Spanish tag);
- Source language exists in variants;
- All variant keys use supported language tags;
- `source` status appears only on the source-language (Spanish) variant;
- Non-source variants do not claim `status: "source"`;
- Referenced voice profiles support the requested language;
- Referenced audio assets exist and are audio files;
- Language timing does not exceed shot duration;
- Approved dialogue variants are non-empty;
- Subtitle fallback is visible to editors;
- A missing dub does not prevent source-language playback.

## 11. Migration of Existing Dialogue

Convert the current Spanish string:

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

**Do not generate English (or other) translations during the mechanical extraction step.** Extract Spanish as `status: "source"` only. Translation and dialogue development for other languages are separate editorial changes that must follow the validated Spanish lines--never invent English first and back-translate into Spanish.

When revising an existing multilingual cue, change Spanish first, then bring other variants up to date (or set them to `needs_revision` until translated).
