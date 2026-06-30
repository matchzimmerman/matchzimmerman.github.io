state.view = 'families';

function generatorSequence(record) {
  const lineage = state.data.executions
    .filter(item => item.generator_id === record.generator_id)
    .sort((a, b) => new Date(a.generated_at) - new Date(b.generated_at));
  const index = lineage.findIndex(item => item.id === record.id);
  return index >= 0 ? index + 1 : '—';
}

function recordFocus(record) {
  if (record.lineage_generation) {
    return {
      firstLabel: 'GENERATION',
      firstValue: record.lineage_generation,
      secondLabel: 'PARENT',
      secondValue: record.parent_archive_id || record.parent_ids?.[0] || 'lineage origin',
      thirdLabel: 'PHASE',
      thirdValue: record.developmental_phase || 'unclassified',
    };
  }

  const isStaticStudy = record.generator_id === 'MZFS.GEN.0001';
  const isLegacyLoop = record.generator_id === 'MZFS.GEN.0002' && record.generator_version === '1.0.0';

  return {
    firstLabel: 'ITERATION',
    firstValue: generatorSequence(record),
    secondLabel: 'RELATION',
    secondValue: record.parent_ids?.[0] || 'lineage origin',
    thirdLabel: 'MODE',
    thirdValue: isStaticStudy ? 'STATIC FIELD STUDY' : isLegacyLoop ? 'PRE-LINEAGE' : 'UNCLASSIFIED',
  };
}

lineageBlock = function lineageBlock(record) {
  const focus = recordFocus(record);
  return `<section class="lineage-summary">
    <div><span>${escapeHtml(focus.firstLabel)}</span><strong>${escapeHtml(focus.firstValue)}</strong></div>
    <div><span>${escapeHtml(focus.secondLabel)}</span><strong>${escapeHtml(focus.secondValue)}</strong></div>
    <div><span>${escapeHtml(focus.thirdLabel)}</span><strong>${escapeHtml(focus.thirdValue)}</strong></div>
  </section>`;
};

function fallbackRecoveryNote(record) {
  if (record.generator_id === 'MZFS.GEN.0001') {
    return {
      heading: 'RECOVERY AGENT NOTE',
      text: 'Recovery Agents retained this relation-field image as a comparative still. Its variation is seed-derived; persistent state metrics are not yet recorded for this generator.',
      status: 'DOCUMENTED / SEED-BASED STUDY',
    };
  }

  if (record.generator_id === 'MZFS.GEN.0002' && record.generator_version === '1.0.0') {
    return {
      heading: 'RECOVERY AGENT NOTE',
      text: 'This execution predates persistent lineage tracking. The asset, seed, and source were retained, but inherited node, tension, damage, and residue measurements were not recorded.',
      status: 'LEGACY / PRE-LINEAGE RECORD',
    };
  }

  return {
    heading: 'RECOVERY AGENT NOTE',
    text: 'This iteration was retained before comparative state analysis was available. No measured evolution point was recorded.',
    status: 'ARCHIVED / LIMITED METADATA',
  };
}

evolutionBlock = function evolutionBlock(record) {
  if (record.key_change_text) {
    return `<section class="key-evolution">
      <span>KEY EVOLUTION POINT</span>
      <p>${escapeHtml(record.key_change_text)}</p>
      <small>${escapeHtml(record.key_change_certainty || 'unclassified')} / ${escapeHtml(record.key_change_type || 'state change')}</small>
    </section>`;
  }

  const note = fallbackRecoveryNote(record);
  return `<section class="key-evolution recovery-note">
    <span>${escapeHtml(note.heading)}</span>
    <p>${escapeHtml(note.text)}</p>
    <small>${escapeHtml(note.status)}</small>
  </section>`;
};

function familyExecutions(id) {
  return state.data.executions.filter(item => item.family_id === id);
}

function latestFamilyRecord(id) {
  return familyExecutions(id)[0] || null;
}

function referenceMedia(reference) {
  if (reference.media_type?.startsWith('video/')) {
    return `<video controls playsinline preload="metadata" poster="${escapeHtml(reference.thumbnail_uri || '')}">
      <source src="${escapeHtml(reference.uri)}" type="${escapeHtml(reference.media_type)}">
    </video>`;
  }
  if (reference.media_type?.startsWith('audio/')) {
    return `<div class="reference-audio">${reference.thumbnail_uri ? `<img src="${escapeHtml(reference.thumbnail_uri)}" alt="">` : ''}<audio controls preload="metadata" src="${escapeHtml(reference.uri)}"></audio></div>`;
  }
  return `<img src="${escapeHtml(reference.uri)}" alt="${escapeHtml(reference.title || 'Approved reference output')}">`;
}

