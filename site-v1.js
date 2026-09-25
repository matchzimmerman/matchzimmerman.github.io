const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const filters = document.querySelectorAll('.filter');
const archiveRows = document.querySelectorAll('.archive-row[data-class]');
filters.forEach((button) => button.addEventListener('click', () => {
  filters.forEach((b) => b.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  archiveRows.forEach((row) => row.classList.toggle('hidden', filter !== 'all' && row.dataset.class !== filter));
}));

const projects = {
  magpie: {
    kicker: 'WORK / 2025–ONGOING / INSTALLATION · SOUND · FICTION',
    title: 'FIELD STATION: MAGPIE',
    lede: 'A speculative field system set in 2147, where sensing, memory, delivery infrastructure, surveillance, and resistance become environmental conditions.',
    question: 'What happens when observation is no longer an event but a permanent feature of the environment?',
    system: 'A linked world across physical exhibition, interfaces, music, graphic narrative, and playable systems. The Grid and The Field provide competing logics rather than a single linear story.',
    artifacts: 'Field devices, GULL audio tools, transmissions, prints, interfaces, diagrams, sound works, cards, narrative fragments, and installation studies.',
    reflection: 'MAGPIE is strongest when each object can stand alone while also behaving like evidence from a larger world.',
    video: true
  },
  obas: {
    kicker: 'WORK / 2025–ONGOING / IMAGE · MOTION · CODE',
    title: 'OBAS',
    lede: 'An evolving procedural visual language derived from one-bit logic, bright color, repetition, rupture, dither, and continuous motion.',
    question: 'How can a visual system feel rule-bound and unstable at the same time?',
    system: 'Simple generative constraints produce grids, vortices, rupture paths, cubes, line fields, and audio-reactive structures. Variations become studies rather than steps toward one final image.',
    artifacts: 'Realtime browser engines, reels, loops, prints, paintings, physical layer studies, lamps, and procedural tools.',
    reflection: 'OBAS becomes more legible as a language when the studies accumulate publicly instead of waiting for one definitive work to represent the system.'
  },
  sonic: {
    kicker: 'WORK / 2026–ONGOING / SOUND · TOOLS · EXPERIMENTS',
    title: 'SONIC LAB',
    lede: 'An open collection of playable systems for sound, rhythm, space, voice, visualization, environmental listening, and compositional research.',
    question: 'What can be learned when an instrument is treated as an inquiry rather than only as a means to produce a finished track?',
    system: 'Studies, experiments, and prototypes remain publicly available at the level they actually occupy. Individual builds keep their own interfaces while a shared index makes the larger research field legible.',
    artifacts: 'Browser instruments, spatial-audio studies, rhythm systems, generative tools, voice-response interfaces, audiovisual engines, environmental sound fields, and source-preserved prototypes.',
    reflection: 'Most builds remain in development. Their rough edges are documented rather than hidden, allowing the lab to function as a working public record instead of a software showroom.',
    link: '/sonic-lab/',
    linkLabel: 'ENTER SONIC LAB →'
  },
  seals: {
    kicker: 'WORK / ONGOING / PHOTOGRAPHY · POETRY · PLACE',
    title: 'TO SEE WHAT SEALS SEE',
    lede: 'A photographic and poetic body of work using Ireland, looking, memory, family, distance, and language as overlapping forms of observation.',
    question: 'What can be known about a place through repeated looking—and what remains inaccessible?',
    system: 'Photographs and poems act less as illustration pairs than as independent observations that distort, contradict, and reframe one another.',
    artifacts: 'Photographs, poems, sequencing studies, book structures, readings, and future installation/publication forms.',
    reflection: 'The work benefits from remaining quieter than the systems-based projects around it. Its ambiguity is not a missing explanation.'
  },
  'archive-engine': {
    kicker: 'SYSTEM / 2026–ONGOING / ARCHIVE · MEMORY · PRESERVATION',
    title: 'ARCHIVE ENGINE 360',
    lede: 'A museum-standard living archive of an adult creative life, designed so preservation, provenance, interpretation, and future re-entry are themselves part of the artwork.',
    question: 'What changes when the archive is treated as an active medium rather than a storage layer?',
    system: 'Persistent IDs, originals plus derivatives, provenance, rights, preservation metadata, machine-assisted description, relationships, oral history, and version histories.',
    artifacts: 'Archive records, project pages, scans, transcripts, derivative media, metadata models, oral histories, and public-facing archive interfaces.',
    reflection: 'The archive should be exhaustive without making the public site exhaustive. Its power comes from deep expansion behind a highly compressed front door.'
  }
};

const sonicCard = document.querySelector('.project-sonic');
if (sonicCard) {
  const sonicButton = sonicCard.querySelector('.project-open');
  const sonicMeta = sonicCard.querySelectorAll('.project-meta span');
  const sonicTitle = sonicCard.querySelector('h3');
  const sonicDescription = sonicCard.querySelector('p');
  if (sonicButton) sonicButton.setAttribute('aria-label', 'Open SONIC LAB details');
  if (sonicMeta[1]) sonicMeta[1].textContent = 'SOUND / TOOLS / EXPERIMENTS';
  if (sonicTitle) sonicTitle.textContent = 'SONIC LAB';
  if (sonicDescription) sonicDescription.textContent = 'Playable studies, experiments, and prototype instruments across sound, rhythm, space, voice, and visualization.';
}

const dialog = document.getElementById('project-dialog');
const dialogContent = document.getElementById('dialog-content');

function openProject(key) {
  const p = projects[key];
  if (!p || !dialog || !dialogContent) return;

  const video = p.video ? `<div class="magpie-video"><div class="magpie-video-label"><span>EXHIBITION DOCUMENTATION</span><span>TUTTLE GALLERY</span></div><iframe src="https://www.youtube.com/embed/nrq2BpCMCMk" title="FIELD STATION: MAGPIE — Exhibition Tour" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : '';
  const projectAction = p.link ? `<div class="info-links"><a href="${p.link}">${p.linkLabel || 'OPEN PROJECT →'}</a></div>` : '';

  dialogContent.innerHTML = `<div class="dialog-body"><div class="dialog-kicker">${p.kicker}</div><h2>${p.title}</h2><p class="dialog-lede">${p.lede}</p>${projectAction}${video}<div class="dialog-sections"><div class="dialog-section"><span>01 / QUESTION</span><p>${p.question}</p></div><div class="dialog-section"><span>02 / SYSTEM</span><p>${p.system}</p></div><div class="dialog-section"><span>03 / ARTIFACTS</span><p>${p.artifacts}</p></div><div class="dialog-section"><span>04 / REFLECTION</span><p>${p.reflection}</p></div></div></div>`;
  dialog.showModal();
}

document.querySelectorAll('.project-open').forEach((button) => button.addEventListener('click', () => openProject(button.closest('.project-card').dataset.project)));
document.querySelectorAll('.project-open-featured').forEach((button) => button.addEventListener('click', () => openProject('magpie')));
