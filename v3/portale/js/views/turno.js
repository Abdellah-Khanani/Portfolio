import { view, el as baseEl, S, db, icon, money, day, longDay, daysTo, dayBadge, isoDate, fromIso, num, ring, toast, sheet } from "../app.js";

// Local fixes: app.js el() assigns style objects with Object.assign, which drops CSS custom properties (--c, --w).
export const el = (tag, attrs, ...kids) => {
  const n = baseEl(tag, attrs, ...kids);
  if (attrs && typeof attrs.style === "object") for (const [k, v] of Object.entries(attrs.style)) if (k.startsWith("--")) n.style.setProperty(k, v);
  return n;
};
export const bar = (pct, color = "var(--blue)") => el("span", { class: "bar" }, el("i", { style: { "--w": Math.round(Math.max(0, Math.min(1, pct || 0)) * 100) + "%", background: color } }));
export const chip = (text, color = "var(--blue)") => el("span", { class: "chip", style: { "--c": color } }, text);

const KIND = {
  mail: ["Mail", "mail", "var(--blue)"], post: ["Post", "contenuti", "var(--pink)"], proposta: ["Proposta", "spark", "var(--violet)"],
  ricerca: ["Ricerca", "idee", "var(--cyan)"], altro: ["Altro", "spark", "var(--amber)"],
};
const REQ = { nuova: ["Nuova", "var(--amber)"], in_corso: ["In corso", "var(--blue)"], fatta: ["Fatta", "var(--mint)"] };
const GOAL_DEF = () => ({ amount: 1000, by: new Date("2027-01-31T12:00:00") });

let draft = "", taskDraft = "", taskDue = "";
const expanded = new Set();

const ib = (ic, label, fn, cls = "") => el("button", { type: "button", class: "ib " + cls, "aria-label": label, title: label, onclick: fn }, icon(ic, 18));
const ts = (d) => (d ? new Date(d).getTime() : 0);
const firstName = () => { const n = (S.user?.email || "").split("@")[0].replace(/[^a-zA-Z]/g, " ").trim().split(" ")[0] || ""; return n ? n[0].toUpperCase() + n.slice(1) : ""; };
const emailIn = (a) => ((a.target || "") + " " + (a.body || "")).match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] || "";
const mailHref = (a, to) => `mailto:${to}?subject=${encodeURIComponent(a.title || "")}&body=${encodeURIComponent((a.body || "").slice(0, 1800))}`;

function goal() {
  const g = S.business?.goal || {};
  const d = GOAL_DEF();
  return { amount: Number(g.amount) > 0 ? Number(g.amount) : d.amount, by: g.by ? new Date(g.by) : d.by };
}

function hero() {
  const g = goal();
  const ins = S.transactions.filter((t) => t.kindRaw === "entrata");
  const total = ins.reduce((s, t) => s + (t.amount || 0), 0);
  const pct = Math.min(1, total / g.amount);
  const first = [...ins].sort((a, b) => ts(a.date) - ts(b.date))[0];
  const left = daysTo(g.by);
  const h = new Date().getHours();
  const hello = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  return el("section", { class: "hero tu-hero", "aria-label": "Obiettivo di incasso" }, el("div", { class: "aurora" }),
    el("div", { class: "tu-hero-top" },
      el("div", {}, el("div", { class: "small" }, longDay(new Date())), el("h1", { class: "h1 tu-hi" }, `${hello}${firstName() ? ", " + firstName() : ""}`)),
      el("button", { type: "button", class: "btn sm tu-glass", onclick: editGoal }, icon("edit", 15), "Obiettivo")),
    el("div", { class: "tu-goal" },
      el("div", {}, el("div", { class: "small" }, `Incassato verso i ${money(g.amount)}`),
        el("div", { class: "tu-big" }, num("goal-total", total, (v) => money(Math.round(v)), "big"), el("span", { class: "tu-pct" }, Math.round(pct * 100) + "%"))),
      ring(pct, "#34E5A1", 84, 9)),
    bar(pct, "linear-gradient(90deg,#34E5A1,#2EC5FF)"),
    el("div", { class: "tu-hero-foot small" },
      el("span", {}, total >= g.amount ? "Obiettivo raggiunto." : `Mancano ${money(g.amount - total)}`),
      el("span", {}, left == null ? "" : left >= 0 ? `entro il ${day(g.by)} · ${left} giorni` : `scaduto il ${day(g.by)}`)),
    el("div", { class: "small tu-first" }, first ? `Prima entrata: ${first.title} · ${money(first.amount)} il ${day(first.date)}` : "Prima entrata: ancora nessuna. La prima è quella che conta."));
}
function editGoal() {
  const g = goal();
  sheet("Obiettivo di incasso", [
    { name: "amount", label: "Importo (€)", type: "number", value: g.amount, required: true },
    { name: "by", label: "Entro il", type: "date", value: isoDate(g.by), required: true },
  ], (v) => db.save("business", "profile", { goal: { amount: v.amount, by: v.by } }, S.business));
}

