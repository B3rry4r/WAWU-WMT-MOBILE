---
id: VERIFY-01
title: Your bonus is waiting, and the draft shop
owner: YOU
area: VERIFY
order: 269
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [AUTH-07, ME-04, ME-01, TIER-02, DV2-COMP]
decisions: [R-43, R-6, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: [VF1, VF2, VF2a, VF2b]
---
# VERIFY-01 · Your bonus is waiting, and the draft shop

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 3 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): ME-04, DV2-COMP.
- **History:** none yet. Reports go to tasks/history/VERIFY-01.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-6, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Right after sign-up a person sees what a tier unlocks (locked), builds draft products with no files and no payment (VF2), and pays only when they are most excited (R-43: build first, pay later).

## Scope

- New files under `src/features/verify/` and route files under `src/app/`; no `_layout.tsx` edit (route-graph rows go to SHARED-CHANGES queue 4).
- VF1: the points, the Voice Intro and the event pass a tier unlocks, shown locked, from `GET /plans` (the preselected tier's `bonusPoints`, `firstVoiceIntroIncluded`, `eventPass`). One button, "Build my shop". Reached right after the email and phone code is accepted (the A4 hand-on changes from discover to VF1: queue 4 row).
- VF2, VF2a, VF2b: the Create product form without the file step (title, price, look), a progress ring for "shop ready" worked out on the phone from the draft's fields, a "Draft" tag. Calls `POST` and `GET /product-drafts`, `GET`, `PATCH` and `DELETE /product-drafts/{id}`. A draft with no file saves free; the cap is the Hub's (G-662). Publishing is VERIFY-04.
- This task adds the entries as drawn: the draft product card and the Voice Intro prompt on Me (M1), and the draft row on the Create hub (M19), once ME-04 and ME-01 are in.

## Capability checks

- [ ] A new person who has just entered the code lands on VF1 and can reach VF2 with "Build my shop".
- [ ] A person can save a draft with no file, see it tagged "Draft", edit it, and delete it; three drafts show VF2b.
- [ ] The prices and points on VF1 are what `GET /plans` returns, not literals.
- [ ] Each board above (VF1, VF2, VF2a, VF2b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
