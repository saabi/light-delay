#!/usr/bin/env python3
"""English native-L1: Seed-VC V2 (1 pass) → Qwen EN phrase with ICL prosody survival.

Same framing as ES native-l1-v2:
  source = voice-donors/native/{lang}/*.wav   # prosody to KEEP
  target = static/assets/voices/en/{Character}.wav  # timbre only

Canonical knobs: docs/wip/qwen-icl-clone-defaults.json
  Seed-VC V2: convert_style=false, intel=0.90, sim=0.55, steps=35
  Qwen: x_vector_only=false + Whisper of each *_v2.wav, temp=0.70, top_p=0.85

Run:
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/pipeline-english-native-l1-v2-qwen.py --seedvc-only
  python scripts/pipeline-english-native-l1-v2-qwen.py --qwen-only
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
sys.path.insert(0, str(ROOT / "scripts"))
from lib import qwen_icl  # noqa: E402

QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
EN_ROOT = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\en-accents")
OUT_ROOT = EN_ROOT / "native-l1-v2"
NATIVE_DONORS = Path(r"E:\Models\voice-donors\native")
COLORED = OUT_ROOT / "donors-colored"
FINALISTS = OUT_ROOT / "finalists"
SELECTED_EN = ROOT / "static" / "assets" / "voices" / "en"
SEED_VC = Path(r"E:\Models\Seed-VC")

CAST = {
    "mandarin": "Zao",
    "german": "Voss",
    "british-english": "Harlan",
    "hindi": "Elin",
    "french": "Sorell",
    "igbo": "Okoye",
}

_DEFAULTS = qwen_icl.load_defaults()
VC_DEFAULTS = qwen_icl.seedvc_v2_opts(_DEFAULTS)
_QWEN = qwen_icl.qwen_generation(_DEFAULTS, language="English")
QWEN_TEMPERATURE = _QWEN["temperature"]
QWEN_TOP_P = _QWEN["top_p"]
QWEN_TOP_K = _QWEN["top_k"]
QWEN_MAX_NEW_TOKENS = _QWEN["max_new_tokens"]
QWEN_MAX_OUT_SECONDS = _QWEN["max_out_seconds"]
QWEN_X_VECTOR_ONLY = _QWEN["x_vector_only"]
QWEN_INSTRUCT = _QWEN["instruct"]


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


def en_phrase(qwen_cast: dict) -> str:
    ref = SELECTED_EN / "REF_TEXT.txt"
    if ref.is_file():
        return ref.read_text(encoding="utf-8").strip()
    return str(qwen_cast.get("refText") or "").strip()


def run_seedvc_v2(*, skip_existing: bool, vc_opts: dict) -> int:
    os.environ.setdefault("HF_HUB_CACHE", str(SEED_VC / "checkpoints" / "hf_cache"))
    os.environ.setdefault("HF_HOME", os.environ["HF_HUB_CACHE"])
    os.chdir(SEED_VC)
    if str(SEED_VC) not in sys.path:
        sys.path.insert(0, str(SEED_VC))

    import inference_v2 as v2  # noqa: E402

    args = types.SimpleNamespace(**vc_opts)
    print("Loading Seed-VC V2 …", flush=True)
    _ = v2.convert_voice_v2  # noqa: F841
    failures = 0
    jobs: list[tuple[Path, Path, Path, str, str]] = []
    for lang, character in CAST.items():
        timbre = SELECTED_EN / f"{character}.wav"
        if not timbre.is_file():
            print(f"WARN missing EN timbre {timbre}", flush=True)
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
                "vc": {
                    k: vc_opts[k]
                    for k in (
                        "diffusion_steps",
                        "length_adjust",
                        "intelligibility_cfg_rate",
                        "similarity_cfg_rate",
                        "convert_style",
                        "anonymization_only",
                    )
                },
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


def run_qwen(*, skip_existing: bool) -> int:
    dual = load_dual()
    dual.bootstrap_kokoro_cuda()
    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    phrase = en_phrase(qwen_cast)
    if not phrase:
        raise SystemExit("Missing English sample phrase (REF_TEXT.txt / cast.refText)")

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
            out = ref.with_name(f"{donor.stem}__{character}_v2_qwen-en.wav")
            if skip_existing and out.is_file():
                continue
            jobs.append((ref, out, lang, character, donor))

    print(
        f"Qwen-EN jobs={len(jobs)} temp={QWEN_TEMPERATURE} top_p={QWEN_TOP_P} "
        f"x_vector_only={QWEN_X_VECTOR_ONLY} (ICL + Whisper)",
        flush=True,
    )

    for ref, out, lang, character, donor in tqdm(jobs, desc="Qwen-EN"):
        try:
            # Prefer language-forced Whisper; fall back to donor JSON or ES sibling whisper.
            lang_hint = {
                "mandarin": "zh",
                "german": "de",
                "british-english": "en",
                "hindi": "hi",
                "french": "fr",
                "igbo": None,
            }.get(lang)
            es_sib = Path(
                str(ref).replace(
                    str(EN_ROOT / "native-l1-v2"),
                    str(Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents\native-l1-v2")),
                )
            ).with_name(ref.stem + "_whisper.txt")
            fallback = None
            if es_sib.is_file():
                fallback = es_sib.read_text(encoding="utf-8").strip() or None
            fallback = fallback or qwen_icl.donor_json_text(donor)
            ref_text = qwen_icl.whisper_transcribe(
                ref, asr, language=lang_hint, fallback_text=fallback
            )
            ref.with_name(ref.stem + "_whisper.txt").write_text(ref_text + "\n", encoding="utf-8")

            prompt = qwen.create_voice_clone_prompt(
                ref_audio=str(ref),
                ref_text=ref_text,
                x_vector_only_mode=QWEN_X_VECTOR_ONLY,
            )
            wav, sr = dual.qwen_clone_with_instruct(
                qwen,
                text=phrase,
                language="English",
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
                # One capped retry for runaway generations (common on weak ASR langs).
                wav, sr = dual.qwen_clone_with_instruct(
                    qwen,
                    text=phrase,
                    language="English",
                    voice_clone_prompt=prompt,
                    instruct=QWEN_INSTRUCT,
                    non_streaming_mode=True,
                    temperature=0.65,
                    top_p=QWEN_TOP_P,
                    top_k=QWEN_TOP_K,
                    max_new_tokens=min(384, QWEN_MAX_NEW_TOKENS),
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
        "phrase": phrase,
        "engine": "seed-vc-v2 + qwen-en-icl",
        "vc_defaults": VC_DEFAULTS,
        "qwen": {
            "temperature": QWEN_TEMPERATURE,
            "top_p": QWEN_TOP_P,
            "top_k": QWEN_TOP_K,
            "x_vector_only": QWEN_X_VECTOR_ONLY,
            "instruct": QWEN_INSTRUCT,
            "ref_text": "whisper-medium on each *_v2.wav",
            "max_new_tokens": QWEN_MAX_NEW_TOKENS,
            "defaultsFile": "docs/wip/qwen-icl-clone-defaults.json",
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
        """# English native-L1 (Seed-VC V2 + Qwen ICL)

