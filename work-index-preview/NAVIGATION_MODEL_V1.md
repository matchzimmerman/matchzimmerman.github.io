# MZCMG SITE NAVIGATION — PROPOSED V1
Status: REVIEW BRANCH ONLY. Not approved for production. 2026-10-15.

## The architectural distinction
The studio has **one navigation model** and its artworks retain **their own interaction languages**.

**Studio-level (persistent on editorial pages):** WORK · ARCHIVE · ABOUT · MZTV.
- WORK is the visual/index-first landing page (currently `/work-index-preview/`).
- ARCHIVE points to the archives section of that same index until a genuine unified archive exists.
- ABOUT points to the bottom of that index until a durable studio page exists.
- MZTV points to the established broadcast page at `/mztv/`.
- MZTV live channel stays accessible from WORK and the broadcast page.

**Collection-level (on Work Index):** WORLDS · MZTV · MOVING IMAGE · TOOLS + ARCHIVES.
Collections are browsing groupings, **not** new intermediary pages. Featured work and list items should link to the actual work or authentic archival resource.

**Project-level:** MAGPIE has one local 6-item set: Overview, World, Story, Archive, Exhibition, Artist. It should not have a second competing submenu. For other worlds/instruments: retain local controls, but add a Work Index return link on editorial index pages.

**Artwork-level:** do not inject a global navigation overlay into full-screen simulations, streaming canvases, OBS sources, AR/VR, or instruments. These may be embedded or have one minimal back link provided by an outer wrapper, but must preserve independent aesthetic and behavior. Distinguish project websites from runnable works.

## Canonical families and actual destination paths
- Work Index preview: `/work-index-preview/`
- MAGPIE: `/field-station-magpie/`; `/world.html`; `/story.html`; `/archive.html`; `/exhibition.html`; `/artist.html`.
- WARREN: `/WARREN/experience/`.
- Galway / Headland: `/MZTV/sources/bit-field-031-headland/`.
- MZTV broadcast: `/mztv/`; work collection anchored in Work Index.
- 48 PLANT: `/MZTV/sources/48-plant-002/`; specimen archive `/MZTV/sources/48-plant-archive/`.
- Moving image: `/moving-image/` (canonical public directory, not legacy `moving-image-archive` copies).
- Sonic Lab: `/sonic-lab/`.
- Historical web art: `/primitive-divisions/`, `/random-tiling-fill/`, pending fuller PRE-HARIL public catalog.
- Shop: `/shop/` preserved as commerce, **not** an artistic collection.
- Source systems at `/MZTV/sources/` remain individual playable routes; no mass redirects or renames.

## Audit
Current repository has **225 HTML entries** (includes revisions, previews, legacy tools, runnable pieces, and content pages). Navigation schemes differ:

| Surface | Found pattern | Proposed correction |
| --- | --- | --- |
| Root `/` | Work, Shop, Moving Image, Research, Archive, Field Notes, Info | Single studio-level labels, with detailed groupings inside Work |
| Work Index | Watch MZTV, Video Archive, About; category columns without anchors | Studio bar Work/Archive/About/MZTV + direct collection anchors |
| Moving Image | Work, Research, Archive, Field Notes, Info (all root fragments) | Studio bar, project page remains collection |
| Sonic Lab | Same as Moving Image | Studio bar, keep instrument collection UI |
| MZTV `/mztv/` | Header with MZCMG back link and Twitch | Change back link to Work Index; preserve broadcast/player |
| MAGPIE | Four top-level local links, plus second three-link subnav on some pages | Single 6-item project nav, and direct work-index return |
| WARREN and MZTV source pieces | Project-native controls, often no site nav | **Do not** force global nav into runtime/OBS artwork |

## Changes in this review branch
- 10 existing public editorial pages have proposed shared labels/back routes.
- MAGPIE's existing separate project subnav is consolidated into one project menu.
- Live artworks, large source scripts, the production homepage content, Shop and historical alternate previews are unchanged.
- The revised Work Index at `/work-index-preview/` is a separate public preview currently live; it is not a replacement for `/`.

## Release gates before merging
1. Have MZ.human review names, groups and which works deserve promotion.
2. Verify desktop/mobile screenshots of root, MAGPIE (all six), Moving Image, Sonic Lab and MZTV on the review branch; avoid claiming visual testing until performed.
3. Confirm all absolute and relative page targets and same-page anchors. Manual test via browser.
4. Approve future homepage swap separately; preserve canonical SEO, shop access, provenance and existing redirects.
5. After approval, migrate preview links to production canonical `/` anchors, then establish one maintained navigation manifest to prevent drift.
