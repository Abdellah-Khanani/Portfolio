/* ═══════════════════════════════════════════════════════════════
   Page renderers: project page, Instagram grid, stills lightbox,
   project request form, 404 screen. Runs before app.js so the motion
   engine finds the rendered markup. Every function is guarded.
   ═══════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const root = document.documentElement;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const pad2 = n => String(n).padStart(2, '0');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* ───────────────────────── PROJECT PAGE ───────────────────────── */
function project() {
  const main = $('main.pj');
  if (!main) return;
  const list = (window.PROJECTS || []).filter(p => !p.hidden);
  const slug = new URLSearchParams(location.search).get('p');
  const i = list.findIndex(p => p.slug === slug);
  if (i < 0) { location.replace('404.html'); return; }

  const p = list[i];
  const next = list[(i + 1) % list.length];
  const prev = list[(i - 1 + list.length) % list.length];
  document.title = `${p.title}, a project by Abdellah Khanani`;
  main.dataset.layout = p.layout || 'story';

  const slot = k => $(`[data-pj="${k}"]`, main);
  slot('index').textContent = `${pad2(i + 1)} / ${pad2(list.length)}`;
  slot('title').textContent = p.title;
  slot('category').textContent = p.category;

  // every field is shown; the ones not filled in yet in js/projects.js read as placeholders
  const meta = [['Role', p.role], ['Year', p.year], ['Client', p.client]];
  slot('meta').innerHTML = meta.map(([k, v]) => `<dt class="cap">${k}</dt>` +
    (v ? `<dd>${esc(v)}</dd>` : `<dd class="pj__tbd">To be added</dd>`)).join('');

  const desc = slot('description');
  if (p.lead) desc.textContent = p.lead;
  else { desc.textContent = 'Project description to be added.'; desc.classList.add('pj__tbd'); }

  slot('pn').innerHTML =
    `<a href="project.html?p=${esc(prev.slug)}" data-pt="${esc(prev.title)}">Previous</a>` +
    `<a href="project.html?p=${esc(next.slug)}" data-pt="${esc(next.title)}">Next</a>`;

  // ── pieces the compositions are built from
  // every photograph has a full-quality twin in assets/hd/ (same name, .webp) that loads only
  // when asked for, from the HD button or the viewer; the page itself keeps its light files
  const hd = src => 'assets/hd/' + String(src).split('/').pop().replace(/\.\w+$/, '.webp');
  const hdb = what => `<button class="hdb" type="button" aria-label="View ${esc(what)} in full quality">` +
    `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"/></svg><span>HD</span></button>`;
  const cover = () => p.cover
    ? `<figure class="pj__fig pj__cover${p.fit === 'contain' ? ' pj__cover--fit' : ''} pj__shot" data-hd="${esc(hd(p.cover))}"><img src="${esc(p.cover)}" srcset="${esc(p.cover)} 1100w, ${esc(hd(p.cover))} 2400w" sizes="100vw" alt="${esc(p.title)}">${hdb(p.title + ', cover')}</figure>`
    : `<div class="pj__fig pj__cover pj__ph"><span class="cap">Photos coming</span></div>`;
  // designed artwork (a stream pack, a poster) must be seen whole, never cropped to a box
  const FIT = p.fit === 'contain';
  const fig = src => `<figure class="pj__fig${FIT ? ' pj__fig--fit' : ''} pj__shot" data-hd="${esc(hd(src))}">` +
    `<img src="${esc(src)}" alt="${esc(p.title)}, still" loading="lazy" onload="this.classList.add('is-on')">${hdb(p.title + ', photo ' + (imgs.indexOf(src) + 1))}</figure>`;
  const ph = (cls, label) => `<div class="pj__fig pj__ph ${cls}"><span class="cap">${label}</span></div>`;
  const video = () => {
    if (!p.video) return ph('pj__ph--wide', 'Video');
    return /\.(mp4|webm)$/i.test(p.video)
      // a file hosted with the site plays inline; anything else is treated as an embed URL
      ? `<div class="pj__fig pj__video"><video src="${esc(p.video)}" poster="${esc(p.poster || p.cover)}" controls playsinline preload="metadata"></video></div>`
      : `<div class="pj__fig pj__video"><iframe src="${esc(p.video)}" title="${esc(p.title)}, video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  };
  const para = (from, to) => {
    const t = (p.body || []).slice(from, to);
    return t.length ? `<div class="pj__text">${t.map(x => `<p>${esc(x)}</p>`).join('')}</div>` : '';
  };
  const facts = () => (p.facts || []).length
    ? `<dl class="pj__facts">${p.facts.map(([k, v]) => `<div><dt class="cap">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '';
  const links = () => (p.links || []).length
    ? `<p class="pj__links">${p.links.map(([l, u]) => `<a class="uh" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join('')}</p>` : '';
  const credits = () => p.credits ? `<p class="pj__credits cap">${esc(p.credits)}</p>` : '';
  const press = () => {
    const P = p.press || [], A = p.awards || [];
    if (!P.length && !A.length) return '';
    const list = (rows, cls) => `<ul class="pj__press-l${cls}">` + rows.map(([k, v]) =>
      `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join('') + '</ul>';
    return '<section class="pj__press">' +
      (P.length ? '<span class="kick">Press &amp; media</span>' + list(P, '') : '') +
      (A.length ? '<span class="kick">Awards &amp; festivals</span>' + list(A, ' pj__press-l--aw') : '') +
      '</section>';
  };
  const imgs = (p.images || []).filter(Boolean);
  const rhythm = from => {
    const out = [];
    // portrait sets go two by two, so no single vertical photo fills the whole column
    if (FIT) { for (let k = from; k < imgs.length; k++) out.push(fig(imgs[k])); return out.join(''); }
    if (p.portrait) {
      for (let k = from; k < imgs.length; k += 2)
        out.push(`<div class="pj__duo${imgs[k + 1] ? '' : ' pj__duo--solo'}">${fig(imgs[k])}${imgs[k + 1] ? fig(imgs[k + 1]) : ''}</div>`);
      return out.join('');
    }
    for (let k = from; k < imgs.length;) {
      if ((k - from) % 3 === 1 && imgs[k + 1]) { out.push(`<div class="pj__duo">${fig(imgs[k])}${fig(imgs[k + 1])}</div>`); k += 2; }
      else { out.push(fig(imgs[k])); k += 1; }
    }
    return out.join('');
  };
  // the story ad is shown the way it went out: a phone, in portrait, with Instagram's own chrome
  const phone = () => {
    const src = p.video, handle = 'abdellah_khanani';
    const inner = /\.(mp4|webm)$/i.test(src)
      ? `<video src="${esc(src)}" poster="${esc(p.poster || '')}" controls playsinline loop preload="metadata"></video>`
      : `<div class="pj__ph"><span class="cap">Video</span></div>`;
    return `<figure class="pj__phone"><div class="pj__device"><div class="pj__screen">${inner}` +
      `<div class="pj__bars" aria-hidden="true"><i class="is-on"></i><i></i><i></i></div>` +
      `<div class="pj__story"><img class="pj__av" src="assets/logo/ak-icon-180.png" alt="">` +
      `<span class="pj__who"><b>${handle}</b><em>Partnership pubblicizzata</em></span></div>` +
      `</div></div><figcaption class="cap">The story as it was published</figcaption></figure>`;
  };
  const swipe = () => imgs.length
    ? `<section class="pj__swipe" aria-label="${esc(p.title)}, photo set"><div class="pj__strip">` +
      imgs.map((s, n) => `<figure class="pj__slide" data-hd="${esc(hd(s))}"><img src="${esc(s)}" alt="${esc(p.title)}, photo ${n + 1}" loading="lazy">` +
        `<figcaption class="cap">${pad2(n + 1)} / ${pad2(imgs.length)}</figcaption>${hdb(p.title + ', photo ' + (n + 1))}</figure>`).join('') +
      `</div><p class="cap pj__hint"><span class="pj__hint--m">Drag to browse</span><span class="pj__hint--t">Swipe</span></p></section>`
    : '';

  // ── five compositions, so the pages do not all read the same
  const L = p.layout || 'story';
  let media;
  if (L === 'carousel') {
    media = cover() + para(0, 2) + swipe() + para(2) + facts() + links() + credits();
  } else if (L === 'film') {
    media = `<div class="pj__poster">${cover()}${facts()}</div>` + para(0, 2) + (p.video ? video() : '') +
            para(2) + rhythm(0) + press() + links() + credits();
  } else if (L === 'phone') {
    media = phone() + para(0, 2) + cover() + para(2) + links() + credits();
  } else if (L === 'video') {
    media = video() + para(0, 2) + cover() + para(2) + rhythm(0) + links() + credits();
  } else if (L === 'gallery') {
    const lock = p.brand
      ? `<div class="gl__brand"><img src="${esc(p.brand.logo)}" alt="${esc(p.brand.name)}" width="${p.brand.w || 600}" height="${p.brand.h || 140}"><span class="cap">&times; Abde</span></div>`
      : '';
    media = lock + cover() + para(0, 1);
  } else if (L === 'stage') {
    media = FIT
      ? cover() + para(0, 1) + rhythm(0) + para(1) + facts() + links() + credits()
      : cover() + para(0, 1) + (p.video ? video() : '') + (imgs[0] ? fig(imgs[0]) : '') + para(1, 2) +
        (imgs[1] && imgs[2] ? `<div class="pj__duo">${fig(imgs[1])}${fig(imgs[2])}</div>` : '') +
        para(2) + rhythm(3) + facts() + links() + credits();
  } else {
    media = cover() + para(0, 2) + (p.video ? video() : '') + (p.portrait ? rhythm(0) + para(2) : para(2) + rhythm(0)) + facts() + links() + credits();
    if (!imgs.length && !p.video) media = cover() + para(0, 2) + ph('pj__ph--wide', 'Video') + para(2) +
      `<div class="pj__duo">${ph('', 'Still 01')}${ph('', 'Still 02')}</div>` + facts() + links() + credits();
  }
  slot('media').innerHTML = media;

  // the gallery: the night told beat by beat while its photographs pass, then the whole wall
  if (L === 'gallery' && imgs.length) {
    const grid = $('.pj__grid'), host = grid && grid.parentNode;
    if (host) {
      const beats = (p.body || []).slice(1);
      // only three photographs carry the telling — the rest belong to the wall below,
      // otherwise a set of fifty turns this section into an endless scroll
      // storyShots (photo numbers, from 1) picks them by hand; otherwise they are spread evenly
      const SHOW = 3;
      const spread = (p.storyShots || []).map(n => imgs[n - 1]).filter(Boolean);
      if (!spread.length) for (let k = 0; k < Math.min(SHOW, imgs.length); k++)
        spread.push(imgs[Math.round(k * (imgs.length - 1) / Math.max(1, Math.min(SHOW, imgs.length) - 1))]);
      const share = beats.map((_, i) => Math.floor(spread.length / beats.length) + (i < spread.length % beats.length ? 1 : 0));
      const gl = document.createElement('section');
      gl.className = 'gl';
      gl.innerHTML =
        (beats.length ? `<div class="gl__story">` +
          `<div class="gl__words">` + beats.map((t, i) => {
            const head = (p.beatTitles || [])[i];
            return `<div class="gl__beat${i ? '' : ' is-on'}" data-beat="${i}">` +
              (head ? `<h3>${esc(head)}</h3>` : '') + `<p>${esc(t)}</p></div>`;
          }).join('') +
          `<span class="gl__n cap"><b>01</b> / ${pad2(beats.length)}</span></div>` +
          `<div class="gl__run">` + beats.map((t, i) => {
            const from = share.slice(0, i).reduce((a2, b) => a2 + b, 0);
            const set = spread.slice(from, from + share[i]);
            return `<div class="gl__step" data-step="${i}">` + (set.length ? set : [spread[0] || imgs[0]]).map(src => {
              const r = (p.ratios || [])[imgs.indexOf(src)];
              return `<figure class="gl__f pj__shot" data-hd="${esc(hd(src))}"${r ? ` style="aspect-ratio:${r}"` : ''}>` +
                `<img src="${esc(src)}" alt="${esc(p.title)}" loading="lazy">${hdb(p.title + ', photo ' + (imgs.indexOf(src) + 1))}</figure>`;
            }).join('') + `</div>`;
          }).join('') + `</div></div>` : '') +
        `<div class="gl__wallHead"><span class="kick">Every frame</span>` +
        `<span class="cap">${pad2(imgs.length)} photographs</span></div>` +
        `<div class="gl__wall">` + imgs.map((src, n) => {
          const r = (p.ratios || [])[n];
          return `<figure class="gl__t pj__shot" data-hd="${esc(hd(src))}"${r ? ` style="aspect-ratio:${r}"` : ''}>` +
            `<img src="${esc(src)}" alt="${esc(p.title)}, ${n + 1}" loading="lazy">` +
            `<figcaption class="cap">${pad2(n + 1)}</figcaption>${hdb(p.title + ', photo ' + (n + 1))}</figure>`;
        }).join('') + `</div>`;
      host.insertBefore(gl, grid.nextSibling);
    }
  }

  // the POV chapter: the clip sits in the folded phone it was shot on, and the scroll walks into the screen
  if (p.pov && p.pov.video) {
    const grid = $('.pj__grid'), host = grid && grid.parentNode;
    if (host) {
      const pv = document.createElement('section');
      pv.className = 'pv';
      pv.setAttribute('data-pov', '');
      pv.dataset.lx = p.pov.lensX == null ? 20 : p.pov.lensX;
      pv.dataset.ly = p.pov.lensY == null ? 47 : p.pov.lensY;
      // a home screen drawn from scratch: our own shapes, not anyone else's artwork
      const SV = g => `<svg viewBox="0 0 48 48" aria-hidden="true">${g}</svg>`;
      const ICONS = {
        cal:   ['#fff',   SV('<text x="24" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#ff3b30" font-family="sans-serif">WED</text><text x="24" y="40" text-anchor="middle" font-size="24" font-weight="300" fill="#1c1c1e" font-family="sans-serif">1</text>')],
        pho:   ['#fff',   SV('<g><circle cx="24" cy="24" r="6" fill="#ffd60a"/><ellipse cx="24" cy="14" rx="5" ry="9" fill="#ff9f0a" opacity=".85"/><ellipse cx="24" cy="34" rx="5" ry="9" fill="#ff375f" opacity=".85"/><ellipse cx="14" cy="24" rx="9" ry="5" fill="#32d74b" opacity=".85"/><ellipse cx="34" cy="24" rx="9" ry="5" fill="#0a84ff" opacity=".85"/></g>')],
        cam:   ['#3a3a3c', SV('<circle cx="24" cy="24" r="12" fill="#1c1c1e"/><circle cx="24" cy="24" r="7" fill="#0a84ff" opacity=".8"/><circle cx="20" cy="20" r="2.5" fill="#fff" opacity=".7"/>')],
        mail:  ['#1a8cff', SV('<rect x="9" y="15" width="30" height="20" rx="3" fill="#fff"/><path d="M10 17l14 10 14-10" stroke="#1a8cff" stroke-width="2.4" fill="none"/>')],
        note:  ['#fff',   SV('<rect x="8" y="8" width="32" height="8" fill="#ffd60a"/><g stroke="#c7c7cc" stroke-width="2"><path d="M13 23h22M13 29h22M13 35h14"/></g>')],
        clk:   ['#fff',   SV('<circle cx="24" cy="24" r="17" fill="none" stroke="#1c1c1e" stroke-width="1.5"/><path d="M24 24V12" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round"/><path d="M24 24l8 5" stroke="#ff9f0a" stroke-width="2.4" stroke-linecap="round"/>')],
        map:   ['#e8f5e9', SV('<path d="M0 30l20-8 28 6v20H0z" fill="#8ed08e"/><path d="M0 12l16 6 32-10v14L16 32 0 26z" fill="#a8d5ff"/><circle cx="26" cy="22" r="5" fill="#0a84ff"/><circle cx="26" cy="22" r="2" fill="#fff"/>')],
        tv:    ['#0b0b0b', SV('<text x="24" y="31" text-anchor="middle" font-size="17" font-weight="600" fill="#fff" font-family="sans-serif">tv</text>')],
        store: ['#1d7bf0', SV('<path d="M24 12l9 18M24 12l-9 18M14 30h20" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>')],
        heart: ['#fff',   SV('<path d="M24 36s-11-7-11-14a6 6 0 0111-3 6 6 0 0111 3c0 7-11 14-11 14z" fill="#ff2d55"/>')],
        wal:   ['#1c1c1e', SV('<rect x="9" y="16" width="30" height="7" rx="2.5" fill="#ff9f0a"/><rect x="9" y="24" width="30" height="7" rx="2.5" fill="#30d158"/><rect x="9" y="32" width="30" height="5" rx="2.5" fill="#0a84ff"/>')],
        set:   ['#8e8e93', SV('<circle cx="24" cy="24" r="9" fill="none" stroke="#f2f2f7" stroke-width="3"/><g stroke="#f2f2f7" stroke-width="3" stroke-linecap="round"><path d="M24 8v5M24 35v5M8 24h5M35 24h5M13 13l3.5 3.5M31.5 31.5L35 35M35 13l-3.5 3.5M16.5 31.5L13 35"/></g>')],
        wea:   ['#4aa8ff', SV('<circle cx="19" cy="20" r="7" fill="#ffd60a"/><path d="M15 34h18a6 6 0 000-12 9 9 0 00-17 3 5 5 0 00-1 9z" fill="#fff"/>')],
        pho2:  ['#30d158', SV('<path d="M15 14c6 0 4 6 6 8s-3 3-2 6 5 7 8 8 4-4 6-2 8 0 8 6-10 5-17 0-13-13-14-19 1-7 5-7z" fill="#fff"/>')],
        saf:   ['#fff',   SV('<circle cx="24" cy="24" r="16" fill="#1a8cff"/><path d="M32 16l-5 11-11 5 5-11z" fill="#fff"/><path d="M27 27l-11 5 5-11z" fill="#ff3b30"/>')],
        msg:   ['#30d158', SV('<path d="M24 12c9 0 15 5 15 11s-6 11-15 11c-2 0-4 0-6-1l-7 3 2-6c-2-2-4-4-4-7 0-6 6-11 15-11z" fill="#fff"/>')],
        mus:   ['#ff2d55', SV('<path d="M31 12v18a5 5 0 11-3-4.5V18l-9 2v14a5 5 0 11-3-4.5V16z" fill="#fff"/>')]
      };
      pv.innerHTML =
        `<h2 class="pv__back"><span>Behind the</span><span>scenes</span></h2>` +
        `<div class="pv__hold"><div class="pv__phone">` +
          `<div class="pv__screen">` +
            `<video class="pv__v" src="${esc(p.pov.video)}" poster="${esc(p.pov.poster || '')}" muted loop playsinline preload="metadata"></video>` +
          `</div>` +
          `<img class="pv__frame" src="assets/img/device-fold.webp" alt="" aria-hidden="true">` +
        `</div></div>` +
        `<div class="pv__cap"><span class="kick">POV</span><p>${esc(p.pov.note || '')}</p></div>`;
      host.insertBefore(pv, grid.nextSibling);
    }
  }

  // the strip is dragged with a mouse too, not only swiped
  const strip = $('.pj__strip', main);
  if (strip) {
    let down = false, x0 = 0, left0 = 0;
    strip.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      down = true; x0 = e.clientX; left0 = strip.scrollLeft; strip.classList.add('is-drag');
    });
    addEventListener('pointermove', e => { if (down) strip.scrollLeft = left0 - (e.clientX - x0); }, { passive: true });
    addEventListener('pointerup', () => { down = false; strip.classList.remove('is-drag'); }, { passive: true });
  }

  const nx = slot('next');
  nx.href = `project.html?p=${next.slug}`;
  nx.dataset.slug = next.slug;
  nx.dataset.cur = 'open';
  nx.innerHTML = (next.cover ? `<img src="${esc(next.cover)}" alt="" loading="lazy">` : '') +
    `<span class="pj__nextIn"><span class="cap">Next project</span><span class="pj__nextT">${esc(next.title)}</span><em>${esc(next.category)}</em></span>`;

  root.removeAttribute('data-pending');
}

/* ───────────────────────── ALL WORK ─────────────────────────
   Every project from js/projects.js, as an editorial grid or a title index,
   filtered by category. The chosen view is remembered per visitor. */
function workIndex() {
  const page = $('[data-work]');
  if (!page) return;
  const list = (window.PROJECTS || []).filter(p => !p.hidden);
  const cats = [...new Set(list.map(p => p.category).filter(Boolean))];
  const filters = $('[data-work-filters]', page), grid = $('[data-work-grid]', page);
  const index = $('[data-work-index]', page), count = $('[data-work-count]', page);
  const link = p => `href="project.html?p=${esc(p.slug)}" data-slug="${esc(p.slug)}" data-cur="open" data-cat="${esc(p.category)}"`;

  filters.innerHTML = [['All', '', list.length], ...cats.map(c => [c, c, list.filter(p => p.category === c).length])]
    .map(([label, cat, n]) => `<button type="button" class="wk__f" data-cat="${esc(cat)}" aria-pressed="false">${esc(label)}<sup>${pad2(n)}</sup></button>`).join('');
  const thumb = p => p.cover
    ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">`
    : `<span class="cap wk__soon">Photos coming</span>`;
  grid.innerHTML = list.map((p, i) =>
    `<a class="wk__card" ${link(p)}><span class="wk__img">${thumb(p)}</span>` +
    `<span class="wk__meta"><span class="cap">${pad2(i + 1)}</span><b>${esc(p.title)}</b><em>${esc(p.category)}</em></span></a>`).join('');
  index.innerHTML = list.map((p, i) =>
    `<a class="wk__row" ${link(p)}><span class="cap">${pad2(i + 1)}</span><b>${esc(p.title)}</b><em>${esc(p.category)}</em>` +
    `<span class="cap wk__yr">${esc(p.year || '—')}</span>` +
    (p.cover ? `<span class="wk__thumb" aria-hidden="true"><img src="${esc(p.cover)}" alt="" loading="lazy"></span>` : '') + `</a>`).join('');

  const reveal = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  $$('.wk__card, .wk__row', page).forEach(el => (reveal ? reveal.observe(el) : el.classList.add('in')));

  const apply = cat => {
    const shown = [];
    $$('.wk__card, .wk__row', page).forEach(el => {
      const on = !cat || el.dataset.cat === cat;
      el.classList.toggle('is-out', !on);
      el.classList.remove('pop');
      if (on) shown.push(el);
    });
    // editorial rhythm on what is visible: large, small (dropped), small, large
    shown.filter(el => el.classList.contains('wk__card')).forEach((el, i) => { el.dataset.size = ['l', 'so', 's', 'l'][i % 4]; });
    void page.offsetWidth;
    shown.forEach(el => el.classList.add('pop', 'in'));
    const n = shown.filter(el => el.classList.contains('wk__card')).length;
    count.textContent = `${pad2(n)} ${n === 1 ? 'project' : 'projects'}`;
    $$('.wk__f', filters).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    window.ScrollTrigger?.refresh();
  };
  filters.addEventListener('click', e => { const b = e.target.closest('.wk__f'); if (b) apply(b.dataset.cat); });

  const views = $$('[data-view]', page);
  const setView = v => {
    page.dataset.mode = v;
    views.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    try { localStorage.setItem('ak:work-view', v); } catch (e) { /* storage unavailable */ }
    window.ScrollTrigger?.refresh();
  };
  views.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  let saved = null;
  try { saved = localStorage.getItem('ak:work-view'); } catch (e) { saved = null; }
  setView(saved === 'grid' ? 'grid' : 'index');   // index first, grid on request
  root.removeAttribute('data-pending');
  apply('');
}

/* ───────────────────────── INSTAGRAM GRID ───────────────────────── */
function instagram() {
  const grid = $('[data-ig]');
  if (!grid) return;
  const all = (window.IG_POSTS || []).filter(p => p && p.url).slice(0, 9);
  // an embed always opens on a post's first photo, so a post without local images is embedded once
  const base = u => u.split('?')[0].replace('/reel/', '/p/');
  const seen = new Set();
  const posts = all.filter(p => p.image || (!seen.has(base(p.url)) && seen.add(base(p.url))));
  const follow = $('.ig__follow');

  // no fake posts: without real links the section is a single call to action
  if (!posts.length) {
    grid.classList.add('is-empty');
    if (follow) follow.hidden = true;
    grid.innerHTML = `<div class="ig__empty"><p>Recent reels and stills are on Instagram.</p>` +
      `<a class="pill pill--lg" href="https://instagram.com/abdellah_khanani" target="_blank" rel="noopener"><span>Open Instagram</span></a></div>`;
    return;
  }
  grid.innerHTML = posts.map(p => p.image
    ? `<a class="ig__post" href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.image)}" alt="${esc(p.alt || 'Instagram post')}" loading="lazy"></a>`
    : `<div class="ig__post ig__post--embed"><blockquote class="instagram-media" data-instgrm-permalink="${esc(base(p.url))}" data-instgrm-version="14"></blockquote></div>`
  ).join('');
  if (posts.some(p => !p.image)) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(s);
  }
}

/* ───────────────────────── STILLS LIGHTBOX ───────────────────────── */
function lightbox() {
  const lb = $('#lb'), items = $$('.bt__ph').length ? $$('.bt__ph') : $$('[data-hd]');
  if (!lb || !items.length) return;
  const img = $('.lb__img', lb), count = $('.lb__count', lb);
  const q = $('.lb__q', lb), zoomBtn = $('.lb__zoom', lb);
  let i = 0, lastFocus = null, want = '';

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = k => {
    i = (k + items.length) % items.length;
    const it = items[i], src = $('img', it);
    const full = it.dataset.hd || src.dataset.full;
    resetZoom();
    lb.classList.remove('is-hd');
    // the photo on the page shows at once; the full-quality file replaces it the moment it lands
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    count.textContent = `${pad2(i + 1)} / ${pad2(items.length)}`;
    if (q) q.textContent = full ? 'Loading full quality…' : '';
    if (zoomBtn) zoomBtn.hidden = true;
    want = full || '';
    if (!full) return;
    const hi = new Image();
    hi.decoding = 'async';
    hi.onload = () => {
      if (want !== full) return;          // the visitor already moved on
      img.src = full;
      lb.classList.add('is-hd');
      if (q) q.textContent = `HD · ${hi.naturalWidth} × ${hi.naturalHeight}`;
      if (zoomBtn) zoomBtn.hidden = false;
    };
    hi.onerror = () => { if (want === full && q) q.textContent = ''; };
    hi.src = full;
  };
  const open = k => {
    lastFocus = document.activeElement;
    show(k);
    lb.hidden = false;
    void lb.offsetWidth;        // paint it hidden-to-shown first, so the entrance actually animates
    lb.classList.add('is-on');
    document.body.classList.add('lock');
    window.__lenis?.stop();
    $('.lb__close', lb).focus();
  };
  const close = () => {
    lb.classList.remove('is-on');
    resetZoom();
    lb.hidden = true;
    document.body.classList.remove('lock');
    window.__lenis?.start();
    lastFocus?.focus();
  };

  // zoom: the photo grows to its real detail and follows the pointer, so moving across it explores
  // the frame (a finger drags it instead); everything runs on one transform, eased every frame
  const Z = { k: 1, x: 0, y: 0, tk: 1, tx: 0, ty: 0, raf: 0, base: null, px: .5, py: .5 };
  const zoomLevel = () => {
    const r = Z.base, dpr = Math.min(devicePixelRatio || 1, 2);
    return Math.min(Math.max(img.naturalWidth / dpr / r.width, 2), 5);
  };
  const aim = () => {
    // where the enlarged photo sits for the pointer at (px, py), a fraction of the viewer
    const r = Z.base, vw = lb.clientWidth, vh = lb.clientHeight, W = r.width * Z.tk, H = r.height * Z.tk;
    const left = W > vw ? -Z.px * (W - vw) : (vw - W) / 2;
    const top = H > vh ? -Z.py * (H - vh) : (vh - H) / 2;
    Z.tx = left - r.left; Z.ty = top - r.top;
  };
  const tick = () => {
    const f = RM ? 1 : .16;
    Z.k += (Z.tk - Z.k) * f; Z.x += (Z.tx - Z.x) * f; Z.y += (Z.ty - Z.y) * f;
    img.style.transform = `translate(${Z.x}px, ${Z.y}px) scale(${Z.k})`;
    const still = Math.abs(Z.tk - Z.k) < .002 && Math.abs(Z.tx - Z.x) < .3 && Math.abs(Z.ty - Z.y) < .3;
    if (!still) { Z.raf = requestAnimationFrame(tick); return; }
    Z.raf = 0;
    if (Z.tk === 1) { img.style.transform = ''; lb.classList.remove('is-zoom', 'is-zooming'); }
  };
  const run = () => { if (!Z.raf) Z.raf = requestAnimationFrame(tick); };
  const zoomIn = (clientX, clientY) => {
    if (!lb.classList.contains('is-hd') || lb.classList.contains('is-zoom')) return;
    img.style.transform = '';
    Z.base = img.getBoundingClientRect();
    Z.k = 1; Z.x = 0; Z.y = 0; Z.tk = zoomLevel();
    Z.px = clientX == null ? .5 : clientX / lb.clientWidth;
    Z.py = clientY == null ? .5 : clientY / lb.clientHeight;
    lb.classList.add('is-zoom', 'is-zooming');
    aim(); run(); syncZoomBtn();
  };
  const zoomOut = () => {
    if (!lb.classList.contains('is-zoom')) return;
    Z.tk = 1; Z.tx = 0; Z.ty = 0;
    lb.classList.remove('is-zooming');
    run(); syncZoomBtn();
  };
  function resetZoom() {
    cancelAnimationFrame(Z.raf); Z.raf = 0; Z.k = Z.tk = 1;
    img.style.transform = ''; lb.classList.remove('is-zoom', 'is-zooming'); syncZoomBtn();
  }
  function syncZoomBtn() {
    if (!zoomBtn) return;
    const on = lb.classList.contains('is-zooming');
    zoomBtn.classList.toggle('is-on', on);
    zoomBtn.setAttribute('aria-pressed', on);
    $('span', zoomBtn).textContent = on ? 'Zoom out' : 'Zoom in';
  }
  let drag = null;
  lb.addEventListener('pointermove', e => {
    if (!lb.classList.contains('is-zooming')) return;
    if (e.pointerType === 'touch') {
      if (!drag) return;
      // a finger pushes the photo: the aim point moves against the drag
      const W = Z.base.width * Z.tk, H = Z.base.height * Z.tk;
      Z.px = Math.min(1, Math.max(0, drag.px - (e.clientX - drag.x) / Math.max(1, W - lb.clientWidth)));
      Z.py = Math.min(1, Math.max(0, drag.py - (e.clientY - drag.y) / Math.max(1, H - lb.clientHeight)));
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) drag.moved = true;
    } else {
      Z.px = e.clientX / lb.clientWidth; Z.py = e.clientY / lb.clientHeight;
    }
    aim(); run();
  }, { passive: true });
  lb.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && lb.classList.contains('is-zooming'))
      drag = { x: e.clientX, y: e.clientY, px: Z.px, py: Z.py, moved: false };
  });
  addEventListener('pointerup', () => { setTimeout(() => { drag = null; }, 0); }, { passive: true });
  img.addEventListener('click', e => {
    e.stopPropagation();
    if (lb.classList.contains('is-zooming')) { if (!drag || !drag.moved) zoomOut(); return; }
    zoomIn(e.clientX, e.clientY);
  });
  zoomBtn?.addEventListener('click', () => lb.classList.contains('is-zooming') ? zoomOut() : zoomIn());
  addEventListener('resize', () => { if (lb.classList.contains('is-zoom')) resetZoom(); });

  items.forEach((b, k) => {
    const hdBtn = $('.hdb', b);
    hdBtn?.addEventListener('click', e => { e.stopPropagation(); open(k); });
    // a strip that is dragged sideways must not open on release; its HD button still does
    if (!b.classList.contains('pj__slide')) b.addEventListener('click', () => open(k));
    if (!hdBtn) b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(k); } });
  });
  $('.lb__prev', lb).addEventListener('click', () => show(i - 1));
  $('.lb__next', lb).addEventListener('click', () => show(i + 1));
  $('.lb__close', lb).addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lb.classList.contains('is-zooming') ? zoomOut() : close();
    else if (e.key === 'z' || e.key === 'Z') lb.classList.contains('is-zooming') ? zoomOut() : zoomIn();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
  });
}

