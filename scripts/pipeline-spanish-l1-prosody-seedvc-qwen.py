#!/usr/bin/env python3
"""Spanish + L1 prosody: paint original-language rhythm onto ES finalists → Qwen ES phrase.

Accent map matches the English pipeline (Mandarin / Germanic / British / Indian / French / Celtic).

  1) Seed-VC: source = L1 donor, target = each Spanish finalist WAV (passes 1..N)
  2) Qwen3-TTS: Spanish sample phrase from each colored ref (x_vector_only — ref language ≠ ES)
  3) Stage under es-accents/l1-prosody/finalists/{Character}/

L1 donors: prefer authentic native-language clips under
  E:/Models/voice-donors/native/{lang}/ (LibriVox / FLEURS);
  fall back to EdAcc L1-English under voice-donors/en/{accent}/.

Run Seed-VC with Seed-VC venv; Qwen with system Python (flash-attn):
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/pipeline-spanish-l1-prosody-seedvc-qwen.py --seedvc-only
  python scripts/pipeline-spanish-l1-prosody-seedvc-qwen.py --qwen-only
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from importlib.machinery import SourceFileLoader
from pathlib import Path

import numpy as np
import soundfile as sf
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
QWEN_CAST = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
ES_ROOT = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents")
L1_ROOT = ES_ROOT / "l1-prosody"
DONORS = Path(r"E:\Models\voice-donors\en")
NATIVE_DONORS = Path(r"E:\Models\voice-donors\native")
COLORED = L1_ROOT / "donors-colored"
FINALISTS_OUT = L1_ROOT / "finalists"
ES_FINALISTS = ES_ROOT / "finalists"
SELECTED = Path(__file__).resolve().parents[1] / "static" / "assets" / "voices" / "en"
SEED_VC = Path(r"E:\Models\Seed-VC")

CAST = {
    "mandarin-english": "Zao",
    "germanic-nordic-english": "Voss",
    "british-english": "Harlan",
    "indian-english": "Elin",
    "french-english": "Sorell",
}

# Pipeline accent key → native/ language folder (download-native-language-donors.py)
ACCENT_TO_NATIVE = {
    "mandarin-english": "mandarin",
    "germanic-nordic-english": "german",
    "british-english": "british-english",
    "indian-english": "hindi",
    "french-english": "french",
    "nigerian-english": "igbo",
}

PASS_ORD = {1: None, 2: "2nd", 3: "3rd", 4: "4th", 5: "5th"}

ES_PHRASE = (
    "Los sistemas de la nave están estables. "
    "Propulsión, guiado y comunicaciones en orden. "
    "Mantendremos la aceleración prevista y el calendario de contacto."
)
ES_INSTRUCT = "Speak Spanish naturally and clearly."


def load_batch():
    return SourceFileLoader(
        "batch_seedvc", str(ROOT / "scripts" / "batch-seedvc-paint-donors.py")
    ).load_module()


def load_dual():
    return SourceFileLoader(
        "dual", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()


def list_donors(accent: str) -> list[Path]:
    """Prefer native-language donors; fall back to EdAcc L1-English."""
    native_key = ACCENT_TO_NATIVE.get(accent)
    if native_key:
        folder = NATIVE_DONORS / native_key
        if folder.is_dir():
            waves = sorted(folder.glob("native-*.wav"))
            if waves:
                return waves
    folder = DONORS / accent
    if not folder.is_dir():
        return []
    return sorted(folder.glob("*.wav"))


def list_es_targets(character: str) -> list[Path]:
    """Spanish finalist WAVs for this character; Cael → selected fallback."""
    folder = ES_FINALISTS / character
    if folder.is_dir():
        wavs = sorted(p for p in folder.glob("*.wav") if p.stat().st_size > 1000)
        if wavs:
            return wavs
    sel = SELECTED / f"{character}.wav"
    if sel.is_file():
        print(
            f"WARN {character}: no ES finalists; using selected/{character}.wav",
            flush=True,
        )
        return [sel]
    return []


def pass_out_path(
    accent: str, character: str, target: Path, donor: Path, pass_n: int
) -> Path:
    """colored/{accent}/{Character}/{targetStem}__{donorStem}[_Nth_pass].wav"""
    folder = COLORED / accent / character
    base = f"{target.stem}__{donor.stem}"
    if pass_n == 1:
        return folder / f"{base}.wav"
    return folder / f"{base}_{PASS_ORD[pass_n]}_pass.wav"


def prev_target_path(
    accent: str, character: str, target: Path, donor: Path, pass_n: int
) -> Path:
    if pass_n == 1:
        return target
    return pass_out_path(accent, character, target, donor, pass_n - 1)


def run_seedvc_passes(passes: list[int], *, skip_existing: bool) -> int:
    batch = load_batch()
    os.environ.setdefault("HF_HUB_CACHE", str(SEED_VC / "checkpoints" / "hf_cache"))
    os.environ.setdefault("HF_HOME", os.environ["HF_HUB_CACHE"])
    sys.path.insert(0, str(SEED_VC))
    os.chdir(SEED_VC)
    import inference as seed_inf  # noqa: E402

    class A:
        pass

    a = A()
    a.checkpoint = None
    a.config = None
    a.fp16 = True
    a.f0_condition = False
    (
        model,
        semantic_fn,
        f0_fn,
        vocoder_fn,
        campplus_model,
        mel_fn,
        mel_fn_args,
    ) = seed_inf.load_models(a)

    failures = 0
    # Run passes sequentially so pass N can use outputs from pass N-1 in the same invocation.
    for pass_n in passes:
        jobs = []
        for accent, character in CAST.items():
            targets = list_es_targets(character)
            donors = list_donors(accent)
            if not targets:
                print(f"SKIP {character}: no ES target", flush=True)
                continue
            if not donors:
                print(f"SKIP {accent}: no L1 donors", flush=True)
                continue
            for target in targets:
                for donor in donors:
                    out = pass_out_path(accent, character, target, donor, pass_n)
                    if skip_existing and out.is_file() and out.stat().st_size > 1000:
                        continue
                    prev = prev_target_path(accent, character, target, donor, pass_n)
                    if not prev.is_file():
                        print(f"WARN missing prev {prev.name}", flush=True)
                        continue
                    jobs.append((donor, prev, out, accent, character, pass_n))

        print(f"Seed-VC L1→ES pass {pass_n}: {len(jobs)} jobs", flush=True)
        for source, target, out, accent, character, _pn in tqdm(jobs, desc=f"Seed-VC p{pass_n}"):
            try:
                out.parent.mkdir(parents=True, exist_ok=True)
                batch.convert_one(
                    model=model,
                    semantic_fn=semantic_fn,
                    f0_fn=f0_fn,
                    vocoder_fn=vocoder_fn,
                    campplus_model=campplus_model,
                    mel_fn=mel_fn,
                    mel_fn_args=mel_fn_args,
                    source_path=source,
                    target_path=target,
                    out_path=out,
                    diffusion_steps=25,
                    length_adjust=1.0,
                    inference_cfg_rate=0.7,
                    auto_f0_adjust=True,
                    f0_condition=False,
                )
            except Exception as exc:  # noqa: BLE001
                failures += 1
                print(f"FAIL VC {source.name}->{out.name}: {exc}", flush=True)
    return failures


def run_qwen_for_passes(
    passes: list[int],
    *,
    skip_existing: bool,
    max_new_tokens: int,
    max_out_seconds: float,
) -> int:
    dual = load_dual()
    dual.bootstrap_kokoro_cuda()
    qwen_cast = json.loads(QWEN_CAST.read_text(encoding="utf-8"))
    gen = qwen_cast.get("generation") or {}

    cache = Path(qwen_cast["models"]["cacheDir"])
    os.environ["HF_HOME"] = str(cache)
    os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache / "hub")
    os.environ.pop("HF_HUB_CACHE", None)

    qwen = dual.load_qwen_clone(qwen_cast)
    target_sr = 24000
    failures = 0
    clips = []

    jobs = []
    for pass_n in passes:
        for accent, character in CAST.items():
            for target in list_es_targets(character):
                for donor in list_donors(accent):
                    ref = pass_out_path(accent, character, target, donor, pass_n)
                    if not ref.is_file():
                        continue
                    if pass_n == 1:
                        out_name = f"{ref.stem}_qwen-es.wav"
                    else:
                        # ref already has _2nd_pass etc.
                        out_name = f"{ref.stem}_qwen-es.wav"
                    out = ref.with_name(out_name)
                    if skip_existing and out.is_file() and out.stat().st_size > 1000:
                        continue
                    jobs.append((ref, out, accent, character, donor, pass_n, target))

    print(
        f"Qwen-ES (L1) jobs: {len(jobs)} "
        f"(max_new_tokens={max_new_tokens}, max_out_seconds={max_out_seconds})",
        flush=True,
    )
    for ref, out, accent, character, donor, pass_n, target in tqdm(jobs, desc="Qwen-ES-L1"):
        # Colored ref carries L1/donor content, not Spanish — timbre-only ICL
        try:
            prompt = qwen.create_voice_clone_prompt(
                ref_audio=str(ref),
                ref_text=None,
                x_vector_only_mode=True,
            )
            wav, sr = dual.qwen_clone_with_instruct(
                qwen,
                text=ES_PHRASE,
                language="Spanish",
                voice_clone_prompt=prompt,
                instruct=ES_INSTRUCT,
                non_streaming_mode=bool(gen.get("non_streaming_mode", True)),
                temperature=float(gen.get("temperature", 0.85)),
                top_p=float(gen.get("top_p", 0.95)),
                max_new_tokens=max_new_tokens,
            )
            wav = dual.resample_linear(np.asarray(wav, dtype=np.float32), int(sr), target_sr)
            wav = np.clip(wav * 0.92, -1.0, 1.0)
            out_sec = len(wav) / float(target_sr)
            if out_sec > max_out_seconds:
                failures += 1
                clips.append(
                    {
                        "ok": False,
                        "ref": str(ref),
                        "error": f"too_long:{out_sec:.1f}s",
                    }
                )
                print(f"FAIL too long {out_sec:.1f}s {ref.name}", flush=True)
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            sf.write(str(out), wav, target_sr)
            dest_dir = FINALISTS_OUT / character
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / out.name
            shutil.copy2(out, dest)
            clips.append(
                {
                    "ok": True,
                    "character": character,
                    "accent": accent,
                    "pass": pass_n,
                    "es_finalist": target.name,
                    "donor": donor.name,
                    "ref": str(ref),
                    "out": str(out),
                    "finalist": str(dest),
                    "seconds": round(out_sec, 2),
                    "x_vector_only": True,
                }
            )
        except Exception as exc:  # noqa: BLE001
            failures += 1
            clips.append({"ok": False, "ref": str(ref), "error": str(exc)})
            print(f"FAIL Qwen {ref.name}: {exc}", flush=True)

    man = {
        "phrase": ES_PHRASE,
        "passes": passes,
        "jobs": len(jobs),
        "failures": failures,
        "clips": clips,
        "note": "L1 prosody on ES regional finalists; Qwen uses x_vector_only",
    }
    COLORED.mkdir(parents=True, exist_ok=True)
    (COLORED / "qwen-es-l1-manifest.json").write_text(
        json.dumps(man, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    readme = FINALISTS_OUT / "README.md"
    if not readme.is_file():
        FINALISTS_OUT.mkdir(parents=True, exist_ok=True)
        readme.write_text(
            """# Finalistas ES + prosodia L1 (curaduría)

