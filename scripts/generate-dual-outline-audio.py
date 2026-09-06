#!/usr/bin/env python3
"""Dual outline render: Kokoro narrator + Qwen3-TTS cloned character dialogue.

Dialogue uses curated refs under static/assets/voices/{en,es}/ and optional
[QwenInstruct] performance lines. Clone knobs must match
docs/wip/qwen-icl-clone-defaults.json (ICL: x_vector_only=false, accurate
ref_text, temp≈0.70, top_p≈0.85).

Chunks are stored on disk under outline-chunks/{lang}/ and indexed so a voice
change only regenerates that character's dialogue; assemble with
--assemble-only. See docs/TTS_VOICE_PIPELINE.es.md.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from lib import qwen_icl  # noqa: E402

DEFAULT_SCRIPT_EN = ROOT / "docs" / "wip" / "outiline-for-kokoro-tts.voices.md"
DEFAULT_SCRIPT_ES = ROOT / "docs" / "wip" / "outiline-for-kokoro-tts.voices.es.md"
DEFAULT_KOKORO_CAST = ROOT / "docs" / "wip" / "kokoro-voice-cast.json"
DEFAULT_KOKORO_CAST_ES = ROOT / "docs" / "wip" / "kokoro-voice-cast.es.json"
DEFAULT_QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
DEFAULT_QWEN_CAST_ES = ROOT / "docs" / "wip" / "qwen3-tts-cast.es.json"
DEFAULT_OUT = Path(r"E:\Models\Qwen3-TTS\output\light-delay-outline-dual.mp3")
DEFAULT_OUT_ES = Path(r"E:\Models\Qwen3-TTS\output\light-delay-outline-dual-es.mp3")
DEFAULT_CHUNKS_ROOT = Path(r"E:\Models\Qwen3-TTS\output\outline-chunks")
INDEX_NAME = "index.json"
AUDIO_SUBDIR = "audio"

PAUSE_RE = re.compile(r"^\[PAUSE\s+(\d+)\]\s*", re.I)
INSTRUCT_RE = re.compile(r"^\[QwenInstruct\]\s*(.+)$", re.I | re.M)
SPEAKER_RE = re.compile(r"^\[([A-Za-z]+)\]\s*\n([\s\S]+)$")
DIALOGUE_ID_RE = re.compile(
    r"^<!--\s*audience-dialogue-id:\s*([^\s]+)\s*-->\s*(.*)$",
    re.I | re.S,
)


def repo_path(p: str | Path) -> Path:
    """Resolve cast paths: absolute as-is, else relative to repo root."""
    path = Path(p)
    return path if path.is_absolute() else (ROOT / path)


IPA_RE = re.compile(r"\[([^\]]+)\]\(/[^)]+/\)")


def strip_ipa(text: str) -> str:
    return IPA_RE.sub(r"\1", text)


def extract_pause_ms(text: str) -> tuple[int, str]:
    total = 0
    rest = text.lstrip()
    while True:
        m = PAUSE_RE.match(rest)
        if not m:
            break
        total += int(m.group(1))
        rest = rest[m.end() :]
    return total, rest.strip()


def extract_instruct(text: str) -> tuple[str | None, str]:
    lines = text.split("\n")
    if lines and INSTRUCT_RE.match(lines[0].strip()):
        instruct = INSTRUCT_RE.match(lines[0].strip()).group(1).strip()
        body = "\n".join(lines[1:]).strip()
        return instruct, body
    return None, text.strip()


def parse_cues(text: str) -> list[tuple[str, str, str | None, str | None]]:
    """Return list of (speaker, speakable_text, qwen_instruct|None, stableDialogueId|None)."""
    if "\n---\n" in text:
        text = text.split("\n---\n", 1)[1]
    cues: list[tuple[str, str, str | None, str | None]] = []
    pending_dialogue_id: str | None = None
    for chunk in re.split(r"\n\s*\n", text.strip()):
        chunk = chunk.strip()
        if not chunk or chunk.startswith("#"):
            continue
        if chunk.startswith("[Content continues") or chunk.startswith("[Note:"):
            continue
        id_match = DIALOGUE_ID_RE.match(chunk)
        if id_match:
            pending_dialogue_id = id_match.group(1).strip()
            rest = (id_match.group(2) or "").strip()
            if not rest:
                continue
            chunk = rest
        m = SPEAKER_RE.match(chunk)
        if not m:
            if pending_dialogue_id is not None:
                raise ValueError(
                    f"audience-dialogue-id {pending_dialogue_id!r} is not followed by a speaker cue"
                )
            cues.append(("Narrator", strip_ipa(chunk), None, None))
            continue
        speaker, body = m.group(1), strip_ipa(m.group(2).strip())
        instruct, spoken = extract_instruct(body)
        dialogue_id = pending_dialogue_id
        pending_dialogue_id = None
        if spoken:
            cues.append((speaker, spoken, instruct, dialogue_id))
    if pending_dialogue_id is not None:
        raise ValueError(
            f"audience-dialogue-id {pending_dialogue_id!r} is not followed by a speaker cue"
        )
    return cues


def silence(ms: int, sr: int) -> np.ndarray:
    return np.zeros(int(sr * ms / 1000.0), dtype=np.float32)


def resample_linear(wav: np.ndarray, src_sr: int, dst_sr: int) -> np.ndarray:
    if src_sr == dst_sr:
        return wav.astype(np.float32, copy=False)
    n_dst = int(round(len(wav) * dst_sr / src_sr))
    if n_dst <= 1:
        return np.zeros(1, dtype=np.float32)
    x_old = np.linspace(0.0, 1.0, num=len(wav), endpoint=False)
    x_new = np.linspace(0.0, 1.0, num=n_dst, endpoint=False)
    return np.interp(x_new, x_old, wav.astype(np.float64)).astype(np.float32)


def apply_dialogue_speed(wav: np.ndarray, speed: float) -> np.ndarray:
    """Kokoro-compatible speed: <1 slower, >1 faster. Pitch-preserving time stretch."""
    speed = float(speed)
    if speed <= 0.0 or abs(speed - 1.0) < 1e-3:
        return np.asarray(wav, dtype=np.float32).reshape(-1)
    import librosa

    y = np.asarray(wav, dtype=np.float32).reshape(-1)
    if y.size < 16:
        return y
    out = librosa.effects.time_stretch(y, rate=speed)
    return np.asarray(out, dtype=np.float32).reshape(-1)


def bootstrap_kokoro_cuda() -> Path | None:
    """Put PyTorch's bundled CUDA/cuDNN DLLs on PATH before importing onnxruntime."""
    try:
        import torch
    except ImportError:
        return None
    torch_lib = Path(torch.__file__).resolve().parent / "lib"
    if torch_lib.is_dir():
        os.environ["PATH"] = str(torch_lib) + os.pathsep + os.environ.get("PATH", "")
        os.environ.setdefault("ONNX_PROVIDER", "CUDAExecutionProvider")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(str(torch_lib))
            except OSError:
                pass
        return torch_lib
    return None


