/* Trattoria Esempio, draft v2: copy (IT/DE), menu, booking and reveal logic shared by the three designs.
   Every page marks translatable nodes with data-i="key" and provides #tabs, #dishes, #booking. */

const T = {
 it: {
  nav_casa: "La casa", nav_sera: "La serata", nav_menu: "La carta", nav_foto: "La sala", book: "Prenota",
  hero_h: "Il mare di Napoli, <em>a lume di candela.</em>",
  hero_p: "Pesce del Mediterraneo e pizza dal forno a legna, nel cuore di Bolzano.",
  hero_menu: "Sfoglia la carta",
  mich: "Pesce fresco e forno a legna",
  casa_h: "Una famiglia napoletana, a Bolzano.",
  casa_p1: "Ristoratori da generazioni, gli Esempio hanno portato a Bolzano i profumi di Napoli. i titolari vi accolgono in sala.",
  casa_p2: "Il 90% del pesce arriva dal Mediterraneo, fresco ogni mattina. Preparazioni semplici, perché il sapore resti quello del mare.",
  casa_p3: "E poi la pizza, dal forno a legna. Per chi non mangia pesce ci sono anche carne e piatti vegetariani.",
  q: "«La pizza? Orgoglio italiano, patrimonio dell'umanità!»", q_s: "Scritto sopra il nostro forno a legna",
  sera_h: "Una sera alla Trattoria Esempio",
  sera_p: "Com'è una cena da noi, dall'arrivo al saluto.", swipe: "Scorri",
  s1h: "Le candele, già fuori", s1p: "Sui tavoli della veranda le candele sono accese prima ancora di entrare. Dentro: tovaglie bianche, lampadari di vetro, la musica giusta.",
  s2h: "Alle giacche pensiamo noi", s2p: "Vi accompagniamo al tavolo e portiamo le giacche al guardaroba. A fine serata ve le riportiamo e vi aiutiamo a indossarle.",
  s3h: "Un benvenuto dalla cucina", s3p: "Prima dei piatti arriva un assaggio della casa, come i coni croccanti con tartare di tonno.",
  s4h: "Un drink su misura", s4p: "Ditelo al barman: vi chiede cosa vi piace e lo prepara per voi.",
  s5h: "La cucina vi ascolta", s5p: "Meno piccante, una porzione divisa in due: basta chiederlo.",
  s6h: "Il risotto, servito al tavolo", s6p: "Il risotto Acquerello arriva in padella e lo impiattiamo davanti a voi.",
  s7h: "Nessuna fretta", s7p: "Dopo cena il tavolo resta vostro: restate a parlare quanto volete.",
  menu_h: "La carta",
  menu_p: "Mare e terra, primi e secondi, pizza dal forno a legna. Il pesce cambia con il mercato.",
  menu_soon: "Questa pagina della carta la inseriamo insieme a voi.",
  menu_note: "Demo: piatti e prezzi di esempio.",
  lg_p: "Piccante", lg_g: "Senza glutine",
  foto_h: "La sala, la veranda, il forno",
  book_h: "Prenota un tavolo",
  book_p: "Scegliete giorno, orario e persone: vi confermiamo la prenotazione con un SMS.",
  h_days: "Martedì - Domenica", h_off: "Lunedì", h_offv: "Chiuso",
  addr: "Via dell'Esempio 1, Bolzano",
  l_date: "Giorno", l_people: "Persone", l_time: "Ora", l_you: "Nome", q_people: "Quanti sarete <em>a tavola?</em>", q_day: "Quale <em>giorno?</em>", q_time: "A che <em>ora?</em>", q_who: "Ultima cosa: <em>a che nome?</em>", back: "Indietro", again: "Nuova richiesta", closed: "Chiuso", closed_n: "Il lunedì siamo chiusi", l_lunch: "Pranzo", l_dinner: "Cena", l_where: "Dove", o_any: "Indifferente", o_sala: "In sala", o_ver: "In veranda",
  l_name: "Nome", l_phone: "Telefono", l_notes: "Note", l_notes_h: "Allergie, seggiolone, un'occasione speciale", b_send: "Invia la richiesta", o_more: "9 o più",
  ok_h: "Richiesta inviata", ok_demo: "Demo: nella versione reale la richiesta arriva al ristorante e il cliente riceve la conferma.",
  e_mon: "Il lunedì siamo chiusi: scegliete un altro giorno.", e_slot: "Scegliete un orario.", e_who: "Mancano nome e telefono.",
  ft_bye: "Vi aspettiamo.",
  manifest: "Una cucina di pesce ricercata nel prodotto e semplice nella preparazione, per lasciare integri i sapori autentici del mare.",
  valori: "Il ristorante è più di un lavoro: è la nostra vita. L'amore per il cibo, il servizio e l'ospitalità vengono prima di tutto.",
  storia_k: "La nostra storia",
  storia_p: "Veniamo da Napoli, la città dei profumi e dei sapori. Ristoratori da generazioni, la nostra famiglia ha scelto l'Alto Adige. Oggi i titolari vi accolgono in un locale piccolo, raffinato e autentico.",
  pesce_h: "Il pesce del Mediterraneo",
  pesce_p: "Oltre il 90% del nostro pesce viene dal Mediterraneo e arriva fresco ogni mattina. È più piccolo e più saporito del pesce d'oceano. Per chi preferisce la terra, ci sono anche carne e piatti vegetariani.",
  st1: "del pesce dal Mediterraneo", st2b: "Ogni mattina", st2: "il pesce arriva fresco", st3b: "Legna", st3: "il forno della vera pizza napoletana", st4b: "Mar - Dom", st4: "pranzo e cena",
  mp_h: "Quello che arriva in tavola",
  mp_p: "Nomi che trovate sulla nostra carta: produttori scelti e il mare di stagione.",
  mp1: "Riso Acquerello", mp1d: "Il risotto servito in padella",
  mp2: "Pastificio Mancini", mp2d: "Gli spaghetti allo scoglio",
  mp3: "Benedetto Cavalieri", mp3d: "La pasta delle linguine",
  mp4: "Acciughe del Cantabrico", mp4d: "Nelle linguine alla Ciro",
  mp5: "Bottarga di tonno", mp5d: "Con gli gnocchi alla tarantina",
  mp6: "Astice e aragostella", mp6d: "Tagliolini e linguine",
  mp7: "Granseola", mp7d: "Gli spaghettoni quadrati",
  piatto_k: "Il gesto",
  piatto_h: "Dalla pentola al piatto",
  piatto_p: "Il risotto Acquerello arriva al tavolo nella sua padella. Lo mantechiamo ai molluschi e crostacei, o al ragù di polpo, e lo impiattiamo davanti a voi.",
  pizza_h: "La pizza, dal forno a legna",
  pizza_p: "La vera pizza napoletana, cotta nel forno a legna che vedete dalla sala.",
  bar_h: "La cantina e il bar",
  bar_p: "Una parete di bottiglie illuminate dietro il bancone. E un barman che, se glielo chiedete, vi prepara un drink su misura.",
  ver_h: "La veranda",
  ver_p: "Anche fuori i tavoli sono apparecchiati a lume di candela, tra le luci della veranda.",
  mich_p: "Un locale piccolo, raffinato e autentico, da una famiglia napoletana di ristoratori.",
  dove_h: "Come arrivare", maps: "Apri in Google Maps",
  circ: "Prenota un tavolo · Trattoria Esempio · ",
  menu_btn: "Menu", close: "Chiudi",
  ft_cta: "A presto, alla Trattoria Esempio.",
  mq1: "Pesce del Mediterraneo", mq2: "Pizza dal forno a legna", mq3: "Una famiglia di Napoli",
  prev: "Indietro", next: "Avanti",
  draft: "Stile"
 },
 de: {
  nav_casa: "Das Haus", nav_sera: "Der Abend", nav_menu: "Die Karte", nav_foto: "Der Saal", book: "Reservieren",
  hero_h: "Das Meer Neapels, <em>bei Kerzenlicht.</em>",
  hero_p: "Fisch aus dem Mittelmeer und Pizza aus dem Holzofen, mitten in Bozen.",
  hero_menu: "Zur Karte",
  mich: "Frischer Fisch und Holzofen",
  casa_h: "Eine neapolitanische Familie in Bozen.",
  casa_p1: "Seit Generationen Gastronomen, haben die Esempios die Düfte Neapels nach Bozen gebracht. die Inhaber empfangen Sie im Saal.",
  casa_p2: "90% des Fisches kommen aus dem Mittelmeer, jeden Morgen frisch. Einfach zubereitet, damit er nach Meer schmeckt.",
  casa_p3: "Und dann die Pizza aus dem Holzofen. Wer keinen Fisch isst, findet auch Fleisch und vegetarische Gerichte.",
  q: "«Die Pizza? Italiens Stolz, Erbe der Menschheit!»", q_s: "Über unserem Holzofen geschrieben",
  sera_h: "Ein Abend in der Trattoria Esempio", swipe: "Wischen",
  sera_p: "Wie ein Abendessen bei uns verläuft, von der Ankunft bis zum Abschied.",
  s1h: "Kerzen schon draußen", s1p: "Auf den Tischen der Veranda brennen die Kerzen, bevor Sie eintreten. Drinnen: weiße Tischdecken, gläserne Kronleuchter, die passende Musik.",
  s2h: "Um die Jacken kümmern wir uns", s2p: "Wir begleiten Sie zum Tisch und bringen die Jacken in die Garderobe. Am Ende des Abends bringen wir sie zurück und helfen Ihnen hinein.",
  s3h: "Ein Gruß aus der Küche", s3p: "Vor den Gerichten kommt ein kleiner Gruß des Hauses, etwa knusprige Waffeln mit Thunfischtatar.",
  s4h: "Ein Drink nach Maß", s4p: "Sagen Sie es dem Barkeeper: Er fragt, was Sie mögen, und mixt ihn für Sie.",
  s5h: "Die Küche hört zu", s5p: "Weniger scharf, eine Portion für zwei geteilt: Sie müssen nur fragen.",
  s6h: "Risotto am Tisch", s6p: "Das Acquerello-Risotto kommt in der Pfanne und wird vor Ihren Augen angerichtet.",
  s7h: "Keine Eile", s7p: "Nach dem Essen bleibt der Tisch Ihrer: Bleiben Sie, so lange Sie möchten.",
  menu_h: "Die Karte",
  menu_p: "Meer und Land, erste und zweite Gänge, Pizza aus dem Holzofen. Der Fisch wechselt mit dem Markt.",
  menu_soon: "Diese Seite der Karte ergänzen wir gemeinsam mit Ihnen.",
  menu_note: "Demo: Beispielgerichte und Beispielpreise.",
  lg_p: "Scharf", lg_g: "Glutenfrei",
  foto_h: "Der Saal, die Veranda, der Ofen",
  book_h: "Tisch reservieren",
  book_p: "Tag, Uhrzeit und Personen wählen: Wir bestätigen die Reservierung per SMS.",
  h_days: "Dienstag - Sonntag", h_off: "Montag", h_offv: "Ruhetag",
  addr: "Via dell'Esempio 1, Bozen",
  l_date: "Tag", l_people: "Personen", l_time: "Uhrzeit", l_you: "Name", q_people: "Für wie viele <em>Personen?</em>", q_day: "An welchem <em>Tag?</em>", q_time: "Um wie viel <em>Uhr?</em>", q_who: "Zum Schluss: <em>auf welchen Namen?</em>", back: "Zurück", again: "Neue Anfrage", closed: "Ruhetag", closed_n: "Montag ist Ruhetag", l_lunch: "Mittag", l_dinner: "Abend", l_where: "Wo", o_any: "Egal", o_sala: "Im Saal", o_ver: "Auf der Veranda",
  l_name: "Name", l_phone: "Telefon", l_notes: "Hinweise", l_notes_h: "Allergien, Kinderstuhl, ein besonderer Anlass", b_send: "Anfrage senden", o_more: "9 oder mehr",
  ok_h: "Anfrage gesendet", ok_demo: "Demo: In der echten Version geht die Anfrage an das Restaurant und der Gast erhält eine Bestätigung.",
  e_mon: "Montag ist Ruhetag: bitte einen anderen Tag wählen.", e_slot: "Bitte eine Uhrzeit wählen.", e_who: "Name und Telefon fehlen.",
  ft_bye: "Wir freuen uns auf Sie.",
  manifest: "Eine Fischküche mit erlesenen Produkten und einfacher Zubereitung, damit der echte Geschmack des Meeres erhalten bleibt.",
  valori: "Unser Restaurant ist mehr als unser Job. Wir leben und lieben das Essen, den Service und die Gastfreundschaft.",
  storia_k: "Unsere Geschichte",
  storia_p: "Wir stammen aus Neapel, der Stadt der Düfte und Aromen. Seit Generationen Gastronomen, hat sich unsere Familie für Südtirol entschieden. Heute empfangen Sie die Inhaber in einem kleinen, eleganten und authentischen Lokal.",
  pesce_h: "Fisch aus dem Mittelmeer",
  pesce_p: "Über 90% unseres Fisches kommt aus dem Mittelmeer und wird jeden Morgen frisch geliefert. Er ist kleiner und geschmackvoller als Fisch aus dem Ozean. Natürlich gibt es auch Fleisch und vegetarische Gerichte.",
  st1: "des Fisches aus dem Mittelmeer", st2b: "Jeden Morgen", st2: "kommt der Fisch frisch", st3b: "Holz", st3: "der Ofen für echte neapolitanische Pizza", st4b: "Di - So", st4: "Mittag- und Abendessen",
  mp_h: "Was auf den Tisch kommt",
  mp_p: "Namen von unserer Karte: ausgewählte Produzenten und das Meer der Saison.",
  mp1: "Riso Acquerello", mp1d: "Das Risotto aus der Pfanne",
  mp2: "Pastificio Mancini", mp2d: "Spaghetti allo scoglio",
  mp3: "Benedetto Cavalieri", mp3d: "Die Pasta der Linguine",
  mp4: "Sardellen aus Kantabrien", mp4d: "In den Linguine alla Ciro",
  mp5: "Thunfisch-Bottarga", mp5d: "Zu den Gnocchi alla tarantina",
  mp6: "Hummer und Languste", mp6d: "Tagliolini und Linguine",
  mp7: "Seespinne", mp7d: "Spaghettoni quadrati",
  piatto_k: "Die Geste",
  piatto_h: "Aus dem Topf auf den Teller",
  piatto_p: "Das Acquerello-Risotto kommt in seiner Pfanne an den Tisch. Mit Muscheln und Krustentieren oder mit Oktopusragout, vor Ihren Augen angerichtet.",
  pizza_h: "Pizza aus dem Holzofen",
  pizza_p: "Echte neapolitanische Pizza, gebacken im Holzofen, den Sie vom Saal aus sehen.",
  bar_h: "Weinkeller und Bar",
  bar_p: "Eine Wand aus beleuchteten Flaschen hinter der Theke. Und ein Barkeeper, der Ihnen auf Wunsch einen Drink nach Maß mixt.",
  ver_h: "Die Veranda",
  ver_p: "Auch draußen sind die Tische bei Kerzenlicht gedeckt, unter den Lichtern der Veranda.",
  mich_p: "Ein kleines, elegantes und authentisches Lokal einer neapolitanischen Gastronomenfamilie.",
  dove_h: "Anfahrt", maps: "In Google Maps öffnen",
  circ: "Tisch reservieren · Trattoria Esempio · ",
  menu_btn: "Menü", close: "Schließen",
  ft_cta: "Bis bald in der Trattoria Esempio.",
  mq1: "Fisch aus dem Mittelmeer", mq2: "Pizza aus dem Holzofen", mq3: "Eine Familie aus Neapel",
  prev: "Zurück", next: "Weiter",
  draft: "Stil"
 }
};

