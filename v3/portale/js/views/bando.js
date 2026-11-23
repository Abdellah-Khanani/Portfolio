import {view, S, db, icon, day, daysTo, num, ring } from "../app.js";
import { el, bar, chip } from "./turno.js";

const THRESH = 17, MAXP = 25;
const SCEN = [["Tutto pieno", 20], ["Spese solo «sufficienti»", 18], ["Descrizione solo «adeguata»", 17],
  ["Descrizione 3 e spese 2", 15], ["Formazione solo «sufficiente»", 16], ["Con 1.500 € versati prima", 22]];
const PHASE_C = ["var(--blue)", "var(--violet)", "var(--mint)", "var(--amber)", "var(--pink)", "var(--cyan)"];

function countdown(label, date, sub, color, win) {
  const n = daysTo(date);
  const inWin = win && daysTo(win) >= 0 && n <= 0;
  const past = win ? daysTo(win) < 0 : n < 0;
  return el("div", { class: "card tint ba-cd", style: { "--c": color } }, el("div", { class: "small" }, label),
    inWin ? el("div", { class: "mid" }, "In corso") : past ? el("div", { class: "mid" }, "Passato") : el("div", { class: "row ba-n" }, num("ba-" + label, Math.max(0, n), undefined, "big"), el("span", { class: "small" }, n === 1 ? "giorno" : "giorni")),
    el("div", { class: "small" }, sub));
}

view("bando", { title: "Bando", icon: "bando", order: 8, render(root) {
  const items = [...S.bando].sort((a, b) => (a.phaseOrder - b.phaseOrder) || (a.order - b.order));
  const done = items.filter((i) => i.done).length, total = items.length;
  const pct = total ? done / total : 0;
  const phases = [];
  items.forEach((i) => { let p = phases.find((x) => x.name === i.phase); if (!p) phases.push((p = { name: i.phase, items: [] })); p.items.push(i); });
  const bd = S.settings?.borsaDate ? new Date(S.settings.borsaDate) : new Date("2026-11-27T12:00:00");
  const y = bd.getFullYear();

  const hero = el("section", { class: "hero ba-hero" }, el("div", { class: "aurora" }),
    el("div", { class: "ba-hero-in" }, el("div", {}, el("div", { class: "small" }, "Bando Autoimpiego · voucher 30.000 €"),
      el("div", { class: "ba-pts" }, num("ba-pts", 20, undefined, "big"), el("span", { class: "small" }, `punti stimati · soglia ${THRESH}`)),
      el("div", { class: "ba-chance" }, el("span", { class: "ba-dot" }), "Possibilità ≈ 70%"),
      el("div", { class: "small" }, `${done} di ${total} passi fatti`)),
    ring(pct, "#34E5A1", 96, 10)));
  hero.querySelector(".ring").append(el("b", { class: "ba-rb" }, Math.round(pct * 100) + "%"));

  const cds = el("div", { class: "grid ba-cds" },
    countdown("Esito borsa", bd, `Il ${day(bd)}`, "var(--blue)"),
    countdown("Partita IVA", new Date(y, 10, 27, 12), "Da aprire tra il 27 e il 30 novembre", "var(--violet)", new Date(y, 10, 30, 12)),
    countdown("Domanda", new Date(y, 11, 1, 12), "Si presenta a dicembre", "var(--amber)"));

  const tl = el("div", { class: "ba-tl" }, phases.map((p, pi) => {
    const d = p.items.filter((i) => i.done).length, c = PHASE_C[pi % PHASE_C.length], full = d === p.items.length;
    return el("section", { class: "ba-ph" + (full ? " full" : ""), style: { "--c": c } },
      el("header", { class: "ba-phh" }, el("span", { class: "ba-node" }, full ? icon("check", 14) : String(pi + 1)), el("h3", {}, p.name), el("span", { class: "spacer" }), el("span", { class: "small" }, `${d}/${p.items.length}`)),
      el("div", { class: "ba-phb" }, bar(d / p.items.length, c), el("div", { class: "ba-steps" }, p.items.map((i) =>
        el("label", { class: "ba-step" + (i.done ? " done" : "") }, el("input", { type: "checkbox", checked: !!i.done,
          onchange: (e) => db.save("bando", i.id, { done: e.target.checked, doneAt: e.target.checked ? new Date() : null }, i) }),
        el("span", { class: "ba-st" }, el("span", { class: "t" }, i.title), i.detail ? el("span", { class: "s" }, i.detail) : null, i.done && i.doneAt ? el("span", { class: "ba-when" }, "Fatto il " + day(i.doneAt)) : null))))));
  }));

  const scen = el("div", { class: "card ba-scen" }, el("div", { class: "row" }, el("h3", { class: "ba-h3" }, "Scenari di punteggio"), el("span", { class: "spacer" }), chip(`Soglia ${THRESH}`, "var(--amber)")),
    el("div", { class: "ba-sc" }, SCEN.map(([l, v]) => { const ok = v >= THRESH;
      return el("div", { class: "ba-row" }, el("div", { class: "row" }, el("span", { class: "t" }, l), el("span", { class: "spacer" }), el("b", { style: { color: ok ? "var(--mint)" : "var(--red)" } }, v + " punti")),
        el("div", { class: "ba-track" }, bar(v / MAXP, ok ? "var(--mint)" : "var(--red)"), el("i", { class: "ba-th", style: { left: (THRESH / MAXP) * 100 + "%" }, title: "Soglia " + THRESH }))); })),
    el("p", { class: "small" }, "Sotto i 17 punti la domanda non passa: la linea verticale è la soglia."));

  const row = (k, v) => el("div", { class: "ba-kv" }, el("span", { class: "small" }, k), el("b", {}, v));
  const iva = el("div", { class: "card ba-iva" }, el("h3", { class: "ba-h3" }, "Partita IVA"),
    el("div", { class: "small" }, "Codici ATECO e coefficiente di redditività"),
    row("59.11.00 · principale", "67%"), row("74.20.19 e 74.12.09", "78%"), row("62.10.00", "67%"),
    el("div", { class: "ba-sep" }), row("Regime forfettario", "5%"), row("INPS Gestione Separata", "26,07%"),
    el("div", { class: "ba-sep" }), row("Apertura", "Modello AA9/12 via PEC"));

  root.append(el("h1", { class: "h1" }, "Bando"), hero, cds, el("div", { class: "ba-cols" }, el("div", {}, el("h2", { class: "h2" }, "Checklist"), tl), el("div", { class: "ba-side" }, el("h2", { class: "h2" }, "Punteggio"), scen, el("h2", { class: "h2" }, "Fisco"), iva)));
} });
