// Writes docs/EVIDENCE-REGISTER.md from js/evidence.js (the same data the EVIDENCE view uses).
// usage: node tests/register.mjs   (from the piece folder)
import { writeFileSync } from 'node:fs';
import { SCENE, SOURCES, CLAIMS, STATUS } from '../js/evidence.js';
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const L = [];
L.push('# Evidence register · MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · Phase 01', '');
L.push('> Generated from `js/evidence.js` by `tests/register.mjs`. Edit the data file, not this page.', '');
L.push(`**Scene:** ${SCENE.event}, ${SCENE.date}, kickoff ${SCENE.kickoff}, ${SCENE.result}, attendance ${SCENE.attendance.toLocaleString('en-US')}.  `);
L.push(`**Scene time in the prototype:** ${SCENE.sceneTime}.  `);
L.push(`**Status:** ${SCENE.status}.`, '');
L.push('## Status classes', '');
for (const [k, v] of Object.entries(STATUS)) L.push(`- **${v.label}** (\`${k}\`): ${v.hint}`);
L.push('', 'Images found during research are listed as references only. None are copied into this build.', '');
L.push('## Sources', '');
L.push('| id | source | creator | date | era it shows | what it supports | confidence | rights | discrepancy |', '|---|---|---|---|---|---|---|---|---|');
for (const s of SOURCES) L.push(`| ${s.id} | ${s.url ? `[${esc(s.title)}](${s.url})` : esc(s.title)} | ${esc(s.creator)} | ${esc(s.date)} | ${esc(s.era)} | ${esc(s.supports)} | ${esc(s.confidence)} | ${esc(s.rights)} | ${esc(s.discrepancy)} |`);
L.push('', '## Claims (what each modelled thing rests on)', '');
L.push('| # | claim | status | sources | note |', '|---|---|---|---|---|');
for (const c of CLAIMS) L.push(`| ${c.id} | ${esc(c.label)} | ${STATUS[c.status].label} | ${c.src.join(', ') || '—'} | ${esc(c.note)} |`);
L.push('', '## Open discrepancies', '');
for (const s of SOURCES.filter(s => s.discrepancy)) L.push(`- **${s.id}**: ${s.discrepancy}`);
L.push('', '## Sources still to read before Phase 02', '',
  '- HABS survey (S11): photographs and data pages, for the deck structure and column rhythm (remembering it shows the post-1964 stadium).',
  '- Contemporary newspapers for 28 Dec 1959 (Baltimore Sun, Evening Sun, Chicago Tribune, Pittsburgh Post-Gazette): weather, field condition, crowd, and the moments of the game.',
  '- 1959 Colts game programme / seating chart, or the 1958–60 media guides (S13 is 1963), for the football seating layout and the "field seats" in S14.',
  '- Period photographs and the NBC broadcast (if any footage survives): goalposts, field paint, scoreboard face, flags, press box, light towers.',
  '- Baltimore Department of Public Works / city archive drawings for the 1949–54 stadium.', '');
writeFileSync('docs/EVIDENCE-REGISTER.md', L.join('\n'));
console.log('wrote docs/EVIDENCE-REGISTER.md', SOURCES.length, 'sources', CLAIMS.length, 'claims');