// [name, description, flags(p=spicy,g=gluten free)]; an empty list shows the "to be added" note
const MENU = {
 it: [
  ["Antipasti di mare", []],
  ["Antipasti di terra", []],
  ["Primi di mare", [
   ["Tagliolini al ragù d'astice", "Scampi e vongole", "p"],
   ["Spaghettoni quadrati alla granseola", ""],
   ["Linguine all'astice", "Con pomodorini"],
   ["Linguine all'aragostella nostrana", ""],
   ["Gnocchi di patate alla tarantina", "In bianco, cozze, vongole veraci e bottarga di tonno"],
   ["Tagliolini al branzino", "Limone emulsionato e zenzero"],
   ["Spaghetti allo scoglio", "Molluschi e crostacei secondo il mercato. Pastificio Mancini"],
   ["Linguine alla Ciro", "Acciughe del Mar Cantabrico. Benedetto Cavalieri", "p"],
   ["Risotto Acquerello ai molluschi e crostacei", "Servito in padella e impiattato al tavolo", "g"],
   ["Risotto Acquerello al ragù di polpo", "Servito in padella e impiattato al tavolo", "g"],
   ["Fusilloni al nero, sì ma di calamaro!", "Calamaretti interi grigliati e due pomodorini", "p"]]],
  ["Primi di terra", []],
  ["Secondi di mare", [
   ["Grigliata di gamberoni e calamari", "Con zucchine"],
   ["Calamari fritti", ""]]],
  ["Secondi di terra", []],
  ["Pizze", []],
  ["Dolci", []]
 ],
 de: [
  ["Vorspeisen vom Meer", []],
  ["Vorspeisen vom Land", []],
  ["Erste Gänge vom Meer", [
   ["Tagliolini al ragù d'astice", "Hummerragout, Scampi und Venusmuscheln", "p"],
   ["Spaghettoni quadrati alla granseola", "Mit Seespinne"],
   ["Linguine all'astice", "Hummer und Kirschtomaten"],
   ["Linguine all'aragostella nostrana", "Mit heimischer Languste"],
   ["Gnocchi di patate alla tarantina", "Ohne Tomate, Miesmuscheln, Venusmuscheln und Thunfisch-Bottarga"],
   ["Tagliolini al branzino", "Wolfsbarsch, emulgierte Zitrone und Ingwer"],
   ["Spaghetti allo scoglio", "Muscheln und Krustentiere je nach Markt. Pastificio Mancini"],
   ["Linguine alla Ciro", "Sardellen aus dem Kantabrischen Meer. Benedetto Cavalieri", "p"],
   ["Risotto Acquerello mit Muscheln und Krustentieren", "In der Pfanne serviert, am Tisch angerichtet", "g"],
   ["Risotto Acquerello mit Oktopusragout", "In der Pfanne serviert, am Tisch angerichtet", "g"],
   ["Fusilloni al nero, sì ma di calamaro!", "Ganze gegrillte Babykalmare und zwei Kirschtomaten", "p"]]],
  ["Erste Gänge vom Land", []],
  ["Zweite Gänge vom Meer", [
   ["Gegrillte Riesengarnelen und Kalmare", "Mit Zucchini"],
   ["Frittierte Kalmare", ""]]],
  ["Zweite Gänge vom Land", []],
  ["Pizzen", []],
  ["Desserts", []]
 ]
};

