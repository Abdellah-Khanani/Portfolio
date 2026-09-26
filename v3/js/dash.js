/* ═══════════════════════════════════════════════════════════════
   STUDIO — dashboard logic.
   Edits the same data the site reads (window.PROJECTS) and writes it back
   out as js/projects.js, either as a download or straight to GitHub.
   Work in progress is kept in this browser, so a phone edit survives a reload.
   ═══════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const DRAFT = 'ak:dash:draft', GH = 'ak:dash:gh';
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  del: k => { try { localStorage.removeItem(k); } catch (e) { /* private mode */ } }
};

/* ── lock ──────────────────────────────────────────────
   GitHub Pages cannot check a password, and one written here would sit in a public
   repository. The key is Abdellah's own GitHub token instead: GitHub says whose it is,
   and only a token of the repository's owner opens Studio. It stays in this browser.
   The lock is the front door, not the safe: publishing and visitor numbers need tokens
   that exist only on his devices, so getting past the door by editing this file in the
   browser gives nobody anything. */
const OK = 'ak:dash:ok', OWNER = 'Abdellah-Khanani';
const unlock = () => document.body.classList.remove('is-locked');
if (store.get(OK) === '1') unlock();

$('#lock-form').addEventListener('submit', async e => {
  e.preventDefault();
  const token = $('#lock-token').value.trim(), out = $('#lock-log'), go = $('#lock-go');
  if (!token) { out.textContent = 'Paste the token first.'; return; }
  go.disabled = true;
  out.textContent = 'Checking with GitHub…';
  try {
    let r;
    try {
      r = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    } catch (err) { throw new Error('GitHub could not be reached. Check your connection.'); }
    if (r.status === 401) throw new Error('GitHub does not recognise this token.');
    if (!r.ok) throw new Error(`GitHub answered ${r.status}.`);
    const me = await r.json();
    if (String(me.login).toLowerCase() !== OWNER.toLowerCase()) throw new Error('This token belongs to another account.');
    // the same token publishes, so the GitHub settings are filled in ready to use
    let saved = {};
    try { saved = JSON.parse(store.get(GH) || '{}'); } catch (err) { /* nothing saved yet */ }
    const next = { owner: saved.owner || OWNER, repo: saved.repo || 'Portfolio', branch: saved.branch || 'main',
                   path: saved.path || 'v3/js/projects.js', token };
    store.set(GH, JSON.stringify(next));
    ['owner', 'repo', 'branch', 'path', 'token'].forEach(k => { const el = $('#gh-' + k); if (el) el.value = next[k]; });
    store.set(OK, '1');
    $('#lock-token').value = '';
    out.textContent = '';
    unlock();
  } catch (err) {
    out.textContent = err.message;
  } finally {
    go.disabled = false;
  }
});

$('#relock').addEventListener('click', () => {
  if (!confirm('Lock Studio on this device? Both tokens are forgotten here.')) return;
  store.del(OK); store.del(GH); store.del('ak.goatcounter');
  location.reload();
});

/* the shape of a project, in the order it is written back to the file */
const ORDER = ['slug', 'title', 'category', 'layout', 'cover', 'role', 'year', 'client',
  'lead', 'body', 'facts', 'press', 'awards', 'links', 'portrait', 'images', 'video', 'poster', 'credits'];
const blank = () => ({ slug: '', title: '', category: '', layout: 'story', cover: '', role: '',
  year: String(new Date().getFullYear()), client: '', lead: '', body: [''], images: [], video: '', poster: '', credits: '' });

const FILE = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
let works = [], sel = -1, dirty = false;

/* ── load: a saved draft wins over the file, so nothing is lost on reload ── */
try {
  const d = JSON.parse(store.get(DRAFT) || 'null');
  works = Array.isArray(d) && d.length ? d : JSON.parse(JSON.stringify(FILE));
  dirty = !!(Array.isArray(d) && d.length);
} catch (e) { works = JSON.parse(JSON.stringify(FILE)); }

/* ── small helpers ─────────────────────────────────────── */
const toast = (() => {
  const el = $('#toast'); let t;
  return msg => { el.textContent = msg; el.classList.add('on'); clearTimeout(t); t = setTimeout(() => el.classList.remove('on'), 2400); };
})();
const slugify = s => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pairs = v => (v || []).map(p => Array.isArray(p) ? [p[0] || '', p[1] || ''] : ['', '']);

function mark(state) {
  dirty = state;
  const el = $('#state');
  el.classList.toggle('is-dirty', dirty);
  $('span', el).textContent = dirty ? 'Unpublished changes' : 'Up to date';
  if (dirty) store.set(DRAFT, JSON.stringify(works)); else store.del(DRAFT);
}

