#!/usr/bin/env python3
"""Spanish native-L1: Seed-VC V2 (1 pass) → Qwen ES phrase, tuned for native prosody survival.

Framing (same as EN native-l1):
  source = voice-donors/native/{lang}/*.wav   # prosody to KEEP
  target = static/assets/voices/es/{Character}.wav  # timbre only

Seed-VC V2 defaults for prosody survival:
  convert_style=False   # True would pull accent TOWARD the ES target (washes L1)
  intelligibility_cfg_rate=0.90  # favor source content/prosody structure
  similarity_cfg_rate=0.55       # enough character color, not so high it overwrites L1
  diffusion_steps=35

Qwen clone defaults (ICL so Seed-VC prosody in ref_code is used):
  x_vector_only=False + Whisper transcript of each *_v2.wav
  temperature=0.70, top_p=0.85
  minimal instruct ("Speak Spanish clearly.") — no strong L1 rewrite


Run:
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/pipeline-spanish-native-l1-v2-qwen.py --seedvc-only
  python scripts/pipeline-spanish-native-l1-v2-qwen.py --qwen-only
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import types
from importlib.machinery import SourceFileLoader
from pathlib import Path

import numpy as np
import soundfile as sf
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
ES_ROOT = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents")
OUT_ROOT = ES_ROOT / "native-l1-v2"
NATIVE_DONORS = Path(r"E:\Models\voice-donors\native")
COLORED = OUT_ROOT / "donors-colored"
FINALISTS = OUT_ROOT / "finalists"
SELECTED_ES = ROOT / "static" / "assets" / "voices" / "es"
SEED_VC = Path(r"E:\Models\Seed-VC")

CAST = {
    "mandarin": "Zao",
    "german": "Voss",
    "british-english": "Harlan",
    "hindi": "Elin",
    "french": "Sorell",
    "igbo": "Okoye",
}

# Thin Qwen instructs — reinforce L1 rhythm without rewriting the voice bible.
L1_INSTRUCT = {
    "Zao": (
        "Speak Spanish clearly. Keep Mandarin-influenced rhythm: marked consonants, "
        "falling phrase endings; do not flatten into neutral Latin American."
    ),
    "Voss": (
        "Speak Spanish clearly. Keep Germanic rhythm: hard consonants, even deliberate "
        "pauses, falling authority; not soft Caribbean."
    ),
    "Harlan": (
        "Speak Spanish clearly. Keep polished British cadence underneath: even measured "
        "pace, crisp consonants; not exaggerated porteño."
    ),
    "Elin": (
        "Speak Spanish clearly. Keep Indian English rhythm texture: softer consonants, "
        "syllable clarity; intelligent and careful, not childish."
    ),
    "Sorell": (
        "Speak Spanish clearly. Keep slight French musicality: softened R feel, precise "
        "diction; composed, not theatrical."
    ),
    "Okoye": (
        "Speak Spanish clearly. Keep Nigerian Igbo-inflected syllable timing: clear "
        "consonants, firm falling intonation; security-officer calm, no caricature."
    ),
}

# Prosody-survival Seed-VC V2 knobs
VC_DEFAULTS = dict(
    diffusion_steps=35,
    length_adjust=1.0,
    intelligibility_cfg_rate=0.90,
    similarity_cfg_rate=0.55,
    top_p=0.9,
    temperature=1.0,
    repetition_penalty=1.0,
    convert_style=False,
    anonymization_only=False,
    compile=False,
    ar_checkpoint_path=None,
    cfm_checkpoint_path=None,
)

# Prosody-survival Qwen knobs (ICL — x_vector_only erases Seed-VC prosody)
QWEN_TEMPERATURE = 0.70
QWEN_TOP_P = 0.85
QWEN_TOP_K = 50
QWEN_MAX_NEW_TOKENS = 768
QWEN_MAX_OUT_SECONDS = 25.0
QWEN_X_VECTOR_ONLY = False
QWEN_INSTRUCT = "Speak Spanish clearly."  # minimal; strong L1 instruct fights ICL codes


ES_PHRASE = (
    "Los sistemas de la nave están estables. "
    "Propulsión, guiado y comunicaciones en orden. "
    "Mantendremos la aceleración prevista y el calendario de contacto."
)


def load_dual():
    return SourceFileLoader(
        "dual", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()


def list_donors(lang: str) -> list[Path]:
    folder = NATIVE_DONORS / lang
    if not folder.is_dir():
        return []
    return sorted(folder.glob("native-*.wav"))


def colored_path(lang: str, character: str, donor: Path) -> Path:
    return COLORED / lang / character / f"{donor.stem}__{character}_v2.wav"


def run_seedvc_v2(*, skip_existing: bool, vc_opts: dict) -> int:
    os.environ.setdefault("HF_HUB_CACHE", str(SEED_VC / "checkpoints" / "hf_cache"))
    os.environ.setdefault("HF_HOME", os.environ["HF_HUB_CACHE"])
    os.chdir(SEED_VC)
    if str(SEED_VC) not in sys.path:
        sys.path.insert(0, str(SEED_VC))

    import inference_v2 as v2  # noqa: E402

    args = types.SimpleNamespace(**vc_opts)
    print("Loading Seed-VC V2 …", flush=True)
    # Force load once
    _ = v2.convert_voice_v2  # noqa: F841
    # Preload via dummy args on first convert
    failures = 0
    jobs: list[tuple[Path, Path, Path, str, str]] = []
    for lang, character in CAST.items():
        timbre = SELECTED_ES / f"{character}.wav"
        if not timbre.is_file():
            print(f"WARN missing ES timbre {timbre}", flush=True)
            continue
        for donor in list_donors(lang):
            out = colored_path(lang, character, donor)
            if skip_existing and out.is_file() and out.stat().st_size > 1000:
                continue
            jobs.append((donor, timbre, out, lang, character))

    print(
        f"V2 jobs={len(jobs)} convert_style={vc_opts['convert_style']} "
        f"intel={vc_opts['intelligibility_cfg_rate']} sim={vc_opts['similarity_cfg_rate']} "
        f"steps={vc_opts['diffusion_steps']}",
        flush=True,
    )

    for source, target, out, lang, character in tqdm(jobs, desc="SeedVC-V2"):
        try:
            out.parent.mkdir(parents=True, exist_ok=True)
            result = v2.convert_voice_v2(str(source), str(target), args)
            if result is None:
                raise RuntimeError("convert_voice_v2 returned None")
            sr, audio = result
            sf.write(str(out), audio, int(sr))
            meta = {
                "source": str(source),
                "target": str(target),
                "character": character,
                "lang": lang,
                "engine": "seed-vc-v2",
                "vc": {k: vc_opts[k] for k in (
                    "diffusion_steps",
                    "length_adjust",
                    "intelligibility_cfg_rate",
                    "similarity_cfg_rate",
                    "convert_style",
                    "anonymization_only",
                )},
                "note": (
                    "convert_style=false keeps source (native) prosody; "
                    "high intelligibility / moderate similarity favors L1 survival."
                ),
            }
            out.with_suffix(".json").write_text(
                json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
            )
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"FAIL V2 {source.name}->{character}: {exc}", flush=True)
    return failures


def whisper_transcribe(path: Path, model) -> str:
    """Transcribe Seed-VC colored ref for ICL ref_text (any language)."""
    # Multilingual / low-resource: try a few decoding strategies before failing.
    attempts = [
        dict(fp16=True, verbose=False, condition_on_previous_text=False),
        dict(fp16=True, verbose=False, condition_on_previous_text=False, temperature=0.0),
        dict(fp16=True, verbose=False, condition_on_previous_text=False, task="transcribe", temperature=(0.0, 0.2, 0.4)),
    ]
    last_err = None
    for kwargs in attempts:
        try:
            result = model.transcribe(str(path), **kwargs)
            text = str(result.get("text") or "").strip()
            if text:
                return text
        except Exception as exc:  # noqa: BLE001
            last_err = exc
    raise RuntimeError(f"empty Whisper transcript for {path}" + (f" ({last_err})" if last_err else ""))


def run_qwen(*, skip_existing: bool) -> int:
    dual = load_dual()
    dual.bootstrap_kokoro_cuda()
    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    cache = Path(qwen_cast["models"]["cacheDir"])
    os.environ["HF_HOME"] = str(cache)
    os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache / "hub")
    os.environ.pop("HF_HUB_CACHE", None)

    print("Loading Whisper (for ICL ref_text) …", flush=True)
    import whisper

    asr = whisper.load_model("medium")

    qwen = dual.load_qwen_clone(qwen_cast)
    target_sr = 24000
    failures = 0
    clips = []

    jobs = []
    for lang, character in CAST.items():
        for donor in list_donors(lang):
            ref = colored_path(lang, character, donor)
            if not ref.is_file():
                continue
            out = ref.with_name(f"{donor.stem}__{character}_v2_qwen-es.wav")
            if skip_existing and out.is_file():
                continue
            jobs.append((ref, out, lang, character, donor))

    print(
        f"Qwen-ES jobs={len(jobs)} temp={QWEN_TEMPERATURE} top_p={QWEN_TOP_P} "
        f"x_vector_only={QWEN_X_VECTOR_ONLY} (ICL + Whisper)",
        flush=True,
    )

    for ref, out, lang, character, donor in tqdm(jobs, desc="Qwen-ES"):
        try:
            ref_text = whisper_transcribe(ref, asr)
            # Cache transcript beside the colored ref for reuse/debug
            ref.with_name(ref.stem + "_whisper.txt").write_text(ref_text + "\n", encoding="utf-8")

            prompt = qwen.create_voice_clone_prompt(
                ref_audio=str(ref),
                ref_text=ref_text,
                x_vector_only_mode=QWEN_X_VECTOR_ONLY,
            )
            wav, sr = dual.qwen_clone_with_instruct(
                qwen,
                text=ES_PHRASE,
                language="Spanish",
                voice_clone_prompt=prompt,
                instruct=QWEN_INSTRUCT,
                non_streaming_mode=True,
                temperature=QWEN_TEMPERATURE,
                top_p=QWEN_TOP_P,
                top_k=QWEN_TOP_K,
                max_new_tokens=QWEN_MAX_NEW_TOKENS,
            )
            wav = dual.resample_linear(np.asarray(wav, dtype=np.float32), int(sr), target_sr)
            wav = np.clip(wav * 0.92, -1.0, 1.0)
            out_sec = len(wav) / float(target_sr)
            if out_sec > QWEN_MAX_OUT_SECONDS:
                failures += 1
                print(f"FAIL too long {out_sec:.1f}s {ref.name}", flush=True)
                clips.append({"ok": False, "ref": str(ref), "error": f"too_long:{out_sec:.1f}s"})
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            sf.write(str(out), wav, target_sr)
            dest_dir = FINALISTS / character
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / out.name
            shutil.copy2(out, dest)
            clips.append(
                {
                    "ok": True,
                    "character": character,
                    "lang": lang,
                    "donor": donor.name,
                    "ref": str(ref),
                    "finalist": str(dest),
                    "ref_text": ref_text,
                    "instruct": QWEN_INSTRUCT,
                    "x_vector_only": QWEN_X_VECTOR_ONLY,
                    "temperature": QWEN_TEMPERATURE,
                    "top_p": QWEN_TOP_P,
                    "seconds": round(out_sec, 2),
                }
            )
        except Exception as exc:  # noqa: BLE001
            failures += 1
            clips.append({"ok": False, "ref": str(ref), "error": str(exc)})
            print(f"FAIL Qwen {ref.name}: {exc}", flush=True)

    man = {
        "phrase": ES_PHRASE,
        "engine": "seed-vc-v2 + qwen-es-icl",
        "vc_defaults": VC_DEFAULTS,
        "qwen": {
            "temperature": QWEN_TEMPERATURE,
            "top_p": QWEN_TOP_P,
            "top_k": QWEN_TOP_K,
            "x_vector_only": QWEN_X_VECTOR_ONLY,
            "instruct": QWEN_INSTRUCT,
            "ref_text": "whisper-medium on each *_v2.wav",
            "max_new_tokens": QWEN_MAX_NEW_TOKENS,
        },
        "jobs": len(jobs),
        "failures": failures,
        "clips": clips,
    }
    FINALISTS.mkdir(parents=True, exist_ok=True)
    (FINALISTS / "manifest.json").write_text(
        json.dumps(man, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (FINALISTS / "README.md").write_text(
        """# Spanish native-L1 (Seed-VC V2 + Qwen ICL)

