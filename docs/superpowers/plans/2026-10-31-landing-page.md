# Apna Waqeel Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `app/page.tsx` with a mobile-first, Techfini-styled landing page for chambers, lawyers and clients, with the 1C "paperwork becomes one case file" hero.

**Architecture:** One `LandingPage` server component renders seven section components under a `.landing` root that carries all Techfini tokens as scoped CSS variables (nothing touches the global Tailwind theme). Motion is CSS driven by a `--p` custom property that a single client `MotionRoot` (ported from Techfini) writes on `[data-progress]` elements; pinned/scroll effects live under `.has-motion .landing …` so the page is a complete static layout without JS or with reduced motion. All copy lives in `content/landing.ts`.

**Tech Stack:** Next.js 16.0.10 (App Router), React 19.2, Tailwind v4 (only for layout utilities if convenient; styling is mostly `components/landing/landing.css`), `next/font/google` (Manrope), lucide-react, Node 26 built-in test runner (`node --test`, native TS type stripping).

**Spec:** `docs/superpowers/specs/2026-10-31-landing-page-design.md` (read it first). Mockups: https://claude.ai/artifact/4VaNcLUFWmadgbJJ1gHoBh. Reference implementation (read-only): `~/Documents/codebloom` — `DESIGN.md`, `src/components/motion/motion-root.tsx`, `src/lib/motion.ts`, `src/components/ui/wave-title.tsx`, `src/components/logo-marquee/logo-marquee.tsx`, and `src/app/globals.css` (`.space-layer` ~L426, `.wave*` ~L436-460, `.marquee*` ~L1311-1410).

## Global Constraints

- No new npm dependencies. No animation library.
- Animate only `transform` and `opacity`. Every animation off under `prefers-reduced-motion: reduce`.
- All landing CSS selectors are scoped under `.landing` (or `.has-motion .landing`). Never `--color-*: initial`, never edit `app/globals.css` tokens, never write per-frame properties on `<html>`/`<body>`.
- Palette (spec, verbatim): canvas `#080808`; surfaces `#111111` / `#1A1A1A` / `#272727`; purple `#3C1C7E` with gradient-space `radial-gradient(95% 75% at 88% 0%, rgb(189 108 247 / .45) 0%, transparent 62%), radial-gradient(60% 50% at 10% 30%, rgb(8 8 8 / .18) 0%, transparent 70%), #3C1C7E`; lime `#CDFB50`, hover `#D9FF6E`, lime-soft `rgb(205 251 80 / 0.14)`; violet `#BD6CF7`; ink `#F5F5F2`; muted `#929292`; muted on purple `#C9C2DA`; hairline `#272727`, on purple `rgb(245 245 242 / .18)`; hairline-aurora `rgb(205 251 80 / 0.45)`.
- Type scale (Techfini §3): hero `clamp(2.375rem, .4rem + 7.4vw, 8.75rem)`, xl `clamp(2.125rem, .6rem + 5.4vw, 6.5rem)`, lg/h2 `clamp(1.875rem, .9rem + 3.4vw, 4.5rem)`, md/h3 `clamp(1.375rem, 1.05rem + 1vw, 2rem)`; display weight 650, uppercase, letter-spacing −0.05em (hero/xl) / −0.035em (lg/md); body-lg `clamp(1.1875rem, 1.05rem + .55vw, 1.625rem)` 500; eyebrow/button 0.8125rem 600/700 uppercase +0.08em/+0.06em.
- Easing: cinematic `cubic-bezier(.16, 1, .3, 1)`. Radii: card 22px, panel 30px, pill 9999px.
- Breakpoints, mobile-first (`min-width`): 640, 768 (full nav), 900 (pinned journey), 1100 (deck, pinned hero, glass header). Content max-width 1460px, gutter `clamp(1rem, 4vw, 4rem)`. No horizontal scroll at 320px.
- Focus: `outline: 3px solid #CDFB50; outline-offset: 2px` on every interactive element; hover styles also on `:focus-visible`. Touch targets ≥ 44px. `#626262` never for readable text.
- Copy: only from `content/landing.ts`; placeholders in `[BRACKETS]` or prefixed `[DRAFT]`; no em-dash (U+2014); banned words: unlock, leverage, seamlessly, cutting-edge, revolutionize, elevate, unleash, transform your business, empower your journey; no `%` or numeric claims.
- Every section `h2` is a `WaveTitle` (Task 1) and the section has `aria-labelledby` pointing at it.
- Lawyer path: lawyer CTAs → `/auth/signup?role=chamber_admin` with `[DRAFT] Practising on your own? Start your chamber.`; secondary `[DRAFT] Invited by your chamber? Sign in` → `/auth/login`. Never `?role=lawyer`. Never link `/dashboard/client/find-lawyers`.

