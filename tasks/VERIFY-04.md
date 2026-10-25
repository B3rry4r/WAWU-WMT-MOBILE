---
id: VERIFY-04
title: Publish your first product, and the identity check
owner: YOU
area: VERIFY
order: 273
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [VERIFY-01, ME-12, ME-04, TIER-02, KYC-05]
decisions: [R-43, R-6, R-33]
passes: [V1, V4, V5, V6, V9]
artboards: [VF12, VF12a, VF12b, VF12c, VF15, VF15a, VF15b]
---
# VERIFY-04 · Publish your first product, and the identity check

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 14.
- **Status:** merging (lead). Verdict: MERGE; F3 (the Hub's publish gate had no identity pause) ruled the Hub's and fixed in round 2 (backend ee90b56: 403 identity_paused on all five routes), re-verified MERGE (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S7.md`). Stacked in batch 14 by MERGE-14 (backend `wmt/MERGE-14`, mobile `wmt/MERGE-14`); not on main. Built: Same branch as ME-12 (`wmt/S7`); backend `wmt/S7` (from `wmt/MERGE-11` d0776eb) carries the Hub's identity pause (round 2, F3), no migration.
- **Built:** `/publish?id=` (VF12 to VF12c): the preview and the file go up through the create flow's own `pickFile` and `uploadFile` under the draft's format, the meter is `ProductsMeter` from `GET /me/tier`, the category is asked here before the first publish (the draft form stays without it), `POST /product-drafts/{id}/publish`, Share is the phone's share sheet (R-33). The identity check (VF15, VF15a, VF15b) reads the wallet's own opening state (`GET /money/wallet`): checking (spinner), passed (Continue, shown once when the person watched it run), paused with the Hub's reason and fixes and Try again to Open your wallet.
- **Entries:** the draft form's Publish (saved draft, nothing unsaved) goes to `/tiers` with no tier, `/your-tier` once ended, else `/publish`; a 402 `tier_required` from an upload goes to `/tiers`, `product_limit_reached` to the VF13 sheet.
- **Defaults (agent), owner may override:** a published product says "with our team for review" unless the Hub says `live` (G-VERIFY-04-2); the ring has no figure (G-VERIFY-04-1).
- **Round 2 (S7 verifier F3, the lead's ruling):** the identity pause is the Hub's. The publish gate (`PublishingGate.assertMayUpload`, so also the draft publish, `POST /content`, resubmit, an edit that carries a file and the content upload presign) refuses with `403 identity_paused` and the Hub's own sentence while the check is paused: waiting for documents, refused, stopped, or closed unfinished. Passed (a wallet is open), under way, and never started are not refused (as before); the tier is asked first, the room after; the ID document upload is never refused. The app shows that sentence as VF15b when the Hub refuses a publish or a file (`publishApi` `identity_paused`, `PublishScreen`); the wallet-read pause on arrival is unchanged. SHARED-CHANGES VERIFY-04 #1.
- **Next:** the batch 14 pull request (the lead). No low is left open.

Status set to review by the records sync, 25 Oct 2026: merged as app dba331c1, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/VERIFY-04.md](history/VERIFY-04.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
