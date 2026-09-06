#!/usr/bin/env python3
"""Generate a single multi-voice WAV from the tagged Kokoro outline (GPU, one loaded session)."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path


def _bootstrap_cuda_dll_path() -> Path | None:
    """Put PyTorch's bundled CUDA/cuDNN DLLs on PATH before importing onnxruntime."""
    try:
        import torch
    except ImportError:
        return None
    torch_lib = Path(torch.__file__).resolve().parent / "lib"
    if torch_lib.is_dir():
        os.environ["PATH"] = str(torch_lib) + os.pathsep + os.environ.get("PATH", "")
        os.environ.setdefault("ONNX_PROVIDER", "CUDAExecutionProvider")
        return torch_lib
    return None


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCRIPT = ROOT / "docs" / "wip" / "outiline-for-kokoro-tts.voices.md"
DEFAULT_CAST = ROOT / "docs" / "wip" / "kokoro-voice-cast.json"
DEFAULT_OUT = Path(r"E:\Models\Kokoro\output\light-delay-outline-rev12-michael.wav")


def load_cast(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def strip_ipa_markup(text: str) -> str:
    """Kokoro ONNX reads Misaki [Word](/ipa/) spans literally; keep the label only."""
    return re.sub(r"\[([^\]]+)\]\(/[^)]+/\)", r"\1", text)


_PAUSE_RE = re.compile(r"^\[PAUSE\s+(\d+)\]\s*", re.I)


def extract_pause_ms(text: str) -> tuple[int, str]:
    """Pull leading [PAUSE N] markers (ms). Returns (extra_ms, speakable_text)."""
    total = 0
    rest = text.lstrip()
    while True:
        m = _PAUSE_RE.match(rest)
        if not m:
            break
        total += int(m.group(1))
        rest = rest[m.end() :]
    return total, rest.strip()


def parse_cues(text: str) -> list[tuple[str, str]]:
    if "\n---\n" in text:
        text = text.split("\n---\n", 1)[1]
    chunks = re.split(r"\n\s*\n", text.strip())
    cues: list[tuple[str, str]] = []
    speaker_re = re.compile(r"^\[([A-Za-z]+)\]\s*\n([\s\S]+)$")
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk or chunk.startswith("#"):
            continue
        # Skip meta notes / truncation leftovers
        if chunk.startswith("[Content continues") or chunk.startswith("[Note:"):
            continue
        m = speaker_re.match(chunk)
        if not m:
            cues.append(("Narrator", strip_ipa_markup(chunk)))
            continue
        speaker, body = m.group(1), strip_ipa_markup(m.group(2).strip())
        if body:
            cues.append((speaker, body))
    return cues


def silence(ms: int, sr: int):
    import numpy as np

    return np.zeros(int(sr * ms / 1000.0), dtype=np.float32)


def load_kokoro_gpu(model_path: Path, voices_path: Path):
    """Load Kokoro once onto CUDA and keep the ORT session alive for all cues."""
    torch_lib = _bootstrap_cuda_dll_path()
    import torch  # noqa: F401
    import onnxruntime as ort
    from kokoro_onnx import Kokoro

    available = ort.get_available_providers()
    print(f"ORT providers available: {available}", flush=True)
    if "CUDAExecutionProvider" not in available:
        raise RuntimeError(
            "CUDAExecutionProvider unavailable. Install onnxruntime-gpu and ensure CUDA DLLs are on PATH."
        )

    providers = [
        (
            "CUDAExecutionProvider",
            {
                "device_id": 0,
                "arena_extend_strategy": "kSameAsRequested",
                "gpu_mem_limit": 6 * 1024 * 1024 * 1024,
                "cudnn_conv_algo_search": "HEURISTIC",
                "do_copy_in_default_stream": True,
            },
        ),
        "CPUExecutionProvider",
    ]

    print(f"Creating ONNX session on CUDA ({model_path.name}) ...", flush=True)
    if torch_lib:
        print(f"CUDA DLL path: {torch_lib}", flush=True)
    t0 = time.time()
    session = ort.InferenceSession(str(model_path), providers=providers)
    active = session.get_providers()
    print(f"Session providers: {active} ({time.time() - t0:.1f}s)", flush=True)
    if active[0] != "CUDAExecutionProvider":
        raise RuntimeError(f"Failed to bind CUDA EP; got {active}")

    kokoro = Kokoro.from_session(session, str(voices_path))
    return kokoro, active


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--script", type=Path, default=DEFAULT_SCRIPT)
    parser.add_argument("--cast", type=Path, default=DEFAULT_CAST)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--limit", type=int, default=0, help="Optional cue limit for smoke tests")
    parser.add_argument("--start", type=int, default=0, help="Skip the first N cues")
    args = parser.parse_args()

    cast_doc = load_cast(args.cast)
    model_path = Path(cast_doc["model"]["path"])
    voices_path = Path(cast_doc["model"]["voices"])
    defaults = cast_doc["defaults"]
    cast = cast_doc["cast"]

    if not model_path.is_file() or not voices_path.is_file():
        print(f"Missing model files under {model_path.parent}", file=sys.stderr)
        return 1

    import numpy as np
    import soundfile as sf

    kokoro, providers = load_kokoro_gpu(model_path, voices_path)
    print(f"Kokoro ready on {providers[0]} (single session kept in GPU memory)", flush=True)

    all_cues = parse_cues(args.script.read_text(encoding="utf-8"))
    cues = all_cues
    absolute_start = args.start
    if args.start:
        cues = cues[args.start :]
    if args.limit:
        cues = cues[: args.limit]
    print(f"Cues to render: {len(cues)} (start={absolute_start}, total={len(all_cues)})", flush=True)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    progress_path = args.out.with_suffix(".progress.json")
    log_path = args.out.with_suffix(".log")

    sample_rate = 24000
    prev_was_dialogue = False
    synth_s = 0.0
    audio_s = 0.0
    peak = 0.0
    samples_written = 0

    # Stream to WAV so we never hold the full show in RAM.
    mode = "w"
    if absolute_start > 0 and args.out.is_file():
        mode = "r+"
        print(f"Appending to existing {args.out}", flush=True)

    with sf.SoundFile(
        str(args.out),
        mode=mode,
        samplerate=sample_rate,
        channels=1,
        subtype="PCM_16",
        format="WAV",
    ) as wav:
        if mode == "r+":
            wav.seek(0, sf.SEEK_END)
            samples_written = wav.tell()
            sample_rate = wav.samplerate

        for i, (speaker, text) in enumerate(cues, 1):
            abs_i = absolute_start + i
            pause_ms, text = extract_pause_ms(text)
            profile = cast.get(speaker) or cast["Narrator"]
            voice = profile["voice"]
            lang = profile["lang"]
            speed = float(profile.get("speed", defaults["narratorSpeed"]))
            is_dialogue = bool(text) and text.lstrip().startswith(('"', "“"))

            chunks = []
            if pause_ms > 0:
                chunks.append(silence(pause_ms, sample_rate))
            elif samples_written > 0 or i > 1:
                gap = defaults["pauseBeforeDialogueMs"] if is_dialogue else defaults["pauseBetweenChunksMs"]
                if prev_was_dialogue and not is_dialogue:
                    gap = defaults["pauseAfterDialogueMs"]
                chunks.append(silence(gap, sample_rate))

            # Silence-only cue: [PAUSE N] with no following text
            if not text:
                if not chunks:
                    continue
                block = chunks[0] if len(chunks) == 1 else np.concatenate(chunks)
                wav.write(block)
                wav.flush()
                samples_written += len(block)
                prev_was_dialogue = False
                continue

            t1 = time.time()
            try:
                samples, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang)
            except Exception as exc:  # noqa: BLE001
                print(f"[{abs_i}/{len(all_cues)}] FAIL {speaker}/{voice}: {exc}", file=sys.stderr, flush=True)
                samples, sr = kokoro.create(
                    text,
                    voice=cast["Narrator"]["voice"],
                    speed=float(cast["Narrator"]["speed"]),
                    lang=cast["Narrator"]["lang"],
                )
                speaker = "Narrator*"
            elapsed = time.time() - t1
            synth_s += elapsed
            sample_rate = sr

            samples = np.asarray(samples, dtype=np.float32)
            # Soft headroom while streaming (avoid final full-file normalize).
            samples = np.clip(samples * 0.92, -1.0, 1.0)
            chunks.append(samples)

            block = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
            peak = max(peak, float(np.max(np.abs(block))) if block.size else 0.0)
            wav.write(block)
            wav.flush()
            samples_written += len(block)
            prev_was_dialogue = is_dialogue
            dur = len(samples) / sr
            audio_s += dur

            # Brief idle to avoid stacking GPU power spikes; free unused CUDA cache periodically.
            if i % 10 == 0:
                time.sleep(0.05)
            if i % 25 == 0:
                try:
                    import torch
                    import gc

                    gc.collect()
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except Exception:
                    pass

            if i == 1 or i % 25 == 0 or i == len(cues):
                safe = text.encode("ascii", "replace").decode("ascii")
                rtf = elapsed / dur if dur > 0 else 0
                line = (
                    f"[{abs_i}/{len(all_cues)}] {speaker} {voice} audio={dur:.1f}s "
                    f"synth={elapsed:.2f}s rtf={rtf:.2f}x | {safe[:56]!r}"
                )
                print(line, flush=True)
                with log_path.open("a", encoding="utf-8") as log:
                    log.write(line + "\n")
                progress_path.write_text(
                    json.dumps(
                        {
                            "done": abs_i,
                            "total": len(all_cues),
                            "samples": samples_written,
                            "audio_s": audio_s,
                            "out": str(args.out),
                        },
                        indent=2,
                    ),
                    encoding="utf-8",
                )

    minutes = samples_written / sample_rate / 60.0
    print(
        f"Wrote {args.out} ({minutes:.1f} min audio, {synth_s:.1f}s synth wall, "
        f"mean RTF={synth_s / audio_s if audio_s else 0:.2f}x, peak={peak:.3f}, providers={providers})",
        flush=True,
    )
    progress_path.write_text(
        json.dumps({"done": absolute_start + len(cues), "total": len(all_cues), "complete": True, "out": str(args.out)}, indent=2),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
