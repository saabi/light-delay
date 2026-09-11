"""Local /v1/imitation HTTP worker: lazy GPU, Host/Origin checks, overlay takes."""

from __future__ import annotations

import json
import os
import socket
import sys
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from lib.imitation_assemble import AssembleError, assemble_output, assert_not_canonical, effective_seconds
from lib.imitation_catalog import (
    CatalogError,
    assembled_path,
    canonical_mp3_path,
    chunks_dir,
    find_cue,
    get_output,
    list_outputs,
    load_index,
    public_output,
)
from lib.imitation_overlay import (
    OverlayError,
    OverlayStore,
    cue_fingerprint,
    dialogue_key_for_cue,
    fingerprints_match,
    index_hash,
    unquote_segment,
    wav_duration_seconds,
)
from lib.qwen_studio_regen import QwenRegenGateway, public_qwen_defaults
from lib.seedvc_imitation import (
    ImitationError,
    ImitationSession,
    audio_root,
    clamp_diffusion_steps,
    clamp_inference_cfg_rate,
    clamp_length_adjust,
    clamp_semi_tone_shift,
    imitation_root,
    load_defaults,
    max_recording_seconds,
    max_upload_bytes,
    normalize_lang,
    parse_bool,
    resolve_target,
    sniff_audio_mime,
    write_upload_wav,
)

ALLOWED_HOSTS = frozenset({"127.0.0.1", "localhost"})
DENIED_ORIGIN_HOSTS = ("github.io",)


class ImitationHTTPServer(ThreadingHTTPServer):
    """Refuse a second bind on Windows so Store Python cannot keep :8765."""

    allow_reuse_address = False

    def server_bind(self) -> None:
        if os.name == "nt" and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class WorkerBusy(ImitationError):
    """Convert already running."""


class WorkerState:
    def __init__(self, defaults: dict[str, Any] | None = None) -> None:
        self.defaults = defaults or load_defaults()
        self.session = ImitationSession(self.defaults)
        self.model_state = "unloaded"
        self.model_error: str | None = None
        self.qwen = QwenRegenGateway()
        self.qwen_model_state = "unloaded"
        self.qwen_model_error: str | None = None
        self.convert_lock = threading.Lock()
        self.overlay = OverlayStore(imitation_root(self.defaults))
        self.audio_root = audio_root(self.defaults)
        self.imitation_root = imitation_root(self.defaults)

    def public_defaults(self) -> dict[str, Any]:
        seed = self.defaults["seedVc"]
        bounds = self.defaults.get("bounds") or {}
        http = self.defaults.get("http") or {}
        qwen_es = public_qwen_defaults("es")
        qwen_en = public_qwen_defaults("en")
        return {
            "engine": self.defaults.get("engine"),
            "actorNote": self.defaults.get("actorNote") or {},
            "seedVc": {
                "f0_condition": True,
                "auto_f0_adjust": bool(seed["auto_f0_adjust"]),
                "semi_tone_shift": int(seed["semi_tone_shift"]),
                "diffusion_steps": int(seed["diffusion_steps"]),
                "inference_cfg_rate": float(seed["inference_cfg_rate"]),
                "length_adjust": float(seed["length_adjust"]),
            },
            "qwen": {
                "es": qwen_es,
                "en": qwen_en,
            },
            "bounds": {
                "diffusion_steps": bounds.get("diffusion_steps"),
                "semi_tone_shift": bounds.get("semi_tone_shift"),
                "length_adjust": bounds.get("length_adjust"),
                "inference_cfg_rate": bounds.get("inference_cfg_rate"),
                "maxUploadBytes": max_upload_bytes(self.defaults),
                "maxRecordingSeconds": max_recording_seconds(self.defaults),
            },
            "http": {
                "host": http.get("host"),
                "port": http.get("port"),
            },
            "modelState": self.model_state,
            "modelError": self.model_error,
            "qwenModelState": self.qwen_model_state,
            "qwenModelError": self.qwen_model_error,
            "python": sys.executable,
        }

    def prepare_qwen(self, lang: str) -> str:
        lang = normalize_lang(lang)
        if self.qwen_model_state == "ready" and self.qwen.lang == lang:
            return self.qwen_model_state
        self.qwen_model_state = "loading"
        self.qwen_model_error = None
        try:
            self.qwen.load(lang)
            self.qwen_model_state = "ready"
        except Exception as exc:  # noqa: BLE001
            self.qwen_model_state = "error"
            self.qwen_model_error = str(exc)
            raise
        return self.qwen_model_state

    def prepare(self) -> str:
        if self.model_state == "ready":
            return self.model_state
        self.model_state = "loading"
        self.model_error = None
        try:
            self.session.load()
            self.model_state = "ready"
        except Exception as exc:  # noqa: BLE001
            self.model_state = "error"
            self.model_error = str(exc)
            raise
        return self.model_state


