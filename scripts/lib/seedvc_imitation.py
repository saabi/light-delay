"""Seed-VC SVC imitation pass: keep actor F0/emotion, paint character timbre.

GPU-free helpers (defaults, casts, --check) import without torch. Model load and
convert() require the Seed-VC venv and chdir into E:/Models/Seed-VC.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import site
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULTS_PATH = ROOT / "docs" / "wip" / "seedvc-imitation-defaults.json"
LOCAL_DEFAULTS_PATH = ROOT / "docs" / "wip" / "seedvc-imitation-defaults.local.json"

ENV_SEEDVC_ROOT = "LIGHT_DELAY_SEEDVC_ROOT"
ENV_AUDIO_ROOT = "LIGHT_DELAY_AUDIO_ROOT"
ENV_IMITATION_ROOT = "LIGHT_DELAY_IMITATION_ROOT"

REQUIRED_SEEDVC_KEYS = (
    "f0_condition",
    "auto_f0_adjust",
    "semi_tone_shift",
    "diffusion_steps",
    "diffusion_steps_max",
    "inference_cfg_rate",
    "length_adjust",
    "fp16",
    "checkpoint",
    "config",
)
REQUIRED_PATH_KEYS = (
    "castEn",
    "castEs",
    "audioOutputs",
)
LOCAL_PATH_KEYS = (
    "seedVcRoot",
    "audioRoot",
    "imitationRoot",
)

WAV_CONTENT_TYPES = frozenset(
    {"audio/wav", "audio/wave", "audio/x-wav", "audio/vnd.wave"}
)
CONVERTIBLE_CONTENT_TYPES = frozenset(
    {
        "audio/webm",
        "audio/ogg",
        "audio/opus",
        "audio/mpeg",
        "audio/mp3",
        "audio/flac",
        "audio/mp4",
        "audio/m4a",
        "audio/x-m4a",
        "audio/aac",
        "audio/x-aac",
    }
)


class ImitationError(ValueError):
    """User-facing configuration or request error."""


def deep_merge(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out


def _read_json_object(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ImitationError(f"Missing defaults file: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ImitationError(f"Defaults file is not an object: {path}")
    return data


def load_portable_defaults(path: Path | None = None) -> dict[str, Any]:
    return _read_json_object(path or DEFAULTS_PATH)


def apply_env_paths(
    defaults: dict[str, Any], environ: dict[str, str] | os._Environ[str] | None = None
) -> dict[str, Any]:
    env = environ if environ is not None else os.environ
    local = dict(defaults.get("localPaths") or {})
    mapping = {
        ENV_SEEDVC_ROOT: "seedVcRoot",
        ENV_AUDIO_ROOT: "audioRoot",
        ENV_IMITATION_ROOT: "imitationRoot",
    }
    for env_key, path_key in mapping.items():
        value = str(env.get(env_key) or "").strip()
        if value:
            local[path_key] = value
    merged = dict(defaults)
    merged["localPaths"] = local
    return merged


def load_defaults(
    path: Path | None = None,
    *,
    apply_local: bool = True,
    environ: dict[str, str] | os._Environ[str] | None = None,
) -> dict[str, Any]:
    data = load_portable_defaults(path)
    if apply_local and path is None:
        if LOCAL_DEFAULTS_PATH.is_file():
            data = deep_merge(data, _read_json_object(LOCAL_DEFAULTS_PATH))
        data = apply_env_paths(data, environ)
    elif apply_local:
        data = apply_env_paths(data, environ)
    return data


def local_path(defaults: dict[str, Any], key: str) -> Path:
    local = defaults.get("localPaths") if isinstance(defaults.get("localPaths"), dict) else {}
    value = str((local or {}).get(key) or "").strip()
    if not value:
        env_name = {
            "seedVcRoot": ENV_SEEDVC_ROOT,
            "audioRoot": ENV_AUDIO_ROOT,
            "imitationRoot": ENV_IMITATION_ROOT,
        }.get(key, key)
        raise ImitationError(
            f"Missing local path {key}. Set {env_name} or docs/wip/seedvc-imitation-defaults.local.json"
        )
    return Path(value)


def normalize_lang(lang: str) -> str:
    key = (lang or "").strip().lower()
    if key in {"es", "es-es", "spanish", "español", "espanol"}:
        return "es"
    if key in {"en", "en-us", "en-gb", "english"}:
        return "en"
    raise ImitationError(f"Unsupported lang {lang!r} (use es or en)")


def repo_path(rel: str, *, root: Path | None = None) -> Path:
    p = Path(rel)
    if p.is_absolute():
        return p
    return (root or ROOT) / p


def seedvc_root(defaults: dict[str, Any] | None = None) -> Path:
    return local_path(defaults or load_defaults(), "seedVcRoot")


def seedvc_venv_python(root: Path) -> Path:
    if os.name == "nt":
        return root / ".venv" / "Scripts" / "python.exe"
    return root / ".venv" / "bin" / "python"


def seedvc_serve_command(root: Path) -> str:
    return f"{seedvc_venv_python(root)} scripts/convert-imitation-performance.py --serve"


def seedvc_python_mismatch_warning(defaults: dict[str, Any] | None = None) -> str | None:
    try:
        root = seedvc_root(defaults)
    except ImitationError:
        return None
    expected = seedvc_venv_python(root)
    if not expected.is_file():
        return None
    current = Path(sys.executable).resolve()
    if current == expected.resolve():
        return None
    return (
        f"Warning: worker python is {current}. Load model / convert need the Seed-VC venv:\n"
        f"  {seedvc_serve_command(root)}"
    )


def missing_seedvc_dependency_error(exc: ModuleNotFoundError, root: Path) -> ImitationError:
    name = exc.name or "dependency"
    spec = importlib.util.find_spec(name) if name else None
    origin = getattr(spec, "origin", None) if spec else None
    return ImitationError(
        f"Seed-VC dependency missing ({name}) in {sys.executable}"
        + (f" (found {origin})" if origin else "")
        + f". Restart the worker with {seedvc_serve_command(root)}"
    )


def venv_site_packages() -> Path | None:
    scripts = Path(sys.executable).resolve().parent
    if scripts.name.lower() not in {"scripts", "bin"}:
        return None
    candidates = (
        scripts.parent / "Lib" / "site-packages",
        scripts.parent / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages",
    )
    for path in candidates:
        if path.is_dir():
            return path
    return None


def _ensure_venv_site() -> None:
    path = venv_site_packages()
    if path is None:
        return
    site.addsitedir(str(path))


def _purge_seedvc_imports() -> None:
    for name in list(sys.modules):
        if name == "inference" or name == "modules" or name.startswith("modules."):
            sys.modules.pop(name, None)


def _prepend_sys_path(root: Path) -> None:
    root_s = str(root)
    variants = {root_s, root_s.replace("\\", "/"), root_s.replace("/", "\\")}
    sys.path[:] = [item for item in sys.path if item not in variants]
    sys.path.insert(0, root_s)


def audio_root(defaults: dict[str, Any] | None = None) -> Path:
    return local_path(defaults or load_defaults(), "audioRoot")


def imitation_root(defaults: dict[str, Any] | None = None) -> Path:
    return local_path(defaults or load_defaults(), "imitationRoot")


def output_root(defaults: dict[str, Any] | None = None) -> Path:
    return imitation_root(defaults)


def cast_file(lang: str, defaults: dict[str, Any] | None = None) -> Path:
    d = defaults or load_defaults()
    key = "castEs" if normalize_lang(lang) == "es" else "castEn"
    return repo_path(d["paths"][key])


def load_cast(lang: str, defaults: dict[str, Any] | None = None) -> dict[str, Any]:
    path = cast_file(lang, defaults)
    if not path.is_file():
        raise ImitationError(f"Missing cast file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def list_characters(
    lang: str, defaults: dict[str, Any] | None = None, *, root: Path | None = None
) -> list[dict[str, Any]]:
    d = defaults or load_defaults()
    cast = load_cast(lang, d)
    characters = cast.get("characters") or {}
    if not isinstance(characters, dict):
        raise ImitationError(f"Cast {cast_file(lang, d)} has no characters map")
    rows: list[dict[str, Any]] = []
    for name, spec in characters.items():
        if not isinstance(spec, dict):
            continue
        rel = str(spec.get("selectedRef") or "").strip()
        ref = repo_path(rel, root=root) if rel else None
        rows.append(
            {
                "id": name,
                "ref": str(ref) if ref else "",
                "exists": bool(ref and ref.is_file()),
            }
        )
    return rows


def resolve_target(
    *,
    character: str | None,
    lang: str,
    target: Path | None = None,
    defaults: dict[str, Any] | None = None,
    root: Path | None = None,
) -> tuple[str | None, Path]:
    if target is not None:
        path = target if target.is_absolute() else repo_path(str(target), root=root)
        if not path.is_file():
            raise ImitationError(f"Target WAV not found: {path}")
        return (character, path)
    if not character or not str(character).strip():
        raise ImitationError("Provide --character or --target")
    wanted = character.strip()
    rows = list_characters(lang, defaults, root=root)
    by_id = {row["id"].lower(): row for row in rows}
    row = by_id.get(wanted.lower())
    if row is None:
        known = ", ".join(r["id"] for r in rows) or "(none)"
        raise ImitationError(f"Unknown character {wanted!r} for lang {normalize_lang(lang)}. Known: {known}")
    path = Path(row["ref"])
    if not path.is_file():
        raise ImitationError(f"Character ref missing: {path}")
    return (row["id"], path)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def default_out_path(
    source: Path,
    *,
    character: str | None,
    lang: str,
    source_sha256: str,
    defaults: dict[str, Any] | None = None,
) -> Path:
    voice = (character or "custom").strip() or "custom"
    stem = source.stem
    short = source_sha256[:8]
    return (
        imitation_root(defaults)
        / normalize_lang(lang)
        / voice
        / f"{stem}__{voice}__{short}.wav"
    )


def parse_bool(value: str | bool | int | None, *, default: bool) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    key = str(value).strip().lower()
    if key in {"1", "true", "yes", "on"}:
        return True
    if key in {"0", "false", "no", "off"}:
        return False
    raise ImitationError(f"Invalid boolean {value!r}")


def _bounds(defaults: dict[str, Any], key: str) -> dict[str, Any]:
    bounds = defaults.get("bounds") if isinstance(defaults.get("bounds"), dict) else {}
    row = bounds.get(key) if isinstance(bounds, dict) else None
    return row if isinstance(row, dict) else {}


def clamp_diffusion_steps(value: int, defaults: dict[str, Any] | None = None) -> int:
    d = defaults or load_defaults()
    spec = _bounds(d, "diffusion_steps")
    lo = int(spec.get("min") or 1)
    hi = int(spec.get("max") or d["seedVc"].get("diffusion_steps_max") or 100)
    steps = int(value)
    if steps < lo or steps > hi:
        raise ImitationError(f"diffusion_steps must be between {lo} and {hi}, got {steps}")
    return steps


def clamp_semi_tone_shift(value: int, defaults: dict[str, Any] | None = None) -> int:
    d = defaults or load_defaults()
    spec = _bounds(d, "semi_tone_shift")
    lo = int(spec.get("min") or -24)
    hi = int(spec.get("max") or 24)
    pitch = int(value)
    if pitch < lo or pitch > hi:
        raise ImitationError(f"semi_tone_shift must be between {lo} and {hi}, got {pitch}")
    return pitch


def clamp_length_adjust(value: float, defaults: dict[str, Any] | None = None) -> float:
    d = defaults or load_defaults()
    spec = _bounds(d, "length_adjust")
    lo = float(spec.get("min") or 0.5)
    hi = float(spec.get("max") or 2.0)
    length = float(value)
    if length < lo or length > hi:
        raise ImitationError(f"length_adjust must be between {lo} and {hi}, got {length}")
    return length


def clamp_inference_cfg_rate(value: float, defaults: dict[str, Any] | None = None) -> float:
    d = defaults or load_defaults()
    spec = _bounds(d, "inference_cfg_rate")
    lo = float(spec.get("min") or 0.0)
    hi = float(spec.get("max") or 1.0)
    rate = float(value)
    if rate < lo or rate > hi:
        raise ImitationError(f"inference_cfg_rate must be between {lo} and {hi}, got {rate}")
    return rate


def max_upload_bytes(defaults: dict[str, Any] | None = None) -> int:
    d = defaults or load_defaults()
    bounds = d.get("bounds") if isinstance(d.get("bounds"), dict) else {}
    http = d.get("http") if isinstance(d.get("http"), dict) else {}
    return int(
        (bounds or {}).get("maxUploadBytes")
        or (http or {}).get("maxUploadBytes")
        or 50 * 1024 * 1024
    )


def max_recording_seconds(defaults: dict[str, Any] | None = None) -> float:
    d = defaults or load_defaults()
    bounds = d.get("bounds") if isinstance(d.get("bounds"), dict) else {}
    return float((bounds or {}).get("maxRecordingSeconds") or 120)


def sniff_audio_mime(raw: bytes) -> str | None:
    if len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WAVE":
        return "audio/wav"
    if raw[:4] == b"\x1aE\xdf\xa3":
        return "audio/webm"
    if raw[:4] == b"fLaC":
        return "audio/flac"
    if raw[:4] == b"OggS":
        return "audio/ogg"
    if raw[:3] == b"ID3" or (len(raw) > 1 and raw[0] == 0xFF and raw[1] & 0xE0 == 0xE0):
        return "audio/mpeg"
    return None


def collect_portable_path_errors(defaults: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    paths = defaults.get("paths") if isinstance(defaults.get("paths"), dict) else {}
    if not paths:
        return ["paths object missing"]
    from lib.imitation_catalog import looks_absolute_or_traversal

    for key, value in paths.items():
        text = str(value or "")
        if looks_absolute_or_traversal(text):
            errors.append(f"paths.{key} must be a relative repo path, got {text!r}")
    http = defaults.get("http") if isinstance(defaults.get("http"), dict) else {}
    origins = http.get("corsOrigins") if isinstance(http, dict) else None
    if isinstance(origins, list):
        for origin in origins:
            text = str(origin or "")
            if "github.io" in text.lower():
                errors.append(f"http.corsOrigins must not include {text}")
            from urllib.parse import urlparse

            parsed = urlparse(text)
            if parsed.path not in {"", "/"}:
                errors.append(f"http.corsOrigins must be scheme+host+port only, got {text}")
    return errors


def suffix_for_upload(content_type: str | None, filename: str | None) -> str:
    name = (filename or "").lower()
    if name.endswith(".wav"):
        return ".wav"
    if name.endswith(".webm"):
        return ".webm"
    if name.endswith(".ogg"):
        return ".ogg"
    if name.endswith(".mp3"):
        return ".mp3"
    if name.endswith(".flac"):
        return ".flac"
    if name.endswith(".m4a") or name.endswith(".mp4"):
        return ".m4a"
    ctype = (content_type or "").split(";")[0].strip().lower()
    if ctype in WAV_CONTENT_TYPES:
        return ".wav"
    if ctype == "audio/webm":
        return ".webm"
    if ctype in {"audio/ogg", "audio/opus"}:
        return ".ogg"
    if ctype in {"audio/mpeg", "audio/mp3"}:
        return ".mp3"
    if ctype == "audio/flac":
        return ".flac"
    if ctype in {"audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/x-aac"}:
        return ".m4a"
    if ctype in {"", "application/octet-stream"}:
        return ".bin"
    raise ImitationError(f"Unsupported Content-Type {content_type!r}")


def write_upload_wav(
    raw: bytes,
    dest_wav: Path,
    *,
    content_type: str | None,
    filename: str | None,
) -> Path:
    if not raw:
        raise ImitationError("Empty audio body")
    dest_wav.parent.mkdir(parents=True, exist_ok=True)
    suffix = suffix_for_upload(content_type, filename)
    if suffix == ".wav":
        dest_wav.write_bytes(raw)
        return dest_wav
    ctype = (content_type or "").split(";")[0].strip().lower()
    if suffix == ".bin" and ctype not in CONVERTIBLE_CONTENT_TYPES:
        raise ImitationError(
            "Send audio/wav or audio/webm (or pass filename=take.wav). "
            f"Got Content-Type {content_type!r}"
        )
    try:
        from pydub import AudioSegment
    except ImportError as exc:  # pragma: no cover
        raise ImitationError("pydub is required to decode non-WAV uploads") from exc
    tmp = dest_wav.with_suffix(suffix)
    tmp.write_bytes(raw)
    try:
        segment = AudioSegment.from_file(tmp)
        segment.export(dest_wav, format="wav")
    except Exception as exc:  # noqa: BLE001
        raise ImitationError(
            f"Could not decode {suffix} upload (ffmpeg/pydub): {exc}"
        ) from exc
    finally:
        if tmp != dest_wav and tmp.is_file():
            tmp.unlink(missing_ok=True)
    return dest_wav


def collect_repo_check_errors(defaults: dict[str, Any] | None = None) -> list[str]:
    """CI-safe: portable knobs, catalog, casts. Does not require E:/Models."""
    errors: list[str] = []
    try:
        d = defaults if defaults is not None else load_portable_defaults()
    except Exception as exc:  # noqa: BLE001
        return [str(exc)]

    if d.get("engine") != "seed-vc-svc":
        errors.append(f"engine must be seed-vc-svc, got {d.get('engine')!r}")
    seed = d.get("seedVc")
    if not isinstance(seed, dict):
        errors.append("seedVc object missing")
        seed = {}
    for key in REQUIRED_SEEDVC_KEYS:
        if key not in seed:
            errors.append(f"seedVc.{key} missing")
    if seed.get("f0_condition") is not True:
        errors.append("seedVc.f0_condition must be true")
    if seed.get("auto_f0_adjust") is not True:
        errors.append("seedVc.auto_f0_adjust must default true (2026-09-06 Elin/Zao A/B)")
    checkpoint = str(seed.get("checkpoint") or "")
    if "f0_44k" not in checkpoint or "ema_v2" not in checkpoint:
        errors.append("seedVc.checkpoint must be the SVC F0 ema_v2 weights")
    if ":" in checkpoint or "\\" in checkpoint or checkpoint.startswith("/"):
        errors.append("seedVc.checkpoint must be a filename, not an absolute path")

    paths = d.get("paths")
    if not isinstance(paths, dict):
        errors.append("paths object missing")
        paths = {}
    for key in REQUIRED_PATH_KEYS:
        if key not in paths:
            errors.append(f"paths.{key} missing")
        elif not repo_path(str(paths[key])).is_file():
            errors.append(f"paths.{key} missing on disk: {paths[key]}")
    errors.extend(collect_portable_path_errors(d))
    if d.get("localPaths"):
        errors.append("portable defaults must not include localPaths")

    http = d.get("http")
    if not isinstance(http, dict):
        errors.append("http object missing")
    else:
        for key in ("host", "port", "corsOrigins"):
            if key not in http:
                errors.append(f"http.{key} missing")
        if str(http.get("host") or "") not in {"127.0.0.1", "localhost"}:
            errors.append("http.host must be 127.0.0.1 or localhost")

    bounds = d.get("bounds")
    if not isinstance(bounds, dict) or "maxUploadBytes" not in bounds:
        errors.append("bounds.maxUploadBytes missing")

    for lang in ("en", "es"):
        try:
            rows = list_characters(lang, d)
        except ImitationError as exc:
            errors.append(str(exc))
            continue
        if not rows:
            errors.append(f"No characters in {lang} cast")
        for row in rows:
            if not row["exists"]:
                errors.append(f"Missing {lang} ref for {row['id']}: {row['ref']}")

    from lib.imitation_catalog import collect_catalog_errors

    errors.extend(collect_catalog_errors())
    return errors


def collect_local_check_errors(defaults: dict[str, Any] | None = None) -> list[str]:
    """Machine check: audio root, indexes, Seed-VC install. Fails loud if missing."""
    errors = collect_repo_check_errors(
        defaults if defaults is not None else load_portable_defaults()
    )
    try:
        d = defaults if defaults is not None else load_defaults()
        root = seedvc_root(d)
        audio = audio_root(d)
        imitation_root(d)
    except Exception as exc:  # noqa: BLE001
        errors.append(str(exc))
        return errors

    if not root.is_dir():
        errors.append(f"Seed-VC root missing: {root}")
    else:
        if not (root / "inference.py").is_file():
            errors.append(f"Seed-VC inference.py missing under {root}")
        if not (root / "app_svc.py").is_file():
            errors.append(f"Seed-VC app_svc.py missing under {root}")
        venv_py = root / ".venv" / "Scripts" / "python.exe"
        if not venv_py.is_file():
            venv_py = root / ".venv" / "bin" / "python"
        if not venv_py.is_file():
            errors.append(f"Seed-VC venv Python missing under {root / '.venv'}")

    if not audio.is_dir():
        errors.append(f"Audio root missing: {audio}")
        return errors

    from lib.imitation_catalog import chunks_dir, get_output, list_outputs, load_index
    from lib.imitation_overlay import wav_duration_seconds
    import wave

    for row in list_outputs():
        chunks = chunks_dir(audio, row)
        index_path = chunks / "index.json"
        if not index_path.is_file():
            errors.append(f"Missing index for {row['id']}: {index_path}")
            continue
        try:
            index = load_index(chunks)
        except Exception as exc:  # noqa: BLE001
            errors.append(str(exc))
            continue
        cues = index.get("cues") or []
        expected_count = int(row.get("expectedCueCount") or 0)
        if expected_count and len(cues) != expected_count:
            errors.append(
                f"{row['id']} expected {expected_count} cues, found {len(cues)}"
            )
        expected_sr = int(row.get("expectedSampleRate") or 0)
        index_sr = int(index.get("sample_rate") or 0)
        if expected_sr and index_sr and index_sr != expected_sr:
            errors.append(
                f"{row['id']} sample_rate {index_sr} != expected {expected_sr}"
            )
        for cue in cues:
            if not isinstance(cue, dict):
                continue
            rel = str(cue.get("wav") or "")
            wav_path = chunks / rel
            if not wav_path.is_file():
                errors.append(f"{row['id']} missing WAV {cue.get('id')}: {rel}")
                continue
            try:
                with wave.open(str(wav_path), "rb") as fh:
                    sr = fh.getframerate()
                if expected_sr and sr != expected_sr:
                    errors.append(
                        f"{row['id']} {cue.get('id')} WAV sample rate {sr} != {expected_sr}"
                    )
                wav_duration_seconds(wav_path)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{row['id']} {cue.get('id')} unreadable WAV: {exc}")
        get_output(str(row["id"]))
    return errors


def collect_check_errors(defaults: dict[str, Any] | None = None) -> list[str]:
    return collect_repo_check_errors(defaults)


def sidecar_path(wav_path: Path) -> Path:
    return wav_path.with_suffix(".json")


def write_sidecar(wav_path: Path, payload: dict[str, Any]) -> Path:
    path = sidecar_path(wav_path)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def _prepare_seedvc_env(root: Path) -> Any:
    root = root.resolve()
    _ensure_venv_site()
    try:
        import munch as _munch  # noqa: F401
    except ModuleNotFoundError as exc:
        raise missing_seedvc_dependency_error(exc, root) from exc
    cache = root / "checkpoints" / "hf_cache"
    os.environ["HF_HUB_CACHE"] = str(cache)
    os.environ["HF_HOME"] = str(cache)
    _purge_seedvc_imports()
    _prepend_sys_path(root)
    os.chdir(root)
    import inference as seed_inf  # noqa: PLC0415

    return seed_inf


@dataclass
class LoadedModels:
    seed_inf: Any
    model: Any
    semantic_fn: Any
    f0_fn: Any
    vocoder_fn: Any
    campplus_model: Any
    mel_fn: Any
    mel_fn_args: dict[str, Any]


class ImitationSession:
    def __init__(self, defaults: dict[str, Any] | None = None) -> None:
        self.defaults = defaults or load_defaults()
        self.loaded: LoadedModels | None = None

    def load(self) -> LoadedModels:
        if self.loaded is not None:
            return self.loaded
        root = seedvc_root(self.defaults)
        if not (root / "inference.py").is_file():
            raise ImitationError(f"Seed-VC inference.py missing under {root}")
        prev_cwd = Path.cwd()
        try:
            seed_inf = _prepare_seedvc_env(root)
            seed = self.defaults["seedVc"]
            args = SimpleNamespace(
                checkpoint=None,
                config=None,
                f0_condition=True,
                auto_f0_adjust=bool(seed["auto_f0_adjust"]),
                semi_tone_shift=int(seed["semi_tone_shift"]),
                fp16=bool(seed["fp16"]),
            )
            print("Loading Seed-VC F0/SVC models...", flush=True)
            model, semantic_fn, f0_fn, vocoder_fn, campplus_model, mel_fn, mel_fn_args = (
                seed_inf.load_models(args)
            )
            if f0_fn is None:
                raise ImitationError("F0 extractor missing; f0_condition did not load SVC weights")
            print("Ready.", flush=True)
            self.loaded = LoadedModels(
                seed_inf=seed_inf,
                model=model,
                semantic_fn=semantic_fn,
                f0_fn=f0_fn,
                vocoder_fn=vocoder_fn,
                campplus_model=campplus_model,
                mel_fn=mel_fn,
                mel_fn_args=mel_fn_args,
            )
            return self.loaded
        except ModuleNotFoundError as exc:
            os.chdir(prev_cwd)
            raise missing_seedvc_dependency_error(exc, root) from exc
        except BaseException:
            os.chdir(prev_cwd)
            raise

    def convert(
        self,
        source: Path,
        target: Path,
        out: Path,
        *,
        character: str | None,
        lang: str,
        diffusion_steps: int | None = None,
        auto_f0_adjust: bool | None = None,
        semi_tone_shift: int | None = None,
        length_adjust: float | None = None,
        inference_cfg_rate: float | None = None,
    ) -> dict[str, Any]:
        source = source.resolve()
        target = target.resolve()
        out = out.resolve()
        if not source.is_file():
            raise ImitationError(f"Source audio not found: {source}")
        if not target.is_file():
            raise ImitationError(f"Target WAV not found: {target}")
        seed = self.defaults["seedVc"]
        steps = clamp_diffusion_steps(
            seed["diffusion_steps"] if diffusion_steps is None else diffusion_steps,
            self.defaults,
        )
        auto_f0 = (
            bool(seed["auto_f0_adjust"]) if auto_f0_adjust is None else bool(auto_f0_adjust)
        )
        pitch = clamp_semi_tone_shift(
            seed["semi_tone_shift"] if semi_tone_shift is None else semi_tone_shift,
            self.defaults,
        )
        length = clamp_length_adjust(
            seed["length_adjust"] if length_adjust is None else length_adjust,
            self.defaults,
        )
        cfg_rate = clamp_inference_cfg_rate(
            seed["inference_cfg_rate"] if inference_cfg_rate is None else inference_cfg_rate,
            self.defaults,
        )
        loaded = self.load()
        elapsed, duration, sample_rate = _convert_f0(
            loaded,
            source_path=source,
            target_path=target,
            out_path=out,
            diffusion_steps=steps,
            length_adjust=length,
            inference_cfg_rate=cfg_rate,
            auto_f0_adjust=auto_f0,
            semi_tone_shift=pitch,
        )
        payload = {
            "engine": "seed-vc-svc",
            "checkpoint": seed["checkpoint"],
            "config": seed["config"],
            "source": str(source),
            "sourceSha256": file_sha256(source),
            "target": str(target),
            "character": character,
            "lang": normalize_lang(lang),
            "out": str(out),
            "f0_condition": True,
            "auto_f0_adjust": auto_f0,
            "semi_tone_shift": pitch,
            "diffusion_steps": steps,
            "inference_cfg_rate": cfg_rate,
            "length_adjust": length,
            "fp16": bool(seed["fp16"]),
            "sample_rate": sample_rate,
            "duration_sec": round(duration, 3),
            "elapsed_sec": round(elapsed, 2),
        }
        write_sidecar(out, payload)
        return payload


def _convert_f0(
    loaded: LoadedModels,
    *,
    source_path: Path,
    target_path: Path,
    out_path: Path,
    diffusion_steps: int,
    length_adjust: float,
    inference_cfg_rate: float,
    auto_f0_adjust: bool,
    semi_tone_shift: int,
) -> tuple[float, float, int]:
    """Mirror Seed-VC inference.py main() with f0_condition locked on."""
    import librosa  # noqa: PLC0415
    import numpy as np  # noqa: PLC0415
    import soundfile as sf  # noqa: PLC0415
    import torch  # noqa: PLC0415
    import torchaudio  # noqa: PLC0415

    seed_inf = loaded.seed_inf
    device = seed_inf.device
    model = loaded.model
    semantic_fn = loaded.semantic_fn
    f0_fn = loaded.f0_fn
    vocoder_fn = loaded.vocoder_fn
    campplus_model = loaded.campplus_model
    mel_fn = loaded.mel_fn

    sr = 44100
    hop_length = 512
    max_context_window = sr // hop_length * 30
    overlap_frame_len = 16
    overlap_wave_len = overlap_frame_len * hop_length

    source_audio = librosa.load(str(source_path), sr=sr)[0]
    ref_audio = librosa.load(str(target_path), sr=sr)[0]
    source_audio = torch.tensor(source_audio).unsqueeze(0).float().to(device)
    ref_audio = torch.tensor(ref_audio[: sr * 25]).unsqueeze(0).float().to(device)

    t0 = time.time()
    converted_waves_16k = torchaudio.functional.resample(source_audio, sr, 16000)
    if converted_waves_16k.size(-1) <= 16000 * 30:
        S_alt = semantic_fn(converted_waves_16k)
    else:
        overlapping_time = 5
        S_alt_list = []
        buffer = None
        traversed_time = 0
        while traversed_time < converted_waves_16k.size(-1):
            if buffer is None:
                chunk = converted_waves_16k[:, traversed_time : traversed_time + 16000 * 30]
            else:
                chunk = torch.cat(
                    [
                        buffer,
                        converted_waves_16k[
                            :, traversed_time : traversed_time + 16000 * (30 - overlapping_time)
                        ],
                    ],
                    dim=-1,
                )
            S_alt = semantic_fn(chunk)
            if traversed_time == 0:
                S_alt_list.append(S_alt)
            else:
                S_alt_list.append(S_alt[:, 50 * overlapping_time :])
            buffer = chunk[:, -16000 * overlapping_time :]
            traversed_time += (
                30 * 16000 if traversed_time == 0 else chunk.size(-1) - 16000 * overlapping_time
            )
        S_alt = torch.cat(S_alt_list, dim=1)

    ori_waves_16k = torchaudio.functional.resample(ref_audio, sr, 16000)
    S_ori = semantic_fn(ori_waves_16k)

    mel = mel_fn(source_audio.to(device).float())
    mel2 = mel_fn(ref_audio.to(device).float())
    target_lengths = torch.LongTensor([int(mel.size(2) * length_adjust)]).to(mel.device)
    target2_lengths = torch.LongTensor([mel2.size(2)]).to(mel2.device)

    feat2 = torchaudio.compliance.kaldi.fbank(
        ori_waves_16k, num_mel_bins=80, dither=0, sample_frequency=16000
    )
    feat2 = feat2 - feat2.mean(dim=0, keepdim=True)
    style2 = campplus_model(feat2.unsqueeze(0))

    F0_ori = f0_fn(ori_waves_16k[0], thred=0.03)
    F0_alt = f0_fn(converted_waves_16k[0], thred=0.03)
    F0_ori = torch.from_numpy(F0_ori).to(device)[None]
    F0_alt = torch.from_numpy(F0_alt).to(device)[None]
    log_f0_alt = torch.log(F0_alt + 1e-5)
    voiced_log_f0_ori = torch.log(F0_ori[F0_ori > 1] + 1e-5)
    voiced_log_f0_alt = torch.log(F0_alt[F0_alt > 1] + 1e-5)
    median_log_f0_ori = torch.median(voiced_log_f0_ori)
    median_log_f0_alt = torch.median(voiced_log_f0_alt)
    shifted_log_f0_alt = log_f0_alt.clone()
    if auto_f0_adjust:
        shifted_log_f0_alt[F0_alt > 1] = (
            log_f0_alt[F0_alt > 1] - median_log_f0_alt + median_log_f0_ori
        )
    shifted_f0_alt = torch.exp(shifted_log_f0_alt)
    if semi_tone_shift != 0:
        shifted_f0_alt[F0_alt > 1] = seed_inf.adjust_f0_semitones(
            shifted_f0_alt[F0_alt > 1], semi_tone_shift
        )

    cond, _, _, _, _ = model.length_regulator(
        S_alt, ylens=target_lengths, n_quantizers=3, f0=shifted_f0_alt
    )
    prompt_condition, _, _, _, _ = model.length_regulator(
        S_ori, ylens=target2_lengths, n_quantizers=3, f0=F0_ori
    )

    max_source_window = max_context_window - mel2.size(2)
    processed_frames = 0
    generated_wave_chunks: list[Any] = []
    previous_chunk = None

    with torch.no_grad():
        while processed_frames < cond.size(1):
            chunk_cond = cond[:, processed_frames : processed_frames + max_source_window]
            is_last_chunk = processed_frames + max_source_window >= cond.size(1)
            cat_condition = torch.cat([prompt_condition, chunk_cond], dim=1)
            with torch.autocast(
                device_type=device.type,
                dtype=torch.float16 if seed_inf.fp16 else torch.float32,
            ):
                vc_target = model.cfm.inference(
                    cat_condition,
                    torch.LongTensor([cat_condition.size(1)]).to(mel2.device),
                    mel2,
                    style2,
                    None,
                    diffusion_steps,
                    inference_cfg_rate=inference_cfg_rate,
                )
                vc_target = vc_target[:, :, mel2.size(-1) :]
            vc_wave = vocoder_fn(vc_target.float()).squeeze()
            vc_wave = vc_wave[None, :]
            if processed_frames == 0:
                if is_last_chunk:
                    generated_wave_chunks.append(vc_wave[0].cpu().numpy())
                    break
                generated_wave_chunks.append(vc_wave[0, :-overlap_wave_len].cpu().numpy())
                previous_chunk = vc_wave[0, -overlap_wave_len:]
                processed_frames += vc_target.size(2) - overlap_frame_len
            elif is_last_chunk:
                generated_wave_chunks.append(
                    seed_inf.crossfade(
                        previous_chunk.cpu().numpy(), vc_wave[0].cpu().numpy(), overlap_wave_len
                    )
                )
                break
            else:
                generated_wave_chunks.append(
                    seed_inf.crossfade(
                        previous_chunk.cpu().numpy(),
                        vc_wave[0, :-overlap_wave_len].cpu().numpy(),
                        overlap_wave_len,
                    )
                )
                previous_chunk = vc_wave[0, -overlap_wave_len:]
                processed_frames += vc_target.size(2) - overlap_frame_len

    vc_wave = torch.tensor(np.concatenate(generated_wave_chunks))[None, :].float()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    audio = vc_wave.squeeze(0).cpu().numpy()
    sf.write(str(out_path), audio, int(sr))
    elapsed = time.time() - t0
    duration = float(audio.shape[-1]) / float(sr)
    return elapsed, duration, sr
