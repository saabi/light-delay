#!/usr/bin/env python3
"""Imitation-pass CLI and local HTTP worker for Seed-VC SVC (F0 locked).

GPU-free repo check (CI-safe):

  python scripts/convert-imitation-performance.py --check
  npm run tts:imitation:check

Local audio/Seed-VC check (fails if E:/Models is missing):

  python scripts/convert-imitation-performance.py --check-local
  npm run tts:imitation:check:local

Convert and serve still need the Seed-VC venv:

  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/convert-imitation-performance.py ^
    --source take.wav --character Zao --lang es
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/convert-imitation-performance.py --serve
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.imitation_http import ImitationHTTPServer, WorkerState, make_handler  # noqa: E402
from lib.seedvc_imitation import (  # noqa: E402
    ImitationError,
    ImitationSession,
    collect_local_check_errors,
    collect_repo_check_errors,
    default_out_path,
    file_sha256,
    list_characters,
    load_defaults,
    load_portable_defaults,
    normalize_lang,
    resolve_target,
    seedvc_python_mismatch_warning,
)


def run_check(*, local: bool) -> int:
    errors = collect_local_check_errors() if local else collect_repo_check_errors()
    label = "tts:imitation:check:local" if local else "tts:imitation:check"
    if errors:
        print(f"{label} failed", flush=True)
        for err in errors:
            print(f"- {err}", flush=True)
        return 1
    defaults = load_defaults() if local else load_portable_defaults()
    print(f"{label} ok", flush=True)
    print(f"defaults={defaults['paths'].get('pipelineDocEs')}", flush=True)
    if local:
        from lib.seedvc_imitation import audio_root, seedvc_root

        print(f"seedVc={seedvc_root(defaults)}", flush=True)
        print(f"audioRoot={audio_root(defaults)}", flush=True)
    for lang in ("en", "es"):
        rows = list_characters(lang, defaults)
        print(f"cast {lang}: {', '.join(r['id'] for r in rows)}", flush=True)
    return 0


def convert_from_args(args: argparse.Namespace) -> dict:
    defaults = load_defaults()
    lang = normalize_lang(args.lang)
    source = Path(args.source).expanduser().resolve()
    target_override = Path(args.target).expanduser().resolve() if args.target else None
    character, target = resolve_target(
        character=args.character,
        lang=lang,
        target=target_override,
        defaults=defaults,
    )
    source_hash = file_sha256(source)
    out = (
        Path(args.out).expanduser().resolve()
        if args.out
        else default_out_path(
            source, character=character, lang=lang, source_sha256=source_hash, defaults=defaults
        )
    )
    session = ImitationSession(defaults)
    payload = session.convert(
        source,
        target,
        out,
        character=character,
        lang=lang,
        diffusion_steps=args.diffusion_steps,
        auto_f0_adjust=args.auto_f0_adjust,
        semi_tone_shift=args.semi_tone_shift,
        length_adjust=args.length_adjust,
        inference_cfg_rate=args.inference_cfg_rate,
    )
    print(json.dumps(payload, indent=2, ensure_ascii=False), flush=True)
    return payload


def serve(host: str, port: int) -> int:
    state = WorkerState()
    warning = seedvc_python_mismatch_warning(state.defaults)
    if warning:
        print(warning, file=sys.stderr, flush=True)
    handler = make_handler(state)
    httpd = ImitationHTTPServer((host, port), handler)
    print(
        f"Imitation worker on http://{host}:{port}/v1/imitation/health "
        f"(modelState={state.model_state} python={sys.executable})",
        flush=True,
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)
    finally:
        httpd.server_close()
    return 0


def build_parser() -> argparse.ArgumentParser:
    defaults = load_portable_defaults()
    http = defaults["http"]
    parser = argparse.ArgumentParser(
        description="Convert an emotional actor take into a character timbre with Seed-VC F0 lock."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate portable defaults, catalog, and cast refs (no E:/Models, no GPU).",
    )
    parser.add_argument(
        "--check-local",
        action="store_true",
        help="Also require audio root, 275 cues, 24 kHz WAVs, and Seed-VC install.",
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Serve /v1/imitation without loading GPU until the first convert or /prepare.",
    )
    parser.add_argument("--host", default=str(http["host"]))
    parser.add_argument("--port", type=int, default=int(http["port"]))
    parser.add_argument("--source", help="Actor take (WAV or other ffmpeg-readable audio).")
    parser.add_argument("--character", help="Cast character id (Zao, Voss, …).")
    parser.add_argument("--lang", default="es", help="es or en (selects the matching curated ref).")
    parser.add_argument("--target", help="Override character ref WAV.")
    parser.add_argument("--out", help="Output WAV path (default under imitationRoot).")
    parser.add_argument("--diffusion-steps", type=int, default=None)
    parser.add_argument(
        "--auto-f0-adjust",
        action=argparse.BooleanOptionalAction,
        default=None,
        help="Override JSON (default on after 2026-09-06 Elin/Zao A/B).",
    )
    parser.add_argument("--semi-tone-shift", type=int, default=None)
    parser.add_argument("--length-adjust", type=float, default=None)
    parser.add_argument("--inference-cfg-rate", type=float, default=None)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.check and args.check_local:
            parser.error("use --check or --check-local, not both")
        if args.check:
            return run_check(local=False)
        if args.check_local:
            return run_check(local=True)
        if args.serve:
            return serve(args.host, args.port)
        if not args.source:
            parser.error("--source is required unless --check, --check-local, or --serve")
        convert_from_args(args)
        return 0
    except ImitationError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