Prosodia del idioma/origen EN (mandarín, germánico, británico, indio, francés, celta)
pintada con Seed-VC sobre las muestras finalistas regionales ES, luego frase Qwen en español.

Elegir **una** WAV por personaje tras escuchar pases 1–3 × donantes L1.
""",
            encoding="utf-8",
        )
    return failures


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--passes", type=int, nargs="+", default=[1, 2, 3])
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_false", dest="skip_existing")
    parser.add_argument("--seedvc-only", action="store_true")
    parser.add_argument("--qwen-only", action="store_true")
    parser.add_argument("--max-new-tokens", type=int, default=768)
    parser.add_argument("--max-out-seconds", type=float, default=25.0)
    args = parser.parse_args()

    for accent, character in CAST.items():
        n_d = len(list_donors(accent))
        n_t = len(list_es_targets(character))
        print(
            f"{character:8} accent={accent:28} l1_donors={n_d} es_targets={n_t}",
            flush=True,
        )

    fails = 0
    if not args.qwen_only:
        fails += run_seedvc_passes(args.passes, skip_existing=args.skip_existing)
    if not args.seedvc_only:
        fails += run_qwen_for_passes(
            args.passes,
            skip_existing=args.skip_existing,
            max_new_tokens=args.max_new_tokens,
            max_out_seconds=args.max_out_seconds,
        )
    print(f"Done. failures={fails} finalists={FINALISTS_OUT}", flush=True)
    raise SystemExit(1 if fails else 0)


if __name__ == "__main__":
    main()
