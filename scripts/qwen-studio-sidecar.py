#!/usr/bin/env python3
"""Qwen3-TTS sidecar for Studio regenerate (system Python with qwen_tts).

Runs on 127.0.0.1 only. Started by the imitation worker or manually:

  python scripts/qwen-studio-sidecar.py --port 8766
"""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.qwen_studio_regen import (  # noqa: E402
    QwenRegenSession,
    clamp_max_new_tokens,
    clamp_repetition_penalty,
    clamp_temperature,
    clamp_top_k,
    clamp_top_p,
    public_qwen_defaults,
)
from lib.seedvc_imitation import ImitationError, normalize_lang  # noqa: E402

ALLOWED_HOSTS = frozenset({"127.0.0.1", "localhost"})


class SidecarState:
    def __init__(self) -> None:
        self.session = QwenRegenSession()
        self.model_state = "unloaded"
        self.model_error: str | None = None
        self.lock = threading.Lock()

    def prepare(self, lang: str) -> str:
        lang = normalize_lang(lang)
        if self.model_state == "ready" and self.session.lang == lang:
            return self.model_state
        self.model_state = "loading"
        self.model_error = None
        try:
            self.session.load(lang)
            self.model_state = "ready"
        except Exception as exc:  # noqa: BLE001
            self.model_state = "error"
            self.model_error = str(exc)
            raise
        return self.model_state


def host_allowed(host_header: str | None) -> bool:
    host = (host_header or "").split(",")[0].strip()
    name = host.split(":")[0].strip().lower()
    return name in ALLOWED_HOSTS


def make_handler(state: SidecarState) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt: str, *args: object) -> None:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

        def _send_json(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _read_json(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            if not raw:
                return {}
            data = json.loads(raw.decode("utf-8"))
            if not isinstance(data, dict):
                raise ImitationError("JSON object required")
            return data

        def _guard(self) -> bool:
            if not host_allowed(self.headers.get("Host")):
                self._send_json(403, {"ok": False, "error": "local tool unavailable"})
                return False
            return True

        def do_GET(self) -> None:  # noqa: N802
            if not self._guard():
                return
            path = urlparse(self.path).path.rstrip("/") or "/"
            if path in {"/health", "/v1/qwen-studio/health"}:
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "engine": "qwen-clone",
                        "qwenModelState": state.model_state,
                        "qwenModelError": state.model_error,
                        "qwenLang": state.session.lang,
                        "python": sys.executable,
                    },
                )
                return
            self._send_json(404, {"ok": False, "error": "not found"})

        def do_POST(self) -> None:  # noqa: N802
            if not self._guard():
                return
            path = urlparse(self.path).path.rstrip("/") or "/"
            try:
                body = self._read_json()
                if path in {"/prepare", "/v1/qwen-studio/prepare"}:
                    lang = normalize_lang(str(body.get("lang") or "es"))
                    if not state.lock.acquire(blocking=False):
                        self._send_json(409, {"ok": False, "error": "qwen busy"})
                        return
                    try:
                        state.prepare(lang)
                    finally:
                        state.lock.release()
                    self._send_json(
                        200,
                        {
                            "ok": True,
                            "qwenModelState": state.model_state,
                            "qwenLang": state.session.lang,
                        },
                    )
                    return
                if path in {"/synthesize", "/v1/qwen-studio/synthesize"}:
                    lang = normalize_lang(str(body.get("lang") or "es"))
                    defaults = public_qwen_defaults(lang)
                    if not state.lock.acquire(blocking=False):
                        self._send_json(409, {"ok": False, "error": "qwen busy"})
                        return
                    try:
                        with tempfile.TemporaryDirectory(prefix="qwen-sidecar-") as tmp:
                            out_wav = Path(tmp) / "out.wav"
                            settings = state.session.synthesize(
                                speaker=str(body.get("speaker") or ""),
                                text=str(body.get("text") or ""),
                                line_instruct=body.get("instruct"),
                                lang=lang,
                                temperature=clamp_temperature(
                                    body.get("temperature", defaults["temperature"])
                                ),
                                top_p=clamp_top_p(body.get("top_p", defaults["top_p"])),
                                top_k=clamp_top_k(body.get("top_k", defaults["top_k"])),
                                max_new_tokens=clamp_max_new_tokens(
                                    body.get("max_new_tokens", defaults["max_new_tokens"])
                                ),
                                repetition_penalty=clamp_repetition_penalty(
                                    body.get(
                                        "repetition_penalty",
                                        defaults["repetition_penalty"],
                                    )
                                ),
                                expressiveness_prefix=body.get(
                                    "expressiveness_prefix",
                                    defaults["expressivenessPrefix"],
                                ),
                                default_instruct=body.get(
                                    "default_instruct", defaults["defaultInstruct"]
                                ),
                                out_wav=out_wav,
                            )
                            audio = out_wav.read_bytes()
                        state.model_state = "ready"
                        state.model_error = None
                    finally:
                        state.lock.release()
                    import base64

                    self._send_json(
                        200,
                        {
                            "ok": True,
                            "settings": settings,
                            "wavBase64": base64.b64encode(audio).decode("ascii"),
                            "qwenModelState": state.model_state,
                        },
                    )
                    return
                self._send_json(404, {"ok": False, "error": "not found"})
            except ImitationError as exc:
                self._send_json(400, {"ok": False, "error": str(exc)})
            except Exception as exc:  # noqa: BLE001
                traceback.print_exc()
                state.model_state = "error"
                state.model_error = str(exc)
                self._send_json(500, {"ok": False, "error": f"{type(exc).__name__}: {exc}"})

    return Handler


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    try:
        import qwen_tts  # noqa: F401
    except ImportError:
        print(
            "qwen_tts not importable in this Python.\n"
            f"  executable: {sys.executable}\n"
            "Use the system Python that runs generate-dual-outline-audio.py "
            "(see docs/TTS_VOICE_PIPELINE.es.md §2.2).",
            file=sys.stderr,
        )
        return 2
    state = SidecarState()
    server = ThreadingHTTPServer((args.host, args.port), make_handler(state))
    print(
        f"Qwen studio sidecar on http://{args.host}:{args.port}/health "
        f"(python={sys.executable})",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopped.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