def origin_host(origin: str) -> str:
    return (urlparse(origin).hostname or "").lower()


def origin_has_path(origin: str) -> bool:
    path = urlparse(origin).path or ""
    return path not in {"", "/"}


def host_allowed(host_header: str | None) -> bool:
    host = (host_header or "").split(",")[0].strip()
    hostname = host.split("]")[-1]
    if hostname.startswith("["):
        return False
    name = hostname.split(":")[0].strip().lower()
    return name in ALLOWED_HOSTS


def origin_denied(origin: str) -> bool:
    host = origin_host(origin)
    return any(host == denied or host.endswith("." + denied) for denied in DENIED_ORIGIN_HOSTS)


def origin_allowed(origin: str | None, allow_list: list[str], *, require: bool) -> bool:
    if not origin:
        return not require
    if origin_denied(origin) or origin_has_path(origin):
        return False
    return origin in allow_list


def _bad_segment(value: str) -> bool:
    text = unquote_segment(value)
    return (not text) or ".." in text or "/" in text or "\\" in text or "\x00" in text


def parse_imitation_path(path: str) -> dict[str, str] | None:
    parsed = urlparse(path)
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2 or parts[0] != "v1" or parts[1] != "imitation":
        return None
    rest = parts[2:]
    if rest == ["health"]:
        return {"name": "health"}
    if rest == ["defaults"]:
        return {"name": "defaults"}
    if rest == ["outputs"]:
        return {"name": "outputs"}
    if rest == ["prepare"]:
        return {"name": "prepare"}
    if rest == ["prepare-qwen"]:
        return {"name": "prepare-qwen"}
    if len(rest) >= 2 and rest[0] == "outputs":
        if any(_bad_segment(part) for part in rest[1:]):
            return {"name": "traversal"}
        route: dict[str, str] = {"outputId": unquote_segment(rest[1])}
        tail = rest[2:]
        if tail == ["timeline"]:
            route["name"] = "timeline"
            return route
        if tail == ["assembled"]:
            route["name"] = "assembled"
            return route
        if tail == ["assemble"]:
            route["name"] = "assemble"
            return route
        if tail == ["purge-takes"]:
            route["name"] = "purge-takes"
            return route
        if len(tail) == 2 and tail[0] == "chunks":
            route["name"] = "chunk"
            route["cueId"] = unquote_segment(tail[1])
            return route
        if len(tail) == 3 and tail[0] == "takes" and tail[2] == "audio":
            route["name"] = "take_audio"
            route["takeId"] = unquote_segment(tail[1])
            return route
        if len(tail) == 3 and tail[0] == "cues" and tail[2] in {
            "convert",
            "accept",
            "restore",
            "regenerate",
        }:
            route["name"] = tail[2]
            route["cueId"] = unquote_segment(tail[1])
            return route
    return None


def _json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")


