---
id: EVENTS-04
title: Host an event: basics, when and where, tickets, review
owner: DEV3
area: EVENTS
order: 53
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [EVENTS-02, UI-02, EVENTS-01]
decisions: [R-8]
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [E13, E14, E15, E16, E21, E22]
---
# EVENTS-04 · Host an event: basics, when and where, tickets, review

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-8 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py E13 E14 E15 E16 E21 E22` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for E13, E14, E15, E16, E21, E22, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

My events (E16) is added by EVENTS-08 and Get verified (E21) by ME-12 (docs/WORKFLOW.md section 7).

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-image-picker` (E14 banner). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E13 · Basics**: Host wizard step 1 of 3 (Basics / When and where / Tickets): event name, what happens at it, who is running it (Adeyemi & Co), Format In person / Online / Hybrid.
- **E14 · When and where**: Step 2: starts/ends, street address with hint 'Missing addresses are the top reason events get sent back.', banner image upload, Category 'Business & Finance'.
- **E15 · Tickets**: Step 3: ticket types (name, price, quantity): Regular ₦5,000 × 100, VIP ₦12,000 × 20, Add a ticket type; note 'You keep 85% of every ticket. Set price to ₦0 for a free event.'; Send for review.
- **E16 · Sent for review**: Confirmation: 'A person checks it. It goes live on its own once approved.' My events / Done.
- **E21 · Needs a tick**: Gate: 'Hosting needs a verified tick · A creator or professional tick, ₦2,000 a year.' Get verified.
- **E22 · Sent back**: Rejected event: 'Sent back · Add the street address, then send it again.' with the address field flagged 'Needed before it can go live' and Send again.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- E16: My events (opens E17): added by EVENTS-08
- E21: Get verified (opens M11): added by ME-12

## Capability checks

- [ ] **E13**: a user can enter name, description, organiser; pick format; Continue (E14).
- [ ] **E14**: a user can set start/end; enter street address; upload banner; pick category; Continue (E15).
- [ ] **E15**: a user can edit tier name/price/quantity; add a tier; Send for review (E16).
- [ ] **E16**: a user can tap Done.
- [ ] **E21**: a user without a tick sees the gate when they try to host.
- [ ] **E22**: a user can fix field; Send again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E21, E22.
- [ ] From E1's Host your event (EVENTS-01), a verified user reaches E13 and an unverified one E21 (this task adds it, as drawn).

## What the backend serves today (from the analysis)

- **E13**: partial. Missing: Format 'Hybrid' does not exist: enum EventFormat = in_person|online. CreateEventDto also REQUIRES `type` (EventType) and `location`, which no board step collects (board has Category, and Street address only).
- **E14**: partial. Missing: Category label 'Business & Finance' has no matching enum (EventCategory.business); labels need a mapping table. `location` (required) has no field on the board.
- **E15**: partial. Missing: Two calls today (POST /events then PUT /events/{id}/tickets) where the board submits once; backend needs a `tier` enum per type (regular|vip|vvip|early_bird|group|free) the board never asks for, and rejects ₦0 unless tier='free' (client must map). Ticket tiers are not part of admin review (AdminEventReview covers the event only).
- **E16**: served.
- **E21**: served. Missing: Gate fires only on submit; a pre-check (GET /api/hub/verification/me) is needed to show this before the wizard starts.
- **E22**: served. Missing: No per-field flag: the reason is free text, so 'Needed before it can go live' on a specific field cannot be driven by data.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E14: 'Missing addresses are the top reason events get sent back.'
- E15: You keep 85% of every ticket
- E15: Regular ₦5,000 × 100
- E15: VIP ₦12,000 × 20
- E15: Set price to ₦0 for a free event
- E21: Verified tick ₦2,000 a year (creator or professional)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

