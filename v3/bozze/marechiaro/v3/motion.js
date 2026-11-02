/* Marechiaro, draft v3: motion layer shared by B and C.
   Needs GSAP + ScrollTrigger + Lenis loaded before it, and shared.js before that.
   Every hidden starting state is set here, so without JS (or with reduced motion) the page is simply static. */

(() => {
 const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
 const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
 const desk = () => innerWidth >= 900;
 const ok = window.gsap && window.ScrollTrigger && !reduce;
 const qa = (s, r = document) => [...r.querySelectorAll(s)];

 // wrap every word of an element in <span class="wd"><span>word</span></span>, keeping inline tags like <em>
 function split(el) {
  const walk = n => {
   [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) {
     const frag = document.createDocumentFragment();
     c.textContent.split(/(\s+)/).forEach(p => {
      if (!p) return;
      if (/^\s+$/.test(p)) { frag.append(p); return; }
      const o = document.createElement("span"); o.className = "wd";
      const i = document.createElement("span"); i.textContent = p; o.append(i); frag.append(o);
     });
     c.replaceWith(frag);
    } else if (c.nodeType === 1 && !c.classList.contains("wd")) walk(c);
   });
  };
  walk(el);
  return qa(".wd > span", el);
 }

 function loaderOut(done) {
  const L = document.getElementById("loader");
  if (!L) return done();
  if (!ok) { L.remove(); return done(); }
  const tl = gsap.timeline({ onComplete: () => { L.remove(); done(); } });
  tl.from(qa(".ld-word span", L), { yPercent: 110, duration: .9, stagger: .05, ease: "expo.out" })
    .to(L.querySelector(".ld-bar i"), { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, "<.1")
    .to(qa(".ld-word span", L), { yPercent: -110, duration: .6, stagger: .03, ease: "expo.in" }, "+=.15")
    .to(L, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "-=.2");
 }

 let lenis = null, fillTriggers = [];

 function setupFill() {
  fillTriggers.forEach(t => t.kill()); fillTriggers = [];
  qa("[data-fill]").forEach(el => {
   const w = split(el);
   gsap.set(w, { opacity: .16 });
   const tw = gsap.to(w, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: true } });
   fillTriggers.push(tw.scrollTrigger);
  });
 }

 // text that turns italic on hover: a roman and an italic copy stacked, the CSS sweeps a soft mask from one to the other
 function setupSwap() {
  qa("[data-swap]").forEach(el => {
   if (el.querySelector(".sw")) return;
   const h = el.innerHTML;
   el.innerHTML = `<span class="sw"><span class="sw-r">${h}</span><span class="sw-i" aria-hidden="true">${h}</span></span>`;
  });
 }

 // sideways rows on phones: counter and progress follow the swipe; the row peeks to the left once when it comes into view
 function setupSwipe() {
  qa(".hp-nav").forEach(nav => {
   const track = nav.previousElementSibling, cards = [...track.children].filter(c => !c.classList.contains("hp-intro"));
   const cnt = nav.querySelector(".hp-count"), bar = nav.querySelector(".hp-bar i"), n = cards.length;
   const upd = () => {
    const max = track.scrollWidth - track.clientWidth; if (max <= 0) return;
    const p = track.scrollLeft / max, i = Math.min(n, Math.max(1, Math.round(p * (n - 1)) + 1));
    cnt.textContent = String(i).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    bar.style.setProperty("--p", Math.max(1 / n, p));
    if (track.scrollLeft > 30) nav.classList.add("used");
   };
   track.addEventListener("scroll", upd, { passive: true }); upd();
   if (reduce) return;
   const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || innerWidth >= 900) return; io.disconnect();
    // slide the whole row left and back, so the next card shows itself; no scrolling involved, so snapping can't fight it
    setTimeout(() => { if (track.scrollLeft > 30) return; [...track.children].forEach(c => c.animate([{ transform: "translateX(0)" }, { transform: "translateX(-90px)", offset: .45 }, { transform: "translateX(0)" }], { duration: 1500, easing: "cubic-bezier(.65,0,.35,1)", composite: "add" })); }, 450);
   }, { threshold: .55 });
   io.observe(track);
  });
 }

 function init() {
  setupSwipe();
  document.documentElement.classList.add(ok ? "mo" : "no-mo");
  if (!ok) return;
  gsap.registerPlugin(ScrollTrigger);

  // smooth scroll, driven by the GSAP ticker so ScrollTrigger stays in sync
  if (window.Lenis) {
   lenis = new Lenis({ duration: 1.15, smoothWheel: true });
   lenis.on("scroll", ScrollTrigger.update);
   gsap.ticker.add(t => lenis.raf(t * 1000));
   gsap.ticker.lagSmoothing(0);
   window.mcLenis = lenis;
  }
  // in-page links: a short hop glides; a long one drops a curtain with the wordmark, jumps underneath and lifts it
  let veil = null, busy = false;
  const makeVeil = () => {
   veil = document.createElement("div");
   veil.setAttribute("aria-hidden", "true");
   veil.style.cssText = `position:fixed;inset:0;z-index:190;display:grid;place-items:center;pointer-events:none;visibility:hidden;background:${getComputedStyle(document.body).backgroundColor}`;
   veil.innerHTML = `<div class="ld-word">${[..."Marechiaro"].map(c => `<span>${c}</span>`).join("")}</div>`;
   document.body.append(veil);
  };
  const jump = t => {
   if (busy) return; busy = true;
   if (!veil) makeVeil();
   const letters = qa("span", veil);
   gsap.timeline({ onComplete: () => { busy = false; } })
     .set(veil, { visibility: "visible", clipPath: "inset(100% 0 0 0)" })
     .set(letters, { yPercent: 110 })
     .to(veil, { clipPath: "inset(0% 0 0 0)", duration: .75, ease: "expo.inOut" })
     .to(letters, { yPercent: 0, duration: .7, stagger: .035, ease: "expo.out" }, "-=.35")
     .add(() => { closeMenu(); lenis ? lenis.scrollTo(t, { immediate: true, force: true }) : t.scrollIntoView(); ScrollTrigger.update(); })
     .to(letters, { yPercent: -110, duration: .5, stagger: .025, ease: "expo.in" }, "+=.15")
     .to(veil, { clipPath: "inset(0 0 100% 0)", duration: .8, ease: "expo.inOut" }, "-=.2")
     .set(veil, { visibility: "hidden" });
  };
  document.addEventListener("click", e => {
   const a = e.target.closest('a[href^="#"]'); if (!a) return;
   const id = a.getAttribute("href"); if (id.length < 2) return;
   const t = document.querySelector(id); if (!t) return;
   e.preventDefault();
   const far = Math.abs(t.getBoundingClientRect().top) > innerHeight * 1.3;
   if (far || document.body.classList.contains("menu-open")) return jump(t);
   lenis ? lenis.scrollTo(t, { duration: 1.2, easing: x => 1 - Math.pow(1 - x, 4) }) : t.scrollIntoView({ behavior: "smooth" });
  });

  // hero waits for the loader; headline words rise, the rest fades in
  const heroWords = qa(".hero [data-split]").flatMap(split);
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set(qa(".hero [data-fade]"), { opacity: 0, y: 18 });
  gsap.set(qa(".hero [data-heroimg]"), { clipPath: "inset(100% 0 0 0)" });
  loaderOut(() => {
   const tl = gsap.timeline();
   tl.to(qa(".hero [data-heroimg]"), { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "expo.inOut", stagger: .12 })
     .to(heroWords, { yPercent: 0, duration: 1.2, stagger: .045, ease: "expo.out" }, "-=1.1")
     .to(qa(".hero [data-fade]"), { opacity: 1, y: 0, duration: 1, stagger: .1, ease: "power3.out" }, "-=.8");
   document.dispatchEvent(new CustomEvent("mc:intro", { detail: tl }));
  });

  // headings outside the hero: words rise once on enter
  qa("[data-split]").filter(el => !el.closest(".hero")).forEach(el => {
   const w = split(el);
   gsap.from(w, { yPercent: 110, duration: 1.1, stagger: .035, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 86%", once: true } });
  });

  setupFill();
  setupSwap();

  qa("[data-up]").forEach(el => gsap.from(el, { opacity: 0, y: 40, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));

  qa("[data-clip]").forEach(el => gsap.fromTo(el, { clipPath: "inset(18% 12% 18% 12%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 30%", scrub: true } }));

  qa("[data-par]").forEach(el => gsap.fromTo(el, { yPercent: -(+el.dataset.par || 8) }, { yPercent: +el.dataset.par || 8, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));

  qa("[data-count]").forEach(el => {
   const o = { v: 0 }, end = +el.dataset.count;
   el.style.display = "inline-block"; el.style.minWidth = el.offsetWidth + "px"; // the final number holds its width, so nothing beside it moves while counting
   gsap.to(o, { v: end, duration: 2, ease: "power2.out", onUpdate: () => el.textContent = Math.round(o.v) + (el.dataset.suffix || ""), scrollTrigger: { trigger: el, start: "top 85%", once: true } });
  });

  // pinned horizontal track on desktop; on phones the track is a native swipe row
  ScrollTrigger.matchMedia({
   "(min-width: 900px)": () => {
    qa("[data-hpin]").forEach(sec => {
     const track = sec.querySelector(".hp-track");
     const dist = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
     gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
    });
   }
  });

  // list rows reveal a picture that follows the cursor
  if (fine) qa(".hov").forEach(list => {
   const pic = list.querySelector(".hov-pic"); if (!pic) return;
   const img = pic.querySelector("img");
   const xTo = gsap.quickTo(pic, "x", { duration: .6, ease: "power3" }), yTo = gsap.quickTo(pic, "y", { duration: .6, ease: "power3" });
   list.addEventListener("pointermove", e => { const r = list.getBoundingClientRect(); xTo(e.clientX - r.left); yTo(e.clientY - r.top); });
   qa("[data-img]", list).forEach(row => row.addEventListener("pointerenter", () => {
    img.src = row.dataset.img;
    gsap.to(pic, { opacity: 1, scale: 1, duration: .5, ease: "power3.out" });
   }));
   list.addEventListener("pointerleave", () => gsap.to(pic, { opacity: 0, scale: .85, duration: .4 }));
  });

  // marquee: drifts on its own, speeds up with the scroll and turns with its direction
  qa(".mq").forEach(mq => {
   const track = mq.querySelector(".mq-track"), set = track.querySelector(".mq-set");
   let w = 0, x = 0, dir = 1, boost = 0, on = false;
   const fill = () => {
    qa(".mq-set", track).slice(1).forEach(n => n.remove());
    w = set.offsetWidth;
    for (let i = 0, n = Math.ceil(innerWidth / w) + 1; i < n; i++) track.append(set.cloneNode(true));
   };
   fill();
   addEventListener("resize", fill);
   document.addEventListener("mc:lang", fill);
   new IntersectionObserver(([en]) => on = en.isIntersecting).observe(mq);
   const skew = gsap.quickTo(track, "skewX", { duration: .8, ease: "power3" });
   gsap.ticker.add((time, dt) => {
    if (!on || !w) return;
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 1) dir = v > 0 ? 1 : -1;
    boost += (Math.min(Math.abs(v) * .9, 22) - boost) * .08;
    x = gsap.utils.wrap(-w, 0, x - dir * (1.4 + boost) * dt / 16.7);
    gsap.set(track, { x });
    skew(gsap.utils.clamp(-6, 6, -v * .12));
   });
  });

  // buttons lean slightly toward the cursor
  if (fine) qa("[data-mag]").forEach(b => {
   const xTo = gsap.quickTo(b, "x", { duration: .5, ease: "elastic.out(1,.4)" }), yTo = gsap.quickTo(b, "y", { duration: .5, ease: "elastic.out(1,.4)" });
   b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .3); });
   b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });

  // a language switch rewrites the copy: rebuild the scroll-filled paragraphs and the hover swaps
  document.addEventListener("mc:lang", () => { setupFill(); setupSwap(); ScrollTrigger.refresh(); });
  addEventListener("load", () => ScrollTrigger.refresh());
 }

 // full-screen menu
 function closeMenu() { document.body.classList.remove("menu-open"); lenis && lenis.start(); }
 document.addEventListener("click", e => {
  if (e.target.closest("[data-menu-open]")) { document.body.classList.add("menu-open"); lenis && lenis.stop(); }
  if (e.target.closest("[data-menu-close]")) closeMenu();
 });
 addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

 if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