def load_kokoro(kokoro_cast: dict, *, allow_cpu: bool = False):
    torch_lib = bootstrap_kokoro_cuda()
    import torch  # noqa: F401
    import onnxruntime as ort
    from kokoro_onnx import Kokoro

    model_path = Path(kokoro_cast["model"]["path"])
    voices_path = Path(kokoro_cast["model"]["voices"])
    available = ort.get_available_providers()
    print(f"ORT providers available: {available}", flush=True)
    if torch_lib:
        print(f"CUDA DLL path: {torch_lib}", flush=True)
    if "CUDAExecutionProvider" not in available and not allow_cpu:
        raise RuntimeError(
            "CUDAExecutionProvider unavailable. Install onnxruntime-gpu (not onnxruntime CPU) "
            "and ensure CUDA DLLs are on PATH. Tip: do not install both packages."
        )
    providers: list = []
    if "CUDAExecutionProvider" in available:
        providers.append(
            (
                "CUDAExecutionProvider",
                {
                    "device_id": 0,
                    "arena_extend_strategy": "kSameAsRequested",
                    "gpu_mem_limit": 3 * 1024 * 1024 * 1024,
                    "cudnn_conv_algo_search": "HEURISTIC",
                    "do_copy_in_default_stream": True,
                },
            )
        )
    providers.append("CPUExecutionProvider")
    print(f"Loading Kokoro ONNX ({model_path.name}) …", flush=True)
    session = ort.InferenceSession(str(model_path), providers=providers)
    active = session.get_providers()
    if active[0] != "CUDAExecutionProvider" and not allow_cpu:
        raise RuntimeError(f"Kokoro CUDA EP failed: {active}")
    return Kokoro.from_session(session, str(voices_path)), active


def _set_config_tree_dtype(config, dtype) -> None:
    """Flash Attention 2 checks config.dtype (incl. nested subconfigs); set the whole tree."""
    config.dtype = dtype
    for key in getattr(config, "sub_configs", {}) or {}:
        sub = getattr(config, key, None)
        if sub is not None:
            _set_config_tree_dtype(sub, dtype)


