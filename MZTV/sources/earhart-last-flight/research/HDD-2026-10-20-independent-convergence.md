# HARIL DEEP DIVE · HDD-2026.10.20
## THE LAST FLIGHT — Independent Reconstruction and Convergence Study

**Decision:** ADOPTED by MZ.Human, 2026-10-20.
**Prepared by:** MZ.GPT, HARIL AGENT GROUP.
**Stage:** Evidence reconnaissance + registered research protocol; independent calibrated historical simulation **NOT RUN**.
**Branch:** HARIL / EARHART (research) → MZ WORLDS aircraft/environment renderer → MZTV broadcast; MZCAM observation; optional Documentary Engine output.
**Method:** CAIR — COLLECT → ANALYZE → INTERPRET → RETURN. HDD — evidence audit → independent interpretations → adversarial challenge → recursive synthesis → HARIL Δ → return.

> Canonical commitment: Independent simulation → reproducible results → comparison with external research → explain convergence/divergence → adversarial testing → RETURN.

## Executive finding

Records and published technical analyses provide sufficient anchors to start a traceable investigation; there is not yet a validated Electra performance model, digitized/verified historical weather field, harmonized radio observation set, or defensible posterior probability for wreckage location. The existing MZTV browser prototype is a deliberately **synthetic exploratory kinematic surrogate**. Its seeds and endpoint graphics are not independent historical inferences.

**Research success is not defined as favoring a predetermined wreck region.** Reconstruct the physical capability and constraints of the aircraft, calibrate on held-out known legs, then test final-flight scenarios and compare only after freezing the analysis protocol and primary outputs. Coincident regions based on the same assumptions do not demonstrate independent corroboration.

## Evidence audit: initial ledger (checked 2026-10-20)

| ID | Source and original date | Direct evidence or analysis | Checked finding | Epistemic constraint |
|---|---|---|---|---|
| E-001 | National Archives Earhart collection | US Navy/Coast Guard institutional archival inventory | Lists 84-page original search report, 106-page Itasca radio log copy, deck logs, track/search charts and radiograms | Holding/inventory ≠ line-by-line document inspection or machine-ready tracks |
| E-002 | Eric H. Chater report, 25 July 1937 (TIGHAR transcription) | Contemporary account / retyped transcription | Reports ~1,100 US gallons departure fuel; maintenance included starboard engine petrol pump, gyro horizon, radio issues; reports final Lae receptions and reported forecasts | Seek facsimile; verify times, transcription and fuel conversion; maintenance does not establish subsequent failure |
| E-003 | James A. Collopy letter, 28 August 1937 (TIGHAR transcription) | Second contemporary witness | Independently reports 1,100 US gallons; test flight satisfactory; comments on radio communication limitations | Not an instrument log; contains opinion and differing estimates of takeoff and altitude |
| E-004 | Kelly Johnson telegrams, March 1937 (TIGHAR transcription) | Lockheed engineer's recommendations/test observations | Provides altitude/power/fuel-flow schedule and measured points for the Electra | Tests/recommendations from other conditions do not establish actual July 2 power schedule |
| E-005 | Chater report weather passages | Historic forecasts received at Lae | Forecast heavy local showers/squalls and detour advice; report states final incoming forecast arrived at takeoff and acknowledges sparse weather observations | Forecast ≠ observed encounter with a specified storm; whether crew heard forecast must be checked |
| E-006 | TIGHAR Brandenburg radio DF analysis, revised 2006 | Published hypothesis-led computational analysis | Uses ICEPAC propagation, LFMF and NEC2 antenna modeling with explicit signal-to-noise assumptions | Model assumptions and selected signal credibility are contested; not independent evidence of a particular landing site |
| E-007 | Nauticos, 19 Aug 2025 announcement | Research team announcement on restoration/tests of comparable historical radio | Reports approximate final-position refinement near Howland | Underlying model, raw data, coordinates and reproducible uncertainty not verified accessible; classify external lead, not numeric benchmark |
| E-008 | Purdue/ALI, 18–19 Oct 2026 | Primary field expedition report | Taraia Object at Nikumaroro likely tree debris rather than airframe; other artifacts remain for analysis | Eliminates one alleged target, not the entire reef landing hypothesis |
| E-009 | NOAA 20th Century Reanalysis V3 | Modern historical atmospheric reconstruction | 1937 within archive; 3-hour global ensembles, approximately 75-km scale; assimilates surface pressure observations | Spatial/temporal grid cannot identify each equatorial squall or substitute for original 1937 observations; ensemble uncertainty mandatory |
| E-010 | O'Kelly, 2023, Geographical Analysis | Peer-reviewed search-method paper | Bayesian search depends on prior location density and imperfect detection; failed search updates location only conditional on coverage/sensor detectability | Methodological precedent, not an Earhart-specific posterior |
| E-011 | JSBSim official reference | Open-source flight-dynamics engine | Supports 6-DoF batch modeling | No validated NR16020 aircraft configuration supplied by the simulator |

