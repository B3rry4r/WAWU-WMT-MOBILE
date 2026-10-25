---
id: VERIFY-05
title: Your tier, and when you have used all your products
owner: YOU
area: VERIFY
order: 274
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [ME-12, TIER-04, TIER-07, DV2-COMP]
decisions: [R-43, R-65]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [VF13, VF14, VF14a, VF14b]
---
# VERIFY-05 · Your tier, and when you have used all your products

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 14.
- **Status:** merging (lead). Verdict: MERGE (lows are ME-12's) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S7.md`). Stacked in batch 14 by MERGE-14 (backend `wmt/MERGE-14`, mobile `wmt/MERGE-14`); not on main. Built: Same branch as ME-12 (`wmt/S7`); no backend change.
- **Built:** `/your-tier` (VF14, VF14a, VF14b) from `GET /me/tier`: dates, products used and allowed (added places included), points included, the event pass; ending shows the days left, ended says published products stay up and publishing is paused; Renew opens the checkout for the tier held, Upgrade opens VF5 (drawn only when a higher tier is sold). The VF13 sheet ("You have used N of N") adds five products once with the PIN (`kind extra_products`, the same one-attempt payment as the tier; a short wallet turns the button into "Add ₦X" to W15) or opens VF5.
- **Entries:** Me's tier badge, Settings' Your tier row, the Create hub's Content at the limit of a running tier, the upload step and the publish step on a 402.
- **Not drawn:** dollar offer (VF13a, R-16).
- **Next:** the batch 14 pull request (the lead). No low is left open.

Status set to review by the records sync, 25 Oct 2026: merged as app dba331c1, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/VERIFY-05.md](history/VERIFY-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
