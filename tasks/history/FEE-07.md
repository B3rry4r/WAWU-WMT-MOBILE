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

## Verifier report (12 Nov 2026)

**Verdict: MERGE** (two LOW findings and one MEDIUM follow-up, none blocks). Checked: Hub `origin/wmt/FEE-07` 13a6a522 on main 5f84a97a; dashboard `origin/wmt/FEE-07` b9c40a5 on main 9c4af59; records b3543cb3. Own databases fee07v_br and fee07v_main, a stub for the missing `sharp` module (jest mapper, contract emit hook), mock WAWU ID on 4001. No live provider, no .env opened.

### Findings

1. **MEDIUM (follow-up, unproven on the real provider).** `src/nuvion/handlers/fx.handler.ts` (direction 'in' covers `outflows.refunded`, about line 161) calls `onForeignInflow` with only paymentType and status, and `dollar-fees.ts` `classify()` (about line 325) charges every completed USD record whose payment_type is "bank-transfer". Our own dollar bank payouts go out as `bank-transfer` (`src/nuvion/areas/abroad.ts:581`). If Nuvion's `outflows.refunded` record for such a payout carries payment_type bank-transfer, the refund would be charged 1.5%. Found by reading; not run. Nuvion's refunded record was never seen on dev (docs/nuvion/DEV-RESULTS.md NUV-05) and a failed outbound needed no refund there. Cheap guard: skip `outflows.refunded` (or require the record type to be inflow) before pricing. No spec covers it.
2. **LOW.** The retired-row text in the dashboard (`FeesScreen.tsx`) says "the one fee set on the local receiving line"; the line is now named "Foreign currency received by bank transfer". The retired kind also still offers "Try an amount" and shows a fee at the old rate (dark-5 picture: USD 100,000 shows fee USD 750), which reads as if it still prices something.
3. **LOW.** `GET /money/fx` still returns `localUsdIn` from `fx.product.local_usd_in.on` (`src/money/fx/fx-accounts.service.ts:129`); the builder noted it. The setting gates no fee now.
4. **Ops, not code.** `FX_FEE_COLLECTOR_USD_BAN` must be set on the server before merge goes live; without it a dollar bank inflow is recorded but its fee is not taken and the handler answers `failed` (flagged for review). The webhook controller stores and answers 200 before handlers run (`nuvion-webhook.controller.ts`, HttpCode 200), so Nuvion still gets 200.

### Checks against the task

1. **Dollars received.** `dollar-fees.ts`: bank-transfer (plus `FX_LOCAL_USD_PAYMENT_TYPES`) priced by `usd_local_in` always; `productOn` no longer reads the old switch (`fee-schedule.service.ts`). dollar-fees.spec proves USD 100 gives 700, USD 1,000 gives 1500, card-acq, book-transfer, wire-in and null give nothing and no record, non-completed and non-USD give nothing, replay once, VAT on (1500+113), F2, cut to amount (500), switch at 0 still charges. `grep` shows `FX_WIRE_PAYMENT_TYPES` no longer read. The only caller wraps in `.catch(() => null)`.
2. **Card fee.** Migration `20270101100000_card_issue_fee` applied to a fresh database: row card_issue NGN 0 ppm 500000/500000. Run twice: one row. Rollback with an extra admin row: exit 3, nothing deleted. Rollback on the seed alone: exit 0, trigger re-enabled (tgenabled O), re-apply gives one row. `wallet-card.service.ts`: `wawuFee()` used by quote, `assertCanAfford`, the claim row's `wawuFeeKobo` and (through the row) `collectFee`; record written per card reference (upsert), reversed in both failure paths (only two places set a card failed: lines about 833 and 910). Fintava: `wawuFee()` returns the old setting, record and reverse skip, so the answers are unchanged by reading; no Fintava card spec exists, so byte-identity was not run. The card quote answer still carries the split fields (unchanged from main); the app shows only `totalFeeKobo` (`GetCardScreen.tsx`, `feeRows`).
3. **Admin.** `FIXED_FEE_KINDS` check refuses percent or min different from max (fee-engine.spec); `intl_wire_in` refused for new rows, history reads; controller and roles untouched since FEE-01 (diff shows no change).
4. **Dashboard.** Pictures seen (light-1, light-4, dark-5): list shows "Making a card" (NGN 4,500 each from stand-in data), "Foreign currency received by bank transfer", "International transfer in (retired)" with a Retired badge and no Change button; editor shows one field "Fee for each card"; history shows seed and change. Dark-5 shows the stale wording of finding 2.
5. **Changed assertions.** dollar-fees.spec and money-cards spec diffs read in full: every change is the R-140 number or setup change in the builder's table; the no-type test became stronger (four non-bank types); the removed "recorded with fee 0" test is replaced by "the old switch no longer gates". Nothing weakened.
6. **Protected routes.** On main (fee07v_main) and on the branch (fee07v_br), identical: 248 pass, 5 fail (`/learn/courses/:id`, `/learn/playbook`, `POST /learn/courses/:id/enrol` twice, `/creators/:wawuId/evg`), all missing seed rows. Not caused by FEE-07.
7. **Hub static.** `contract:build` regenerated openapi.json equals the committed file (git clean), additive: card_issue in three enums.

### Exit codes

- Hub: `tsc --noEmit` 2 (only the missing `sharp` module, 2 errors, same on main); eslint --no-fix on changed files 0; `scripts/gates/run.py` 0 (0 fail); `check_baseline.py` 0; contract build and emit and enrich 0 with a sharp shim.
- jest (one directory at a time): src/money/fees 0 (7 suites, 125 tests); src/money/cards 0 (70); src/money/fx 0 (54); src/money/abroad 0 (101); src/money/tests 0 (67); src/nuvion/tests handlers-own-accounts, webhook, accounts.contract 0 (56); src/protected-routes 1 on both main and branch (5 identical failures).
- Dashboard: typecheck 0; lint 0 (1 old warning); `npm test` 0; check:contrast 0; check:invariants 0; check:money-contract 0 with HUB_API_PATH=/home/user/WAWU-Backend HUB_API_REF=origin/wmt/FEE-07.

### NOT RUN

`src/nuvion/handlers` has no specs of its own (jest found none; the handler is covered through src/nuvion/tests); the rest of src/nuvion/tests and the whole Hub suite (CI); a Fintava card run; the real Hub, Nuvion or a real sign-in; two concurrent card creates against one wallet (the existing suite's once-only tests passed, nothing new written); dashboard pictures were seen only as the builder's stand-in pictures, not re-taken; check:contract, check:ops-contract, check:oversight-contract (fail on main).
