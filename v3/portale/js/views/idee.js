// Idee — kanban delle idee per fare soldi, con punteggio guadagno / costo / sforzo.
import { view, el, icon, S, db, money, num, chip, toast, sheet, render } from "../app.js";

const COLS = [["nuova", "Nuove", "var(--cyan)"], ["valutazione", "In valutazione", "var(--amber)"], ["prova", "In prova", "var(--violet)"],
  ["fatta", "Fatte", "var(--mint)"], ["scartata", "Scartate", "var(--ink3)"]];
const NEXT = { nuova: "valutazione", valutazione: "prova", prova: "fatta" };
const LABEL = Object.fromEntries(COLS.map((c) => [c[0], c[1]]));
const STARTERS = ["Pacchetto reel mensile per ristoranti", "Studio grafiche in abbonamento per negozi di videogiochi",
  "Menu e grafiche stampa per bar e bistrot", "Shooting eventi e tornei nei negozi di giochi"];
const EFFORT = ["", "Poco sforzo", "Sforzo medio", "Tanto sforzo"];

let sortScore = false, dragId = null;

const raw = (i) => (Number(i.gain) || 0) / (1 + (Number(i.cost) || 0) / 100) / (Number(i.effort) || 2);
function scores() {
  const max = Math.max(0, ...S.ideas.map(raw)), m = new Map();
  S.ideas.forEach((i) => m.set(i.id, max > 0 ? Math.round((raw(i) / max) * 100) : 0));
  return m;
}
const scoreColor = (s) => (s >= 66 ? "var(--mint)" : s >= 33 ? "var(--amber)" : "var(--ink3)");
const stageOf = (i) => (LABEL[i.stage] ? i.stage : "nuova");

function ideaSheet(idea, stage) {
  sheet(idea ? "Modifica idea" : "Nuova idea", [
    { name: "title", label: "Titolo", value: idea?.title, required: true },
    { name: "text", label: "Descrizione", type: "textarea", rows: 4, value: idea?.text },
    { name: "stage", label: "Stato", type: "select", value: idea ? stageOf(idea) : stage || "nuova", options: COLS.map((c) => [c[0], c[1]]) },
    { name: "gain", label: "Guadagno potenziale al mese (€)", type: "number", value: idea?.gain || "", step: "any" },
    { name: "cost", label: "Costo per partire (€)", type: "number", value: idea?.cost || "", step: "any" },
    { name: "effort", label: "Sforzo", type: "select", value: idea?.effort || 2, options: [[1, "1 · Poco"], [2, "2 · Medio"], [3, "3 · Tanto"]] },
    { name: "next", label: "Prossimo passo", value: idea?.next },
  ], (v) => db.save("ideas", idea?.id, { ...v, gain: v.gain || 0, cost: v.cost || 0, effort: Number(v.effort) || 2, createdAt: idea?.createdAt || new Date() }, idea),
  idea ? { onDelete: () => db.remove("ideas", idea.id), deleteText: "Eliminare questa idea?" } : {});
}

const move = (idea, stage) => { if (stageOf(idea) !== stage) db.save("ideas", idea.id, { stage }, idea); };

function toastLink(msg, href, label) {
  const t = el("div", { class: "toast ok", role: "status" }, msg + " ", el("a", { href, class: "id-tl" }, label));
  document.body.append(t); setTimeout(() => t.classList.add("out"), 4200); setTimeout(() => t.remove(), 4700);
}
async function toJob(idea) {
  const order = Math.max(0, ...S.jobs.map((j) => j.order || 0)) + 1;
  const jobId = await db.save("jobs", null, { title: idea.title, client: "", stage: "Da idea", progress: 0, next: idea.next || "", link: "", order,
    value: Number(idea.gain) || 0, deadline: null, colorIndex: 0, archived: false });
  await db.save("ideas", idea.id, { jobId, stage: stageOf(idea) === "nuova" || stageOf(idea) === "valutazione" ? "prova" : idea.stage }, idea);
  toastLink("Lavoro creato.", "#lavori", "Vai a Lavori");
}
async function toTask(idea) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  await db.save("tasks", null, { text: idea.next ? `${idea.title}: ${idea.next}` : `Idea: ${idea.title}`, due: d, done: false, doneAt: null, createdAt: new Date() });
  toast("Cosa da fare creata per oggi");
}

