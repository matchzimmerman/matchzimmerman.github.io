const LAB_GROUPS = [
  {
    id: 'current',
    label: 'A / CURRENT DEVICES',
    title: 'Playable instruments + active systems',
    entries: [
      { name: 'GULL', tagline: 'AVIAN SIGNAL SYNTHESIZER', release: 'prototype', activity: ['synthesis','generative'], href: '/mz-audio-tools/magpie/', description: 'A playable generative synthesizer for metallic calls, fluttering phrases, and strange field recordings.' },
      { name: 'SERIAL', tagline: 'SEQUENTIAL EFFECTS LAB', release: 'prototype', activity: ['effects','learning'], href: '/mz-audio-tools/serial/', description: 'Drag, snap, listen, and reorder real audio effects to hear firsthand why order changes the result.' },
      { name: 'ER·D', tagline: 'SIX-VOICE PERCUSSION SYNTH', release: 'prototype', activity: ['rhythm','synthesis'], href: '/mz-audio-tools/erd/', description: 'One oscillator, one modulator, and one decay per voice in a 16-step percussion instrument tuned to D Phrygian.' },
      { name: 'COASTS', tagline: 'DUAL SYNTHESIS PHILOSOPHY', release: 'study', activity: ['synthesis','learning'], href: '/mz-audio-tools/coasts/', description: 'A playable comparison of East Coast subtractive control and West Coast complex timbre, touch voltage, and low-pass gates.' },
      { name: 'SPECTRAL PARTICLES', tagline: 'FREQUENCY PHYSICS VISUALIZER', release: 'study', activity: ['visualization','microphone'], href: '/mz-audio-tools/spectral-particles/', description: 'Load a track or use the microphone to drive interacting particle behaviors across the audible spectrum.' },
      { name: 'VISUAL ENGINE', tagline: 'MULTI-SEND ORGANIC BIT SYSTEM', release: 'prototype', activity: ['visualization','performance'], device: 'DESKTOP BEST', href: '/mz-audio-tools/visual-engine/', description: 'Load separate stems, assign each track a visual role, perform full-screen scenes, and capture audio-reactive video.' },
      { name: 'FIELD CHORUS', tagline: 'MID-ATLANTIC ECOLOGY MIXER', release: 'prototype', activity: ['ecology','generative'], href: '/mz-audio-tools/field-chorus/', description: 'Build a living Mid-Atlantic sound field by season, hour, habitat, and species, then let the ecology run itself.' },
      { name: 'EMERGENT FIELD', tagline: 'GENERATIVE MIX-AWARE INSTRUMENT', release: 'experiment', activity: ['generative','mixing'], href: '/mz-audio-tools/emergent-field/', description: 'Six coupled streams compose, negotiate spectral space, adapt event density, and redistribute themselves across the stereo field.' },
      { name: 'BANGER', tagline: 'KICK × SUB NESTING ENGINE', release: 'prototype', activity: ['rhythm','low-end'], href: '/mz-audio-tools/banger/', description: 'Coordinate kick and sub into one impact-to-weight event with tuned handoff, translation, sequencing, and loop bounce.' }
    ]
  },
  {
    id: 'open',
    label: 'B / OPEN EXPERIMENTS',
    title: 'Working branches + alternate interaction models',
    entries: [
      { name: 'CLUB FIELD v0.1', tagline: 'CITY RHYTHM MORPHING FIELD', release: 'experiment', activity: ['rhythm','generative'], href: '/mz-audio-tools/club-field/', description: 'Morph rhythm, timbre, space, and behavior among Baltimore, London, Kingston, Berlin, and Detroit.' },
      { name: 'OBAS KINETIC FIELD', tagline: 'COLLISION-DRIVEN SOUND FIELD', release: 'experiment', activity: ['physics','synthesis'], href: '/mz-audio-tools/obas-gravity-bass/', description: 'Floating bodies become sound events as walls, collisions, and motion turn a visual field into a playable system.' },
      { name: 'OBAS POLAR SEQUENCER', tagline: 'ROTATING PAINTED RHYTHM GRID', release: 'prototype', activity: ['rhythm','drawing'], href: '/mz-audio-tools/experimental/polar-sequencer/', description: 'Paint percussion events onto a rotating polar grid and let geometry become sequence.' },
      { name: 'POLAR INSTRUMENT', tagline: 'EXPANDED POLAR PERFORMANCE SYSTEM', release: 'prototype', activity: ['rhythm','performance'], device: 'DESKTOP BEST', href: '/mz-audio-tools/suite/polar-instrument/', description: 'An expanded polar system combining drums, bass, effects, and mixer controls inside one performance interface.' },
      { name: 'OBAS BEAT DEFENSE', tagline: 'RHYTHM PERFORMANCE GAME', release: 'experiment', activity: ['rhythm','game'], device: 'DESKTOP / KEYBOARD', href: '/mz-audio-tools/obas-sector-defense/', description: 'A keyboard-driven rhythm game that turns beat placement and timing into a defensive performance system.' },
      { name: 'OBAS VOICE TYPE FIELD', tagline: 'VOICE RESPONSE LINEAGE', release: 'study', activity: ['voice','visualization'], href: '/mz-audio-tools/obas-voice-type-field/versions/', description: 'A preserved sequence of voice-response studies moving through reactive field, pixel text, and live transcript behaviors.' },
      { name: 'OBAS TILE PULSE 004', tagline: 'VOICE-ENERGY TILE PROPAGATION', release: 'study', activity: ['voice','visualization'], href: '/mz-audio-tools/obas-voice-field/', description: 'Voice energy generates center-out tile events, translating loudness and timing into expanding visual structure.' },
      { name: 'GROOVE CORE / LESSON 01', tagline: 'PULSE AS INTERACTIVE STUDY', release: 'prototype', activity: ['rhythm','learning'], href: '/mz-audio-tools/groove-course/', description: 'An interactive PIECE-based groove lesson for hearing, manipulating, and understanding the conditions that establish pulse.' }
    ]
  },
  {
    id: 'spatial',
    label: 'C / SPATIAL + FIELD STUDIES',
    title: 'Sound as movement, location, memory, and traversal',
    entries: [
      { name: 'FIELD AUDIO SCAN 001', tagline: 'PLACE → PROCEDURAL SOUND', release: 'study', activity: ['spatial','place'], href: '/field-audio-scan-001/', description: 'A LiDAR-derived place translated into a procedural sound environment.' },
      { name: 'RESONANT ZONES', tagline: 'REGIONS AS PERSISTENT VOICES', release: 'experiment', activity: ['spatial','place'], href: '/field-audio-lab/zones/', description: 'Eight spatial regions become persistent voices, testing whether location itself can behave like instrumentation.' },
      { name: 'SLICE SCANNER', tagline: 'MOVING PLANE AS SCORE', release: 'experiment', activity: ['spatial','scanning'], href: '/field-audio-lab/slice/', description: 'A moving plane reads a scanned environment as a score, converting cross-sections of place into sonic events.' },
      { name: 'MEMORY TRAIL', tagline: 'VISITED SPACE BECOMES MEMORY', release: 'experiment', activity: ['spatial','memory'], href: '/field-audio-lab/memory/', description: 'Visited areas remain audible as accumulated tones, allowing traversal to leave a persistent compositional trace.' },
      { name: 'DIRECTIONAL FIELD', tagline: 'ORIENTATION CONTROLS THE MIX', release: 'experiment', activity: ['spatial','orientation'], href: '/field-audio-lab/direction/', description: 'Viewing direction and orientation determine which parts of the environment enter the audible mix.' },
      { name: 'AUTOWALK', tagline: 'TRAVERSAL AS REPEATABLE COMPOSITION', release: 'experiment', activity: ['spatial','sequence'], href: '/field-audio-lab/autowalk/', description: 'A repeatable walk through the spatial field turns movement through place into a composed performance.' },
      { name: 'FIELD ENGINE 001', tagline: 'GESTURE + TENSION + RUPTURE', release: 'prototype', activity: ['spatial','gesture'], device: 'MOBILE BEST', href: '/field-engine-001/', description: 'Touch, traces, tension, rupture, and material behavior become compositional controls in a procedural spatial instrument.' }
    ]
  },
  {
    id: 'related',
    label: 'D / AUDIOVISUAL + RELATED STUDIES',
    title: 'Sonic systems crossing into image, interface, sleep, and installation',
    entries: [
      { name: 'HARIL AV LAB', tagline: 'GENERATIVE AUDIOVISUAL FIELD / V1–V2', release: 'study', activity: ['visualization','microphone'], href: '/HARIL_AV_Lab_v2/', description: 'A two-version audiovisual lineage combining generative glyphs, synthesis, and microphone-reactive visual behavior.' },
      { name: 'HARIL AUDIOGLYPH STUDIO', tagline: 'FREQUENCY → GLYPH MAPPING', release: 'prototype', activity: ['visualization','composition'], href: '/HARIL_AudioGlyph_Studio_v1/', description: 'A generative music studio built around explicit mappings between frequency regions and visual glyph behavior.' },
      { name: 'HARIL GESTURE FIELD', tagline: 'DRAWN GESTURES BECOME LOOPS', release: 'experiment', activity: ['gesture','looping'], href: '/haril-mirror/', description: 'Drawn gestures become sound and return as repeating loops, testing how movement can be remembered by an interface.' },
      { name: 'RCF SIGNAL PRESSURE', tagline: 'WORDS + MIC + TOUCH DEFORM A FIELD', release: 'experiment', activity: ['voice','interaction'], href: '/RCF_LIVE_FIELD_v1/', description: 'Language, microphone input, and touch pressure a low-resolution field and alter its behavior.' },
      { name: 'CONVERSATIONAL OS', tagline: 'ORGANIC BIT VOICE FIELD', release: 'study', activity: ['voice','interface'], href: '/experiments/conversational-os/', description: 'A voice-responsive conversational-interface study exploring how dialogue can occupy a visual field rather than a chat window.' },
      { name: 'MZTV NIGHT FIELD', tagline: 'REAL-TIME SKY + SLEEP AUDIO / V0.0.1–V0.0.3', release: 'study', activity: ['ambient','sleep'], device: 'DESKTOP + MOBILE', href: '/mzsite/mztv-night-field-v003/', description: 'A preserved three-version ambient lineage pairing a real-time night sky with procedural sleep audio.' },
      { name: 'MZTV INFINITE OBAS', tagline: 'SPATIAL ORCHESTRA', release: 'experiment', activity: ['generative','visualization'], href: '/mzsite/mztv-obas-infinite/', description: 'An hour-scale audiovisual system in which spatially distributed voices and OBAS structures evolve together.' },
      { name: 'BEACON SONIC', tagline: 'MAGPIE EXHIBITION AUDIO STUDY', release: 'study', activity: ['installation','ambient'], href: '/FS%20Magpie%20Tuttle/fs-magpie-updated-sound.html', description: 'An audio-only prototype developed as part of the FIELD STATION: MAGPIE exhibition environment.' },
      { name: 'MAGPIE AMP HUM', tagline: 'INSTALLATION HUM LINEAGE', release: 'study', activity: ['installation','ambient'], href: '/FS%20Magpie%20Tuttle/magpie-amp-stack-sound-09.html', description: 'A preserved installation-sound lineage exploring electrical hum, amplifier presence, and environmental tension.' },
      { name: 'MAGPIE BUNKER OPS / SIGNAL-TRACE v7', tagline: 'AUDIOVISUAL OPERATIONS INTERFACE', release: 'prototype', activity: ['installation','interface'], device: 'DESKTOP BEST', href: '/MAGPIE_bunker_ops_v7.html', description: 'An audiovisual operations interface developed across multiple audio versions for the MAGPIE world.' }
    ]
  },
  {
    id: 'source',
    label: 'E / SOURCE-PRESERVED',
    title: 'Browser instruments awaiting a current live deployment',
    entries: [
      { name: 'EMBER', tagline: 'POLYPHONIC SUBTRACTIVE SYNTH', release: 'prototype', activity: ['synthesis','spatial'], href: 'https://github.com/matchzimmerman/mz-instruments', external: true, sourceOnly: true, description: 'A source-preserved browser synthesizer combining polyphonic subtractive synthesis with a spatial XY field.' },
      { name: 'CARRIER', tagline: 'GENERATIVE RADIO-TUNING INSTRUMENT', release: 'prototype', activity: ['generative','radio'], href: 'https://github.com/matchzimmerman/mz-instruments', external: true, sourceOnly: true, description: 'A source-preserved radio-tuning instrument with degrading tape-feedback loops and generative signal behavior.' },
      { name: 'SUBSTRATE', tagline: 'GENERATIVE DRUM MACHINE', release: 'prototype', activity: ['rhythm','generative'], href: 'https://github.com/matchzimmerman/mz-instruments', external: true, sourceOnly: true, description: 'A source-preserved generative drum machine with genre macros and key-aware randomization.' }
    ]
  }
];

