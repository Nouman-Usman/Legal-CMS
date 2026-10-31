# Chamber dashboard reskin (Techfini theme)

Date: 2026-10-31
Status: awaiting owner approval (builder check done, owner answered its questions)
Related: `docs/superpowers/specs/2026-10-31-landing-page-design.md` (the theme's source), `components/landing/landing.css`, `components/auth/auth.css`

## Intent

The landing and auth pages now use the Techfini Solutions theme (dark canvas, purple bands, lime action colour, violet accent, Manrope). The chamber admin dashboard (`/dashboard/chambers-admin/**`) still uses the old light-blue, italic, all-caps look, so a chamber admin moves from a polished site into a different-looking product. The owner wants the chamber dashboard rebuilt **page by page** in the Techfini theme. This is a visual rebuild, not a feature change: what each page does stays the same.

## Goals

- Every chamber admin page rendered in the Techfini theme, consistent with the landing and auth pages.
- Readable, data-dense dashboard UI: Techfini colours, type family and components, at a scale suited to tables and forms (not the landing page's giant display type).
- Mobile first: every page usable at 375px; the sidebar becomes an off-canvas drawer on small screens.
- Shared dashboard primitives so the lawyer and client dashboards can be reskinned later with the same parts.

## Non-goals

- No changes to data fetching, Supabase queries, permissions, routes or business logic. Handlers, state and effects stay as they are; only markup and styling change.
- No new features, pages or fields.
- Lawyer and client dashboard pages are not reskinned in this project. They change only where they share parts with chambers: the sidebar and the mobile shell (decision 6, "Mobile shell"), and the case detail view (see "case-detail").
- No new npm dependencies.

## Anti-goals

- Breaking any existing behaviour of a page (a form that no longer submits, a filter that no longer filters, a modal that no longer opens).
- Theme leaking into the rest of the app beyond the parts listed above.
- Invented numbers or labels in the UI (stats must still come from the data).
- Italic or all-caps body text, unreadable contrast, or tap targets under 44px.

## Constraints

- Next.js 16, React 19, Tailwind v4, shadcn/ui components in `components/ui/`, lucide-react, recharts (already installed).
- Theme values (verbatim from the landing spec): canvas `#080808`; surfaces `#111111` / `#1A1A1A` / `#272727`; purple `#3C1C7E` with the `gradient-space` glow; lime `#CDFB50` (hover `#D9FF6E`, soft `rgb(205 251 80 / 0.14)`); violet `#BD6CF7`; ink `#F5F5F2`; muted `#929292`; error `#FF8A7A`; Manrope; focus ring `3px solid #CDFB50`, offset 2px.
- Reuse the landing tokens and primitives (`.landing` tokens, `.l-btn`, `.l-label`, `.l-chip`, `.l-card`) where they fit rather than redefining values.
- Owner commits; the builder never runs `git commit`.

## Decisions (Claude's calls, owner may override)

1. **Theme scope.** A `l-dash` class scopes all dashboard styling, and `dash.css` defines the Techfini tokens (`--l-*`) under `.l-dash` itself. Because shadcn `Dialog`, `Select`, `DropdownMenu` and `Popover` content renders in portals attached to `<body>`, the chamber layout adds only `l-dash` (plus the Manrope variable class) to `<body>` while a chamber route is mounted and removes it on unmount. It does **not** put `landing` on `<body>`: landing.css's root rules (`position`, `isolation`, `overflow-x`, `.landing > :not(.space-layer)`) would hit the body and every portal container. Page content inside `<main>` is wrapped in a `landing` div so the landing primitives (`.l-btn`, `.l-label`, `.l-chip`, `.l-card`) work there; the chamber layout imports `landing.css` and `dash.css` itself. All dashboard CSS selectors start with `.l-dash`.
2. **shadcn tokens remapped inside the scope.** Under `.l-dash`, the shadcn CSS variables (`--background`, `--foreground`, `--card`, `--popover`, `--primary` = lime, `--primary-foreground` = `#080808`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--border`, `--input`, `--ring` = lime, `--destructive` = `#FF8A7A`, `--radius`) are set to Techfini values, so stock shadcn components (Dialog, Select, Tabs, DropdownMenu, Input, Textarea, Badge, Button variants) look right without editing them.
3. **Page markup is rewritten** with new primitives in `components/dashboard/` (styles in `components/dashboard/dash.css`):
   - `DashPage`: page wrapper with consistent padding and max width.
   - `PageHeader`: eyebrow, title, optional description, actions slot.
   - `StatTile`: label, value (tabular numbers), optional delta/hint, optional icon.
   - `Panel`: card surface with optional header (title + action) and body.
   - `StatusChip`: tone `lime | violet | neutral | danger` (case/lead/lawyer statuses map onto these).
   - `EmptyState`: icon, title, hint, optional action.
   - `Toolbar`: search input + filter controls that wrap on phones.
   - Tables: a `.l-table` style on native `<table>` (or shadcn `Table`) inside an `overflow-x: auto` box; on phones, list-style rows where a page's table has more than 4 columns.
4. **Type scale for the dashboard:** page title `clamp(1.75rem, 1.2rem + 1.6vw, 2.5rem)`, weight 650, uppercase, letter-spacing −0.035em; panel titles 1rem 650 uppercase +0.02em; body 15px/1.55 sentence case; labels 0.6875rem 600 uppercase +0.1em; numbers 650 tabular. No italics, no `font-black`.
5. **Colour use:** lime only for primary actions, active nav, focus, and the single most important highlight on a page; status uses chips; charts use lime + violet + ink at reduced opacity.
6. **Sidebar** (`components/shared/sidebar.tsx`, rendered by the shared `app/dashboard/layout.tsx` for all roles): restyled for every role, because it is one component and is already dark. It carries its own scope (`landing l-dash` + Manrope variable class on the `<aside>` and its drawer), so it is themed for lawyers and clients too even though their pages are not. Lime active pill, LogoMark `tone="lime"`, and the brand wordmark "**apna** waqeel" (700/400) replacing the current "Chambers Admin / Management Hub", which is wrong for lawyers and clients. Today the sidebar has no mobile handling (a fixed `w-80`/`w-24` column); see "Mobile shell" below. Navigation items and role logic do not change; the desktop collapse toggle saved in localStorage stays.
7. **Shared modals used by chamber pages.** `case-form-modal`, `client-form-modal`, `event-modal`, `delete-confirm-dialog` and `components/domain/leads/create-lead-dialog` are used only by chamber pages: rebuild them freely in the theme, in the task for the page that uses them. `components/shared/case-detail.tsx` (and `task-modal.tsx` through it) is also used by `app/dashboard/lawyer/cases/page.tsx` and `.../[id]/page.tsx`: see "case-detail" below.
8. **Copy:** existing visible strings stay as written; only their styling changes (shouting caps and italics become sentence case, except page titles and labels which follow the type scale). No new copy beyond empty-state hints, which are marked `[DRAFT]`.

## Page order

1. Shell: body scope, token remap, `dash.css`, primitives, sidebar (+ mobile drawer).
2. Home (`/dashboard/chambers-admin`).
3. Cases (`/cases`, `/cases/[id]`, `case-detail`, `case-form-modal`).
4. Lawyers (`/lawyers`, `/lawyers/onboard`).
5. Clients (`/clients`, `client-form-modal`).
6. Leads (`/leads`, `create-lead-dialog`).
7. Calendar (`/calendar`, `event-modal`).
8. Settings (`/settings`).
9. Setup (`/setup`).

The sidebar drawer reuses the landing header's native `<dialog>` sheet pattern (`components/landing/header.tsx`).

Each step leaves the app working; unreskinned pages keep their old look inside the new shell until their turn.

## Done means

- `npx tsc --noEmit -p .` shows no new errors (the pre-existing `lib/pusher.ts` / `pusher-js` error is known).
- A CSS scope test (like `components/landing/landing-css.test.ts`) asserts every rule in `dash.css` is scoped to `.l-dash`.
- For each rebuilt page, a short owner checklist (open, click, submit, filter; 375px and 1440px) is handed over; the builder runs every check that needs no sign-in.
- Lawyer and client dashboard content looks as before apart from the sidebar, the mobile shell and the case detail view.

## Open questions for the owner

## Mobile shell (decided with the owner)

Fix it for every role. Below 1024px, `app/dashboard/layout.tsx` shows a slim top bar (brand + menu button) and the sidebar is hidden; the menu button opens the sidebar as a native `<dialog>` drawer (pattern: `components/landing/header.tsx`). From 1024px the current side column and its collapse toggle stay. This changes lawyer and client dashboards on phones, intentionally: today the 320px sidebar covers a 375px screen.

## case-detail (decided with the owner)

`components/shared/case-detail.tsx` (and `task-modal.tsx`, which it opens) is reskinned once, in the theme, for both chambers and lawyers. The lawyer case pages (`app/dashboard/lawyer/cases/page.tsx`, `.../[id]/page.tsx`) wrap it in `l-dash` + `landing` so it renders correctly there; it will look dark inside the still-light lawyer dashboard until that dashboard is reskinned. Its data and handlers do not change.

## Browser checks (decided with the owner)

`.env` points at a hosted Supabase project, so the builder does not create auth users or write test data there. The builder checks what needs no sign-in (unauthenticated redirect, typecheck, CSS scope test, components rendered in isolation where practical) and the owner checks each signed-in page at 375px and 1440px after its task, using the checklist the builder leaves per page (what to open, click and submit).

## Left to the builder

- Exact primitive props beyond those listed, file split within `components/dashboard/`.
- How each page's existing layout maps onto primitives.
- Chart styling details within decision 5.
- Whether the sidebar drawer uses `<dialog>` or the component's existing collapse state.
