# MZCMG Archival Retrieval Engine — v0.1

A working browser-based prototype for turning a user inquiry into ranked archival video candidates from Internet Archive and Wikimedia Commons.

## Current pipeline

1. User inquiry
2. Semantic query planning
3. Multiple retrieval pathways
4. Internet Archive Advanced Search API
5. Wikimedia Commons MediaWiki API
6. Candidate normalization / de-duplication
7. Metadata relevance scoring
8. Rights-metadata classification
9. Archival Fragment candidate export

The benchmark inquiry is:

> I want to learn about the fishing culture in western Ireland.

## Important v0.1 limitation

The semantic planner is currently deterministic and runs entirely in the browser. This proves the archive-retrieval/data-model layer without exposing an AI API key. The next version should replace or augment `buildPlan()` with a server-side/serverless AI planner that returns structured JSON.

Suggested AI planner output:

```json
{
  "inquiry": "...",
  "entities": [],
  "places": [],
  "periods": [],
  "practices": [],
  "objects": [],
  "social_context": [],
  "historical_analogues": [],
  "associative_visuals": [],
  "search_queries": []
}
```

## Rights model

The engine does **not** equate “hosted by an archive” with “public domain.” It separates candidates into:

- Public Domain / CC0
- Open License
- Needs Review

Every exported fragment preserves the raw source rights metadata. Final rights clearance should be verified at the original source before publication.

## Next milestones

- AI inquiry planner via secure serverless endpoint
- Metadata-detail hydration for top Archive.org candidates
- Transcript / caption discovery
- Temporal scan and candidate timestamp ranges
- Shot detection
- Human review / keep / reject controls
- Documentary pathway generation
- Timeline composer

## Data object

The system treats the useful unit as an **Archival Fragment Candidate**, not a whole video. v0.1 leaves `candidate_timestamp` null; temporal analysis is the next major layer.
