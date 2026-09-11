#!/usr/bin/env python3
"""GPU-free tests for catalog, cue-level overlays, assemble, and HTTP guards."""

from __future__ import annotations

import json
import struct
import tempfile
import unittest
import wave
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys_path_root = ROOT / "scripts"
import sys

sys.path.insert(0, str(sys_path_root))

from lib.imitation_assemble import (  # noqa: E402
    AssembleError,
    assemble_output,
    concat_cues,
    encode_mp3,
    load_pcm16_at_rate,
    resample_linear,
    silence_pcm16,
    write_wav_pcm16,
)
from lib.imitation_catalog import (  # noqa: E402
    collect_catalog_errors,
    get_output,
    looks_absolute_or_traversal,
    public_output,
)
from lib.imitation_http import (  # noqa: E402
    ImitationHTTPServer,
    _assert_recordable,
    host_allowed,
    origin_allowed,
    parse_imitation_path,
)
from lib.imitation_overlay import (  # noqa: E402
    OverlayError,
    OverlayStore,
    cue_fingerprint,
    fingerprints_match,
    safe_cue_key,
    safe_dialogue_key,
)
from lib.seedvc_imitation import (  # noqa: E402
    ImitationError,
    ImitationSession,
    clamp_diffusion_steps,
    collect_repo_check_errors,
    load_portable_defaults,
    seedvc_python_mismatch_warning,
    seedvc_venv_python,
    sniff_audio_mime,
)


def write_tone(path: Path, *, sr: int, seconds: float, amp: int = 12000) -> Path:
    n = max(1, int(round(sr * seconds)))
    frames = b"".join(struct.pack("<h", amp if i % 2 == 0 else -amp) for i in range(n))
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as fh:
        fh.setnchannels(1)
        fh.setsampwidth(2)
        fh.setframerate(sr)
        fh.writeframes(frames)
    return path


class CatalogTests(unittest.TestCase):
    def test_mvp_catalog_is_logical_and_localized(self) -> None:
        errors = collect_catalog_errors()
        self.assertEqual(errors, [], msg="\n".join(errors))
        es = get_output("audience-es")
        en = get_output("audience-en")
        self.assertEqual(es["expectedCueCount"], 275)
        self.assertEqual(en["expectedSampleRate"], 24000)
        pub = public_output(es)
        self.assertEqual(pub["sourceOutlineRevision"], 15)
        master = json.loads((ROOT / "data/outlines/light-delay-master-narrative.json").read_text(encoding="utf-8"))
        self.assertEqual(pub["currentOutlineRevision"], master["outline"]["revision"])
        self.assertEqual(pub["sourceStatus"], "stale")
        blob = json.dumps(pub)
        self.assertNotIn("E:/", blob)
        self.assertNotIn("E:\\", blob)
        self.assertNotIn("/Models", blob)

    def test_rejects_absolute_keys(self) -> None:
        self.assertTrue(looks_absolute_or_traversal(r"E:/Models/Qwen3-TTS/output"))
        self.assertTrue(looks_absolute_or_traversal("/tmp/audio"))
        self.assertTrue(looks_absolute_or_traversal("../secret"))
        self.assertFalse(looks_absolute_or_traversal("outline-chunks/es-audience"))


class DefaultsRepoTests(unittest.TestCase):
    def test_portable_defaults_have_no_machine_paths(self) -> None:
        d = load_portable_defaults()
        blob = json.dumps(d)
        self.assertNotIn("E:/", blob)
        self.assertNotIn("E:\\", blob)
        self.assertIs(d["seedVc"]["auto_f0_adjust"], True)
        self.assertIs(d["seedVc"]["f0_condition"], True)
        self.assertNotIn("localPaths", d)
        for origin in d["http"]["corsOrigins"]:
            self.assertNotIn("github.io", origin)
            self.assertNotIn("/light-delay", origin)

    def test_repo_check_does_not_need_models_root(self) -> None:
        errors = collect_repo_check_errors()
        self.assertEqual(errors, [], msg="\n".join(errors))
        joined = "\n".join(errors)
        self.assertNotIn("E:/Models", joined)


