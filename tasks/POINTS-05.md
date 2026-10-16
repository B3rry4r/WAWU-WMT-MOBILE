---
id: POINTS-05
title: Your points, and convert them to cash
owner: YOU
area: POINTS
order: 275
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [POINTS-04, POINTS-01, DV2-COMP, WALLET-01]
decisions: [R-43, R-65, R-16]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT5, PT5a, PT6, PT6a, PT6b]
---
# POINTS-05 · Your points, and convert them to cash

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 3 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): DV2-COMP.
- **History:** none yet. Reports go to tasks/history/POINTS-05.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65, R-16 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person sees their points, when each lot ends, and the last movements (PT5), and converts points to wallet cash at the Hub's rate with the PIN (PT6).

## Scope

- New files under `src/features/points/`. PT5, PT5a: `GET /me/points` (`balance`, `lots` with expiry, `nextExpiry`, `movements`; nothing yet is PT5a). PT6, PT6a, PT6b: `GET /points/convert/quote` (rate, minimum, cash, `canConvert`, `blockedBy`), `POST /points/convert` (PIN, Idempotency-Key), `GET /points/convert/{id}` for the pending state (G-740 to G-745 apply). A person billed in dollars is told in plain words why they cannot convert (G-741).
- The rate and every figure are read from the Hub (R-65: 1,000 points = ₦500 at launch). Points are a count, never naira (R-5); the line "spending on AI is worth more" is printed only if the Hub serves the numbers behind it.
- This task adds the taps as drawn: the Points card on Wallet (W1) opens PT5 and "To cash" opens PT6 (DV2-02 draws the card).

## Capability checks

- [ ] A person sees their balance and lots with end dates, and the last movements.
- [ ] A person converts 1,000 points: the quote shows ₦500 before they confirm, they enter the PIN, and the wallet rises once.
- [ ] Below the minimum, PT6a shows the Hub's reason and Convert is off.
- [ ] The same confirm sent twice converts once (V8).
- [ ] Each board above (PT5, PT5a, PT6, PT6a, PT6b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
