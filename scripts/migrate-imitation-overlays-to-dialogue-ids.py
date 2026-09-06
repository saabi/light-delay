#!/usr/bin/env python3
"""Move cue-keyed imitation overlays to stableDialogueId keys.

Requires index.json already annotated (backfill-audience-stable-dialogue-ids.py).
Idempotent: skips folders that already look like dialogue keys / already migrated.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.imitation_catalog import get_output, load_catalog  # noqa: E402
from lib.imitation_overlay import (  # noqa: E402
    REPLACEMENTS_SCHEMA,
    OverlayStore,
    atomic_write_json,
    safe_cue_key,
    safe_dialogue_key,
)
from lib.seedvc_imitation import audio_root, imitation_root, load_defaults  # noqa: E402


def cue_id_to_dialogue(index: dict) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for cue in index.get("cues") or []:
        if not isinstance(cue, dict):
            continue
        cue_id = str(cue.get("id") or "")
        dialogue = str(cue.get("stableDialogueId") or cue.get("stable_dialogue_id") or "")
        if cue_id and dialogue:
            mapping[cue_id] = dialogue
    return mapping


def migrate_output(
    *,
    output_id: str,
    store: OverlayStore,
    mapping: dict[str, str],
    dry_run: bool,
) -> tuple[int, int]:
    out_dir = store.output_dir(output_id)
    moved = 0
    pointers = 0
    if not out_dir.is_dir():
        print(f"{output_id}: no overlay dir")
        return 0, 0

    # Rewrite replacements first (logical keys).
    payload = store.load_replacements(output_id)
    old_cues = dict(payload.get("cues") or {})
    new_cues: dict[str, dict] = {}
    for key, row in old_cues.items():
        if not isinstance(row, dict):
            continue
        if key in mapping.values() or key.startswith("audience:dialogue:"):
            new_cues[key] = row
            continue
        dialogue = mapping.get(key)
        if not dialogue:
            print(f"{output_id}: cannot map replacement key {key!r}; leaving as-is")
            new_cues[key] = row
            continue
        entry = dict(row)
        entry["stableDialogueId"] = dialogue
        fp = entry.get("fingerprint")
        if isinstance(fp, dict):
            slim = {
                "contentHash": fp.get("contentHash") or "",
                "speaker": fp.get("speaker") or "",
                "language": fp.get("language") or "",
                "engine": fp.get("engine") or "",
            }
            entry["fingerprint"] = slim
        new_cues[dialogue] = entry
        pointers += 1
    if not dry_run:
        payload["cues"] = new_cues
        payload["schemaVersion"] = REPLACEMENTS_SCHEMA
        store.save_replacements(output_id, payload)

    # Move take directories keyed by old cue ids.
    for child in list(out_dir.iterdir()):
        if not child.is_dir() or child.name == "takes":
            continue
        takes = child / "takes"
        if not takes.is_dir():
            continue
        # Discover cueId from first take metadata.
        cue_id = None
        for take_dir in takes.iterdir():
            meta_path = take_dir / "metadata.json"
            if meta_path.is_file():
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                cue_id = str(meta.get("cueId") or "")
                break
        if not cue_id:
            continue
        # Already under dialogue key?
        dialogue = mapping.get(cue_id)
        if not dialogue:
            # Maybe folder is already dialogue-keyed
            continue
        dest = store.dialogue_dir(output_id, dialogue)
        if child.resolve() == dest.resolve():
            continue
        expected_legacy = out_dir / safe_cue_key(cue_id)
        if child.resolve() != expected_legacy.resolve():
            # Heuristic: only migrate folders that match legacy cue key
            if safe_dialogue_key(dialogue) == child.name:
                continue
            if not child.name.endswith(safe_cue_key(cue_id).split("--")[-1]):
                # still try if metadata says cue id
                pass
        print(f"{output_id}: move {child.name} -> {dest.name}")
        if dry_run:
            moved += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists():
            # Merge takes into existing dialogue folder
            dest_takes = dest / "takes"
            dest_takes.mkdir(parents=True, exist_ok=True)
            for take_dir in takes.iterdir():
                target = dest_takes / take_dir.name
                if target.exists():
                    continue
                shutil.move(str(take_dir), str(target))
                meta_path = target / "metadata.json"
                if meta_path.is_file():
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                    meta["stableDialogueId"] = dialogue
                    meta["dialogueKey"] = dialogue
                    atomic_write_json(meta_path, meta)
            shutil.rmtree(child, ignore_errors=True)
        else:
            shutil.move(str(child), str(dest))
            for take_dir in (dest / "takes").iterdir():
                meta_path = take_dir / "metadata.json"
                if not meta_path.is_file():
                    continue
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                meta["stableDialogueId"] = dialogue
                meta["dialogueKey"] = dialogue
                atomic_write_json(meta_path, meta)
        moved += 1
    return moved, pointers


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--lang", choices=("es", "en", "both"), default="both")
    args = parser.parse_args(argv)

    defaults = load_defaults()
    store = OverlayStore(imitation_root(defaults))
    audio = audio_root(defaults)
    catalog = load_catalog()
    langs = ("es", "en") if args.lang == "both" else (args.lang,)
    for lang in langs:
        oid = f"audience-{lang}"
        row = get_output(oid, catalog)
        index_path = audio / str(row["chunksKey"]) / "index.json"
        if not index_path.is_file():
            raise SystemExit(f"Missing {index_path}")
        index = json.loads(index_path.read_text(encoding="utf-8"))
        mapping = cue_id_to_dialogue(index)
        if not mapping:
            raise SystemExit(
                f"{oid}: index has no stableDialogueId fields; "
                "run scripts/backfill-audience-stable-dialogue-ids.py first"
            )
        moved, pointers = migrate_output(
            output_id=oid, store=store, mapping=mapping, dry_run=args.dry_run
        )
        print(f"{oid}: moved_dirs={moved} remapped_pointers={pointers}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
