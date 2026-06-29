#!/usr/bin/env python3
"""Run one registered procedural generator and append an immutable archive record."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATORS = ROOT / 'data' / 'generators.json'
RECORDS = ROOT / 'archive' / 'records'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def next_serial(day: str) -> int:
    prefix = f'MZFS.EXE.{day}.'
    serials = []
    for path in RECORDS.glob(f'{prefix}*.json'):
        try:
            serials.append(int(path.stem.rsplit('.', 1)[-1]))
        except ValueError:
            continue
    return max(serials, default=0) + 1


def select_generator(slug: str | None):
    generators = [g for g in load_json(GENERATORS) if g.get('enabled')]
    if slug:
        matches = [g for g in generators if g['slug'] == slug]
        if not matches:
            raise SystemExit(f'No enabled generator named {slug!r}.')
        return matches[0]
    weighted = []
    for generator in generators:
        weighted.extend([generator] * max(1, int(generator.get('schedule_weight', 1))))
    if not weighted:
        raise SystemExit('No enabled generators are registered.')
    return random.SystemRandom().choice(weighted)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--generator')
    parser.add_argument('--seed', type=int)
    parser.add_argument('--timestamp', help='ISO timestamp override for deterministic tests')
    args = parser.parse_args()

    now = dt.datetime.fromisoformat(args.timestamp.replace('Z', '+00:00')) if args.timestamp else dt.datetime.now(dt.timezone.utc)
    now = now.astimezone(dt.timezone.utc)
    day = now.strftime('%Y%m%d')
    serial = next_serial(day)
    execution_id = f'MZFS.EXE.{day}.{serial:06d}'
    generator = select_generator(args.generator)
    seed = args.seed if args.seed is not None else random.SystemRandom().randrange(1, 2_147_483_647)

    relative_asset = Path('archive') / 'executions' / now.strftime('%Y/%m') / f'{execution_id}.{generator["extension"]}'
    asset_path = ROOT / relative_asset
    asset_path.parent.mkdir(parents=True, exist_ok=True)

    command = list(generator['command']) + ['--seed', str(seed), '--output', str(asset_path)]
    subprocess.run(command, cwd=ROOT, check=True)

    digest = hashlib.sha256(asset_path.read_bytes()).hexdigest()
    record = {
        'id': execution_id,
        'record_type': 'execution',
        'title': generator['title'],
        'generated_at': now.isoformat().replace('+00:00', 'Z'),
        'generator_id': generator['id'],
        'generator_version': generator['version'],
        'family_id': generator['family_id'],
        'seed': seed,
        'parent_ids': [],
        'status': 'UNREVIEWED / RETAINED',
        'media_type': generator['media_type'],
        'asset_uri': str(Path('..') / relative_asset).replace('\\', '/'),
        'source_ref': generator['command'][1],
        'dimensions': generator.get('dimensions'),
        'checksum_sha256': digest,
        'storage_policy': generator.get('storage_policy'),
        'tags': ['procedural', 'scheduled-execution', generator['slug']]
    }
    RECORDS.mkdir(parents=True, exist_ok=True)
    (RECORDS / f'{execution_id}.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')

    subprocess.run([sys.executable, 'scripts/build_archive_index.py'], cwd=ROOT, check=True)
    print(execution_id)


if __name__ == '__main__':
    main()
