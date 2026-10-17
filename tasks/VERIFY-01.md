---
id: VERIFY-01
title: Your bonus is waiting, and the draft shop
owner: YOU
area: VERIFY
order: 269
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [AUTH-07, ME-04, ME-01, TIER-02, DV2-COMP]
decisions: [R-43, R-6, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: [VF1, VF2, VF2a, VF2b]
---
# VERIFY-01 · Your bonus is waiting, and the draft shop

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder, mobile `wmt/VERIFY-01` on `origin/wmt/MERGE-7` `04e49020` with `origin/wmt/REF-03` `0668a6d` and `origin/wmt/DV2-05` `960c40d` merged (merge commits). No backend, wawu-id or migration change (the Hub already serves `GET /plans` and `/product-drafts`, TIER-02).
- **Built** (`src/features/verify/`, routes `/verify-bonus`, `/shop`, `/shop-product`):
  - VF1 `BonusScreen`: the preselected tier's `bonusPoints`, `firstVoiceIntroIncluded` and `eventPass` from `GET /plans`, shown locked; "Build my shop". The AI tool names come from the Hub's priced `actions`. Error keeps the button.
  - VF2, VF2a, VF2b `ShopScreen`: ring, "N drafts · drafts are free", each draft tagged Draft with "No file yet · price", plus and "Add a product". Loading, error, empty.
  - Draft form `DraftFormScreen`: title, how it looks (kind), description, Paid or Free and price; `POST`, `GET`, `PATCH` (only what changed) and `DELETE /product-drafts`, delete asks once. A draft with no file saves free; the cap is the Hub's: its own words show when it refuses (G-662).
  - "Shop ready" is worked out on the phone: the most finished draft's share of four fields (title, kind, description, price or Free), 0 with no drafts (the board's 10%, 40%, 80% are example values).
  - Entries: Me's draft tile opens `/shop` (M1); Create (M19) has a "Your shop" row under the tiles (drawn with VF2's own words because M19 draws no draft row; accepted by the lead, 17 Oct, R-47: the task asks for an entry).
  - `bonusStep.ts`: the once-after-sign-up mark VF1 needs, modelled on the access-code step.
- **Not drawn (R-47):** the Voice Intro prompt on Me and VF2's "Hear your name" row (VF3, VF4 are VERIFY-02, the Hub serves no Voice Intro, G-800); the Voice Intro player; publishing (VERIFY-04); the tier badge entry (VERIFY-05).
- **Shared-change rows:** SHARED-CHANGES VERIFY-01 #1 (the A4 hand-on to VF1) and #2 (`shop` and `shop-product` in the signed-in group) were approved by the lead on 17 Oct and are APPLIED on this branch in round 2 (commit `aca6fda4`): `confirmSignupCode` marks the account (`markBonusPending`) beside the access-code mark; `_layout.tsx` has `useBonusStep`, a `Stack.Protected` step group for `verify-bonus` after the access-code step (so a new person sees the access-code step, then VF1, then the app), and `(tabs)`, `shop` and `shop-product` wait for it. A non-creator account ends the step itself.
- **Gaps filed:** G-840 (a draft has no picture), G-841 (event pass line: no benefits served), G-842 (a description cannot be cleared).
- **Checks:** full mobile check (typecheck, lint, jest 209 suites and 3639 tests, gates, tasks) run once, then the three gate findings it raised (literal gaps in `parts.tsx`) were fixed and typecheck, lint, the 23 verify tests, gates (0 fail, 5 warn as main) and tasks re-run to EXIT 0. No GitHub mobile CI (billing).
- **NOT RUN:** pictures at 390 px beside the rendered boards (the boards were rendered and read: `python3 scripts/design/render_design.py VF1 VF2 VF2a VF2b`); the V7 walk of the real sign-up to VF1 in a browser (the new test `bonusStepRoute.test.tsx` walks the code step to VF1 in the router). Both are for the verifier.
- **Open findings:** none yet.
- **Rulings (lead, 17 Oct):** rows #1 and #2 approved; M19's "Your shop" row accepted; the category is collected by VERIFY-04 before the first publish and the draft form stays without it (one line added to `tasks/VERIFY-04.md`'s scope).
- **Round 2:** applied rows #1 and #2 and added `src/features/verify/__tests__/bonusStepRoute.test.tsx` (7 tests): a new account goes access code, then VF1 once, "Build my shop" opens the shop, and VF1 does not come again on the next start or after the app was closed on it; an unmarked or finished account sees nothing; a signed-out visit to `/shop`, `/shop-product` or `/verify-bonus` lands on the signed-out screens; a signed-in person opens the shop and the draft form from it.
- **Next:** a verifier, fresh, runs V1, V4, V5, V6, V7, V9 with the stack `--with mobile`, takes the four boards in light and dark, and walks sign-up to VF1 to VF2 to the form.
- **History:** reports go to tasks/history/VERIFY-01.md.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/VERIFY-01.md](history/VERIFY-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
