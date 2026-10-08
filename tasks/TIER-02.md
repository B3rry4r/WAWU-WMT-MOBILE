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
