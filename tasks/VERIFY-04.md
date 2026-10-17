---
id: VERIFY-04
title: Publish your first product, and the identity check
owner: YOU
area: VERIFY
order: 273
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [VERIFY-01, ME-12, ME-04, TIER-02, KYC-05]
decisions: [R-43, R-6, R-33]
passes: [V1, V4, V5, V6, V9]
artboards: [VF12, VF12a, VF12b, VF12c, VF15, VF15a, VF15b]
---
# VERIFY-04 · Publish your first product, and the identity check

## Current state

As of 17 Oct 2026 (builder, bundle S7).
- **Status:** verifying. Same branch as ME-12 (`wmt/S7`); no backend change.
- **Built:** `/publish?id=` (VF12 to VF12c): the preview and the file go up through the create flow's own `pickFile` and `uploadFile` under the draft's format, the meter is `ProductsMeter` from `GET /me/tier`, the category is asked here before the first publish (the draft form stays without it), `POST /product-drafts/{id}/publish`, Share is the phone's share sheet (R-33). The identity check (VF15, VF15a, VF15b) reads the wallet's own opening state (`GET /money/wallet`): checking (spinner), passed (Continue, shown once when the person watched it run), paused with the Hub's reason and fixes and Try again to Open your wallet.
- **Entries:** the draft form's Publish (saved draft, nothing unsaved) goes to `/tiers` with no tier, `/your-tier` once ended, else `/publish`; a 402 `tier_required` from an upload goes to `/tiers`, `product_limit_reached` to the VF13 sheet.
- **Defaults (agent), owner may override:** a published product says "with our team for review" unless the Hub says `live` (G-VERIFY-04-2); the ring has no figure (G-VERIFY-04-1).
- **Next:** a fresh verifier. NOT RUN by this builder: the stack run and the pictures.

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

- Files: `src/features/verify/` `PublishScreen.tsx`, `publishApi.ts`, `IdentityCheck.tsx`, `identityModel.ts`, `ProductsFullHost.tsx`; `DraftFormScreen.tsx` (Publish); routes `publish`, `shop-product`, `create-upload`.
- Checks: tsc EXIT 0; eslint on the changed files EXIT 0; jest `src/features/verify` 8 suites, 67 tests (12 checkout, 11 publish and tier, 44 earlier) EXIT 0, and `src/features/create`, `me`, `settings`, `home` with the send model test, 17 suites, 314 tests, passed. Tests: `publishAndTier.test.tsx` (pick two files, category, publish once with the two file links, review note, share link through `Share.share`; no tier; paused with the Hub's reason; checking then passed then form; full tier opens VF13; `identityStateOf`).
- Gaps: G-VERIFY-04-1, G-VERIFY-04-2. Shared: SHARED-CHANGES ME-12 #2.
- NOT RUN: stack run and pictures.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
