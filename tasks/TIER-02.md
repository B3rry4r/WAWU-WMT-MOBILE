---
id: TIER-02
title: Publishing needs a tier: the gate and the product count
owner: YOU
area: VERIFY
order: 208
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [TIER-01, ME-17]
decisions: [R-43, R-7, R-8]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# TIER-02 · Publishing needs a tier: the gate and the product count

## Current state

As of 16 Oct 2026, from the lead's log (14 Oct) and the branch.
- **Status:** review on its branch (round 5 verified, no blocker). This file on main still says todo; the merge sets done.
- **Branches:** mobile `wmt/TIER-02` 957901c. Backend `wmt/TIER-02` b41831f, PR #122 open (main 2a4b9a4 merged in, migration `20261021161000_product_drafts`).
- **Merged and live:** nothing of this task. TIER-03, the tier sales it needs, is live (backend 2a4b9a4, mobile 3e5b7cb).
- **Held by:** the protected route suite fails on main's lock by design (its setup publishes as a new creator and now gets 402), so PR #122 needs the owner's `relock-approved` label (SHARED-CHANGES TIER-02 #4).
- **Open findings:** blocker 0, high 0, medium 0. Lows (round 5: D11, T14, N18, N19) are in tasks/SWEEP-MONEY.md.
- **For the owner:** the seven questions in the branch file's "For the owner" section are still open: U1 (perpetual ticks), U2 (featured video), U3 (media frames), U4 (the `slotsUsed` audit), U5 (extras across an upgrade), N1 (`productsAllowed` for a tick holder) and D9 (a tier and the pack together). Built defaults stand until the owner answers.
- **Round 4 notes N14 and N15** (info; recorded, no change): N14 (an ended tier's `extraProducts` stay on its row and the offers ignore them) went to tasks/TIER-03.md as its D4, where round 2 kept the extras and stated the rule in docs/contract/PLANS.md section 8; TIER-04 aligns the offers. N15 (the app does not read the 402 yet; a picker must treat `tiers: []` on `tier_required` as "show the message") went to tasks/TIER-03.md round 2 as a note for the picker tasks, TIER-04 and WEBPAY-04; neither of their files carries it yet.
- **Next:** the owner applies the label; the lead merges backend #122, signs off mobile, and fixes the owner question's item 7 at that point (D11: the boundary is 15 up, the worst case 5).
- **Records:** on the branch, `wmt/TIER-02`, in tasks/TIER-02.md there (174 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py TIER-02`; the history goes to tasks/history/TIER-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/ME-17.md` (the tick rules this replaces)

## Goal

Anyone can sign up, build a profile and draft products free. Publishing, or uploading any file, needs an active
tier, and published products never exceed the tier's products plus any extra products bought (R-43).

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- ME-17 (done, ticks unlock uploads; free content): rewired. R-7's 5 and 25 uploads give way to the tier's 3, 6 or 10 plus extras (R-43 reverses the 5-item cap). Free pieces (R-8) still count as products.

## Scope

- Every route that publishes content, a product or a service, or accepts a file (the report lists each) answers `402 tier_required` with the tier offers from `GET /plans` when the person has no active tier, and `402 product_limit_reached` (used, allowed, and the two ways on: extra products or an upgrade) at the limit. A draft with no file saves free.
- Counting: published products across content, products and services; a draft counts only once published; unpublishing frees a place. `GET /me/tier` gains `productsUsed`.
- Ended tier, Default (agent), owner may override (R-43 leaves the expiry rule open; VF14 draws this): published products stay up; new publishing and uploads pause until renewed.
- People who paid for a verification tick before tiers: Default (agent), owner may override (question 3 in `docs/PAYMENTS-PLAN.md`): they keep publishing under the tick's rules until it ends.
- If a gated route is in the protected suite, this is a deliberate change to a protected route; the report lists it for the owner's relock label.
- Not in scope: event hosting by tier (E21 "Needs a tier"), which the events task cut from the round 2 boards carries.

## Capability checks

- [ ] A new person can save a draft with no file, and gets `tier_required` with the offers when they publish or upload a file.
- [ ] A person on Verify publishes 3 products and the 4th answers `product_limit_reached` with 3 of 3; with 5 extra products bought, the 4th to 8th publish.
- [ ] A draft does not count; unpublishing one frees a place.
- [ ] After a tier ends, published products stay visible to buyers, and a new publish or upload answers `tier_required`.
- [ ] A person whose paid tick has not ended keeps publishing as before; once it ends they get `tier_required`.
- [ ] The app's and the website's existing publish and upload calls get the same answers for the same person (V4, both clients).

## Builder report

## Verifier report

## Owner sign-off
