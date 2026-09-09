#!/usr/bin/env python3
"""Latin American ES refs: EN timbre × regional donors → Seed-VC → Qwen ES phrase.

  1) Seed-VC: source = voice-donors/es/{accent}/*.wav, target = en/{Character}.wav
  2) Qwen3-TTS: Spanish sample phrase (regional instruct, no foreign L1 colour)
  3) Stage under es-accents/latam-regional/finalists/{Character}/
  4) Optional --promote after human curation

Run:
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/pipeline-spanish-latam-regional-qwen.py --seedvc-only
  python scripts/pipeline-spanish-latam-regional-qwen.py --qwen-only
  python scripts/pipeline-spanish-latam-regional-qwen.py --promote --character Zao --take path\\to\\finalist.wav
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from importlib.machinery import SourceFileLoader
from pathlib import Path

import numpy as np
import soundfile as sf
from tqdm import tqdm

ROOT = Path(__file__).resolve().parents[1]
QWEN_CAST_EN = ROOT / "docs" / "wip" / "qwen3-tts-cast.json"
ES_ROOT = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents")
OUT_ROOT = ES_ROOT / "latam-regional"
DONORS_ROOT = Path(r"E:\Models\voice-donors\es")
COLORED = OUT_ROOT / "donors-colored"
FINALISTS = OUT_ROOT / "finalists"
EN_VOICES = ROOT / "static" / "assets" / "voices" / "en"
ES_VOICES = ROOT / "static" / "assets" / "voices" / "es"
SEED_VC = Path(r"E:\Models\Seed-VC")

# Character → donor accent folder (Elin Medellín uses Bogotá proxy).
CAST: dict[str, dict[str, str]] = {
    "Zao": {
        "accent": "colombian-bogota",
        "variety_label": "Bogotá Colombian",
        "instruct": (
            "Speak clear formal Bogotá Colombian Spanish at a natural pace. "
            "Technical, precise diction. No foreign-language accent colour."
        ),
    },
    "Voss": {
        "accent": "peruvian-lima",
        "variety_label": "Lima Peruvian",
        "instruct": (
            "Speak clear formal coastal Peruvian (Lima) Spanish. "
            "Institutional, measured. No Germanic or Nordic accent colour."
        ),
    },
    "Harlan": {
        "accent": "rioplatense",
        "variety_label": "Buenos Aires Rioplatense",
        "instruct": (
            "Speak clear Buenos Aires Rioplatense Spanish with natural voseo cadence. "
            "Polished, not caricatured. No British accent colour."
        ),
    },
    "Elin": {
        "accent": "colombian-bogota",
        "variety_label": "Medellín Paisa (Bogotá donor proxy)",
        "instruct": (
            "Speak clear urban Colombian Spanish (Paisa/Medellín flavour via highland clarity). "
            "Warm but contained. No South Indian accent colour."
        ),
    },
    "Sorell": {
        "accent": "santiago-del-estero",
        "variety_label": "Santiago del Estero Argentine",
        "instruct": (
            "Speak clear Northwestern Argentine Spanish (Santiago del Estero): "
            "less rehilado than Buenos Aires, expressive and academic. No French accent colour."
        ),
    },
    "Okoye": {
        "accent": "venezuelan",
        "variety_label": "Caracas Venezuelan",
        "instruct": (
            "Speak clear formal Venezuelan (Caracas) Spanish: direct, operational, "
            "fully grammatical. No Igbo or Nigerian accent colour."
        ),
    },
}

PASS_ORD = {1: None, 2: "2nd", 3: "3rd", 4: "4th", 5: "5th"}

ES_PHRASE = (
    "Los sistemas de la nave están estables. "
    "Propulsión, guiado y comunicaciones en orden. "
    "Mantendremos la aceleración prevista y el calendario de contacto."
)


def load_batch():
    return SourceFileLoader(
        "batch_seedvc", str(ROOT / "scripts" / "batch-seedvc-paint-donors.py")
    ).load_module()


def load_dual():
    return SourceFileLoader(
        "dual", str(ROOT / "scripts" / "generate-dual-outline-audio.py")
    ).load_module()


def list_donors(accent: str) -> list[Path]:
    folder = DONORS_ROOT / accent
    if not folder.is_dir():
        return []
    return sorted(folder.glob("*.wav"))


def en_timbre(character: str) -> Path:
    return EN_VOICES / f"{character}.wav"


def pass_out_path(character: str, accent: str, donor: Path, pass_n: int) -> Path:
    base = f"{donor.stem}__{character}"
    folder = COLORED / accent / character
    if pass_n == 1:
        return folder / f"{base}.wav"
    return folder / f"{base}_{PASS_ORD[pass_n]}_pass.wav"


def prev_pass_path(character: str, accent: str, donor: Path, pass_n: int) -> Path:
    if pass_n == 1:
        return en_timbre(character)
    return pass_out_path(character, accent, donor, pass_n - 1)


def donor_ref_text(donor_wav: Path) -> str | None:
    meta = donor_wav.with_suffix(".json")
    if not meta.is_file():
        return None
    data = json.loads(meta.read_text(encoding="utf-8"))
    text = str(data.get("text") or "").strip()
    return text or None


def characters_filter(only: str | None) -> list[str]:
    if not only:
        return list(CAST.keys())
    if only not in CAST:
        raise SystemExit(f"Unknown character {only!r}; choose from {list(CAST)}")
    return [only]


def run_seedvc_passes(
    characters: list[str],
    passes: list[int],
    *,
    skip_existing: bool,
) -> int:
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
    for character in characters:
        accent = CAST[character]["accent"]
        donors = list_donors(accent)
        timbre = en_timbre(character)
        if not donors:
            print(f"WARN no donors for {character} accent={accent}", flush=True)
            continue
        if not timbre.is_file():
            print(f"WARN missing EN timbre {timbre}", flush=True)
            continue
        for pass_n in passes:
            jobs = []
            for donor in donors:
                out = pass_out_path(character, accent, donor, pass_n)
                if skip_existing and out.is_file():
                    continue
                target = prev_pass_path(character, accent, donor, pass_n)
                if not target.is_file():
                    print(f"WARN missing target {target}", flush=True)
                    continue
                jobs.append((donor, target, out))
            print(f"Seed-VC {character} pass {pass_n}: {len(jobs)} jobs", flush=True)
            for source, target, out in tqdm(jobs, desc=f"VC {character} p{pass_n}"):
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
                    print(f"FAIL VC {character} {source.name} p{pass_n}: {exc}", flush=True)
    return failures


def run_qwen_for_passes(
    characters: list[str],
    passes: list[int],
    *,
    skip_existing: bool,
    max_new_tokens: int,
    max_out_seconds: float,
) -> int:
    dual = load_dual()
    dual.bootstrap_kokoro_cuda()
    qwen_cast = json.loads(QWEN_CAST_EN.read_text(encoding="utf-8"))
    gen = qwen_cast.get("generation") or {}

    cache = Path(qwen_cast["models"]["cacheDir"])
    os.environ["HF_HOME"] = str(cache)
    os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache / "hub")
    os.environ.pop("HF_HUB_CACHE", None)

    qwen = dual.load_qwen_clone(qwen_cast)
    target_sr = 24000
    failures = 0
    all_clips: list[dict] = []

    for character in characters:
        accent = CAST[character]["accent"]
        instruct = CAST[character]["instruct"]
        donors = list_donors(accent)
        jobs = []
        for pass_n in passes:
            for donor in donors:
                ref = pass_out_path(character, accent, donor, pass_n)
                if not ref.is_file():
                    continue
                if pass_n == 1:
                    out_name = f"{donor.stem}__{character}_p1_qwen-es.wav"
                else:
                    out_name = f"{donor.stem}__{character}_{PASS_ORD[pass_n]}_pass_qwen-es.wav"
                out = ref.with_name(out_name)
                if skip_existing and out.is_file():
                    continue
                jobs.append((ref, out, donor, pass_n))

        print(
            f"Qwen-ES {character}: {len(jobs)} jobs "
            f"(max_new_tokens={max_new_tokens}, max_out_seconds={max_out_seconds})",
            flush=True,
        )
        for ref, out, donor, pass_n in tqdm(jobs, desc=f"Qwen {character}"):
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
                    instruct=instruct,
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
                    all_clips.append(
                        {"ok": False, "character": character, "ref": str(ref), "error": f"too_long:{out_sec:.1f}s"}
                    )
                    print(f"FAIL too long {out_sec:.1f}s {ref.name}", flush=True)
                    continue
                out.parent.mkdir(parents=True, exist_ok=True)
                sf.write(str(out), wav, target_sr)
                dest_dir = FINALISTS / character
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest = dest_dir / out.name
                shutil.copy2(out, dest)
                all_clips.append(
                    {
                        "ok": True,
                        "character": character,
                        "accent": accent,
                        "variety": CAST[character]["variety_label"],
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
                all_clips.append({"ok": False, "character": character, "ref": str(ref), "error": str(exc)})
                print(f"FAIL Qwen {character} {ref.name}: {exc}", flush=True)

    man = {
        "phrase": ES_PHRASE,
        "cast": {k: {"accent": v["accent"], "variety": v["variety_label"]} for k, v in CAST.items()},
        "passes": passes,
        "failures": failures,
        "clips": all_clips,
        "note": (
            "Curate one WAV per character into static/assets/voices/es/{Character}.wav "
            "via --promote. No foreign L1 colour in Spanish."
        ),
    }
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    FINALISTS.mkdir(parents=True, exist_ok=True)
    (FINALISTS / "manifest.json").write_text(
        json.dumps(man, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (FINALISTS / "README.md").write_text(
        """# LatAm regional Spanish candidates

