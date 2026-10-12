# MZCMG site — inquiry-led V3 design prototype

**Status:** working design prototype; not approved as the production homepage.

**Preview:** https://www.matchzimmerman.com/site-inquiry-preview/  
**Previous V2 for comparison:** https://www.matchzimmerman.com/site-v2-preview/

## Purpose

Reconcile the 2026-10-09 approach (“Experience first. Inquiry throughout. Evidence beneath.”) with the 2026-10-12 editorial emphasis on two major bodies of work: MZTV and FIELD STATION: MAGPIE.

The public-facing language addresses MZCMG in third person and does not personify machines or use “collaboration” as the practice's organizing term.

## Public path architecture

- `index.html` — homepage with live MZTV slot, project entrances, two levels of inquiry, interactive research lenses, and clickable MZCam lineage evidence.
- `mztv.html` — artwork experience, individual MZTV inquiry, research-practice inquiry, and records.
- `magpie.html` — real exhibition video, fictional/world-level inquiry, practice inquiry, and archive evidence.
- `48-plant.html` — dedicated organism/specimen page showing how a project can exist within MZTV but keep its own archive.
- `style.css` — responsive presentation system.
- `app.js` — mobile nav, Twitch live/offline signal, inquiry tabs, archive filters, lineage source selection.

## Grounded and provisional parts

**Grounded source evidence:** MZTV Twitch channel and existing `mztv/` site; 48 PLANT specimen archive and saved final images; Tuttle Gallery video `nrq2BpCMCMk`; MAGPIE living archive; MZCam shared module's documented 48 PLANT origin and reuse in TRACKSIDE and SHEEPDOG.

**Editorial proposals, not canonical research statements:** project-specific inquiry questions on MZTV, MAGPIE, and 48 PLANT; cross-project editorial navigation; some homepage labels. The canonical studio statement and HARIL research question remain separately identifiable.

**Not implemented:** durable video clip indexing, a unified archive backend, end-to-end provenance for all artifacts, dedicated client/commission pages, persistent live-status backend, and private access controls. Any separate browser systems linked from the prototype may be resource-intensive.

## Deployment and publishing boundary

Files are only created within `/site-inquiry-preview/`. The root `/index.html` and older site versions are untouched. GitHub Pages publishes this directory on the same domain with a direct link; `noindex,nofollow` requests search engines not index the preview but **is not an access-control measure**. Do not promote this prototype as the homepage until approved.

## Suggested review sequence

1. Start with the live encounter on the prototype homepage.
2. Compare the experience → inquiry → evidence links on MZTV and MAGPIE.
3. Explore 48 PLANT's independent editorial page and original specimen studio.
4. Switch the research lenses and inspect the MZCam lineage.
5. Review mobile and desktop navigation, copy density and readability.
