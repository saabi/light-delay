#!/usr/bin/env python3
"""Okoye EN timbre × Argentine (Rioplatense) ES prosody → Seed-VC → Qwen ES phrase.

Prepares Spanish regional candidates for Okoye so she can join static/assets/voices/es/
before the native-L1 Spanish pass (same pattern as EN native-l1).

  1) Seed-VC: source = voice-donors/es/rioplatense/*.wav, target = en/Okoye.wav (passes 1..N)
  2) Qwen3-TTS: Spanish sample phrase from each colored ref
  3) Stage under es-accents/okoye-rioplatense/finalists/

Run:
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/pipeline-okoye-spanish-rioplatense.py --seedvc-only --passes 1 2 3 4 5
  python scripts/pipeline-okoye-spanish-rioplatense.py --qwen-only --passes 1 2 3 4 5
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
OUT_ROOT = ES_ROOT / "okoye-rioplatense"
DONORS = Path(r"E:\Models\voice-donors\es\rioplatense")
COLORED = OUT_ROOT / "donors-colored"
FINALISTS = OUT_ROOT / "finalists"
SELECTED = ROOT / "static" / "assets" / "voices" / "en" / "Okoye.wav"
SEED_VC = Path(r"E:\Models\Seed-VC")
CHARACTER = "Okoye"
ACCENT = "rioplatense"

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


def list_donors() -> list[Path]:
    if not DONORS.is_dir():
        return []
    return sorted(DONORS.glob("*.wav"))


def pass_out_path(donor: Path, pass_n: int) -> Path:
    base = f"{donor.stem}__{CHARACTER}"
    folder = COLORED / ACCENT / CHARACTER
    if pass_n == 1:
        return folder / f"{base}.wav"
    return folder / f"{base}_{PASS_ORD[pass_n]}_pass.wav"


def prev_pass_path(donor: Path, pass_n: int) -> Path:
    if pass_n == 1:
        return SELECTED
    return pass_out_path(donor, pass_n - 1)


def donor_ref_text(donor_wav: Path) -> str | None:
    meta = donor_wav.with_suffix(".json")
    if not meta.is_file():
        return None
    data = json.loads(meta.read_text(encoding="utf-8"))
    text = str(data.get("text") or "").strip()
    return text or None


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
    a.f0_condition = False
    a.auto_f0_adjust = True
    a.semi_tone_shift = 0
    a.fp16 = True
    a.diffusion_steps = 30
    a.length_adjust = 1.0
    a.inference_cfg_rate = 0.7

    print("Loading Seed-VC …", flush=True)
    model, semantic_fn, f0_fn, vocoder_fn, campplus_model, mel_fn, mel_fn_args = seed_inf.load_models(
        a
    )
    print("Seed-VC ready.", flush=True)

    failures = 0
    for pass_n in passes:
        jobs = []
        for donor in list_donors():
            out = pass_out_path(donor, pass_n)
            if skip_existing and out.is_file():
                continue
            target = prev_pass_path(donor, pass_n)
            if not target.is_file():
                print(f"WARN missing target {target}", flush=True)
                continue
            jobs.append((donor, target, out))

        print(f"Seed-VC pass {pass_n}: {len(jobs)} jobs", flush=True)
        for source, target, out in tqdm(jobs, desc=f"VC p{pass_n}"):
            try:
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
                    diffusion_steps=30,
                    length_adjust=1.0,
                    inference_cfg_rate=0.7,
                    auto_f0_adjust=True,
                    f0_condition=False,
                )
            except Exception as exc:  # noqa: BLE001
                failures += 1
                print(f"FAIL VC {source.name} p{pass_n}: {exc}", flush=True)
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
        for donor in list_donors():
            ref = pass_out_path(donor, pass_n)
            if not ref.is_file():
                continue
            if pass_n == 1:
                out_name = f"{donor.stem}__{CHARACTER}_p1_qwen-es.wav"
            else:
                out_name = f"{donor.stem}__{CHARACTER}_{PASS_ORD[pass_n]}_pass_qwen-es.wav"
            out = ref.with_name(out_name)
            if skip_existing and out.is_file():
                continue
            jobs.append((ref, out, donor, pass_n))

    print(
        f"Qwen-ES jobs: {len(jobs)} (max_new_tokens={max_new_tokens}, max_out_seconds={max_out_seconds})",
        flush=True,
    )
    for ref, out, donor, pass_n in tqdm(jobs, desc="Qwen-ES"):
        ref_text = donor_ref_text(donor)
        x_only = not bool(ref_text)
        if x_only:
            print(f"  x_vector_only: {donor.name}", flush=True)
        try:
            prompt = qwen.create_voice_clone_prompt(
                ref_audio=str(ref),
                ref_text=ref_text,
                x_vector_only_mode=x_only,
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
                clips.append({"ok": False, "ref": str(ref), "error": f"too_long:{out_sec:.1f}s"})
                print(f"FAIL too long {out_sec:.1f}s {ref.name}", flush=True)
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            sf.write(str(out), wav, target_sr)
            dest_dir = FINALISTS / CHARACTER
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / out.name
            shutil.copy2(out, dest)
            clips.append(
                {
                    "ok": True,
                    "character": CHARACTER,
                    "accent": ACCENT,
                    "pass": pass_n,
                    "donor": donor.name,
                    "ref": str(ref),
                    "finalist": str(dest),
                    "ref_text": ref_text,
                    "x_vector_only": x_only,
                    "seconds": round(out_sec, 2),
                }
            )
        except Exception as exc:  # noqa: BLE001
            failures += 1
            clips.append({"ok": False, "ref": str(ref), "error": str(exc)})
            print(f"FAIL Qwen {ref.name}: {exc}", flush=True)

    man = {
        "phrase": ES_PHRASE,
        "character": CHARACTER,
        "accent": ACCENT,
        "timbre": str(SELECTED),
        "passes": passes,
        "jobs": len(jobs),
        "failures": failures,
        "clips": clips,
        "note": (
            "Curate one WAV into static/assets/voices/es/Okoye.wav, "
            "then run native-L1 Spanish (Igbo) like EN native-l1."
        ),
    }
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    (FINALISTS / "manifest.json").write_text(
        json.dumps(man, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (FINALISTS / "README.md").write_text(
        """# Okoye — Rioplatense Spanish candidates