### Direct links / provenance for initial ledger
- E-001 https://www.archives.gov/news/topics/earhart ; https://www.archives.gov/research/ameliaearhart
- E-002 https://tighar.org/Projects/Earhart/Archives/Documents/Chater_Report.html
- E-003 https://tighar.org/Projects/Earhart/Archives/Documents/Collopy_Letter.html
- E-004 https://tighar.org/Projects/Earhart/Archives/Documents/Kelly_Johnson.html
- E-006 https://tighar.org/Projects/Earhart/Archives/Research/ResearchPapers/Brandenburg/RDFResearch/DFpaper.htm
- E-007 https://www.prnewswire.com/news-releases/nauticos-reveals-breakthrough-data-and-announces-new-expedition-to-locate-amelia-earharts-plane-302533626.html
- E-008 https://www.purdue.edu/newsroom/2026/Q4/search-for-amelia-earharts-plane-continues-after-taraia-object-expedition-on-nikumaroro-rules-out-latest-hypothesis/
- E-009 https://psl.noaa.gov/data/20thC_Rean/index.html
- E-010 https://doi.org/10.1111/gean.12342
- E-011 https://jsbsim-team.github.io/jsbsim-reference-manual/
- Further TIGHAR research index (hypothesis-originated analyses, not neutral base observations): https://tighar.org/Projects/Earhart/Archives/Research/ResearchPapers/researchlist.html

**Rights/provenance:** Link to TIGHAR transcriptions, do not mirror their copyrighted documents without permission; seek original archival scans. Capture retrieval date, publisher, original date, scan/transcription status, original time notation, location uncertainty, document fingerprint/checksum when licensed copy obtained.

## Independent hypotheses (not forced destinations)

- **H0 — Howland-vicinity ocean loss:** approach likely reached Howland vicinity; inability to fix, locate or reach land and finite fuel imply offshore loss. Unknown crash coordinates and uncertain search-detection coverage.
- **H1 — Continuing southeast / landfall possibility:** route along a possible 157/337 line toward Phoenix Islands including Nikumaroro; evaluate required heading, extra range, reef geometry, visibility, radio reports and physical feasibility. No asserted landfall.
- **H2 — Off-track alternative:** navigation/wind/communications variance yields other reachable coordinates, including outside main named hypotheses. Preserve broad prior support where evidence permits.
- **H3 — Aircraft/communications anomaly variants:** mechanical, navigation, radio, or visibility-system issues as *conditional mechanisms* across destinations. Maintenance fixes or humidity correlation alone are not proof of failure.

No predetermined outcome percentages. Planned success is not itself evidence for a numerical success prior; reaching Howland vicinity and locating its landing strip are separate outcomes. All scenarios should permit safe arrival when constraints support it.

## Model architecture

