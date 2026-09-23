/* ═══════════════════════════════════════════════════════════
   ABDELLAH KHANANI — motion layer (vanilla, no deps)
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ───────────────────────── GRAIN TEXTURE ───────────────────────── */
function buildGrain() {
  const el = $('.grain');
  if (!el || RM) return;
  const s = 160;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(s, s);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 26;
  }
  ctx.putImageData(img, 0, 0);
  el.style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ───────────────────────── FIT TEXT TO WIDTH ───────────────────────── */
// Scales each [data-fit] word so it exactly spans its container — the display
// type always touches both margins, at any viewport.
// Measured on the live element (after char-splitting) so per-span kerning loss
// is included — a detached probe would under-measure and overflow the margin.
const REF = 100;
function fitText() {
  $$('[data-fit]').forEach(el => {
    const box = el.closest('[data-fit-box]') || el.parentElement;
    const avail = box.clientWidth;
    if (!avail) return;

    el.style.fontSize = REF + 'px';
    // el must be shrink-to-fit (inline-block) for this to be the glyph width
    const w = el.getBoundingClientRect().width;
    if (!w) { el.style.fontSize = ''; return; }

    // 0.998 keeps the last glyph off the right margin on sub-pixel rounding
    el.style.fontSize = (REF * avail / w * 0.998).toFixed(2) + 'px';
  });
}

/* ───────────────────────── TEXT SPLITTING ───────────────────────── */
// characters (for the big display headlines)
function splitChars(el) {
  const txt = el.textContent;
  el.textContent = '';
  const frag = document.createDocumentFragment();
  [...txt].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.transitionDelay = (i * 34) + 'ms';
    frag.appendChild(s);
  });
  el.appendChild(frag);
}

// lines (measure real wraps, then wrap each visual line)
function splitLines(el) {
  if (el.dataset.done) return;
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  const spans = words.map(w => {
    const s = document.createElement('span');
    s.textContent = w;
    s.style.display = 'inline-block';
    el.appendChild(s);
    el.appendChild(document.createTextNode(' '));
    return s;
  });

  // group by offsetTop
  const lines = [];
  let top = null, cur = null;
  spans.forEach(s => {
    const t = Math.round(s.offsetTop);
    if (t !== top) { top = t; cur = []; lines.push(cur); }
    cur.push(s.textContent);
  });

  el.textContent = '';
  lines.forEach(words => {
    const outer = document.createElement('span');
    outer.className = 'l';
    const inner = document.createElement('span');
    inner.textContent = words.join(' ');
    outer.appendChild(inner);
    el.appendChild(outer);
  });
  el.dataset.done = '1';
}

function initSplitLines() {
  $$('[data-split-lines]').forEach(splitLines);
}

/* ───────────────────────── SCRAMBLE ───────────────────────── */
const GLYPHS = '█▓▒░/\\<>*#@%&+=-_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el) {
  if (RM || el._busy) return;
  el._busy = true;
  const final = el.dataset.txt || (el.dataset.txt = el.textContent);
  let frame = 0;
  const queue = [...final].map((ch, i) => ({
    ch, start: Math.floor(i * 1.6), end: Math.floor(i * 1.6) + 8 + Math.random() * 10
  }));
  const tick = () => {
    let out = '', done = 0;
    queue.forEach(q => {
      if (frame >= q.end) { out += q.ch; done++; }
      else if (frame >= q.start) {
        out += (q.ch === ' ') ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      } else out += ' ';
    });
    el.textContent = out;
    if (done === queue.length) { el._busy = false; return; }
    frame++;
    requestAnimationFrame(tick);
  };
  tick();
}

