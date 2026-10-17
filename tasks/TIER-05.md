---
id: TIER-05
title: Pay by bank transfer at checkout
owner: YOU
area: VERIFY
order: 211
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [TIER-03, NUV-04]
decisions: [R-42, R-43, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-05 · Pay by bank transfer at checkout

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: verifying (not yet verified).
- **Branches:** backend `wmt/TIER-05` `2a233c0` (feature `30c3e73`) on `origin/wmt/MERGE-6` `fbf391f` (batch 6); mobile `wmt/TIER-05` on `origin/wmt/MERGE-6` `70a7895` (docs, SHARED-CHANGES rows #1 and #2, contract and API types regenerated from the backend branch, LOG, PROGRESS). wawu-id and web untouched.
- **Migration:** `20261024210000_plan_transfer_orders`: one new table `PlanTransferOrder`. Additive. Rollback: `DROP TABLE "PlanTransferOrder"`.
- **Built:** `method: "transfer"` on `POST /plans/purchases` (kinds `tier`, `renew`, `upgrade`, with or without the bump). Same PIN, Idempotency-Key and quote checks as the wallet; no money moves. The answer (`PlanTransferOrderView`, `awaiting_transfer`) carries the person's own wallet account number, bank, account name, the Bank charge, the total and `amountNeededKobo` (total less the provider's available balance, never below 0). The sweep pays the order through the SAME wallet payment as `method: wallet` once the provider's balance covers the total, so grants, limits and refunds are unchanged. `GET /plans/purchases/{id}` reads `awaiting_transfer`, `pending`, `paid` (same id, `method: transfer`), `expired` or `failed`.
- **Exactly once:** one conditional write takes the order (`awaiting` to `settling`); the payment is made under the key `transfer-<orderId>`; the wallet payment's `openKey` allows one open payment per person and item. Ten settlements at once, a second credit row, a later transfer, two sweeps: one payment, one grant. A claim that dies is recovered from its key (`recoverStale`).
- **The quote binds:** price, goods (TIER-06 terms) and Bank charge total are kept with the order. If any differs when the money lands, the order closes (`failed`, message) and nothing is taken. A wallet purchase of the same item, or asking again, closes the waiting order.
- **Window:** admin setting `plan.transfer_window_hours`, default 24, PROVISIONAL(PLAN-TRANSFER-WINDOW). After it: `expired`, nothing taken, any money sent stays in the wallet.
- **Never across the network:** the provider is called holding no transaction or lock (checked: 20 requests while the provider takes 3 s, another person's `GET /me/tier` under 1 s).
- **Checks:** backend CI on `2a233c0`: Gates run 39005746925 green; Protected routes (V3) run 39005746956 green; Branch checks run 39005746968 red on ONE test (below), every other check green (contract, shards 2 and 3, netns, baseline, deploy-test-in-sync), shard 1: 4460 of 4461 tests pass. Local: tsc 0, eslint 0 on the changed files, 5 new unit tests and 16 new contract tests green, `contract:build` twice identical. Mobile full check (typecheck, lint, 188 suites with 3258 tests, gates, tasks): EXIT 0.
- **Known red (one test, not edited):** `src/plans/purchases/tests/plan-purchase.contract.spec.ts:926` (TIER-03's) posts `method: 'transfer'` and expects 400, the boundary this task removes. Not mine to edit. Intent-preserving fix for the lead: send an unsupported method such as `'card'` there (still 400).
- **Decided (default, owner may override):** a younger waiting purchase is paid when the balance covers it even if an older one is not covered yet (each is paid only while the balance covers it); a second request for the same item closes the first; the window is 24 hours.
- **Amount needed leaves out an inbound transfer fee:** the Hub has no add-money quote, so `amountNeededKobo` is the total less the balance. If the provider takes a fee on the credit (`NUVION_FEE_INFLOW`), the person lands a little short and the order stays waiting with the new, smaller amount.
- **Not built (not in this task):** the screens (VF6 transfer details, PT4); the pack and extra-product purchase kinds (TIER-04, POINTS-02) which add their payment kinds to the same order engine.
- **Open findings:** none known. Not yet verified.
- **For the lead (owner questions):** (1) is 24 hours the right window (PLAN-TRANSFER-WINDOW, an admin setting)? (2) should a younger waiting purchase be paid when an older one is not covered yet (built: yes), or should the oldest block the rest?
- **Next:** a verifier; the lead merges with batch 7.
- **History:** tasks/history/TIER-05.md.

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
