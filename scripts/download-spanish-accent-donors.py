#!/usr/bin/env python3
"""Download short public Spanish accent donor clips for Seed-VC tests.

Sources:
  - OpenSLR 61 weather messages (Argentinian + Peninsular Spanish) — small zip
  - Hugging Face LATAM Orpheus pack (AR/PE/CO/VE by nationality)
  - Mozilla Common Voice ES (streaming) for accent tags when available

Santiago del Estero has no dedicated public corpus; we pull AR/norte-leaning
Common Voice clips when tagged, else note the gap and keep Buenos Aires AR.
"""

from __future__ import annotations

import csv
import io
import json
import re
import shutil
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np
import soundfile as sf

OUT = Path(r"E:\Models\voice-donors\es")
CACHE = Path(r"E:\Models\voice-donors\_cache\es")
TARGET_SR = 22050
MAX_PER_ACCENT = 4  # male+female mix when available
MAX_SECONDS = 12.0

ACCENT_DIRS = {
    "rioplatense": OUT / "rioplatense",
    "santiago-del-estero": OUT / "santiago-del-estero",
    "spain-castilian": OUT / "spain-castilian",
    "peruvian-lima": OUT / "peruvian-lima",
    "venezuelan": OUT / "venezuelan",
    "colombian-bogota": OUT / "colombian-bogota",
}


def ensure_dirs() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    for d in ACCENT_DIRS.values():
        d.mkdir(parents=True, exist_ok=True)


