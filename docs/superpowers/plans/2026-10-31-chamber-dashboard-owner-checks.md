# Chamber dashboard reskin: owner checks

Signed-in checks the builder could not run (it does not sign in or write to the hosted Supabase). Check each at **1440px** and **375px** wide (DevTools device toolbar for phone). Tick what works; note anything that doesn't.

## Task 2: sidebar and mobile shell (all roles)

Sign in as a chamber admin, then a lawyer, then a client.

- [ ] 1440px: dark sidebar with the lime "apna waqeel" logo; the current page's nav item has a lime tint.
- [ ] 1440px: "Collapse Menu" collapses to icons; hovering an icon shows its name; reload keeps it collapsed; expand works.
- [ ] 1440px: Sign Out signs you out.
- [ ] 375px: no sidebar column; a top bar with the logo and a round menu button.
- [ ] 375px: menu button opens the sidebar as a drawer from the left; tapping a link navigates and closes it; Escape or the X closes it.
- [ ] Lawyer and client pages: content looks as before (light), only the sidebar/top bar changed.

## Task 3: Home (`/dashboard/chambers-admin`)

- [ ] Header shows real lawyer and case counts; "Add New Lawyer" and "View All Cases" navigate.
- [ ] Three stat tiles (lawyers, cases, clients) match the data.
- [ ] Case Trends chart (lime area) and Case Status donut render with readable labels and tooltips.
- [ ] Recent Activity rows open the case; status chips coloured (lime/violet/neutral).
- [ ] Quick Links navigate.
- [ ] 375px: everything stacks in one column, no sideways scroll.
- Note: the old hard-coded "Firm Revenue $42.8k", "Firm Capacity 82%", "New Leads 14" tiles and the "Expand Your Firm / View Upgrade" promo (button did nothing) were removed: they were not real data.

## Task 4: Cases (`/dashboard/chambers-admin/cases`, `/cases/[id]`)

- [ ] Five stat tiles show real counts.
- [ ] Search narrows the list (case number, title, client name).
- [ ] Status and priority filter chips filter the list; the active chip is filled.
- [ ] Case title opens the case; ⋮ menu (themed dark) has Open Dossier / Modify Intel; Modify Intel opens the form pre-filled.
- [ ] "Initialize New Dossier" opens the case form: dark card, selects open dark dropdowns, submitting creates a case and the page reloads.
- [ ] Delete confirm dialog (where used) is dark with a red confirm button.
- [ ] 375px: filters stack above the list; rows wrap without sideways scroll.
- Note: the "Purge Record" menu item had no action before and still has none. The "Archive Purge Protocol / Run Health Check" promo (button did nothing) was removed.

## Task 5: Case detail (chamber `/cases/[id]` and lawyer case pages)

- [ ] Chamber: header card shows case number, title, status chip, type/priority/filing date/lawyer.
- [ ] Tabs (Overview, Documents, Tasks, Notes) switch; on 375px the tab strip scrolls sideways.
- [ ] Documents: Upload Document picks a file and the list refreshes; Download opens the link.
- [ ] Tasks: Add Task opens the task dialog; creating a task refreshes the list.
- [ ] Notes: typing enables the send button; sending adds the note.
- [ ] Lawyer `/dashboard/lawyer/cases` and `/cases/[id]`: case detail shows as a dark rounded panel inside the light lawyer page; same actions work. (Its task dialog keeps the default light theme on lawyer pages.)

## Task 6: Lawyers (`/lawyers`, `/lawyers/onboard`)

- [ ] Three stat tiles (total, active, pending) match; search and status chips (with counts) filter the roster.
- [ ] Lawyer cards: avatar initial, status chip, email/phone/bar; ⋮ menu: View Profile, Edit Details, Resend Invite (pending only), Remove Lawyer.
- [ ] "Add New Lawyer" opens a dark dialog; Escape/outside click closes it; submitting sends the invite and shows the "Invite Sent!" dialog with the link.
- [ ] Edit Details saves; success/error notices appear bottom-right and can be dismissed.
- [ ] View Profile dialog shows contact, bar, status, enlistment date.
- [ ] Onboard page: validation messages show under the fields; practice-area chips toggle; Save Profile works; Cancel/Back return to Lawyers.
- Note: removed the fake "Firm Capacity: Over 90%" tile, the "Lawyer Management" promo block, and the "Generate Performance Audit" button (it had no action).

## Task 7: Clients (`/clients`)

- [ ] Two stat tiles (total, new this month) match; search and status chips filter.
- [ ] Acquisition chart (lime) renders with month labels.
- [ ] Client cards show name, status, email/phone, case count.
- [ ] "Execute New Onboarding" opens the dark client form dialog; submitting adds the client and the list refreshes.
- Note: removed the fake "Satisfaction Index 98%" tile, the "Relationship Intelligence" promo, and the per-client message button, ⋮ menu (Inspect / Modify / Purge) and "Analyze Partner" button: none of them had an action. Tell me if you want them wired up.

## Task 8: Leads (`/leads`)

- [ ] Four stat tiles (total, new, active pipeline, conversion rate) match.
- [ ] Search and status chips (all/new/contacted/consultation/converted/lost) filter.
- [ ] Create lead dialog opens from the lime button, submits, and the list refreshes.
- [ ] Lead ⋮ menu: Mark Consultation / Execute Conversion / Terminate Lead change the status chip.
- Note: removed the "Acquisition Protocol / Run Outreach AI" promo and the "Analyze Interest" button (no actions).

## Task 9a: Calendar (`/calendar`)

- [ ] Four stat tiles match the current month; search and type chips (all/hearing/task) filter events.
- [ ] Month grid: prev/next/Today work; today's date has a lime square; clicking a day selects it (lime outline) and the Agenda shows its events. Keyboard: Tab to a day, Enter selects.
- [ ] 1440px: days show event pills (violet = hearing, lime = task); 375px: days show coloured dots, no sideways scroll.
- [ ] iCal and CSV export download files.
- [ ] Schedule Event opens the dark event dialog; create and edit save; delete asks for confirmation and removes the event.
- [ ] Google Calendar "Connect Now" starts the connect flow as before.
- Note: removed the Grid/Timeline toggle (no timeline view existed, it changed nothing), the agenda ⋮ button and "Add First Note" (no actions).

## Task 9b: Settings (`/settings`) and Setup (`/setup`)

- [ ] Settings → General: Firm Details form shows saved values; Save Changes shows a lime success notice (or a red error).
- [ ] Settings → Billing: hourly rate, currency and timezone selects (dark dropdowns), invoice prefix; Update Billing Rules saves.
- [ ] Chamber card shows logo (or placeholder), name, short chamber ID, managed-by role.
- [ ] Setup (new chamber admin without a chamber): form creates the chamber; Email field is read-only.
- Note: removed non-working UI: the Branding tab (colour "Change" buttons and "Upgrade Pro" had no actions), the empty Notifications tab, the Quick Actions ("Verify Secondary Email", "Force MFA Reset": no actions), the logo camera button (no upload), the hard-coded "Verified Professional" badge, and the billing feature checklist ("Automated Tax Calculation", etc.).
