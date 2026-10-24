---
id: EVENTS-14
title: Edit a sent event from E18 (back to review; sold tiers keep their price and places)
owner: YOU
area: EVENTS
order: -116
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: flow
status: review
depends_on: []
decisions: [R-79, R-47, R-27, R-29, R-5]
passes: [V1, V2, V3, V4, V5, V6, V7, V9]
artboards: []
---
# EVENTS-14 · Edit a sent event from E18 (back to review; sold tiers keep their price and places)

## Current state

As of 24 Oct 2026. Status: review (round 2 verified PASS by a fourth Sonnet session; nothing medium or worse open). Tier T1. Round 1 built by a Sonnet builder, verified by a different Sonnet session; round 2 built by a third (report in [history/EVENTS-14.md](history/EVENTS-14.md), last section).
- **Branches:** backend `wmt/EVENTS-14` `96530d2` (on backend main `b2f4df6`), mobile `wmt/EVENTS-14` `0809c949` plus the records commits on top (the last is the round 2 verifier's). No PR. No migration, no contract change (`contract:build` leaves `contract/` as committed).
- **What is built:** the Hub keeps both rules; only the sold 409's second sentence changed. E18 passes `onEdit` and `onTickets`; Edit event is the wizard's Basics and When and where in edit mode (`host/EditEventScreen.tsx`, only changed fields go to `PATCH`), Ticket types is the Tickets step on its own (`host/TicketTypesScreen.tsx`, read-only once any ticket has sold), one `ReviewSheet` before either save. SHARED-CHANGES EVENTS-14 #1 (two `Stack.Screen` lines) is needed. No native module: ships over the air.
- **r2 M1 (medium) fixed, `hostForm.ts`:** Edit event no longer assumes a one-day event. The end keeps its clock time and how many days after the start it falls (a one-day event is gap 0, so it behaves as before): moving the start day moves the end with it (a 3-day event stays 3 days), moving the start time alone leaves the end where it was, a rename sends neither. Ends are compared as instants on their own day, so a 3-day event ending at 07:00 on day 3 saves; an event the Hub holds with no end is not asked for one and is never given one (a new event still must pick an end). `PATCH` carries `startsAt` and `endsAt` only for what moved. The Ends field shows the end day when it is not the start day ("Fri 5 Nov, 16:00"); a one-day event shows the clock time E14 draws. The Hub's rules are unchanged (it refuses only an end before the start).
- **r2 L2 (lead ruling) fixed:** `PUT /events/{id}/tickets` is stricter than R-79 (c) (it refuses any change once a ticket is sold, the web calls it, it stays as it is). The 409 now reads `Tickets have already sold for "<name>". Ticket types cannot change once a ticket is sold.` The three specs that pinned the old second sentence take it, the app's mock of it and its own line ("A ticket has sold, so ticket types cannot change.") say the same.
- **r2 L1 fixed:** the locked Ticket types step used the theme's disabled text colour (`textDisabled`, 1.8 to 1 on the sunken surface in both themes). It now reads in `textSecondary` on `surfaceSunken` (`LockedField` in `host/hostParts.tsx`): measured in the browser 6.73 to 1 dark and 5.99 to 1 light. Cause for the lead: the generated `textDisabled` token itself is under 4.5 to 1 in both themes, so any other disabled field shares it (a design-token question, not changed here, `src/theme/**` and `src/components/**` are fenced).
- **Proof:** new tests fail before and pass after (16 failed on the round-1 source, all pass built); live on the local stack (web export 390 x 844, real sign-in): a 3-day and a no-end event created through `POST /events`, approved, edited from E18, renamed only, then the start moved (`logs/walk.log`), and the locked step in both themes (`logs/locked.log`, `pics/`).
- **Round 2 verified (PASS):** live at 390 px with real sign-in, a 3-day, a no-end, a one-day and a 3-day event ending at an earlier clock time were each edited from E18: a rename sends the name alone and leaves start and end as they were; a start day move carries the end with it (a no-end event is not given one); a start time move leaves the end where it was; the sold event's Edit event saves (pending, times untouched), light and dark. The changed assertion pinned the defect's mechanism, not a rule. The 409 reads as ruled (live, no em-dash) and the app line agrees. The locked step reads 6.73 to 1 dark and 5.99 to 1 light. Backend tsc, eslint, 14 event suites (217), protected 253 of 253, gates; app tsc, eslint, gates, check_tasks, full jest 320 of 320 (5453): all EXIT 0.
- **Open (lows, to the EVENTS sweep):** L-A the Ends field clips a multi-day end at 390 px ("Sun 8 Nov, 16...", `HostScreen.tsx` Ends field; Starts uses the half-width style and fits). L3 the E14 board's address hint is not built (older than this task). G-EVENTS-14-1 (no board draws the review sheet, the locked types or the two-step edit).
- **Next:** merge (lead). Nothing left for a builder in this task.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend` and `wawu-wmt-mobile`. Start the session with both repos attached; follow the backend's CLAUDE.md for its commands (its additive-only and protected-route rules apply: `PATCH /events/{id}` and `PUT /events/{id}/tickets` keep their behaviour).
- `DECISIONS.md`: R-79 (c), R-47, R-27, R-29, R-5 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version)
- Render E13, E14, E15, E18 and E22 with `python3 scripts/design/render_design.py <IDs>` and LOOK at each, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `tasks/EVENTS-04.md` (the wizard: `src/features/events/host/HostScreen.tsx` with its steps `Basics`, `WhenWhere` and `Tickets`, `hostForm.ts`, `hostApi.ts`, `HostEnds.tsx`, `SentBackScreen.tsx`) and `tasks/EVENTS-08.md` (E18: `src/features/events/organiser/DashboardScreen.tsx`, its `onEdit` and `onTickets` props, and the route `src/app/events/dashboard/[id].tsx`)
- Backend `src/event/event.controller.ts` (`@Patch(':id')`), `src/event/event.service.ts` (`update`), `src/event-ticketing/event-ticketing.controller.ts` (`@Put(':id/tickets')`), `src/event-ticketing/event-ticketing.service.ts` (`setTicketTypes`, the sold 409) and their contract specs
- `BACKEND_GAPS.md` G-833 (closed as ruled), G-EVENTS-08-1, G-EVENTS-08-2, G-EVENTS-14-1

## Goal

A host opens a sent event from My events (E17) and its dashboard (E18), changes it, and sends it back for review; before any ticket sells the host can change the ticket types, and after the first sale the price and the places of a tier stay as they are. Nothing the Hub does changes: the app shows what the Hub already rules.

## Scope

- **The Hub keeps both rules.** `PATCH /events/{id}`: every edit sets `pending` and clears `lastDecisionReason`, so a live event leaves the calendar until a person approves it again (as built, R-79 (c)). `PUT /events/{id}/tickets`: 409 once any tier has sold (as built). Only the 409's message changes, so it says the rule the owner ruled: the price and places of a ticket type cannot change once a ticket is sold (today's message says a tier may be added, which the route does not allow; G-833). Additive only: no route renamed, no field retyped, the EVENTS specs and the protected suite pass with no assertion changed (V3).
- **The app can tell whether a ticket has sold** from what E18 already reads (its sold figures). If it cannot for some event state, the Hub adds one additive, nullable field to the event's own view (`ticketsSold` or like), with its contract regenerated; no second route.
- **"Edit event" on E18** (`onEdit` wired in `src/app/events/dashboard/[id].tsx`): opens the wizard's steps `Basics`, `WhenWhere` and `Tickets` (exported from `HostScreen.tsx`, no copy of them) in edit mode, filled from the event, and saves with `PATCH /events/{id}` as the sent-back path does (`hostApi.ts`). Before the save, one confirm sheet from the app's shared parts says what the Hub will do: the event goes back to review and comes off the calendar until it is approved again (no board draws this sentence: G-EVENTS-14-1). After the save the app shows the same "sent for review" end the wizard shows (`HostEnds.tsx`), and E17 lists the event as under review, as it does for a new one.
- **"Ticket types" on E18** (`onTickets`): opens the `Tickets` step. While no ticket has sold, saving calls `PUT /events/{id}/tickets`. Once a ticket has sold, each tier's price and places are read-only, with one line saying why (the Hub's rule in the app's words), and the step offers nothing that would be refused; a 409 that still arrives (a sale between the read and the save) is shown with the Hub's own message, never a crash.
- **Both rows are drawn only now that they are built** (R-47, R-27): `DashboardScreen.tsx` already draws each row only when its callback is passed; this task passes them. Nothing else on E18 changes.
- **The sent-back path (E22) is untouched:** `SentBackScreen.tsx` and its tests pass as they are.
- **Every value on screen is the Hub's or the person's:** the event's fields, the tiers, the sold figures. No literal prices, no em-dashes (R-5), the app's name as "Who Made This?" where it prints it (R-69).
- **Tests** are written "a host can ..." and cover: edit a live event and see it go back to review; change tiers before a sale; see price and places locked after a sale; a 409 shown as the Hub's message; the sent-back path unchanged. Backend: the 409 message, and that the two routes behave exactly as before.

## Not in scope

- Adding a tier after the first sale, changing a sold tier's name or description, or editing a called-off event: not ruled, not built (the Hub refuses the first today and this task does not change that).
- Any change to the review itself (the admin dashboard's approve and send-back are as built).

## Capability checks

- [ ] A host opens a live event from E17 and E18, taps Edit event, changes a field, is told the event goes back to review, saves, and the event is `pending` on the Hub and off the calendar until approved; after approval it is live again with the change.
- [ ] A host with no ticket sold changes a tier's price and places from Ticket types and the Hub saves them.
- [ ] A host with one ticket sold sees that tier's price and places locked with one line of why, and a `PUT` that still reaches the Hub is refused with 409 and shown as the Hub's message.
- [ ] `PATCH /events/{id}` and `PUT /events/{id}/tickets` behave exactly as before: the EVENTS contract specs and the protected suite pass with no assertion changed (V3); only the 409's message is new.
- [ ] E18 with the two rows, E13 to E15 in edit mode, and the review end match the boards in light and dark, compared picture with picture (V5); the two rows were not drawn before this task and are now.
- [ ] E22's sent-back edit still passes its tests untouched.
- [ ] No em-dash in any response string or screen; no provider or brand name.
- [ ] Against the local backend on the stand-in, a real sign-in edits one live event, sees it pending, and gets a 409 on a sold tier (V9).

## History

None yet. Reports go to tasks/history/EVENTS-14.md.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EVENTS-14.md](history/EVENTS-14.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