/* ── the file the site reads ───────────────────────────── */
function clean(p) {
  const o = {};
  ORDER.forEach(k => {
    let v = p[k];
    if (v == null) return;
    if (k === 'body') v = (v || []).map(x => String(x).trim()).filter(Boolean);
    if (k === 'images') v = (v || []).map(x => String(x).trim()).filter(Boolean);
    if (['facts', 'links', 'press', 'awards'].includes(k)) {
      v = pairs(v).filter(([a, b]) => a.trim() || b.trim());
      if (!v.length) return;                                  // optional blocks stay out of the file
    }
    if (k === 'portrait' && !v) return;
    if (typeof v === 'string') v = v.trim();
    o[k] = v;
  });
  // Fields this editor has no control for (pov, brand, ratios, beatTitles, fit, hidden…) are
  // carried through exactly as they came: saving must never lose what the form cannot show.
  Object.keys(p).forEach(k => { if (!ORDER.includes(k) && p[k] != null) o[k] = p[k]; });
  return o;
}

function serialize() {
  const head = `/* Project content for project.html?p=<slug> and work.html.
   Written from the client's own material; nothing here is invented.
   Edited with the Studio dashboard — last written ${new Date().toISOString().slice(0, 10)}.
   layout: 'carousel' a swipeable strip, 'film' poster + facts + trailer, 'stage' photos between
   the text, 'video' the film first, 'phone' an Instagram story mockup, 'story' the plain flow. */\n`;
  const body = works.map(p => JSON.stringify(clean(p), null, 2)
    .split('\n').map((l, i) => (i ? '  ' : '  ') + l).join('\n')).join(',\n');
  return `${head}window.PROJECTS = [\n${body}\n];\n`;
}

/* ── list ──────────────────────────────────────────────── */
function fillLists() {
  const imgs = new Set(), vids = new Set(), cats = new Set();
  works.forEach(p => {
    if (p.cover) imgs.add(p.cover);
    if (p.poster) imgs.add(p.poster);
    (p.images || []).forEach(i => i && imgs.add(i));
    if (p.video) vids.add(p.video);
    if (p.category) cats.add(p.category);
  });
  const opts = (id, set) => { $(id).innerHTML = [...set].sort().map(v => `<option value="${v}">`).join(''); };
  opts('#imgs', imgs); opts('#vids', vids); opts('#cats', cats);
  const f = $('#fcat'), cur = f.value;
  f.innerHTML = '<option value="">All categories</option>' + [...cats].sort().map(c => `<option>${c}</option>`).join('');
  f.value = cur;
}

function renderList() {
  const q = $('#q').value.trim().toLowerCase(), cat = $('#fcat').value;
  const ol = $('#list');
  ol.innerHTML = works.map((p, i) => {
    const hit = !q || (p.title + ' ' + p.client + ' ' + p.category + ' ' + p.slug).toLowerCase().includes(q);
    if (!hit || (cat && p.category !== cat)) return '';
    return `<li class="dl__i${i === sel ? ' on' : ''}" data-i="${i}">
      <span class="dl__th">${p.cover ? `<img src="${esc(localURL.get(p.cover) || p.cover)}" alt="" loading="lazy">` : ''}</span>
      <span class="dl__x"><b class="dl__n">${esc(p.title || 'Untitled')}</b><span class="dl__m">${esc(p.year || '—')} · ${esc(p.category || 'No category')}</span></span>
      <span class="dl__ord"><button type="button" data-mv="-1" title="Move up">&#9650;</button><button type="button" data-mv="1" title="Move down">&#9660;</button></span>
    </li>`;
  }).join('');
}

