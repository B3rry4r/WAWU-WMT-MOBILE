# FEE-07 · round history

## Builder report (12 Nov 2026)

Hub `wmt/FEE-07` 13a6a522, dashboard `wmt/FEE-07` 78e63dc. Scope and decisions are in the task file's Builder report.

### Changed assertions (R-140)

| File | Test | Old expectation | New expectation | R-140 point |
|------|------|-----------------|-----------------|-------------|
| src/money/fees/engine/tests/dollar-fees.spec.ts | "no payment type is named in config: nothing is charged" | a `wire-in` inflow with no config is charged nothing | a type that is not a bank transfer (card-acq, book-transfer, wire-in, none) is charged nothing | 1 |
| same | "a wire: USD 1,000 pays USD 30" (kind intl_wire_in) | fee 3000, kind `intl_wire_in`, via `FX_WIRE_PAYMENT_TYPES` | bank-transfer, kind `usd_local_in`, fee 1500; plus USD 100 pays USD 7 | 1 |
| same | VAT on; F2 two tests; cut-to-amount | 3000/225, leg 2225, taken 3225, 4000 over, amount 2000 | 1500/113, leg 613, taken 1613, 2000 over, amount 500 (fee min 700) | 1 |
| same | "local dollars while the product is off: recorded with fee 0" | recorded with fee 0, nothing taken | replaced: with the old switch at 0 the fee is still charged | 1 |
| same | "no collecting account" | env `FX_WIRE_PAYMENT_TYPES` | no env; bank-transfer | 1 |
| src/money/cards/tests/money-cards.contract.spec.ts | every test that set `settings.wawuFeeKobo` | WAWU fee set by the env setting | set by a new `card_issue` row of the schedule (`setWawuFee`); the suite starts at fee 0 so older tests keep counting Nuvion's charge alone | 2 |

Fee-engine spec: added the `card_issue` seed row and five new tests; no old assertion changed. New card tests: seed row, NGN 5,000 quote/collect/record, admin change with history kept, VAT, 402 before send, reversed record on failure.

### Commands (exit codes)

Hub: `npx tsc --noEmit` 0 for my files (only the missing `sharp` module in this machine's node_modules, same on main); `npx eslint --fix` on changed files 0, no unrelated edits; `scripts/dev/quiet.sh ... jest src/money/fees src/money/tests src/money/fx src/money/abroad src/nuvion/handlers` 0 (25 suites, 347 tests); `jest src/money/cards` 0 (70 tests); `jest src/protected-routes` 1: 248 pass, 5 fail (`/learn/*`, `/creators/:id/evg`: 404 for seed rows a freshly migrated database lacks, no money route); `python3 scripts/gates/run.py` 0 (0 fail); `check_baseline.py` 0; `npm run contract:build` 0, diff is `card_issue` added to three enums. Migration applied, run twice, rolled back, re-applied, and the rollback refused (exit 3) with an admin-changed row. Jest ran with a stub for `sharp` (not installed here) via `--moduleNameMapper`, and the contract build with a temporary `.d.ts` shim, removed.

Dashboard: typecheck 0, lint 0 (old SHOP_DTO warning), `npm test` 0, `check:contrast` 0, `check:money-contract` 0 with `HUB_API_REF=origin/wmt/FEE-07`, `check:invariants` 1 (the label), then 0 after the lead's ruling relabelled it "Foreign currency received by bank transfer". `check:contract`, `check:ops-contract`, `check:oversight-contract` not run (fail on main).

NOT RUN: the real Hub or Nuvion; a real sign-in; pictures are against a stand-in Hub in scratch, as FEE-02's were. Pictures (`audits/FEE-07/`, 1440x900, light and dark): list, Making a card with history, Dollars received preview, card fee editor, retired wire row.

## Round 1 fix (12 Nov 2026)

Label changed per the lead; the literal "USD received by bank transfer" was tried first and fails the same rule (`\bUSD\b`), so the label avoids both words. Dashboard checks after the change: typecheck 0, lint 0, `npm test` 0, `check:contrast` 0, `check:money-contract` 0 (with `HUB_API_REF=origin/wmt/FEE-07`), `check:invariants` 0. All ten pictures re-taken (the list shows the label in all of them).
