/* Wildlife Activity prototype
   Live sources:
   - iNaturalist v1 observations API
   - GBIF occurrence API
   - NPS Data API alerts (optional API key)
*/

const SPECIES_LABELS = {
  'Ursus americanus': 'Black bear',
  'Lynx rufus': 'Bobcat',
  'Canis latrans': 'Coyote',
  'Cervus canadensis': 'Elk',
  'Alces alces': 'Moose',
  'Puma concolor': 'Mountain lion'
};

// Central Maryland starting point. Click map or use geolocation to move it.
const DEFAULT_CENTER = { lat: 39.505, lng: -76.685 };

const els = {
  species: document.getElementById('speciesSelect'),
  window: document.getElementById('windowSelect'),
  radius: document.getElementById('radiusSelect'),
  search: document.getElementById('searchBtn'),
  locate: document.getElementById('locateBtn'),
  status: document.getElementById('globalStatus'),
  inatCount: document.getElementById('inatCount'),
  inatSub: document.getElementById('inatSub'),
  gbifCount: document.getElementById('gbifCount'),
  gbifSub: document.getElementById('gbifSub'),
  npsCount: document.getElementById('npsCount'),
  npsSub: document.getElementById('npsSub'),
  feedTitle: document.getElementById('feedTitle'),
  notice: document.getElementById('activityNotice'),
  list: document.getElementById('observationList'),
  showInat: document.getElementById('showInat'),
  showGbif: document.getElementById('showGbif'),
  npsKey: document.getElementById('npsKey'),
  saveKey: document.getElementById('saveKeyBtn'),
  clearKey: document.getElementById('clearKeyBtn'),
  npsAlerts: document.getElementById('npsAlerts')
};

let searchPoint = { ...DEFAULT_CENTER };
let radiusCircle;
let centerMarker;
let latestInat = [];
let latestGbif = [];
let latestNpsAlerts = [];
let npsParksCache = null;

const map = L.map('map', { zoomControl: true }).setView([searchPoint.lat, searchPoint.lng], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const inatLayer = L.layerGroup().addTo(map);
const gbifLayer = L.layerGroup().addTo(map);

function radiusKm() { return Number(els.radius.value); }
function radiusMiles() { return radiusKm() / 1.60934; }
function daysBack() { return Number(els.window.value); }
function selectedSpecies() { return els.species.value; }
function speciesLabel() { return SPECIES_LABELS[selectedSpecies()] || selectedSpecies(); }

function dateISO(date) {
  return date.toISOString().slice(0, 10);
}

function startDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack());
  return d;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = n => n * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function fmtDistance(km) {
  const mi = km / 1.60934;
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}