function card(i, sc) {
  const st = stageOf(i), s = sc.get(i.id) || 0, nxt = NEXT[st];
  const c = el("article", { class: "id-card" + (i.jobId ? " haslink" : ""), draggable: "true", "data-id": i.id,
    ondragstart: (e) => { dragId = i.id; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", i.id); requestAnimationFrame(() => c.classList.add("drag")); document.body.classList.add("id-dragging"); },
    ondragend: () => { dragId = null; c.classList.remove("drag"); document.body.classList.remove("id-dragging"); document.querySelectorAll(".id-col.over").forEach((n) => n.classList.remove("over")); } },
  el("div", { class: "id-top" }, el("h3", {}, i.title),
    el("span", { class: "id-score", style: { "--c": scoreColor(s) }, title: "Punteggio: guadagno rispetto a costo e sforzo, 0-100" }, el("small", {}, "Punti"), String(s))),
  i.text ? el("p", { class: "id-text" }, i.text) : null,
  el("div", { class: "id-meta" },
    i.gain ? chip(money(i.gain) + "/mese", "var(--mint)") : chip("guadagno da stimare", "var(--ink3)"),
    i.cost ? chip("costo " + money(i.cost), "var(--amber)") : null,
    el("span", { class: "id-eff", title: EFFORT[i.effort || 2], "aria-label": EFFORT[i.effort || 2] }, [1, 2, 3].map((n) => el("i", { class: n <= (i.effort || 2) ? "on" : "" })))),
  i.next ? el("p", { class: "id-next" }, icon("arrow", 13), i.next) : null,
  el("div", { class: "id-acts" },
    i.jobId ? el("a", { class: "btn sm id-job", href: "#lavori" }, icon("lavori", 14), "In Lavori") : el("button", { class: "btn sm", type: "button", onclick: () => toJob(i) }, icon("lavori", 14), "Trasforma in lavoro"),
    el("button", { class: "btn sm", type: "button", onclick: () => toTask(i) }, icon("check", 14), "Crea cosa da fare"),
    el("span", { class: "spacer" }),
    el("button", { class: "id-ib", type: "button", "aria-label": "Modifica " + i.title, onclick: () => ideaSheet(i) }, icon("edit", 15)),
    nxt ? el("button", { class: "id-ib go", type: "button", "aria-label": "Sposta in " + LABEL[nxt], title: "Sposta in " + LABEL[nxt], onclick: () => move(i, nxt) }, icon("arrow", 16))
      : el("button", { class: "id-ib", type: "button", "aria-label": "Riporta tra le nuove", title: "Riporta tra le nuove", onclick: () => move(i, "nuova") }, icon("spark", 15))));
  return c;
}

view("idee", { title: "Idee", icon: "idee", order: 5, render(root) {
  const sc = scores(), live = S.ideas.filter((i) => stageOf(i) !== "scartata");
  const potential = live.reduce((a, i) => a + (Number(i.gain) || 0), 0);
  const testing = S.ideas.filter((i) => stageOf(i) === "prova").length;
  const best = [...live].sort((a, b) => (sc.get(b.id) || 0) - (sc.get(a.id) || 0))[0];

  root.append(el("div", { class: "id-head" }, el("h1", { class: "h1" }, "Idee"), el("span", { class: "spacer" }),
    el("div", { class: "seg", role: "group", "aria-label": "Ordinamento" },
      el("button", { type: "button", class: sortScore ? "" : "on", onclick: () => { sortScore = false; render(); } }, "Manuale"),
      el("button", { type: "button", class: sortScore ? "on" : "", onclick: () => { sortScore = true; render(); } }, "Per punteggio")),
    el("button", { class: "btn primary", type: "button", onclick: () => ideaSheet() }, icon("plus", 16), "Nuova idea")));

  root.append(el("div", { class: "grid id-stats" },
    el("div", { class: "card id-stat" }, el("span", { class: "eyebrow" }, "Idee attive"), num("id-n", live.length, (v) => Math.round(v), "big")),
    el("div", { class: "card id-stat" }, el("span", { class: "eyebrow" }, "Potenziale al mese"), num("id-p", potential, (v) => money(Math.round(v)), "big")),
    el("div", { class: "card id-stat" }, el("span", { class: "eyebrow" }, "In prova"), num("id-t", testing, (v) => Math.round(v), "big")),
    el("div", { class: "card id-stat" }, el("span", { class: "eyebrow" }, "Idea in testa"), el("b", { class: "id-best" }, best && sc.get(best.id) ? best.title : "Aggiungi guadagno e sforzo per vederla"))));

  if (!S.ideas.length) root.append(el("div", { class: "card id-start" }, el("h2", { class: "h2", style: { margin: "0 0 4px" } }, "Parti da un'idea"),
    el("p", { class: "small" }, "Un tocco la aggiunge tra le nuove. Guadagno e costo li stimi dopo."),
    el("div", { class: "at-seeds id-seeds" }, STARTERS.map((t) => el("button", { class: "id-seed", type: "button",
      onclick: () => db.save("ideas", null, { title: t, text: "", stage: "nuova", gain: 0, cost: 0, effort: 2, next: "", createdAt: new Date() }) }, icon("plus", 14), t)))));

  root.append(el("div", { class: "id-board" }, COLS.map(([key, label, color]) => {
    let list = S.ideas.filter((i) => stageOf(i) === key);
    list = sortScore ? list.sort((a, b) => (sc.get(b.id) || 0) - (sc.get(a.id) || 0)) : list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const sum = list.reduce((a, i) => a + (Number(i.gain) || 0), 0);
    const col = el("section", { class: "id-col", "data-stage": key, style: { "--c": color }, "aria-label": label,
      ondragover: (e) => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; col.classList.add("over"); },
      ondragleave: (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove("over"); },
      ondrop: (e) => { e.preventDefault(); col.classList.remove("over"); const idea = S.ideas.find((i) => i.id === (dragId || e.dataTransfer.getData("text/plain"))); if (idea) move(idea, key); } },
    el("header", { class: "id-ch" }, el("i", { class: "id-dot" }), el("h2", {}, label), el("span", { class: "id-cnt" }, String(list.length)),
      el("span", { class: "spacer" }), sum ? el("small", {}, money(sum)) : null,
      el("button", { class: "id-ib", type: "button", "aria-label": "Nuova idea in " + label, onclick: () => ideaSheet(null, key) }, icon("plus", 15))),
    el("div", { class: "id-list" }, list.length ? list.map((i) => card(i, sc)) : el("p", { class: "id-ph" }, "Trascina qui un'idea")));
    return col;
  })));
} });
