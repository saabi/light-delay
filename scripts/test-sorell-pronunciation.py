#!/usr/bin/env python3
"""A/B pronunciation test: Sorell vs Soréll (Kokoro narrator + Qwen Sorell line)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests")
KOKORO_CAST = ROOT / "docs" / "wip" / "kokoro-voice-cast.json"
QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"


def bootstrap_cuda() -> None:
    import torch

    torch_lib = Path(torch.__file__).resolve().parent / "lib"
    if torch_lib.is_dir():
        os.environ["PATH"] = str(torch_lib) + os.pathsep + os.environ.get("PATH", "")
        os.environ.setdefault("ONNX_PROVIDER", "CUDAExecutionProvider")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(str(torch_lib))
            except OSError:
                pass


def silence(ms: int, sr: int) -> np.ndarray:
    return np.zeros(int(sr * ms / 1000.0), dtype=np.float32)


def main() -> int:
    bootstrap_cuda()
    import onnxruntime as ort
    import torch
    from kokoro_onnx import Kokoro
    from qwen_tts import Qwen3TTSModel

    # Import dual helper
    sys.path.insert(0, str(ROOT / "scripts"))
    from importlib.machinery import SourceFileLoader

    dual = SourceFileLoader(
        "dual", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()

    kokoro_cast = json.loads(KOKORO_CAST.read_text(encoding="utf-8"))
    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    model_path = Path(kokoro_cast["model"]["path"])
    voices_path = Path(kokoro_cast["model"]["voices"])
    providers = [
        (
            "CUDAExecutionProvider",
            {
                "device_id": 0,
                "arena_extend_strategy": "kSameAsRequested",
                "gpu_mem_limit": 3 * 1024 * 1024 * 1024,
                "cudnn_conv_algo_search": "HEURISTIC",
            },
        ),
        "CPUExecutionProvider",
    ]
    session = ort.InferenceSession(str(model_path), providers=providers)
    kokoro = Kokoro.from_session(session, str(voices_path))
    narr = kokoro_cast["cast"]["Narrator"]

    sentences = {
        "sorell-ascii": (
            "Sorell believes that a species willing to wait millennia to be visited is demonstrating restraint. "
            "Sorell's artificial intelligence unfolds their grammar into a human-readable form."
        ),
        "sorell-accent": (
            "Soréll believes that a species willing to wait millennia to be visited is demonstrating restraint. "
            "Soréll's artificial intelligence unfolds their grammar into a human-readable form."
        ),
    }

    chunks = []
    target_sr = 24000
    for key, text in sentences.items():
        samples, sr = kokoro.create(
            text, voice=narr["voice"], speed=float(narr["speed"]), lang=narr["lang"]
        )
        samples = np.asarray(samples, dtype=np.float32)
        if sr != target_sr:
            samples = dual.resample_linear(samples, sr, target_sr)
        path = OUT_DIR / f"narrator-{key}.wav"
        sf.write(str(path), samples, target_sr)
        print(f"Wrote {path}", flush=True)
        chunks.append(samples)
        chunks.append(silence(800, target_sr))

    # Qwen: one Sorell line + a line that says her name if useful
    qwen = dual.load_qwen_clone(qwen_cast)
    prompts = dual.build_clone_prompts(qwen, qwen_cast)
    prompt = prompts["Sorell"]
    lines = [
        (
            "sorell-line-ascii-name",
            "They wrote the primer. This is the first time they’ll hear us read it back.",
            "Ceremonial resolve. Focused, hushed intensity; first-contact weight.",
        ),
        (
            "sorell-self-intro-accent",
            "I am Soréll. They wrote the primer. This is the first time they’ll hear us read it back.",
            "Clear French-inflected English. Soft musicality on the name Soréll; ceremonial resolve after.",
        ),
    ]
    for key, text, instruct in lines:
        wav, sr = dual.qwen_clone_with_instruct(
            qwen,
            text=text,
            language="English",
            voice_clone_prompt=prompt,
            instruct=instruct,
            non_streaming_mode=True,
            temperature=0.85,
            top_p=0.95,
            max_new_tokens=2048,
        )
        wav = dual.resample_linear(np.asarray(wav, dtype=np.float32), sr, target_sr)
        path = OUT_DIR / f"qwen-{key}.wav"
        sf.write(str(path), wav, target_sr)
        print(f"Wrote {path}", flush=True)
        chunks.append(wav)
        chunks.append(silence(800, target_sr))

    combo = np.concatenate(chunks)
    combo_path = OUT_DIR / "sorell-pronunciation-ab.wav"
    sf.write(str(combo_path), np.clip(combo * 0.92, -1.0, 1.0), target_sr)
    print(f"Wrote {combo_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