const MK = { lang: "it", tab: 2, slot: null };
const $ = s => document.querySelector(s);
const t = k => T[MK.lang][k] ?? T.it[k];

function renderMenu() {
 const m = MENU[MK.lang], tabs = $("#tabs"), box = $("#dishes");
 if (!tabs || !box) return;
 tabs.innerHTML = m.map((c, i) => `<button type="button" role="tab" aria-selected="${i === MK.tab}" data-t="${i}">${c[0]}</button>`).join("");
 const list = m[MK.tab][1];
 const ico = f => (f || "").split("").map(x => `<span class="ico ico-${x}" title="${t(x === "p" ? "lg_p" : "lg_g")}">${x === "p" ? "P" : "G"}</span>`).join("");
 box.innerHTML = list.length
  ? list.map((d, i) => `<li class="dish" style="--i:${i}"><h3>${d[0]}${ico(d[2])}</h3>${d[1] ? `<p>${d[1]}</p>` : ""}</li>`).join("")
  : `<li class="dish-empty">${t("menu_soon")}</li>`;
 box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
 const on = tabs.querySelector('[aria-selected="true"]');
 tabs.scrollLeft += on.getBoundingClientRect().left - tabs.getBoundingClientRect().left - (tabs.clientWidth - on.offsetWidth) / 2;
}

