// AK Portale — shell, live store, router and shared UI helpers.
import { onUser, login, logout, resetPassword, watch, watchDoc, save, remove, newId, auth } from "./fb.js";

// ---------- live store ----------
export const S = { user: null, ready: {}, settings: null, business: null };
export const COLS = ["leads", "jobs", "tasks", "transactions", "debts", "planned", "bando", "profiles",
  "ideas", "posts", "research", "docs", "requests", "approvals"];
COLS.forEach((c) => (S[c] = []));
let unsubs = [];
let renderQueued = false;
function changed() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render(); });
}
function startStore() {
  stopStore();
  COLS.forEach((c) => unsubs.push(watch(c, (items) => { S[c] = items; S.ready[c] = true; changed(); },
    (e) => { if (e.code === "permission-denied") toast("Accesso negato al database: questo account non è autorizzato.", "err"); })));
  unsubs.push(watchDoc("settings", "main", (d) => { S.settings = d; changed(); }));
  unsubs.push(watchDoc("business", "profile", (d) => { S.business = d; changed(); }));
}
function stopStore() { unsubs.forEach((u) => u()); unsubs = []; }

// Demo mode (localhost + ?demo): data from demo-data.json (gitignored), writes stay in memory.
export const DEMO = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has("demo");
const parseDates = (o) => { for (const k in o) if (typeof o[k] === "string" && /^\d{4}-\d{2}-\d{2}/.test(o[k])) o[k] = new Date(o[k]); return o; };
async function startDemo() {
  const d = await (await fetch("demo-data.json")).json();
  COLS.forEach((c) => { S[c] = (d[c] || []).map(parseDates); S.ready[c] = true; });
  S.settings = parseDates({ id: "main", ...d.settings });
  S.business = null;
  route();
}
export const db = DEMO ? {
  newId,
  async save(col, id, fields, existing) {
    id = id || newId();
    if (col === "settings" || col === "business") { S[col === "settings" ? "settings" : "business"] = { ...(existing || {}), ...fields, id }; changed(); return id; }
    const arr = S[col] || (S[col] = []);
    const i = arr.findIndex((x) => x.id === id);
    const item = { ...(i >= 0 ? arr[i] : {}), ...fields, id, updatedAt: new Date() };
    if (i >= 0) arr[i] = item; else arr.push(item);
    changed(); return id;
  },
  async remove(col, id) { S[col] = (S[col] || []).filter((x) => x.id !== id); changed(); },
} : { save, remove, newId };

// ---------- views ----------
const VIEWS = new Map();
/** Register a section: { title, icon (svg path id), order, render(root) } */
export function view(id, def) { VIEWS.set(id, def); }
let current = null;

function route() {
  const id = (location.hash || "#turno").slice(1).split("/")[0];
  current = VIEWS.has(id) ? id : "turno";
  render(true);
}
window.addEventListener("hashchange", route);

export function render(scrollTop) {
  if (!S.user) return;
  renderNav();
  const def = VIEWS.get(current);
  const main = document.getElementById("view");
  if (!def || !main) return;
  const keepScroll = !scrollTop && main.dataset.view === current ? window.scrollY : 0;
  main.dataset.view = current;
  main.replaceChildren();
  try { def.render(main); } catch (e) { console.error(e); main.append(el("div", { class: "card" }, "Errore nella sezione: " + e.message)); }
  document.title = def.title + " · AK Portale";
  if (scrollTop) { window.scrollTo(0, 0); main.classList.remove("in"); void main.offsetWidth; main.classList.add("in"); }
  else window.scrollTo(0, keepScroll);
}

function renderNav() {
  const nav = document.getElementById("nav");
  const items = [...VIEWS.entries()].sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99));
  const badge = (id) => (id === "turno" ? S.approvals.filter((a) => a.status === "da_approvare").length : 0);
  nav.replaceChildren(...items.map(([id, v]) => {
    const n = badge(id);
    return el("a", { href: "#" + id, class: "nav-i" + (id === current ? " on" : ""), "aria-current": id === current ? "page" : null },
      icon(v.icon), el("span", {}, v.title), n ? el("b", { class: "nav-n" }, String(n)) : null);
  }));
  const me = document.getElementById("me");
  me.textContent = (S.user.email || "").split("@")[0];
}

