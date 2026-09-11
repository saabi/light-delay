"""Studio Qwen3-TTS regenerate: ICL clone with adjustable emotion knobs.

In-process when ``qwen_tts`` is importable (system Python). Otherwise talks to
``scripts/qwen-studio-sidecar.py`` started with LIGHT_DELAY_QWEN_PYTHON / system
Python — Seed-VC venv does not ship qwen_tts.
"""

from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from importlib import import_module
from importlib.machinery import SourceFileLoader
from importlib.util import find_spec
from pathlib import Path
from typing import Any

import numpy as np

from lib.qwen_icl import compose_instruct, load_defaults as load_qwen_defaults, qwen_generation
from lib.seedvc_imitation import ImitationError, normalize_lang

ROOT = Path(__file__).resolve().parents[2]
QWEN_CAST_EN = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
QWEN_CAST_ES = ROOT / "docs" / "wip" / "qwen3-tts-cast.es.json"
SIDECAR_SCRIPT = ROOT / "scripts" / "qwen-studio-sidecar.py"
ENV_QWEN_PYTHON = "LIGHT_DELAY_QWEN_PYTHON"
ENV_QWEN_SIDECAR_PORT = "LIGHT_DELAY_QWEN_SIDECAR_PORT"
DEFAULT_SIDECAR_PORT = 8766


