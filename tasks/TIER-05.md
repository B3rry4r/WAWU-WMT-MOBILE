---
id: TIER-05
title: Pay by bank transfer at checkout
owner: YOU
area: VERIFY
order: 211
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [TIER-03, NUV-04]
decisions: [R-42, R-43, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-05 · Pay by bank transfer at checkout

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs TIER-03, NUV-04 built first.
- **History:** none yet. Reports go to tasks/history/TIER-05.md.

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

## Builder report

## Verifier report

## Owner sign-off
