# MZTV · FIELD ENGINE 003 · WATERSHED

A sibling of FIELD ENGINE 002 — same data, same SOUNDING renderer and dub environment, different question.
002 asks what one event leaves behind. 003 asks what the **pattern** leaves behind.

A rolling year of public records flagged as shootings is replayed in order. Every record lands with the same force. Where records recur, that force accumulates: the ground subsides into basins, basins slowly widen and merge into channels, and water collects in them. By the end of the year the terrain carries a drainage system nobody designed. It is never drawn as a map and never names a place.

## What the data does

| from the records | → | in the work |
|---|---|---|
| position | → | where the ground subsides (equal force per record; recurrence deepens) |
| time of day | → | the sun: solar time at the records' mean position (UTC + lon/15), so each event arrives at its own hour, mostly in darkness |
| date | → | season: real solar declination changes day length and sun height |
| gaps between records | → | quiet: scars heal toward their residue, the rhythm opens rests, the drone rises |
| accumulated records | → | SOUNDING rule pressure (~3 eras across a year) |

Nothing scales by severity, victims, weapon or demographics. No synthetic events: if the data link drops, the ground runs without events and retries every minute.

## System

- **Basins:** a conserved subsidence field (`bas`) is stamped by each record and diffused slowly, so basins never refill, only spread. Displayed depth is soft-saturated and its slope is kept within what SOUNDING's ray-march handles.
- **Water:** a level just below ordinary low ground, so only basins hold it. A flood era and long rain raise it; after the last record rain keeps falling into the shape the year made.
- **Camera:** pulled downhill like water, so it is drawn into the basins; the pull lets go once inside a basin, so it visits and leaves.
- **Sound:** SOUNDING's engine. Impacts are low thumps on the root, seen before heard (distance delay). No pitch is derived from the records.
- **After the year:** the world keeps running; the sun returns to SOUNDING's 38-minute orbit.

## Controls & params

`I` info · `SPACE` pause/continue replay · `R` rebuild ground + restart year · `T` force a rule transition

`?minutes=120` year length · `?days=365` window · `?hold=30` · `?loop=1` · `?audio=0` · `?info=0` · `?seed=N` · `?rate=N` · `?lines=N` · `?capture=1` (offline rendering; the replay now runs on simulation time) · `?fresh=0` (restores ground only; basins and the replay restart)

## Renderer notes (vs SOUNDING)

- Impact rings are drawn only on open ground more than 10 units from the camera, and plumb lines only beyond 8 units. Recorded events can land beside the camera; SOUNDING's random impacts never did. Without this, a ring on a wall facing the camera rendered as a solid slab.
- Shoreline ink is narrowed to water shallower than 0.14, since basin shores are gentle.

OBS: Browser Source → `https://www.matchzimmerman.com/MZTV/sources/field-engine-003-watershed/?info=0` · 1920×1080 · Control audio via OBS
