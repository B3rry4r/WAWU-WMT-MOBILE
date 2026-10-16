---
id: VERIFY-05
title: Your tier, and when you have used all your products
owner: YOU
area: VERIFY
order: 274
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [ME-12, TIER-04, TIER-07, DV2-COMP]
decisions: [R-43, R-65]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [VF13, VF14, VF14a, VF14b]
---
# VERIFY-05 · Your tier, and when you have used all your products

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 4 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): ME-12, TIER-04, TIER-07, DV2-COMP.
- **History:** none yet. Reports go to tasks/history/VERIFY-05.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person sees their tier (name, badge, active until, products used, points included, event pass) from Me and Settings and can renew or upgrade; at their limit they can add 5 more products or upgrade.

## Scope

- New files under `src/features/verify/`. VF14, VF14a, VF14b: `GET /me/tier` for active, ending in 3 days and ended (published products stay up; new publishing is paused until renewed). Renew and Upgrade call ME-12's checkout (`kind` renew, upgrade; the upgrade pays only the difference).
- VF13: a sheet "You have used N of N. Add 5 more for the price or upgrade". The price is the R-65 setting read from `GET /plans` `extraProducts`; Add 5 calls `POST /plans/purchases` kind `extra_products` (TIER-04). VF13a (dollars) is not built at launch (R-16).
- Entries as drawn: Me (tier badge), Settings (a Your tier row), the Create hub when at the limit (M19).

## Capability checks

- [ ] A person can open Your tier from Me and from Settings and see the Hub's dates and counts.
- [ ] A person at their limit can add 5 more products (once, with the PIN) or tap Upgrade and reach VF5.
- [ ] A person whose tier ended sees the ended state, can renew, and their published products stay visible.
- [ ] Each board above (VF13, VF14, VF14a, VF14b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
