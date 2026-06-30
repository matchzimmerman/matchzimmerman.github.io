const registry = document.querySelector('#package-registry');
const indexTime = document.querySelector('#package-index-time');
const copyButton = document.querySelector('#copy-handoff');
const handoffText = document.querySelector('#handoff-text');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (copyButton && handoffText) {
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(handoffText.textContent.trim());
      copyButton.textContent = 'Copied';
      window.setTimeout(() => { copyButton.textContent = 'Copy handoff instruction'; }, 1800);
    } catch (error) {
      copyButton.textContent = 'Select and copy below';
    }
  });
}

const registryUrl = new URL('../data/system-packages.json', window.location.href);
registryUrl.searchParams.set('fresh', Date.now().toString());

fetch(registryUrl, { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error(`Package registry ${response.status}`);
    return response.json();
  })
  .then(data => {
    const packages = data.packages || [];
    if (data.generated_at) {
      indexTime.textContent = `registry synced ${new Date(data.generated_at).toLocaleString()}`;
    } else {
      indexTime.textContent = 'registry initialized';
    }

    if (!packages.length) {
      registry.innerHTML = `<article class="package-empty">
        <span>READY FOR INTAKE</span>
        <h3>No conversation packages have been synchronized yet.</h3>
        <p>Reserved interface packages will appear here after the registry synchronization completes.</p>
      </article>`;
      return;
    }

    registry.innerHTML = packages.map(item => `
      <article class="package-card">
        ${item.preview_uri ? `<div class="package-preview"><img loading="lazy" src="${escapeHtml(item.preview_uri)}" alt="Preview of ${escapeHtml(item.title)}"></div>` : '<div class="package-preview package-preview-empty"><span>PREVIEW PENDING</span></div>'}
        <div class="package-copy">
          <div class="package-meta"><span>${escapeHtml(item.family_id)}</span><span>${escapeHtml(item.mode)}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <dl>
            <dt>status</dt><dd>${escapeHtml(item.status)}</dd>
            <dt>generator</dt><dd>${escapeHtml(item.generator_id || 'not registered')}</dd>
            <dt>source</dt><dd>${escapeHtml(item.source_directory)}</dd>
          </dl>
          <a href="${escapeHtml(item.manifest_uri)}">Open manifest →</a>
        </div>
      </article>
    `).join('');
  })
  .catch(error => {
    registry.innerHTML = `<p class="empty">Package registry unavailable: ${escapeHtml(error.message)}</p>`;
    indexTime.textContent = 'registry unavailable';
  });
