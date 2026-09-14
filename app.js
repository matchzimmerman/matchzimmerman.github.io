const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded','false');
}));

// V1.1 editorial feature: FIELD STATION: MAGPIE
const hero = document.querySelector('.hero');
if (hero) {
  const featured = document.createElement('section');
  featured.className = 'featured-work section-pad ruled-section';
  featured.id = 'featured';
  featured.innerHTML = `
    <div class="featured-head">
      <p class="eyebrow">FEATURED WORK / 01</p>
      <span>INSTALLATION · SPECULATIVE WORLD · 2025–ONGOING</span>
    </div>
    <div class="featured-grid">
      <button class="featured-image project-open-featured" aria-label="Open FIELD STATION: MAGPIE details">
        <img src="https://i.ytimg.com/vi/nrq2BpCMCMk/maxresdefault.jpg" alt="FIELD STATION: MAGPIE exhibition tour" />
      </button>
      <div class="featured-copy">
        <h2>FIELD STATION:<br>MAGPIE</h2>
        <p>An evolving speculative world set in 2147, examining technology, surveillance, memory, and life outside systems of control.</p>
        <div class="featured-actions">
          <button class="featured-project project-open-featured">VIEW PROJECT →</button>
          <a href="https://youtu.be/nrq2BpCMCMk" target="_blank" rel="noopener">WATCH EXHIBITION TOUR ↗</a>
        </div>
      </div>
    </div>`;
  hero.insertAdjacentElement('afterend', featured);
}

// Keep Field Notes provisional without framing thought as something that "hardens."
const notesHeading = document.querySelector('#notes .section-heading h2');
if (notesHeading) notesHeading.textContent = 'Thinking in public, while it is still moving.';

const featureStyles = document.createElement('style');
featureStyles.textContent = `
.featured-work{background:#e9e6df}.featured-head{display:flex;justify-content:space-between;gap:24px;align-items:baseline;margin-bottom:20px}.featured-head .eyebrow{margin:0}.featured-head>span{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.055em;color:var(--muted)}.featured-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.55fr);border:1px solid var(--ink)}.featured-image{display:block;width:100%;cursor:pointer;overflow:hidden;border-right:1px solid var(--ink);background:#f06a21}.featured-image img{display:block;width:100%;height:100%;min-height:420px;object-fit:cover;transition:transform .25s ease}.featured-image:hover img{transform:scale(1.012)}.featured-copy{padding:clamp(24px,4vw,58px);display:flex;flex-direction:column}.featured-copy h2{font-size:clamp(48px,6.5vw,94px);line-height:.84;letter-spacing:-.065em;margin:0 0 28px}.featured-copy p{font-size:clamp(17px,1.6vw,22px);line-height:1.3;margin:0;max-width:500px}.featured-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:auto;padding-top:40px}.featured-actions button,.featured-actions a{border:1px solid var(--ink);padding:10px 12px;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}.featured-actions button:hover,.featured-actions a:hover{background:var(--ink);color:var(--paper)}.magpie-video{margin:36px 0 8px;border-top:1px solid var(--ink);padding-top:22px}.magpie-video-label{display:flex;justify-content:space-between;gap:18px;margin-bottom:10px;font:9px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);letter-spacing:.055em}.magpie-video iframe{display:block;width:100%;aspect-ratio:16/9;border:1px solid var(--ink)}
@media(max-width:900px){.featured-grid{grid-template-columns:1fr}.featured-image{border-right:0;border-bottom:1px solid var(--ink)}.featured-image img{min-height:0}.featured-head{align-items:flex-start;flex-direction:column;gap:5px}.featured-copy{min-height:360px}}
@media(max-width:580px){.featured-copy h2{font-size:52px}.featured-copy{min-height:330px}.featured-actions{flex-direction:column;align-items:stretch}.featured-actions button,.featured-actions a{text-align:center}}
`;
document.head.appendChild(featureStyles);

const filters = document.querySelectorAll('.filter');
const archiveRows = document.querySelectorAll('.archive-row[data-class]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  archiveRows.forEach(row => row.classList.toggle('hidden', filter !== 'all' && row.dataset.class !== filter));
}));