def write_clip(path: Path, audio: np.ndarray, sr: int, meta: dict) -> None:
    import librosa

    if sr != TARGET_SR:
        audio = librosa.resample(audio.astype(np.float32), orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR
    audio = np.asarray(audio, dtype=np.float32).reshape(-1)
    if len(audio) / sr > MAX_SECONDS:
        audio = audio[: int(MAX_SECONDS * sr)]
    # fade ends slightly
    n = min(int(0.01 * sr), len(audio) // 4)
    if n > 0:
        audio[:n] *= np.linspace(0, 1, n, dtype=np.float32)
        audio[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
    peak = float(np.max(np.abs(audio)) or 1.0)
    audio = np.clip(audio / peak * 0.95, -1.0, 1.0)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), audio, sr)
    path.with_suffix(".json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Wrote {path.name} ({len(audio)/sr:.1f}s) [{meta.get('source')}]", flush=True)


def download_openslr_weather() -> list[dict]:
    """SLR61 weather messages: Argentinian + Peninsular (~33 MB)."""
    url = "https://www.openslr.org/resources/61/es_weather_messages.zip"
    zpath = CACHE / "es_weather_messages.zip"
    if not zpath.is_file():
        print(f"Downloading {url} ...", flush=True)
        urlretrieve(url, zpath)
    extract = CACHE / "weather"
    if extract.exists():
        shutil.rmtree(extract)
    extract.mkdir(parents=True)
    with zipfile.ZipFile(zpath, "r") as zf:
        zf.extractall(extract)

    # Find wavs + any index
    wavs = list(extract.rglob("*.wav"))
    print(f"OpenSLR weather: {len(wavs)} wavs under {extract}", flush=True)
    saved = []
    ar_n = es_n = 0
    for wav in sorted(wavs):
        name = wav.name.lower()
        # Heuristic from OpenSLR 61 naming / path
        path_l = str(wav).lower().replace("\\", "/")
        if "ar" in path_l or "argentin" in path_l or name.startswith("ar_") or "_ar_" in name:
            accent = "rioplatense"
            key_n = ar_n
            ar_n += 1
        elif "es" in path_l or "peninsul" in path_l or "spain" in path_l or name.startswith("es_"):
            accent = "spain-castilian"
            key_n = es_n
            es_n += 1
        else:
            # weather pack often splits by folder; inspect parent
            parent = wav.parent.name.lower()
            if parent in {"es_ar", "ar", "argentinian", "argentina"}:
                accent, key_n, ar_n = "rioplatense", ar_n, ar_n + 1
            elif parent in {"es_es", "es", "spain", "castilian"}:
                accent, key_n, es_n = "spain-castilian", es_n, es_n + 1
            else:
                continue
        if key_n >= MAX_PER_ACCENT:
            continue
        audio, sr = sf.read(str(wav), always_2d=False)
        if getattr(audio, "ndim", 1) > 1:
            audio = audio.mean(axis=1)
        out = ACCENT_DIRS[accent] / f"openslr61-weather-{key_n:02d}.wav"
        meta = {
            "accent": accent,
            "source": "OpenSLR-61-es_weather_messages",
            "license": "CC-BY-SA-4.0",
            "original": str(wav.relative_to(extract)),
            "url": url,
        }
        write_clip(out, np.asarray(audio), int(sr), meta)
        saved.append(meta)
    return saved


def download_latam_hf() -> list[dict]:
    """HF repack of Google LATAM OpenSLR by nationality code."""
    from datasets import Audio, load_dataset
    import io

    print("Loading HF GianDiego/latam-spanish-speech-orpheus-tts-24khz (streaming, decode=False)...", flush=True)
    ds = load_dataset(
        "GianDiego/latam-spanish-speech-orpheus-tts-24khz",
        split="train",
        streaming=True,
    )
    ds = ds.cast_column("audio", Audio(decode=False))
    map_nat = {
        "ar": "rioplatense",
        "pe": "peruvian-lima",
        "co": "colombian-bogota",
        "ve": "venezuelan",
    }
    counts = {k: 0 for k in ("rioplatense", "peruvian-lima", "colombian-bogota", "venezuelan")}
    santiago_n = 0
    saved: list[dict] = []
    for row in ds:
        nat = (row.get("nationality") or "").lower()
        if nat not in map_nat:
            continue
        gender = (row.get("gender") or "u").lower()
        proxy = False
        if nat == "ar":
            # Prefer weather pack for true BA rioplatense; use AR stream as Santiagueño proxy only.
            if santiago_n >= MAX_PER_ACCENT:
                if all(counts[v] >= MAX_PER_ACCENT for v in ("peruvian-lima", "colombian-bogota", "venezuelan")):
                    break
                continue
            accent = "santiago-del-estero"
            proxy = True
        else:
            accent = map_nat[nat]
            if counts[accent] >= MAX_PER_ACCENT:
                if santiago_n >= MAX_PER_ACCENT and all(
                    counts[v] >= MAX_PER_ACCENT for v in ("peruvian-lima", "colombian-bogota", "venezuelan")
                ):
                    break
                continue

        raw = row["audio"]["bytes"]
        audio, sr = sf.read(io.BytesIO(raw), always_2d=False)
        if getattr(audio, "ndim", 1) > 1:
            audio = audio.mean(axis=1)

        if proxy:
            idx = santiago_n
            santiago_n += 1
            fname = f"openslr-ar-proxy-{gender}-{idx:02d}.wav"
            note = (
                "PROXY: Argentinian OpenSLR (Buenos Aires volunteers), not true Santiago del Estero. "
                "No dedicated public corpus found."
            )
        else:
            idx = counts[accent]
            counts[accent] += 1
            fname = f"openslr-{nat}-{gender}-{idx:02d}.wav"
            note = None

        out = ACCENT_DIRS[accent] / fname
        meta = {
            "accent": accent,
            "source": "HF:GianDiego/latam-spanish-speech-orpheus-tts-24khz (OpenSLR Google LATAM)",
            "license": "CC-BY-SA-4.0",
            "nationality": nat,
            "gender": gender,
            "text": row.get("text"),
            "file_id": row.get("file_id"),
            "note": note,
        }
        write_clip(out, np.asarray(audio), int(sr), meta)
        saved.append(meta)
        if santiago_n >= MAX_PER_ACCENT and all(
            counts[v] >= MAX_PER_ACCENT for v in ("peruvian-lima", "colombian-bogota", "venezuelan")
        ):
            break
    return saved


def download_common_voice_stream() -> list[dict]:
    """Optional CV accents; may require HF login / large download — best-effort."""
    try:
        from datasets import load_dataset
    except ImportError:
        print("datasets not installed; skip Common Voice", flush=True)
        return []

    print("Trying Common Voice ES streaming (may be slow / gated)...", flush=True)
    try:
        ds = load_dataset(
            "mozilla-foundation/common_voice_17_0",
            "es",
            split="train",
            streaming=True,
            trust_remote_code=True,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"  Common Voice unavailable: {exc}", flush=True)
        return []

    patterns = {
        "rioplatense": re.compile(r"rioplatense|argentin|uruguay|porteñ", re.I),
        "santiago-del-estero": re.compile(r"santiago\s*del\s*estero|catamarca|tucum[aá]n|santiague|norte\s*argentin", re.I),
        "spain-castilian": re.compile(r"centrosurpeninsular|nortepeninsular|madrid|castellano|espa[nñ]a(?!.*sur)", re.I),
        "peruvian-lima": re.compile(r"per[uú]|lima|andino", re.I),
        "venezuelan": re.compile(r"venezuel|caracas|caribe", re.I),
        "colombian-bogota": re.compile(r"colomb|bogot|andino", re.I),
    }
    # Prefer more specific tags; andino is shared PE/CO — accept with nationality text if present
    counts = {k: 0 for k in patterns}
    saved = []
    scanned = 0
    for row in ds:
        scanned += 1
        if scanned > 8000:
            break
        if all(v >= 2 for v in counts.values()):  # top up only 2 from CV if OpenSLR filled
            break
        accent_field = " ".join(
            str(x or "") for x in (row.get("accent"), row.get("accents"), row.get("locale"), row.get("variant"))
        )
        matched = None
        for accent, rx in patterns.items():
            if counts[accent] >= 2:
                continue
            if rx.search(accent_field):
                matched = accent
                break
        if not matched:
            continue
        try:
            audio_obj = row["audio"]
            arr = np.asarray(audio_obj["array"], dtype=np.float32)
            sr = int(audio_obj["sampling_rate"])
        except Exception:
            continue
        idx = counts[matched]
        counts[matched] += 1
        out = ACCENT_DIRS[matched] / f"commonvoice-{idx:02d}.wav"
        meta = {
            "accent": matched,
            "source": "Mozilla Common Voice 17 ES",
            "license": "CC0-1.0",
            "accents_field": accent_field,
            "sentence": row.get("sentence"),
        }
        write_clip(out, arr, sr, meta)
        saved.append(meta)
    print(f"  Common Voice scanned={scanned} saved={len(saved)}", flush=True)
    return saved


def main() -> int:
    ensure_dirs()
    manifest = {"clips": []}
    try:
        manifest["clips"].extend(download_openslr_weather())
    except Exception as exc:  # noqa: BLE001
        print(f"OpenSLR weather failed: {exc}", flush=True)

    try:
        manifest["clips"].extend(download_latam_hf())
    except Exception as exc:  # noqa: BLE001
        print(f"LATAM HF failed: {exc}", flush=True)

    try:
        manifest["clips"].extend(download_common_voice_stream())
    except Exception as exc:  # noqa: BLE001
        print(f"Common Voice failed: {exc}", flush=True)

    # Summary
    summary = {}
    for accent, folder in ACCENT_DIRS.items():
        n = len(list(folder.glob("*.wav")))
        summary[accent] = n
        print(f"{accent}: {n} clips", flush=True)
    manifest["summary"] = summary
    manifest["notes"] = (
        "Santiago del Estero: no dedicated public corpus; proxies tagged in JSON. "
        "OpenSLR AR is Buenos Aires volunteers (rioplatense). "
        "Spain samples from weather pack Peninsular Spanish."
    )
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Done → {OUT}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
