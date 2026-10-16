---
id: FIX-40
title: The daily limit no longer counts a held payment that was refunded
owner: YOU
area: MONEY
order: 291
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [WALLET-23, BILLS-04]
decisions: [R-19]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-40 · The daily limit no longer counts a held payment that was refunded

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Built on `wmt/BILLS-04` (`ba5e043`): backend `wmt/FIX-40` `79cf759`. Found by the BILLS-04 verifier (finding 2 of round 1, finding 3 of round 2). Filed after-launch at order 291, because it depends on WALLET-23, which is after launch.
- **What was wrong:** `movedSince` (`src/money/limits/money-limits.service.ts`, WALLET-23) added up every completed `out` row of the person, so a bill that failed and was refunded still used up the day. With a one-bill limit the next bill answered `403 limit_reached`. The same held for a refunded paid DM and a refunded ticket.
- **What it does now:** a payment whose hold is `refunded` is not counted. The database allows `refunded` only with the whole price back, so a refund that is decided, waiting, sent or not yet confirmed leaves the hold `held` and the payment still counts. A completed bill, a released hold and a payment with no hold count as before. Window rules are unchanged (Lagos day and month).
- **Not changed:** `AccountLimits.movedToday` (the provider's own daily limit on the account) still counts a refunded payment, because the provider counts the debit. No route, schema or contract change.
- **Open findings:** none yet.
- **Next:** an independent verifier.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/BILLS-04.md` and its history (the verifier's finding), `tasks/WALLET-23.md`

## Goal

One failed bill must not make the next bill fail on the daily limit. Every held payment kind (bill, paid DM, event ticket) is netted the same way.

## Scope (backend only)

`MoneyLimits.movedSince` reads the person's refunded holds settled since the window began and leaves their payments out of the sum (the null `paymentId` of a send is kept). Specs: `src/money/limits/tests/money-limits-refund.contract.spec.ts` (the three kinds, the windows, pending and unconfirmed refunds, released holds, sends, another person's payments) and `src/wallet-bills/tests/wallet-bill-daily-limit.contract.spec.ts` (the whole bill flow with a one-bill limit).

## Capability checks

- [ ] A refunded bill does not use up a one-bill daily limit; the next bill is quoted `withinDailyLimit: true` and is paid.
- [ ] A delivered bill still uses it up: the one after is `403 limit_reached`.
- [ ] A refund that is decided, sent or unconfirmed counts as still moved until the hold is `refunded`.
- [ ] The same for a paid DM and a ticket, in the day and in the month.
- [ ] Backend `tsc --noEmit` and eslint on the touched files exit 0; CI gates show the same FAIL lines as the base.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-40.md](history/FIX-40.md).

## Owner sign-off
