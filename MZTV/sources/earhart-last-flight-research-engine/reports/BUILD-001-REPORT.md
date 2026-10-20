# THE LAST FLIGHT · Research Intake & Evolving World · BUILD-001 · RETURN

| | |
|---|---|
| Agent | MZ.Claude (Claude Opus 5.5, `claude-opus-5-5`) |
| Environment | claude.ai cloud workspace (Linux; Python 3.13, Node 22, SQLite 3.45, poppler, tesseract, Playwright Chromium 1194 with SwiftShader) |
| Build ID | `LF-BUILD-001` · branch `claude/last-flight-build-001` |
| Code commits | `6ebfca9` engine + real ingest · `49c3e5b` viewer + QA · the next commit on the branch: metadata correction pass, report, final fixes |
| Base | `5cad5c6` (main at pickup) |
| Build timestamp | 2026-10-20 ~14:10–15:20 UTC |
| Status | **VERIFIED** for BUILD 0–3 acceptance tests listed in §7–§8 · **ASSIGNED / NOT DONE** for anything in §11 |
| Spend | no paid APIs, no paid agents, no deployment. Fetches: NARA (public), TIGHAR (two pages, hashed, not retained) |

Nothing on `main`, the public prototype or any broadcast was changed. `git diff 5cad5c6..HEAD` touches only `MZTV/sources/earhart-last-flight-research-engine/`.

---

## 1 · Interpretation

The commission asks for a running apparatus, not a picture of one: documents move through observable states, claims are tied to exact locations, and only reviewed, traceable, uncontradicted claims may move a model parameter. Even then they produce a *candidate* beside an untouched baseline, and the world shows both honestly. I read three constraints as overriding everything else:

1. **Separation.** Ingestion, evidence promotion, the scientific model and the audiovisual observers are separate subsystems with one-way data flow (ledger → feed → viewer; surrogate → viewer). The renderer has no write path.
2. **No pretending.** Real and DEMO are separate namespaces end to end (events, counters, candidates, pointers, labels). Counters are computed from recorded states, with denominators. Nothing animates without a logged event behind it.
3. **Human authority.** I can propose and review provisionally; promotion of real evidence is mechanically refused unless MZ.Human reviews at science scope and authorizes.

I did not modify the HDD methodology or the original surrogate. "Model" in this build means the original exploratory surrogate (`../earhart-last-flight/model.js`) with an evidence-traceable parameter set; better inputs do not make that surrogate valid.

## 2 · Architecture

```
            ┌──────────── engine/ (Python CLI, local) ────────────┐
 NARA portal│ discover → acquire → integrity → extract → normalize │
 TIGHAR ×2  │ → claims → classify   (+ metadata_only, retry_wait,  │
 DEMO ×20   │   failed, duplicate, corrupt, unsupported, blocked)  │
            │            │ every transition = 1 event              │
            │            ▼                                         │
            │  ledger/events.jsonl  (append-only, SHA-256 chained) │──► data/state.sqlite (projection, rebuildable)
            │            │                                         │
            │  review (attributed) → classify eligibility          │
            │  propose → candidate artifact (immutable) → tests    │──► model/runner.js ─► ../earhart-last-flight/model.js
            │  approve / rollback (gated pointer moves)            │      (pinned sha256, read-only)
            └────────────┬─────────────────────────────────────────┘
                         ▼ export after every command
                 feed/snapshot.json (public-safe, denominators, lineage)
                         ▼ polled (10 s local / 60 s https)
   viewer: index.html + viewer.js ── world.js (WebGL) ── audio.js (opt-in)
           reads feed + surrogate; never writes. 5 lenses; MZ.snapshot() = world_snapshot
```

