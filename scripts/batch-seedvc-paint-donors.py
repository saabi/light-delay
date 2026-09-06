#!/usr/bin/env python3
"""Paint public accent donors with cast (or prior-pass) timbres via Seed-VC.

Run with Seed-VC venv:
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/batch-seedvc-paint-donors.py
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/batch-seedvc-paint-donors.py --pass 2
  E:\\Models\\Seed-VC\\.venv\\Scripts\\python.exe scripts/batch-seedvc-paint-donors.py --pass 4 --pass 5
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import torchaudio
import librosa
from tqdm import tqdm

SEED_VC = Path(r"E:\Models\Seed-VC")
DONORS_ROOT = Path(r"E:\Models\voice-donors\es")
SELECTED = Path(__file__).resolve().parents[1] / "static" / "assets" / "voices" / "en"
OUT_ROOT = Path(r"E:\Models\Qwen3-TTS\output\pronunciation-tests\es-accents\donors-public-colored")

ACCENTS = (
    "rioplatense",
    "santiago-del-estero",
    "spain-castilian",
    "peruvian-lima",
    "venezuelan",
    "colombian-bogota",
)

_PASS_ORDINAL = {
    2: "2nd",
    3: "3rd",
    4: "4th",
    5: "5th",
    6: "6th",
    7: "7th",
    8: "8th",
    9: "9th",
    10: "10th",
}
_PASS_SUFFIX_RE = re.compile(r"_(?:2nd|3rd|\d+(?:th|st|nd|rd))_pass$")

os.environ.setdefault("HF_HUB_CACHE", str(SEED_VC / "checkpoints" / "hf_cache"))
os.environ.setdefault("HF_HOME", os.environ["HF_HUB_CACHE"])

sys.path.insert(0, str(SEED_VC))
os.chdir(SEED_VC)

import inference as seed_inf  # noqa: E402


def pass_ordinal(n: int) -> str:
    if n not in _PASS_ORDINAL:
        raise SystemExit(f"Unsupported pass number {n} (supported: {sorted(_PASS_ORDINAL)})")
    return _PASS_ORDINAL[n]


def list_donors() -> list[Path]:
    paths: list[Path] = []
    for accent in ACCENTS:
        folder = DONORS_ROOT / accent
        if folder.is_dir():
            paths.extend(sorted(folder.glob("*.wav")))
    return paths


def list_targets() -> list[Path]:
    return sorted(SELECTED.glob("*.wav"))


@torch.no_grad()
def convert_one(
    *,
    model,
    semantic_fn,
    f0_fn,
    vocoder_fn,
    campplus_model,
    mel_fn,
    mel_fn_args,
    source_path: Path,
    target_path: Path,
    out_path: Path,
    diffusion_steps: int,
    length_adjust: float,
    inference_cfg_rate: float,
    auto_f0_adjust: bool,
    f0_condition: bool,
) -> float:
    """Mirror Seed-VC inference.py main(); must run under no_grad (not bare autograd)."""
    device = seed_inf.device
    sr = mel_fn_args["sampling_rate"]
    source_audio = librosa.load(str(source_path), sr=sr)[0]
    ref_audio = librosa.load(str(target_path), sr=sr)[0]

    sr = 22050 if not f0_condition else 44100
    hop_length = 256 if not f0_condition else 512
    max_context_window = sr // hop_length * 30
    overlap_frame_len = 16
    overlap_wave_len = overlap_frame_len * hop_length

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

    if f0_condition:
        F0_ori = f0_fn(ori_waves_16k[0], thred=0.03)
        F0_alt = f0_fn(converted_waves_16k[0], thred=0.03)
        F0_ori = torch.from_numpy(F0_ori).to(device)[None]
        F0_alt = torch.from_numpy(F0_alt).to(device)[None]
        voiced_F0_ori = F0_ori[F0_ori > 1]
        voiced_F0_alt = F0_alt[F0_alt > 1]
        log_f0_alt = torch.log(F0_alt + 1e-5)
        voiced_log_f0_ori = torch.log(voiced_F0_ori + 1e-5)
        voiced_log_f0_alt = torch.log(voiced_F0_alt + 1e-5)
        median_log_f0_ori = torch.median(voiced_log_f0_ori)
        median_log_f0_alt = torch.median(voiced_log_f0_alt)
        shifted_log_f0_alt = log_f0_alt.clone()
        if auto_f0_adjust:
            shifted_log_f0_alt[F0_alt > 1] = (
                log_f0_alt[F0_alt > 1] - median_log_f0_alt + median_log_f0_ori
            )
        shifted_f0_alt = torch.exp(shifted_log_f0_alt)
    else:
        F0_ori = None
        shifted_f0_alt = None

    cond, _, _, _, _ = model.length_regulator(
        S_alt, ylens=target_lengths, n_quantizers=3, f0=shifted_f0_alt
    )
    prompt_condition, _, _, _, _ = model.length_regulator(
        S_ori, ylens=target2_lengths, n_quantizers=3, f0=F0_ori
    )

    max_source_window = max_context_window - mel2.size(2)
    processed_frames = 0
    generated_wave_chunks = []
    previous_chunk = None

    while processed_frames < cond.size(1):
        chunk_cond = cond[:, processed_frames : processed_frames + max_source_window]
        is_last_chunk = processed_frames + max_source_window >= cond.size(1)
        cat_condition = torch.cat([prompt_condition, chunk_cond], dim=1)
        with torch.autocast(
            device_type=device.type, dtype=torch.float16 if seed_inf.fp16 else torch.float32
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
    sf.write(str(out_path), vc_wave.squeeze(0).cpu().numpy(), int(sr))
    return time.time() - t0


def build_first_pass_jobs(*, skip_existing: bool) -> list[tuple[Path, Path, Path, str, str]]:
    """Prosody = public donor; timbre = selected cast WAV."""
    donors = list_donors()
    targets = list_targets()
    if not donors:
        raise SystemExit(f"No donors under {DONORS_ROOT}")
    if not targets:
        raise SystemExit(f"No selected voices under {SELECTED}")
    jobs: list[tuple[Path, Path, Path, str, str]] = []
    for source in donors:
        accent = source.parent.name
        for target in targets:
            voice = target.stem
            out = OUT_ROOT / accent / voice / f"{source.stem}__{voice}.wav"
            if skip_existing and out.is_file():
                continue
            jobs.append((source, target, out, accent, voice))
    return jobs


def build_refine_pass_jobs(
    pass_n: int, *, skip_existing: bool
) -> list[tuple[Path, Path, Path, str, str]]:
    """Prosody = original donor; timbre = previous pass; write ``_*_pass.wav`` beside it."""
    if pass_n < 2:
        raise SystemExit("--pass must be >= 2 for refine passes (use default for first pass)")
    out_ord = pass_ordinal(pass_n)
    jobs: list[tuple[Path, Path, Path, str, str]] = []

    if pass_n == 2:
        color_iter = sorted(OUT_ROOT.glob("*/*/*__*.wav"))
        color_iter = [p for p in color_iter if not _PASS_SUFFIX_RE.search(p.stem)]
    else:
        prev_ord = pass_ordinal(pass_n - 1)
        color_iter = sorted(OUT_ROOT.glob(f"*/*/*_{prev_ord}_pass.wav"))

    for color in color_iter:
        if "_smoke" in color.parts:
            continue
        voice = color.parent.name
        accent = color.parent.parent.name
        if color.parent.parent.parent != OUT_ROOT:
            continue

        if pass_n == 2:
            base = color.stem  # donor__Voice
        else:
            prev_tag = f"_{pass_ordinal(pass_n - 1)}_pass"
            if not color.stem.endswith(prev_tag):
                continue
            base = color.stem[: -len(prev_tag)]

        suffix = f"__{voice}"
        if not base.endswith(suffix):
            continue
        donor_stem = base[: -len(suffix)]
        donor = DONORS_ROOT / accent / f"{donor_stem}.wav"
        if not donor.is_file():
            print(f"WARN missing donor for {color}: {donor}", flush=True)
            continue
        out = color.with_name(f"{base}_{out_ord}_pass.wav")
        if skip_existing and out.is_file():
            continue
        jobs.append((donor, color, out, accent, voice))

    if not jobs and not skip_existing:
        raise SystemExit(f"No input colored WAVs for pass {pass_n} under {OUT_ROOT}")
    return jobs


def run_jobs(
    *,
    jobs: list[tuple[Path, Path, Path, str, str]],
    mode: str,
    desc: str,
    manifest_name: str,
    model,
    semantic_fn,
    f0_fn,
    vocoder_fn,
    campplus_model,
    mel_fn,
    mel_fn_args,
    diffusion_steps: int,
    inference_cfg_rate: float,
) -> int:
    """Run convert jobs; return failure count."""
    if not jobs:
        print(f"mode={mode}: nothing to do.", flush=True)
        return 0

    print(f"mode={mode} jobs={len(jobs)}", flush=True)
    manifest = []
    failures = 0
    for source, target, out, accent, voice in tqdm(jobs, desc=desc):
        try:
            elapsed = convert_one(
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
                diffusion_steps=diffusion_steps,
                length_adjust=1.0,
                inference_cfg_rate=inference_cfg_rate,
                auto_f0_adjust=True,
                f0_condition=False,
            )
            manifest.append(
                {
                    "ok": True,
                    "source": str(source),
                    "target": str(target),
                    "out": str(out),
                    "accent": accent,
                    "voice": voice,
                    "mode": mode,
                    "seconds": round(elapsed, 2),
                }
            )
        except Exception as exc:  # noqa: BLE001
            failures += 1
            manifest.append(
                {
                    "ok": False,
                    "source": str(source),
                    "target": str(target),
                    "out": str(out),
                    "mode": mode,
                    "error": str(exc),
                }
            )
            print(f"FAIL {source.name} -> {target.name}: {exc}", flush=True)

    (OUT_ROOT / manifest_name).write_text(
        json.dumps(
            {"mode": mode, "jobs": len(jobs), "failures": failures, "clips": manifest}, indent=2
        ),
        encoding="utf-8",
    )
    print(f"Done. mode={mode} failures={failures}", flush=True)
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--diffusion-steps", type=int, default=30)
    parser.add_argument("--inference-cfg-rate", type=float, default=0.7)
    parser.add_argument("--skip-existing", action="store_true", default=True)
    parser.add_argument("--no-skip-existing", action="store_false", dest="skip_existing")
    parser.add_argument(
        "--pass",
        dest="passes",
        type=int,
        action="append",
        metavar="N",
        help="Refine pass number (2=2nd, 3=3rd, …). Repeatable, e.g. --pass 4 --pass 5. Default: first pass.",
    )
    # Back-compat aliases
    parser.add_argument("--second-pass", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--third-pass", action="store_true", help=argparse.SUPPRESS)
    args_ns = parser.parse_args()

    passes: list[int] = list(args_ns.passes or [])
    if args_ns.second_pass:
        passes.append(2)
    if args_ns.third_pass:
        passes.append(3)
    seen: set[int] = set()
    passes = [p for p in passes if not (p in seen or seen.add(p))]

    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    class A:
        pass

    a = A()
    a.checkpoint = None
    a.config = None
    a.f0_condition = False
    a.auto_f0_adjust = True
    a.semi_tone_shift = 0
    a.fp16 = True
    a.diffusion_steps = args_ns.diffusion_steps
    a.length_adjust = 1.0
    a.inference_cfg_rate = args_ns.inference_cfg_rate

    print("Loading Seed-VC models...", flush=True)
    model, semantic_fn, f0_fn, vocoder_fn, campplus_model, mel_fn, mel_fn_args = seed_inf.load_models(
        a
    )
    print("Ready.", flush=True)

    total_failures = 0
    shared = dict(
        model=model,
        semantic_fn=semantic_fn,
        f0_fn=f0_fn,
        vocoder_fn=vocoder_fn,
        campplus_model=campplus_model,
        mel_fn=mel_fn,
        mel_fn_args=mel_fn_args,
        diffusion_steps=args_ns.diffusion_steps,
        inference_cfg_rate=args_ns.inference_cfg_rate,
    )
    if not passes:
        jobs = build_first_pass_jobs(skip_existing=args_ns.skip_existing)
        total_failures += run_jobs(
            jobs=jobs,
            mode="first-pass",
            desc="Seed-VC",
            manifest_name="manifest.json",
            **shared,
        )
    else:
        for pass_n in passes:
            ord_tag = pass_ordinal(pass_n)
            jobs = build_refine_pass_jobs(pass_n, skip_existing=args_ns.skip_existing)
            total_failures += run_jobs(
                jobs=jobs,
                mode=f"{ord_tag}-pass",
                desc=f"Seed-VC {ord_tag}",
                manifest_name=f"manifest-{ord_tag}-pass.json",
                **shared,
            )

    print(f"All done. total_failures={total_failures} out={OUT_ROOT}", flush=True)
    return 0 if total_failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