1. **Evidence and observation ledger:** typed observations with provenance, UTC conversion + retained native timestamps, confidence band Known/Strongly Supported/Inferred/Speculative, original coordinates, dependencies and contradictions.
2. **Performance and flight dynamics:** historical NR16020 mass, fuel-tank configuration, power settings, fuel flow, climb/cruise airspeed, density altitude, propeller/engine curves. Parameter uncertainty. Calibrate simple fuel/kinematics first; build a validated JSBSim 6-DoF model only if sufficient data permits.
3. **Environment:** 1937 observed surface reports + NOAA 20CR ensemble; separate present-day weather replay using appropriately timestamped live/forecast APIs. No conflation of present-time 'what if' with historical reconstruction.
4. **Navigation and radio:** celestial/dead reckoning drift, chronometer errors, radio frequency, direction finding, source attribution, visibility and acquisition. Mask uncertain post-loss transmissions until separately evaluated.
5. **Decision opportunity detector:** flags where crosswinds, squalls, visibility or fuel thresholds plausibly create decisions; **never imputes an undocumented actual human decision**. Alternative controls may be run as labeled counterfactual branches.
6. **Termination and wreck location:** distinguish landing, fuel exhaustion, ditching, potential island landing; sinking/ocean currents/debris movement separate, with bathymetry and post-impact uncertainty.
7. **Survey/detection model:** 1937 search effort and later sonar surveys as georeferenced observation coverage, not a universal empty-region mask; express probability of detecting target under given sensor, depth, relief and search settings.
8. **MZ WORLDS and MZCAM:** renderer and observation recorder read state; do not change scientific states to generate drama. Cockpit, wing, pursuit, distant map cameras optional. MZTV displays source-of-truth uncertainty and outcome labels.

## Preregistered independent reconstruction

- R0: Archive inventory + evidence map + legal access status, checksum every legally acquired source; normalize coordinates, clocks, fuel units.
- R1: Fit independent airframe/fuel baseline to **known flight legs**, holding out at least one leg whose outcome/fuel records support independent evaluation. If data lack detail, report unverifiable calibration rather than pretending.
- R2: Freeze code revision, parameters, prior distributions, random seeds, input records, timestamp format, evaluation plan, missing-data assumptions, planned number of trials and input manifest SHA-256.
- R3: Run initial synthetic feasibility tests and falsification cases; then historical 1937 model using archived/ensemble weather. Preserve runs, diagnostics, rejected scenarios and all outputs (not just favorable ones).
- R4: Only **after freeze**, unlock external researchers' prediction shapes, region coordinates and chosen constraints. Named hypotheses are already known to the team, so strict cognitive blinding is impossible; minimize numeric leakage by sealing geographic benchmarks and using independent reviewers.
- R5: Score physical agreement and constraint coverage, distinguish whether comparison groups share evidence, and issue convergence/divergence reasons plus failed attempts.
- R6: Adversarial replication: perturb one assumption at a time and jointly; rerun with alternate plausible priors, observation weight, fuel-flow assumptions, signal-credibility models, search detection probabilities, and historical weather ensemble members.
- R7: Return signed reproducible build manifest, tests and explicit uncertainty; do not claim location discovery absent independent observational confirmation.

## Comparison classes and metrics

- **Class A: primary-observation agreement:** Does a model reproduce dated position, altitude, wind, radio and fuel observations within their source bounds? Report timestamp normalization and conflict logs.
- **Class B: model-output comparison:** Only when numerical outputs/polygons are accessible, compare distributions on the same equal-area grid, with shared coordinate datum, grid resolution, altitude/time scope, and sampling basis. Possible metrics: area overlap/Jaccard for explicitly defined contours, spatial divergence such as Jensen–Shannon between normalized densities, containment of independent held-out observations. Metrics uncomputed until data exist.
- **Class C: assumed-reasoning overlap:** Draw dependency graph of shared fuel schedules, radio logs, signal classification, winds, and navigation assumptions. Convergence with high shared input dependence is *not independent corroboration*.
- **Class D: failed searches:** Update probabilities using P(no detection | target in area, search method, coverage), including missed detections and uncertain survey footprints. A searched location is not automatically ruled out.
- **Class E: non-reproducible external claims:** Nauticos press releases / unpublished coordinates; note directional consistency only and seek a raw-data/methods release. No invented comparison accuracy.

**No scientific likelihood for wreckage location currently exists from HARIL.** Any current browser 'outcome' distribution is synthetic demonstrator output, not a posterior over real wreck coordinates.

