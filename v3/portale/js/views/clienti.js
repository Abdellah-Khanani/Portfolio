import {view, render, S, db, icon, dayBadge, isoDate, num, toast, sheet, day } from "../app.js";
import { el, chip } from "./turno.js";

const STATUS = [
  ["da_inviare", "Da inviare", "var(--ink3)"], ["inviata", "Inviata", "var(--blue)"], ["risposto", "Ha risposto", "var(--cyan)"],
  ["trattativa", "Trattativa", "var(--amber)"], ["chiuso", "Chiuso", "var(--mint)"], ["perso", "Perso", "var(--red)"],
];
const SECTORS = [
  ["ristoranti-aa", "Ristoranti Alto Adige", "var(--blue)"], ["ristoranti-nord", "Ristoranti Nord", "var(--violet)"],
  ["videogiochi", "Negozi videogiochi", "var(--mint)"], ["videogiochi-bz", "Videogiochi Bolzano", "var(--cyan)"],
  ["collab-ps5", "Collab PS5", "var(--pink)"], ["altro", "Altro", "var(--amber)"],
];
const CHANNELS = [["mail", "Mail"], ["whatsapp", "WhatsApp"], ["instagram", "Instagram"], ["telefono", "Telefono"], ["altro", "Altro"]];
const NEXT = { da_inviare: "inviata", inviata: "risposto", risposto: "trattativa", trattativa: "chiuso" };
const sLabel = Object.fromEntries(STATUS.map((s) => [s[0], s[1]]));
const sColor = Object.fromEntries(STATUS.map((s) => [s[0], s[2]]));
const secColor = Object.fromEntries(SECTORS.map((s) => [s[0], s[2]]));
const secLabel = Object.fromEntries(SECTORS.map((s) => [s[0], s[1]]));

let sectorF = "all", query = "", dragId = null;

const initials = (n) => (n || "?").replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
const digits = (s) => (s || "").replace(/\D/g, "");

function moveTo(l, st) {
  if (l.statusRaw === st) return;
  const f = { statusRaw: st };
  const now = new Date();
  if (st === "inviata") { f.sentAt = l.sentAt || now; f.followUp = l.followUp || new Date(new Date(f.sentAt).getTime() + 5 * 864e5); }
  if (st === "risposto") { f.replyAt = now; f.followUp = null; }
  db.save("leads", l.id, f, l).then(() => toast(`${l.name}: ${sLabel[st]}`));
}

function form(l) {
  const isNew = !l;
  const o = l || { name: "", city: "", sectorRaw: sectorF !== "all" ? sectorF : "altro", email: "", whatsapp: "", link: "", channel: "mail", statusRaw: "da_inviare", note: "" };
  const ch = CHANNELS.some((c) => c[0] === o.channel) ? CHANNELS : [...CHANNELS, [o.channel, o.channel]];
  sheet(isNew ? "Nuovo contatto" : o.name, [
    { name: "name", label: "Nome", value: o.name, required: true },
    { name: "city", label: "Città", value: o.city },
    { name: "sectorRaw", label: "Settore", type: "select", value: o.sectorRaw, options: SECTORS.map((s) => [s[0], s[1]]) },
    { name: "statusRaw", label: "Fase", type: "select", value: o.statusRaw, options: STATUS.map((s) => [s[0], s[1]]) },
    { name: "email", label: "Mail", type: "email", value: o.email },
    { name: "whatsapp", label: "WhatsApp", type: "tel", value: o.whatsapp, placeholder: "+39 …" },
    { name: "link", label: "Sito o profilo", value: o.link, placeholder: "https://" },
    { name: "channel", label: "Canale", type: "select", value: o.channel, options: ch },
    { name: "sentAt", label: "Inviata il", type: "date", value: isoDate(o.sentAt) },
    { name: "followUp", label: "Sollecito il", type: "date", value: isoDate(o.followUp) },
    { name: "replyAt", label: "Risposta il", type: "date", value: isoDate(o.replyAt) },
    { name: "note", label: "Note", type: "textarea", value: o.note },
  ], (v) => db.save("leads", l?.id || db.newId(), v, l), l ? { onDelete: () => db.remove("leads", l.id), deleteText: `Eliminare ${l.name}?` } : {});
}

