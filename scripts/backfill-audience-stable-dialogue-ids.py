#!/usr/bin/env python3
"""Annotate outline-chunks */audience index.json with stableDialogueId (no resynth).

Pairs recordable dialogue cues in index order with audience-dialogue-performance.json
entries. Aborts if counts differ.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.imitation_catalog import get_output, load_catalog  # noqa: E402
from lib.seedvc_imitation import audio_root, load_defaults  # noqa: E402

PERFORMANCE = ROOT / "data" / "production" / "audio" / "audience-dialogue-performance.json"
EXPECTED = 36
RECORDABLE = frozenset({"Zao", "Voss", "Harlan", "Elin", "Sorell", "Okoye"})


def is_dialogue_cue(cue: dict) -> bool:
    speaker = str(cue.get("speaker") or "")
    if speaker not in RECORDABLE:
        return False
    text = str(cue.get("text") or "").lstrip()
    engine = str(cue.get("engine") or "")
    if engine.startswith("qwen"):
        return True
    return bool(text) and (text.startswith('"') or text.startswith("“"))


def backfill_index(index_path: Path, dialogue_ids: list[str], *, dry_run: bool) -> int:
    data = json.loads(index_path.read_text(encoding="utf-8"))
    cues = data.get("cues") or []
    dialogue_cues = [c for c in cues if isinstance(c, dict) and is_dialogue_cue(c)]
    if len(dialogue_cues) != len(dialogue_ids):
        raise SystemExit(
            f"{index_path}: expected {len(dialogue_ids)} recordable dialogues, "
            f"found {len(dialogue_cues)}"
        )
    changed = 0
    for cue, dialogue_id in zip(dialogue_cues, dialogue_ids):
        current = cue.get("stableDialogueId") or cue.get("stable_dialogue_id")
        if current == dialogue_id:
            continue
        cue["stableDialogueId"] = dialogue_id
        changed += 1
    if dry_run:
        print(f"dry-run {index_path}: would update {changed} cues")
        return changed
    if changed:
        index_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    print(f"{index_path}: updated {changed} cues")
    return changed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--lang",
        choices=("es", "en", "both"),
        default="both",
        help="Which audience index to annotate",
    )
    args = parser.parse_args(argv)
    performance = json.loads(PERFORMANCE.read_text(encoding="utf-8"))
    entries = performance.get("entries") or []
    if len(entries) != EXPECTED:
        raise SystemExit(f"performance entries: expected {EXPECTED}, got {len(entries)}")
    dialogue_ids = [str(entry["id"]) for entry in entries]

    defaults = load_defaults()
    root = audio_root(defaults)
    catalog = load_catalog()
    langs = ("es", "en") if args.lang == "both" else (args.lang,)
    total = 0
    for lang in langs:
        oid = f"audience-{lang}"
        row = get_output(oid, catalog)
        chunks_key = str(row["chunksKey"])
        index_path = root / chunks_key / "index.json"
        if not index_path.is_file():
            raise SystemExit(f"Missing {index_path}")
        total += backfill_index(index_path, dialogue_ids, dry_run=args.dry_run)
    print(f"ok total_updates={total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