Timbre: `static/assets/voices/es/{Character}.wav`
Prosody: `voice-donors/native/{lang}/` → Seed-VC V2 → Qwen ICL

**Qwen must use ICL** (`x_vector_only=false`) with a Whisper transcript of each
`*_v2.wav`. `x_vector_only=true` keeps only timbre and erases Seed-VC prosody.

- V2: `convert_style=false`, intel=0.90, sim=0.55, steps=35
- Qwen: ICL + Whisper, temp=0.70, top_p=0.85, minimal instruct

Pick one WAV per character after listening.
""",
        encoding="utf-8",
    )
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seedvc-only", action="store_true")
    parser.add_argument("--qwen-only", action="store_true")
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_false", dest="skip_existing")
    parser.add_argument("--similarity-cfg-rate", type=float, default=VC_DEFAULTS["similarity_cfg_rate"])
    parser.add_argument(
        "--intelligibility-cfg-rate",
        type=float,
        default=VC_DEFAULTS["intelligibility_cfg_rate"],
    )
    parser.add_argument("--diffusion-steps", type=int, default=VC_DEFAULTS["diffusion_steps"])
    parser.add_argument(
        "--convert-style",
        type=lambda s: str(s).lower() in {"1", "true", "yes"},
        default=False,
        help="Default false for L1 survival (true pulls accent toward ES target).",
    )
    args = parser.parse_args()

    for lang, character in CAST.items():
        n = len(list_donors(lang))
        sel = SELECTED_ES / f"{character}.wav"
        print(f"{character:8} lang={lang:16} donors={n} es={sel.is_file()}", flush=True)
        if n == 0:
            raise SystemExit(f"No native donors in {NATIVE_DONORS / lang}")
        if not sel.is_file():
            raise SystemExit(f"Missing ES selected {sel}")

    vc_opts = dict(VC_DEFAULTS)
    vc_opts["similarity_cfg_rate"] = args.similarity_cfg_rate
    vc_opts["intelligibility_cfg_rate"] = args.intelligibility_cfg_rate
    vc_opts["diffusion_steps"] = args.diffusion_steps
    vc_opts["convert_style"] = bool(args.convert_style)

    fails = 0
    if not args.qwen_only:
        fails += run_seedvc_v2(skip_existing=args.skip_existing, vc_opts=vc_opts)
    if not args.seedvc_only:
        fails += run_qwen(skip_existing=args.skip_existing)
    print(f"Done. failures={fails} finalists={FINALISTS}", flush=True)
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
