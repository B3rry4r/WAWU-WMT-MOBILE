---
id: WALK4-FIX
title: Money walk 4 findings (account number never asked for, no ready notice for a dollar account, swap bank charge hidden, swap credit named as a person)
owner: YOU
area: MONEY
order: -1255
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: money-path
status: verifying
depends_on: []
decisions: [R-5, R-10, R-39, R-47, R-84]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WALK4-FIX · Money walk 4: two mediums and two lows

## Current state

As of 28 Oct 2026, built by a Sonnet builder (T2): backend `wmt/WALK4-FIX` `ac2e05b` (patch round 1 on `15bf527`) on `origin/main` `9ac4086`; mobile `wmt/WALK4-FIX` on `origin/main` `8adb95ad` (records only: no app source changed, Android fingerprint unchanged `17ffb13d`). Status verifying. Source: the funded money walk on Nuvion DEV (28 Oct 2026, Hub `9ac4086`, report in the lead's scratchpad `money-walk-4/REPORT.md`). Not run against the real Nuvion (dev or live): the specs use the stand-in.

| # | Before | After |
|---|---|---|
| M-1 | an opened naira account whose details were never requested stayed "on its way" for good if Nuvion's one `accounts.created` delivery was lost: only that delivery asked, and the sweep read only `requested` or `pending` | the opening path asks for the details itself right after it records the account (the delivery's own `ensureDetails`: list first, claim with a conditional update, never a second account); the sweep also asks for the details of an account that has none (no id, no claim, no number) and is older than 5 minutes. A step that cannot finish does not undo the account or fail the opening; the sweep asks later. Servers racing, replays and the delivery together ask once |
| M-2 | a foreign account's ready notice was written only by the `account_details.updated` branch; details the person's own read found active were marked seen and never told; the sweep did not look at foreign accounts | one "Your {currency} account is ready" notice (`wallet_ready`, currency code in the title: "Your USD account is ready") when the details first read active on ANY path: the delivery, the person's own read, or the sweep (`rereadForeignDetails`: open accounts older than 5 minutes and under 3 days, not yet told). One writer (`tellForeignDetailsReady`: `detailsReadyAt` claimed in the notice's transaction), so replays and races write one; a failed notice rolls the claim back and the next path tells |
| L-1 | the swap quote's `providerFeeMinor` was null, so the review said "Shown on your receipt" before the PIN | the quote names a figure (`FX_SWAP_PROVIDER_FEE_<CODE>_MINOR`, 0 unless set; the quote's own wins if a provider names one), so the review draws "Bank charge ₦0.00"; above 0 it is in `totalFromMinor` and the funds check. No app source change: the app already draws the Hub's figure (`feeRows`, test `fxSwapFlow` "swap-fee-bank" `₦0.00`) |
| L-2 | the credit of a swap into naira was told as "Money received / You received ₦920.80 from Swap U." | "Swap complete / Swap: ₦920.80 added to your wallet." (new money-in source `swap`, read from the ledger name the swap itself writes, one shared constant); the correction says "The ₦920.80 added to your wallet by your swap was reversed." |

No migration, no new route, no new field (`contract:build` leaves `contract/openapi.json` unchanged). One optional field on the `wallet_ready` event (`currency`), one new money-in source, one config key (`FX_SWAP_PROVIDER_FEE_<CODE>_MINOR`, `.env.example`).

Decisions (Default (lead), owner may override): (a) the foreign ready notice keeps the `wallet_ready` kind with the currency code in the title (as NUVION-FIX did, G-NUVFIX-1); body "Tap to see it in your wallet." (b) Details already active in the response that opened the account are not news (the person is looking at them). (c) The sweep asks for an account's details only when no request was ever claimed; a `requested` claim with no record stays read-only (NUVION-FIX 9.1), and a lost claim is retried by the delivery's own wait. (d) The swap bank charge defaults to 0 because Nuvion's quote names none and every dev swap charged none (`applicable_fee` 0): G-WALK4-1.