// ---------- DOM helpers ----------
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "html") n.innerHTML = v;
    else if (k === "style" && typeof v === "object") for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith("--")) n.style.setProperty(sk, sv); else n.style[sk] = sv; }
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return n;
}
const ICONS = {
  turno: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
  attivita: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
  clienti: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  idee: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z",
  contenuti: "M3 3h18v18H3zM3 9h18M9 21V9",
  soldi: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  bando: "M4 22V4a1 1 0 0 1 1-1h10l-1 4 1 4H5",
  documenti: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  lavori: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  plus: "M12 5v14M5 12h14", check: "M20 6 9 17l-5-5", x: "M18 6 6 18M6 6l12 12", edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  spark: "M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z", mail: "M4 4h16v16H4zM22 6l-10 7L2 6",
  arrow: "M5 12h14M13 6l6 6-6 6", clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
};
export function icon(name, size = 18) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size); s.setAttribute("height", size);
  s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
  s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", ICONS[name] || ICONS.spark);
  s.append(p); return s;
}

// ---------- formatting ----------
const EUR = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const money = (v, sign) => (sign && v > 0 ? "+" : "") + EUR.format(v || 0);
export const day = (d) => (d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—");
export const longDay = (d) => new Date(d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
export function daysTo(d) {
  if (!d) return null;
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(d); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 864e5);
}
export function dayBadge(d) {
  const n = daysTo(d);
  if (n == null) return null;
  const cls = n < 0 ? "late" : n <= 3 ? "soon" : "";
  return el("span", { class: "dday " + cls }, n < 0 ? `D+${-n}` : n === 0 ? "OGGI" : `D-${n}`);
}
export const isoDate = (d) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : "");
export const fromIso = (s) => (s ? new Date(s + "T12:00:00") : null);

/** Animated count-up for a number inside `node`. */
export function countUp(node, value, fmt = (v) => Math.round(v)) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const from = Number(node.dataset.v || 0); node.dataset.v = value;
  if (reduce || from === value) { node.textContent = fmt(value); return node; }
  const t0 = performance.now(), dur = 700;
  const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    node.textContent = fmt(from + (value - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); return node;
}
const lastShown = new Map();
/** Number element that counts up only the first time a given key is shown. */
export function num(key, value, fmt, cls = "big") {
  const n = el("span", { class: cls });
  n.dataset.v = lastShown.has(key) ? lastShown.get(key) : 0; lastShown.set(key, value);
  return countUp(n, value, fmt);
}

export function ring(pct, color = "var(--blue)", size = 64, stroke = 8) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
  return el("span", { class: "ring", style: { width: size + "px", height: size + "px" },
    html: `<svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="currentColor" opacity=".15" stroke-width="${stroke}" fill="none"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" style="--to:${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>` });
}
export function bar(pct, color = "var(--blue)") {
  return el("span", { class: "bar" }, el("i", { style: { "--w": Math.round(Math.max(0, Math.min(1, pct || 0)) * 100) + "%", background: color } }));
}
export const chip = (text, color = "var(--blue)") => el("span", { class: "chip", style: { "--c": color } }, text);

