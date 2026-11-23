// Attività — il profilo dell'attività (identità, servizi, brand kit, ricerche) e il testo per il bando.
import { view, el, icon, S, db, money, num, ring, chip, toast, sheet, isoDate } from "../app.js";

const DEF = { name: "AK Design", owner: "Abdellah Khanani", tagline: "", city: "Bolzano", site: "https://ak-design.it", email: "",
  bioShort: "", bioLong: "", audience: "", pitch: "", values: "" };
const DEF_BRAND = { colors: ["#000000", "#FFFFFF", "#2F6BFF"], fonts: ["Plus Jakarta Sans"], voice: "" };
const SEEDS = [
  { name: "Sito vetrina + pannello prenotazioni", desc: "Sito per ristoranti con pannello per prenotazioni e menu.", unit: "una tantum" },
  { name: "Studio grafiche per negozi", desc: "Strumento per creare storie e post Instagram, in abbonamento.", unit: "al mese" },
  { name: "Reel / video promozionale", desc: "Video verticale per social, girato e montato.", unit: "a video" },
  { name: "Shooting foto prodotti / locale", desc: "Servizio fotografico per prodotti, piatti e ambienti.", unit: "a servizio" },
  { name: "Menu grafico e file stampa", desc: "Menu impaginato, pronto per la stampa.", unit: "una tantum" },
];
const RESEARCH_SEEDS = ["Ristoranti e bistrot a Bolzano: chi ha un sito vecchio", "Negozi di videogiochi in Alto Adige", "Concorrenti: web designer e videomaker locali"];

const prof = () => { const o = { ...DEF }; for (const [k, v] of Object.entries(S.business || {})) if (v != null && k in DEF) o[k] = v; return o; };
const services = () => (Array.isArray(S.business?.services) ? S.business.services : []);
const brand = () => ({ ...DEF_BRAND, ...(S.business?.brand || {}) });
const saveBiz = (fields) => db.save("business", "profile", fields, S.business || undefined);
const research = () => [...S.research].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
const open = new Set();

function copyText(text) {
  const done = () => true;
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(done, () => fallback());
  return Promise.resolve(fallback());
  function fallback() {
    const t = el("textarea", { style: { position: "fixed", opacity: "0" } }); t.value = text; document.body.append(t); t.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch { /* ignore */ } t.remove(); return ok;
  }
}
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };

// ---------- completezza ----------
function checks() {
  const p = prof(), sv = services(), b = brand();
  return [
    ["Nome e titolare", !!(p.name && p.owner), "identita"], ["Slogan", !!p.tagline, "identita"], ["Mail di contatto", !!p.email, "identita"],
    ["Bio breve", !!p.bioShort, "bio"], ["Bio completa", !!p.bioLong, "bio"], ["Clienti target", !!p.audience, "audience"],
    ["Pitch in una frase", !!p.pitch, "pitch"], ["Valori", !!p.values, "values"], ["Servizi nel listino", sv.length > 0, "services"],
    ["Prezzi dei servizi", sv.length > 0 && sv.every((s) => s.price != null && s.price !== ""), "services"],
    ["Colori e font", b.colors.length > 0 && b.fonts.length > 0, "brand"], ["Tono di voce", !!b.voice, "brand"],
    ["Ricerca di mercato", S.research.length > 0, "research"],
  ];
}

// ---------- testo per il bando ----------
function bandoText() {
  const p = prof(), sv = services();
  const end = (s) => { s = String(s).trim(); return /[.!?]$/.test(s) ? s : s + "."; };
  const out = [`${p.name} è l'attività di ${p.owner}, filmmaker, fotografo e web designer con sede a ${p.city}.`];
  if (p.bioLong || p.bioShort) out.push(end(p.bioLong || p.bioShort));
  if (sv.length) out.push("Servizi offerti: " + sv.map((s) => s.name + (s.desc ? ` (${s.desc.replace(/[.\s]+$/, "")})` : "")).join("; ") + ".");
  out.push(p.audience ? "Clienti di riferimento: " + end(p.audience) : "Si rivolge a ristoranti e attività locali, negozi di videogiochi e creator che hanno bisogno di siti, video e grafiche per presentarsi online.");
  if (p.pitch) out.push("In una frase: " + end(p.pitch));
  if (p.values) out.push("Valori: " + end(p.values));
  out.push(`Sito: ${p.site}` + (p.email ? ` · Contatto: ${p.email}` : ""));
  return out.join("\n\n");
}