## Review Focus

1. **320px phone:** giant display type, the marquee and the product table must not cause horizontal scroll → Task 8 verification asserts `document.documentElement.scrollWidth <= innerWidth` at 320 and 375.
2. **Reduced motion / no JS:** without `.has-motion` every section must be a finished layout (hero shows the case card, scraps hidden; journey steps all lit; deck face-up) → Task 1 CSS test pins that pinned heights only appear under `.has-motion`; Task 8 verifies in the browser with reduced motion emulated.
3. **Arbitrary `?role=` values** (`lawyer`, `admin`, `CLIENT`, empty, repeated) must not preselect anything unexpected → Task 7 unit tests.
4. **Leaving the landing page** (client navigation to `/auth/login`, then a dashboard): no leaked wheel listener, no fixed purple layer, no Manrope/token bleed → Task 1 MotionRoot cleanup + CSS scope test; Task 8 dashboard spot-check.
5. **Keyboard-only visitor:** menu sheet opens/closes with Escape and returns focus; marquee pause button reachable; role rows show the lime label on focus → Tasks 2, 5, 6, verified in Task 8.

---

### Task 1: Foundation (tokens, font, motion engine, page shell)

**Files:**
- Create: `lib/landing/motion.ts`, `lib/landing/motion.test.ts`
- Create: `components/landing/motion-root.tsx`
- Create: `components/landing/landing.css`, `components/landing/landing-css.test.ts`
- Create: `components/landing/wave-title.tsx`
- Create: `components/landing/landing-page.tsx`
- Create: `content/landing.ts`, `content/landing.test.ts`
- Modify: `app/page.tsx` (replace whole file)
- Modify: `components/shared/logo-mark.tsx` (add `tone` prop)
- Modify: `tsconfig.json` (add `"allowImportingTsExtensions": true` to `compilerOptions`; valid because `noEmit` is true; lets tests import `./motion.ts`)

**Interfaces:**
- Produces:
  - `clamp(value: number, min: number, max: number): number`
  - `progressOf(rect: { top: number; height: number }, mode: 'pin' | 'enter' | 'center', viewport: number): number` — same formulas as Techfini `progressOf` but taking a rect (pure, testable).
  - `middleCoverage(rect: { top: number; bottom: number }, viewport: number): number` — Techfini formula (smoothstep of coverage of 25–75% band).
  - `MotionRoot(): JSX.Element` (client) — writes `--p` on `.landing [data-progress]`, `--space` on `.landing .space-layer` from `.landing [data-space]`; renders `<div aria-hidden className="space-layer" />`; wheel smoothing only for `(hover: hover) and (pointer: fine)`; removes every listener/observer/rAF on unmount.
  - `WaveTitle({ id, text, className }: { id: string; text: string; className?: string })` — Techfini port, same markup and classes (`wave`, `wave__word`, `wave__char`, `--at`).
  - `LogoMark({ className, tone }: { className?: string; tone?: 'brand' | 'lime' })` — `'brand'` (default, current blue tile/white strokes) or `'lime'` (`#CDFB50` tile, `#080808` strokes).
  - `landing` content object (typed, `as const`) with keys used by later tasks: `nav`, `hero`, `problem`, `journey`, `audiences`, `product`, `courts`, `getStarted`, `footer`.
  - CSS classes for later tasks: `.landing` root, `.l-container`, `.l-eyebrow`, `.l-h1`, `.l-h2`, `.l-h3`, `.l-body-lg`, `.l-btn` + `.l-btn--primary` / `.l-btn--outline`, `.l-chip` + `.l-chip--lime`, `.l-card`, `.l-band` (black) / `.l-band--space` (purple, `data-space`).

- [ ] **Step 1: Write failing tests**