/* ───────────────────────── PROJECT REQUEST FORM ─────────────────────────
   No backend: a valid request opens the visitor's email app with everything
   filled in. Swap the submit handler for a form service when one is chosen. */
function quote() {
  const f = $('#quote');
  if (!f) return;
  const to = f.dataset.to;
  const name = $('#q-name', f), email = $('#q-email', f), msg = $('#q-msg', f);
  const needs = $$('input[name="need"]', f), needBox = $('.fm__f--need', f), needErr = $('#q-need-err', f);
  const ok = $('.fm__ok', f);

  const mark = (el, text) => {
    const box = el.closest('.fm__f');
    box.classList.toggle('is-bad', !!text);
    $('.fm__err', box).textContent = text || '';
    el.setAttribute('aria-invalid', text ? 'true' : 'false');
  };

  const validate = () => {
    const errors = [];
    const n = name.value.trim(), em = email.value.trim(), m = msg.value.trim();
    const nameErr = n ? '' : 'Add your name.';
    const emailErr = !em ? 'Add an email to reply to.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? '' : 'This email looks incomplete.';
    const msgErr = m.length >= 20 ? '' : m ? 'Add a little more detail, at least 20 characters.' : 'Describe the project in a few lines.';
    const anyNeed = needs.some(x => x.checked);
    mark(name, nameErr); if (nameErr) errors.push(name);
    mark(email, emailErr); if (emailErr) errors.push(email);
    needBox.classList.toggle('is-bad', !anyNeed);
    needErr.textContent = anyNeed ? '' : 'Pick at least one.';
    if (!anyNeed) errors.push(needs[0]);
    mark(msg, msgErr); if (msgErr) errors.push(msg);
    return errors;
  };

  [name, email, msg].forEach(el => el.addEventListener('input', () => {
    if (el.closest('.fm__f').classList.contains('is-bad')) mark(el, '');
  }));
  needs.forEach(x => x.addEventListener('change', () => { needBox.classList.remove('is-bad'); needErr.textContent = ''; }));

  const bad = $('.fm__bad', f);
  const btn = $('button[type="submit"]', f), btnT = $('span', btn);
  const label = btnT.textContent;

  /* The request is sent through Web3Forms. Until a key is pasted into data-key
     the form still works: it hands the request to the visitor's mail app. */
  const KEY = (f.dataset.key || '').trim();
  const live = KEY && KEY !== 'PASTE_KEY_HERE';

  const gather = () => {
    const d = new FormData(f);
    const chosen = d.getAll('need').join(', ');
    const lines = [`Name: ${d.get('name').trim()}`, `Email: ${d.get('email').trim()}`];
    if (d.get('company').trim()) lines.push(`Company or brand: ${d.get('company').trim()}`);
    lines.push(`Needs: ${chosen}`);
    if (d.get('budget')) lines.push(`Budget: ${d.get('budget')}`);
    if (d.get('timing').trim()) lines.push(`Timing: ${d.get('timing').trim()}`);
    lines.push('', d.get('message').trim());
    return { d, chosen, lines };
  };

  const byMail = ({ chosen, lines }) => {
    location.href = `mailto:${to}?subject=${encodeURIComponent('Project request: ' + chosen)}&body=${encodeURIComponent(lines.join('\n'))}`;
    ok.textContent = 'Your email app should now be open with the request filled in. ' +
                     `If nothing opened, write to ${to}.`;
    ok.hidden = false;
  };

  f.addEventListener('submit', async e => {
    e.preventDefault();
    ok.hidden = true; bad.hidden = true;
    const errors = validate();
    if (errors.length) { errors[0].focus(); return; }
    const info = gather();
    if (!live) { byMail(info); return; }

    btn.disabled = true; btnT.textContent = 'Sending';
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: `Project request: ${info.chosen}`,
          from_name: info.d.get('name').trim(),
          replyto: info.d.get('email').trim(),
          botcheck: info.d.get('botcheck') ? true : false,
          message: info.lines.join('\n')
        })
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.success) throw new Error(out.message || 'send failed');
      f.reset();
      ok.textContent = 'Thank you — your request is with me. I reply within two working days.';
      ok.hidden = false;
      ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (err) {
      // carry what they typed into the fallback, so nothing has to be rewritten
      const a = $('a', bad);
      if (a) a.href = `mailto:${to}?subject=${encodeURIComponent('Project request: ' + info.chosen)}&body=${encodeURIComponent(info.lines.join('\n'))}`;
      bad.hidden = false;
      bad.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      btn.disabled = false; btnT.textContent = label;
    }
  });

  f._validate = validate;   // exposed for testing without submitting
}

