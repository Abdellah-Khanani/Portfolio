import {view, S, db, icon, money, day, dayBadge, isoDate, num, ring, toast, sheet } from "../app.js";
import { el, bar, chip } from "./turno.js";

const PAL = [["Blu", "var(--blue)"], ["Menta", "var(--mint)"], ["Viola", "var(--violet)"], ["Ambra", "var(--amber)"], ["Rosa", "var(--pink)"], ["Ciano", "var(--cyan)"], ["Rosso", "var(--red)"], ["Indaco", "var(--indigo)"]];
const col = (j) => PAL[((j.colorIndex || 0) % 8 + 8) % 8][1];
const ib = (ic, label, fn, cls = "") => el("button", { type: "button", class: "ib " + cls, "aria-label": label, title: label, onclick: fn }, icon(ic, 17));

function edit(j) {
  const isNew = !j;
  const o = j || { title: "", client: "", stage: "", progress: 0, next: "", link: "", value: 0, deadline: null, colorIndex: S.jobs.length % 8 };
  sheet(isNew ? "Nuovo lavoro" : "Modifica lavoro", [
    { name: "title", label: "Titolo", value: o.title, required: true },
    { name: "client", label: "Cliente", value: o.client },
    { name: "stage", label: "Fase", value: o.stage, placeholder: "Es. Riprese, Montaggio, Consegna" },
    { name: "next", label: "Prossimo passo", value: o.next },
    { name: "progress", label: "Avanzamento (0-100)", type: "number", step: 5, value: o.progress },
    { name: "value", label: "Valore (€)", type: "number", step: 10, value: o.value },
    { name: "deadline", label: "Scadenza", type: "date", value: isoDate(o.deadline) },
    { name: "link", label: "Link", value: o.link, placeholder: "https://" },
    { name: "colorIndex", label: "Colore", type: "select", value: o.colorIndex, options: PAL.map(([n], i) => [i, n]) },
  ], (v) => {
    v.progress = Math.max(0, Math.min(100, Math.round(v.progress || 0))); v.value = Math.max(0, v.value || 0); v.colorIndex = Number(v.colorIndex) || 0;
    const order = j ? j.order : Math.max(0, ...S.jobs.map((x) => x.order || 0)) + 1;
    return db.save("jobs", j?.id || db.newId(), { ...v, order }, j);
  }, j ? { onDelete: () => db.remove("jobs", j.id), deleteText: `Eliminare «${j.title}»?` } : {});
}

function incasso(j) {
  const paid = S.transactions.filter((t) => t.jobKey === j.id).reduce((s, t) => s + (t.amount || 0), 0);
  sheet("Segna incasso", [
    { name: "title", label: "Descrizione", value: "Incasso · " + j.title, required: true },
    { name: "amount", label: "Importo (€)", type: "number", step: 10, value: Math.max(0, (j.value || 0) - paid) || j.value || "", required: true },
    { name: "date", label: "Data", type: "date", value: isoDate(new Date()), required: true },
  ], (v) => db.save("transactions", db.newId(), { title: v.title, amount: v.amount, kindRaw: "entrata", categoryRaw: "lavoro", date: v.date, note: j.client || "", jobKey: j.id }),
  { doneText: "Incasso registrato in Soldi" });
}

function jobCard(j, arch) {
  const paid = S.transactions.filter((t) => t.jobKey === j.id).reduce((s, t) => s + (t.amount || 0), 0);
  const c = col(j);
  return el("article", { class: "card tint hov lv-card" + (arch ? " arch" : ""), style: { "--c": c } },
    el("div", { class: "lv-top" }, ring((j.progress || 0) / 100, c, 64, 7), ...[]),
    el("div", { class: "lv-main" },
      el("div", { class: "row lv-h" }, el("h3", { class: "lv-t" }, j.title), j.deadline ? dayBadge(j.deadline) : null),
      el("div", { class: "small" }, [j.client, j.stage].filter(Boolean).join(" · ") || "Senza cliente"),
      j.next ? el("div", { class: "lv-next" }, icon("arrow", 14), el("span", {}, j.next)) : null,
      bar((j.progress || 0) / 100, c),
      el("div", { class: "row lv-meta" },
        j.value ? chip(money(j.value), c) : null, paid ? chip("Incassato " + money(paid), "var(--mint)") : null,
        j.deadline ? el("span", { class: "small" }, "Scade il " + day(j.deadline)) : null,
        j.link ? el("a", { class: "lv-link", href: /^https?:/.test(j.link) ? j.link : "https://" + j.link, target: "_blank", rel: "noopener", "aria-label": "Apri link di " + j.title }, icon("link", 14), "Link") : null),
      el("div", { class: "row lv-acts" },
        arch ? null : el("button", { type: "button", class: "btn sm ok", onclick: () => incasso(j) }, icon("soldi", 15), "Segna incasso"),
        el("button", { type: "button", class: "btn sm", onclick: () => edit(j) }, icon("edit", 15), "Modifica"),
        el("span", { class: "spacer" }),
        el("button", { type: "button", class: "btn sm ghost", onclick: () => db.save("jobs", j.id, { archived: !arch }, j).then(() => toast(arch ? "Ripristinato" : "Archiviato")) }, arch ? "Ripristina" : "Archivia"),
        ib("trash", "Elimina " + j.title, () => confirm(`Eliminare «${j.title}»?`) && db.remove("jobs", j.id), "sm danger"))));
}

view("lavori", { title: "Lavori", icon: "lavori", order: 4, render(root) {
  const act = S.jobs.filter((j) => !j.archived).sort((a, b) => (a.order || 0) - (b.order || 0));
  const arc = S.jobs.filter((j) => j.archived);
  const avg = act.length ? act.reduce((s, j) => s + (j.progress || 0), 0) / act.length : 0;
  const exp = act.reduce((s, j) => s + (j.value || 0), 0);
  root.append(
    el("div", { class: "row lv-head" }, el("h1", { class: "h1" }, "Lavori"), el("span", { class: "spacer" }),
      el("button", { type: "button", class: "btn primary", onclick: () => edit(null) }, icon("plus", 16), "Lavoro")),
    el("div", { class: "grid lv-stats" },
      el("div", { class: "card" }, el("div", { class: "small" }, "Lavori attivi"), num("lv-n", act.length, undefined, "mid")),
      el("div", { class: "card row" }, el("div", {}, el("div", { class: "small" }, "Avanzamento medio"), num("lv-a", avg, (v) => Math.round(v) + "%", "mid")), el("span", { class: "spacer" }), ring(avg / 100, "var(--violet)", 48, 6)),
      el("div", { class: "card" }, el("div", { class: "small" }, "Valore atteso"), num("lv-v", exp, (v) => money(Math.round(v)), "mid"))),
    act.length ? el("div", { class: "grid two lv-grid" }, act.map((j) => jobCard(j, false))) : el("div", { class: "card empty" }, "Nessun lavoro attivo."),
    arc.length ? el("details", { class: "lv-arch" }, el("summary", {}, `Archiviati (${arc.length})`), el("div", { class: "grid two lv-grid" }, arc.map((j) => jobCard(j, true)))) : null);
} });
