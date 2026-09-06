# Character voice refs

Curated timbre + native-L1 prosody references for the main cast
(Seed-VC V2 paint → Qwen ICL).

```
static/assets/voices/en/{Character}.wav   # English sample phrase
static/assets/voices/es/{Character}.wav   # Spanish sample phrase
```

| Lang | Phrase file | Cast (current) |
|------|-------------|----------------|
| `en/` | `REF_TEXT.txt` | Zao, Voss, Harlan, Elin, Sorell, Okoye |
| `es/` | `REF_TEXT.txt` | Zao, Voss, Harlan, Elin, Sorell, Okoye |

**Source pool:** `E:/Models/Qwen3-TTS/output/pronunciation-tests/{en,es}-accents/native-l1-v2/finalists/`
(one selected Qwen WAV per character; see each lang’s `selection.json`).

**Clone knobs (outline + accent pipelines):** `docs/wip/qwen-icl-clone-defaults.json`.
Always ICL (`x_vector_only=false`); `REF_TEXT.txt` must match the spoken phrase in
these curated WAVs.

Full recreate / pipeline / Sorell pronunciation: `docs/TTS_VOICE_PIPELINE.es.md`.

Cael is not in either selected set.