- **Event contract:** every event carries `seq, event_id, ts, schema, type, actor, namespace, provenance_mode (REAL | DEMO/SYNTHETIC), entity, entity_id, data, prev_hash, hash`. Entities: `source`, `claim`, `model`, `candidate`, `promotion`, `pointer`, `run`, `display` (display events are labelled synthetic or not separately).
- **Tables (projection):** `sources, claims, models, candidates, promotions, pointers, display_events, runs, meta` with the fields the brief lists (`source`: URI, provider, title, original/release dates, retrieval time, file/page counts, rights, SHA-256, version, state, error…; `claim`: locator page/line, excerpt or excerpt policy, normalized value/unit, confidence band, method, reviewers, dependencies, contradictions, eligibility + reasons; `candidate`: base, proposed, params changed, evidence manifest hash, seed, code commit, previous snapshot hash, tests, diff; `promotion`: actor, authorization, previous/next model, diff, rollback pointer).
- **world_snapshot** is produced by the viewer (`MZ.snapshot()`): model id/version/status, candidate preview, trial/seed, scenario clock, position, modelled vs drawn heading, fuel, weather provenance, sun/moon + source, camera, environment provenance, lens, feed hash, surrogate hash check.
- **Recovery:** the log is truth; the projection is replayed on open if behind, rebuilt if ahead; a torn final line is dropped; a run with no `run.ended` is recorded as interrupted at the next start; a source found mid-stage is resumed (`source.stage_resumed`) and its work redone idempotently (content-addressed outputs, deterministic claim IDs).
- **Reuse decisions (BUILD 0):** HEADLAND's print pipeline was reused (adapted), see §3. `MZTV/lib/mzcam.js` was **not** imported: it is a 2D-canvas drone crew for studio spaces, while these cameras are rigidly mounted to an aircraft in a WebGL scene. Its contract (shots with `want / pose / minHold / maxHold`, cut only to ready shots, observe never steer) is reimplemented inline, and cut metadata is logged in `MZ.cuts`. The original prototype is reused as the model, by hash.

## 3 · Canonical MZ WORLDS Look inheritance

I found no explicit MZ WORLDS style-guide file in the repo or the linked Notion pages; the Layer Inputs page (2026-10-19) and BIT FIELD 031 HEADLAND's source are the canon I used. **HEADLAND is an inferred touchstone, not a verified style guide.**

