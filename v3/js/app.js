/* ═══════════════════════════════════════════════════════════════
   ABDELLAH KHANANI — motion engine, shared by every page
   GSAP + ScrollTrigger choreograph the scroll; Lenis smooths it.
   Every block is guarded, so a page only runs what it contains.
   Ambient loops (wall, marquees, cursor) work without the CDN libraries.
   ═══════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const G     = window.gsap, ST = window.ScrollTrigger;
const HAS_G = !!(G && ST);
const RM    = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover: none)').matches;
const root  = document.documentElement;
const MOTION = HAS_G && !RM;
/* has-gsap ships in the HTML so the fixed footer is in place at first paint;
   only drop it when the libraries really are missing. */
root.classList.toggle('has-gsap', MOTION);
root.classList.toggle('no-gsap', !MOTION);
/* two frames in, the footer has painted off-screen; now it can take its place */
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pad2  = n => String(n).padStart(2, '0');
const store = {
  get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  del: k => { try { sessionStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
};

const INK = '#000000', PAPER = '#f1f1f1';
// strips that scroll sideways: the page must stay still while a finger swipes them
const SWIPE = '.lv__shots, .mz__field, .ig__grid, .wk__filters, .pj__strip';

/* ───────────────────────── SMOOTH SCROLL ───────────────────────── */
let lenis = null;
if (window.Lenis && !RM && !TOUCH) {   // touch keeps native momentum; Lenis only smooths wheels
  lenis = new window.Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: 1 });
  if (HAS_G) {
    G.registerPlugin(ST);
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  } else {
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
} else if (HAS_G) {
  G.registerPlugin(ST);
}
if (HAS_G && TOUCH && !RM) {
  // iOS: the address bar resizes the viewport mid-scroll and pinned sections jump on release.
  // normalizeScroll moves touch scrolling onto the JS thread and keeps the viewport stable.
  ST.config({ ignoreMobileResize: true });
  // normalizeScroll drives the page scroll itself, so it must keep its hands off the swipe strips
  ST.normalizeScroll({
    allowNestedScroll: true,
    ignore: SWIPE,
    ignoreCheck: e => !!(e.target && e.target.closest && e.target.closest(SWIPE))
  });
}
window.__lenis = lenis;

const scrollToTarget = target => {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
  else if (typeof target === 'number') scrollTo({ top: target, behavior: RM ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
};

/* ───────────────────────── GRAIN ───────────────────────── */
function grain() {
  const el = $('.grain');
  if (!el || RM) return;
  const s = 150, c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d'), im = ctx.createImageData(s, s), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 24;
  }
  ctx.putImageData(im, 0, 0);
  el.style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ─────────────────── FIT TYPE TO MARGINS ───────────────────
   Measured live so per-span kerning loss counts. The element must be
   inline-block — a block would report the container width instead. */
const REF = 100;
function fitText() {
  $$('[data-fit]').forEach(el => {
    const box = el.closest('[data-fit-box]') || el.parentElement;
    const bs = getComputedStyle(box);
    // content box — clientWidth includes padding and would overflow
    const avail = box.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight);
    if (avail <= 0) return;
    el.style.fontSize = REF + 'px';
    const w = el.getBoundingClientRect().width;
    if (!w) { el.style.fontSize = ''; return; }
    el.style.fontSize = (REF * avail / w * 0.997).toFixed(2) + 'px';
  });
}

/* ───────────────────────── SPLITTING ───────────────────────── */
function splitChars(el) {
  if (el._chars) return el._chars;
  const t = el.textContent;
  el.textContent = '';
  el._chars = [...t].map(ch => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
    return s;
  });
  return el._chars;
}

// Words as tokens. <em> words keep the serif voice via .it; .pic stays an
// element token. Each token remembers whether whitespace preceded it, so
// punctuation straight after an <em> doesn't gain a stray space.
function tokenize(el) {
  if (el._tok) return el._tok;
  const out = [];
  let space = false;
  const walk = (node, italic) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/([ \t\n\r]+)/).forEach(p => {
          if (!p) return;
          if (/^[ \t\n\r]+$/.test(p)) { space = true; return; }
          const s = document.createElement('span');
          s.className = italic ? 'w it' : 'w';
          s.textContent = p;
          s._sp = space; space = false;
          out.push(s);
        });
      } else if (n.nodeType === 1) {
        if (n.classList.contains('pic')) { n._sp = space; space = false; out.push(n); }
        else walk(n, italic || n.tagName === 'EM');
      }
    });
  };
  walk(el, false);
  const flat = document.createDocumentFragment();
  out.forEach((t, i) => { if (i && t._sp) flat.appendChild(document.createTextNode(' ')); flat.appendChild(t); });
  el.textContent = '';
  el.appendChild(flat);
  el._tok = out;
  return out;
}

// Group tokens into masked lines. Compare vertical centres, not offsetTop: a
// serif word and a grotesk word on one line have different ascents.
function groupLines(el) {
  const toks = tokenize(el);
  el.textContent = '';
  toks.forEach((t, i) => { if (i && t._sp) el.appendChild(document.createTextNode(' ')); el.appendChild(t); });
  const tol = parseFloat(getComputedStyle(el).fontSize) * .45;
  const lines = [];
  let mid = null;
  toks.forEach(t => {
    const r = t.getBoundingClientRect();
    const c = r.top + r.height / 2;
    if (mid === null || Math.abs(c - mid) > tol) { mid = c; lines.push([]); }
    lines[lines.length - 1].push(t);
  });
  el.textContent = '';
  el._lines = lines.map(ln => {
    const o = document.createElement('span'); o.className = 'line';
    const inn = document.createElement('span'); inn.className = 'line__in';
    ln.forEach((t, j) => { if (j && t._sp) inn.appendChild(document.createTextNode(' ')); inn.appendChild(t); });
    o.appendChild(inn); el.appendChild(o);
    return inn;
  });
  return el._lines;
}

/* ───────────────────────── SCRAMBLE ───────────────────────── */
const GL = '█▓▒░/\\<>*#@%&+=-_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el, final) {
  if (RM || el._busy) return;
  el._busy = true;
  final = final || el._t || (el._t = el.textContent);
  const q = [...final].map((ch, i) => ({ ch, a: (i * 1.5) | 0, b: ((i * 1.5) | 0) + 8 + Math.random() * 10 }));
  let f = 0;
  const step = () => {
    let out = '', done = 0;
    q.forEach(o => {
      if (f >= o.b) { out += o.ch; done++; }
      else if (f >= o.a) out += o.ch === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0];
      else out += ' ';
    });
    el.textContent = out;
    if (done === q.length) { el._busy = false; return; }
    f++; requestAnimationFrame(step);
  };
  step();
}

/* ───────────────────────── LOADER: EDIT BAY (home only) ─────────────────────────
   While the page loads, the steps of an edit pass one title at a time. Then a seam of light
   crosses the dark, the curtain opens top and bottom into 2.39:1 bars, and the bars stay over
   the hero until the first scroll. */
const mk = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};

function editBay(el) {
  el.classList.add('ld--edit');
  // one second of footage, counted in 24 frames, then the cut to the bars
  const FPS = 24, MIN = 700;
  const top = mk('div', 'ldt__bar ldt__bar--t'), bot = mk('div', 'ldt__bar ldt__bar--b'), seam = mk('i', 'ldt__seam');
  const cue = mk('div', 'lde__cue cap', '<span>Scroll to enter the reel</span><i></i>');
  bot.appendChild(cue);
  const ui = mk('div', 'lde', '<span class="lde__rec cap"><i></i>Rec</span><span class="lde__tc">00:00:00:00</span>');
  el.append(top, bot, seam, ui);
  const tc = $('.lde__tc', ui);
  G.set(seam, { scaleX: 0, opacity: 0 });
  let frame = -1;

  return {
    min: MIN,
    rate: .3,             // the count keeps pace with loading instead of trailing behind it
    tick(p) {
      const f = Math.round(p * FPS);
      if (f === frame) return;
      frame = f;
      tc.textContent = f >= FPS ? '00:00:01:00' : '00:00:00:' + pad2(f);
    },
    exit(reveal, finish) {
      const portrait = innerHeight > innerWidth;
      const box = portrait ? innerHeight * .56 : Math.min(innerHeight * .8, innerWidth / 2.39);
      cue.style.top = ((innerHeight - box) / 4) + 'px';
      // the bars open with the scroll rather than on a timer, so the first wheel never triggers
      // a sudden snap: they part as far as the page has moved, and close again if it goes back up
      const OPEN = innerHeight * .45, far = innerHeight / 2 + 4 - box / 2;
      let qt = null, opened = false;
      const onScroll = () => {
        if (opened) return;
        const p = Math.min(1, Math.max(0, scrollY / OPEN));
        if (!qt) {
          if (p <= 0) return;
          G.killTweensOf([top, bot, cue]);
          qt = [G.quickTo(top, 'y', { duration: .45, ease: 'power2.out' }), G.quickTo(bot, 'y', { duration: .45, ease: 'power2.out' })];
        }
        const e = p * p * (3 - 2 * p);
        qt[0](-box / 2 - far * e);
        qt[1](box / 2 + far * e);
        G.set(cue, { opacity: 1 - Math.min(1, p * 3) });
        if (p >= 1) { opened = true; removeEventListener('scroll', onScroll); G.delayedCall(.5, finish); }
      };
      // the bars move exactly as before; only the wait in front of them is gone
      G.timeline()
        .to(ui, { opacity: 0, duration: .25, ease: 'power2.in' }, .15)
        .to(seam, { scaleX: 1, opacity: 1, duration: .45, ease: 'expo.inOut' }, .2)
        .to(seam, { scaleY: 6, opacity: 0, duration: .55, ease: 'power2.out' }, .65)
        .to(top, { y: -box / 2, duration: 1.2, ease: 'expo.inOut' }, .6)
        .to(bot, { y: box / 2, duration: 1.2, ease: 'expo.inOut' }, .6)
        .add(() => { el.classList.add('ld--bars'); reveal(); addEventListener('scroll', onScroll, { passive: true }); onScroll(); }, 1.1)
        .fromTo(cue, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }, 1.7);
    }
  };
}

