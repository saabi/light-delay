#!/usr/bin/env python3
"""Generate Kokoro Spanish male narrator curation samples.

Kokoro v1.0 ships three Spanish voices in voices-v1.0.bin:
  ef_dora (F), em_alex (M), em_santa (M).

This script renders a shared narrator passage with both male voices
(and optionally Dora) for A/B curation.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
CAST = ROOT / "docs" / "wip" / "kokoro-voice-cast.json"
OUT_DIR = Path(r"E:/Models/Kokoro/output/narrator-es-samples")

# espeak-ng language id used by kokoro_onnx phonemizer
LANG = "es"

PASSAGE = (
    "En la sala común de la estación Proxima, la Tierra llegaba con cuarenta y tres "
    "minutos y dieciocho segundos de retraso. Era la distancia convertida en tiempo: "
    "nada de lo que se veía en la pantalla estaba ocurriendo; todo había ocurrido ya. "
    "Soréll no respondió con optimismo. Llevaba meses con la secuencia de instrucciones "
    "y una inteligencia artificial, desarmando ejemplos hasta poder armar un saludo "
    "rudimentario en la gramática que la garganta había demostrado."
)

VOICES = [
    {"id": "em_alex", "label": "Alex (male)", "speed": 0.92},
    {"id": "em_santa", "label": "Santa (male)", "speed": 0.92},
    # Female reference for completeness — not a narrator candidate unless chosen.
    {"id": "ef_dora", "label": "Dora (female reference)", "speed": 0.92},
]


def bootstrap_cuda() -> None:
    try:
        import torch
    except ImportError:
        return
    torch_lib = Path(torch.__file__).resolve().parent / "lib"
    if torch_lib.is_dir():
        os.environ["PATH"] = str(torch_lib) + os.pathsep + os.environ.get("PATH", "")
        os.environ.setdefault("ONNX_PROVIDER", "CUDAExecutionProvider")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(str(torch_lib))
            except OSError:
                pass


def main() -> int:
    allow_cpu = "--cpu" in sys.argv
    cast = json.loads(CAST.read_text(encoding="utf-8"))
    model_path = Path(cast["model"]["path"])
    voices_path = Path(cast["model"]["voices"])
    if not model_path.is_file() or not voices_path.is_file():
        raise SystemExit(f"Missing Kokoro model/voices: {model_path} / {voices_path}")

    bootstrap_cuda()
    import onnxruntime as ort
    from kokoro_onnx import Kokoro

    providers: list = []
    available = ort.get_available_providers()
    if "CUDAExecutionProvider" in available:
        providers.append(
            (
                "CUDAExecutionProvider",
                {
                    "device_id": 0,
                    "arena_extend_strategy": "kSameAsRequested",
                    "gpu_mem_limit": 2 * 1024 * 1024 * 1024,
                    "cudnn_conv_algo_search": "HEURISTIC",
                    "do_copy_in_default_stream": True,
                },
            )
        )
    providers.append("CPUExecutionProvider")
    print(f"ORT providers: {available}", flush=True)
    session = ort.InferenceSession(str(model_path), providers=providers)
    active = session.get_providers()
    print(f"Active: {active}", flush=True)
    if active[0] != "CUDAExecutionProvider" and not allow_cpu:
        raise SystemExit(f"CUDA EP failed ({active}); re-run with --cpu if needed")

    kokoro = Kokoro.from_session(session, str(voices_path))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "PASSAGE.es.txt").write_text(PASSAGE + "\n", encoding="utf-8")

    manifest = {
        "lang": LANG,
        "passage": PASSAGE,
        "outDir": str(OUT_DIR),
        "samples": [],
    }

    for spec in VOICES:
        voice = spec["id"]
        speed = float(spec["speed"])
        print(f"Rendering {voice} @ {speed} …", flush=True)
        samples, sr = kokoro.create(PASSAGE, voice=voice, speed=speed, lang=LANG)
        samples = np.asarray(samples, dtype=np.float32).reshape(-1)
        samples = np.clip(samples * 0.92, -1.0, 1.0)
        out = OUT_DIR / f"narrator_{voice}.wav"
        sf.write(str(out), samples, int(sr))
        dur = len(samples) / float(sr)
        print(f"  -> {out.name} ({dur:.1f}s)", flush=True)
        manifest["samples"].append(
            {
                "voice": voice,
                "label": spec["label"],
                "speed": speed,
                "path": str(out),
                "seconds": round(dur, 2),
                "gender": "F" if voice.startswith("ef_") else "M",
            }
        )

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT_DIR}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