## Adversarial checks

1. *Common-source contamination:* same Itasca radio messages yield similar output despite different simulation methods; independently check observation selection.
2. *False-weather precision:* a reanalysis ensemble may suggest broad wind trends, but not a local squall encounter. Perturb weather and compare 1937 reports.
3. *Fuel overconfidence:* historical engineer schedule is not actual measured July fuel flow; inspect test evidence, load, mixture and route.
4. *Radio misidentification:* disputed post-loss signals could originate elsewhere; test with/out signal subset by provenance and criteria.
5. *Search-area fallacy:* incomplete or low-detection sonar searches cannot exclude all wreckage in a polygon.
6. *Success-rate gaming:* don't tune model until it 'mostly succeeds'; test independently against known flight outcomes and honest physical feasibility.
7. *Hindsight pilot decisions:* flags indicate opportunities, not observed choices. Only replay documented transmissions and observed states as known.
8. *Visualization persuasion:* visually vivid 3D scenes must be labeled reconstruction, and cameras must not strengthen inferred evidence.

## Proposed acceptance criteria

**Gate G0 — sources:** NARA original archive list with at least one inspected primary facsimile; two contemporary Lae accounts reconciled; source rights/provenance ledger; contradictory altitudes/times recorded rather than merged.
**Gate G1 — reproducibility:** stable environment, immutable input manifest, fixed-seed deterministic rerun with checksum-identical core outputs (allow declared numerical tolerance for platforms).
**Gate G2 — performance:** held-out prior-leg reconstruction measures timing and fuel error with reported uncertainty, and safety/arrival vs navigational acquisition distinction; if held-out measurements unavailable mark NO VALIDATION.
**Gate G3 — environmental honesty:** document raw 1937 observations vs NOAA ensemble reconstructions; compare wind/pressure where overlap exists; don't infer individual squall cells at 75km.
**Gate G4 — external comparison:** at least two different-source models/hypotheses independently reviewed and scored by model type and data availability; pre/post comparison protocol frozen.
**Gate G5 — sensitivity:** ranking stability reported under weather, fuel, radio and navigation perturbations. Never suppress sensitivity scenarios showing uncertainty.
**Gate G6 — visual independence:** MZTV OBS / MZCAM views subscribe to model outputs, no reverse influence; source and confidence visible in HUD.
**Gate G7 — release:** human interpretation and editorial approval, imagery rights, no 'wreck found' claim unless externally confirmed.

## HARIL Δ / Return

**Δ (method):** shift from 'an airplane goes missing each run' to 'test an achievable flight; distinguish safe arrival, route completion, island acquisition, fuel endurance, and rare conditional anomalies'. Independent comparison is a second-stage inference audit, not a target for fitting.

**Δ (systems):** MZ WORLDS models independent entities and physical constraints; MZTV broadcasts research events; MZCAM records unbiased routine and exceptional states; MZ DOC may later assemble verifiable evidence-linked accounts.

**Δ (research):** a reusable provenance-centered framework for historical event reconstructions and explanation-of-convergence studies. Transferable to WARREN, geographic reconstructions and documentary research. Human determines significance.

## Explicit current status / next work

- **Adopted:** protocol, scope, uncertainty rules, acceptance gates and research direction.
- **Verified:** published source inventory and methodological prior art cited above.
- **Not done:** new historical datasets ingested; physical Electra digital twin; real historic weather integration; new independently calibrated flight runs; real sonar coverage audit; original NARA files downloaded; third-party numerical predictions compared; actual agent dispatch; radio/telephone service integration.
- **Next actionable cycle:** (1) Primary Itasca log and Chater facsimile acquisition, (2) fuel/leg calibration table, (3) NOAA 1937 subset with native ensemble spread, (4) independent run package and freeze, (5) comparator evidence packet and discrepancy report. No extra-cost agent invocation without existing HARIL approval gates.

Prepared 2026-10-20 · MZ.GPT · preliminary investigative HDD dossier; it does **not** establish Earhart's fate.
