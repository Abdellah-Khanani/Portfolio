/* Trattoria Esempio, management draft. Everything lives in this browser (localStorage); the bookings are demo data. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayName = (s, o = { weekday: "short" }) => new Date(s + "T12:00").toLocaleDateString("it-IT", o);
const longDate = s => new Date(s + "T12:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
const isMon = s => new Date(s + "T12:00").getDay() === 1;
const uid = () => Math.random().toString(36).slice(2, 9);
const initials = n => n.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
const TODAY = iso(new Date());
// the service the overview talks about: today, or the next open day when today is a Monday
const FOCUS = isMon(TODAY) ? iso(addDays(new Date(), 1)) : TODAY;
const FOCUS_IS_TODAY = FOCUS === TODAY;

const LUNCH = ["12:00", "12:30", "13:00", "13:30"];
const DINNER = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
const svc = t => (t < "16:00" ? "pranzo" : "cena");
const ST = { pending: "Da confermare", confirmed: "Confermata", seated: "Al tavolo", cancelled: "Cancellata" };

/* ---------- demo data ---------- */
function demo() {
 const tables = [
  ...[2, 2, 4, 4, 2, 6, 4, 2, 4, 8, 2, 4].map((s, i) => ({ id: "T" + (i + 1), seats: s, zone: "sala" })),
  ...[2, 4, 4, 2, 6, 4].map((s, i) => ({ id: "V" + (i + 1), seats: s, zone: "veranda" }))
 ];
 const names = [["Marco Pedrotti", "it"], ["Anna Gruber", "de"], ["Lukas Mair", "de"], ["Giulia Rizzi", "it"], ["Thomas Pichler", "de"], ["Elena Ferrari", "it"], ["Martin Kofler", "de"], ["Chiara Bonetti", "it"], ["Stefan Oberhofer", "de"], ["Francesca Zanon", "it"], ["Katharina Ladurner", "de"], ["Davide Moser", "it"], ["Sabine Unterkircher", "de"], ["Luca Benedetti", "it"], ["Paolo Esposito", "it"], ["Verena Hofer", "de"], ["Roberto Galli", "it"], ["Monika Rainer", "de"], ["Alessia Conte", "it"], ["Georg Plattner", "de"]];
 const notes = ["", "", "", "Anniversario di matrimonio", "Allergia ai crostacei", "", "Seggiolone per un bambino", "Celiaca", "", "Tavolo in veranda se possibile", "", "Compleanno, portano una torta"];
 let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
 const res = [];
 for (let d = -1; d < 14; d++) {
  const day = iso(addDays(new Date(), d)); if (isMon(day)) continue;
  const n = day === FOCUS ? 16 : Math.round(6 + rnd() * 10);
  for (let k = 0; k < n; k++) {
   const lunch = rnd() < .22, slots = lunch ? LUNCH : DINNER;
   const [name, lang] = names[(k * 7 + (d + 1) * 3) % names.length];
   const people = [2, 2, 2, 2, 3, 4, 4, 5, 6, 2][Math.floor(rnd() * 10)];
   let status = d < 0 ? "seated" : day === FOCUS ? (k < 3 ? "pending" : k === 3 ? "cancelled" : "confirmed") : (d < 4 && rnd() < .1 ? "pending" : "confirmed");
   res.push({ id: uid(), name, lang, phone: "+39 3" + Math.floor(10 + rnd() * 89) + " " + Math.floor(1000000 + rnd() * 8999999), people, date: day, time: slots[Math.floor(rnd() * slots.length)], status, table: "", where: rnd() < .3 ? "veranda" : rnd() < .5 ? "sala" : "", notes: notes[Math.floor(rnd() * notes.length)], source: rnd() < .62 ? "sito" : "telefono", created: iso(addDays(new Date(), d - 1 - Math.floor(rnd() * 5))) });
  }
 }
 // seat a few of tonight's early bookings so the plan is not empty
 const tonight = res.filter(r => r.date === FOCUS && r.status === "confirmed" && svc(r.time) === "cena").sort((a, b) => a.time.localeCompare(b.time));
 const free = tables.slice();
 tonight.slice(0, 7).forEach((r, i) => { const t = free.find(t => t.seats >= r.people && (r.where ? t.zone === r.where : true)); if (t) { r.table = t.id; free.splice(free.indexOf(t), 1); } if (i < 2 && FOCUS_IS_TODAY) r.status = "seated"; });
 const menu = [
  { cat: "Antipasti di mare", de: "Vorspeisen vom Meer", dishes: [] },
  { cat: "Antipasti di terra", de: "Vorspeisen vom Land", dishes: [] },
  { cat: "Primi di mare", de: "Erste Gänge vom Meer", dishes: [
   ["Tagliolini al ragù d'astice", "Scampi e vongole", "Hummerragout, Scampi und Venusmuscheln", "p"],
   ["Spaghettoni quadrati alla granseola", "", "Mit Seespinne", ""],
   ["Linguine all'astice", "Con pomodorini", "Hummer und Kirschtomaten", ""],
   ["Linguine all'aragostella nostrana", "", "Mit heimischer Languste", ""],
   ["Gnocchi di patate alla tarantina", "In bianco, cozze, vongole veraci e bottarga di tonno", "Miesmuscheln, Venusmuscheln und Thunfisch-Bottarga", ""],
   ["Tagliolini al branzino", "Limone emulsionato e zenzero", "Wolfsbarsch, emulgierte Zitrone und Ingwer", ""],
   ["Spaghetti allo scoglio", "Molluschi e crostacei secondo il mercato", "Muscheln und Krustentiere je nach Markt", ""],
   ["Linguine alla Ciro", "Acciughe del Mar Cantabrico", "Sardellen aus dem Kantabrischen Meer", "p"],
   ["Risotto Acquerello ai molluschi e crostacei", "Servito in padella e impiattato al tavolo", "In der Pfanne serviert, am Tisch angerichtet", "g"],
   ["Risotto Acquerello al ragù di polpo", "Servito in padella e impiattato al tavolo", "In der Pfanne serviert, am Tisch angerichtet", "g"],
   ["Fusilloni al nero, sì ma di calamaro!", "Calamaretti interi grigliati e due pomodorini", "Ganze gegrillte Babykalmare und zwei Kirschtomaten", "p"]
  ] },
  { cat: "Primi di terra", de: "Erste Gänge vom Land", dishes: [] },
  { cat: "Secondi di mare", de: "Zweite Gänge vom Meer", dishes: [["Grigliata di gamberoni e calamari", "Con zucchine", "Mit Zucchini", ""], ["Calamari fritti", "", "", ""]] },
  { cat: "Secondi di terra", de: "Zweite Gänge vom Land", dishes: [] },
  { cat: "Pizze", de: "Pizzen", dishes: [] },
  { cat: "Dolci", de: "Desserts", dishes: [] }
 ].map(c => ({ ...c, dishes: c.dishes.map(([n, d, dd, f]) => ({ id: uid(), n, nde: n, d, dde: dd, price: "", flags: f, on: true })) }));
 return {
  tables, res, menu,
  fish: { on: true, img: "../web/18.jpg", sample: true, t: "", tde: "", p: "", pde: "", price: "" },
  week: [1, 2, 3, 4, 5, 6, 0].map(d => ({ d, open: d !== 1, l: ["12:00", "14:00"], c: ["18:00", "24:00"] })),
  closures: [],
  rules: { online: true, auto: true, autoMax: 4, cap: 24, notice: 2, sms: true },
  ui: { view: "overview", day: FOCUS, svc: "cena", status: "all", cat: 2, plang: "it" }
 };
}

let S;
try { S = JSON.parse(localStorage.getItem("mc-admin-v4")); } catch (e) {}
if (!S || !S.res) S = demo();
S.ui.day = S.ui.day < TODAY ? FOCUS : S.ui.day;
const save = () => { try { localStorage.setItem("mc-admin-v4", JSON.stringify({ ...S, fish: { ...S.fish, img: S.fish.img.startsWith("data:") ? "../web/18.jpg" : S.fish.img } })); } catch (e) {} };

