---
id: FIX-52
title: On Nuvion, WAWU's fee on a send is collected, so the person pays exactly the quote
owner: YOU
area: MONEY
order: 135
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# FIX-52 · On Nuvion, WAWU's fee on a send is collected, so the person pays exactly the quote

## Current state

As of 17 Oct 2026.
- **Status:** built, waiting for an independent verifier. Backend `wmt/FIX-52` from `wmt/MERGE-7` `432f017`.
- **Found by:** INBOX-15 round 2, finding 2 (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-15.md`): the quote total was 101,000 kobo and the person was debited 100,000.
- **Open findings:** none yet.
- **Next:** a verifier attacks it on the Nuvion stand-in (the stack, `WALLET_PROVIDER=nuvion`); then the lead merges.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-10 (the person pays the provider's fee plus WAWU's), R-39, R-42; NUV-07 (the fee settings)

## Goal

A quote on the Nuvion path is amount + Nuvion's charge + WAWU's fee. Nuvion's `applicable_fee` is Nuvion's own, and a transfer has no field for a fee of ours, so WAWU's fee never reached the operational account. Routes that quote a WAWU fee: `POST /money/transfers/wawu`, `POST /money/transfers/bank` (a withdrawal is a bank send), and the pay route of a money request (it sends through the first). Wallet payments, holds, points to cash and bills quote no WAWU fee (purchases: R-10; bills are off on Nuvion).

## Scope (backend only; no Fintava file, no route, no schema)

- Once a send is confirmed (its answer, the sweep or the delivery), WAWU's fee moves as its own book transfer from the sender to the operational account, reference `<send reference>-fee`. One reference is one transfer, so replays, sweeps and a second completion never move it twice.
- Nuvion's charge for moving it comes out of the fee, so the person pays the quote to the kobo. A fee not above that charge is not collected (logged).
- A send that fails or is reversed never has a fee leg, so there is nothing to give back. A fee Nuvion has not finished keeps the send pending (asked again, never repeated). A balance spent in between completes the send at what really left, with a note on the send.
- The Nuvion delivery writes the ledger row with WAWU's fee as quoted. The seam gains one optional flag, `WalletProvider.wawuFeeLeg`, true only on Nuvion.

## Capability checks

- [x] Before the fix the new spec fails: `debit differs from the quote: Nuvion took 200150 kobo (fee 150), quoted 201150 kobo (fee 1150)`.
- [x] After: debit equals the quote, ₦8.50 of the ₦10 reaches the operational account once (Nuvion charges ₦1.50 to move it), through replay, sweeps and settle again; the ledger row and the send show the fee as quoted. 7 of 7.
- [x] Failed and reversed sends: no fee leg, payer whole, operational account unchanged.
- [x] Fee leg pending at Nuvion: the send stays pending, one fee transfer, completes once Nuvion finishes it.
- [x] Completion by the Nuvion delivery, and a bank send completed from the ledger row the bank handler writes.
- [x] The existing Nuvion specs pass (299 of 299 with the new one); `tsc`, eslint on the changed files exit 0.

## History

Round reports, verifier reports and lead notes: [history/FIX-52.md](history/FIX-52.md).

## Owner sign-off

Not needed.