const collection = document.getElementById('lab-collection');
const emptyState = document.getElementById('lab-empty');
const searchInput = document.getElementById('lab-search');
const filterButtons = [...document.querySelectorAll('.lab-filter')];
let activeFilter = 'all';

const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function cardMatches(entry, query) {
  const filterMatch = activeFilter === 'all' || entry.release === activeFilter;
  if (!filterMatch) return false;
  if (!query) return true;
  const haystack = [entry.name, entry.tagline, entry.release, entry.description, ...(entry.activity || []), entry.device || ''].join(' ').toLowerCase();
  return haystack.includes(query);
}

function render() {
  if (!collection) return;
  const query = (searchInput?.value || '').trim().toLowerCase();
  let total = 0;
  const html = LAB_GROUPS.map((group) => {
    const entries = group.entries.filter((entry) => cardMatches(entry, query));
    if (!entries.length) return '';
    total += entries.length;
    const cards = entries.map((entry) => {
      const tags = [...(entry.activity || []), ...(entry.device ? [entry.device] : [])];
      const tagHTML = tags.map((tag) => `<span class="${tag === entry.device ? 'device' : ''}">${escapeHTML(tag)}</span>`).join('');
      const target = entry.external ? ' target="_blank" rel="noopener"' : '';
      const linkLabel = entry.sourceOnly ? 'VIEW SOURCE ↗' : 'OPEN BUILD →';
      return `<article class="lab-card${entry.sourceOnly ? ' source-only' : ''}">
        <div class="lab-card-meta"><span>${escapeHTML(entry.tagline)}</span><span class="lab-card-class">${escapeHTML(entry.release)}</span></div>
        <h3>${escapeHTML(entry.name)}</h3>
        <p class="lab-description">${escapeHTML(entry.description)}</p>
        <div class="lab-card-tags">${tagHTML}</div>
        <a class="lab-card-link" href="${escapeHTML(entry.href)}"${target}>${linkLabel}</a>
      </article>`;
    }).join('');
    return `<section class="lab-group" data-group="${escapeHTML(group.id)}">
      <div class="lab-group-head"><span>${escapeHTML(group.label)}</span><strong>${escapeHTML(group.title)}</strong></div>
      <div class="lab-grid">${cards}</div>
    </section>`;
  }).join('');

  collection.innerHTML = html;
  if (emptyState) emptyState.hidden = total !== 0;
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filterButtons.forEach((candidate) => candidate.classList.toggle('active', candidate === button));
    render();
  });
});

searchInput?.addEventListener('input', render);
render();
