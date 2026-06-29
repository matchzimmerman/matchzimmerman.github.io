const state = { data: null, view: 'executions', filter: '' };
const archive = document.querySelector('#archive');
const dialog = document.querySelector('#record-dialog');
const dialogContent = document.querySelector('#dialog-content');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function familyFor(id) { return state.data.families.find(item => item.id === id); }
function generatorFor(id) { return state.data.generators.find(item => item.id === id); }
function shortDate(value) {
  return new Date(value).toLocaleString([], {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}
function matches(item) {
  const haystack = JSON.stringify(item).toLowerCase();
  return !state.filter || haystack.includes(state.filter.toLowerCase());
}
function thumbnailFor(record) { return record.thumbnail_uri || record.asset_uri; }

function renderExecutions() {
  const records = state.data.executions.filter(matches);
  if (!records.length) return '<p class="empty">No retained iterations match this filter.</p>';
  return records.map(record => `<a class="record" href="#${escapeHtml(record.id)}" data-record="${escapeHtml(record.id)}">
    <div class="record-media">
      <img loading="lazy" src="${escapeHtml(thumbnailFor(record))}" alt="Thumbnail for ${escapeHtml(record.title)}">
    </div>
    <div class="record-body">
      <span class="record-id">${escapeHtml(record.id)}</span>
      <h2>${escapeHtml(record.title)}</h2>
    </div>
  </a>`).join('');
}

function renderFamilies() {
  const families = state.data.families.filter(matches);
  if (!families.length) return '<p class="empty">No systems match this filter.</p>';
  return families.map(family => `<button class="family-card" data-family="${escapeHtml(family.id)}">
    <span class="family-index">${escapeHtml(family.id)}</span>
    <div><h2>${escapeHtml(family.title)}</h2><p>${escapeHtml(family.summary)}</p></div>
    <small>${escapeHtml(family.status)}</small>
  </button>`).join('');
}

function render() {
  archive.innerHTML = state.view === 'executions' ? renderExecutions() : renderFamilies();
  archive.querySelectorAll('[data-record]').forEach(node => node.addEventListener('click', event => {
    event.preventDefault();
    openExecution(node.dataset.record);
  }));
  archive.querySelectorAll('[data-family]').forEach(node => node.addEventListener('click', () => openFamily(node.dataset.family)));
}

function executionMedia(record) {
  const type = record.media_type || '';
  const asset = escapeHtml(record.asset_uri);
  const thumbnail = escapeHtml(thumbnailFor(record));
  const title = escapeHtml(record.title);

  if (type.startsWith('video/')) {
    return `<video src="${asset}" poster="${thumbnail}" autoplay loop controls playsinline preload="metadata" aria-label="${title}"></video>`;
  }
  if (type.startsWith('audio/')) {
    return `<div class="audio-stack"><img src="${thumbnail}" alt="${title}"><audio src="${asset}" autoplay loop controls></audio></div>`;
  }
  return `<img src="${asset}" alt="${title}">`;
}

function openExecution(id) {
  const record = state.data.executions.find(item => item.id === id);
  if (!record) return;
  const family = familyFor(record.family_id);
  const generator = generatorFor(record.generator_id);
  history.replaceState(null, '', `#${id}`);
  dialogContent.innerHTML = `<article class="dialog-record">
    <div class="dialog-media">${executionMedia(record)}</div>
    <div class="dialog-info">
      <span class="record-id">${escapeHtml(record.id)}</span>
      <h2>${escapeHtml(record.title)}</h2>
      <dl>
        <dt>generated</dt><dd>${escapeHtml(shortDate(record.generated_at))}</dd>
        <dt>family</dt><dd>${escapeHtml(family?.title || record.family_id)}</dd>
        <dt>generator</dt><dd>${escapeHtml(generator?.title || record.generator_id)} / v${escapeHtml(record.generator_version)}</dd>
        <dt>seed</dt><dd>${record.seed}</dd>
        <dt>source</dt><dd>${escapeHtml(record.source_ref)}</dd>
        <dt>status</dt><dd>${escapeHtml(record.status)}</dd>
        <dt>dimensions</dt><dd>${escapeHtml((record.dimensions || []).join(' × '))}</dd>
        <dt>checksum</dt><dd>${escapeHtml(record.checksum_sha256)}</dd>
      </dl>
    </div>
  </article>`;
  dialog.showModal();
}

function openFamily(id) {
  const family = familyFor(id);
  if (!family) return;
  const executions = state.data.executions.filter(item => item.family_id === id).length;
  dialogContent.innerHTML = `<article class="dialog-info">
    <span class="record-id">${escapeHtml(family.id)}</span>
    <h2>${escapeHtml(family.title)}</h2>
    <p>${escapeHtml(family.summary)}</p>
    <dl><dt>canon status</dt><dd>${escapeHtml(family.status)}</dd><dt>retained iterations</dt><dd>${executions}</dd></dl>
  </article>`;
  dialog.showModal();
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  state.view = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
  render();
}));

document.querySelector('#filter').addEventListener('input', event => {
  state.filter = event.target.value;
  render();
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => history.replaceState(null, '', location.pathname));

fetch('../data/archive-index.json', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error(`Archive index ${response.status}`);
    return response.json();
  })
  .then(data => {
    state.data = data;
    document.querySelector('#execution-count').textContent = data.counts.executions.toLocaleString();
    document.querySelector('#family-count').textContent = data.counts.families;
    document.querySelector('#generator-count').textContent = data.counts.active_generators;
    document.querySelector('#latest-time').textContent = data.executions[0]
      ? shortDate(data.executions[0].generated_at)
      : 'awaiting first run';
    document.querySelector('#index-time').textContent = `index built ${shortDate(data.generated_at)}`;
    render();
    if (location.hash) openExecution(location.hash.slice(1));
  })
  .catch(error => {
    archive.innerHTML = `<p class="empty">Archive index unavailable: ${escapeHtml(error.message)}</p>`;
  });
