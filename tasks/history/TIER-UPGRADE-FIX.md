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