// ---------- sheet di modifica ----------
const EDIT = {
  identita: () => { const p = prof(); sheet("Identità", [
    { name: "name", label: "Nome dell'attività", value: p.name, required: true }, { name: "owner", label: "Titolare", value: p.owner },
    { name: "tagline", label: "Slogan", value: p.tagline, placeholder: "Siti, video e foto per le attività locali" },
    { name: "city", label: "Città", value: p.city }, { name: "site", label: "Sito", type: "url", value: p.site }, { name: "email", label: "Mail", type: "email", value: p.email },
  ], (v) => saveBiz(v)); },
  bio: () => { const p = prof(); sheet("Bio", [
    { name: "bioShort", label: "Bio breve (1-2 righe)", type: "textarea", rows: 3, value: p.bioShort },
    { name: "bioLong", label: "Bio completa", type: "textarea", rows: 7, value: p.bioLong },
  ], (v) => saveBiz(v)); },
  audience: () => sheet("Clienti target", [{ name: "audience", label: "A chi ti rivolgi", type: "textarea", rows: 5, value: prof().audience,
    placeholder: "Ristoranti e bar, negozi di videogiochi, creator..." }], (v) => saveBiz(v)),
  pitch: () => sheet("Pitch", [{ name: "pitch", label: "Cosa fai, per chi, con quale risultato (una frase)", type: "textarea", rows: 3, value: prof().pitch }], (v) => saveBiz(v)),
  values: () => sheet("Valori", [{ name: "values", label: "I tuoi valori", type: "textarea", rows: 4, value: prof().values, placeholder: "Cura dei dettagli, tempi chiari, prezzi onesti..." }], (v) => saveBiz(v)),
  voice: () => sheet("Tono di voce", [{ name: "voice", label: "Come parli ai clienti", type: "textarea", rows: 5, value: brand().voice,
    placeholder: "Diretto, caldo, senza paroloni. Dai del tu." }], (v) => saveBiz({ brand: { ...brand(), voice: v.voice } })),
};

function serviceSheet(i) {
  const list = services().map((s) => ({ ...s })); const s = i == null ? { name: "", desc: "", price: null, unit: "", deliveryDays: null } : list[i];
  sheet(i == null ? "Nuovo servizio" : "Modifica servizio", [
    { name: "name", label: "Nome del servizio", value: s.name, required: true },
    { name: "desc", label: "Descrizione", type: "textarea", rows: 3, value: s.desc },
    { name: "price", label: "Prezzo in € (vuoto = da definire)", type: "number", value: s.price ?? "", step: "any" },
    { name: "unit", label: "Unità (una tantum, al mese, a video...)", value: s.unit },
    { name: "deliveryDays", label: "Consegna in giorni", type: "number", value: s.deliveryDays ?? "", step: "1" },
  ], (v) => { if (i == null) list.push(v); else list[i] = v; return saveBiz({ services: list }); },
  i == null ? {} : { onDelete: () => saveBiz({ services: list.filter((_, k) => k !== i) }), deleteText: "Eliminare questo servizio?" });
}
function moveService(i, d) {
  const list = services().slice(); const j = i + d; if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]]; saveBiz({ services: list });
}
function researchSheet(r) {
  sheet(r ? "Modifica ricerca" : "Nuova ricerca", [
    { name: "title", label: "Titolo", value: r?.title, required: true },
    { name: "body", label: "Cosa hai scoperto", type: "textarea", rows: 7, value: r?.body },
    { name: "sources", label: "Fonti (una per riga)", type: "textarea", rows: 3, value: r?.sources },
    { name: "createdAt", label: "Data", type: "date", value: isoDate(r?.createdAt ? new Date(r.createdAt) : new Date()) },
  ], (v) => db.save("research", r?.id, { ...v, createdAt: v.createdAt || new Date() }, r),
  r ? { onDelete: () => db.remove("research", r.id), deleteText: "Eliminare questa ricerca?" } : {});
}

