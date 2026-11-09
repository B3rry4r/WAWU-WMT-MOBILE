# TIER-UPGRADE-FIX · round history

Moved out of [tasks/TIER-UPGRADE-FIX.md](../TIER-UPGRADE-FIX.md) word for word, oldest first. The current state is in that file.

## Builder report

Hub `src/plans/tier-grant.service.ts`, `purchases/plan-purchase.service.ts`, `purchases/plan-purchase-view.type.ts`, `contract/openapi.json` (regenerated, +5 lines), specs `src/plans/tests/upgrade-end.spec.ts` (new, pure) and 4 new cases in `purchases/tests/plan-purchase.contract.spec.ts`. Branch `wmt/TIER-UPGRADE-FIX` `691acd1`.
- **Rule applied:** the later of the held end and now plus the new tier's days (`upgradeActiveUntil`, used by both the grant and the quote). The code and the quote promised no other rule: the old doc comment said "starting now for the new tier's own days", which is the bug, and the quote carried no date. `activeFrom` stays now. All tiers are 365 days today, so an upgrade with no renewal ends where it did (held end is at most 365 days out); only a held end past now plus 365 days (a renewal) now wins.
- **Quote:** `GET /plans/purchases/quote` gains `newActiveUntil` (nullable ISO string; set for an upgrade only). Additive; fenced `contract/` change filed as SHARED-CHANGES TIER-UPGRADE-FIX #1.
- **Check 1 (renew then upgrade keeps every day):** HTTP spec: tier, renew, upgrade; end equals the held end, never earlier, grant view equals quote. **Check 2 (no renewal unchanged):** HTTP spec: end is activeFrom plus the tier's days, the quote within 60 s. **Check 3 (quote and grant agree):** both specs assert `newActiveUntil` equals the stored end. Replay: same Idempotency-Key after renew-then-upgrade answers `Idempotent-Replayed`, one debit, one `upgrade` row, end unchanged.
- **Ran (EXIT 0 each):** affected specs through `npm run test:contract` against stack `tierfix` (7 suites, 90 tests passed, EXIT 0); `npx tsc --noEmit` EXIT 0; `npx eslint` on the 5 changed files plus the new spec EXIT 0; `npm run contract:build` EXIT 0.
- **Protected route suite (V3), `scripts/protected-routes/run.sh`, same local database, before and after:** main 231 of 244 (13 failed); branch 231 of 244, the same 13. Fresh database: main 236 of 244, branch 236 of 244, the same 8 failed (professionals, verification-tick admin and verify routes: they fail on main too, not touched by this change). Equal.
- **Not done:** no screen change (the app and web show `activeUntil` from `/me/tier`, which now holds the right date; reading `newActiveUntil` on the pay sheet is a later screen task after `npm run api`). No full jest or gates run (CI). Quote date is computed at quote time; the grant at payment time: they differ only by the seconds between, and not at all when a renewal makes the held end the winner.

## Verifier report


## Verifier report

Verifier (T2), 9 Nov 2026. Hub `691acd1` on main `7dd5b22`, worktree detached, own stack `vtierfix` (ports 16100-16119, databases `vtierfix_*` only, stand-ins only). Verdict: **MERGE**. No blocker, high or medium. Three lows.