// ---------- toast & sheet ----------
export function toast(msg, kind = "ok") {
  const t = el("div", { class: "toast " + kind, role: "status" }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add("out"), 2600); setTimeout(() => t.remove(), 3100);
}
/** Modal sheet with a form. fields: [{name,label,type,value,options,placeholder,required,step}] → onSubmit(values) */
export function sheet(title, fields, onSubmit, opts = {}) {
  const back = el("div", { class: "sheet-back", onclick: (e) => { if (e.target === back) close(); } });
  const form = el("form", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title });
  const close = () => { back.classList.add("out"); setTimeout(() => back.remove(), 220); document.removeEventListener("keydown", esc); };
  const esc = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc);
  const err = el("p", { class: "err", "aria-live": "polite" });
  form.append(el("h3", {}, title));
  for (const f of fields) {
    const id = "f_" + f.name;
    let input;
    if (f.type === "select") input = el("select", { id, name: f.name }, ...f.options.map(([v, l]) => el("option", { value: v, selected: String(v) === String(f.value ?? "") }, l)));
    else if (f.type === "textarea") { input = el("textarea", { id, name: f.name, rows: f.rows || 4, placeholder: f.placeholder || "" }); input.value = f.value ?? ""; }
    else if (f.type === "checkbox") input = el("input", { id, name: f.name, type: "checkbox", checked: !!f.value });
    else input = el("input", { id, name: f.name, type: f.type || "text", value: f.value ?? "", placeholder: f.placeholder || "", step: f.step, inputmode: f.type === "number" ? "decimal" : null });
    form.append(el("label", { for: id, class: f.type === "checkbox" ? "lbl chk" : "lbl" }, el("span", {}, f.label), input));
  }
  form.append(err, el("div", { class: "sheet-actions" },
    opts.onDelete ? el("button", { type: "button", class: "btn danger", onclick: async () => { if (confirm(opts.deleteText || "Eliminare?")) { await opts.onDelete(); close(); } } }, icon("trash", 16), "Elimina") : null,
    el("span", { style: { flex: 1 } }),
    el("button", { type: "button", class: "btn ghost", onclick: close }, "Annulla"),
    el("button", { type: "submit", class: "btn primary" }, opts.submitText || "Salva")));
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); err.textContent = "";
    const v = {};
    for (const f of fields) {
      const i = form.elements[f.name];
      v[f.name] = f.type === "checkbox" ? i.checked : f.type === "number" ? (i.value === "" ? null : Number(String(i.value).replace(",", "."))) : f.type === "date" ? fromIso(i.value) : i.value.trim();
      if (f.required && (v[f.name] === "" || v[f.name] == null || (f.type === "number" && !(v[f.name] > 0)))) {
        err.textContent = `Compila «${f.label}».`; i.focus(); return;
      }
    }
    try { await onSubmit(v); close(); toast(opts.doneText || "Salvato"); }
    catch (ex) { console.error(ex); err.textContent = "Non riuscito: " + (ex.message || ex); }
  });
  back.append(form); document.body.append(back);
  setTimeout(() => form.querySelector("input,textarea,select")?.focus(), 60);
}

// ---------- auth screen ----------
function showLogin(msg) {
  document.body.classList.remove("authed");
  const box = document.getElementById("login");
  const f = box.querySelector("form");
  const err = box.querySelector(".err");
  err.textContent = msg || "";
  f.onsubmit = async (e) => {
    e.preventDefault(); err.textContent = "";
    const btn = f.querySelector("button[type=submit]"); btn.disabled = true;
    try { await login(f.email.value.trim(), f.password.value); }
    catch (ex) {
      err.textContent = /invalid|wrong|user-not-found|credential/i.test(ex.code || "") ? "Mail o password sbagliate. Sono le stesse dell'app AK Studio."
        : /too-many/i.test(ex.code || "") ? "Troppi tentativi. Riprova tra qualche minuto." : "Accesso non riuscito: " + (ex.code || ex.message);
    } finally { btn.disabled = false; }
  };
  box.querySelector(".forgot").onclick = async () => {
    const m = f.email.value.trim();
    if (!m) { err.textContent = "Scrivi prima la tua mail."; return; }
    try { await resetPassword(m); err.textContent = "Ti ho mandato una mail per reimpostare la password."; }
    catch (ex) { err.textContent = "Non riuscito: " + (ex.code || ex.message); }
  };
}

document.getElementById("logout")?.addEventListener("click", () => logout());

if (DEMO) { S.user = { email: "demo@locale" }; document.body.classList.add("authed"); startDemo(); }
else onUser((u) => {
  S.user = u;
  if (u) { document.body.classList.add("authed"); startStore(); route(); }
  else { stopStore(); showLogin(); }
});

export { auth };
