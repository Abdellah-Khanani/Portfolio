import {view, render, S, db, icon, money, day, longDay, daysTo, dayBadge, isoDate, num, ring, toast, sheet } from "../app.js";
import { el, bar, chip } from "./turno.js";

const CAT_IN = { lavoro: "Lavoro", borsa: "Borsa di studio", regalo: "Regalo", vendita: "Vendita", altroIn: "Altro" };
const CAT_OUT = { abbonamenti: "Abbonamenti", cibo: "Cibo", trasporti: "Trasporti", attrezzatura: "Attrezzatura", debiti: "Debiti", tasse: "Tasse", svago: "Svago", altroOut: "Altro" };
const PRIO = { necessaria: ["Necessaria", "var(--red)", 0], importante: ["Importante", "var(--amber)", 1], desiderio: ["Desiderio", "var(--cyan)", 2] };
const PAL = ["var(--blue)", "var(--violet)", "var(--cyan)", "var(--amber)", "var(--pink)", "var(--mint)", "var(--indigo)", "var(--red)"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const T = (d) => new Date(d).getTime();
const ym = (d) => { const x = new Date(d); return x.getFullYear() * 12 + x.getMonth(); };
const nowYm = ym(new Date());
let cur = nowYm;
const ib = (ic, label, fn, cls = "") => el("button", { type: "button", class: "ib " + cls, "aria-label": label, title: label, onclick: fn }, icon(ic, 17));
const sum = (a) => a.reduce((s, t) => s + (t.amount || 0), 0);
const byMonth = (m, kind) => S.transactions.filter((t) => t.date && ym(t.date) === m && (!kind || t.kindRaw === kind));
const mName = (m) => `${MESI[((m % 12) + 12) % 12]} ${Math.floor(m / 12)}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------- transactions ----------
function txSheet(kind, t) {
  const cats = kind === "entrata" ? CAT_IN : CAT_OUT;
  const first = kind === "entrata" ? "lavoro" : "altroOut";
  const d = cur === nowYm ? new Date() : new Date(Math.floor(cur / 12), cur % 12, 1, 12);
  sheet(t ? (kind === "entrata" ? "Modifica entrata" : "Modifica uscita") : kind === "entrata" ? "Nuova entrata" : "Nuova uscita", [
    { name: "title", label: "Titolo", value: t?.title, required: true },
    { name: "amount", label: "Importo (€)", type: "number", step: 0.01, value: t?.amount, required: true },
    { name: "categoryRaw", label: "Categoria", type: "select", value: t?.categoryRaw || first, options: Object.entries(cats) },
    { name: "date", label: "Data", type: "date", value: isoDate(t?.date || d), required: true },
    { name: "note", label: "Nota", value: t?.note },
  ], (v) => db.save("transactions", t?.id || db.newId(), { ...v, kindRaw: kind }, t),
  t ? { onDelete: () => db.remove("transactions", t.id), deleteText: "Eliminare questo movimento?" } : {});
}
const catLabel = (t) => (t.kindRaw === "entrata" ? CAT_IN : CAT_OUT)[t.categoryRaw] || "Altro";
function addTx(title, amount, kind, categoryRaw, note = "") {
  const id = db.newId();
  return db.save("transactions", id, { title, amount, kindRaw: kind, categoryRaw, date: new Date(), note, jobKey: null }).then(() => id);
}

// ---------- hero + chart ----------
function hero() {
  const ins = sum(byMonth(cur, "entrata")), outs = sum(byMonth(cur, "uscita")), net = ins - outs;
  const nav = (d, label, ic) => el("button", { type: "button", class: "ib so-glass", "aria-label": label, onclick: () => { cur += d; render(); } }, icon(ic, 18));
  return el("section", { class: "hero so-hero", "aria-label": "Riepilogo del mese" }, el("div", { class: "aurora" }),
    el("div", { class: "row so-month" }, nav(-1, "Mese precedente", "arrow"), el("div", { class: "so-mname" }, cap(mName(cur))), nav(1, "Mese successivo", "arrow"),
      el("span", { class: "spacer" }), cur !== nowYm ? el("button", { type: "button", class: "btn sm so-glass", onclick: () => { cur = nowYm; render(); } }, "Oggi") : null),
    el("div", { class: "small" }, "Saldo del mese"),
    el("div", { class: "so-net" }, num("so-net" + cur, net, (v) => money(Math.round(v * 100) / 100, true), "big")),
    el("div", { class: "so-io" },
      el("div", {}, el("div", { class: "small" }, "Entrate"), num("so-in" + cur, ins, (v) => money(Math.round(v)), "mid so-in")),
      el("div", {}, el("div", { class: "small" }, "Uscite"), num("so-out" + cur, outs, (v) => money(Math.round(v)), "mid so-out"))));
}

function chart() {
  const months = Array.from({ length: 6 }, (_, i) => cur - 5 + i);
  const data = months.map((m) => ({ m, i: sum(byMonth(m, "entrata")), o: sum(byMonth(m, "uscita")) }));
  const max = Math.max(50, ...data.flatMap((d) => [d.i, d.o])) * 1.12;
  const W = 600, H = 220, pad = 28, bw = 22, gap = (W - pad * 2) / 6;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Entrate e uscite degli ultimi sei mesi">`;
  [0, .5, 1].forEach((k) => { const y = H - pad - k * (H - pad * 2); svg += `<line x1="${pad}" x2="${W - pad}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".12"/><text x="${pad - 6}" y="${y + 4}" text-anchor="end" class="so-ax">${Math.round(max * k)}</text>`; });
  data.forEach((d, k) => {
    const cx = pad + gap * k + gap / 2, h = (v) => (v / max) * (H - pad * 2);
    svg += `<g class="so-g${d.m === cur ? " on" : ""}" data-i="${k}" tabindex="0"><rect class="so-hit" x="${cx - gap / 2}" y="0" width="${gap}" height="${H}"/>`
      + `<rect class="so-b so-bi" x="${cx - bw - 2}" y="${H - pad - h(d.i)}" width="${bw}" height="${Math.max(h(d.i), 0)}" rx="6" style="animation-delay:${k * 70}ms"/>`
      + `<rect class="so-b so-bo" x="${cx + 2}" y="${H - pad - h(d.o)}" width="${bw}" height="${Math.max(h(d.o), 0)}" rx="6" style="animation-delay:${k * 70 + 40}ms"/>`
      + `<text x="${cx}" y="${H - 8}" text-anchor="middle" class="so-ax so-mx">${MESI[d.m % 12].slice(0, 3)}</text></g>`;
  });
  svg += "</svg>";
  const tip = el("div", { class: "so-tip", role: "status", hidden: true });
  const box = el("div", { class: "so-chart", html: svg });
  box.append(tip);
  const show = (g) => {
    const d = data[+g.dataset.i]; const r = g.getBoundingClientRect(), br = box.getBoundingClientRect();
    tip.innerHTML = `<b>${cap(mName(d.m))}</b><span class="in">Entrate ${money(d.i)}</span><span class="out">Uscite ${money(d.o)}</span><span>Saldo ${money(d.i - d.o, true)}</span>`;
    tip.hidden = false; const x = r.left - br.left + r.width / 2;
    tip.style.left = Math.max(70, Math.min(br.width - 70, x)) + "px"; tip.style.top = Math.max(0, r.top - br.top - 6) + "px";
  };
  box.querySelectorAll(".so-g").forEach((g) => {
    g.addEventListener("mouseenter", () => show(g)); g.addEventListener("focus", () => show(g)); g.addEventListener("mouseleave", () => (tip.hidden = true)); g.addEventListener("blur", () => (tip.hidden = true));
    g.addEventListener("click", () => { cur = data[+g.dataset.i].m; render(); });
  });
  return el("div", { class: "card so-chartcard" }, el("div", { class: "row" }, el("h3", { class: "so-h3" }, "Ultimi 6 mesi"), el("span", { class: "spacer" }),
    el("span", { class: "so-leg" }, el("i", { class: "in" }), "Entrate", el("i", { class: "out" }), "Uscite")), box);
}