def make_handler(state: WorkerState) -> type[BaseHTTPRequestHandler]:
    defaults = state.defaults
    cors = [str(item) for item in (defaults.get("http", {}).get("corsOrigins") or [])]
    max_upload = max_upload_bytes(defaults)
    max_seconds = max_recording_seconds(defaults)

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt: str, *args: object) -> None:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

        def _cors_origin(self) -> str | None:
            origin = self.headers.get("Origin")
            if origin and origin_allowed(origin, cors, require=True):
                return origin
            return None

        def _set_cors(self, extra: dict[str, str] | None = None) -> None:
            origin = self._cors_origin()
            if origin:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header(
                "Access-Control-Allow-Headers",
                "Content-Type, Content-Length, Filename, X-Filename",
            )
            if extra:
                for key, value in extra.items():
                    self.send_header(key, value)

        def _send(
            self,
            status: int,
            content_type: str,
            body: bytes,
            extra: dict[str, str] | None = None,
        ) -> None:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self._set_cors(extra)
            self.end_headers()
            self.wfile.write(body)

        def _send_json(self, status: int, payload: dict[str, Any]) -> None:
            self._send(status, "application/json; charset=utf-8", _json_bytes(payload))

        def _guard(self, *, mutation: bool) -> bool:
            if not host_allowed(self.headers.get("Host")):
                self._send_json(403, {"ok": False, "error": "local tool unavailable"})
                return False
            origin = self.headers.get("Origin")
            if origin_denied(origin or "") or (
                origin and not origin_allowed(origin, cors, require=False)
            ):
                self._send_json(403, {"ok": False, "error": "local tool unavailable"})
                return False
            if mutation and not origin_allowed(origin, cors, require=True):
                self._send_json(403, {"ok": False, "error": "local tool unavailable"})
                return False
            return True

        def do_OPTIONS(self) -> None:  # noqa: N802
            if not self._guard(mutation=False):
                return
            self.send_response(204)
            self._set_cors()
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            if not self._guard(mutation=False):
                return
            route = parse_imitation_path(self.path)
            if not route:
                self._send_json(404, {"ok": False, "error": "not found"})
                return
            if route.get("name") == "traversal":
                self._send_json(400, {"ok": False, "error": "invalid path"})
                return
            try:
                self._handle_get(route)
            except OverlayError as exc:
                msg = str(exc)
                status = 400 if "Invalid" in msg else 404
                self._send_json(status, {"ok": False, "error": msg})
            except CatalogError as exc:
                self._send_json(404, {"ok": False, "error": str(exc)})
            except ImitationError as exc:
                self._send_json(400, {"ok": False, "error": str(exc)})
            except FileNotFoundError as exc:
                self._send_json(404, {"ok": False, "error": str(exc)})
            except Exception as exc:  # noqa: BLE001
                self._send_json(500, {"ok": False, "error": str(exc)})

        def do_POST(self) -> None:  # noqa: N802
            if not self._guard(mutation=True):
                return
            route = parse_imitation_path(self.path)
            if not route:
                self._send_json(404, {"ok": False, "error": "not found"})
                return
            if route.get("name") == "traversal":
                self._send_json(400, {"ok": False, "error": "invalid path"})
                return
            try:
                self._handle_post(route)
            except WorkerBusy as exc:
                self._send_json(409, {"ok": False, "error": str(exc)})
            except OverlayError as exc:
                msg = str(exc)
                status = 400 if "Invalid" in msg or "stale" in msg.lower() else 404
                self._send_json(status, {"ok": False, "error": msg})
            except CatalogError as exc:
                self._send_json(404, {"ok": False, "error": str(exc)})
            except AssembleError as exc:
                self._send_json(400, {"ok": False, "error": str(exc)})
            except ImitationError as exc:
                self._send_json(400, {"ok": False, "error": str(exc)})
            except Exception as exc:  # noqa: BLE001
                traceback.print_exc()
                self._send_json(500, {"ok": False, "error": f"{type(exc).__name__}: {exc}"})

        def _handle_get(self, route: dict[str, str]) -> None:
            name = route["name"]
            if name == "health":
                seed = defaults["seedVc"]
                device = "unloaded"
                if state.session.loaded is not None:
                    device = str(state.session.loaded.seed_inf.device)
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "engine": "seed-vc-svc",
                        "modelState": state.model_state,
                        "modelError": state.model_error,
                        "qwenModelState": state.qwen_model_state,
                        "qwenModelError": state.qwen_model_error,
                        "qwenLang": state.qwen.lang,
                        "python": sys.executable,
                        "device": device,
                        "f0_condition": True,
                        "auto_f0_adjust": bool(seed["auto_f0_adjust"]),
                        "diffusion_steps": int(seed["diffusion_steps"]),
                    },
                )
                return
            if name == "defaults":
                self._send_json(200, {"ok": True, **state.public_defaults()})
                return
            if name == "outputs":
                self._send_json(
                    200,
                    {"ok": True, "outputs": [public_output(row) for row in list_outputs()]},
                )
                return
            row = get_output(route["outputId"])
            chunks = chunks_dir(state.audio_root, row)
            if name == "timeline":
                self._send_json(200, _timeline_payload(state, row, chunks))
                return
            if name == "chunk":
                body, extra = _chunk_wav(state, row, chunks, route["cueId"])
                extra = {"Cache-Control": "no-store", **extra}
                self._send(200, "audio/wav", body, extra)
                return
            if name == "take_audio":
                body, extra = _take_wav(state, row, route["takeId"])
                extra = {"Cache-Control": "no-store", **extra}
                self._send(200, "audio/wav", body, extra)
                return
            if name == "assembled":
                path = assembled_path(state.imitation_root, row)
                if not path.is_file():
                    self._send_json(404, {"ok": False, "error": "not assembled yet"})
                    return
                body = path.read_bytes()
                extra = {
                    "Content-Disposition": f'attachment; filename="{path.name}"',
                    "Cache-Control": "no-store",
                }
                self._send(200, "audio/mpeg", body, extra)
                return
            self._send_json(404, {"ok": False, "error": "not found"})

        def _handle_post(self, route: dict[str, str]) -> None:
            name = route["name"]
            if name == "prepare":
                if not state.convert_lock.acquire(blocking=False):
                    raise WorkerBusy("convert in progress")
                try:
                    state.prepare()
                finally:
                    state.convert_lock.release()
                self._send_json(200, {"ok": True, "modelState": state.model_state})
                return
            if name == "prepare-qwen":
                body = _read_json_body(self, max_upload)
                qs = parse_qs(urlparse(self.path).query)
                lang = str(
                    body.get("lang")
                    or (qs.get("lang") or [None])[0]
                    or "es"
                )
                if not state.convert_lock.acquire(blocking=False):
                    raise WorkerBusy("convert in progress")
                try:
                    state.prepare_qwen(lang)
                finally:
                    state.convert_lock.release()
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "qwenModelState": state.qwen_model_state,
                        "qwenLang": state.qwen.lang,
                    },
                )
                return
            row = get_output(route["outputId"])
            if name == "assemble":
                payload = _assemble(state, row)
                self._send_json(200, {"ok": True, **payload})
                return
            if name == "purge-takes":
                body = _read_json_body(self, max_upload)
                dry_run = parse_bool(body.get("dryRun"), default=False)
                if not state.convert_lock.acquire(blocking=False):
                    raise WorkerBusy("convert in progress")
                try:
                    payload = state.overlay.purge_unreferenced_takes(
                        str(row["id"]), dry_run=dry_run
                    )
                finally:
                    state.convert_lock.release()
                self._send_json(200, {"ok": True, **payload})
                return
            cue_id = route.get("cueId") or ""
            if name == "convert":
                payload = _convert_cue(self, state, row, cue_id, max_upload, max_seconds)
                self._send_json(200, {"ok": True, **payload})
                return
            if name == "regenerate":
                body = _read_json_body(self, max_upload)
                payload = _regenerate_cue(state, row, cue_id, body)
                self._send_json(200, {"ok": True, **payload})
                return
            if name == "accept":
                body = _read_json_body(self, max_upload)
                take_id = str(body.get("takeId") or "")
                if not take_id:
                    raise ImitationError("takeId is required")
                pointer = _accept_cue(state, row, cue_id, take_id)
                self._send_json(200, {"ok": True, "replacement": pointer})
                return
            if name == "restore":
                _restore_cue(state, row, cue_id)
                self._send_json(200, {"ok": True, "replacement": None})
                return
            self._send_json(404, {"ok": False, "error": "not found"})

        def do_PUT(self) -> None:  # noqa: N802
            self._send_json(405, {"ok": False, "error": "method not allowed"})

        def do_DELETE(self) -> None:  # noqa: N802
            self._send_json(405, {"ok": False, "error": "method not allowed"})

    return Handler