/* booking: one question at a time (people, day on a calendar, time, name), with a summary bar that fills in as you go
   and lets you jump back to any answered step */
const BK = { step: 0, max: 0, people: null, date: null, view: null };
const pad = n => String(n).padStart(2, "0"), iso = x => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
const loc = () => MK.lang === "de" ? "de-DE" : "it-IT";
const SLOTS = { lunch: ["12:00", "12:30", "13:00", "13:30"], dinner: ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"] };

function buildBooking() {
 const el = $("#booking");
 if (!el) return;
 const now = new Date(); BK.view = new Date(now.getFullYear(), now.getMonth(), 1);
 el.innerHTML = `
  <form class="bk" novalidate>
   <ol class="bk-sum">${["l_people", "l_date", "l_time", "l_you"].map((k, i) => `<li><button type="button" data-go="${i}" disabled><small data-i="${k}"></small><b>-</b></button></li>`).join("")}</ol>
   <div class="bk-prog"><i></i></div>
   <div class="bk-stage">
    <section class="bk-p" data-s="0"><p class="bk-q" tabindex="-1" data-i="q_people"></p>
     <div class="bk-nums">${[1, 2, 3, 4, 5, 6, 7, 8, "9+"].map(n => `<button type="button" data-p="${n}">${n}</button>`).join("")}</div></section>
    <section class="bk-p" data-s="1"><p class="bk-q" tabindex="-1" data-i="q_day"></p><div class="bk-cal"></div></section>
    <section class="bk-p" data-s="2"><p class="bk-q" tabindex="-1" data-i="q_time"></p>
     <div class="bk-f"><span data-i="l_dinner"></span><div class="bk-chips" data-k="dinner"></div></div>
     <div class="bk-f"><span data-i="l_lunch"></span><div class="bk-chips" data-k="lunch"></div></div></section>
    <section class="bk-p" data-s="3"><p class="bk-q" tabindex="-1" data-i="q_who"></p>
     <div class="bk-seg" role="radiogroup" aria-label="Dove">
      <label><input type="radio" name="where" value="" checked><span data-i="o_any"></span></label>
      <label><input type="radio" name="where" value="sala"><span data-i="o_sala"></span></label>
      <label><input type="radio" name="where" value="veranda"><span data-i="o_ver"></span></label>
     </div>
     <div class="bk-row">
      <label class="bk-f"><span data-i="l_name"></span><input name="name" autocomplete="name"></label>
      <label class="bk-f"><span data-i="l_phone"></span><input name="phone" type="tel" autocomplete="tel"></label>
     </div>
     <label class="bk-f"><span data-i="l_notes"></span><input name="notes" aria-describedby="bk-nh"><small id="bk-nh" data-i="l_notes_h"></small></label>
     <button class="bk-send" type="submit" data-i="b_send"></button></section>
   </div>
   <div class="bk-foot"><button type="button" class="bk-back" data-i="back"></button><p class="bk-err" role="alert"></p></div>
   <div class="bk-ok" aria-live="polite"><div><h3 data-i="ok_h"></h3><p class="bk-okp"></p><small data-i="ok_demo"></small><button type="button" class="bk-again" data-i="again"></button></div></div>
  </form>`;
 const f = el.querySelector("form");
 f.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.disabled) return;
  if (b.dataset.p) { BK.people = b.dataset.p; return next(1); }
  if (b.dataset.d) { if (BK.date !== b.dataset.d) MK.slot = null; BK.date = b.dataset.d; return next(2); }
  if (b.dataset.m) { BK.view.setMonth(BK.view.getMonth() + +b.dataset.m); return renderSlots(); }
  if (b.closest(".bk-chips")) { MK.slot = b.textContent; return next(3); }
  if (b.dataset.go) return show(+b.dataset.go);
  if (b.classList.contains("bk-back")) return show(BK.step - 1);
  if (b.classList.contains("bk-again")) { f.classList.remove("sent"); f.reset(); Object.assign(BK, { people: null, date: null, max: 0 }); MK.slot = null; show(0); }
 });
 f.addEventListener("input", () => { f.querySelector(".bk-err").textContent = ""; f.querySelector(".bk-sum li:last-child b").textContent = f.elements.name.value.trim() || "-"; });
 f.addEventListener("submit", e => {
  e.preventDefault();
  const E = f.elements, err = f.querySelector(".bk-err"), name = E.name.value.trim(), phone = E.phone.value.trim();
  if (!name || !phone) return err.textContent = t("e_who");
  const day = new Date(BK.date + "T12:00").toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" });
  const w = E.where.value, wl = w ? t(w === "sala" ? "o_sala" : "o_ver") : "", wt = w ? ", " + wl[0].toLowerCase() + wl.slice(1) : "";
  const one = BK.people === "1";
  f.querySelector(".bk-okp").textContent = MK.lang === "de"
   ? `${name}, Ihr Tisch für ${BK.people} ${one ? "Person" : "Personen"} am ${day} um ${MK.slot}${wt} ist angefragt.`
   : `${name}, il vostro tavolo per ${BK.people} ${one ? "persona" : "persone"}, ${day} alle ${MK.slot}${wt}, è richiesto.`;
  f.classList.add("sent");
 });
 show(0);
}

