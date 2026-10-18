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

As of 18 Oct 2026, verifying: built by a Sonnet builder (tier T2), not yet checked. Backend `wmt/FIX-67` head `86b2f89` (from `wmt/MERGE-14` `195de50`); this record and the gap rows on mobile `wmt/FIX-67` (from `wmt/MERGE-14` `d76612f6`). Dev tooling and a spec only: no product code, no schema, no Fintava file, no app code.
- **Found by:** CHECK-2 part A F3 (`scratchpad/verify/CHECK-2a.md`): `npm run money:check` ended `incomplete`, 0 of 4 wallets, because the stand-in answered 404 to `GET /accounts/{id}/statements`.
- **Built:** `scripts/dev/nuvion-standin.cjs` answers that route as `api-reference__accounts.md` "Get account statements" documents it (path :692, parameters :705 to :729, summary :739 to :801, line fields :803 to :891, pagination :893 to :925, envelope :929 to :931): `year` and `month` (UTC) required, `limit` 1 to 100 (default 20), `cursor`, `include_pending`, `entity_id` scoping, `running_balance`, `balances`, `total_transactions`. Parameter errors are 400 `error_validation_error` with a `validations` entry (errors.md:34 to :72); a person's account asked without or with another entity is 404.
- **Built from the transfers it records, nothing else:** each outflow is a debit line on its payer (amount, fee, reference, id, time); a book transfer that landed is also a credit line on its payee (same reference); an inflow is a credit line; a failed outflow is one `failed` line that moved nothing; a reversed one shows its return (the bank-return credit record, or two derived lines `01RTN...` / `<reference>_reversal` for a book transfer). A completed line moves `running_balance` by what the stand-in really moved. Nothing else in the stand-in changed (additive).
- **Spec:** `src/nuvion/tests/nuvion-standin-statements.spec.ts`, 9 of 9 (EXIT 0): starts the script on a loopback port and reads it through the Hub's own `NuvionClient`, `NuvionReconcileArea` and `readStatementLine`. Fields and types, paging (7 per page, default 20, 100 per page across 2 pages, no line twice), a reference once per account it touched (and a transaction id once per statement), the summary identity (opening + credits - debits - fees = closing = the stand-in's balance), pending only with `include_pending`, empty past and future months, every documented error, entity scoping. Checks: `tsc --noEmit` EXIT 0, eslint on the spec EXIT 0, gates EXIT 0 (0 fail), `check_baseline.py` clean, `stack-selftest.sh` EXIT 0 (7840 to 7847).
- **Run on a stack** (`fix67`, ports 7840 to 7847, down afterwards, database dropped): 4 funded wallets, then content unlock, 4 tips, a paid question answered (released) and another past its deadline (refunded), an event ticket (held), a bank send and a WAWU send (both with WAWU's fee), an add-money inflow, 2 earnings moves: 20 stand-in transfers all successful, every hold and move settled.
- **`npm run money:check`, default settings:** `clean`, 4 of 4 wallets, balances 4 compared, but movements 0 compared: all 34 were younger than the 30 minute settle and left to the next night.
- **Same, `MONEY_CHECK_SETTLE_MINUTES=5` (the config's minimum), 5 minutes after the last move:** 4 of 4 wallets, WAWU's account read, balances 4 ok, held money ok, verdict `differences`, 22 mismatches, none a wrong balance. 19 are a CREDIT line judged as a debit with no ledger row (the check never reads `ProviderTransaction.direction`): user wallets 9 (the 4 funding inflows of N50,000; payer1 the N2,000 refund; payer2 the N2,500 add-money; payee1 the N3,825 earnings move; payee2 the N5,100 earnings move and the N1,000 WAWU send received); WAWU's account 10 (credits in: unlock N1,500, tip N1,000, 3 tips N2,000, 2 paid questions N2,000, ticket N2,500, and the two fee legs N10 and N25). 2 are real, the fee legs F2 names, seen from the sender: payer2 N10 (`wawu-send-...-fee`), payer1 N25 (`wawu-bank-...-fee`), debits with no ledger row. 1 is `merchant_charge_missing` on the N10 WAWU send's fee (Nuvion's lookup never fills `merchantChargeKobo`, a Fintava field, so every send with a WAWU fee reads missing).
- **Does the check catch F2?** Not as F2. It never compares WAWU's operational balance with its ledger (the merchant side reads only WAWU's debits and the held money). On this stack the operational account was N3,500 above its ledger (stand-in 411,000 above opening, ledger 407,500) = the two fee legs, and the check showed it only as the two sender-side lines above. FIX-66 writes the merchant IN row, not an out row on the sender, so I expect those two lines to stay after it (not run on its tree).
- **Not done / for the lead:** the three differences' causes are the check's, not the stand-in's, so zero differences cannot be proved on the stand-in until the check reads direction (G-FIX-67-1) and Nuvion's fee leg is judged (G-FIX-67-2, G-FIX-67-3). Left alone as the brief says. CI run ids: see the hand-back.
- **Next:** the lead rules on G-FIX-67-1 to 3; an independent verifier (V3 from CI, V9 on a stack).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `scratchpad/verify/CHECK-2a.md` (F3), BACKEND_GAPS G-FIX-67-1 to 3

## Goal

On a local stack the nightly check reads every wallet, WAWU's account included, and reports a result.

## Scope (backend only)

`scripts/dev/nuvion-standin.cjs`, `README.md` (one sentence), `src/nuvion/tests/nuvion-standin-statements.spec.ts`.

## Capability checks

- [ ] `GET /accounts/{id}/statements` on the stand-in answers the documented shape and pages by `limit` and `cursor`.
- [ ] Every move the stand-in made appears once on each account it touched, with amount, direction, reference and time.
- [ ] `npm run money:check` on a stack reads 4 of 4 wallets and WAWU's account after a mixed set of payments and reports its result.

## Owner sign-off

Not needed.
