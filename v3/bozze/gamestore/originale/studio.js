/* Gamestore Bolzano — Studio grafiche v2 (bozza di AK Design). Canvas 2D, nessun server: tutto nel browser. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var P = window.GS_PRODUCTS || [];
  var IMG = 'studio/img/';
  var C = { y: '#FAC205', b: '#003BFF', lb: '#8DE3FC', p: '#833CA3', k: '#07070C', w: '#FFFFFF', red: '#E60012' };
  var FMT = {
    story: { w: 1080, h: 1920, top: 250, bot: 300, mx: 72, logoH: 112, name: 'Storia', size: '1080×1920' },
    post: { w: 1080, h: 1350, top: 64, bot: 0, mx: 64, logoH: 100, name: 'Post', size: '1080×1350' },
    square: { w: 1080, h: 1080, top: 52, bot: 0, mx: 60, logoH: 88, name: 'Quadrato', size: '1080×1080' }
  };
  var BGS = [['Nero', '#07070C'], ['Blu', '#003BFF'], ['Giallo', '#FAC205'], ['Viola', '#833CA3'], ['Azzurro', '#8DE3FC'], ['Rosso', '#E60012'], ['Bianco', '#FFFFFF']];
  var STYLES = [['stripes', 'Righe diagonali'], ['plain', 'Tinta unita'], ['split', 'Due toni']];
  var PLAT = {
    ps5: { n: 'PS5', logo: 'ps5', mw: 2.5 },
    sw2: { n: 'SWITCH 2', logo: 'switch2', mw: 1.3 },
    sw: { n: 'SWITCH', logo: 'switch', mw: 1.3 },
    xbox: { n: 'XBOX', logo: 'xbox', mw: 1.3 },
    retro: { n: 'RETRO' }, coll: { n: 'COLLEZIONISMO' }
  };
  var KIND = { tcg: 'CARTE', fig: 'FIGURE', funko: 'FUNKO', gad: 'GADGET', ac: 'ACCESSORI', co: 'CONSOLE', g: 'GIOCHI' };
  var BYID = {}; P.forEach(function (p) { BYID[p.id] = p; });
  var DAYS = ['DOMENICA', 'LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ', 'SABATO'];
  var MONTHS = ['GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO', 'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'];
  var TYPES = {
    continuato: 'ORARIO CONTINUATO',
    anticipata: 'ORARIO CONTINUATO CON CHIUSURA ANTICIPATA',
    chiuso: 'OGGI SIAMO CHIUSI',
    straordinaria: 'APERTURA STRAORDINARIA'
  };

  /* ---------- stato ---------- */
  function defaults() {
    return {
      orari: { date: '2026-11-14', type: 'anticipata', label: TYPES.anticipata, hours: '10.00 – 16.30', msg: 'Ci vediamo lunedì pomeriggio o sul sito 24/7!!', site: 'WWW.GAMESTOREBOLZANO.IT' },
      day: { prods: ['844014557'], head: 'GTA VI DAY', sub: 'L’attesa è finita!!!', when: 'GIOVEDÌ', hours: 'ORARIO CONTINUATO 9.30 – 19.00', pickup: 'Ritiralo in negozio' },
      off: { prods: ['819071375'], tag: 'OFFERTA', old: '59,99', price: '49,99', until: '2026-11-30', stock: true },
      nuovi: { prods: ['875536920', '866844844', '866844119', '841613927'], date: '2026-11-12', orari: 'ORARIO CONTINUATO 9.30 – 19.00' },
      usato: { prods: ['867529692', '853157833', '826870207', '831020846'], claim: 'Porta i tuoi giochi: supervalutazione' },
      free: { tag: 'Tessera punti', head: 'La tessera punti è gratis', text: 'Ogni 2 usati comprati lo stesso giorno: 5 € di sconto subito. Ogni 10 usati o nuovi: 20 € da spendere.', badge: '5 €' }
    };
  }
  var state = { tpl: 'orari', fmt: 'story', slide: 0, f: defaults(), over: {}, custom: [], q: '', pf: 'all', bg: C.k, style: 'stripes', acc: null };
  var CUR = state, X, TH;

  /* ---------- colore ---------- */
  function rgb(c) { c = String(c); if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function toHex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function lum(c) { var a = rgb(c).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function contrast(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function best(c, list) { var o = list[0], m = 0; list.forEach(function (k) { var v = contrast(k, c); if (v > m) { m = v; o = k; } }); return o; }
  /* tema: tutti i colori del disegno derivano dallo sfondo scelto, così testo e accenti restano leggibili */
  function themeFor(bg, acc) {
    var dark = lum(bg) < 0.3, T = { bg: bg, dark: dark };
    T.ink = dark ? '#fff' : C.k;
    var hi = acc || (dark ? C.y : best(bg, [C.b, C.k]));
    if (contrast(hi, bg) < 2.4) hi = T.ink;
    T.hi = hi; T.hiInk = lum(hi) > 0.4 ? C.k : '#fff';
    T.slab = dark ? (lum(bg) < 0.02 ? C.b : mix(bg, C.k, 0.7)) : C.k;
    T.slabHi = contrast(hi, T.slab) >= 3 ? hi : (dark ? '#fff' : C.y);
    T.edge = contrast(hi, T.slab) >= 1.6 ? hi : C.y;
    T.chip = dark ? '#fff' : C.k; T.chipInk = dark ? C.k : '#fff';
    T.sec = dark ? C.lb : best(bg, [C.b, C.k]);
    T.sh = dark ? (lum(bg) < 0.02 ? C.b : mix(bg, C.k, 0.5)) : (lum(bg) > 0.85 ? C.lb : '#fff');
    T.sh2 = dark ? mix(bg, '#000', 0.65) : '#fff';
    T.band = dark ? (lum(bg) < 0.02 ? C.b : mix(bg, C.k, 0.32)) : (lum(bg) > 0.85 ? mix(bg, C.lb, 0.55) : mix(bg, '#fff', 0.5));
    T.barBg = hi; T.barInk = T.hiInk; T.barHaz = contrast(C.b, hi) >= 2 ? C.b : C.k;
    T.burstSh = C.k; T.disc = contrast(C.red, bg) > 1.8 ? C.red : C.k; T.discInk = '#fff';
    return T;
  }
  function pubTheme() { return TH; }

  /* ---------- prodotti ---------- */
  function srcOf(p) { return p.photo ? p.img : IMG + 'p/' + p.id + '.jpg'; }
  function thumbOf(p) { return p.photo ? p.img : IMG + 't/' + p.id + '.jpg'; }
  function prod(id) {
    var p = null; CUR.custom.forEach(function (c) { if (c.id === id) p = c; }); p = p || BYID[id]; if (!p) return null;
    var o = CUR.over[id] || {};
    var r = {}; for (var k in p) r[k] = p[k];
    if (o.t != null) r.t = o.t; if (o.p != null) r.p = o.p; r.src = srcOf(p); return r;
  }
  function num(s) { return parseFloat(String(s || '0').replace(/\./g, '').replace(',', '.')) || 0; }
  function eur(n) { return n.toFixed(2).replace('.', ','); }
  function dIT(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return { wd: DAYS[d.getDay()], d: d.getDate(), m: MONTHS[d.getMonth()], y: +m[1] };
  }
  function platName(p) { return p.pl === 'coll' ? (KIND[p.k] || 'COLLEZIONISMO') : (PLAT[p.pl] || { n: '' }).n; }

  /* ---------- immagini ---------- */
  var IM = {}, TRIM = {};
  function load(src) {
    if (!src) return Promise.resolve(null);
    if (IM[src] !== undefined) return Promise.resolve(IM[src]);
    return new Promise(function (res) { var i = new Image(); i.onload = function () { IM[src] = i; if (src.indexOf(IMG + 'p/') === 0) TRIM[src] = trimBox(i); res(i); }; i.onerror = function () { IM[src] = null; res(null); }; i.src = src; });
  }
  function trimBox(im) {
    try {
      var w = Math.min(im.width, 320), sc = w / im.width, h = Math.round(im.height * sc), c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
      var d = g.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = 0, y1 = 0;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var i = (y * w + x) * 4; if (d[i] < 236 || d[i + 1] < 236 || d[i + 2] < 236) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      if (x1 <= x0 || y1 <= y0) return null;
      x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2);
      return { x: x0 / sc, y: y0 / sc, w: (x1 - x0 + 1) / sc, h: (y1 - y0 + 1) / sc };
    } catch (e) { return null; }
  }
  function fontsReady() {
    var t = new Promise(function (r) { setTimeout(r, 5000); });
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([Promise.all([document.fonts.load('400 100px "Bebas Neue"'), document.fonts.load('400 24px Inter'), document.fonts.load('700 24px Inter'), document.fonts.load('800 24px Inter')]), t]);
  }
  var LOGOFILES = ['ps5', 'xbox', 'switch2', 'switch'];
  function preload(S) {
    var list = [IMG + 'logo-gamestore.png'].concat(LOGOFILES.map(function (n) { return IMG + 'logos/' + n + '-white.png'; }));
    var prev = CUR; CUR = S;
    var ids = (S.f[S.tpl] || {}).prods || [];
    ids.forEach(function (id) { var p = prod(id); if (p && p.src) list.push(p.src); });
    CUR = prev;
    return Promise.all([fontsReady()].concat(list.map(load)));
  }

  /* ---------- testo ---------- */
  function fnt(size, fam, wt) { return (wt || 400) + ' ' + Math.round(size) + 'px ' + (fam === 'i' ? 'Inter,system-ui,sans-serif' : '"Bebas Neue","Arial Narrow",Impact,sans-serif'); }
  function lsp(v) { if ('letterSpacing' in X) X.letterSpacing = (v || 0) + 'px'; }
  function mw(t, size, fam, wt, ls) { X.font = fnt(size, fam, wt); lsp(ls); var w = X.measureText(t).width; lsp(0); return w; }
  function wrapT(t, maxW, size, fam, wt, ls) {
    var out = [];
    String(t).split('\n').forEach(function (par) {
      var words = par.split(/\s+/).filter(Boolean), line = '';
      words.forEach(function (w) { var test = line ? line + ' ' + w : w; if (!line || mw(test, size, fam, wt, ls) <= maxW) line = test; else { out.push(line); line = w; } });
      if (line) out.push(line);
    });
    return out;
  }
  function blockH(n, size, lh) { return n ? (n - 1) * size * lh + size * 0.72 : 0; }
  function fit(t, o) {
    var lh = o.lh || 1, fam = o.fam || 'd';
    if (!t || !String(t).trim()) return { size: 0, lines: [], h: 0, lh: lh };
    var size = Math.max(o.max, o.min || 18), lines, ok = false, min = o.min || 18;
    for (; size >= min; size -= 2) {
      lines = wrapT(t, o.maxW, size, fam, o.wt, o.ls);
      ok = lines.length <= (o.maxLines || 9) && blockH(lines.length, size, lh) <= (o.maxH || 1e9) && lines.every(function (l) { return mw(l, size, fam, o.wt, o.ls) <= o.maxW + 0.5; });
      if (ok) break;
    }
    if (!ok) { size = min; lines = wrapT(t, o.maxW, size, fam, o.wt, o.ls); }
    return { size: size, lines: lines, h: blockH(lines.length, size, lh), lh: lh, fam: fam, wt: o.wt, ls: o.ls };
  }
  function drawLines(f, x, y, o) {
    X.textAlign = o.align || 'center'; X.textBaseline = 'alphabetic'; X.font = fnt(f.size, f.fam, f.wt); lsp(f.ls);
    f.lines.forEach(function (l, i) {
      var by = y + f.size * 0.72 + i * f.size * f.lh;
      if (o.shadow) { X.fillStyle = o.shadow.c; X.fillText(l, x + o.shadow.dx, by + o.shadow.dy); }
      X.fillStyle = o.fill || TH.ink; X.fillText(l, x, by);
    });
    lsp(0);
  }
  function maxLineW(f) { var m = 0; f.lines.forEach(function (l) { m = Math.max(m, mw(l, f.size, f.fam, f.wt, f.ls)); }); return m; }

  /* ---------- forme ---------- */
  function para(x, y, w, h, fill, off) {
    off = off == null ? h * 0.16 : off;
    X.beginPath(); X.moveTo(x + off, y); X.lineTo(x + w, y); X.lineTo(x + w - off, y + h); X.lineTo(x, y + h); X.closePath();
    if (fill) { X.fillStyle = fill; X.fill(); }
  }
  function rr(x, y, w, h, r) {
    X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath();
  }
  function burst(cx, cy, r, n, fill, rot) {
    X.save(); X.translate(cx, cy); X.rotate(rot || 0); X.beginPath();
    for (var i = 0; i < n * 2; i++) { var a = Math.PI * i / n, q = i % 2 ? r * 0.85 : r; X.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
    X.closePath(); X.fillStyle = fill; X.fill(); X.restore();
  }
  function hex(c, a) { var n = parseInt(c.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function hazard(x, y, w, h, c1, c2) {
    X.save(); X.beginPath(); X.rect(x, y, w, h); X.clip(); X.fillStyle = c2; X.fillRect(x, y, w, h); X.fillStyle = c1;
    var s = h * 1.6; for (var i = -h; i < w + h; i += s * 2) { X.beginPath(); X.moveTo(x + i + h, y); X.lineTo(x + i + h + s, y); X.lineTo(x + i + s, y + h); X.lineTo(x + i, y + h); X.closePath(); X.fill(); }
    X.restore();
  }

  /* ---------- motore di impaginazione ---------- */
  function Items(box, sc) {
    var I = {};
    I.text = function (t, o) {
      var al = o.align || 'center', f = fit(t, { maxW: box.w - (o.inset || 0), maxH: o.maxH, max: o.max * sc, min: Math.max(16, (o.min || 24) * sc), fam: o.fam || 'd', wt: o.wt, ls: o.ls, lh: o.lh || 0.95, maxLines: o.maxLines });
      return { h: f.h, gap: (o.gap || 0) * sc, draw: function (y) { drawLines(f, al === 'left' ? box.x : box.x + box.w / 2, y, { align: al === 'left' ? 'left' : 'center', fill: o.fill, shadow: o.shadow && { c: o.shadow.c, dx: o.shadow.d * sc, dy: o.shadow.d * sc } }); } };
    };
    I.chip = function (t, o) {
      var size = o.size * sc, pad = size * 0.6, ls = 2, al = o.align || 'center';
      var f = fit(t, { maxW: box.w - 2 * pad, max: size, min: 16, fam: 'd', lh: 1.02, maxLines: o.maxLines || 2, ls: ls });
      var w = maxLineW(f) + 2 * pad, h = f.h + f.size * 0.62;
      return { h: h, gap: (o.gap || 0) * sc, draw: function (y) {
        var x = al === 'left' ? box.x : box.x + (box.w - w) / 2; para(x, y, w, h, o.bg || TH.chip);
        drawLines(f, x + w / 2, y + (h - f.h) / 2, { fill: o.fg || TH.chipInk });
      } };
    };
    I.slab = function (rows, o) {
      var padY = (o.padY || 30) * sc, padX = 56 * sc, off = (o.off || 34) * sc;
      var fs = rows.filter(function (r) { return r.t && String(r.t).trim(); }).map(function (r) { return { r: r, f: fit(r.t, { maxW: box.w - 2 * padX - off, max: r.max * sc, min: 20, fam: r.fam || 'd', wt: r.wt, ls: r.ls, lh: r.lh || 1, maxLines: r.maxLines || 1 }) }; });
      var h = padY * 2 + fs.reduce(function (a, q, i) { return a + q.f.h + (i ? (q.r.gap || 12) * sc : 0); }, 0);
      return { h: h, gap: (o.gap || 0) * sc, draw: function (y) {
        para(box.x, y, box.w, h, o.bg || TH.slab, off); para(box.x + off * 0.5, y, box.w - off, 10 * sc, null);
        X.fillStyle = o.edge || TH.edge; X.beginPath(); X.moveTo(box.x + off, y); X.lineTo(box.x + box.w, y); X.lineTo(box.x + box.w - off * 0.08, y + 10 * sc); X.lineTo(box.x + off * 0.92, y + 10 * sc); X.closePath(); X.fill();
        var cy = y + padY;
        fs.forEach(function (q, i) { if (i) cy += (q.r.gap || 12) * sc; drawLines(q.f, box.x + box.w / 2, cy, { fill: q.r.fill || '#fff' }); cy += q.f.h; });
      } };
    };
    I.custom = function (h, gap, draw) { return { h: h * sc, gap: (gap || 0) * sc, draw: draw }; };
    return I;
  }
  function flow(box, build, o) {
    o = o || {}; var sc = 1, items, tot, n;
    for (var i = 0; i < 40; i++) {
      items = build(sc, Items(box, sc)).filter(Boolean); n = items.length;
      tot = items.reduce(function (a, it, j) { return a + it.h + (j < n - 1 ? it.gap : 0); }, 0);
      if (tot <= box.h) break; sc *= 0.96;
    }
    var extra = Math.max(0, box.h - tot), spread = n > 1 ? Math.min(extra / (n - 1), o.spread == null ? 50 : o.spread) : 0, y = box.y + (extra - spread * (n - 1)) * (o.top == null ? 0.5 : o.top);
    items.forEach(function (it) { it.draw(y); y += it.h + it.gap + spread; });
    return sc;
  }
  function cols(L) { var gap = 40, lw = Math.round(L.cw * 0.46); return [{ x: L.x0, y: L.y0, w: lw, h: L.ch }, { x: L.x0 + lw + gap, y: L.y0, w: L.cw - lw - gap, h: L.ch }]; }

  /* ---------- sistema grafico: layout, sfondo, logo, barra ---------- */
  function layout(fmt) {
    var F = FMT[fmt], L = { fmt: fmt, W: F.w, H: F.h, mx: F.mx, top: F.top, logoH: F.logoH, barH: 96 };
    L.barY = F.h - F.bot - L.barH;
    L.x0 = F.mx; L.cw = F.w - 2 * F.mx;
    L.y0 = F.top + F.logoH + (fmt === 'story' ? 44 : 34);
    L.y1 = L.barY - (fmt === 'story' ? 44 : 34);
    L.ch = L.y1 - L.y0;
    L.box = { x: L.x0, y: L.y0, w: L.cw, h: L.ch };
    return L;
  }
  function background(L, style) {
    var W = L.W, H = L.H, T = TH;
    X.fillStyle = T.bg; X.fillRect(0, 0, W, H);
    var bh = H * 0.3, y0 = H * 0.6, y1 = H * 0.36;
    if (style === 'plain') return;
    if (style === 'split') {
      var ys = H * 0.62, ye = H * 0.34;
      X.beginPath(); X.moveTo(0, ys); X.lineTo(W, ye); X.lineTo(W, H); X.lineTo(0, H); X.closePath(); X.fillStyle = T.band; X.fill();
      X.beginPath(); X.moveTo(0, ys); X.lineTo(W, ye); X.lineWidth = 10; X.strokeStyle = T.hi; X.stroke();
      return;
    }
    if (T.dark) {
      var g = X.createRadialGradient(W * 0.75, H * 0.3, 20, W * 0.75, H * 0.3, W * 0.95);
      g.addColorStop(0, hex(T.band, 0.55)); g.addColorStop(1, hex(T.band, 0)); X.fillStyle = g; X.fillRect(0, 0, W, H);
    }
    X.globalAlpha = T.dark ? 0.06 : 0.07; X.strokeStyle = T.ink; X.lineWidth = 2; X.beginPath();
    for (var x = -H; x < W; x += 46) { X.moveTo(x, H); X.lineTo(x + H, 0); } X.stroke(); X.globalAlpha = 1;
    X.beginPath(); X.moveTo(0, y0); X.lineTo(W, y1); if (L.fmt === 'story') { X.lineTo(W, H); X.lineTo(0, H); } else { X.lineTo(W, y1 + bh); X.lineTo(0, y0 + bh); } X.closePath(); X.fillStyle = T.band; X.fill();
    X.beginPath(); X.moveTo(0, y0); X.lineTo(W, y1); X.lineWidth = 8; X.strokeStyle = T.hi; X.globalAlpha = 0.75; X.stroke(); X.globalAlpha = 1;
  }
  function logoGS(L) {
    var im = IM[IMG + 'logo-gamestore.png']; if (!im) return;
    var ph = L.logoH, w = ph * im.width / im.height;
    if (!TH.dark) { /* su sfondi chiari il logo giallo poggia su una targa scura */
      var pd = ph * 0.14; para(L.x0, L.top, w + pd * 2.6, ph, C.k, ph * 0.1);
      X.drawImage(im, L.x0 + pd * 1.3, L.top + pd * 0.4, w - pd * 0.4, (w - pd * 0.4) * im.height / im.width);
    } else X.drawImage(im, L.x0 - 6, L.top, w, ph);
  }
  function frame(L, o) {
    var W = L.W, H = L.H, T = TH;
    X.save();
    background(L, CUR.style || 'stripes');
    if (L.fmt === 'story') {
      var gs = Math.min(330, 330 * (W - 30) / mw('GAME STORE', 330, 'd')); X.font = fnt(gs, 'd'); X.textAlign = 'center'; X.lineWidth = 3; X.strokeStyle = hex(T.ink, 0.1);
      X.strokeText('GAME STORE', W / 2, 40 + gs * 0.72); X.font = fnt(330, 'd'); X.strokeText('BOLZANO', W / 2, H - 20);
    }
    hazard(0, 0, W, 18, T.hi, T.bg);
    hazard(0, H - 18, W, 18, T.hi, T.bg);
    X.restore();
    logoGS(L);
    if (o.kicker) {
      var s = L.fmt === 'story' ? 42 : 36, w = mw(o.kicker, s, 'd', 400, 2) + s * 1.3, h = s * 1.25, ph = L.logoH;
      para(L.W - L.mx - w, L.top + (ph - h) / 2, w, h, T.chip);
      drawLines({ size: s, lines: [o.kicker], h: 0, lh: 1, fam: 'd', ls: 2 }, L.W - L.mx - w / 2, L.top + (ph - h) / 2 + (h - s * 0.72) / 2, { fill: T.chipInk });
    }
    X.fillStyle = T.barBg; X.fillRect(0, L.barY, W, L.barH);
    hazard(0, L.barY, W, 12, T.barHaz, T.barBg);
    var f = fit(o.bar || 'VIALE DUCA D’AOSTA 29 · BOLZANO · WWW.GAMESTOREBOLZANO.IT', { maxW: W - 2 * L.mx, max: 46, min: 24, fam: 'd', ls: 1.5, maxLines: 1 });
    drawLines(f, W / 2, L.barY + 12 + (L.barH - 12 - f.size * 0.72) / 2, { fill: T.barInk });
  }

  /* ---------- elementi: copertina, logo console, bollino ---------- */
  function cover(p, cx, cy, s, o) {
    o = o || {}; var im = p && p.src ? IM[p.src] : null, e = o.edge === undefined ? TH.hi : o.edge, d = s * 0.035;
    X.save(); X.translate(cx, cy); X.rotate((o.rot || 0) * Math.PI / 180);
    if (e) { X.fillStyle = e; rr(-s / 2 + d * 1.6, -s / 2 + d * 1.6, s, s, s * 0.03); X.fill(); }
    X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = s * 0.05; X.shadowOffsetY = s * 0.02;
    X.fillStyle = '#fff'; rr(-s / 2, -s / 2, s, s, s * 0.03); X.fill(); X.shadowColor = 'transparent';
    X.save(); rr(-s / 2, -s / 2, s, s, s * 0.03); X.clip();
    if (im) {
      if (p.photo) { var sc = Math.max(s / im.width, s / im.height); X.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc); }
      else { var tb = TRIM[p.src] || { x: 0, y: 0, w: im.width, h: im.height }, pp = s * 0.055, q = Math.min((s - 2 * pp) / tb.w, (s - 2 * pp) / tb.h); X.drawImage(im, tb.x, tb.y, tb.w, tb.h, -tb.w * q / 2, -tb.h * q / 2, tb.w * q, tb.h * q); }
    } else {
      X.fillStyle = '#e9ebf3'; X.fillRect(-s / 2, -s / 2, s, s);
      var f = fit((p && p.t || '').toUpperCase(), { maxW: s * 0.8, max: s * 0.18, min: 20, fam: 'd', lh: 1, maxLines: 4 });
      drawLines(f, 0, -f.h / 2, { fill: C.k });
    }
    X.restore(); X.restore();
  }
  /* etichetta piattaforma: targa scura con il logo ufficiale in bianco (mai icona tonda + testo) */
  function platBadge(p, x, y, h, align) {
    h *= 1.2;
    var m = PLAT[p.pl] || PLAT.retro, im = m.logo && IM[IMG + 'logos/' + m.logo + '-white.png'], pad = h * 0.36, bw, iw = 0, ih = 0, txt = platName(p);
    if (im) { var sc = Math.min(h * 0.64 / im.height, h * m.mw / im.width); iw = im.width * sc; ih = im.height * sc; bw = iw + 2 * pad; }
    else { var s = h * 0.5; bw = mw(txt, s, 'd', 400, 2) + 2 * pad; }
    bw = Math.max(bw, h * 1.5);
    var bx = align === 'center' ? x - bw / 2 : align === 'right' ? x - bw : x, d = Math.max(4, h * 0.07);
    para(bx + d, y + d, bw, h, TH.edge, h * 0.16); para(bx, y, bw, h, C.k, h * 0.16);
    if (im) X.drawImage(im, bx + (bw - iw) / 2, y + (h - ih) / 2, iw, ih);
    else drawLines({ size: h * 0.5, lines: [txt], h: 0, lh: 1, fam: 'd', ls: 2 }, bx + bw / 2, y + (h - h * 0.5 * 0.72) / 2, { fill: '#fff' });
    return bw;
  }
  function sticker(cx, cy, r, price, o) {
    o = o || {}; var rot = (o.rot == null ? -8 : o.rot) * Math.PI / 180, fill = o.fill || TH.hi, fg = o.fg || TH.hiInk;
    burst(cx + r * 0.07, cy + r * 0.08, r, 18, TH.burstSh, rot); burst(cx, cy, r, 18, fill, rot);
    X.save(); X.translate(cx, cy); X.rotate(rot);
    if (String(price).indexOf(',') < 0) {
      var ff = fit(String(price).toUpperCase(), { maxW: r * 1.35, max: r * 1.1, min: 20, fam: 'd', lh: 0.9, maxLines: 2 });
      drawLines(ff, 0, -ff.h / 2, { fill: fg }); X.restore(); return;
    }
    var parts = String(price).split(','), it = parts[0], dc = parts[1] || '', s = r * 0.9, small;
    for (; s > 20; s -= 2) { small = s * 0.42; var tw = mw(it, s, 'd', 400, 0) + s * 0.08 + Math.max(mw(dc, small, 'd'), mw('€', small, 'd')); if (tw <= r * 1.42) break; }
    small = s * 0.42; var wi = mw(it, s, 'd'), wc = Math.max(mw(dc, small, 'd'), mw('€', small, 'd')), tot = wi + s * 0.08 + wc, x0 = -tot / 2, ty = o.label ? r * 0.12 : 0;
    X.textBaseline = 'alphabetic'; X.fillStyle = fg; X.textAlign = 'left';
    X.font = fnt(s, 'd'); X.fillText(it, x0, ty + s * 0.36);
    X.font = fnt(small, 'd'); X.fillText(dc, x0 + wi + s * 0.08, ty - s * 0.36 + small * 0.74); X.fillText('€', x0 + wi + s * 0.08, ty - s * 0.36 + small * 1.8);
    if (o.label) { var lf = fit(o.label, { maxW: r * 1.1, max: r * 0.3, min: 14, fam: 'd', ls: 2, maxLines: 1 }); drawLines(lf, 0, -r * 0.66, { fill: fg }); }
    X.restore();
  }

  /* ---------- template ---------- */
  function hiChip(size, o) { o = o || {}; o.size = size; o.bg = TH.hi; o.fg = TH.hiInk; return o; }
  function T_orari(L, f) {
    var big = L.fmt === 'story', d = dIT(f.date), closed = f.type === 'chiuso', hours = closed ? 'CHIUSO' : (f.hours || '').toUpperCase();
    var closedBg = contrast(C.red, TH.bg) < 1.8 ? C.k : C.red;
    frame(L, { kicker: 'AVVISO ORARI', bar: (f.site || '').toUpperCase() });
    flow(L.box, function (sc, I) {
      return [
        I.chip((f.label || '').toUpperCase(), { size: big ? 60 : 50, gap: big ? 50 : 34 }),
        d && I.text(d.wd, { max: big ? 270 : 210, fill: TH.ink, shadow: { c: TH.sh, d: 9 }, gap: big ? 6 : 2 }),
        d && I.text(d.d + ' ' + d.m, { max: big ? 150 : 120, fill: TH.hi, gap: big ? 54 : 34 }),
        I.slab([{ t: hours, max: big ? 280 : 220, fill: closed ? '#fff' : TH.hiInk }], { bg: closed ? closedBg : TH.hi, edge: closed ? TH.edge : TH.slab, padY: big ? 40 : 30, gap: big ? 54 : 34 }),
        I.text((f.msg || '').toUpperCase(), { max: big ? 84 : 66, maxLines: 3, fill: TH.ink, lh: 1.02, inset: 30 })
      ];
    });
  }

  function T_day(L, f) {
    var p = prod((f.prods || [])[0]); if (!p) return frame(L, { kicker: 'DAY ONE' });
    var big = L.fmt === 'story';
    frame(L, { kicker: 'DAY ONE' });
    var head = (f.head || '').toUpperCase();
    if (L.fmt === 'square') {
      var c = cols(L), S = Math.min(c[0].w - 24, c[0].h - 30), cx = c[0].x + c[0].w / 2, cy = L.y0 + L.ch / 2;
      cover(p, cx, cy, S, { rot: -3 }); platBadge(p, cx - S / 2 - 6, cy + S / 2 - 40, 64, 'left');
      var b = { x: c[1].x, y: c[1].y, w: c[1].w, h: c[1].h };
      flow(b, function (sc, I) {
        return [
          I.text(head, { max: 230, maxLines: 2, fill: TH.hi, shadow: { c: TH.sh2, d: 7 }, align: 'left', lh: 0.88, gap: 28 }),
          I.text((f.sub || '').toUpperCase(), { max: 58, maxLines: 2, fill: TH.ink, align: 'left', gap: 26 }),
          I.slab([{ t: (f.when || '').toUpperCase(), max: 110, fill: TH.slabHi }, { t: (f.hours || '').toUpperCase(), max: 56, fill: '#fff', maxLines: 2, gap: 8 }], { padY: 22, off: 20, gap: 24 }),
          I.chip((f.pickup || '').toUpperCase(), hiChip(40, { align: 'left' }))
        ];
      }, { top: 0.5 });
      return;
    }
    flow(L.box, function (sc, I) {
      var S = (big ? 600 : 470) * sc;
      return [
        I.text(head, { max: big ? 290 : 230, maxLines: 1, fill: TH.hi, shadow: { c: TH.sh2, d: 10 }, gap: big ? 34 : 24 }),
        I.text((f.sub || '').toUpperCase(), { max: big ? 76 : 62, maxLines: 2, fill: TH.ink, gap: big ? 40 : 26 }),
        I.custom((S + 30) / sc, big ? 40 : 28, function (y) { var cx = L.W / 2, cy = y + 12 + S / 2; cover(p, cx, cy, S, { rot: -3 }); platBadge(p, cx - S / 2 - 14, cy + S / 2 - 52, big ? 84 : 72, 'left'); }),
        I.slab([{ t: (f.when || '').toUpperCase(), max: big ? 150 : 120, fill: TH.slabHi }, { t: (f.hours || '').toUpperCase(), max: big ? 70 : 58, fill: '#fff', gap: 6 }], { padY: big ? 30 : 22, gap: big ? 36 : 24 }),
        I.chip((f.pickup || '').toUpperCase(), hiChip(big ? 54 : 44))
      ];
    });
  }

  function T_off(L, f) {
    var p = prod((f.prods || [])[0]); if (!p) return frame(L, { kicker: 'OFFERTA' });
    var big = L.fmt === 'story', pr = num(f.price), old = num(f.old), pct = old > pr && pr > 0 ? Math.round((1 - pr / old) * 100) : 0;
    var until = dIT(f.until), untilTxt = until ? 'SOLO FINO AL ' + until.d + ' ' + until.m : '';
    frame(L, { kicker: (f.tag || 'OFFERTA').toUpperCase() });
    function priceBits(cx, cy, S) {
      var r = S * 0.36;
      r = L.fmt === 'square' ? S * 0.3 : r;
      sticker(cx + S / 2 - r * 0.45, cy + S / 2 - r * 0.2, r, f.price, { label: 'ORA' });
      if (pct) { var bx = cx - S / 2 + r * 0.38, by = cy - S / 2 + r * 0.38; burst(bx, by, r * 0.5, 14, TH.disc, 0.2); X.save(); X.translate(bx, by); X.rotate(-0.12); X.fillStyle = TH.discInk; X.textAlign = 'center'; X.font = fnt(r * 0.56, 'd'); X.fillText('-' + pct + '%', 0, r * 0.2); X.restore(); }
    }
    function oldLine(box, al, size, sc) {
      if (!f.old) return null; var t = 'PRIMA ' + f.old + ' €', fo = fit(t, { maxW: box.w, max: size * sc, min: 20, fam: 'd', ls: 1, maxLines: 1 });
      return { h: fo.h, gap: 14 * sc, draw: function (y) {
        var x = al === 'left' ? box.x : box.x + box.w / 2, tw = mw(t, fo.size, 'd', 400, 1);
        drawLines(fo, x, y, { align: al === 'left' ? 'left' : 'center', fill: TH.sec });
        var x0 = al === 'left' ? x : x - tw / 2; X.fillStyle = TH.hi; X.fillRect(x0 - 6, y + fo.size * 0.34, tw + 12, Math.max(4, fo.size * 0.07));
      } };
    }
    if (L.fmt === 'square') {
      var c = cols(L), S = Math.min(c[0].w - 30, c[0].h - 40), cx = c[0].x + c[0].w / 2, cy = L.y0 + L.ch / 2;
      cover(p, cx, cy, S, { rot: -3 }); priceBits(cx, cy, S); platBadge(p, cx - S / 2 - 6, cy + S / 2 - 30, 56, 'left');
      flow(c[1], function (sc, I) {
        return [
          I.text((p.t || '').toUpperCase(), { max: 120, maxLines: 3, fill: TH.ink, align: 'left', lh: 0.92, gap: 22 }),
          oldLine(c[1], 'left', 54, sc),
          untilTxt && I.chip(untilTxt, hiChip(40, { align: 'left', gap: 14 })),
          f.stock && I.text('FINO A ESAURIMENTO SCORTE', { max: 40, fill: TH.sec, align: 'left' })
        ];
      });
      return;
    }
    flow(L.box, function (sc, I) {
      var S = (big ? 600 : 470) * sc;
      return [
        I.text((p.t || '').toUpperCase(), { max: big ? 150 : 120, maxLines: 2, fill: TH.ink, shadow: { c: TH.sh, d: 7 }, gap: big ? 40 : 26 }),
        I.custom((S * 1.16 + 40) / sc, big ? 30 : 20, function (y) { var cx = L.W / 2, cy = y + 16 + S / 2; cover(p, cx, cy, S, { rot: -3 }); priceBits(cx, cy, S); platBadge(p, cx - S / 2 - 14, cy + S / 2 - 54, big ? 80 : 68, 'left'); }),
        oldLine(L.box, 'center', big ? 70 : 58, sc),
        untilTxt && I.chip(untilTxt, hiChip(big ? 60 : 50, { gap: 14 })),
        f.stock && I.text('FINO A ESAURIMENTO SCORTE', { max: big ? 50 : 42, fill: TH.sec })
      ];
    });
  }

  function T_nuovi(L, f, idx) {
    var ids = f.prods || [], n = ids.length, big = L.fmt === 'story', dd = dIT(f.date), dateTxt = dd ? 'DAL ' + dd.d + ' ' + dd.m : '';
    if (idx === 0) {
      frame(L, { kicker: 'NOVITÀ' });
      var ps = ids.map(prod).filter(Boolean);
      flow(L.box, function (sc, I) {
        var rows = n <= 3 ? 1 : 2, per = rows === 1 ? n : Math.ceil(n / 2), mh = (big ? 640 : L.fmt === 'post' ? 440 : 300) * sc, out = [];
        out.push(I.chip('IN ARRIVO IN NEGOZIO', { size: big ? 50 : 42, gap: big ? 44 : 28 }));
        if (L.fmt === 'square') out.push(I.text('NUOVI ARRIVI', { max: 230, maxLines: 1, fill: TH.hi, shadow: { c: TH.sh2, d: 8 }, gap: 18 }));
        else { out.push(I.text('NUOVI', { max: big ? 270 : 220, fill: TH.ink, shadow: { c: TH.sh, d: 10 }, gap: 0 })); out.push(I.text('ARRIVI', { max: big ? 270 : 220, fill: TH.hi, shadow: { c: TH.sh2, d: 10 }, gap: big ? 20 : 12 })); }
        if (dateTxt) out.push(I.chip(dateTxt, { size: big ? 54 : 44, bg: TH.slab, fg: TH.slabHi, gap: big ? 50 : 30 }));
        out.push(I.custom(mh / sc, 0, function (y) {
          var gap = 26, cs = Math.min((L.cw - gap * (per - 1)) / per, (mh - gap * (rows - 1)) / rows);
          ps.forEach(function (p, i) {
            var r = rows === 1 ? 0 : (i < per ? 0 : 1), inRow = rows === 1 ? n : (r === 0 ? per : n - per), k = rows === 1 ? i : (r === 0 ? i : i - per);
            var rw = inRow * cs + (inRow - 1) * gap, x = L.W / 2 - rw / 2 + k * (cs + gap) + cs / 2, cy = y + cs / 2 + r * (cs + gap);
            cover(p, x, cy, cs, { rot: (i % 2 ? 2.5 : -2.5) });
          });
        }));
        return out;
      });
      return;
    }
    if (idx === n + 1) {
      frame(L, { kicker: 'ARRIVEDERCI' });
      flow(L.box, function (sc, I) {
        return [
          I.text('VIENI A', { max: big ? 200 : 160, fill: TH.ink, gap: 0 }),
          I.text('TROVARCI', { max: big ? 330 : 260, fill: TH.hi, shadow: { c: TH.sh2, d: 9 }, gap: big ? 50 : 32 }),
          I.slab([{ t: 'VIALE DUCA D’AOSTA 29', max: big ? 110 : 90, fill: '#fff' }, { t: 'BOLZANO · 0471 266460', max: big ? 80 : 64, fill: TH.slabHi, gap: 8 }], { padY: big ? 34 : 26, gap: big ? 40 : 28 }),
          I.chip((f.orari || '').toUpperCase(), hiChip(big ? 56 : 46, { gap: big ? 24 : 16 })),
          I.text('NUOVO E USATO · SUPERVALUTAZIONE · ANCHE SUL SITO 24/7', { max: big ? 54 : 44, maxLines: 2, fill: TH.sec, lh: 1 })
        ];
      });
      return;
    }
    var p = prod(ids[idx - 1]); if (!p) return frame(L, { kicker: 'NOVITÀ' });
    var num_ = (idx < 10 ? '0' : '') + idx + ' / ' + (n < 10 ? '0' : '') + n;
    frame(L, { kicker: num_ });
    if (L.fmt === 'square') {
      var c = cols(L), S = Math.min(c[0].w + 40, c[0].h - 30), cx = c[0].x + S / 2 - 10, cy = L.y0 + L.ch / 2;
      cover(p, cx, cy, S, { rot: -2 });
      var b = { x: c[0].x + S + 30, y: c[1].y, w: L.x0 + L.cw - (c[0].x + S + 30), h: c[1].h };
      flow(b, function (sc, I) {
        return [I.custom(66, 14, function (y) { platBadge(p, b.x, y, 56, 'left'); }), I.text((p.t || '').toUpperCase(), { max: 130, maxLines: 4, fill: TH.ink, lh: 0.92, align: 'left', gap: 18 }),
          I.custom(190, 0, function (y) { sticker(b.x + 112, y + 92, 96, p.p, { label: p.c === 'u' ? 'USATO' : 'NUOVO' }); })];
      }, { top: 0.5 });
      return;
    }
    flow(L.box, function (sc, I) {
      var S = (big ? 680 : 520) * sc, st = S * 0.3;
      return [
        I.custom((S * 1.14 + 60) / sc, big ? 30 : 20, function (y) { var cx = L.W / 2, cy = y + 22 + S / 2; cover(p, cx, cy, S, { rot: -2.5 }); sticker(cx + S / 2 - st * 0.4, cy + S / 2 - st * 0.3, st, p.p, { label: p.c === 'u' ? 'USATO' : 'NUOVO' }); platBadge(p, cx - S / 2 - 12, cy - S / 2 - 8, big ? 80 : 68, 'left'); }),
        I.text((p.t || '').toUpperCase(), { max: big ? 170 : 130, maxLines: 3, fill: TH.ink, shadow: { c: TH.sh, d: 8 }, lh: 0.92, gap: 0 })
      ];
    });
  }
  function nuoviCount(f) { return (f.prods || []).length + 2; }

  function usatoCell(p, x, y, w, h) {
    var pad = Math.min(w, h) * 0.05, horiz = w >= h * 1.25;
    X.fillStyle = TH.hi; rr(x + 10, y + 10, w, h, 14); X.fill();
    X.fillStyle = '#fff'; rr(x, y, w, h, 14); X.fill();
    var price = p.p;
    function priceTag(bx, by, bh, al) {
      var s = bh * 0.78, t = price + ' €', tw = mw(t, s, 'd', 400, 1), bw = tw + bh * 0.9, px = al === 'right' ? bx - bw : bx;
      para(px, by, bw, bh, TH.slab, bh * 0.14); drawLines({ size: s, lines: [t], h: 0, lh: 1, fam: 'd', ls: 1 }, px + bw / 2, by + (bh - s * 0.72) / 2, { fill: '#fff' });
    }
    if (horiz) {
      var S = h - 2 * pad, tx = x + S + 2 * pad, tw = w - S - 3 * pad;
      X.save(); rr(x, y, w, h, 14); X.clip(); cover(p, x + pad + S / 2, y + h / 2, S, { edge: null }); X.restore();
      var f = fit((p.t || '').toUpperCase(), { maxW: tw, max: h * 0.26, min: 20, fam: 'd', lh: 0.95, maxLines: 3 });
      var pbh = Math.min(54, h * 0.2);
      var tot = pbh + 12 + f.h + 14 + h * 0.2, ty = y + (h - tot) / 2;
      platBadge(p, tx, ty, pbh, 'left'); drawLines(f, tx, ty + pbh + 12, { align: 'left', fill: C.k });
      priceTag(tx, ty + pbh + 12 + f.h + 14, h * 0.2, 'left');
    } else {
      var tb = Math.min(h * 0.36, 150), S2 = Math.min(w - 2 * pad, h - tb - pad), cx = x + w / 2;
      cover(p, cx, y + pad + S2 / 2, S2, { edge: null });
      var f2 = fit((p.t || '').toUpperCase(), { maxW: w - 2 * pad - 6, max: tb * 0.34, min: 18, fam: 'd', lh: 0.95, maxLines: 2 });
      drawLines(f2, cx, y + pad + S2 + 14, { fill: C.k });
      var ph = Math.min(60, tb * 0.34); priceTag(x + w - pad * 0.6, y + h - ph - pad * 0.6, ph, 'right');
      platBadge(p, x + pad * 0.6, y + pad * 0.6, Math.min(52, S2 * 0.15), 'left');
    }
  }
  function T_usato(L, f) {
    var ps = (f.prods || []).map(prod).filter(Boolean).slice(0, 4), n = ps.length, big = L.fmt === 'story';
    frame(L, { kicker: 'USATO GARANTITO' });
    var claimF = (f.claim || '').toUpperCase(), box = L.box;
    var title = L.fmt === 'square' ? fit('USATO DELLA SETTIMANA', { maxW: box.w, max: 150, min: 60, fam: 'd', maxLines: 1 }) : fit('USATO DELLA SETTIMANA', { maxW: box.w, max: big ? 190 : 150, min: 60, fam: 'd', maxLines: 2, lh: 0.92 });
    var claim = fit(claimF, { maxW: box.w - 120, max: big ? 76 : 62, min: 26, fam: 'd', maxLines: 2 });
    var slabH = claim.h + 56, topH = title.h;
    var gy = box.y + topH + 34, gh = box.h - topH - 34 - slabH - 34;
    drawLines(title, L.W / 2, box.y, { fill: TH.hi, shadow: { c: TH.sh2, dx: 8, dy: 8 } });
    if (n) {
      var colsN = (n === 1 || (L.fmt === 'square' && n === 2)) ? 1 : 2, rows = Math.ceil(n / colsN), g = 28;
      var cw_ = (box.w - g * (colsN - 1)) / colsN, ch_ = (gh - g * (rows - 1)) / rows;
      if (n === 1) { cw_ = Math.min(cw_, L.fmt === 'square' ? box.w : ch_ * 1.0); }
      ps.forEach(function (p, i) {
        var r = Math.floor(i / colsN), k = i % colsN, w = cw_, x = box.x + k * (cw_ + g), h = ch_;
        if (colsN === 2 && n === 3 && i === 2) { w = box.w; x = box.x; }
        if (n === 1) { x = box.x + (box.w - w) / 2; }
        usatoCell(p, x, gy + r * (ch_ + g), w, h);
      });
    }
    var sy = box.y + box.h - slabH;
    para(box.x, sy, box.w, slabH, TH.slab, 30);
    X.fillStyle = TH.edge; X.beginPath(); X.moveTo(box.x + 30, sy); X.lineTo(box.x + box.w, sy); X.lineTo(box.x + box.w - 2, sy + 9); X.lineTo(box.x + 28, sy + 9); X.fill();
    drawLines(claim, L.W / 2, sy + 28, { fill: '#fff' });
  }

  function T_free(L, f) {
    var big = L.fmt === 'story', bd = (f.badge || '').trim();
    frame(L, { kicker: 'DAL NEGOZIO' });
    var sq = L.fmt === 'square';
    if (sq && bd) {
      var rw = 330, left = { x: L.x0, y: L.y0, w: L.cw - rw - 30, h: L.ch };
      sticker(L.x0 + L.cw - rw / 2, L.y0 + L.ch / 2, rw * 0.5, bd, { rot: 8 });
      flow(left, function (sc, I) { return [I.text((f.head || '').toUpperCase(), { max: 190, maxLines: 4, fill: TH.hi, shadow: { c: TH.sh2, d: 8 }, align: 'left', lh: 0.9, gap: 30 }), I.text(f.text || '', { fam: 'i', wt: 700, max: 40, min: 22, maxLines: 6, fill: TH.ink, align: 'left', lh: 1.3 })]; });
      return;
    }
    flow(L.box, function (sc, I) {
      return [
        I.chip((f.tag || '').toUpperCase(), { size: big ? 56 : 46, gap: big ? 46 : 30 }),
        I.text((f.head || '').toUpperCase(), { max: big ? 290 : 230, maxLines: 4, fill: TH.hi, shadow: { c: TH.sh2, d: 10 }, lh: 0.9, gap: big ? 50 : 30 }),
        bd && I.custom(big ? 430 : 330, big ? 40 : 26, function (y) { var r = (big ? 430 : 330) * sc / 2; sticker(L.W / 2, y + r, r * 0.96, bd, { rot: -7 }); }),
        I.text(f.text || '', { fam: 'i', wt: 700, max: big ? 52 : 44, min: 22, maxLines: 7, fill: TH.ink, lh: 1.32, inset: 40 })
      ];
    });
  }

  /* ---------- registro template ---------- */
  var TPL = {
    orari: { name: 'Orari e chiusure', sub: 'Avviso di orario speciale, chiusura o apertura straordinaria.', draw: T_orari, count: function () { return 1; }, fields: [
      { k: 'date', l: 'Che giorno?', t: 'date' },
      { k: 'type', l: 'Che tipo di avviso?', t: 'select', o: [['continuato', 'Orario continuato'], ['anticipata', 'Chiusura anticipata'], ['chiuso', 'Chiuso tutto il giorno'], ['straordinaria', 'Apertura straordinaria']] },
      { k: 'label', l: 'Titolo in evidenza', t: 'text' },
      { k: 'hours', l: 'Orario', t: 'text', h: 'Esempio: 10.00 – 16.30. Ignorato se scegli «Chiuso».' },
      { k: 'msg', l: 'Messaggio ai clienti', t: 'textarea' },
      { k: 'site', l: 'Riga in basso', t: 'text' }] },
    day: { name: 'Day one', sub: 'L’uscita di un gioco: copertina grande, giorno e orari.', draw: T_day, count: function () { return 1; }, fields: [
      { k: 'prods', l: 'Quale gioco?', t: 'prods', max: 1 },
      { k: 'head', l: 'Titolo grande', t: 'text' }, { k: 'sub', l: 'Frase sotto il titolo', t: 'text' },
      { k: 'when', l: 'Giorno o data', t: 'text' }, { k: 'hours', l: 'Orari di apertura', t: 'text' }, { k: 'pickup', l: 'Riga ritiro', t: 'text' }] },
    off: { name: 'Offerta', sub: 'Un prodotto con il prezzo speciale in bollino.', draw: T_off, count: function () { return 1; }, fields: [
      { k: 'prods', l: 'Quale prodotto?', t: 'prods', max: 1 },
      { k: 'tag', l: 'Etichetta in alto', t: 'text' },
      { k: 'old', l: 'Prezzo di prima (€)', t: 'text' }, { k: 'price', l: 'Nuovo prezzo (€)', t: 'text' },
      { k: 'until', l: 'Valido fino al', t: 'date' }, { k: 'stock', l: 'Fino a esaurimento scorte', t: 'check' }] },
    nuovi: { name: 'Nuovi arrivi', sub: 'Carosello: copertina, una slide per prodotto e chiusura.', draw: T_nuovi, count: nuoviCount, fields: [
      { k: 'prods', l: 'Quali prodotti? (da 2 a 6)', t: 'prods', max: 6, min: 2 },
      { k: 'date', l: 'In negozio dal', t: 'date' }, { k: 'orari', l: 'Orari (ultima slide)', t: 'text' }] },
    usato: { name: 'Usato della settimana', sub: 'Fino a 4 giochi usati con prezzo e piattaforma.', draw: T_usato, count: function () { return 1; }, fields: [
      { k: 'prods', l: 'Quali giochi usati? (fino a 4)', t: 'prods', max: 4, used: true },
      { k: 'claim', l: 'Riga permuta', t: 'text' }] },
    free: { name: 'Avviso o tessera', sub: 'Testo libero con bollino: tessera punti, eventi, comunicazioni.', draw: T_free, count: function () { return 1; }, fields: [
      { k: 'tag', l: 'Etichetta in alto', t: 'text' }, { k: 'head', l: 'Titolo', t: 'text' }, { k: 'text', l: 'Testo', t: 'textarea' }, { k: 'badge', l: 'Bollino', t: 'text', h: 'Esempio: 5 €. Lascia vuoto per toglierlo.' }] }
  };
  var ORDER = ['orari', 'day', 'off', 'nuovi', 'usato', 'free'];

  /* ---------- disegno ---------- */
  function drawTo(canvas, S, idx) {
    var prevCur = CUR, prevX = X, prevT = TH, F = FMT[S.fmt];
    canvas.width = F.w; canvas.height = F.h; CUR = S; X = canvas.getContext('2d'); TH = themeFor(S.bg || C.k, S.acc || null);
    try { X.clearRect(0, 0, F.w, F.h); X.textBaseline = 'alphabetic'; TPL[S.tpl].draw(layout(S.fmt), S.f[S.tpl], idx || 0); }
    finally { CUR = prevCur; X = prevX; TH = prevT; }
  }
  function renderTo(canvas, S, idx) { return preload(S).then(function () { drawTo(canvas, S, idx); }); }
  function blockers() {
    var f = state.f[state.tpl], out = [], pr = TPL[state.tpl].fields.filter(function (x) { return x.t === 'prods'; })[0];
    if (pr) {
      var ids = f.prods || [];
      if (!ids.length) out.push('Scegli un prodotto al punto 3.');
      else if (pr.min && ids.length < pr.min) out.push('Scegli almeno ' + pr.min + ' prodotti al punto 3.');
    }
    return out;
  }

  /* ---------- interfaccia ---------- */
  var cv, cvMini;
  var renderTimer = 0, renderTok = 0;
  function schedule() { clearTimeout(renderTimer); renderTimer = setTimeout(refresh, 70); }
  function count() { return TPL[state.tpl].count(state.f[state.tpl]); }
  function refresh() {
    var tok = ++renderTok, n = count();
    if (state.slide >= n) state.slide = n - 1; if (state.slide < 0) state.slide = 0;
    preload(state).then(function () {
      if (tok !== renderTok) return;
      drawTo(cv, state, state.slide);
      cv.setAttribute('aria-label', 'Anteprima ' + TPL[state.tpl].name + ', formato ' + FMT[state.fmt].name);
      var mc = cvMini, F = FMT[state.fmt], mh = 96, mwid = Math.round(mh * F.w / F.h); mc.width = mwid * 2; mc.height = mh * 2; mc.style.width = mwid + 'px'; mc.style.height = mh + 'px'; mc.getContext('2d').drawImage(cv, 0, 0, mc.width, mc.height);
      drawStrip(n); updateBar(n); drawThumbs();
    });
  }
  function drawStrip(n) {
    var wrap = $('#stripWrap'), st = $('#strip'); wrap.hidden = n < 2; if (n < 2) { st.innerHTML = ''; return; }
    if (st.children.length !== n) {
      st.innerHTML = ''; for (var i = 0; i < n; i++) { var b = document.createElement('button'); b.type = 'button'; b.className = 'th'; b.setAttribute('aria-label', 'Slide ' + (i + 1)); b.dataset.i = i; b.appendChild(document.createElement('canvas')); st.appendChild(b); }
    }
    var tmp = document.createElement('canvas');
    $$('.th', st).forEach(function (b, i) {
      drawTo(tmp, state, i); var c = $('canvas', b), F = FMT[state.fmt], w = 84, h = Math.round(w * F.h / F.w); c.width = w * 2; c.height = h * 2; c.style.width = w + 'px'; c.style.height = h + 'px';
      c.getContext('2d').drawImage(tmp, 0, 0, w * 2, h * 2); b.classList.toggle('on', i === state.slide);
    });
  }
  function updateBar(n) {
    var bl = blockers(), one = $('#dl1'), all = $('#dlAll'), msg = $('#blk'), per = $('#perSlide'), dock = $('#dockDl');
    one.disabled = all.disabled = dock.disabled = !!bl.length; msg.hidden = !bl.length; msg.textContent = bl[0] || '';
    one.hidden = n > 1; all.hidden = n < 2; one.textContent = 'Scarica PNG · ' + FMT[state.fmt].size;
    all.textContent = 'Scarica le ' + n + ' slide (.zip)';
    per.hidden = n < 2;
    if (n > 1) { per.innerHTML = '<span class="lbl">Oppure una slide alla volta</span>' + Array.apply(null, Array(n)).map(function (_, i) { return '<button type="button" data-i="' + i + '">' + (i + 1) + '</button>'; }).join(''); }
    $('#slideNav').hidden = n < 2; $('#slideLbl').textContent = (state.slide + 1) + ' / ' + n;
    $('#fmtLbl').textContent = TPL[state.tpl].name + ' · ' + FMT[state.fmt].name + ' ' + FMT[state.fmt].size;
    $('#pvNote').textContent = state.fmt === 'story' ? 'Le fasce alta e bassa restano libere dal testo importante: Instagram le copre.' : '';
    $('#dockT').textContent = TPL[state.tpl].name; dock.textContent = n > 1 ? 'Scarica zip' : 'Scarica';
    var sh = $('#share'); if (sh) { sh.hidden = !canShareFiles; sh.disabled = !!bl.length; sh.textContent = n > 1 ? 'Condividi le ' + n + ' slide su Instagram' : (state.fmt === 'story' ? 'Metti in storia su Instagram' : 'Condividi su Instagram'); }
    if (canShareFiles) { dock.textContent = 'Instagram'; }
    schedulePrep();
  }

  var thumbTok = 0, thumbKey = '';
  function drawThumbs() {
    var key = [state.bg, state.style, state.acc].join('|'); if (key === thumbKey) return; thumbKey = key; var tok = ++thumbTok, D = defaults();
    Promise.all(ORDER.map(function (k) { return preload({ tpl: k, f: D, over: {}, custom: [] }); })).then(function () {
      if (tok !== thumbTok) return;
      var tmp = document.createElement('canvas');
      ORDER.forEach(function (k, i) {
        drawTo(tmp, { tpl: k, fmt: 'post', f: D, over: {}, custom: [], bg: state.bg, style: state.style, acc: state.acc, slide: 0 }, 0);
        var c = $('canvas', $('#tplRow').children[i]); c.getContext('2d').drawImage(tmp, 0, 0, c.width, c.height);
      });
    });
  }
  function buildTemplates() {
    var row = $('#tplRow'); row.innerHTML = '';
    ORDER.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tc'; b.dataset.k = k; b.setAttribute('aria-pressed', k === state.tpl);
      b.innerHTML = '<span class="tc-th"><canvas width="240" height="300"></canvas></span><b>' + TPL[k].name + '</b><small>' + TPL[k].sub + '</small>';
      b.addEventListener('click', function () { state.tpl = k; state.slide = 0; $$('.tc', row).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.k === k); }); buildForm(); schedule(); });
      row.appendChild(b);
    });
  }
  function buildFormat() {
    var el = $('#fmt'); el.innerHTML = '';
    Object.keys(FMT).forEach(function (k) {
      var F = FMT[k], b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-pressed', k === state.fmt);
      b.innerHTML = '<span class="fi"><i style="aspect-ratio:' + F.w + '/' + F.h + '"></i></span><b>' + F.name + '</b><small>' + F.w + '×' + F.h + '</small>';
      b.addEventListener('click', function () { state.fmt = k; $$('button', el).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.k === k); }); schedule(); });
      el.appendChild(b);
    });
  }
  function buildStyle() {
    var sw = $('#swBg'); sw.innerHTML = '';
    BGS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'swb'; b.style.setProperty('--c', c[1]); b.dataset.c = c[1]; b.title = c[0]; b.setAttribute('aria-label', 'Sfondo ' + c[0]);
      b.addEventListener('click', function () { setBg(c[1]); }); sw.appendChild(b);
    });
    var lab = document.createElement('label'); lab.className = 'swb custom'; lab.title = 'Colore personalizzato';
    lab.innerHTML = '<input type="color" id="bgCustom" value="#07070c" aria-label="Colore di sfondo personalizzato"><span>+</span>';
    sw.appendChild(lab);
    $('#bgCustom').addEventListener('input', function (e) { setBg(e.target.value.toUpperCase()); });
    var st = $('#sty'); st.innerHTML = '';
    STYLES.forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.s = s[0]; b.innerHTML = '<i class="sty-' + s[0] + '"></i><span>' + s[1] + '</span>';
      b.addEventListener('click', function () { state.style = s[0]; paintStyle(); schedule(); }); st.appendChild(b);
    });
    var ac = $('#swAcc'); ac.innerHTML = '';
    var auto = document.createElement('button'); auto.type = 'button'; auto.className = 'swb auto'; auto.dataset.c = ''; auto.textContent = 'Auto'; auto.addEventListener('click', function () { state.acc = null; paintStyle(); schedule(); }); ac.appendChild(auto);
    [['Giallo', C.y], ['Blu', C.b], ['Azzurro', C.lb], ['Viola', C.p], ['Rosso', C.red], ['Bianco', '#FFFFFF'], ['Nero', C.k]].forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'swb'; b.style.setProperty('--c', c[1]); b.dataset.c = c[1]; b.title = c[0]; b.setAttribute('aria-label', 'Evidenza ' + c[0]);
      b.addEventListener('click', function () { state.acc = c[1]; paintStyle(); schedule(); }); ac.appendChild(b);
    });
    paintStyle();
  }
  function setBg(c) { state.bg = c; paintStyle(); schedule(); }
  function paintStyle() {
    var preset = false;
    $$('#swBg .swb:not(.custom)').forEach(function (b) { var on = b.dataset.c.toUpperCase() === state.bg.toUpperCase(); if (on) preset = true; b.setAttribute('aria-pressed', on); });
    var cu = $('#swBg .custom'); cu.setAttribute('aria-pressed', !preset); cu.style.setProperty('--c', preset ? '#fff' : state.bg);
    $$('#swAcc .swb').forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.c || '') === (state.acc || '')); });
    $$('#sty button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.s === state.style); });
    var T = themeFor(state.bg, state.acc);
    $('#sty').style.setProperty('--a', state.bg); $('#sty').style.setProperty('--b', T.band); $('#sty').style.setProperty('--h', T.hi);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function buildForm() {
    var T = TPL[state.tpl], f = state.f[state.tpl], el = $('#form'); el.innerHTML = '';
    $('#formTitle').textContent = '· ' + T.name;
    T.fields.forEach(function (d) {
      var w = document.createElement('div'); w.className = 'fld';
      var id = 'f_' + d.k, hint = d.h ? '<small class="h">' + d.h + '</small>' : '';
      if (d.t === 'prods') { buildPicker(w, d); el.appendChild(w); return; }
      if (d.t === 'check') { w.className = 'fld chk'; w.innerHTML = '<label><input type="checkbox" id="' + id + '"' + (f[d.k] ? ' checked' : '') + '><span>' + d.l + '</span></label>'; }
      else if (d.t === 'select') { w.innerHTML = '<label for="' + id + '">' + d.l + '</label><select id="' + id + '">' + d.o.map(function (o) { return '<option value="' + o[0] + '"' + (f[d.k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }
      else if (d.t === 'textarea') { w.innerHTML = '<label for="' + id + '">' + d.l + '</label><textarea id="' + id + '" rows="3">' + esc(f[d.k]) + '</textarea>' + hint; }
      else { w.innerHTML = '<label for="' + id + '">' + d.l + '</label><input id="' + id + '" type="' + (d.t === 'date' ? 'date' : 'text') + '" value="' + esc(f[d.k]) + '" autocomplete="off">' + hint; }
      var inp = $('#' + id, w);
      inp.addEventListener(d.t === 'check' || d.t === 'select' || d.t === 'date' ? 'change' : 'input', function () {
        f[d.k] = d.t === 'check' ? inp.checked : inp.value;
        if (state.tpl === 'orari' && d.k === 'type') { f.label = TYPES[inp.value]; $('#f_label').value = f.label; if (inp.value === 'chiuso') f.hours = ''; }
        schedule();
      });
      el.appendChild(w);
    });
  }

  /* selettore prodotti: griglia di copertine vere + filtri */
  var CHIPS = [['all', 'Tutti'], ['ps5', 'PS5'], ['sw2', 'Switch 2'], ['sw', 'Switch'], ['xbox', 'Xbox'], ['coll', 'Collezionismo'], ['u', 'Usato']];
  function pickable(d) {
    var q = state.q.toLowerCase().trim(), list = state.custom.concat(P);
    return list.filter(function (p) {
      if (d.used && p.c !== 'u') return false;
      var f = state.pf;
      if (f === 'u' && p.c !== 'u') return false;
      if (f === 'coll' && p.pl !== 'coll' && p.pl !== 'retro') return false;
      if (f !== 'all' && f !== 'u' && f !== 'coll' && p.pl !== f) return false;
      if (q && (p.t + ' ' + platName(p)).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function buildPicker(w, d) {
    var f = state.f[state.tpl];
    w.className = 'fld pk';
    var chips = CHIPS.filter(function (c) { return !(d.used && c[0] === 'u'); });
    if (d.used && state.pf === 'u') state.pf = 'all';
    w.innerHTML = '<span class="lbl">' + d.l + '</span><div class="pk-sel" id="pkSel"></div>' +
      '<input type="search" id="pkQ" placeholder="Cerca per nome: FC 27, Pokémon, Switch…" aria-label="Cerca nel catalogo" value="' + esc(state.q) + '" autocomplete="off">' +
      '<div class="chips" id="pkChips" role="group" aria-label="Filtra per piattaforma">' + chips.map(function (c) { return '<button type="button" data-f="' + c[0] + '" aria-pressed="' + (state.pf === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="pk-grid" id="pkList" role="listbox" aria-label="Catalogo"></div>' +
      '<label class="up"><input type="file" id="pkUp" accept="image/*" hidden><span>Oppure carica una tua foto</span></label>';
    function sel() {
      var box = $('#pkSel', w); box.innerHTML = '';
      f.prods.forEach(function (id) {
        var p = prod(id); if (!p) return; var r = document.createElement('div'); r.className = 'sr';
        r.innerHTML = '<img alt="" src="' + esc(thumbOf(p)) + '"><div><input class="t" aria-label="Titolo" value="' + esc(p.t) + '"><div class="r2"><input class="pp" aria-label="Prezzo" inputmode="decimal" value="' + esc(p.p) + '"><span>€ · ' + esc(platName(p)) + '</span></div></div><button type="button" class="x" aria-label="Rimuovi">×</button>';
        var o = state.over[id] = state.over[id] || {};
        $('.t', r).addEventListener('input', function (e) { o.t = e.target.value; schedule(); });
        $('.pp', r).addEventListener('input', function (e) { o.p = e.target.value; if (state.tpl === 'off') { f.price = e.target.value; var pi = $('#f_price'); if (pi) pi.value = e.target.value; } schedule(); });
        $('.x', r).addEventListener('click', function () { f.prods = f.prods.filter(function (x) { return x !== id; }); sel(); list(); schedule(); });
        box.appendChild(r);
      });
      if (d.max > 1) { var h = document.createElement('p'); h.className = 'hint'; h.textContent = f.prods.length + ' di ' + d.max + ' scelti' + (d.min ? ' (minimo ' + d.min + ')' : ''); box.appendChild(h); }
    }
    function list() {
      var box = $('#pkList', w); box.innerHTML = ''; var items = pickable(d);
      items.forEach(function (p) {
        var on = f.prods.indexOf(p.id) >= 0, b = document.createElement('button'); b.type = 'button'; b.className = 'pc' + (on ? ' on' : ''); b.setAttribute('aria-pressed', on);
        b.innerHTML = '<span class="pc-i"><img alt="" loading="lazy" src="' + esc(thumbOf(p)) + '"><i>' + (on ? '✓' : '') + '</i></span><b>' + esc(p.t) + '</b><em>' + esc(platName(p)) + ' · ' + esc(p.p) + ' €' + (p.c === 'u' ? ' · usato' : '') + '</em>';
        b.addEventListener('click', function () { choose(p.id); });
        box.appendChild(b);
      });
      if (!items.length) box.innerHTML = '<p class="hint">Nessun prodotto trovato. Cambia filtro o cerca altro.</p>';
    }
    function choose(id) {
      var i = f.prods.indexOf(id);
      if (i >= 0) f.prods.splice(i, 1);
      else { if (d.max === 1) f.prods = [id]; else if (f.prods.length < d.max) f.prods.push(id); else { toast('Massimo ' + d.max + ' prodotti.'); return; } }
      if (state.tpl === 'off' && f.prods.length) { var p = prod(f.prods[0]); f.price = p.p; f.old = eur(Math.ceil(num(p.p) * 1.2 / 10) * 10 - 0.01); var a = $('#f_price'), b = $('#f_old'); if (a) a.value = f.price; if (b) b.value = f.old; }
      sel(); list(); schedule();
    }
    $('#pkQ', w).addEventListener('input', function (e) { state.q = e.target.value; list(); });
    $('#pkChips', w).addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.pf = b.dataset.f; $$('#pkChips button', w).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); list(); });
    $('#pkUp', w).addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        var im = new Image(); im.onload = function () {
          var s = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          var url = c.toDataURL('image/jpeg', 0.9), id = 'up' + (state.custom.length + 1);
          state.custom.unshift({ id: id, t: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'La tua foto', pl: 'retro', c: 'n', p: '0,00', img: url, photo: true, k: 'g' });
          IM[url] = im; choose(id); toast('Foto aggiunta: modifica titolo e prezzo qui sopra.');
        }; im.src = rd.result;
      };
      rd.readAsDataURL(file); e.target.value = '';
    });
    sel(); list();
  }
  var toastT;
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600); }

  /* ---------- download ---------- */
  function fname(i, n) { return 'gamestore-' + state.tpl + '-' + state.fmt + (n > 1 ? '-' + (i + 1) : '') + '.png'; }
  function blobFor(i) {
    var c = document.createElement('canvas'), S = state;
    return renderTo(c, S, i).then(function () { return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('toBlob')); }, 'image/png'); }); });
  }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  function dlOne(i) { var n = count(); i = typeof i === 'number' ? i : state.slide; blobFor(i).then(function (b) { save(b, fname(i, n)); toast('PNG scaricato.'); }).catch(function () { toast('Non riesco a creare il PNG. Riprova.'); }); }
  function dlAll() {
    var n = count();
    if (!window.JSZip) { toast('Lo zip non è disponibile offline: scarica le slide una per una.'); return; }
    var z = new JSZip(), seq = Promise.resolve();
    for (var i = 0; i < n; i++) (function (i) { seq = seq.then(function () { return blobFor(i).then(function (b) { z.file(fname(i, n), b); }); }); })(i);
    seq.then(function () { return z.generateAsync({ type: 'blob' }); }).then(function (b) { save(b, 'gamestore-' + state.tpl + '-' + state.fmt + '.zip'); toast('Zip scaricato.'); }).catch(function () { toast('Non riesco a creare lo zip.'); });
  }
  function dockDl() { count() > 1 ? dlAll() : dlOne(); }


  /* ---------- condividi su Instagram (Web Share con file) ---------- */
  var canShareFiles = (function () { try { return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' })] })); } catch (e) { return false; } })();
  var prep = { key: '', files: null }, prepT;
  function stateKey() { return JSON.stringify([state.tpl, state.fmt, state.bg, state.style, state.acc, state.f[state.tpl], state.over, state.custom.length]); }
  function prepare() {
    if (!canShareFiles || blockers().length) return Promise.resolve(null);
    var key = stateKey(), n = count(), list = [], seq = Promise.resolve();
    if (prep.key === key && prep.files) return Promise.resolve(prep.files);
    for (var i = 0; i < n; i++) (function (i) { seq = seq.then(function () { return blobFor(i).then(function (b) { list.push(new File([b], fname(i, n), { type: 'image/png' })); }); }); })(i);
    return seq.then(function () { if (stateKey() === key) { prep = { key: key, files: list }; } return list; });
  }
  function schedulePrep() { if (!canShareFiles) return; prep.files = null; clearTimeout(prepT); prepT = setTimeout(prepare, 500); }
  function shareIG() {
    var go = function (files) {
      return navigator.share({ files: files }).then(function () { toast('Fatto. Su Instagram scegli Storia o Post.'); }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        if (e && e.name === 'NotAllowedError') { toast('Immagine pronta: tocca di nuovo Condividi.'); return; }
        toast('Condivisione non riuscita: usa Scarica.');
      });
    };
    if (prep.files && prep.key === stateKey()) return go(prep.files);
    toast('Preparo l\u2019immagine…');
    prepare().then(function (f) { if (f) go(f); });
  }

  /* ---------- API per i test ---------- */
  window.__render = function (tpl, fmt, idx, opt) {
    opt = opt || {};
    var S = { tpl: tpl, fmt: fmt, f: defaults(), over: {}, custom: [], bg: opt.bg || C.k, style: opt.style || 'stripes', acc: opt.acc || null }, c = document.createElement('canvas');
    if (opt.f) for (var k in opt.f) S.f[tpl][k] = opt.f[k];
    return renderTo(c, S, idx || 0).then(function () { return c.toDataURL('image/png'); });
  };
  window.__count = function (tpl) { return TPL[tpl].count(defaults()[tpl]); };
  window.__templates = ORDER;
  window.__products = P.map(function (p) { return p.id; });

  /* ---------- avvio ---------- */
  function sheet(open) { $('#prevPanel').classList.toggle('open', open); document.documentElement.classList.toggle('lock', open); if (open) refresh(); }
  function init() {
    cv = $('#cv'); cvMini = $('#cvMini'); buildTemplates(); buildFormat(); buildStyle(); buildForm();
    $('#dl1').addEventListener('click', function () { dlOne(); }); $('#dlAll').addEventListener('click', dlAll); $('#dockDl').addEventListener('click', function () { canShareFiles ? shareIG() : dockDl(); }); if ($('#share')) $('#share').addEventListener('click', shareIG);
    $('#perSlide').addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) dlOne(+b.dataset.i); });
    $('#prev').addEventListener('click', function () { state.slide = Math.max(0, state.slide - 1); refresh(); });
    $('#next').addEventListener('click', function () { state.slide = Math.min(count() - 1, state.slide + 1); refresh(); });
    $('#strip').addEventListener('click', function (e) { var b = e.target.closest('.th'); if (b) { state.slide = +b.dataset.i; refresh(); } });
    $('#openSheet').addEventListener('click', function () { sheet(true); }); $('#closeSheet').addEventListener('click', function () { sheet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sheet(false); });
    refresh();
    window.__ready = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
