# WALLET-10 verifier report (Sonnet verifier, 16 Oct 2026)

Branches tested as they are: backend wmt/WALLET-10 5e57a09 (base 51b02c5), mobile wmt/WALLET-10 95d1f93.
Verdict: **merge** (nothing medium or worse).

## Passes
| Pass | Result | Evidence |
|------|--------|----------|
| V1 diff vs report | passed | Backend diff = the 17 files the report lists; mobile diff = 5 docs files only (no app code). |
| V2 capability checks | passed | Check 1 (credit appears in history and as one notification) and check 2 (Z3 off, none sent): live, see V8. |
| V3 protected routes | passed | `scripts/protected-routes/run.sh --fresh 5e57a09` with lock 51b02c5: all 244 required tests passed, EXIT 0. |
| V4 gates | passed (same as base) | gates 16 fail / 99 warn / 76 accepted on 1159 files; the 16 FAIL lines are identical to a clean 51b02c5 run (1154 files, 97 warn); check_baseline clean; tsc 0; eslint (no fix) on the changed files 0; mobile `npm run gates` and `npm run tasks` EXIT 0. |
| V5 picture | N/A | task has no artboards; no app code changed. |
| V6 states | passed (backend states) | Z3 off, unset, null, other switch off; pending, failed, no status; account scheduled for deletion; no wallet. |
| V7 flow | passed | register through the mock WAWU ID, wallet row, signed credit, feed and history read with the real token. |
| V8 money | passed | see attacks below. |
| V9 live seam | passed | tokens from the mock WAWU ID `/auth/register`; `GET /me/notifications` and `GET /money/transactions` show the credit once, served by either Hub. |

## Attacks (49 live assertions, 0 failed; stack `wallet10`, two Hubs on one database, push on one Hub with an Expo stand-in)
Scripts: scratchpad/vwallet10/{lib,p1,p2,p3,p4,p5}.js, logs in scratchpad/vwallet10/logs, results.txt.
- Forged (wrong secret, no header, junk header, tampered body): 4 of 4 refused (401). Valid credit: 1 ledger row, 1 notification, 1 mark.
- Replay: 4 serial + 20 parallel across both Hubs + other bytes + same sessionID other reference: still 1 row, 1 notification, 1 mark.
- Z3: off -> history row yes, notification none, push none, mark `muted`; on again -> old credit never comes; next credit told once. Unset, null and another switch off read as on. Switch turned off after the notification was written but before the push: no push (sender re-checks).
- Push: 1 push per phone (2 phones = 2), carries the same words and `kind: money_in`; none for a muted person or an account scheduled for deletion.
- Statuses: pending alone not told, pending then success told once, success then stale pending told once, failed not told, no status read as done.
- Amounts: 0.50, 1,250.50, 99,999,999.99, 21,474,836.48, above Int naira: exact text, `amount` column empty for kobo or overflow; 0, -5, abc, 1e3, 1,000.00, 12.345 make no row.
- Sender names: dashes become hyphens, control and bidi characters out, 60-character cut, HTML left as text, no name -> "by bank transfer", short or letter-only account number never shown, no em-dash in any title or body.
- Burst: 30 credits to one person and 12 to another, posted across two Hubs at once: rows = notifications = marks, all distinct. 40 credits with Hub B SIGKILLed mid-run: 40 = 40 = 40.
- Lock: a ledger row held back to back by another writer for 45 s: others still told, the held row skipped, then told once after release.
- Direct ledger rows: only completed `in`/`top_up`/user rows of the running provider inside 72 h are told (not pending, failed, reversed, out, earning, refund, transfer, merchant, no user, nuvion-stamped, discrepancy, 80 h old); pending that completes later is told once; discrepancy cleared later is told once.
- Injected faults: notification insert fails -> nothing written, others unaffected; mark insert fails -> notification rolled back with it; fault removed -> both told once after the 1-2 minute rest. Hub logs hold no sender name.
- Old-shape deliveries (no userId, `customerId` key, unknown extra fields): told once each.
- Migration on a populated database: rollback.sql drops table, enum and index; re-applied, credits already there are marked `before` (completed, failed, old), pending/out/earning/merchant rows are not; replaying migration.sql errors on the type (expected, not idempotent as a whole).
- Sweep query at 200,000 in-window rows: 101 ms (hash anti join); fine at launch scale.
- Specs on a seeded migrated database: money-in-notice 72 + notification 70 = 142 of 142; wallet-provider seam + account-purge 70 of 70; ledger, push, openapi suites pass; `data-export.contract.spec` 14 fail identically on clean 51b02c5 (environment), so pre-existing.
- No CI run exists for 5e57a09 (branch predates OPS-CI): 0 check runs.

## Findings (all low; none needs a round)
1. low, merge hygiene: migration `20261021210000_money_in_notices` sorts before main's `20261021240000`, `250000`, `260000`; the lead renames at merge (SHARED-CHANGES #1 says so). `contract/openapi.json` differs from base only in the order of 25 `required` lists (checked structurally); regenerate after merging, main has moved on (many unrelated paths differ against main).
2. low, prisma/migrations/20261021210000_money_in_notices/migration.sql line 31: plain `CREATE INDEX` on `FintavaLedgerEntry` blocks writes while it builds; negligible at today's size.
3. low, BACKEND_GAPS G-734: the ledger fold does not carry the mark, so a fold of two already-told rows (or a told row into an untold one) can tell a credit twice. Rare, recorded.
4. unclear (owner), G-732: a received person-to-person send, an earning and a refund write a ledger row and tell nobody, though Z3's subtitle says "transfers". Recorded as a lead ruling; the capability checks only need bank transfers.
5. pre-existing, not this task: a second signed delivery with the same reference and another amount puts a completed `in` row back to `pending` with a recorded discrepancy (MONEY-10); WALLET-10 does not tell it again.

## Not run
Real Fintava `account_funded` and a real phone or Expo (no keys; stand-ins used, as the builder). A Hub under `WALLET_PROVIDER=nuvion` (only the provider isolation was checked, by a nuvion-stamped row a Fintava Hub leaves alone, plus the builder's own run). Mobile screens: none changed.
