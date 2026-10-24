# ONE EDIT — Simulation model, v0.2

## What is represented

Two parallel 2D cellular fields. A **model cell** is one rendered, individually tracked unit, not a claim about the true morphology or physical arrangement of *S. cerevisiae* in an agar plate.

The state of each unit is:

| Field | Meaning |
|---|---|
| `genome` | `intact` or `disrupted` ADE2, simplification of functional status |
| `generation` | Number of descendant divisions from the initial proxy cell |
| `ancestor`, `changed` | Whether the cell is in a lineage descended from a successfully altered cell |
| `progress` | Abstract progress toward next model division |
| `pigment` | Abstract, lagged visual state, not a biochemical concentration |
| `age` | Model-beat count since proxy-cell creation or edit |
| `x`, `y` | 2D artistic layout inside the field |

Cells divide and pass `genome` and `changed` to descendants. A single pulse targets up to 4, 12, or 30 currently nearby candidate cells in the intervention field. Each attempt samples the same deliberately fictional, uncalibrated likelihood of being stable. **This numerical setting must never be interpreted as a CRISPR success rate.** The control receives no edit.

## Mechanisms modeled qualitatively

1. **ADE2 gene function:** Disruption of ADE2 removes an essential component of yeast adenine synthesis.
2. **External adenine:** When scarce, ADE2-disrupted lineages are severely growth-limited. When supplied abundantly, they grow more readily despite their altered gene state.
3. **Conditional red phenotype:** ADE2-disrupted cells may show red pigmentation with limited adenine. On abundant external adenine, the red phenotype is muted although the mutation remains. Visible pigment develops with model time lag.
4. **Incomplete reach:** An intervention may affect only a subset of cells, creating mixed lineages.
5. **Inheritance:** The altered state is passed to descendants, allowing divergence to unfold over time.
6. **Matched comparison:** Identical seeded initial fields are run in parallel until one receives a pulse.

## Currently fictional model choices

- A unit is a rendered proxy, not an exact biological cell or colony.
- Growth changes use arbitrary normalized increments, not literature doubling times.
- The editing pulse is an abstraction of delivery, targeting, and repair; **it does not simulate actual guide-RNA design, double-strand-break processing, homology-directed repair, or NHEJ.**
- The two-choice `Disrupt ADE2` / `Restore ADE2` scenarios begin with different baseline genotypes. Restoration here means assigning functional status, not simulating an actual precise repair operation.
- The red value is a visual parameter (0–1), not a quantitative optical measurement.
- Ambient sound is musical composition derived from model states, not a recording or molecular sonification from data.
- There is no off-target model, evolutionary mutation beyond the intentional change, transport, nutrient gradients, cell death, ploidy, mating, or real spatial resource diffusion.

## Implementation and repeatability

A deterministic seeded PRNG creates matched starting fields. Each run records seed, scenario, adenine setting, edit action, model beats, basic counts and an abbreviated genotype-state trace. Use **Export Observation** to save a JSON snapshot. This output allows independent interpretation of a run but is not a laboratory dataset.

## Scientific sources

- Shortt C., Krippaehne E., Wasko B. (2023): https://pmc.ncbi.nlm.nih.gov/articles/PMC9941855/
- 2021 genetics and CRISPR laboratory module: https://pmc.ncbi.nlm.nih.gov/articles/PMC8442027/
- 2023 CRI-SPA red phenotype and adenine conditions: https://pmc.ncbi.nlm.nih.gov/articles/PMC10516668/
- 2018 ADE2 disruption/repair: https://pubmed.ncbi.nlm.nih.gov/30311729/
- 2024 yeast-based colorimetric assay: https://www.frontiersin.org/journals/synthetic-biology/articles/10.3389/fsybi.2024.1265343/full

## v0.2 — Interpretive guidance

The experience now supplies explanations at the point of observation. A phase-sensitive field guide identifies yeast, invites cell inspection and modification, then explains why DNA function, phenotype, and environmental adenine may diverge. A magnified budding-yeast silhouette is illustrative, not microscope imagery. This does not model actual molecular Cas9 cutting or repair. The gene-function and colony-color relationship is sourced; pulse success probability, replication speed, and pigment are uncalibrated artistic choices.


## Event evidence and ancestry

Cells store a stable `parent` ID. `ancestor` is the directly edited cell that began an altered branch, not necessarily a starting cell. Inherited `changed` records intervention history independently of `genome` and pigment; restoring ADE2 also produces an altered lineage. Family rings follow a common starting cell, including relatives that did not receive an edit. Edit-history diamonds follow `changed` only.

The editing PRNG is separate from the growth PRNG so a failed pulse does not itself consume growth randomness and create apparent divergence. Once growth diverges, stochastic geometry can diverge too; counts are qualitative outcomes, not measurements of biological fitness.

The detector stores a beat, relevant cell, and evidence snapshot per observation. Inheritance requires an actual daughter with an edited ancestor; redness/paleness use fictional visual thresholds; restoration fading compares a directly restored cell with its pigment at the pulse. Nutrient observations compare the same disrupted cell with its state at the most recent environment change, require unchanged gene function and an appropriate directional pigment change. They do not infer environmental causation from a changing population average. These checks illustrate the model's relationships, not independent experimental proof. Observations are deduplicated by event type (environment events also by change beat and setting).

Both fields stop division at 760 cells independently; pigment remains responsive. Saturation is explicitly announced for each field and should never be read as biological arrest or competition. There is no death or continuous turnover. Initial adenine and scenario must be restored when replaying a run; seed alone determines neither intervention timing nor visitor choices. The capture interface advances integer beats and returns copied state; it does not expose mutable simulation internals.