function loader(done) {
  const el = $('#ld');
  if (!el) { done(); return; }
  // arriving through a page transition: the curtain already covers the reveal
  if (RM || !HAS_G || root.classList.contains('pt-in') || root.classList.contains('pt-cover')) {
    el.classList.add('gone'); done(); return;
  }
  lenis?.stop();
  const seq = editBay(el);

  let revealed = false, exiting = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    lenis?.start();
    done();
  };
  const finish = () => { reveal(); el.classList.add('gone'); };
  const exit = () => { if (exiting) return; exiting = true; seq.tick(1); seq.exit(reveal, finish); };

  // only eager images gate the loader — lazy ones never load off-screen
  const imgs = $$('img').filter(i => !i.closest('#ld') && i.loading !== 'lazy');
  let got = 0;
  const bump = () => got++;
  imgs.forEach(i => i.complete ? bump()
    : (i.addEventListener('load', bump, { once: true }), i.addEventListener('error', bump, { once: true })));
  let ready = document.readyState === 'complete';
  if (!ready) addEventListener('load', () => { ready = true; }, { once: true });

  const t0 = performance.now(), MAX = 5000;
  let shown = 0;
  const tick = () => {
    if (exiting) return;
    const e = performance.now() - t0;
    const settled = ready && (!imgs.length || got >= imgs.length);
    const ceil = (settled || e > MAX) ? 100 : 94;
    shown = Math.min(ceil, lerp(shown, Math.min(e / seq.min * 100, ceil), seq.rate || .12) + .25);
    const v = Math.min(100, shown) / 100;
    seq.tick(v);
    if (v >= 1 && e >= seq.min) { exit(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(exit, MAX + 1400);                                   // rAF is paused in background tabs
  setTimeout(() => { if (!revealed) finish(); }, MAX + 7000);     // and so is GSAP: never leave the page covered
}

/* ─────────────────────── PHOTOS ON APPROACH ───────────────────────
   Sections below the first screens keep their photos in data-src until the section is
   near. Chrome's own lazy loading judged most of this page "close" on phones and fetched
   it all ahead of the hero, which is what PageSpeed counts against the page. A section is
   loaded whole, so horizontal strips never show a tile arriving mid-swipe. */
function photosOnApproach() {
  const load = sec => $$('[data-src], [data-srcset], [data-poster]', sec).forEach(el => {
    if (el.dataset.srcset) { el.srcset = el.dataset.srcset; delete el.dataset.srcset; }   // srcset first: no double fetch
    if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
    if (el.dataset.poster) { el.poster = el.dataset.poster; delete el.dataset.poster; }
  });
  const secs = [...new Set($$('[data-src], [data-poster]').map(el => el.closest('section') || document.body))];
  if (!secs.length) return;
  if (!('IntersectionObserver' in window)) { secs.forEach(load); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    load(e.target);
  }), { rootMargin: '80% 0px' });
  secs.forEach(sec => io.observe(sec));
}

/* ───────────────────────── CURSOR ───────────────────────── */
function cursor() {
  const c = $('#cur');
  if (!c || TOUCH) return;
  const ring = $('.cur__ring', c), dot = $('.cur__dot', c), txt = $('.cur__txt', c);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, dx = mx, dy = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; c.classList.add('on'); }, { passive: true });
  addEventListener('mousedown', () => c.classList.add('down'));
  addEventListener('mouseup',   () => c.classList.remove('down'));
  document.addEventListener('mouseleave', () => c.classList.remove('on'));
  (function loop() {
    rx = lerp(rx, mx, .15); ry = lerp(ry, my, .15);
    dx = lerp(dx, mx, .45); dy = lerp(dy, my, .45);
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    dot.style.transform  = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  const LABEL = { mail: 'WRITE', open: 'OPEN', zoom: 'VIEW' };
  const set = m => {
    c.classList.toggle('big', !!LABEL[m]);
    c.classList.toggle('hide', m === 'hide');
    txt.textContent = LABEL[m] || '';
  };
  // delegated so rendered markup (project pages, lightbox) gets the same states
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cur], a, button');
    set(t ? (t.dataset.cur || 'hide') : null);
  });
}

