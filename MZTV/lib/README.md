# MZTV/lib

Shared modules that MZTV pieces load with a relative script tag (`<script src="../../lib/NAME.js"></script>`).

## mzcam.js · the drone camera crew (v1.0.0)

The crew, director and surveillance bay from 48 PLANT, extracted so any piece can attach them. First host: BIT FIELD 028 · TRACKSIDE. 48 PLANT itself still carries its own inline copy; migrating it is a later step (Specimen 002 was live while this was extracted).

The crew is presentation only. It never changes the system it films.

### What it does
- **Flight:** drones fly to marks off air. For long hops they climb to cruise altitude, travel, then descend. Accel-limited, so moves are smooth. They slide out of the live lens while travelling.
- **Aim:** a critically damped spring on the look point and the lens angle. A stiff spring (`pan: 7–11`) gives quick whip pans; a soft one (`pan: 0.6–2`) gives slow drift.
- **Direction:** the director cuts only to a drone that is on its mark and ready. Each shot holds between `minHold` and `maxHold`. A shot whose `want` beats the live one by 1 or more can interrupt it. An optional `gate(t)` lets the host allow cuts only on certain moments (TRACKSIDE cuts on the 16th note).
- **The bay:** one live monitor per drone (round-robin rendered, cheap) and a plan with trails and view cones.
- **Drones on screen:** `crew.drawDrone(ctx, P, d)` draws each drone as a small cube with a lens and a tally light, so they appear in each other's shots.

### Host contract
```js
const crew = new MZCam.Crew({ drones: [{ name: 'CAM 1', role: 'track', col: '#f4dc2a' }, ...],
  speed: 150, accel: 90, cruise: 45, size: 2.2, gate: t => onTheBeat(t), onCut: (from, to) => {} });
crew.assign(drone, shot);   // whenever a drone is free: crew.free() or shot.done()
crew.update(dt, t);         // every frame
const P = MZCam.projector(crew.liveDrone.cam, W, H);  // P.proj, P.poly (near-clipped), P.seg, P.horizon, P.px
```
A **shot** is a plain object:

| field | meaning |
|---|---|
| `mark` | `{pos}` or `(t, d, crew) => {pos}`: fixed position; the drone holds still on air |
| `pose` | `(t, d, crew) => {pos}`: follow position; the drone moves with it on air (chase, orbit) |
| `aim` | `(t, d, crew) => {look, fov}`: what the lens wants to point at |
| `pan` | spring response in rad/s (higher = quicker pans) |
| `ready` | `() => bool`: extra readiness beyond being on the mark |
| `want` | `() => number`: how much the director wants this shot now |
| `done` | `() => bool`: the shot is finished |
| `minHold`, `maxHold`, `minPrep` | seconds |
| `start`, `onAir`, `release` | hooks |
| `label` | shown in the bay and the HUD |

`MZCam` also exports small vector helpers (`V, add, sub, mul, dot, cross, len, norm, lerp, clamp`) and `lens(pos, look, fov)`.
