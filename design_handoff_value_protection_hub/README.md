# Handoff: Value Protection Hub — Galactic Command Center front-end

## Overview
A "galactic universe" command center for Intrepid's Value Protection team (Claimback, AR & Finance control). Three areas:
- **Universe (Home):** hero + scanner, a 3D "Planet Intrepid", an orbiting fleet of 8 sector starfighters, and **Commander Khải** rendered as a real-time **GLB** on a command platform.
- **Sector view:** an app-shell (only the vault list scrolls) with breadcrumb, header stats, status filters, asset "vault" cards, and a sticky fleet dock.
- **Crew:** an asymmetric "command formation" of 10 crew members + a profile drawer.
- **Command palette (⌘K / Ctrl-K):** searches Sectors, Assets, and Crew with ↑↓/↵/Esc.

## About the design files
The files in this bundle are **design references built in HTML** (a streaming "Design Component" prototype), **not production code to paste in**. The task is to **recreate these designs inside the target codebase** (`khaitrantrong2/value-protection-hub`, Vue 3 + Vite) using its existing patterns/components — reproducing the exact look, layout, and behavior documented below. The three.js layers can be ported largely as-is (see Interactions).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, motion, and interactions. Recreate pixel-accurately. The only intentionally-interim part is the **Crew character art** (still lightweight SVG/DC placeholders) — those are slated to be replaced by GLB models (same pipeline as the Commander) once each crew GLB is approved in CharacterLab.

## Tech in the prototype
- **three.js r128** (global build) + `examples/js/loaders/GLTFLoader.js` (r128) — planet, fleet lanes, and the Commander GLB.
- **GSAP 3.13** (+ CustomEase, SplitText, DrawSVGPlugin, ScrambleTextPlugin) — title reveal, status scramble, orbit lane draw-in, launch transition.
- Fonts: **Outfit** (display/body, from the Intrepid design system CSS) + **JetBrains Mono** (Google Fonts) for mono labels.
- **Important runtime note:** in the prototype's sandbox, `requestAnimationFrame` callbacks did not fire, so all animation loops use `setTimeout(fn, ~16–33ms)`. In a normal browser/Vue app you should switch these back to `requestAnimationFrame`.

## Screens / Views

### 1. Top nav (persistent)
- Left: glow circle + `intrepid-mark.png` (40px) + title "Value Protection Hub" (Outfit 600, 16px) with mono sublabel "VALUE PROTECTION · COMMAND CENTER" (9px, letter-spacing .28em, color `--sp-gray`).
- Right: "Universe" / "Crew" text links (14px; active = `#F4F7FF`, idle = `#cdd8f0`) + a "Scan ⌘K" pill button (border `rgba(79,217,255,.30)`, bg `rgba(79,217,255,.07)`).
- Header: sticky, `backdrop-filter: blur(12px)`, bottom border `rgba(146,163,199,.10)`.

### 2. Universe / Home
- **Layout:** CSS grid, 2 columns `minmax(0,0.92fr) minmax(0,1.08fr)`, `gap: clamp(20px,3vw,56px)`, `max-width:1520px`, centered, `min-height: calc(100dvh - 66px)`. Collapses to 1 column ≤920px (stage moves below copy).
- **Left column:** "SYSTEM ONLINE" status pill (mono, cyan dot + glow); H1 "Value / Protection Hub" (Outfit 600, `clamp(38px,5.2vw,64px)`, line-height 1.02, letter-spacing -.025em, clipped for SplitText reveal); subtitle "Claimback, AR & Finance Control Workspace" (`#c6d3ee`); paragraph (`--sp-gray`); a full-width scanner button (opens palette) with an animated scan sweep; primary "Scan the vaults" gradient button (`linear-gradient(135deg,#4FD9FF,#1F9CD5)`, text `#04122b`) + secondary "View mission map".
- **Right column (stage):** relative box `height:min(72vh,640px); min-height:420px`.
  - **Planet** `<canvas>` centered at `left:60% top:42%`, `width:min(62%,450px)`, z-index 12. three.js: navy sphere w/ canvas texture, cyan icosahedron wireframe, translucent shield shells, 3 thin orbital lanes (2 cyan/blue + 1 gold), 2 moving light pulses, a billboarded holographic `intrepid-mark.png` plane. Camera PerspectiveCamera(40), distance ~5.8.
  - **Fleet:** 8 DOM buttons (one per sector) positioned every frame on 3 elliptical rings around the planet center (`cx=60%,cy=42%`; radii `w*{0.30,0.40,0.49}` × `h*{0.17,0.24,0.30}`). Each shows one of 4 SVG "starfighter" archetypes (scout / interceptor / cruiser / shuttle), banks to face travel direction, scales with depth. Hover/focus: that craft slows to 0.12× speed, scales 1.10×, its lane brightens, others dim to 0.45×, its name label fades in, and a collision-aware tooltip appears (avoids the Commander safe-zone and stage edges). Click: ~600ms "warp launch" → navigate to that Sector.
  - **Commander Khải:** absolutely positioned bottom-left, z-index 45. A `<canvas>` (232×300) renders `public/models/crew/khai.glb` via GLTFLoader + AnimationMixer, on a glowing command platform, with name label. Idle loops; **click → Salute, hover → Wave, on launch → Point**. Fallback "MODEL OFFLINE" chip if the GLB fails.
