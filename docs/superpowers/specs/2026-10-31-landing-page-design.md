# Apna Waqeel landing page redesign

Date: 2026-10-31
Status: awaiting owner approval (builder check done)
Mockups: https://claude.ai/artifact/4VaNcLUFWmadgbJJ1gHoBh. Hero = board "1C" (`HeroFiles.dc.html`); the other sections map by board title ("2 · Problem" … "6 · Get started + footer"), so board numbers run one behind the section numbers below. All boards are 1440px desktop; phone layouts come from this document.

## Intent

Apna Waqeel is a Techfini Solutions product. The owner (Techfini CTO) wants its public landing page (`/`, `app/page.tsx`) to look, read and move like techfinisolutions.com, while saying something specific to law in Pakistan. The page pitches to three audiences at once: chambers (buyers of the firm-wide system), lawyers, and clients looking for a lawyer.

The current page has to go because:
- its stats are invented (50k+ cases, 1,200 lawyers, 94% success rate, 60% time saved); a "success rate" claim is also risky under Pakistan Bar Council limits on lawyer advertising;
- it never shows the product, only slogans and icon cards;
- it speaks to nobody in particular.

## Goals

- Same visual language as Techfini: dark canvas, purple "space" bands, flat lime action colour, violet secondary accent, Manrope uppercase display type, pill buttons, hairline cards.
- Same motion language: scroll-driven, native browser APIs only, `transform`/`opacity` only, everything gated behind reduced motion.
- A law-centric hero: loose paperwork (diary page, WhatsApp message, file folder, printed cause list) gathers into one digital case file.
- **Mobile first.** Every section is designed and built for a ~360-390px phone first, then enhanced upward. Pinned/scroll-scrubbed effects are desktop enhancements; phones get a complete, good-looking static or lightly animated layout.
- Each audience can find "their" path in one tap: chambers and clients land on signup with their role preselected; lawyers per "Lawyer path".

## Non-goals

- No change to dashboards, auth pages (beyond role preselect, below) or the app's design tokens. The Techfini theme is scoped to the landing page.
- No sound, no cursor particle layer, no intro loader, no dotted globe, no WebGL.
- No new routes (no /pricing, /about, /chambers pages).
- No real copy written by the builder: placeholders only (see Copy).

## Anti-goals (fails even if it "works")

- Any invented number, testimonial, client logo or success claim.
- Jank or horizontal scroll on a mid-range Android phone.
- Breaking the dashboards' look by leaking Techfini tokens or resets globally (Techfini clears Tailwind's default palette with `--color-*: initial`; that must NOT happen here, the dashboards use stock Tailwind/shadcn colours).
- Lime used decoratively or on body text.

## Constraints