function breakdown() {
  const part = (kind, cats, label) => {
    const rows = Object.entries(cats).map(([k, l]) => [l, sum(byMonth(cur, kind).filter((t) => t.categoryRaw === k))]).filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
    const total = sum(byMonth(cur, kind)) || 1;
    return el("div", {}, el("div", { class: "small so-sub" }, label),
      rows.length ? rows.map(([l, v], i) => el("div", { class: "so-cat" }, el("div", { class: "row" }, el("span", { class: "t" }, l), el("span", { class: "spacer" }), el("span", { class: "small" }, Math.round((v / total) * 100) + "%"), el("b", {}, money(v))),
        bar(v / total, kind === "entrata" ? "var(--mint)" : PAL[i % PAL.length]))) : el("div", { class: "small so-none" }, "Nessun movimento"));
  };
  return el("div", { class: "card stack" }, el("h3", { class: "so-h3" }, "Per categoria"), part("uscita", CAT_OUT, "Uscite"), part("entrata", CAT_IN, "Entrate"));
}

function movements() {
  const txs = byMonth(cur).sort((a, b) => T(b.date) - T(a.date));
  const groups = new Map();
  txs.forEach((t) => { const k = isoDate(new Date(t.date)); (groups.get(k) || groups.set(k, []).get(k)).push(t); });
  return el("section", { "aria-label": "Movimenti" }, el("div", { class: "h2" }, "Movimenti", el("span", { class: "right row" },
    el("button", { type: "button", class: "btn sm ok", onclick: () => txSheet("entrata") }, icon("plus", 15), "Entrata"),
    el("button", { type: "button", class: "btn sm danger", onclick: () => txSheet("uscita") }, icon("plus", 15), "Uscita"))),
  txs.length ? [...groups].map(([k, items]) => el("div", { class: "so-day" }, el("div", { class: "small so-dl" }, longDay(items[0].date)),
    el("div", { class: "list" }, items.map((t) => el("button", { type: "button", class: "li so-tx", onclick: () => txSheet(t.kindRaw, t), "aria-label": `${t.title}, ${money(t.amount)}. Modifica` },
      el("span", { class: "so-ico " + (t.kindRaw === "entrata" ? "in" : "out") }, icon(t.kindRaw === "entrata" ? "plus" : "arrow", 16)),
      el("span", { class: "so-tt" }, el("span", { class: "t" }, t.title), el("span", { class: "s" }, catLabel(t) + (t.note ? " · " + t.note : ""))),
      el("b", { class: "so-amt " + (t.kindRaw === "entrata" ? "in" : "out") }, (t.kindRaw === "entrata" ? "+" : "−") + money(t.amount)))))))
    : el("div", { class: "card empty" }, "Nessun movimento in questo mese."));
}