- **Look layer, inherited directly:** scene → data target (shade, material ID /16, screen-space line angle from each surface's world tangent, accent) → print pass (linocut lines by tone, ordered 8×8 dither, wobble, speckle, outlines between materials) → six OBAS inks INK DEEP SEA HOT GLOW PAPER, colourway ATLANTIC PRINT (plus ULTRAMARINE, RUST TIDE, LICHEN via `?ink=`). Internal resolution 540 lines, nearest-sampled.
- **Material roles:** sky, sun, sea, glint, dural, dark, cloud, black, trim, moon, candidate-ghost, horizon glow, star, prop disc, lamp. The orange trim colour is sourced from the Navy "Known Facts" item 2 ("dural, with orange trim"); its placement is authored.
- **Forces layer:** sun and moon computed (low-precision ephemeris) for the aircraft's lat/lon at 1937-07-02 0000 GCT + flight hours. Sky hatch lines radiate from the computed sun (moon at night), so the print grammar follows real light. Twilight included. Wind and sea state are the model's **synthetic** seeded wind. Clouds are **authored** trade cumulus on a wrapping 60 km tile that drifts with that wind.
- **Structures/Life:** a modest procedural Lockheed 10E (twin fins, two radial nacelles, prop discs, cabin windows), 7,000 ft display altitude (**authored**; one radio report, Chater l130; the surrogate has no altitude), heading slewed at 3°/s for drawing only (the surrogate turns instantly; the HUD shows the modelled heading).
- **Story:** observe, don't direct. When the surrogate's fuel runs out the aircraft is removed and the HUD says "outcome not classified; not a location claim". There is no crash, wreck or rescue imagery.
- **Sound:** opt-in; see §7.
- **Avoided:** AI image generation of any kind, neon dashboards, particle "thinking", stock imagery, italic serif type. Panels use JetBrains Mono on the live palette.

## 4 · Code & commits

Branch `claude/last-flight-build-001`, directory `MZTV/sources/earhart-last-flight-research-engine/`:

```
engine/lastflight.py          CLI (init, discover, work, review, demo-review, propose, approve, rollback, status, verify, export, rebuild)
engine/lf/ledger.py           hash-chained JSONL + SQLite projection, replay/rebuild/torn-tail
engine/lf/sources.py          NARA portal parser, rights heuristics, curl fetch, Lae accounts
engine/lf/pipeline.py         worker: states, retries/backoff, duplicates, integrity, OCR budget, claims, classification
engine/lf/claims.py           narrow regex claim extractor (2-line window), unit normalization
engine/lf/models.py           registry, candidate proposal, deterministic tests, fixed-seed diff, gated approve/rollback
engine/lf/feed.py             public snapshot export with denominators
engine/make_fixtures.py       20 DEMO fixtures (+ --volume N)
engine/serve_live.py          local server + scheduled worker for OBS
model/runner.js               pinned surrogate runner (output_hash)
models/LF-0.1.0.json          baseline artifact;  ledger/models/*.json candidate artifacts
index.html viewer.js world.js audio.js
tests/test_pipeline.py browser.py live_propagation.py audio_record.py  + tests/results_*.json|log
reviews/BUILD-001-MZClaude-review-001.json
captures/01…20 *.png
```

Run commands are in `README.md`.

## 5 · DEMO versus real ingestion evidence

**REAL (namespace `real`; whole ledger as of this report: 2,170 events, head `dbe858a23e4f…`):**

| Metric | Value | Denominator / note |
|---|---|---|
| NARA release portal | 1 page acquired, SHA-256 `0f672255831f…` | retrieved 2026-10-20 14:28:13Z |
| Files linked on the portal | **259** (259 unique source IDs) | NARA's published page total **10,196** is an inventory figure, **not pages ingested** |
| Metadata verified (HTTP HEAD: size, type, last-modified recorded) | **257 / 259** | the other 2 were fully acquired. Not acquired: **15.83 GB** (253 PDF, 1 MP3, 3 MP4) — see §10 for the correction pass |
| Content acquired | **2 NARA files** (24.1 MB + 15.7 MB) + portal page + 2 TIGHAR pages | ≈40 MB acquired ≈ **0.25 %** of the release by bytes |
| Pages extracted | **173 / 173** in acquired files | file 07: 105 pp · file 08: 65 pp · +3 single-page HTML; mostly the publisher's embedded text layer, a minority by local tesseract OCR under a 12/24 pages-per-run budget across 3 runs |
| Claims extracted | **104** | all machine-extracted, each with page:line locator |
| Claims reviewed | **36** (MZ.Claude, provisional, candidate scope) | 68 unreviewed context observations |
| Eligibility | 3 eligible-candidate · 5 blocked (unresolved contradictions, flagged for MZ.Human) · 28 rejected (mapping) · 68 display-only | |
| In approved baseline | **0** | real baseline remains LF-0.1.0 |
| Failures / retries | 0 failed after fixes | 21 HEAD failures in a pre-commit dev run exposed an unencoded-space URL bug, now fixed |

Key real material (verified by MZ.Claude against the rendered page images, NARA stamp NW 90261, "Estimate and Decisions · Known Facts"):
- file 07 p61 item 1: took off "0000 GCT 2 July, 1937" → used as the scenario departure clock;
- item 9: filled with **1100 gallons** prior to departure; item 10: "economical air speed was 130 knots"; items 11–12: 24 h at **45.8 gal/h** vs 20.5 h at **53 gal/h**;
- file 08 contains a **second copy** of the same document (p59 ≈ 07 p61); on 08 p65 the OCR reads "150 knots" where the page image reads **130 knots** (OCR error, rejected with reason);
- the Navy's "C. SPEED" items are **enumerated options for an undocumented pilot decision**; mapping them to parameters was rejected (HDD: never impute a decision).

**DEMO (namespace `demo`, 20 authored fixtures, every file labelled):** 16 classified · 1 duplicate (D08 = D03) · 1 corrupt (D09 truncated PDF) · 1 unsupported (D10 .xls) · 1 blocked rights (D12) · D11 failed twice then succeeded (attempts = 3) · conflict D04 1100 vs D07 950 (both blocked) · D13 ambiguous unit · D14 untraceable. Fixture IDs D01–D20 are listed in `fixtures/demo/manifest.json`.

## 6 · Candidate · promotion · diff · rollback

**REAL — `CAND-001` → `LF-0.2.0-c1` (candidate · side preview · awaiting MZ.Human):**
- Change: `fuelStart` 1070 → **1100 US gal** (> 2 % tolerance).
- Evidence (candidate scope): Chater p1:l83 (transcription, link-only), Collopy p1:l41 (transcription, link-only), Navy file 07 p61:l31 (verified image). Dependencies recorded: Chater l83 ← l81 (the 654 imp gal top-up); Navy ← Lae accounts (source not stated). **These three agreeing records are probably not independent** (HDD Class C).
- Tests 8/8: baseline reproduces, matches registered snapshot, candidate reproduces, differs, same surrogate SHA, within bounds, finite, original `test-model.js` passes.
- Fixed-seed diff (192 identical seeds): expected Δ mean endurance ≈ Δfuel ÷ burn = **+0.6122 h**; observed **+0.6115 h**; mean terminal shift 115.5 km (max 160.5); geometric "within 25 km of Howland" 27 → 27, 0 trials reclassified. Output hashes `5f2b9e3014ec…` → `a508d2604c20…`. These are differences between two uncalibrated synthetic surrogates, not a historical inference.
- Promotion attempt by MZ.Claude: **REFUSED** (`PROMO-0001638`), reasons: 3 claims not accepted at science scope; real promotion requires actor MZ.Human. Real pointer still `LF-0.1.0`.

**DEMO — controlled test in sandbox namespace:** `DEMO/CAND-001` (airspeed 124 → 130 from D03 + D05; D06 175 kt rejected and excluded) → approved by `TEST-HARNESS` with a "controlled test" authorization → pointer moved to `DEMO/LF-0.2.0-c1` labelled *DEMO · TEST-APPROVED IN CONTROLLED SANDBOX · not science* → rolled back → pointer restored to `DEMO/LF-0.1.0`; both models and the candidate are retained.

## 7 · OBS / browser QA (headless Chromium + SwiftShader, real renderer)

| Check | Result |
|---|---|
| First frame | 1.2 s, no splash |
| Console errors / page errors / warnings | 0 / 0 / 0 across smoke, lenses, 4 cameras, 6 times of day, ghost, phone, perf, context loss, audio |
| 1920×1080 captures | `captures/01–17` |
| Phone 390×844 | lenses stack under the world; no horizontal scroll (`captures/18–20`) |
| WebGL context loss + restore | recovers, 0 errors |
| Surrogate hash check in browser | ✓ (WebCrypto, or JS SHA-256 fallback on insecure origins / file://) |
| Live propagation (`tests/live_propagation.py`) | viewer idle → WORLD, no change; worker writes events → INTAKE within one poll; candidate → MODEL; promotion and rollback appear; refresh resumes with no replay of seen events — **PASS** |
| Performance | JS frame cost 0.5 ms median / 1.3 ms p90; **3.7 fps under CPU software GL** at 1080p — not a GPU figure; real OBS/GPU performance **not measured** |
| Audio (12 s recording of the master) | −23.7 dB RMS, −9.1 dBFS peak; bands vs 60–250 Hz: 250–1k −4.8 dB, 1–2k −25.6, 2–5k −42.8, >5k −55.9; 0 clicks; cockpit → long lens crossfade ≈ −21 → −35 dB; mute −98 dB; forced suspend and forced close both recovered by the watchdog |
| OBS instructions | `README.md` § OBS. Audio is opt-in (`audio=1`); with "Control audio via OBS" the host's mute applies |

## 8 · 48-hour recovery behaviour

- **Engine:** crash test killed the worker 7 times at chosen event counts (each kill lands after the log write, before the projection commit) → final state, claim IDs and all counters identical to an uninterrupted run; interrupted runs recorded; no source left "acquiring/extracting"; chain + projection == replay. Deleting `state.sqlite` → rebuilt from the log with identical counters. Torn final line → dropped and reported. Tampered event → chain verification fails.
- **Viewer:** broadcast anchor + last-seen ledger seq persist in localStorage; refresh resumes the same trial/hour and does not re-announce old events. A compressed run (×900, 150 s ≈ 37.5 simulated hours) crossed a trial boundary (trial 1's surrogate run had ended by the T+22.5 h sample — its modelled endurance is 21 h 31 min — and trial 2 began at the 24 h boundary) with 0 errors and no heap growth reported. **Not done:** an actual 48 h wall-clock soak in OBS.
- **Idle:** a worker pass with nothing to do writes nothing, so a scheduled worker cannot inflate the ledger or fake activity.

## 9 · Archival provenance and rights

- NARA federal records: classified by heuristic (record group + filename) as "U.S. federal record · no known copyright (verify per item)". Press clippings inside CIA/FBI files and the release's MP3 are **metadata-only**. **None of this is a legal determination.**
- Raw NARA PDFs and extracted text are held in the local gitignored cache only (`data/`); the public feed carries ≤160-character excerpts of federal-record lines plus locators and hashes.
- TIGHAR transcriptions (Chater, Collopy): fetched once, hashed, line located, **not retained and not quoted**; claims store the locator + line SHA-256 only. Facsimiles are still needed (HDD G0).
- Nothing was published. Public hosting of any of this needs MZ.Human approval.

## 10 · Self-critique

- **The extractor is narrow.** It is a regex over one or two lines; it missed the departure-time line itself (now used as the scenario clock, but not yet a ledger claim), and it maps "speed … knots" too eagerly (ship speeds), which the conflict gate caught. A per-claim human-checkable extractor (or LLM-assisted with locator verification) is the next real gain.
- **My review is a judgement call.** 36 decisions with reasons are in `reviews/`; MZ.Human should check at least the 3 accepted and 5 flagged claims. I verified two pages against images; the rest rely on OCR text in context.
- **The candidate is small and not independent.** +30 gal on a surrogate with synthetic wind and no altitude, supported by three records that likely share one source. It demonstrates the machinery; it does not advance the historical question much.
- **A false 'metadata verified' count was caught before release.** While checking this report I found that my HEAD parser stopped at the proxy's duplicated CONNECT block, so the first 257 `source.metadata_verified` events recorded reachability only (no size/type). The counter would have overstated the work. Fixed: parser rewritten; a `reverify-metadata` correction pass appended `source.metadata_correction` + fresh events with real values; the feed now counts *verified* only when size and type exist and shows *reachable-only* separately; three MP4 films missed by the rights rules were reclassified metadata-only by appended event.
- **Development history.** Before the first commit I reset the dev ledger once (an ID-collision bug that would have silently dropped sources) and changed the projection meaning of `source.extract_partial` between runs 1 and 2 (the log was replayed; event types were unchanged). After commit, corrections were appended (`source.retention_recorded`), not rewritten.
- **Look.** Authored clouds and altitude are labelled but still shape the image; the long lens can show a small aircraft against flat sea; the cockpit sees the nose but not the engines (they sit just aft of the windscreen line).
- **Not tested:** real OBS, a GPU, Twitch, a true 48 h soak, macOS shell differences.
- **Feed size.** The snapshot is ~650 KB; fine locally, heavy if many clients poll a static host (default lowered to 60 s on https; an incremental feed is the right fix).

## 11 · Unresolved research gates (HDD)

- **G0 sources:** 2 of 259 NARA files read (≈0.25 % by bytes). By filename the release also holds the obvious next acquisitions: RG 26 *Correspondence File 601 Itasca* (11 parts), the *Papers of Lt L. G. Bellarts USCG* (Itasca radio operator; several reels), *Commandant's Earhart Search Charts* (2 folders), RG 181 *Earhart Search Report*, RG 38 *US Navy Report of the Search*, and a 1937 *Board of Officers* proceeding. None inspected yet; an actual radio log page has not been verified. Chater/Collopy facsimiles not found; rights adjudication not done.
- **G1 reproducibility:** deterministic surrogate runs and hash-pinned code ✓ for the surrogate only; no frozen historical run package.
- **G2 performance:** not started (no held-out leg calibration).
- **G3 environment:** no 1937 observations or NOAA 20CR ingested; weather is synthetic and labelled.
- **G4 comparators, G5 sensitivity:** not started.
- **G6 presentation separation:** implemented and tested (observer-only viewer, labels, no reverse path).
- **G7 release:** not requested.
- **For MZ.Human now:** (a) accept or reject CAND-001's three fuel claims at science scope; (b) decide the airspeed (130 economical vs 140 radio) and burn (45.8 vs 53 gal/h) conflicts; (c) approve or not any public hosting of the viewer and feed.

## 12 · CAIR RETURN + HARIL Δ

- **COLLECT:** the NARA release inventory is now a recorded, hashed discovery corpus (259 files, 257 with verified metadata), plus 173 pages of the 1937 Navy/Coast Guard search report extracted with locators.
- **ANALYZE:** 104 machine claims → 36 attributed reviews → 3 eligible, 5 human-flagged contradictions, 28 rejected mappings with reasons, including the decision-imputation boundary.
- **INTERPRET:** the apparatus showed agreement across three fuel records while recording why that agreement is weak: likely a shared source and a duplicated document.
- **RETURN:** one candidate awaiting MZ.Human; real baseline unchanged; promotion refused to the agent by design.

**HARIL Δ (method):** a document's arrival is now separable from its effect. Received → located → reviewed → eligible → candidate → approved are distinct, logged states, and the broadcast can show each one without implying the next. **Δ (systems):** a reusable intake/ledger/promotion engine for any MZ WORLDS historical reconstruction (WARREN, Smith Island). It is independent of the renderer and of the surrogate it feeds. **Δ (artwork):** the world is printed from computed 1937 light, and the research machinery appears as a cutaway beside it rather than replacing it.