def _read_json_body(handler: BaseHTTPRequestHandler, max_upload: int) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length") or 0)
    if length < 0 or length > max_upload:
        raise ImitationError("Invalid Content-Length")
    raw = handler.rfile.read(length) if length else b"{}"
    if not raw:
        return {}
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ImitationError("JSON body required") from exc
    if not isinstance(data, dict):
        raise ImitationError("JSON object required")
    return data


def _load_output_index(state: WorkerState, row: dict[str, Any]) -> tuple[Path, dict[str, Any], Path]:
    chunks = chunks_dir(state.audio_root, row)
    index = load_index(chunks)
    return chunks, index, chunks / "index.json"


def _timeline_payload(state: WorkerState, row: dict[str, Any], chunks: Path) -> dict[str, Any]:
    index = load_index(chunks)
    index_path = chunks / "index.json"
    digest = index_hash(index_path)
    lang = str(row.get("lang") or index.get("lang") or "")
    recordable = {str(name) for name in (row.get("recordableSpeakers") or [])}
    cues_out: list[dict[str, Any]] = []
    for cue in index.get("cues") or []:
        if not isinstance(cue, dict):
            continue
        cue_id = str(cue.get("id") or "")
        original = chunks / str(cue.get("wav") or "")
        fingerprint = cue_fingerprint(cue, lang=lang, original_wav=original)
        dialogue_key = dialogue_key_for_cue(cue, require=False)
        status = state.overlay.replacement_status(
            output_id=str(row["id"]),
            dialogue_key=dialogue_key,
            current_fingerprint=fingerprint,
        )
        seconds = effective_seconds(
            original_wav=original,
            overlay=state.overlay,
            output_id=str(row["id"]),
            dialogue_key=dialogue_key,
            current_fingerprint=fingerprint,
        )
        takes = []
        if dialogue_key:
            for meta in state.overlay.list_takes(str(row["id"]), dialogue_key):
                stored = meta.get("fingerprint") if isinstance(meta.get("fingerprint"), dict) else meta
                takes.append(
                    {
                        "takeId": meta.get("takeId"),
                        "createdAt": meta.get("createdAt"),
                        "durationSec": meta.get("durationSec"),
                        "stale": not fingerprints_match(stored, fingerprint),
                        "settings": meta.get("settings") or {},
                        "previewUrl": (
                            f"/v1/imitation/outputs/{row['id']}/takes/{meta.get('takeId')}/audio"
                        ),
                    }
                )
        cache_key = "original"
        replacement = None
        if status:
            replacement = {
                "status": status["status"],
                "takeId": status["takeId"],
                "acceptedAt": status.get("acceptedAt"),
                "stale": status["stale"],
            }
            if not status["stale"]:
                cache_key = str(status["takeId"])
        cues_out.append(
            {
                "id": cue_id,
                "stableDialogueId": dialogue_key,
                "speaker": cue.get("speaker"),
                "engine": cue.get("engine"),
                "text": cue.get("text"),
                "instruct": cue.get("instruct"),
                "recordable": str(cue.get("speaker") or "") in recordable,
                "preSilenceMs": int(cue.get("pre_silence_ms") or 0),
                "originalSeconds": float(cue.get("seconds") or 0),
                "effectiveSeconds": seconds,
                "replacement": replacement,
                "takes": takes,
                "cacheKey": cache_key,
                "cueFingerprint": fingerprint,
            }
        )
    return {
        "ok": True,
        "output": public_output(row),
        "indexFingerprint": digest,
        "cueCount": len(cues_out),
        "sampleRate": int(index.get("sample_rate") or row.get("expectedSampleRate") or 0),
        "modelState": state.model_state,
        "modelError": state.model_error,
        "qwenModelState": state.qwen_model_state,
        "qwenModelError": state.qwen_model_error,
        "python": sys.executable,
        "cues": cues_out,
    }


