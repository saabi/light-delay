"""Shared Qwen ICL + Seed-VC V2 defaults for Light Delay voice pipelines."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULTS_PATH = ROOT / "docs" / "wip" / "qwen-icl-clone-defaults.json"


def load_defaults(path: Path | None = None) -> dict:
    p = path or DEFAULTS_PATH
    return json.loads(p.read_text(encoding="utf-8"))


def qwen_generation(defaults: dict | None = None, *, language: str = "English") -> dict:
    """Return kwargs-ready generation settings for clone + optional instruct."""
    d = defaults or load_defaults()
    q = d["qwen"]
    lang_key = "es" if language.lower().startswith("span") else "en"
    instruct = q["instruct"][lang_key]
    prefix_cfg = q.get("expressivenessPrefix")
    if isinstance(prefix_cfg, dict):
        prefix = str(prefix_cfg.get(lang_key) or prefix_cfg.get("en") or "").strip()
    else:
        prefix = str(prefix_cfg or "").strip()
    speed_cfg = q.get("dialogueSpeed")
    if isinstance(speed_cfg, dict):
        dialogue_speed = float(speed_cfg.get(lang_key, speed_cfg.get("en", 1.0)))
    elif speed_cfg is None:
        dialogue_speed = 1.0
    else:
        dialogue_speed = float(speed_cfg)
    return {
        "x_vector_only": bool(q["x_vector_only"]),
        "temperature": float(q["temperature"]),
        "top_p": float(q["top_p"]),
        "top_k": int(q["top_k"]),
        "max_new_tokens": int(q["max_new_tokens"]),
        "max_out_seconds": float(q["max_out_seconds"]),
        "non_streaming_mode": bool(q["non_streaming_mode"]),
        "instruct": instruct,
        "expressiveness_prefix": prefix,
        "dialogue_speed": dialogue_speed,
        "dialogue_tail_ms": int(q.get("dialogueTailMs") or 0),
        "repetition_penalty": float(q.get("repetition_penalty") or 1.05),
    }


def compose_instruct(
    line_instruct: str | None,
    *,
    default_instruct: str,
    expressiveness_prefix: str = "",
) -> str:
    """Merge default/prefix expressiveness with an optional per-line performance note."""
    line = (line_instruct or "").strip()
    default = (default_instruct or "").strip()
    prefix = (expressiveness_prefix or "").strip()
    if not line:
        return default or prefix
    if not prefix:
        return line
    if prefix.lower() in line.lower():
        return line
    return f"{prefix} {line}"


def seedvc_v2_opts(defaults: dict | None = None) -> dict:
    d = defaults or load_defaults()
    vc = dict(d["seedVcV2"])
    vc.pop("note", None)
    vc.setdefault("ar_checkpoint_path", None)
    vc.setdefault("cfm_checkpoint_path", None)
    return vc


def resolve_ref_text(
    ref_audio: Path,
    *,
    cast_ref_text: str | None = None,
    selected_dir: Path | None = None,
    whisper_model=None,
    allow_whisper: bool = True,
) -> tuple[str, str]:
    """Return (ref_text, source_tag) for ICL.

    Prefer an accurate transcript of *this* WAV. Shared cast phrases only apply when
    the curated sample was generated from REF_TEXT.txt / cast.refText.
    """
    stem_whisper = ref_audio.with_name(ref_audio.stem + "_whisper.txt")
    if stem_whisper.is_file():
        text = stem_whisper.read_text(encoding="utf-8").strip()
        if text:
            return text, "sidecar_whisper"

    plain = ref_audio.with_suffix(".txt")
    if plain.is_file():
        text = plain.read_text(encoding="utf-8").strip()
        if text:
            return text, "sidecar_txt"

    if selected_dir is not None:
        shared = selected_dir / "REF_TEXT.txt"
        if shared.is_file():
            text = shared.read_text(encoding="utf-8").strip()
            if text:
                return text, "selected_REF_TEXT"

    if cast_ref_text and cast_ref_text.strip():
        # VoiceDesign / curated samples that speak the cast phrase.
        return cast_ref_text.strip(), "cast_refText"

    if allow_whisper and whisper_model is not None:
        return whisper_transcribe(ref_audio, whisper_model), "whisper"

    raise RuntimeError(f"No usable ICL ref_text for {ref_audio}")


def donor_json_text(donor_wav: Path | None) -> str | None:
    """Optional LibriVox/FLEURS transcript beside the native donor WAV."""
    if donor_wav is None:
        return None
    meta = donor_wav.with_suffix(".json")
    if not meta.is_file():
        return None
    data = json.loads(meta.read_text(encoding="utf-8"))
    text = str(data.get("text") or "").strip()
    return text or None


def whisper_transcribe(
    path: Path,
    model,
    *,
    language: str | None = None,
    fallback_text: str | None = None,
) -> str:
    """Transcribe a reference WAV for ICL ref_text (any language)."""
    attempts = [
        dict(fp16=True, verbose=False, condition_on_previous_text=False),
        dict(fp16=True, verbose=False, condition_on_previous_text=False, temperature=0.0),
        dict(
            fp16=True,
            verbose=False,
            condition_on_previous_text=False,
            task="transcribe",
            temperature=(0.0, 0.2, 0.4),
        ),
    ]
    if language:
        attempts = [{**a, "language": language} for a in attempts] + attempts
    last_err = None
    for kwargs in attempts:
        try:
            result = model.transcribe(str(path), **kwargs)
            text = str(result.get("text") or "").strip()
            if text:
                return text
        except Exception as exc:  # noqa: BLE001
            last_err = exc
    if fallback_text and fallback_text.strip():
        return fallback_text.strip()
    raise RuntimeError(
        f"empty Whisper transcript for {path}" + (f" ({last_err})" if last_err else "")
    )
