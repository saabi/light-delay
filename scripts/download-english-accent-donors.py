#!/usr/bin/env python3
"""Download English-accent prosody donors for the 6 main Light Delay characters.

Primary source: Edinburgh EdAcc (CC-BY-SA) — English speech with diverse L1/accents.
Cael (Irish/Welsh): Speech Accent Archive pages + soundtrack MP3s when EdAcc lacks Celtic L1s.

Output:
  E:/Models/voice-donors/en/{accent_key}/
"""

from __future__ import annotations

import io
import json
import re
import ssl
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
import soundfile as sf

OUT = Path(r"E:\Models\voice-donors\en")
CACHE = Path(r"E:\Models\voice-donors\_cache\en")
TARGET_SR = 22050
MAX_PER = 4
MAX_SECONDS = 12.0

# accent_key -> character (1:1 for this pipeline)
ACCENTS = {
    "mandarin-english": {
        "character": "Zao",
        "prefer_gender": "female",
        "label": "Mandarin L1 / Chinese-accented English",
    },
    "germanic-nordic-english": {
        "character": "Voss",
        "prefer_gender": "male",
        "label": "Germanic/Nordic L1 English (German, Icelandic, Dutch)",
    },
    "british-english": {
        "character": "Harlan",
        "prefer_gender": "male",
        "label": "Southern British English",
    },
    "indian-english": {
        "character": "Elin",
        "prefer_gender": "female",
        "label": "Indian English",
    },
    "french-english": {
        "character": "Sorell",
        "prefer_gender": "female",
        "label": "French L1 English",
    },
    "irish-welsh-english": {
        "character": "Cael",
        "prefer_gender": "female",
        "label": "Irish/Welsh/Scottish English (Celtic Isles)",
    },
}


