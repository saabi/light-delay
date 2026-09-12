#!/usr/bin/env python3
"""Generate animatic dialogue audio from a ScriptFile via the dual TTS pipeline.

Reads dialogue cues from a script JSON, writes a voices-style markdown export,
invokes scripts/generate-dual-outline-audio.py (Kokoro + Qwen ICL, content_hash
reuse, --force-speaker / --assemble-only), then optionally promotes chunk WAVs
into static/assets and links DialogueVariant.audioAssetId.

Examples:
  python scripts/generate-animatic-dialogue-audio.py --lang en \\
    --script-id script:light-delay-main-short

  python scripts/generate-animatic-dialogue-audio.py --lang en \\
    --script-id script:light-delay-main-short --promote
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DUAL = ROOT / "scripts" / "generate-dual-outline-audio.py"
DEFAULT_CHUNKS_ROOT = Path(r"E:\Models\Qwen3-TTS\output\animatic-chunks")
DEFAULT_OUT_ROOT = Path(r"E:\Models\Qwen3-TTS\output")
AUDIO_OUTPUTS = ROOT / "data" / "production" / "audio" / "audio-outputs.json"
ASSETS_PATH = ROOT / "data" / "assets.json"

SPEAKER_BY_CHARACTER = {
    "character:zao": "Zao",
    "character:voss": "Voss",
    "character:harlan": "Harlan",
    "character:rao": "Elin",
    "character:sorell": "Sorell",
    "character:okoye": "Okoye",
    "character:cael": "Cael",
}
QWEN_SPEAKERS = {"Zao", "Voss", "Harlan", "Elin", "Sorell", "Okoye"}


def script_slug(script_id: str) -> str:
    return script_id.split(":", 1)[-1]


def safe_asset_token(cue_id: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", cue_id).strip("-").lower()


def resolve_script_path(args: argparse.Namespace) -> Path:
    if args.script:
        return Path(args.script)
    if args.script_id:
        slug = script_slug(args.script_id)
        candidate = ROOT / "data" / "scripts" / f"{slug}.json"
        if candidate.is_file():
            return candidate
        raise SystemExit(f"No script JSON for {args.script_id}: {candidate}")
    raise SystemExit("Provide --script or --script-id")


def ordered_dialogue_cues(script: dict) -> list[dict]:
    """Dialogue cues in first-placement shot order, then remaining by cue.order."""
    cue_by_id = {c["id"]: c for c in script.get("cues") or []}
    seen: set[str] = set()
    ordered: list[dict] = []
    for shot in script.get("shots") or []:
        for placement in shot.get("cuePlacements") or []:
            cue = cue_by_id.get(placement.get("cueId"))
            if not cue or cue.get("type") != "dialogue":
                continue
            if cue["id"] in seen:
                continue
            seen.add(cue["id"])
            ordered.append(cue)
    rest = [
        c
        for c in script.get("cues") or []
        if c.get("type") == "dialogue" and c["id"] not in seen
    ]
    rest.sort(key=lambda c: int(c.get("order") or 0))
    ordered.extend(rest)
    return ordered


def spoken_for_lang(cue: dict, lang: str, fallback: str = "es") -> str | None:
    variants = (cue.get("content") or {}).get("variants") or {}
    for key in (lang, fallback, "en", "es"):
        text = (variants.get(key) or {}).get("spokenText")
        if text and str(text).strip():
            return str(text).strip()
    return None


def delivery_for_lang(cue: dict, lang: str) -> str | None:
    variants = (cue.get("content") or {}).get("variants") or {}
    delivery = (variants.get(lang) or {}).get("delivery")
    if isinstance(delivery, str) and delivery.strip():
        return delivery.strip()
    if isinstance(delivery, dict):
        for key in (lang, "en", "es"):
            val = delivery.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
            if isinstance(val, dict):
                nested = val.get(lang) or val.get("en") or val.get("es")
                if isinstance(nested, str) and nested.strip():
                    return nested.strip()
    return None


def build_voices_markdown(script: dict, lang: str) -> tuple[str, list[dict]]:
    cues = ordered_dialogue_cues(script)
    script_id = script["script"]["id"]
    lines = [
        f"# Animatic dialogue TTS — {script_id} ({lang})",
        "",
        "Generated for dual outline audio. Do not hand-edit; regenerate from ScriptFile.",
        "Speaker tags: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye], [Cael].",
        "",
        "---",
        "",
    ]
    link_rows: list[dict] = []
    cue_index = 0
    for cue in cues:
        spoken = spoken_for_lang(cue, lang)
        if not spoken:
            continue
        cue_index += 1
        speaker = SPEAKER_BY_CHARACTER.get(str(cue.get("speakerId") or ""), "Narrator")
        link_rows.append(
            {
                "cue_index": cue_index,
                "scriptCueId": cue["id"],
                "speaker": speaker,
                "speakerId": cue.get("speakerId"),
            }
        )
        lines.append(f"<!-- audience-dialogue-id: {cue['id']} -->")
        lines.append(f"[{speaker}]")
        delivery = delivery_for_lang(cue, lang)
        if speaker in QWEN_SPEAKERS:
            if delivery:
                lang_label = "English" if lang == "en" else "Spanish"
                lines.append(
                    f"[QwenInstruct] Speak {lang_label}. Performance and delivery: {delivery}"
                )
            # Dual pipeline treats quoted lines as character dialogue for Qwen.
            escaped = spoken.replace('"', "'")
            lines.append(f'"{escaped}"')
        else:
            lines.append(spoken)
        lines.append("")
    return "\n".join(lines).rstrip() + "\n", link_rows


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def upsert_audio_output(
    *,
    output_id: str,
    lang: str,
    slug: str,
    script_id: str,
    cue_count: int,
    chunks_key: str,
    canonical_mp3: str,
) -> None:
    catalog = load_json(AUDIO_OUTPUTS)
    outputs = list(catalog.get("outputs") or [])
    record = {
        "id": output_id,
        "kind": "animatic",
        "lang": lang,
        "label": {
            "es": f"Diálogo de animatic ({slug}, {lang})",
            "en": f"Animatic dialogue ({slug}, {lang})",
        },
        "description": {
            "es": f"{cue_count} cues de diálogo del script {script_id}.",
            "en": f"{cue_count} dialogue cues from script {script_id}.",
        },
        "sourceOutlineId": script_id,
        "sourceOutlineRevision": 0,
        "chunksKey": chunks_key,
        "canonicalMp3Key": canonical_mp3,
        "assembledKey": f"assembled/{output_id}.mp3",
        "recordableSpeakers": sorted(QWEN_SPEAKERS),
        "expectedSampleRate": 24000,
        "expectedCueCount": cue_count,
    }
    replaced = False
    for i, row in enumerate(outputs):
        if row.get("id") == output_id:
            outputs[i] = record
            replaced = True
            break
    if not replaced:
        outputs.append(record)
    catalog["outputs"] = outputs
    write_json(AUDIO_OUTPUTS, catalog)


def run_dual(args: argparse.Namespace, voices_path: Path, chunks_dir: Path, out_mp3: Path) -> int:
    cmd = [
        sys.executable,
        str(DUAL),
        "--lang",
        args.lang,
        "--script",
        str(voices_path),
        "--chunks-dir",
        str(chunks_dir),
        "--out",
        str(out_mp3),
    ]
    if args.assemble_only:
        cmd.append("--assemble-only")
    if args.force_all:
        cmd.append("--force-all")
    for speaker in args.force_speaker or []:
        cmd.extend(["--force-speaker", speaker])
    if args.no_assemble:
        cmd.append("--no-assemble")
    if args.kokoro_cpu:
        cmd.append("--kokoro-cpu")
    if args.limit:
        cmd.extend(["--limit", str(args.limit)])
    if args.start:
        cmd.extend(["--start", str(args.start)])
    if args.dialogue_only_limit:
        cmd.extend(["--dialogue-only-limit", str(args.dialogue_only_limit)])
    print("Running:", " ".join(cmd), flush=True)
    return subprocess.call(cmd)


def enrich_link_from_index(link: dict, index: dict) -> dict:
    by_index = {int(c["cue_index"]): c for c in index.get("cues") or []}
    for row in link.get("cues") or []:
        entry = by_index.get(int(row["cue_index"]))
        if not entry:
            continue
        row["wav"] = entry.get("wav")
        row["seconds"] = entry.get("seconds")
        row["content_hash"] = entry.get("content_hash")
        row["engine"] = entry.get("engine")
        row["stableDialogueId"] = entry.get("stableDialogueId")
    link["sample_rate"] = index.get("sample_rate", 24000)
    return link


def apply_estimated_durations(script: dict, link: dict, lang: str) -> int:
    """Write estimatedDurationMs from measured WAV length; fill missing placement durationMs."""
    by_cue = {row["scriptCueId"]: row for row in link.get("cues") or []}
    updated = 0
    for cue in script.get("cues") or []:
        if cue.get("type") != "dialogue":
            continue
        row = by_cue.get(cue["id"])
        if not row or row.get("seconds") is None:
            continue
        ms = int(round(float(row["seconds"]) * 1000))
        variants = cue.setdefault("content", {}).setdefault("variants", {})
        variant = variants.setdefault(lang, {"spokenText": "", "status": "draft"})
        if variant.get("estimatedDurationMs") != ms:
            variant["estimatedDurationMs"] = ms
            updated += 1
    for shot in script.get("shots") or []:
        for placement in shot.get("cuePlacements") or []:
            row = by_cue.get(placement.get("cueId"))
            if not row or row.get("seconds") is None:
                continue
            if placement.get("durationMs") is None:
                placement["durationMs"] = int(round(float(row["seconds"]) * 1000))
                updated += 1
    return updated


def promote(
    *,
    script: dict,
    script_path: Path,
    link: dict,
    chunks_dir: Path,
    lang: str,
    slug: str,
) -> int:
    assets = load_json(ASSETS_PATH)
    asset_list = list(assets.get("assets") or [])
    by_id = {a["id"]: i for i, a in enumerate(asset_list)}
    static_dir = ROOT / "static" / "assets" / "audio" / "dialogue" / slug / lang
    static_dir.mkdir(parents=True, exist_ok=True)
    cue_by_id = {c["id"]: c for c in script.get("cues") or []}
    promoted = 0

    for row in link.get("cues") or []:
        wav_rel = row.get("wav")
        cue_id = row.get("scriptCueId")
        if not wav_rel or not cue_id:
            continue
        src = chunks_dir / wav_rel
        if not src.is_file():
            print(f"Skip missing WAV for {cue_id}: {src}", flush=True)
            continue
        token = safe_asset_token(cue_id)
        dest_name = f"{token}.wav"
        dest = static_dir / dest_name
        shutil.copy2(src, dest)
        asset_id = f"asset:dialogue-{slug}-{lang}-{token}"
        public_path = f"/assets/audio/dialogue/{slug}/{lang}/{dest_name}"
        duration_ms = (
            int(round(float(row["seconds"]) * 1000)) if row.get("seconds") is not None else None
        )
        asset = {
            "id": asset_id,
            "kind": "audio",
            "role": "voice_sample",
            "path": public_path,
            "mimeType": "audio/wav",
            "title": {"es": cue_id, "en": cue_id},
            "durationMs": duration_ms,
            "metadata": {
                "scriptCueId": cue_id,
                "lang": lang,
                "scriptSlug": slug,
            },
        }
        if asset_id in by_id:
            asset_list[by_id[asset_id]] = asset
        else:
            by_id[asset_id] = len(asset_list)
            asset_list.append(asset)

        cue = cue_by_id.get(cue_id)
        if cue and cue.get("type") == "dialogue":
            variants = cue.setdefault("content", {}).setdefault("variants", {})
            variant = variants.setdefault(lang, {"spokenText": "", "status": "draft"})
            variant["audioAssetId"] = asset_id
            if duration_ms is not None:
                variant["estimatedDurationMs"] = duration_ms
        promoted += 1

    assets["assets"] = asset_list
    write_json(ASSETS_PATH, assets)
    write_json(script_path, script)
    return promoted


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", choices=("en", "es"), default="en")
    parser.add_argument("--script", type=Path, default=None)
    parser.add_argument("--script-id", default="script:light-delay-main-short")
    parser.add_argument("--chunks-dir", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--voices-out", type=Path, default=None)
    parser.add_argument("--assemble-only", action="store_true")
    parser.add_argument("--force-all", action="store_true")
    parser.add_argument("--force-speaker", action="append", default=[])
    parser.add_argument("--no-assemble", action="store_true")
    parser.add_argument("--kokoro-cpu", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--dialogue-only-limit", type=int, default=0)
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Copy chunk WAVs into static/assets and set audioAssetId on the script.",
    )
    parser.add_argument(
        "--write-durations",
        action="store_true",
        help="After synth, write estimatedDurationMs / missing placement durationMs into the script.",
    )
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="Write voices markdown + link stub only; do not run TTS.",
    )
    args = parser.parse_args()

    script_path = resolve_script_path(args)
    script = load_json(script_path)
    script_id = script["script"]["id"]
    slug = script_slug(script_id)
    chunks_dir = args.chunks_dir or (DEFAULT_CHUNKS_ROOT / slug / args.lang)
    out_mp3 = args.out or (
        DEFAULT_OUT_ROOT / f"light-delay-animatic-dialogue-{slug}-{args.lang}.mp3"
    )
    voices_path = args.voices_out or (
        ROOT / "docs" / "wip" / f"animatic-dialogue-{slug}.{args.lang}.voices.md"
    )
    link_path = chunks_dir / "script-link.json"

    voices_md, link_rows = build_voices_markdown(script, args.lang)
    voices_path.parent.mkdir(parents=True, exist_ok=True)
    voices_path.write_text(voices_md, encoding="utf-8")
    link = {
        "version": 1,
        "scriptId": script_id,
        "lang": args.lang,
        "voices": str(voices_path),
        "cues": link_rows,
    }
    chunks_dir.mkdir(parents=True, exist_ok=True)
    write_json(link_path, link)
    print(f"Voices export: {voices_path} ({len(link_rows)} cues)", flush=True)
    print(f"Link stub: {link_path}", flush=True)

    if args.export_only:
        return 0

    index_path = chunks_dir / "index.json"
    skip_synth = (
        args.promote
        and index_path.is_file()
        and not args.assemble_only
        and not args.force_all
        and not args.force_speaker
    )
    if not skip_synth:
        code = run_dual(args, voices_path, chunks_dir, out_mp3)
        if code != 0:
            return code

    if not index_path.is_file():
        raise SystemExit(f"Missing index after generation: {index_path}")

    index = load_json(index_path)
    link = enrich_link_from_index(link, index)
    write_json(link_path, link)

    output_id = f"animatic-{slug}-{args.lang}"
    upsert_audio_output(
        output_id=output_id,
        lang=args.lang,
        slug=slug,
        script_id=script_id,
        cue_count=len(index.get("cues") or []),
        chunks_key=f"animatic-chunks/{slug}/{args.lang}",
        canonical_mp3=out_mp3.name,
    )
    print(f"Catalog upserted: {output_id}", flush=True)

    if args.write_durations or args.promote:
        n = apply_estimated_durations(script, link, args.lang)
        write_json(script_path, script)
        print(f"Updated duration fields: {n}", flush=True)

    if args.promote:
        promoted = promote(
            script=script,
            script_path=script_path,
            link=link,
            chunks_dir=chunks_dir,
            lang=args.lang,
            slug=slug,
        )
        print(f"Promoted {promoted} dialogue WAVs into static/assets + assets.json", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