// ---------- blocchi ----------
function block(key, title, ic, body, onEdit, cls = "") {
  return el("section", { class: "card at-block " + cls, id: "at-" + key },
    el("div", { class: "at-bh" }, el("span", { class: "at-bi" }, icon(ic, 16)), el("h2", {}, title), el("span", { class: "spacer" }),
      onEdit ? el("button", { class: "btn sm ghost", type: "button", onclick: onEdit, "aria-label": "Modifica " + title.toLowerCase() }, icon("edit", 15), "Modifica") : null),
    body);
}
const empty = (text, onAdd) => el("button", { class: "at-empty", type: "button", onclick: onAdd }, icon("plus", 16), text);
const para = (t) => el("p", { class: "at-p" }, t);

function hero(p) {
  const cs = checks(), done = cs.filter((c) => c[1]).length, pct = done / cs.length, miss = cs.filter((c) => !c[1]);
  const pctN = el("b", {}, num("at-pct", Math.round(pct * 100), (v) => Math.round(v) + "%", "at-pctn"));
  return el("section", { class: "hero at-hero" }, el("div", { class: "aurora" }),
    el("div", { class: "at-hero-in" },
      el("img", { src: "../assets/logo/ak-mark.webp", alt: "AK", class: "at-logo", width: 81, height: 40 }),
      el("div", { class: "at-hero-txt" },
        el("p", { class: "eyebrow" }, "Profilo dell'attività"),
        el("h1", { class: "at-name" }, p.name || "Senza nome"),
        el("p", { class: "at-tag" }, p.tagline || "Aggiungi uno slogan che dica in una riga cosa fai."),
        el("p", { class: "small at-meta" }, [p.owner, p.city, (p.site || "").replace(/^https?:\/\//, ""), p.email].filter(Boolean).join("  ·  "))),
      el("div", { class: "at-ringbox", role: "img", "aria-label": `Profilo completo al ${Math.round(pct * 100)} per cento` },
        (() => { const r = ring(pct, "#34E5A1", 104, 9); r.append(pctN); return r; })(),
        el("span", { class: "small" }, `${done} di ${cs.length} voci`))),
    el("div", { class: "at-miss" },
      miss.length ? [el("span", { class: "small at-misst" }, "Cosa manca"), ...miss.map(([t, , k]) => el("button", { class: "at-mchip", type: "button", onclick: () => jump(k) }, icon("plus", 12), t))]
        : el("span", { class: "small" }, "Profilo completo. Ottimo punto di partenza per il bando.")),
    el("div", { class: "at-hacts" },
      el("button", { class: "btn at-hbtn main", type: "button", onclick: async () => { const ok = await copyText(bandoText()); toast(ok === false ? "Copia non riuscita" : "Descrizione per il bando copiata", ok === false ? "err" : "ok"); } },
        icon("link", 16), "Copia descrizione per il bando"),
      el("button", { class: "btn at-hbtn", type: "button", onclick: EDIT.identita }, icon("edit", 16), "Modifica identità")));
}
function jump(key) {
  const n = document.getElementById("at-" + key); if (!n) return;
  n.scrollIntoView({ behavior: "smooth", block: "center" }); n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash");
}

function identityBlock(p) {
  const rows = [["Nome", p.name], ["Titolare", p.owner], ["Slogan", p.tagline], ["Città", p.city], ["Sito", p.site], ["Mail", p.email]];
  return block("identita", "Identità", "attivita", el("dl", { class: "at-dl" }, rows.flatMap(([k, v]) => [el("dt", {}, k),
    el("dd", {}, v ? (k === "Sito" ? el("a", { href: v, target: "_blank", rel: "noopener" }, v.replace(/^https?:\/\//, "")) : v) : el("span", { class: "at-none" }, "da aggiungere"))])), EDIT.identita);
}
const textBlock = (key, title, ic, text, hint) => block(key, title, ic, text ? para(text) : empty(hint, EDIT[key]), EDIT[key]);

function bioBlock(p) {
  return block("bio", "Bio", "spark", p.bioShort || p.bioLong ? el("div", { class: "stack" },
    p.bioShort ? el("p", { class: "at-lead" }, p.bioShort) : null, p.bioLong ? para(p.bioLong) : null) : empty("Scrivi chi sei in poche righe", EDIT.bio), EDIT.bio);
}

function servicesBlock() {
  const sv = services(), priced = sv.filter((s) => s.price != null && s.price !== "").length;
  const body = el("div", { class: "stack" });
  const left = SEEDS.filter((s) => !sv.some((x) => x.name === s.name));
  const seeds = left.length ? el("div", { class: "stack" }, el("p", { class: "small" }, sv.length ? "Suggeriti, un tocco per aggiungerli:" : "Parti da un'idea e completala con prezzi e tempi. I prezzi restano vuoti finché non li decidi."),
    el("div", { class: "at-seeds" }, left.map((s) => el("button", { class: "at-seed", type: "button", onclick: () => { saveBiz({ services: [...services(), { ...s, price: null, deliveryDays: null }] }); } },
      icon("plus", 14), "Aggiungi: " + s.name)))) : null;
  if (sv.length) {
    body.append(el("p", { class: "small" }, `${sv.length} servizi · ${priced} con prezzo`), el("div", { class: "at-svcs" }, sv.map((s, i) => el("div", { class: "at-svc" },
      el("span", { class: "at-idx" }, String(i + 1)),
      el("div", { class: "at-svc-main" }, el("b", {}, s.name), s.desc ? el("span", { class: "small" }, s.desc) : null,
        el("div", { class: "at-svc-tags" }, s.deliveryDays ? chip(`Consegna ${s.deliveryDays} gg`, "var(--cyan)") : null, s.unit ? chip(s.unit, "var(--violet)") : null)),
      el("div", { class: "at-price" + (s.price == null || s.price === "" ? " tbd" : "") }, s.price == null || s.price === "" ? "da definire" : money(s.price)),
      el("div", { class: "at-acts" },
        el("button", { class: "at-ib up", type: "button", disabled: i === 0, "aria-label": "Sposta su", onclick: () => moveService(i, -1) }, icon("arrow", 16)),
        el("button", { class: "at-ib down", type: "button", disabled: i === sv.length - 1, "aria-label": "Sposta giù", onclick: () => moveService(i, 1) }, icon("arrow", 16)),
        el("button", { class: "at-ib", type: "button", "aria-label": "Modifica " + s.name, onclick: () => serviceSheet(i) }, icon("edit", 16)),
        el("button", { class: "at-ib del", type: "button", "aria-label": "Elimina " + s.name, onclick: () => { if (confirm("Eliminare questo servizio?")) saveBiz({ services: sv.filter((_, k) => k !== i) }); } }, icon("trash", 16)))))));
  }
  if (seeds) body.append(seeds);
  body.append(el("div", {}, el("button", { class: "btn sm", type: "button", onclick: () => serviceSheet() }, icon("plus", 15), "Nuovo servizio")));
  return block("services", "Servizi e listino", "lavori", body, null, "wide");
}

function brandBlock() {
  const b = brand(), set = (patch) => saveBiz({ brand: { ...b, ...patch } });
  const picker = el("input", { type: "color", value: "#19C6A0", class: "at-picker", "aria-label": "Scegli un colore" });
  const font = el("input", { type: "text", placeholder: "Aggiungi un font", "aria-label": "Nome del font", class: "at-fin" });
  const addFont = () => { const f = font.value.trim(); if (f && !b.fonts.includes(f)) set({ fonts: [...b.fonts, f] }); font.value = ""; };
  font.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addFont(); } });
  return block("brand", "Brand kit", "spark", el("div", { class: "stack at-brand" },
    el("div", { class: "at-sub" }, "Colori"),
    el("div", { class: "at-swatches" }, b.colors.map((c) => el("div", { class: "at-sw", style: { background: c, color: lum(c) > .45 ? "#0E1116" : "#fff" } },
      el("button", { class: "at-sw-b", type: "button", "aria-label": "Copia " + c, onclick: async () => { await copyText(c); toast("Copiato " + c.toUpperCase()); } }, el("span", {}, c.toUpperCase()), el("small", {}, "copia")),
      el("button", { class: "at-sw-x", type: "button", "aria-label": "Rimuovi " + c, onclick: () => set({ colors: b.colors.filter((x) => x !== c) }) }, icon("x", 12)))),
      el("div", { class: "at-sw add" }, picker, el("button", { class: "btn sm", type: "button", onclick: () => { const c = picker.value.toUpperCase(); if (!b.colors.map((x) => x.toUpperCase()).includes(c)) set({ colors: [...b.colors, c] }); else toast("Colore già presente"); } }, icon("plus", 14), "Aggiungi"))),
    el("div", { class: "at-sub" }, "Font"),
    el("div", { class: "at-fonts" }, b.fonts.map((f) => el("span", { class: "at-font", style: { fontFamily: `"${f}", var(--font)` } }, el("b", {}, "Aa"), f,
      el("button", { type: "button", class: "at-fx", "aria-label": "Rimuovi " + f, onclick: () => set({ fonts: b.fonts.filter((x) => x !== f) }) }, icon("x", 12)))),
      el("span", { class: "at-fadd" }, font, el("button", { class: "btn sm", type: "button", onclick: addFont, "aria-label": "Aggiungi font" }, icon("plus", 14)))),
    el("div", { class: "at-sub row" }, "Tono di voce", el("span", { class: "spacer" }), el("button", { class: "btn sm ghost", type: "button", onclick: EDIT.voice }, icon("edit", 14), "Modifica")),
    b.voice ? para(b.voice) : empty("Descrivi come parli ai clienti", EDIT.voice)), null, "wide");
}

function researchBlock() {
  const rs = research();
  const body = el("div", { class: "stack" });
  if (!rs.length) body.append(el("p", { class: "small" }, "Salva qui ciò che scopri su clienti, concorrenti e prezzi. Parti da un tema:"),
    el("div", { class: "at-seeds" }, RESEARCH_SEEDS.map((t) => el("button", { class: "at-seed", type: "button", onclick: () => db.save("research", null, { title: t, body: "", sources: "", createdAt: new Date() }) }, icon("plus", 14), t))));
  else body.append(el("div", { class: "at-res" }, rs.map((r) => {
    const card = el("article", { class: "at-r" + (open.has(r.id) ? " open" : "") });
    const head = el("button", { class: "at-rh", type: "button", "aria-expanded": String(open.has(r.id)), onclick: () => {
      const o = card.classList.toggle("open"); head.setAttribute("aria-expanded", String(o)); o ? open.add(r.id) : open.delete(r.id); } },
    el("span", { class: "at-rt" }, el("b", {}, r.title), el("small", {}, r.createdAt ? new Date(r.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "")), el("span", { class: "at-chev" }, icon("arrow", 16)));
    card.append(head, el("div", { class: "at-rx" }, el("div", {}, r.body ? el("p", { class: "at-p pre" }, r.body) : el("p", { class: "small" }, "Nessun appunto ancora."),
      r.sources ? el("p", { class: "small pre" }, "Fonti: " + r.sources) : null,
      el("button", { class: "btn sm", type: "button", onclick: () => researchSheet(r) }, icon("edit", 14), "Modifica"))));
    return card;
  })));
  body.append(el("div", {}, el("button", { class: "btn sm", type: "button", onclick: () => researchSheet() }, icon("plus", 15), "Nuova ricerca")));
  return block("research", "Ricerca di mercato", "spark", body, null, "wide");
}

view("attivita", { title: "Attività", icon: "attivita", order: 2, render(root) {
  const p = prof();
  root.append(hero(p),
    el("div", { class: "at-grid" }, identityBlock(p), bioBlock(p),
      textBlock("audience", "Clienti target", "clienti", p.audience, "Chi sono i tuoi clienti ideali?"),
      textBlock("pitch", "Pitch in una frase", "spark", p.pitch, "Cosa fai, per chi, con quale risultato"),
      textBlock("values", "Valori", "check", p.values, "Cosa conta davvero nel tuo lavoro?")),
    servicesBlock(), brandBlock(), researchBlock());
} });
