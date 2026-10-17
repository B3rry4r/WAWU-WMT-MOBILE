# TIER-06 verifier report

Backend `wmt/TIER-06` 317f464 (code c827262) on main a5e48fc; mobile 2599921 (docs only). Verifier: Sonnet, 17 Oct 2026.
Verdict: **fix** (one high, two medium, three low).

## Passes

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (as main) | tsc 0 errors outside my own scratch spec; eslint --no-fix on the 24 changed files EXIT 0; gates 5 fail / 119 warn / 83 accepted, 1367 files, identical counts to main (5/119/83, 1354 files); check_baseline ok; contract:build reproduces the committed openapi.json byte for byte. Logs: scratchpad/tier-06-v/logs |
| V2 Contract | FAILED on the quote-equals-charge check | F1, F2 below. Roles, validation and audit all passed (live Hub, HTTP). |
| V3 Regression | passed | protected route suite on a fresh seeded database: all 244 required tests passed (EXIT 0). A first run on an unseeded database failed 5 /learn and /creators/evg probes that need seed data; not the branch. CI run 38987466864 also green. |
| V4 Field trace | passed | writer PATCH, store PlanSetting, readers GET /plans, tier quote, convert quote, tier grant, GET /me/tier. Each seen to change on the same process at once and on a second Hub process in 3.4, 5.5, 8.2, 8.2 s (limit 15). |
| V6 States | passed | a bad stored row (0, wrong kind, unknown key) is ignored, defaults used, no crash, on both Hubs; empty and fresh DB runs on the seeds. |
| V9 Live seam | passed | real Hub process on the stack (ports 7430 and a second Hub on 7431, same database), real admin tokens, user token from the mock WAWU ID. |

Specs run: builder's 3 plan-settings specs plus src/plans/tests: 15 suites, 307 tests pass (own database). Two scratch attack specs (kept in scratchpad/tier-06-v/specs, not in the branch).

## Migration (20261024060000_plan_settings), live-shaped rows

Applied on a database with all 145 earlier migrations and 3,360 AdminOpsAudit rows covering every old enum pair: all rows kept (checksum identical before and after), old values still query (560 bill_payment rows), new values insert. Rollback (`DROP TABLE "PlanSetting"`) ran clean and no code reads the audit table back (write-only), so left-over enum values break nothing. Re-applying after a rollback FAILS (F6).

## Findings

1. HIGH, quote is not the charge for cash-out. `src/points/convert/points-convert.service.ts:137` (`convert`) and `points-convert.dto.ts:9` (body is `{points}` only). Reproduce: person with 4,000 points, `GET /points/convert/quote?points=4000` shows cashKobo 200000; admin PATCHes `points.cash_rate_kobo_per_1000` to 12500; `POST /points/convert {points:4000}` with the PIN pays 50000 (201, completed). Nothing binds the quoted rate; a rate raise pays more than quoted, at WAWU's cost. Needs a rate or cash amount carried from the quote and refused with `quote_changed` when it differs. The tier purchase has this (expectedTotalKobo + quoteToken: stale price up or down is 409 quote_changed, wallet debit 0, fresh quote then buys at the new price), so this is the only price path that lacks it.
2. MEDIUM, the goods are not bound to the quote, only the price. `src/plans/purchases/plan-purchase.service.ts:463,531` (bump points) and `src/plans/tier-grant.service.ts:185-214,305-320` (tier products, bonus points, days) read the live config at grant time. Reproduce (spec in scratchpad/tier-06-v/specs/zz-verify-goods.contract.spec.ts): quote Verify with bump (1,000 bump points, 3 products, 100 bonus points, total 182325); admin sets bump points 100, products 1, bonus points 7; pay with the old token (accepted, same total); MakerTier gets productsIncluded 1, pointsIncluded 7, bump lot 100. Person pays the quoted money and gets other goods. Fix: snapshot the sold terms in the payment at pay time (or refuse when they differ).
3. MEDIUM, the third referral milestone is ON by default. `src/plans/plans.config.json:115` `{ "count": 25, "points": 5000 }` is loaded as the default of `referral.milestones` (GET /admin/plan-settings shows source default, 3 steps). Lead ruling: not drawn, so OFF by default. The builder left it on and asked the owner to confirm or remove. REF-02 would pay 5,000 points at 25 verified with nothing on any board. Remove the step from the default list (the setting needs at least one step, so removing is the only off switch).
4. LOW, audit "from" is wrong under parallel changes of one key. `src/plan-settings/plan-settings.service.ts:236-240` reads the old value with no lock. 12 parallel PATCHes of `points.daily_cap`: final value and last audit row agree (6004), but several rows carry a stale `from` (e.g. 6002 to 6012 then 6012 to 6010 then 6012 to 6008). Take a row lock or advisory lock per key.
5. LOW, a failed reload after a save keeps the old plan up to 15 s on that process while the PATCH answered 200 (`service.ts` `set` then `refresh`, error swallowed). Edge case.
6. LOW, migration is not re-runnable after its own rollback: `migration.sql:31,34` `ADD VALUE` without `IF NOT EXISTS` (7 of 14 earlier migrations use it). After `DROP TABLE "PlanSetting"` the redeploy fails with `enum label "plan_setting" already exists` and blocks migrate until resolved. Also `schema.prisma:3796` names `plan-settings.seed.json`, the file is `plan-settings.defaults.json`.
7. LOW, no cross-field check: cash rate can be set above the pack price per point (buy at pack price, cash out higher). Admin-only, finance and superadmin.

