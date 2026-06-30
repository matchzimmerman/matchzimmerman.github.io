const preview = document.querySelector('[data-archive-preview]');
const retained = document.querySelector('[data-retained-count]');
const systems = document.querySelector('[data-system-count]');
const latest = document.querySelector('[data-latest-record]');
const latestTime = document.querySelector('[data-latest-time]');

const indexUrl = new URL('../data/archive-index.json', window.location.href);
indexUrl.searchParams.set('fresh', Date.now().toString());

fetch(indexUrl, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  },
})
  .then(response => {
    if (!response.ok) throw new Error(`Archive index ${response.status}`);
    return response.json();
  })
  .then(data => {
    const record = data.executions?.[0];
    if (retained) retained.textContent = Number(data.counts?.executions || 0).toLocaleString();
    if (systems) systems.textContent = Number(data.counts?.families || 0).toLocaleString();
    if (latest) latest.textContent = record?.id || 'awaiting recovery';
    if (latestTime) {
      latestTime.textContent = record?.generated_at
        ? new Date(record.generated_at).toLocaleString([], {
            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
          })
        : 'not yet recorded';
    }
    if (preview && record) {
      const image = record.thumbnail_uri || record.asset_uri;
      preview.style.backgroundImage = `linear-gradient(180deg, rgba(3,5,4,.06), rgba(3,5,4,.78)), url("${image}")`;
      preview.classList.add('is-loaded');
    }
  })
  .catch(() => {
    if (latest) latest.textContent = 'index unavailable';
    if (latestTime) latestTime.textContent = 'connection pending';
  });
