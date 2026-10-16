---
id: POINTS-07
title: Studio: the AI tools, not enough points, the daily limit
owner: YOU
area: POINTS
order: 277
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [AITOOLS-01, POINTS-03, POINTS-06, DV2-COMP, ME-04, HOME-01]
decisions: [R-43, R-61, R-68, R-47]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT1, PT1a, PT3, PT3a, PT3b, PT7]
---
# POINTS-07 · Studio: the AI tools, not enough points, the daily limit

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** L. **Wave:** 5 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): AITOOLS-01, POINTS-03, POINTS-06, DV2-COMP, ME-04.
- **History:** none yet. Reports go to tasks/history/POINTS-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-61, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person opens Studio from Home or from Create, sees the AI tools the Hub lists with their cost in points, and when points run short is offered the wallet top-up or Buy points, with nothing running until they confirm.

## Scope

- New files under `src/features/points/`. PT1, PT1a: `GET /ai-tools` and `GET /me/points`; only the tools the Hub lists are drawn. The heading line reads "Every AI voice tool, paid in points" (R-68: no outside name).
- PT3, PT3a, PT3b: `POST /points/quote`, `PUT /me/points/settings` (Use wallet), `POST /points/shortfall` (PIN, Idempotency-Key) for "Use ₦X from your wallet for the missing points?"; wallet too low sends to Add money. PT7: `points_cap_reached` named cap and reset time in a friendly message.
- This task adds the entries as drawn: the Studio tile on Home (R-61, the services row from DV2-01) and the Studio row on the Create hub with the points balance (M19).

## Capability checks

- [ ] A person can open Studio from Home and from Create and sees the Hub's tools and costs.
- [ ] With too few points and Use wallet on, the sheet shows the wallet money for the shortfall and nothing is taken until the PIN is entered.
- [ ] With Use wallet off, the sheet offers Buy points; with a wallet too low it offers Add money.
- [ ] Past the daily cap the friendly PT7 message names the reset time.
- [ ] Each board above (PT1, PT1a, PT3, PT3a, PT3b, PT7) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
