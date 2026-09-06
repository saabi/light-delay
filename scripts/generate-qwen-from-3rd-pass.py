#!/usr/bin/env python3
"""Qwen3-TTS Spanish phrase from Seed-VC 3rd-pass refs (timbre + accent).

For each ``*_3rd_pass.wav`` under donors-public-colored:
  - clone ref = that WAV
  - ref_text = original public-donor transcript (ICL)
  - synthesize the shared Spanish sample phrase
  - write ``{stem}_qwen-es.wav`` beside the 3rd-pass file
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
COLORED = Path(
    r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents\donors-public-colored"
)
DONORS = Path(r"E:\Models\voice-donors\es")
WEATHER_CACHE = Path(r"E:\Models\voice-donors\_cache\es\weather")
if not WEATHER_CACHE.is_dir():
    # legacy layout after consolidation
    alt = Path(r"E:\Models\voice-donors\_cache\weather")
    if alt.is_dir():
        WEATHER_CACHE = alt

TEXT = (
    "Los sistemas de la nave están estables. "
    "Propulsión, guiado y comunicaciones en orden. "
    "Mantendremos la aceleración prevista y el calendario de contacto."
)

# Soft nudge only — accent/timbre should come from the 3rd-pass clone ref.
INSTRUCT = "Speak Spanish naturally and clearly."


def load_weather_index() -> dict[str, str]:
    """Map OpenSLR weather wav stem -> transcript."""
    out: dict[str, str] = {}
    for tsv in WEATHER_CACHE.rglob("*line_index_weather.tsv"):
        for line in tsv.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t", 1)
            if len(parts) != 2:
                continue
            stem, text = parts[0].strip(), parts[1].strip()
            out[stem] = text
            # also bare filename without path
            out[Path(stem).name] = text
    return out


def resolve_ref_text(accent: str, donor_stem: str, weather: dict[str, str]) -> str | None:
    meta_path = DONORS / accent / f"{donor_stem}.json"
    if not meta_path.is_file():
        return None
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    text = meta.get("text")
    if text:
        return str(text).strip()
    original = meta.get("original") or ""
    # e.g. es-ar\arf_02485_00047151674.wav
    stem = Path(str(original).replace("\\", "/")).stem
    if stem in weather:
        return weather[stem]
    # try last path component only
    return weather.get(stem)


def list_jobs() -> list[tuple[Path, Path, str, str, str]]:
    """Return (ref_wav, out_wav, accent, voice, donor_stem)."""
    jobs = []
    for ref in sorted(COLORED.glob("*/*/*_3rd_pass.wav")):
        if "_smoke" in ref.parts:
            continue
        voice = ref.parent.name
        accent = ref.parent.parent.name
        if ref.parent.parent.parent != COLORED:
            continue
        base = ref.stem[: -len("_3rd_pass")]  # donor__Voice
        suffix = f"__{voice}"
        if not base.endswith(suffix):
            continue
        donor_stem = base[: -len(suffix)]
        out = ref.with_name(f"{base}_3rd_pass_qwen-es.wav")
        jobs.append((ref, out, accent, voice, donor_stem))
    return jobs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_false", dest="skip_existing")
    parser.add_argument("--limit", type=int, default=0, help="Stop after N jobs (0=all)")
    args = parser.parse_args()

    os.environ.setdefault("HF_HOME", r"E:\Models\Qwen3-TTS\hf-cache")
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", r"E:\Models\Qwen3-TTS\hf-cache\hub")

    sys.path.insert(0, str(ROOT / "scripts"))
    from importlib.machinery import SourceFileLoader

    dual = SourceFileLoader(
        "dual", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()
    dual.bootstrap_kokoro_cuda()

    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    weather = load_weather_index()
    print(f"Weather transcript entries: {len(weather)}", flush=True)

    jobs = list_jobs()
    if args.skip_existing:
        jobs = [(r, o, a, v, d) for r, o, a, v, d in jobs if not o.is_file()]
    if args.limit and args.limit > 0:
        jobs = jobs[: args.limit]
    print(f"Jobs: {len(jobs)}", flush=True)
    if not jobs:
        print("Nothing to do.", flush=True)
        return 0

    qwen = dual.load_qwen_clone(qwen_cast)
    gen = qwen_cast.get("generation") or {}
    target_sr = 24000

    manifest = []
    failures = 0
    for ref, out, accent, voice, donor_stem in tqdm(jobs, desc="Qwen-ES"):
        ref_text = resolve_ref_text(accent, donor_stem, weather)
        x_only = not bool(ref_text)
        try:
            prompt = qwen.create_voice_clone_prompt(
                ref_audio=str(ref),
                ref_text=ref_text,
                x_vector_only_mode=x_only,
            )
            wav, sr = dual.qwen_clone_with_instruct(
                qwen,
                text=TEXT,
                language="Spanish",
                voice_clone_prompt=prompt,
                instruct=INSTRUCT,
                non_streaming_mode=bool(gen.get("non_streaming_mode", True)),
                temperature=float(gen.get("temperature", 0.85)),
                top_p=float(gen.get("top_p", 0.95)),
                max_new_tokens=int(gen.get("max_new_tokens", 2048)),
            )
            wav = dual.resample_linear(np.asarray(wav, dtype=np.float32), int(sr), target_sr)
            wav = np.clip(wav * 0.92, -1.0, 1.0)
            sf.write(str(out), wav, target_sr)
            manifest.append(
                {
                    "ok": True,
                    "ref": str(ref),
                    "out": str(out),
                    "accent": accent,
                    "voice": voice,
                    "donor": donor_stem,
                    "ref_text": ref_text,
                    "x_vector_only": x_only,
                    "seconds": round(len(wav) / target_sr, 2),
                }
            )
        except Exception as exc:  # noqa: BLE001
            failures += 1
            manifest.append(
                {
                    "ok": False,
                    "ref": str(ref),
                    "out": str(out),
                    "error": str(exc),
                }
            )
            print(f"FAIL {ref.name}: {exc}", flush=True)

    man_path = COLORED / "manifest-3rd-pass-qwen-es.json"
    man_path.write_text(
        json.dumps(
            {
                "text": TEXT,
                "instruct": INSTRUCT,
                "language": "Spanish",
                "jobs": len(jobs),
                "failures": failures,
                "clips": manifest,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"Done. failures={failures} manifest={man_path}", flush=True)
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
