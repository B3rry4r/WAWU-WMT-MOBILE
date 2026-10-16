---
id: WALLET-16
title: Earnings land in the wallet automatically
owner: YOU
area: WALLET
order: 98
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-12]
decisions: [R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-16 · Earnings land in the wallet automatically

## Current state

As of 16 Oct 2026, round 2 built (Sonnet builder), waiting for the verifier.
- **Status:** verifying. Round 1 was verified: the code held on every money attack, three mediums stood. Round 2 fixes the three.
- **Branches:** mobile `wmt/WALLET-16` (the tip of this branch; docs and the regenerated contract only). Backend `wmt/WALLET-16` `315b69b` (backend main `56f94d0` merged; the migration is still the one, `20261021180000_earning_settlements`, which the lead renames at merge; round 2 adds none).
- **Merged and live:** nothing of this task.
- **Built in round 2:** F1 and F2 (tests only, the code was right): the rules about the provider's own record (absent is not a failure, pending is not finished, another amount is a stop), the lease (a sale no longer completed sends nothing, two stale readers lease once), the 72nd hour and the Lagos month edge, each killed by a mutant that reads it the other way (14 of 14 killed). F3: a `refused` earning goes to review past the review bound, and so does a `refused` hold (MONEY-18's `WalletHoldService`, the same dead branch), with tests that fail without the fix.
- **Open findings:** nothing medium or worse is open. Lows F6 and F7 are in tasks/SWEEP-MONEY.md. F5 (G-704): /me/earnings answers 0 where /money/earnings answers 433,499 until HOME-14 and HOME-15 write wallet sales.
- **For the lead:** (1) F8 stays yours: before the merge, count the unsettled completed sales with a payee on production (the first sweep pays them all). (2) The review bound for `refused` is counted from when the earning was made (a hold: from when the release or refund was asked for), as the dead code had it, so a refusal that comes after a long wait for a wallet goes to review at its first refusal. A `refusedSince` column would count from the first refusal instead; say if you want it. (3) G-703 is the owner's: earnings under about N155 cost more to move than WAWU's 15%.
- **Next:** the verifier checks round 2 (the 14 mutants in the round 2 builder report are the claim to test). Then the lead merges both branches.
- **Records:** tasks/history/WALLET-16.md, last section "Builder report, round 2".

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-11 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Sales, tips and answered paid questions land in the creator's wallet automatically (R-11). W39 shows where they came from.

## Scope

Per-content earnings breakdown; automatic settlement into the wallet. A creator without a wallet keeps earning; the money waits and lands the moment they open one.

## Capability checks

- [x] Earnings shown equal the sum of that creator's sales after the split.
- [x] A creator with no wallet who earns, then opens a wallet, sees the waiting earnings land once.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-16.md](history/WALLET-16.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
