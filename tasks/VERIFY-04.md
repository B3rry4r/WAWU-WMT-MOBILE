---
id: VERIFY-04
title: Publish your first product, and the identity check
owner: YOU
area: VERIFY
order: 273
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [VERIFY-01, ME-12, ME-04, TIER-02, KYC-05]
decisions: [R-43, R-6, R-33]
passes: [V1, V4, V5, V6, V9]
artboards: [VF12, VF12a, VF12b, VF12c, VF15, VF15a, VF15b]
---
# VERIFY-04 · Publish your first product, and the identity check

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 4 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): VERIFY-01, ME-12, ME-04.
- **History:** none yet. Reports go to tasks/history/VERIFY-04.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-6, R-33 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

After paying, the draft accepts files and the person publishes their first product with a "1 of 3 used" meter; their identity check runs, and when it fails uploads pause with the reason and what to do.

## Scope

- New files under `src/features/verify/`. Calls: `POST /product-drafts/{id}/publish`, `POST /uploads/presign` and `/confirm`, `GET /uploads/allowance`, `GET /me/tier` (`productsUsed`, `productsAllowed`).
- VF12 to VF12c: add the file, uploading, published, and the share sheet (the phone's share sheet, R-33, no custom card). The meter is `ProductsMeter` (DV2-COMP).
- VF15 to VF15b: after payment the BVN and NIN check runs as when opening a wallet (`GET /money/identity`, KYC-05 screens); the paused state reads the publish gate's reason (`TierGateReasonDto.code`, `message`). G-660 to G-662 apply.
- A person with no tier who taps Publish or any upload is sent to VF5 (ME-12); this task adds that tap on the Create steps M20 to M22 as drawn.
- The category: this task collects it before the first publish; the draft form (VERIFY-01) stays without it (lead ruling, 17 Oct 2026, VERIFY-01 round 2).

## Capability checks

- [ ] A person with a tier can attach a file to a draft, watch it upload, publish it, and share it from the phone's share sheet.
- [ ] The meter reads the Hub's count and changes after publishing.
- [ ] A person whose identity check fails sees uploads paused with the Hub's reason, and cannot publish until it passes.
- [ ] A person with no tier who taps Publish lands on VF5.
- [ ] Each board above (VF12, VF12a, VF12b, VF12c, VF15, VF15a, VF15b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
