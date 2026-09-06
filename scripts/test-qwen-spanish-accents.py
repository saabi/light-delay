#!/usr/bin/env python3
"""Spanish accent A/B grid: same Voss/Zao clones, language=Spanish, accent via instruct."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
OUT_DIR = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents")

SPEAKERS = ("Voss", "Zao")
TEXT = (
    "Los sistemas de la nave están estables. "
    "Propulsión, guiado y comunicaciones en orden. "
    "Mantendremos la aceleración prevista."
)

# Accent key -> natural-language instruct (Qwen style). Identity stays in clone ref.
ACCENTS: dict[str, str] = {
    "rioplatense": (
        "Speak Spanish with a strong Argentine Rioplatense (Buenos Aires / Río de la Plata) accent. "
        "Soft yeísmo rehilado: ll and y like English 'sh'/'zh'. Italianate musical cadence, "
        "slightly drawn vowels. Clear but porteño; not Castilian."
    ),
    "santiago-del-estero": (
        "Speak Spanish with an Argentine Santiago del Estero accent (northwest Argentina). "
        "Clearer ll/y than Buenos Aires (less shushing). More Andean, measured cadence; "
        "rural-northwest Argentine Spanish, not porteño."
    ),
    "spain-castilian": (
        "Speak Spanish with a neutral Castilian (Spain) accent. "
        "Distinguish z and soft c as dental /θ/ (theta). Crisp consonants, Madrid-neutral "
        "peninsular rhythm; not Latin American."
    ),
    "peruvian-lima": (
        "Speak Spanish with a coastal Peruvian (Lima) accent. "
        "Clear syllable timing, soft consonants, even moderate pace; "
        "neutral Limeño Spanish, not Caribbean and not Castilian."
    ),
    "venezuelan": (
        "Speak Spanish with a Venezuelan accent (Caracas / general Venezuelan). "
        "Caribbean-leaning cadence, slightly faster; softened or aspirated final /s/; "
        "warm Venezuelan Spanish, not Rioplatense."
    ),
    "colombian-bogota": (
        "Speak Spanish with a neutral Colombian (Bogotá) accent. "
        "Very clear enunciation, moderate pace, careful consonants; "
        "highland Colombian Spanish, not coastal Caribbean and not Castilian."
    ),
}


def silence(ms: int, sr: int) -> np.ndarray:
    return np.zeros(int(sr * ms / 1000.0), dtype=np.float32)


def main() -> int:
    sys.path.insert(0, str(ROOT / "scripts"))
    from importlib.machinery import SourceFileLoader

    dual = SourceFileLoader(
        "dual", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()

    # CUDA DLL path for any residual ORT use (Qwen is torch)
    dual.bootstrap_kokoro_cuda()

    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    qwen = dual.load_qwen_clone(qwen_cast)
    all_prompts = dual.build_clone_prompts(qwen, qwen_cast)
    prompts = {name: all_prompts[name] for name in SPEAKERS if name in all_prompts}
    missing = [n for n in SPEAKERS if n not in prompts]
    if missing:
        raise SystemExit(f"Missing clone refs for: {missing}")

    target_sr = 24000
    reel: list[np.ndarray] = []
    manifest: list[dict] = []

    for speaker in SPEAKERS:
        for accent_key, instruct in ACCENTS.items():
            label = f"{speaker.lower()}-{accent_key}"
            print(f"Generating {label} …", flush=True)
            wav, sr = dual.qwen_clone_with_instruct(
                qwen,
                text=TEXT,
                language="Spanish",
                voice_clone_prompt=prompts[speaker],
                instruct=instruct,
                non_streaming_mode=True,
                temperature=0.85,
                top_p=0.95,
                max_new_tokens=2048,
            )
            wav = dual.resample_linear(np.asarray(wav, dtype=np.float32), int(sr), target_sr)
            wav = np.clip(wav * 0.92, -1.0, 1.0)
            path = OUT_DIR / f"{label}.wav"
            sf.write(str(path), wav, target_sr)
            print(f"  Wrote {path} ({len(wav) / target_sr:.1f}s)", flush=True)
            manifest.append(
                {
                    "file": path.name,
                    "speaker": speaker,
                    "accent": accent_key,
                    "language": "Spanish",
                    "text": TEXT,
                    "instruct": instruct,
                }
            )
            # Short spoken label via silence + clip (no Kokoro for Spanish labels)
            reel.append(silence(400, target_sr))
            reel.append(wav)
            reel.append(silence(700, target_sr))

    combo = np.concatenate(reel) if reel else silence(100, target_sr)
    combo_path = OUT_DIR / "es-accent-grid-voss-zao.wav"
    sf.write(str(combo_path), combo, target_sr)
    manifest_path = OUT_DIR / "manifest.json"
    manifest_path.write_text(
        json.dumps({"text": TEXT, "clips": manifest, "combo": combo_path.name}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {combo_path}", flush=True)
    print(f"Wrote {manifest_path} ({len(manifest)} clips)", flush=True)
    return 0


if __name__ == "__main__":
    # Quiet unused import warning path for torch PATH bootstrap
    os.environ.setdefault("HF_HOME", r"E:\Models\Qwen3-TTS\hf-cache")
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", r"E:\Models\Qwen3-TTS\hf-cache\hub")
    raise SystemExit(main())
