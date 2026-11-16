/** Minimal place-card viewer — `GET /api/catalog?scope=place`, `GET /api/preview`. */

import { jsonViewerHtml, paintCodeViewers, twinfileSourceHtml } from './viewer-json.js';

const catalogEl = document.getElementById('catalog');
const tabsEl = document.getElementById('tabs');
const canvasEl = document.getElementById('canvas');

const state = {
  units: [],
  entryId: null,
  variationId: null,
  variations: [],
};

function entryLabel(u) {
  return u.label || u.name || u.id || u.path || 'untitled';
}

function groupLabel(group) {
  const key = String(group || 'other');
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function unitsByGroup(units) {
  const order = [];
  const map = new Map();
  for (const u of units) {
    const g = u.group || u.kind || 'other';
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g).push(u);
  }
  return order.map((g) => ({ group: g, units: map.get(g) }));
}

function setHash() {
  const q = new URLSearchParams();
  if (state.entryId) q.set('entry', state.entryId);
  if (state.variationId) q.set('v', state.variationId);
  const s = q.toString();
  history.replaceState(null, '', s ? `#${s}` : '#');
}

function readHash() {
  const raw = location.hash.replace(/^#/, '');
  const q = new URLSearchParams(raw.includes('=') ? raw : '');
  return { entry: q.get('entry'), v: q.get('v') };
}

async function api(path, accept) {
  const res = await fetch(path, accept ? { headers: { Accept: accept } } : undefined);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function renderCatalog() {
  catalogEl.replaceChildren();
  for (const { group, units } of unitsByGroup(state.units)) {
    const section = document.createElement('div');
    section.className = 'catalog-group';

    const title = document.createElement('h2');
    title.className = 'catalog-group__title';
    title.textContent = groupLabel(group);
    section.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'catalog-list';

    for (const u of units) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'catalog-item';
      btn.setAttribute('aria-current', u.id === state.entryId ? 'true' : 'false');

      const name = document.createElement('span');
      name.textContent = entryLabel(u);
      btn.appendChild(name);

      if (u.id && entryLabel(u) !== u.id) {
        const id = document.createElement('span');
        id.className = 'catalog-item__id';
        id.textContent = u.id;
        btn.appendChild(id);
      }

      btn.addEventListener('click', () => selectEntry(u.id));
      li.appendChild(btn);
      list.appendChild(li);
    }

    section.appendChild(list);
    catalogEl.appendChild(section);
  }
}

function renderTabs() {
  tabsEl.innerHTML = '';
  for (const tab of state.variations) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.className =
      'rounded-md px-3 py-1.5 text-sm ' +
      (tab.id === state.variationId
        ? 'bg-zinc-900 text-white'
        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200');
    btn.textContent = tab.label || tab.id;
    btn.addEventListener('click', () => selectVariation(tab.id));
    tabsEl.appendChild(btn);
  }
}

async function selectEntry(id) {
  state.entryId = id;
  state.variationId = null;
  canvasEl.innerHTML = '<p class="text-sm text-zinc-500">Building…</p>';
  setHash();
  renderCatalog();
  try {
    const index = await api(
      `/api/preview?entry=${encodeURIComponent(id)}`,
      'application/vnd.twinfile.preview.index+json',
    );
    state.variations = index.variations || [];
    state.variationId = index.defaultVariationId || state.variations[0]?.id || null;
    renderTabs();
    if (state.variationId) await selectVariation(state.variationId);
    else canvasEl.innerHTML = '<p class="text-sm text-zinc-500">No views.</p>';
  } catch (e) {
    canvasEl.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(e.message)}</p>`;
  }
}

async function selectVariation(id) {
  state.variationId = id;
  setHash();
  renderTabs();
  canvasEl.innerHTML = '<p class="text-sm text-zinc-500">Loading…</p>';
  try {
    const part = await api(
      `/api/preview?entry=${encodeURIComponent(state.entryId)}&variation=${encodeURIComponent(id)}`,
      'application/vnd.twinfile.preview.variation+json',
    );
    const story = part.variation;
    if (!story) {
      canvasEl.innerHTML = '<p class="text-sm text-zinc-500">Empty variation.</p>';
      return;
    }
    canvasEl.innerHTML = typeof part.html === 'string' ? part.html : renderStory(story);
    paintCodeViewers(canvasEl);
  } catch (e) {
    canvasEl.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(e.message)}</p>`;
  }
}

function renderStory(story) {
  if (story.kind === 'summary' && story.summary) {
    return '<p class="text-sm text-zinc-500">Summary requires host-rendered HTML — restart the workbench server.</p>';
  }
  if (story.kind === 'twinfile' && typeof story.text === 'string') {
    return twinfileSourceHtml(story.filename || 'Twinfile.yaml', story.text);
  }
  if (story.kind === 'disclosures' && Array.isArray(story.disclosures)) {
    return renderDisclosures(story.disclosures);
  }
  return jsonViewerHtml(story);
}

function renderDisclosures(rows) {
  if (!rows.length) {
    return '<p class="text-sm text-zinc-500">No disclosures.</p>';
  }
  return rows
    .map((row) => {
      const title = row.name
        ? `${row.collection}/${row.id} — ${row.name}`
        : `${row.collection}/${row.id}`;
      return `<article class="mb-4 max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <header class="border-b border-zinc-100 px-4 py-3">
          <h2 class="text-sm font-semibold">${escapeHtml(title)}</h2>
        </header>
        ${jsonViewerHtml(row.dtpr ?? row)}
      </article>`;
    })
    .join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function boot() {
  const hash = readHash();
  const catalog = await api('/api/catalog?scope=place');
  state.units = catalog.entries || [];
  renderCatalog();
  const first = hash.entry || catalog.defaultEntryId || state.units[0]?.id;
  if (first) {
    await selectEntry(first);
    if (hash.v && hash.v !== state.variationId) await selectVariation(hash.v);
  }
}

boot().catch((e) => {
  canvasEl.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(e.message)}</p>`;
});
