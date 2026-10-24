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
