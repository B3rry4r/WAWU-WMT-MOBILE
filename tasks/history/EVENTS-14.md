# EVENTS-14 · round history

Moved out of [tasks/EVENTS-14.md](../EVENTS-14.md) word for word, oldest first. The current state is in that file.

## Builder report

Files changed. Backend: `src/event-ticketing/event-ticketing.service.ts` (`SOLD_TIER_RULE`, the 409's second sentence), three specs' pinned sentence. Mobile: `host/HostScreen.tsx` (exports `Basics`, `WhenWhere`, `Tickets` with `locked`, `StepSheets`, `Sheet`, `StepProps`), `host/hostForm.ts` (`draftFromEvent`, `patchBody`, `tiersBody`, `ticketDraftOf`, `ticketsChanged`, `eventChanged`, `whenWhereErrors` with an optional original), `host/hostParts.tsx` (`Stepper` step names), `host/hostApi.ts`, `organiser/organiserApi.ts` (`TierInput` sales window), new `host/EditEventScreen.tsx`, `host/TicketTypesScreen.tsx`, `host/ReviewSheet.tsx`, routes `src/app/events/edit/[id].tsx` and `ticket-types/[id].tsx`, `dashboard/[id].tsx` (the two callbacks), `src/app/_layout.tsx` (two lines), tests `host/__tests__/editEvent.test.tsx` (15), `editForm.test.ts` (7), `events/__tests__/dashboardRoute.test.tsx` (1).
Capability checks. (1) Live event edited from E18, told, saved, `pending` and off the calendar, live again after approval: walk checks 3 to 7, tests "a host can edit a live event". (2) No ticket sold, a type's price and places saved by the Hub: walk check 8, test "a host with no ticket sold can change a type's price and places". (3) One ticket sold: locked with one line, and a `PUT` that reaches the Hub is a 409 shown as its message: walk checks 10 to 13, tests "a host with a ticket sold sees every type's price and places locked" and "a host whose save meets a sale made after the screen was read". (4) Both routes behave as before: backend event specs 8 suites 147 tests, protected suite 253 of 253, no assertion changed except the three that pinned the old 409 sentence (the task rules that sentence). (5) Pictures light and dark beside the boards: taken, the lead's verifier compares (V5). (6) E22 tests untouched and passing (`hostScreens.test.tsx`). (7) No em-dash in any string; no provider name. (8) V9: the walk above.
Counts. Backend: tsc EXIT 0, eslint (no fix) on 4 files EXIT 0, event specs in band 147 of 147 (8 suites; a first run before `db:seed` failed 94, a seeding miss), test:protected 253 of 253 EXIT 0 (a first run against the stack's own mock had 8 failures in verification and professionals routes, all 502 from that mock; none touch events), contract:build EXIT 0 and `contract/` unchanged, gates 0 fail 133 warn 88 accepted, baseline EXIT 0. App: tsc EXIT 0, eslint (no fix) on the changed files EXIT 0, jest `src/features/events` 26 suites 402 tests, route-graph, route-guard and appLinkRoutes 305 tests, gates 0 fail 18 warn (one fail of mine, a comment worded as a deferral, was reworded and the gate rerun), check_tasks EXIT 0. The full mobile suite is the merge agent's.
Not done. Nothing in scope. Not in scope and not built: adding a tier after the first sale, editing a called-off event (E18 hides the rows for it).


## Verifier report

Verifier, 24 Oct 2026 (a Sonnet session that wrote none of this task's code and changed no product code, test, gate or baseline). Checked backend `wmt/EVENTS-14` `84181d7` against `origin/main` `b2f4df6`, and this repo's `wmt/EVENTS-14` `b3b19e46` against `origin/main` `c47c9c84`. Tier T1.

**Verdict: FIX.** The two rules and the 409 sentence are right and every capability check passes. One medium defect: Edit event assumes a one-day event, so editing an event whose end is not on its start day (the web's form and the Hub allow that) rewrites its end or cannot save. Status goes back to `building`.

### Passes

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: tsc EXIT 0, eslint (no fix) on the 4 changed files EXIT 0, event specs in band 8 suites 147 of 147 EXIT 0 (none imports the Fintava double), contract:build EXIT 0 with `git status` clean, gates 0 fail 133 warn 88 accepted (1747 files) EXIT 0, check_baseline EXIT 0. App (own `npm ci` from the branch lockfile): tsc EXIT 0, eslint (no fix) on the 15 changed files EXIT 0, FULL jest `--ci --maxWorkers=2` 320 suites 5436 tests EXIT 0, gates 0 fail 18 warn (1223 files) plus the 56 gate unit tests EXIT 0, check_tasks EXIT 0. Logs in `events-14-v/logs/`. |
| V2 Contract | passed | `contract:build` leaves `contract/openapi.json` as committed; no route, field or DTO changed (backend diff is one constant and one template string). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh` (lock from `origin/main`): main 244 of 244 and branch 244 of 244, EXIT 0 both (`prot-main-own.log`, `prot-branch-own.log`). |
| V4 Field trace | passed | A sale's `EventTicketType.sold` (written by the order) is read by `GET /events/{id}/tickets` and by `/dashboard` `ticketsSold`; the app locks on either. Walked live: one free-tier sale, E18 Sold 1, Ticket types locked, on a live and on a pending event. A sale on a retired type is covered by the builder's unit test only (not run live). |
| V5 Picture | passed | E18 against the board, light and dark: same rows, order, icons, subtitles (`pics/cmp-E18-*.png`). E13, E14, E15 in edit mode against their boards: same field bodies; the differences are Edit event's own title and two-bar stepper, "Save changes" and "Save ticket types" for the wizard's buttons, and the locked and review sheets that no board draws (G-EVENTS-14-1, a recorded gap). |
| V6 States | passed | Through real causes: a network cut on the PATCH (plain line, text kept, retry saves), a 500 on the ticket types read (error state with Try again), a sale between read and save (the Hub's own sentence, then locked). |
| V7 Flow walk | passed | Host from E18: Edit event, sheet, Keep editing sends nothing, confirm, "Sent for review", E17 In review, approve, live with the change; Ticket types before a sale; after a sale. Light and dark, from a cold deep link. Then the one defect below. |
| V9 Live seam | passed | Local Hub on the stand-in, sign-in through the app's own form (no injected token), 66 of 66 checks in `logs/walk.log`; extra probes in `logs/probes.txt`. |

### Capability checks, as written

1. Live event edited from E18: CONFIRMED. Told, saved, `pending`, `lastDecisionReason` null, off `GET /events` for a buyer; approved again it is live with the new name, description and address. Only the changed fields moved (`startsAt`, `endsAt`, `hostOrg` and the tiers were as they were).
2. No ticket sold, a type's price and places saved: CONFIRMED (Regular 5000/100 to 6500/80 on the Hub). The type left as it was (Open door, with a sales window) kept its row id and window.
3. One ticket sold: CONFIRMED. Price, places and name are read-only, one line of why, no Save, Add or Remove; a direct `PUT` answers 409 `Tickets have already sold for "Open door". The price and places of a ticket type cannot change once a ticket is sold.` (no em-dash), nothing written, event still live. A `PUT` sent unchanged is refused the same way.
4. What R-79 (c) still allows after a sale: the host can edit the event itself. R-79 (c) rules only that the edit goes back to review and that ticket price and places cannot change once a ticket is sold; so name, description, address, times and the rest save. Proved live on a sold event, light and dark: Edit event saved, event `pending`, and the buyer still holds the ticket.
5. `PATCH` and `PUT` as before: the 3 changed assertions are the only ones that moved (see V3 note below).
6. E22 untouched: `SentBackScreen.tsx`, `HostEnds.tsx` and `hostScreens.test.tsx` are not in the diff, and that test passes in the full jest.
7. No em-dash in any response string or screen; no provider or brand name: none found on the screens walked or in the new strings.
8. Live V9: CONFIRMED (see V9).

### The brief's other questions

- **Protected routes.** `PUT /events/:id/tickets` and `PATCH /events/:id` are both in `.pipeline/protected-registry.json` (web callers `src/lib/api/event-tickets.ts:76`, `src/lib/api/events.ts:194`; no dashboard caller). The registry locks only their success answers (200 shape); no 409 and no message is locked, and nothing in the web, wawuafrica or wawu-dashboard source compares the sentence. The web's `TicketTypeEditor` shows the Hub's message as it arrives, so web users now read the new sentence, which is what R-79 (c) and G-833 ask. Judged: intended, not a hidden defect.
- **The 8 failures.** The stack's stand-in WAWU ID is the cause, not a real failure: with the stack's mock the suite gives 236 of 244 with the same 8 verification and professionals 502s on `origin/main` and on the branch (identical test names, `prot-*-standin.log`); with the suite's own mock both give 244 of 244.
- **The three spec assertions.** Each changed line swaps only the second sentence for R-79 (c)'s ruled words; no other assertion moved. Copied onto a main worktree they fail (3 tests, Expected the new sentence, Received "Add a new tier instead of editing one people have bought."). Ruled text, no hidden defect.
- **SHARED-CHANGES EVENTS-14 #1.** Needed: with the two route files and without the two `Stack.Screen` lines, `route-guard.test` fails naming exactly `events/edit/[id]` and `events/ticket-types/[id]`. The `_layout.tsx` diff is those two lines and nothing else.
- **New tests fail on main, pass built.** Backend: the 3 specs fail on main code, 147 of 147 pass built. App: `editEvent.test.tsx`, `editForm.test.ts` and `dashboardRoute.test.tsx` copied onto main: 3 suites fail (two cannot load the missing screens, one fails its assertion); they pass on the branch (inside the 5436).
- **OTA.** `package.json`, the lockfile and every native or app config file are unchanged (`git diff --name-only`), and the new files import only packages already installed. It ships as an over-the-air update.
- **"Edit event = first two steps, Ticket types = the third alone".** Sound and consistent with the two rows and with the two Hub routes (`PATCH` and `PUT`). The task's scope text lists all three steps for Edit event; the split follows its own capability checks and nothing there needs tiers inside Edit event. Not a finding.

### Findings

**Medium**

- **M1 (defect). Edit event assumes a one-day event; an event whose end is not on its start day breaks.** `src/features/events/host/hostForm.ts:251` (`patchBody`: `endsAt = lagosInstant(d.day, d.endTime)`, the start day) and `:147` (`whenWhereErrors`: ends must be a later clock time than the start). The web form lets a host pick any end or none, and the Hub accepts both, so such events exist; the app's wizard cannot make them, but Edit event opens them. Three results on the local Hub: (a) a 3-day event (start 3 Nov 09:00, end 5 Nov 16:00) edited by moving only the start time to 10:00 now ends 3 Nov 16:00, the end date lost with no warning, and the same for a sold event; (b) a 3-day event ending 07:00 on day 3 (clock earlier than its 09:00 start) cannot be saved at all, even a name-only edit: "It has to end after it starts."; (c) an event with no end cannot be renamed until the host invents an end ("Pick when it ends."). Repro: `POST /events` with `endsAt` two days after `startsAt` (or none), approve, E18, Edit event, Continue, move Starts (or just Save), `logs/probes.txt`, `pics/multi-B-name-only.png`. Direction: send `startsAt`/`endsAt` only for a field the host moved, keep the original end instant when the host did not change the end, compare ends on instants not clock times, and do not ask for an end the event never had.

**Low** (to the EVENTS sweep)

- **L1.** Locked Ticket types also disables the name, while the line says only "price and places"; and the disabled values are very dim in dark (`pics/main-E15-locked-dark.png`). The Hub refuses any `PUT` after a sale, so the lock is right; the line and the contrast are not.
- **L2.** The 409 sentence names price and places, while the route refuses any `PUT` after a sale (a rename or an added type too). It is the ruled text; noted only so the sweep does not read it as the whole rule.
- **L3.** The wizard's E14 board draws a hint under Street address ("Missing addresses are the top reason events get sent back.") that the built step does not; this predates EVENTS-14 and Edit event inherits it.

NOT RUN: surviving-mutant runs (none attempted); the E16 and E17 boards were not re-rendered (Edit event's end is the wizard's own `Submitted` component, unchanged).

Pictures: `events-14-v/pics/` (boards in `pics/boards/`, side by side in `pics/cmp-E18-*`, `cmp-E13-*`, `cmp-E14-*`, `cmp-E15-*`, `cmp-ends.png`, every screen light and dark as `main-*` and `sold-*`).

## Builder report, round 2

Builder, 24 Oct 2026 (a Sonnet session that did not write round 1). Fixed M1 and the lead's two lows; no verifier finding was edited away. Backend `96530d2`, mobile `0809c949`.

Files. Backend: `src/event-ticketing/event-ticketing.service.ts` (`SOLD_TIER_RULE` now "Ticket types cannot change once a ticket is sold."), the same three specs. Mobile: `host/hostForm.ts` (`endDaysAfter` on the draft, `endOf`, `endShown`, `whenWhereErrors` and `patchBody` read the end as an instant on its own day), `host/HostScreen.tsx` (Ends shows the end day; locked Tickets use `LockedField`), `host/hostParts.tsx` (`LockedField`), `host/TicketTypesScreen.tsx` (`SOLD_LINE`), tests `editForm.test.ts` (10 new) and `editEvent.test.tsx` (7 new).

Choices. M1: when the start moves the end keeps its clock time and its day gap from the start (the form's existing rule, a clock time on the start day, is gap 0), so a 3-day event moved to another day stays 3 days and a start-time change leaves the end where it was. The one assertion that pinned the defect, "a host who moves the end sends both the start and the end" in `editForm.test.ts`, now says the end alone is sent (sweep rule: a finding that names a defect is the ruling). Unchanged on purpose: the wizard's create path (`createBody`, a new event must pick an end).

Route note. `PUT /events/{id}/tickets` is stricter than R-79 (c): it refuses any change once a ticket is sold (a rename, an added or a removed type too), and the web calls it, so it stays. The 409's message says so now.

Checks. Backend: tsc EXIT 0, eslint (no fix) on the 4 changed files EXIT 0, event specs in band 11 suites 194 of 194 EXIT 0 (none imports the Fintava double; run on a spec database with the suite's own mock WAWU ID, the stack's mock gave 5 door-staff and held-ticket failures from its own seeded names, none touch this change), test:protected 253 of 253 EXIT 0 after `db:seed`, contract:build EXIT 0 with no diff, gates 0 fail 133 warn 88 accepted EXIT 0, check_baseline EXIT 0. App (own `npm ci` from the lockfile): tsc EXIT 0, eslint (no fix) on the 6 changed files EXIT 0, jest `src/features/events` plus `appLinkRoutes`, `route-graph` and `route-guard` 29 suites 724 tests EXIT 0, gates 0 fail 18 warn (1223 files) plus the 56 gate unit tests EXIT 0, check_tasks `--write` EXIT 0. Live: walk and contrast logs and pictures in the builder's `events-14-r2/` scratch folder.

Not run. A sold event's Edit event was not walked live again (round 1 walked it; this round did not touch that path). The full mobile suite is the merge agent's.

## Verifier report, round 2

Verifier, 24 Oct 2026 (a Sonnet session that built none of EVENTS-14). Under check: mobile `562e9332..0c18a982`, backend `84181d7..96530d2`. Local stack `ev14v2` (Hub 7900, app web export 7903, 390 x 844, Playwright, real sign-in through the app's form, host the seeded creator with a live tick). Logs and pictures in `events-14-v2/` (`logs/walk.log`, `pics/`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: tsc EXIT 0; eslint (no fix) on the 4 changed files EXIT 0; 14 event suites in band, 217 of 217, EXIT 0 (none greps as Fintava); `test:protected` after `db:seed` 253 of 253 EXIT 0; gates 0 fail 133 warn 88 accepted (1747 files) EXIT 0; check_baseline EXIT 0. App (own `npm ci`): tsc EXIT 0; eslint (no fix) on the 6 changed files EXIT 0; gates (with the 56 gate tests) EXIT 0; check_tasks EXIT 0 (415 tasks); FULL jest `--ci --maxWorkers=2`: first run 319 of 320 suites, 5452 of 5453 tests, EXIT 1 (one suite outside this branch's diff, `referral/__tests__/RulesScreen.test.tsx`, timed out on a loading-state assertion while my browser walks loaded the machine; 3 of 3 alone EXIT 0); second run on a quiet machine 320 of 320, 5453 of 5453, EXIT 0 (`logs/app-jest2.log`). |
| V3 Regression | passed | `test:protected` 253 of 253; the backend diff is one string constant and three spec lines; no route, DTO or contract change. |
| V7 Flow walk | passed | 17 live walks from a cold deep link to E18 in each of dark (run twice, the second with the `PATCH` bodies captured) and light (`logs/walk.log`): see M1 below. |
| V6 States | passed | The one-day event with its start moved past its end clock time: "It has to end after it starts." under Ends, nothing sent, event still published (`pics/late-Cone-err-dark.png`). |
| V5 Picture | passed with one low | Locked Ticket types, both themes (`pics/locked-ticket-types-*.png`); Ends field with an end day (`pics/day-A3day-dark.png`): see L-A. |

### M1 (the medium fix), live

Events made through `POST /events` and approved by an admin: a 3-day (Tue 3 Nov 09:00 to Thu 5 Nov 16:00), a no-end, a one-day (09:00 to 16:00) and a 3-day ending 07:00 on day 3 (end clock earlier than the start). Each edit opened from E18 (Edit event), saved through the review sheet, and the Hub read back. Request bodies were taken from the page's own `PATCH` (fetch wrapper), Hub values from `GET /events/{id}`.

| Edit from E18 | Sent | Hub after |
|---|---|---|
| rename only, all four events | `{"name": ...}` and nothing else | `pending`; start and end exactly as before (the no-end event still has none; the 07:00 event saved, round 1 refused it) |
| start day Tue 3 to Fri 6 Nov, 3-day | start and end | Fri 6 Nov 09:00 to Sun 8 Nov 16:00 (still 3 days) |
| start day moved, 07:00 event | start and end | Fri 6 to Sun 8 Nov 07:00 |
| start day moved, no-end event | start only | start moved, still no end |
| start day moved, one-day | start and end | Fri 6 Nov 09:00 to 16:00 (as round 1) |
| start time 09:00 to 10:00, 3-day, no-end, one-day, 07:00 event | start only | start 10:00, every end untouched (3-day still ends Thu 5 Nov 16:00) |
| end moved (3-day to 18:00, 07:00 event to 08:00) | end only | start untouched, end on its own day |
| no-end event given an end 12:00 | end only | ends 12:00 on the start day |
| one-day, start moved to 17:00 (end 16:00) | nothing | refused in the app as in round 1, event stays published |
| sold event (1 free ticket), rename | name only | `pending`, start and end as before (dark and light) |

The one-day event behaves as in round 1 (same Hub values; the only difference is the unmoved field is no longer sent). Every `PATCH` left the event `pending`.

### The changed assertion

"a host who moves the end sends both the start and the end" became "sends the end alone". It pinned the mechanism of M1, not a rule a user relies on: `patchBody` sent a start and an end whenever either moved and put the end on the start's day, which is what rewrote a multi-day end. The new expectation is the right value for that fixture (end 04:00 Lagos is `03:00Z`), the case it used to cover (start day moved on a one-day event sends both) has its own new test, and the live walk shows the Hub accepts an end sent alone and checks it against the stored start. It does not hide a defect. On round 1's source with the round 2 tests copied in: 16 failed of 41, EXIT 1 (`logs/r1-source-r2tests.log`); on the built branch all pass inside the full jest. Three of the new tests pass on both (a one-day start-day move, a plain three-day rename at form level, "still told when an end falls on or before its start"): they are guards for what must not change, as intended.

### The 409 sentence

Live `PUT /events/{id}/tickets` on the sold event answers 409 `Tickets have already sold for "Open door". Ticket types cannot change once a ticket is sold.` (no em-dash). The service diff is the constant and its comment; the three specs take the same string; the app's line (`SOLD_LINE`, "A ticket has sold, so ticket types cannot change.") and its test constant say the same. No em-dash in any added line of either repo.

### LockedField contrast

Measured in the browser on the sold event's Ticket types: dark 6.73 to 1 (text `rgb(169,165,180)` on `rgb(34,31,41)`), light 5.99 to 1 (`rgb(90,87,102)` on `rgb(238,236,242)`); name, price and places all read-only, same size as the field they replace. Matches the builder's figures. Both pictures are legible. I did not open the builder's scratch folder (the brief names no file in it), so there is no side-by-side with its pictures; the figures agree.

### Findings

**Low** (to the EVENTS sweep)

- **L-A (defect, cosmetic).** `src/features/events/host/HostScreen.tsx:~401` (the Ends `PickerField`, not `half`) with `hostForm.ts` `endShown`: a multi-day end is clipped at 390 px, "Sun 8 Nov, 16..." (and "Thu 5 Nov, 16..." before a move), so the end's minutes can only be read by opening the sheet. The Starts field next to it, in the half-width style, shows "Fri 6 Nov, 09:00" in full. Data is right; the saved end is correct. Repro: open Edit event on a 3-day event, Continue (`pics/day-A3day-dark.png`). Test that would kill it: none today (a layout assertion on the Ends value at 390 px).
- L3 from round 1 still open (E14 address hint), and G-EVENTS-14-1, as recorded.

NOT RUN: surviving-mutant runs; the E16 and E17 boards (unchanged by round 2). Sold-event Ticket types in the app was seen locked; the "sale between read and save" state was covered in round 1 and is untouched.

**Verdict: PASS.** M1 is fixed on every event shape tried; nothing medium or worse is open. L-A goes to the EVENTS sweep.
