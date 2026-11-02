# Chamber Dashboard Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Owner rule: never run `git commit` (or any history-writing git command).** Every task ends with "leave uncommitted"; the owner commits.

**Goal:** Rebuild every chamber admin page (and the shared sidebar, mobile shell and case detail view) in the Techfini theme without changing behaviour.

**Architecture:** `components/dashboard/dash.css` defines the Techfini tokens and remaps shadcn's CSS variables under `.l-dash`. The chamber layout puts `l-dash` + Manrope on `<body>` (so portaled dialogs/selects are themed) and wraps page content in a `landing` div (so `.l-btn`, `.l-label`, `.l-chip`, `.l-card` work). Pages are re-marked-up with new primitives in `components/dashboard/`; their state, effects, Supabase calls and handlers are kept byte-for-byte where possible. A guard test fails while a rebuilt file still contains old light/italic classes.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/ui, lucide-react, recharts, Node 26 `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-31-chamber-dashboard-reskin-design.md` (read it first). Theme source: `components/landing/landing.css` (tokens on `.landing`), `components/landing/header.tsx` (dialog sheet pattern), `components/auth/auth-ui.tsx` + `auth.css` (form field pattern: `Field`, password toggle, `AuthAlert`).

## Global Constraints

- No changes to data fetching, Supabase queries, routes, permissions, handlers or state shape. Markup and styling only.
- No new npm dependencies.
- Theme values: canvas `#080808`; surfaces `#111111` / `#1A1A1A` / `#272727`; purple `#3C1C7E`; lime `#CDFB50` (hover `#D9FF6E`, soft `rgb(205 251 80 / 0.14)`); violet `#BD6CF7`; ink `#F5F5F2`; muted `#929292`; error `#FF8A7A`; focus `3px solid #CDFB50`, offset 2px.
- Type: page title `clamp(1.75rem, 1.2rem + 1.6vw, 2.5rem)` 650 uppercase −0.035em; panel title 1rem 650 uppercase +0.02em; body 15px/1.55 sentence case; label 0.6875rem 600 uppercase +0.1em; numbers 650 tabular. No `italic`, no `font-black`.
- Lime only for primary actions, active nav, focus and one key highlight per page.
- Every rule in `dash.css` starts with `.l-dash`. Never put the `landing` class on `<body>`.
- Existing visible strings stay; new empty-state hints are prefixed `[DRAFT]`.
- Touch targets ≥ 44px; no horizontal page scroll at 375px; wide tables scroll inside an `overflow-x: auto` box.
- Browser: the builder never signs in, creates auth users or writes data to the hosted Supabase. Signed-in checks go to the owner via a per-task checklist appended to `docs/superpowers/plans/2026-10-31-chamber-dashboard-owner-checks.md`.

## Review Focus

1. **Portaled content** (Dialog, Select, DropdownMenu, sonner toasts) must be themed and correctly layered on chamber pages and unthemed after navigating to a lawyer/client page → Task 1 test asserts `useBodyClass` removes classes on unmount; owner checklist items in Tasks 3-9 open each modal/select.
2. **Behaviour regressions from markup rewrites** (lost `onClick`, `onSubmit`, `disabled`, `value`/`onChange`) → every page task keeps handlers untouched and greps the before/after handler names (step "handler parity").
3. **Unknown status strings** from the database (null, `''`, mixed case, new values) must render as a neutral chip, not crash → Task 1 `statusTone` tests.
4. **Phone width** (375px) for tables, toolbars, calendar and the mobile shell → each task's checklist, and Task 2 verifies the shell without sign-in via the unauthenticated redirect page plus a component render.
5. **Lawyer/client pages after the shell change**: still navigable on phones and desktop, collapse toggle still persists → Task 2 owner checklist.

---

### Task 1: Theme scope, primitives and guard test

**Files:**
- Create: `components/dashboard/dash.css`, `components/dashboard/dash-css.test.ts`
- Create: `components/dashboard/ui.tsx` (primitives), `lib/dashboard/status.ts`, `lib/dashboard/status.test.ts`
- Create: `lib/dashboard/use-body-class.ts`, `components/dashboard/rebuilt.ts`, `components/dashboard/reskin-guard.test.ts`
- Modify: `app/dashboard/chambers-admin/layout.tsx`

**Interfaces:**
- Produces:
  - `type ChipTone = 'lime' | 'violet' | 'neutral' | 'danger'`; `statusTone(status: string | null | undefined): ChipTone`.
  - `useBodyClass(classNames: string[]): void` — adds on mount, removes on unmount (client hook).
  - `DashPage({ children })`, `PageHeader({ eyebrow?, title, description?, actions? })`, `StatTile({ label, value, hint?, icon? })`, `Panel({ title?, action?, children, className? })`, `StatusChip({ status, children? })` (tone via `statusTone`), `EmptyState({ icon, title, hint?, action? })`, `Toolbar({ children })`, `SearchInput(props: InputHTMLAttributes & { label: string })` (visually hidden label).
  - CSS classes: `.l-dash-page`, `.l-dash-head`, `.l-stat`, `.l-panel`, `.l-panel__head`, `.l-chip--danger`, `.l-empty`, `.l-toolbar`, `.l-table-box`, `.l-table`, `.l-rows` (phone list rows), `.l-dash-field` / `.l-dash-input` (form fields, same look as auth `.l-input`).
  - `REBUILT: string[]` exported from `components/dashboard/rebuilt.ts` (read by `reskin-guard.test.ts`); later tasks append paths.