function card(l) {
  const c = secColor[l.sectorRaw] || "var(--ink3)";
  const acts = [];
  if (l.email) acts.push(el("a", { class: "cl-ic", href: "mailto:" + l.email, title: "Scrivi a " + l.email, "aria-label": "Scrivi una mail a " + l.name, onclick: (e) => e.stopPropagation() }, icon("mail", 15)));
  if (digits(l.whatsapp)) acts.push(el("a", { class: "cl-ic", href: "https://wa.me/" + digits(l.whatsapp), target: "_blank", rel: "noopener", title: "WhatsApp", "aria-label": "WhatsApp a " + l.name, onclick: (e) => e.stopPropagation() }, icon("spark", 15)));
  if (l.link) acts.push(el("a", { class: "cl-ic", href: /^https?:/.test(l.link) ? l.link : "https://" + l.link, target: "_blank", rel: "noopener", title: "Apri link", "aria-label": "Apri il link di " + l.name, onclick: (e) => e.stopPropagation() }, icon("link", 15)));
  const nx = NEXT[l.statusRaw];
  const n = el("div", { class: "cl-card", draggable: "true", tabindex: "0", role: "button", "aria-label": `${l.name}, ${sLabel[l.statusRaw] || ""}. Apri scheda`,
    style: { "--c": c }, onclick: () => form(l), onkeydown: (e) => { if (e.key === "Enter" && e.target === n) form(l); },
    ondragstart: (e) => { dragId = l.id; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.id); setTimeout(() => n.classList.add("drag"), 0); },
    ondragend: () => { dragId = null; n.classList.remove("drag"); document.querySelectorAll(".cl-col.over").forEach((x) => x.classList.remove("over")); } },
    el("div", { class: "row cl-top" }, el("span", { class: "cl-av", "aria-hidden": "true" }, initials(l.name)),
      el("div", { class: "cl-nm" }, el("div", { class: "t" }, l.name), el("div", { class: "s" }, [l.city, secLabel[l.sectorRaw]].filter(Boolean).join(" · "))),
      l.statusRaw === "inviata" && l.followUp ? dayBadge(l.followUp) : null),
    l.note ? el("div", { class: "cl-note" }, l.note) : null,
    el("div", { class: "row cl-bot" }, acts, el("span", { class: "spacer" }),
      nx ? el("button", { type: "button", class: "cl-next", title: "Sposta in " + sLabel[nx], "aria-label": `Sposta ${l.name} in ${sLabel[nx]}`, onclick: (e) => { e.stopPropagation(); moveTo(l, nx); } }, sLabel[nx], icon("arrow", 14)) : null));
  return n;
}

view("clienti", { title: "Clienti", icon: "clienti", order: 3, render(root) {
  const all = S.leads;
  const q = query.trim().toLowerCase();
  const match = (l) => (sectorF === "all" || l.sectorRaw === sectorF) && (!q || [l.name, l.city, l.email, l.note].join(" ").toLowerCase().includes(q));
  const shown = all.filter(match);
  const cnt = (st) => all.filter((l) => l.statusRaw === st && (sectorF === "all" || l.sectorRaw === sectorF)).length;
  const tot = STATUS.reduce((s, x) => s + cnt(x[0]), 0) || 1;

  const head = el("div", { class: "row cl-head" }, el("h1", { class: "h1" }, "Clienti"), el("span", { class: "spacer" }),
    el("button", { type: "button", class: "btn primary", onclick: () => form(null) }, icon("plus", 16), "Contatto"));

  const tiles = el("div", { class: "cl-tiles" }, STATUS.map(([k, label, c]) => el("div", { class: "card cl-tile", style: { "--c": c } },
    num("cl-" + k + sectorF, cnt(k), undefined, "mid"), el("div", { class: "small" }, label))));
  const seg = el("div", { class: "cl-seg", role: "img", "aria-label": "Distribuzione dei contatti per fase" },
    STATUS.map(([k, , c]) => el("i", { style: { "--w": (cnt(k) / tot) * 100 + "%", background: c }, title: `${sLabel[k]}: ${cnt(k)}` })));

  const chips = el("div", { class: "cl-chips", role: "group", "aria-label": "Filtro per settore" },
    [["all", "Tutti", "var(--ink2)"], ...SECTORS].map(([k, label, c]) => {
      const n = k === "all" ? all.length : all.filter((l) => l.sectorRaw === k).length;
      return el("button", { type: "button", class: "cl-chip" + (sectorF === k ? " on" : ""), style: { "--c": c }, "aria-pressed": String(sectorF === k),
        onclick: () => { sectorF = k; render(); } }, label, el("b", {}, n));
    }));
  const search = el("input", { type: "search", class: "cl-search", placeholder: "Cerca nome, città, mail", "aria-label": "Cerca contatti",
    oninput: (e) => { query = e.target.value; const pos = e.target.selectionStart; render(); const i = document.querySelector(".cl-search"); i?.focus(); i?.setSelectionRange(pos, pos); } });
  search.value = query;

  const board = el("div", { class: "cl-board" }, STATUS.map(([k, label, c]) => {
    const items = shown.filter((l) => l.statusRaw === k).sort((a, b) => (a.followUp ? +new Date(a.followUp) : 9e15) - (b.followUp ? +new Date(b.followUp) : 9e15));
    const col = el("section", { class: "cl-col" + (items.length ? "" : " blank"), style: { "--c": c }, "aria-label": label,
      ondragover: (e) => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; col.classList.add("over"); },
      ondragleave: (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove("over"); },
      ondrop: (e) => { e.preventDefault(); col.classList.remove("over"); const l = S.leads.find((x) => x.id === (dragId || e.dataTransfer.getData("text/plain"))); dragId = null; if (l) moveTo(l, k); } },
      el("header", { class: "cl-colh" }, el("i", { class: "cl-dot" }), el("b", {}, label), chip(String(items.length), c)),
      el("div", { class: "cl-cards" }, items.length ? items.map(card) : el("div", { class: "cl-drop small" }, "Trascina qui")));
    return col;
  }));

  root.append(head, tiles, seg, el("div", { class: "cl-filters" }, chips, search),
    shown.length ? board : el("div", { class: "card empty" }, all.length ? "Nessun contatto con questi filtri." : "Ancora nessun contatto. Aggiungine uno."));
} });
