# Project Vision

> **AGENT INSTRUCTION:** Read this file before every iteration. It is the project's long-term memory.

## 1. Core Identity

| Field | Value |
|-------|-------|
| **Project Name** | Abdellah Khanani portfolio |
| **Mission** | Show brands, artists and event organisers the films, content and photography Abdellah makes, and get them to write to him. |
| **Target Audience** | Brands, artists, creators and event organisers hiring a filmmaker, video editor or event photographer. |
| **Voice & Tone** | Direct, plain English, short sentences. No hype words. |
| **Region** | Bolzano, Italy. Site copy in English. |

## 2. Visual Language

- **Primary Vibe**: Cinematic monochrome, an edit bay at night.
- **Secondary Vibe**: Kinetic editorial type driven by scroll; camera captions.
- **Anti-Vibes**: No colour accent, no single-word italic accents, no card kit.

## 3. Technical Setup

- **Output Directory**: `v3/`
- **CSS / JS**: hand-written CSS and vanilla JS, no build step. `js/pages.js` renders page data; `js/app.js` runs all motion.
- **Data**: `js/projects.js` (project pages), `js/instagram.js` (Instagram grid).
- **Motion libraries**: GSAP 3.15.0 + ScrollTrigger, Lenis 1.3.26 from jsDelivr, pinned. Pages render a static layout if they fail to load.
- **Fonts**: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap`
- **Cache busting**: bump `?v=` in all pages whenever `app.css` or `app.js` changes (currently 34).
- **Dev server**: `.claude/launch.json` "portfolio", http://localhost:4321/v3/index.html

## 4. Live Sitemap

- [x] `index.html` — hero, manifesto, clients, showreel, selected work, on stage (concert photography), services, numbers, about, experience, behind the frame, Instagram, voices, contact
- [x] `work.html` — the whole portfolio from `js/projects.js`: category filters, grid or title index (remembered per visitor); linked from the menu, the home mosaic ("See all work") and project pages
- [x] `project.html?p=<slug>` — editorial split; every field shown, placeholders until filled in `js/projects.js`
- [x] `bts.html` — masonry of 19 stills with lightbox
- [x] `contact.html` — request form (opens the visitor's email app, no backend)
- [x] `404.html` — no-signal screen

## 5. Roadmap (Backlog)

### Content status (from the client's spreadsheet, 16 September 2026)
17 projects in `js/projects.js`, all with role, year, client and description in English.
- With photos: moonview (16 from Instagram), lost + hope (IMDb posters), rayban-meta, aw-lab, busk-in-bozen, game-ground, adidas-terrex (5), marracash / ernia / mace (5 each from `assets/live/`), supermarket (5).
- With video in `assets/video/`: hope-trailer, rayban-meta, game-ground, adidas-lut.
- Still waiting on photos: streamhouse, tiny-drin, teknoyd, tek-house, indiependence (they render a "Photos coming" placeholder).
- Also pending: the under-stage POV clips filmed with the glasses for the three Billboard concerts, and which project `assets/video/behind-the-scenes.mp4` belongs to.

### Medium Priority
- [x] Real AK logo: `assets/logo/ak-mark.png` (header, favicon) and `ak-design.png` (footer). Files are small PNGs (162×81, 368×81); ask for SVG or a larger export.
- [ ] KN logo: `assets/logo/kn.png` is a copy of `teknoyd.png`; the real KN file is missing, so the tape shows 5 brands.
- [x] Instagram: five photo posts (no reels) in `js/instagram.js`, local images in `assets/ig/`.
- [x] Press, media & coverage: section `07 / Press` on the home page (`.pr`), plus a press/awards
      block on the `film` project layout, fed by the `press` and `awards` fields in `js/projects.js`.
      Data is from the Hope slide of his own portfolio deck; all of it concerns Hope specifically.
- [ ] Showreel: embed a real reel once a file or link exists.
- [x] Latest portfolio is a 4x3 grid (tiles carry `--c`/`--r`/`--cs`/`--rs`), the last cell links to
      work.html. The eighth tile used to point at a project slug that never existed (`lookbook`);
      adidas Terrex took its place. `work-gameground.jpg` was an AW Lab photo — replaced with the real
      event photo from the client's deck, and the old one kept as `awlab-02.jpg`.
- [x] Zblito (2022, Twitch stream pack) added from the client's own Behance board; images cropped
      from that board. Character artwork is by third parties and the credit line says so.
- [x] Studio dashboard at `dashboard.html` (+ `css/dash.css`, `js/dash.js`): edits the projects and
      writes them back as `js/projects.js`, either downloaded or committed to GitHub with a token the
      client supplies. Stats are computed from the projects themselves; the visitors panel stays empty
      until analytics exist. Draft is held in localStorage under `ak:dash:draft`.
      A verified round-trip test: serialize() re-parses to data identical to the file, field by field.
      Photo upload: files are re-drawn to 2000px/JPEG in the browser, named assets/img/<slug>-NN.jpg,
      added to the project immediately, then either pushed to GitHub or downloaded for manual placing.
- [~] Press outlet logos: Rai is the real mark (`assets/logo/press/rai.png`, supplied by the client).
      Alto Adige, NBC and Alto Adige Innovazione are still typographic until he sends their files.
- [ ] Confirm the Billboard Italia credit wording ("Billboard Italia × Abde") for the On stage section.
- [ ] 404 uses relative paths; fine at the site root, breaks if served under nested URLs.

### Low Priority
- [ ] Professional email address (the site shows a personal Gmail).

## 6. Creative Freedom

1. Stay on-brand: new pages must fit DESIGN.md exactly.
2. Enhance the core: every page must help a client decide to get in touch.

## 7. Rules of Engagement

1. Do NOT recreate pages already marked `[x]` in Section 4.
2. ALWAYS update `.design/next-prompt.md` before completing an iteration.
3. Copy the chrome between the CHROME markers of `index.html` verbatim.
4. All internal links must point to real pages.
5. Never invent project facts (years, clients, descriptions, credits). If content is missing, stop and ask.