/* ── repeaters ─────────────────────────────────────────── */
function repeater(key, host, kind) {
  const p = works[sel];
  const rows = kind === 'pair' ? pairs(p[key]) : (p[key] || []);
  host.innerHTML = rows.map((v, i) => kind === 'pair'
    ? `<div class="rep__i"><div class="rep__pair">
         <input type="text" data-k="${key}" data-i="${i}" data-j="0" value="${esc(v[0])}" placeholder="Label">
         <input type="text" data-k="${key}" data-i="${i}" data-j="1" value="${esc(v[1])}" placeholder="Value"></div>
       <button type="button" class="btn btn--x" data-rm="${key}" data-i="${i}">&times;</button></div>`
    : kind === 'area'
      ? `<div class="rep__i"><textarea class="grow" data-k="${key}" data-i="${i}" rows="3">${esc(v)}</textarea>
         <button type="button" class="btn btn--x" data-rm="${key}" data-i="${i}">&times;</button></div>`
      : `<div class="rep__i"><input class="grow" type="text" data-k="${key}" data-i="${i}" value="${esc(v)}" list="imgs">
         <button type="button" class="btn btn--x" data-rm="${key}" data-i="${i}">&times;</button></div>`
  ).join('') || `<p class="hint">None yet.</p>`;
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderThumbs() {
  const p = works[sel];
  $('#thumbs').innerHTML = (p.images || []).filter(Boolean)
    .map((s, i) => `<span class="thumb"><img src="${esc(localURL.get(s) || s)}" alt="" loading="lazy"><b>${String(i + 1).padStart(2, '0')}</b></span>`).join('');
}

/* ── editor ────────────────────────────────────────────── */
function openWork(i) {
  sel = i;
  const p = works[i];
  if (!p) return;
  $('#empty').hidden = true;
  $('#form').hidden = false;
  $('#work').classList.add('is-edit');
  $('#etitle').textContent = p.title || 'Untitled';
  $('#view').href = 'project.html?p=' + encodeURIComponent(p.slug || '');
  ['title', 'slug', 'category', 'layout', 'role', 'year', 'client', 'lead', 'cover', 'video', 'poster', 'credits']
    .forEach(k => { const el = $('#f-' + k); if (el) el.value = p[k] == null ? '' : p[k]; });
  $('#f-portrait').checked = !!p.portrait;
  repeater('body', $('#r-body'), 'area');
  repeater('images', $('#r-images'), 'text');
  repeater('facts', $('#r-facts'), 'pair');
  repeater('links', $('#r-links'), 'pair');
  repeater('press', $('#r-press'), 'pair');
  repeater('awards', $('#r-awards'), 'pair');
  renderThumbs();
  checkSlug();
  renderList();
}

const slugFault = (p, i) => !p.slug ? 'missing slug'
  : !/^[a-z0-9-]+$/.test(p.slug) ? `bad slug “${p.slug}”`
  : works.some((o, j) => j !== i && o.slug === p.slug) ? `duplicate slug “${p.slug}”` : '';

function checkSlug() {
  const p = works[sel]; if (!p) return true;
  const el = $('#f-slug'), err = $('#e-slug');
  const bad = !p.slug ? 'A slug is needed — it is the web address of the page.'
    : !/^[a-z0-9-]+$/.test(p.slug) ? 'Use lowercase letters, numbers and dashes only.'
    : works.some((o, i) => i !== sel && o.slug === p.slug) ? 'Another project already uses this slug.' : '';
  el.classList.toggle('bad', !!bad);
  err.hidden = !bad; err.textContent = bad;
  return !bad;
}

/* field edits */
$('#form').addEventListener('input', e => {
  const t = e.target, p = works[sel];
  if (!p) return;
  if (t.id && t.id.startsWith('f-')) {
    const k = t.id.slice(2);
    if (k === 'portrait') p.portrait = t.checked;
    else {
      p[k] = t.value;
      if (k === 'title') { $('#etitle').textContent = t.value || 'Untitled'; renderList(); }
      if (k === 'slug') { checkSlug(); $('#view').href = 'project.html?p=' + encodeURIComponent(t.value); }
      if (k === 'cover') renderList();
    }
  } else if (t.dataset.k) {
    const k = t.dataset.k, i = +t.dataset.i;
    if (t.dataset.j != null) { p[k] = pairs(p[k]); p[k][i][+t.dataset.j] = t.value; }
    else { p[k] = p[k] || []; p[k][i] = t.value; if (k === 'images') renderThumbs(); }
  } else return;
  mark(true);
});

/* add / remove rows */
document.addEventListener('click', e => {
  const p = works[sel];
  const add = e.target.closest('[data-add]'), rm = e.target.closest('[data-rm]');
  if (add && p) {
    const k = add.dataset.add;
    p[k] = p[k] || [];
    p[k].push(['facts', 'links', 'press', 'awards'].includes(k) ? ['', ''] : '');
    openWork(sel); mark(true);
  }
  if (rm && p) {
    const k = rm.dataset.rm;
    p[k] = (p[k] || []).filter((_, i) => i !== +rm.dataset.i);
    openWork(sel); mark(true);
  }
});

/* list interactions */
$('#list').addEventListener('click', e => {
  const li = e.target.closest('.dl__i'); if (!li) return;
  const i = +li.dataset.i, mv = e.target.closest('[data-mv]');
  if (mv) {
    const j = i + (+mv.dataset.mv);
    if (j < 0 || j >= works.length) return;
    [works[i], works[j]] = [works[j], works[i]];
    if (sel === i) sel = j; else if (sel === j) sel = i;
    renderList(); mark(true);
    return;
  }
  openWork(i);
});
$('#q').addEventListener('input', renderList);
$('#fcat').addEventListener('change', renderList);
$('#back').addEventListener('click', () => $('#work').classList.remove('is-edit'));

$('#add').addEventListener('click', () => {
  works.unshift(blank());
  sel = 0; renderList(); openWork(0); mark(true);
  $('#f-title').focus();
});
$('#dup').addEventListener('click', () => {
  if (sel < 0) return;
  const c = JSON.parse(JSON.stringify(works[sel]));
  c.slug = (c.slug || 'copy') + '-copy'; c.title = c.title + ' (copy)';
  works.splice(sel + 1, 0, c); openWork(sel + 1); mark(true);
});
$('#del').addEventListener('click', () => {
  if (sel < 0) return;
  if (!confirm(`Delete “${works[sel].title || 'this project'}”? This only changes your draft until you publish.`)) return;
  works.splice(sel, 1);
  sel = -1; $('#form').hidden = true; $('#empty').hidden = false;
  $('#work').classList.remove('is-edit');
  renderList(); fillLists(); mark(true);
});

/* ── tabs ──────────────────────────────────────────────── */
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]'); if (!b) return;
  $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('.pane').forEach(p => p.classList.remove('on'));
  const pane = $('#tab-' + b.dataset.tab);
  if (b.dataset.tab === 'stats') stats();
  if (b.dataset.tab === 'publish') status();
  requestAnimationFrame(() => pane.classList.add('on'));   // lets the charts replay their entrance
});