function kpis() {
  const sent = S.leads.filter((l) => l.statusRaw && l.statusRaw !== "da_inviare");
  const replied = S.leads.filter((l) => ["risposto", "trattativa", "chiuso"].includes(l.statusRaw) || (l.replyAt && l.statusRaw !== "da_inviare"));
  const rate = sent.length ? replied.length / sent.length : 0;
  const jobs = S.jobs.filter((j) => !j.archived);
  const avg = jobs.length ? jobs.reduce((s, j) => s + (j.progress || 0), 0) / jobs.length / 100 : 0;
  const bd = daysTo(S.settings?.borsaDate);
  const debts = S.debts.filter((d) => !d.paid);
  const nextDebt = debts.filter((d) => d.due).sort((a, b) => ts(a.due) - ts(b.due))[0];
  const plan = S.planned.filter((p) => !p.bought);
  const card = (href, label, body, foot) => el("a", { class: "card hov tu-kpi", href }, el("div", { class: "small" }, label), body, foot);
  return el("div", { class: "grid tu-kpis" },
    card("#clienti", "Proposte inviate", el("div", { class: "row tu-kv" }, num("k-sent", sent.length, undefined, "mid"), el("span", { class: "small" }, `su ${S.leads.length} contatti`)),
      el("div", { class: "tu-kf" }, bar(rate, "var(--blue)"), el("span", { class: "small" }, `Risposta ${Math.round(rate * 100)}% · ${replied.length} su ${sent.length}`))),
    card("#lavori", "Lavori attivi", el("div", { class: "row tu-kv" }, num("k-jobs", jobs.length, undefined, "mid"), ring(avg, "var(--violet)", 46, 6)),
      el("span", { class: "small" }, `Avanzamento medio ${Math.round(avg * 100)}%`)),
    card("#bando", "Esito borsa", el("div", { class: "row tu-kv" }, num("k-borsa", bd == null ? 0 : Math.max(0, bd), undefined, "mid"), el("span", { class: "small" }, "giorni")),
      el("span", { class: "small" }, S.settings?.borsaDate ? (bd >= 0 ? `Il ${day(S.settings.borsaDate)}` : `Era il ${day(S.settings.borsaDate)}`) : "Data non impostata")),
    card("#soldi", "Debiti aperti", el("div", { class: "row tu-kv" }, num("k-debts", debts.reduce((s, d) => s + (d.amount || 0), 0), (v) => money(Math.round(v)), "mid"), nextDebt ? dayBadge(nextDebt.due) : null),
      el("span", { class: "small" }, nextDebt ? `Prossimo: ${nextDebt.name}` : debts.length ? "Nessuna scadenza" : "Nessun debito")),
    card("#soldi", "Spese in programma", el("div", { class: "row tu-kv" }, num("k-plan", plan.reduce((s, p) => s + (p.amount || 0), 0), (v) => money(Math.round(v)), "mid")),
      el("span", { class: "small" }, `${plan.length} ${plan.length === 1 ? "voce" : "voci"}`)));
}