/* ───────────────────────── 404: NO SIGNAL ───────────────────────── */
function noSignal() {
  const cv = $('#nfNoise');
  if (!cv) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv.getContext('2d');
  const W = 160, H = 90;
  cv.width = W; cv.height = H;
  const frame = ctx.createImageData(W, H);
  const draw = () => {
    const d = frame.data;
    for (let k = 0; k < d.length; k += 4) {
      const v = (Math.random() * 255) | 0;
      d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255;
    }
    ctx.putImageData(frame, 0, 0);
  };
  draw();
  if (RM) return;
  setInterval(draw, 70);

  const code = $('#nfCode');
  const glitch = () => {
    const top = Math.random() * 70;
    code.style.setProperty('--gx', ((Math.random() - .5) * 28).toFixed(1) + 'px');
    code.style.setProperty('--c1', top.toFixed(1) + '%');
    code.style.setProperty('--c2', Math.max(0, 100 - top - 8 - Math.random() * 20).toFixed(1) + '%');
    code.classList.add('is-g');
    setTimeout(() => code.classList.remove('is-g'), 90 + Math.random() * 140);
    setTimeout(glitch, 500 + Math.random() * 1700);
  };
  setTimeout(glitch, 900);

  const tc = $('#nfTc'), t0 = performance.now();
  (function tick() {
    const s = (performance.now() - t0) / 1000;
    tc.textContent = `00:${pad2(Math.floor(s / 60) % 60)}:${pad2(Math.floor(s) % 60)}:${pad2(Math.floor((s % 1) * 25))}`;
    requestAnimationFrame(tick);
  })();
}

/* the concert frames are watermarked; this only removes the easy save gestures */
function guardPhotos() {
  const wall = $$('.gl__t img, .gl__f img, .lb__img');
  if (!wall.length) return;
  wall.forEach(i => { i.setAttribute('draggable', 'false'); });
  document.addEventListener('contextmenu', e => {
    if (e.target.closest('.gl__t, .gl__f, .lb')) e.preventDefault();
  });
}

project();
workIndex();
instagram();
lightbox();
quote();
noSignal();
guardPhotos();
})();