const projects = {
  magpie: {
    kicker:'WORK / 2025–ONGOING / INSTALLATION · SOUND · FICTION',
    title:'FIELD STATION: MAGPIE',
    lede:'A speculative field system set in 2147, where sensing, memory, delivery infrastructure, surveillance, and resistance become environmental conditions.',
    question:'What happens when observation is no longer an event but a permanent feature of the environment?',
    system:'A linked world across physical exhibition, interfaces, music, graphic narrative, and playable systems. The Grid and The Field provide competing logics rather than a single linear story.',
    artifacts:'Field devices, GULL audio tools, transmissions, prints, interfaces, diagrams, sound works, cards, narrative fragments, and installation studies.',
    reflection:'MAGPIE is strongest when each object can stand alone while also behaving like evidence from a larger world.',
    video:true
  },
  haril: {
    kicker:'RESEARCH / 2026–ONGOING / HUMAN–AI SYSTEMS',
    title:'HARIL',
    lede:'Human–AI Recursive Interaction Lattice: a working model for cognition that is distributed across people, models, memory, tools, and repeated interaction.',
    question:'What happens to human thought when more cognition exists outside the human—and what remains uniquely ours when it does?',
    system:'Conversation, external memory, re-entry, model behavior, compression, reflection, and iterative self-modeling are treated as interacting layers rather than isolated events.',
    artifacts:'Working diagrams, memory protocols, PIECE-R, daily contribution reports, rehydration experiments, and longitudinal reflection systems.',
    reflection:'The framework remains useful only if it stays testable against actual interactions rather than becoming a mythology generated by its own terminology.'
  },
  obas: {
    kicker:'WORK / 2025–ONGOING / IMAGE · MOTION · CODE',
    title:'OBAS',
    lede:'An evolving procedural visual language derived from one-bit logic, bright color, repetition, rupture, dither, and continuous motion.',
    question:'How can a visual system feel rule-bound and unstable at the same time?',
    system:'Simple generative constraints produce grids, vortices, rupture paths, cubes, line fields, and audio-reactive structures. Variations become studies rather than steps toward one final image.',
    artifacts:'Realtime browser engines, reels, loops, prints, paintings, physical layer studies, lamps, and procedural tools.',
    reflection:'OBAS becomes more legible as a language when the studies accumulate publicly instead of waiting for one definitive work to represent the system.'
  },
  sonic: {
    kicker:'WORK / 2026–ONGOING / SPATIAL SOUND · INSTRUMENT',
    title:'SONIC LAB / FIELD ENGINE',
    lede:'A family of instruments that use movement, gesture, relational distance, and spatial position as musical controls.',
    question:'What if mixing behaved less like moving faders and more like moving through a room?',
    system:'A listener or performer moves through a mapped sound field. Distance from sound modules affects level, equalization, reverb, delay, compression, and spatial position.',
    artifacts:'Mobile web controllers, Ableton concepts, FIELD ENGINE 001, GULL, spatial mixer studies, motion sensing tests, and multiplayer performance ideas.',
    reflection:'The project becomes compelling when the controller stops representing a mix and starts behaving like a physical acoustic situation.'
  },
  seals: {
    kicker:'WORK / ONGOING / PHOTOGRAPHY · POETRY · PLACE',
    title:'TO SEE WHAT SEALS SEE',
    lede:'A photographic and poetic body of work using Ireland, looking, memory, family, distance, and language as overlapping forms of observation.',
    question:'What can be known about a place through repeated looking—and what remains inaccessible?',
    system:'Photographs and poems act less as illustration pairs than as independent observations that distort, contradict, and reframe one another.',
    artifacts:'Photographs, poems, sequencing studies, book structures, readings, and future installation/publication forms.',
    reflection:'The work benefits from remaining quieter than the systems-based projects around it. Its ambiguity is not a missing explanation.'
  },
  'archive-engine': {
    kicker:'SYSTEM / 2026–ONGOING / ARCHIVE · MEMORY · PRESERVATION',
    title:'ARCHIVE ENGINE 360',
    lede:'A museum-standard living archive of an adult creative life, designed so preservation, provenance, interpretation, and future re-entry are themselves part of the artwork.',
    question:'What changes when the archive is treated as an active medium rather than a storage layer?',
    system:'Persistent IDs, originals plus derivatives, provenance, rights, preservation metadata, AI-assisted description, relationships, oral history, and version histories.',
    artifacts:'Archive records, project pages, scans, transcripts, derivative media, metadata models, oral histories, and public-facing archive interfaces.',
    reflection:'The archive should be exhaustive without making the public site exhaustive. Its power comes from deep expansion behind a highly compressed front door.'
  }
};

const dialog = document.getElementById('project-dialog');
const dialogContent = document.getElementById('dialog-content');

function openProject(key) {
  const p = projects[key];
  if (!p || !dialog || !dialogContent) return;
  const video = p.video ? `<div class="magpie-video"><div class="magpie-video-label"><span>EXHIBITION DOCUMENTATION</span><span>TUTTLE GALLERY</span></div><iframe src="https://www.youtube.com/embed/nrq2BpCMCMk" title="FIELD STATION: MAGPIE — Exhibition Tour" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : '';
  dialogContent.innerHTML = `<div class="dialog-body">
    <div class="dialog-kicker">${p.kicker}</div>
    <h2>${p.title}</h2>
    <p class="dialog-lede">${p.lede}</p>
    ${video}
    <div class="dialog-sections">
      <div class="dialog-section"><span>01 / QUESTION</span><p>${p.question}</p></div>
      <div class="dialog-section"><span>02 / SYSTEM</span><p>${p.system}</p></div>
      <div class="dialog-section"><span>03 / ARTIFACTS</span><p>${p.artifacts}</p></div>
      <div class="dialog-section"><span>04 / REFLECTION</span><p>${p.reflection}</p></div>
    </div>
  </div>`;
  dialog.showModal();
}

document.querySelectorAll('.project-open').forEach(button => button.addEventListener('click', () => {
  const key = button.closest('.project-card').dataset.project;
  openProject(key);
}));

document.querySelectorAll('.project-open-featured').forEach(button => button.addEventListener('click', () => openProject('magpie')));