Timbre: `static/assets/voices/en/Okoye.wav`
Prosody: Argentine Rioplatense donors (`voice-donors/es/rioplatense/`)
Then Qwen3-TTS Spanish sample phrase.

Pick **one** WAV → `static/assets/voices/es/Okoye.wav` before the Igbo native-L1 Spanish pass.

Note: the voice bible keeps Nigerian/Igbo inflection for Okoye in Spanish long-term;
this Argentine pass is the interim regional sample so she can enter the ES selected set.
""",
        encoding="utf-8",
    )
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--passes", type=int, nargs="+", default=[1, 2, 3, 4, 5])
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_false", dest="skip_existing")
    parser.add_argument("--seedvc-only", action="store_true")
    parser.add_argument("--qwen-only", action="store_true")
    parser.add_argument("--max-new-tokens", type=int, default=768)
    parser.add_argument("--max-out-seconds", type=float, default=25.0)
    args = parser.parse_args()

    donors = list_donors()
    print(
        f"{CHARACTER} accent={ACCENT} donors={len(donors)} selected={SELECTED.is_file()}",
        flush=True,
    )
    if not donors:
        raise SystemExit(f"No donors in {DONORS}")
    if not SELECTED.is_file():
        raise SystemExit(f"Missing timbre {SELECTED}")

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
    print(f"Done. failures={fails} finalists={FINALISTS}", flush=True)
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
