"""Logical audio-output catalog: identity only, no machine paths."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "data" / "production" / "audio" / "audio-outputs.json"
MASTER_OUTLINE_PATH = ROOT / "data" / "outlines" / "light-delay-master-narrative.json"
OUTLINE_PATHS = {
    "outline:light-delay-master-narrative": MASTER_OUTLINE_PATH,
    "outline:light-delay-festival-master": ROOT
    / "data"
    / "outlines"
    / "light-delay-festival-master.json",
}

ABS_OR_TRAVERSAL = re.compile(r"(?:^[A-Za-z]:)|(?:^[\\/])|(?:\.\.)")


class CatalogError(ValueError):
    """Invalid or missing catalog row."""


def looks_absolute_or_traversal(value: str) -> bool:
    text = str(value or "").strip()
    if not text:
        return True
    return bool(ABS_OR_TRAVERSAL.search(text))


def load_catalog(path: Path | None = None) -> dict[str, Any]:
    p = path or CATALOG_PATH
    if not p.is_file():
        raise CatalogError(f"Missing audio catalog: {p}")
    data = json.loads(p.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("outputs"), list):
        raise CatalogError("audio-outputs.json must contain an outputs array")
    return data


def list_outputs(catalog: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    data = catalog if catalog is not None else load_catalog()
    rows = data.get("outputs") or []
    return [row for row in rows if isinstance(row, dict)]


def get_output(output_id: str, catalog: dict[str, Any] | None = None) -> dict[str, Any]:
    wanted = (output_id or "").strip()
    for row in list_outputs(catalog):
        if str(row.get("id") or "") == wanted:
            return row
    raise CatalogError(f"Unknown output {wanted!r}")


def chunks_dir(audio_root: Path, row: dict[str, Any]) -> Path:
    key = str(row.get("chunksKey") or "")
    if looks_absolute_or_traversal(key):
        raise CatalogError(f"Invalid chunksKey {key!r}")
    return Path(audio_root) / key


def assembled_path(imitation_root: Path, row: dict[str, Any]) -> Path:
    key = str(row.get("assembledKey") or "")
    if looks_absolute_or_traversal(key):
        raise CatalogError(f"Invalid assembledKey {key!r}")
    return Path(imitation_root) / key


def canonical_mp3_path(audio_root: Path, row: dict[str, Any]) -> Path:
    key = str(row.get("canonicalMp3Key") or "")
    if looks_absolute_or_traversal(key):
        raise CatalogError(f"Invalid canonicalMp3Key {key!r}")
    return Path(audio_root) / key


def load_index(chunks: Path) -> dict[str, Any]:
    path = Path(chunks) / "index.json"
    if not path.is_file():
        raise CatalogError(f"Missing index.json under {chunks}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("cues"), list):
        raise CatalogError(f"Invalid index.json under {chunks}")
    return data


def find_cue(index: dict[str, Any], cue_id: str) -> dict[str, Any]:
    wanted = (cue_id or "").strip()
    for cue in index.get("cues") or []:
        if isinstance(cue, dict) and str(cue.get("id") or "") == wanted:
            return cue
    raise CatalogError(f"Unknown cue {wanted!r}")


def current_outline_revision(outline_id: str | None = None, path: Path | None = None) -> int:
    if path is None:
        wanted = (outline_id or "outline:light-delay-master-narrative").strip()
        path = OUTLINE_PATHS.get(wanted)
        if path is None:
            raise CatalogError(f"Unknown outline id for revision lookup: {wanted!r}")
    data = json.loads(path.read_text(encoding="utf-8"))
    revision = data.get("outline", {}).get("revision")
    if not isinstance(revision, int):
        raise CatalogError(f"{path} has no integer outline.revision")
    return revision


def current_master_revision(path: Path | None = None) -> int:
    return current_outline_revision(path=path or MASTER_OUTLINE_PATH)


def public_output(row: dict[str, Any], *, master_revision: int | None = None) -> dict[str, Any]:
    """JSON-safe catalog row for the worker API (no filesystem paths)."""
    if master_revision is not None:
        current_revision = master_revision
    else:
        current_revision = current_outline_revision(str(row.get("sourceOutlineId") or ""))
    source_revision = int(row.get("sourceOutlineRevision") or 0)
    return {
        "id": row["id"],
        "kind": row.get("kind"),
        "lang": row.get("lang"),
        "label": row.get("label") or {},
        "description": row.get("description") or {},
        "sourceOutlineId": row.get("sourceOutlineId"),
        "sourceOutlineRevision": source_revision,
        "currentOutlineRevision": current_revision,
        "sourceStatus": "current" if source_revision == current_revision else "stale",
        "chunksKey": row.get("chunksKey"),
        "canonicalMp3Key": row.get("canonicalMp3Key"),
        "assembledKey": row.get("assembledKey"),
        "recordableSpeakers": list(row.get("recordableSpeakers") or []),
        "expectedSampleRate": int(row.get("expectedSampleRate") or 0),
        "expectedCueCount": int(row.get("expectedCueCount") or 0),
    }


def collect_catalog_errors(catalog: dict[str, Any] | None = None) -> list[str]:
    errors: list[str] = []
    try:
        data = catalog if catalog is not None else load_catalog()
        rows = list_outputs(data)
    except Exception as exc:  # noqa: BLE001
        return [str(exc)]

    if len(rows) < 1:
        errors.append("audio-outputs.json has no outputs")
        return errors

    ids: list[str] = []
    for i, row in enumerate(rows):
        oid = str(row.get("id") or "").strip()
        prefix = f"outputs[{i}]"
        if not oid:
            errors.append(f"{prefix}.id missing")
            continue
        ids.append(oid)
        label = row.get("label") if isinstance(row.get("label"), dict) else {}
        desc = row.get("description") if isinstance(row.get("description"), dict) else {}
        for lang in ("es", "en"):
            if not str(label.get(lang) or "").strip():
                errors.append(f"{prefix} {oid} label.{lang} missing")
            if not str(desc.get(lang) or "").strip():
                errors.append(f"{prefix} {oid} description.{lang} missing")
        for key in ("chunksKey", "canonicalMp3Key", "assembledKey"):
            value = str(row.get(key) or "")
            if not value:
                errors.append(f"{prefix} {oid}.{key} missing")
            elif looks_absolute_or_traversal(value):
                errors.append(f"{prefix} {oid}.{key} must be a relative key, got {value!r}")
        speakers = row.get("recordableSpeakers")
        if not isinstance(speakers, list) or not speakers:
            errors.append(f"{prefix} {oid}.recordableSpeakers missing")
        elif len(set(speakers)) != len(speakers):
            errors.append(f"{prefix} {oid}.recordableSpeakers must be unique")
        if str(row.get("sourceOutlineId") or "") not in {
            "outline:light-delay-master-narrative",
            "outline:light-delay-festival-master",
        }:
            errors.append(
                f"{prefix} {oid}.sourceOutlineId must identify a registered audience outline"
            )
        if not isinstance(row.get("sourceOutlineRevision"), int):
            errors.append(f"{prefix} {oid}.sourceOutlineRevision must be an integer")

    if len(ids) != len(set(ids)):
        errors.append("audio-outputs.json ids must be unique")

    expected = {"audience-es", "audience-en", "audience-festival-en"}
    actual = set(ids)
    if actual != expected:
        errors.append(
            f"MVP catalog must be exactly {sorted(expected)}, got {sorted(actual)}"
        )
    return errors