/* ─────────────────── HOVER PREVIEW (services) ─────────────────── */
function peek() {
  const box = $('#peek'), list = $('#svList');
  if (!box || !list || TOUCH) return;
  const imgs = {};
  $$('img', box).forEach(i => imgs[i.dataset.k] = i);
  let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, last = tx;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    cx = lerp(cx, tx, .1); cy = lerp(cy, ty, .1);
    const tilt = clamp((cx - last) * .35, -10, 10); last = cx;
    box.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) translate(-50%,-50%) rotate(${tilt.toFixed(2)}deg)`;
    requestAnimationFrame(loop);
  })();
  $$('.sv__i', list).forEach(row => row.addEventListener('mouseenter', () => {
    box.classList.add('on');
    Object.values(imgs).forEach(i => i.classList.remove('on'));
    imgs[row.dataset.k]?.classList.add('on');
  }));
  list.addEventListener('mouseleave', () => box.classList.remove('on'));
}

/* ───────────────────────── MAGNETIC ───────────────────────── */
function magnetic() {
  if (RM || TOUCH) return;
  $$('[data-mag]').forEach(el => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, over = false;
    const run = () => {
      cx = lerp(cx, tx, .17); cy = lerp(cy, ty, .17);
      el.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
      if (over || Math.abs(cx - tx) > .1 || Math.abs(cy - ty) > .1) raf = requestAnimationFrame(run);
      else { raf = null; el.style.transform = ''; }
    };
    el.addEventListener('mouseenter', () => { over = true; raf ||= requestAnimationFrame(run); });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * .3;
      ty = (e.clientY - (r.top + r.height / 2)) * .3;
    });
    el.addEventListener('mouseleave', () => { over = false; tx = ty = 0; raf ||= requestAnimationFrame(run); });
  });
}

/* ───────────────────────── MENU / CLOCKS ───────────────────────── */
let setMenu = () => {};
function nav() {
  const b = $('#brg'), n = $('#nav');
  if (!b || !n) return;
  setMenu = open => {
    document.body.classList.toggle('lock', open);
    n.setAttribute('aria-hidden', String(!open));
    b.setAttribute('aria-expanded', String(open));
    open ? lenis?.stop() : lenis?.start();
  };
  b.addEventListener('click', () => setMenu(n.getAttribute('aria-hidden') === 'true'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && n.getAttribute('aria-hidden') === 'false') setMenu(false); });
}

function clock() {
  const c = $('#clk'), tc = $('#tc'), yr = $('#yr'), short = $$('[data-clock]');
  if (yr) yr.textContent = new Date().getFullYear();
  if (c || short.length) {
    // Bolzano time wherever the visitor is
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const u = () => {
      const t = fmt.format(new Date());
      if (c) c.textContent = t;
      short.forEach(s => { s.textContent = t.slice(0, 5); });
    };
    u(); setInterval(u, 1000);
  }
  if (tc && !RM) {
    const t0 = performance.now();
    (function u() {
      const s = (performance.now() - t0) / 1000;
      tc.textContent = `${pad2((s / 3600) | 0)}:${pad2(((s / 60) | 0) % 60)}:${pad2((s | 0) % 60)}:${pad2(((s % 1) * 25) | 0)}`;
      requestAnimationFrame(u);
    })();
  }
}

/* ─────────────────────── AMBIENT LOOP ───────────────────────
   Wall columns, marquees, logo skew, rail and header — independent of GSAP. */
function ambient() {
  const railF = $('#railF'), railP = $('#railP'), hdr = $('#hdr'), stage = $('.lv');
  const rail = $('.rail');
  let dirAcc = 0, hdrHidden = false;
  const skews = $$('.cl__sk');

  const mqs = $$('[data-mq]').map(el => ({
    el, track: el.firstElementChild, sp: +(el.dataset.sp || 1), x: 0, w: 0,
    tpl: el.firstElementChild.firstElementChild.cloneNode(true)
  }));
  // The tape used to run from the moment the page loaded, so by the time anyone scrolled down to it
  // the big names had already slid past and the row opened on whatever happened to be there. It now
  // waits, still, until the section is actually on screen, and starts from the first logo.
  let mqRun = false;
  // a marquee needs enough copies to cover the viewport twice, or the wrap gaps
  const fillMq = m => {
    const one = m.track.firstElementChild.getBoundingClientRect().width;
    if (!one) { m.w = 0; return; }
    m.w = one;
    const need = Math.ceil((innerWidth + one) / one) + 1;
    while (m.track.children.length < need) {
      const copy = m.tpl.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      $$('img', copy).forEach(i => { i.alt = ''; });
      m.track.appendChild(copy);
    }
  };

  const cols = $$('.wall__c').map(col => {
    const run = $('.wall__r', col), n = run.children.length;
    [...run.children].forEach(ch => run.appendChild(ch.cloneNode(true)));
    return { run, n, dir: +(col.dataset.dir || 1), sp: +(col.dataset.sp || .5), y: 0, loop: 0 };
  });

  const measure = () => {
    mqs.forEach(fillMq);
    // offsetTop of the first clone is exactly one loop of content + gap
    cols.forEach(c => {
      const first = c.run.children[c.n];
      c.loop = first ? first.offsetTop : 0;
      if (c.dir < 0 && c.y === 0) c.y = -c.loop;
    });
  };
  measure();
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);
  $$('[data-mq] img, .wall img').forEach(i => { if (!i.complete) i.addEventListener('load', measure, { once: true }); });

  let last = scrollY, sv = 0;
  (function loop() {
    const y = scrollY, vel = y - last;
    last = y;
    sv = lerp(sv, vel, .1);

    const max = root.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;
    if (railF) railF.style.transform = `scaleY(${p.toFixed(4)})`;
    if (railP) railP.textContent = pad2(Math.round(p * 100));
    if (rail) rail.classList.toggle('is-past', y > 120);
    if (hdr) {
      // hide after a real scroll down, show after a real scroll up: momentum wobble no longer flickers it
      if (vel) dirAcc = (vel > 0) === (dirAcc > 0) ? dirAcc + vel : vel;
      if (!hdrHidden && y > 240 && dirAcc > 90) hdrHidden = true;
      else if (hdrHidden && (dirAcc < -40 || y < 240)) hdrHidden = false;
      if (document.body.classList.contains('lock')) hdrHidden = false;
      hdr.classList.toggle('up', hdrHidden);
      // over the colour concert photos the difference blend strobes; plain white reads steadier
      if (stage) {
        const box = (stage.parentElement?.classList.contains('pin-spacer') ? stage.parentElement : stage).getBoundingClientRect();
        hdr.classList.toggle('hdr--solid', box.top < 62 && box.bottom > 62);
      }
    }

    if (!RM) {
      for (const c of cols) {
        if (!c.loop) continue;
        c.y += (c.sp + Math.abs(sv) * .2) * c.dir;
        if (c.y <= -c.loop) c.y += c.loop;
        if (c.y >= 0) c.y -= c.loop;
        c.run.style.transform = `translate3d(0,${c.y.toFixed(2)}px,0)`;
      }
      if (!mqRun && mqs.length) {
        const b = mqs[0].el.getBoundingClientRect();
        if (b.top < innerHeight * .96 && b.bottom > 0) {
          mqRun = true;
          for (const m of mqs) { m.x = 0; m.track.style.transform = 'translate3d(0,0,0)'; }
        }
      }
      for (const m of mqs) {
        if (!m.w || !mqRun) continue;
        m.x -= m.sp + sv * .28 * Math.sign(m.sp || 1);
        if (m.x <= -m.w) m.x += m.w;
        if (m.x > 0) m.x -= m.w;
        m.track.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
      }
      if (skews.length) {
        const k = clamp(-sv * .22, -10, 10).toFixed(2);
        for (const s of skews) s.style.transform = `skewX(${k}deg)`;
      }
    }
    requestAnimationFrame(loop);
  })();
}

/* ─────────────────── FOOTER: LIQUID TYPE ───────────────────
   Grotesk letters swell in weight and width near the cursor (variable
   axes); the serif line, which has no axes, lifts and tilts instead. */
function liquidType() {
  const ft = $('.ft');
  const l1 = $$('.ft__l1 .ch'), l2 = $$('.ft__l2 .ch');
  if (!ft || RM || (!l1.length && !l2.length)) return;
  let mx = -9999, my = -9999;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const all = [...l1.map(c => ({ c, g: 1, k: 0, x: 0, y: 0 })), ...l2.map(c => ({ c, g: 2, k: 0, x: 0, y: 0 }))];

  /* One rect read per frame, not one per glyph: the letters never move inside
     the footer, so their centres are measured once and offset from its box. */
  let measured = false;
  const measure = () => {
    const r = ft.getBoundingClientRect();
    all.forEach(o => {
      const b = o.c.getBoundingClientRect();
      o.x = b.left + b.width / 2 - r.left;
      o.y = b.top + b.height / 2 - r.top;
    });
    measured = true;
  };
  addEventListener('resize', () => { measured = false; }, { passive: true });
  document.fonts?.ready.then(() => { measured = false; });

  (function loop(t) {
    requestAnimationFrame(loop);
    const r = ft.getBoundingClientRect();
    const shown = r.top < innerHeight && r.bottom > 0 && r.height > 0;
    // nothing on screen and every letter already at rest: no work at all
    if (!shown) { if (all.every(o => o.k < .002)) return; }
    if (shown && !measured) measure();
    // pointer nowhere near the words: let them settle, then stop writing styles
    const near = TOUCH || (my > r.top - 420 && my < r.bottom + 420);
    let live = false;
    for (const o of all) {
      let k = 0;
      if (shown && near) {
        if (TOUCH) k = (Math.sin(t / 700 - all.indexOf(o) * .45) + 1) / 2 * .7;
        else {
          const d = Math.hypot(mx - (r.left + o.x), my - (r.top + o.y));
          k = clamp(1 - d / 420, 0, 1);
          k = k * k * (3 - 2 * k);
        }
      }
      if (Math.abs(o.k - k) < .002 && k === 0) continue;   // already at rest
      o.k = lerp(o.k, k, .12);
      live = true;
      if (o.g === 1) o.c.style.fontVariationSettings = `'wght' ${(420 + o.k * 480).toFixed(0)}, 'wdth' ${(88 + o.k * 37).toFixed(1)}`;
      else o.c.style.transform = `translateY(${(-o.k * .14).toFixed(3)}em) rotate(${(-o.k * 7).toFixed(2)}deg)`;
    }
    if (!live && !shown) return;
  })(0);
}

/* ─────────────────────── PAGE TRANSITIONS ───────────────────────
   Internal links close a two-panel curtain before navigating; the next page
   opens it. Project links instead grow their image to full screen, and the
   project page shrinks it into its cover (state passed via sessionStorage). */
function transitions() {
  const cur = document.createElement('div');
  cur.className = 'curtain';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<i></i><i></i><span class="curtain__t"></span>';
  document.body.appendChild(cur);
  const panels = $$('i', cur), label = $('.curtain__t', cur);
  const anim = HAS_G && !RM;
  const open = i => i ? 101 : -101;
  const norm = p => p.replace(/index\.html$/, '');
  let leaving = false;
  if (anim) G.set(panels, { x: 0, xPercent: open });

  const ptLabel = store.get('ak:pt');
  store.del('ak:pt');
  let cover = null;
  try { cover = JSON.parse(store.get('ak:cover') || 'null'); } catch (e) { cover = null; }
  store.del('ak:cover');

  if (root.classList.contains('pt-in')) {
    if (anim) {
      label.textContent = ptLabel || '';
      G.set(panels, { xPercent: 0 });
      G.set(label, { opacity: 1 });
      G.timeline({ delay: .12 })
        .to(label, { opacity: 0, duration: .3 }, 0)
        .to(panels, { xPercent: open, duration: 1, ease: 'expo.inOut' }, .12);
    }
    root.classList.remove('pt-in');
  }

  if (root.classList.contains('pt-cover')) {
    const target = $('.pj__cover');
    if (anim && cover && cover.src && target) {
      const clone = document.createElement('div');
      clone.className = 'zoomclone';
      const im = new Image();
      im.src = cover.src; im.alt = '';
      clone.appendChild(im);
      G.set(clone, { left: 0, top: 0, width: innerWidth, height: innerHeight });
      document.body.appendChild(clone);
      root.classList.remove('pt-cover');
      const land = () => {
        const r = target.getBoundingClientRect();
        G.timeline({ onComplete: () => clone.remove() })
          .to(clone, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 1.05, ease: 'expo.inOut' }, .05)
          .fromTo(im, { filter: 'grayscale(0) contrast(1)' }, { filter: 'grayscale(1) contrast(1.08)', duration: 1.05, ease: 'power2.inOut' }, .05)
          .to(clone, { opacity: 0, duration: .25 });
      };
      requestAnimationFrame(() => requestAnimationFrame(land));
      setTimeout(() => { if (clone.isConnected) clone.remove(); }, 3200);
    } else {
      root.classList.remove('pt-cover');
    }
  }

  const go = (href, text) => {
    if (leaving) return;
    leaving = true;
    const navigate = () => { location.href = href; };
    if (!anim) { navigate(); return; }
    store.set('ak:pt', text || '');
    label.textContent = text || '';
    lenis?.stop();
    G.timeline({ onComplete: navigate })
      .fromTo(panels, { xPercent: open }, { xPercent: 0, duration: .8, ease: 'expo.inOut' })
      .to(label, { opacity: 1, duration: .3 }, .5);
    setTimeout(navigate, 1800);   // in case rAF is throttled
  };

  // a jump longer than a screen and a half is a cut: the curtain closes on the section name,
  // the page jumps underneath, the curtain opens. Short hops keep the smooth scroll.
  const cutTo = (t, text) => {
    const yOf = () => (t ? t.getBoundingClientRect().top + scrollY : 0);
    if (!anim || Math.abs(yOf() - scrollY) < innerHeight * 1.5) { scrollToTarget(t || 0); return; }
    if (leaving) return;
    leaving = true;
    label.textContent = text || '';
    lenis?.stop();
    G.timeline({ onComplete: () => { leaving = false; } })
      .fromTo(panels, { xPercent: open }, { xPercent: 0, duration: .55, ease: 'expo.inOut' })
      .to(label, { opacity: 1, duration: .25 }, .3)
      .add(() => {
        const y = yOf();
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
        ST.update();
      }, .6)
      .to(label, { opacity: 0, duration: .25 }, .95)
      .add(() => lenis?.start(), 1)
      .to(panels, { xPercent: open, duration: .75, ease: 'expo.inOut' }, 1);
    setTimeout(() => { if (leaving) { leaving = false; lenis?.start(); G.set(panels, { xPercent: open }); G.set(label, { opacity: 0 }); } }, 3000);
  };

  const zoomTo = (a, href) => {
    if (leaving) return;
    const img = $('img', a);
    const navigate = () => { location.href = href; };
    if (!anim || !img) { leaving = true; navigate(); return; }
    leaving = true;
    const src = img.currentSrc || img.src;
    store.set('ak:cover', JSON.stringify({ slug: a.dataset.slug, src }));
    const box = ($('.mz__img', a) || img).getBoundingClientRect();
    const clone = document.createElement('div');
    clone.className = 'zoomclone';
    const im = new Image();
    im.src = src; im.alt = '';
    clone.appendChild(im);
    G.set(clone, { left: box.left, top: box.top, width: box.width, height: box.height });
    document.body.appendChild(clone);
    lenis?.stop();
    G.timeline({ onComplete: navigate })
      .to(clone, { left: 0, top: 0, width: innerWidth, height: innerHeight, duration: .95, ease: 'expo.inOut' })
      .fromTo(im, { filter: 'grayscale(1) contrast(1.1)' }, { filter: 'grayscale(0) contrast(1)', duration: .95, ease: 'power2.inOut' }, 0);
    setTimeout(navigate, 1900);
  };

  // a swipe that starts on a card must not open it: remember whether the pointer travelled
  let downX = 0, downY = 0, down = false, dragged = false;
  addEventListener('pointerdown', e => { down = true; dragged = false; downX = e.clientX; downY = e.clientY; }, { passive: true, capture: true });
  addEventListener('pointermove', e => {
    if (down && !dragged && (Math.abs(e.clientX - downX) > 8 || Math.abs(e.clientY - downY) > 8)) dragged = true;
  }, { passive: true, capture: true });
  addEventListener('pointerup', () => { down = false; }, { passive: true, capture: true });
  addEventListener('pointercancel', () => { down = false; dragged = true; }, { passive: true, capture: true });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (dragged) { e.preventDefault(); dragged = false; return; }
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    const menuOpen = $('#nav')?.getAttribute('aria-hidden') === 'false';
    if (norm(url.pathname) === norm(location.pathname) && (url.search === location.search || (!url.search && url.hash))) {
      if (menuOpen) setMenu(false);
      const t = url.hash && url.hash !== '#top' ? document.getElementById(url.hash.slice(1)) : null;
      const smooth = a.hasAttribute('data-smooth');
      setTimeout(() => (smooth ? scrollToTarget(t || 0) : cutTo(t, a.dataset.pt || a.textContent.trim().slice(0, 40))), menuOpen ? 80 : 0);
      return;
    }
    if (menuOpen) setMenu(false);
    if (a.dataset.slug) zoomTo(a, url.href);
    else go(url.href, a.dataset.pt || a.textContent.trim().slice(0, 40));
  });

  // back/forward cache restores the page mid-transition: reset it
  addEventListener('pageshow', e => {
    if (!e.persisted) return;
    leaving = false;
    root.classList.remove('pt-in', 'pt-cover');
    $$('.zoomclone').forEach(nd => nd.remove());
    if (anim) { G.set(panels, { xPercent: open }); G.set(label, { opacity: 0 }); }
    lenis?.start();
  });
}

/* ═════════════════════ SCROLL CHOREOGRAPHY ═════════════════════ */
function odometer(el) {
  const target = el.dataset.to;
  el.textContent = '';
  return [...target].map(d => {
    const col = document.createElement('span'); col.className = 'odo__d';
    const stack = document.createElement('span'); stack.className = 'odo__s';
    const seq = [];
    for (let r = 0; r < 2; r++) for (let k = 0; k < 10; k++) seq.push(k);
    seq.push(+d);
    seq.forEach(v => { const s = document.createElement('span'); s.textContent = v; stack.appendChild(s); });
    col.appendChild(stack); el.appendChild(col);
    return { stack, len: seq.length };
  });
}

function choreography() {
  if (!HAS_G || RM) return;
  // ScrollTriggers here must not use `once: true`: see .design/DESIGN.md §8.
  const play = { toggleActions: 'play none none none' };

  const lineEls = $$('[data-lines]');
  lineEls.forEach(groupLines);
  $$('[data-words]').forEach(tokenize);
  const odo = $('.odo');
  const odoCols = odo ? odometer(odo) : [];

  // fitText and line grouping depend on width — redo them before ST measures
  ST.addEventListener('refreshInit', () => {
    fitText();
    lineEls.forEach(el => { if (!el._revealed) groupLines(el); });
    setFooterSpace();
  });

  const mm = G.matchMedia();
  mm.add({ desk: '(min-width: 861px)', mob: '(max-width: 860px)' }, ctx => {
    const { desk, mob } = ctx.conditions;
    const cleanups = [];   // non-GSAP work (loops, observers) undone on breakpoint change

    /* HERO — pinned scroll-out: wall zooms and tilts, the name splits apart */
    if ($('.hero')) {
      G.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=110%', pin: true, scrub: .8 } })
        .to('.hero__zoom', { scale: 1.32, rotate: -4, ease: 'none' }, 0)
        .to('.wall__c:nth-child(odd)', { yPercent: -14, ease: 'none' }, 0)
        .to('.wall__c:nth-child(even)', { yPercent: 14, ease: 'none' }, 0)
        .to('.hero__veil', { opacity: .9, ease: 'none' }, 0)
        .to('.hero__n .ln:nth-child(1)', { xPercent: -26, ease: 'none' }, 0)
        .to('.hero__n .ln:nth-child(2)', { xPercent: 26, ease: 'none' }, 0)
        .to('.hero__type', { yPercent: -18, scale: .86, ease: 'none' }, 0)
        .to('.hero__fade', { opacity: 0, y: -40, ease: 'none', duration: .5 }, 0);
    }

    /* MANIFESTO — words light up, inline photos open the sentence */
    const mf = $('.mf__t');
    if (mf) {
      const toks = tokenize(mf);
      const words = toks.filter(t => !t.classList.contains('pic'));
      const pics  = toks.filter(t => t.classList.contains('pic'));
      G.set(words, { opacity: .12 });
      G.set(pics, { width: 0 });
      const tl = G.timeline({ scrollTrigger: { trigger: mf, start: 'top 78%', end: 'bottom 55%', scrub: .6 } });
      toks.forEach((t, i) => {
        if (t.classList.contains('pic')) {
          tl.to(t, { width: '1.9em', duration: 1.4, ease: 'power3.inOut' }, i * .22)
            .fromTo($('img', t), { scale: 1.7 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, i * .22);
        } else tl.to(t, { opacity: 1, duration: .45, ease: 'none' }, i * .22);
      });
    }

    /* HEADINGS — masked line reveals, kickers slide in */
    lineEls.forEach(el => {
      if (!el._lines || !el._lines.length) return;
      G.from(el._lines, {
        yPercent: 115, rotate: 3, transformOrigin: '0% 100%', duration: 1.25, stagger: .09, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', ...play, onEnter: () => { el._revealed = true; } }
      });
    });
    $$('.kick').forEach(k => {
      if (k.closest('.mz, .lv, .nb, .fly, .ft')) return;
      G.from(k, { opacity: 0, x: -20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: k, start: 'top 94%', ...play } });
    });

    /* SHOWREEL — a small window opens to full frame while the words part */
    if ($('.ap')) {
      G.timeline({ scrollTrigger: { trigger: '.ap', start: 'top top', end: '+=170%', pin: true, scrub: .8 } })
        .fromTo('.ap__win', { clipPath: mob ? 'inset(34% 10% 34% 10% round 14px)' : 'inset(31% 35% 31% 35% round 18px)' },
                            { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo('.ap__win img', { scale: 1.55 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .to('.ap__l', { xPercent: -130, opacity: 0, ease: 'power2.in', duration: .75 }, .05)
        .to('.ap__r', { xPercent: 130, opacity: 0, ease: 'power2.in', duration: .75 }, .05)
        .fromTo('.ap__play', { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(1.6)', duration: .3 }, .78);
    }

    /* LATEST PORTFOLIO — full-bleed cover zooms out into the mosaic */
    const mz = $('.mz');
    if (mz) {
      const tiles = $$('.mz__t', mz), hero = $('.mz__t--hero', mz), others = tiles.filter(t => t !== hero);
      const cover = $('.mz__cover', mz), intro = $('.mz__intro', mz), head = $('.mz__head', mz), stage = $('.mz__stage', mz);
      if (desk && hero && cover) {
        // Clip the cover down to the hero tile's exact box; the tile itself never moves.
        // The four edges are tweened as plain numbers and the string is rebuilt each frame:
        // the browser collapses inset(0px 0px 0px 0px) to inset(0px), and a re-read of that
        // one number against a four-number target leaves nothing to interpolate, so the
        // cover used to sit still and then snap.
        const box = { t: 0, r: 0, b: 0, l: 0, rd: 0 };
        const edge = pick => () => {
          const s = stage.getBoundingClientRect(), q = $('.mz__img', hero).getBoundingClientRect();
          return pick(s, q);
        };
        const paint = () => {
          cover.style.clipPath = `inset(${box.t.toFixed(1)}px ${box.r.toFixed(1)}px ${box.b.toFixed(1)}px ${box.l.toFixed(1)}px round ${box.rd.toFixed(1)}px)`;
        };
        const tl = G.timeline({ scrollTrigger: { trigger: mz, start: 'top top', end: '+=230%', pin: true, scrub: .8, invalidateOnRefresh: true } });
        tl.fromTo(cover, { opacity: 1 }, { opacity: 1, duration: 1 }, 0)
          .fromTo(box, { t: 0, r: 0, b: 0, l: 0, rd: 0 }, {
            t: edge((s, q) => q.top - s.top), r: edge((s, q) => s.right - q.right),
            b: edge((s, q) => s.bottom - q.bottom), l: edge((s, q) => q.left - s.left),
            rd: 3, ease: 'power2.inOut', duration: 1, onUpdate: paint
          }, 0)
          .fromTo($('img', cover), { scale: 1.12 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
          .fromTo(intro, { opacity: 1, y: 0 }, { opacity: 0, y: -40, ease: 'power2.in', duration: .35 }, 0)
          .fromTo(others, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, ease: 'power2.out', duration: .7, stagger: { each: .05, from: 'random' } }, .3)
          .fromTo(head, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .4 }, .62)
          .to(cover, { opacity: 0, duration: .12, ease: 'none' }, 1);
        tl.to(head, { y: () => -innerHeight * .05, ease: 'none', duration: 1.1 }, 1.08);
      } else {
        tiles.forEach(t => G.from(t, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 92%', ...play } }));
      }
    }

    /* ON STAGE — full-screen colour photos; the crop drifts along each photo while a soft stage light follows,
       and each artist rises in like a curtain */
    const lv = $('.lv');
    if (lv && desk) {
      const shots = $$('.lv__shot', lv), N = shots.length;
      const beam = $('.lv__beam', lv), names = $$('.lv__name', lv), hudI = $('.lv__i', lv);
      const SRC = [.26, .74, .5];          // where each artist's light hangs, as a share of stage width
      const W = .14;                       // transition half-width, in shots
      const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      const data = shots.map((s, k) => {
        const [x0, y0, x1, y1] = (s.dataset.l || '35 45 65 55').split(' ').map(Number);
        const ar = parseFloat(s.style.getPropertyValue('--ar')) || 1.5;
        return { s, ar, a: +s.dataset.a || 0, x0, y0, x1, y1, lx: 50, ly: 50, lr: 0, w: 0, h: 0, vis: false, op: -1, cl: '' };
      });
      data.forEach((d, k) => {
        d.wipeIn = k > 0 && data[k - 1].a !== d.a;
        d.wipeOut = k < N - 1 && data[k + 1].a !== d.a;
      });
      const measure = () => data.forEach(d => { d.w = d.s.offsetWidth; d.h = d.s.offsetHeight; });
      measure();
      ST.addEventListener('refresh', measure);

      const st = { v: 0 };
      G.to(st, { v: 1, ease: 'none', scrollTrigger: {
        trigger: lv, start: 'top top', end: () => '+=' + innerHeight * N * (mob ? .4 : .5),
        pin: true, scrub: .6, invalidateOnRefresh: true
      }});

      let mx = 0, my = 0, hov = false, m = 0, curA = -1, curI = -1;
      const render = () => {
        const t = clamp(st.v * N, 0, N - .001), cur = Math.floor(t);
        m = lerp(m, hov ? 1 : 0, .08);
        data.forEach((d, k) => {
          const inA = k === 0 ? 1 : clamp((t - k + W) / (2 * W), 0, 1);
          const out = k === N - 1 ? 0 : clamp((t - k - 1 + W) / (2 * W), 0, 1);
          // same artist: crossfade. New artist: the photo rises over the last one, which stays until covered
          let op = d.wipeIn ? (inA > 0 ? 1 : 0) : inA;
          op = d.wipeOut ? (out >= 1 ? 0 : op) : op * (1 - out);
          const clip = d.wipeIn ? 1 - ease(inA) : 0;

          const s = d.s;
          if (op <= 0) { if (d.vis) { s.style.visibility = 'hidden'; s.style.opacity = 0; d.vis = false; d.op = 0; } return; }
          if (!d.vis) { s.style.visibility = 'visible'; d.vis = true; }
          const f = clamp(t - k, 0, 1), e = ease(f);
          // the crop follows the light path through the photo, so the light stays in frame
          const px = lerp(d.x0, d.x1, e), py = lerp(d.y0, d.y1, e);
          s.style.setProperty('--px', px.toFixed(2) + '%');
          s.style.setProperty('--py', py.toFixed(2) + '%');
          // where that image point lands inside the cover-fitted frame
          const iw = Math.max(d.w, d.h * d.ar), ih = iw / d.ar;
          let tx = d.w ? ((d.w - iw) + iw) * px / d.w : 50;
          let ty = d.h ? ((d.h - ih) + ih) * py / d.h : 50;
          if (k === cur && m > .001) {
            tx = lerp(tx, clamp(mx / d.w * 100, 0, 100), m);
            ty = lerp(ty, clamp(my / d.h * 100, 0, 100), m);
          }
          d.lx = lerp(d.lx, tx, .12); d.ly = lerp(d.ly, ty, .12);
          d.lr = Math.min(d.w, d.h) * .38;
          if (Math.abs(op - d.op) > .002) { s.style.opacity = op.toFixed(3); d.op = op; }
          const cl = clip > .001 ? `inset(${(clip * 100).toFixed(2)}% 0% 0% 0%)` : '';
          if (cl !== d.cl) { s.style.clipPath = cl; d.cl = cl; }
          s.style.transform = `scale(${(1.06 - .06 * f).toFixed(4)})`;
          s.style.setProperty('--lx', d.lx.toFixed(2) + '%');
          s.style.setProperty('--ly', d.ly.toFixed(2) + '%');
          s.style.setProperty('--lr', d.lr.toFixed(1) + 'px');
        });

        const d = data[cur];
        if (d.a !== curA) {
          curA = d.a;
          names.forEach((n, i) => n.classList.toggle('on', i === curA));
        }
        if (cur !== curI) { curI = cur; if (hudI) hudI.textContent = pad2(cur + 1); }

        // a faint beam hangs from the rig above the stage and lands on the light spot
        if (beam) {
          const S = lv.getBoundingClientRect(), r = d.s.getBoundingClientRect();
          const px = r.left - S.left + d.lx / 100 * r.width, py = r.top - S.top + d.ly / 100 * r.height;
          const sx = S.width * (SRC[d.a] ?? .5), sy = -S.height * .08;
          const dx = px - sx, dy = py - sy, bw = (d.lr || 200) * 1.3;
          beam.style.width = bw.toFixed(1) + 'px';
          beam.style.height = (Math.hypot(dx, dy) + (d.lr || 200) * .3).toFixed(1) + 'px';
          beam.style.transform = `translate3d(${(sx - bw / 2).toFixed(1)}px,${sy.toFixed(1)}px,0) rotate(${Math.atan2(-dx, dy).toFixed(4)}rad)`;
          beam.style.opacity = (Math.max(0, d.op) * .55).toFixed(3);
        }
      };

      let raf = 0;
      const loop = () => { render(); raf = requestAnimationFrame(loop); };
      const io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !raf) raf = requestAnimationFrame(loop);
        else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
      });
      io.observe(lv);
      const onMove = e => { mx = e.clientX; my = e.clientY; hov = true; };
      const onLeave = () => { hov = false; };
      if (!TOUCH) { lv.addEventListener('pointermove', onMove); lv.addEventListener('pointerleave', onLeave); }

      cleanups.push(() => {
        cancelAnimationFrame(raf); raf = 0; io.disconnect();
        lv.removeEventListener('pointermove', onMove); lv.removeEventListener('pointerleave', onLeave);
        ST.removeEventListener('refresh', measure);
        shots.forEach(s => ['opacity', 'visibility', 'transform', 'clip-path', '--lx', '--ly', '--lr', '--px', '--py'].forEach(p => s.style.removeProperty(p)));
        if (beam) beam.removeAttribute('style');
      });
    } else if (lv) {
      // phones: a swipe strip of photos; the artist name and counter follow the photo in view
      const track = $('.lv__shots', lv), shots = $$('.lv__shot', lv), names = $$('.lv__name', lv), hudI = $('.lv__i', lv);
      shots.forEach(s => {
        const [x0, y0] = (s.dataset.l || '50 50').split(' ');
        s.style.setProperty('--fx', x0 + '%');
        s.style.setProperty('--fy', y0 + '%');
      });
      let raf = 0, cur = -1;
      const sync = () => {
        raf = 0;
        const edge = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
        let best = 0, bd = Infinity;
        shots.forEach((s, i) => { const d = Math.abs(s.getBoundingClientRect().left - edge); if (d < bd) { bd = d; best = i; } });
        if (best === cur) return;
        cur = best;
        const a = +shots[best].dataset.a || 0;
        names.forEach((n, i) => n.classList.toggle('on', i === a));
        if (hudI) hudI.textContent = pad2(best + 1);
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(sync); };
      track.addEventListener('scroll', onScroll, { passive: true });
      sync();
      cleanups.push(() => {
        track.removeEventListener('scroll', onScroll);
        shots.forEach(s => { s.style.removeProperty('--fx'); s.style.removeProperty('--fy'); });
      });
    }


    /* CLIENTS — the two tapes slide in from opposite sides */
    $$('.cl__row').forEach((r, i) => G.from(r, {
      xPercent: i % 2 ? 8 : -8, opacity: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: r, start: 'top 94%', ...play }
    }));

    /* SERVICES — rules draw, rows rise */
    $$('.sv__i').forEach(it => {
      G.timeline({ scrollTrigger: { trigger: it, start: 'top 90%', ...play } })
        .fromTo(it, { '--ln': 0 }, { '--ln': 1, duration: 1.6, ease: 'expo.inOut' }, 0)
        .from(it.children, { y: 40, opacity: 0, duration: 1.1, stagger: .07, ease: 'expo.out' }, .1);
    });

    /* NUMBERS — odometer spins, stats drift at different depths */
    if ($('.nb')) {
      if (desk) {
        // roll to 47 while the stats settle around it, hold the finished picture, then let the stats drift away
        const tl = G.timeline({ scrollTrigger: { trigger: '.nb', start: 'top top', end: '+=260%', pin: true, scrub: .8, invalidateOnRefresh: true } });
        odoCols.forEach((c, i) => tl.fromTo(c.stack, { yPercent: 0 },
          { yPercent: -((c.len - 1) / c.len) * 100, ease: 'power3.inOut', duration: 1 }, i * .08));
        tl.from('.nb__unit, .nb__note', { opacity: 0, y: 30, duration: .3, stagger: .06 }, .55);
        $$('.fl').forEach(f => {
          const d = +f.dataset.d || 1;
          tl.fromTo(f, { y: () => innerHeight * .45 * d, opacity: 0 },
                       { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, .05 * d);
          tl.to(f, { y: () => -innerHeight * .4 * d, opacity: 0, ease: 'power1.in', duration: .6 }, 1.85);
          const b = $('b', f), to = +b.dataset.to, unit = b.dataset.u || '', proxy = { v: 0 };
          tl.to(proxy, { v: to, duration: .8, ease: 'power2.out',
            onUpdate: () => { b.innerHTML = Math.round(proxy.v) + (unit ? `<small>${unit}</small>` : ''); } }, .2);
        });
        tl.to({}, { duration: .1 }, 2.45);
      } else {
        odoCols.forEach((c, i) => G.fromTo(c.stack, { yPercent: 0 }, {
          yPercent: -((c.len - 1) / c.len) * 100, duration: 2.2, delay: i * .1, ease: 'power3.inOut',
          scrollTrigger: { trigger: '.nb__big', start: 'top 80%', ...play }
        }));
        $$('.fl').forEach(f => {
          const b = $('b', f), to = +b.dataset.to, unit = b.dataset.u || '', proxy = { v: 0 };
          G.to(proxy, { v: to, duration: 1.6, ease: 'power2.out',
            scrollTrigger: { trigger: f, start: 'top 88%', ...play },
            onUpdate: () => { b.innerHTML = Math.round(proxy.v) + (unit ? `<small>${unit}</small>` : ''); } });
        });
      }
    }

    /* LIGHT ZONE — the page flips to paper for About + Experience */
    if ($('.zone')) {
      ST.create({
        trigger: '.zone', start: 'top 50%', end: 'bottom 50%',
        onToggle: self => G.to(root, {
          '--bg': self.isActive ? PAPER : INK, '--fg': self.isActive ? INK : PAPER,
          '--mut': self.isActive ? '#5f5f5f' : '#8e8e8e', duration: .9, ease: 'power2.inOut', overwrite: true
        })
      });
    }

    /* ABOUT — portrait opens through a circular iris */
    if ($('.ab__m')) {
      G.timeline({ scrollTrigger: { trigger: '.ab__m', start: 'top 88%', end: 'center 40%', scrub: .7 } })
        .fromTo('.ab__f--a', { clipPath: 'circle(10% at 50% 62%)' }, { clipPath: 'circle(76% at 50% 50%)', ease: 'none' }, 0)
        .fromTo('.ab__f--a img', { scale: 1.45 }, { scale: 1, ease: 'none' }, 0);
      G.fromTo('.ab__f--b', { yPercent: 55, rotate: 6 }, {
        yPercent: -18, rotate: -3, ease: 'none',
        scrollTrigger: { trigger: '.ab__m', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
    $$('.tool').forEach(tool => {
      const line = $('.tool__line i', tool), p = $('.tool__p', tool);
      if (!line || !p) return;
      const to = +p.dataset.to, proxy = { v: 0 };
      G.timeline({ scrollTrigger: { trigger: tool, start: 'top 92%', end: 'top 55%', scrub: .6 } })
        .fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)
        .to(proxy, { v: to, ease: 'none', onUpdate: () => { p.textContent = Math.round(proxy.v) + '%'; } }, 0);
    });

    /* EXPERIENCE — the sticky year is driven by the scroll itself, not by a timed tween: it rests
       while an entry's title sits on its line and rolls to the next year as the next title arrives,
       so the number and the text always move together */
    const yrs = $('.xp__yrs'), yrBox = $('.xp__yr'), items = $$('.xp__i');
    if (yrs && yrBox && items.length) {
      const spans = $$('span', yrs), n = items.length, heads = items.map(it => $('h3', it) || it);
      // consecutive entries with the same year share one slot, so the number never rolls onto itself
      const slot = [];
      items.forEach((it, k) => {
        const same = k > 0 && spans[k] && spans[k - 1] && spans[k].textContent === spans[k - 1].textContent;
        slot.push(same ? slot[k - 1] : k);
      });
      const setY = G.quickSetter(yrs, 'yPercent');
      const setRide = G.quickSetter(yrBox, 'y', 'px');
      let lit = -1, ride = 0;
      const sync = () => {
        const yb = yrBox.getBoundingClientRect();
        if (!yb.height) return;                                  // mobile: the year column is hidden
        const line = yb.top + yb.height / 2 - ride;              // the sticky line, before any riding
        const c = heads.map(h => { const r = h.getBoundingClientRect(); return r.top + r.height / 2; });
        let i = 0, e = 0;
        if (line >= c[n - 1]) i = n - 1;
        else if (line > c[0]) {
          while (i < n - 2 && line > c[i + 1]) i++;
          const t = (line - c[i]) / (c[i + 1] - c[i]);
          const q = Math.min(1, Math.max(0, (t - .3) / .4));     // hold, roll through the middle, hold
          e = q * q * (3 - 2 * q);
        }
        const a = slot[i], b = slot[Math.min(n - 1, i + 1)];
        setY(-100 * (a + (b - a) * e) / spans.length);
        const on = e > .5 ? i + 1 : i;
        if (on !== lit) { lit = on; items.forEach((it, k) => it.classList.toggle('on', k === on)); }
        // outside the list the year rides with the text instead of holding its line: it comes in
        // level with the first title and leaves level with the last, never drifting below it
        ride = c[0] > line ? c[0] - line : c[n - 1] < line ? c[n - 1] - line : 0;
        setRide(ride);
      };
      ST.create({ trigger: '.xp__list', start: 'top bottom', end: 'bottom top', onUpdate: sync, onRefresh: sync });
      sync();
    }

    /* GALLERY — each beat of the story holds while its own photographs pass */
    const gl = $('.gl__story');
    if (gl && desk) {
      const beats = $$('.gl__beat', gl), steps = $$('.gl__step', gl), num = $('.gl__n b', gl);
      steps.forEach((step, i) => ST.create({
        trigger: step, start: 'top 55%', end: 'bottom 55%',
        onToggle: self => {
          if (!self.isActive) return;
          beats.forEach((b, k) => b.classList.toggle('is-on', k === i));
          if (num) num.textContent = pad2(i + 1);
        }
      }));
    }

    /* POV — the phone rises in and its film plays while the section is on screen */
    $$('[data-pov]').forEach(sec => {
      const hold = $('.pv__hold', sec), vid = $('.pv__v', sec), cap = $('.pv__cap', sec);
      const back = $('.pv__back', sec);
      if (back && !back.dataset.split) {          // one <i> per letter, so the hover can fill just that one
        back.dataset.split = '1';
        $$('span', back).forEach(line => {
          line.innerHTML = [...line.textContent]
            .map(ch => ch === ' ' ? '<i class="sp">&nbsp;</i>' : `<i>${ch}</i>`).join('');
        });
      }
      if (!hold || !vid) return;
      G.from(hold, { y: 46, opacity: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: sec, start: 'top 80%', ...play } });
      G.from(cap, { y: 24, opacity: 0, duration: 1, ease: 'expo.out', delay: .12,
        scrollTrigger: { trigger: sec, start: 'top 80%', ...play } });
      if (back) G.from(back, { scale: 1.08, opacity: 0, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: sec, start: 'top 80%', ...play } });
      ST.create({
        trigger: sec, start: 'top 75%', end: 'bottom 25%',
        onToggle: self => {
          if (self.isActive) vid.play().catch(() => { /* autoplay refused */ });
          else if (!vid.paused) vid.pause();
        }
      });
    });

    /* BEHIND THE FRAME — fly through the stills */
    const phs = $$('.fly__ph');
    if (phs.length) {
      G.set(phs, { xPercent: -50, yPercent: -50, opacity: 0, scale: .12 });
      const tl = G.timeline({ scrollTrigger: {
        trigger: '.fly', start: 'top top', end: mob ? '+=220%' : '+=300%', pin: true, scrub: .7, invalidateOnRefresh: true
      }});
      const N = phs.length, SPAN = 1.9, LIFE = 1.45;
      phs.forEach((p, i) => {
        const ang = (i * 2.399963) % (Math.PI * 2);          // golden-angle scatter
        const rad = .5 + ((i * 37) % 10) / 10 * .45;
        const t0 = (i / N) * SPAN;
        tl.to(p, { opacity: 1, duration: .14, ease: 'none' }, t0)
          .to(p, {
            x: () => Math.cos(ang) * innerWidth * rad * .75,
            y: () => Math.sin(ang) * innerHeight * rad * .8,
            scale: 1.35 + (i % 3) * .35, rotate: ((i % 5) - 2) * 3,
            duration: LIFE, ease: 'power2.in'
          }, t0)
          .to(p, { opacity: 0, duration: .2, ease: 'none' }, t0 + LIFE - .2);
      });
      tl.fromTo('.fly__t', { scale: .82, letterSpacing: '-0.02em' },
                           { scale: 1.06, letterSpacing: '-0.06em', ease: 'none', duration: SPAN + LIFE }, 0);
    }

    /* INSTAGRAM */
    $$('.ig__post').forEach((p, i) => G.fromTo(p, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', delay: (i % 3) * .08,
      scrollTrigger: { trigger: p, start: 'top 94%', ...play }
    }));
    $$('.ig__empty').forEach(el => G.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', ...play } }));

    /* TESTIMONIAL — words fill */
    const q = $('.vc__f blockquote');
    if (q) {
      const words = tokenize(q);
      G.set(words, { opacity: .14 });
      G.to(words, { opacity: 1, stagger: .1, ease: 'none',
        scrollTrigger: { trigger: q, start: 'top 80%', end: 'bottom 50%', scrub: .5 } });
    }

    /* PROJECT PAGE — stills open on scroll, next project drifts */
    $$('.pj__fig:not(.pj__cover)').forEach(fig => {
      G.fromTo(fig, { clipPath: 'inset(14% 0% 14% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top 98%', end: 'top 45%', scrub: .6 } });
      const img = $('img', fig);
      if (img) G.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    if ($('.pj__cover img')) {
      G.to('.pj__cover img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.pj__cover', start: 'top top', end: 'bottom top', scrub: true } });
    }
    const nx = $('.pj__next');
    if (nx && $('img', nx)) {
      G.fromTo($('img', nx), { yPercent: -10, scale: 1.15 }, { yPercent: 10, scale: 1, ease: 'none',
        scrollTrigger: { trigger: nx, start: 'top bottom', end: 'bottom top', scrub: true } });
      G.from($('.pj__nextT', nx), { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: nx, start: 'top 75%', ...play } });
    }

    /* BEHIND THE SCENES PAGE — stills open as they arrive */
    $$('.bt__ph').forEach((ph, i) => G.fromTo(ph, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', delay: (i % 3) * .07,
      scrollTrigger: { trigger: ph, start: 'top 94%', ...play }
    }));

    /* REQUEST FORM — fields rise in */
    $$('.fm__f, .fm__act, .ct__side > div').forEach((f, i) => G.from(f, {
      y: 30, opacity: 0, duration: 1, ease: 'expo.out', delay: (i % 2) * .06,
      scrollTrigger: { trigger: f, start: 'top 96%', ...play }
    }));

    /* FOOTER — main lifts away and reveals it; the last section recedes */
    const ft = $('.ft'), main = $('main');
    if (ft && main) {
      if (!ft.classList.contains('ft--static')) {
        const tl = G.timeline({ scrollTrigger: { trigger: main, start: 'bottom bottom', end: () => '+=' + ft.offsetHeight, scrub: .6, invalidateOnRefresh: true } })
          .fromTo('.ft__in', { yPercent: -28 }, { yPercent: 0, ease: 'none' }, 0)
          .from('.ft__big .lin', { yPercent: 105, stagger: .12, ease: 'power3.out', duration: .6 }, .15);
        const last = main.lastElementChild;
        if (last) tl.fromTo(last, { scale: 1, opacity: 1 }, { scale: .92, opacity: .4, ease: 'none', transformOrigin: '50% 100%' }, 0);
      } else {
        G.from('.ft__big .lin', { yPercent: 105, stagger: .12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: ft, start: 'top 75%', ...play } });
      }
    }

    // matchMedia reverts every tween and trigger made above; the rest is undone here
    return () => cleanups.forEach(fn => fn());
  });
}

/* Footer is fixed behind <main>; main needs matching bottom space. A footer
   taller than the viewport would be unreachable, so it falls back to flow. */
function setFooterSpace() {
  const ft = $('.ft'), main = $('main');
  if (!ft || !main || !HAS_G || RM) return;
  ft.classList.remove('ft--static');
  const h = ft.offsetHeight;
  if (h > innerHeight + 2) { ft.classList.add('ft--static'); main.style.marginBottom = '0px'; }
  else main.style.marginBottom = h + 'px';
}

/* ───────────────────────── HERO INTRO ───────────────────────── */
function intro() {
  if (!HAS_G || RM || !$('.hero')) return;
  G.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__n .ch', { yPercent: 118, duration: 1.4, stagger: .035 }, 0)
    .fromTo('.wall', { scale: 1.2 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 0)
    .from('.hero__s', { opacity: 0, y: 16, duration: 1.1 }, .55)
    .from('.hero__bot > *', { opacity: 0, y: 22, duration: 1, stagger: .08 }, .7)
    .fromTo('.hdr', { yPercent: -120 }, { yPercent: 0, duration: 1.1, clearProps: 'transform' }, .45);
}

/* ───────────────────────── LIQUID GLASS ─────────────────────────
   Blur, saturation and rim highlights (CSS) work everywhere. Chromium can also run an SVG filter
   as a backdrop-filter, so there the glass bends what is behind it at the rim, with a slight
   colour split, from a displacement map drawn for the element's exact size. */
const GLASS_REFRACT = /Chrome\//.test(navigator.userAgent) && !!window.CSS?.supports?.('backdrop-filter', 'url(#x)');
let glassDefs = null;

function refract(el, id, strength = 58) {
  if (!GLASS_REFRACT || RM) return;
  const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
  if (!w || !h) return;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d'), img = c.createImageData(w, h), px = img.data;
  const r = h / 2, edge = Math.min(20, r * .85), rim = 3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // pill-shaped distance to the rim; red/green store where to sample the backdrop from
      const cx = clamp(x + .5, r, w - r), dx = x + .5 - cx, dy = y + .5 - r, len = Math.hypot(dx, dy) || 1;
      const inside = r - len, tEdge = clamp(1 - inside / edge, 0, 1), tRim = clamp(1 - inside / rim, 0, 1);
      const bend = tEdge * tEdge * .72 + tRim * .28;                        // edge + rim layers
      const bx = (x + .5 - w / 2) / (w / 2), by = (y + .5 - r) / r;         // base layer: a thick lens
      const vx = clamp(dx / len * bend + bx * .05, -1, 1), vy = clamp(dy / len * bend + by * .12, -1, 1);
      const i = (y * w + x) * 4;
      px[i] = 128 + vx * 127;
      px[i + 1] = 128 + vy * 127;
      px[i + 2] = 128;
      px[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  if (!glassDefs) {
    glassDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    glassDefs.setAttribute('class', 'lg-defs');
    glassDefs.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glassDefs);
  }
  const s = -strength;
  const chan = (scale, k, m) =>
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d${k}"/>` +
    `<feColorMatrix in="d${k}" type="matrix" values="${m}" result="c${k}"/>`;
  glassDefs.querySelector('#' + id)?.remove();
  glassDefs.insertAdjacentHTML('beforeend',
    `<filter id="${id}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feImage href="${cv.toDataURL()}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
    chan(s, 'r', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0') +
    chan(s * .9, 'g', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0') +
    chan(s * .8, 'b', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0') +
    `<feBlend in="cr" in2="cg" mode="screen" result="rg"/><feBlend in="rg" in2="cb" mode="screen"/></filter>`);
  el.style.setProperty('--lg-filter', `url(#${id})`);
  el.classList.add('lg-refract');
}

/* ───────────────────────── SWIPE AXIS LOCK ─────────────────────────
   A gesture that starts on a sideways strip is decided once: sideways moves the strip and the
   event stops there, so nothing else scrolls the page under the finger. */
function swipeAxis() {
  if (!TOUCH) return;
  $$(SWIPE).forEach(el => {
    let x0 = 0, y0 = 0, lock = 0;
    el.addEventListener('touchstart', e => {
      const t = e.touches[0];
      x0 = t.clientX; y0 = t.clientY; lock = 0;
    }, { passive: true });
    const move = e => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      const dx = Math.abs(t.clientX - x0), dy = Math.abs(t.clientY - y0);
      if (!lock && (dx > 6 || dy > 6)) lock = dx > dy ? 1 : -1;
      if (lock === 1) e.stopPropagation();
    };
    el.addEventListener('touchmove', move, { passive: true, capture: true });
    el.addEventListener('touchmove', move, { passive: true });
  });
}

