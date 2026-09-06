#!/usr/bin/env python3
"""Re-clone curated selected voice refs at a slower pace (no re-curation of native-L1 pools).

Uses each static/assets/voices/{lang}/{Character}.wav as ICL reference, synthesizes
the language REF_TEXT / cast.refText with a slow-pace instruct, and writes review
candidates under:
  E:/Models/Qwen3-TTS/output/pronunciation-tests/{en,es}-accents/selected-slow-v2/

Does not overwrite static/assets/voices/ until you promote manually.

Usage:
  python scripts/regenerate-selected-voice-refs-slower.py --lang es
  python scripts/regenerate-selected-voice-refs-slower.py --lang en
  python scripts/regenerate-selected-voice-refs-slower.py --lang all --promote
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from importlib.machinery import SourceFileLoader
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from lib import qwen_icl  # noqa: E402

CASTS = {
    "en": ROOT / "docs" / "wip" / "qwen3-tts-cast.json",
    "es": ROOT / "docs" / "wip" / "qwen3-tts-cast.es.json",
}
OUT_ROOTS = {
    "en": Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\en-accents\selected-slow-v2"),
    "es": Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents\selected-slow-v2"),
}
VOICES = {
    "en": ROOT / "static" / "assets" / "voices" / "en",
    "es": ROOT / "static" / "assets" / "voices" / "es",
}

SLOW_INSTRUCT = {
    "en": (
        "Speak English clearly at a noticeably slower, deliberate, unhurried pace — "
        "roughly fifteen to twenty percent slower than casual conversation, with natural "
        "pauses between phrases. Finish every word and final consonant fully; do not cut "
        "endings. Keep the exact same voice identity and the same L1 accent colour as the "
        "reference; do not soften, neutralize, or exaggerate the accent. Do not rush."
    ),
    "es": (
        "Speak Spanish clearly at a noticeably slower, deliberate, unhurried pace — "
        "roughly fifteen to twenty percent slower than casual conversation, with natural "
        "pauses between phrases. Finish every word and final consonant fully; do not cut "
        "endings. Keep the same voice identity, but soften the L1 accent clearly: light "
        "international Spanish colour only, no heavy foreign accent, no caricature. Do not rush."
    ),
}


def load_dual():
    return SourceFileLoader(
        "generate_dual_outline_audio",
        str(ROOT / "scripts" / "generate-dual-outline-audio.py"),
    ).load_module()


def sample_phrase(lang: str, cast: dict) -> str:
    voices = VOICES[lang]
    ref_file = voices / "REF_TEXT.txt"
    if ref_file.is_file():
        text = ref_file.read_text(encoding="utf-8").strip()
        if text:
            return text
    return str(cast.get("refText") or "").strip()


def promote(lang: str, out_dir: Path) -> None:
    voices = VOICES[lang]
    sel_path = voices / "selection.json"
    selection = json.loads(sel_path.read_text(encoding="utf-8")) if sel_path.is_file() else {}
    chars = selection.get("characters") or {}
    for wav in sorted(out_dir.glob("*.wav")):
        if wav.name.startswith("_"):
            continue
        name = wav.stem
        dest = voices / f"{name}.wav"
        shutil.copy2(wav, dest)
        whisper_src = wav.with_name(wav.stem + "_whisper.txt")
        if whisper_src.is_file():
            shutil.copy2(whisper_src, voices / f"{name}_whisper.txt")
        entry = chars.get(name) or {}
        entry.update(
            {
                "selectedFile": f"{name}.wav",
                "source": "selected-slow-v2",
                "promotedFrom": str(wav),
                "promotedAt": datetime.now(timezone.utc).isoformat(),
                "note": "Slower re-clone from prior selected ref (ICL; EN keeps L1 accent, ES softens).",
            }
        )
        chars[name] = entry
        print(f"Promoted {lang}/{name}.wav", flush=True)
    selection["characters"] = chars
    selection["updated"] = datetime.now(timezone.utc).isoformat()
    selection["note"] = (
        selection.get("note") or ""
    ) + " | selected-slow-v2 promoted (slower ICL; ES accent softened)."
    sel_path.write_text(json.dumps(selection, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def run_lang(lang: str, *, force: bool, promote_after: bool) -> int:
    dual = load_dual()
    dual.bootstrap_kokoro_cuda()
    cast_path = CASTS[lang]
    cast = json.loads(cast_path.read_text(encoding="utf-8"))
    phrase = sample_phrase(lang, cast)
    if not phrase:
        raise SystemExit(f"Missing sample phrase for {lang}")

    language = str(cast.get("language") or ("Spanish" if lang == "es" else "English"))
    gen = dual.resolve_generation(cast)
    out_dir = OUT_ROOTS[lang]
    out_dir.mkdir(parents=True, exist_ok=True)
    voices = VOICES[lang]

    cache = Path(cast["models"]["cacheDir"])
    os.environ["HF_HOME"] = str(cache)
    os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache / "hub")
    os.environ.pop("HF_HUB_CACHE", None)

    print(f"Loading Whisper medium ({lang}) …", flush=True)
    import whisper

    asr = whisper.load_model("medium")
    qwen = dual.load_qwen_clone(cast)

    instruct = SLOW_INSTRUCT[lang]
    characters = list((cast.get("characters") or {}).keys())
    target_sr = 24000
    clips = []
    failures = 0

    print(
        f"[{lang}] characters={characters} temp={gen['temperature']} "
        f"top_p={gen['top_p']} instruct=slow-from-selected → {out_dir}",
        flush=True,
    )

    for name in characters:
        ref = voices / f"{name}.wav"
        out = out_dir / f"{name}.wav"
        if out.is_file() and not force:
            print(f"skip existing {out.name}", flush=True)
            continue
        if not ref.is_file():
            print(f"WARN missing selected ref {ref}", flush=True)
            failures += 1
            continue
        try:
            ref_text, source = qwen_icl.resolve_ref_text(
                ref,
                cast_ref_text=None,
                selected_dir=voices,
                whisper_model=asr,
                allow_whisper=True,
            )
            # Prefer Whisper of *this* WAV for ICL accuracy.
            whispered = qwen_icl.whisper_transcribe(ref, asr)
            if whispered.strip():
                ref_text = whispered.strip()
                source = "whisper"
            ref.with_name(ref.stem + "_slow_src_whisper.txt").write_text(
                ref_text + "\n", encoding="utf-8"
            )
            (out_dir / f"{name}_ref_whisper.txt").write_text(ref_text + "\n", encoding="utf-8")

            prompt = qwen.create_voice_clone_prompt(
                ref_audio=str(ref),
                ref_text=ref_text,
                x_vector_only_mode=False,
            )
            wav, sr = dual.qwen_clone_with_instruct(
                qwen,
                text=phrase,
                language=language,
                voice_clone_prompt=prompt,
                instruct=instruct,
                non_streaming_mode=True,
                temperature=gen["temperature"],
                top_p=gen["top_p"],
                top_k=gen["top_k"],
                max_new_tokens=gen["max_new_tokens"],
                repetition_penalty=gen.get("repetition_penalty", 1.05),
            )
            wav = dual.resample_linear(np.asarray(wav, dtype=np.float32), int(sr), target_sr)
            wav = np.clip(wav * 0.92, -1.0, 1.0)
            sf.write(str(out), wav, target_sr)
            # Sidecar for the *new* take (matches spoken phrase).
            (out_dir / f"{name}_whisper.txt").write_text(phrase + "\n", encoding="utf-8")
            sec = len(wav) / float(target_sr)
            clips.append(
                {
                    "character": name,
                    "ref": str(ref),
                    "out": str(out),
                    "seconds": round(sec, 2),
                    "ref_text_source": source,
                }
            )
            print(f"OK {lang}/{name} {sec:.1f}s ← {ref.name}", flush=True)
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"FAIL {lang}/{name}: {exc}", file=sys.stderr, flush=True)

    manifest = {
        "created": datetime.now(timezone.utc).isoformat(),
        "lang": lang,
        "phrase": phrase,
        "instruct": instruct,
        "generation": {
            "temperature": gen["temperature"],
            "top_p": gen["top_p"],
            "top_k": gen["top_k"],
            "max_new_tokens": gen["max_new_tokens"],
            "repetition_penalty": gen.get("repetition_penalty"),
            "x_vector_only": False,
            "dialogueSpeed": 1.0,
        },
        "clips": clips,
        "failures": failures,
        "note": "Review then promote with --promote, or copy WAVs into static/assets/voices/{lang}/.",
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    if promote_after and failures == 0:
        existing = list(out_dir.glob("*.wav"))
        if clips or existing:
            promote(lang, out_dir)
        else:
            print(f"WARN: nothing to promote under {out_dir}", flush=True)
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "es", "all"), default="all")
    parser.add_argument("--force", action="store_true", help="Overwrite existing slow candidates")
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Copy selected-slow WAVs into static/assets/voices/{lang}/ (also runs generate unless files exist)",
    )
    parser.add_argument(
        "--promote-only",
        action="store_true",
        help="Only copy existing slow candidates into static/assets/voices/{lang}/",
    )
    args = parser.parse_args()
    langs = ["en", "es"] if args.lang == "all" else [args.lang]
    fails = 0
    for lang in langs:
        if args.promote_only:
            out_dir = OUT_ROOTS[lang]
            if not list(out_dir.glob("*.wav")):
                print(f"WARN: no WAVs in {out_dir}", flush=True)
                fails += 1
                continue
            promote(lang, out_dir)
        else:
            fails += run_lang(lang, force=args.force, promote_after=args.promote)
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
