import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('finalizer', Path(__file__).with_name('stage-finalize.py'))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
SHA = 'a' * 40

class FinalizeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'releases/.incoming').mkdir(parents=True)
        self.source = self.root / 'releases/.incoming' / SHA
        self.source.mkdir()
        for name, content in {
            'release.json': json.dumps({'service': 'studio', 'revision': SHA}),
            'package.json': '{}', 'apps/studio/package.json': '{}',
            'packages/v2-core/package.json': '{}', 'apps/studio/build/index.js': 'throw new Error("must not run")'
        }.items():
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        # The host directory policy is tested separately; temporary fixtures need no root.
        self.guard = patch.object(helper, 'secure_directory')
        self.guard.start()
        self.validation = helper.validate
        def validate(root, sha, finalized=False):
            self.validation(root, sha, finalized=False)
            if finalized:
                for path in root.rglob('*'):
                    if not path.is_symlink():
                        self.assertEqual(path.stat().st_mode & 0o222, 0)
        self.validator = patch.object(helper, 'validate', side_effect=validate)
        self.validator.start()

    def tearDown(self):
        self.validator.stop()
        self.guard.stop()
        for directory, _, _ in os.walk(self.root):
            os.chmod(directory, 0o700)
        self.temp.cleanup()

    def finalize(self, path=None, sha=SHA):
        return helper.finalize(str(path or self.source), sha, self.root)

    def test_copy_is_immutable_and_reactivation_does_not_recapture_source(self):
        held = (self.source / 'package.json').open('w')
        held.write('{}'); held.flush()
        target = self.finalize()
        held.write('hostile'); held.close()
        self.assertEqual((target / 'package.json').read_text(), '{}')
        self.assertEqual(self.finalize(target), target)
        self.assertEqual(self.finalize(), target)

    def test_manifest_symlink_is_rejected_without_execution(self):
        (self.source / 'payload.cjs').write_text('process.exit(91)')
        (self.source / 'package.json').unlink()
        (self.source / 'package.json').symlink_to('payload.cjs')
        with self.assertRaises(ValueError): self.finalize()

    def test_parent_symlink_is_rejected(self):
        original = self.source / 'apps/studio'
        original.rename(self.source / 'studio')
        original.symlink_to('../studio')
        with self.assertRaises(ValueError): self.finalize()

    def test_source_directory_symlink_is_rejected(self):
        original = self.source.with_name('original')
        self.source.rename(original)
        self.source.symlink_to('original')
        with self.assertRaises(OSError): self.finalize()

    def test_external_dependency_symlink_is_rejected(self):
        (self.source / 'node_modules').mkdir()
        (self.source / 'node_modules/escape').symlink_to('../../../../outside')
        with self.assertRaises((ValueError, OSError)): self.finalize()

    def test_internal_workspace_symlink_is_supported(self):
        path = self.source / 'node_modules/@light-delay'
        path.mkdir(parents=True)
        (path / 'v2-core').symlink_to('../../packages/v2-core')
        target = self.finalize()
        self.assertTrue((target / 'node_modules/@light-delay/v2-core/package.json').is_file())

    def test_hardlink_is_rejected(self):
        os.link(self.source / 'package.json', self.source / 'hardlink')
        with self.assertRaises(ValueError): self.finalize()

    def test_fifo_is_rejected_without_blocking(self):
        os.mkfifo(self.source / 'fifo')
        with self.assertRaises(ValueError): self.finalize()

    def test_sha_path_and_metadata_are_checked(self):
        for path, sha in [(self.source, '../evil'), (self.root, SHA)]:
            with self.assertRaises(ValueError): self.finalize(path, sha)
        (self.source / 'release.json').write_text('{"service":"studio","revision":"wrong"}')
        with self.assertRaises(ValueError): self.finalize()

    def test_mutable_host_directory_is_rejected(self):
        self.guard.stop()
        with self.assertRaises(ValueError): helper.secure_directory(self.root)
        self.guard.start()

if __name__ == '__main__': unittest.main()