def write_clip(path: Path, audio: np.ndarray, sr: int, meta: dict) -> None:
    import librosa

    if sr != TARGET_SR:
        audio = librosa.resample(audio.astype(np.float32), orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR
    audio = np.asarray(audio, dtype=np.float32).reshape(-1)
    if len(audio) / sr > MAX_SECONDS:
        audio = audio[: int(MAX_SECONDS * sr)]
    if len(audio) < int(0.8 * sr):
        return
    n = min(int(0.01 * sr), max(1, len(audio) // 4))
    audio[:n] *= np.linspace(0, 1, n, dtype=np.float32)
    audio[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
    peak = float(np.max(np.abs(audio)) or 1.0)
    audio = np.clip(audio / peak * 0.95, -1.0, 1.0)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), audio, sr)
    path.with_suffix(".json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Wrote {path.relative_to(OUT)} ({len(audio)/sr:.1f}s)", flush=True)


def match_accent(accent_key: str, accent: str, l1: str, raw: str) -> int:
    """Return priority score (higher=better) or 0 if no match."""
    blob = f"{accent}|{l1}|{raw}".lower()
    a, l, r = accent.lower(), l1.lower(), raw.lower()

    if accent_key == "mandarin-english":
        if "mandarin" in l or "chinese" in a:
            return 3
        if "cantonese" in l or "hong kong" in blob:
            return 1
        return 0
    if accent_key == "germanic-nordic-english":
        if any(x in l for x in ("german", "icelandic", "norwegian", "swedish", "danish")):
            return 3
        if "dutch" in l or "german" in a:
            return 2
        return 0
    if accent_key == "british-english":
        if "southern british" in a or "british english" in a:
            return 3
        if "england" in blob or (l == "southern british english"):
            return 2
        return 0
    if accent_key == "indian-english":
        if "indian" in a or "indian english" in l:
            return 3
        if any(x in l for x in ("hindi", "tamil", "telugu", "bengali", "gujarati", "punjabi")):
            return 2
        return 0
    if accent_key == "french-english":
        if "french" in l or "french" in a:
            return 3
        return 0
    if accent_key == "irish-welsh-english":
        if any(x in blob for x in ("irish", "ireland", "welsh", "wales", "gaelic")):
            return 3
        if any(x in blob for x in ("scottish", "scotland")):
            return 2
        return 0
    return 0


def download_edacc() -> dict[str, list[dict]]:
    from datasets import Audio, load_dataset

    buckets: dict[str, list[dict]] = {k: [] for k in ACCENTS}
    print("Streaming edinburghcstr/edacc …", flush=True)
    for split in ("validation", "test"):
        ds = load_dataset("edinburghcstr/edacc", split=split, streaming=True)
        ds = ds.cast_column("audio", Audio(decode=False))
        for row in ds:
            if all(len(v) >= MAX_PER for v in buckets.values()):
                break
            accent = (row.get("accent") or "").strip()
            l1 = (row.get("l1") or "").strip()
            raw = (row.get("raw_accent") or "").strip()
            gender = (row.get("gender") or "").strip().lower()
            text = (row.get("text") or "").strip()
            speaker = (row.get("speaker") or "").strip()

            for key, cfg in ACCENTS.items():
                if len(buckets[key]) >= MAX_PER:
                    continue
                score = match_accent(key, accent, l1, raw)
                if score <= 0:
                    continue
                # Prefer target gender; allow fill later
                prefer = cfg["prefer_gender"]
                if gender and prefer and gender != prefer and len(buckets[key]) < 2:
                    # keep scanning for better gender match first
                    if score < 3:
                        continue
                raw_audio = row["audio"]
                bio = raw_audio.get("bytes")
                if not bio:
                    continue
                audio, sr = sf.read(io.BytesIO(bio), always_2d=False)
                if getattr(audio, "ndim", 1) > 1:
                    audio = audio.mean(axis=1)
                idx = len(buckets[key])
                fname = f"edacc-{idx:02d}.wav"
                out = OUT / key / fname
                meta = {
                    "accent_key": key,
                    "character": cfg["character"],
                    "label": cfg["label"],
                    "source": "HF:edinburghcstr/edacc",
                    "license": "CC-BY-SA",
                    "split": split,
                    "speaker": speaker,
                    "gender": gender,
                    "accent": accent,
                    "l1": l1,
                    "raw_accent": raw,
                    "text": text,
                    "match_score": score,
                }
                write_clip(out, np.asarray(audio), int(sr), meta)
                if out.is_file():
                    buckets[key].append(meta)
        if all(len(v) >= MAX_PER for v in buckets.values()):
            break

    # Second pass: fill remaining slots ignoring gender preference
    still = [k for k, v in buckets.items() if len(v) < MAX_PER]
    if still:
        print(f"Filling remaining accents (any gender): {still}", flush=True)
        for split in ("validation", "test"):
            ds = load_dataset("edinburghcstr/edacc", split=split, streaming=True)
            ds = ds.cast_column("audio", Audio(decode=False))
            for row in ds:
                still = [k for k, v in buckets.items() if len(v) < MAX_PER]
                if not still:
                    break
                accent = (row.get("accent") or "").strip()
                l1 = (row.get("l1") or "").strip()
                raw = (row.get("raw_accent") or "").strip()
                gender = (row.get("gender") or "").strip().lower()
                text = (row.get("text") or "").strip()
                speaker = (row.get("speaker") or "").strip()
                for key in still:
                    cfg = ACCENTS[key]
                    if match_accent(key, accent, l1, raw) <= 0:
                        continue
                    # skip duplicate speakers already saved
                    if any(m.get("speaker") == speaker for m in buckets[key]):
                        continue
                    bio = row["audio"].get("bytes")
                    if not bio:
                        continue
                    audio, sr = sf.read(io.BytesIO(bio), always_2d=False)
                    if getattr(audio, "ndim", 1) > 1:
                        audio = audio.mean(axis=1)
                    idx = len(buckets[key])
                    out = OUT / key / f"edacc-{idx:02d}.wav"
                    meta = {
                        "accent_key": key,
                        "character": cfg["character"],
                        "label": cfg["label"],
                        "source": "HF:edinburghcstr/edacc",
                        "license": "CC-BY-SA",
                        "split": split,
                        "speaker": speaker,
                        "gender": gender,
                        "accent": accent,
                        "l1": l1,
                        "raw_accent": raw,
                        "text": text,
                        "note": "gender preference relaxed",
                    }
                    write_clip(out, np.asarray(audio), int(sr), meta)
                    if out.is_file():
                        buckets[key].append(meta)
            if all(len(v) >= MAX_PER for v in buckets.values()):
                break
    return buckets


def _http_get(url: str) -> bytes:
    ctx = ssl.create_default_context()
    req = Request(url, headers={"User-Agent": "light-delay-accent-donor/1.0"})
    with urlopen(req, context=ctx, timeout=60) as resp:
        return resp.read()


def download_gmu_celtic() -> list[dict]:
    """Fallback Celtic Isles English from Speech Accent Archive (same Stella paragraph)."""
    key = "irish-welsh-english"
    cfg = ACCENTS[key]
    existing = list((OUT / key).glob("*.wav"))
    if len(existing) >= MAX_PER:
        return []

    # Native English speakers from Ireland / Wales / Scotland (browse language=english + birthplace)
    # Direct soundtrack IDs known to be Irish/Welsh/Scottish English natives on GMU archive.
    # Stella paragraph text (shared by archive):
    stella = (
        "Please call Stella. Ask her to bring these things with her from the store: "
        "Six spoons of fresh snow peas, five thick slabs of blue cheese, and maybe a snack for her brother Bob. "
        "We also need a small plastic snake and a big toy frog for the kids. She can scoop these things into "
        "three red bags, and we will go meet her Wednesday at the train station."
    )
    # speaker pages / mp3s — english## ids from accent.gmu.edu (Irish/Welsh/Scottish birthplace)
    candidates = [
        ("english67", "Ireland", "female"),
        ("english68", "Ireland", "male"),
        ("english14", "Ireland", "female"),
        ("english110", "Wales", "female"),
        ("english45", "Scotland", "female"),
        ("english3", "Scotland", "male"),
        ("english96", "Ireland", "male"),
        ("english131", "Wales", "male"),
    ]
    saved = []
    prefer = cfg["prefer_gender"]
    # Prefer matching gender first
    ordered = sorted(candidates, key=lambda x: 0 if x[2] == prefer else 1)
    for sid, place, gender in ordered:
        if len(list((OUT / key).glob("*.wav"))) >= MAX_PER:
            break
        for ext in (".mp3", ".mov", ".wav"):
            url = f"https://accent.gmu.edu/soundtracks/{sid}{ext}"
            try:
                data = _http_get(url)
            except Exception:
                continue
            if len(data) < 1000:
                continue
            try:
                audio, sr = sf.read(io.BytesIO(data), always_2d=False)
            except Exception:
                # mp3 via librosa/audioread
                try:
                    import librosa

                    tmp = CACHE / f"{sid}{ext}"
                    CACHE.mkdir(parents=True, exist_ok=True)
                    tmp.write_bytes(data)
                    audio, sr = librosa.load(str(tmp), sr=None, mono=True)
                except Exception as exc:  # noqa: BLE001
                    print(f"  skip {sid}: {exc}", flush=True)
                    continue
            if getattr(audio, "ndim", 1) > 1:
                audio = audio.mean(axis=1)
            idx = len(list((OUT / key).glob("*.wav")))
            out = OUT / key / f"gmu-{sid}-{idx:02d}.wav"
            meta = {
                "accent_key": key,
                "character": cfg["character"],
                "label": cfg["label"],
                "source": "Speech Accent Archive (accent.gmu.edu)",
                "license": "research / cite Weinberger 2015",
                "speaker_id": sid,
                "birthplace": place,
                "gender": gender,
                "text": stella,
                "url": url,
            }
            write_clip(out, np.asarray(audio, dtype=np.float32), int(sr), meta)
            if out.is_file():
                saved.append(meta)
            break
    return saved


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    for key in ACCENTS:
        (OUT / key).mkdir(parents=True, exist_ok=True)

    buckets = download_edacc()
    celtic = download_gmu_celtic()
    if celtic:
        buckets["irish-welsh-english"].extend(celtic)

    summary = {k: len(list((OUT / k).glob("*.wav"))) for k in ACCENTS}
    manifest = {
        "accents": ACCENTS,
        "summary": summary,
        "clips": {k: v for k, v in buckets.items()},
        "notes": (
            "Donors are English speech carrying L1/regional accent (prosody source for Seed-VC). "
            "Character timbre comes from selected/*.wav."
        ),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Summary:", summary, flush=True)
    missing = [k for k, n in summary.items() if n < MAX_PER]
    if missing:
        print("WARN incomplete accents:", missing, flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