function next(s) { BK.max = Math.max(BK.max, s); renderSlots(); setTimeout(() => show(s), 260); }

function show(s) {
 const f = $("#booking form"); if (!f || s < 0) return;
 const dir = s >= BK.step ? 1 : -1;
 BK.step = s;
 f.querySelectorAll(".bk-p").forEach(p => {
  const i = +p.dataset.s, on = i === s;
  p.classList.toggle("on", on); p.inert = !on;
  p.style.setProperty("--dx", (i < s ? -1 : i > s ? 1 : 0) * 48 + "px");
 });
 f.style.setProperty("--prog", (s + 1) / 4);
 f.querySelector(".bk-back").hidden = s === 0;
 f.querySelector(".bk-err").textContent = "";
 renderSlots();
 if (f.dataset.ready) f.querySelector(`.bk-p[data-s="${s}"] .bk-q`).focus({ preventScroll: true });
 f.dataset.ready = 1;
}

// redraws everything that depends on the answers or the language (setLang calls it too)
function renderSlots() {
 const f = $("#booking form"); if (!f) return;
 const now = new Date(), today = iso(now);
 // summary bar
 const vals = [BK.people || "-",
  BK.date ? new Date(BK.date + "T12:00").toLocaleDateString(loc(), { weekday: "short", day: "numeric", month: "short" }) : "-",
  MK.slot || "-", f.elements.name.value.trim() || "-"];
 f.querySelectorAll(".bk-sum button").forEach((b, i) => {
  b.querySelector("b").textContent = vals[i];
  b.disabled = i > BK.max; b.setAttribute("aria-current", i === BK.step ? "step" : "false");
 });
 f.querySelectorAll(".bk-nums button").forEach(b => b.setAttribute("aria-pressed", b.dataset.p === BK.people));
 // calendar: past days and Mondays are off, three months ahead at most
 const v = BK.view, y = v.getFullYear(), m = v.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
 const min = new Date(now.getFullYear(), now.getMonth(), 1), max = new Date(now.getFullYear(), now.getMonth() + 3, 1);
 const wd = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc(), { weekday: "narrow" }));
 let days = "";
 for (let i = 0; i < first; i++) days += "<span></span>";
 for (let d = 1; d <= n; d++) {
  const dt = new Date(y, m, d), k = iso(dt), mon = dt.getDay() === 1, past = k < today;
  days += `<button type="button" data-d="${k}" ${mon || past ? "disabled" : ""} ${mon ? `title="${t("closed")}"` : ""} aria-pressed="${k === BK.date}" class="${k === today ? "today" : ""}${mon ? " mon" : ""}">${d}</button>`;
 }
 f.querySelector(".bk-cal").innerHTML = `
  <div class="bk-cal-h"><button type="button" data-m="-1" ${v <= min ? "disabled" : ""} aria-label="‹">‹</button><b>${v.toLocaleDateString(loc(), { month: "long", year: "numeric" })}</b><button type="button" data-m="1" ${v >= max ? "disabled" : ""} aria-label="›">›</button></div>
  <div class="bk-cal-g">${wd.map(w => `<span class="wd">${w}</span>`).join("")}${days}</div>
  <p class="bk-cal-n"><i></i>${t("closed_n")}</p>`;
 // times: on the chosen day, slots less than an hour away are gone
 const soon = BK.date === today ? pad(now.getHours() + 1) + ":" + pad(now.getMinutes()) : "";
 f.querySelectorAll(".bk-chips").forEach(box => box.innerHTML = SLOTS[box.dataset.k].map((s, i) =>
  `<button type="button" style="--i:${i}" ${soon && s < soon ? "disabled" : ""} aria-pressed="${s === MK.slot}">${s}</button>`).join(""));
}

