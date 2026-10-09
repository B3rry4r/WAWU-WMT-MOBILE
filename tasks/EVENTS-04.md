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

- E16: My events (opens E17): wired by EVENTS-08 (drawn here, inert until then, R-46)
- E21: Get verified (opens M11): wired by ME-12 (drawn here, inert until then, R-46)
- E1, E13 to E15: the My events tab: wired by EVENTS-08 (drawn here, inert until then, R-46)

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


## Builder fix round

**Builder (9 Oct 2026), fixing the verifier's D1 to D7.** Not verified by this builder.

- **D1 fixed.** The My events tab is drawn in `src/features/events/chrome.tsx` in the canvas order (Discover, My events, Host event) with `onPress={unbuilt('EVENTS-08')}`; E16's My events button (`HostEnds.tsx` `Submitted`, secondary, left of Done as drawn) uses `unbuilt('EVENTS-08')`; E21's Get verified (`HostGate`, primary, md, not full width, under the words as `empty(...)` draws it) uses `unbuilt('ME-12')`. The "Added by later tasks" list above now says wired by, not added by. Tests updated for the new entries.
- **D2 fixed.** Starts now fits: the box gap is 10 as in the kit (was 12), and a half-width picker value (`half`, Starts only) shrinks from 15.5 down to a floor of 12 only when its estimated width would not fit (`fittedValueSize`, tested), plus `adjustsFontSizeToFit` on phones. Ends and Category are unchanged.
- **D3 fixed.** `SentBackScreen` body top is 8 (the kit's `body` default); the bottom stays 14.
- **D4 fixed.** Tab text takes `canvasNormalLineHeight(15)` = 20.
- **D5 shared file, requested.** `src/components/TextField.tsx` is fenced. The same change is already open as PROS-03 #3; SHARED-CHANGES row EVENTS-04 #1 adds this task to it. This task's own label (`FieldLabel`, used by the picker and description fields) now draws 17. E13 name and organiser, E15 tier fields and E22 keep the 2 px drift until the row is applied.
- **D6 filed.** BACKEND_GAPS G-444 (checked unique across main and every origin branch).
- **D7 fixed.** G-443(a) is closed in BACKEND_GAPS (the picker is on main); only (b) is open.
- **U1 default (recorded).** "Remove" on a ticket card stays: without it a host cannot drop a type they added. The designer should draw it or say how a type is removed; until then the card is 20 pt taller than drawn when there are two or more types. Carried as a note, not changed.
- **F1 recorded, not changed.** A NUL character in name, address or a ticket name is a 500 from Postgres on `POST /events` and `PATCH /events/{id}`. It is an existing route's behaviour, a phone keyboard cannot type NUL, and a strip or `@Matches` on those DTO fields changes what the existing route accepts, so it is left for the lead to rule on (additive fix: a 400 for U+0000 in those fields).
- **NOT RUN.** Picture-against-picture re-check of D1 to D5 (the verifier does it), V10 (real phone).

## Builder fix round 2

**Builder (9 Oct 2026), fixing the verifier's D8 only.** Not verified by this builder.

- **D8 fixed.** `HostGate`'s centred area (`styles.center` in `src/features/events/host/HostEnds.tsx`) now has the canvas `body` default: top 8 and bottom 120 (`GATE.bodyTop`, `GATE.bodyBottom`, kept as constants so the hardcoded-signals gate passes). The block is centred between 8 pt under the nav and 120 pt above the bottom, as the canvas `gate` is.
- **Re-measured** at 390 px, 2x, light, Chromium, own stack (scratch DB `wawu_hub_test_events04_r2`, user 2 un-ticked for the measure and ticked again after), against `render_design.py E21`. Raw bands: design icon top 690, button bottom 1017 (block 327 px); built icon top 642, button bottom 967 (block 325 px). Design nav title top 144, built 42, so the design carries the 102 px status bar the web build lacks (PROS-01). With a 0 inset the web build's body area is 102 px taller than the design's, which moves a centred block 51 px up in the design's favour: expected built icon top is 690 - 102 + 51 = 639, measured 642 (3 px, about 1.5 pt). Before the fix the block sat 32 pt too low (754 vs 690 as D8 recorded); the icon to title gap (112 vs 116 px) is the block's own content and unchanged. On a phone the top inset makes the two areas equal in height.
- `npm run check` exit 0 (1874 tests, gates 0 fail).
- **NOT RUN.** Dark scheme re-measure (padding is scheme-free); V10 (no phone).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

**Verifier (9 Oct 2026; did not build any of it).** Verified as it lands: `origin/main` (backend 046444b) merged into both branches. Backend merge was clean and this branch adds no migration (nothing to order against main's newest `20261016200000_points` or any open wmt/* branch). Mobile conflicts (EventsScreen.tsx: kept the builder's `EventsTabs` and main's exported `SeeAll`; BACKEND_GAPS.md, SHARED-CHANGES.md, PROGRESS.md: both sides kept) resolved by hand; no conflict markers remain. `npm run api` copies backend main only and the merge had taken main's contract, so the contract was re-copied from the backend branch merged with main (`SOURCE_COMMIT` names it) and `src/api/schema.generated.ts` regenerated. G-442 and G-443 are unique across main and every origin wmt/* branch. Live app run: backend branch merged with main + the backend repo's `mock-wawu-id` (it answers `/auth/*` without the `{data}` envelope the app reads, so a 20-line scratch shim in front of it adds the envelope; the real WAWU ID was not used) + `npm run web`, real sign-in form, Chromium 390 px at 2x.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` EXIT 0: 105 suites, 1797 tests; gates 437 files scanned, 0 fail, 15 warn (one PROVISIONAL(HOST-PICKER) warn, owner DEV3); `check_baseline` ok; `npm run tasks` ok. Backend: `tsc --noEmit` clean; `contract:build` leaves `contract/openapi.json` unchanged; `jest --runInBand src/event src/storage` 11 suites, 282 tests; gates 16 fail, none in a file this branch touches (`notification-event.ts` is main's); protected suite `run.sh --fresh HEAD`: all 244 required tests passed. Log: `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events04v/check.log`, `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events04v/prot.log`. |
| V4 | passed | The 85% and "Set price to N0" note come from `GET /events/options` `tickets.hostSharePercent` and `minPriceNaira`; the price on E21 from `GET /verification/me` `pricing`; every length, price and quantity bound, the kinds, formats and categories from `options`; dates are built and shown in Lagos time (`lagosInstant`, `watOf`; a 14:00 pick is stored as 13:00Z). No literal money figure in `src/features/events/host`, no em-dash, no "Flutterwave", no colour literal. The E14 hint is a statistic and is left out, see D6. |
| V5 | failed (defects D1 to D5) | Side by side with `render_design.py` at 390 px light and dark: `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events04v/shots/m-<ID>-light.png`, `m-<ID>-dark.png` (design left, built right), bands in `bands.py`. Table below. |
| V6 | passed | Real causes, live: step 1, 2 and 3 each name every missing field and stay put; an in-person event without an address is refused; a N0 price is accepted; the Hub answering 500 shows its sentence on the form with every typed value kept and the button live again; the network cut shows "No connection. Check your internet and try again." with the form kept; a double click on Send sends one `POST /events`; `GET /events/options` answering 500 shows the host form's own error with Try again, which opens the form; a creator without a tick gets E21 before the wizard (and the Hub's 403 `verification_required` is the code the app reads); E22 refuses an empty address and sends the fixed one. System Back and a failed refetch with the form already up are covered by `hostScreens.test.tsx` only (the web build has no hardware Back): NOT RUN live. |
| V7 | passed | Walked cold from sign-in: E1, Host event tab, E13, E14 (day and time sheets, category sheet), E15 with two ticket types, E16 Done; and E1 Host your event banner, E21 for an account without a tick. E22 reached by URL (`/events/sent-back/<id>`) because My events (EVENTS-08) is not built. |
| V9 | passed | Event with Regular N5,000 x 100 and VIP N12,000 x 20 created from the app (rows in `Event` and `EventTicketType`, status `pending`, `startsAt` 13:00Z for a 14:00 Lagos pick), a N0 "Free pass" event likewise; both listed `pending` in `GET /admin/events/queue` (real admin login, seeded superadmin); admin `reject` with "Add the street address, then send it again." put the event in `rejected`, the app showed E22 with it, Send again PATCHed the address and the event went back to `pending`. `POST /events`: price 10.5, "10", "1e3", null, -1, 1e20 and quantity 5.5 all 400; `ticketTypes` as a string, `[null]`, `[[1]]`, an object: 400; 1000 types: 400; nothing saved by any of them. Odd inputs: 5 MB name or description 413; wrong types, a lone surrogate (stored as U+FFFD), emoji and a bidi mark: no 5xx. Exception: a NUL character in name, address or a ticket name is a 500 (F1). |
| V10 | NOT RUN | Real Android phone only (R-24); no device. Not run either: a banner upload (object storage is not configured in the local Hub, the web file chooser was not driven). |
| Mutants | 6 of 6 killed | In `hostForm.ts` and `HostScreen.tsx`: a N0 price refused (4 tests fail), end equal to start allowed (1), start equal to now allowed (2), name limit off by one (3), the in-flight guard removed (1), address required for hybrid instead of in person and hybrid (1). Tree restored. |

**V5 per artboard** (light and dark both checked; dark differs from light only by tokens, nothing dark-specific broke).

| Artboard and state | Result |
|---|---|
| E1 tabs and Host your event banner | Banner matches (142 px tall at 2x, same copy, Start button). Tabs: no "My events" (D1); tab text line 21.75 where the canvas is 20 (D4). |
| E13 Basics | Matches except the tab strip (D1, D4) and the shared field label line (D5). Adds a Kind picker under Format: differs-for-recorded-reason, G-442. |
| E14 When and where | Starts value truncated to "Sun 8 Nov, 14..." in its half-width field where the canvas shows the whole value (D2); hint under the address missing (D6); banner tile now drawn (`canPickImage` is true on main), 110 tall as drawn; Ends is a time on the start's day: differs-for-recorded-reason, G-443(b). |
| E15 Tickets | Matches except a "Remove" link inside each card when there are two or more, which the artboard does not draw and which makes each card 20 pt taller (U1). Note wraps one word later than the canvas. |
| E16 Sent for review | Words, icon and Done match; the secondary "My events" button is missing (D1). |
| E21 Needs a tick | Words and price match (price from the system); "Get verified" button missing (D1), so the block also sits 55 pt lower than drawn. |
| E22 Sent back | Banner, field flag ("Needed before it can go live", red ring) and Send again match in kind; content starts 7 pt lower than drawn (D3); label to field gap 2 pt more (D5). |

**Findings**

- **D1 defect (R-46, DECISIONS.md "The UI is always complete").** Entries drawn on these artboards are left out, and R-46 says an entry left out is a defect: the **My events** tab on E1 and on E13 to E15 (`src/features/events/chrome.tsx` comment: "is added by the task that builds where it leads"), the **My events** button on E16 (`HostEnds.tsx` `Submitted`), the **Get verified** button on E21 (`HostGate`). Each is to be drawn as designed with `onPress={unbuilt('EVENTS-08')}` (tab, E16 button) and `unbuilt('ME-12')` (E21); both tasks are `todo`, so the gate accepts it. The task file's "Added by later tasks" list predates R-46.
- **D2 defect (E14).** The Starts field shows "Sun 8 Nov, 14..." at 390 px; the canvas fits "Sat 8 Nov, 14:00" with its calendar icon. A person cannot read the time they picked. `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events04v/shots/m-E14-light.png`.
- **D3 defect (E22).** `SentBackScreen` `bodyMetrics.top` is 14; the canvas `sentBack` is `body(..., { gap: 14 })`, whose default top is 8 (`design/_gen/kit.js` line 35). Everything is about 7 pt lower than drawn (14 px at 2x).
- **D4 defect (E1, E13 to E15).** Tab text in `chrome.tsx` takes the body variant's 21.75 line height; the canvas sets none, so it is `canvasNormalLineHeight(15)` = 20. The tab row is 1.75 pt too tall and moves every row below it. Measured with the DOM (tab 34.75 pt) and by bands (text top to underline 57 px against 53).
- **D5 defect, shared component (not this task's file).** `TextField`'s label line is 18.9 (1.45 x 13) where the canvas label is on `normal` (17): about 2 pt more between label and box on every form here (E13 to E15, E22). Belongs in SHARED-CHANGES for `src/components/TextField.tsx`; recorded here because every field of this task shows it.
- **D6 defect (small).** The E14 hint "Missing addresses are the top reason events get sent back." is a statistic (the task's own "not facts" list), so leaving it out is right under rule 7, but nothing is filed: no gap row names it. File it in BACKEND_GAPS.md (or draw it once the owner confirms the claim).
- **D7 defect (docs, small).** G-443(a) says the banner tile is hidden until row 8; `expo-image-picker` is on main and `canPickImage` is true, so the tile is drawn. Edit the row to say only (b) is open.
- **F1 unclear (backend, existing route).** A NUL character in `name`, `address`, a ticket type's `name` (and `PATCH /events/{id}` `address`) is a 500 from Postgres. The DTO fields are as on main apart from the constants this task extracted, and a phone keyboard cannot type NUL, so it is not a regression; the instruction for this pass was no 5xx, so it is listed for the lead (a `@Matches` or a strip on those fields).
- **U1 unclear (E15).** "Remove" on a ticket card is not drawn. Without it a host cannot drop a type they added, so it is needed; the designer should draw it or say how a type is removed.
- **Server vs app, noted:** the Hub accepts a start in the past and an event with no ticket types; the app refuses a past start itself and always sends at least one type. Not a defect here.
- **differs-for-recorded-reason:** Kind picker on E13 (G-442, builder default recorded); Ends on the start's day (G-443(b)); the VIP ticket is stored with tier `regular` (the Hub's default; the wizard never asks for a tier).

**Verifier round 2 (9 Oct 2026; did not build any of it).** Narrow re-verify of the fix round (`cd0cfb6`). `origin/main` (14 commits behind) merged into the mobile branch; the only conflict was `docs/PROGRESS.md` (generated, theirs taken). The backend branch is not behind main and the fix round touched no backend file. G-444 is unique: one row on this branch, none in `origin/main` or any other `origin/wmt/*` BACKEND_GAPS.md. Live stack on my own database (`wawu_hub_test_events04_r2`, backend branch `da42f75` built, mock-wawu-id on 4260 behind the `{data}` shim on 4262, Hub 4261, `npm run web` on 4263: one port over the 4260 to 4262 range, 4263 was free), real sign-in form, Chromium 390 px at 2x. Images: `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events04v/shots/m-<ID>-<scheme>.png` (design left, built right), bands from `bands.py` with the design's 100 px status bar removed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | After the merge `npm run check` EXIT 0: 110 suites, 1874 tests; gates 449 files scanned, 0 fail, 17 warn (unbuilt_entries 16, provisional 1); `check_baseline` ok; `npm run tasks` ok. The first run failed typecheck on `/legal` only because `.expo/types/router.d.ts` (generated, untracked) was stale; starting `expo start --web` regenerated it. Log: `.../scratchpad/check2.log`. |
| V5 (D1 to D5, D7) | failed (defect D8) | Table below. |

| Artboard and state | Result |
|---|---|
| E1, E13 to E15 tab strip | "My events" tab drawn between Discover and Host event as the canvas has it (D1 fixed). Tab text line 20: tab row top, text and underline bands equal the canvas on E13 (text 121 to 147, underline 174 to 177, both frames) (D4 fixed). |
| E14 Starts | "Wed 28 Oct, 20:00" and "Mon 30 Nov, 22:30" (light and dark) show the whole value, no ellipsis (`scrollWidth` = `clientWidth` = 109, font at the 12 floor). On the artboard's own sample the value now draws at about 12 to 13 px against the canvas's 15.5, and the two halves are equal width where the canvas Starts half is 8 pt wider; see note N1. D2 fixed. |
| E16 | "My events" secondary button left of Done, Done as drawn (D1 fixed); title, line, note and icon bands equal the canvas. |
| E21 | "Get verified" drawn, primary, md, under the words (D1 fixed), light and dark. Position: see D8. |
| E22 | Banner, label and the flagged field start where the canvas has them (banner top 128 and label 300 in both frames; D3 fixed). The label to field gap is still 2 pt more (D5, the shared `TextField`, row EVENTS-04 #1 open). |
| Dark | Same as light apart from tokens; nothing dark-specific broke on E1, E16, E21, E22. |

- **D1, D2, D3, D4, D6, D7 closed.** D5 stays a recorded lead item: `SHARED-CHANGES.md` row EVENTS-04 #1 asks for the shared edit; the 2 pt drift remains on E13 name and organiser, E15 tier fields and E22 until it is applied.
- **D8 defect (E21, position).** The canvas `gate` is `phone(nav + body(<div style="flex:1;display:grid;place-items:center">...))`, and `body` defaults to 8 pt above and 120 pt below. The block is therefore centred in the space from 8 pt under the nav to 120 pt above the bottom. `HostGate` centres in the whole space under the nav (`styles.center` has no bottom padding). The icon top measures 754 px against 690 px in the same frame (32 pt lower on the web build, where the status bar inset is 0); with a phone's top inset the centre moves further and the gap is about 55 pt, the figure D1 gave and the button did not change. Fix: give the centred area the canvas's top 8 and bottom 120 (a `paddingTop`/`paddingBottom` on `styles.center`), then re-measure.
- **N1 note (E14 Starts size).** The value fits and reads, which is what D2 asked. The canvas draws it at full size in its own font; ours is wider, so it shrinks to the 12 floor on long values. If the lead wants the drawn size, the halves would have to be content-sized as in the canvas (Starts 173, Ends 164 at 390 px) rather than equal. Not counted as a defect.
- **F1 and U1** stay recorded lead items (not defects, per the lead's instruction).
- **NOT RUN:** V10 (no phone); system Back on the web build.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