Timbre: `static/assets/voices/en/{Character}.wav`
Prosody: `voice-donors/native/{lang}/` → Seed-VC V2 → Qwen ICL

**Qwen must use ICL** (`x_vector_only=false`) with a Whisper transcript of each
`*_v2.wav`. `x_vector_only=true` keeps only timbre and erases Seed-VC prosody.

Canonical knobs: `docs/wip/qwen-icl-clone-defaults.json`
- V2: `convert_style=false`, intel=0.90, sim=0.55, steps=35
- Qwen: ICL + Whisper, temp=0.70, top_p=0.85, minimal instruct

Accent / native map:
- Zao ← Mandarin
- Voss ← German
- Harlan ← British English
- Elin ← Hindi
- Sorell ← French
- Okoye ← Igbo

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
        help="Default false for L1 survival (true pulls accent toward EN target).",
    )
    args = parser.parse_args()

    for lang, character in CAST.items():
        n = len(list_donors(lang))
        sel = SELECTED_EN / f"{character}.wav"
        print(f"{character:8} lang={lang:16} donors={n} en={sel.is_file()}", flush=True)
        if n == 0:
            raise SystemExit(f"No native donors in {NATIVE_DONORS / lang}")
        if not sel.is_file():
            raise SystemExit(f"Missing EN selected {sel}")

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