function fmtDate(value) {
  if (!value) return 'Date unknown';
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function setStatus(text, mode = '') {
  els.status.textContent = text;
  els.status.className = `status-pill ${mode}`.trim();
}

function updateSearchGeometry() {
  if (centerMarker) centerMarker.remove();
  if (radiusCircle) radiusCircle.remove();

  centerMarker = L.circleMarker([searchPoint.lat, searchPoint.lng], {
    radius: 7,
    color: '#18221d',
    weight: 2,
    fillColor: '#d7ff45',
    fillOpacity: 1
  }).addTo(map);

  radiusCircle = L.circle([searchPoint.lat, searchPoint.lng], {
    radius: radiusKm() * 1000,
    color: '#18221d',
    weight: 1.4,
    opacity: .8,
    fillColor: '#d7ff45',
    fillOpacity: .08,
    dashArray: '6 7'
  }).addTo(map);
}

function colorMarker(lat, lng, source, popupHtml) {
  const color = source === 'inat' ? '#77a93d' : '#5b7e9c';
  const marker = L.circleMarker([lat, lng], {
    radius: 5,
    color: '#f7f6ed',
    weight: 1.5,
    fillColor: color,
    fillOpacity: .92
  });
  marker.bindPopup(popupHtml);
  return marker;
}

function renderMapLayers() {
  inatLayer.clearLayers();
  gbifLayer.clearLayers();

  if (els.showInat.checked) {
    latestInat.forEach(obs => {
      if (!Number.isFinite(obs.lat) || !Number.isFinite(obs.lng)) return;
      colorMarker(obs.lat, obs.lng, 'inat', `
        <div class="popup-title">${escapeHTML(obs.name)}</div>
        <div class="popup-meta">iNaturalist · ${escapeHTML(fmtDate(obs.date))}<br>${escapeHTML(fmtDistance(obs.distanceKm))} from search point</div>
      `).addTo(inatLayer);
    });
  }

  if (els.showGbif.checked) {
    latestGbif.forEach(obs => {
      if (!Number.isFinite(obs.lat) || !Number.isFinite(obs.lng)) return;
      colorMarker(obs.lat, obs.lng, 'gbif', `
        <div class="popup-title">${escapeHTML(obs.name)}</div>
        <div class="popup-meta">GBIF · ${escapeHTML(fmtDate(obs.date))}<br>${escapeHTML(fmtDistance(obs.distanceKm))} from search point</div>
      `).addTo(gbifLayer);
    });
  }
}

function renderFeed() {
  const feed = [
    ...(els.showInat.checked ? latestInat : []),
    ...(els.showGbif.checked ? latestGbif : [])
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  els.feedTitle.textContent = `${speciesLabel()} reports`;

  if (!feed.length) {
    els.list.innerHTML = '<div class="empty-state">No matching reports were returned for the selected sources, radius, and time window.</div>';
    return;
  }

  els.list.innerHTML = feed.slice(0, 80).map(obs => {
    const image = obs.image
      ? `<img class="thumb" src="${escapeHTML(obs.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
      : `<div class="thumb placeholder" aria-hidden="true">◉</div>`;
    const safeUrl = obs.url && /^https:\/\//.test(obs.url) ? obs.url : '#';
    return `
      <a class="obs-link" href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer">
        <div class="observation">
          ${image}
          <div>
            <div class="obs-title">${escapeHTML(obs.name)}</div>
            <div class="obs-meta">${escapeHTML(fmtDate(obs.date))}${obs.place ? ` · ${escapeHTML(obs.place)}` : ''}</div>
            <span class="source-chip ${obs.source}">${obs.source === 'inat' ? 'iNaturalist' : 'GBIF'}</span>
          </div>
          <div class="obs-distance">${escapeHTML(fmtDistance(obs.distanceKm))}</div>
        </div>
      </a>`;
  }).join('');
}

function updateNotice(errors = []) {
  const total = latestInat.length + latestGbif.length;
  if (errors.length === 2) {
    els.notice.className = 'notice warn';
    els.notice.textContent = 'Both public observation sources failed to respond. Check your connection or API availability.';
    return;
  }
  if (total === 0) {
    els.notice.className = 'notice warn';
    els.notice.textContent = `No recent reports found for ${speciesLabel()} within ${radiusMiles().toFixed(radiusMiles() < 10 ? 0 : 0)} mi during the selected window. This does not mean the animal is absent.`;
    return;
  }
  els.notice.className = 'notice good';
  els.notice.textContent = `${total} source records returned. iNaturalist and GBIF are shown separately because datasets can overlap; do not interpret the combined number as unique animals.`;
}

async function fetchINaturalist() {
  const params = new URLSearchParams({
    taxon_name: selectedSpecies(),
    lat: searchPoint.lat.toFixed(6),
    lng: searchPoint.lng.toFixed(6),
    radius: radiusKm().toFixed(3),
    d1: dateISO(startDate()),
    d2: dateISO(new Date()),
    geo: 'true',
    order_by: 'observed_on',
    order: 'desc',
    per_page: '200'
  });

  const res = await fetch(`https://api.inaturalist.org/v1/observations?${params}`);
  if (!res.ok) throw new Error(`iNaturalist ${res.status}`);
  const json = await res.json();

  latestInat = (json.results || []).map(o => {
    const coords = o.geojson?.coordinates || [];
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    return {
      id: `inat-${o.id}`,
      source: 'inat',
      name: o.taxon?.preferred_common_name || o.taxon?.name || speciesLabel(),
      date: o.observed_on || o.time_observed_at,
      lat,
      lng,
      distanceKm: Number.isFinite(lat) && Number.isFinite(lng) ? haversineKm(searchPoint.lat, searchPoint.lng, lat, lng) : Infinity,
      place: o.place_guess || '',
      image: o.photos?.[0]?.url?.replace('square', 'small') || '',
      url: o.uri || `https://www.inaturalist.org/observations/${o.id}`
    };
  }).filter(o => Number.isFinite(o.distanceKm) && o.distanceKm <= radiusKm() * 1.03);

  els.inatCount.textContent = latestInat.length.toLocaleString();
  els.inatSub.textContent = `${daysBack()}-day observation window`;
}

function circlePolygonWKT(lat, lng, radius, steps = 32) {
  const coords = [];
  const latKm = 110.574;
  const lonKm = 111.320 * Math.cos(lat * Math.PI / 180);
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dLat = (radius * Math.sin(angle)) / latKm;
    const dLng = (radius * Math.cos(angle)) / lonKm;
    coords.push(`${(lng + dLng).toFixed(6)} ${(lat + dLat).toFixed(6)}`);
  }
  return `POLYGON((${coords.join(',')}))`;
}

async function fetchGBIF() {
  // Resolve the scientific name against GBIF's taxonomic backbone first.
  const matchRes = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(selectedSpecies())}`);
  if (!matchRes.ok) throw new Error(`GBIF species match ${matchRes.status}`);
  const match = await matchRes.json();
  const taxonKey = match.usageKey || match.acceptedUsageKey;
  if (!taxonKey) throw new Error('GBIF could not resolve taxon');

  const params = new URLSearchParams({
    taxonKey: String(taxonKey),
    hasCoordinate: 'true',
    occurrenceStatus: 'PRESENT',
    geometry: circlePolygonWKT(searchPoint.lat, searchPoint.lng, radiusKm()),
    eventDate: `${dateISO(startDate())},${dateISO(new Date())}`,
    limit: '300'
  });

  const res = await fetch(`https://api.gbif.org/v1/occurrence/search?${params}`);
  if (!res.ok) throw new Error(`GBIF ${res.status}`);
  const json = await res.json();

  latestGbif = (json.results || []).map(o => {
    const lat = Number(o.decimalLatitude);
    const lng = Number(o.decimalLongitude);
    const media = Array.isArray(o.media) ? o.media.find(m => m.identifier || m.references) : null;
    const eventDate = o.eventDate || (o.year ? `${o.year}-${String(o.month || 1).padStart(2, '0')}-${String(o.day || 1).padStart(2, '0')}` : '');
    return {
      id: `gbif-${o.key}`,
      source: 'gbif',
      name: o.vernacularName || o.species || o.scientificName || speciesLabel(),
      date: eventDate,
      lat,
      lng,
      distanceKm: Number.isFinite(lat) && Number.isFinite(lng) ? haversineKm(searchPoint.lat, searchPoint.lng, lat, lng) : Infinity,
      place: [o.locality, o.stateProvince].filter(Boolean).join(', '),
      image: media?.identifier || '',
      url: o.key ? `https://www.gbif.org/occurrence/${o.key}` : 'https://www.gbif.org/'
    };
  }).filter(o => Number.isFinite(o.distanceKm) && o.distanceKm <= radiusKm() * 1.03);

  els.gbifCount.textContent = latestGbif.length.toLocaleString();
  els.gbifSub.textContent = `${daysBack()}-day occurrence window`;
}

async function loadNpsParks(apiKey) {
  if (npsParksCache) return npsParksCache;
  const res = await fetch('https://developer.nps.gov/api/v1/parks?limit=500&fields=addresses', {
    headers: { 'X-Api-Key': apiKey }
  });
  if (!res.ok) throw new Error(`NPS parks ${res.status}`);
  const json = await res.json();
  npsParksCache = (json.data || []).map(p => ({
    ...p,
    lat: Number(p.latitude),
    lng: Number(p.longitude)
  })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  return npsParksCache;
}

async function fetchNPSAlerts() {
  const key = els.npsKey.value.trim();
  if (!key) {
    latestNpsAlerts = [];
    els.npsCount.textContent = 'OFF';
    els.npsSub.textContent = 'Add API key to enable';
    els.npsAlerts.innerHTML = '<div class="empty-state">Add an NPS API key to query official alerts near this search point.</div>';
    return;
  }

  const parks = await loadNpsParks(key);
  // Park centroid proximity is only an approximation; parks can be geographically large.
  const nearby = parks
    .map(p => ({ ...p, distanceKm: haversineKm(searchPoint.lat, searchPoint.lng, p.lat, p.lng) }))
    .filter(p => p.distanceKm <= Math.max(80, radiusKm() * 2))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8);

  if (!nearby.length) {
    latestNpsAlerts = [];
    els.npsCount.textContent = '0';
    els.npsSub.textContent = 'No nearby NPS units by centroid';
    els.npsAlerts.innerHTML = '<div class="empty-state">No nearby NPS unit centroids were found within the prototype search threshold.</div>';
    return;
  }

  const parkCodes = nearby.map(p => p.parkCode).join(',');
  const res = await fetch(`https://developer.nps.gov/api/v1/alerts?parkCode=${encodeURIComponent(parkCodes)}&limit=100`, {
    headers: { 'X-Api-Key': key }
  });
  if (!res.ok) throw new Error(`NPS alerts ${res.status}`);
  const json = await res.json();
  latestNpsAlerts = json.data || [];

  // Prefer wildlife-like alerts first, but retain every official alert.
  const wildlifeTerms = /bear|wildlife|animal|moose|elk|bison|lion|cougar|snake|coyote|wolf|bobcat/i;
  latestNpsAlerts.sort((a, b) => Number(wildlifeTerms.test(`${b.title} ${b.description}`)) - Number(wildlifeTerms.test(`${a.title} ${a.description}`)));

  els.npsCount.textContent = latestNpsAlerts.length.toLocaleString();
  els.npsSub.textContent = `${nearby.length} nearby NPS units checked`;

  if (!latestNpsAlerts.length) {
    els.npsAlerts.innerHTML = `<div class="empty-state">No current NPS alerts returned for ${nearby.map(p => escapeHTML(p.fullName)).join(', ')}.</div>`;
    return;
  }

  els.npsAlerts.innerHTML = latestNpsAlerts.slice(0, 12).map(a => `
    <div class="alert-card">
      <div class="alert-title">${escapeHTML(a.title || 'NPS Alert')}</div>
      <div class="alert-meta">${escapeHTML(a.parkCode || '')} · ${escapeHTML(a.category || 'Alert')}</div>
      <p>${escapeHTML((a.description || '').slice(0, 280))}${(a.description || '').length > 280 ? '…' : ''}</p>
    </div>`).join('');
}

async function runSearch() {
  setStatus('Searching…', 'loading');
  els.search.disabled = true;
  els.inatCount.textContent = '…';
  els.gbifCount.textContent = '…';
  els.notice.className = 'notice';
  els.notice.textContent = `Checking ${speciesLabel()} records within ${radiusMiles().toFixed(radiusMiles() < 10 ? 0 : 0)} mi…`;
  latestInat = [];
  latestGbif = [];
  renderMapLayers();
  renderFeed();

  const errors = [];
  const results = await Promise.allSettled([
    fetchINaturalist(),
    fetchGBIF(),
    fetchNPSAlerts()
  ]);

  if (results[0].status === 'rejected') {
    errors.push('iNaturalist');
    console.error(results[0].reason);
    els.inatCount.textContent = 'ERR';
    els.inatSub.textContent = 'Source request failed';
  }
  if (results[1].status === 'rejected') {
    errors.push('GBIF');
    console.error(results[1].reason);
    els.gbifCount.textContent = 'ERR';
    els.gbifSub.textContent = 'Source request failed';
  }
  if (results[2].status === 'rejected') {
    console.error(results[2].reason);
    els.npsCount.textContent = 'ERR';
    els.npsSub.textContent = 'NPS request failed';
    els.npsAlerts.innerHTML = `<div class="empty-state">NPS request failed. Check the API key and browser console.</div>`;
  }

  renderMapLayers();
  renderFeed();
  updateNotice(errors);
  setStatus(errors.length ? 'Partial data' : 'Live data', errors.length ? 'error' : '');
  els.search.disabled = false;
}

map.on('click', e => {
  searchPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
  updateSearchGeometry();
});

els.radius.addEventListener('change', updateSearchGeometry);
els.search.addEventListener('click', runSearch);
els.showInat.addEventListener('change', () => { renderMapLayers(); renderFeed(); });
els.showGbif.addEventListener('change', () => { renderMapLayers(); renderFeed(); });

els.locate.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Location unavailable', 'error');
    return;
  }
  setStatus('Locating…', 'loading');
  navigator.geolocation.getCurrentPosition(pos => {
    searchPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    map.setView([searchPoint.lat, searchPoint.lng], 12);
    updateSearchGeometry();
    setStatus('Location set');
  }, err => {
    console.error(err);
    setStatus('Location blocked', 'error');
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
});

els.saveKey.addEventListener('click', () => {
  const key = els.npsKey.value.trim();
  if (key) {
    localStorage.setItem('wildlifePrototypeNpsKey', key);
    setStatus('NPS key saved');
  }
});

els.clearKey.addEventListener('click', () => {
  localStorage.removeItem('wildlifePrototypeNpsKey');
  els.npsKey.value = '';
  npsParksCache = null;
  latestNpsAlerts = [];
  els.npsCount.textContent = 'OFF';
  els.npsSub.textContent = 'Optional alerts layer';
  els.npsAlerts.innerHTML = '<div class="empty-state">NPS key cleared.</div>';
  setStatus('NPS key cleared');
});

els.npsKey.value = localStorage.getItem('wildlifePrototypeNpsKey') || '';
updateSearchGeometry();
runSearch();
