# FIELD ENGINE 001

**Procedural OBAS Spatial Instrument · 0.2.0 · Resonant material**

[Play on GitHub Pages](https://www.matchzimmerman.com/field-engine-001/)

A light, continuous surface rises into a folded body of blue lines. A gesture loads the material, sends waves through its neighbors, and leaves an orange trace. The same events excite spatially located, synthesized tones. There are no imported models, textures, recordings, fonts, or CDN dependencies. Three.js is the only runtime dependency.

## Start here

1. Choose **Start sound**. A brief contact and release demonstrates both sound and movement.
2. **Press and hold** the blue material. It bends under the contact.
3. **Drag** to draw a crease and a trail of tones. **Release** to hear a higher resonant response while the waves continue.
4. Try **Pressure** for longer ringing, then **Rupture** for stressed seams and metallic sounds.

The geometry can be played with sound off. **Start sound** is speaker output; **Let an input play**, inside **Tune the field**, is optional microphone/pulse input. They are separate controls. Start sound needs a click because browsers restrict unprompted audio. The output uses an AudioWorklet, so use HTTPS or localhost.

| Control | What it changes |
| --- | --- |
| CALM | Softer, more heavily damped material; short, rounded tones; faster trace decay. |
| PRESSURE | Higher tension and less damping; waves travel faster and ring longer. |
| RUPTURE | Stress weakens neighboring bonds. Damaged regions open short seams, lift fragments, and excite inharmonic tones. Damage gradually heals. |
| Volume / Mute sound | Speaker output only. No microphone permission is needed to play. |
| Motion intensity | Strength and speed of the field's autonomous breathing. At zero, gestures still work. |
| Field density | Line frequency and number of fragments; no topology reallocation. |
| Let an input play | Rising input energy generates localized strikes. Pulse is 72 BPM; microphone uses a local RMS envelope. Output is audible when sound is on. |
| Pause | Freezes the field, clears contacts and stops sound. Resume continues the material; Start sound also resumes it. |
| Reset | Clears displacement, velocity, memory, damage and contacts; restores CALM and defaults; stops sound and microphone input. |

Up to five touches are supported. Compatible pens supply pressure. Keyboard: **1–3** select modes and **Space** pauses. Focus the canvas, use **arrows** to move the visible contact marker, and hold **Enter** to press. Pitch rises toward the back of the field; stereo position follows left/right. Release sounds a fifth above the contact tone. Orange means recent stress; it fades after the gesture.

## Setup and run

Use **Node 22.18 or later** and npm. From this `project/` directory:

```bash
npm ci
npm run dev
```

Open Vite's printed address, normally `http://localhost:5173`. Do not double-click the HTML file; modules need an HTTP server. The material starts paused when reduced motion is requested. Choosing Resume or Start sound opts into motion.

```bash
npm test
npm run build
npm run verify:audio
npm run preview
```

`build` includes strict TypeScript checking and generates `dist/`. `verify:audio` executes the actual bundled audio worklet offline, confirms nonzero stereo samples and bounded output, then checks silent reset. For phone testing, use the deployed HTTPS address: ordinary network HTTP does not provide the secure context required for AudioWorklet or microphone input.

## Architecture

The initial folded shape is procedural. Its response is a persistent spring lattice with displacement, velocity, a fading stress trace and local damage. The simulation is separate from render topology, so it can change without rewriting the mesh or UI. The same excitation events reach the material and sound; audio synthesis runs independently of rendering in the audio worklet.

```text
project/
├── index.html
├── package.json / package-lock.json
├── tsconfig.json / vite.config.ts
├── .github/workflows/deploy.yml
├── scripts/
│   ├── stage-pages.mjs
│   └── verify-audio-build.mjs
├── src/
│   ├── main.ts
│   ├── styles.css
│   ├── engine/
│   │   ├── FieldEngine.ts       lifecycle and system coordination
│   │   ├── scene.ts             renderer, camera, resize and resolution
│   │   ├── geometry.ts          generated surface and instanced fragments
│   │   ├── materials.ts         material-space lines, traces and seams
│   │   ├── behavior.ts          procedural rest form and lattice sampling
│   │   ├── material.ts          fixed-step spring lattice, memory, damage
│   │   ├── interaction.ts       touch, pen, pointer and keyboard gestures
│   │   ├── modes.ts             interpolated material parameters
│   │   ├── audio.ts             optional microphone / pulse input
│   │   ├── sound.ts             output activation, gain and cleanup
│   │   ├── sound-mapping.ts     spatial gesture → modal excitation
│   │   ├── resonator.ts         pure, bounded polyphonic DSP
│   │   ├── sound.worklet.ts     audio-thread processor
│   │   └── types.ts            shared contracts
│   └── ui/controls.ts
└── tests/
    ├── field.test.ts
    ├── material.test.ts
    └── sound.test.ts
```

`FieldEngine` owns scheduling, reset and disposal. `InteractionSystem` ray-picks **rest coordinates** from the deformed mesh's UVs so a gesture follows the material. `MaterialField` integrates at 120 Hz, with pinned borders and an absorbing edge region. Surface vertices and attached fragments sample the same lattice. A derivative-antialiased shader draws blue material lines and orange stress traces directly from code.

Pressure applies a local force. Neighbor springs propagate the displacement, and restoring force returns it toward the rest shape. In Rupture, high strain grows a bounded damage value that reduces bond stiffness and emits fracture events. The shader opens local seams where damage is high. This is an expressive height-field model: it does not simulate detached, colliding cloth or physically exact fracture.

`ResonatorBank` is a modal synthesizer with twelve voices and four decaying partials per voice. Each contact, drag excitation, release, pulse or fracture selects a spatial pitch, pan and timbre. The worklet runs this same DSP at the audio sample rate; it does not stretch the low-frequency simulation into an audio waveform. Smooth output saturation bounds simultaneous strikes. The volume control applies a smoothed master gain. No audible loop or background drone runs automatically.

## Build plan completed

1. Retain the procedural surface, minimal stack and GitHub Pages delivery.
2. Add a fixed-step lattice with local force, neighbor propagation, momentum and absorbing edges.
3. Add stress memory, damage, weakened bonds and visible local seams.
4. Generate contact/drag/release/fracture events and map them to polyphonic spatial synthesis.
5. Put sound activation and playing instructions on the first screen; keep optional input and tuning behind one disclosure.
6. Check propagation, release, memory decay, timestep consistency, damage, audio samples, production worklet packaging and build integrity; publish the static output.

## GitHub deployment

### This repository and custom domain

Editable source is in `field-engine-001/project/`; production files are one directory above it. From `project/`:

```bash
npm ci
npm test
npm run build
npm run verify:audio
node scripts/stage-pages.mjs
```

Commit changes underneath `field-engine-001/` and push to `main` in `matchzimmerman/matchzimmerman.github.io`. Its existing Pages deployment publishes the experiment at `https://www.matchzimmerman.com/field-engine-001/`. Preserve the root domain configuration and other experiments. The staging script retains older hashed assets for already-open tabs. `field-engine-001.zip` remains the original V1 source snapshot; the current source is in `project/`.

### A separate repository

Copy the contents of `project/` into the repository root, including its package lock and `.github/workflows/deploy.yml`. In GitHub **Settings → Pages**, choose **GitHub Actions**, then push to `main`. The supplied workflow builds and publishes `dist/`. That workflow is intentionally inactive while nested inside this existing Pages repository.

### Other static hosts

Build command: `npm ci && npm run build`. Publish directory: `dist`. Deploy all assets together, including the hashed audio worklet. Relative asset paths (`base: './'`) support subdirectories. There is one route, no backend, no environment variables and no runtime server. Use HTTPS for sound and microphone input.

## Performance and lifecycle

- Render grid: 12,769 vertices on mobile/coarse-pointer devices, 25,921 otherwise. One surface mesh plus up to 220/360 instanced fragments.
- Simulation: 65 × 65 or 81 × 81 nodes, separate from the render grid, stepped at 120 Hz. Main-thread time is capped after slow frames; on overloaded devices simulation advances more slowly than wall time.
- Typed arrays and preallocated render objects; one coalesced ray pick per pointer per frame. No textures, shadows, postprocessing or physics dependency.
- Pixel ratio starts capped at 1.5 mobile / 1.8 desktop and falls toward 1 under sustained low frame rates.
- The audio worklet is separate from frame scheduling. Maximum twelve voices; no additional audio library.
- Hidden pages stop animation, sound and microphone capture. Audio must be re-enabled on return. Context loss also stops sound and allows graphics recovery. Navigation disposes buffers, tracks and contexts.
- Microphone data stays on the device. It is never recorded, uploaded or directly routed to speakers. Echo cancellation is requested. Its energy can excite the instrument when optional input is enabled.

## Validation and limits

Eleven Node tests cover finite geometry, reproducible reset, mode interpolation, wave propagation beyond the contact, release momentum, trace decay, fixed-step consistency, local damage, maximum simultaneous pressure, synthesized stereo samples, pitch/decay mappings, bounded polyphony and silent reset. The production-worklet check additionally executes the emitted worklet bundle and measures its output. Strict TypeScript and the optimized Vite build are required before staging.

These checks establish simulation and DSP behavior, not listening quality or device compatibility. This pass has not been visually inspected in a browser or listened to through physical phone speakers. Browser activation, microphone permissions, touch ergonomics and sustained mobile performance remain device-validation limits. There are no recordings, imported data, session persistence or exports in the instrument.

## Three extension paths

**A. LiDAR / depth input.** Add a `DepthSource` that provides a normalized height grid and confidence mask. Blend it into the procedural rest shape while retaining the same gesture lattice and sound mappings. Begin with local depth images or bounded point samples; room scans with overhangs require a point/voxel representation beyond this single-height surface.

**B. Archive-driven field.** Map actual records and stable IDs into seeded locations and local material properties. Relationships can change spring weights; record density can change tension. Let a selected record expose title and provenance. Keep mapping rules and seeds reproducible; don't imply that visual proximity proves a real relationship.

**C. Sound-performance version.** The output engine now supplies the core. Next add timestamped gesture capture, reproducible performance scores, MIDI clock/control and stereo recording. Extend `Excitation` and `mapStrike` for alternative tunings or voices. Keep input capture, sound generation and transport separate so live performance does not depend on UI frame rate.