def _chunk_wav(
    state: WorkerState, row: dict[str, Any], chunks: Path, cue_id: str
) -> tuple[bytes, dict[str, str]]:
    index = load_index(chunks)
    cue = find_cue(index, cue_id)
    original = chunks / str(cue.get("wav") or "")
    lang = str(row.get("lang") or index.get("lang") or "")
    fingerprint = cue_fingerprint(cue, lang=lang, original_wav=original)
    dialogue_key = dialogue_key_for_cue(cue, require=False)
    path, kind, status = state.overlay.resolve_effective_wav(
        output_id=str(row["id"]),
        dialogue_key=dialogue_key,
        original_wav=original,
        current_fingerprint=fingerprint,
    )
    if status and status.get("stale"):
        path = original
        kind = "original"
    extra = {
        "X-Imitation-Effective": kind,
        "X-Imitation-Cue": cue_id,
    }
    if dialogue_key:
        extra["X-Imitation-Dialogue"] = dialogue_key
    return path.read_bytes(), extra


def _take_wav(state: WorkerState, row: dict[str, Any], take_id: str) -> tuple[bytes, dict[str, str]]:
    output_id = str(row["id"])
    path, dialogue_key = state.overlay.find_take_converted_wav(output_id, take_id)
    extra = {"X-Imitation-Take": take_id}
    if dialogue_key:
        extra["X-Imitation-Dialogue"] = dialogue_key
    return path.read_bytes(), extra