/* ---------- toast ---------- */
function toast(msg, icon = "check-circle", undo) {
 const t = document.createElement("div"); t.className = "toast";
 t.innerHTML = `<i class="ph ph-${icon}"></i><span>${msg}</span>${undo ? '<button type="button">Annulla</button>' : ""}`;
 if (undo) t.querySelector("button").onclick = () => { undo(); t.remove(); };
 $("#toasts").append(t); setTimeout(() => t.remove(), 4200);
}

/* ---------- navigation ---------- */
const VIEWS = [
 ["h", "Servizio"], ["overview", "Panoramica", "squares-four", "Oggi"], ["res", "Prenotazioni", "calendar-check", "Prenot."], ["floor", "Sala e tavoli", "armchair", "Sala"],
 ["h", "Sito"], ["menu", "La carta", "book-open-text", "Carta"], ["fish", "Pescato del giorno", "fish", "Pescato"],
 ["h", "Impostazioni"], ["hours", "Orari e regole", "clock", "Orari"]
];
const pendingCount = () => S.res.filter(r => r.status === "pending" && r.date >= TODAY).length;
function renderNav() {
 const pc = pendingCount();
 $("#nav").innerHTML = VIEWS.map(v => v[0] === "h" ? `<div class="nav-h">${v[1]}</div>` : `<button data-go="${v[0]}" ${S.ui.view === v[0] ? 'aria-current="page"' : ""}><i class="ph ph-${v[2]}"></i><span class="lb">${v[1]}</span><span class="ls">${v[3]}</span>${v[0] === "res" && pc ? `<span class="cnt">${pc}</span>` : ""}</button>`).join("");
 $("#mnav").innerHTML = VIEWS.filter(v => v[0] !== "h").map(v => `<button data-go="${v[0]}" ${S.ui.view === v[0] ? 'aria-current="page"' : ""}><i class="ph ph-${v[2]}"></i>${v[3]}${v[0] === "res" && pc ? `<span class="cnt">${pc}</span>` : ""}</button>`).join("");
 $("#bellc").textContent = pc; $("#bellc").style.display = pc ? "" : "none";
}
function go(v) {
 S.ui.view = v; save();
 $$(".view").forEach(s => s.classList.toggle("on", s.dataset.view === v));
 $("#ttl").textContent = VIEWS.find(x => x[0] === v)[1];
 renderNav(); render();
 scrollTo({ top: 0 });
}
function render() { ({ overview: rOverview, res: rRes, floor: rFloor, menu: rMenu, fish: rFish, hours: rHours })[S.ui.view](); }
function refresh() { save(); renderNav(); render(); }

/* ---------- shared bits ---------- */
const pill = s => `<span class="pill s-${s}">${ST[s]}</span>`;
const capacity = () => S.tables.reduce((a, t) => a + t.seats, 0);
const active = r => r.status !== "cancelled";
function actBtns(r) {
 if (r.status === "pending") return `<button class="btn sm ok" data-set="confirmed" data-id="${r.id}" aria-label="Conferma"><i class="ph ph-check"></i><span class="bl">Conferma</span></button><button class="btn sm no" data-set="cancelled" data-id="${r.id}" aria-label="Rifiuta"><i class="ph ph-x"></i><span class="bl">Rifiuta</span></button>`;
 if (r.status === "confirmed") return `<button class="btn sm sec" data-set="seated" data-id="${r.id}" aria-label="Arrivati"><i class="ph ph-door-open"></i><span class="bl">Arrivati</span></button>`;
 return "";
}
function setStatus(id, st) {
 const r = S.res.find(x => x.id === id), prev = r.status; r.status = st;
 if (st === "cancelled") r.table = "";
 refresh(); if ($("#drawer").classList.contains("on")) openRes(id);
 const msg = { confirmed: `Confermata. ${S.rules.sms ? "SMS inviato a " + esc(r.name) + "." : ""}`, cancelled: `Prenotazione di ${esc(r.name)} rifiutata.`, seated: `${esc(r.name)} è al tavolo.`, pending: "Rimessa in attesa." }[st];
 toast(msg, st === "cancelled" ? "x-circle" : "check-circle", () => { r.status = prev; refresh(); });
}

