# Design System: Abdellah Khanani portfolio

**Design read (taste-skill §0.B):** portfolio for brands, artists and event organisers hiring a filmmaker, with a cinematic monochrome, kinetic-editorial language, built with hand-written CSS + GSAP ScrollTrigger + variable type.

**Dials (taste-skill §1):** `DESIGN_VARIANCE 8` / `MOTION_INTENSITY 9` / `VISUAL_DENSITY 3`
The portfolio preset is 8 / 7 / 3. Motion is raised to 9 because the client explicitly asked for heavy scroll animation.

## 1. Visual Theme & Atmosphere

A projector room: true black ground, grayscale footage, type that behaves like camera captions and film titles. Space is generous; the photographs and one orchestrated motion per section carry the page. Colour only appears where light or the visitor's hover lands on real work.

## 2. Colour Palette & Roles (LOCKED)

Brief: black and white only, no accent. ui-ux-pro-max proposed a blue CTA accent (`#2563EB`); rejected, the brief wins.

| Role | Name | Value | Usage |
|------|------|-------|-------|
| Background | Leader black | `#000000` | Page ground |
| Text primary | Print white | `#F1F1F1` | Headings and body on black |
| Text secondary | Silver | `#8E8E8E` | Captions and metadata on black (6.3:1) |
| Hairline | — | `color-mix(in srgb, var(--fg) 15%, transparent)` | Rules, progress tracks |
| Light zone background | Print white | `#F1F1F1` | About + Experience only |
| Light zone text | Leader black | `#000000` | |
| Light zone secondary | Graphite | `#5F5F5F` | 5.9:1 on `#F1F1F1` |

Photography: `grayscale(1) contrast(1.1)` everywhere; hover on real work removes the filter. One exception: concert photos (On stage) keep their colour inside the moving spotlight only.

## 3. Typography — C, hybrid (LOCKED, client choice 2026-09-15)

Three voices, one scale. Client note: spacing and fonts must stay consistent with the rest of the site, so every size comes from the tokens in `css/app.css :root`.

| Voice | Font | Where |
|-------|------|-------|
| Camera caption | JetBrains Mono 11px (`--fs-cap`), uppercase, .14em tracking | `.cap`, `.kick` section kickers, pills, HUDs, timecode, clocks |
| Headline | Archivo 500, tracking -.03 to -.06em, wdth 92–100 | h1 `--fs-h1`, h2 `--fs-h2`, h3 `--fs-h3`, rows `--fs-row` |
| Reading face | `--ui`: San Francisco on Apple devices via the system stack (the only licensed way to use SF on the web), Inter elsewhere | project page body copy (`.pj__text`) only, 16–18.5px, line-height 1.65 |
| Caption serif | Instrument Serif italic | project categories, organisations, the footer "together" line, the testimonial |
| Fitted name | Archivo 900 uppercase, wdth 118–120 | hero name and mosaic intro title only |

Rules
- Never accent a single word inside a headline with the serif, weight or colour.
- Section kickers are numbered `NN / Name` in mono (client choice C). Renumber all of them when a section is added.
- `max-width` in `ch` must sit on the element that owns the font-size.
- Quotes: max 3 lines on desktop, real typographic quotes, attribution = name + role.

## 4. Component Styles

- **Pill**: 1px currentColor border, radius 999px, mono uppercase caption, fill wipes up on hover. `.pill--lg` for page CTAs.
- **Mosaic tile**: radius 3px image, caption = Archivo title + serif category, siblings dim on hover.
- **Client tape**: two marquees, opposite directions, skew with scroll velocity; logos white on black, per-logo height multipliers (`.lg-*`).
- **Service row**: hairline below, title rolls up into a wider twin on hover.
- **Form**: underline fields, chip checkboxes, inline errors under each field (`.fm__err`), mailto submit.
- **Navigation**: fixed, difference blend, 62px; full-screen menu.
- **Focus**: `:focus-visible` 2px currentColor outline, 4px offset.
- **Cursor**: ring + dot in difference blend; labels only where the action is real (WRITE, OPEN, VIEW).

## 5. Layout Principles

- Gutter `--pad` clamp(18px,3.4vw,60px); section padding `--sec` clamp(100px,12vw,190px); heading gap `--head-gap`.
- Home order: wall hero / manifesto / aperture showreel / film strip / mosaic (Selected work) / On stage (stage lights) / client tapes / services / numbers / light zone (About, Experience) / fly-through / Instagram / voices / reveal footer.
- One theme switch: About + Experience turn print white.
- Pages: `index.html`, `project.html?p=slug` (editorial split), `bts.html`, `contact.html`, `404.html`. All share the chrome between the `CHROME` markers in `index.html`.

