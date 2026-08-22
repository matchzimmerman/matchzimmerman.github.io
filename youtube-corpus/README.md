# MZ // YouTube Corpus Log

Public, data-driven log for deliberately over-retrieved YouTube collections.

## Archival rule

- The same YouTube video ID discovered by multiple searches becomes one record with multiple discovery paths.
- Different YouTube video IDs containing the same source footage remain separate records.
- Capture-state metadata is never silently rewritten. For volatile values such as view count, the record stores the value and timestamp observed during retrieval.
- Removed/private videos remain in the log as tombstoned records when previously captured metadata exists.

## Scale model

The public site is static and works from sharded JSON data. Each collection has a `manifest.json` listing files such as `videos-0001.json`, `videos-0002.json`, etc. A typical shard should contain roughly 250 video records. This allows collections to grow to tens of thousands of records without generating one giant HTML document.

## Video record fields

Core fields:

- `video_id`
- `url`
- `title`
- `channel_id`
- `channel_title`
- `published_at`
- `captured_at`
- `view_count_at_capture`
- `duration`
- `thumbnail`
- `verification`
- `source_event_id`
- `duplicate_cluster_id`
- `discovery_queries`
- `notes`
- `availability`

Optional provenance/history fields can preserve later sweeps, changing statistics, removal status, classifier confidence, and multiple collection memberships.

## Initial collections

- CORPUS-001 — Stephen Colbert on *The Daily Show*
- CORPUS-002 — Ostrich videos under 15 views

The log is presentation infrastructure. Retrieval harvesters write data shards and update the manifests; the browser reads those records directly.