/* ───────────────────────── DOCK ─────────────────────────
   A floating glass bar: where you are on the page, and a jump to any section. On the home page it
   arrives after the hero and follows the section in view; elsewhere it marks the current page.
   A glass drop slides to the active (or hovered) item, stretching as it travels. */
function dock() {
  const d = $('#dock');
  if (!d) return;
  const items = $$('.dock__a', d), lens = $('.dock__lens', d), home = !!$('.hero');
  const byKey = k => items.find(a => a.dataset.k === k) || null;
  const page = location.pathname.split('/').pop();
  let active = page === 'contact.html' ? 'contact' : (page === 'project.html' || page === 'work.html') ? 'work' : null;
  let shown = null, lensAt = null, hovering = false;

  const moveLens = (el, instant) => {
    if (!el) { lens.classList.remove('on'); lensAt = null; return; }
    const x = el.offsetLeft, w = el.offsetWidth;
    lens.classList.add('on');
    if (HAS_G && !RM && !instant && lensAt !== null) {
      const dist = Math.abs(x - lensAt);
      G.to(lens, { x, width: w, duration: .75, ease: 'elastic.out(1, .75)', overwrite: 'auto' });
      G.killTweensOf(lens, 'scaleX,scaleY');
      G.timeline()
        .to(lens, { scaleY: 1 - Math.min(.3, dist / 650), scaleX: 1 + Math.min(.14, dist / 1500), duration: .16, ease: 'power2.out' })
        .to(lens, { scaleY: 1, scaleX: 1, duration: .6, ease: 'elastic.out(1, .45)' });
    } else if (HAS_G) {
      G.set(lens, { x, width: w });
    } else {
      lens.style.transform = `translateX(${x}px)`;
      lens.style.width = w + 'px';
    }
    lensAt = x;
  };
  const setActive = k => {
    if (k === active && (lensAt !== null || !k)) return;
    active = k;
    items.forEach(a => a.classList.toggle('is-on', a.dataset.k === k));
    if (!hovering) moveLens(byKey(k));
  };
  const show = on => { if (on !== shown) { shown = on; d.classList.toggle('on', on); } };

  if (!TOUCH) {
    items.forEach(a => a.addEventListener('mouseenter', () => { hovering = true; moveLens(a); }));
    d.addEventListener('mouseleave', () => { hovering = false; moveLens(byKey(active)); });
  }

  // pinned sections live inside a pin-spacer, which is the box that really spans their scroll
  const boxOf = el => (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el).getBoundingClientRect();
  const SECTIONS = [['work', '#work'], ['live', '#live'], ['services', '#services'], ['about', '.zone']];
  const update = () => {
    const vh = innerHeight, main = $('main');
    const atEnd = main ? main.getBoundingClientRect().bottom < vh * .9 : false;   // the footer has its own calls to action
    if (!home) { show(!atEnd); return; }
    const hero = $('.hero');
    show((!hero || boxOf(hero).bottom < vh * .45) && !atEnd);
    let k = null;
    for (const [key, sel] of SECTIONS) {
      const el = $(sel);
      if (!el) continue;
      const b = boxOf(el);
      if (b.top <= vh * .55 && b.bottom > vh * .55) { k = key; break; }
    }
    setActive(k);
  };

  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
  const layout = () => {
    items.forEach(a => a.classList.toggle('is-on', a.dataset.k === active));
    moveLens(byKey(active), true);
    refract(d, 'lgDock');
    update();
  };
  addEventListener('resize', layout, { passive: true });
  document.fonts?.ready.then(layout);
  layout();
}