**Builder (8 Oct 2026, resumed after a usage-limit crash; the first builder's uncommitted work was reviewed and kept where sound).** Mobile `wmt/EVENTS-04`, backend `wmt/EVENTS-04` (e55a1bc). Depends on mobile #14 and backend #78 (EVENTS-01): merge those first. Mobile has `origin/wmt/EVENTS-01` and `origin/main` merged in; backend has `origin/main` merged in (it does not need #78).

**Built (mobile).** `src/features/events/host/`: `HostScreen` (E13 to E15, one screen with a three-step wizard), `HostEnds` (E16 Sent for review, E21 gate), `SentBackScreen` (E22, route `/events/sent-back/<id>`, for My events to open), `hostForm.ts` (draft, rules, request body), `hostParts.tsx`, `hostApi.ts`, `HostBanner` (E1's Host your event). `src/features/events/chrome.tsx` is the nav bar and tabs now shared by Events and Host (EventsScreen uses it and gains the Host event tab and the banner, both through a new optional `onHost`). Routes: `src/app/events/host.tsx`, `src/app/events/sent-back/[id].tsx`; `src/app/events/index.tsx` passes `onHost`. Reuses `format.ts` (`watOf`, `toKobo`), `pickImage`/`presign` from profile-edit, shared TextField, Button, BottomSheet, FilterChips, EmptyState, ErrorState, Skeleton.

**Built (backend, additive).** `GET /events/options` also serves `tickets` (host share percent from the commission setting, price, quantity and name bounds, the most ticket types) and `fields` (name, description, host and address lengths), read from the same constants `POST /events` enforces, so the wizard keeps no copy of a server limit and E15's "You keep 85% of every ticket. Set price to ₦0 for a free event." comes from the Hub. New upload folder `event/banner` (images). No route, field or type that exists was changed.

**Capability checks.**
- E13: name, description, organiser, Format (In person, Online, Hybrid), Continue; tests: blank, spaces, length edges, Continue stays put and names each missing field.
- E14: Starts (day and time sheet, Lagos time), Ends, street address (needed unless Online), category, Continue; banner upload built, tile hidden until the phone can pick a picture (G-443, row 8 not applied: `canPickImage` is false).
- E15: tier name, price, quantity, add and remove a tier, one POST with the event and its ticket types, free (₦0) allowed (R-8); a wrong tier is flagged and nothing else is blocked.
- E16: Done. My events is EVENTS-08's.
- E21: pre-check `GET /verification/me` before the wizard starts; also shown when the Hub refuses the submit for a missing tick. Price on the gate is the system's. Get verified is ME-12's.
- E22: reviewer's words, street address flagged when the event has none, Send again (PATCH). Entry from My events is EVENTS-08's.
- Hub entries (R-41): E1's Host event tab and Host your event banner are added here. Create's Event entry (ME-04) and Home's Events tile (EVENTS-01) are not this task's.

**Defaults decided (recorded, work carried on).** The Kind (`type`, still required) is a picker under Format on step 1 because no artboard asks for it (G-442). Ends is a time on the start's day (G-443). Past starts are refused against the clock the screen is given. A failed refetch of the options or the tick never replaces the form. The phone's Back goes a step back with the text kept. Double submit is one request.

**Tests.** `src/features/events/host/__tests__/hostForm.test.ts` (33, every bound at and one past its edge), `hostScreens.test.tsx` (22: gate, loading, offline and retry, validation, one POST body, double submit, 500 and offline keep the form, 400 sentence shown, tick refusal, E22, phone Back), `src/features/events/__tests__/hostEntry.test.tsx` (3). Backend: `src/event/tests/event-host-wizard.contract.spec.ts`, `src/storage/tests/event-banner-folder.spec.ts`; `npx jest --runInBand src/event src/storage` 8 suites, 180 tests pass against a local Hub database and the mock WAWU ID (not the real one).

**Backend checks.** `tsc --noEmit` clean; `scripts/protected-routes/run.sh --fresh`: all 244 required tests passed; `scripts/gates/run.py`: 16 fail, none in a file this branch touches (Flutterwave and deferral findings already on main); `check_baseline.py` ok; `contract:build` run. Contract copied with `python3 scripts/api/sync_contract.py --backend <backend worktree>` (`npm run api` reads backend main only, which lacks the new fields until the backend merges).

**NOT RUN.** V10 (a real Android phone): no device. Picture-against-picture screenshots at 390 px light and dark against `render_design.py E13 E14 E15 E16 E21 E22` (V5): NOT RUN by this builder (the resumed session ended before a Hub and `npm run web` were stood up); metrics in code are taken from `design/_gen/events_b.js` and `kit.js`, and the small text uses `canvasNormalLineHeight`, but no screen is claimed to match. The verifier compares them. A live submit against a running Hub and web build was not run; the screens are tested against the contract-shaped wire and the backend spec posts the same body to the real app. No SHARED-CHANGES row: no fenced file was edited (the generated contract files were regenerated).


## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

**Verifier (9 Oct 2026, partial report, in progress).** Verified as it lands: `origin/main` merged into both branches (backend clean, no migration in this branch; mobile conflicts in EventsScreen.tsx, BACKEND_GAPS.md, SHARED-CHANGES.md, PROGRESS.md resolved by keeping both sides), contract regenerated from the backend branch merged with main (`npm run api` reads backend main only, so the branch contract was copied in; builder's `SOURCE_COMMIT` practice kept). G-442 and G-443 are unique across main and every origin wmt/* branch.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` EXIT 0: 105 suites, 1797 tests passed; gates 437 files scanned, 0 fail, 15 warn; check_baseline ok. Backend: `tsc --noEmit` clean, `npx jest --runInBand src/event src/storage` 11 suites, 282 tests passed (own DB `wawu_hub_test_events_04_v`). |
| V9 (backend half) | passed, see findings | Live Hub (branch merged with main) + mock-wawu-id on :4262 (not the real WAWU ID): `POST /events` 400 on non-integer price or quantity, string price, `ticketTypes` string or `[null]` or nested array, nothing saved; one event with Regular N5,000 x 100 and a N0 ticket saved `pending` and listed in the real admin queue; admin reject, then `PATCH /events/{id}` put it back to `pending`. |
| V4, V5, V6, V7, V9 (app half), V10 | in progress / V10 NOT RUN (no phone, R-24) | |

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