- Next.js 16.0.10, React 19.2, Tailwind v4 (CSS-first, `app/globals.css`), lucide-react available. Next 16 APIs differ from older versions; check the official Next 16 docs before using an unfamiliar API (this install ships no local docs folder).
- No new npm dependencies. No animation library.
- Fonts via `next/font/google`: Manrope (variable) added for the landing page; Noto Nastaliq Urdu is already loaded in `app/layout.tsx` as `--font-noto-nastaliq` / `font-urdu`.
- Reference implementation lives in the Techfini repo at `~/Documents/codebloom`. Source of truth for values: `codebloom/DESIGN.md` (v3 colours, §3 typography, §4 motion, §8 responsive). Useful code to port (adapt, don't copy blindly): `src/components/motion/motion-root.tsx` (the `--p` scroll engine), `src/components/ui/wave-title.tsx`, `src/components/logo-marquee/logo-marquee.tsx`, and the `has-motion` head script in `src/app/layout.tsx`.
- Accessibility (from Techfini's rules, adopted here): visible 3px lime focus ring with 2px offset on every interactive element; `prefers-reduced-motion` respected everywhere; body text contrast >= 4.5:1; `#626262` never for readable text; on purple bands muted text is `#C9C2DA`, not `#929292`; touch targets >= 44px; marquee has a pause control; hover effects also apply on `:focus-visible`.

## Decisions made with the owner

- Palette: Techfini v3 exactly (canvas `#080808`, surfaces `#111/#1A1A1A/#272727`, purple `#3C1C7E` with the `gradient-space` glow, lime `#CDFB50` / hover `#D9FF6E`, violet `#BD6CF7`, ink `#F5F5F2`, muted `#929292`, muted-on-purple `#C9C2DA`).
- Logo: the scale-"A" monogram (`components/shared/logo-mark.tsx`) recoloured for the landing page to black strokes on a lime tile. Wordmark lowercase "**apna** waqeel" (700 / 400), like Techfini's. Urdu name "اپنا وکیل" appears in the hero and the footer.
- Hero: option 1C, "paperwork becomes one case file".
- Audience: all three (chambers, lawyers, clients).
- Footer credit: "A Techfini Solutions product".

## Page structure (top to bottom)

Background bands alternate as in the mockups: black, purple, black, purple, black, purple.

1. **Header.** Logo + wordmark, links (Chambers / Lawyers / Clients anchors, Sign in -> `/auth/login`), lime "Get started" -> `/auth/signup`. Phone: logo + "Get started" + a menu button opening a sheet (native `<dialog>`). Desktop: transparent over hero, solid/glass once scrolled.
2. **Hero (black, option 1C).** Eyebrow "CASE MANAGEMENT · PAKISTAN", headline (placeholder; mockup uses "EVERY CASE. ONE FILE."), violet hand-drawn underline, Urdu name, subhead, two CTAs (primary -> signup, secondary -> "#how-it-works"). Visual: four paper scraps gather into a case-file card.
   - Phone: headline, then the visual (shorter stage, ~360px), then subhead + full-width stacked CTAs. Scraps play once on load (CSS keyframes), not scroll-scrubbed.
   - Desktop (>= 1100px): two columns, visual right; the gather is scroll-driven by `--p` over a short pinned runway (owner may prefer it time-based; builder's call if pinning feels heavy).
   - Reduced motion: scraps hidden, finished card shown.
3. **Problem (purple).** "Where do cases get lost?" track (client walks in -> filing -> hearings -> judgment) with a lime runner and violet "lost" dots; two cards, "Today" vs "With Apna Waqeel", with chip lists. Phone: one column, track vertical or simplified horizontal with labels under dots.
4. **How a case moves (black, `#how-it-works`).** Five steps: intake, filing, hearings, orders, closure. Desktop >= 900px: pinned journey, lime marker travels, steps brighten when passed. Phone: plain vertical list, each step brightens as it scrolls into view (`data-progress="enter"`).
5. **Three sides (purple).** Cards for Chambers / Lawyers / Clients, each: label, caps title, 4 feature rows, CTA. Chambers -> `/auth/signup?role=chamber_admin`; Clients -> `/auth/signup?role=client`; Lawyers: see "Lawyer path" below. Feature rows describe features that exist in the app today (chambers: roster/assignment, firm calendar, case oversight, lawyer invites; lawyers: case files/hearings/tasks, drafting templates, research, client messages; clients: find a lawyer, case status, secure messages, documents). Desktop >= 1100px: Techfini "deck" (cards fly in face-down with the logo mark on the back and flip one by one, pinned). Phone: stacked cards, simple rise-in, no flip.
6. **Product peek (black).** "Your day, on one screen": a coded (HTML/CSS, not an image) mini dashboard showing today's hearings with clearly placeholder case data, labelled as an example. Below: courts marquee (Supreme Court, Lahore/Sindh/Islamabad/Peshawar/Balochistan High Courts, District & Sessions Courts, Family Courts), two copies for the loop, second copy `aria-hidden`, pause button. Phone: table becomes a stacked list of hearing cards; the sidebar is hidden.
7. **Get started + footer (purple).** Big headline, three giant role rows ("I run a chamber" / "I'm a lawyer" / "I need a lawyer") with the lime roll-up label on hover/focus, chambers and clients -> signup with role; lawyers per "Lawyer path". Footer: link columns, contact placeholders, legal row "© {year} Apna Waqeel · A Techfini Solutions product", giant wordmark + Urdu name. Phone: columns stack, wordmark scales with `vw`.

Section headings use the Techfini wave reveal (letters rise as the heading scrolls in), all breakpoints, disabled under reduced motion.

## Motion rules

- One scroll engine component (port of Techfini `MotionRoot`) mounted only on the landing page; it writes `--p` on `[data-progress]` elements and `--space` for purple band fades. Never write per-frame custom properties on `<html>`/`<body>`.
- Purple bands: the page background crossfades to purple as a `[data-space]` section fills the middle of the screen (Techfini motion #3). Phone included (cheap: one opacity).
- All pinned heights and `--p` formulas live under `.has-motion`, set by a head script unless reduced motion. Without it the page is a complete static layout. The `has-motion` class on `<html>` must not affect dashboards (all landing CSS is scoped under a landing root class).
- No wheel smoothing on touch devices; builder may skip wheel smoothing entirely.
- Budget: 60fps on a mid-tier laptop, no long tasks on a mid-range phone; animate only `transform` and `opacity`.

## Responsive

Mobile first. Breakpoints follow Techfini §8: base = phone; 640px two columns where useful; 768px full nav links; 900px pinned journey; 1100px deck, pinned hero, glass pill header; content max-width 1460px, gutter `clamp(1rem, 4vw, 4rem)`. Display type sizes use Techfini's `clamp()` scale (hero `clamp(2.375rem, .4rem + 7.4vw, 8.75rem)` etc.), which already shrinks for phones. No horizontal scroll at 320px.

## Copy

The builder writes no final copy. Headlines, subheads and descriptions are short bracketed placeholders (e.g. `[HERO SUBHEAD, 1-2 lines]`) or the mockup's draft lines marked `DRAFT`. All visible copy lives in one content file (`content/landing.ts` or similar), not in JSX. Rules: no em-dashes; none of "unlock, leverage, seamlessly, cutting-edge, revolutionize, elevate, unleash, transform your business, empower your journey"; no numbers or claims without a source. Feature names, court names and role names may be written as facts.

## Lawyer path (decided with the owner)

Signup has no lawyer option: lawyers join a chamber by invite, and that rule stays. On the landing page:
- Lawyer CTAs (Three sides card button, "I'm a lawyer" row) go to `/auth/signup?role=chamber_admin`, framed for solo practitioners: `[DRAFT] Practising on your own? Start your chamber.` A solo lawyer is a chamber of one.
- Next to them, a secondary link: `[DRAFT] Invited by your chamber? Sign in` -> `/auth/login`.
- No lawyer account without a chamber is ever created from the landing page.

## Small change outside the landing page

`app/auth/signup/page.tsx`: read `?role=` and, if it is `chamber_admin` or `client` (the two options signup offers), use it as the initial `selectedRole`; ignore anything else, including `lawyer`. This is the only auth change.

## Settled by Claude (owner may override)

- Footer link columns contain only real targets: section anchors, `/auth/login`, `/auth/signup`, plus clearly marked placeholder links (`[PRIVACY]`, `[TERMS]`, contact). No fake pages.
- The landing page does not link `/dashboard/client/find-lawyers` (it shows mock data with non-Pakistani lawyers).

## Left to the builder

- File/component breakdown (one folder per section is expected, e.g. `components/landing/<section>/`).
- Whether the hero gather is scroll-scrubbed or time-based on desktop.
- How the landing-scoped tokens are expressed (scoped CSS variables under a `.landing` root plus a few `@layer components` classes is the expected route; must not alter global Tailwind theme).
- Exact chip lists in the Problem cards, within the "existing features only" rule.
- Header glass vs solid fallback details.

## Done means

- `npx tsc --noEmit` clean for touched files and `next build` passes.
- Page checked in a browser at 375px, 768px and 1440px, and with reduced motion on.
- Keyboard-only pass: every link/button reachable with a visible lime focus ring.
- Dashboards spot-checked to confirm their look is unchanged.
