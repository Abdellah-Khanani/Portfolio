/* Trattoria Esempio (ristorante di fantasia): menu, booking and reveal logic shared by the three styles.
   Each page provides #tabs + #dishes (tabbed menu) or #menu-all (full list) and #booking; styling lives in each page + booking.css. */

const MENU = [
 ["Antipasti", [
  ["Bruschetta al pomodoro", "Pane croccante, pomodorini, basilico", 6, "v"],
  ["Burrata e pomodorini", "Burrata pugliese, pomodorini, olio nuovo", 11, "v"],
  ["Frittura di calamari", "Calamari e verdure in pastella leggera", 13],
  ["Polpo e patate", "Polpo tenero, patate, sedano, limone", 14, "g"],
  ["Tagliere della casa", "Salumi, formaggi, miele, mostarda", 14],
  ["Insalata di mare", "Frutti di mare, sedano, olive taggiasche", 13, "g"]]],
 ["Primi", [
  ["Spaghetti al pomodoro", "Pomodoro fresco, basilico, un filo d'olio", 10, "v"],
  ["Tagliatelle al ragù", "Pasta fresca, ragù cotto per sei ore", 13],
  ["Linguine alle vongole", "Vongole veraci, aglio, prezzemolo", 16],
  ["Gnocchi alla sorrentina", "Pomodoro, mozzarella, basilico", 12, "v"],
  ["Risotto ai frutti di mare", "Per due persone, mantecato in padella", 17, "g"],
  ["Paccheri allo scoglio", "Molluschi e crostacei del giorno", 17, "p"]]],
 ["Pizze", [
  ["Margherita", "Pomodoro, fior di latte, basilico", 8, "v"],
  ["Marinara", "Pomodoro, aglio, origano", 7, "v"],
  ["Diavola", "Salame piccante, mozzarella, olio al peperoncino", 10, "p"],
  ["Quattro formaggi", "Mozzarella, gorgonzola, provola, parmigiano", 11, "v"],
  ["Bufala e pomodorini", "Mozzarella di bufala, pomodorini, basilico", 12, "v"],
  ["Ortolana", "Verdure di stagione grigliate, mozzarella", 11, "v"]]],
 ["Dolci", [
  ["Tiramisù", "Come lo fa la nonna", 6, "v"],
  ["Panna cotta", "Ai frutti di bosco", 6, "vg"],
  ["Cannolo siciliano", "Ricotta di pecora e scorza d'arancia", 5, "v"],
  ["Torta della nonna", "Crema pasticcera e pinoli", 6, "v"],
  ["Sorbetto al limone", "Fatto in casa, senza latte", 5, "vg"]]]
];
const FLAGS = { p: ["P", "Piccante"], v: ["V", "Vegetariano"], g: ["S", "Senza glutine"] };

const MK = { tab: 0, slot: null };
const $ = s => document.querySelector(s);
const eur = n => "€ " + n;
const ico = f => (f || "").split("").map(x => FLAGS[x] ? `<span class="ico ico-${x}" title="${FLAGS[x][1]}" aria-label="${FLAGS[x][1]}">${FLAGS[x][0]}</span>` : "").join("");
const dishHTML = (d, i) => `<li class="dish" style="--i:${i}"><div class="dh"><h3>${d[0]}${ico(d[3])}</h3><i class="lead-dots" aria-hidden="true"></i><span class="pr">${eur(d[2])}</span></div><p>${d[1]}</p></li>`;

function renderMenu() {
 const tabs = $("#tabs"), box = $("#dishes");
 if (tabs && box) {
  tabs.innerHTML = MENU.map((c, i) => `<button type="button" role="tab" aria-selected="${i === MK.tab}" data-t="${i}">${c[0]}</button>`).join("");
  box.innerHTML = MENU[MK.tab][1].map(dishHTML).join("");
  box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
  const on = tabs.querySelector('[aria-selected="true"]');
  tabs.scrollLeft += on.getBoundingClientRect().left - tabs.getBoundingClientRect().left - (tabs.clientWidth - on.offsetWidth) / 2;
 }
 const all = $("#menu-all");
 if (all) all.innerHTML = MENU.map((c, i) => `<section class="mcat" data-r><h3><small>${["I", "II", "III", "IV"][i]}</small>${c[0]}</h3><ul>${c[1].map(dishHTML).join("")}</ul></section>`).join("");
}

/* booking: one question at a time (people, day on a calendar, time, name), with a summary bar that fills in as you go
   and lets you jump back to any answered step. Mondays are closed. */
