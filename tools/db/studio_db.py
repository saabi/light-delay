#!/usr/bin/env python3
"""Studio authoring database backup, restore and verification.

See docs/STUDIO_BACKUP_AND_RESTORE.md. Connection strings come from the environment or arguments
and are passed to PostgreSQL tools through PG* environment variables, never on a command line
(where other users could read them). Restore only ever targets an empty database that is not the
one in DATABASE_URL; it never drops or overwrites anything.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.parse

ROOT = Path(__file__).resolve().parents[2]
VERIFY = ROOT / 'packages' / 'v2-core' / 'dist' / 'verify-authoring-database.js'


def fail(message):
    sys.exit(f'studio-db: {message}')


def connection(url):
    """PG* variables, database name and a password-free label for a postgres URL."""
    parts = urllib.parse.urlsplit(url)
    if parts.scheme not in ('postgres', 'postgresql'):
        fail('expected a postgres:// or postgresql:// URL')
    database = urllib.parse.unquote(parts.path.lstrip('/'))
    if not database:
        fail('the URL names no database')
    env = {'PGDATABASE': database}
    if parts.hostname:
        env['PGHOST'] = parts.hostname
    if parts.port:
        env['PGPORT'] = str(parts.port)
    if parts.username:
        env['PGUSER'] = urllib.parse.unquote(parts.username)
    if parts.password:
        env['PGPASSWORD'] = urllib.parse.unquote(parts.password)
    query = urllib.parse.parse_qs(parts.query)
    if 'host' in query:
        env['PGHOST'] = query['host'][0]
    if 'sslmode' in query:
        env['PGSSLMODE'] = query['sslmode'][0]
    label = f"{env.get('PGUSER', '')}@{env.get('PGHOST', 'localhost')}:{env.get('PGPORT', '5432')}/{database}"
    return env, database, label


def run(command, env, **kwargs):
    return subprocess.run(command, env={**os.environ, **env}, check=True, **kwargs)


def sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def summarize(url, out):
    """Summary of a database through Studio's own code; returns (ok, summary).

    A backup may be taken just before migrating, so pending migrations are not a problem here.
    """
    result = subprocess.run(
        ['node', str(VERIFY), '--out', str(out), '--accept-pending-migrations'],
        env={**os.environ, 'DATABASE_URL': url},
        stderr=subprocess.PIPE,
        text=True,
    )
    sys.stderr.write(result.stderr)
    if not Path(out).exists():
        fail('could not read the database (see the error above)')
    return result.returncode == 0, json.loads(Path(out).read_text())


def backup(args):
    url = os.environ.get('DATABASE_URL') or fail('DATABASE_URL is required')
    env, database, label = connection(url)
    out = Path(args.out)
    os.umask(0o077)
    out.mkdir(mode=0o700, parents=True, exist_ok=True)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    name = f'studio-{database}-{stamp}'
    dump = out / f'{name}.dump'
    before_ok, before = summarize(url, out / f'{name}.before.json')
    if before['schema']['status'] == 'uninitialized':
        (out / f'{name}.before.json').unlink()
        print('no authoring schema yet: nothing to back up')
        return
    if not before_ok:
        fail('the source database does not verify; fix it before relying on a backup of it')
    run(['pg_dump', '--format=custom', '--no-owner', '--no-privileges', '--file', str(dump)], env)
    after_ok, after = summarize(url, out / f'{name}.summary.json')
    (out / f'{name}.before.json').unlink()
    if not after_ok or before != after:
        dump.unlink()
        fail('the database changed during the backup, so its contents cannot be verified; run it again')
    version = subprocess.run(['pg_dump', '--version'], capture_output=True, text=True, check=True).stdout.strip()
    manifest = {
        'database': label,
        'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        'dump': dump.name,
        'sha256': sha256(dump),
        'bytes': dump.stat().st_size,
        'pgDump': version,
        'summary': f'{name}.summary.json',
    }
    (out / f'{name}.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(out / f'{name}.json')


def restore(args):
    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text())
    dump = manifest_path.parent / manifest['dump']
    if sha256(dump) != manifest['sha256']:
        fail('the dump does not match its manifest checksum')
    env, database, label = connection(args.target_url)
    active = os.environ.get('DATABASE_URL')
    if active:
        active_env, active_database, _ = connection(active)
        same_host = active_env.get('PGHOST', 'localhost') == env.get('PGHOST', 'localhost') and active_env.get('PGPORT', '5432') == env.get('PGPORT', '5432')
        if same_host and active_database == database:
            fail('refusing to restore into the database in DATABASE_URL; restore into a new, empty database')
    tables = run(
        ['psql', '--no-psqlrc', '--tuples-only', '--no-align', '--command',
         "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')"],
        env, capture_output=True, text=True,
    ).stdout.strip()
    if tables != '0':
        fail(f'{label} is not empty ({tables} tables); restore only into a new, empty database')
    run(['pg_restore', '--no-owner', '--no-privileges', '--exit-on-error', '--single-transaction',
         '--dbname', database, str(dump)], env)
    print(f'restored {manifest["dump"]} into {label}')
    verify(argparse.Namespace(target_url=args.target_url, manifest=args.manifest))


def verify(args):
    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text())
    summary = manifest_path.parent / manifest['summary']
    result = subprocess.run(
        ['node', str(VERIFY), '--out', os.devnull, '--compare', str(summary)],
        env={**os.environ, 'DATABASE_URL': args.target_url},
    )
    if result.returncode != 0:
        fail('the restored database does not match the backup')
    print('restored database matches the backup: schema, history, projections, views, drafts and proposals')


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest='command', required=True)
    b = commands.add_parser('backup', help='dump the DATABASE_URL database, with a verified summary')
    b.add_argument('--out', required=True, help='directory for the dump, manifest and summary')
    b.set_defaults(handler=backup)
    r = commands.add_parser('restore', help='restore a backup into a new, empty database and verify it')
    r.add_argument('--manifest', required=True)
    r.add_argument('--target-url', required=True)
    r.set_defaults(handler=restore)
    v = commands.add_parser('verify', help='compare a database with a backup summary')
    v.add_argument('--manifest', required=True)
    v.add_argument('--target-url', required=True)
    v.set_defaults(handler=verify)
    args = parser.parse_args()
    try:
        args.handler(args)
    except subprocess.CalledProcessError as error:
        fail(f'{Path(error.cmd[0]).name} failed with exit status {error.returncode}')
    except FileNotFoundError as error:
        fail(f'{error.filename} is not installed or not on PATH')


if __name__ == '__main__':
    main()