Existing assertions changed because the defect was pinned (each says so in the test): `nuvion-opening.contract.spec` V8 request list (now also `GET /account-details`; that spec's stand-in serves no account-details routes), `fx-money.contract.spec` ("swaps naira to dollars": `providerFeeMinor` null to 0; the 9.6 words now carry the currency; the "already saw ready on a read" case is now "told once on a read", the opened-active case stays silent).

Proof: backend 28 specs, 989 tests EXIT 0 on a seeded `test_w4fix` database (new: `nuvion-walk4-fix.contract.spec` 11 tests for M-1 with races, `walk4-swap-notice-units.spec` 7 tests; extended: `fx-money.contract.spec` with the M-2 delivery, read, sweep and race tests and the L-1 total and funds tests; plus the nuvion opening, reconcile, details-fix, accounts, wallet-ready, fx, world-fx, notification, push-policy, money-contract, wallet-gate-coverage and money-moving-coverage specs); `tsc`, `eslint` on changed files, gates (0 fail), `check_baseline`, `contract:build` EXIT 0. Red first: the M-1 spec ran 9 of 11 red and the units spec 5 of 7 red before the code; the M-2 and L-1 additions were written with the code and run red where the old behaviour was pinned.

Patch round 1 (28 Oct, after the verifier passed M-2, L-1, L-2 and the races on `15bf527`), backend `ac2e05b`: (1) M-1 residual, LEAD RULING: a details request that dies with an unknown outcome (timeout, 5xx, no connection) must not strand the account, so the sweep's unasked pass also takes `requested` rows with no details id (`ensureDetails` lists first and claims only past the resend window, so it never asks twice or makes an account). This supersedes NUVION-FIX 9.1's "the sweep reads, it does not ask" for that one case; the one assertion that pinned it (`nuvion-details-fix` "a request Nuvion lists nothing for") is updated with a comment naming the ruling. The verifier's case (POST /account-details 503 once, delivery lost) is a spec. (2) Each sweep list (naira unasked, naira waiting, foreign) is read a page at a time with the rows already tried left out, 10 pages a pass, so a stuck batch cannot hide newer accounts (specs with a batch of 1 and 2). (3) The person's own read marks a foreign account opened over 3 days ago seen without a notice (same window as the sweep). (4) The `moneyInWords` comment matches the swap words. Proof: walk4-fix, reconcile, details-fix and fx-money specs 70 tests EXIT 0 on `test_w4fix`; tsc, eslint on changed files, gates, `check_baseline` EXIT 0; the new cases ran red first.

Not done: any run against the real Nuvion; the Fintava-double specs (CI runs them: `wallet-gate.contract.spec` and others); app jest (no app source changed); pictures (no screen changed).

## Read first

`DECISIONS.md` R-5, R-10, R-39, R-84; `docs/nuvion/DEV-RESULTS.md` (WALLET-21 rows); backend `src/nuvion/handlers/opening.handler.ts`, `accounts.ts`, `reconcile.handler.ts`, `fx-details-ready.ts`, `src/money/fx/fx-details-ready.ts`, `src/money/money-in-notice/money-in-sources.ts`.

## Goal

Nobody waits for an account number that was never asked for, everyone is told once when a dollar or other account is ready, the swap review shows the bank charge as a figure, and a swap into naira is told as a swap.

## Scope

`wawu-backend`: the files above and their specs. `wawu-wmt-mobile`: these records only.

## Capability checks

- [x] The opening path asks for the account's details; the sweep asks for an account that has none after 5 minutes; neither makes a second account; races ask once.
- [x] A foreign account's ready notice goes out once, with the currency in the words, from the delivery, the person's own read and the sweep, including replays and races.
- [x] The swap quote names the bank charge as a figure before the PIN.
- [x] The swap credit notice does not name the swap as a person.
- [ ] Against the real Nuvion: NOT RUN.
