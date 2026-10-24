---
id: FIX-52
title: On Nuvion, WAWU's fee on a send is collected, so the person pays exactly the quote
owner: YOU
area: MONEY
order: 132
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
- **Status:** merging (lead). Round 2 checked by an independent verifier (report `scratchpad/verify/FIX-52.md`, verdict pass); stacked in batch 10 by MERGE-10 (backend `773a9ee` merged into `wmt/MERGE-10`, no migration). Backend `wmt/FIX-52` `773a9ee` (round 1 `d865efb`, from `wmt/MERGE-7` `432f017`).
- **Found by:** INBOX-15 round 2 finding 2; round 1 verifier report (`scratchpad/verify/FIX-52.md`, findings 1 to 5).
- **Builder report, round 2** (lead rulings, 17 Oct; the owner may override):
  - Finding 1: WAWU's fee now moves FIRST (book transfer `<send ref>-fee`), in the request and in the sweep. Refused: nothing else moves, the person is told (402/503 as a send refusal). Unfinished: the send waits, nothing sent; the sweep or the fee's delivery then makes the send.
  - Finding 2: the delivery handler reads the fee transfer's own record, never the fee as quoted; a send whose fee never moved is written at the send alone. Ledger equals the stand-in on the inline and the delivery path.
  - Finding 3: a fee Nuvion fails (not insufficient funds only) fails the send before anything moves; a transient outage only waits.
  - Finding 4: a send that fails, or is reversed before or after it completed, gives the fee back (`<send ref>-fee-back`, once, retried by the sweep); a completed send Nuvion reverses becomes `reversed`.
  - Finding 5: the fee transfer's delivery wakes the send (`LedgerService.wakeTransfer`); Nuvion's charge is taken on the leg actually moved.
  - Not changed: no schema, no route, no Fintava file. Bank sends use the same code; the sweep's own bank payout (after a pending fee) is not covered by a spec, the stack check should drive it.
- **Checks:** tsc 0, eslint 0, gates passed; fee spec 8 of 8 (all 8 fail on `d865efb`); Nuvion transfer, book and unit specs 8 suites, 172 tests, EXIT 0.
- **Order:** filed as 135, which FIX-47 holds; MERGE-10 gave it 132 (free).
- **Sweep list (lows, not fixed, in SWEEP-MONEY):** the sweep's bank payout after a pending fee waits for `moneyTimeoutMs`; WAWU bears Nuvion's 200 kobo on the fee and the fee back (by design).
- **Next:** the batch 10 pull request.

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

- [x] Fee first: the fee transfer is made before the send; the person is debited the quote to the kobo; one fee through replays, parallel taps, sweeps and settling again.
- [x] A balance spent between two sends cannot evade the fee: the send that cannot be paid fails whole and its fee comes back.
- [x] Fee pending: the send waits, nothing sent, one fee transfer; fee failed: nothing else moves, person whole.
- [x] Send failed after the fee: fee returned once. Completed send reversed later: fee returned, send reversed.
- [x] The fee's delivery wakes the send; the ledger row equals what Nuvion moved on the delivery path.

## History

Round reports, verifier reports and lead notes: [history/FIX-52.md](history/FIX-52.md).

## Owner sign-off

Not needed.
