const state = {
  data: null,
  view: 'executions',
  filter: '',
  anomalyFilter: 'all',
  activeExecutionId: null,
};
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
function calendarDate(value) {
  return new Date(value).toLocaleDateString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
function clockDate(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });
}
function textMatches(item) {
  const haystack = JSON.stringify(item).toLowerCase();
  return !state.filter || haystack.includes(state.filter.toLowerCase());
}
function metricDelta(record, key) {
  const before = record.metrics_before || {};
  const after = record.metrics_after || {};
  const value = Number(after[key] || 0) - Number(before[key] || 0);
  return Number.isFinite(value) ? value : 0;
}
function directionReversal(record) {
  const before = record.metrics_before?.field_direction || {};
  const after = record.metrics_after?.field_direction || {};
  const ax = Number(before.x || 0);
  const ay = Number(before.y || 0);
  const bx = Number(after.x || 0);
  const by = Number(after.y || 0);
  const firstMagnitude = Math.hypot(ax, ay);
  const secondMagnitude = Math.hypot(bx, by);
  if (firstMagnitude < 0.1 || secondMagnitude < 0.1) return null;
  return (ax * bx + ay * by) / (firstMagnitude * secondMagnitude);
}
function anomalyAssessment(record) {
  if (['potential', 'confirmed', 'none'].includes(record.anomaly_status)) {
    return {
      status: record.anomaly_status,
      basis: record.anomaly_basis || null,
      value: record.anomaly_signal_value ?? null,
    };
  }

  const activeAnomalies = record.anomalies || [];
  if (activeAnomalies.length || record.event_log_id) {
    return {
      status: 'confirmed',
      basis: activeAnomalies.at(-1)?.type || 'event-log anomaly',
      value: activeAnomalies.length,
    };
  }

  if (!record.metrics_before || !record.metrics_after) {
    return { status: 'none', basis: null, value: null };
  }

  const candidates = [
    ['damage increase', metricDelta(record, 'damage'), 0.05, 90],
    ['fragmentation shift', metricDelta(record, 'fragmentation'), 0.015, 85],
    ['residue accumulation', metricDelta(record, 'residue'), 0.06, 75],
    ['connectivity disruption', metricDelta(record, 'connectivity'), 0.012, 70],
    ['symmetry disruption', metricDelta(record, 'symmetry'), 0.08, 65],
    ['movement divergence', metricDelta(record, 'movement_speed'), 0.12, 60],
    ['palette divergence', metricDelta(record, 'orange_ratio'), 0.07, 55],
  ]
    .filter(([, value, threshold]) => Math.abs(value) >= threshold)
    .map(([basis, value, , score]) => ({ basis, value: Number(value.toFixed(4)), score: score + Math.abs(value) }));

  const reversal = directionReversal(record);
  if (reversal !== null && reversal <= -0.35) {
    candidates.push({ basis: 'field-direction reversal', value: Number(reversal.toFixed(4)), score: 88 + Math.abs(reversal) });
  }

  if (!candidates.length) return { status: 'none', basis: null, value: null };
  const strongest = candidates.sort((a, b) => b.score - a.score)[0];
  return { status: 'potential', basis: strongest.basis, value: strongest.value };
}
function anomalyMatches(record) {
  const status = anomalyAssessment(record).status;
  if (state.anomalyFilter === 'all') return true;
  if (state.anomalyFilter === 'any') return status === 'potential' || status === 'confirmed';
  return status === state.anomalyFilter;
}
function visibleExecutions() {
  return state.data.executions.filter(record => textMatches(record) && anomalyMatches(record));
}
function thumbnailFor(record) { return record.thumbnail_uri || record.asset_uri; }
function mediaKind(record) {
  const type = record.media_type || '';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'still';
}
function mediaBadge(record) {
  const kind = mediaKind(record);
  const icon = kind === 'video' ? '▶' : kind === 'audio' ? '♪' : '▣';
  const label = kind === 'video' ? 'Video iteration' : kind === 'audio' ? 'Audio iteration' : 'Still iteration';
  return `<span class="media-badge media-badge-${kind}" aria-label="${label}" title="${label}"><b>${icon}</b><em>${kind}</em></span>`;
}
function anomalyBadge(record, location = 'card') {
  const assessment = anomalyAssessment(record);
  if (assessment.status === 'none') return '';
  const label = assessment.status === 'confirmed' ? 'confirmed anomaly' : 'potential anomaly';
  return `<span class="anomaly-badge anomaly-${assessment.status} anomaly-${location}" title="${escapeHtml(assessment.basis || label)}">${label}</span>`;
}
function anomalyBlock(record) {
  const assessment = anomalyAssessment(record);
  if (assessment.status === 'none') return '';
  const confirmed = assessment.status === 'confirmed';
  const heading = confirmed ? 'CONFIRMED ANOMALY' : 'POTENTIAL ANOMALY';
  const explanation = confirmed
    ? 'A persistent anomaly is present in this iteration’s retained genome.'
    : `Automated comparison flagged ${assessment.basis || 'an irregular state change'} beyond the current anomaly threshold. Recovery Agent confirmation remains pending.`;
  const value = assessment.value === null || assessment.value === undefined ? '' : `<small>signal value ${escapeHtml(assessment.value)}</small>`;
  return `<section class="anomaly-report anomaly-report-${assessment.status}">
    <span>${heading}</span>
    <p>${escapeHtml(explanation)}</p>
    ${value}
  </section>`;
}
function evolutionBlock(record) {
  if (!record.key_change_text) return '';
  return `<section class="key-evolution">
    <span>KEY EVOLUTION POINT</span>
    <p>${escapeHtml(record.key_change_text)}</p>
    <small>${escapeHtml(record.key_change_certainty || 'unclassified')} / ${escapeHtml(record.key_change_type || 'state change')}</small>
  </section>`;
}
function lineageBlock(record) {
  if (!record.lineage_generation) return '';
  return `<section class="lineage-summary">
    <div><span>GENERATION</span><strong>${escapeHtml(record.lineage_generation)}</strong></div>
    <div><span>PARENT</span><strong>${escapeHtml(record.parent_archive_id || 'lineage origin')}</strong></div>
    <div><span>PHASE</span><strong>${escapeHtml(record.developmental_phase || 'unclassified')}</strong></div>
  </section>`;
}
function executionNeighbors(id) {
  const records = visibleExecutions();
  const index = records.findIndex(item => item.id === id);
  return {
    records,
    index,
    newer: index > 0 ? records[index - 1] : null,
    older: index >= 0 && index < records.length - 1 ? records[index + 1] : null,
  };
}
function iterationNavigation(id) {
  const { records, index, newer, older } = executionNeighbors(id);
  if (index < 0) return '';
  return `<nav class="iteration-nav" aria-label="Iteration navigation">
    <button class="iteration-step iteration-step-newer" type="button" data-open-record="${escapeHtml(newer?.id || '')}" ${newer ? '' : 'disabled'} aria-label="Open newer iteration">
      <b>‹</b><span>newer</span>
    </button>
    <span class="iteration-position">${index + 1} / ${records.length}</span>
    <button class="iteration-step iteration-step-older" type="button" data-open-record="${escapeHtml(older?.id || '')}" ${older ? '' : 'disabled'} aria-label="Open older iteration">
      <span>older</span><b>›</b>
    </button>
  </nav>`;
}

