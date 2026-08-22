# MZ // YouTube Corpus — Retrieval Engine

The public archive is backed by a resumable YouTube Data API v3 harvester.

## Operational model

- Collection definitions live in `youtube-corpus/configs/`.
- `tools/harvest.py` partitions broad searches across time windows.
- A run stops at a configurable search-quota budget and saves its exact position.
- The next run resumes rather than restarting.
- Distinct YouTube IDs remain distinct even when the underlying footage is identical.
- The same YouTube ID found by many searches becomes one record with many discovery paths.
- `view_count_at_capture` is preserved as historical state; later checks can update `view_count_last_seen`.
- Records are sharded into 250-video JSON chunks for the public browser.

## Required credential

Create a Google Cloud API key with **YouTube Data API v3** enabled and add it to this repository as the Actions secret `YOUTUBE_API_KEY`. Never commit the key.

## Running

GitHub → Actions → **YouTube Corpus Harvest** → Run workflow.

A search budget of 70 uses up to roughly 7,000 quota units for `search.list` calls, leaving headroom under the common 10,000-unit daily default. `videos.list` calls are much cheaper but also count toward quota.

## Repeated sweeps

When a sweep completes, run it again with **reset_sweep = true**. The saturation signal is how many previously unseen video IDs a new complete sweep adds. Repeated low-yield sweeps indicate increasing retrieval saturation; the system reports this instead of claiming impossible absolute completeness.

## Verification

The harvester performs metadata triage, not frame-level semantic confirmation. `likely` records have strong metadata support; `uncertain` records need visual/manual confirmation; `verified` and `rejected` are later review states. Discovery provenance is never erased.