Timbre: `static/assets/voices/en/{Character}.wav`
Prosody: `voice-donors/es/{accent}/` (see cast map in pipeline script)
Then Qwen3-TTS Spanish sample phrase (regional instruct, no foreign L1).

Promote with:
`python scripts/pipeline-spanish-latam-regional-qwen.py --promote --character Zao --take path/to/finalist.wav`
""",
        encoding="utf-8",
    )
    return failures


def promote(character: str, take: Path) -> None:
    if character not in CAST:
        raise SystemExit(f"Unknown character {character!r}")
    if not take.is_file():
        raise SystemExit(f"Missing take {take}")
    ES_VOICES.mkdir(parents=True, exist_ok=True)
    dest = ES_VOICES / f"{character}.wav"
    shutil.copy2(take, dest)
    # Drop stale whisper sidecars so next render regenerates from the new WAV.
    for side in (
        ES_VOICES / f"{character}_whisper.txt",
        ES_VOICES / f"{character}_slow_src_whisper.txt",
    ):
        if side.is_file():
            side.unlink()

    selection_path = ES_VOICES / "selection.json"
    if selection_path.is_file():
        selection = json.loads(selection_path.read_text(encoding="utf-8"))
    else:
        selection = {"selectedDir": "static/assets/voices/es", "characters": {}, "mapping": []}

    accent = CAST[character]["accent"]
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    selection["note"] = (
        "LatAm regional: EN timbre × voice-donors/es accents. "
        "No foreign L1 colour in Spanish. Dual regen is a separate pass."
    )
    selection["engine"] = "latam-regional (Seed-VC paint + Qwen ICL)"
    selection["phrase"] = ES_PHRASE
    selection["updated"] = now
    characters = selection.setdefault("characters", {})
    characters[character] = {
        "selectedFile": f"{character}.wav",
        "source": "latam-regional",
        "accent": accent,
        "variety": CAST[character]["variety_label"],
        "timbre": f"static/assets/voices/en/{character}.wav",
        "promotedFrom": str(take.resolve()),
        "promotedAt": now,
        "note": "Latin American regional Spanish; EN timbre; no foreign L1 in ES.",
    }
    mapping = selection.setdefault("mapping", [])
    mapping = [m for m in mapping if m.get("character") != character]
    mapping.append(
        {
            "file": f"{character}.wav",
            "character": character,
            "accent": accent,
            "variety": CAST[character]["variety_label"],
            "source": f"es-accents/latam-regional/finalists/{character}/{take.name}",
            "timbre": f"en/{character}.wav",
        }
    )
    selection["mapping"] = mapping
    selection_path.write_text(json.dumps(selection, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Promoted {take} -> {dest}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--passes", type=int, nargs="+", default=[1, 2, 3, 4, 5])
    parser.add_argument("--character", help="Limit to one character")
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_false", dest="skip_existing")
    parser.add_argument("--seedvc-only", action="store_true")
    parser.add_argument("--qwen-only", action="store_true")
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--take", type=Path, help="Finalist WAV for --promote")
    parser.add_argument("--max-new-tokens", type=int, default=768)
    parser.add_argument("--max-out-seconds", type=float, default=25.0)
    args = parser.parse_args()

    if args.promote:
        if not args.character or not args.take:
            raise SystemExit("--promote requires --character and --take")
        promote(args.character, args.take)
        return 0

    characters = characters_filter(args.character)
    for character in characters:
        accent = CAST[character]["accent"]
        donors = list_donors(accent)
        timbre = en_timbre(character)
        print(
            f"{character} accent={accent} donors={len(donors)} timbre={timbre.is_file()}",
            flush=True,
        )
        if not donors:
            raise SystemExit(f"No donors in {DONORS_ROOT / accent}")
        if not timbre.is_file():
            raise SystemExit(f"Missing EN timbre {timbre}")

    fails = 0
    if not args.qwen_only:
        fails += run_seedvc_passes(characters, args.passes, skip_existing=args.skip_existing)
    if not args.seedvc_only:
        fails += run_qwen_for_passes(
            characters,
            args.passes,
            skip_existing=args.skip_existing,
            max_new_tokens=args.max_new_tokens,
            max_out_seconds=args.max_out_seconds,
        )
    print(f"Done. failures={fails} finalists={FINALISTS}", flush=True)
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