`lib/landing/motion.test.ts` (import from `./motion.ts`, use `node:test` + `node:assert/strict`):
- `clamp(5, 0, 1) === 1`, `clamp(-1, 0, 1) === 0`.
- `progressOf({ top: 0, height: 2000 }, 'pin', 1000) === 0`; `progressOf({ top: -500, height: 2000 }, 'pin', 1000) === 0.5`; `progressOf({ top: -5000, height: 2000 }, 'pin', 1000) === 1`.
- `progressOf({ top: 1000, height: 400 }, 'enter', 1000) === 0`; `progressOf({ top: 350, height: 400 }, 'enter', 1000) === 1`.
- `middleCoverage({ top: 0, bottom: 1000 }, 1000) === 1`; `middleCoverage({ top: 800, bottom: 1600 }, 1000) === 0`.

`components/landing/landing-css.test.ts` (reads `landing.css` with `fs`):
- every rule selector (strip `@media`/`@keyframes` blocks' inner keyframe selectors) starts with `.landing` or `.has-motion .landing`.
- file does not contain `--color-` followed by `*` nor `initial`.
- every `height:` declaration whose value contains `svh` or `vh` appears only inside a rule whose selector starts with `.has-motion`.
- contains a `@media (prefers-reduced-motion: reduce)` block.

`content/landing.test.ts` (imports `../content/landing.ts`, flattens every string value):
- no string contains `—`.
- no string matches `/unlock|leverage|seamlessly|cutting-edge|revolutioni[sz]e|elevate|unleash|transform your business|empower your journey/i`.
- no string matches `/\d+\s?%|\d+k\+/i`.
- no string contains `role=lawyer` or `find-lawyers`.

- [ ] **Step 2: Run tests, expect failure**

Run: `node --test lib/landing/motion.test.ts components/landing/landing-css.test.ts content/landing.test.ts`
Expected: FAIL (modules/files missing).

- [ ] **Step 3: Implement**

- `lib/landing/motion.ts`: the three functions above.
- `content/landing.ts`: all section copy, taking text from the mockups (draft lines prefixed `[DRAFT]`, unknowns as `[BRACKETS]`). Real facts allowed as-is: feature names (from spec §5), court names (spec §6), role labels, "A Techfini Solutions product", Urdu `اپنا وکیل`. Hero: eyebrow `CASE MANAGEMENT · PAKISTAN`, headline lines `['Every case.', 'One file.']` with the accent word `file.`, scrap texts as in mockup board 1C.
- `landing.css`: tokens as custom properties on `.landing` (names: `--l-canvas`, `--l-surface-1..3`, `--l-space`, `--l-gradient-space`, `--l-lime`, `--l-lime-hover`, `--l-lime-soft`, `--l-violet`, `--l-ink`, `--l-muted`, `--l-hairline`, `--l-hairline-aurora`, `--l-ease`); `.landing` sets `background: var(--l-canvas); color: var(--l-ink); font-family: var(--font-manrope), system-ui, sans-serif; overflow-x: clip; isolation: isolate`. Inside `.l-band--space`, redefine `--l-muted: #C9C2DA` and `--l-hairline: rgb(245 245 242 / .18)`. Port `.space-layer` (`position: fixed; inset: 0; z-index: 0; background: var(--l-gradient-space); opacity: var(--space, 0); pointer-events: none`) and give sections `position: relative; z-index: 1`. Without `.has-motion`, `.l-band--space` paints its own gradient background; with `.has-motion` it is transparent and the space layer does the fade. Port the `.wave*` rules. Global focus rule `.landing :focus-visible { outline: 3px solid var(--l-lime); outline-offset: 2px }`.
- `motion-root.tsx`: port Techfini `MotionRoot`, dropping `--page-p`/rail, querying only inside `.landing`, using `progressOf`/`middleCoverage` from `lib/landing/motion` with `getBoundingClientRect()` results. Keep: IntersectionObserver to track only near-screen elements, all reads before writes per frame, skip when unchanged.
- `wave-title.tsx`: port as-is.
- `landing-page.tsx`: server component. Loads Manrope via `next/font/google` (`subsets: ['latin'], variable: '--font-manrope'`, variable font, no weight list). Root `<div className={`landing ${manrope.variable}`}>`; first child an inline `<script>` that adds `has-motion` to `document.documentElement` unless `matchMedia('(prefers-reduced-motion: reduce)').matches`; then `<MotionRoot />`; then sections (Tasks 2-6 add them; until then render nothing else). Imports `./landing.css`.
- `app/page.tsx`: `export default function Home() { return <LandingPage /> }` plus `export const metadata` with title `Apna Waqeel` and description from `content/landing.ts`.
- `logo-mark.tsx`: add `tone` prop as specified; existing call sites unchanged.

- [ ] **Step 4: Run tests and typecheck**

Run: `node --test lib/landing/motion.test.ts components/landing/landing-css.test.ts content/landing.test.ts` → all PASS.
Run: `npx tsc --noEmit -p .` → no errors in touched files.

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/landing-redesign
git add lib/landing content components/landing components/shared/logo-mark.tsx app/page.tsx tsconfig.json
git commit -m "feat(landing): scoped Techfini tokens, motion engine and page shell"
```

---

### Task 2: Header + Hero (1C)

**Files:**
- Create: `components/landing/header.tsx` (client: menu dialog + scrolled state), `components/landing/hero.tsx`
- Modify: `components/landing/landing.css`, `components/landing/landing-page.tsx`, `content/landing.ts` (only if a string is missing)

**Interfaces:**
- Consumes: `landing.nav`, `landing.hero`, `LogoMark tone="lime"`, CSS classes from Task 1.
- Produces: `#top` id on hero; section anchors used by nav: `#chambers`, `#lawyers`, `#clients` (Task 4 sets them), `#how-it-works` (Task 3).

- [ ] **Step 1: Header**

Phone (base): logo + wordmark (`<b>apna</b> waqeel`), lime "Get started" (`/auth/signup`), menu `<button aria-label="Open menu" aria-haspopup="dialog">` opening a native `<dialog>` via `showModal()` with links Chambers / Lawyers / Clients / Sign in (`/auth/login`) and a close button; links close the dialog. ≥768px: links inline, menu button hidden. ≥1100px: transparent over the hero, `rgb(17 17 17 / 0.92)` + `backdrop-filter: blur(20px) saturate(180%)` pill once `scrollY > 20` (solid `#111111` fallback via `@supports not (backdrop-filter: blur(1px))`). Scroll state: one passive `scroll` listener that only `setState`s when the boolean flips.

- [ ] **Step 2: Hero**

Markup order (phone first): eyebrow → `h1.l-h1` (two lines, accent word in lime with the violet underline SVG from mockup 1C) → Urdu name (`lang="ur" dir="rtl" className="font-urdu"`) → `.hero__stage` (scraps + case card, `aria-hidden` on scraps; case card is a real `<article>` with label "Example case file") → subhead `.l-body-lg` → CTAs (`/auth/signup` primary, `#how-it-works` outline), full-width stacked below 640px.
- Stage height: 360px base, 540px ≥1100px. Scraps: diary page, WhatsApp bubble, folder, printed cause list; each has `--tx --ty --r` custom props as in mockup 1C.
- Base motion (no `.has-motion`): scraps hidden (`opacity: 0`), card fully visible.
- `.has-motion` <1100px: one-shot CSS keyframes on load (scraps visible then gather into the card over ~1.4s with `--l-ease`, card scales 0.92→1).
- `.has-motion` ≥1100px: hero gets `data-progress="pin"` runway `height: 180svh` with sticky inner block; scraps' gather = `clamp(0, var(--p) * 2.5, 1)`, card arrives over `p` 0.3–0.6. (Spec leaves scroll vs time to the builder: if pinning feels heavy in Step 3, use the one-shot animation at all widths and note it in the commit.)

- [ ] **Step 3: Verify**

Run: `node --test lib/landing/motion.test.ts components/landing/landing-css.test.ts content/landing.test.ts` → PASS.
Run `npm run dev`; open `/` at 375px and 1440px. Expected: no horizontal scroll; menu opens, Escape closes and focus returns to the menu button; with DevTools "prefers-reduced-motion: reduce" the case card shows and scraps are absent.

- [ ] **Step 4: Commit** — `git commit -m "feat(landing): header with mobile sheet and paperwork-to-case-file hero"`

---

### Task 3: Problem + Journey

**Files:**
- Create: `components/landing/problem.tsx`, `components/landing/journey.tsx`
- Modify: `components/landing/landing.css`, `components/landing/landing-page.tsx`

**Interfaces:**
- Consumes: `landing.problem`, `landing.journey`, `WaveTitle`, `.l-band--space` with `data-space`.
- Produces: `id="how-it-works"` on the journey section.

- [ ] **Step 1: Problem** (`<section className="l-band l-band--space" data-space aria-labelledby="problem-title">`). Track: phone = vertical line with four labelled stops and the lime runner moving down (CSS keyframes, loop); ≥640px horizontal as in mockup board "2 · Problem", violet "lost" dots fall. Two cards ("Today", "With Apna Waqeel" with `--l-hairline-aurora` border) one column base, two ≥900px. Chips use `.l-chip` / `.l-chip--lime`.

- [ ] **Step 2: Journey** five steps as an `<ol>`. Base: vertical list; each `<li data-progress="enter">` brightens from opacity 0.32 → 1 as `--p` passes 0.5 (`.has-motion` only). ≥900px and `(min-height: 640px)`: section `data-progress="pin"`, runway `height: 260svh`, sticky inner; horizontal rail, lime marker `translateX` across with `--p`, step i lit when `--p >= i/4`, perspective road with moving dashes (`stroke-dashoffset` is not transform: use a `translateX` on a repeated dash strip instead).

- [ ] **Step 3: Verify** tests PASS; browser at 375 and 1440, reduced motion: all five steps fully lit, no pinning.

- [ ] **Step 4: Commit** — `git commit -m "feat(landing): problem band and case journey"`

---

### Task 4: Three sides deck (with lawyer path)

**Files:**
- Create: `components/landing/audiences.tsx`
- Modify: `components/landing/landing.css`, `components/landing/landing-page.tsx`, `content/landing.ts`

**Interfaces:**
- Consumes: `landing.audiences` = `{ eyebrow, title, cards: Array<{ id: 'chambers' | 'lawyers' | 'clients'; label: string; title: string; features: [string, string, string, string]; cta: { label: string; href: string }; secondary?: { label: string; href: string } }> }`.
- Produces: element ids `chambers`, `lawyers`, `clients` (nav anchors from Task 2).

- [ ] **Step 1: Add a test** to `content/landing.test.ts`: `audiences.cards` has ids `['chambers','lawyers','clients']`; chambers cta href `/auth/signup?role=chamber_admin`; clients cta href `/auth/signup?role=client`; lawyers cta href `/auth/signup?role=chamber_admin` and `secondary.href === '/auth/login'`. Run → FAIL until content updated, then PASS.

- [ ] **Step 2: Build** purple band. Base: stacked `<article>` cards (lawyers card has the lime hairline border), rise-in via `data-progress="enter"` under `.has-motion`. ≥1100px and `(min-height: 700px)` under `.has-motion`: pinned runway `height: 240svh`; each card is a 3D flip (front = content, back = surface with dotted texture + `LogoMark tone="lime"`, `backface-visibility: hidden`), card i flips over `--p` window starting at `0.16 * i`, lasting `0.24`, flying in from tilted face-down. Without `.has-motion` the back face is not rendered visible (front only).

- [ ] **Step 3: Verify** tests PASS; browser 375 / 1440 / reduced motion; Tab reaches every card CTA and the lawyer secondary link.

- [ ] **Step 4: Commit** — `git commit -m "feat(landing): chambers, lawyers and clients deck"`

---

### Task 5: Product peek + courts marquee

**Files:**
- Create: `components/landing/product-peek.tsx`, `components/landing/courts-marquee.tsx` (client: pause toggle)
- Modify: `components/landing/landing.css`, `components/landing/landing-page.tsx`

**Interfaces:**
- Consumes: `landing.product` (`hearings: Array<{ time: string; caseTitle: string; court: string; stage: string; lawyer: string }>`, all placeholders like `[Case title A]` except court names), `landing.courts: string[]`.

- [ ] **Step 1: Product peek** black band. A coded mini dashboard labelled `Example data`. Base: sidebar hidden; hearings as a list of cards (time, title, court, stage chip). ≥900px: sidebar visible + `<table>` with header row. Stage chip colours: arguments = lime-soft/lime, adjourned = violet-soft/`#D9B3FB`, others = surface-2.

- [ ] **Step 2: Marquee** port Techfini `.marquee*` CSS and markup (one row, two groups, second `aria-hidden`), 60s loop, mask edges, pauses on hover/`:focus-within`, and a `<button className="marquee-toggle" aria-pressed>` Pause/Play. Static under reduced motion.

- [ ] **Step 3: Verify** at 320px: `document.documentElement.scrollWidth <= innerWidth` in the console; pause button toggles.

- [ ] **Step 4: Commit** — `git commit -m "feat(landing): product preview and courts marquee"`

---

### Task 6: Get started + footer

**Files:**
- Create: `components/landing/get-started.tsx`
- Modify: `components/landing/landing.css`, `components/landing/landing-page.tsx`, `content/landing.ts`

**Interfaces:**
- Consumes: `landing.getStarted` = `{ eyebrow, title, rows: Array<{ label: string; href: string; note?: { label: string; href: string } }> }`, `landing.footer` = `{ columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>, legal: string, credit: string }`.

- [ ] **Step 1: Test** in `content/landing.test.ts`: `getStarted.rows` labels are `I run a chamber`, `I'm a lawyer`, `I need a lawyer`; lawyer row href `/auth/signup?role=chamber_admin` with `note.href === '/auth/login'`; every footer link href starts with `#`, `/auth/`, or `[` (placeholder). Run FAIL → implement content → PASS.

- [ ] **Step 2: Build** purple band. Role rows: `<a>` with the label twice (second `aria-hidden`, lime) and the roll-up on `:hover, :focus-visible`. Footer: columns stack base, 3 across ≥768px; legal row `© {new Date().getFullYear()} Apna Waqeel · A Techfini Solutions product`; giant wordmark `font-size: clamp(3rem, 13vw, 15rem)` (decorative, `aria-hidden`) + Urdu name in violet.

- [ ] **Step 3: Verify** tests PASS; Tab through rows shows lime label; 320px no overflow.

- [ ] **Step 4: Commit** — `git commit -m "feat(landing): role rows and footer"`

---

### Task 7: Signup reads `?role=`

**Files:**
- Create: `lib/landing/signup-role.ts`, `lib/landing/signup-role.test.ts`
- Modify: `app/auth/signup/page.tsx`

**Interfaces:**
- Produces: `parseSignupRole(value: string | null | undefined): 'chamber_admin' | 'client' | null`.

- [ ] **Step 1: Failing test** — `parseSignupRole('chamber_admin') === 'chamber_admin'`; `parseSignupRole('client') === 'client'`; `null` for `'lawyer'`, `'admin'`, `'CLIENT'`, `''`, `null`, `undefined`, `'client '`.
- [ ] **Step 2: Run** `node --test lib/landing/signup-role.test.ts` → FAIL.
- [ ] **Step 3: Implement** the function (exact match against the two values). In the signup form component (already inside `<Suspense>`), read `useSearchParams().get('role')` and initialise `selectedRole` with `parseSignupRole(...) ?? 'client'`. Change nothing else on the page.
- [ ] **Step 4: Run** test → PASS; `npx tsc --noEmit -p .` clean for the file; open `/auth/signup?role=chamber_admin` → "Create Chamber" selected; `?role=lawyer` → "Find Legal Help" (default) selected.
- [ ] **Step 5: Commit** — `git commit -m "feat(signup): preselect chamber or client role from link"`

---

### Task 8: Full verification

**Files:** none new (fixes go in the owning file).

- [ ] **Step 1:** `node --test lib/landing/*.test.ts components/landing/*.test.ts content/*.test.ts` → all PASS.
- [ ] **Step 2:** `npm run build` → succeeds (it runs `prisma generate` first; if it fails for reasons outside the landing page, record the exact error and run `npx tsc --noEmit -p .` instead).
- [ ] **Step 3:** Browser at 320, 375, 768, 1440: no horizontal scroll (`scrollWidth <= innerWidth`), every section matches its mockup board's intent, Urdu renders in Nastaliq.
- [ ] **Step 4:** Emulate `prefers-reduced-motion: reduce`, reload: nothing moves, no pinned runways, hero card visible, journey fully lit, deck face-up, marquee static.
- [ ] **Step 5:** Keyboard only from the top: every link/button reachable with the lime ring; menu sheet Escape returns focus; marquee pause reachable.
- [ ] **Step 6:** Click Sign in, log in with a seeded test account if one exists in the project (else just load `/auth/login` and `/dashboard` redirect): dashboard and auth pages look as before (no purple layer, no Manrope, white backgrounds intact); no console errors about listeners.
- [ ] **Step 7: Commit** any fixes — `git commit -m "fix(landing): verification fixes"`.
