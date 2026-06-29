#!/usr/bin/env python3
"""Build the browser-facing archive index from immutable execution records."""
from __future__ import annotations

import datetime as dt
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def metric_delta(record, key: str) -> float:
    before = record.get('metrics_before') or {}
    after = record.get('metrics_after') or {}
    try:
        return float(after.get(key, 0)) - float(before.get(key, 0))
    except (TypeError, ValueError):
        return 0.0


def direction_reversal(record) -> float | None:
    before = (record.get('metrics_before') or {}).get('field_direction') or {}
    after = (record.get('metrics_after') or {}).get('field_direction') or {}
    try:
        ax, ay = float(before.get('x', 0)), float(before.get('y', 0))
        bx, by = float(after.get('x', 0)), float(after.get('y', 0))
    except (TypeError, ValueError):
        return None
    first_magnitude = math.hypot(ax, ay)
    second_magnitude = math.hypot(bx, by)
    if first_magnitude < 0.1 or second_magnitude < 0.1:
        return None
    return (ax * bx + ay * by) / (first_magnitude * second_magnitude)


def anomaly_assessment(record):
    explicit = record.get('anomaly_status')
    if explicit in {'potential', 'confirmed', 'none'}:
        return {
            'status': explicit,
            'basis': record.get('anomaly_basis'),
            'value': record.get('anomaly_signal_value'),
        }

    active_anomalies = record.get('anomalies') or []
    if active_anomalies or record.get('event_log_id'):
        anomaly_type = active_anomalies[-1].get('type') if active_anomalies else 'event-log anomaly'
        return {'status': 'confirmed', 'basis': anomaly_type, 'value': len(active_anomalies)}

    if not record.get('metrics_before') or not record.get('metrics_after'):
        return {'status': 'none', 'basis': None, 'value': None}

    candidates = []
    thresholds = [
        ('damage increase', metric_delta(record, 'damage'), 0.05, 90),
        ('fragmentation shift', metric_delta(record, 'fragmentation'), 0.015, 85),
        ('residue accumulation', metric_delta(record, 'residue'), 0.06, 75),
        ('connectivity disruption', metric_delta(record, 'connectivity'), 0.012, 70),
        ('symmetry disruption', metric_delta(record, 'symmetry'), 0.08, 65),
        ('movement divergence', metric_delta(record, 'movement_speed'), 0.12, 60),
        ('palette divergence', metric_delta(record, 'orange_ratio'), 0.07, 55),
    ]
    for basis, value, threshold, score in thresholds:
        if abs(value) >= threshold:
            candidates.append((score + abs(value), basis, round(value, 4)))

    reversal = direction_reversal(record)
    if reversal is not None and reversal <= -0.35:
        candidates.append((88 + abs(reversal), 'field-direction reversal', round(reversal, 4)))

    if not candidates:
        return {'status': 'none', 'basis': None, 'value': None}

    _, basis, value = max(candidates, key=lambda item: item[0])
    return {'status': 'potential', 'basis': basis, 'value': value}


def enrich_record(record):
    enriched = dict(record)
    assessment = anomaly_assessment(record)
    enriched['anomaly_status'] = assessment['status']
    if assessment['basis'] is not None:
        enriched['anomaly_basis'] = assessment['basis']
    if assessment['value'] is not None:
        enriched['anomaly_signal_value'] = assessment['value']

    tags = list(dict.fromkeys(enriched.get('tags') or []))
    if assessment['status'] == 'potential':
        tags.extend(tag for tag in ('anomaly', 'potential-anomaly') if tag not in tags)
    elif assessment['status'] == 'confirmed':
        tags.extend(tag for tag in ('anomaly', 'confirmed-anomaly') if tag not in tags)
    enriched['tags'] = tags
    return enriched


def main() -> None:
    families = load(ROOT / 'data' / 'families.json')
    generators = load(ROOT / 'data' / 'generators.json')
    records = [enrich_record(load(path)) for path in sorted((ROOT / 'archive' / 'records').glob('*.json'))]
    records.sort(key=lambda item: item['generated_at'], reverse=True)
    payload = {
        'schema_version': '1.1.0',
        'generated_at': dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'counts': {
            'families': len(families),
            'generators': len(generators),
            'active_generators': sum(bool(item.get('enabled')) for item in generators),
            'executions': len(records),
            'potential_anomalies': sum(item.get('anomaly_status') == 'potential' for item in records),
            'confirmed_anomalies': sum(item.get('anomaly_status') == 'confirmed' for item in records),
        },
        'families': families,
        'generators': generators,
        'executions': records,
    }
    (ROOT / 'data' / 'archive-index.json').write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