def load_qwen_clone(qwen_cast: dict):
    import torch
    from transformers import AutoConfig
    from qwen_tts import Qwen3TTSModel
    from qwen_tts.core.models.configuration_qwen3_tts import Qwen3TTSConfig

    cache = Path(qwen_cast["models"]["cacheDir"])
    cache.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("HF_HOME", str(cache))
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(cache / "hub"))

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32
    model_id = qwen_cast["models"]["voiceClone"]
    print(f"Loading Qwen3-TTS Base clone on {device} ({dtype}) …", flush=True)
    kwargs = {"device_map": device if device.startswith("cuda") else "cpu", "dtype": dtype}

    AutoConfig.register("qwen3_tts", Qwen3TTSConfig)
    config = AutoConfig.from_pretrained(model_id)
    _set_config_tree_dtype(config, dtype)

    try:
        model = Qwen3TTSModel.from_pretrained(
            model_id,
            config=config,
            attn_implementation="flash_attention_2",
            **kwargs,
        )
        attn = getattr(getattr(model, "model", model).config, "_attn_implementation", None)
        print(f"Qwen attn_implementation={attn}", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"flash_attention_2 unavailable ({exc}); loading without it", flush=True)
        model = Qwen3TTSModel.from_pretrained(model_id, config=config, **kwargs)
    return model


def build_clone_prompts(
    qwen_model,
    qwen_cast: dict,
    *,
    whisper_model=None,
    force_whisper: bool = False,
) -> dict:
    """Build ICL prompts. Never x_vector_only — that erases Seed-VC prosody in ref_code."""
    selected = repo_path(qwen_cast["models"]["selectedDir"])
    cast_ref = str(qwen_cast.get("refText") or "").strip() or None
    gen = qwen_cast.get("generation") or {}
    x_only = bool(gen.get("x_vector_only", False))
    if x_only:
        print(
            "WARN: generation.x_vector_only=true requested; forcing false "
            "(ref_code required for prosody survival)",
            flush=True,
        )
        x_only = False

    prompts = {}
    for name, profile in qwen_cast["characters"].items():
        ref = profile.get("selectedRef")
        if not ref:
            continue
        path = repo_path(ref)
        if not path.is_file():
            alt = selected / f"{name}.wav"
            if alt.is_file():
                path = alt
            else:
                print(f"WARN: missing ref for {name}: {ref}", flush=True)
                continue

        per_char = str(profile.get("refText") or "").strip() or None
        if force_whisper and whisper_model is not None:
            ref_text = qwen_icl.whisper_transcribe(path, whisper_model)
            source = "whisper"
        else:
            ref_text, source = qwen_icl.resolve_ref_text(
                path,
                cast_ref_text=per_char or cast_ref,
                selected_dir=selected,
                whisper_model=whisper_model,
                allow_whisper=whisper_model is not None,
            )
        prompts[name] = qwen_model.create_voice_clone_prompt(
            ref_audio=str(path),
            ref_text=ref_text,
            x_vector_only_mode=x_only,
        )
        preview = ref_text[:60].replace("\n", " ")
        print(
            f"Clone prompt ready: {name} <- {path.name} "
            f"(ICL ref_text={source}: {preview!r}…)",
            flush=True,
        )
    return prompts


def resolve_generation(qwen_cast: dict) -> dict:
    """Merge cast generation with canonical ICL defaults (cast wins on explicit keys)."""
    defaults = qwen_icl.load_defaults()
    language = str(qwen_cast.get("language") or "English")
    base = qwen_icl.qwen_generation(defaults, language=language)
    gen = dict(qwen_cast.get("generation") or {})
    # Outline may raise max_new_tokens for long dialogue lines.
    out = {
        "temperature": float(gen.get("temperature", base["temperature"])),
        "top_p": float(gen.get("top_p", base["top_p"])),
        "top_k": int(gen.get("top_k", base["top_k"])),
        "max_new_tokens": int(gen.get("max_new_tokens", base.get("max_new_tokens", 3072))),
        "non_streaming_mode": bool(gen.get("non_streaming_mode", base["non_streaming_mode"])),
        "x_vector_only": False,
        "default_instruct": base["instruct"],
        "expressiveness_prefix": base.get("expressiveness_prefix") or "",
        "dialogue_speed": float(gen.get("dialogueSpeed", base.get("dialogue_speed", 1.0))),
        "dialogue_tail_ms": int(gen.get("dialogueTailMs", base.get("dialogue_tail_ms", 0))),
        "repetition_penalty": float(gen.get("repetition_penalty", base.get("repetition_penalty", 1.05))),
    }
    return out


