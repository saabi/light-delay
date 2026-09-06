#!/usr/bin/env python3
"""Spanish accent prosody (neutral VoiceDesign) → Seed-VC timbre paint (selected refs).

Stage A: Qwen3-TTS VoiceDesign generates Spanish with strong accent instructs but a
          generic donor timbre (not the character clones).
Stage B: Seed-VC converts those sources onto selected Voss/Zao timbres.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
OUT = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents\prosody-seedvc")
SEED_VC = Path(r"E:\Models\Seed-VC")
SEED_PY = SEED_VC / ".venv" / "Scripts" / "python.exe"

TEXT = (
    "Los sistemas de la nave están estables. "
    "Propulsión, guiado y comunicaciones en orden. "
    "Mantendremos la aceleración prevista y el calendario de contacto."
)

# Shared Spanish accent recipes (prosody only); timbre comes from donor prefix.
ACCENTS: dict[str, str] = {
    "rioplatense": (
        "Argentine Rioplatense (Buenos Aires) Spanish. Soft yeísmo rehilado: ll and y like "
        "English sh/zh. Italianate musical cadence, slightly drawn vowels. Strong porteño "
        "prosody; not Castilian."
    ),
    "santiago-del-estero": (
        "Argentine Santiago del Estero Spanish. Clearer ll/y than Buenos Aires (little "
        "shushing). Northwest Andean cadence, measured rural-Argentine rhythm; not porteño."
    ),
    "spain-castilian": (
        "Castilian Spanish from Spain. Distinguish z and soft c as dental theta /θ/. "
        "Crisp consonants, Madrid-neutral peninsular rhythm; not Latin American."
    ),
    "peruvian-lima": (
        "Coastal Peruvian (Lima) Spanish. Clear syllable timing, soft consonants, even "
        "moderate pace; Limeño prosody, not Caribbean and not Castilian."
    ),
    "venezuelan": (
        "Venezuelan Spanish (Caracas). Caribbean-leaning faster cadence; softened or "
        "aspirated final /s/; warm Venezuelan rhythm, not Rioplatense."
    ),
    "colombian-bogota": (
        "Colombian Spanish (Bogotá highland). Very clear enunciation, moderate pace, "
        "careful consonants; highland Colombian prosody, not coastal Caribbean."
    ),
}

# Neutral donors — deliberately NOT the cast characters.
DONORS: dict[str, dict] = {
    "Voss": {
        "selected": ROOT / "static" / "assets" / "voices" / "en" / "Voss.wav",
        "timbre": (
            "Neutral adult male donor voice, mid baritone, plain studio tone, no character "
            "acting, no rasp, no accent of its own beyond the Spanish accent described next."
        ),
    },
    "Zao": {
        "selected": ROOT / "static" / "assets" / "voices" / "en" / "Zao.wav",
        "timbre": (
            "Neutral adult female donor voice, mid mezzo, plain studio tone, no character "
            "acting, no rasp, no accent of its own beyond the Spanish accent described next."
        ),
    },
}


def load_voice_design(qwen_cast: dict):
    import torch
    from qwen_tts import Qwen3TTSModel

    cache = Path(qwen_cast["models"]["cacheDir"])
    os.environ.setdefault("HF_HOME", str(cache))
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(cache / "hub"))
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32
    print(f"Loading VoiceDesign on {device} …", flush=True)
    kwargs = {"device_map": device if device.startswith("cuda") else "cpu", "dtype": dtype}
    mid = qwen_cast["models"]["voiceDesign"]
    try:
        return Qwen3TTSModel.from_pretrained(mid, attn_implementation="flash_attention_2", **kwargs)
    except Exception as exc:  # noqa: BLE001
        print(f"flash_attention_2 unavailable ({exc}); loading without it", flush=True)
        return Qwen3TTSModel.from_pretrained(mid, **kwargs)


def stage_a_prosody(model, out_dir: Path) -> list[dict]:
    prosody_dir = out_dir / "prosody-donors"
    prosody_dir.mkdir(parents=True, exist_ok=True)
    clips: list[dict] = []
    for character, donor in DONORS.items():
        for accent_key, accent_instruct in ACCENTS.items():
            instruct = f"{donor['timbre']} Speak Spanish. {accent_instruct}"
            label = f"{character.lower()}-donor-{accent_key}"
            print(f"[A] VoiceDesign {label} …", flush=True)
            wavs, sr = model.generate_voice_design(
                text=TEXT,
                language="Spanish",
                instruct=instruct,
                non_streaming_mode=True,
                temperature=0.9,
                top_p=0.95,
                max_new_tokens=2048,
            )
            wav = np.asarray(wavs[0], dtype=np.float32)
            path = prosody_dir / f"{label}.wav"
            sf.write(str(path), wav, int(sr))
            print(f"    Wrote {path} ({len(wav) / sr:.1f}s)", flush=True)
            clips.append(
                {
                    "character": character,
                    "accent": accent_key,
                    "prosody": str(path),
                    "target": str(donor["selected"]),
                    "instruct": instruct,
                }
            )
    return clips


def stage_b_seedvc(clips: list[dict], out_dir: Path) -> list[dict]:
    colored_dir = out_dir / "colored"
    colored_dir.mkdir(parents=True, exist_ok=True)
    if not SEED_PY.is_file():
        raise SystemExit(f"Seed-VC venv missing: {SEED_PY}")

    env = os.environ.copy()
    env["HF_HUB_CACHE"] = str(SEED_VC / "checkpoints" / "hf_cache")
    env["HF_HOME"] = env["HF_HUB_CACHE"]
    env["PYTHONUNBUFFERED"] = "1"

    results = []
    for item in clips:
        print(
            f"[B] Seed-VC {Path(item['prosody']).name} -> {item['character']} ...",
            flush=True,
        )
        cmd = [
            str(SEED_PY),
            "-u",
            "inference.py",
            "--source",
            item["prosody"],
            "--target",
            item["target"],
            "--output",
            str(colored_dir),
            "--diffusion-steps",
            "30",
            "--inference-cfg-rate",
            "0.7",
            "--f0-condition",
            "False",
            "--auto-f0-adjust",
            "True",
            "--fp16",
            "True",
        ]
        proc = subprocess.run(
            cmd,
            cwd=str(SEED_VC),
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        log_path = colored_dir / f"{item['character'].lower()}-{item['accent']}.log"
        log_path.write_text(proc.stdout + "\n" + proc.stderr, encoding="utf-8")
        if proc.returncode != 0:
            print(f"    FAIL (see {log_path})", flush=True)
            item["ok"] = False
            item["log"] = str(log_path)
            results.append(item)
            continue
        # Find newest matching vc_*.wav for this source stem
        stem = Path(item["prosody"]).stem
        matches = sorted(colored_dir.glob(f"vc_{stem}_*.wav"), key=lambda p: p.stat().st_mtime)
        if not matches:
            print(f"    FAIL: no output wav for {stem}", flush=True)
            item["ok"] = False
            results.append(item)
            continue
        out = matches[-1]
        # Friendly alias
        alias = colored_dir / f"{item['character'].lower()}-{item['accent']}-colored.wav"
        alias.write_bytes(out.read_bytes())
        item["colored"] = str(alias)
        item["ok"] = True
        print(f"    Wrote {alias}", flush=True)
        results.append(item)
    return results


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--seedvc-only",
        action="store_true",
        help="Skip VoiceDesign; color existing prosody-donors/*.wav",
    )
    args = parser.parse_args()

    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)

    if args.seedvc_only:
        clips = []
        for character, donor in DONORS.items():
            for accent_key in ACCENTS:
                path = OUT / "prosody-donors" / f"{character.lower()}-donor-{accent_key}.wav"
                if not path.is_file():
                    print(f"WARN missing {path}", flush=True)
                    continue
                clips.append(
                    {
                        "character": character,
                        "accent": accent_key,
                        "prosody": str(path),
                        "target": str(donor["selected"]),
                    }
                )
        if not clips:
            raise SystemExit("No prosody donor wavs found")
    else:
        model = load_voice_design(qwen_cast)
        clips = stage_a_prosody(model, OUT)
        try:
            import gc
            import torch

            del model
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass

    results = stage_b_seedvc(clips, OUT)
    manifest = {
        "text": TEXT,
        "pipeline": "VoiceDesign(neutral+accent) -> Seed-VC(selected timbre)",
        "clips": results,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    ok = sum(1 for r in results if r.get("ok"))
    print(f"Done: {ok}/{len(results)} colored clips -> {OUT}", flush=True)
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