/* ---------- overview ---------- */
function bars(data, h = 220) {
 const W = 640, pb = 28, max = Math.max(4, ...data.map(d => d.v)), bw = W / data.length;
 return `<svg class="chart" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" role="img" aria-label="Coperti per fascia">
  ${[.25, .5, .75, 1].map(f => `<line x1="0" x2="${W}" y1="${(h - pb) * (1 - f)}" y2="${(h - pb) * (1 - f)}" stroke="var(--line2)"/>`).join("")}
  ${data.map((d, i) => { const bh = Math.max(2, (h - pb - 14) * d.v / max), x = i * bw + bw * .22; return `<g><rect x="${x}" y="${h - pb - bh}" width="${bw * .56}" height="${bh}" rx="6" fill="${d.hi ? "var(--acc)" : "var(--bar)"}" opacity="${d.v ? 1 : .15}" style="transform-origin:${x}px ${h - pb}px;animation:grow .9s var(--ease) ${i * 40}ms both"/>${d.v ? `<text x="${x + bw * .28}" y="${h - pb - bh - 6}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${d.v}</text>` : ""}<text x="${x + bw * .28}" y="${h - 8}" text-anchor="middle">${d.l}</text></g>`; }).join("")}
 </svg><style>@keyframes grow{from{transform:scaleY(0)}}@media (prefers-reduced-motion:reduce){.chart rect{animation:none!important}}</style>`;
}
function rOverview() {
 const today = S.res.filter(r => r.date === FOCUS && active(r));
 const din = today.filter(r => svc(r.time) === "cena"), cov = din.reduce((a, r) => a + r.people, 0), cap = capacity();
 const pend = S.res.filter(r => r.status === "pending" && r.date >= TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
 const next = today.filter(r => r.status === "confirmed").sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5);
 const wk = S.res.filter(r => r.date >= TODAY && r.date <= iso(addDays(new Date(), 6)) && active(r)), web = wk.length ? Math.round(100 * wk.filter(r => r.source === "sito").length / wk.length) : 0;
 const h = new Date().getHours(), hi = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
 const slots = DINNER.map(t => ({ l: t, v: din.filter(r => r.time === t).reduce((a, r) => a + r.people, 0) }));
 const mx = Math.max(...slots.map(s => s.v)); slots.forEach(s => s.hi = s.v === mx && mx > 0);
 const week = [...Array(7)].map((_, i) => { const d = iso(addDays(new Date(), i)); return { l: isMon(d) ? "chiuso" : dayName(d).slice(0, 3), v: isMon(d) ? 0 : S.res.filter(r => r.date === d && active(r)).reduce((a, r) => a + r.people, 0), hi: d === FOCUS }; });
 const f = S.fish;
 $("#v-overview").innerHTML = `
  <div class="hello"><div><h2>${hi}, Mario.</h2><p>${FOCUS_IS_TODAY ? "" : `Oggi siete chiusi. Domani, ${longDate(FOCUS)}: `}${FOCUS_IS_TODAY ? "Stasera" : "a cena"} ${din.length} prenotazioni, ${cov} coperti. ${pend.length ? pend.length + " richieste aspettano una risposta." : "Nessuna richiesta in attesa."}</p></div>
   <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="demo"><i class="ph ph-info"></i>Dati di esempio</span><button class="btn sec" data-go="floor"><i class="ph ph-armchair"></i>Apri la sala</button></div></div>
  <div class="kpis">
   <div class="card kpi hi"><div class="l"><i class="ph ph-users-three"></i>Coperti ${FOCUS_IS_TODAY ? "stasera" : "domani sera"}</div><b class="num">${cov}<span style="font-size:18px;color:var(--deep-mute)"> / ${cap}</span></b><small>${Math.round(100 * cov / cap)}% della sala e veranda</small><div class="meter"><i style="width:${Math.min(100, 100 * cov / cap)}%"></i></div></div>
   <div class="card kpi"><div class="l"><i class="ph ph-calendar-check"></i>Prenotazioni ${FOCUS_IS_TODAY ? "oggi" : "domani"}</div><b class="num">${today.length}</b><small>${today.filter(r => svc(r.time) === "pranzo").length} a pranzo, ${din.length} a cena</small></div>
   <div class="card kpi"><div class="l"><i class="ph ph-hourglass-medium"></i>Da confermare</div><b class="num" style="color:${pend.length ? "var(--wait)" : "inherit"}">${pend.length}</b><small>nei prossimi giorni</small></div>
   <div class="card kpi"><div class="l"><i class="ph ph-globe-simple"></i>Dal sito</div><b class="num">${web}%</b><small>delle prenotazioni di questa settimana</small></div>
  </div>
  <div class="ov-g">
   <div class="card"><div class="card-h"><h2>Arrivi ${FOCUS_IS_TODAY ? "di stasera" : "di domani sera"}</h2><span class="sp"></span><span class="mute" style="font-size:13px">coperti per orario</span></div><div class="card-b">${bars(slots)}</div></div>
   <div class="card"><div class="card-h"><h2>Da confermare</h2><span class="sp"></span>${pend.length ? `<button class="btn sm ghost" data-go="res" data-status="pending">Vedi tutte</button>` : ""}</div><div class="card-b">
    ${pend.length ? `<ul class="list">${pend.slice(0, 4).map(r => `<li class="li"><span class="t num">${r.time}</span><div class="who" data-open="${r.id}" style="cursor:pointer"><b>${esc(r.name)}</b><small>${r.date === TODAY ? "Oggi" : r.date === FOCUS ? "Domani" : dayName(r.date, { weekday: "short", day: "numeric" })}, ${r.people} persone${r.notes ? ", " + esc(r.notes.toLowerCase()) : ""}</small></div><button class="btn sm ok" data-set="confirmed" data-id="${r.id}" aria-label="Conferma"><i class="ph ph-check"></i></button><button class="btn sm no" data-set="cancelled" data-id="${r.id}" aria-label="Rifiuta"><i class="ph ph-x"></i></button></li>`).join("")}</ul>` : `<div class="empty"><i class="ph ph-check-circle"></i>Tutto confermato.</div>`}
   </div></div>
  </div>
  <div class="ov-g2">
   <div class="card"><div class="card-h"><h2>Prossimi arrivi</h2></div><div class="card-b">${next.length ? `<ul class="list">${next.map(r => `<li class="li" data-open="${r.id}" style="cursor:pointer"><span class="t num">${r.time}</span><div class="who"><b>${esc(r.name)}</b><small>${r.people} persone${r.table ? ", tavolo " + r.table : ", tavolo da assegnare"}</small></div>${r.lang === "de" ? '<span class="tag">DE</span>' : ""}</li>`).join("")}</ul>` : `<div class="empty"><i class="ph ph-moon-stars"></i>Nessun arrivo in programma.</div>`}</div></div>
   <div class="card"><div class="card-h"><h2>Prossimi 7 giorni</h2><span class="sp"></span><span class="mute" style="font-size:13px">coperti</span></div><div class="card-b">${bars(week, 200)}</div></div>
   <div class="card"><div class="card-h"><h2>Pescato del giorno</h2><span class="sp"></span><span class="pill ${f.on ? "s-confirmed" : "s-done"}">${f.on ? "Sul sito" : "Nascosto"}</span></div><div class="card-b"><div class="fish-mini"><div class="img" style="background-image:url('${f.img}')"></div><div><b>${esc(f.t) || "Non ancora scritto"}</b><p class="mute" style="margin:4px 0 12px;font-size:13px">${f.t ? esc(f.p) : "Una foto e due righe: chi lo vede sui social o su Google arriva sul sito e prenota."}</p><button class="btn sm sec" data-go="fish"><i class="ph ph-pencil-simple"></i>Aggiorna</button></div></div></div></div>
  </div>`;
}

/* ---------- reservations ---------- */
function filtered(day = S.ui.day) {
 const q = $("#q").value.trim().toLowerCase();
 return S.res.filter(r => (q ? r.date >= TODAY : r.date === day) && (S.ui.svc === "all" || svc(r.time) === S.ui.svc) && (!q || r.name.toLowerCase().includes(q) || r.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))))
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
function rRes() {
 const base = filtered(), q = $("#q").value.trim();
 const cnt = s => base.filter(r => s === "all" || r.status === s).length;
 const list = base.filter(r => S.ui.status === "all" || r.status === S.ui.status);
 const days = [...Array(14)].map((_, i) => iso(addDays(new Date(), i)));
 // one block per time slot, one card per guest, one big button per card (made for a finger on a tablet)
 const groups = [];
 list.forEach(r => { const k = q ? r.date + r.time : r.time; let G = groups[groups.length - 1]; if (!G || G.k !== k) groups.push(G = { k, t: r.time, d: r.date, rs: [] }); G.rs.push(r); });
 const tl = `<div class="tl">${groups.map(G => `<div class="tl-slot"><div class="tl-t"><b class="num">${G.t}</b>${q ? `<small style="text-transform:capitalize">${dayName(G.d, { weekday: "short", day: "numeric" })}</small>` : ""}<small>${G.rs.filter(active).reduce((a, r) => a + r.people, 0)} coperti</small></div><div class="tl-c">${G.rs.map(gcard).join("")}</div></div>`).join("")}</div>`;
 const cov = base.filter(active).reduce((a, r) => a + r.people, 0);
 $("#v-res").innerHTML = `
  ${q ? `<div class="toolbar"><span class="mute">Risultati per "${esc(q)}" nei prossimi giorni</span><span class="sp"></span><button class="btn sm sec" id="clearq">Cancella ricerca</button></div>` : `<div class="days">${days.map(d => `<button class="day ${isMon(d) ? "closed" : ""}" data-day="${d}" aria-pressed="${d === S.ui.day}"><small>${d === TODAY ? "Oggi" : dayName(d)}</small><b class="num">${+d.slice(8)}</b><span>${isMon(d) ? "Chiuso" : S.res.filter(r => r.date === d && active(r)).reduce((a, r) => a + r.people, 0) + " coperti"}</span></button>`).join("")}</div>`}
  <div class="toolbar">
   <div class="seg" role="group" aria-label="Servizio">${[["all", "Tutto"], ["pranzo", "Pranzo"], ["cena", "Cena"]].map(([k, l]) => `<button data-svc="${k}" aria-pressed="${S.ui.svc === k}">${l}</button>`).join("")}</div>
   <div class="seg" role="group" aria-label="Stato">${[["all", "Tutte"], ["pending", "Da confermare"], ["confirmed", "Confermate"], ["seated", "Al tavolo"], ["cancelled", "Cancellate"]].map(([k, l]) => `<button data-status="${k}" aria-pressed="${S.ui.status === k}">${l} <span class="c">${cnt(k)}</span></button>`).join("")}</div>
   <span class="sp"></span><span class="mute num">${base.filter(active).length} prenotazioni · ${cov} coperti</span>
  </div>
  ${isMon(S.ui.day) && !q ? `<div class="card"><div class="empty"><i class="ph ph-moon"></i>Il lunedì il ristorante è chiuso. Le prenotazioni online sono bloccate.</div></div>` :
   list.length ? tl
   : `<div class="card"><div class="empty"><i class="ph ph-calendar-blank"></i>Nessuna prenotazione con questi filtri.<br><button class="btn sec" style="margin-top:14px" data-new>Aggiungi una prenotazione</button></div></div>`}`;
}

