#!/usr/bin/env python3
"""Generate Qwen3-TTS VoiceDesign candidate samples for character curation.

Creates samplesPerCharacter WAVs per character under candidatesDir/<Name>/,
all speaking the same refText so a chosen take can later be used for cloning.
Does not run the full outline render — stop after this for manual selection.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cast",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "docs" / "wip" / "qwen3-tts-cast.json",
    )
    parser.add_argument("--character", type=str, default="", help="Optional single character name")
    parser.add_argument("--start", type=int, default=1, help="1-based sample index to start from")
    args = parser.parse_args()

    cast = json.loads(args.cast.read_text(encoding="utf-8"))
    models = cast["models"]
    ref_text = cast["refText"]
    n_samples = int(cast["samplesPerCharacter"])
    language = cast["language"]
    gen = cast.get("generation", {})
    characters = cast["characters"]
    if args.character:
        key = args.character
        if key not in characters:
            print(f"Unknown character {key!r}. Choose from: {', '.join(characters)}", file=sys.stderr)
            return 1
        characters = {key: characters[key]}

    cache_dir = Path(models["cacheDir"])
    candidates_dir = Path(models["candidatesDir"])
    cache_dir.mkdir(parents=True, exist_ok=True)
    candidates_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("HF_HOME", str(cache_dir))
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(cache_dir / "hub"))

    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32
    print(f"Loading VoiceDesign on {device} ({dtype}) …", flush=True)
    t0 = time.time()
    load_kwargs = {
        "device_map": device if device.startswith("cuda") else "cpu",
        "dtype": dtype,
    }
    try:
        model = Qwen3TTSModel.from_pretrained(
            models["voiceDesign"],
            attn_implementation="flash_attention_2",
            **load_kwargs,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"flash_attention_2 unavailable ({exc}); loading without it", flush=True)
        model = Qwen3TTSModel.from_pretrained(models["voiceDesign"], **load_kwargs)
    print(f"Model ready in {time.time() - t0:.1f}s", flush=True)

    # Persist identical transcript next to each character folder for clone later.
    meta_path = candidates_dir / "REF_TEXT.txt"
    meta_path.write_text(ref_text + "\n", encoding="utf-8")

    for name, profile in characters.items():
        out_dir = candidates_dir / name
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "instruct.txt").write_text(profile["instruct"] + "\n", encoding="utf-8")
        (out_dir / "ref_text.txt").write_text(ref_text + "\n", encoding="utf-8")
        print(f"\n=== {name}: {n_samples} candidates ===", flush=True)

        for i in range(args.start, n_samples + 1):
            out_wav = out_dir / f"{name.lower()}-{i:02d}.wav"
            if out_wav.is_file() and out_wav.stat().st_size > 1000:
                print(f"  skip existing {out_wav.name}", flush=True)
                continue
            # Slight temperature jitter across takes for curation diversity.
            temperature = float(gen.get("temperature", 0.9)) + (i - 1) * 0.02
            temperature = min(1.15, max(0.7, temperature))
            t1 = time.time()
            wavs, sr = model.generate_voice_design(
                text=ref_text,
                language=language,
                instruct=profile["instruct"],
                temperature=temperature,
                top_k=int(gen.get("top_k", 50)),
                top_p=float(gen.get("top_p", 0.95)),
                max_new_tokens=int(gen.get("max_new_tokens", 2048)),
                non_streaming_mode=bool(gen.get("non_streaming_mode", True)),
            )
            sf.write(str(out_wav), wavs[0], sr)
            dur = len(wavs[0]) / float(sr)
            print(
                f"  wrote {out_wav.name} ({dur:.1f}s, temp={temperature:.2f}, {time.time() - t1:.1f}s wall)",
                flush=True,
            )

    manifest = {
        "refText": ref_text,
        "candidatesDir": str(candidates_dir),
        "selectedDir": models["selectedDir"],
        "characters": list(characters),
        "samplesPerCharacter": n_samples,
        "next": (
            "Listen to E:/Models/Qwen3-TTS/candidates/<Name>/*.wav, copy the chosen "
            "file to static/assets/voices/en/<Name>.wav (same ref text), then run the dual renderer."
        ),
    }
    (candidates_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("\nDone. Curate one WAV per character into selected/ before full render.", flush=True)
    print(json.dumps(manifest, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
