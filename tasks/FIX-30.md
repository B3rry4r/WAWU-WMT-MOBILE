---
id: FIX-30
title: FIX-29 follow-ups: the Inbox blank body, the ticket picker without a buy button, the R-46 wording
owner: YOU
area: FIX
order: 244
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [FIX-29]
decisions: [R-47]
passes: [V1, V5, V6]
artboards: [I1, E2]
---
# FIX-30 · FIX-29 follow-ups: the Inbox blank body, the ticket picker without a buy button, the R-46 wording

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-47; `tasks/FIX-29.md` (the verifier's findings 1, 3 and 5)

## Goal

Close what the FIX-29 verifier found outside FIX-29's diff, so the app shows only what is built and never a blank
screen.

## Scope

- Inbox (I1): when the Hub serves rows but none has a renderer yet, the tab draws its designed empty state, and the
  tab badge counts only rows that are drawn (`InboxScreen.tsx` filters at line 48; the empty state draws only on zero
  rows at line 85).
- Event detail (E2): the ticket quantity picker and its running total are not drawn until EVENTS-06 (buy a ticket)
  is done (R-47: a picker that leads nowhere); the event's price lines stay.
- The `unbuilt_entries` gate's docstring, `scripts/gates/tests/*` and `src/lib/unbuilt.ts` say R-47, not R-46.

## Capability checks

- [ ] Rows with no renderer: the Inbox shows its empty state and the badge shows no count.
- [ ] E2 shows no picker or total while EVENTS-06 is not done; the gate or a test fails if one comes back early.
- [ ] No R-46 wording left in the gate, its tests or `src/lib/unbuilt.ts`.

## Owner sign-off
