# MZCMG Site — Canonical Deployment

## Canonical public site

`https://matchzimmerman.com` and `https://www.matchzimmerman.com` must resolve to the root of this repository:

- Repository: `matchzimmerman/matchzimmerman.github.io`
- Branch: `main`
- Public root: `/`
- Homepage: `/index.html` (the MZCMG desktop: self-contained, with inline CSS and JS)
- Previous homepage (V1): `/site-v1/index.html`, which still uses `/site-v1.css` and `/site-v1.js`
- Custom domain file: `/CNAME`

The current MZCMG site is always the root site. Do not place an alternate landing page, system index, splash page, or project directory at `/index.html`.

## Project paths

Project-specific sites and archives live underneath the root site, for example:

- `/field-station-magpie/`
- `/non-magpie/`
- `/experiments/`

These directories may have their own visual systems, but they do not replace the MZCMG homepage.

## Deployment rule

All public homepage edits must be made on `main` in the canonical root files above. A homepage change is not considered complete until both of these are true:

1. the change exists on `main`; and
2. the change is visible at `https://www.matchzimmerman.com/`.

Always verify the live URL after a deployment before reporting that an update is finished.

## Asset/cache rule

When a major visual revision changes the stylesheet or JavaScript substantially, create a new versioned asset filename (for example `site-v2.css` / `site-v2.js`) and update `index.html` to use it. This avoids stale browser/CDN caches showing an older design.

## Current version

MZCMG DESKTOP made the homepage 28 Oct 2026, at MZ.Human's direction. It's a desktop-style interface: a looping world excerpt in the background, draggable windows, folders (WORLDS, MZTV, SONIC LAB, ARCADE, WRITING, ARCHIVE), and a pinned site to-do note. Tools open as same-site iframes. The working copy that came before it is kept at `/preview/desktop-c794b166/`.

## Previous version

V1 canonicalized 14 Sep 2026. FIELD STATION: MAGPIE is the featured homepage project. The opening practice statement is intentionally reduced in scale so documented work appears sooner in the page flow.