// ---------- debts ----------
function debtSheet(d) {
  sheet(d ? "Modifica debito" : "Nuovo debito", [
    { name: "name", label: "Con chi", value: d?.name, required: true },
    { name: "amount", label: "Importo (€)", type: "number", step: 0.01, value: d?.amount, required: true },
    { name: "due", label: "Scadenza", type: "date", value: isoDate(d?.due) },
    { name: "note", label: "Nota", value: d?.note },
  ], (v) => db.save("debts", d?.id || db.newId(), { ...v, paid: d?.paid || false, paidAt: d?.paidAt || null }, d), d ? { onDelete: () => db.remove("debts", d.id) } : {});
}
function payDebt(d, paid) {
  db.save("debts", d.id, { paid, paidAt: paid ? new Date() : null }, d).then(async () => {
    if (paid) { await addTx("Debito: " + d.name, d.amount, "uscita", "debiti", d.note || ""); toast("Pagato e registrato tra le uscite"); }
  });
}
function debts() {
  const open = S.debts.filter((d) => !d.paid).sort((a, b) => (a.due ? T(a.due) : 9e15) - (b.due ? T(b.due) : 9e15));
  const paid = S.debts.filter((d) => d.paid);
  const row = (d) => el("div", { class: "li so-debt" + (d.paid ? " paid" : "") },
    el("label", { class: "tu-chk" }, el("input", { type: "checkbox", checked: !!d.paid, "aria-label": `${d.name} pagato`, onchange: (e) => payDebt(d, e.target.checked) })),
    el("button", { type: "button", class: "so-row", onclick: () => debtSheet(d) }, el("span", { class: "t" }, d.name), el("span", { class: "s" }, (d.due ? "Entro " + day(d.due) : "Senza scadenza") + (d.note ? " · " + d.note : ""))),
    el("b", {}, money(d.amount)), !d.paid && d.due ? dayBadge(d.due) : null);
  return el("div", { class: "card so-card" }, el("div", { class: "row" }, el("h3", { class: "so-h3" }, "Debiti"), chip(money(sum(open)), "var(--red)"), el("span", { class: "spacer" }),
    el("button", { type: "button", class: "btn sm", onclick: () => debtSheet() }, icon("plus", 15), "Debito")),
  open.length ? el("div", { class: "so-lst" }, open.map(row)) : el("div", { class: "small so-none" }, "Nessun debito aperto."),
  paid.length ? el("details", { class: "tu-done" }, el("summary", {}, `Pagati (${paid.length})`), el("div", { class: "so-lst" }, paid.map(row))) : null);
}

