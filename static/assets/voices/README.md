# Character voice refs

Curated timbre references for the main cast. English keeps native-L1 colour;
Spanish uses Latin American regional donors painted with the English timbre.

```
static/assets/voices/en/{Character}.wav   # English sample phrase
static/assets/voices/es/{Character}.wav   # Spanish sample phrase (LatAm)
```

| Lang | Phrase file | Cast (current) |
|------|-------------|----------------|
| `en/` | `REF_TEXT.txt` | Zao, Voss, Harlan, Elin, Sorell, Okoye, Reporter |
| `es/` | `REF_TEXT.txt` | Zao (Bogotá), Voss (Lima), Harlan (BA), Elin (Medellín/proxy Bogotá), Sorell (Santiago del Estero), Okoye (Caracas) |

Catalog ids: `asset:voice-ref-{en|es}-{slug}` (Elin → `elin`, Reporter → `reporter`). Wired on the matching language variant’s `sampleAssetIds` in `data/voice-profiles.json`. Reporter is EN-only (`voice:reporter-en` / `character:periodista`).

**ES source pool:** `E:/Models/Qwen3-TTS/output/pronunciation-tests/es-accents/latam-regional/finalists/`
(Seed-VC: `voice-donors/es/{accent}` × `en/{Character}.wav` → Qwen ES). See `selection.json`.

**EN source pool:** `…/en-accents/native-l1-v2/` / selected-slow (unchanged).

**Clone knobs:** `docs/wip/qwen-icl-clone-defaults.json`.
Full recreate: `docs/TTS_VOICE_PIPELINE.es.md`.

Cael is not in either selected set.
