#!/usr/bin/python3
"""Trusted host helper: copy untrusted bytes without following source links, then validate.
Installed by an administrator, never executed from a release. No release code is run.
"""
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import tempfile

ROOT = Path('/srv/studio')
DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW

def secure_directory(path):
    for item in [*reversed(path.parents), path]:
        info = item.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ValueError(f'Expected root-owned, non-writable directory: {item}')

def copy_tree(source_fd, destination):
    for name in os.listdir(source_fd):
        info = os.stat(name, dir_fd=source_fd, follow_symlinks=False)
        target = destination / name
        if stat.S_ISDIR(info.st_mode):
            descriptor = os.open(name, DIR_FLAGS, dir_fd=source_fd)
            try:
                target.mkdir(mode=0o700)
                copy_tree(descriptor, target)
            finally:
                os.close(descriptor)
        elif stat.S_ISREG(info.st_mode):
            descriptor = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=source_fd)
            with os.fdopen(descriptor, 'rb') as source:
                opened = os.fstat(source.fileno())
                if not stat.S_ISREG(opened.st_mode) or opened.st_nlink != 1:
                    raise ValueError('Special files and hardlinks are forbidden')
                # New inode: existing writable source descriptors cannot mutate the copy.
                with target.open('xb') as output:
                    shutil.copyfileobj(source, output)
        elif stat.S_ISLNK(info.st_mode):
            link = os.readlink(name, dir_fd=source_fd)
            if os.path.isabs(link):
                raise ValueError('Absolute symlinks are forbidden')
            target.symlink_to(link)
        else:
            raise ValueError('Special files are forbidden')

def regular_file(root, relative):
    path = root / relative
    current = root
    for part in Path(relative).parts:
        current /= part
        if current.is_symlink():
            raise ValueError(f'Symlink in security-sensitive path: {relative}')
    if not path.is_file():
        raise ValueError(f'Missing regular file: {relative}')
    return path

def validate(root, sha, finalized=False):
    for directory, dirs, files in os.walk(root, followlinks=False):
        for path in [Path(directory), *(Path(directory) / name for name in dirs + files)]:
            info = path.lstat()
            if path.is_symlink():
                # npm workspace/bin links only; no links in manifests or build parents.
                if 'node_modules' not in path.relative_to(root).parts:
                    raise ValueError('Symlinks only allowed inside node_modules')
                path.resolve(strict=True).relative_to(root.resolve())
                if finalized and info.st_uid != 0:
                    raise ValueError('Release symlink is not root owned')
            elif not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode)):
                raise ValueError('Special file in release')
            elif finalized and (info.st_uid != 0 or info.st_mode & 0o222 or stat.S_ISREG(info.st_mode) and info.st_nlink != 1):
                raise ValueError('Release is not immutable')
    metadata = json.loads(regular_file(root, 'release.json').read_text())
    if metadata.get('service') != 'studio' or metadata.get('revision') != sha:
        raise ValueError('Release metadata mismatch')
    for relative in ['package.json', 'apps/studio/package.json', 'packages/v2-core/package.json']:
        manifest = json.loads(regular_file(root, relative).read_text())
        if not isinstance(manifest, dict):
            raise ValueError('Invalid package manifest')
    regular_file(root, 'apps/studio/build/index.js')

def finalize(requested, sha, root=ROOT):
    if not re.fullmatch('[0-9a-f]{40}', sha):
        raise ValueError('Invalid Git SHA')
    releases = root / 'releases'
    secure_directory(releases)
    destination = releases / sha
    incoming = releases / '.incoming' / sha
    if requested not in (str(destination), str(incoming)):
        raise ValueError('Release path must be the exact incoming or finalized SHA directory')
    if destination.exists() or destination.is_symlink():
        if destination.is_symlink():
            raise ValueError('Release directory is a symlink')
        validate(destination, sha, finalized=True)
        return destination
    if requested != str(incoming):
        raise ValueError('Finalized release does not exist')
    # Open each untrusted path component independently; never resolve through a link.
    parent_fd = os.open(releases / '.incoming', DIR_FLAGS)
    try:
        source_fd = os.open(sha, DIR_FLAGS, dir_fd=parent_fd)
    finally:
        os.close(parent_fd)
    temporary = Path(tempfile.mkdtemp(prefix='.finalize-', dir=releases))
    try:
        try:
            copy_tree(source_fd, temporary)
        finally:
            os.close(source_fd)
        validate(temporary, sha)
        for directory, dirs, files in os.walk(temporary):
            for name in files:
                path = Path(directory) / name
                if not path.is_symlink():
                    path.chmod(0o444)
            Path(directory).chmod(0o555)
        temporary.rename(destination)
    except BaseException:
        # Only our newly created root-owned temporary directory is removed.
        for directory, dirs, files in os.walk(temporary):
            Path(directory).chmod(0o700)
        shutil.rmtree(temporary)
        raise
    validate(destination, sha, finalized=True)
    return destination

if __name__ == '__main__':
    if os.geteuid() != 0 or len(sys.argv) != 3:
        sys.exit('usage (root only): stage-finalize.py <release-directory> <git-sha>')
    try:
        print(finalize(sys.argv[1], sys.argv[2]))
    except (OSError, ValueError, RuntimeError) as error:
        sys.exit(str(error))
