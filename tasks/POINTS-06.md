---
id: POINTS-06
title: Buy points
owner: YOU
area: POINTS
order: 276
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [POINTS-02, TIER-05, POINTS-05, DV2-COMP]
decisions: [R-43, R-65, R-10, R-16]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT4, PT4b, PT4c]
---
# POINTS-06 · Buy points

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 4 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): POINTS-02, TIER-05, POINTS-05, DV2-COMP.
- **History:** none yet. Reports go to tasks/history/POINTS-06.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65, R-10, R-16 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person buys a points pack in Naira from the wallet or by bank transfer, and sees the points added (PT4, PT4b, PT4c).

## Scope

- New files under `src/features/points/`. PT4: packs from `GET /plans` (`packs`, `packBonusPercent` for Founding "+10%", `checkoutBump` is VF6 only), `GET /plans/purchases/quote`, `POST /plans/purchases` kind `points_pack` (POINTS-02), method wallet or transfer (TIER-05). PT4b paying (poll `GET /plans/purchases/{id}`), PT4c points added. PT4a (dollars) is not built at launch (R-16, R-65).
- Entries as drawn: "Buy points" on Wallet (W1), PT1a (no points) and PT3 (not enough points).

## Capability checks

- [ ] A person picks a pack, sees the Hub's price and points, pays with the PIN, and sees the added points once.
- [ ] A Founding Maker sees the bonus the Hub returns; others do not.
- [ ] By transfer the pack completes when the money lands.
- [ ] Each board above (PT4, PT4b, PT4c) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