def _assert_recordable(row: dict[str, Any], cue: dict[str, Any]) -> None:
    speaker = str(cue.get("speaker") or "")
    allowed = {str(name) for name in (row.get("recordableSpeakers") or [])}
    if speaker not in allowed:
        raise ImitationError(f"{speaker or 'Narrator'} is not recordable")


def _convert_settings(qs: dict[str, list[str]], defaults: dict[str, Any]) -> dict[str, Any]:
    seed = defaults["seedVc"]
    steps = qs.get("diffusion_steps") or qs.get("diffusion-steps")
    auto = qs.get("auto_f0_adjust") or qs.get("auto-f0-adjust")
    pitch = qs.get("pitch_shift") or qs.get("semi_tone_shift") or qs.get("semi-tone-shift")
    length = qs.get("length_adjust") or qs.get("length-adjust")
    cfg = qs.get("inference_cfg_rate") or qs.get("inference-cfg-rate")
    return {
        "f0_condition": True,
        "auto_f0_adjust": parse_bool(auto[0] if auto else None, default=bool(seed["auto_f0_adjust"])),
        "semi_tone_shift": clamp_semi_tone_shift(
            int(pitch[0]) if pitch else int(seed["semi_tone_shift"]), defaults
        ),
        "diffusion_steps": clamp_diffusion_steps(
            int(steps[0]) if steps else int(seed["diffusion_steps"]), defaults
        ),
        "length_adjust": clamp_length_adjust(
            float(length[0]) if length else float(seed["length_adjust"]), defaults
        ),
        "inference_cfg_rate": clamp_inference_cfg_rate(
            float(cfg[0]) if cfg else float(seed["inference_cfg_rate"]), defaults
        ),
    }