- [ ] **Step 1: Failing tests**
  - `status.test.ts`: `statusTone('active') === 'lime'`, `'open'`, `'converted'`, `'completed'` → `'lime'`; `'pending'`, `'new'`, `'contacted'`, `'invited'`, `'scheduled'` → `'violet'`; `'lost'`, `'cancelled'`, `'suspended'` → `'danger'`; `'closed'`, `'inactive'`, `'archived'`, `'whatever'`, `''`, `null`, `undefined` → `'neutral'`; case-insensitive and trimmed (`' Active '` → `'lime'`).
  - `dash-css.test.ts`: copy the rule/selector parser from `components/landing/landing-css.test.ts`; assert every selector starts with `.l-dash`; file defines `--l-lime`, `--background`, `--primary`, `--ring` under `.l-dash`; contains a `prefers-reduced-motion` block.
  - `reskin-guard.test.ts`: for each path in `REBUILT`, file content must not match `/\b(italic|font-black|bg-white|(bg|text|border|from|to|via)-(slate|blue|indigo)-\d{2,3})\b/`. `REBUILT` starts as `['app/dashboard/chambers-admin/layout.tsx']`.
- [ ] **Step 2: Run** `node --test lib/dashboard/*.test.ts components/dashboard/*.test.ts` → FAIL (modules missing).
- [ ] **Step 3: Implement**
  - `dash.css`: under `.l-dash` define the `--l-*` tokens (same values as `.landing` in landing.css) and the shadcn variables: `--background:#080808; --foreground:#F5F5F2; --card:#111111; --card-foreground:#F5F5F2; --popover:#111111; --popover-foreground:#F5F5F2; --primary:#CDFB50; --primary-foreground:#080808; --secondary:#1A1A1A; --secondary-foreground:#F5F5F2; --muted:#1A1A1A; --muted-foreground:#929292; --accent:#1A1A1A; --accent-foreground:#F5F5F2; --destructive:#FF8A7A; --border:#272727; --input:#272727; --ring:#CDFB50; --radius:14px`. The scope root itself gets `.l-dash { background: var(--l-canvas); color: var(--l-ink); font-family: var(--font-manrope), system-ui, sans-serif }` (this styles `<body>` on chamber routes). Then the primitive classes listed above, mobile first.
  - `use-body-class.ts`: `'use client'`; `useEffect` add/remove on `document.body.classList`.
  - `ui.tsx`: primitives with the props above.
  - Chamber `layout.tsx`: client component; `useBodyClass(['l-dash', manrope.variable])` (import `manrope` from `@/components/landing/fonts`); imports `landing.css` and `dash.css`; renders `<div className="landing l-dash-root">{children}</div>`.
- [ ] **Step 4: Run** tests → PASS; `npx tsc --noEmit -p .` → only the known `lib/pusher.ts` error.
- [ ] **Step 5: No-sign-in check:** `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/chambers-admin` → redirect/200 without server error in the dev log.
- [ ] **Step 6:** Leave uncommitted.

---

### Task 2: Sidebar and mobile shell (all roles)

**Files:**
- Modify: `components/shared/sidebar.tsx`, `app/dashboard/layout.tsx`
- Create: `components/dashboard/mobile-bar.tsx`
- Modify: `components/dashboard/rebuilt.ts` (append `components/shared/sidebar.tsx`, `app/dashboard/layout.tsx`, `components/dashboard/mobile-bar.tsx`)

**Interfaces:**
- Consumes: `LogoMark tone="lime"`, `manrope`, dash.css tokens.
- Produces: `Sidebar({ isCollapsed, onToggle, variant?: 'column' | 'drawer', onNavigate?: () => void })` — same nav groups/role logic; `MobileBar()` — top bar with brand + menu button opening a `<dialog>` that renders `<Sidebar variant="drawer" onNavigate={close} />`.