/* ───────────────────────── PRELOADER ───────────────────────── */
function preloader(done) {
  const loader = $('#loader');
  const countEl = $('#loaderCount');
  const barEl = $('#loaderBar');
  const sweep = $('.leader__sweep');
  if (!loader) { done(); return; }

  if (RM) {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.remove(), 300);
    done();
    return;
  }

  // progress driven by the eager (above-the-fold) images, floored by a min duration.
  // lazy images are excluded on purpose: they never load until scrolled into view.
  const imgs = $$('img').filter(i => !i.closest('#loader') && i.loading !== 'lazy');
  let loaded = 0;
  const bump = () => { loaded++; };
  imgs.forEach(i => {
    if (i.complete) bump();
    else { i.addEventListener('load', bump, { once: true }); i.addEventListener('error', bump, { once: true }); }
  });

  let ready = false;
  if (document.readyState === 'complete') ready = true;
  else addEventListener('load', () => { ready = true; }, { once: true });

  const t0 = performance.now();
  const MIN = 1600;   // never flash by faster than this
  const MAX = 4500;   // never hang longer than this
  let shown = 0;

  const tick = () => {
    const el2 = performance.now() - t0;
    const byTime = clamp(el2 / MIN, 0, 1);
    const byImg = imgs.length ? loaded / imgs.length : 1;

    // ceiling: hold just under 100 until assets + window load are actually done
    const settled = ready && byImg >= 1;
    const ceil = (settled || el2 > MAX) ? 100 : 96;
    const target = Math.min(byTime * 100, ceil);

    shown = Math.min(ceil, lerp(shown, target, .12) + .35);

    const v = Math.min(100, Math.round(shown));
    countEl.textContent = v;
    barEl.style.width = v + '%';
    if (sweep) sweep.style.strokeDashoffset = 553 - (553 * v / 100);

    if (v >= 100) { out(); return; }
    requestAnimationFrame(tick);
  };

  let finished = false;
  const out = () => {
    if (finished) return;
    finished = true;
    countEl.textContent = '100';
    loader.classList.add('is-out');
    const bars = $$('.loader__bars i');
    bars.forEach((b, i) => {
      b.style.transition = 'transform .75s cubic-bezier(.7,0,.2,1)';
      b.style.transitionDelay = (i * 45) + 'ms';
      requestAnimationFrame(() => { b.style.transform = 'scaleY(0)'; });
    });
    setTimeout(() => {
      document.body.classList.remove('is-loading');
      done();
    }, 380);
    setTimeout(() => { loader.style.pointerEvents = 'none'; loader.remove(); }, 1400);
  };

  requestAnimationFrame(tick);
  // hard safety net: rAF is paused in background tabs, so never let the
  // curtain stay up because the loop stopped ticking.
  setTimeout(out, MAX + 1200);
}

/* ───────────────────────── CURSOR ───────────────────────── */
function initCursor() {
  const cur = $('#cursor');
  if (!cur || window.matchMedia('(hover:none)').matches) return;
  const ring = $('.cursor__ring', cur);
  const dot = $('.cursor__dot', cur);
  const label = $('.cursor__label', cur);

  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my, dx = mx, dy = my;

  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.classList.add('is-on');
  }, { passive: true });
  addEventListener('mousedown', () => cur.classList.add('is-down'));
  addEventListener('mouseup', () => cur.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));

  const loop = () => {
    rx = lerp(rx, mx, .14); ry = lerp(ry, my, .14);
    dx = lerp(dx, mx, .42); dy = lerp(dy, my, .42);
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  const set = (mode, text) => {
    cur.classList.toggle('is-view', mode === 'view');
    cur.classList.toggle('is-hide', mode === 'hide');
    label.textContent = text || '';
  };

  const bind = el => {
    const m = el.dataset.cursor;
    el.addEventListener('mouseenter', () => {
      if (m === 'view') set('view', 'VIEW');
      else if (m === 'home') set('hide');
      else set('hide');
    });
    el.addEventListener('mouseleave', () => set(null));
  };
  $$('[data-cursor]').forEach(bind);
  $$('a:not([data-cursor]), button:not([data-cursor])').forEach(el => {
    el.addEventListener('mouseenter', () => set('hide'));
    el.addEventListener('mouseleave', () => set(null));
  });
}

/* ───────────────────────── MAGNETIC ───────────────────────── */
function initMagnetic() {
  if (RM || window.matchMedia('(hover:none)').matches) return;
  $$('[data-magnetic]').forEach(el => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, hover = false;
    const run = () => {
      cx = lerp(cx, tx, .16); cy = lerp(cy, ty, .16);
      el.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
      if (hover || Math.abs(cx - tx) > .1 || Math.abs(cy - ty) > .1) raf = requestAnimationFrame(run);
      else { raf = null; el.style.transform = ''; }
    };
    el.addEventListener('mouseenter', () => { hover = true; if (!raf) raf = requestAnimationFrame(run); });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * .32;
      ty = (e.clientY - (r.top + r.height / 2)) * .32;
    });
    el.addEventListener('mouseleave', () => { hover = false; tx = ty = 0; if (!raf) raf = requestAnimationFrame(run); });
  });
}