def _convert_cue(
    handler: BaseHTTPRequestHandler,
    state: WorkerState,
    row: dict[str, Any],
    cue_id: str,
    max_upload: int,
    max_seconds: float,
) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length") or 0)
    if length <= 0:
        raise ImitationError("Empty body")
    if length > max_upload:
        raise ImitationError(f"Upload exceeds {max_upload} bytes")
    raw = handler.rfile.read(length)
    sniffed = sniff_audio_mime(raw)
    content_type = handler.headers.get("Content-Type")
    filename = (
        parse_qs(urlparse(handler.path).query).get("filename") or [None]
    )[0] or handler.headers.get("Filename") or handler.headers.get("X-Filename")
    if sniffed is None and (content_type or "").startswith("image/"):
        raise ImitationError("Unsupported Content-Type")
    if sniffed is None and not filename:
        declared = (content_type or "").split(";")[0].strip().lower()
        if declared and declared not in {"audio/wav", "audio/webm", "application/octet-stream"}:
            raise ImitationError(f"Unsupported Content-Type {content_type!r}")

    chunks, index, index_path = _load_output_index(state, row)
    cue = find_cue(index, cue_id)
    _assert_recordable(row, cue)
    dialogue_key_for_cue(cue, require=True)
    lang = normalize_lang(str(row.get("lang") or index.get("lang") or "es"))
    character, target = resolve_target(
        character=str(cue.get("speaker") or ""),
        lang=lang,
        defaults=state.defaults,
    )
    settings = _convert_settings(parse_qs(urlparse(handler.path).query), state.defaults)
    original = chunks / str(cue.get("wav") or "")
    fingerprint = cue_fingerprint(cue, lang=lang, original_wav=original)

    if not state.convert_lock.acquire(blocking=False):
        raise WorkerBusy("convert in progress")
    try:
        import tempfile

        with tempfile.TemporaryDirectory(prefix="imitation-take-") as tmp:
            hint = Path(filename or "take").stem or "take"
            src_wav = Path(tmp) / f"{hint}.wav"
            write_upload_wav(raw, src_wav, content_type=content_type, filename=filename)
            duration = wav_duration_seconds(src_wav)
            if duration > max_seconds:
                raise ImitationError(f"Recording exceeds {max_seconds} seconds")
            converted = Path(tmp) / "converted.wav"
            state.prepare()
            payload = state.session.convert(
                src_wav,
                target,
                converted,
                character=character,
                lang=lang,
                diffusion_steps=int(settings["diffusion_steps"]),
                auto_f0_adjust=bool(settings["auto_f0_adjust"]),
                semi_tone_shift=int(settings["semi_tone_shift"]),
                length_adjust=float(settings["length_adjust"]),
                inference_cfg_rate=float(settings["inference_cfg_rate"]),
            )
            meta = state.overlay.write_take(
                output_id=str(row["id"]),
                cue=cue,
                fingerprint=fingerprint,
                index_hash_value=index_hash(index_path),
                source_wav=src_wav,
                converted_wav=converted,
                settings={
                    **settings,
                    "checkpoint": payload.get("checkpoint"),
                    "engine": payload.get("engine"),
                },
            )
    finally:
        state.convert_lock.release()

    take_id = str(meta["takeId"])
    preview = f"/v1/imitation/outputs/{row['id']}/takes/{take_id}/audio"
    return {
        "takeId": take_id,
        "durationSec": meta["durationSec"],
        "previewUrl": preview,
        "settings": meta.get("settings") or settings,
        "modelState": state.model_state,
        "cueId": cue_id,
    }


