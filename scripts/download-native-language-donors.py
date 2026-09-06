#!/usr/bin/env python3
"""Download authentic *native-language* prosody donors for the Light Delay cast.

Sources (public domain / CC where applicable):
  - LibriVox via archive.org — Mandarin, German, French, Hindi, British English
  - Google FLEURS Igbo (dev split) — Okoye (Igbo L1)

Output (model-agnostic):
  E:/Models/voice-donors/native/{lang}/native-00.wav … (+ .json metadata)

Cast map:
  Zao→mandarin, Voss→german, Harlan→british-english,
  Elin→hindi, Sorell→french, Okoye→igbo
"""

from __future__ import annotations

import io
import json
import tarfile
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
import soundfile as sf

OUT = Path(r"E:\Models\voice-donors\native")
CACHE = Path(r"E:\Models\voice-donors\_cache\native")
TARGET_SR = 22050
MAX_PER = 4
CLIP_SECONDS = 10.0
MIN_SECONDS = 2.0
UA = "light-delay-native-donors/1.0 (research; local film production)"

# lang folder -> character + download recipe
NATIVE = {
    "mandarin": {
        "character": "Zao",
        "prefer_gender": "female",
        "label": "Mandarin Chinese (LibriVox / 呐喊)",
        "license": "Public domain (LibriVox)",
        "archive_item": "call_to_arms_jl_librivox",
    },
    "german": {
        "character": "Voss",
        "prefer_gender": "male",
        "label": "German (LibriVox / Meister Floh)",
        "license": "Public domain (LibriVox)",
        "archive_item": "meister_floh_0801_librivox",
    },
    "french": {
        "character": "Sorell",
        "prefer_gender": "female",
        "label": "French (LibriVox / Les Misérables Tome 5)",
        "license": "Public domain (LibriVox)",
        "archive_item": "lesmiserables_t5_glb_librivox",
    },
    "hindi": {
        "character": "Elin",
        "prefer_gender": "female",
        "label": "Hindi (LibriVox / पंचतंत्र Panchatantra)",
        "license": "Public domain (LibriVox)",
        "archive_item": "panchatantra_2604_librivox",
    },
    "british-english": {
        "character": "Harlan",
        "prefer_gender": "male",
        "label": "British English (LibriVox / Pride and Prejudice — British reader)",
        "license": "Public domain (LibriVox)",
        "archive_item": "pride_and_prejudice_librivox",
    },
    "igbo": {
        "character": "Okoye",
        "prefer_gender": "female",
        "label": "Igbo (Google FLEURS ig_ng dev)",
        "license": "CC-BY-SA (FLEURS / Common Voice lineage)",
        "fleurs_lang": "ig_ng",
        "fleurs_split": "dev",
    },
}


def http_get(url: str, timeout: int = 180) -> bytes:
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()


def write_clip(path: Path, audio: np.ndarray, sr: int, meta: dict) -> bool:
    import librosa

    audio = np.asarray(audio, dtype=np.float32).reshape(-1)
    if sr != TARGET_SR:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=TARGET_SR)
        sr = TARGET_SR
    if len(audio) / sr > CLIP_SECONDS:
        audio = audio[: int(CLIP_SECONDS * sr)]
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
    print(f"  Wrote {path.relative_to(OUT)} ({len(audio)/sr:.1f}s)", flush=True)
    return True


def list_archive_mp3s(item: str) -> list[dict]:
    meta = json.loads(http_get(f"https://archive.org/metadata/{item}", timeout=60))
    files = meta.get("files") or []
    out = []
    seen: set[str] = set()
    for f in files:
        name = str(f.get("name") or "")
        if not name.lower().endswith(".mp3"):
            continue
        if "64kb" in name.lower() or "_64kb" in name.lower():
            continue
        if "128kb" in name.lower():
            continue  # prefer VBR full chapter once
        if name in seen:
            continue
        seen.add(name)
        out.append(f)
    out.sort(key=lambda f: int(f.get("size") or 0))
    return out


