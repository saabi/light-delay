#!/usr/bin/env python3
"""[Legacy] EdAcc L1-English donors under voice-donors/en/.

For authentic *native-language* speech (Mandarin, Hindi, German, French, Igbo, …)
use instead:

  python scripts/download-native-language-donors.py
  → E:/Models/voice-donors/native/{lang}/

Pipelines prefer native/ when present and fall back to this EdAcc tree.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np
import soundfile as sf

OUT = Path(r"E:\Models\voice-donors\en")
EN_DONORS = OUT  # same tree — EdAcc already lives here
CACHE = Path(r"E:\Models\voice-donors\_cache\l1")
TARGET_SR = 22050
MAX_PER = 4
MAX_SECONDS = 12.0
MIN_SECONDS = 1.2

# accent_key matches EN folder names for continuity
ACCENTS = {
    "mandarin-english": {
        "character": "Zao",
        "prefer_gender": "female",
        "label": "Mandarin native (or Mandarin-L1 English)",
        "cv_locale": "zh-CN",
        "en_folder": "mandarin-english",
        "native_lang": "zh",
    },
    "germanic-nordic-english": {
        "character": "Voss",
        "prefer_gender": "male",
        "label": "German/Nordic native (or Germanic-L1 English)",
        "cv_locale": "de",
        "en_folder": "germanic-nordic-english",
        "native_lang": "de",
    },
    "british-english": {
        "character": "Harlan",
        "prefer_gender": "male",
        "label": "Southern British English (native)",
        "cv_locale": None,  # use EdAcc British — already native English
        "en_folder": "british-english",
        "native_lang": "en-GB",
    },
    "indian-english": {
        "character": "Elin",
        "prefer_gender": "female",
        "label": "Hindi native (or Indian-L1 English)",
        "cv_locale": "hi",
        "en_folder": "indian-english",
        "native_lang": "hi",
    },
    "french-english": {
        "character": "Sorell",
        "prefer_gender": "female",
        "label": "French native (or French-L1 English)",
        "cv_locale": "fr",
        "en_folder": "french-english",
        "native_lang": "fr",
    },
    "irish-welsh-english": {
        "character": "Cael",
        "prefer_gender": "female",
        "label": "Irish/Welsh native or Celtic-isles English proxy",
        "cv_locale": "ga-IE",  # thin; cy fallback tried second
        "cv_locale_alt": "cy",
        "en_folder": "irish-welsh-english",
        "native_lang": "ga/cy",
    },
}


def write_clip(path: Path, audio: np.ndarray, sr: int, meta: dict) -> bool:
    import librosa

    audio = np.asarray(audio, dtype=np.float32).reshape(-1)
    if sr != TARGET_SR:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR
    if len(audio) / sr > MAX_SECONDS:
        audio = audio[: int(MAX_SECONDS * sr)]
    if len(audio) < int(MIN_SECONDS * sr):
        return False
    n = min(int(0.01 * sr), max(1, len(audio) // 4))
    audio[:n] *= np.linspace(0, 1, n, dtype=np.float32)
    audio[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
    peak = float(np.max(np.abs(audio)) or 1.0)
    audio = np.clip(audio / peak * 0.95, -1.0, 1.0)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), audio, sr)
    path.with_suffix(".json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  Wrote {path.relative_to(OUT)} ({len(audio)/sr:.1f}s) [{meta.get('source')}]", flush=True)
    return True


def copy_edacc_fallback(accent_key: str, cfg: dict, have: int) -> int:
    """Ensure accent folder has up to MAX_PER clips.

    When OUT is the shared donors/en tree, EdAcc files already count — do not
    duplicate them as edacc-fallback-*. Only copy when EN_DONORS differs from OUT.
    """
    dest = OUT / accent_key
    dest.mkdir(parents=True, exist_ok=True)
    existing = sorted(dest.glob("*.wav"))
    have = len(existing)
    if have >= MAX_PER:
        print(f"  already have {have} in donors/en/{accent_key}", flush=True)
        return have

    src_dir = EN_DONORS / cfg["en_folder"]
    if src_dir.resolve() == dest.resolve():
        print(f"  {have}/{MAX_PER} in shared EN tree (no separate fallback copy)", flush=True)
        return have
    if not src_dir.is_dir():
        print(f"  WARN: no EN fallback at {src_dir}", flush=True)
        return have

    for wav in sorted(src_dir.glob("*.wav")):
        if have >= MAX_PER:
            break
        out = dest / f"edacc-fallback-{wav.stem}.wav"
        if out.is_file():
            have += 1
            continue
        shutil.copy2(wav, out)
        meta_src = wav.with_suffix(".json")
        meta = {}
        if meta_src.is_file():
            meta = json.loads(meta_src.read_text(encoding="utf-8"))
        meta.update(
            {
                "source": "edacc-en-l1-fallback",
                "accent_key": accent_key,
                "character": cfg["character"],
                "original_en_donor": str(wav),
                "note": "L1-accented English used when native CV clips unavailable",
            }
        )
        out.with_suffix(".json").write_text(
            json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"  Copied fallback {out.relative_to(OUT)}", flush=True)
        have += 1
    return have


def pull_common_voice(accent_key: str, cfg: dict, locale: str, start_idx: int) -> int:
    from datasets import Audio, load_dataset

    prefer = (cfg.get("prefer_gender") or "").lower()
    dest = OUT / accent_key
    dest.mkdir(parents=True, exist_ok=True)
    wrote = start_idx
    print(f"  Streaming Common Voice {locale} …", flush=True)
    try:
        ds = load_dataset(
            "mozilla-foundation/common_voice_17_0",
            locale,
            split="train",
            streaming=True,
            trust_remote_code=True,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"  CV {locale} unavailable ({exc}); trying 11.0 …", flush=True)
        try:
            ds = load_dataset(
                "mozilla-foundation/common_voice_11_0",
                locale,
                split="train",
                streaming=True,
                trust_remote_code=True,
            )
        except Exception as exc2:  # noqa: BLE001
            print(f"  CV fallback failed: {exc2}", flush=True)
            return wrote

    ds = ds.cast_column("audio", Audio(sampling_rate=TARGET_SR))
    seen_speakers: set[str] = set()
    for row in ds:
        if wrote >= MAX_PER:
            break
        gender = str(row.get("gender") or "").lower()
        if prefer and gender and prefer[0] not in gender and gender not in ("", "other"):
            # soft preference — skip opposite sex when tagged
            if (prefer == "female" and gender.startswith("m")) or (
                prefer == "male" and gender.startswith("f")
            ):
                continue
        spk = str(row.get("client_id") or row.get("speaker_id") or f"u{wrote}")
        if spk in seen_speakers:
            continue
        audio = row.get("audio") or {}
        arr = audio.get("array")
        sr = int(audio.get("sampling_rate") or TARGET_SR)
        if arr is None:
            continue
        text = str(row.get("sentence") or row.get("text") or "").strip()
        out = dest / f"cv-{locale.replace('-', '')}-{wrote:02d}.wav"
        meta = {
            "source": f"common_voice:{locale}",
            "accent_key": accent_key,
            "character": cfg["character"],
            "text": text,
            "gender": gender,
            "speaker": spk[:24],
            "native_lang": cfg["native_lang"],
        }
        if write_clip(out, np.asarray(arr, dtype=np.float32), sr, meta):
            seen_speakers.add(spk)
            wrote += 1
    return wrote


def fill_accent(accent_key: str, cfg: dict) -> None:
    print(f"\n=== {accent_key} → {cfg['character']} ({cfg['label']}) ===", flush=True)
    dest = OUT / accent_key
    existing = sorted(dest.glob("*.wav")) if dest.is_dir() else []
    have = len(existing)
    if have >= MAX_PER:
        print(f"  already have {have}, skip", flush=True)
        return

    # British: EdAcc is already native English — prefer copy
    if accent_key == "british-english":
        have = copy_edacc_fallback(accent_key, cfg, have)
        return

    locales = []
    if cfg.get("cv_locale"):
        locales.append(cfg["cv_locale"])
    if cfg.get("cv_locale_alt"):
        locales.append(cfg["cv_locale_alt"])

    for loc in locales:
        if have >= MAX_PER:
            break
        have = pull_common_voice(accent_key, cfg, loc, have)

    if have < MAX_PER:
        print(f"  Filling {MAX_PER - have} from EdAcc EN-L1 …", flush=True)
        have = copy_edacc_fallback(accent_key, cfg, have)

    print(f"  Total {have}/{MAX_PER}", flush=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    for key, cfg in ACCENTS.items():
        fill_accent(key, cfg)

    man = {
        "max_per": MAX_PER,
        "accents": {
            k: {
                "character": v["character"],
                "label": v["label"],
                "files": [p.name for p in sorted((OUT / k).glob("*.wav"))]
                if (OUT / k).is_dir()
                else [],
            }
            for k, v in ACCENTS.items()
        },
    }
    man_path = OUT.parent / "l1-supplement-manifest.json"
    man_path.write_text(json.dumps(man, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone. Manifest → {man_path}", flush=True)


if __name__ == "__main__":
    main()