def _regenerate_cue(
    state: WorkerState,
    row: dict[str, Any],
    cue_id: str,
    body: dict[str, Any],
) -> dict[str, Any]:
    chunks, index, index_path = _load_output_index(state, row)
    cue = find_cue(index, cue_id)
    _assert_recordable(row, cue)
    dialogue_key_for_cue(cue, require=True)
    lang = normalize_lang(str(row.get("lang") or index.get("lang") or "es"))
    qwen_defaults = public_qwen_defaults(lang)
    original = chunks / str(cue.get("wav") or "")
    fingerprint = cue_fingerprint(cue, lang=lang, original_wav=original)

    temperature = body.get("temperature", qwen_defaults["temperature"])
    top_p = body.get("top_p", qwen_defaults["top_p"])
    top_k = body.get("top_k", qwen_defaults["top_k"])
    max_new_tokens = body.get("max_new_tokens", qwen_defaults["max_new_tokens"])
    repetition_penalty = body.get("repetition_penalty", qwen_defaults["repetition_penalty"])
    line_instruct = body.get("instruct")
    if line_instruct is None:
        line_instruct = cue.get("instruct")
    expressiveness_prefix = body.get("expressiveness_prefix")
    if expressiveness_prefix is None:
        expressiveness_prefix = qwen_defaults["expressivenessPrefix"]
    default_instruct = body.get("default_instruct")
    if default_instruct is None:
        default_instruct = qwen_defaults["defaultInstruct"]

    if not state.convert_lock.acquire(blocking=False):
        raise WorkerBusy("convert in progress")
    try:
        import tempfile

        with tempfile.TemporaryDirectory(prefix="imitation-qwen-") as tmp:
            out_wav = Path(tmp) / "converted.wav"
            state.prepare_qwen(lang)
            settings = state.qwen.synthesize(
                speaker=str(cue.get("speaker") or ""),
                text=str(cue.get("text") or ""),
                line_instruct=str(line_instruct) if line_instruct is not None else None,
                lang=lang,
                temperature=float(temperature),
                top_p=float(top_p),
                top_k=int(top_k),
                max_new_tokens=int(max_new_tokens),
                repetition_penalty=float(repetition_penalty),
                expressiveness_prefix=(
                    str(expressiveness_prefix) if expressiveness_prefix is not None else None
                ),
                default_instruct=str(default_instruct) if default_instruct is not None else None,
                out_wav=out_wav,
            )
            source_wav = original if original.is_file() else out_wav
            meta = state.overlay.write_take(
                output_id=str(row["id"]),
                cue=cue,
                fingerprint=fingerprint,
                index_hash_value=index_hash(index_path),
                source_wav=source_wav,
                converted_wav=out_wav,
                settings=settings,
            )
    finally:
        state.convert_lock.release()

    take_id = str(meta["takeId"])
    preview = f"/v1/imitation/outputs/{row['id']}/takes/{take_id}/audio"
    return {
        "takeId": take_id,
        "durationSec": meta["durationSec"],
        "previewUrl": preview,
        "settings": meta.get("settings") or settings,
        "modelState": state.model_state,
        "qwenModelState": state.qwen_model_state,
        "cueId": cue_id,
    }


def _accept_cue(state: WorkerState, row: dict[str, Any], cue_id: str, take_id: str) -> dict[str, Any]:
    chunks, index, index_path = _load_output_index(state, row)
    cue = find_cue(index, cue_id)
    _assert_recordable(row, cue)
    dialogue_key = dialogue_key_for_cue(cue, require=True)
    assert dialogue_key is not None
    lang = str(row.get("lang") or index.get("lang") or "")
    original = chunks / str(cue.get("wav") or "")
    fingerprint = cue_fingerprint(cue, lang=lang, original_wav=original)
    return state.overlay.accept(
        output_id=str(row["id"]),
        dialogue_key=dialogue_key,
        take_id=take_id,
        current_fingerprint=fingerprint,
        index_hash_value=index_hash(index_path),
    )


def _restore_cue(state: WorkerState, row: dict[str, Any], cue_id: str) -> None:
    chunks, index, _index_path = _load_output_index(state, row)
    cue = find_cue(index, cue_id)
    dialogue_key = dialogue_key_for_cue(cue, require=True)
    assert dialogue_key is not None
    state.overlay.restore(str(row["id"]), dialogue_key)
    _ = chunks


def _assemble(state: WorkerState, row: dict[str, Any]) -> dict[str, Any]:
    chunks, index, index_path = _load_output_index(state, row)
    dest = assembled_path(state.imitation_root, row)
    canonical = canonical_mp3_path(state.audio_root, row)
    assert_not_canonical(dest)
    if dest.resolve() == canonical.resolve():
        raise AssembleError("Refusing to overwrite canonical dual")
    lang = str(row.get("lang") or index.get("lang") or "")
    fingerprints = {}
    for cue in index.get("cues") or []:
        if not isinstance(cue, dict):
            continue
        original = chunks / str(cue.get("wav") or "")
        fingerprints[str(cue["id"])] = cue_fingerprint(cue, lang=lang, original_wav=original)
    result = assemble_output(
        output_row=row,
        index=index,
        chunks_dir=chunks,
        overlay=state.overlay,
        dest=dest,
        fingerprints=fingerprints,
    )
    result["url"] = f"/v1/imitation/outputs/{row['id']}/assembled"
    result["indexFingerprint"] = index_hash(index_path)
    return result
