/* Gamestore Bolzano - bozza grafica di AK Design. JS condiviso dalle due versioni (vanilla, nessuna libreria). */
(function () {
  'use strict';
  var T = window.GS_THEME || {};
  var DATA = window.GS_PRODUCTS || [];
  var SHOP = 'https://www.gamestorebolzano.it/shop/';
  var WP = 'https://www.gamestorebolzano.it/wp-content/uploads/';
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  var num = function (p) { return parseFloat(String(p).replace('.', '').replace(',', '.')); };
  var money = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
  var byId = function (id) { return DATA.filter(function (p) { return p.id === id; })[0]; };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  var PL = { ps5: 'PS5', sw2: 'Switch 2', sw: 'Switch', xbox: 'Xbox', retro: 'Retro', coll: 'Collezionismo' };
  var KIND = { g: 'Giochi', co: 'Console', ac: 'Accessori', tcg: 'Carte', fig: 'Action figure', funko: 'Funko', gad: 'Gadget' };
  var badge = function (p) { return p.pl === 'coll' ? KIND[p.k] : PL[p.pl]; };

  var I = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>',
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.6l2.2 11h10.6l2-8H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.500v13l11-6.500z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7.500 9-4.500 9 4.500v9L12 21l-9-4.500zM3 7.500l9 4.500 9-4.500M12 12v9"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7M6 18.500a1.500 1.500 0 1 0 0-.1M17 18.500a1.500 1.500 0 1 0 0-.1"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2M9.5 13h5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5"/></svg>',
    coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.6-.9-1.700-1.200-2.800-1.200-1.500 0-2.700.7-2.700 2 0 3 5.700 1.300 5.700 4.200 0 1.300-1.300 2-2.900 2-1.200 0-2.400-.4-3-1.400M12 6.500V8m0 8v1.500"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800-5.200-2.800-5.200 2.800 1-5.800L3.500 9.700l5.900-.8z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'
  };

  /* ---------- navigazione ---------- */
  var CAT = 'catalogo.html';
  var NAV = [
    { l: 'PlayStation', h: CAT + '?pl=ps5', art: WP + '2024/01/ps5-Pulsante.png', cols: [
      ['Giochi PS5', [['Nuovi', CAT + '?pl=ps5&k=g&c=n'], ['Usati garantiti', CAT + '?pl=ps5&k=g&c=u']]],
      ['Hardware', [['Console PS5', CAT + '?pl=ps5&k=co'], ['Accessori PS5', CAT + '?pl=ps5&k=ac']]],
      ['Altre PlayStation', [['PS4 usati', SHOP + '#!/PlayStation/c/82843863'], ['PS3', SHOP + '#!/PlayStation/c/82843863']]] ] },
    { l: 'Nintendo', h: CAT + '?pl=sw2', art: WP + '2025/05/SWITCH-2.png', cols: [
      ['Switch 2', [['Giochi nuovi', CAT + '?pl=sw2&k=g&c=n'], ['Giochi usati', CAT + '?pl=sw2&c=u'], ['Console', CAT + '?pl=sw2&k=co']]],
      ['Switch', [['Giochi nuovi', CAT + '?pl=sw&c=n'], ['Giochi usati', CAT + '?pl=sw&c=u']]],
      ['Più Nintendo', [['3DS, Wii e Wii U', SHOP + '#!/Nintendo/c/82875373']]] ] },
    { l: 'Xbox', h: CAT + '?pl=xbox', art: WP + '2024/01/xseries-Pulsante.png', cols: [
      ['Xbox Series X', [['Giochi nuovi', CAT + '?pl=xbox&c=n'], ['Giochi usati', CAT + '?pl=xbox&c=u']]],
      ['Altre Xbox', [['Xbox One e 360', SHOP + '#!/Xbox/c/82882107'], ['Console e accessori', SHOP + '#!/Xbox/c/82882107']]] ] },
    { l: 'Collezionismo', h: CAT + '?pl=coll', art: WP + '2026/10/FUNKO-categoria-home-page.png', cols: [
      ['Da collezione', [['Funko', CAT + '?k=funko'], ['Action figures', CAT + '?k=fig'], ['Gadget', CAT + '?k=gad']]],
      ['Carte e mattoncini', [['Trading Card Games', CAT + '?k=tcg'], ['LEGO', SHOP + '#!/Lego/c/120123527']]] ] },
    { l: 'Usato', h: CAT + '?c=u', art: WP + '2024/01/Usato.webp', cols: [
      ['Usato garantito', [['Tutto l’usato', CAT + '?c=u'], ['PS5', CAT + '?pl=ps5&c=u'], ['Switch e Switch 2', CAT + '?pl=sw2&c=u'], ['Xbox', CAT + '?pl=xbox&c=u']]],
      ['Porta i tuoi giochi', [['Come funziona la permuta', 'index.html#usato']]] ] },
    { l: 'Prenotazioni', h: CAT + '?pre=1', cols: null }
  ];

  var TICKER = ['Spedizione gratuita da 49,99 € (console escluse)', 'Tessera punti gratuita: sconti sull’usato e sul nuovo', 'Usato garantito e supervalutazione dei tuoi giochi', 'Oltre 5000 prodotti a magazzino', 'Ritiro in negozio in Viale Duca d’Aosta 29'];

  function logo() { return '<a class="logo" href="index.html" aria-label="Gamestore Bolzano, home">' + T.logo + '</a>'; }

  function headerHTML() {
    var tick = TICKER.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    var nav = NAV.map(function (n) {
      var mega = '';
      if (n.cols) {
        mega = '<div class="mega"><div class="mega-in">' + n.cols.map(function (c) {
          return '<div class="mega-col"><p class="mega-h">' + c[0] + '</p>' + c[1].map(function (a) {
            return '<a href="' + a[1] + '"' + (a[1].indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + a[0] + '</a>';
          }).join('') + '</div>';
        }).join('') + (n.art ? '<a class="mega-art" href="' + n.h + '" tabindex="-1"><img src="' + n.art + '" alt="" loading="lazy" referrerpolicy="no-referrer"><span>Vedi tutto</span></a>' : '') + '</div></div>';
      }
      return '<li class="nav-i' + (n.cols ? ' has-mega' : '') + '"><a href="' + n.h + '"' + (n.l === 'Prenotazioni' ? ' class="nav-pre"' : '') + '>' + n.l + (n.cols ? I.chev : '') + '</a>' + mega + '</li>';
    }).join('');
    return '' +
      '<div class="ticker" aria-label="Promozioni"><div class="ticker-t">' + tick + tick + '</div></div>' +
      '<header class="hdr" id="hdr"><div class="hdr-in">' +
      '<button class="ibtn burger" id="burger" aria-label="Apri il menu" aria-expanded="false">' + I.menu + '</button>' + logo() +
      '<form class="search" action="' + CAT + '" role="search" autocomplete="off"><span class="search-ic">' + I.search + '</span><input type="search" name="q" id="q" placeholder="Cerca tra oltre 5000 prodotti" aria-label="Cerca nel catalogo"><button class="search-go" type="submit">Cerca</button><div class="sugg" id="sugg" hidden></div></form>' +
      '<button class="ibtn cart" id="cartBtn" aria-label="Apri il carrello">' + I.cart + '<span class="cart-n" id="cartN">0</span></button>' +
      '</div><nav class="nav" aria-label="Categorie principali"><ul>' + nav + '</ul></nav></header>' +
      '<div class="drawer" id="drawer" aria-hidden="true"><div class="drawer-bg" data-close></div><aside class="drawer-p" role="dialog" aria-label="Menu"><div class="drawer-top">' + logo() + '<button class="ibtn" data-close aria-label="Chiudi il menu">' + I.close + '</button></div>' +
      '<div class="drawer-list">' + NAV.map(function (n) {
        if (!n.cols) return '<a class="d-top" href="' + n.h + '">' + n.l + '</a>';
        return '<details><summary>' + n.l + I.chev + '</summary><div>' + '<a href="' + n.h + '">Tutto ' + n.l + '</a>' + n.cols.map(function (c) { return c[1].map(function (a) { return '<a href="' + a[1] + '">' + c[0] + ': ' + a[0] + '</a>'; }).join(''); }).join('') + '</div></details>';
      }).join('') + '</div><div class="drawer-ft"><a href="tel:+390471266460">' + I.phone + ' 0471 266460</a><a href="index.html#negozio">' + I.pin + ' Viale Duca d’Aosta 29, Bolzano</a></div></aside></div>' +
      '<div class="cartp" id="cartP" aria-hidden="true"><div class="drawer-bg" data-closecart></div><aside class="cartp-p" role="dialog" aria-label="Carrello"><div class="drawer-top"><strong class="cartp-h">Il tuo carrello</strong><button class="ibtn" data-closecart aria-label="Chiudi il carrello">' + I.close + '</button></div><div class="cartp-list" id="cartList"></div><div class="cartp-ft" id="cartFt"></div></aside></div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
      '<a class="draft-badge" href="../index.html" title="Torna alla scelta delle proposte">Bozza di AK Design — proposta grafica</a>';
  }

  function footerHTML() {
    return '<footer class="ftr"><div class="wrap ftr-grid">' +
      '<div class="ftr-brand">' + logo() + '<p>Console, videogiochi nuovi e usati, collezionismo e accessori. Un negozio vero, a Bolzano, con oltre 5000 prodotti a magazzino.</p>' +
      '<p class="ftr-contact"><a href="tel:+390471266460">0471 266460</a><br>Viale Duca d’Aosta 29, Bolzano<br>Orari: da inserire</p></div>' +
      '<div><h4>Categorie</h4><ul>' +
      [['PlayStation', CAT + '?pl=ps5'], ['Nintendo', CAT + '?pl=sw2'], ['Xbox', CAT + '?pl=xbox'], ['Accessori', CAT + '?k=ac'], ['Funko', CAT + '?k=funko'], ['Action Figures', CAT + '?k=fig'], ['Gadgets', CAT + '?k=gad'], ['Trading Card Games', CAT + '?k=tcg']].map(function (a) { return '<li><a href="' + a[1] + '">' + a[0] + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4>Informazioni</h4><ul><li><a href="index.html#usato">Usato e permuta</a></li><li><a href="index.html#tessera">Tessera punti</a></li><li><a href="prodotto.html#consegna">Spedizioni e ritiro</a></li><li><a href="' + SHOP + '" target="_blank" rel="noopener">Resi</a></li><li><a href="' + SHOP + '" target="_blank" rel="noopener">Privacy</a></li><li><a href="index.html#negozio">Dove siamo</a></li></ul></div>' +
      '<div><h4>Pagamenti sicuri</h4><div class="chips"><span>Carta</span><span>PayPal</span><span>Bonifico</span><span>Contanti in negozio</span></div><p class="ftr-note">Spedizione gratuita da 49,99 € (console escluse, contributo 14,99 €).</p></div>' +
      '</div><div class="wrap ftr-bot"><span>© 2026 Gamestore Bolzano. Tutti i marchi appartengono ai rispettivi proprietari.</span><span>Proposta grafica di AK Design, non online. · <a href="studio.html" class="ftr-staff">Area negozio</a></span></div></footer>';
  }

  /* ---------- card prodotto ---------- */
  function card(p, o) {
    o = o || {};
    var href = 'prodotto.html?id=' + p.id, t = esc(p.t);
    return '<article class="card" data-pl="' + p.pl + '">' +
      '<a class="card-img" href="' + href + '" tabindex="-1" aria-hidden="true"><img src="' + p.img + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="400" height="400">' +
      '<span class="tag ' + (p.c === 'u' ? 'tag-u' : 'tag-n') + '">' + (p.c === 'u' ? 'Usato' : 'Nuovo') + '</span>' +
      (p.pre ? '<span class="tag tag-pre">Prenota</span>' : '') + '</a>' +
      '<div class="card-b"><span class="plat" data-pl="' + p.pl + '">' + badge(p) + '</span>' +
      '<h3 class="card-t"><a href="' + href + '">' + t + '</a></h3>' +
      '<div class="card-f"><span class="price">' + p.p + ' €</span><button class="add" type="button" data-add="' + p.id + '" aria-label="Aggiungi al carrello: ' + t + '">' + I.plus + '<span>Aggiungi</span></button></div></div></article>';
  }

  var RAILS = {
    novita: ['841617589', '870656798', '875536920', '870659278', '864877372', '866844844', '841613927', '866844119', '819249412', '841617596', '862667444', '851861767'],
    pre: ['844014557', '844008361', '873379472'],
    usato: ['867529692', '853157833', '826870207', '840159392', '831020846', '816176499', '846313585', '864277523', '819071375', '814913716', '805375003', '580327648'],
    coll: ['877029401', '874765581', '877027899', '874993040', '877052616', '874820140', '877029098', '874968670', '877314868', '874875355']
  };

  function renderRails() {
    $$('[data-rail]').forEach(function (el) {
      var key = el.getAttribute('data-rail'), ids = RAILS[key] || [];
      var items = ids.map(byId).filter(Boolean);
      if (key === 'related') {
        var cur = byId(new URLSearchParams(location.search).get('id') || '836581376') || DATA[0];
        items = DATA.filter(function (p) { return p.id !== cur.id && (p.pl === cur.pl) && p.k === cur.k; }).slice(0, 8);
        if (items.length < 8) items = items.concat(DATA.filter(function (p) { return p.id !== cur.id && items.indexOf(p) < 0 && p.k === 'g'; }).slice(0, 8 - items.length));
      }
      var track = $('.rail-track', el) || el;
      track.innerHTML = items.map(function (p) { return card(p); }).join('') +
        (el.hasAttribute('data-more') ? '<a class="card more" href="' + el.getAttribute('data-more') + '"><span>' + (el.getAttribute('data-more-label') || 'Vedi tutto') + '</span>' + I.right + '</a>' : '');
      if (!$('.rail-nav', el)) {
        var nav = document.createElement('div'); nav.className = 'rail-nav';
        nav.innerHTML = '<button type="button" data-dir="-1" aria-label="Scorri a sinistra">' + I.left + '</button><button type="button" data-dir="1" aria-label="Scorri a destra">' + I.right + '</button>';
        el.appendChild(nav);
        var upd = function () {
          var b = nav.children; b[0].disabled = track.scrollLeft < 8; b[1].disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 8;
        };
        nav.addEventListener('click', function (e) {
          var b = e.target.closest('button'); if (!b) return;
          track.scrollBy({ left: b.getAttribute('data-dir') * track.clientWidth * 0.85, behavior: REDUCED ? 'auto' : 'smooth' });
        });
        track.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); setTimeout(upd, 100); upd();
      }
    });
  }

  /* ---------- carrello ---------- */
  var cart = store.get('gs-cart') || {};
  function cartCount() { return Object.keys(cart).reduce(function (a, k) { return a + cart[k]; }, 0); }
  function toast(msg) {
    var t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function renderCart() {
    var n = $('#cartN'); if (n) { n.textContent = cartCount(); n.classList.toggle('on', cartCount() > 0); }
    var list = $('#cartList'), ft = $('#cartFt'); if (!list) return;
    var ids = Object.keys(cart), total = 0;
    if (!ids.length) { list.innerHTML = '<p class="cartp-empty">Il carrello è vuoto. Aggiungi un gioco dalle schede prodotto.</p>'; ft.innerHTML = ''; return; }
    list.innerHTML = ids.map(function (id) {
      var p = byId(id); if (!p) return ''; total += num(p.p) * cart[id];
      return '<div class="ci"><img src="' + p.img + '" alt="" referrerpolicy="no-referrer"><div><b>' + esc(p.t) + '</b><span>' + badge(p) + ' · ' + (p.c === 'u' ? 'Usato' : 'Nuovo') + ' · ' + cart[id] + ' × ' + p.p + ' €</span></div><button class="ibtn ci-x" data-rm="' + id + '" aria-label="Rimuovi">' + I.close + '</button></div>';
    }).join('');
    ft.innerHTML = '<div class="cartp-tot"><span>Totale</span><b>' + money(total) + '</b></div><a class="btn btn-main" href="' + SHOP + '#!/~/cart" target="_blank" rel="noopener">Vai alla cassa</a><small>Nella versione online la cassa resta quella di Ecwid.</small>';
  }
  function addToCart(id, q) {
    cart[id] = (cart[id] || 0) + (q || 1); store.set('gs-cart', cart); renderCart();
    var p = byId(id); toast('Aggiunto: ' + (p ? p.t : 'prodotto'));
    var c = $('#cartBtn'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }

  /* ---------- hero carousel ---------- */
  function hero() {
    $$('[data-hero]').forEach(function (h) {
      var tr = $('.hero-track', h), sl = $$('.hero-slide', h), dots = $('.hero-dots', h), i = 0, timer;
      dots.innerHTML = sl.map(function (_, k) { return '<button type="button" aria-label="Vai alla slide ' + (k + 1) + '"></button>'; }).join('');
      var go = function (k) { i = (k + sl.length) % sl.length; tr.scrollTo({ left: sl[i].offsetLeft - tr.offsetLeft, behavior: REDUCED ? 'auto' : 'smooth' }); };
      var mark = function () { var k = Math.round(tr.scrollLeft / tr.clientWidth); i = k; $$('button', dots).forEach(function (b, n) { b.classList.toggle('on', n === k); b.setAttribute('aria-current', n === k); }); };
      dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { go($$('button', dots).indexOf(b)); restart(); } });
      var pv = $('.hero-prev', h), nx = $('.hero-next', h);
      if (pv) pv.addEventListener('click', function () { go(i - 1); restart(); });
      if (nx) nx.addEventListener('click', function () { go(i + 1); restart(); });
      tr.addEventListener('scroll', function () { clearTimeout(mark.t); mark.t = setTimeout(mark, 60); mark(); }, { passive: true });
      var restart = function () { clearInterval(timer); if (!REDUCED) timer = setInterval(function () { if (!document.hidden && !h.matches(':hover') && !h.contains(document.activeElement)) go(i + 1); }, 6500); };
      tr.addEventListener('pointerdown', function () { clearInterval(timer); }); tr.addEventListener('pointerup', restart);
      mark(); restart();
    });
  }

  /* ---------- varie ---------- */
  function ui() {
    var hdr = $('#hdr');
    var onS = function () { document.documentElement.classList.toggle('stuck', window.scrollY > 60); };
    window.addEventListener('scroll', onS, { passive: true }); onS();
    var dr = $('#drawer');
    var setD = function (on) { dr.classList.toggle('open', on); dr.setAttribute('aria-hidden', !on); $('#burger').setAttribute('aria-expanded', on); document.documentElement.classList.toggle('lock', on); };
    $('#burger').addEventListener('click', function () { setD(true); });
    dr.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target.closest('a')) setD(false); });
    var cp = $('#cartP');
    var setC = function (on) { cp.classList.toggle('open', on); cp.setAttribute('aria-hidden', !on); document.documentElement.classList.toggle('lock', on); };
    $('#cartBtn').addEventListener('click', function () { setC(true); });
    cp.addEventListener('click', function (e) {
      if (e.target.closest('[data-closecart]')) setC(false);
      var r = e.target.closest('[data-rm]'); if (r) { delete cart[r.getAttribute('data-rm')]; store.set('gs-cart', cart); renderCart(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setD(false); setC(false); closeF && closeF(); } });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-add]'); if (!a) return;
      addToCart(a.getAttribute('data-add'), a.hasAttribute('data-qty') ? parseInt($(a.getAttribute('data-qty')).value, 10) || 1 : 1);
      a.classList.add('done'); setTimeout(function () { a.classList.remove('done'); }, 900);
    });
    /* suggerimenti di ricerca */
    var q = $('#q'), sg = $('#sugg');
    q.addEventListener('input', function () {
      var v = q.value.trim().toLowerCase(); if (v.length < 2) { sg.hidden = true; return; }
      var m = DATA.filter(function (p) { return p.t.toLowerCase().indexOf(v) > -1; }).slice(0, 6);
      sg.innerHTML = m.length ? m.map(function (p) { return '<a href="prodotto.html?id=' + p.id + '"><img src="' + p.img + '" alt="" referrerpolicy="no-referrer"><span>' + esc(p.t) + '<em>' + badge(p) + ' · ' + (p.c === 'u' ? 'Usato' : 'Nuovo') + '</em></span><b>' + p.p + ' €</b></a>'; }).join('') + '<a class="sugg-all" href="' + CAT + '?q=' + encodeURIComponent(v) + '">Tutti i risultati per “' + esc(v) + '”</a>' : '<p>Nessun risultato in questa bozza: nel negozio vero la ricerca copre tutti i prodotti.</p>';
      sg.hidden = false;
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search')) sg.hidden = true; });
    /* rivelazione allo scroll */
    var rv = $$('.rv');
    if ('IntersectionObserver' in window && !REDUCED && !/noanim/.test(location.search)) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(function (el) { io.observe(el); });
    } else rv.forEach(function (el) { el.classList.add('in'); });
    /* tilt 3D */
    $$('[data-tilt]').forEach(function (el) {
      if (REDUCED) return;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ry', (x * 22).toFixed(1) + 'deg'); el.style.setProperty('--rx', (-y * 18).toFixed(1) + 'deg');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
    $$('[data-flip]').forEach(function (b) { b.addEventListener('click', function () { $(b.getAttribute('data-flip')).classList.toggle('flipped'); }); });
  }
  var closeF = null;

  /* ---------- pagina catalogo ---------- */
  function catalogo() {
    var root = $('#catalogo'); if (!root) return;
    var sp = new URLSearchParams(location.search);
    var S = { pl: sp.get('pl') ? [sp.get('pl')] : [], k: sp.get('k') ? [sp.get('k')] : [], c: sp.get('c') ? [sp.get('c')] : [], price: '', av: sp.get('pre') ? ['pre'] : [], q: (sp.get('q') || '').toLowerCase(), sort: 'rilevanza', page: 1 };
    var PER = window.innerWidth < 700 ? 8 : 15;
    var PRICES = [['', 'Qualsiasi prezzo'], ['0-20', 'Fino a 20 €'], ['20-50', '20 – 50 €'], ['50-80', '50 – 80 €'], ['80-9999', 'Oltre 80 €']];
    var GROUPS = [
      ['pl', 'Piattaforma', [['ps5', 'PlayStation 5'], ['sw2', 'Switch 2'], ['sw', 'Switch'], ['xbox', 'Xbox'], ['retro', 'Retro'], ['coll', 'Collezionismo']]],
      ['k', 'Tipo', [['g', 'Giochi'], ['co', 'Console'], ['ac', 'Accessori'], ['funko', 'Funko'], ['fig', 'Action figures'], ['tcg', 'Carte'], ['gad', 'Gadget']]],
      ['c', 'Condizione', [['n', 'Nuovo'], ['u', 'Usato garantito']]],
      ['price', 'Prezzo', PRICES],
      ['av', 'Disponibilità', [['neg', 'Disponibile in negozio'], ['pre', 'Prenotazione']]]
    ];
    function match(p) {
      if (S.pl.length && S.pl.indexOf(p.pl) < 0) return false;
      if (S.k.length && S.k.indexOf(p.k) < 0) return false;
      if (S.c.length && S.c.indexOf(p.c) < 0) return false;
      if (S.q && p.t.toLowerCase().indexOf(S.q) < 0) return false;
      if (S.price) { var r = S.price.split('-'), v = num(p.p); if (v < +r[0] || v >= +r[1]) return false; }
      if (S.av.length && S.av.indexOf(p.pre ? 'pre' : 'neg') < 0) return false;
      return true;
    }
    function sidebar() {
      var h = GROUPS.map(function (g) {
        var cnt = function (v) { var s2 = JSON.parse(JSON.stringify(S)); if (g[0] === 'price') s2.price = v; else s2[g[0]] = [v]; var keep = S; S = s2; var n = DATA.filter(match).length; S = keep; return n; };
        return '<fieldset class="fg"><legend>' + g[1] + '</legend><div class="fg-list">' + g[2].map(function (o) {
          var on = g[0] === 'price' ? S.price === o[0] : S[g[0]].indexOf(o[0]) > -1;
          return '<label class="fopt' + (on ? ' on' : '') + '"><input type="' + (g[0] === 'price' ? 'radio' : 'checkbox') + '" name="' + g[0] + '" value="' + o[0] + '"' + (on ? ' checked' : '') + '><span>' + o[1] + '</span>' + (o[0] === '' ? '' : '<em>' + cnt(o[0]) + '</em>') + '</label>';
        }).join('') + '</div></fieldset>';
      }).join('');
      $('#fbody').innerHTML = h;
    }
    function titleOf() {
      if (S.q) return 'Risultati per “' + esc(S.q) + '”';
      if (S.av[0] === 'pre') return 'Prenotazioni';
      if (S.pl.length === 1 && !S.k.length) return { ps5: 'PlayStation', sw2: 'Nintendo Switch 2', sw: 'Nintendo Switch', xbox: 'Xbox', retro: 'Retro e accessori', coll: 'Collezionismo' }[S.pl[0]] + (S.c[0] === 'u' ? ' usato' : '');
      if (S.k.length === 1) return { g: 'Giochi', co: 'Console', ac: 'Accessori', funko: 'Funko', fig: 'Action figures', tcg: 'Trading Card Games', gad: 'Gadget' }[S.k[0]] + (S.pl.length === 1 ? ' ' + PL[S.pl[0]] : '') + (S.c[0] === 'u' ? ' usati' : '');
      if (S.c[0] === 'u') return 'Usato garantito';
      return 'Tutto il catalogo';
    }
    function render() {
      var list = DATA.filter(match);
      var s = S.sort;
      if (s === 'prezzo-asc') list.sort(function (a, b) { return num(a.p) - num(b.p); });
      if (s === 'prezzo-desc') list.sort(function (a, b) { return num(b.p) - num(a.p); });
      if (s === 'nome') list.sort(function (a, b) { return a.t.localeCompare(b.t); });
      var pages = Math.max(1, Math.ceil(list.length / PER)); if (S.page > pages) S.page = pages;
      var slice = list.slice((S.page - 1) * PER, S.page * PER);
      $('#ctitle').innerHTML = titleOf();
      $('#bcnow').innerHTML = titleOf();
      $('#ccount').textContent = list.length + (list.length === 1 ? ' prodotto' : ' prodotti');
      $('#grid').innerHTML = slice.length ? slice.map(function (p) { return card(p); }).join('') : '<div class="empty"><b>Nessun prodotto con questi filtri.</b><p>Togli un filtro oppure cerca un altro titolo. Nel negozio vero il catalogo conta oltre 5000 prodotti.</p><button class="btn btn-main" type="button" id="reset">Azzera i filtri</button></div>';
      var chips = [];
      GROUPS.forEach(function (g) {
        var vals = g[0] === 'price' ? (S.price ? [S.price] : []) : S[g[0]];
        vals.forEach(function (v) { var lab = (g[2].filter(function (o) { return o[0] === v; })[0] || [0, v])[1]; chips.push('<button type="button" class="achip" data-g="' + g[0] + '" data-v="' + v + '">' + lab + I.close + '</button>'); });
      });
      if (S.q) chips.push('<button type="button" class="achip" data-g="q" data-v="">“' + esc(S.q) + '”' + I.close + '</button>');
      $('#active').innerHTML = chips.join('') + (chips.length > 1 ? '<button type="button" class="achip clear" id="clear">Azzera tutto</button>' : '');
      var nF = chips.length; $('#fcount').textContent = nF ? '(' + nF + ')' : '';
      var pg = '';
      if (pages > 1) {
        pg = '<button type="button" data-p="' + (S.page - 1) + '"' + (S.page === 1 ? ' disabled' : '') + ' aria-label="Pagina precedente">' + I.left + '</button>';
        for (var i = 1; i <= pages; i++) pg += '<button type="button" data-p="' + i + '"' + (i === S.page ? ' class="on" aria-current="page"' : '') + '>' + i + '</button>';
        pg += '<button type="button" data-p="' + (S.page + 1) + '"' + (S.page === pages ? ' disabled' : '') + ' aria-label="Pagina successiva">' + I.right + '</button>';
      }
      $('#pager').innerHTML = pg; $('#shown').textContent = list.length ? 'Mostro ' + ((S.page - 1) * PER + 1) + '–' + Math.min(S.page * PER, list.length) + ' di ' + list.length : '';
      sidebar();
    }
    $('#fbody').addEventListener('change', function (e) {
      var i = e.target, g = i.name;
      if (g === 'price') S.price = i.value; else { var a = S[g], ix = a.indexOf(i.value); if (i.checked && ix < 0) a.push(i.value); if (!i.checked && ix > -1) a.splice(ix, 1); }
      S.page = 1; render();
    });
    root.addEventListener('click', function (e) {
      var ch = e.target.closest('.achip[data-g]'), pgb = e.target.closest('[data-p]');
      if (ch) { var g = ch.getAttribute('data-g'), v = ch.getAttribute('data-v'); if (g === 'price') S.price = ''; else if (g === 'q') S.q = ''; else S[g] = S[g].filter(function (x) { return x !== v; }); S.page = 1; render(); }
      if (e.target.closest('#clear') || e.target.closest('#reset')) { S.pl = []; S.k = []; S.c = []; S.price = ''; S.av = []; S.q = ''; S.page = 1; render(); }
      if (pgb && !pgb.disabled) { S.page = +pgb.getAttribute('data-p'); render(); window.scrollTo({ top: $('#ctop').offsetTop - 140, behavior: REDUCED ? 'auto' : 'smooth' }); }
    });
    $('#sort').addEventListener('change', function (e) { S.sort = e.target.value; S.page = 1; render(); });
    var fp = $('#fpanel'); closeF = function () { fp.classList.remove('open'); document.documentElement.classList.remove('lock'); };
    $('#fopen').addEventListener('click', function () { fp.classList.add('open'); document.documentElement.classList.add('lock'); });
    $$('[data-fclose]').forEach(function (b) { b.addEventListener('click', closeF); });
    render();
  }

  /* ---------- pagina prodotto ---------- */
  function prodotto() {
    var root = $('#prodotto'); if (!root) return;
    var id = new URLSearchParams(location.search).get('id') || '836581376';
    var p = byId(id) || byId('836581376');
    var twin = DATA.filter(function (x) { return x.id !== p.id && x.t === p.t && x.pl === p.pl && x.c !== p.c; })[0];
    var N = p.c === 'n' ? p : twin, U = p.c === 'u' ? p : twin;
    var cur = p, qty = 1;
    var consoleP = p.k === 'co';
    function paint() {
      var imgs = cur.g || [cur.img];
      $('#pt').textContent = cur.t; document.title = cur.t + ' — Gamestore Bolzano (bozza)';
      $('#bcp').textContent = cur.t;
      var cat = { g: 'Giochi', co: 'Console', ac: 'Accessori', funko: 'Funko', fig: 'Action figures', tcg: 'Trading Card Games', gad: 'Gadget' }[cur.k];
      $('#bcc').textContent = cur.pl === 'coll' ? cat : PL[cur.pl]; $('#bcc').href = CAT + '?pl=' + cur.pl;
      $('#plat').textContent = badge(cur); $('#plat').setAttribute('data-pl', cur.pl);
      $('#price').textContent = cur.p + ' €';
      $('#gmain').src = imgs[0]; $('#gmain').alt = cur.t;
      $('#gthumbs').innerHTML = imgs.length > 1 ? imgs.map(function (u, k) { return '<button type="button" class="' + (k ? '' : 'on') + '" data-u="' + u + '" aria-label="Immagine ' + (k + 1) + '"><img src="' + u + '" alt="" referrerpolicy="no-referrer"></button>'; }).join('') : '';
      $('#gtag').textContent = cur.c === 'u' ? 'Usato garantito' : 'Nuovo'; $('#gtag').className = 'tag ' + (cur.c === 'u' ? 'tag-u' : 'tag-n');
      $('#condN').classList.toggle('on', cur.c === 'n'); $('#condU').classList.toggle('on', cur.c === 'u');
      $('#condN').setAttribute('aria-pressed', cur.c === 'n'); $('#condU').setAttribute('aria-pressed', cur.c === 'u');
      $('#availt').textContent = cur.pre ? 'Prenotabile in negozio' : 'Disponibile in negozio';
      $('#avail').classList.toggle('pre', !!cur.pre);
      var v = num(cur.p) * qty;
      $('#ship').innerHTML = consoleP ? 'Spedizione con contributo di <b>14,99 €</b> (le console sono escluse dalla spedizione gratuita).' : (v >= 49.99 ? 'Questo ordine supera 49,99 €: <b>spedizione gratuita</b>.' : 'Ti mancano <b>' + money(49.99 - v) + '</b> per la spedizione gratuita (da 49,99 €).');
      $('#shopl').href = SHOP + cur.h;
      $('#spec').innerHTML = [['Piattaforma', cur.pl === 'coll' ? cat : PL[cur.pl]], ['Categoria', cat], ['Condizione', cur.c === 'u' ? 'Usato garantito' : 'Nuovo'], ['Disponibilità', cur.pre ? 'Prenotazione in negozio' : 'In negozio a Bolzano'], ['Codice', cur.id]].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
      $('#addb').setAttribute('data-add', cur.id);
      $('#addp').textContent = money(v);
    }
    var cn = $('#condN'), cu = $('#condU');
    if (!N) { cn.disabled = true; cn.querySelector('em').textContent = 'non disponibile'; } else cn.querySelector('em').textContent = N.p + ' €';
    if (!U) { cu.disabled = true; cu.querySelector('em').textContent = 'non disponibile'; } else cu.querySelector('em').textContent = U.p + ' €';
    if (consoleP || p.k !== 'g') { $('#cond').hidden = true; }
    cn.addEventListener('click', function () { if (N) { cur = N; paint(); } });
    cu.addEventListener('click', function () { if (U) { cur = U; paint(); } });
    $('#gthumbs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $('#gmain').src = b.getAttribute('data-u'); $$('button', $('#gthumbs')).forEach(function (x) { x.classList.toggle('on', x === b); }); });
    $('#qminus').addEventListener('click', function () { qty = Math.max(1, qty - 1); $('#qty').value = qty; paint(); });
    $('#qplus').addEventListener('click', function () { qty = Math.min(9, qty + 1); $('#qty').value = qty; paint(); });
    $('#addb').setAttribute('data-qty', '#qty');
    /* zoom al passaggio */
    var gm = $('#gframe');
    gm.addEventListener('pointermove', function (e) { if (REDUCED) return; var r = gm.getBoundingClientRect(); gm.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); gm.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%'); });
    paint();
  }

  /* ---------- avvio ---------- */
  function init() {
    var h = $('[data-gs="header"]'), f = $('[data-gs="footer"]');
    if (h) h.outerHTML = headerHTML();
    if (f) f.outerHTML = footerHTML();
    document.documentElement.classList.add('js');
    $$('[data-ic]').forEach(function (e) { e.innerHTML = I[e.getAttribute('data-ic')] || ''; });
    renderRails(); hero(); ui(); renderCart(); catalogo(); prodotto();
    var cur = (location.pathname.split('/').pop() || 'index.html');
    $$('.nav a').forEach(function (a) { if (location.search && a.getAttribute('href') && a.getAttribute('href').indexOf(location.search) > -1) a.classList.add('cur'); });
  }
  window.GS = { card: card, byId: byId };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