/* ── stats: everything below is measured, never estimated ── */
function bars(host, rows) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  host.innerHTML = rows.map(([k, v]) => `<div>
    <div class="bar__h"><b>${esc(k)}</b><span>${v}</span></div>
    <div class="bar__t"><i style="--v:${(v / max).toFixed(3)}"></i></div></div>`).join('')
    || '<p class="hint">Nothing yet.</p>';
}

function sparkline(host, rows) {
  if (rows.length < 2) { host.innerHTML = '<p class="hint">Needs at least two years.</p>'; return; }
  const W = 320, H = 150, P = 22, max = Math.max(...rows.map(r => r[1]));
  const x = i => P + i * (W - P * 2) / (rows.length - 1);
  const y = v => H - 30 - (v / max) * (H - 60);
  const pts = rows.map((r, i) => [x(i), y(r[1])]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${x(rows.length - 1).toFixed(1)} ${H - 30} L${P} ${H - 30} Z`;
  const len = pts.reduce((n, p, i) => i ? n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
  host.innerHTML = `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
    <defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs>
    <line class="gl" x1="${P}" x2="${W - P}" y1="${H - 30}" y2="${H - 30}"/>
    <path class="ar" d="${area}"/><path class="ln" style="--len:${len.toFixed(1)}" d="${d}"/>
    ${pts.map(p => `<circle class="dt" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3"/>`).join('')}
    ${rows.map((r, i) => `<text x="${x(i).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(r[0])}</text>`).join('')}
    ${rows.map((r, i) => `<text x="${x(i).toFixed(1)}" y="${(y(r[1]) - 10).toFixed(1)}" text-anchor="middle" fill="#fff">${r[1]}</text>`).join('')}
  </svg>`;
}

function ring(host, part, total, label) {
  const R = 54, C = 2 * Math.PI * R, pct = total ? part / total : 0;
  host.innerHTML = `<svg width="130" height="130" viewBox="0 0 130 130" role="img">
      <circle class="bgc" cx="65" cy="65" r="${R}"/>
      <circle class="fgc" cx="65" cy="65" r="${R}" style="--c:${C.toFixed(1)};--off:${(C * (1 - pct)).toFixed(1)}"/>
    </svg>
    <div><div class="ring__k">${part} / ${total}</div><p class="hint" style="margin-top:4px">${esc(label)}</p></div>`;
}

function stats() {
  const n = works.length;
  const count = k => works.reduce((a, p) => a + ((p[k] || []).length), 0);
  const photos = count('images') + works.filter(p => p.cover).length;
  const videos = works.filter(p => p.video).length;
  const words = works.reduce((a, p) => a + (p.lead || '').split(/\s+/).filter(Boolean).length
    + (p.body || []).join(' ').split(/\s+/).filter(Boolean).length, 0);
  const clients = new Map();
  works.forEach(p => { const c = (p.client || '').trim(); if (c) clients.set(c, (clients.get(c) || 0) + 1); });
  const years = [...new Set(works.map(p => (p.year || '').slice(0, 4)).filter(y => /^\d{4}$/.test(y)))].sort();

  $('#kpis').innerHTML = [
    ['Projects', n], ['Categories', new Set(works.map(p => p.category).filter(Boolean)).size],
    ['Photos used', photos], ['Films', videos], ['Clients', clients.size], ['Words written', words]
  ].map(([k, v]) => `<div class="kpi"><b>${v}</b><span class="cap">${k}</span></div>`).join('');

  const tally = f => { const m = new Map(); works.forEach(p => { const k = (f(p) || '').trim() || '—'; m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1]); };
  bars($('#c-cat'), tally(p => p.category));
  bars($('#c-layout'), tally(p => p.layout || 'story'));
  sparkline($('#c-year'), years.map(y => [y, works.filter(p => (p.year || '').includes(y)).length]));
  ring($('#c-media'), works.filter(p => p.video || (p.images || []).length).length, n, 'project pages carrying their own photos or film');

  const press = works.flatMap(p => (p.press || []).map(r => [p.title, r[0]]));
  const awards = works.flatMap(p => (p.awards || []).map(r => [r[0], r[1]]));
  $('#c-press').innerHTML = `<div class="kpi" style="padding:0 0 14px"><b>${press.length + awards.length}</b><span class="cap">mentions on record</span></div>` +
    `<ul class="lg">${[...press.map(r => [r[1], r[0]]), ...awards].map(([a, b]) =>
      `<li><b style="font-weight:500">${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>`;
  $('#c-clients').innerHTML = `<ul class="lg">${[...clients].sort((a, b) => b[1] - a[1])
    .map(([c, v]) => `<li><b style="font-weight:500">${esc(c)}</b><span>${v} project${v > 1 ? 's' : ''}</span></li>`).join('')}</ul>`;
}

/* ── publish ───────────────────────────────────────────── */
function status() {
  const changed = JSON.stringify(works.map(clean)) !== JSON.stringify(FILE.map(clean));
  $('#status').textContent =
    `${works.length} projects in the editor, ${FILE.length} in the published file.\n` +
    (changed ? 'You have changes that are not published yet.' : 'The editor matches the published file.') +
    `\nFile size when written: ${(new Blob([serialize()]).size / 1024).toFixed(1)} kB`;
}

$('#dl').addEventListener('click', () => {
  const b = new Blob([serialize()], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'projects.js';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('File downloaded');
});
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(serialize()); toast('Copied'); }
  catch (e) { toast('Could not copy — use download'); }
});
$('#revert').addEventListener('click', () => {
  if (!confirm('Throw away every change you made here and go back to the published version?')) return;
  works = JSON.parse(JSON.stringify(FILE));
  sel = -1; store.del(DRAFT);
  $('#form').hidden = true; $('#empty').hidden = false;
  renderList(); fillLists(); mark(false); status();
  toast('Back to the published version');
});

/* GitHub: read the file's sha, then write the new content over it */
const gh = () => ({ owner: $('#gh-owner').value.trim(), repo: $('#gh-repo').value.trim(),
  branch: $('#gh-branch').value.trim() || 'main', path: $('#gh-path').value.trim(), token: $('#gh-token').value.trim() });
const log = m => { $('#gh-log').textContent = m; };

try {
  const s = JSON.parse(store.get(GH) || '{}');
  ['owner', 'repo', 'branch', 'path', 'token'].forEach(k => { if (s[k]) $('#gh-' + k).value = s[k]; });
} catch (e) { /* nothing saved yet */ }

$('#gh-save').addEventListener('click', () => { store.set(GH, JSON.stringify(gh())); toast('Settings kept in this browser'); });

async function ghGet(c) {
  const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.path}?ref=${encodeURIComponent(c.branch)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return { missing: true };
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

$('#gh-test').addEventListener('click', async () => {
  const c = gh();
  if (!c.owner || !c.repo || !c.path || !c.token) { log('Fill in owner, repository, path and token first.'); return; }
  log('Checking…');
  try {
    const f = await ghGet(c);
    log(f.missing ? `Connected. ${c.path} does not exist yet on ${c.branch} — publishing will create it.`
                  : `Connected. Found ${c.path} on ${c.branch}, ${(f.size / 1024).toFixed(1)} kB.`);
  } catch (e) { log('Failed: ' + e.message + '\nCheck the token has Contents: read and write on this repository.'); }
});

$('#gh-push').addEventListener('click', async () => {
  const c = gh();
  if (!c.owner || !c.repo || !c.path || !c.token) { log('Fill in owner, repository, path and token first.'); return; }
  const faults = works.map((p, i) => [p.title || '(untitled)', slugFault(p, i)]).filter(r => r[1]);
  if (faults.length) { log('Fix these before publishing:\n' + faults.map(r => `· ${r[0]}: ${r[1]}`).join('\n')); return; }
  if (!confirm(`Write ${works.length} projects to ${c.owner}/${c.repo} on ${c.branch}?`)) return;
  log('Publishing…');
  try {
    const cur = await ghGet(c);
    const bytes = new TextEncoder().encode(serialize());
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
    const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Studio: update ${works.length} projects`, content: btoa(bin), branch: c.branch, ...(cur.sha ? { sha: cur.sha } : {}) })
    });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 180)}`);
    const out = await r.json();
    log(`Published. Commit ${out.commit.sha.slice(0, 7)} on ${c.branch}. Your host will rebuild in a minute.`);
    mark(false); toast('Published to GitHub');
  } catch (e) { log('Failed: ' + e.message); }
});

/* ── photo upload ───────────────────────────────────────
   A phone photo is far too heavy for a web page, so every file is re-drawn
   at a sane size before it goes anywhere. The bytes then either travel to
   GitHub, or wait here to be downloaded and dropped into assets/img by hand. */
const MAX_EDGE = 2000, QUALITY = .82;
let pending = [];                                            // {name, blob} not yet on GitHub
const localURL = new Map();                                  // path -> blob URL, for previewing before upload

async function shrink(file) {
  let src;
  try { src = await createImageBitmap(file); }
  catch (e) {                                                // older Safari, or a format it will only decode through an <img>
    src = await new Promise((res, rej) => {
      const im = new Image(), u = URL.createObjectURL(file);
      im.onload = () => { URL.revokeObjectURL(u); res(im); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('this image format cannot be read here')); };
      im.src = u;
    });
  }
  const iw = src.width || src.naturalWidth, ih = src.height || src.naturalHeight;
  const k = Math.min(1, MAX_EDGE / Math.max(iw, ih));
  const c = document.createElement('canvas');
  c.width = Math.round(iw * k); c.height = Math.round(ih * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', QUALITY));
  if (!blob) throw new Error('could not convert this image');
  return { blob, w: c.width, h: c.height };
}

/* assets/img/<slug>-01.jpg, carrying on from whatever numbers are already taken */
function nextName(slug) {
  const used = new Set();
  works.forEach(p => [p.cover, p.poster, ...(p.images || [])].forEach(s => s && used.add(s)));
  pending.forEach(f => used.add('assets/img/' + f.name));
  let n = 1, path;
  do { path = `assets/img/${slug || 'photo'}-${String(n++).padStart(2, '0')}.jpg`; } while (used.has(path));
  return path;
}

function drawQueue() {
  const host = $('#upq');
  if (!pending.length) { host.innerHTML = ''; return; }
  host.innerHTML = `<div class="upq"><b>${pending.length} photo${pending.length > 1 ? 's' : ''} ready to publish</b>
    <p class="hint" style="margin-top:4px">They are already listed on this project. The picture files themselves still have to reach the site — send them to GitHub, or download them and put them in <b>assets/img</b>.</p>
    <ul>${pending.map(f => `<li><span>${esc(f.name)}</span><span>${(f.blob.size / 1024).toFixed(0)} kB</span></li>`).join('')}</ul>
    <div class="acts"><button type="button" class="btn" id="up-dl">Download the photos</button>
    <button type="button" class="btn" id="up-gh">Send photos to GitHub</button></div></div>`;
}

$('#up').addEventListener('change', async e => {
  const p = works[sel], files = [...e.target.files];
  e.target.value = '';
  if (!p || !files.length) return;
  toast(`Preparing ${files.length} photo${files.length > 1 ? 's' : ''}…`);
  for (const file of files) {
    try {
      const { blob, w, h } = await shrink(file);
      const path = nextName(p.slug);
      pending.push({ name: path.split('/').pop(), blob });
      localURL.set(path, URL.createObjectURL(blob));
      p.images = p.images || [];
      p.images.push(path);
      if (!p.cover) p.cover = path;                          // a project with no cover gets its first photo
      if (h > w && !p.portrait) p.portrait = true;           // vertical photos pair up on the page
    } catch (err) { toast('Skipped one: ' + err.message); }
  }
  openWork(sel); mark(true); drawQueue();
  toast('Photos added');
});

document.addEventListener('click', async e => {
  if (e.target.id === 'up-dl') {
    pending.forEach((f, i) => setTimeout(() => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(f.blob); a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, i * 350));
    toast('Downloading');
  }
  if (e.target.id === 'up-gh') {
    const c = gh();
    if (!c.owner || !c.repo || !c.path || !c.token) { toast('Fill in the GitHub settings first'); return; }
    const base = c.path.replace(/js\/projects\.js$/, '');   // the site root inside the repository
    const btn = e.target; btn.disabled = true;
    let done = 0;
    for (const f of [...pending]) {
      try {
        const buf = new Uint8Array(await f.blob.arrayBuffer());
        let bin = ''; buf.forEach(b => { bin += String.fromCharCode(b); });
        const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${base}assets/img/${f.name}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Studio: add ${f.name}`, content: btoa(bin), branch: c.branch })
        });
        if (!r.ok) throw new Error(`${r.status}`);
        pending = pending.filter(x => x !== f); done++;
      } catch (err) { toast(`${f.name} failed (${err.message})`); }
    }
    btn.disabled = false;
    drawQueue();
    toast(done ? `${done} photo${done > 1 ? 's' : ''} on GitHub` : 'Nothing was sent');
  }
});

/* ── visitors: read straight from the GoatCounter API ──────
   Its API sends CORS headers, so the browser can ask it directly and this
   dashboard needs no server of its own. The token stays in this browser. */
const GC_KEY = 'ak.goatcounter';
const gcCfg = () => { try { return JSON.parse(localStorage.getItem(GC_KEY) || '{}'); } catch (e) { return {}; } };

function gcLog(msg, bad) {
  const el = $('#gc-log');
  el.textContent = msg || '';
  el.classList.toggle('is-bad', !!bad);
}

async function gcGet(cfg, path, params = {}) {
  const url = new URL(`https://${cfg.code}.goatcounter.com/api/v0${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  let r;
  try {
    r = await fetch(url, { headers: { Authorization: `Bearer ${cfg.token}` } });
  } catch (e) {
    throw new Error(`could not reach ${cfg.code}.goatcounter.com — check the code and your connection`);
  }
  if (r.status === 401 || r.status === 403) throw new Error('the token was refused — check it allows "Read statistics"');
  if (r.status === 404) throw new Error(`no GoatCounter site called "${cfg.code}"`);
  if (r.status === 429) throw new Error('GoatCounter is rate limiting — wait a moment and press again');
  if (!r.ok) throw new Error(`GoatCounter answered ${r.status}`);
  return r.json();
}

/* a dense daily line: one point per day, no per-point labels */
function trend(host, rows) {
  if (rows.length < 2) { host.innerHTML = '<p class="hint">Not enough days yet.</p>'; return; }
  const W = 640, H = 170, P = 26, B = 26;
  const max = Math.max(1, ...rows.map(r => r[1]));
  const x = i => P + i * (W - P * 2) / (rows.length - 1);
  const y = v => H - B - (v / max) * (H - B - 18);
  const pts = rows.map((r, i) => [x(i), y(r[1])]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `${d} L${x(rows.length - 1).toFixed(1)} ${H - B} L${P} ${H - B} Z`;
  const len = pts.reduce((n, p, i) => i ? n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
  const day = s => s.slice(8) + '/' + s.slice(5, 7);
  const peak = rows.reduce((b, r, i) => r[1] > rows[b][1] ? i : b, 0);
  host.innerHTML = `<svg class="spark" style="height:170px" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"
      aria-label="Views per day, peak ${max}">
    <defs><linearGradient id="gcfade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs>
    <line class="gl" x1="${P}" x2="${W - P}" y1="${H - B}" y2="${H - B}"/>
    <path class="ar" d="${area}"/><path class="ln" style="--len:${len.toFixed(1)}" d="${d}"/>
    <circle class="dt" cx="${pts[peak][0].toFixed(1)}" cy="${pts[peak][1].toFixed(1)}" r="3.5"/>
    <text x="${pts[peak][0].toFixed(1)}" y="${(pts[peak][1] - 9).toFixed(1)}" text-anchor="middle" fill="#fff">${rows[peak][1]}</text>
    <text x="${P}" y="${H - 8}" text-anchor="start">${day(rows[0][0])}</text>
    <text x="${W - P}" y="${H - 8}" text-anchor="end">${day(rows[rows.length - 1][0])}</text>
  </svg>`;
}

/* /work.html and ?p=slug mean more to him as titles than as paths */
function gcLabel(path) {
  const clean = String(path || '/').split('#')[0];
  const slug = (clean.match(/[?&]p=([^&]+)/) || [])[1];
  if (slug) {
    const w = works.find(p => p.slug === slug);
    return w ? w.title : slug;
  }
  const file = clean.replace(/^\//, '').replace(/\.html$/, '');
  return ({ '': 'Home', 'index': 'Home', 'work': 'All work', 'bts': 'Behind the scenes',
            'contact': 'Start a project', '404': 'Not found' })[file] || clean;
}

async function gcShow() {
  const cfg = { code: $('#gc-code').value.trim().replace(/\..*$/, ''), token: $('#gc-token').value.trim() };
  if (!cfg.code || !cfg.token) { gcLog('Fill in the code and the token first.', true); return; }
  const days = +$('#gc-range').value || 30;
  const end = new Date();
  const start = new Date(end.getTime() - days * 864e5);
  const iso = d => d.toISOString().slice(0, 19) + 'Z';
  const range = { start: iso(start), end: iso(end) };
  const btn = $('#gc-load');

  btn.disabled = true;
  gcLog('Asking GoatCounter…');
  try {
    // one at a time: five at once trips GoatCounter's rate limit
    const total = await gcGet(cfg, '/stats/total', range);
    const hits  = await gcGet(cfg, '/stats/hits', { ...range, group: 'day', limit: 10 });
    // the breakdowns are a bonus: if one is refused the headline numbers still show
    const side = async p => { try { return await gcGet(cfg, p, { ...range, limit: 6 }); } catch (e) { return null; } };
    const refs = await side('/stats/toprefs');
    const loc  = await side('/stats/locations');
    const br   = await side('/stats/browsers');

    // the daily series comes per path, so add the days up across all of them
    const perDay = new Map();
    (hits.hits || []).forEach(h => (h.stats || []).forEach(s => {
      perDay.set(s.day, (perDay.get(s.day) || 0) + (s.daily || 0));
    }));
    const series = [...perDay.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
    const views = total.total || 0;
    const busiest = series.reduce((b, r) => r[1] > b[1] ? r : b, ['—', 0]);
    const perDayAvg = series.length ? Math.round(views / series.length) : 0;

    $('#gc-kpis').innerHTML = [
      ['Views', views],
      ['Pages seen', (hits.hits || []).length],
      ['Busiest day', busiest[1]],
      ['Average a day', perDayAvg]
    ].map(([k, v]) => `<div class="kpi"><b>${v}</b><span class="cap">${esc(k)}</span></div>`).join('');

    trend($('#gc-trend'), series);
    bars($('#gc-pages'), (hits.hits || []).map(h => [gcLabel(h.path), h.count]));
    bars($('#gc-refs'), ((refs && refs.stats) || []).map(s => [s.name || 'Typed or bookmarked', s.count]));
    bars($('#gc-loc'), ((loc && loc.stats) || []).map(s => [s.name || 'Unknown', s.count]));
    bars($('#gc-br'), ((br && br.stats) || []).map(s => [s.name || 'Unknown', s.count]));

    $('#gc-out').hidden = false;
    gcLog(views ? `${views} views in the last ${days} days.` : 'Connected, but nobody has visited in this period yet.');
  } catch (err) {
    $('#gc-out').hidden = true;
    gcLog(err.message, true);
  } finally {
    btn.disabled = false;
  }
}

(() => {
  const c = gcCfg();
  if (c.code) $('#gc-code').value = c.code;
  if (c.token) $('#gc-token').value = c.token;
})();

$('#gc-save').addEventListener('click', () => {
  const c = { code: $('#gc-code').value.trim().replace(/\..*$/, ''), token: $('#gc-token').value.trim() };
  try { localStorage.setItem(GC_KEY, JSON.stringify(c)); toast('Saved in this browser'); }
  catch (e) { toast('This browser refused to store it'); }
});
/* GoatCounter's own script skips a visit when this key is set, and the dashboard
   shares the site's origin, so the switch reaches the live site directly. */
const gcSkip = $('#gc-skip');
try { gcSkip.checked = localStorage.getItem('skipgc') === 't'; } catch (e) { /* storage blocked */ }
gcSkip.addEventListener('change', () => {
  try {
    if (gcSkip.checked) localStorage.setItem('skipgc', 't');
    else localStorage.removeItem('skipgc');
    toast(gcSkip.checked ? 'Your visits stop counting on this device' : 'Your visits count again');
  } catch (e) {
    gcSkip.checked = !gcSkip.checked;
    toast('This browser refused to store the choice');
  }
});

/* the purge page belongs to whichever site code is filled in */
const gcPurge = () => {
  const code = $('#gc-code').value.trim().replace(/\..*$/, '') || 'abdellah';
  $('#gc-purge').href = `https://${code}.goatcounter.com/settings/purge`;
};
gcPurge();
$('#gc-code').addEventListener('input', gcPurge);

$('#gc-load').addEventListener('click', gcShow);
$('#gc-range').addEventListener('change', () => { if (!$('#gc-out').hidden) gcShow(); });

/* a small hook so the generated file can be checked without downloading it */
window.__studio = { serialize, get works() { return works; } };

/* ── boot ──────────────────────────────────────────────── */
fillLists();
renderList();
mark(dirty);
status();
if (!works.length) $('#empty').innerHTML = '<p>No projects found.<br>Check that js/projects.js loaded.</p>';
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
})();