def _load_dual():
    return SourceFileLoader(
        "dual_outline_audio", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()


def cast_path_for_lang(lang: str) -> Path:
    return QWEN_CAST_ES if normalize_lang(lang) == "es" else QWEN_CAST_EN


def public_qwen_defaults(lang: str = "es") -> dict[str, Any]:
    language = "Spanish" if normalize_lang(lang) == "es" else "English"
    gen = qwen_generation(load_qwen_defaults(), language=language)
    return {
        "engine": "qwen-clone",
        "x_vector_only": False,
        "temperature": gen["temperature"],
        "top_p": gen["top_p"],
        "top_k": gen["top_k"],
        "max_new_tokens": gen["max_new_tokens"],
        "repetition_penalty": gen["repetition_penalty"],
        "non_streaming_mode": gen["non_streaming_mode"],
        "defaultInstruct": gen["instruct"],
        "expressivenessPrefix": gen["expressiveness_prefix"],
        "bounds": {
            "temperature": {"min": 0.1, "max": 1.5},
            "top_p": {"min": 0.5, "max": 1.0},
            "top_k": {"min": 1, "max": 100},
            "max_new_tokens": {"min": 256, "max": 4096},
            "repetition_penalty": {"min": 0.9, "max": 1.3},
        },
    }


def clamp_temperature(value: float) -> float:
    return max(0.1, min(1.5, float(value)))


def clamp_top_p(value: float) -> float:
    return max(0.5, min(1.0, float(value)))


def clamp_top_k(value: int) -> int:
    return max(1, min(100, int(value)))


def clamp_max_new_tokens(value: int) -> int:
    return max(256, min(4096, int(value)))


def clamp_repetition_penalty(value: float) -> float:
    return max(0.9, min(1.3, float(value)))


def qwen_tts_available() -> bool:
    return find_spec("qwen_tts") is not None


def resolve_qwen_python() -> Path:
    env = (os.environ.get(ENV_QWEN_PYTHON) or "").strip()
    candidates: list[Path] = []
    if env:
        candidates.append(Path(env))
    which = shutil.which("python")
    if which:
        candidates.append(Path(which))
    # Windows Store / py launcher often used for dual renders
    for name in ("py", "python3"):
        found = shutil.which(name)
        if found:
            candidates.append(Path(found))
    tried: list[str] = []
    for candidate in candidates:
        if not candidate:
            continue
        cmd = [str(candidate)]
        if candidate.name.lower().startswith("py") and candidate.suffix.lower() in {
            ".exe",
            "",
        }:
            # `py -3 -c ...` when launcher
            if candidate.stem.lower() == "py":
                probe = [str(candidate), "-3", "-c", "import qwen_tts"]
            else:
                probe = [str(candidate), "-c", "import qwen_tts"]
        else:
            probe = [str(candidate), "-c", "import qwen_tts"]
        tried.append(" ".join(probe))
        try:
            proc = subprocess.run(
                probe,
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            continue
        if proc.returncode == 0:
            return candidate
    raise ImitationError(
        "No Python with qwen_tts found for Studio regenerate. "
        f"Set {ENV_QWEN_PYTHON} to the interpreter used by "
        "generate-dual-outline-audio.py (system Python, not Seed-VC .venv). "
        f"Tried: {tried or ['(none)']}"
    )


def sidecar_port() -> int:
    raw = (os.environ.get(ENV_QWEN_SIDECAR_PORT) or "").strip()
    if raw:
        return int(raw)
    return DEFAULT_SIDECAR_PORT


class QwenRegenSession:
    """In-process lazy Qwen Base clone (requires qwen_tts in this interpreter)."""

    def __init__(self) -> None:
        self.model = None
        self.prompts: dict[str, Any] = {}
        self.cast: dict[str, Any] | None = None
        self.lang: str | None = None
        self.dual = None
        self.error: str | None = None

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def load(self, lang: str) -> None:
        lang = normalize_lang(lang)
        if self.loaded and self.lang == lang:
            return
        try:
            import_module("qwen_tts")
            dual = _load_dual()
            dual.bootstrap_kokoro_cuda()
            cast = json.loads(cast_path_for_lang(lang).read_text(encoding="utf-8"))
            cache = Path(cast["models"]["cacheDir"])
            os.environ["HF_HOME"] = str(cache)
            os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache / "hub")
            os.environ.pop("HF_HUB_CACHE", None)
            model = dual.load_qwen_clone(cast)
            prompts = dual.build_clone_prompts(model, cast, whisper_model=None, force_whisper=False)
            self.dual = dual
            self.model = model
            self.cast = cast
            self.prompts = prompts
            self.lang = lang
            self.error = None
        except Exception as exc:  # noqa: BLE001
            self.error = str(exc)
            self.model = None
            self.prompts = {}
            self.cast = None
            self.lang = None
            raise ImitationError(f"Qwen load failed: {exc}") from exc

    def synthesize(
        self,
        *,
        speaker: str,
        text: str,
        line_instruct: str | None,
        lang: str,
        temperature: float,
        top_p: float,
        top_k: int,
        max_new_tokens: int,
        repetition_penalty: float,
        expressiveness_prefix: str | None,
        default_instruct: str | None,
        out_wav: Path,
    ) -> dict[str, Any]:
        lang = normalize_lang(lang)
        self.load(lang)
        assert self.model is not None and self.dual is not None and self.cast is not None
        prompt = self.prompts.get(speaker)
        if prompt is None:
            raise ImitationError(f"No Qwen clone prompt for speaker {speaker!r}")
        spoken = (text or "").strip()
        if (spoken.startswith('"') and spoken.endswith('"')) or (
            spoken.startswith("“") and spoken.endswith("”")
        ):
            spoken = spoken[1:-1].strip()
        if not spoken:
            raise ImitationError("Cue has no spoken text to regenerate")

        language = "Spanish" if lang == "es" else "English"
        gen = qwen_generation(load_qwen_defaults(), language=language)
        default = (default_instruct if default_instruct is not None else gen["instruct"]).strip()
        prefix = (
            expressiveness_prefix
            if expressiveness_prefix is not None
            else gen["expressiveness_prefix"]
        )
        instruct = compose_instruct(
            line_instruct,
            default_instruct=default or gen["instruct"],
            expressiveness_prefix=str(prefix or ""),
        )
        temp = clamp_temperature(temperature)
        tp = clamp_top_p(top_p)
        tk = clamp_top_k(top_k)
        mnt = clamp_max_new_tokens(max_new_tokens)
        rp = clamp_repetition_penalty(repetition_penalty)

        wav, sr = self.dual.qwen_clone_with_instruct(
            self.model,
            text=spoken,
            language=language,
            voice_clone_prompt=prompt,
            instruct=instruct,
            non_streaming_mode=bool(gen["non_streaming_mode"]),
            temperature=temp,
            top_p=tp,
            top_k=tk,
            max_new_tokens=mnt,
            repetition_penalty=rp,
        )
        target_sr = 24000
        samples = self.dual.resample_linear(np.asarray(wav, dtype=np.float32), int(sr), target_sr)
        samples = np.clip(samples * 0.92, -1.0, 1.0)
        max_out = float(gen["max_out_seconds"])
        if len(samples) / float(target_sr) > max_out:
            raise ImitationError(f"Qwen output exceeds {max_out}s")
        out_wav.parent.mkdir(parents=True, exist_ok=True)
        import soundfile as sf

        sf.write(str(out_wav), samples, target_sr)
        return {
            "engine": "qwen-clone",
            "temperature": temp,
            "top_p": tp,
            "top_k": tk,
            "max_new_tokens": mnt,
            "repetition_penalty": rp,
            "instruct": instruct,
            "expressiveness_prefix": str(prefix or ""),
            "default_instruct": default,
            "x_vector_only": False,
            "sample_rate": target_sr,
            "python": sys.executable,
        }


class QwenSidecarClient:
    """HTTP client + optional auto-start for qwen-studio-sidecar.py."""

    def __init__(self, port: int | None = None) -> None:
        self.port = port or sidecar_port()
        self.proc: subprocess.Popen[str] | None = None
        self.lang: str | None = None
        self.error: str | None = None
        self.python: str | None = None

    @property
    def base(self) -> str:
        return f"http://127.0.0.1:{self.port}"

    def _request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        *,
        timeout: float = 120,
    ) -> dict[str, Any]:
        data = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(
            f"{self.base}{path}",
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except TimeoutError as exc:
            self.kill()
            raise ImitationError(
                "Qwen sidecar timed out (GPU hang?). Sidecar was restarted; try regenerate again."
            ) from exc
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"ok": False, "error": raw or str(exc)}
            err = body.get("error") or str(exc)
            if exc.code == 409:
                raise ImitationError(str(err)) from exc
            raise ImitationError(str(err)) from exc
        except urllib.error.URLError as exc:
            reason = getattr(exc, "reason", None)
            if isinstance(reason, TimeoutError) or "timed out" in str(exc).lower():
                self.kill()
                raise ImitationError(
                    "Qwen sidecar timed out (GPU hang?). Sidecar was restarted; try regenerate again."
                ) from exc
            raise ImitationError(f"Qwen sidecar unreachable: {exc}") from exc
        if not body.get("ok"):
            raise ImitationError(str(body.get("error") or "sidecar error"))
        return body

    def health(self) -> dict[str, Any] | None:
        try:
            return self._request("GET", "/health", timeout=3)
        except ImitationError:
            return None

    def kill(self) -> None:
        proc = self.proc
        self.proc = None
        self.lang = None
        if proc is None:
            # Best-effort: free the port if an orphan holds it
            return
        if proc.poll() is None:
            print("Killing hung Qwen sidecar…", flush=True)
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)

    def ensure_running(self) -> None:
        if self.health() is not None:
            return
        self.kill()
        py = resolve_qwen_python()
        self.python = str(py)
        cmd = [str(py)]
        if Path(py).stem.lower() == "py":
            cmd = [str(py), "-3"]
        cmd.extend([str(SIDECAR_SCRIPT), "--port", str(self.port)])
        self.proc = subprocess.Popen(
            cmd,
            cwd=str(ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
        )
        print(f"Starting Qwen sidecar: {' '.join(cmd)}", flush=True)
        deadline = time.time() + 120
        last_err = "timeout"
        while time.time() < deadline:
            if self.proc is not None and self.proc.poll() is not None:
                err = ""
                if self.proc.stderr:
                    err = self.proc.stderr.read() or ""
                raise ImitationError(
                    f"Qwen sidecar exited (code {self.proc.returncode}). {err.strip()}"
                )
            hit = self.health()
            if hit is not None:
                self.python = str(hit.get("python") or self.python)
                return
            time.sleep(0.4)
            last_err = "not ready"
        self.kill()
        raise ImitationError(f"Qwen sidecar failed to start ({last_err})")

    def prepare(self, lang: str) -> dict[str, Any]:
        self.ensure_running()
        lang = normalize_lang(lang)
        body = self._request("POST", "/prepare", {"lang": lang}, timeout=600)
        self.lang = lang
        self.error = None
        return body

    def synthesize(self, **kwargs: Any) -> dict[str, Any]:
        self.ensure_running()
        out_wav: Path = kwargs.pop("out_wav")
        lang = normalize_lang(str(kwargs.get("lang") or "es"))
        payload = {
            "lang": lang,
            "speaker": kwargs.get("speaker"),
            "text": kwargs.get("text"),
            "instruct": kwargs.get("line_instruct"),
            "temperature": kwargs.get("temperature"),
            "top_p": kwargs.get("top_p"),
            "top_k": kwargs.get("top_k"),
            "max_new_tokens": kwargs.get("max_new_tokens"),
            "repetition_penalty": kwargs.get("repetition_penalty"),
            "expressiveness_prefix": kwargs.get("expressiveness_prefix"),
            "default_instruct": kwargs.get("default_instruct"),
        }
        # Warm model (can take minutes); synthesis of one line should be faster.
        self.prepare(lang)
        synth_timeout = float(os.environ.get("LIGHT_DELAY_QWEN_SYNTH_TIMEOUT") or 180)
        body = self._request("POST", "/synthesize", payload, timeout=synth_timeout)
        raw = base64.b64decode(str(body.get("wavBase64") or ""))
        if not raw:
            raise ImitationError("Qwen sidecar returned empty audio")
        out_wav.parent.mkdir(parents=True, exist_ok=True)
        out_wav.write_bytes(raw)
        settings = dict(body.get("settings") or {})
        settings.setdefault("python", body.get("python") or self.python or "sidecar")
        self.lang = lang
        return settings


class QwenRegenGateway:
    """In-process Qwen when available; otherwise Seed-VC worker → system Python sidecar."""

    def __init__(self) -> None:
        self._local: QwenRegenSession | None = None
        self._sidecar: QwenSidecarClient | None = None
        self.lang: str | None = None
        self.error: str | None = None
        self.mode: str = "unloaded"

    @property
    def loaded(self) -> bool:
        if self._local and self._local.loaded:
            return True
        if self._sidecar and self._sidecar.health() is not None:
            return self.lang is not None
        return False

    def load(self, lang: str) -> None:
        lang = normalize_lang(lang)
        if qwen_tts_available():
            if self._local is None:
                self._local = QwenRegenSession()
            self._local.load(lang)
            self.lang = self._local.lang
            self.error = self._local.error
            self.mode = "in-process"
            return
        if self._sidecar is None:
            self._sidecar = QwenSidecarClient()
        self._sidecar.prepare(lang)
        self.lang = lang
        self.error = None
        self.mode = "sidecar"
        print(
            f"Qwen regenerate via sidecar python={self._sidecar.python} port={self._sidecar.port}",
            flush=True,
        )

    def synthesize(self, **kwargs: Any) -> dict[str, Any]:
        lang = normalize_lang(str(kwargs.get("lang") or "es"))
        self.load(lang)
        if self._local is not None and qwen_tts_available():
            return self._local.synthesize(**kwargs)
        assert self._sidecar is not None
        return self._sidecar.synthesize(**kwargs)
