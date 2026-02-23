# CLAUDE.md — matchzimmerman.github.io

This file provides context for AI assistants working in this repository.

---

## Project Overview

This is the personal portfolio and creative lab of **Match Zimmerman** — a static site deployed to GitHub Pages at [www.matchzimmerman.com](https://www.matchzimmerman.com). The repository hosts a collection of self-contained interactive web projects centered on **human-AI creative systems**, audio-visual experimentation, generative art, and the **HARIL** (Human-AI Recursive Interactive Language) framework.

The site does not use a traditional SPA framework at the root level. Most projects are standalone HTML files or small multi-file directories using vanilla HTML, CSS, and JavaScript. One sub-project (`magpie-universe-site/`) uses Next.js + Tailwind.

---

## Repository Structure

```
matchzimmerman.github.io/
├── index.html                          # Main portfolio/landing page
├── CNAME                               # Custom domain: www.matchzimmerman.com
├── 2025-candylane-bingo.html           # Standalone interactive bingo game
├── MAGPIE_bunker_ops_*.html            # Magpie operation simulation variants
├── HARIL_glyph_pad.html                # Glyph interaction tool (standalone)
│
├── haril_glossary_full_site_v17_fresh/ # Latest HARIL glossary (v17) ← current
├── haril_glossary_full_site_v16/       # HARIL glossary v16 (archived)
├── haril_interactive_site_v4/          # HARIL interactive system (v4) ← current
├── haril_interactive_site_v3/          # HARIL interactive system v3 (archived)
├── haril_interactive_site_full/        # HARIL full interactive site
│
├── HARIL_AV_Lab/                       # Audio-visual lab (SVG + Web Audio)
├── HARIL_AV_Lab_v2/                    # Audio-visual lab v2
├── HARIL_AudioGlyph_Studio_v1/         # AudioGlyph creation studio
├── HARIL_GlyphLab/                     # Glyph design laboratory
│
├── magpie-universe-site/               # Next.js + Tailwind multipage project
├── magpie-universe-static-extreme-multipage/ # Static Magpie multipage site
├── magpie-endless-shape-v1/            # Generative shape animator
├── Magpie Sites/                       # Additional Magpie configurations
├── FS Magpie Tuttle/                   # FS:Magpie audio field station
│
├── pico-sol-sys/                       # PICO-8 solar system (.p8 cartridges)
├── random-tiling-fill/                 # Generative tiling visualization
├── starfield/                          # Starfield animation
├── tidal-cycles/                       # Tidal Cycles audio experiments
├── coordinated-agreements/             # Interactive agreement tracker (4 variants)
├── emergent-humanity/                  # Interactive game/experience
├── conversational-interaction-mapping/ # Conversation mapping tool
├── primitive-divisions/                # Geometric visualization
└── infinite-gradient-crosses/          # Gradient cross animation
```

**Versioned directories:** When multiple versions of a project exist (v3, v4, v16, v17), the highest-numbered version is the current one. Older versions are kept for reference.

---

## Technology Stack

### Primary (most of the repo)
- **Vanilla HTML5 / CSS3 / JavaScript** — no build step, no transpilation
- **Canvas API** — particle systems, animations, generative graphics
- **Web Audio API** — audio synthesis, microphone input, sound reactivity
- **SVG** — vector graphics and glyph work
- **CSS Custom Properties** — runtime theming without page reload
- **JSON** — content/data files (`terms.json`, `data.json`)

### Secondary (magpie-universe-site only)
- **Next.js** — React framework with app router
- **Tailwind CSS** — utility-first CSS
- **TypeScript** — `.tsx` component files
- **Google Fonts** — IBM Plex Mono (300/400/500/700)

### Specialty
- **PICO-8** — fantasy console `.p8` cartridge files in `pico-sol-sys/`

---

## Deployment

- **Host:** GitHub Pages (automatic deployment from `master` branch)
- **Domain:** `www.matchzimmerman.com` (configured via `CNAME`)
- **Build process:** None — files are served as-is
- **No CI/CD pipelines** — changes deploy immediately on push to `master`

> Do not add GitHub Actions workflows or build tooling to the root unless explicitly requested. The static-first approach is intentional.

---

## Development Conventions

### File & Directory Naming
- HTML files: `kebab-case.html` or `UPPER_SNAKE_CASE.html` for HARIL/Magpie named files
- Directories: `kebab-case/` for most projects; `UPPER_CASE/` for lab projects (HARIL_AV_Lab, etc.)
- Versioned directories use `_v{N}` suffix: `haril_glossary_full_site_v17_fresh/`
- JavaScript/CSS filenames: `app.js`, `script.js`, `style.css` (simple, per-project)

### JavaScript Style
- **No bundler, no modules** — plain `<script>` tags or single `app.js`/`script.js` files
- **State object pattern:**
  ```js
  const state = { data: [], view: 'grid', theme: 0, notes: {} };
  ```
- **Utility aliases** used throughout:
  ```js
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => el.querySelectorAll(s);
  ```
- **Animation loops** via `requestAnimationFrame()`
- **Event-driven** interactions — no reactive framework
- Camel-case for variables and functions; descriptive names preferred

### CSS Style
- CSS custom properties for theming (defined on `:root`):
  ```css
  --bg, --fg, --accent, --accent2, --accent3
  ```
- Dark-first design — backgrounds typically near-black (`#000`, `#0b1b14`)
- Fluid typography via `clamp()`: `font-size: clamp(0.7rem, 1.5vw, 1rem)`
- Glassmorphism where appropriate: `backdrop-filter: blur(...)` + semi-transparent backgrounds
- Monospace / terminal aesthetic is the dominant design language

### HTML Structure
- Semantic elements preferred (`<nav>`, `<section>`, `<article>`, `<dialog>`)
- ARIA labels on interactive elements
- Canvas elements sized via JavaScript (device pixel ratio aware)

### Data Files
- `terms.json` — glossary entries with fields: `term`, `definition`, `tags`, `related`
- `data.json` — HARIL system data with tiers, links, telemetry, commands, prompts
- Schema normalization is written defensively; multiple field-name conventions may coexist

---

## Key Projects — Notes for Contributors

### index.html (Landing Page)
- Animated canvas particle network background
- Terminal-style typing animation
- Color palette cycling system (5 HSL-based themes)
- Embedded YouTube videos and social links
- Self-contained — do not extract shared components from it

### HARIL Glossary (haril_glossary_full_site_v17_fresh/)
- Data lives in `terms.json` (50+ terms)
- `app.js` handles: palette system, starfield, spiral animations, view routing, detail dialogs
- To add terms: edit `terms.json` only; the JS renders dynamically
- Tags in use: `recursive`, `telemetry`, `agency`, `identity`, `interface`, `system`

### HARIL Interactive System (haril_interactive_site_v4/)
- Data in `data.json` (tiers, relations, commands, prompt templates)
- `script.js`: card rendering, view modes (stack/grid), details panel, canvas particles
- To add framework content: edit `data.json`

### HARIL Audio-Visual Labs (HARIL_AV_Lab/, HARIL_AV_Lab_v2/, HARIL_AudioGlyph_Studio_v1/)
- SVG upload → registration → real-time audio reactivity
- Uses `getUserMedia` for microphone input — requires HTTPS in production
- Web Audio API: `AudioContext`, `AnalyserNode`, `OscillatorNode`

### magpie-universe-site/ (Next.js)
- This is the only project with a framework build step
- Tailwind config: `tailwind.config.js` (custom colors: `rust`, `paper`; font: IBM Plex Mono)
- App router structure: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `StaticGlitchBg` — custom background component
- To develop locally: `npm install && npm run dev` inside `magpie-universe-site/`

---

## What NOT to Do

- **Do not add a build system to the root** — the repo is intentionally static
- **Do not introduce npm dependencies** outside of `magpie-universe-site/`
- **Do not create shared component libraries** — each project is self-contained by design
- **Do not rename versioned directories** — the `_v{N}` naming is part of the project history
- **Do not modify archived versions** (v3, v16, etc.) unless explicitly asked; work on the highest-numbered version
- **Do not add `.eslintrc`, `.prettierrc`, or similar config files** at root unless requested
- **Do not add CI/CD** (`.github/workflows/`) unless explicitly requested

---

## Common Tasks

### Add a new standalone project
1. Create a new directory: `my-project-name/`
2. Add `index.html` (and `style.css`, `app.js` as needed)
3. Link from `index.html` (the landing page) if it should be publicly surfaced
4. No build step required — push and it deploys

### Add a HARIL glossary term
1. Open `haril_glossary_full_site_v17_fresh/terms.json`
2. Append an entry following the existing schema: `{ "term": "...", "definition": "...", "tags": [...], "related": [...] }`
3. No code changes needed

### Update the landing page
- Edit `index.html` directly
- The palette system, animations, and layout are all inline in that single file

### Work on the Next.js project
```bash
cd magpie-universe-site
npm install
npm run dev      # development server
npm run build    # production build
```

---

## Git Workflow

- **Production branch:** `master` (auto-deploys to GitHub Pages)
- **Feature branches:** Use `claude/...` prefix for AI-assisted work
- Commit messages should be descriptive; no enforced convention
- No pre-commit hooks or linting gates
- `.gitignore` only excludes `.DS_Store`

---

## Contact

- **Author:** Match Zimmerman
- **Email:** mz@matchzimmerman.com
- **Site:** www.matchzimmerman.com