def load_mp3_audio(data: bytes) -> tuple[np.ndarray, int]:
    import librosa

    # librosa/soundfile via audioread
    y, sr = librosa.load(io.BytesIO(data), sr=None, mono=True)
    return np.asarray(y, dtype=np.float32), int(sr)


def cut_clips_from_audio(
    audio: np.ndarray,
    sr: int,
    n: int,
    *,
    lang: str,
    cfg: dict,
    source_name: str,
    start_index: int,
) -> int:
    dur = len(audio) / sr
    if dur < MIN_SECONDS + 1:
        return start_index
    # Spread clip starts across the file
    wrote = start_index
    usable = max(0.0, dur - CLIP_SECONDS - 0.5)
    for i in range(n):
        if wrote >= MAX_PER:
            break
        if usable <= 0:
            t0 = 0.5
        else:
            t0 = 0.5 + (usable * (i + 0.5) / n)
        a0 = int(t0 * sr)
        a1 = a0 + int(CLIP_SECONDS * sr)
        clip = audio[a0:a1]
        out = OUT / lang / f"native-{wrote:02d}.wav"
        if out.is_file() and out.stat().st_size > 1000:
            wrote += 1
            continue
        meta = {
            "source": f"librivox:{cfg.get('archive_item')}" if cfg.get("archive_item") else cfg.get("label"),
            "archive_file": source_name,
            "language": lang,
            "character": cfg["character"],
            "label": cfg["label"],
            "license": cfg["license"],
            "offset_sec": round(t0, 2),
        }
        if write_clip(out, clip, sr, meta):
            wrote += 1
    return wrote


def fill_from_librivox(lang: str, cfg: dict) -> int:
    item = cfg["archive_item"]
    dest = OUT / lang
    dest.mkdir(parents=True, exist_ok=True)
    existing = len(list(dest.glob("native-*.wav")))
    if existing >= MAX_PER:
        print(f"  already have {existing}", flush=True)
        return existing

    print(f"  Listing archive.org/{item} …", flush=True)
    mp3s = list_archive_mp3s(item)
    if not mp3s:
        print(f"  WARN: no mp3s for {item}", flush=True)
        return existing

    # Prefer mid-sized chapters (~3–15 MB) for faster download + enough length
    candidates = [f for f in mp3s if 2_000_000 <= int(f.get("size") or 0) <= 20_000_000]
    if not candidates:
        candidates = mp3s[:8]
    wrote = existing
    for f in candidates:
        if wrote >= MAX_PER:
            break
        name = f["name"]
        url = f"https://archive.org/download/{item}/{name}"
        cache_path = CACHE / item / name
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        if cache_path.is_file() and cache_path.stat().st_size > 1000:
            data = cache_path.read_bytes()
            print(f"  cache hit {name}", flush=True)
        else:
            print(f"  Downloading {name} ({round(int(f.get('size') or 0)/1e6,1)} MB) …", flush=True)
            data = http_get(url, timeout=300)
            cache_path.write_bytes(data)
        try:
            audio, sr = load_mp3_audio(data)
        except Exception as exc:  # noqa: BLE001
            print(f"  skip decode {name}: {exc}", flush=True)
            continue
        need = MAX_PER - wrote
        # take up to 2 clips from each chapter for speaker variety across files
        wrote = cut_clips_from_audio(
            audio, sr, min(2, need), lang=lang, cfg=cfg, source_name=name, start_index=wrote
        )
    return wrote