const BK = { step: 0, max: 0, people: null, date: null, view: null };
const pad = n => String(n).padStart(2, "0"), iso = x => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
const SLOTS = { lunch: ["12:00", "12:30", "13:00", "13:30"], dinner: ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"] };
const Q = ["Quanti sarete <em>a tavola?</em>", "Quale <em>giorno?</em>", "A che <em>ora?</em>", "Ultima cosa: <em>a che nome?</em>"];

function buildBooking() {
 const el = $("#booking");
 if (!el) return;
 const now = new Date(); BK.view = new Date(now.getFullYear(), now.getMonth(), 1);
 el.innerHTML = `
  <form class="bk" novalidate>
   <ol class="bk-sum">${["Persone", "Giorno", "Ora", "Nome"].map((k, i) => `<li><button type="button" data-go="${i}" disabled><small>${k}</small><b>-</b></button></li>`).join("")}</ol>
   <div class="bk-prog"><i></i></div>
   <div class="bk-stage">
    <section class="bk-p" data-s="0"><p class="bk-q" tabindex="-1">${Q[0]}</p>
     <div class="bk-nums">${[1, 2, 3, 4, 5, 6, 7, 8, "9+"].map(n => `<button type="button" data-p="${n}">${n}</button>`).join("")}</div></section>
    <section class="bk-p" data-s="1"><p class="bk-q" tabindex="-1">${Q[1]}</p><div class="bk-cal"></div></section>
    <section class="bk-p" data-s="2"><p class="bk-q" tabindex="-1">${Q[2]}</p>
     <div class="bk-f"><span>Cena</span><div class="bk-chips" data-k="dinner"></div></div>
     <div class="bk-f"><span>Pranzo</span><div class="bk-chips" data-k="lunch"></div></div></section>
    <section class="bk-p" data-s="3"><p class="bk-q" tabindex="-1">${Q[3]}</p>
     <div class="bk-seg" role="radiogroup" aria-label="Dove">
      <label><input type="radio" name="where" value="" checked><span>Indifferente</span></label>
      <label><input type="radio" name="where" value="sala"><span>In sala</span></label>
      <label><input type="radio" name="where" value="veranda"><span>In veranda</span></label>
     </div>
     <div class="bk-row">
      <label class="bk-f"><span>Nome</span><input name="name" autocomplete="name"></label>
      <label class="bk-f"><span>Telefono</span><input name="phone" type="tel" autocomplete="tel"></label>
     </div>
     <label class="bk-f"><span>Note</span><input name="notes" aria-describedby="bk-nh"><small id="bk-nh">Allergie, seggiolone, un'occasione speciale</small></label>
     <button class="bk-send" type="submit">Invia la richiesta</button></section>
   </div>
   <div class="bk-foot"><button type="button" class="bk-back">Indietro</button><p class="bk-err" role="alert"></p></div>
   <div class="bk-ok" aria-live="polite"><div><h3>Richiesta inviata</h3><p class="bk-okp"></p><small>Demo: nella versione reale la richiesta arriva al ristorante e il cliente riceve la conferma.</small><button type="button" class="bk-again">Nuova richiesta</button></div></div>
  </form>`;
 const f = el.querySelector("form");
 f.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.disabled) return;
  if (b.dataset.p) { BK.people = b.dataset.p; return next(1); }
  if (b.dataset.d) { if (BK.date !== b.dataset.d) MK.slot = null; BK.date = b.dataset.d; return next(2); }
  if (b.dataset.m) { BK.view.setMonth(BK.view.getMonth() + +b.dataset.m); return renderSlots(); }
  if (b.closest(".bk-chips")) { MK.slot = b.textContent; return next(3); }
  if (b.dataset.go) return show(+b.dataset.go);
  if (b.classList.contains("bk-back")) return show(BK.step - 1);
  if (b.classList.contains("bk-again")) { f.classList.remove("sent"); f.reset(); Object.assign(BK, { people: null, date: null, max: 0 }); MK.slot = null; show(0); }
 });
 f.addEventListener("input", () => { f.querySelector(".bk-err").textContent = ""; f.querySelector(".bk-sum li:last-child b").textContent = f.elements.name.value.trim() || "-"; });
 f.addEventListener("submit", e => {
  e.preventDefault();
  const E = f.elements, err = f.querySelector(".bk-err"), name = E.name.value.trim(), phone = E.phone.value.trim();
  if (!name || !phone) return err.textContent = "Mancano nome e telefono.";
  const day = new Date(BK.date + "T12:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const w = E.where.value, wt = w ? ", " + (w === "sala" ? "in sala" : "in veranda") : "";
  f.querySelector(".bk-okp").textContent = `${name}, il vostro tavolo per ${BK.people} ${BK.people === "1" ? "persona" : "persone"}, ${day} alle ${MK.slot}${wt}, è richiesto.`;
  f.classList.add("sent");
 });
 show(0);
}