Sweep row only: `pin-request-key.contract.spec.ts:202` flake (random PIN inside a random digest) did not occur in my runs.

## Passed attacks (counts)

- Roles on a live Hub: superadmin and finance GET 200 and PATCH 200 (400 on a bad value); support GET 200, PATCH 403; reviewer 403 both; no token 401; garbage token 401; a user token 401 on both.
- Validation: 0, -5, 1500.5, "150000", true, [1], 1e400, 2147483648, 99999999999999, unknown key, `__proto__`, `constructor`, empty body, empty settings, array, flat body; bad time, date (2026-02-30), em-dash line, empty line, 9 lines, multiplier below 1, ladder not starting at 1, milestones out of order, extra property, zero AI cost. All 400, naming the key. One bad value among good ones refused the whole request: 0 rows stored, 0 audit rows.
- Audit: one row per changed key (old, new, reset flag, actor id, email, role); same value writes nothing; reset of an unset key writes nothing; a 3-key request writes 3.
- Corrupt stored rows ignored (3 logged), defaults used on both Hubs.
- Seeds: no launch figure in code beyond the OpenAPI example (`update-plan-settings.dto.ts:15`); W44 lines left for WALLET-38 as ruled; bonus lots 365 days; daily cap 5,000; stamp 20261024060000 does not clash with any wmt/* branch.

## Cleanup

Stack `tier_06` down, second Hub (pid 31951) killed, ports 7430-7437 closed, databases tier_06_* dropped, worktree removed, admin tokens deleted. Nothing pushed.

---

# Round 2 (lean check), 17 Oct 2026

Backend `wmt/TIER-06` 361df74 (on 317f464, main a5e48fc); mobile 3aa7a52 (docs). Verifier: Sonnet. Verdict: **merge** (nothing medium or worse; 2 low, 1 note).

## Checks (counts)

| Ruling | Result | Evidence |
|---|---|---|
| Migrations | pass | Fresh DB, all 147 migrations. Rolled back `20261024060100` (DROP COLUMN terms), seeded 3 old-shape WalletPayment rows, `migrate deploy` re-applied: 3 rows kept, terms NULL. Rolled back both (DROP COLUMN, DROP TABLE PlanSetting, migration rows deleted), `migrate deploy` re-applied clean (EXIT 0, enum values present, ADD VALUE IF NOT EXISTS). |
| 1 HIGH cash-out vs quote | closed | Real Nest app over HTTP with the Fintava stand-in (money needs a wallet; the stack Hub's Fintava is a closed port). Round 1 reproduction at rate up (70,000) and down (12,500): 409 quote_changed, wallet unchanged, 0 conversions, 0 PIN tries (wrong PIN sent on purpose: the 409 comes first); a fresh quote then pays exactly its amount. Changed minimum: 409 / 422, nothing paid. Foreign token, other points (both directions), flipped signature, edited payload with old signature, own-key signature, no-context signature, unsigned, garbage, expired (clock +320 s): all 409, 0 conversions. Missing, empty, number, object, array, null, 1,100 chars: all 400 before the PIN. Untouched token still pays exactly the quote after all refusals. |
| 1 parallel | pass | 10 parallel, one key, one token: one 201 + nine 409 (in progress), 1 conversion row. 10 parallel, different keys, balance exactly 4,000: one 201, nine 402. Rate flipped every 15 ms for 4 s while 4 converts at a time ran on one token (30 paid, 516 x 402, 66 x 409): every payment was the quoted cash, wallet = paid x quote. |
| 2 MEDIUM goods | closed | Quote with bump, then change products / bonus points / days / bump points / points expiry months: each 409 quote_changed, no debit, no tier, no lots, no payment row. Unrelated change (extra-products price, another tier's products, daily cap): quote still pays (201), not over-eager. Client-sent `terms` in the buy body: 400 "property terms should not exist". Payment left pending (timeout), plan changed at the same moment as 3 parallel sweeps: one tier, products/bonus/days as quoted, exactly one bump lot (quoted points) and one bonus lot, bump lot > 300 days. |
| 2 legacy edge | judged OK | Payment with terms set to NULL (as claimed before the column), plan then changed, sweep: granted from the live plan (1 product, quoted 3). Money and price are in the payment row and unchanged; only goods float, and only for a payment in flight at the deploy AND a plan change in that same window. Before TIER-06 the plan could not change at all. Not worth a backfill. Corrupt terms (bad JSON shape): delivery refuses, no tier granted. |
| 3 referral step | closed | Live Hub: default `referral.milestones` = 5 -> 500, 10 -> 1,500 (2 steps, source default). Adding the 25 step in admin still works; null reset returns to 2 steps on the other Hub within 16 s. |
| 4 cash rate vs sale price | closed | Live Hub x2 (ports 7430 and 7431, one database). Either order: rate to 80,001 (cheapest sale 80,000) 400; exactly 80,000 200; then bump price 79,999 / bump points 1,001 / pack M points 3,500 / shortfall price 79,999 / pack S price 79,999: all 400 naming both settings; both in one request consistent 200, inconsistent 400; raising the price (fixing) and resetting to default 200; 2,147,483,647 rate and bump points: 400 (no overflow). Race: 24 rounds of three jointly-invalid single-valid PATCHes across both Hubs: 0 final states in violation. 40 mixed parallel PATCHes: 0 violations. Single writer of PlanSetting (grep). |
| 5 audit chain, lock | closed | 12 parallel PATCHes of one key across both Hubs: 5000 -> 6001 -> 6003 -> 6004 -> 6002 -> 6006 -> 6008 -> 6010 -> 6007 -> 6009 -> 6012 -> 6005 -> 6011, unbroken, last row = final value. All 178 audit rows (all keys, all races): 0 breaks (`from` = previous `to`). 30 parallel PATCHes all 200 in 624 ms. Lock section (`service.ts` set) is DB-only: advisory lock, findMany, upsert/delete, audit create, no network call. |
| 6 harness helper | follows from the ruling | `git diff` of `test/points/cash-out-harness.ts` only (60 lines, the one existing test file touched): `convert` fetches the quote and sends its token (one token per Idempotency-Key, shared by parallel taps); `quoteToken: null` and a given token stay possible; where the quote cannot be had a made-up token goes so the route's own refusal shows (no wallet, dollars, malformed). No assertion edited; `src/points/convert/tests` 6 suites, 74 tests pass. Refusals that precede the token check (currency, minimum, amount) still answer first. |
| Roles | pass | superadmin/finance read+write, support GET 200 / PATCH 403, reviewer 403, on both Hubs. |
| CI on 361df74 | green except as main | netns, suite shards 1-3, contract, deploy-test-in-sync, baseline, protected route suite: success. Gates: failure, local run 5 fail / 119 warn / 83 accepted = main's counts, the 5 FAIL files are not this task's. check_baseline ok. tsc 0, eslint --no-fix on the 26 changed files EXIT 0. |

## Findings

1. LOW, quote token is reusable until it expires. `points-convert-quote-token.ts` is stateless. With 40,000 points and one token for 4,000, 6 parallel converts under different Idempotency-Keys all paid (201), each exactly the quoted cash with its own points deducted: no overpayment, so not a defect; it only means "pay once" holds per key and per balance. Note for POINTS-05: send a fresh quote per attempt.
2. LOW, latent: the cash rule ignores the pack bonus percent (`plan.tier.founding.pack_bonus_pct` 10). Nothing applies it today (`plans.service.ts:117` only displays it), so no arbitrage exists now. When POINTS-02 applies it, a rate set at the exact maximum would pay about 10 percent more than a Founding buyer paid. The builder flagged this. POINTS-02 must make `pointsSales` (`src/plan-settings/plan-setting-rules.ts:34`) use bonus points; put it on POINTS-02's list.
3. NOTE: cap and fee cannot be changed at run time here (the cap is the env `MERCHANT_MAX_PER_TXN_KOBO`, the fee is a constant 0), so they were checked in code only: both are in the token (`m`, `x`, `f`) and compared in `assertQuoteHolds`.

## Cleanup

Stack `tier_06` down (mock-id and Hub stopped), second Hub (pid 19350) killed, ports 7430-7437 closed, databases tier_06_* dropped, admin tokens deleted, worktree v-tier-06-be removed, nothing pushed. Scratch specs kept in scratchpad/tier-06-v/specs2 (not in the branch).
