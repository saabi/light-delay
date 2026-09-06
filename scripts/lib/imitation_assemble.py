"""GPU-free assemble: overlay resolver, 24 kHz concat, ffmpeg MP3, atomic replace."""

from __future__ import annotations

import shutil
import struct
import subprocess
import tempfile
import uuid
import wave
from pathlib import Path
from typing import Any, Callable

from lib.imitation_overlay import OverlayError, OverlayStore, atomic_write_bytes, wav_duration_seconds

CANONICAL_MP3_NAMES = frozenset(
    {
        "light-delay-audience-dual-es.mp3",
        "light-delay-audience-dual-en.mp3",
    }
)


class AssembleError(OverlayError):
    """Assemble failed without touching the canonical dual."""


def pcm16_frames(path: Path) -> tuple[int, int, bytes]:
    with wave.open(str(path), "rb") as fh:
        channels = fh.getnchannels()
        width = fh.getsampwidth()
        rate = fh.getframerate()
        frames = fh.readframes(fh.getnframes())
    if width != 2:
        raise AssembleError(f"Only PCM16 WAV is supported for assemble, got {path}")
    if channels == 2:
        frames = _stereo_to_mono(frames)
        channels = 1
    elif channels != 1:
        raise AssembleError(f"Unsupported channel count {channels} in {path}")
    return rate, channels, frames


def _stereo_to_mono(frames: bytes) -> bytes:
    samples = memoryview(frames).cast("h")
    out = bytearray()
    for i in range(0, len(samples), 2):
        left = samples[i]
        right = samples[i + 1] if i + 1 < len(samples) else left
        mixed = int((int(left) + int(right)) / 2)
        out.extend(struct.pack("<h", max(-32768, min(32767, mixed))))
    return bytes(out)


def unpack_pcm16(frames: bytes) -> list[int]:
    return list(struct.unpack("<" + "h" * (len(frames) // 2), frames))


def pack_pcm16(samples: list[int]) -> bytes:
    return struct.pack("<" + "h" * len(samples), *[max(-32768, min(32767, int(s))) for s in samples])


def resample_linear(samples: list[int], src_sr: int, dst_sr: int) -> list[int]:
    if src_sr == dst_sr or not samples:
        return list(samples)
    n_out = max(1, int(round(len(samples) * dst_sr / src_sr)))
    if len(samples) == 1:
        return samples * n_out
    out: list[int] = []
    last = len(samples) - 1
    scale = last / (n_out - 1) if n_out > 1 else 0.0
    for i in range(n_out):
        x = i * scale
        j = int(x)
        frac = x - j
        a = samples[j]
        b = samples[min(j + 1, last)]
        out.append(int(round(a + (b - a) * frac)))
    return out


def silence_pcm16(milliseconds: int, sample_rate: int) -> bytes:
    n = max(0, int(round(sample_rate * milliseconds / 1000.0)))
    return b"\x00\x00" * n


def load_pcm16_at_rate(path: Path, target_sr: int) -> bytes:
    rate, _channels, frames = pcm16_frames(path)
    if rate == target_sr:
        return frames
    return pack_pcm16(resample_linear(unpack_pcm16(frames), rate, target_sr))


def write_wav_pcm16(path: Path, sample_rate: int, frames: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as fh:
        fh.setnchannels(1)
        fh.setsampwidth(2)
        fh.setframerate(sample_rate)
        fh.writeframes(frames)


def ffmpeg_binary() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        raise AssembleError("ffmpeg not found on PATH")
    return exe


def encode_mp3(wav_path: Path, mp3_path: Path, *, ffmpeg: str | None = None) -> None:
    binary = ffmpeg if ffmpeg is not None else ffmpeg_binary()
    if not str(binary).strip():
        raise AssembleError("ffmpeg not found on PATH")
    cmd = [
        binary,
        "-y",
        "-i",
        str(wav_path),
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        str(mp3_path),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise AssembleError("ffmpeg not found on PATH") from exc
    except OSError as exc:
        raise AssembleError("ffmpeg not found on PATH") from exc
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or "").strip()
        raise AssembleError(f"ffmpeg failed: {detail or exc}") from exc


def assert_not_canonical(dest: Path) -> None:
    if dest.name in CANONICAL_MP3_NAMES:
        raise AssembleError(f"Refusing to overwrite canonical dual {dest.name}")


def concat_cues(
    cues: list[dict[str, Any]],
    *,
    resolve_wav: Callable[[dict[str, Any]], Path],
    sample_rate: int,
) -> bytes:
    chunks: list[bytes] = []
    for cue in cues:
        pre = int(cue.get("pre_silence_ms") or 0)
        if pre > 0:
            chunks.append(silence_pcm16(pre, sample_rate))
        rel = cue.get("wav")
        if not rel:
            continue
        path = resolve_wav(cue)
        if not path.is_file():
            raise AssembleError(f"Missing cue WAV for {cue.get('id')}")
        chunks.append(load_pcm16_at_rate(path, sample_rate))
    return b"".join(chunks)


def assemble_output(
    *,
    output_row: dict[str, Any],
    index: dict[str, Any],
    chunks_dir: Path,
    overlay: OverlayStore,
    dest: Path,
    fingerprints: dict[str, dict[str, str]],
    ffmpeg: str | None = None,
) -> dict[str, Any]:
    dest = Path(dest)
    assert_not_canonical(dest)
    sample_rate = int(output_row.get("expectedSampleRate") or index.get("sample_rate") or 24000)
    output_id = str(output_row["id"])
    cues = list(index.get("cues") or [])

    def resolve_wav(cue: dict[str, Any]) -> Path:
        cue_id = str(cue.get("id") or "")
        original = chunks_dir / str(cue.get("wav") or "")
        fingerprint = fingerprints[cue_id]
        dialogue_key = str(cue.get("stableDialogueId") or cue.get("stable_dialogue_id") or "") or None
        path, _kind, _status = overlay.resolve_effective_wav(
            output_id=output_id,
            dialogue_key=dialogue_key,
            original_wav=original,
            current_fingerprint=fingerprint,
        )
        return path

    frames = concat_cues(cues, resolve_wav=resolve_wav, sample_rate=sample_rate)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="imitation-assemble-") as tmp:
        tmp_dir = Path(tmp)
        wav_path = tmp_dir / "assembled.wav"
        mp3_tmp = tmp_dir / f"assembled-{uuid.uuid4().hex}.mp3"
        write_wav_pcm16(wav_path, sample_rate, frames)
        encode_mp3(wav_path, mp3_tmp, ffmpeg=ffmpeg)
        atomic_write_bytes(dest, mp3_tmp.read_bytes())
    duration = len(frames) / 2 / float(sample_rate)
    return {
        "outputId": output_id,
        "assembledKey": output_row.get("assembledKey"),
        "cueCount": len(cues),
        "sampleRate": sample_rate,
        "durationSec": round(duration, 3),
        "bytes": dest.stat().st_size,
    }


def effective_seconds(
    *,
    original_wav: Path,
    overlay: OverlayStore,
    output_id: str,
    dialogue_key: str | None,
    current_fingerprint: dict[str, str],
) -> float:
    path, _kind, status = overlay.resolve_effective_wav(
        output_id=output_id,
        dialogue_key=dialogue_key,
        original_wav=original_wav,
        current_fingerprint=current_fingerprint,
    )
    if status and status.get("stale"):
        path = original_wav
    return round(wav_duration_seconds(path), 3)