// ---------- approvals ----------
function decide(a, status) { return db.save("approvals", a.id, { status, decidedAt: new Date() }, a).then(() => toast(status === "approvata" ? "Approvato" : "Rifiutato")); }
function editApproval(a) {
  sheet("Modifica", [
    { name: "title", label: "Titolo", value: a.title, required: true },
    { name: "body", label: "Testo", type: "textarea", rows: 9, value: a.body },
    { name: "note", label: "Nota per Claude", type: "textarea", rows: 2, value: a.note, placeholder: "Cosa cambiare, a cosa fare attenzione" },
  ], (v) => db.save("approvals", a.id, { title: v.title, body: v.body, note: v.note }, a));
}
function approvalCard(a, decided) {
  const [kl, ki, kc] = KIND[a.kind] || KIND.altro;
  const long = (a.body || "").length > 160 || (a.body || "").split("\n").length > 3;
  const open = expanded.has(a.id);
  const body = el("div", { class: "tu-body" + (open || !long ? " open" : "") }, a.body || "");
  const to = a.kind === "mail" ? emailIn(a) : "";
  const stat = a.status === "approvata" ? ["Approvata", "var(--mint)"] : a.status === "rifiutata" ? ["Rifiutata", "var(--red)"] : null;
  return el("article", { class: "card tint tu-ap", style: { "--c": kc } },
    el("div", { class: "row tu-ap-h" }, el("span", { class: "tu-ic" }, icon(ki, 18)),
      el("div", { class: "tu-ap-t" }, el("div", { class: "t" }, a.title || "Senza titolo"), el("div", { class: "small" }, `${kl} · ${day(a.createdAt)}${a.target ? " · " + a.target : ""}`)),
      stat ? chip(stat[0], stat[1]) : null),
    body,
    long ? el("button", { type: "button", class: "linkbtn tu-more", "aria-expanded": String(open), onclick: (e) => {
      const o = body.classList.toggle("open"); o ? expanded.add(a.id) : expanded.delete(a.id);
      e.currentTarget.textContent = o ? "Riduci" : "Mostra tutto"; e.currentTarget.setAttribute("aria-expanded", String(o)); } }, open ? "Riduci" : "Mostra tutto") : null,
    a.note ? el("div", { class: "small tu-note" }, "Nota: " + a.note) : null,
    decided ? el("div", { class: "row tu-acts" }, to && a.status === "approvata" ? el("a", { class: "btn sm primary", href: mailHref(a, to) }, icon("mail", 15), "Apri mail") : null,
      el("button", { type: "button", class: "btn sm", onclick: () => db.save("approvals", a.id, { status: "da_approvare", decidedAt: null }, a) }, "Rimetti in attesa"))
      : el("div", { class: "row tu-acts" },
        el("button", { type: "button", class: "btn ok", onclick: () => decide(a, "approvata") }, icon("check", 16), "Approva"),
        el("button", { type: "button", class: "btn", onclick: () => editApproval(a) }, icon("edit", 16), "Modifica"),
        el("button", { type: "button", class: "btn danger", onclick: () => decide(a, "rifiutata") }, icon("x", 16), "Rifiuta"),
        to ? el("a", { class: "btn ghost tu-mailto", href: mailHref(a, to) }, icon("mail", 16), "Apri mail") : null));
}
function approvals() {
  const pend = S.approvals.filter((a) => a.status === "da_approvare").sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  const done = S.approvals.filter((a) => a.status !== "da_approvare").sort((a, b) => ts(b.decidedAt || b.createdAt) - ts(a.decidedAt || a.createdAt));
  return el("section", { "aria-label": "Da approvare" },
    el("h2", { class: "h2" }, "Da approvare", pend.length ? chip(String(pend.length), "var(--red)") : null),
    pend.length ? el("div", { class: "stack" }, pend.map((a) => approvalCard(a, false)))
      : el("div", { class: "card empty tu-empty" }, el("span", { class: "tu-ic big" }, icon("check", 22)), el("div", { class: "t" }, "Tutto a posto"), el("div", { class: "small" }, "Quando Claude prepara una mail, un post o una proposta la trovi qui, pronta da approvare.")),
    done.length ? el("details", { class: "tu-done" }, el("summary", {}, `Decise (${done.length})`), el("div", { class: "stack" }, done.map((a) => approvalCard(a, true)))) : null);
}

// ---------- requests ----------
function sendRequest() {
  const text = draft.trim();
  if (!text) { toast("Scrivi prima la richiesta", "err"); return; }
  draft = "";
  db.save("requests", db.newId(), { text, status: "nuova", result: "", createdAt: new Date(), from: S.user?.email || "" }).then(() => toast("Richiesta lasciata"));
}
function requests() {
  const list = [...S.requests].sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  const ta = el("textarea", { rows: 3, placeholder: "Es. prepara una mail di follow-up per i ristoranti che non hanno risposto", "aria-label": "Richiesta per Claude",
    oninput: (e) => (draft = e.target.value), onkeydown: (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendRequest(); } });
  ta.value = draft;
  return el("section", { "aria-label": "Chiedi a Claude" }, el("h2", { class: "h2" }, "Chiedi a Claude"),
    el("div", { class: "card stack" },
      el("p", { class: "small tu-explain" }, "Claude legge le richieste quando lavori con lui e ti lascia il risultato qui o tra le approvazioni."),
      ta, el("div", { class: "row" }, el("span", { class: "spacer" }), el("button", { type: "button", class: "btn primary", onclick: sendRequest }, icon("arrow", 16), "Lascia la richiesta")),
      list.length ? el("div", { class: "tu-reqs" }, list.map((r) => {
        const [rl, rc] = REQ[r.status] || REQ.nuova;
        return el("div", { class: "tu-req" }, el("div", { class: "row" }, chip(rl, rc), el("span", { class: "small" }, day(r.createdAt)), el("span", { class: "spacer" }),
          ib("trash", "Elimina richiesta", () => confirm("Eliminare la richiesta?") && db.remove("requests", r.id), "sm")),
          el("div", { class: "tu-req-t" }, r.text), r.result ? el("div", { class: "tu-res" }, el("b", {}, "Risposta di Claude"), el("div", {}, r.result)) : null);
      })) : null));
}

