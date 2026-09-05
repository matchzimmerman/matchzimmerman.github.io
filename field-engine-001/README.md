# FIELD ENGINE 001 — Procedural OBAS Spatial Instrument

[Open the instrument](https://www.matchzimmerman.com/field-engine-001/) · [Download the source](./field-engine-001.zip)

This directory publishes the complete V1 prototype through the existing GitHub Pages site.

- `index.html` and `assets/`: production output from Vite.
- `project/`: editable TypeScript source, tests, package lock, and full project documentation.
- `field-engine-001.zip`: portable source package for the original V1 release.

## Local development

Use Node 22.18 or newer:

```bash
cd field-engine-001/project
npm ci
npm run dev
```

## Update the GitHub Pages build

From the `project/` directory:

```bash
npm test
npm run build
node scripts/stage-pages.mjs
```

Commit the changed files beneath `field-engine-001/` and push them to the repository's `main` branch. The existing GitHub Pages deployment publishes this directory alongside the other experiments. `project/.github/workflows/deploy.yml` is the standalone-repository workflow; it is inactive at this nested location.

The source ZIP preserves the original V1 release. Current editable source lives in `project/`.

See [project/README.md](./project/README.md) for the architecture, controls, performance notes, validation limits, and LiDAR, archive-data, and sound-performance extension plans.