def fill_from_fleurs(lang: str, cfg: dict) -> int:
    """Download FLEURS {split}.tar.gz for one language; extract first MAX_PER wav/flac."""
    from huggingface_hub import hf_hub_download

    dest = OUT / lang
    dest.mkdir(parents=True, exist_ok=True)
    existing = len(list(dest.glob("native-*.wav")))
    if existing >= MAX_PER:
        print(f"  already have {existing}", flush=True)
        return existing

    fleurs_lang = cfg["fleurs_lang"]
    split = cfg.get("fleurs_split", "dev")
    rel = f"data/{fleurs_lang}/audio/{split}.tar.gz"
    print(f"  HF download google/fleurs {rel} …", flush=True)
    tar_path = hf_hub_download(
        repo_id="google/fleurs",
        repo_type="dataset",
        filename=rel,
        cache_dir=str(CACHE / "hf"),
    )
    wrote = existing
    with tarfile.open(tar_path, "r:gz") as tar:
        members = [m for m in tar.getmembers() if m.isfile() and m.name.lower().endswith((".wav", ".flac", ".mp3"))]
        # diversify: take evenly spaced members
        if not members:
            print("  WARN: empty fleurs tar", flush=True)
            return wrote
        step = max(1, len(members) // (MAX_PER + 1))
        picks = members[step::step][: MAX_PER * 2]
        for m in picks:
            if wrote >= MAX_PER:
                break
            out = dest / f"native-{wrote:02d}.wav"
            if out.is_file() and out.stat().st_size > 1000:
                wrote += 1
                continue
            fobj = tar.extractfile(m)
            if fobj is None:
                continue
            raw = fobj.read()
            try:
                if m.name.lower().endswith(".mp3"):
                    audio, sr = load_mp3_audio(raw)
                else:
                    audio, sr = sf.read(io.BytesIO(raw), always_2d=False)
                    if getattr(audio, "ndim", 1) > 1:
                        audio = np.mean(audio, axis=1)
                    audio = np.asarray(audio, dtype=np.float32)
            except Exception as exc:  # noqa: BLE001
                print(f"  skip {m.name}: {exc}", flush=True)
                continue
            meta = {
                "source": f"fleurs:{fleurs_lang}/{split}",
                "archive_file": m.name,
                "language": lang,
                "character": cfg["character"],
                "label": cfg["label"],
                "license": cfg["license"],
            }
            # take start of utterance (already short in FLEURS)
            if write_clip(out, audio, int(sr), meta):
                wrote += 1
    return wrote


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)

    # Prefer a known British LibriVox id; fall back if missing
    try:
        list_archive_mp3s("pride_and_prejudice_librivox")
    except Exception:
        NATIVE["british-english"]["archive_item"] = "pride_and_prejudice_0810_librivox"

    summary = {}
    for lang, cfg in NATIVE.items():
        print(f"\n=== {lang} → {cfg['character']} ({cfg['label']}) ===", flush=True)
        if cfg.get("fleurs_lang"):
            n = fill_from_fleurs(lang, cfg)
        else:
            n = fill_from_librivox(lang, cfg)
        summary[lang] = {
            "character": cfg["character"],
            "label": cfg["label"],
            "files": [p.name for p in sorted((OUT / lang).glob("native-*.wav"))],
            "count": n,
        }
        print(f"  Total {n}/{MAX_PER}", flush=True)

    man = {
        "root": str(OUT),
        "max_per": MAX_PER,
        "languages": summary,
        "character_map": {v["character"]: k for k, v in NATIVE.items()},
    }
    (OUT / "manifest.json").write_text(json.dumps(man, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT / "README.md").write_text(
        """# Native-language voice donors

Authentic L1 speech (not L2-accented English) for Seed-VC prosody painting.

| Folder | Character | Language |
|--------|-----------|----------|
| mandarin | Zao | Mandarin Chinese |
| german | Voss | German |
| british-english | Harlan | British English |
| hindi | Elin | Hindi |
| french | Sorell | French |
| igbo | Okoye | Igbo |

EdAcc L1-*English* donors remain under `../en/` for comparison.
""",
        encoding="utf-8",
    )
    print(f"\nDone. {OUT / 'manifest.json'}", flush=True)


if __name__ == "__main__":
    main()