def file_fingerprint(path: Path | None) -> str:
    """Stable short fingerprint of a voice ref (content-based)."""
    if path is None or not path.is_file():
        return "missing"
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest()[:16]


def content_hash(
    *,
    speaker: str,
    text: str,
    instruct: str | None,
    engine: str,
    voice_fp: str,
    gen: dict | None = None,
    kokoro_voice: str | None = None,
) -> str:
    payload = {
        "speaker": speaker,
        "text": text,
        "instruct": instruct or "",
        "engine": engine,
        "voice_fp": voice_fp,
        "kokoro_voice": kokoro_voice or "",
        "temp": (gen or {}).get("temperature"),
        "top_p": (gen or {}).get("top_p"),
        "top_k": (gen or {}).get("top_k"),
        "dialogue_speed": (gen or {}).get("dialogue_speed"),
        "dialogue_tail_ms": (gen or {}).get("dialogue_tail_ms"),
        "repetition_penalty": (gen or {}).get("repetition_penalty"),
        "max_new_tokens": (gen or {}).get("max_new_tokens"),
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def cue_id(cue_index: int, speaker: str, chash: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_-]+", "", speaker) or "spk"
    return f"{cue_index:05d}_{safe}_{chash}"


def load_index(chunks_dir: Path) -> dict:
    path = chunks_dir / INDEX_NAME
    if not path.is_file():
        return {"version": 1, "cues": []}
    return json.loads(path.read_text(encoding="utf-8"))


def save_index(chunks_dir: Path, index: dict) -> None:
    chunks_dir.mkdir(parents=True, exist_ok=True)
    (chunks_dir / INDEX_NAME).write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def assemble_from_index(index: dict, chunks_dir: Path, out_path: Path, *, target_sr: int) -> float:
    """Concatenate chunk WAVs; write MP3 (default) or WAV based on out_path suffix."""
    import shutil
    import subprocess
    import tempfile

    import soundfile as sf

    cues = index.get("cues") or []
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    want_mp3 = out_path.suffix.lower() == ".mp3"

    fd, tmp_name = tempfile.mkstemp(suffix=".wav", prefix="ld-assemble-")
    os.close(fd)
    tmp_wav = Path(tmp_name)
    samples_written = 0
    try:
        with sf.SoundFile(
            str(tmp_wav),
            mode="w",
            samplerate=target_sr,
            channels=1,
            subtype="PCM_16",
            format="WAV",
        ) as wav:
            for entry in cues:
                pre = int(entry.get("pre_silence_ms") or 0)
                if pre > 0:
                    block = silence(pre, target_sr)
                    wav.write(block)
                    samples_written += len(block)
                rel = entry.get("wav")
                if not rel:
                    continue
                path = chunks_dir / rel
                if not path.is_file():
                    raise FileNotFoundError(f"Missing chunk WAV: {path}")
                audio, sr = sf.read(str(path), dtype="float32")
                audio = np.asarray(audio, dtype=np.float32).reshape(-1)
                if int(sr) != target_sr:
                    audio = resample_linear(audio, int(sr), target_sr)
                wav.write(audio)
                samples_written += len(audio)

        if want_mp3:
            ffmpeg = shutil.which("ffmpeg")
            if not ffmpeg:
                raise RuntimeError("ffmpeg not found on PATH; required to assemble MP3")
            cmd = [
                ffmpeg,
                "-y",
                "-i",
                str(tmp_wav),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k",
                str(out_path),
            ]
            subprocess.run(cmd, check=True, capture_output=True)
        else:
            shutil.move(str(tmp_wav), str(out_path))
            tmp_wav = Path()  # moved; skip unlink
    finally:
        if tmp_wav.is_file():
            tmp_wav.unlink(missing_ok=True)

    return samples_written / float(target_sr)


def qwen_clone_with_instruct(
    model,
    text: str,
    language: str,
    voice_clone_prompt,
    instruct: str | None,
    *,
    non_streaming_mode: bool = True,
    **kwargs,
):
    """Clone + optional instruct_ids (supported by model.generate, not by public wrapper)."""
    import torch

    texts = [text]
    languages = [language]
    prompt_items = voice_clone_prompt
    if not isinstance(prompt_items, list):
        prompt_items = [prompt_items]
    if len(prompt_items) == 1 and len(texts) > 1:
        prompt_items = prompt_items * len(texts)

    voice_clone_prompt_dict = model._prompt_items_to_voice_clone_prompt(prompt_items)
    ref_texts_for_ids = [it.ref_text for it in prompt_items]

    input_ids = model._tokenize_texts([model._build_assistant_text(t) for t in texts])
    ref_ids = []
    for rt in ref_texts_for_ids:
        if not rt:
            ref_ids.append(None)
        else:
            ref_ids.append(model._tokenize_texts([model._build_ref_text(rt)])[0])

    instruct_ids = []
    if instruct:
        instruct_ids.append(model._tokenize_texts([model._build_instruct_text(instruct)])[0])
    else:
        instruct_ids.append(None)

    gen_kwargs = model._merge_generate_kwargs(**kwargs)
    talker_codes_list, _ = model.model.generate(
        input_ids=input_ids,
        ref_ids=ref_ids,
        instruct_ids=instruct_ids,
        voice_clone_prompt=voice_clone_prompt_dict,
        languages=languages,
        non_streaming_mode=non_streaming_mode,
        **gen_kwargs,
    )

    codes_for_decode = []
    for i, codes in enumerate(talker_codes_list):
        ref_code_list = voice_clone_prompt_dict.get("ref_code", None)
        if ref_code_list is not None and ref_code_list[i] is not None:
            codes_for_decode.append(torch.cat([ref_code_list[i].to(codes.device), codes], dim=0))
        else:
            codes_for_decode.append(codes)

    wavs_all, fs = model.model.speech_tokenizer.decode(
        [{"audio_codes": c} for c in codes_for_decode]
    )
    wavs_out = []
    for i, wav in enumerate(wavs_all):
        ref_code_list = voice_clone_prompt_dict.get("ref_code", None)
        if ref_code_list is not None and ref_code_list[i] is not None:
            ref_len = int(ref_code_list[i].shape[0])
            total_len = int(codes_for_decode[i].shape[0])
            cut = int(ref_len / max(total_len, 1) * wav.shape[0])
            wavs_out.append(wav[cut:])
        else:
            wavs_out.append(wav)
    return wavs_out[0].astype(np.float32), int(fs)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--lang",
        choices=("en", "es"),
        default="en",
        help="Pick default Qwen cast / output / chunks path (en or es).",
    )
    parser.add_argument("--script", type=Path, default=None)
    parser.add_argument("--kokoro-cast", type=Path, default=None)
    parser.add_argument("--qwen-cast", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument(
        "--chunks-dir",
        type=Path,
        default=None,
        help="Directory for per-cue WAVs + index.json (default: outline-chunks/{lang}).",
    )
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument(
        "--dialogue-only-limit",
        type=int,
        default=0,
        help="Stop after N newly synthesized Qwen dialogue cues",
    )
    parser.add_argument("--kokoro-cpu", action="store_true", help="Allow Kokoro on CPU if CUDA EP fails")
    parser.add_argument(
        "--whisper-ref-text",
        action="store_true",
        help="Force Whisper-medium transcription of each selected ref (ICL).",
    )
    parser.add_argument(
        "--assemble-only",
        action="store_true",
        help="Concatenate existing chunks from index.json; do not load TTS models.",
    )
    parser.add_argument(
        "--force-all",
        action="store_true",
        help="Regenerate every cue even when content_hash matches.",
    )
    parser.add_argument(
        "--force-speaker",
        action="append",
        default=[],
        metavar="NAME",
        help="Regenerate cues for this speaker (repeatable). Use after changing a voice ref.",
    )
    parser.add_argument(
        "--no-assemble",
        action="store_true",
        help="Synthesize/update chunks only; skip writing the assembled MP3/WAV.",
    )
    args = parser.parse_args()

    if args.qwen_cast is None:
        args.qwen_cast = DEFAULT_QWEN_CAST_ES if args.lang == "es" else DEFAULT_QWEN_CAST
    if args.kokoro_cast is None:
        args.kokoro_cast = DEFAULT_KOKORO_CAST_ES if args.lang == "es" else DEFAULT_KOKORO_CAST
    if args.out is None:
        args.out = DEFAULT_OUT_ES if args.lang == "es" else DEFAULT_OUT
    if args.script is None:
        args.script = DEFAULT_SCRIPT_ES if args.lang == "es" else DEFAULT_SCRIPT_EN
    if args.chunks_dir is None:
        args.chunks_dir = DEFAULT_CHUNKS_ROOT / args.lang

    target_sr = 24000
    chunks_dir: Path = args.chunks_dir
    audio_dir = chunks_dir / AUDIO_SUBDIR
    audio_dir.mkdir(parents=True, exist_ok=True)
    force_speakers = {s.strip() for s in args.force_speaker if s.strip()}

    if args.assemble_only:
        index = load_index(chunks_dir)
        if not index.get("cues"):
            raise SystemExit(f"No cues in {chunks_dir / INDEX_NAME}")
        minutes = assemble_from_index(index, chunks_dir, args.out, target_sr=target_sr) / 60.0
        print(f"Assembled {args.out} ({minutes:.1f} min) from {len(index['cues'])} chunks", flush=True)
        return 0

    kokoro_cast = json.loads(args.kokoro_cast.read_text(encoding="utf-8"))
    qwen_cast = json.loads(args.qwen_cast.read_text(encoding="utf-8"))
    defaults = kokoro_cast["defaults"]
    cast = kokoro_cast["cast"]
    gen = resolve_generation(qwen_cast)
    print(
        f"Qwen ICL generation: temp={gen['temperature']} top_p={gen['top_p']} "
        f"x_vector_only=false language={qwen_cast.get('language')}",
        flush=True,
    )
    print(f"Chunks dir: {chunks_dir}", flush=True)

    all_cues = parse_cues(args.script.read_text(encoding="utf-8"))
    cues = all_cues[args.start :]
    if args.limit:
        cues = cues[: args.limit]
    print(f"Cues: {len(cues)} (start={args.start}, total={len(all_cues)})", flush=True)

    # Voice fingerprints (invalidate dialogue when selected WAV changes).
    selected_dir = repo_path(qwen_cast["models"]["selectedDir"])
    voice_fps: dict[str, str] = {}
    for name, profile in qwen_cast.get("characters", {}).items():
        ref = profile.get("selectedRef")
        path = repo_path(ref) if ref else selected_dir / f"{name}.wav"
        if not path.is_file():
            path = selected_dir / f"{name}.wav"
        voice_fps[name] = file_fingerprint(path if path.is_file() else None)
    for name, profile in cast.items():
        # Kokoro voices: fingerprint by preset id + speed (no WAV).
        voice_fps.setdefault(
            name,
            hashlib.sha256(
                f"kokoro:{profile.get('voice')}:{profile.get('speed')}".encode()
            ).hexdigest()[:16],
        )

    whisper_model = None
    if args.whisper_ref_text:
        print("Loading Whisper medium for ICL ref_text …", flush=True)
        import whisper

        whisper_model = whisper.load_model("medium")

    kokoro, providers = load_kokoro(kokoro_cast, allow_cpu=args.kokoro_cpu)
    print(f"Kokoro ready on {providers[0]}", flush=True)
    qwen = load_qwen_clone(qwen_cast)
    prompts = build_clone_prompts(
        qwen,
        qwen_cast,
        whisper_model=whisper_model,
        force_whisper=args.whisper_ref_text,
    )

    import soundfile as sf

    prev_index = load_index(chunks_dir)
    prev_cues = list(prev_index.get("cues") or [])
    prev_by_index = {int(c["cue_index"]): c for c in prev_cues}
    # Prefer newest entry per content_hash so index shifts (insert/delete cues)
    # still reuse Kokoro narrator / unchanged dialogue WAVs.
    prev_by_hash: dict[str, dict] = {}
    for c in prev_cues:
        h = str(c.get("content_hash") or "")
        if h:
            prev_by_hash[h] = c

    def find_reusable(abs_i: int, speaker: str, chash: str) -> dict | None:
        if args.force_all or speaker in force_speakers:
            return None
        for candidate in (prev_by_index.get(abs_i), prev_by_hash.get(chash)):
            if not candidate:
                continue
            if candidate.get("content_hash") != chash:
                continue
            wav_rel = str(candidate.get("wav") or "")
            if wav_rel and (chunks_dir / wav_rel).is_file():
                return candidate
        return None

    args.out.parent.mkdir(parents=True, exist_ok=True)
    progress_path = args.out.with_suffix(".progress.json")
    log_path = args.out.with_suffix(".log")

    new_cues: list[dict] = []
    synth_s = 0.0
    dialogue_done = 0
    reused = 0
    regenerated = 0
    prev_was_dialogue = False

    for i, (speaker, text, instruct, stable_dialogue_id) in enumerate(cues, 1):
        abs_i = args.start + i
        pause_ms, text = extract_pause_ms(text)
        if not text and pause_ms <= 0:
            continue

        is_dialogue = bool(text) and text.lstrip().startswith(('"', "“"))
        use_qwen = speaker in prompts and is_dialogue
        if use_qwen and not stable_dialogue_id:
            raise SystemExit(
                f"Qwen dialogue cue {abs_i} ({speaker}) is missing audience-dialogue-id. "
                "Rebuild voices with npm run tts:audience:build."
            )

        if pause_ms > 0:
            pre_silence_ms = pause_ms
        elif i > 1 or args.start > 0:
            gap = defaults["pauseBeforeDialogueMs"] if is_dialogue else defaults["pauseBetweenChunksMs"]
            if prev_was_dialogue and not is_dialogue:
                gap = defaults["pauseAfterDialogueMs"]
            pre_silence_ms = gap
        else:
            pre_silence_ms = 0

        if not text:
            # Pause-only cue: tiny stub WAV; duration lives in pre_silence_ms.
            engine = "silence"
            voice_fp = "silence"
            chash = content_hash(
                speaker=speaker,
                text=f"silence:{pre_silence_ms}",
                instruct=None,
                engine=engine,
                voice_fp=voice_fp,
            )
            cid = cue_id(abs_i, speaker, chash)
            rel = f"{AUDIO_SUBDIR}/{cid}.wav"
            wav_path = chunks_dir / rel
            prev = find_reusable(abs_i, speaker, chash)
            if prev:
                rel = prev["wav"]
                reused += 1
            else:
                sf.write(str(wav_path), silence(1, target_sr), target_sr)
                regenerated += 1
            new_cues.append(
                {
                    "cue_index": abs_i,
                    "id": cid,
                    "speaker": speaker,
                    "engine": engine,
                    "pre_silence_ms": pre_silence_ms,
                    "text": "",
                    "instruct": None,
                    "content_hash": chash,
                    "voice_fingerprint": voice_fp,
                    "wav": rel,
                    "seconds": 0.0,
                    "stableDialogueId": None,
                }
            )
            prev_was_dialogue = False
            continue

        spoken = text.strip()
        if use_qwen and (
            (spoken.startswith('"') and spoken.endswith('"'))
            or (spoken.startswith("“") and spoken.endswith("”"))
        ):
            spoken = spoken[1:-1]

        engine = "qwen-clone" if use_qwen else "kokoro"
        if use_qwen:
            line_instruct = qwen_icl.compose_instruct(
                instruct,
                default_instruct=gen["default_instruct"],
                expressiveness_prefix=str(gen.get("expressiveness_prefix") or ""),
            )
        else:
            line_instruct = instruct
        if use_qwen:
            voice_fp = voice_fps.get(speaker, "missing")
            kokoro_voice = None
        else:
            profile = cast.get(speaker) or cast["Narrator"]
            voice_fp = voice_fps.get(speaker) or voice_fps["Narrator"]
            kokoro_voice = str(profile.get("voice"))

        chash = content_hash(
            speaker=speaker,
            text=spoken if use_qwen else text,
            instruct=line_instruct if use_qwen else None,
            engine=engine,
            voice_fp=voice_fp,
            gen=gen if use_qwen else None,
            kokoro_voice=kokoro_voice,
        )
        cid = cue_id(abs_i, speaker, chash)
        rel = f"{AUDIO_SUBDIR}/{cid}.wav"
        wav_path = chunks_dir / rel
        prev = find_reusable(abs_i, speaker, chash)
        can_reuse = prev is not None

        t1 = time.time()
        if can_reuse:
            rel = str(prev["wav"])
            wav_path = chunks_dir / rel
            audio, sr = sf.read(str(wav_path), dtype="float32")
            samples = np.asarray(audio, dtype=np.float32).reshape(-1)
            if int(sr) != target_sr:
                samples = resample_linear(samples, int(sr), target_sr)
            elapsed = 0.0
            reused += 1
            engine_label = f"{engine}-reuse"
        else:
            try:
                if use_qwen:
                    samples, sr = qwen_clone_with_instruct(
                        qwen,
                        text=spoken,
                        language=qwen_cast.get("language", "English"),
                        voice_clone_prompt=prompts[speaker],
                        instruct=line_instruct,
                        non_streaming_mode=gen["non_streaming_mode"],
                        temperature=gen["temperature"],
                        top_p=gen["top_p"],
                        top_k=gen["top_k"],
                        max_new_tokens=gen["max_new_tokens"],
                        repetition_penalty=gen.get("repetition_penalty", 1.05),
                    )
                    dialogue_done += 1
                else:
                    profile = cast.get(speaker) or cast["Narrator"]
                    samples, sr = kokoro.create(
                        text,
                        voice=profile["voice"],
                        speed=float(profile.get("speed", defaults["narratorSpeed"])),
                        lang=profile["lang"],
                    )
                    samples = np.asarray(samples, dtype=np.float32)
            except Exception as exc:  # noqa: BLE001
                print(f"[{abs_i}] FAIL {speaker}/{engine}: {exc}", file=sys.stderr, flush=True)
                profile = cast["Narrator"]
                samples, sr = kokoro.create(
                    text,
                    voice=profile["voice"],
                    speed=float(profile["speed"]),
                    lang=profile["lang"],
                )
                samples = np.asarray(samples, dtype=np.float32)
                engine = "kokoro-fallback"
                speaker = f"{speaker}*"
            samples = np.asarray(samples, dtype=np.float32).reshape(-1)
            samples = resample_linear(samples, int(sr), target_sr)
            if use_qwen:
                samples = apply_dialogue_speed(samples, float(gen.get("dialogue_speed", 1.0)))
                tail_ms = int(gen.get("dialogue_tail_ms") or 0)
                if tail_ms > 0:
                    samples = np.concatenate([samples, silence(tail_ms, target_sr)])
            samples = np.clip(samples * 0.92, -1.0, 1.0)
            sf.write(str(wav_path), samples, target_sr)
            elapsed = time.time() - t1
            synth_s += elapsed
            regenerated += 1
            engine_label = engine

        dur = len(samples) / target_sr
        new_cues.append(
            {
                "cue_index": abs_i,
                "id": cid,
                "speaker": speaker.rstrip("*"),
                "engine": engine,
                "pre_silence_ms": pre_silence_ms,
                "text": spoken if use_qwen else text,
                "instruct": line_instruct if use_qwen else None,
                "content_hash": chash,
                "voice_fingerprint": voice_fp,
                "wav": rel,
                "seconds": round(dur, 3),
                "stableDialogueId": stable_dialogue_id if use_qwen else None,
            }
        )
        prev_was_dialogue = is_dialogue

        if i == 1 or i % 25 == 0 or use_qwen or i == len(cues) or not can_reuse:
            safe = text.encode("ascii", "replace").decode("ascii")
            line = (
                f"[{abs_i}/{len(all_cues)}] {speaker} {engine_label} "
                f"audio={dur:.1f}s synth={elapsed:.2f}s | {safe[:56]!r}"
            )
            if instruct:
                line += f" | instruct={instruct[:40]!r}…"
            print(line, flush=True)
            with log_path.open("a", encoding="utf-8") as log:
                log.write(line + "\n")
            progress_path.write_text(
                json.dumps(
                    {
                        "done": abs_i,
                        "total": len(all_cues),
                        "dialogue_done": dialogue_done,
                        "reused": reused,
                        "regenerated": regenerated,
                        "chunks_dir": str(chunks_dir),
                        "out": str(args.out),
                    },
                    indent=2,
                ),
                encoding="utf-8",
            )

        if args.dialogue_only_limit and dialogue_done >= args.dialogue_only_limit:
            print(f"Stopping after {dialogue_done} new dialogue cues (--dialogue-only-limit)", flush=True)
            # Keep previously indexed cues after the stop point if present.
            for old in prev_index.get("cues") or []:
                if int(old["cue_index"]) > abs_i:
                    new_cues.append(old)
            break

        if i % 20 == 0:
            try:
                import gc
                import torch

                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except Exception:
                pass

    index = {
        "version": 1,
        "lang": args.lang,
        "script": str(args.script),
        "sample_rate": target_sr,
        "qwen_cast": str(args.qwen_cast),
        "kokoro_cast": str(args.kokoro_cast),
        "cues": new_cues,
        "stats": {
            "reused": reused,
            "regenerated": regenerated,
            "dialogue_synthesized": dialogue_done,
            "synth_wall_s": round(synth_s, 1),
        },
    }
    save_index(chunks_dir, index)
    print(
        f"Index written: {chunks_dir / INDEX_NAME} "
        f"(reused={reused}, regenerated={regenerated}, dialogue_new={dialogue_done})",
        flush=True,
    )

    if not args.no_assemble:
        minutes = assemble_from_index(index, chunks_dir, args.out, target_sr=target_sr) / 60.0
        print(f"Assembled {args.out} ({minutes:.1f} min)", flush=True)
        progress_path.write_text(
            json.dumps(
                {
                    "complete": True,
                    "out": str(args.out),
                    "chunks_dir": str(chunks_dir),
                    "dialogue_done": dialogue_done,
                    "reused": reused,
                    "regenerated": regenerated,
                    "minutes": minutes,
                },
                indent=2,
            ),
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
