#!/usr/bin/env python3
"""GPU-free tests for the Seed-VC imitation-pass config and character refs."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.seedvc_imitation import (  # noqa: E402
    ImitationError,
    collect_repo_check_errors,
    default_out_path,
    list_characters,
    load_portable_defaults,
    normalize_lang,
    parse_bool,
    resolve_target,
    suffix_for_upload,
)


class DefaultsTests(unittest.TestCase):
    def test_canonical_knobs(self) -> None:
        d = load_portable_defaults()
        seed = d["seedVc"]
        self.assertEqual(d["engine"], "seed-vc-svc")
        self.assertIs(seed["f0_condition"], True)
        self.assertIs(seed["auto_f0_adjust"], True)
        self.assertEqual(seed["semi_tone_shift"], 0)
        self.assertEqual(seed["diffusion_steps"], 50)
        self.assertTrue(
            str(seed["checkpoint"]).endswith(
                "DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth"
            )
        )

    def test_session_starts_unloaded(self) -> None:
        from lib.seedvc_imitation import ImitationSession

        session = ImitationSession(load_portable_defaults())
        self.assertIsNone(session.loaded)


class LangAndCastTests(unittest.TestCase):
    def test_normalize_lang(self) -> None:
        self.assertEqual(normalize_lang("ES"), "es")
        self.assertEqual(normalize_lang("Spanish"), "es")
        self.assertEqual(normalize_lang("en-GB"), "en")
        with self.assertRaises(ImitationError):
            normalize_lang("fr")

    def test_resolve_zao_es(self) -> None:
        name, path = resolve_target(character="zao", lang="es")
        self.assertEqual(name, "Zao")
        self.assertTrue(path.is_file())
        self.assertTrue(path.as_posix().endswith("static/assets/voices/es/Zao.wav"))

    def test_unknown_character(self) -> None:
        with self.assertRaises(ImitationError):
            resolve_target(character="Cael", lang="en")

    def test_both_casts_have_six_existing_refs(self) -> None:
        expected = {"Zao", "Voss", "Harlan", "Elin", "Sorell", "Okoye"}
        for lang in ("en", "es"):
            rows = list_characters(lang)
            ids = {row["id"] for row in rows}
            self.assertEqual(ids, expected)
            self.assertTrue(all(row["exists"] for row in rows), msg=rows)


class HelpersTests(unittest.TestCase):
    def test_parse_bool(self) -> None:
        self.assertFalse(parse_bool(None, default=False))
        self.assertTrue(parse_bool("yes", default=False))
        self.assertFalse(parse_bool("off", default=True))
        with self.assertRaises(ImitationError):
            parse_bool("maybe", default=True)

    def test_upload_suffix(self) -> None:
        self.assertEqual(suffix_for_upload("audio/wav", None), ".wav")
        self.assertEqual(suffix_for_upload("audio/webm;codecs=opus", None), ".webm")
        self.assertEqual(suffix_for_upload("application/octet-stream", "take.wav"), ".wav")
        with self.assertRaises(ImitationError):
            suffix_for_upload("image/png", "x.png")

    def test_default_out_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "take one.wav"
            src.write_bytes(b"RIFF")
            defaults = load_portable_defaults()
            defaults["localPaths"] = {"imitationRoot": tmp}
            out = default_out_path(
                src,
                character="Zao",
                lang="es",
                source_sha256="abcd1234ffff",
                defaults=defaults,
            )
            self.assertEqual(out.name, "take one__Zao__abcd1234.wav")
            self.assertIn("/es/Zao/", out.as_posix().replace("\\", "/"))


if __name__ == "__main__":
    raise SystemExit(unittest.main())