class OverlayTests(unittest.TestCase):
    def test_safe_keys_are_stable_and_hashed(self) -> None:
        key = safe_cue_key("00001_Narrator_1f751ebda075437d")
        self.assertIn("--", key)
        self.assertEqual(key, safe_cue_key("00001_Narrator_1f751ebda075437d"))
        with self.assertRaises(OverlayError):
            safe_cue_key("../etc/passwd")
        dialogue = safe_dialogue_key("audience:dialogue:p2-harlan-wish")
        self.assertIn("--", dialogue)
        self.assertEqual(dialogue, safe_dialogue_key("audience:dialogue:p2-harlan-wish"))

    def _dialogue_cue(self, *, cue_id: str, content_hash: str, dialogue_id: str) -> dict:
        return {
            "id": cue_id,
            "stableDialogueId": dialogue_id,
            "speaker": "Zao",
            "engine": "qwen",
            "content_hash": content_hash,
            "wav": "orig.wav",
        }

    def test_cue_id_shift_keeps_accepted_take(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wav = write_tone(root / "orig.wav", sr=24000, seconds=0.05)
            dialogue_id = "audience:dialogue:test-zao"
            cue = self._dialogue_cue(
                cue_id="00042_Zao_abcd1234",
                content_hash="abcd1234",
                dialogue_id=dialogue_id,
            )
            fp = cue_fingerprint(cue, lang="es", original_wav=wav)
            store = OverlayStore(root)
            source = write_tone(root / "src.wav", sr=44100, seconds=0.04)
            converted = write_tone(root / "conv.wav", sr=44100, seconds=0.04)
            meta = store.write_take(
                output_id="audience-es",
                cue=cue,
                fingerprint=fp,
                index_hash_value="index-one",
                source_wav=source,
                converted_wav=converted,
                settings={"auto_f0_adjust": True, "f0_condition": True},
            )
            pointer = store.accept(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                take_id=meta["takeId"],
                current_fingerprint=fp,
                index_hash_value="index-two",
            )
            self.assertEqual(pointer["indexHash"], "index-two")
            shifted = self._dialogue_cue(
                cue_id="00055_Zao_abcd1234",
                content_hash="abcd1234",
                dialogue_id=dialogue_id,
            )
            shifted_fp = cue_fingerprint(shifted, lang="es", original_wav=wav)
            # Different cueId / originalWavSha256 must not matter when content matches.
            shifted_fp["originalWavSha256"] = "deadbeef" * 8
            self.assertTrue(fingerprints_match(fp, shifted_fp))
            status = store.replacement_status(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                current_fingerprint=shifted_fp,
            )
            self.assertIsNotNone(status)
            self.assertFalse(status["stale"])
            path, kind, _status = store.resolve_effective_wav(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                original_wav=wav,
                current_fingerprint=shifted_fp,
            )
            self.assertEqual(kind, meta["takeId"])
            self.assertEqual(path.name, "converted.wav")

    def test_text_change_stales_and_blocks_reaccept(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wav = write_tone(root / "orig.wav", sr=24000, seconds=0.05)
            dialogue_id = "audience:dialogue:test-zao"
            cue = self._dialogue_cue(
                cue_id="00042_Zao_abcd1234",
                content_hash="abcd1234",
                dialogue_id=dialogue_id,
            )
            fp = cue_fingerprint(cue, lang="es", original_wav=wav)
            store = OverlayStore(root)
            source = write_tone(root / "src.wav", sr=44100, seconds=0.04)
            converted = write_tone(root / "conv.wav", sr=44100, seconds=0.04)
            meta = store.write_take(
                output_id="audience-es",
                cue=cue,
                fingerprint=fp,
                index_hash_value="index-one",
                source_wav=source,
                converted_wav=converted,
                settings={"auto_f0_adjust": True},
            )
            store.accept(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                take_id=meta["takeId"],
                current_fingerprint=fp,
                index_hash_value="index-one",
            )
            changed = dict(fp)
            changed["contentHash"] = "ffffeeee"
            status = store.replacement_status(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                current_fingerprint=changed,
            )
            self.assertTrue(status["stale"])
            path, kind, _status = store.resolve_effective_wav(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                original_wav=wav,
                current_fingerprint=changed,
            )
            self.assertEqual(kind, "original")
            self.assertEqual(path, wav)
            with self.assertRaises(OverlayError):
                store.accept(
                    output_id="audience-es",
                    dialogue_key=dialogue_id,
                    take_id=meta["takeId"],
                    current_fingerprint=changed,
                    index_hash_value="index-two",
                )

    def test_accept_does_not_rewrite_take_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wav = write_tone(root / "orig.wav", sr=24000, seconds=0.05)
            dialogue_id = "audience:dialogue:test-zao"
            cue = self._dialogue_cue(
                cue_id="00042_Zao_abcd1234",
                content_hash="abcd1234",
                dialogue_id=dialogue_id,
            )
            fp = cue_fingerprint(cue, lang="es", original_wav=wav)
            store = OverlayStore(root)
            meta = store.write_take(
                output_id="audience-es",
                cue=cue,
                fingerprint=fp,
                index_hash_value="idx",
                source_wav=write_tone(root / "src.wav", sr=44100, seconds=0.03),
                converted_wav=write_tone(root / "conv.wav", sr=44100, seconds=0.03),
                settings={"auto_f0_adjust": True},
            )
            meta_path = (
                store.take_dir("audience-es", dialogue_id, meta["takeId"]) / "metadata.json"
            )
            before = meta_path.read_text(encoding="utf-8")
            self.assertNotIn("acceptedAt", json.loads(before))
            store.accept(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                take_id=meta["takeId"],
                current_fingerprint=fp,
                index_hash_value="idx",
            )
            after = json.loads(meta_path.read_text(encoding="utf-8"))
            self.assertEqual(before, meta_path.read_text(encoding="utf-8"))
            self.assertNotIn("acceptedAt", after)

    def test_purge_keeps_accepted_deletes_others(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wav = write_tone(root / "orig.wav", sr=24000, seconds=0.05)
            dialogue_id = "audience:dialogue:test-zao"
            cue = self._dialogue_cue(
                cue_id="00042_Zao_abcd1234",
                content_hash="abcd1234",
                dialogue_id=dialogue_id,
            )
            fp = cue_fingerprint(cue, lang="es", original_wav=wav)
            store = OverlayStore(root)
            source = write_tone(root / "src.wav", sr=44100, seconds=0.04)
            converted = write_tone(root / "conv.wav", sr=44100, seconds=0.04)
            keep = store.write_take(
                output_id="audience-es",
                cue=cue,
                fingerprint=fp,
                index_hash_value="idx",
                source_wav=source,
                converted_wav=converted,
                settings={},
            )
            drop = store.write_take(
                output_id="audience-es",
                cue=cue,
                fingerprint=fp,
                index_hash_value="idx",
                source_wav=source,
                converted_wav=converted,
                settings={},
            )
            store.accept(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                take_id=keep["takeId"],
                current_fingerprint=fp,
                index_hash_value="idx",
            )
            preview = store.purge_unreferenced_takes("audience-es", dry_run=True)
            self.assertEqual(preview["deletedTakes"], 1)
            self.assertEqual(preview["keptTakes"], 1)
            self.assertTrue(
                store.take_dir("audience-es", dialogue_id, drop["takeId"]).is_dir()
            )
            result = store.purge_unreferenced_takes("audience-es", dry_run=False)
            self.assertEqual(result["deletedTakes"], 1)
            self.assertEqual(result["keptTakes"], 1)
            self.assertGreater(result["freedBytes"], 0)
            self.assertTrue(
                store.take_dir("audience-es", dialogue_id, keep["takeId"]).is_dir()
            )
            self.assertFalse(
                store.take_dir("audience-es", dialogue_id, drop["takeId"]).is_dir()
            )

    def test_wav_hash_alone_does_not_stale(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wav = write_tone(root / "orig.wav", sr=24000, seconds=0.05)
            dialogue_id = "audience:dialogue:test-zao"
            cue = self._dialogue_cue(
                cue_id="00042_Zao_abcd1234",
                content_hash="abcd1234",
                dialogue_id=dialogue_id,
            )
            fp = cue_fingerprint(cue, lang="es", original_wav=wav)
            other = dict(fp)
            other["originalWavSha256"] = "00" * 32
            other["cueId"] = "00999_Zao_abcd1234"
            self.assertTrue(fingerprints_match(fp, other))


class AssembleTests(unittest.TestCase):
    def test_concat_keeps_silence_order_and_resamples(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = write_tone(root / "a.wav", sr=24000, seconds=0.1)
            take = write_tone(root / "take.wav", sr=44100, seconds=0.1)
            cues = [
                {"id": "n1", "pre_silence_ms": 100, "wav": "a.wav"},
                {"id": "z1", "pre_silence_ms": 0, "wav": "take.wav"},
            ]
            mapping = {"n1": first, "z1": take}

            def resolve(cue):
                return mapping[cue["id"]]

            frames = concat_cues(cues, resolve_wav=resolve, sample_rate=24000)
            expected = int(24000 * 0.1) + int(round(24000 * 0.1)) + int(round(24000 * 0.1))
            self.assertEqual(len(frames) // 2, expected)
            silence = silence_pcm16(100, 24000)
            self.assertEqual(frames[: len(silence)], silence)
            resampled = load_pcm16_at_rate(take, 24000)
            self.assertEqual(len(resampled) // 2, int(round(44100 * 0.1 * 24000 / 44100)))

    def test_stale_take_uses_original_in_assemble(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            chunks = root / "chunks"
            orig = write_tone(chunks / "audio" / "cue.wav", sr=24000, seconds=0.05)
            dialogue_id = "audience:dialogue:test-zao"
            cue = {
                "id": "00042_Zao_abcd1234",
                "stableDialogueId": dialogue_id,
                "speaker": "Zao",
                "engine": "qwen",
                "content_hash": "abcd1234",
                "wav": "audio/cue.wav",
                "pre_silence_ms": 0,
            }
            fp = cue_fingerprint(cue, lang="es", original_wav=orig)
            store = OverlayStore(root / "imitation")
            meta = store.write_take(
                output_id="audience-es",
                cue=cue,
                fingerprint=fp,
                index_hash_value="idx",
                source_wav=write_tone(root / "src.wav", sr=44100, seconds=0.2),
                converted_wav=write_tone(root / "conv.wav", sr=44100, seconds=0.2),
                settings={},
            )
            store.accept(
                output_id="audience-es",
                dialogue_key=dialogue_id,
                take_id=meta["takeId"],
                current_fingerprint=fp,
                index_hash_value="idx",
            )
            stale_fp = dict(fp)
            stale_fp["contentHash"] = "deadbeef"
            dest = root / "assembled" / "audience-es.mp3"
            row = {
                "id": "audience-es",
                "assembledKey": "assembled/audience-es.mp3",
                "expectedSampleRate": 24000,
            }
            index = {"sample_rate": 24000, "cues": [cue]}
            with mock.patch("lib.imitation_assemble.encode_mp3", side_effect=_fake_encode):
                assemble_output(
                    output_row=row,
                    index=index,
                    chunks_dir=chunks,
                    overlay=store,
                    dest=dest,
                    fingerprints={cue["id"]: stale_fp},
                )
            self.assertTrue(dest.is_file())
            self.assertGreater(dest.stat().st_size, 0)

    def test_refuses_canonical_name_and_missing_ffmpeg(self) -> None:
        dest = Path(tempfile.gettempdir()) / "light-delay-audience-dual-es.mp3"
        with self.assertRaises(AssembleError):
            from lib.imitation_assemble import assert_not_canonical

            assert_not_canonical(dest)
        with self.assertRaises(AssembleError):
            encode_mp3(Path("in.wav"), Path("out.mp3"), ffmpeg="")
        with mock.patch("lib.imitation_assemble.shutil.which", return_value=None):
            with self.assertRaises(AssembleError):
                encode_mp3(Path("in.wav"), Path("out.mp3"))


class HttpGuardTests(unittest.TestCase):
    def test_path_parser(self) -> None:
        self.assertEqual(
            parse_imitation_path("/v1/imitation/health")["name"],
            "health",
        )
        self.assertEqual(
            parse_imitation_path("/v1/imitation/outputs/audience-es/timeline")["outputId"],
            "audience-es",
        )
        self.assertEqual(
            parse_imitation_path("/v1/imitation/outputs/audience-es/cues/00042_Zao_ab/convert")[
                "name"
            ],
            "convert",
        )
        self.assertEqual(
            parse_imitation_path("/v1/imitation/outputs/audience-es/cues/00042_Zao_ab/regenerate")[
                "name"
            ],
            "regenerate",
        )
        self.assertEqual(parse_imitation_path("/v1/imitation/prepare-qwen")["name"], "prepare-qwen")
        self.assertEqual(
            parse_imitation_path("/v1/imitation/outputs/audience-es/purge-takes")["name"],
            "purge-takes",
        )
        self.assertEqual(parse_imitation_path("/v1/imitation/outputs/../etc/timeline")["name"], "traversal")
        self.assertIsNone(parse_imitation_path("/health"))
        self.assertIsNone(parse_imitation_path("/v1/imitation/outputs/nope"))

    def test_qwen_public_defaults(self) -> None:
        from lib.qwen_studio_regen import clamp_temperature, public_qwen_defaults

        es = public_qwen_defaults("es")
        en = public_qwen_defaults("en")
        self.assertEqual(es["engine"], "qwen-clone")
        self.assertFalse(es["x_vector_only"])
        self.assertIn("temperature", es["bounds"])
        self.assertTrue(es["defaultInstruct"])
        self.assertTrue(es["expressivenessPrefix"])
        self.assertNotEqual(es["defaultInstruct"], en["defaultInstruct"])
        self.assertEqual(clamp_temperature(9.0), 1.5)
        self.assertEqual(clamp_temperature(0.01), 0.1)

    def test_host_and_origin(self) -> None:
        allow = ["http://localhost:5173", "http://127.0.0.1:5173"]
        self.assertTrue(host_allowed("127.0.0.1:8765"))
        self.assertTrue(host_allowed("localhost:8765"))
        self.assertFalse(host_allowed("example.com"))
        self.assertTrue(origin_allowed("http://localhost:5173", allow, require=True))
        self.assertFalse(origin_allowed("https://saabi.github.io", allow, require=True))
        self.assertFalse(origin_allowed("https://saabi.github.io/light-delay", allow, require=True))
        self.assertFalse(origin_allowed(None, allow, require=True))
        self.assertTrue(origin_allowed(None, allow, require=False))
        self.assertFalse(ImitationHTTPServer.allow_reuse_address)

    def test_narrator_forbidden_and_knob_bounds(self) -> None:
        row = {"recordableSpeakers": ["Zao", "Elin"]}
        with self.assertRaises(ImitationError):
            _assert_recordable(row, {"speaker": "Narrator"})
        d = load_portable_defaults()
        with self.assertRaises(ImitationError):
            clamp_diffusion_steps(999, d)
        self.assertEqual(clamp_diffusion_steps(50, d), 50)

    def test_sniff_wav(self) -> None:
        self.assertEqual(sniff_audio_mime(b"RIFFxxxxWAVEdata"), "audio/wav")
        self.assertIsNone(sniff_audio_mime(b"\x89PNG"))


class SeedVcRuntimeTests(unittest.TestCase):
    def test_mismatch_warning_when_not_venv(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            venv_py = seedvc_venv_python(root)
            venv_py.parent.mkdir(parents=True)
            venv_py.write_text("", encoding="utf-8")
            warning = seedvc_python_mismatch_warning({"localPaths": {"seedVcRoot": str(root)}})
            self.assertIsNotNone(warning)
            assert warning is not None
            self.assertIn("--serve", warning)
            self.assertIn(str(venv_py), warning)

    def test_load_missing_module_names_venv(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            (root / "inference.py").write_text("#", encoding="utf-8")
            session = ImitationSession(
                {
                    **load_portable_defaults(),
                    "localPaths": {"seedVcRoot": str(root)},
                }
            )
            with mock.patch(
                "lib.seedvc_imitation._prepare_seedvc_env",
                side_effect=ModuleNotFoundError("No module named 'munch'", name="munch"),
            ):
                with self.assertRaises(ImitationError) as ctx:
                    session.load()
            self.assertIn("munch", str(ctx.exception))
            self.assertIn("convert-imitation-performance.py --serve", str(ctx.exception))


def _fake_encode(wav_path: Path, mp3_path: Path, *, ffmpeg: str | None = None) -> None:
    mp3_path.write_bytes(Path(wav_path).read_bytes()[:64] + b"ID3fake")


if __name__ == "__main__":
    raise SystemExit(unittest.main())