## 6. Motion Inventory

| Moment | Trigger | Technique |
|--------|---------|-----------|
| Loader: edit bay | first load only (client choice E, 2026-09-15) | minimal (client note: the motion-graphic version felt crowded): four big titles of an edit (Importing footage, Syncing audio, Colour grading, Rendering), one at a time through a mask, each held at least 850ms, the next never entering before the previous leaves; a 1px progress line under them. Exit: a seam of light crosses the centre, the curtain opens top and bottom into 2.39:1 bars (portrait: 56% window) which stay over the hero (z 895, under the header) with "Scroll to enter the reel" until the first scroll retracts them; skipped when arriving through a page transition |
| Dock | after the hero (home), on load (other pages); hidden at the footer and while the menu is open | floating clear Liquid Glass bar, 48px tall, Archivo 500 14px (transparent fill, light blur, rim light). In Chromium an SVG displacement map modelled on liquid-glass-js's three layers (edge bend, 3px rim, gentle lens magnification of the base) refracts the backdrop with a slight colour split; the library itself was not used because its html2canvas snapshot cannot follow scroll-driven pins at 60fps. A glass drop slides to the section in view or the hovered item, stretching as it travels (elastic). Items: Work, Stage, Services (hidden under 480px), About, Contact |
| In-page jump | dock, menu or any same-page link | a jump longer than 1.5 screens is a cut: the page curtain closes on the section name (.55s), the page jumps underneath, the curtain opens (.75s). Shorter hops and `[data-smooth]` links (hero cue) keep the Lenis scroll |
| Menu | burger | black disc covers the page first (.85s), links rise from .55s; on close links drop, then the disc shrinks |
| Page curtain | internal link | two panels close with the destination name, open on arrival (`ak:pt`) |
| Card → cover | project link | tile image zooms to full screen, project page FLIPs it into its cover (`ak:cover`) |
| Dailies wall | always | columns drift, speed up with scroll velocity |
| Hero exit | pin +110% | wall zooms and tilts, name lines split apart |
| Manifesto | scrub | words light up, inline photos open the sentence |
| Showreel | pin +170% | window opens to full bleed |
| Client tapes | always + scroll | opposite marquees (tight rows, under the manifesto), velocity skew |
| Latest portfolio | pin +230% (desktop) | full-bleed cover clips down into the hero tile, the mosaic assembles, tiles parallax |
| On stage | pin, 50% per shot (40% mobile) | full-screen colour photo; the crop (object-position) drifts along a per-photo path while a soft light spot and faint beam follow as an accent (cursor steers the light on hover); same artist crossfades, a new artist rises in like a curtain; solid artist name slides in bottom-left; HUD counter. All 15 shots are landscape so full screen crops little. |
| Services | hover | row title rolls up into an outline twin of the same width |
| Numbers | pin +260% (desktop) | odometer rolls to 47 while the eight stats settle around it, the full picture holds, then the stats drift away |
| Theme switch | enter About | token tween black ↔ print white |
| About | scrub | portrait opens through a circular iris |
| Experience | sticky | year rolls to the entry in focus |
| Behind the frame | pin +300% | stills fly outward on golden-angle paths |
| Testimonial | scrub | words fill |
| Footer | page end | main lifts to reveal it; letters swell near the cursor |
| 404 | always | noise canvas, colour bars, glitching code, running timecode |

Reduced motion: no Lenis, no pins, no loops; every element renders its final state (On stage becomes a plain photo list).

## 7. Design System Notes for Generation

**Copy this entire block into every baton prompt:**

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first, responsive to 375px
- Theme: dark cinematic monochrome. Black `#000000`, print white `#F1F1F1`, silver `#8E8E8E`. No accent colour.
- Photography: grayscale; colour only on hover over real work, or inside the On stage spotlight
- Typography C: JetBrains Mono uppercase captions and numbered kickers; Archivo 500 headlines; Instrument Serif italic for whole caption elements only. Sizes from the `:root` tokens only.
- Forbidden: single-word accents, colour accents, card kits
- Corners: 0, except pills (999px) and images (3px). Shadows: none.
- Motion: GSAP ScrollTrigger + Lenis; one orchestrated moment per section; reduced motion renders final states
- Shared chrome: copy everything between the CHROME markers of `v3/index.html` verbatim (omit LOADER and HOVER PREVIEW on sub-pages)
- Code: extend `v3/css/app.css` and `v3/js/app.js`; never fork them