| Pass | Result | Evidence |
|------|--------|----------|
| V8 renew then upgrade | PASS | tier, renew, upgrade (HTTP, in-process Hub, real DB): held end 2028-11-08T16:54:47.750Z, quote `newActiveUntil` = grant `activeUntil` = `/me/tier` = that same instant (to the millisecond); end never earlier. Also renew then upgrade to the middle tier: same. Live stack run too (see V9). |
| V8 upgrade without renew | PASS | grant end = activeFrom + 365.000 days exactly (as before); quote differs from the grant by 66 ms (V-L2). |
| V8 upgrade twice, downgrade, same-tier | PASS | second upgrade to the same tier 409; downgrade to small 409, to middle 409; small to small 409 "That is the plan you have. Renew it instead."; no send, end unchanged. |
| V8 replayed key, two at once | PASS | same key x5 at once: 201 + four 409 in progress; later replay 201 with `Idempotent-Replayed: true` and a wrong PIN; one `upgrade` row, 3 sends in all (tier, renew, upgrade), end = quote. Three different keys at once: one 201, two 409; one upgrade row. Live stack: x3 same key 201,409,409, replay 201 replayed. |
| V8 expired tier then upgrade | PASS | quote 409 "You need a plan that is running to upgrade it"; quoted while active, tier expires, then pay: 409, no send, tier stays ended. (Unchanged rule; the fix touches only running tiers.) |
| V8 renew between quote and pay | PASS | the stale quote showed the earlier end (2027-11-09); the grant set the later held end 2028-11-08; never shorter. |
| V8 short balance | PASS | 402 insufficient_funds, shortfall 700575 = quote's shortfall, no send, no row, end unchanged, balance untouched. |
| V8 ledger = stand-in | PASS | after each scenario start balance minus the sends (amount + fee) equals the double's balance (e.g. 99990000 - 1306025 = 98683975). Live stack: Nuvion stand-in customer balance 98700200 = Hub `/money/wallet/balance` 98700200 = 100000000 - (299900 + 299900 + 700000); the three `MakerPurchase` rows are tier, renew, upgrade. |
| V2 contract | PASS | `PlanPurchaseQuoteView.newActiveUntil`: string, nullable, in `required`; null for tier and renew (live: tier and renew quotes null), ISO date for an upgrade. Wrong formats: `bump=banana` 400, `tierId=Founding` 400, `kind=bogus` 400. `npm run contract:build` EXIT 0 and left `contract/openapi.json` byte-identical to the branch (not hand-edited); `git diff --numstat 7dd5b22..HEAD -- contract` = 5 added, 0 removed. |
| V3 protected routes | PASS | `scripts/protected-routes/run.sh --fresh`, own fresh databases: main (`7dd5b22`) all 244 of 244, branch all 244 of 244, EXIT 0 each. The builder's 8 failures (236 of 244) did not reproduce (V-L3); they were never in plans code (the diff touches only `src/plans/` and `contract/openapi.json`). |
| V4 reach | PASS, noted | `newActiveUntil` is produced in one place (`upgradeActiveUntil`) and read by the quote only. `/me/tier` and the purchase view's `grant.activeUntil` carry the stored end, which is the fixed value. The other grant path (`tier-purchase-grant.ts`, the web/Flutterwave path) calls the same `TierGrantService.upgrade`, so it gets the fix. The app's pay sheet does not read `newActiveUntil` yet, and the mobile `schema.generated.ts` does not hold it until `npm run api` after the Hub merge; no web reader exists. |
| V9 live seam | PASS | on the stack, a person registered and signed in through the stack's mock WAWU ID (not the real wawu-id: stack not started with `--with id`), a real bearer token, wallet opened and funded through the Hub and the Nuvion stand-in, then bought via the real routes. Server-only values: the quote's `quoteToken`, `newActiveUntil` 2028-11-08T16:57:53.586Z, the stand-in's balance 98700200. |
| V1 gates | PASS | `npx tsc --noEmit` EXIT 0; `npx eslint --no-fix` on the 5 changed files EXIT 0; `npm run test:contract -- src/plans`: 42 of 43 suites, 578 of 583 tests pass, EXIT 1 only for `tier-badge-views.contract.spec.ts` (5 tests, `profile-fields` 404); the same 5 fail on main `7dd5b22` (`src/plans/tier-badge`: 23 passed, 5 failed), so not this change. |

Findings (all low, to SWEEP-MONEY):
- V-L1 low, `unclear`-free doc gap: `docs/contract/PLANS.md` line 318 (quote row) does not name `newActiveUntil`.
- V-L2 low: for an upgrade with no renewal the quote date is now-at-quote plus 365 days and the grant is now-at-payment plus 365 days, so the date moves by the seconds between. A stale quote is never later than the grant.
- V-L3 low: builder's V3 fresh-database count (236 of 244) did not reproduce; 244 of 244 on both. A run that differs from the builder's is worth knowing, not a defect of the change.
- Note: `held.activeUntil !== null` in the quote is dead code (column not null).

NOT RUN: real wawu-id sign-in (stack ran the mock id); any real provider; full jest and gates (CI); screens (none changed).
Cleanup: stack down, `vtierfix_*` databases dropped, worktrees removed.