- [ ] **Step 1:** Append the three paths to `REBUILT`; run the guard test → FAIL on sidebar/layout classes.
- [ ] **Step 2: Sidebar:** root `<aside className={cn('landing l-dash l-side', manrope.variable, …)}>`; brand row = LogoMark lime + "**apna** waqeel"; nav links 44px min height, active = lime-soft pill + ink text, hover = surface-2; group labels `.l-label`; collapse toggle and sign-out keep their handlers. `variant="drawer"` drops the fixed width and collapse toggle. Remove decorative blur divs.
- [ ] **Step 3: Shell:** in `app/dashboard/layout.tsx`, below 1024px hide the column sidebar and render `<MobileBar />` above `<main>`; from 1024px keep today's column + collapse (localStorage logic unchanged). Root background `#080808` only inside `.l-dash` scopes; lawyer/client `<main>` keeps its current background.
- [ ] **Step 4: Handler parity:** `git diff -U0 components/shared/sidebar.tsx | grep -E "onClick|onToggle|signOut|href"` shows only moved, not removed, handlers.
- [ ] **Step 5:** guard + all tests PASS; tsc clean apart from pusher.
- [ ] **Step 6: Owner checklist** (append to owner-checks file): chamber, lawyer and client accounts at 1440px — collapse toggle persists after reload, active item highlighted, sign-out works; at 375px — top bar shows, menu opens drawer, link navigates and closes it, Escape closes and focus returns.
- [ ] **Step 7:** Leave uncommitted.

---

### Tasks 3-9: one page group each

Every page task follows the same steps; only files and checklist differ.

- **Step 1:** Append the task's files to `REBUILT`; run `node --test components/dashboard/reskin-guard.test.ts` → FAIL listing those files.
- **Step 2:** Note handler names: `grep -noE "on[A-Z][a-zA-Z]+=\{[^}]+\}|handle[A-Z][a-zA-Z]+|set[A-Z][a-zA-Z]+\(" <file>` saved to the workspace.
- **Step 3:** Rewrite markup with Task 1 primitives (`DashPage` → `PageHeader` → content in `Panel`s; numbers in `StatTile`; statuses in `StatusChip`; lists with ≥5 columns get `.l-table` inside `.l-table-box` from 900px and `.l-rows` below; empty lists use `EmptyState`; forms use `.l-dash-field` with the auth password toggle pattern for password inputs; shadcn `Dialog`/`Select`/`DropdownMenu`/`Tabs` stay, their hardcoded colour classes removed). Remove every class the guard bans.
- **Step 4: Handler parity:** rerun the Step 2 grep; every name from before is still present.
- **Step 5:** guard + all tests PASS; `npx tsc --noEmit -p .` only the pusher error.
- **Step 6:** Append the task's owner checklist.
- **Step 7:** Leave uncommitted.

| Task | Files | Owner checklist (375px and 1440px) |
|---|---|---|
| 3 Home | `app/dashboard/chambers-admin/page.tsx` | stats load with real numbers; recent cases list links open the case; quick actions navigate; chart (if any) readable |
| 4 Cases | `chambers-admin/cases/page.tsx`, `cases/[id]/page.tsx`, `components/shared/case-form-modal.tsx`, `delete-confirm-dialog.tsx` | search/filter narrows list; New case modal opens, select dropdowns themed, submit creates case; delete confirm works; row opens detail |
| 5 Case detail (shared) | `components/shared/case-detail.tsx`, `task-modal.tsx`; wrap usage in `app/dashboard/lawyer/cases/page.tsx` and `.../[id]/page.tsx` in `<div className="landing l-dash">` | as chamber and as lawyer: detail renders, tasks add/complete via task modal, status changes save |
| 6 Lawyers | `chambers-admin/lawyers/page.tsx`, `lawyers/onboard/page.tsx` | lawyer list + statuses; invite/resend works; onboard form submits; actions menu (DropdownMenu) themed |
| 7 Clients | `chambers-admin/clients/page.tsx`, `components/shared/client-form-modal.tsx` | list, search, add/edit client modal submit |
| 8 Leads | `chambers-admin/leads/page.tsx`, `components/domain/leads/create-lead-dialog.tsx` | pipeline columns scroll horizontally inside their box on phones; create lead; status change |
| 9 Calendar, Settings, Setup | `chambers-admin/calendar/page.tsx`, `components/shared/event-modal.tsx`, `settings/page.tsx`, `setup/page.tsx` | month/week view readable at 375px; create/edit event; settings save; setup flow completes |

Charts (recharts, Tasks 3/8 if present): stroke/fill lime `#CDFB50` for the primary series, violet `#BD6CF7` second, `rgb(245 245 242 / .35)` others; grid `#272727`; tooltip surface `#111111`.

---

### Task 10: Full verification and review

- [ ] `node --test lib/landing/*.test.ts lib/dashboard/*.test.ts components/landing/*.test.ts components/dashboard/*.test.ts content/*.test.ts` → all PASS.
- [ ] `npx tsc --noEmit -p .` → only the known pusher error.
- [ ] `grep -rnE "\b(italic|font-black)\b" app/dashboard/chambers-admin components/shared/sidebar.tsx components/shared/case-detail.tsx` → no output.
- [ ] Unsigned browser check: `/dashboard/chambers-admin` redirects to login with no console errors; landing and auth pages unchanged.
- [ ] Owner checks file is complete for Tasks 2-9; hand it to the owner.
- [ ] Leave uncommitted.
