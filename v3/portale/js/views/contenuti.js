// Contenuti — pianificatore dei post social: calendario mensile, filtri per stato, spunti.
import { view, el, icon, S, db, num, chip, toast, sheet, isoDate, fromIso, render } from "../app.js";

const PLATFORMS = { instagram: ["Instagram", "var(--pink)"], tiktok: ["TikTok", "var(--cyan)"], linkedin: ["LinkedIn", "var(--blue)"], youtube: ["YouTube", "var(--red)"] };
const FORMATS = [["carosello", "Carosello"], ["reel", "Reel"], ["storia", "Storia"], ["post", "Post"], ["video", "Video"]];
const STATUS = { idea: ["Idea", "var(--ink3)"], bozza: ["Bozza", "var(--amber)"], pronto: ["Pronto", "var(--mint)"], pubblicato: ["Pubblicato", "var(--blue)"] };
const SPUNTI = [
  ["Prima e dopo: il sito di un ristorante", "carosello"], ["Dietro le quinte di uno shooting", "reel"],
  ["Come uso lo studio grafiche in 30 secondi", "reel"], ["Il menu di Romer Bistro: dal file alla stampa", "carosello"],
  ["3 errori che vedo nei siti dei ristoranti", "carosello"], ["Un giorno da freelance a Bolzano", "storia"],
];
const WD = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const first = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
let month = first(new Date()), filter = "tutti", selected = isoDate(new Date()), dragPost = null;
const status = (p) => (STATUS[p.status] ? p.status : "idea");
const plat = (p) => PLATFORMS[p.platform] || PLATFORMS.instagram;
const isMobile = () => matchMedia("(max-width: 700px)").matches;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pdate = (p) => (p.date ? isoDate(new Date(p.date)) : "");

function postSheet(p, date) {
  sheet(p ? "Modifica post" : "Nuovo post", [
    { name: "title", label: "Titolo", value: p?.title, required: true },
    { name: "caption", label: "Didascalia", type: "textarea", rows: 6, value: p?.caption },
    { name: "platform", label: "Piattaforma", type: "select", value: p?.platform || "instagram", options: Object.entries(PLATFORMS).map(([k, v]) => [k, v[0]]) },
    { name: "format", label: "Formato", type: "select", value: p?.format || "carosello", options: FORMATS },
    { name: "status", label: "Stato", type: "select", value: p ? status(p) : date ? "bozza" : "idea", options: Object.entries(STATUS).map(([k, v]) => [k, v[0]]) },
    { name: "date", label: "Data di pubblicazione", type: "date", value: p ? pdate(p) : date || "" },
    { name: "link", label: "Link", type: "url", value: p?.link, placeholder: "https://" },
  ], (v) => db.save("posts", p?.id, { ...v, createdAt: p?.createdAt || new Date() }, p),
  p ? { onDelete: () => db.remove("posts", p.id), deleteText: "Eliminare questo post?" } : {});
  const ta = document.getElementById("f_caption"), pf = document.getElementById("f_platform");
  if (!ta) return;
  const count = el("small", { class: "ct-count", "aria-live": "polite" });
  ta.parentElement.append(count);
  const upd = () => { const n = ta.value.length, over = pf.value === "instagram" && n > 2200;
    count.textContent = pf.value === "instagram" ? `${n} / 2200 caratteri` + (over ? " · troppo lungo per Instagram" : "") : `${n} caratteri`; count.classList.toggle("warn", over); };
  ta.addEventListener("input", upd); pf.addEventListener("change", upd); upd();
}

function schedule(id, iso) {
  const p = S.posts.find((x) => x.id === id); if (!p || pdate(p) === iso) return;
  db.save("posts", id, { date: fromIso(iso) }, p);
}