- **Mission strip** below the fold: "MISSION MAP" rule + 3 cards (Protect the core / Navigate the fleet / Scan the vaults).

### 3. Sector view (app-shell)
- **Layout:** `height:100%`, CSS grid rows `auto auto minmax(0,1fr) auto` — (1) breadcrumb + header, (2) filter bar, (3) **scrollable vault only**, (4) sticky fleet dock. No document scroll on desktop; `overscroll-behavior:contain` on the vault.
- **Header card:** rounded, sector accent glow; badge "SECTOR {code} · {archetype}"; H1 "{name} Sector"; intro paragraph; two stat tiles (ASSETS, CRITICAL).
- **Filter bar:** text filter input + ALL / LIVE / REVIEW pills.
- **Vault grid:** `repeat(auto-fill,minmax(300px,1fr))`, gap 18px. Each asset card: top accent bar, code + doc icon, status chip (Live=mint, Review=amber, Draft=gray), title, description, tag chips, Owner/Country/Criticality meta, "Open" (gradient) + "Copy" buttons. Hover: translateY(-4px), border brightens.
- **Fleet dock:** sticky bottom, horizontal scroll of all sectors (active highlighted); includes a dev-only "Scale Test" sector (badge DEV) with 24 mock assets for scroll testing.

### 4. Crew (command formation)
- Centered column, `max-width:1080px`, a vertical constellation "spine". Title block ("INTREPID UNIVERSE" / "Value Protection Crew").
- Members grouped into tiers, staggered/asymmetric: **COMMAND** (Khải apex, Lan slightly lower/smaller) · **SECTOR LEADS** (TH, VN) · **MARKET GUARDIANS** (SG, MY) · **TWIN SECTOR** (Thành) · **LEARNING POD** (Phương). Scale encodes hierarchy.
- Each member = a button: avatar (interim `Astronaut.dc.html` SVG; to become GLB) + name (Outfit 600) + mono role short with accent dot. Hover raises the figure.
- **Profile drawer** (right, 430px): sticky identity header (avatar + name + role badge over accent-soft radial), then a scrollable body — 2×2 metadata grid (Venture/Assignment, Station, **Market/Coverage**, Clearance), Primary scope, Systems/Tools chips, Current mission, notes, and "Back to formation" + optional "Contact". Opens on click; Esc closes.

### 5. Command palette (⌘K / Ctrl-K)
- Centered modal over a blurred scrim. Search input with animated sweep line + ESC hint. Results list Sectors, Assets, and Crew, each with a type badge (SECTOR=cyan, ASSET=amber, CREW=mint). Keyboard: ↑↓ move selection, ↵ open, Esc close; focus returns to the trigger on close.

## Interactions & Behavior
- **Routing:** internal state (`view: home|sector|crew`), no URL routing in the prototype. In Vue, map to routes `/`, `/sector/:slug`, `/crew`.
- **Planet/fleet/commander:** three.js scenes; dispose renderer/geometry/material/texture and stop loops on leaving Home; a `ResizeObserver` on the stage recomputes planet size + orbit geometry; WebGL context-loss handled (dispose + re-init).
- **Launch transition:** ~600ms; the clicked craft scales up + fades, a radial "warp" overlay plays, then the Sector mounts.
- **Commander gestures:** clip names in the current GLB are Meshy-exported and aliased — Idle←`Idle_11`, Wave←`Wave_for_Help_4`, Salute←`Agree_Gesture`, Point←`Backflip_Jump`. Target GLBs should ship clips named exactly `Idle/Wave/Salute/Point` (see ASSET_CONTRACT.md).
- **prefers-reduced-motion:** freezes animation loops on a static pose; entrance tweens skipped.
- **Responsive:** hero collapses to 1 column ≤920px; nav text links hide ≤560px; Commander hidden ≤560px; sector view becomes normally-scrollable ≤720px.
- **Accessibility:** fleet craft and crew are real `<button>`s with `aria-label`s and visible focus rings; palette is keyboard-driven.