/* ───────────────────────── REVEAL ON SCROLL ─────────────────────────
   Driven by the shared rAF loop rather than IntersectionObserver: every
   element here starts hidden, so a single point of failure would blank the
   whole page. Rect checks always reflect real layout.                      */
const watch = [];   // { el, at, fire } — pruned as each one fires

function addWatch(el, at, fire) { watch.push({ el, at, fire }); }

function checkWatch() {
  if (!watch.length) return;
  const vh = innerHeight;
  for (let i = watch.length - 1; i >= 0; i--) {
    const w = watch[i];
    const r = w.el.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) continue;      // not laid out yet
    if (r.top < vh * w.at && r.bottom > 0) {
      watch.splice(i, 1);
      w.fire(w.el);
    }
  }
}

function runCounter(el) {
  const to = parseFloat(el.dataset.to);
  const suf = el.dataset.suffix || '';
  if (RM) { el.textContent = to + suf; return; }
  const dur = 1500 + Math.random() * 500;
  const t0 = performance.now();
  const step = now => {
    const p = clamp((now - t0) / dur, 0, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initReveal() {
  $$('[data-reveal],[data-reveal-img],[data-split-lines]').forEach(el => {
    addWatch(el, .92, e => {
      const d = parseInt(e.dataset.delay || 0, 10);
      if (d) setTimeout(() => e.classList.add('is-in'), d);
      else e.classList.add('is-in');
    });
  });
  $$('[data-scramble]').forEach(el => addWatch(el, .85, scramble));
  $$('[data-bar]').forEach(el => addWatch(el, .85, e => { e.style.width = e.dataset.bar + '%'; }));
  $$('.counter').forEach(el => addWatch(el, .85, runCounter));
  $$('.foot__big').forEach(el => addWatch(el, .8, e => e.classList.add('is-in')));

  checkWatch();
  // belt and braces for environments that stall the rAF loop
  addEventListener('scroll', checkWatch, { passive: true });
  addEventListener('resize', checkWatch, { passive: true });
  document.addEventListener('visibilitychange', checkWatch);
}

/* ───────────────────────── PARALLAX + SCROLL FX ───────────────────────── */
function initScrollFX() {
  const prog = $('#progressBar');
  const head = $('#head');
  const px = $$('[data-parallax]');
  const marquees = $$('[data-marquee]').map(m => ({
    el: m,
    track: $('.marquee__track', m),
    speed: parseFloat(m.dataset.speed || 1),
    x: 0, w: 0
  }));
  const reel = $('[data-reel]');
  const reelTrack = reel ? $('.reel__track', reel) : null;

  marquees.forEach(m => {
    const first = m.track.firstElementChild;
    m.w = first ? first.getBoundingClientRect().width : 0;
  });

  let last = scrollY, vel = 0, smoothVel = 0;

  const measure = () => {
    marquees.forEach(m => {
      const first = m.track.firstElementChild;
      m.w = first ? first.getBoundingClientRect().width : 0;
    });
  };
  addEventListener('resize', measure, { passive: true });

  let frame = 0;
  const loop = () => {
    const y = scrollY;
    vel = y - last;
    last = y;
    smoothVel = lerp(smoothVel, vel, .1);

    if ((frame++ & 3) === 0) checkWatch();   // reveal pass, every 4th frame

    // progress
    const max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    // header hide on scroll down
    if (head) head.classList.toggle('is-hidden', y > 260 && vel > 2 && !document.body.classList.contains('menu-open'));

    if (!RM) {
      // parallax
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const rel = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        const amt = parseFloat(el.dataset.parallax) * 100;
        el.style.transform = `translate3d(0,${(-rel * amt).toFixed(2)}px,0)`;
      });

      // marquees: constant drift + scroll velocity boost
      marquees.forEach(m => {
        if (!m.w) return;
        m.x -= m.speed + smoothVel * .35;
        if (m.x <= -m.w) m.x += m.w;
        if (m.x > 0) m.x -= m.w;
        m.track.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
      });

      // horizontal reel driven by scroll position
      if (reelTrack) {
        const r = reel.getBoundingClientRect();
        if (r.bottom > -300 && r.top < innerHeight + 300) {
          const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
          const travel = Math.max(0, reelTrack.scrollWidth - reel.clientWidth);
          reelTrack.style.transform = `translate3d(${(-p * travel).toFixed(2)}px,0,0)`;
        }
      }
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ───────────────────────── WORK HOVER IMAGE ───────────────────────── */
function initWorkHover() {
  const box = $('#workHover');
  const list = $('#workList');
  if (!box || !list || window.matchMedia('(hover:none)').matches) return;

  const imgs = {};
  $$('img', box).forEach(i => imgs[i.dataset.k] = i);
  let tx = 0, ty = 0, cx = 0, cy = 0, on = false;

  const loop = () => {
    cx = lerp(cx, tx, .12); cy = lerp(cy, ty, .12);
    box.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

  $$('.work__row', list).forEach(row => {
    row.addEventListener('mouseenter', () => {
      on = true;
      box.classList.add('is-on');
      Object.values(imgs).forEach(i => i.classList.remove('is-on'));
      const img = imgs[row.dataset.k];
      if (img) img.classList.add('is-on');
    });
  });
  list.addEventListener('mouseleave', () => { on = false; box.classList.remove('is-on'); });
}

/* ───────────────────────── ACCORDION ───────────────────────── */
function initAcc() {
  $$('[data-acc]').forEach(acc => {
    const items = $$('.acc__i', acc);
    items.forEach(item => {
      const head = $('.acc__h', item);
      head.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        items.forEach(i => i.classList.remove('is-open'));
        if (!open) item.classList.add('is-open');
      });
    });
  });
}

/* ───────────────────────── MENU ───────────────────────── */
function initMenu() {
  const burger = $('#burger');
  const menu = $('#menu');
  if (!burger || !menu) return;
  const toggle = (force) => {
    const open = force !== undefined ? force : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', String(!open));
  };
  burger.addEventListener('click', () => toggle());
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
}

/* ───────────────────────── CLOCK + TIMECODE ───────────────────────── */
function initClock() {
  const clock = $('#clock');
  const tc = $('#timecode');
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
  const p = n => String(n).padStart(2, '0');

  if (clock) {
    const upd = () => {
      const d = new Date();
      clock.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    upd(); setInterval(upd, 1000);
  }
  if (tc) {
    const t0 = performance.now();
    const upd = () => {
      const s = (performance.now() - t0) / 1000;
      const f = Math.floor((s % 1) * 25);
      tc.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(Math.floor(s) % 60)}:${p(f)}`;
      requestAnimationFrame(upd);
    };
    if (!RM) upd();
  }
}

/* ───────────────────────── BOOT ───────────────────────── */
function boot() {
  buildGrain();
  $$('[data-split]').forEach(splitChars);
  fitText();                       // after splitting: measures the real glyph runs
  initSplitLines();
  initCursor();
  initMagnetic();
  initAcc();
  initMenu();
  initClock();
  initWorkHover();
  initScrollFX();

  preloader(initReveal);

  // re-split lines on resize (debounced)
  let rt;
  addEventListener('resize', () => {
    fitText();
    clearTimeout(rt);
    rt = setTimeout(() => {
      $$('[data-split-lines]').forEach(el => {
        const wasIn = el.classList.contains('is-in');
        const txt = [...el.querySelectorAll('.l > span')].map(s => s.textContent).join(' ');
        if (!txt) return;
        el.dataset.done = '';
        el.textContent = txt;
        splitLines(el);
        if (wasIn) el.classList.add('is-in');
      });
    }, 260);
  }, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

// wait for fonts so line-splitting measures correctly
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    fitText();
    $$('[data-split-lines]').forEach(el => {
      if (!el.dataset.done) return;
      const txt = [...el.querySelectorAll('.l > span')].map(s => s.textContent).join(' ');
      const wasIn = el.classList.contains('is-in');
      el.dataset.done = '';
      el.textContent = txt;
      splitLines(el);
      if (wasIn) el.classList.add('is-in');
    });
  });
}
})();