const noteChip = r => {
 const n = (r.notes || "").toLowerCase(); if (!n) return "";
 const [ic, cl] = /allerg|celiac|intoller/.test(n) ? ["warning-circle", "al"] : /compleann|anniversar|torta/.test(n) ? ["cake", ""] : /seggiolon|bambin/.test(n) ? ["baby", ""] : ["note-pencil", ""];
 return `<span class="nc ${cl}"><i class="ph ph-${ic}"></i>${esc(r.notes)}</span>`;
};
function gcard(r) {
 const act = r.status === "pending" ? `<button class="btn icon no" data-set="cancelled" data-id="${r.id}" aria-label="Rifiuta"><i class="ph ph-x"></i></button><button class="btn ok big" data-set="confirmed" data-id="${r.id}"><i class="ph ph-check"></i>Conferma</button>`
  : r.status === "confirmed" ? `<button class="btn sec big" data-set="seated" data-id="${r.id}"><i class="ph ph-door-open"></i>Arrivati</button>`
  : `<span class="pill s-${r.status}">${ST[r.status]}</span>`;
 return `<div class="gc st-${r.status}" data-open="${r.id}">
  <div class="gtb ${r.table ? "" : "na"}">${r.table || "da<br>assegnare"}</div>
  <div class="gnm"><b>${esc(r.name)}${r.lang === "de" ? ' <span class="tag">DE</span>' : ""}</b>
   <div class="gm"><span><i class="ph ph-users"></i>${r.people} ${r.people > 1 ? "persone" : "persona"}</span>${r.where ? `<span><i class="ph ph-map-pin"></i>${r.where}</span>` : ""}<span><i class="ph ph-${r.source === "sito" ? "globe-simple" : "phone"}"></i>${r.source === "sito" ? "dal sito" : "al telefono"}</span>${noteChip(r)}</div></div>
  <div class="gact">${act}</div></div>`;
}

/* reservation drawer */
function openRes(id) {
 const r = S.res.find(x => x.id === id); if (!r) return;
 const busy = S.res.filter(x => x.date === r.date && svc(x.time) === svc(r.time) && x.table && x.id !== r.id && active(x)).map(x => x.table);
 $("#drawer").innerHTML = `
  <div class="dr-h"><span class="av">${initials(r.name)}</span><h3>${esc(r.name)}</h3>${pill(r.status)}<button class="icon-btn" data-close aria-label="Chiudi"><i class="ph ph-x"></i></button></div>
  <div class="dr-b">
   <div class="facts">
    <div class="fact"><small>Giorno</small><b style="text-transform:capitalize">${longDate(r.date)}</b></div>
    <div class="fact"><small>Ora</small><b class="num">${r.time}</b></div>
    <div class="fact"><small>Persone</small><b>${r.people}</b></div>
    <div class="fact"><small>Preferenza</small><b style="text-transform:capitalize">${r.where || "Indifferente"}</b></div>
    <div class="fact"><small>Lingua</small><b>${r.lang === "de" ? "Tedesco" : "Italiano"}</b></div>
    <div class="fact"><small>Arrivata da</small><b>${r.source === "sito" ? "Sito web" : "Telefono"}</b></div>
   </div>
   <label class="f">Stato<div class="statusbar">${Object.keys(ST).map(s => `<button type="button" class="${r.status === s ? "s-" + s : ""}" data-set="${s}" data-id="${r.id}" aria-pressed="${r.status === s}">${ST[s]}</button>`).join("")}</div></label>
   <label class="f">Tavolo<select class="in" id="dr-table"><option value="">Da assegnare</option>${["sala", "veranda"].map(z => `<optgroup label="${z === "sala" ? "Sala" : "Veranda"}">${S.tables.filter(t => t.zone === z).map(t => `<option value="${t.id}" ${r.table === t.id ? "selected" : ""} ${busy.includes(t.id) ? "disabled" : ""}>${t.id} · ${t.seats} posti${busy.includes(t.id) ? " · occupato" : t.seats < r.people ? " · piccolo" : ""}</option>`).join("")}</optgroup>`).join("")}</select></label>
   <label class="f">Note per la sala<textarea class="in" id="dr-notes" placeholder="Allergie, occasione, richieste">${esc(r.notes)}</textarea></label>
   <div class="f">Cronologia<ul class="timeline"><li>Richiesta ${r.source === "sito" ? "dal sito" : "al telefono"}, ${dayName(r.created, { day: "numeric", month: "short" })}</li>${r.status !== "pending" && r.status !== "cancelled" ? `<li>Confermata${S.rules.sms ? ", SMS inviato" : ""}</li>` : ""}${r.status === "seated" ? "<li>Arrivati al tavolo</li>" : ""}${r.status === "cancelled" ? "<li>Cancellata</li>" : ""}</ul></div>
  </div>
  <div class="dr-f"><a class="btn sec" href="tel:${r.phone.replace(/\s/g, "")}"><i class="ph ph-phone"></i>Chiama</a><button class="btn sec" id="dr-sms"><i class="ph ph-chat-circle-text"></i>Invia SMS</button><span style="flex:1"></span><button class="btn ghost" id="dr-del" style="color:var(--no)"><i class="ph ph-trash"></i></button></div>`;
 $("#dr-table").onchange = e => { r.table = e.target.value; refresh(); toast(r.table ? `${esc(r.name)} al tavolo ${r.table}.` : "Tavolo tolto."); };
 $("#dr-notes").onchange = e => { r.notes = e.target.value; refresh(); toast("Note salvate."); };
 $("#dr-sms").onclick = () => toast(`SMS inviato a ${esc(r.name)}${r.lang === "de" ? ", in tedesco" : ""}. (Simulato nella demo.)`, "chat-circle-text");
 $("#dr-del").onclick = () => { const i = S.res.indexOf(r); S.res.splice(i, 1); closeAll(); refresh(); toast("Prenotazione eliminata.", "trash", () => { S.res.splice(i, 0, r); refresh(); }); };
 openPanel("#drawer");
}
function openPanel(sel) { $("#scrim").classList.add("on"); $(sel).classList.add("on"); $(sel).setAttribute("aria-hidden", "false"); }
function closeAll() { $("#scrim").classList.remove("on"); document.body.classList.remove("sheet-open"); ["#drawer", "#modal", "#sheet"].forEach(s => { $(s).classList.remove("on"); $(s).setAttribute("aria-hidden", "true"); }); }

