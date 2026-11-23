// Documenti — libreria (link, note, preventivi) e generatore di preventivi stampabili.
import { view, el, icon, S, db, money, num, chip, toast, sheet, isoDate, render } from "../app.js";

const KINDS = { link: ["Link", "var(--blue)"], nota: ["Note", "var(--amber)"], preventivo: ["Preventivi", "var(--mint)"] };
const USEFUL = [
  ["Sito ak-design.it", "https://ak-design.it"], ["Bozza Marechiaro", "https://ak-design.it/bozze/marechiaro/"],
  ["Demo ristoranti", "https://ak-design.it/demo/ristorante/v3/"], ["Game Store", "https://ak-design.it/bozze/gamestore/"],
  ["Gamemania", "https://ak-design.it/bozze/gamemania/"], ["Demo videogiochi", "https://ak-design.it/demo/videogiochi/"],
  ["Romer menu", "https://ak-design.it/romer/"],
];
const FORFETTARIO = "Operazione effettuata ai sensi dell'art. 1, commi 54-89, L. 190/2014 – regime forfettario";

let search = "", kind = "tutti", Q = null;   // Q = preventivo in modifica (null = libreria)

const meta = (d) => { try { return JSON.parse(d.body || "{}"); } catch { return {}; } };
const host = (u) => String(u || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const num2 = (v) => (Number(String(v).replace(",", ".")) || 0);
const lineTotal = (l) => num2(l.qty) * num2(l.price);
const totalOf = (q) => q.lines.reduce((a, l) => a + lineTotal(l), 0);
const dmy = (iso) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");

function nextNumber(date) {
  const y = (date || isoDate(new Date())).slice(0, 4);
  const seqs = S.docs.filter((d) => d.kind === "preventivo").map((d) => (meta(d).number || "").match(new RegExp("^PRV-" + y + "-(\\d+)$"))).filter(Boolean).map((m) => Number(m[1]));
  return `PRV-${y}-${String(Math.max(0, ...seqs) + 1).padStart(3, "0")}`;
}
const blankQuote = () => { const date = isoDate(new Date()); return { id: null, client: "", date, number: nextNumber(date), lines: [{ description: "", qty: 1, price: "" }], notes: "", validity: 30, forfettario: false, createdAt: null }; };
const openQuote = (d) => { const m = meta(d); Q = { id: d.id, client: d.client || "", date: m.date || isoDate(new Date(d.createdAt || Date.now())), number: m.number || nextNumber(), lines: (m.lines || []).map((l) => ({ ...l })), notes: m.notes || "", validity: m.validity ?? 30, forfettario: !!m.forfettario, createdAt: d.createdAt }; render(true); };
const dupQuote = (d) => { openQuote(d); Q.id = null; Q.createdAt = null; Q.date = isoDate(new Date()); Q.number = nextNumber(Q.date); render(true); toast("Copia pronta: salva per crearla"); };

// ---------- libreria ----------
function linkSheet(d) {
  sheet(d ? "Modifica link" : "Nuovo link", [{ name: "title", label: "Titolo", value: d?.title, required: true }, { name: "url", label: "Indirizzo", type: "url", value: d?.url, placeholder: "https://", required: true }],
    (v) => db.save("docs", d?.id, { ...v, kind: "link", body: d?.body || "", client: d?.client || "", amount: d?.amount || 0, createdAt: d?.createdAt || new Date() }, d),
    d ? { onDelete: () => db.remove("docs", d.id) } : {});
}
function noteSheet(d) {
  sheet(d ? "Modifica nota" : "Nuova nota", [{ name: "title", label: "Titolo", value: d?.title, required: true }, { name: "body", label: "Testo", type: "textarea", rows: 8, value: d?.body }],
    (v) => db.save("docs", d?.id, { ...v, kind: "nota", url: "", client: d?.client || "", amount: d?.amount || 0, createdAt: d?.createdAt || new Date() }, d),
    d ? { onDelete: () => db.remove("docs", d.id) } : {});
}
const delDoc = (d) => { if (confirm("Eliminare questo documento?")) db.remove("docs", d.id); };
const ib = (name, label, fn, cls = "") => el("button", { class: "at-ib " + cls, type: "button", "aria-label": label, title: label, onclick: fn }, icon(name, 16));

function docCard(d) {
  const k = d.kind || "link", [kl, kc] = KINDS[k] || KINDS.link, date = d.createdAt ? new Date(d.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
  if (k === "preventivo") { const m = meta(d); return el("article", { class: "card hov dc-card", style: { "--c": kc } },
    el("div", { class: "dc-ct" }, chip(m.number || "Preventivo", kc), el("span", { class: "small" }, date)), el("h3", {}, d.client || d.title),
    el("div", { class: "dc-amt" }, money(d.amount || 0)), el("div", { class: "dc-acts" },
      el("button", { class: "btn sm", type: "button", onclick: () => openQuote(d) }, icon("edit", 14), "Riapri"),
      el("button", { class: "btn sm", type: "button", onclick: () => dupQuote(d) }, icon("plus", 14), "Duplica"), el("span", { class: "spacer" }), ib("trash", "Elimina preventivo", () => delDoc(d), "del"))); }
  if (k === "nota") return el("article", { class: "card hov dc-card", style: { "--c": kc } }, el("div", { class: "dc-ct" }, chip(kl, kc), el("span", { class: "small" }, date)),
    el("h3", {}, d.title), el("p", { class: "dc-body" }, d.body), el("div", { class: "dc-acts" }, el("span", { class: "spacer" }), ib("edit", "Modifica nota", () => noteSheet(d)), ib("trash", "Elimina nota", () => delDoc(d), "del")));
  return el("article", { class: "card hov dc-card", style: { "--c": kc } }, el("div", { class: "dc-ct" }, chip(kl, kc), el("span", { class: "small" }, date)),
    el("h3", {}, d.title), el("a", { class: "dc-url", href: d.url, target: "_blank", rel: "noopener" }, icon("link", 14), host(d.url)),
    el("div", { class: "dc-acts" }, el("span", { class: "spacer" }), ib("edit", "Modifica link", () => linkSheet(d)), ib("trash", "Elimina link", () => delDoc(d), "del")));
}

function library(root) {
  const docs = [...S.docs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const quotes = docs.filter((d) => d.kind === "preventivo"), quoted = quotes.reduce((a, d) => a + (d.amount || 0), 0);
  const q = search.trim().toLowerCase();
  const match = (...s) => !q || s.join(" ").toLowerCase().includes(q);
  const shown = docs.filter((d) => (kind === "tutti" || d.kind === kind) && match(d.title, d.client, d.url, d.body));
  const useful = USEFUL.filter(([t, u]) => (kind === "tutti" || kind === "link") && match(t, u));

  root.append(el("div", { class: "dc-head" }, el("h1", { class: "h1" }, "Documenti"), el("span", { class: "spacer" }),
    el("button", { class: "btn", type: "button", onclick: () => linkSheet() }, icon("link", 16), "Aggiungi link"),
    el("button", { class: "btn", type: "button", onclick: () => noteSheet() }, icon("edit", 16), "Aggiungi nota"),
    el("button", { class: "btn primary", type: "button", onclick: () => { Q = blankQuote(); render(true); } }, icon("plus", 16), "Nuovo preventivo")));

  root.append(el("div", { class: "grid dc-stats" },
    el("div", { class: "card" }, el("span", { class: "eyebrow" }, "Documenti salvati"), num("dc-n", docs.length, (v) => Math.round(v), "big")),
    el("div", { class: "card" }, el("span", { class: "eyebrow" }, "Preventivi fatti"), num("dc-q", quotes.length, (v) => Math.round(v), "big")),
    el("div", { class: "card" }, el("span", { class: "eyebrow" }, "Totale preventivato"), num("dc-t", quoted, (v) => money(Math.round(v)), "big"))));

  const input = el("input", { type: "search", class: "dc-search", placeholder: "Cerca per titolo, cliente o testo", "aria-label": "Cerca nei documenti", value: search,
    oninput: (e) => { search = e.target.value; const pos = e.target.selectionStart; render(); const n = document.querySelector(".dc-search"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });
  root.append(el("div", { class: "dc-tools" }, input, el("div", { class: "seg", role: "group", "aria-label": "Tipo di documento" },
    [["tutti", "Tutti"], ...Object.entries(KINDS).map(([k, v]) => [k, v[0]])].map(([k, l]) => el("button", { type: "button", class: kind === k ? "on" : "", onclick: () => { kind = k; render(); } }, l)))));

  root.append(el("h2", { class: "h2" }, "I tuoi documenti"));
  root.append(shown.length ? el("div", { class: "dc-grid" }, shown.map(docCard))
    : el("div", { class: "card empty" }, docs.length ? "Nessun documento corrisponde alla ricerca." : "Ancora niente qui. Crea un preventivo o salva un link o una nota."));

  if (useful.length) root.append(el("h2", { class: "h2" }, "Link utili"), el("div", { class: "dc-useful" }, useful.map(([t, u]) =>
    el("a", { class: "card hov dc-u", href: u, target: "_blank", rel: "noopener" }, el("span", { class: "dc-ui" }, icon("link", 16)), el("span", { class: "dc-ut" }, el("b", {}, t), el("small", {}, host(u))), icon("arrow", 16)))));
}

// ---------- editor preventivo ----------
function paper(q) {
  const b = S.business || {}, name = b.name || "AK Design", owner = b.owner || "Abdellah Khanani", city = b.city || "Bolzano", site = b.site || "https://ak-design.it", mail = b.email || "";
  const total = totalOf(q), until = (() => { if (!q.date || !q.validity) return ""; const d = new Date(q.date + "T12:00:00"); d.setDate(d.getDate() + Number(q.validity)); return isoDate(d); })();
  const lines = q.lines.filter((l) => l.description || num2(l.price));
  return el("article", { class: "dc-paper", "aria-label": "Anteprima del preventivo" },
    el("header", { class: "dp-top" }, el("img", { src: "../assets/logo/ak-mark.webp", alt: name, class: "dp-logo", width: 81, height: 40 }),
      el("div", { class: "dp-id" }, el("b", {}, name), el("span", {}, owner), el("span", {}, city), el("span", {}, host(site)), mail ? el("span", {}, mail) : null)),
    el("div", { class: "dp-title" }, el("h2", {}, "Preventivo"), el("div", { class: "dp-meta" }, el("span", {}, "N. ", el("b", {}, q.number)), el("span", {}, "Data ", el("b", {}, dmy(q.date))),
      until ? el("span", {}, "Valido fino al ", el("b", {}, dmy(until))) : null)),
    el("div", { class: "dp-to" }, el("small", {}, "Per"), el("b", {}, q.client || "Nome del cliente")),
    el("table", { class: "dp-t" }, el("thead", {}, el("tr", {}, el("th", {}, "Descrizione"), el("th", { class: "r" }, "Qtà"), el("th", { class: "r" }, "Prezzo"), el("th", { class: "r" }, "Importo"))),
      el("tbody", {}, lines.length ? lines.map((l) => el("tr", {}, el("td", {}, l.description || "—"), el("td", { class: "r" }, String(num2(l.qty) || "")), el("td", { class: "r" }, l.price === "" ? "" : money(num2(l.price))), el("td", { class: "r" }, money(lineTotal(l)))))
        : el("tr", {}, el("td", { colspan: 4, class: "dp-empty" }, "Aggiungi le voci del preventivo")))),
    el("div", { class: "dp-sum" }, el("div", {}, el("span", {}, "Subtotale"), el("span", {}, money(total))), el("div", { class: "grand" }, el("span", {}, "Totale"), el("span", {}, money(total)))),
    q.notes ? el("div", { class: "dp-notes" }, el("small", {}, "Note"), el("p", {}, q.notes)) : null,
    q.forfettario ? el("p", { class: "dp-foot" }, FORFETTARIO) : null);
}

function quoteView(root) {
  const people = [...new Set([...S.leads.map((l) => l.name), ...S.jobs.map((j) => j.client)].filter(Boolean))].sort();
  const sv = (Array.isArray(S.business?.services) ? S.business.services : []);
  const prev = el("div", { class: "dc-prevwrap" });
  const totalEl = el("b", { class: "dc-total" });
  const paint = () => { prev.replaceChildren(paper(Q)); totalEl.textContent = money(totalOf(Q)); };
  const field = (label, node) => el("label", { class: "lbl" }, el("span", {}, label), node);
  const bind = (key, type = "text", extra = {}) => el("input", { type, value: Q[key], ...extra, oninput: (e) => { Q[key] = e.target.value; if (key === "date") { /* numero resta */ } paint(); } });
  const linesBox = el("div", { class: "dc-lines" });
  const drawLines = (focusLast) => {
    linesBox.replaceChildren(...Q.lines.map((l, i) => el("div", { class: "dc-line" },
      el("input", { class: "d", value: l.description, placeholder: "Descrizione", "aria-label": "Descrizione voce " + (i + 1), oninput: (e) => { l.description = e.target.value; paint(); } }),
      el("input", { class: "q", type: "number", min: "0", step: "any", inputmode: "decimal", value: l.qty, "aria-label": "Quantità", oninput: (e) => { l.qty = e.target.value; paint(); } }),
      el("input", { class: "p", type: "number", min: "0", step: "any", inputmode: "decimal", value: l.price, placeholder: "€", "aria-label": "Prezzo unitario", oninput: (e) => { l.price = e.target.value; paint(); } }),
      el("button", { class: "at-ib del", type: "button", "aria-label": "Rimuovi voce " + (i + 1), onclick: () => { Q.lines.splice(i, 1); if (!Q.lines.length) Q.lines.push({ description: "", qty: 1, price: "" }); drawLines(); paint(); } }, icon("x", 16)))));
    if (focusLast) linesBox.querySelector(".dc-line:last-child .d")?.focus();
  };
  drawLines();

  const svBox = sv.length ? el("div", { class: "dc-svc" }, el("small", {}, "Aggiungi dal listino"), el("div", { class: "at-seeds" }, sv.map((s) => el("button", { class: "at-seed", type: "button",
    onclick: () => { const empty = Q.lines.length === 1 && !Q.lines[0].description && Q.lines[0].price === ""; const nl = { description: s.name, qty: 1, price: s.price ?? "" };
      if (empty) Q.lines[0] = nl; else Q.lines.push(nl); drawLines(); paint(); } }, icon("plus", 14), s.name + (s.price != null && s.price !== "" ? ` · ${money(s.price)}` : ""))))) : el("p", { class: "small" }, "Aggiungi i servizi in Attività per inserirli qui con un tocco.");

  const save = async () => {
    if (!Q.client.trim()) { toast("Scrivi il nome del cliente", "err"); return; }
    const existing = Q.id ? S.docs.find((d) => d.id === Q.id) : undefined;
    const body = JSON.stringify({ number: Q.number, date: Q.date, lines: Q.lines.filter((l) => l.description || num2(l.price)), notes: Q.notes, validity: Number(Q.validity) || 0, forfettario: Q.forfettario });
    Q.id = await db.save("docs", Q.id, { kind: "preventivo", title: `Preventivo ${Q.number} - ${Q.client.trim()}`, client: Q.client.trim(), amount: totalOf(Q), body, url: "",
      createdAt: Q.createdAt || new Date() }, existing);
    toast("Preventivo salvato");
  };

  const editor = el("section", { class: "card dc-editor" }, el("h2", { class: "dc-h" }, Q.id ? "Modifica preventivo" : "Nuovo preventivo"),
    field("Cliente", bind("client", "text", { list: "dc-people", placeholder: "Nome del cliente", autocomplete: "off" })), el("datalist", { id: "dc-people" }, people.map((n) => el("option", { value: n }))),
    el("div", { class: "dc-two" }, field("Data", bind("date", "date")), field("Numero", bind("number"))),
    el("div", { class: "dc-sub" }, "Voci"), el("div", { class: "dc-lh" }, el("span", { class: "d" }, "Descrizione"), el("span", { class: "q" }, "Qtà"), el("span", { class: "p" }, "Prezzo")), linesBox,
    el("button", { class: "btn sm", type: "button", onclick: () => { Q.lines.push({ description: "", qty: 1, price: "" }); drawLines(true); paint(); } }, icon("plus", 14), "Aggiungi voce"), svBox,
    el("div", { class: "dc-totalrow" }, el("span", {}, "Totale"), totalEl),
    field("Note", el("textarea", { rows: 3, placeholder: "Condizioni, tempi di consegna, pagamento...", oninput: (e) => { Q.notes = e.target.value; paint(); } }, Q.notes)),
    field("Validità (giorni)", bind("validity", "number", { min: "0", inputmode: "numeric" })),
    el("label", { class: "lbl chk" }, el("span", {}, "Aggiungi la dicitura del regime forfettario"), el("input", { type: "checkbox", checked: Q.forfettario, onchange: (e) => { Q.forfettario = e.target.checked; paint(); } })),
    el("div", { class: "dc-eacts" }, el("button", { class: "btn primary", type: "button", onclick: save }, icon("check", 16), "Salva"),
      el("button", { class: "btn", type: "button", onclick: () => { window.print(); } }, icon("documenti", 16), "Stampa / PDF"),
      el("span", { class: "spacer" }), el("button", { class: "btn ghost", type: "button", onclick: () => { Q = null; render(true); } }, "Chiudi")));

  root.append(el("div", { class: "dc-quote" }, el("button", { class: "linkbtn dc-back", type: "button", onclick: () => { Q = null; render(true); } }, "Torna ai documenti"),
    el("div", { class: "dc-qgrid" }, editor, el("div", { class: "dc-prevcol" }, el("div", { class: "small dc-pl" }, "Anteprima A4"), prev))));
  paint();
}

view("documenti", { title: "Documenti", icon: "documenti", order: 9, render(root) { if (Q) quoteView(root); else library(root); } });
