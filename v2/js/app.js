/* ═══════════════════════════════════════════════════════════════
   ABDELLAH KHANANI — motion engine
   One rAF loop drives everything. No dependencies.
   ═══════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const RM   = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH= matchMedia('(hover: none)').matches;
const $    = (s, c = document) => c.querySelector(s);
const $$   = (s, c = document) => [...c.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp= (v, a, b) => v < a ? a : v > b ? b : v;
const pad2 = n => String(n).padStart(2, '0');

/* ────────────────────────── GRAIN ────────────────────────── */
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

/* ───────────────────── FIT TYPE TO MARGINS ─────────────────────
   Measured on the live element so per-span kerning loss is included.
   Element must be inline-block (shrink-to-fit) — see app.css.        */
const REF = 100;
function fitText() {
  $$('[data-fit]').forEach(el => {
    const box = el.closest('[data-fit-box]') || el.parentElement;
    // content box, not clientWidth — that includes padding and would overflow
    const bs = getComputedStyle(box);
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
  if (el._split) return;
  const t = el.textContent;
  el.textContent = '';
  const f = document.createDocumentFragment();
  [...t].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.transitionDelay = (i * 32) + 'ms';
    f.appendChild(s);
  });
  el.appendChild(f);
  el._split = true;
}

function splitWords(el) {
  if (el._split) return;
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  el._words = $$('.w', el);
  el._split = true;
}

/* ───────────────────────── SCRAMBLE ───────────────────────── */
const GL = '█▓▒░/\\<>*#@%&+=-_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el) {
  if (RM || el._busy) return;
  el._busy = true;
  const final = el._txt || (el._txt = el.textContent);
  const q = [...final].map((ch, i) => ({
    ch, a: (i * 1.5) | 0, b: ((i * 1.5) | 0) + 8 + Math.random() * 10
  }));
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

/* ───────────────────────── WATCH LIST ─────────────────────────
   Rect-based, polled from the main loop AND on scroll/resize.
   Everything here starts hidden, so it must never rely on a single
   callback source that an environment might not deliver.            */
const watch = [];
const addWatch = (el, at, fire) => watch.push({ el, at, fire });

function checkWatch() {
  if (!watch.length) return;
  const vh = innerHeight;
  for (let i = watch.length - 1; i >= 0; i--) {
    const w = watch[i];
    const r = w.el.getBoundingClientRect();
    if (!r.height && !r.width) continue;
    if (r.top < vh * w.at && r.bottom > 0) { watch.splice(i, 1); w.fire(w.el); }
  }
}

