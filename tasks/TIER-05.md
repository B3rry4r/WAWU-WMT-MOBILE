---
id: TIER-05
title: Pay by bank transfer at checkout
owner: YOU
area: VERIFY
order: 211
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [TIER-03, NUV-04]
decisions: [R-42, R-43, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-05 · Pay by bank transfer at checkout

## Current state

As of 17 Oct 2026, builder round 3 done (Sonnet builder): one small fix after the round 2 verifier's `merge` verdict (finding 1, a low, which the lead ruled to fix). Status: merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/TIER-05-r2.md`, round 1 verdict fix, one high; round 2 verdict merge, nothing medium or worse); round 3 fixed a low and the lead accepted it on review. Stacked in batch 7 (backend and mobile `wmt/MERGE-7`).
- **Branches:** backend `wmt/TIER-05` `36d2004` (round 3; round 2 was `f992f4a`, round 1 `2f88409`, feature `30c3e73`) on `origin/wmt/MERGE-6` `fbf391f` (batch 6); mobile `wmt/TIER-05` on `origin/wmt/MERGE-6` `70a7895` (docs, SHARED-CHANGES rows #1 and #2, contract and API types regenerated from the backend branch, LOG, PROGRESS). wawu-id and web untouched.
- **Migration:** `20261024230000_plan_transfer_orders` (renamed from `20261024210000_plan_transfer_orders` at merge, after HOME-17's `20261024220000`): one new table `PlanTransferOrder`. Additive. Rollback: `DROP TABLE "PlanTransferOrder"`.
- **Built:** `method: "transfer"` on `POST /plans/purchases` (kinds `tier`, `renew`, `upgrade`, with or without the bump). Same PIN, Idempotency-Key and quote checks as the wallet; no money moves. The answer (`PlanTransferOrderView`, `awaiting_transfer`) carries the person's own wallet account number, bank, account name, the Bank charge, the total and `amountNeededKobo` (total less the provider's available balance, never below 0). The sweep pays the order through the SAME wallet payment as `method: wallet` once the provider's balance covers the total, so grants, limits and refunds are unchanged. `GET /plans/purchases/{id}` reads `awaiting_transfer`, `pending`, `paid` (same id, `method: transfer`), `expired` or `failed`.
- **Exactly once:** one conditional write takes the order (`awaiting` to `settling`); the payment is made under the key `transfer:<orderId>` (a person can never send it: the colon is outside the Idempotency-Key format); the wallet payment's `openKey` allows one open payment per person and item. Ten settlements at once, a second credit row, a later transfer, two sweeps: one payment, one grant. A claim that dies is recovered from its key (`recoverStale`).
- **The quote binds:** price, goods (TIER-06 terms) and Bank charge total are kept with the order. If any differs when the money lands, the order closes (`failed`, message) and nothing is taken. A wallet purchase of the same item, or asking again, closes the waiting order.
- **Window:** admin setting `plan.transfer_window_hours`, default 24, PROVISIONAL(PLAN-TRANSFER-WINDOW). After it: `expired`, nothing taken, any money sent stays in the wallet.
- **Never across the network:** the provider is called holding no transaction or lock (checked: 20 requests while the provider takes 3 s, another person's `GET /me/tier` under 1 s).
- **Round 2 (the verifier's findings, report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/TIER-05.md`):** (1 high) the sweep reads every waiting order and settles the people who are due, a new credit first, then a recheck that came, oldest first, within a time budget (70 unfunded orders ahead of a funded one: it pays on the next sweep; 500 unfunded and 5 funded: all 5 pay in one sweep). (2) a lapsed order whose payment was made is linked, never expired. (3) the settlement key cannot be sent by a person. (4) a refused payment is let go of and the order waits again (backoff), or expires if the window lapsed; never two payments. (5) the `oneOf` answers stay. No schema or contract change: round 2 added no migration. Details: tasks/history/TIER-05.md. Backend CI on `f992f4a`: Gates run 39009379051, Protected routes (V3) run 39009379056, Branch checks run 39009379050, all green (9 of 9 checks). Mobile full check (typecheck, lint, 188 suites with 3258 tests, gates, tasks): EXIT 0.
- **Round 3 (one fix, the round 2 verifier's finding 1, report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/TIER-05-r2.md`):** the provider's limits are shared by every WAWU payment, so no order calls it on every sweep. A provider error used to leave the order due on every sweep while a credit was newer than the order's last look (50 funded orders with a 503 balance read: 50 reads in each of 4 sweeps, about 6 a second). Now every wait after an error marks the credit the sweep saw, so the order waits for its next check time (1, 2, 4 ... 16 minutes) unless a NEWER credit arrives: 50 reads in the first sweep, 0 in the next three, 50 again at the check time; a new credit for one person wakes only that person; the send-refused path is unchanged; a person over a daily or other limit is tried at the backoff times only. Change: `plan-transfer.service.ts` only (settleOrder's catch, afterRefusal's unclassified, limit_reached and daily_limit_exceeded branches, and the "other payment confirming" wait, which had the same loop); 7 new contract cases in `plan-transfer-provider-errors.contract.spec.ts`. No schema or contract change, no migration. Backend CI on `36d2004`: Gates run 39012072136, Protected routes (V3) run 39012072222, Branch checks run 39012072202, all green (9 of 9 checks). Mobile: docs only (gates and tasks checks).
- **Checks (round 1):** backend CI on `2f88409`: Gates run 39006623443 green; Protected routes (V3) run 39006623455 green; Branch checks run 39006623620 green (contract, all three suite shards, netns, baseline, deploy-test-in-sync). Local: tsc 0, eslint 0 on the changed files, 5 new unit tests and 16 new contract tests green, `contract:build` twice identical. Mobile full check (typecheck, lint, 188 suites with 3258 tests, gates, tasks): EXIT 0.
- **TIER-03's test (lead's approval, 17 Oct 2026):** `plan-purchase.contract.spec.ts:926` posted `method: 'transfer'` and expected 400, the boundary this task removes. It now posts the unsupported method `'card'` with the same 400 expectation; nothing else in that file changed.
- **Decided (lead's rulings, 17 Oct 2026):** when an older waiting purchase is not covered but a younger one is, paying the younger is right (built so; each is paid only while the balance covers it); a second request for the same item closes the first; the window stays 24 hours as the admin default (PLAN-TRANSFER-WINDOW) and the owner is asked.
- **Amount needed leaves out an inbound transfer fee:** the Hub has no add-money quote, so `amountNeededKobo` is the total less the balance. If the provider takes a fee on the credit (`NUVION_FEE_INFLOW`), the person lands a little short and the order stays waiting with the new, smaller amount.
- **Not built (not in this task):** the screens (VF6 transfer details, PT4); the pack and extra-product purchase kinds (TIER-04, POINTS-02) which add their payment kinds to the same order engine.
- **Open findings:** none known after round 3 (round 1: 1 high and 3 lows, all fixed; round 2: the provider-error retry loop, fixed in round 3; the one note kept). Round 3 not yet checked. Not fixed, a low for the sweep list (the round 2 verifier's residual a, not part of round 3): a payment that is `pending` when linked and fails later still leaves the order `settled` with a failed payment (the person starts again, as with any wallet payment).
- **Owner question (the lead asks):** is 24 hours the right transfer window? It is an admin setting, changeable at any time.
- **Next:** the lead merges it with batch 7.
- **History:** tasks/history/TIER-05.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 18f0eb09, verifier PASS in the lead's merge log, 17 Oct (v TIER-05 r2 MERGE).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/NUV-04.md` (the account number and money in)

## Goal

At checkout a person can choose bank transfer (VF6 "transfer details shown", PT4): they see their own wallet
account number and the amount still needed, send it from any bank app, and the purchase completes from their
wallet the moment the money lands. Default (agent), owner may override: the transfer goes into the person's own
wallet (R-42: money comes in by bank transfer only, into the person's own account number); WAWU runs no separate
collection account.

## Scope

- `method: transfer` on `POST /plans/purchases`, for every purchase kind: confirmed with the PIN at checkout; the purchase waits as `awaiting_transfer` for `PROVISIONAL(PLAN-TRANSFER-WINDOW, ...)`; the answer carries the account number, bank, account name and the amount still needed (price minus the available balance, never below zero).
- When money in is credited (NUV-04 through the ledger, MONEY-10) and the available balance covers a waiting purchase, it is paid through the same path as TIER-03, once, oldest first.
- A lapsed window marks the purchase `expired`; the money stays in the wallet and nothing is taken.
- `GET /plans/purchases/:id` shows `awaiting_transfer`, `paid` or `expired` and the amount still needed.

## Capability checks

- [ ] A person choosing transfer sees their account number, bank, name and the amount still needed; once a transfer of that amount lands (a stand-in inflow), the purchase completes once and grants once.
- [ ] Less than needed leaves the purchase waiting with the new amount still needed; more completes it and leaves the rest in the wallet.
- [ ] The inflow delivered twice, or a delivery and the sweep finding it, completes the purchase once (V8).
- [ ] After the window the purchase is expired and the money stays in the wallet; nothing is taken without the PIN given at checkout.
- [ ] Two waiting purchases are paid oldest first, each once, and only while the balance covers it.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/TIER-05.md](history/TIER-05.md).

## Owner sign-off