/* new booking: a sheet from the bottom with big keys; people, time, name. The day row on top defaults to today */
let NB = null;
const NB_TAGS = ["Allergie", "Celiaco", "Seggiolone", "Compleanno", "Anniversario"];
function openNew() {
 let d = S.ui.day >= TODAY ? S.ui.day : TODAY; while (isMon(d)) d = iso(addDays(new Date(d + "T12:00"), 1));
 NB = { date: d, people: "", time: "", name: "", phone: "", where: "", tags: [], step: 0, max: 0 };
 drawNew(); openPanel("#sheet"); document.body.classList.add("sheet-open");
}
function drawNew() {
 const n = NB, days = [...Array(14)].map((_, i) => iso(addDays(new Date(), i))), tomorrow = iso(addDays(new Date(), 1));
 const ppl = n.people === "10+" ? 10 : +n.people;
 const free = t => S.rules.cap - S.res.filter(r => r.date === n.date && r.time === t && active(r)).reduce((a, r) => a + r.people, 0);
 const now = new Date(), soon = pad(now.getHours() + 1) + ":" + pad(now.getMinutes());
 const times = list => `<div class="sh-times">${list.map(t => { const f = free(t), past = n.date === TODAY && t < soon, full = f < ppl;
  return `<button data-nt="${t}" aria-pressed="${n.time === t}" class="${!full && f < ppl + 4 ? "low" : ""}" ${past || full ? "disabled" : ""}>${t}<small>${past ? "passato" : full ? "pieno" : f + " liberi"}</small></button>`; }).join("")}</div>`;
 const step = [
  () => `<p class="sh-q">Quante persone?</p><div class="sh-num">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "10+"].map(p => `<button data-np="${p}" aria-pressed="${String(p) === n.people}">${p}</button>`).join("")}</div>`,
  () => `<p class="sh-q">A che ora?<small>sotto ogni orario, i posti ancora liberi</small></p><div class="sh-lab">Cena</div>${times(DINNER)}<div class="sh-lab">Pranzo</div>${times(LUNCH)}`,
  () => `<div class="sh-who"><div><p class="sh-q">Nome e telefono</p><input class="sh-in" id="nb-name" placeholder="Cognome" autocomplete="off" value="${esc(n.name)}"><div class="sh-ph ${n.phone ? "has" : ""}" id="nb-ph">${esc(n.phone) || "Telefono"}</div>
     <div class="sh-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "+", 0, "del"].map(k => `<button data-key="${k}" aria-label="${k === "del" ? "Cancella" : k}">${k === "del" ? '<i class="ph ph-backspace"></i>' : k}</button>`).join("")}</div></div>
    <div><p class="sh-q">Dove e note<small>facoltativo</small></p>
     <div class="sh-chips">${[["", "Indifferente"], ["sala", "Sala"], ["veranda", "Veranda"]].map(([k, l]) => `<button data-nw="${k}" aria-pressed="${n.where === k}">${l}</button>`).join("")}</div>
     <div class="sh-chips">${NB_TAGS.map(t => `<button data-tag="${t}" aria-pressed="${n.tags.includes(t)}">${t}</button>`).join("")}</div>
     <p class="sh-err" id="nb-err"></p>
     <button class="sh-save" id="nb-save"><i class="ph ph-check"></i>Salva la prenotazione</button></div></div>`
 ][n.step];
 $("#sheet").innerHTML = `
  <div class="sh-grab"></div>
  <div class="sh-h"><h3>Nuova prenotazione</h3><span class="sp"></span><span class="mute" style="font-size:13px"><i class="ph ph-phone"></i> presa al telefono o in sala</span><button class="icon-btn" data-close aria-label="Chiudi"><i class="ph ph-x"></i></button></div>
  <div class="sh-days">${days.map(d => `<button data-nd="${d}" aria-pressed="${d === n.date}" ${isMon(d) ? "disabled" : ""}><small>${isMon(d) ? "chiuso" : d === TODAY ? "oggi" : d === tomorrow ? "domani" : dayName(d)}</small><b class="num">${+d.slice(8)}</b></button>`).join("")}</div>
  <div class="sh-sum">${[["users", n.people ? n.people + (ppl > 1 ? " persone" : " persona") : "Persone"], ["clock", n.time || "Ora"], ["user", n.name || "Nome"]].map(([ic, l], i) => `<button data-ns="${i}" class="${i === n.step ? "on" : ""} ${(i === 0 && n.people) || (i === 1 && n.time) || (i === 2 && n.name) ? "set" : ""}" ${i > n.max ? "disabled" : ""}><i class="ph ph-${ic}"></i>${esc(l)}</button>`).join("")}</div>
  <div class="sh-b" key="${n.step}">${step()}</div>`;
 const nm = $("#nb-name"); if (nm) nm.oninput = () => { n.name = nm.value; $("#nb-err").textContent = ""; const c = $$("#sheet .sh-sum button")[2]; c.lastChild.textContent = n.name || "Nome"; c.classList.toggle("set", !!n.name.trim()); };
}
function nbStep(s) { NB.step = s; NB.max = Math.max(NB.max, s); drawNew(); }
function nbClick(e) {
 const t = e.target.closest("button"); if (!t || t.disabled || !NB) return;
 const n = NB, D = t.dataset;
 if (D.nd) { n.date = D.nd; if (n.time) n.time = ""; if (n.step > 1) n.step = 1; drawNew(); }
 else if (D.np) { n.people = D.np; n.time = ""; setTimeout(() => nbStep(1), 180); t.setAttribute("aria-pressed", "true"); }
 else if (D.nt) { n.time = D.nt; t.setAttribute("aria-pressed", "true"); setTimeout(() => { nbStep(2); setTimeout(() => $("#nb-name")?.focus(), 350); }, 180); }
 else if (D.ns) nbStep(+D.ns);
 else if (D.key) { n.phone = D.key === "del" ? n.phone.slice(0, -1) : (n.phone + D.key).slice(0, 16); const p = $("#nb-ph"); p.textContent = n.phone || "Telefono"; p.classList.toggle("has", !!n.phone); }
 else if (D.nw !== undefined) { n.where = D.nw; $$("#sheet [data-nw]").forEach(b => b.setAttribute("aria-pressed", b === t)); }
 else if (D.tag) { n.tags = n.tags.includes(D.tag) ? n.tags.filter(x => x !== D.tag) : [...n.tags, D.tag]; t.setAttribute("aria-pressed", n.tags.includes(D.tag)); }
 else if (t.id === "nb-save") {
  if (!n.name.trim()) { $("#nb-err").textContent = "Scrivete almeno il cognome."; $("#nb-name").focus(); return; }
  const r = { id: uid(), name: n.name.trim(), phone: n.phone || "Non indicato", people: n.people === "10+" ? 10 : +n.people, date: n.date, time: n.time, status: "confirmed", table: "", where: n.where, notes: n.tags.join(", "), source: "telefono", lang: "it", created: TODAY };
  S.res.push(r); save(); renderNav();
  $("#sheet .sh-b").innerHTML = `<div class="sh-ok"><i class="ph ph-check-circle"></i><p class="sh-q" style="margin:10px 0 4px">Prenotata.</p><p class="mute">${esc(r.name)}, ${r.people} ${r.people > 1 ? "persone" : "persona"}, ${n.date === TODAY ? "oggi" : longDate(n.date)} alle ${r.time}.</p></div>`;
  $("#sheet .sh-sum").style.visibility = "hidden";
  setTimeout(() => { if (NB) return; closeAll(); S.ui.day = r.date; S.ui.status = "all"; go("res"); }, 1300);
  NB = null;
 }
}

/* ---------- floor plan ---------- */
let pick = null;
function rFloor() {
 const day = S.ui.day, sv = S.ui.svc === "all" ? "cena" : S.ui.svc;
 const rs = S.res.filter(r => r.date === day && svc(r.time) === sv && active(r));
 const at = id => rs.find(r => r.table === id);
 const un = rs.filter(r => !r.table).sort((a, b) => a.time.localeCompare(b.time));
 const cov = rs.reduce((a, r) => a + r.people, 0), seated = rs.filter(r => r.table).reduce((a, r) => a + r.people, 0);
 const tb = t => { const r = at(t.id); return `<button class="tb ${t.seats <= 2 ? "round" : ""} ${r ? "s-" + r.status : ""} ${pick && !r ? "target" : ""}" data-tb="${t.id}" aria-label="Tavolo ${t.id}"><span class="seats">${t.seats}</span><b>${t.id}</b><small>${r ? esc(r.name.split(" ")[1] || r.name) + " " + r.time : "Libero"}</small></button>`; };
 $("#v-floor").innerHTML = `
  <div class="toolbar">
   <label class="f" style="flex-direction:row;display:flex;align-items:center;gap:10px">Giorno <input class="in" type="date" id="fl-day" value="${day}" min="${TODAY}" style="width:170px"></label>
   <div class="seg">${[["pranzo", "Pranzo"], ["cena", "Cena"]].map(([k, l]) => `<button data-svc="${k}" aria-pressed="${sv === k}">${l}</button>`).join("")}</div>
   <span class="sp"></span><span class="mute num">${seated} di ${cov} coperti hanno un tavolo · ${capacity()} posti</span>
  </div>
  ${isMon(day) ? `<div class="card"><div class="empty"><i class="ph ph-moon"></i>Lunedì chiuso.</div></div>` : `
  <div class="floor-g">
   <div class="card plan">
    <div class="zone"><div class="zone-h">Sala <small>${S.tables.filter(t => t.zone === "sala").length} tavoli</small></div><div class="tables">${S.tables.filter(t => t.zone === "sala").map(tb).join("")}</div></div>
    <div class="zone ver"><div class="zone-h">Veranda <small>${S.tables.filter(t => t.zone === "veranda").length} tavoli</small></div><div class="tables">${S.tables.filter(t => t.zone === "veranda").map(tb).join("")}</div></div>
    <div class="legend2"><span><i style="border-color:var(--line)"></i>Libero</span><span><i style="border-color:var(--ok);background:var(--ok-bg)"></i>Confermata</span><span><i style="border-color:var(--wait);background:var(--wait-bg)"></i>Da confermare</span><span><i style="border-color:var(--in);background:var(--in-bg)"></i>Al tavolo</span></div>
   </div>
   <div class="card"><div class="card-h"><h2>Da assegnare</h2><span class="sp"></span><span class="tag">${un.length}</span></div><div class="card-b">
    <p class="mute" style="margin:0 0 14px;font-size:13px">${pick ? "Ora toccate un tavolo libero." : "Toccate una prenotazione, poi un tavolo libero."}</p>
    ${un.length ? `<div class="unas">${un.map(r => `<button class="ua" data-pick="${r.id}" aria-pressed="${pick === r.id}"><span class="t num">${r.time}</span><span style="flex:1"><b>${esc(r.name)}</b><small>${r.people} persone${r.where ? ", preferisce " + r.where : ""}</small></span>${r.status === "pending" ? '<i class="ph ph-hourglass-medium" style="color:var(--wait)"></i>' : ""}</button>`).join("")}</div>` : `<div class="empty"><i class="ph ph-check-circle"></i>Tutti hanno un tavolo.</div>`}
   </div></div>
  </div>`}`;
 const fd = $("#fl-day"); if (fd) fd.onchange = e => { S.ui.day = e.target.value; pick = null; refresh(); };
}

