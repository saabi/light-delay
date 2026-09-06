"""Versioned imitation takes keyed by stable audience dialogue id."""

from __future__ import annotations

import hashlib
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lib.imitation_catalog import looks_absolute_or_traversal
from lib.seedvc_imitation import ImitationError, file_sha256

SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
# Validity for Accept / stale: dialogue content identity, not chunk index or Qwen WAV bytes.
FINGERPRINT_KEYS = (
    "contentHash",
    "speaker",
    "language",
    "engine",
)
REPLACEMENTS_SCHEMA = "1.1.0"


class OverlayError(ImitationError):
    """Overlay path or pointer error."""


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def atomic_write_bytes(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        tmp.write_bytes(payload)
        os.replace(tmp, path)
    finally:
        if tmp.is_file():
            tmp.unlink(missing_ok=True)


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    atomic_write_bytes(path, text.encode("utf-8"))


def index_hash(index_path: Path) -> str:
    return file_sha256(index_path)


def safe_segment(value: str, *, kind: str) -> str:
    text = unquote_segment(value)
    if not text or not SAFE_SEGMENT.match(text) or ".." in text:
        raise OverlayError(f"Invalid {kind}")
    return text


def unquote_segment(value: str) -> str:
    from urllib.parse import unquote

    return unquote(value or "").strip()


def safe_cue_key(cue_id: str) -> str:
    """Legacy filesystem key for cue-indexed overlays (migration / tests)."""
    raw = unquote_segment(cue_id)
    if not raw or looks_absolute_or_traversal(raw) or "/" in raw or "\\" in raw:
        raise OverlayError("Invalid cue id")
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:8]
    slug = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")[:48] or "cue"
    return f"{slug}--{digest}"


def safe_dialogue_key(dialogue_id: str) -> str:
    raw = unquote_segment(dialogue_id)
    if not raw or looks_absolute_or_traversal(raw) or "/" in raw or "\\" in raw:
        raise OverlayError("Invalid stable dialogue id")
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:8]
    slug = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")[:48] or "dialogue"
    return f"{slug}--{digest}"


def dialogue_key_for_cue(cue: dict[str, Any], *, require: bool = True) -> str | None:
    key = str(cue.get("stableDialogueId") or cue.get("stable_dialogue_id") or "").strip()
    if key:
        return key
    if require:
        raise OverlayError(
            "stableDialogueId required for recordable cue; "
            "run scripts/backfill-audience-stable-dialogue-ids.py or rebuild the dual"
        )
    return None


def new_take_id() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    return f"take-{stamp}-{uuid.uuid4().hex[:8]}"


def cue_fingerprint(
    cue: dict[str, Any],
    *,
    lang: str,
    original_wav: Path,
) -> dict[str, str]:
    """Full fingerprint for metadata; only FINGERPRINT_KEYS affect stale/accept."""
    return {
        "cueId": str(cue.get("id") or ""),
        "stableDialogueId": str(cue.get("stableDialogueId") or cue.get("stable_dialogue_id") or ""),
        "contentHash": str(cue.get("content_hash") or ""),
        "originalWavSha256": file_sha256(original_wav),
        "speaker": str(cue.get("speaker") or ""),
        "language": lang,
        "engine": str(cue.get("engine") or ""),
    }


def fingerprints_match(left: dict[str, Any] | None, right: dict[str, Any] | None) -> bool:
    if not isinstance(left, dict) or not isinstance(right, dict):
        return False
    return all(str(left.get(key) or "") == str(right.get(key) or "") for key in FINGERPRINT_KEYS)


def wav_duration_seconds(path: Path) -> float:
    import wave

    with wave.open(str(path), "rb") as fh:
        frames = fh.getnframes()
        rate = fh.getframerate() or 1
        return frames / float(rate)


