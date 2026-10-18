---
id: FIX-80
title: The nightly money check compares WAWU's account over one stretch on both sides, and reads a reversal and a bank return as one move
owner: YOU
area: FIX
order: -80
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-80 · The nightly money check compares WAWU's account over one stretch on both sides, and reads a reversal and a bank return as one move

## Current state

As of 18 Oct 2026, verifying (round 2 built by a Sonnet builder, tier T2, after the check's PASS with F1 to F4; not yet checked again). Backend `wmt/FIX-80` from `wmt/FIX-67` `b75e01a`; this record and the gap rows on mobile `wmt/FIX-80` from `wmt/FIX-67`. Product code: the nightly check only (reads and reports; moves no money, edits no row). No schema, no Fintava file, no app code, no `src/fintava` import.
- **F1 (high), WAWU's balance on a launch-length history, round 2 (check F1 medium, F3 low):** round 1 cut the history at a quiet stretch of 2 minutes, so a busy account was never compared (`wawu_balance_not_compared` under a `clean` verdict) and a row and its line on opposite sides of a time cut read a false `balance_differs`. Now the cut is a provider statement line: the newest completed line from before the window (its running balance is the opening; the completed lines either side of it must follow from it), or before the first line when the whole history was read. The ledger side is the merchant rows whose provider line comes after the cut, found by reference (no time decides it), plus the rows with no provider line yet (pending ones of any age; others when no older than the cut line). A reversed row whose debit is before the cut and whose money came back after it counts as the money coming back. When WAWU's account is still not compared (no line states a balance to start from, the pages ran out, the ledger kept moving) the `balances` check is `incomplete`, names WAWU's account, and the night is `incomplete`, never `clean`.
- **F4 (low):** `money-check-nuvion.contract.spec.ts` deletes only the nights it made (its own year), its references, wallets and accounts, and checks that nothing of it is left. Not reproduced here (the spec and `wallet-transfer-wawu-fee-nuvion` passed in either order, in one process and across two, from a fresh database); the guard turns any leftover into this spec's own failure.
- **F2 (medium, G-FIX-67-4), a reversal or a bank return:** a statement line that gives a move back is matched to it. The adapter's reader marks a line whose reference is `<move>_reversal` as `returnOf` (`src/nuvion/fee-legs.ts`, as it marks a fee leg), and the ledger's own `reversalReference` is tried too. A completed line of the other direction, for no less than the move's amount and no more than it took, that gives back a row the ledger holds as `reversed`, makes the original pair agree (no `status_differs`) and is counted as the notice `reversal_returned`. A reversed row with no return, a return for the wrong amount, a return the ledger does not hold as reversed, and a line going the same way are all still named. A row reversed lately is read whatever its age (a bank can return a send days later).
- **G-FIX-67-5 (low):** a completed row whose whole note is the explained-charge note for the charge the row itself holds stays explained after its provider line has left the window (judged from the row's own figures); a row whose figures and note disagree stays a difference.
- **Specs:** `money-check-nuvion.contract.spec.ts` (27: round 2 replaced the one that pinned the quiet-stretch limit, and added a busy account every 30 seconds reading clean and compared, a shortfall and a surplus named in it, ledger dates hours from their lines either side of the cut reading clean, a payout the bank returned days later reading clean, a statement with no balance and one longer than the pages read both giving `incomplete`; 7 of them are red on `bce6696`), `money-check-fix80.spec.ts` (pure, 23: where a statement is cut and which ledger rows fall after it).
- **On a stack (Nuvion stand-in, ports 7800 to 7807, 18 Oct 2026):** 2 funded wallets, 18 WAWU sends, 2 of them reversed at the stand-in, then a burst of 130 sends (WAWU's statement of over 150 lines, more than a page): `clean`, balances 3 of 3 compared (WAWU's account included), `reversal_returned` 4, `fee_given_back` 2. Plants, each named and then put back to `clean`: a merchant row +700 in the ledger (`amount_differs` and `balance_differs` 700 less); a merchant row failed in the ledger (`status_differs` and `balance_differs` 1000 more). The stack's history is shorter than the check's 6 hour margin, so it read the whole statement; the cut at a statement line is proved by the contract specs.
- **Gaps named:** G-FIX-80-6 (a retroactive edit older than the cut reads clean; what it would take), G-FIX-80-7 (a provider with no balance on any line is not balance-compared).
- **Not done:** G-FIX-80-4 (a duplicated ledger row is named on one of its two rows), G-FIX-80-5 (the reference of a book-transfer reversal on the real Nuvion statement is not documented).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `scratchpad/verify/FIX-67.md` (F1 to F4), BACKEND_GAPS G-FIX-67-4, G-FIX-67-5, G-FIX-80-1 to 5

## Goal

On a real account's history the nightly check proves zero differences, and a reversal or a bank return is not one.

## Capability checks

- [ ] A WAWU account whose history is longer than the window reads `clean`, not `balance_differs`.
- [ ] A real shortfall or surplus in WAWU's account inside the window is still named.
- [ ] A reversed WAWU send and a reversed bank send read `clean` when the money came back.
- [ ] A reversal the provider never returned is still named.
- [ ] On a stack: the FIX-67 walk plus a reversal and a return reads `clean`; the plants are named.

## Owner sign-off

Not needed.
