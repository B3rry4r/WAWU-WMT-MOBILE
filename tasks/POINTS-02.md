---
id: POINTS-02
title: Buy points
owner: YOU
area: POINTS
order: 212
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [POINTS-01, TIER-03, TIER-05]
decisions: [R-43, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# POINTS-02 · Buy points

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-02.md`, verdict merge, nothing medium or worse; lows go to tasks/SWEEP-MONEY.md). Stacked in batch 7 by MERGE-7f.
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
- **Next:** the lead merges with batch 7 (stacked here by MERGE-7f; the migration stamps are unchanged, the backend has no migration of its own).
- **History:** none yet. Reports go to tasks/history/POINTS-02.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 18f0eb09, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-02.md](history/POINTS-02.md).

## Owner sign-off
