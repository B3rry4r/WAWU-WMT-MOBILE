---
id: FIX-67
title: The local Nuvion stand-in serves account statements, so the nightly check can read every wallet on a stack
owner: YOU
area: FIX
order: -67
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: [R-39]
passes: [V1, V3, V9]
artboards: []
tier: T2
---
# FIX-67 · The local Nuvion stand-in serves account statements, so the nightly check can read every wallet on a stack

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 20 (round 2 built by a Sonnet builder, tier T2). Backend `wmt/FIX-67` head `b75e01a` (round 1 `86b2f89` and `wmt/FIX-66` `a98af09` merged, the fee leg's merchant ledger row kept); this record and the gap rows on mobile `wmt/FIX-67`. Product code: the nightly check only (reads and reports; moves no money, edits no row). No schema, no Fintava file, no app code.
- **Verifier (PASS, report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-67.md`, on a stack):** clean at `MONEY_CHECK_SETTLE_MINUTES=5` on 4 of 4 wallets and WAWU's account, all 41 statement lines matched to a ledger row with 0 differences, every plant named, the explained-charge control counted apart, the statements endpoint 64 of 64 against the docs; specs 115 of 115 and 37 of 37; protected 253 of 253; CI Branch checks 39089847142 red only on `earning-settlement.contract.spec.ts` (Q-42). Findings: F1 (HIGH, WAWU's balance opens from a partial history) and F2 (MEDIUM, a reversal or return reads as a difference, G-FIX-67-4) are FIX-80's (lead ruling: round 2 accepted as built, the T2 rounds are spent; FIX-80 is a launch blocker for the nightly check). F3 (G-FIX-67-5) and F4 (a duplicated ledger row is named `ledger_only`) are low and go with them. All four are SWEEP-MONEY rows FIX-67 F1 to F4.
- **Merge (MERGE-20):** backend merged with no conflict and no migration (`src/money/ledger/ledger-notes.ts` is identical to FIX-74's, already in); on mobile BACKEND_GAPS is a union (G-FIX-67-1 to -5 after G-FIX-78-2); INDEX and PROGRESS are regenerated.
- **Round 1 (stand-in):** `scripts/dev/nuvion-standin.cjs` answers `GET /accounts/{id}/statements` as `api-reference__accounts.md` documents it; spec `nuvion-standin-statements.spec.ts` 9 of 9. On a stack the check then read 4 of 4 wallets and reported 22 mismatches, none a wrong balance: all four causes were the check's (G-FIX-67-1 to -3).
- **Round 2, the four causes fixed in the check (`src/money/check/`):**
  1. **Credits read as debits (19 lines):** `compareMovements` takes a direction. A statement line that states `in` is compared with the ledger's `in` rows; a line that states `out` or nothing is a debit as before, so a provider that lists debits only (Fintava) is judged exactly as it was (the `in` pass runs only when a line states a direction).
  2. **The sender's fee leg (2 lines):** the adapter's statement reader marks the transfer `<send>-fee` as `feeLegOf` and `<send>-fee-back` as `feeReturnOf` (`src/nuvion/fee-legs.ts`; `sendReferenceOfFee` stays exported from `handlers/book.ts`). The check matches the leg to its send by reference, never by `transferId`; the sender's ledger row and the app's list are unchanged. A leg whose send the ledger lacks, or a send the ledger says carried no fee, is still a difference. A fee given back is the return of a send the ledger holds (a notice, `fee_given_back`).
  3. **`merchant_charge_missing` (1):** a provider with `wawuFeeLeg` is judged by the fee's own transfer from the history already read (`compareFeeLeg`: ok, missing, differs); no by-id lookup, no Fintava field. Other providers keep the lookup. `src/fintava` is not imported.
  4. **WAWU's account balance:** compared with the merchant ledger from the opening balance the provider's statement states (running balance after the oldest completed line, less its effect), by the wallet rule (ledger still, twice running): `balance_differs`, ref `wawu-account`. No running balances in the lines: not compared, silently.
  5. **Explained charge:** a completed row whose amount and charge equal the provider's line and whose whole note is `chargeDifferenceNote` (the builder from `wmt/FIX-74` `09eb071`: `ledger-notes.ts` is that file byte for byte, with its one-line use in `outflows-bank.ts`; a merge of FIX-74 adds nothing here) is counted apart (`ledger_charge_explained`). A row whose figures differ, or whose note says more, stays `ledger_discrepancy`.
- **Specs:** `money-check-statement.spec.ts` (pure, 33 cases: each cause, each planted difference named) and `money-check-nuvion.contract.spec.ts` (the service on a real database, the provider's lines made by the adapter's own reader; a clean night, then one planted difference each: a send the ledger never wrote, a wrong amount on a credit, a debit and a credit nobody wrote, a ledger credit the provider never made, WAWU's account short and above, a fee never moved, a fee of another sum, an explained charge, a charge whose figures differ, a fee given back). 12 Nuvion and check suites, 288 of 288 (EXIT 0); the protected suite 253 of 253 (EXIT 0, seeded database); `tsc --noEmit` EXIT 0; eslint on the changed files EXIT 0; gates 0 fail (EXIT 0); `check_baseline.py` clean. The Fintava-double spec `money-check.contract.spec.ts` was not run (rules); the changes are neutral for a line that states no direction, which CI runs.
- **Run on a stack** (`fix67r2`, ports 7800 to 7807, down afterwards, databases dropped): 4 funded wallets, then content unlock, 4 tips, a paid question released and one refunded, an event ticket (held), a bank send and a WAWU send with fees, an add-money inflow, 2 earnings moves (stand-in 18 transfers plus the refund and the moves, all successful). `MONEY_CHECK_SETTLE_MINUTES=5`, 10 minutes after the last move: verdict `clean`, 4 of 4 wallets, movements 21 compared, WAWU's account 13, balances 5 (4 wallets and WAWU's account), held money 5, WAWU's fee 2 (both legs), ledger rows 40, holds 1, no mismatch, no look, no notice. The stand-in's operational account (100,581,000) is its opening 100,000,000 plus the merchant ledger 581,000. A wrong amount planted on one ledger row (+700 kobo) read `differences`: `amount_differs` and `balance_differs` (700 kobo), then put back.
- **Not done / for the lead:** G-FIX-67-4 (a reversed or returned move still reads as a difference on Nuvion: the walk has none) and G-FIX-67-5 (an explained row ages out of the night's window and reads as a discrepancy again). Both low, named in BACKEND_GAPS. CI run ids: see the hand-back.
- **Next:** FIX-80 (F1, F2 and G-FIX-67-5, on `wmt/FIX-67` `b75e01a`; not in this batch); the batch 20 pull request (the lead).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `scratchpad/verify/CHECK-2a.md` (F3), BACKEND_GAPS G-FIX-67-1 to 3

## Goal

On a local stack the nightly check reads every wallet, WAWU's account included, and reports a result.

## Scope (backend only)

Round 1: `scripts/dev/nuvion-standin.cjs`, `README.md` (one sentence), `src/nuvion/tests/nuvion-standin-statements.spec.ts`. Round 2: `src/money/check/` (compare, service, db, two specs), `src/nuvion/fee-legs.ts` and the statement reader in `src/nuvion/areas/reconcile.ts`, `src/wallet-provider/wallet-provider.interface.ts` (two optional fields), `src/money/ledger/ledger-notes.ts` (from FIX-74), `README.md`.

## Capability checks

- [ ] `GET /accounts/{id}/statements` on the stand-in answers the documented shape and pages by `limit` and `cursor`.
- [ ] Every move the stand-in made appears once on each account it touched, with amount, direction, reference and time.
- [ ] `npm run money:check` on a stack reads 4 of 4 wallets and WAWU's account after a mixed set of payments and reports its result.
- [ ] Round 2: after that set, with `MONEY_CHECK_SETTLE_MINUTES=5`, the verdict is `clean` with every wallet and WAWU's account compared line by line, and a planted wrong amount, missing ledger row, provider line nobody wrote or short WAWU account is named.

## Owner sign-off

Not needed.