function renderExecutions() {
  const records = visibleExecutions();
  if (!records.length) return '<p class="empty">No retained iterations match the active filters.</p>';
  return records.map(record => `<a class="record" href="#${escapeHtml(record.id)}" data-record="${escapeHtml(record.id)}">
    <div class="record-media">
      <img loading="lazy" src="${escapeHtml(thumbnailFor(record))}" alt="Thumbnail for ${escapeHtml(record.title)}">
      ${mediaBadge(record)}
      ${anomalyBadge(record)}
    </div>
    <div class="record-body">
      <span class="record-id">${escapeHtml(record.id)}</span>
      <h2>${escapeHtml(record.title)}</h2>
    </div>
  </a>`).join('');
}

function renderFamilies() {
  const families = state.data.families.filter(textMatches);
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

function bindDialogNavigation() {
  dialogContent.querySelectorAll('[data-open-record]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.openRecord;
    if (id) openExecution(id);
  }));
}

function openExecution(id) {
  const record = state.data.executions.find(item => item.id === id);
  if (!record) return;
  const family = familyFor(record.family_id);
  const generator = generatorFor(record.generator_id);
  const assessment = anomalyAssessment(record);
  state.activeExecutionId = id;
  history.replaceState(null, '', `#${id}`);
  dialogContent.innerHTML = `<article class="dialog-record">
    <div class="dialog-media">
      ${executionMedia(record)}
      ${iterationNavigation(id)}
    </div>
    <div class="dialog-info">
      <div class="record-flags">${anomalyBadge(record, 'dialog')}</div>
      <span class="record-id">${escapeHtml(record.id)}</span>
      <p class="dialog-label">TITLE</p>
      <h2>${escapeHtml(record.title)}</h2>
      ${lineageBlock(record)}
      ${anomalyBlock(record)}
      ${evolutionBlock(record)}
      <div class="archive-date">
        <span>ARCHIVED</span>
        <strong>${escapeHtml(calendarDate(record.generated_at))}</strong>
        <small>${escapeHtml(clockDate(record.generated_at))}</small>
      </div>
      <dl>
        <dt>media</dt><dd>${escapeHtml(mediaKind(record))}</dd>
        <dt>family</dt><dd>${escapeHtml(family?.title || record.family_id)}</dd>
        <dt>generator</dt><dd>${escapeHtml(generator?.title || record.generator_id)} / v${escapeHtml(record.generator_version)}</dd>
        <dt>anomaly</dt><dd>${escapeHtml(assessment.status)}</dd>
        <dt>nodes</dt><dd>${escapeHtml(record.node_count ?? '—')}</dd>
        <dt>tension</dt><dd>${escapeHtml(record.field_tension ?? '—')}</dd>
        <dt>damage</dt><dd>${escapeHtml(record.damage ?? '—')}</dd>
        <dt>residue</dt><dd>${escapeHtml(record.residue ?? '—')}</dd>
        <dt>seed</dt><dd>${record.seed}</dd>
        <dt>source</dt><dd>${escapeHtml(record.source_ref)}</dd>
        <dt>status</dt><dd>${escapeHtml(record.status)}</dd>
        <dt>dimensions</dt><dd>${escapeHtml((record.dimensions || []).join(' × '))}</dd>
        <dt>checksum</dt><dd>${escapeHtml(record.checksum_sha256)}</dd>
      </dl>
    </div>
  </article>`;
  bindDialogNavigation();
  if (!dialog.open) dialog.showModal();
}