// ---------- next moves ----------
function moves() {
  const out = [];
  S.tasks.filter((t) => !t.done && t.due && daysTo(t.due) <= 0).forEach((t) => out.push({ k: daysTo(t.due), ic: "check", t: t.text, s: "Attività", href: "#turno", d: t.due }));
  S.leads.filter((l) => l.statusRaw === "inviata" && l.followUp && daysTo(l.followUp) <= 0).forEach((l) => out.push({ k: daysTo(l.followUp), ic: "mail", t: `Follow-up a ${l.name}`, s: l.city || "Cliente", href: "#clienti", d: l.followUp }));
  const nb = [...S.bando].filter((b) => !b.done).sort((a, b) => (a.phaseOrder - b.phaseOrder) || (a.order - b.order))[0];
  if (nb) out.push({ k: 1, ic: "bando", t: nb.title, s: "Bando · " + nb.phase, href: "#bando" });
  S.debts.filter((d) => !d.paid && d.due && daysTo(d.due) <= 7).forEach((d) => out.push({ k: daysTo(d.due), ic: "soldi", t: `Pagare ${d.name} (${money(d.amount)})`, s: "Debito", href: "#soldi", d: d.due }));
  S.planned.filter((p) => !p.bought && p.due && daysTo(p.due) <= 14).forEach((p) => out.push({ k: daysTo(p.due), ic: "soldi", t: `${p.title} (${money(p.amount)})`, s: "Spesa in programma", href: "#soldi", d: p.due }));
  out.sort((a, b) => a.k - b.k);
  const top = out.slice(0, 7);
  return el("section", { "aria-label": "Prossime mosse" }, el("h2", { class: "h2" }, "Prossime mosse"),
    top.length ? el("div", { class: "list" }, top.map((m) => el("a", { class: "li tu-move", href: m.href },
      el("span", { class: "tu-ic sm" }, icon(m.ic, 16)), el("div", { class: "tu-mt" }, el("div", { class: "t" }, m.t), el("div", { class: "s" }, m.s)), m.d ? dayBadge(m.d) : null, icon("arrow", 14))))
      : el("div", { class: "card empty" }, "Niente di urgente. Giornata libera per i clienti."));
}

// ---------- tasks ----------
function addTask(e) {
  e.preventDefault();
  const text = taskDraft.trim(); if (!text) return;
  const due = taskDue ? fromIso(taskDue) : null;
  taskDraft = ""; taskDue = "";
  db.save("tasks", db.newId(), { text, due, done: false, doneAt: null, createdAt: new Date() });
}
function taskRow(t) {
  const late = !t.done && t.due && daysTo(t.due) < 0;
  return el("div", { class: "li tu-task" + (t.done ? " done" : "") },
    el("label", { class: "tu-chk" }, el("input", { type: "checkbox", checked: !!t.done, "aria-label": "Fatto: " + t.text,
      onchange: (e) => db.save("tasks", t.id, { done: e.target.checked, doneAt: e.target.checked ? new Date() : null }, t) })),
    el("div", { class: "tu-mt" }, el("div", { class: "t" }, t.text), t.due ? el("div", { class: "s" }, (late ? "Scaduta " : "Entro ") + day(t.due)) : null),
    !t.done && t.due ? dayBadge(t.due) : null, ib("trash", "Elimina attività", () => db.remove("tasks", t.id), "sm"));
}
function tasks() {
  const open = S.tasks.filter((t) => !t.done).sort((a, b) => (a.due ? ts(a.due) : 9e15) - (b.due ? ts(b.due) : 9e15));
  const done = S.tasks.filter((t) => t.done).sort((a, b) => ts(b.doneAt) - ts(a.doneAt));
  const inp = el("input", { type: "text", placeholder: "Nuova attività", "aria-label": "Nuova attività", oninput: (e) => (taskDraft = e.target.value) }); inp.value = taskDraft;
  const due = el("input", { type: "date", "aria-label": "Scadenza", class: "tu-due", oninput: (e) => (taskDue = e.target.value) }); due.value = taskDue;
  return el("section", { "aria-label": "Attività" }, el("h2", { class: "h2" }, "Attività", chip(`${open.length} aperte`, "var(--blue)")),
    el("form", { class: "card tu-add", onsubmit: addTask }, inp, due, el("button", { class: "btn primary", type: "submit" }, icon("plus", 16), "Aggiungi")),
    open.length ? el("div", { class: "list tu-tasks" }, open.map(taskRow)) : el("div", { class: "card empty" }, "Nessuna attività aperta."),
    done.length ? el("details", { class: "tu-done" }, el("summary", {}, `Completate (${done.length})`), el("div", { class: "list" }, done.slice(0, 15).map(taskRow))) : null);
}

view("turno", { title: "Turno", icon: "turno", order: 1, render(root) {
  root.append(hero(), kpis(), el("div", { class: "tu-cols" }, el("div", { class: "tu-col" }, approvals(), requests()), el("div", { class: "tu-col" }, moves(), tasks())));
} });
