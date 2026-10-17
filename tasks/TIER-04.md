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

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: verifying.
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

## Builder report

**Builder report: TIER-04 (Sonnet builder, 17 Oct 2026).** Backend `wmt/TIER-04` `0a0fc44` on `wmt/POINTS-03` `ebe76de`; mobile `wmt/TIER-04` on `wmt/POINTS-03` `a14ce45b`. No provider or wawuafrica.com host called. Every money check ran on the Nuvion stand-in (R-39, R-45); nothing was built or changed for Fintava.

- **Files (backend):** new `src/plans/purchases/extra-products.service.ts`, `extra-products-rules.ts`, `extra-products-goods.ts`, `extra-products-view.type.ts`, migration `20261025030000_maker_extra_products`; changed `plan-purchase.service.ts` (dispatches on the kind), `plan-purchase.dto.ts`, `plan-purchase-terms.ts` (`EXTRA_PRODUCTS_KIND` in `PURCHASE_PAYMENT_KINDS`), `plan-purchase-rules.ts` (a refusal may be `tier_required`), `plan-purchases.controller.ts`, `plan-purchases.module.ts`, `plan-transfer.service.ts` (`tier_required` closes a waiting order), `money-enums.ts`, `money-contract.ts`, `history-labels.ts` ("Plan add-on"), `prisma/schema.prisma`, `account-data-map.ts`, `data-export-sections.ts`, `docs/contract/PLANS.md` section 10, `WALLET.md`, `CONVENTIONS.md`, and the regenerated `contract/openapi.json`.
- **Capability checks:** (1) a person at 3 of 3 (the gate says `product_limit_reached`) buys the add-on: one send at the config price with the provider's charge on top, `extraProducts` 5, `GET /me/tier` and the allowance say 8, the gate lets exactly 5 more through and refuses the next, the history row reads "Plan add-on". (2) The same key twice replays the first answer without checking the PIN; ten taps with one key and ten with ten keys take one payment each; a delivery run five times (and four at once) adds once; a second add-on is a second purchase. (3) With no tier, and with an ended tier, the quote and the purchase are 402 `tier_required` (with the sentence for each), nothing is debited, no payment, key, tier row or billing currency is written, and the same key buys once a tier runs. (4) After the tier ends and is renewed through the real renew route, and after an upgrade, the bought products still count.
- **Quote binds:** a changed price or count is `409 quote_changed`; a count changed while the payment confirms (provider times out, then the sweep) adds the quoted count; by transfer a changed price or count, or an ended tier, closes the order with nothing taken and the money stays in the wallet.
- **Refusals:** a `tierId`, `packId` or `bump` with the add-on: 400 (quote and purchase); a tier kind without `tierId`: 400; not enough money 402 `insufficient_funds` with the key given back; no wallet 409 `wallet_not_open`; wrong PIN 403; dollar-billed 409 `target_not_payable` (nothing taken or added).
- **Specs (mine):** `extra-products.contract.spec.ts` (23), `extra-products-transfer.contract.spec.ts` (8), both on the Nuvion stand-in (the harness still starts its Fintava double; nothing reaches it), `extra-products-rules.spec.ts` (9). No spec I did not write was changed.
- **Checks:** backend CI on `0a0fc44`: all green: Branch checks run 39027882606 (contract, three suite shards, netns, deploy-test-in-sync), Gates run 39027882620 (with the baseline check), Protected routes (V3) run 39027882624. Local: tsc 0; eslint 0 and prettier on the changed files; `contract:build` twice identical and additive (enum values, `oneOf` members and descriptions only). Before the lead's Nuvion-only note I ran related existing specs, some of them on the Fintava double (nothing there was edited): `src/plans/purchases`, money-contract, history, payment units, purge map, export map, plans contract, wallet-gate and money-moving coverage, plan-settings: 458 of 461; the three that failed are TIER-05 sweep-budget specs (`plan-transfer-sweep.contract.spec.ts` two cases, `plan-transfer-provider-errors.contract.spec.ts` R1) that count how many orders one time-boxed sweep gets through under a machine load of about 10; the sweep spec passed 11 of 11 on my tree on a rerun and failed one case on the unchanged base `ebe76de` in the same conditions, and I changed no line they run (CI is green; nothing was re-run to make it pass). Mobile full check: typecheck 0, lint 0, jest 188 suites and 3,258 tests with 2 failing under a load average of about 20 (`HomeScreen.test.tsx` 'creators that fail to load' and `eventsFocus.test.tsx` 'asks for the tiers again', screens this task does not touch; both 35 of 35 pass alone on a rerun, and the chain stopped there), then `npm run gates` and `npm run tasks` both exit 0 (330 tasks, 349 artboards). Only generated API types, the contract copy and docs changed on mobile.
- **Shared changes:** SHARED-CHANGES TIER-04 #1 (contract and API types), #2 (schema, migration, purge map, export), #3 (shared money files). Fenced files touched: `prisma/schema.prisma` (the additive model the brief's migration stamp names) and `contract/openapi.json` (regenerated).
- **Not done:** the dollar path (R-16, NUV-09); no screens, so no pictures (`artboards: []`, VF13 is a later screen task).
- **Left for the sweep list (low):** `GET /plans` still lists the add-on's dollar price (it did before; nothing sells it). `MakerTier.extraProducts` is a running total beside the per-purchase rows; no check compares them (the gate reads the total).

## Verifier report

## Owner sign-off
