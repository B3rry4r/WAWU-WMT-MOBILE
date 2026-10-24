---
id: TIER-04
title: Add 5 more products
owner: YOU
area: VERIFY
order: 210
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [TIER-02, TIER-03]
decisions: [R-43, R-10, R-65]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-04 · Add 5 more products

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/TIER-04.md`, verdict merge, three lows). Stacked in batch 8 by MERGE-8.
- **Branches:** backend `wmt/TIER-04` `0a0fc44` on `origin/wmt/POINTS-03` `ebe76de` (which holds TIER-05, POINTS-02 and POINTS-03); mobile `wmt/TIER-04` on `origin/wmt/POINTS-03` `a14ce45b` (this file, SHARED-CHANGES rows TIER-04 #1 to #3, contract and API types regenerated).
- **Migration:** `20261025030000_maker_extra_products` (one new table `MakerExtraProducts`, nothing existing touched; the lead may rename the stamp at merge). Why a table: `MakerPurchase` has a CHECK on its kind (tier, renew, upgrade), and a table of its own also keeps the count each purchase added.
- **Built:** `kind: extra_products` (no `tierId`, `packId` or `bump`) on `GET /plans/purchases/quote`, `POST /plans/purchases` and `GET /plans/purchases/{id}`, from the wallet or by bank transfer (TIER-05's orders). A new wallet payment kind `extra_products` (WAWU's own sale, not held, target `extra-products`) in `PURCHASE_PAYMENT_KINDS`, with a new `ExtraProductsService` (`src/plans/purchases/extra-products*.ts`) built like POINTS-02's pack service. Contract: `docs/contract/PLANS.md` section 10, `WALLET.md`, `CONVENTIONS.md` section 23.
- **Every figure is a setting (R-65):** the count (`plan.extra_products.count`) and the price (`plan.extra_products.price_kobo`) are read from the live plan on each call. No literal in code. The fee is the payment's Bank charge on top (R-10, R-53); the price is never the total.
- **Needs a running tier:** with none, or an ended one, the quote and the purchase are `402 tier_required` (a new money error code, same 402 as the publishing gate's) before anything moves, with no key kept and no currency fixed; a bank-transfer order whose tier ends while it waits is closed with nothing taken.
- **The quote binds price and count:** the count is the payment's terms; a changed price or count since the quote is `409 quote_changed`, and a setting changed while the payment confirms (or a transfer waits) does not change what is added.
- **Once (V8):** the add-on is added to `MakerTier.extraProducts` last in a database-only transaction under the person's tier lock, behind a `MakerExtraProducts` row keyed by the payment's id. The same key twice, ten taps at once with one key or with ten keys, and a delivery run five times add once. No transaction, connection or lock is held across a provider call.
- **What is bought stays:** `extraProducts` lives on the tier row, which a renewal, a new tier after an ended one and an upgrade leave alone (tested through the real renew and upgrade routes). The TIER-02 gate already counts it, so 3 of 3 becomes 3 of 8 and exactly 5 more can be published.
- **Agent defaults, owner may override:** (1) the add-on may be bought again and again, each time adds the count; (2) it is allowed even when it would not lift the person above the products they have published (the gate's offers leave it out then; a direct call is not refused); (3) a payment that confirms after the tier ended is still added and waits for the next tier (the person paid for it).
- **Checks:** backend CI on `0a0fc44` all green (see the Builder report for run ids). Local: tsc 0, eslint 0 and prettier on the changed files; 3 new specs (40 cases) pass; the related existing specs pass except three TIER-05 sweep-budget cases that depend on machine load (see the Builder report); `contract:build` twice identical.
- **Not done:** a dollar-billed person (refused `target_not_payable` by the payment service until a dollar wallet exists, R-16, NUV-09; tested). No screen: VF13 is a later screen task, so nothing is drawn (R-47).
- **Open findings:** none known.
- **Next:** a verifier checks it; the lead merges with the batch that holds POINTS-03.
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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/TIER-04.md](history/TIER-04.md).

## Owner sign-off