## State Management
- `view`, `activeSlug` (current sector), `hoveredSlug` (fleet hover), `paletteOpen`, `query`, `paletteSel` (keyboard index), `sectorQuery`, `statusFilter` (ALL/LIVE/REVIEW), `launching`, `crewIndex` (open drawer), `commanderOffline`.
- Data is static in-file: `SECTORS` (8 + 1 dev), `ASSETS` (per sector), `MISSION`, `CREW` (10), `FORMATION` (tiers). Move to props/store/API in the app.

## Design Tokens
- **Core palette:** cyan `#4FD9FF` / `#35D6FF`, blue `#1F9CD5`, deep navy `#0B2A5B` / `#071633` / `#04071a`, gold/amber `#FF9D1E` / `#FFC857` / `#FEBC10`, mint `#8EDAB2` / `#5EEAD4`, violet `#B388FF`, pink `#ED2C70`, slate-gray `--sp-gray:#92A3C7`, text `#F4F7FF`, hairline `--line:rgba(146,163,199,.18)`.
- **Backdrop:** layered radial glows over `linear-gradient(180deg,#071633,#050b22 55%,#04071a)` + a canvas starfield.
- **Type:** Outfit (400/500/600) display+body; JetBrains Mono (400/500/700) labels/codes. H1 `clamp(38px,5.2vw,64px)`; body 14–16px; mono labels 9–12px with .1–.3em letter-spacing.
- **Radius:** pills 999px; cards 16–24px; inputs/chips 8–12px. **Shadows:** deep `0 20–40px … -20px rgba(0,0,0,.6–.8)`. **Motion:** ease `cubic-bezier(0.16,1,0.3,1)`; launch 600ms; hover 200–300ms.

## Assets
- `_ds/intrepid-design-system-…/colors_and_type.css` — Intrepid tokens + Outfit @font-face (use your app's own design-system import instead if present).
- `_ds/intrepid-design-system-…/assets/intrepid-mark.png` — approved Intrepid brand mark (nav + holographic planet decal). Use the real brand asset in-app.
- `public/models/crew/khai.glb` — approved Commander model (27,902 tris, 3.47 MB, clips Idle_11/Wave_for_Help_4/Agree_Gesture/Backflip_Jump/…). **Lan and the other 8 are not yet supplied.**
- CDN: three.js r128, GLTFLoader (r128), GSAP 3.13 + plugins, JetBrains Mono. Replace CDN with your bundved deps in-app.

## Files (in this bundle)
- `Value Protection Hub.dc.html` — the full front-end (nav, home, sector, crew, palette, all three.js + logic).
- `Astronaut.dc.html` — interim SVG crew-avatar component (to be replaced by GLBs).
- `character-lab.html` + `character-lab.js` — the GLB **review environment** (load/inspect a crew GLB: tris, meshes, materials, textures, required-clip check, camera presets, wireframe/skeleton toggles).
- `ASSET_CONTRACT.md` — the exact GLB spec each crew model must meet (Y-up, feet pivot, shared humanoid rig, PBR, clips `Idle/Wave/Salute/Point`, ~15–30k tris, ≤2048px textures).
- `support.js` — the prototype's Design-Component runtime (reference only; not needed in a Vue port).
- `public/models/crew/khai.glb` — Commander model.
- `_ds/…` — Intrepid tokens, font, and brand mark.

## Suggested next steps in-repo
1. Recreate Home/Sector/Crew as Vue routes/components using the app's design system; port the three.js scenes (switch `setTimeout` loops back to `requestAnimationFrame`).
2. Wire `khai.glb` as the Home Commander (lazy-load, `AnimationMixer`, dispose on unmount).
3. As each new GLB is approved in CharacterLab, drop it at `public/models/crew/<name>.glb` and swap the interim SVG crew avatars for GLB instances (shared skeleton via `SkeletonUtils.clone`).