/* ───────────────────────── BOOT ───────────────────────── */
function boot() {
  /* Only what the first screen needs runs now. Everything else is built two
     frames later, behind the curtain, so the hero paints without waiting for
     ScrollTrigger to measure the whole page. */
  photosOnApproach();
  grain();
  $$('[data-chars]').forEach(splitChars);
  fitText();
  nav();
  clock();
  setFooterSpace();
  // hide the hero glyphs before the curtain lifts so the intro starts clean
  if (HAS_G && !RM && $('.hero')) G.set('.hero__n .ch', { yPercent: 118 });

  /* Built in stages with a frame between them: done in one go this was a single
     ~340ms task, and every millisecond past 50 counts against responsiveness. */
  const stages = [
    () => { $$('.ft__big .lin').forEach(splitChars); cursor(); peek(); magnetic(); },
    () => { ambient(); },
    () => { liquidType(); transitions(); },
    () => { choreography(); },
    () => { dock(); swipeAxis(); setFooterSpace(); if (HAS_G) ST.refresh(); }
  ];
  let at = 0;
  const build = now => {
    while (at < stages.length) {
      const step = stages[at++];
      step();
      if (!now) { requestAnimationFrame(() => build(false)); return; }
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(() => build(false)));

  loader(() => {
    build(true);                              // never reveal an unbuilt page
    if (HAS_G && !RM && $('.hero')) { G.set('.hero__n .ch', { clearProps: 'transform' }); intro(); }
    if (!location.hash) scrollTo(0, 0);
    if (HAS_G) ST.refresh();
    if (location.hash) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(() => scrollToTarget(t), 350);
    }
  });

  addEventListener('load', () => { HAS_G ? ST.refresh() : fitText(); });
  // if a renderer ever throws, the page must still be readable
  $$('[data-pending]').forEach(el => el.removeAttribute('data-pending'));
  if (!HAS_G) addEventListener('resize', fitText, { passive: true });
  document.fonts?.ready.then(() => { HAS_G ? ST.refresh() : fitText(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
