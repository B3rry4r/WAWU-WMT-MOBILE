---
id: TIER-04
title: Add 5 more products
owner: YOU
area: VERIFY
order: 210
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [TIER-02, TIER-03]
decisions: [R-43]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-04 · Add 5 more products

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): TIER-02.
- **History:** none yet. Reports go to tasks/history/TIER-04.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

A person at their limit can add more products (VF13: "You have used 3 of 3. Add 5 more for ₦1,500 or upgrade")
instead of upgrading. The count and the price come from config.

## Scope

- `POST /plans/purchases` kind `extra_products` (count and price from config, in the person's currency), purpose `extra_products`; needs an active tier.
- The gate (TIER-02) adds the bought products to what the tier allows.
- Default (agent), owner may override: bought products stay with the account and count whenever the person holds a tier.

## Capability checks

- [ ] A person at 3 of 3 buys 5 more and can publish 5 more, once.
- [ ] The same request twice debits once and adds 5 once (V8).
- [ ] Without an active tier the purchase answers `tier_required` and nothing is debited.
- [ ] After a tier ends and is renewed, the bought products still count.

## Builder report

## Verifier report

## Owner sign-off
