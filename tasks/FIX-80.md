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

As of 18 Oct 2026, verifying (built by a Sonnet builder, tier T2, not yet checked). Backend `wmt/FIX-80` from `wmt/FIX-67` `b75e01a`; this record and the gap rows on mobile `wmt/FIX-80` from `wmt/FIX-67`. Product code: the nightly check only (reads and reports; moves no money, edits no row). No schema, no Fintava file, no app code, no `src/fintava` import.
- **F1 (high), WAWU's balance on a launch-length history:** the opening was taken off a partial statement (the walk stops once a page reaches before the window and still said `complete`) and compared with the merchant ledger summed since the beginning, so any account older than the window read a false `balance_differs ref=wawu-account` every night. Now `history()` says whether it `reachedStart`. A history read to the account's first line keeps the whole-ledger compare. A longer one is cut at the middle of the longest stretch (at least 2 minutes) in the part read where neither the provider nor the merchant ledger has a move, so the two sides' times for one move cannot fall on opposite sides of the cut; the opening is the provider's own balance at the cut (`balanceAt`) and the ledger is summed from the cut (pending rows of any age too). No quiet stretch, no balance in the statement, or the pages ran out: `wawu_balance_not_compared`, never a false difference.
- **F2 (medium, G-FIX-67-4), a reversal or a bank return:** a statement line that gives a move back is matched to it. The adapter's reader marks a line whose reference is `<move>_reversal` as `returnOf` (`src/nuvion/fee-legs.ts`, as it marks a fee leg), and the ledger's own `reversalReference` is tried too. A completed line of the other direction, for no less than the move's amount and no more than it took, that gives back a row the ledger holds as `reversed`, makes the original pair agree (no `status_differs`) and is counted as the notice `reversal_returned`. A reversed row with no return, a return for the wrong amount, a return the ledger does not hold as reversed, and a line going the same way are all still named. A row reversed lately is read whatever its age (a bank can return a send days later).
- **G-FIX-67-5 (low):** a completed row whose whole note is the explained-charge note for the charge the row itself holds stays explained after its provider line has left the window (judged from the row's own figures); a row whose figures and note disagree stays a difference.
- **Specs:** `money-check-nuvion.contract.spec.ts` (+10: a long-lived WAWU account reads clean; a shortfall and a surplus inside the window are named; a dense history says not compared and makes no false difference; a reversed WAWU send and a returned bank send read clean; a reversal never returned, a return for less, and a return the ledger never recorded are named; an explained charge stays explained after its line leaves the window), `money-check-fix80.spec.ts` (pure, 20 cases). 7 of the new contract cases are red on `b75e01a` (the other 3 are guards that name a plant and pass before and after).
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
