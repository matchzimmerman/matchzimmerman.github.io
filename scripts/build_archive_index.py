#!/usr/bin/env python3
"""Build the browser-facing archive index from immutable execution records."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def main() -> None:
    families = load(ROOT / 'data' / 'families.json')
    generators = load(ROOT / 'data' / 'generators.json')
    records = [load(path) for path in sorted((ROOT / 'archive' / 'records').glob('*.json'))]
    records.sort(key=lambda item: item['generated_at'], reverse=True)
    payload = {
        'schema_version': '1.0.0',
        'generated_at': dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'counts': {
            'families': len(families),
            'generators': len(generators),
            'active_generators': sum(bool(item.get('enabled')) for item in generators),
            'executions': len(records)
        },
        'families': families,
        'generators': generators,
        'executions': records
    }
    (ROOT / 'data' / 'archive-index.json').write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