class OverlayStore:
    def __init__(self, imitation_root: Path) -> None:
        self.root = Path(imitation_root) / "overlays"

    def output_dir(self, output_id: str) -> Path:
        return self.root / safe_segment(output_id, kind="output id")

    def replacements_path(self, output_id: str) -> Path:
        return self.output_dir(output_id) / "replacements.json"

    def dialogue_dir(self, output_id: str, dialogue_key: str) -> Path:
        return self.output_dir(output_id) / safe_dialogue_key(dialogue_key)

    def takes_dir(self, output_id: str, dialogue_key: str) -> Path:
        return self.dialogue_dir(output_id, dialogue_key) / "takes"

    def take_dir(self, output_id: str, dialogue_key: str, take_id: str) -> Path:
        return self.takes_dir(output_id, dialogue_key) / safe_segment(take_id, kind="take id")

    # Legacy aliases used by migration.
    def cue_dir(self, output_id: str, cue_id: str) -> Path:
        return self.output_dir(output_id) / safe_cue_key(cue_id)

    def load_replacements(self, output_id: str) -> dict[str, Any]:
        path = self.replacements_path(output_id)
        if not path.is_file():
            return {"schemaVersion": REPLACEMENTS_SCHEMA, "cues": {}}
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise OverlayError("replacements.json is invalid")
        cues = data.get("cues")
        if not isinstance(cues, dict):
            data["cues"] = {}
        return data

    def save_replacements(self, output_id: str, payload: dict[str, Any]) -> None:
        payload = dict(payload)
        payload["schemaVersion"] = REPLACEMENTS_SCHEMA
        atomic_write_json(self.replacements_path(output_id), payload)

    def pointer_for(self, output_id: str, dialogue_key: str) -> dict[str, Any] | None:
        cues = self.load_replacements(output_id).get("cues") or {}
        row = cues.get(dialogue_key)
        return row if isinstance(row, dict) else None

    def list_takes(self, output_id: str, dialogue_key: str) -> list[dict[str, Any]]:
        root = self.takes_dir(output_id, dialogue_key)
        if not root.is_dir():
            return []
        rows: list[dict[str, Any]] = []
        for child in sorted(root.iterdir()):
            meta_path = child / "metadata.json"
            if not child.is_dir() or not meta_path.is_file():
                continue
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            if isinstance(meta, dict):
                rows.append(meta)
        rows.sort(key=lambda row: str(row.get("createdAt") or ""))
        return rows

    def read_take_metadata(self, output_id: str, dialogue_key: str, take_id: str) -> dict[str, Any]:
        path = self.take_dir(output_id, dialogue_key, take_id) / "metadata.json"
        if not path.is_file():
            raise OverlayError(f"Unknown take {take_id}")
        meta = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(meta, dict):
            raise OverlayError(f"Invalid take metadata {take_id}")
        return meta

    def take_converted_wav(self, output_id: str, dialogue_key: str, take_id: str) -> Path:
        path = self.take_dir(output_id, dialogue_key, take_id) / "converted.wav"
        if not path.is_file():
            raise OverlayError(f"Missing converted audio for {take_id}")
        return path

    def take_source_wav(self, output_id: str, dialogue_key: str, take_id: str) -> Path:
        path = self.take_dir(output_id, dialogue_key, take_id) / "source.wav"
        if not path.is_file():
            raise OverlayError(f"Missing source audio for {take_id}")
        return path

    def find_take_converted_wav(self, output_id: str, take_id: str) -> tuple[Path, str]:
        """Locate a take under any dialogue folder for this output."""
        root = self.output_dir(output_id)
        if not root.is_dir():
            raise OverlayError(f"Unknown take {take_id}")
        wanted = safe_segment(take_id, kind="take id")
        for child in root.iterdir():
            if not child.is_dir():
                continue
            candidate = child / "takes" / wanted / "converted.wav"
            if candidate.is_file():
                meta_path = child / "takes" / wanted / "metadata.json"
                dialogue_key = ""
                if meta_path.is_file():
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                    dialogue_key = str(
                        meta.get("stableDialogueId") or meta.get("dialogueKey") or ""
                    )
                return candidate, dialogue_key
        raise OverlayError(f"Unknown take {take_id}")

    def write_take(
        self,
        *,
        output_id: str,
        cue: dict[str, Any],
        fingerprint: dict[str, str],
        index_hash_value: str,
        source_wav: Path,
        converted_wav: Path,
        settings: dict[str, Any],
        take_id: str | None = None,
    ) -> dict[str, Any]:
        dialogue_key = dialogue_key_for_cue(cue, require=True)
        assert dialogue_key is not None
        cue_id = str(cue.get("id") or "")
        allocated = take_id or new_take_id()
        dest = self.take_dir(output_id, dialogue_key, allocated)
        dest.mkdir(parents=True, exist_ok=True)
        source_dest = dest / "source.wav"
        converted_dest = dest / "converted.wav"
        source_dest.write_bytes(Path(source_wav).read_bytes())
        converted_dest.write_bytes(Path(converted_wav).read_bytes())
        duration = wav_duration_seconds(converted_dest)
        meta = {
            "takeId": allocated,
            "outputId": output_id,
            "cueId": cue_id,
            "stableDialogueId": dialogue_key,
            "dialogueKey": dialogue_key,
            "indexHash": index_hash_value,
            "fingerprint": fingerprint,
            "contentHash": fingerprint["contentHash"],
            "originalWavSha256": fingerprint.get("originalWavSha256") or "",
            "speaker": fingerprint["speaker"],
            "language": fingerprint["language"],
            "engine": fingerprint["engine"],
            "settings": settings,
            "sourceSha256": file_sha256(source_dest),
            "convertedSha256": file_sha256(converted_dest),
            "durationSec": round(duration, 3),
            "createdAt": utc_now(),
        }
        atomic_write_json(dest / "metadata.json", meta)
        return meta

    def accept(
        self,
        *,
        output_id: str,
        dialogue_key: str,
        take_id: str,
        current_fingerprint: dict[str, str],
        index_hash_value: str,
    ) -> dict[str, Any]:
        meta = self.read_take_metadata(output_id, dialogue_key, take_id)
        stored = meta.get("fingerprint") if isinstance(meta.get("fingerprint"), dict) else meta
        if not fingerprints_match(stored, current_fingerprint):
            raise OverlayError("Take is stale for this dialogue; record a new take")
        before = (self.take_dir(output_id, dialogue_key, take_id) / "metadata.json").read_bytes()
        payload = self.load_replacements(output_id)
        cues = payload.setdefault("cues", {})
        cues[dialogue_key] = {
            "takeId": take_id,
            "fingerprint": {key: current_fingerprint.get(key, "") for key in FINGERPRINT_KEYS},
            "acceptedAt": utc_now(),
            "indexHash": index_hash_value,
            "stableDialogueId": dialogue_key,
        }
        self.save_replacements(output_id, payload)
        after = (self.take_dir(output_id, dialogue_key, take_id) / "metadata.json").read_bytes()
        if after != before:
            raise OverlayError("Take metadata must remain immutable after convert")
        return cues[dialogue_key]

    def restore(self, output_id: str, dialogue_key: str) -> None:
        payload = self.load_replacements(output_id)
        cues = payload.setdefault("cues", {})
        if dialogue_key in cues:
            del cues[dialogue_key]
            self.save_replacements(output_id, payload)

    def replacement_status(
        self,
        *,
        output_id: str,
        dialogue_key: str | None,
        current_fingerprint: dict[str, str],
    ) -> dict[str, Any] | None:
        if not dialogue_key:
            return None
        pointer = self.pointer_for(output_id, dialogue_key)
        if not pointer:
            return None
        take_id = str(pointer.get("takeId") or "")
        stored = pointer.get("fingerprint") if isinstance(pointer.get("fingerprint"), dict) else {}
        stale = not fingerprints_match(stored, current_fingerprint)
        if not stale:
            try:
                meta = self.read_take_metadata(output_id, dialogue_key, take_id)
                stale = not fingerprints_match(meta.get("fingerprint"), current_fingerprint)
            except OverlayError:
                stale = True
        return {
            "status": "stale" if stale else "accepted",
            "takeId": take_id,
            "acceptedAt": pointer.get("acceptedAt"),
            "indexHash": pointer.get("indexHash"),
            "stale": stale,
            "stableDialogueId": dialogue_key,
        }

    def resolve_effective_wav(
        self,
        *,
        output_id: str,
        dialogue_key: str | None,
        original_wav: Path,
        current_fingerprint: dict[str, str],
    ) -> tuple[Path, str, dict[str, Any] | None]:
        status = self.replacement_status(
            output_id=output_id,
            dialogue_key=dialogue_key,
            current_fingerprint=current_fingerprint,
        )
        if status and not status["stale"] and dialogue_key:
            take_id = str(status["takeId"])
            return self.take_converted_wav(output_id, dialogue_key, take_id), take_id, status
        return Path(original_wav), "original", status
