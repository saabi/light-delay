# AuK install plan (deferred)

**Status:** deferred — investigation only (2026-09-13). Do **not** install until explicitly approved.  
**Goal:** add Tencent Hunyuan **AuK** as a **parallel** speech stack beside Qwen3-TTS. Keep all existing Qwen3-TTS / Seed-VC / Kokoro tooling and scripts.

English is the source of truth for this plan. Spanish translation may follow later (`needs_revision` until then).

## Why later

No production urgency. Current Festival-master / trailer dialogue audio continues on Qwen3-TTS. This document freezes VRAM/disk findings and an install sequence so a future session can execute without re-research.

## What AuK is

| Item | Detail |
|------|--------|
| Model | **AuK** — open foundational speech generation + editing (~1.5B), MIT |
| Released | ~2026-09-09 |
| Repo | https://github.com/Tencent-Hunyuan/AuK |
| Paper | arXiv:2609.08936 |
| Weights | Hugging Face `tencent/AuK`, optional `tencent/AuK-Flash` |
| Encoder (required) | `Qwen/Qwen2.5-Omni-3B` (**not** Qwen3-Omni) |
| Runtime | Python **3.10**, PyTorch CUDA, **bf16** |
| Variants | **AuK** (quality, more NFEs + CFG) · **AuK-Flash** (4-step, CFG=0, ~4.5× wall-clock faster; **similar VRAM**) |

Capabilities of interest later: text-to-speech, instruction-based edit, reference-conditioned generation — evaluate against cast refs under `static/assets/voices/` before replacing any Qwen path.

## Hardware fit (this machine)

| Resource | Observed / planned |
|----------|-------------------|
| GPU | NVIDIA **RTX 3090** — **24 GB** VRAM |
| Typical free VRAM | Often ~20 GB with desktop apps holding ~4 GB |
| Install root | **`E:\Models\AuK\`** (C: too tight; E: had ~42 GB free at investigation) |

### Official peak VRAM (upstream README)

Measured as `torch.cuda.max_memory_allocated`, A800, bf16:

| Setup | Offload off | `--cpu_offload` on |
|-------|-------------|--------------------|
| AuK / Flash, short text-only | ~**24.8 GiB** | ~**16.8 GiB** |
| + ~5 s reference | ~**25.0 GiB** | ~**17.0 GiB** |

### Verdict

| Mode | Fits 3090? |
|------|------------|
| No CPU offload | **No** — peaks at ~25 GiB; WDDM + desktop use make it worse |
| With `--cpu_offload` | **Yes** for batch-1 short/medium clips (~17 GiB peak; keep headroom) |
| AuK-Flash vs AuK | Same memory class; prefer Flash for iteration speed once quality is acceptable |
| Dual Gradio preload (Base + Flash) | Avoid on one 3090 |
| Full fine-train | Not a target (upstream used large multi-GPU setups) |

**Hard rules when we install:** always enable `--cpu_offload`; unload Qwen3-TTS / other GPU models before loading AuK; close GPU-heavy desktop apps for the smoke test.

## Disk budget (approximate)

| Component | Size |
|-----------|------|
| `tencent/AuK` | ~6.8 GB |
| `Qwen/Qwen2.5-Omni-3B` | ~12 GB |
| `tencent/AuK-Flash` (optional) | ~similar to AuK |
| **Base + Omni** | **~19 GB** |
| **+ Flash** | **~26 GB** |

Prefer **AuK-Flash + Omni** first if disk is tight; add Base only if quality A/B needs it. Do not place weights on C:.

## License notes

- **AuK:** MIT.
- **Qwen2.5-Omni-3B:** not MIT (Qwen research / “other” terms) — keep separate from AuK’s MIT claim when documenting or redistributing.

## Non-goals (this phase)

- Do **not** uninstall or delete Qwen3-TTS, Seed-VC, Kokoro, or their scripts.
- Do **not** switch Studio “Regenerar” defaults or animatic dialogue generation away from Qwen until AuK is smoke-tested and voice quality approved.
- Do **not** regenerate production dialogue WAVs with AuK in the first install pass.
- Do **not** treat AuK as narrative/canon authority; it is tooling only.

## Proposed layout (when approved)

```text
E:\Models\
├── Qwen3-TTS\          # unchanged
├── Seed-VC\            # unchanged
├── Kokoro\             # unchanged
└── AuK\                # NEW parallel tree
    ├── repo\           # clone of Tencent-Hunyuan/AuK
    ├── .venv\          # Python 3.10 + CUDA torch (isolated)
    ├── hf-cache\       # AuK / AuK-Flash / Omni weights
    ├── output\         # smoke tests + future parallel cue renders
    └── LIGHT_DELAY_NOTES.md
```

Repo-side (later, after install works): parallel scripts only, e.g. `scripts/generate-*-auk.py` or a `--engine auk` flag that does not break the Qwen path. Point any new docs from [`TTS_VOICE_PIPELINE.en.md`](../TTS_VOICE_PIPELINE.en.md) / `.es.md` without rewriting the Qwen sections as obsolete.

## Execution checklist (do not run until approved)

1. Confirm free space on **E:** (≥ ~20 GB for Flash+Omni; ≥ ~26 GB if Base+Flash+Omni).
2. Confirm Python **3.10** available for a dedicated venv.
3. Clone AuK into `E:\Models\AuK\repo`.
4. Create `.venv`, install upstream requirements + CUDA PyTorch matching the machine’s driver.
5. Download `tencent/AuK-Flash` (or Base) + VAE + `Qwen/Qwen2.5-Omni-3B` into `hf-cache` (or upstream’s expected paths).
6. Smoke test **one** short EN line with `--cpu_offload`; record peak VRAM (`nvidia-smi` + torch if available).
7. Smoke test one line with a cast ref from `static/assets/voices/en/` (if supported by the chosen CLI).
8. Optional: same for ES after EN passes.
9. Write `E:\Models\AuK\LIGHT_DELAY_NOTES.md` with exact commands and measured VRAM.
10. Only then: design parallel Light Delay wrappers (CLI / optional Studio mode) — **additive**, Qwen remains default.

## Success criteria for “install complete”

- Inference succeeds on 3090 with CPU offload without OOM.
- Notes on disk document commands, model IDs, and measured VRAM.
- Qwen3-TTS pipeline still runs unchanged.
- No production animatic audio rewritten unless a later, separate approval asks for an AuK A/B pass.

## Investigation snapshot

Captured 2026-09-13 against this workstation (24 GB 3090). Re-check free disk and idle VRAM before downloading weights; numbers above are planning estimates, not a live lock.

## References

- Upstream: https://github.com/Tencent-Hunyuan/AuK  
- Weights: https://huggingface.co/tencent/AuK · https://huggingface.co/tencent/AuK-Flash  
- Encoder: https://huggingface.co/Qwen/Qwen2.5-Omni-3B  
- Existing voice pipeline: [`docs/TTS_VOICE_PIPELINE.es.md`](../TTS_VOICE_PIPELINE.es.md) (see also `.en.md` when present)