// ---------- planned ----------
function planSheet(p) {
  sheet(p ? "Modifica spesa" : "Nuova spesa in programma", [
    { name: "title", label: "Cosa", value: p?.title, required: true },
    { name: "amount", label: "Importo (€)", type: "number", step: 0.01, value: p?.amount, required: true },
    { name: "due", label: "Entro il", type: "date", value: isoDate(p?.due) },
    { name: "priorityRaw", label: "Priorità", type: "select", value: p?.priorityRaw || "importante", options: Object.entries(PRIO).map(([k, v]) => [k, v[0]]) },
    { name: "categoryRaw", label: "Categoria", type: "select", value: p?.categoryRaw || "altroOut", options: Object.entries(CAT_OUT) },
    { name: "note", label: "Nota", value: p?.note },
    { name: "link", label: "Link", value: p?.link },
  ], (v) => db.save("planned", p?.id || db.newId(), v, p), p ? { onDelete: () => db.remove("planned", p.id) } : {});
}
async function buy(p) {
  const txKey = await addTx(p.title, p.amount, "uscita", p.categoryRaw || "altroOut", p.note || "");
  await db.save("planned", p.id, { bought: true, boughtAt: new Date(), txKey }, p); toast("Comprato e registrato tra le uscite");
}
function planned() {
  const open = S.planned.filter((p) => !p.bought).sort((a, b) => (PRIO[a.priorityRaw]?.[2] ?? 1) - (PRIO[b.priorityRaw]?.[2] ?? 1) || (a.due ? T(a.due) : 9e15) - (b.due ? T(b.due) : 9e15));
  return el("div", { class: "card so-card" }, el("div", { class: "row" }, el("h3", { class: "so-h3" }, "In programma"), chip(money(sum(open)), "var(--amber)"), el("span", { class: "spacer" }),
    el("button", { type: "button", class: "btn sm", onclick: () => planSheet() }, icon("plus", 15), "Spesa")),
  open.length ? el("div", { class: "so-lst" }, open.map((p) => { const pr = PRIO[p.priorityRaw] || PRIO.importante;
    return el("div", { class: "li so-plan" }, el("button", { type: "button", class: "so-row", onclick: () => planSheet(p) }, el("span", { class: "t" }, p.title),
      el("span", { class: "s" }, [pr[0], p.due ? "entro " + day(p.due) : ""].filter(Boolean).join(" · "))),
    el("b", {}, money(p.amount)), p.due ? dayBadge(p.due) : null, el("button", { type: "button", class: "btn sm ok", "aria-label": "Segna " + p.title + " come comprato", onclick: () => buy(p) }, "Comprato")); }))
    : el("div", { class: "small so-none" }, "Niente in programma."));
}

// ---------- savings ----------
function savings() {
  const s = S.settings || {};
  const target = s.savingsTarget || 0, saved = s.savingsSaved || 0, pct = target ? saved / target : 0;
  const dl = s.savingsDeadline ? daysTo(s.savingsDeadline) : null;
  const months = dl != null ? Math.max(dl / 30.44, 0) : null;
  const need = months ? Math.max(0, target - saved) / Math.max(months, 1) : null;
  const add = (n) => db.save("settings", "main", { savingsSaved: Math.max(0, saved + n) }, S.settings);
  return el("div", { class: "card so-card so-sav" }, el("h3", { class: "so-h3" }, "Risparmi"),
    el("div", { class: "row so-sav-r" }, ring(pct, "var(--mint)", 96, 10), el("div", {}, num("so-sav", saved, (v) => money(Math.round(v)), "mid"), el("div", { class: "small" }, `su ${money(target)} · ${Math.round(pct * 100)}%`),
      dl != null ? el("div", { class: "small" }, dl >= 0 ? `${dl} giorni al ${day(s.savingsDeadline)}` : `Scaduto il ${day(s.savingsDeadline)}`) : null,
      need != null && saved < target ? el("div", { class: "small" }, `Servono circa ${money(Math.ceil(need))} al mese`) : saved >= target && target ? el("div", { class: "small" }, "Obiettivo raggiunto.") : null)),
    el("div", { class: "row so-sav-a" }, el("button", { type: "button", class: "btn sm", onclick: () => add(50) }, "+50 €"), el("button", { type: "button", class: "btn sm", onclick: () => add(100) }, "+100 €"),
      el("button", { type: "button", class: "btn sm", onclick: () => sheet("Imposta risparmi", [
        { name: "savingsSaved", label: "Messi da parte (€)", type: "number", step: 10, value: saved }, { name: "savingsTarget", label: "Obiettivo (€)", type: "number", step: 50, value: target, required: true },
        { name: "savingsDeadline", label: "Entro il", type: "date", value: isoDate(s.savingsDeadline) }],
      (v) => db.save("settings", "main", { savingsSaved: v.savingsSaved || 0, savingsTarget: v.savingsTarget, savingsDeadline: v.savingsDeadline || s.savingsDeadline || null }, S.settings)) }, "Imposta")));
}

view("soldi", { title: "Soldi", icon: "soldi", order: 7, render(root) {
  root.append(el("h1", { class: "h1" }, "Soldi"), hero(),
    el("div", { class: "so-top" }, chart(), breakdown()), movements(),
    el("div", { class: "grid two so-cards" }, debts(), planned()), el("div", { class: "so-save" }, savings()));
} });