/* ---------- menu editor ---------- */
function rMenu() {
 const c = S.menu[S.ui.cat], L = S.ui.plang;
 $("#v-menu").innerHTML = `
  <div class="toolbar"><span class="mute">Ogni modifica va sul sito appena la salvate, in italiano e in tedesco.</span><span class="sp"></span><button class="btn pri" id="addDish"><i class="ph ph-plus"></i>Aggiungi piatto</button></div>
  <div class="menu-g">
   <div class="card cats">${S.menu.map((m, i) => `<button data-cat="${i}" aria-pressed="${i === S.ui.cat}">${m.cat}<span>${m.dishes.length}</span></button>`).join("")}</div>
   <div class="card">
    <div class="card-h"><h2>${c.cat}</h2><span class="mute" style="font-size:13px">${c.de}</span><span class="sp"></span><span class="mute" style="font-size:13px">${c.dishes.filter(d => d.on).length} disponibili oggi</span></div>
    <div style="margin-top:14px">${c.dishes.length ? c.dishes.map((d, i) => `
     <div class="dish-row ${d.on ? "" : "off"}">
      <div class="grip"><button data-mv="-1" data-i="${i}" aria-label="Sposta su" ${i ? "" : "disabled"}><i class="ph ph-caret-up"></i></button><button data-mv="1" data-i="${i}" aria-label="Sposta giù" ${i < c.dishes.length - 1 ? "" : "disabled"}><i class="ph ph-caret-down"></i></button></div>
      <div style="min-width:0;cursor:pointer" data-edit="${i}"><b>${esc(d.n)}${d.flags.includes("p") ? '<span class="fl p" title="Piccante">P</span>' : ""}${d.flags.includes("g") ? '<span class="fl g" title="Senza glutine">G</span>' : ""}</b><small>${esc(d.d) || "Nessuna descrizione"}${d.dde ? "" : ' · <span style="color:var(--wait)">manca il tedesco</span>'}</small></div>
      <label class="pr-w"><input class="price num" data-price="${i}" value="${esc(d.price)}" placeholder="Prezzo" inputmode="decimal" aria-label="Prezzo in euro"><span>€</span></label>
      <label class="sw" title="Disponibile oggi"><input type="checkbox" data-on="${i}" ${d.on ? "checked" : ""} aria-label="Disponibile oggi"><span></span></label>
      <div class="acts"><button class="icon-btn" data-edit="${i}" aria-label="Modifica" style="width:36px;height:36px"><i class="ph ph-pencil-simple"></i></button></div>
     </div>`).join("") : `<div class="empty"><i class="ph ph-book-open-text"></i>Questa pagina della carta è ancora vuota.<br><button class="btn sec" style="margin-top:14px" id="addDish2">Aggiungi il primo piatto</button></div>`}</div>
   </div>
   <div class="prev"><div class="prev-l">Anteprima sul sito<div class="lt">${["it", "de"].map(l => `<button data-pl="${l}" aria-pressed="${L === l}">${l.toUpperCase()}</button>`).join("")}</div></div>
    <div class="phone"><div class="screen"><div class="sb"><i></i></div><div class="sh"><span>ESEMPIO</span><span>${L.toUpperCase()}</span></div><h4>${L === "de" ? "Die Karte" : "La carta"}</h4>
     <div class="tabs2">${S.menu.slice(Math.max(0, S.ui.cat - 1), S.ui.cat + 3).map(m => `<span class="${m === c ? "on" : ""}">${L === "de" ? m.de : m.cat}</span>`).join("")}</div>
     <ul>${c.dishes.length ? c.dishes.filter(d => d.on).map(d => `<li><b><span>${esc(L === "de" ? d.nde || d.n : d.n)}</span><span class="pr">${d.price ? "€ " + esc(d.price) : ""}</span></b><small>${esc(L === "de" ? d.dde : d.d)}</small></li>`).join("") : `<li><small>${L === "de" ? "Diese Seite folgt." : "Pagina in arrivo."}</small></li>`}</ul>
    </div></div>
   </div>
  </div>`;
 $("#addDish").onclick = () => editDish(-1); const a2 = $("#addDish2"); if (a2) a2.onclick = () => editDish(-1);
}
function editDish(i) {
 const c = S.menu[S.ui.cat], isNew = i < 0, d = isNew ? { id: uid(), n: "", nde: "", d: "", dde: "", price: "", flags: "", on: true } : { ...c.dishes[i] };
 let tab = "it";
 const draw = () => {
  $("#drawer").innerHTML = `
   <div class="dr-h"><h3>${isNew ? "Nuovo piatto" : "Modifica piatto"}</h3><span class="tag">${c.cat}</span><button class="icon-btn" data-close aria-label="Chiudi"><i class="ph ph-x"></i></button></div>
   <div class="dr-b">
    <div class="lt" style="justify-self:start">${[["it", "Italiano"], ["de", "Deutsch"]].map(([k, l]) => `<button data-tab="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div>
    ${tab === "it" ? `<label class="f">Nome del piatto<input class="in" id="e-n" value="${esc(d.n)}"></label><label class="f">Descrizione<textarea class="in" id="e-d">${esc(d.d)}</textarea></label>`
     : `<label class="f">Name des Gerichts <small>Lasciate il nome italiano se è un nome proprio</small><input class="in" id="e-n" value="${esc(d.nde || d.n)}"></label><label class="f">Beschreibung<textarea class="in" id="e-d">${esc(d.dde)}</textarea></label>`}
    <div class="grid2"><label class="f">Prezzo in euro<input class="in num" id="e-p" value="${esc(d.price)}" inputmode="decimal" placeholder="Es. 24"></label>
     <div class="f">Disponibile oggi<label class="sw" style="margin-top:9px"><input type="checkbox" id="e-on" ${d.on ? "checked" : ""}><span></span></label></div></div>
    <div class="f">Indicazioni<div class="chips"><button type="button" data-fl="p" aria-pressed="${d.flags.includes("p")}"><span class="fl p" style="margin:0 6px 0 0">P</span>Piccante</button><button type="button" data-fl="g" aria-pressed="${d.flags.includes("g")}"><span class="fl g" style="margin:0 6px 0 0">G</span>Senza glutine</button></div></div>
    <div class="f">Foto del piatto <small>Facoltativa: appare sul sito quando qualcuno sceglie questo piatto</small><label class="drop" style="aspect-ratio:16/7"><input type="file" accept="image/*"><span><i class="ph ph-camera" style="font-size:24px"></i><br>Carica una foto dal telefono</span></label></div>
   </div>
   <div class="dr-f">${isNew ? "" : `<button class="btn ghost" id="e-del" style="color:var(--no)"><i class="ph ph-trash"></i>Elimina</button>`}<span style="flex:1"></span><button class="btn sec" data-close>Annulla</button><button class="btn pri" id="e-save"><i class="ph ph-check"></i>Salva</button></div>`;
  const keep = () => { const n = $("#e-n").value, ds = $("#e-d").value; if (tab === "it") { d.n = n; d.d = ds; } else { d.nde = n; d.dde = ds; } d.price = $("#e-p").value; d.on = $("#e-on").checked; };
  $$("#drawer [data-tab]").forEach(b => b.onclick = () => { keep(); tab = b.dataset.tab; draw(); });
  $$("#drawer [data-fl]").forEach(b => b.onclick = () => { keep(); const f = b.dataset.fl; d.flags = d.flags.includes(f) ? d.flags.replace(f, "") : d.flags + f; draw(); });
  $("#drawer .drop input").onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const l = $("#drawer .drop"); l.style.backgroundImage = `url(${rd.result})`; l.classList.add("has"); }; rd.readAsDataURL(f); };
  $("#e-save").onclick = () => { keep(); if (!d.n.trim()) { $("#e-n").focus(); return toast("Manca il nome del piatto.", "warning"); } if (isNew) c.dishes.push(d); else c.dishes[i] = d; closeAll(); refresh(); toast(isNew ? `${esc(d.n)} aggiunto alla carta.` : "Piatto salvato. La carta sul sito è aggiornata."); };
  const del = $("#e-del"); if (del) del.onclick = () => { const old = c.dishes.splice(i, 1)[0]; closeAll(); refresh(); toast(`${esc(old.n)} tolto dalla carta.`, "trash", () => { c.dishes.splice(i, 0, old); refresh(); }); };
 };
 draw(); openPanel("#drawer");
}

/* ---------- catch of the day ---------- */
function rFish() {
 const f = S.fish;
 $("#v-fish").innerHTML = `
  <div class="fish-g">
   <div class="card"><div class="card-h"><h2>Il pescato di oggi</h2><span class="sp"></span><label class="sw" title="Mostra sul sito"><input type="checkbox" id="f-on" ${f.on ? "checked" : ""} aria-label="Mostra sul sito"><span></span></label></div>
    <div class="card-b" style="display:grid;gap:16px">
     <label class="drop ${f.img ? "has" : ""}" style="background-image:url('${f.img}')"><input type="file" accept="image/*" id="f-img" aria-label="Foto del pescato"><span><i class="ph ph-camera" style="font-size:26px"></i><br>Scattate o caricate la foto del banco</span></label>
     ${f.sample ? `<p class="mute" style="margin:-6px 0 0;font-size:13px"><i class="ph ph-info"></i> Foto di esempio: sostituitela con quella di oggi.</p>` : ""}
     <div class="grid2"><label class="f">Titolo<input class="in" id="f-t" value="${esc(f.t)}" placeholder="Il pescato di oggi"></label><label class="f">Titel (Deutsch)<input class="in" id="f-tde" value="${esc(f.tde)}" placeholder="Der Fang des Tages"></label></div>
     <div class="grid2"><label class="f">Cosa c'è oggi<textarea class="in" id="f-p" placeholder="Scrivete il pesce arrivato stamattina">${esc(f.p)}</textarea></label><label class="f">Was es heute gibt<textarea class="in" id="f-pde" placeholder="Auf Deutsch">${esc(f.pde)}</textarea></label></div>
     <label class="f">Prezzo <small>Facoltativo, per esempio "al kg" o "all'etto"</small><input class="in" id="f-price" value="${esc(f.price)}"></label>
     <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn pri" id="f-save"><i class="ph ph-paper-plane-tilt"></i>Pubblica sul sito</button></div>
    </div></div>
   <div><div class="prev-l">Come appare sul sito</div>
    <div class="post"><div class="im" id="f-prev-img" style="background-image:url('${f.img}')"></div><div class="tx"><small>Oggi dal mercato</small><h4 id="f-prev-t">${esc(f.t) || "Il pescato di oggi"}</h4><p id="f-prev-p">${esc(f.p) || "Qui comparirà il testo che scrivete."}</p></div></div>
   </div>
  </div>`;
 const live = () => { $("#f-prev-t").textContent = $("#f-t").value || "Il pescato di oggi"; $("#f-prev-p").textContent = $("#f-p").value || "Qui comparirà il testo che scrivete."; };
 ["#f-t", "#f-p"].forEach(s => $(s).oninput = live);
 $("#f-img").onchange = e => { const file = e.target.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { f.img = rd.result; f.sample = false; $(".drop").style.backgroundImage = `url(${rd.result})`; $("#f-prev-img").style.backgroundImage = `url(${rd.result})`; }; rd.readAsDataURL(file); };
 $("#f-on").onchange = e => { f.on = e.target.checked; save(); toast(f.on ? "Il pescato è visibile sul sito." : "Il pescato è nascosto dal sito.", f.on ? "eye" : "eye-slash"); };
 $("#f-save").onclick = () => { Object.assign(f, { t: $("#f-t").value, tde: $("#f-tde").value, p: $("#f-p").value, pde: $("#f-pde").value, price: $("#f-price").value }); save(); toast("Pubblicato. Il sito mostra il pescato di oggi.", "paper-plane-tilt"); };
}

/* ---------- hours and rules ---------- */
function rHours() {
 const R = S.rules;
 $("#v-hours").innerHTML = `
  <div class="ov-g">
   <div class="card"><div class="card-h"><h2>Orari settimanali</h2><span class="sp"></span><span class="mute" style="font-size:13px">Il sito accetta prenotazioni solo in questi orari</span></div><div class="card-b week">
    ${S.week.map((w, i) => `<div class="wrow ${w.open ? "" : "closed"}"><b>${new Date(2024, 0, 1 + ((w.d + 6) % 7)).toLocaleDateString("it-IT", { weekday: "long" })}</b><label class="sw"><input type="checkbox" data-wk="${i}" ${w.open ? "checked" : ""} aria-label="Aperto"><span></span></label>
     <div class="range"><span class="mute" style="font-size:13px;width:52px">Pranzo</span><input class="num" data-wr="${i}.l.0" value="${w.l[0]}"><span class="mute">-</span><input class="num" data-wr="${i}.l.1" value="${w.l[1]}"></div>
     <div class="range"><span class="mute" style="font-size:13px;width:52px">Cena</span><input class="num" data-wr="${i}.c.0" value="${w.c[0]}"><span class="mute">-</span><input class="num" data-wr="${i}.c.1" value="${w.c[1]}"></div></div>`).join("")}
   </div></div>
   <div style="display:grid;gap:16px;align-content:start">
    <div class="card"><div class="card-h"><h2>Chiusure e ferie</h2></div><div class="card-b">
     ${S.closures.length ? S.closures.map((c, i) => `<div class="clos"><i class="ph ph-calendar-x"></i><div><b>${esc(c.why || "Chiuso")}</b><br><small class="mute">${dayName(c.from, { day: "numeric", month: "long" })}${c.to && c.to !== c.from ? " - " + dayName(c.to, { day: "numeric", month: "long" }) : ""}</small></div><button class="icon-btn" data-delc="${i}" aria-label="Elimina" style="width:34px;height:34px"><i class="ph ph-x"></i></button></div>`).join("") : `<p class="mute" style="margin:0 0 14px;font-size:14px">Nessuna chiusura in programma. In quei giorni il sito non accetta prenotazioni.</p>`}
     <div class="grid2" style="margin-top:8px"><label class="f">Dal<input class="in" type="date" id="c-from" min="${TODAY}"></label><label class="f">Al<input class="in" type="date" id="c-to" min="${TODAY}"></label></div>
     <div style="display:flex;gap:10px;margin-top:12px"><input class="in" id="c-why" placeholder="Motivo (es. ferie)"><button class="btn sec" id="c-add"><i class="ph ph-plus"></i>Aggiungi</button></div>
    </div></div>
    <div class="card"><div class="card-h"><h2>Regole di prenotazione</h2></div><div class="card-b">
     <div class="setrow"><div><b>Prenotazioni online</b><small>Il modulo sul sito è attivo</small></div><label class="sw"><input type="checkbox" data-rule="online" ${R.online ? "checked" : ""}><span></span></label></div>
     <div class="setrow"><div><b>Conferma automatica</b><small>Confermate subito i tavoli piccoli, gli altri restano da confermare</small></div><label class="sw"><input type="checkbox" data-rule="auto" ${R.auto ? "checked" : ""}><span></span></label></div>
     <div class="setrow"><div><b>Fino a quante persone</b><small>Oltre, la richiesta aspetta voi</small></div><input class="in num" type="number" min="1" data-rule="autoMax" value="${R.autoMax}"></div>
     <div class="setrow"><div><b>Coperti per fascia oraria</b><small>Oltre questo numero il sito propone un altro orario</small></div><input class="in num" type="number" min="1" data-rule="cap" value="${R.cap}"></div>
     <div class="setrow"><div><b>Preavviso minimo</b><small>Ore prima del servizio</small></div><input class="in num" type="number" min="0" data-rule="notice" value="${R.notice}"></div>
     <div class="setrow"><div><b>SMS di conferma</b><small>Nella lingua del cliente, italiano o tedesco</small></div><label class="sw"><input type="checkbox" data-rule="sms" ${R.sms ? "checked" : ""}><span></span></label></div>
    </div></div>
    <div class="card"><div class="card-b" style="display:flex;align-items:center;gap:14px"><i class="ph ph-arrow-counter-clockwise" style="font-size:22px;color:var(--mute)"></i><div style="flex:1"><b>Dati di esempio</b><br><small class="mute">Questa demo salva tutto solo in questo browser.</small></div><button class="btn sec sm" id="reset">Ripristina</button></div></div>
   </div>
  </div>`;
 $("#c-add").onclick = () => { const from = $("#c-from").value; if (!from) return toast("Scegliete almeno il primo giorno.", "warning"); S.closures.push({ from, to: $("#c-to").value || from, why: $("#c-why").value.trim() }); refresh(); toast("Chiusura aggiunta. Il sito non accetta prenotazioni in quei giorni.", "calendar-x"); };
 $("#reset").onclick = () => { S = demo(); S.ui.view = "hours"; refresh(); toast("Dati di esempio ripristinati.", "arrow-counter-clockwise"); };
}

/* ---------- events ---------- */
document.addEventListener("click", e => {
 const t = e.target;
 const g = t.closest("[data-go]"); if (g) { if (g.dataset.status) S.ui.status = g.dataset.status; go(g.dataset.go); return; }
 const s = t.closest("[data-set]"); if (s) { e.stopPropagation(); setStatus(s.dataset.id, s.dataset.set); return; }
 if (t.closest("[data-close]") || t === $("#scrim")) { closeAll(); return; }
 const o = t.closest("[data-open]"); if (o) { openRes(o.dataset.open); return; }
 if (t.closest("[data-new]")) { openNew(); return; }
 const d = t.closest("[data-day]"); if (d) { S.ui.day = d.dataset.day; refresh(); return; }
 const sv = t.closest("[data-svc]"); if (sv) { S.ui.svc = sv.dataset.svc; pick = null; refresh(); return; }
 const st = t.closest("[data-status]"); if (st) { S.ui.status = st.dataset.status; refresh(); return; }
 if (t.closest("#clearq")) { $("#q").value = ""; refresh(); return; }
 const pk = t.closest("[data-pick]"); if (pk) { pick = pick === pk.dataset.pick ? null : pk.dataset.pick; rFloor(); return; }
 const tb = t.closest("[data-tb]"); if (tb) {
  const id = tb.dataset.tb, sv2 = S.ui.svc === "all" ? "cena" : S.ui.svc;
  const occ = S.res.find(r => r.date === S.ui.day && svc(r.time) === sv2 && r.table === id && active(r));
  if (occ) return openRes(occ.id);
  if (pick) { const r = S.res.find(x => x.id === pick), tt = S.tables.find(x => x.id === id); r.table = id; pick = null; refresh(); toast(`${esc(r.name)} al tavolo ${id}.${tt.seats < r.people ? " Attenzione: il tavolo ha " + tt.seats + " posti." : ""}`, tt.seats < r.people ? "warning" : "check-circle"); }
  return;
 }
 const c = t.closest("[data-cat]"); if (c) { S.ui.cat = +c.dataset.cat; refresh(); return; }
 const mv = t.closest("[data-mv]"); if (mv) { const a = S.menu[S.ui.cat].dishes, i = +mv.dataset.i, j = i + +mv.dataset.mv; [a[i], a[j]] = [a[j], a[i]]; refresh(); return; }
 const ed = t.closest("[data-edit]"); if (ed) { editDish(+ed.dataset.edit); return; }
 const pl = t.closest("[data-pl]"); if (pl) { S.ui.plang = pl.dataset.pl; refresh(); return; }
 const dc = t.closest("[data-delc]"); if (dc) { S.closures.splice(+dc.dataset.delc, 1); refresh(); toast("Chiusura eliminata.", "trash"); return; }
});
document.addEventListener("change", e => {
 const t = e.target, d = S.menu[S.ui.cat]?.dishes;
 if (t.dataset.price !== undefined) { d[+t.dataset.price].price = t.value.trim(); refresh(); toast("Prezzo salvato."); }
 if (t.dataset.on !== undefined) { const x = d[+t.dataset.on]; x.on = t.checked; refresh(); toast(x.on ? `${esc(x.n)} di nuovo disponibile.` : `${esc(x.n)} finito per oggi: sul sito non compare.`, x.on ? "eye" : "eye-slash"); }
 if (t.dataset.wk !== undefined) { S.week[+t.dataset.wk].open = t.checked; refresh(); }
 if (t.dataset.wr !== undefined) { const [i, k, j] = t.dataset.wr.split("."); S.week[+i][k][+j] = t.value; save(); toast("Orari salvati."); }
 if (t.dataset.rule !== undefined) { S.rules[t.dataset.rule] = t.type === "checkbox" ? t.checked : +t.value; save(); toast("Regola salvata."); if (t.dataset.rule === "online") $(".live span").textContent = t.checked ? "Prenotazioni online attive" : "Prenotazioni online in pausa"; }
});
$("#q").addEventListener("input", () => { if (S.ui.view !== "res") go("res"); else rRes(); });
$("#fab").onclick = openNew;
$("#sheet").addEventListener("click", nbClick);
$("#bell").onclick = () => { S.ui.status = "pending"; S.ui.day = TODAY; go("res"); };
addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); if (e.key === "n" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$("#sheet").classList.contains("on")) { e.preventDefault(); openNew(); } });
(() => {
 // ?tema=scuro or ?tema=chiaro in the link wins over the last choice in this browser
 const q = new URLSearchParams(location.search).get("tema");
 let th = q ? (q === "scuro" ? "dark" : "light") : null;
 if (!th) try { th = localStorage.getItem("mc-admin-theme"); } catch (e) {}
 if (th) document.documentElement.dataset.theme = th;
 $("#theme").onclick = () => {
  const th = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = th; icon();
  try { localStorage.setItem("mc-admin-theme", th); } catch (e) {}
 };
 const icon = () => { const d = document.documentElement.dataset.theme === "dark"; $("#theme").innerHTML = `<i class="ph ph-${d ? "sun" : "moon"}"></i>`; $('meta[name="theme-color"]').content = d ? "#0b1716" : "#f3f4f2"; };
 icon();
})();
$("#today").textContent = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
go(S.ui.view || "overview");
