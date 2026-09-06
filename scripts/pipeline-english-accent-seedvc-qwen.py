#!/usr/bin/env python3
"""DEPRECATED — use pipeline-english-native-l1-v2-qwen.py instead.

Legacy EN path: Seed-VC V1 multi-pass + Qwen with frequent x_vector_only.
Superseded by Seed-VC V2 (1 pass) + Qwen ICL (Whisper ref_text). See
docs/wip/qwen-icl-clone-defaults.json.
"""

from __future__ import annotations

import sys

print(
    "DEPRECATED: run scripts/pipeline-english-native-l1-v2-qwen.py "
    "(Seed-VC V2 + Qwen ICL). This V1 multi-pass script is retained only "
    "as a redirect stub.",
    file=sys.stderr,
)
raise SystemExit(2)


if __name__ == "__main__":
    raise SystemExit(2)