function pill(p) {
  const [pn, pc] = plat(p), st = status(p);
  const n = el("button", { class: "ct-pill s-" + st, type: "button", draggable: "true", style: { "--c": pc }, title: `${p.title} · ${pn} · ${STATUS[st][0]}`,
    onclick: (e) => { e.stopPropagation(); postSheet(p); },
    ondragstart: (e) => { e.stopPropagation(); dragPost = p.id; e.dataTransfer.setData("text/plain", p.id); e.dataTransfer.effectAllowed = "move"; requestAnimationFrame(() => n.classList.add("drag")); document.body.classList.add("ct-dragging"); },
    ondragend: () => { dragPost = null; n.classList.remove("drag"); document.body.classList.remove("ct-dragging"); document.querySelectorAll(".ct-cell.over").forEach((c) => c.classList.remove("over")); } },
  el("i"), el("span", {}, p.title));
  return n;
}

function calendar(posts) {
  const y = month.getFullYear(), m = month.getMonth(), lead = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
  const weeks = Math.ceil((lead + dim) / 7), today = isoDate(new Date()), byDay = new Map();
  posts.forEach((p) => { const k = pdate(p); if (k) byDay.set(k, [...(byDay.get(k) || []), p]); });
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(y, m, 1 - lead + i), iso = isoDate(d), out = d.getMonth() !== m, list = byDay.get(iso) || [];
    const c = el("div", { class: "ct-cell" + (out ? " out" : "") + (iso === today ? " today" : "") + (iso === selected ? " sel" : ""), role: "button", tabindex: "0",
      "aria-label": `${d.getDate()} ${d.toLocaleDateString("it-IT", { month: "long" })}, ${list.length} post. Aggiungi un post`,
      onclick: () => { selected = iso; if (isMobile()) render(); else postSheet(null, iso); },
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.click(); } },
      ondragover: (e) => { if (!dragPost) return; e.preventDefault(); c.classList.add("over"); },
      ondragleave: (e) => { if (!c.contains(e.relatedTarget)) c.classList.remove("over"); },
      ondrop: (e) => { e.preventDefault(); c.classList.remove("over"); const id = dragPost || e.dataTransfer.getData("text/plain"); if (id) { schedule(id, iso); if (out) { month = first(d); } } } },
    el("span", { class: "ct-dn" }, String(d.getDate())),
    el("div", { class: "ct-pills" }, list.slice(0, 3).map(pill), list.length > 3 ? el("span", { class: "ct-more" }, `+${list.length - 3}`) : null),
    el("div", { class: "ct-dots" }, list.map((p) => el("i", { style: { background: plat(p)[1] } }))),
    el("span", { class: "ct-add" }, icon("plus", 14)));
    cells.push(c);
  }
  return el("div", { class: "ct-cal" }, el("div", { class: "ct-wd" }, WD.map((w) => el("span", {}, w))), el("div", { class: "ct-grid", style: { "--rows": weeks } }, cells));
}

function row(p) {
  const [pn, pc] = plat(p), st = status(p);
  const r = el("button", { class: "ct-row", type: "button", draggable: "true", onclick: () => postSheet(p), "aria-label": `Modifica ${p.title}`,
    ondragstart: (e) => { dragPost = p.id; e.dataTransfer.setData("text/plain", p.id); e.dataTransfer.effectAllowed = "move"; document.body.classList.add("ct-dragging"); },
    ondragend: () => { dragPost = null; document.body.classList.remove("ct-dragging"); } },
  el("i", { class: "ct-pd", style: { background: pc } }), el("span", { class: "ct-rt" }, el("b", {}, p.title), el("small", {}, `${pn} · ${FORMATS.find((f) => f[0] === p.format)?.[1] || p.format}`)),
  chip(STATUS[st][0], STATUS[st][1]));
  return r;
}