## 8. Engineering notes

- **Never `once: true` on ScrollTriggers created inside `gsap.matchMedia()`.** A breakpoint rebuild while scrolled past a trigger's start makes it kill itself during init; the next trigger throws `Cannot read properties of undefined (reading 'end')`. Use `toggleActions: 'play none none none'`.
- **No `containerAnimation`**: its child triggers throw when the parent tween is reverted on a breakpoint change.
- **Pins are created in document order** inside `choreography()`, so later triggers account for earlier pin spacing. A new pinned section goes in the same function, at its document position.
- **Non-GSAP work inside the matchMedia context** (rAF loops, observers, listeners) registers an undo in `cleanups`; the context's return runs them.
- **Line splitting** groups words by vertical centre (0.45em tolerance); the tokenizer splits on ordinary whitespace only, so `&nbsp;` glues words.
- **CDN scripts carry `crossorigin="anonymous"`** so errors report real messages.
- **Testing**: the desktop app's Browser pane throttles rAF to ~2 fps while hidden, which freezes scrubbed and time-based motion in screenshots. Read state from the DOM there, and take visual proof with headless Chrome through `.design/harness.html` (`?pin=lv&p=.3`, `?sel=.cl&off=40`, `?mx=.6&my=.4`, `?w=375` for a narrow iframe). Use `--timeout`, not `--virtual-time-budget`.
- **Cache busting**: bump `?v=` in all five pages whenever `app.css` or `app.js` changes.

## 9. Client decisions

- 2026-09-16: content pass from the spreadsheet — 17 projects, new categories (Concert photography, Vlog shooting, Editing, Trailer). Projects with no cover yet show a dashed "Photos coming" placeholder in the work grid and on the project page instead of a broken image. Videos are served locally from `assets/video/` (H.264, faststart) with a poster still.

- 2026-09-15 (round 4): header hides only after a real scroll (90px down / 40px up) and turns solid white over the concert photos, where the difference blend strobed. On touch devices Lenis is off and `ScrollTrigger.normalizeScroll` keeps iOS pins from jumping on release. Instagram cut to five photos in one row (a swipe row on phones). New `work.html` with every project. Real AK logo in header, favicon and footer. Phones: Stage = B (swipe strip of 4:5 photos, no pin; name and counter follow the photo in view), Latest portfolio = A (swipe carousel of 4:5 covers). New project `adidas-terrex` with five Numechi Studio photos for The Pill and the adidas LUT video (H.264, `assets/video/`), which plays inline from `js/projects.js` `video` + `poster`.

- 2026-09-15: hero bottom bar keeps the camera-caption style with "Enter the reel".
- 2026-09-15: Latest portfolio = F (mosaic with zoom). Logos = A (double reactive tape). Project page = B (editorial split). Typography = C (hybrid). Added: page curtain, card → cover, film strip with timecode, behind-the-scenes page, Instagram grid, request form, animated 404.
- 2026-09-15 (round 2): film strip removed (home and BTS page). Clients tape moved under the manifesto, rows tighter. Numbers hold the finished picture before the stats leave. Services hover twin is an outline, never wider than its box. On stage: photos larger and in full colour, light is only an accent, no strobe. Instagram grid: 9 posts chosen with the client (carousel DI75JPcqOQQ photos 1, 3, 8 spread across the grid). Project pages show every field with placeholders.
- 2026-09-15 (round 3): concert photos full screen; four portrait picks replaced with landscape originals (Marracash DSC00593, DSC00343; Ernia DSC01513, DSC02623). Instagram tiles use local images in `assets/ig/` (downloaded with the client's permission). adidas logo added to the tape (06 brands); Experience gains "Invited talent for adidas Terrex" (June 2026, with The Pill at Lavaredo Ultra Trail), facts from the adidas talent brief only, no contacts. Meta logo pending a file.
- 2026-09-15: concert photos = B (stage lights). Source: `~/Desktop/billboard x abde` (Marracash 51, Ernia 166, Mace 53 originals, plus watermarked copies). 15 picks exported to `assets/live/` at 2400px and 1200px from the originals without watermark. Billboard Italia logo converted to white at `assets/logo/billboard.png` and added to the tape.
