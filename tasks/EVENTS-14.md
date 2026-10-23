---
id: EVENTS-14
title: Edit a sent event from E18 (back to review; sold tiers keep their price and places)
owner: YOU
area: EVENTS
order: -116
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-79, R-47, R-27, R-29, R-5]
passes: [V1, V2, V3, V4, V5, V6, V7, V9]
artboards: []
---
# EVENTS-14 · Edit a sent event from E18 (back to review; sold tiers keep their price and places)

## Current state

As of 23 Oct 2026, cut (lead, from the owner's answer of 23 Oct 2026, R-79 (c)). Status: todo. Tier T1 (screens and endpoints, no money moves). About 60 minutes of building; if it runs past that, push what is done and hand back what remains.
- **Why:** a creator cannot edit an event after sending it today. E18's "Edit event" and "Ticket types" rows are not drawn (R-47, G-833, the missing report of 23 Oct 2026, item 2). The app's only edit path is a sent-back event (E22, `PATCH /events/{id}` from `host/hostApi.ts`). The owner has now ruled the two Hub rules that held the rows up, so this task mounts them.
- **The ruling (R-79 (c)):** the edit goes back to review; ticket price and places cannot change once a ticket is sold. Both are what the Hub does today: `PATCH /events/{id}` puts every edit back to `pending` with `lastDecisionReason` cleared (backend `src/event/event.service.ts`, `update`), and `PUT /events/{id}/tickets` answers 409 as soon as any tier has sold (`src/event-ticketing/event-ticketing.service.ts`, `setTicketTypes`). Neither rule changes.
- **Real prerequisites (not in `depends_on`):** EVENTS-04 (the host wizard, E13 to E15, on mobile main), EVENTS-08 (E18 and `organiser/DashboardScreen.tsx`, status verifying, its screen on mobile main) and the backend's event routes on backend main (`b2f4df6`, 23 Oct 2026). They sit at launch orders that are all taken below CHECK-3, so this task uses a negative order (like FIX-nn) and `depends_on` is empty.
- **Boards:** E18 is EVENTS-08's and E13 to E15 are EVENTS-04's (a board is in exactly one screen task), so `artboards` is empty here. The two rows reuse the wizard's steps, as EVENTS-08's brief says ("E18's Edit event and Ticket types reuse E13 to E15"). What no board draws is built from the app's shared parts only and filed as G-EVENTS-14-1 (R-29).
- **Next:** a builder session (Sonnet) on branch `wmt/EVENTS-14` in both repos (the app's contract synced from the backend branch with `npm run api -- --backend <backend worktree>`); then a lean verifier.

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