function openFamily(id) {
  const family = familyFor(id);
  if (!family) return;
  state.activeExecutionId = null;
  const executions = state.data.executions.filter(item => item.family_id === id).length;
  dialogContent.innerHTML = `<article class="dialog-info">
    <span class="record-id">${escapeHtml(family.id)}</span>
    <p class="dialog-label">SYSTEM</p>
    <h2>${escapeHtml(family.title)}</h2>
    <p>${escapeHtml(family.summary)}</p>
    <dl><dt>canon status</dt><dd>${escapeHtml(family.status)}</dd><dt>retained iterations</dt><dd>${executions}</dd></dl>
  </article>`;
  if (!dialog.open) dialog.showModal();
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
document.querySelector('#anomaly-filter').addEventListener('change', event => {
  state.anomalyFilter = event.target.value;
  render();
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  state.activeExecutionId = null;
  history.replaceState(null, '', location.pathname);
});
document.addEventListener('keydown', event => {
  if (!dialog.open || !state.activeExecutionId || event.metaKey || event.ctrlKey || event.altKey) return;
  if (['INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'AUDIO'].includes(event.target.tagName)) return;
  const { newer, older } = executionNeighbors(state.activeExecutionId);
  if (event.key === 'ArrowLeft' && newer) {
    event.preventDefault();
    openExecution(newer.id);
  }
  if (event.key === 'ArrowRight' && older) {
    event.preventDefault();
    openExecution(older.id);
  }
});

const archiveIndexUrl = new URL('../data/archive-index.json', window.location.href);
archiveIndexUrl.searchParams.set('fresh', Date.now().toString());
fetch(archiveIndexUrl, {
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
})
  .then(response => {
    if (!response.ok) throw new Error(`Archive index ${response.status}`);
    return response.json();
  })
  .then(data => {
    state.data = data;
    document.querySelector('#execution-count').textContent = data.counts.executions.toLocaleString();
    document.querySelector('#family-count').textContent = data.counts.families;
    document.querySelector('#generator-count').textContent = data.counts.active_generators;
    document.querySelector('#latest-time').textContent = data.executions[0] ? shortDate(data.executions[0].generated_at) : 'awaiting first run';
    document.querySelector('#index-time').textContent = `index built ${shortDate(data.generated_at)}`;
    render();
    if (location.hash) openExecution(location.hash.slice(1));
  })
  .catch(error => {
    archive.innerHTML = `<p class="empty">Archive index unavailable: ${escapeHtml(error.message)}</p>`;
  });