function next(s) { BK.max = Math.max(BK.max, s); renderSlots(); setTimeout(() => show(s), 260); }

function show(s) {
 const f = $("#booking form"); if (!f || s < 0) return;
 BK.step = s;
 f.querySelectorAll(".bk-p").forEach(p => {
  const i = +p.dataset.s, on = i === s;
  p.classList.toggle("on", on); p.inert = !on;
  p.style.setProperty("--dx", (i < s ? -1 : i > s ? 1 : 0) * 48 + "px");
 });
 f.style.setProperty("--prog", (s + 1) / 4);
 f.querySelector(".bk-back").hidden = s === 0;
 f.querySelector(".bk-err").textContent = "";
 renderSlots();
 if (f.dataset.ready) f.querySelector(`.bk-p[data-s="${s}"] .bk-q`).focus({ preventScroll: true });
 f.dataset.ready = 1;
}

function renderSlots() {
 const f = $("#booking form"); if (!f) return;
 const now = new Date(), today = iso(now);
 const vals = [BK.people || "-",
  BK.date ? new Date(BK.date + "T12:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "-",
  MK.slot || "-", f.elements.name.value.trim() || "-"];
 f.querySelectorAll(".bk-sum button").forEach((b, i) => {
  b.querySelector("b").textContent = vals[i];
  b.disabled = i > BK.max; b.setAttribute("aria-current", i === BK.step ? "step" : "false");
 });
 f.querySelectorAll(".bk-nums button").forEach(b => b.setAttribute("aria-pressed", b.dataset.p === BK.people));
 const v = BK.view, y = v.getFullYear(), m = v.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
 const min = new Date(now.getFullYear(), now.getMonth(), 1), max = new Date(now.getFullYear(), now.getMonth() + 3, 1);
 const wd = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString("it-IT", { weekday: "narrow" }));
 let days = "";
 for (let i = 0; i < first; i++) days += "<span></span>";
 for (let d = 1; d <= n; d++) {
  const dt = new Date(y, m, d), k = iso(dt), mon = dt.getDay() === 1, past = k < today;
  days += `<button type="button" data-d="${k}" ${mon || past ? "disabled" : ""} ${mon ? 'title="Chiuso"' : ""} aria-pressed="${k === BK.date}" class="${k === today ? "today" : ""}${mon ? " mon" : ""}">${d}</button>`;
 }
 f.querySelector(".bk-cal").innerHTML = `
  <div class="bk-cal-h"><button type="button" data-m="-1" ${v <= min ? "disabled" : ""} aria-label="Mese precedente">‹</button><b>${v.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}</b><button type="button" data-m="1" ${v >= max ? "disabled" : ""} aria-label="Mese successivo">›</button></div>
  <div class="bk-cal-g">${wd.map(w => `<span class="wd">${w}</span>`).join("")}${days}</div>
  <p class="bk-cal-n"><i></i>Il lunedì siamo chiusi</p>`;
 const soon = BK.date === today ? pad(now.getHours() + 1) + ":" + pad(now.getMinutes()) : "";
 f.querySelectorAll(".bk-chips").forEach(box => box.innerHTML = SLOTS[box.dataset.k].map((s, i) =>
  `<button type="button" style="--i:${i}" ${soon && s < soon ? "disabled" : ""} aria-pressed="${s === MK.slot}">${s}</button>`).join(""));
}

document.addEventListener("DOMContentLoaded", () => {
 buildBooking();
 renderMenu();
 $("#tabs")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; MK.tab = +b.dataset.t; renderMenu(); });
 // reveal on enter: elements with [data-r] get .in once (all at once with ?static, for screenshots)
 const stat = /static/.test(location.search);
 const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
 document.querySelectorAll("[data-r]").forEach(el => stat ? el.classList.add("in") : io.observe(el));
 const s = $("#top-sentinel"), nav = $(".nav");
 if (s && nav) new IntersectionObserver(([x]) => nav.classList.toggle("solid", !x.isIntersecting)).observe(s);
 requestAnimationFrame(() => document.body.classList.add("ready"));
});