function referenceGrid(family) {
  const references = family.reference_outputs || [];
  if (!references.length) return '';
  return `<section class="system-references">
    <div class="archive-section-heading"><div><p class="kicker">APPROVED SOURCE MATERIAL</p><h2>Reference Outputs</h2></div><p>Recovered outputs approved as canonical references for this system. These are distinct from autonomous iterations.</p></div>
    <div class="reference-grid">${references.map(reference => `<article class="reference-card">
      <div class="reference-media">${referenceMedia(reference)}</div>
      <div class="reference-copy"><span>${escapeHtml(reference.status || 'APPROVED REFERENCE')}</span><h3>${escapeHtml(reference.title || 'Approved reference output')}</h3></div>
    </article>`).join('')}</div>
  </section>`;
}

renderFamilies = function renderFamilies() {
  const families = state.data.families.filter(textMatches);
  if (!families.length) return '<p class="empty">No systems match this filter.</p>';
  return families.map(family => {
    const records = familyExecutions(family.id);
    const references = family.reference_outputs || [];
    const latest = records[0];
    const image = latest ? thumbnailFor(latest) : (family.preview_uri || references[0]?.thumbnail_uri || '');
    const phase = latest?.developmental_phase || (references.length ? 'approved reference recovered' : latest ? 'retained study' : 'awaiting recovered output');
    return `<button class="family-card" data-family="${escapeHtml(family.id)}">
      ${image ? `<div class="system-card-media"><img loading="lazy" src="${escapeHtml(image)}" alt="System preview for ${escapeHtml(family.title)}"></div>` : ''}
      <span class="family-index">${escapeHtml(family.id)}</span>
      <div><h2>${escapeHtml(family.title)}</h2><p>${escapeHtml(family.summary)}</p></div>
      <div class="system-card-meta"><span>${references.length} references / ${records.length} iterations</span><span>${escapeHtml(phase)}</span></div>
    </button>`;
  }).join('');
};

openFamily = function openFamily(id) {
  const family = familyFor(id);
  if (!family) return;
  state.activeExecutionId = null;
  const records = familyExecutions(id);
  const latest = records[0];
  const references = family.reference_outputs || [];
  const iterationGrid = records.length
    ? records.map(record => `<button class="record family-iteration" type="button" data-family-record="${escapeHtml(record.id)}">
        <div class="record-media"><img src="${escapeHtml(thumbnailFor(record))}" alt="${escapeHtml(record.title)}">${mediaBadge(record)}${anomalyBadge(record)}</div>
        <div class="record-body"><span class="record-id">${escapeHtml(record.id)}</span><h2>${escapeHtml(record.title)}</h2></div>
      </button>`).join('')
    : '<p class="empty">No autonomous iterations have been retained for this system yet.</p>';

  dialogContent.innerHTML = `<article class="system-dialog">
    <section class="dialog-info system-overview">
      <span class="record-id">${escapeHtml(family.id)}</span>
      <p class="dialog-label">RECOVERED SYSTEM</p>
      <h2>${escapeHtml(family.title)}</h2>
      <p>${escapeHtml(family.summary)}</p>
      <dl>
        <dt>canon status</dt><dd>${escapeHtml(family.status)}</dd>
        <dt>approved references</dt><dd>${references.length}</dd>
        <dt>retained iterations</dt><dd>${records.length}</dd>
        <dt>latest phase</dt><dd>${escapeHtml(latest?.developmental_phase || (references.length ? 'reference recovered' : 'unclassified'))}</dd>
        <dt>latest activity</dt><dd>${latest ? escapeHtml(shortDate(latest.generated_at)) : references.length ? 'approved source retained' : 'none retained'}</dd>
      </dl>
    </section>
    ${referenceGrid(family)}
    <section class="system-iterations">
      <div class="archive-section-heading"><div><p class="kicker">SYSTEM OUTPUTS</p><h2>Iterative Records</h2></div><p>Autonomous or manually generated states retained after the approved source material.</p></div>
      <div class="archive-grid">${iterationGrid}</div>
    </section>
  </article>`;

  dialogContent.querySelectorAll('[data-family-record]').forEach(button => button.addEventListener('click', () => openExecution(button.dataset.familyRecord)));
  if (!dialog.open) dialog.showModal();
};