function runCounter(el) {
  const to = parseFloat(el.dataset.to);
  if (RM) { el.textContent = to; return; }
  const dur = 1400 + Math.random() * 600, t0 = performance.now();
  const step = now => {
    const p = clamp((now - t0) / dur, 0, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initWatch() {
  $$('[data-rev]').forEach(el => addWatch(el, .9, e => {
    const d = +(e.dataset.delay || 0);
    d ? setTimeout(() => e.classList.add('in'), d) : e.classList.add('in');
  }));
  $$('[data-chars]').forEach(el => addWatch(el, .95, e => e.classList.add('go')));
  $$('[data-scr]').forEach(el => addWatch(el, .9, scramble));
  $$('[data-bar]').forEach(el => addWatch(el, .85, e => { e.style.width = e.dataset.bar + '%'; }));
  $$('.num').forEach(el => addWatch(el, .85, runCounter));

  checkWatch();
  addEventListener('scroll', checkWatch, { passive: true });
  addEventListener('resize', checkWatch, { passive: true });
  document.addEventListener('visibilitychange', checkWatch);
}

/* ───────────────────────── INTRO ───────────────────────── */
function intro(done) {
  const el = $('#intro'), n = $('#introN'), sweep = $('.sweep'), status = $('#introStatus');
  if (!el) { done(); return; }
  const finish = () => {
    if (el._done) return;
    el._done = true;
    el.classList.add('out');
    $$('.intro__shutters i').forEach((b, i) => {
      b.style.transition = 'transform .8s cubic-bezier(.76,0,.24,1)';
      b.style.transitionDelay = (i * 55) + 'ms';
      requestAnimationFrame(() => { b.style.transform = 'scaleY(0)'; });
    });
    setTimeout(done, 380);
    setTimeout(() => el.classList.add('gone'), 1500);
  };

  if (RM) { el.classList.add('gone'); done(); return; }

  // only eager images gate the intro — lazy ones never load off-screen
  const imgs = $$('img').filter(i => !i.closest('#intro') && i.loading !== 'lazy');
  let got = 0;
  const bump = () => got++;
  imgs.forEach(i => i.complete ? bump()
    : (i.addEventListener('load', bump, { once: true }),
       i.addEventListener('error', bump, { once: true })));

  let ready = document.readyState === 'complete';
  if (!ready) addEventListener('load', () => { ready = true; }, { once: true });

  const t0 = performance.now(), MIN = 1500, MAX = 4200;
  let shown = 0;
  const tick = () => {
    const e = performance.now() - t0;
    const settled = ready && (!imgs.length || got >= imgs.length);
    const ceil = (settled || e > MAX) ? 100 : 94;
    shown = Math.min(ceil, lerp(shown, Math.min(e / MIN * 100, ceil), .12) + .4);
    const v = Math.min(100, Math.round(shown));
    n.textContent = v;
    if (sweep) sweep.style.strokeDashoffset = 704 - 704 * v / 100;
    if (v > 55 && status && status.textContent !== 'READY') {
      status.textContent = 'READY'; scramble(status);
    }
    if (v >= 100) { finish(); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(finish, MAX + 1400);   // rAF is paused in background tabs
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

  const set = (m, t) => {
    c.classList.toggle('view', m === 'view');
    c.classList.toggle('hide', m === 'hide');
    txt.textContent = t || '';
  };
  $$('[data-cur]').forEach(el => {
    const m = el.dataset.cur;
    el.addEventListener('mouseenter', () => set(m, m === 'view' ? 'VIEW' : ''));
    el.addEventListener('mouseleave', () => set(null));
  });
  $$('a:not([data-cur]),button:not([data-cur])').forEach(el => {
    el.addEventListener('mouseenter', () => set('hide'));
    el.addEventListener('mouseleave', () => set(null));
  });
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

/* ───────────────────────── NAV / CLOCK ───────────────────────── */
function nav() {
  const b = $('#burger'), n = $('#nav');
  if (!b || !n) return;
  const set = open => {
    document.body.classList.toggle('lock', open);
    n.setAttribute('aria-hidden', String(!open));
    b.setAttribute('aria-expanded', String(open));
  };
  b.addEventListener('click', () => set(!document.body.classList.contains('lock')));
  $$('a', n).forEach(a => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', e => e.key === 'Escape' && set(false));
}

function clock() {
  const c = $('#clock'), tc = $('#tc'), yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();
  if (c) {
    const u = () => { const d = new Date(); c.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; };
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

/* ───────────────────────── MAIN SCROLL LOOP ───────────────────────── */
function scrollEngine() {
  const railFill = $('#railFill'), railPct = $('#railPct'), hdr = $('#hdr');
  const pars   = $$('[data-par]');
  const mqs    = $$('[data-mq]').map(el => ({
    el, track: el.firstElementChild, speed: +(el.dataset.speed || 1), x: 0, w: 0
  }));
  const words  = $$('[data-words]');
  const pin    = $('[data-pin]');
  const track  = pin && $('[data-track]', pin);
  const trackBar = $('[data-trackbar]');
  const tl     = $('[data-tl]');
  const tlFill = $('[data-tlfill]');

  const measure = () => mqs.forEach(m => {
    const f = m.track.firstElementChild;
    m.w = f ? f.getBoundingClientRect().width : 0;
  });
  measure();
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);

  let last = scrollY, vel = 0, sv = 0, frame = 0;

  (function loop() {
    const y = scrollY;
    vel = y - last; last = y;
    sv = lerp(sv, vel, .1);

    if ((frame++ & 3) === 0) checkWatch();

    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;
    if (railFill) railFill.style.height = (p * 100) + '%';
    if (railPct)  railPct.textContent = pad2(Math.round(p * 100));
    if (hdr) hdr.classList.toggle('up', y > 240 && vel > 2 && !document.body.classList.contains('lock'));

    if (!RM) {
      // parallax
      for (const el of pars) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        const rel = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translate3d(0,${(rel * parseFloat(el.dataset.par) * 100).toFixed(2)}px,0)`;
      }

      // marquees — constant drift + scroll-velocity boost
      for (const m of mqs) {
        if (!m.w) continue;
        m.x -= m.speed + sv * .3 * Math.sign(m.speed || 1);
        if (m.x <= -m.w) m.x += m.w;
        if (m.x > 0) m.x -= m.w;
        m.track.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
      }

      // word-by-word fill
      for (const el of words) {
        if (!el._words) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const prog = clamp((innerHeight * .82 - r.top) / (r.height + innerHeight * .32), 0, 1);
        const lit = Math.round(prog * el._words.length);
        if (el._lit === lit) continue;
        el._lit = lit;
        el._words.forEach((w, i) => w.classList.toggle('lit', i < lit));
      }

      // pinned horizontal work rail
      if (pin && track) {
        const r = pin.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) {
          const span = pin.offsetHeight - innerHeight;
          const prog = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
          const travel = Math.max(0, track.scrollWidth - innerWidth);
          track.style.transform = `translate3d(${(-prog * travel).toFixed(2)}px,0,0)`;
          if (trackBar) trackBar.style.width = (prog * 100) + '%';
        }
      }

      // timeline rail draw
      if (tl && tlFill) {
        const r = tl.getBoundingClientRect();
        const prog = clamp((innerHeight * .75 - r.top) / r.height, 0, 1);
        tlFill.style.height = (prog * 100) + '%';
      }
    }

    requestAnimationFrame(loop);
  })();
}

/* ───────────────────────── BOOT ───────────────────────── */
function boot() {
  grain();
  $$('[data-chars]').forEach(splitChars);
  $$('[data-words]').forEach(splitWords);
  fitText();
  cursor();
  magnetic();
  nav();
  clock();
  scrollEngine();
  intro(initWatch);

  let t;
  addEventListener('resize', () => {
    fitText();
    clearTimeout(t);
    t = setTimeout(checkWatch, 200);
  }, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

// re-fit once the variable font is really in
document.fonts?.ready.then(fitText);
})();
