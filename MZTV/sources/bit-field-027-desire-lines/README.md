# MZTV · BIT FIELD 027 · DESIRE LINES

*HARIL specimen · one of two independent responses to the same conversation-driven build brief (2026-10-06); the other is BIT FIELD 026 · INFLUENCE FIELD. This build was made without opening it.*

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-027-desire-lines/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` (clean artwork) · `?fresh=1` (forget everything) · `?audio=0` · `?seed=N` · `?rate=N` (logic N× faster, testing) · `?lines=N` (internal resolution, default 360) · `?ff=H` (fast-forward, testing) · `?capture=1`
**Keys:** **I** info · **M** mute · **C** human correction · **A** human ratification (both logged as human interventions)

## Concept
A desire line is a path worn across a lawn by people walking where they actually want to go. Nobody draws it; it is what repeated influence leaves behind.

The piece reads the conversations in which it was designed, one sentence at a time, and releases each sentence into a single ground as walkers:
- **Human sentences** become a few heavy walkers that cut new paths.
- **Machine sentences** become many light walkers that follow paths already cut, and elaborate them.
- **The relayed brief** (written by the human and a machine agent together) becomes walkers of both kinds at once.

Every recurring concept has a fixed home in the field, derived from the word itself. A sentence's walkers travel from wherever the reading last stood, through every concept the sentence touches. Concepts that keep being said together wear a channel between their homes. Over hours those channels settle into sediment, which is the ground's memory.

No node, word or link is ever drawn. The structure of influence exists only as worn ground, and as the sound that ground makes.

## What conversational material was used (`data/corpus.txt`)
33 turns, 254 sentences, 3,702 words.

| Source | Turns | What it is |
|---|---|---|
| Archived chat "BIT FIELD 014 incident system", 2026-10-05 → 06 | 19 | RESIDUE GROOVE v1–v5 and SCORE ENGINE 001–003. The session in which the human named the "Complex System of Influence". |
| Archived chat "F1 telemetry music composition", 2026-10-06 | 2 | The next branch idea and its reply. |
| Build brief, 2026-10-06 | 11 | The brief, split at its own section headings. |
| This build session | 1 | The builder's opening reading of the brief: the build's first machine turn. |

Every unit is labelled by basis:
- **verbatim:** the exact words.
- **doc:** a program sheet the machine wrote in that turn.
- **summary:** the archive only kept a model-written summary of that turn. This applies to 4 turns: rg01, rg02, rg03 and rg18.

**Not included:** the conversation that produced the brief. It is outside this archive. The brief itself is its only trace here.

## What is measured (`data/extract.py`, deterministic, no model or API)
**Per sentence:**
- word count;
- question marks;
- lexicon counts for constraint (*must, never, only, keep, avoid…*), correction (*too, remove, instead, cheesy, repetitive, fixed…*), ratification (*great, good stuff, sounds great, grasped…*), openness (*maybe, could, interesting, I'd be down…*), exactness (numbers, dB, Hz, bpm, L30), meta/system talk (*system, influence, data, arbitrary, archive, recursive…*) and creative talk (*groove, pads, echo, colour, field…*);
- which recurring concepts it touches;
- which concepts appear for the first time.

**Per turn:**
- the rates above, normalised to the corpus's own 5th–95th percentiles;
- **lock:** whether the next turn, by the other party, ratifies it;
- **density:** short turns between long ones read as rapid exchange.

**Across the corpus:**
- the 28 recurring concepts (content words in ≥3 turns, ranked by spread × frequency), with who first said each one;
- dormant returns: a concept absent for ≥5 turns, then back (34 found);
- TF-IDF similarity between all turns;
- **bridges:** strongly similar turns far apart or from different sources (9 found). The strongest is the human's "Complex System of Influence" turn (rg12) and the brief's call for sound and image to share causes (br09).

`data/provenance.txt` lists every value.

**Macro (`data/lineage.json`):** the MZTV lineage visible to this project, SUBSTRATE (2026-09-23) → this piece. That is 11 epochs, each with:
- its date and version count;
- its key/mode;
- **the human corrections recorded for it**, e.g. RESIDUE GROOVE: flashing · the word dead · droning · cheesy and repetitive · pads too clean and forward · echo roar.

## Signals → what they control (one cause, both media)
| Signal | Field | Sound |
|---|---|---|
| Speaker (H / M / brief) | heavy cutters / abundant followers / both | low FM statement / soft plucks that elaborate / dark dyad |
| Concepts touched | where walkers go: a path through their homes | the pitches of the phrase (each concept has a degree, from where and by whom it was first said) |
| Constraint | sensor angle narrows (52° → 12°): paths straighten, variance drops | pitch set narrows from 7 degrees to 3 |
| Openness | walkers wander | swing deepens; the next reading is chosen more loosely |
| Exactness | less diffusion, crisper paths | sharper attacks, tighter delay division |
| Correction | cutters drive through the densest machine channels and leave repellent; the ground shears | dub-out: kick and statement thrown into the echo on the next bar, then only tails; tension loads |
| Ratification / lock | trails stop evaporating: paths harden | pads swell and the chord holds for 8 bars |
| Bridge | the two currents sense each other's trails; a stream crosses between the bridged turns' concepts | every voice is also routed into the opposite side of the echo |
| Meta talk | the sediment (the archive) becomes visible | drone filter and room open |
| Exchange density | compression: tighter diffusion | tempo from −10% to +14% |
| Sparse exchange | longer rests between turns | kick and knock drop out |
| New concept | an outward bloom at its home | a bell on its degree |
| Return of a dormant concept | old sediment at its home resurfaces as live trail | its motif replays, transformed |
| Residue (sediment total) | machine walkers retrieve along old ground; baseline activity grows | drone level |

## Timescales
- **Seconds:** each sentence is a gesture of about 3–20 s: walkers, phrase, Euclidean onsets.
- **Minutes:** turns alternate with rests. Corrections act at most once per 90 s. Bridges decay over about 25 s, ratification over about 2 minutes.
- **Hours:**
  - Sediment fills over about 30–60 minutes on walked paths and fades with a half-life of about 4.3 h.
  - Epochs last about 2.5–4.5 h. Tension accumulates with stability and with corrections, scaled by how much that epoch was corrected in life. At 1 it ruptures: shear, a reverse swell for 2 bars, then a new key, meter, tempo, palette and erosion of the sediment.
- **Days:** the lineage is walked in order and typically completes in about 30–40 h. When the lineage reaches INFLUENCE, the piece has reached its own epoch. After that, dormant epochs return, weighted by what the ground still remembers.

## Memory and how repetition is prevented
- **First reading:** the conversation in order (about 40–50 min).
- **After that**, the next turn is chosen by:
  - similarity to the current turn;
  - overlap with what the sediment currently holds (residency);
  - neglect: least-read turns;
  - affinity with the current epoch's terms;
  - bridges, which double the weight;
  - alternation of speaker.

  Recent turns are suppressed. Readings are often partial spans that start at the sentence the ground remembers most.
- **Retakes:** in epochs that took many versions in life, a span is sometimes said again ("let me try that shot again").
- **Motifs:** each concept's motif changes on every return (transposed, inverted, reversed, extended), so a returning idea is migrated, never replayed.

The reading changes the ground, and the ground changes the reading. Over 48 h each turn is read roughly 100–150 times, in different company, at different lengths, in different keys, over different ground.

Everything persists to localStorage every 60 s and on unload: reader, visits, epoch, tension, motifs, dormancy, log and the sediment map. A reloaded OBS source resumes.

## Where interpretation entered
- The lexicons that define constraint, correction, ratification and the rest.
- The choice of 28 concepts.
- Treating the brief as one voice of shared authorship.
- The walker metaphor itself.
- Mapping each signal to a behaviour.
- The macro packet's curation of corrections from chat summaries.
- Palettes per epoch.

The measurements are mechanical. Their meaning is authored.

## Limitations
- The corpus is small (3,702 words), so over 48 h every turn recurs many times. Variation comes from spans, epochs, ground and walk order, not new text.
- Four turns are summaries rather than verbatim.
- The corpus has no timestamps, so "pacing" is approximated from turn-length contrast.
- Lexicon counting misreads some sentences: a "too" can be a correction or not.
- The macro layer is a bounded packet of 11 pieces, not a live archive query.
- `?ff` fast-forward approximates the field coarsely and is for testing only.

## Engineering
Single file. CPU walkers (up to 14k) on a half-resolution grid, rendered as four inks with ordered dither and bilinear sampling, so forms are rounded rather than blocky.

**Flash safety:** every display value is slew-limited (≤3% per frame, so a full swing takes ≥1.1 s). Measured during a forced rupture, correction, return and bridge at once: at most 6.2% of pixels changed by more than 10% in any 250 ms.

**Audio:**
- one AudioContext, one-shot voices with envelopes that disconnect themselves;
- ping-pong echo with a unity-gain tanh in the loop (feedback ≤ 0.78);
- lookahead scheduler that skips after stalls;
- watchdog: resume, recreate on close or stall, rebuild on NaN or 20 s silence, refresh every 3 h.

**Field:** a NaN-poisoned field regrows from the sediment.

**Tested headless:**
- reload resumes;
- suspend and close both recover;
- 48 h runs across three seeds walk distinct epoch sequences.

**Master spectrum:**

| Band | Level vs loudest |
|---|---|
| 20–250 Hz | 0 to −1 dB |
| 250–1k | −3.6 dB |
| 1–2k | −21 dB |
| 2–5k | −40 dB |
| >5k | −63 dB |

No clicks; peak −3.6 dBFS.

`data/` holds the corpus, lineage, extractor, packet and provenance report. Rebuild with `python3 data/extract.py`, then inline `packet.json` into `index.html`.
