---
id: POINTS-02
title: Buy points
owner: YOU
area: POINTS
order: 212
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [POINTS-01, TIER-03, TIER-05]
decisions: [R-43, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-02 · Buy points

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: verifying.
- **Branches:** backend `wmt/POINTS-02` `1cf41b0` on `origin/wmt/TIER-05` `36d2004` (it extends TIER-05, which joins batch 7); mobile `wmt/POINTS-02` on `origin/wmt/TIER-05` `7ca6b9f` (this file, SHARED-CHANGES row POINTS-02 #1, contract and API types regenerated).
- **Migration:** none. The stamp `20261025010000` is unused: the payment kind is a text column, the lot is the points service's own `pack` lot keyed by the payment, and the order is TIER-05's table.
- **Built:** `kind: points_pack` with a `packId` on `GET /plans/purchases/quote`, `POST /plans/purchases` and `GET /plans/purchases/{id}`; a new wallet payment kind `points_pack` (WAWU's own sale, not held, target `pack-<id>`), registered beside `tier` and `tier_bump`. New `PointsPackService` (`src/plans/purchases/points-pack.service.ts`) with pure rules and goods beside it. Contract: `docs/contract/PLANS.md` section 9, `WALLET.md` kind table.
- **Every figure is a setting (R-65):** price (`plan.pack.<id>.price_kobo`), points (`plan.pack.<id>.points`), expiry (`points.expiry_months`) and the Founding percent (`plan.tier.<id>.pack_bonus_pct`) are read from the live plan on each call. No literal in code.
- **The bonus:** while the person's tier is running (`active` or `ending`) the tier's percent of the pack's points is added, rounded down; an ended or no tier, or a tier with 0, adds none. The price is the pack's. The checkout bump gets no bonus (it is not a pack). Agent defaults, owner may override.
- **The quote binds price and goods:** the pack, its points, the bonus and the expiry are the payment's terms. Any change since the quote is `409 quote_changed`; the payment keeps them from the claim, so a setting changed while it confirms (or a transfer waits) does not change the lot. A transfer whose terms changed before the money lands is closed, nothing taken.
- **Once (V8):** `PointsService.grant` (source `pack`, ref = the payment id) is the last write of a database-only transaction (it also fixes the billing currency at a first purchase). The same key twice, ten taps at once and a delivery run four times add one lot. No transaction, connection or lock is held across a provider call.
- **By transfer:** TIER-05's orders carry the pack (`PURCHASE_PAYMENT_KINDS`); the tier flow's code and `PLAN_PAYMENT_KINDS` are unchanged. A pack order and a plan order wait side by side; a wallet purchase of the same pack closes a waiting order.
- **TIER-06 round 2, low 2 (done):** `pointsSales` in `plan-setting-rules.ts` counts every pack with the largest bonus of any tier, and `ruleKeys` includes every tier's `pack_bonus_pct`, so a cash rate that fits the pack alone but pays more than a Founding buyer paid is refused (the message names the percent setting).
- **A test I did not write was changed (lead to approve, as with TIER-03's test in TIER-05):** `plan-settings-round2.contract.spec.ts`, the describe "the cash rate can never be set above what points are sold for (finding 7)": its table of sales now counts the Founding bonus, and two cases use rates that fit it (`70_000` instead of `79_000`; `80_000` with pack L at `530_000` instead of `85_000`, bump `90_000`, L `520_000`). Those expectations were the loophole this rule closes. Nothing else in that file changed.
- **Checks:** backend CI on `1cf41b0`: see the Builder report. Local: tsc 0, eslint 0 and prettier on the changed files; 4 new specs (37 cases) pass; the existing plan-settings and purchase specs pass; `contract:build` twice identical.
- **Not done:** capability check 4 (dollar packs) waits for dollar accounts (R-16, NUV-09): no dollar pack is drawn or sold; a dollar-billed person is priced from the file's dollar column and refused `target_not_payable` by the payment service (tested), nothing taken. No screen (PT4 is POINTS-06).
- **Open findings:** none known.
- **Next:** a verifier checks it; the lead merges with batch 7.
- **History:** none yet. Reports go to tasks/history/POINTS-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)

## Goal

A person buys a points pack (PT4) in their own currency, from the wallet or by transfer; a Founding Maker gets the
pack bonus from config ("Founding shows +10%").

## Scope

- `POST /plans/purchases` kind `points_pack` (`packId`), purpose `points_pack`; the lot's expiry is config's bought-points expiry (TIER-01).
- The Founding Maker bonus: the pack's points plus the config percent, rounded down to a whole point.

## Lead note (8 Oct 2026)

From POINTS-01's verification (`tasks/POINTS-01.md`, "Lead rulings after the verifier"):

- **Every caller of the points service:** call `PointsService.grant` or `hold` last in your own transaction, and never wait on a provider while you hold a person's points lock. The service's own transactions use Prisma's 5 s default timeout, so any other points call for that person would fail meanwhile (POINTS-01 verifier, X3; backend `docs/contract/CONVENTIONS.md` section 16).

## Capability checks

- [x] A naira-billed person buys a pack from the wallet: one debit at the config price, one lot of the config points with its expiry.
- [x] A Founding Maker gets the pack plus the config bonus, rounded down.
- [x] The same request twice debits once and grants once (V8); by transfer it completes when the money lands (TIER-05).
- [ ] A dollar-billed person sees and pays only the dollar packs. (Waits for dollar accounts, R-16 and NUV-09: no dollar pack is sold at launch.)

## Builder report

**Builder report: POINTS-02 (Sonnet builder, 17 Oct 2026).** Backend `wmt/POINTS-02` `1cf41b0` on `wmt/TIER-05` `36d2004`; mobile `wmt/POINTS-02` on `wmt/TIER-05` `7ca6b9f`. No provider or wawuafrica.com host called (Fintava double and Nuvion stand-in).

- **Files (backend):** new `src/plans/purchases/points-pack.service.ts`, `points-pack-rules.ts`, `points-pack-goods.ts`, `points-pack-view.type.ts`; changed `plan-purchase.service.ts` (dispatches on the kind), `plan-purchase.dto.ts`, `plan-purchase-terms.ts`, `plan-purchases.controller.ts`, `plan-purchases.module.ts`, `plan-transfer.service.ts` and `plan-transfer-order.ts` (the kind list is `PURCHASE_PAYMENT_KINDS`), `money-enums.ts` (kind `points_pack`), `history-labels.ts` ("Bought points"), `plans-config.ts` (`percentOf`), `plan-setting-rules.ts` and `plan-setting-registry.ts` (the bonus in the cash rate rule), `contract/openapi.json`, `docs/contract/PLANS.md` section 9 and `WALLET.md`.
- **Capability checks:** (1) a naira person buys pack S: one send at the config price (the provider's charge on top), one `pack` lot of the config points ending after the config expiry, the history row "Bought points", the currency fixed by the first purchase; every pack in the file buys at its own price. (2) Founding: 1,005 points x 10 percent = 100.5, the lot is 1,105 (the half point is not given); the percent is the setting (25 gives 25); `ending` still gets it; an ended tier, a tier with 0 and no tier get none. (3) the same key twice: one send, one lot, the replay is the first body; ten taps with one key: one send, one lot; a delivery run four times, two at once: one lot; by transfer: the money lands, one send, one lot, polls under the order id and the payment id agree, later sweeps add nothing, two sweeps at once pay once. (4) waits for dollar accounts (above).
- **Quote binds:** price, points, expiry and a person becoming Founding after the quote are each `409 quote_changed`; a setting changed while the payment confirms (provider times out, then the sweep) adds the quoted points, not the new ones; by transfer a changed price or points, or a Founding tier that ended before the money landed, closes the order with nothing taken.
- **Refusals:** unknown pack 404 `target_not_found`; malformed or missing `packId`, a `tierId` or `bump` with a pack, a `packId` with a tier kind: 400; not enough money 402 with the shortfall and the key given back; no wallet 409 `wallet_not_open`; dollar-billed 409 `target_not_payable` (nothing taken or added).
- **Specs (mine):** `points-pack.contract.spec.ts` (16), `points-pack-transfer.contract.spec.ts` (7, Nuvion stood in), `points-pack-rules.spec.ts` and `plan-setting-rules-bonus.spec.ts` (14). Changed (lead to approve): `plan-settings-round2.contract.spec.ts` finding 7 (see Current state). My cash rate cases fail on the old rule (they need the bonus counted).
- **Checks:** backend CI on `1cf41b0` all green: Branch checks run 39014180950 (contract, three suite shards, netns, baseline, deploy-test-in-sync), Gates run 39014180965, Protected routes (V3) run 39014180970. Local: tsc 0; eslint 0 and prettier on the changed files; `contract:build` twice identical. Mobile full check (typecheck, lint, 188 suites and 3,258 tests, gates, tasks): all passed; the tasks step first asked for `check_tasks.py --write` (PROGRESS.md follows the new status), done and rechecked.
- **Shared changes:** SHARED-CHANGES POINTS-02 #1 (contract and API types). No migration, no schema change. No gaps filed: the fields PT4 needs (price, points, bonus, expiry, status, transfer details, grant) are served.
- **Not done:** capability check 4 (dollar accounts); no screens, so no pictures; the dollar path is untested beyond the refusal.
- **Left for the sweep list (low):** the Founding bonus is judged from the tier's state when the quote is given, not re-read at delivery (deliberate: the quote binds it); `GET /plans` still lists the dollar pack figures (it did before; nothing sells them).

## Verifier report

## Owner sign-off