view("contenuti", { title: "Contenuti", icon: "contenuti", order: 6, render(root) {
  const all = S.posts, counts = { tutti: all.length }; Object.keys(STATUS).forEach((k) => (counts[k] = all.filter((p) => status(p) === k).length));
  const posts = filter === "tutti" ? all : all.filter((p) => status(p) === filter);
  const label = cap(month.toLocaleDateString("it-IT", { month: "long", year: "numeric" }));
  const inMonth = all.filter((p) => { const d = p.date && new Date(p.date); return d && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
  const undated = posts.filter((p) => !p.date);
  const go = (n) => { month = new Date(month.getFullYear(), month.getMonth() + n, 1); render(); };

  root.append(el("div", { class: "ct-head" }, el("h1", { class: "h1" }, "Contenuti"), el("span", { class: "spacer" }),
    el("button", { class: "btn primary", type: "button", onclick: () => postSheet(null, isoDate(new Date())) }, icon("plus", 16), "Nuovo post")));

  root.append(el("div", { class: "ct-filters", role: "group", "aria-label": "Filtra per stato" },
    [["tutti", "Tutti", "var(--ink2)"], ...Object.entries(STATUS).map(([k, v]) => [k, v[0], v[1]])].map(([k, l, c]) =>
      el("button", { class: "ct-f" + (filter === k ? " on" : ""), type: "button", style: { "--c": c }, "aria-pressed": String(filter === k), onclick: () => { filter = k; render(); } },
        l, el("b", {}, String(counts[k]))))));

  const calCard = el("section", { class: "card ct-calcard", "aria-label": "Calendario" },
    el("div", { class: "ct-bar" },
      el("button", { class: "ct-nav", type: "button", "aria-label": "Mese precedente", onclick: () => go(-1) }, icon("arrow", 16)),
      el("h2", { class: "ct-month" }, label), el("button", { class: "ct-nav next", type: "button", "aria-label": "Mese successivo", onclick: () => go(1) }, icon("arrow", 16)),
      el("span", { class: "spacer" }), el("span", { class: "small ct-mc" }, num("ct-m", inMonth.length, (v) => Math.round(v), "ct-mn"), " nel mese"),
      el("button", { class: "btn sm", type: "button", onclick: () => { month = first(new Date()); selected = isoDate(new Date()); render(); } }, "Oggi")),
    calendar(posts),
    el("div", { class: "ct-legend" }, Object.values(PLATFORMS).map(([n, c]) => el("span", {}, el("i", { style: { background: c } }), n))));

  const dayList = posts.filter((p) => pdate(p) === selected);
  const dayCard = el("section", { class: "card ct-day" }, el("div", { class: "row" }, el("h2", { class: "ct-h" }, cap(fromIso(selected).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }))),
    el("span", { class: "spacer" }), el("button", { class: "btn sm primary", type: "button", onclick: () => postSheet(null, selected) }, icon("plus", 14), "Aggiungi post")),
  dayList.length ? el("div", { class: "ct-rows" }, dayList.map(row)) : el("p", { class: "small" }, "Nessun post in questo giorno."));

  const spunti = el("section", { class: "card ct-side" }, el("h2", { class: "ct-h" }, icon("spark", 16), "Spunti"),
    el("p", { class: "small" }, "Un tocco crea un'idea senza data, pronta da sviluppare."),
    el("div", { class: "ct-spunti" }, SPUNTI.map(([t, f]) => el("button", { class: "ct-sp", type: "button",
      onclick: () => { db.save("posts", null, { title: t, caption: "", platform: "instagram", format: f, date: null, status: "idea", link: "", createdAt: new Date() }); toast("Idea aggiunta tra i post senza data"); } },
    icon("plus", 14), t))));

  const nodate = el("section", { class: "card ct-side" }, el("h2", { class: "ct-h" }, "Senza data", el("span", { class: "id-cnt" }, String(undated.length))),
    undated.length ? el("div", { class: "ct-rows" }, undated.map(row), el("p", { class: "small" }, "Trascinane uno sul calendario per programmarlo.")) : el("p", { class: "small" }, "Nessun post senza data."));

  root.append(el("div", { class: "ct-layout" }, el("div", { class: "ct-main" }, calCard, dayCard), el("div", { class: "ct-aside" }, nodate, spunti)));
} });