function setLang(l) {
 MK.lang = l; document.documentElement.lang = l;
 document.querySelectorAll("[data-i]").forEach(e => { const v = t(e.dataset.i); if (v !== undefined) e.innerHTML = v; });
 document.querySelectorAll("[data-l]").forEach(b => b.setAttribute("aria-pressed", b.dataset.l === l));
 try { localStorage.setItem("mc-lang", l); } catch (e) {}
 renderMenu(); renderSlots();
 document.dispatchEvent(new CustomEvent("mc:lang"));
}

document.addEventListener("DOMContentLoaded", () => {
 buildBooking();
 $("#tabs")?.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; MK.tab = +b.dataset.t; renderMenu(); });
 document.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => setLang(b.dataset.l)));
 let l = "it"; try { l = localStorage.getItem("mc-lang") || "it"; } catch (e) {}
 setLang(l);
 // reveal on enter: elements with [data-r] get .in once
 const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
 document.querySelectorAll("[data-r]").forEach(el => io.observe(el));
 // the nav turns solid once the hero sentinel leaves the viewport
 const s = $("#top-sentinel"), nav = $(".nav");
 if (s && nav) new IntersectionObserver(([x]) => nav.classList.toggle("solid", !x.isIntersecting)).observe(s);
 // the floating booking button appears once the hero, with its own button, is gone
 const hero = $(".hero");
 if (hero) new IntersectionObserver(([x]) => document.body.classList.toggle("past", x.intersectionRatio < 0.15), { threshold: [0, 0.15, 0.3] }).observe(hero);
 requestAnimationFrame(() => document.body.classList.add("ready"));
});
