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
