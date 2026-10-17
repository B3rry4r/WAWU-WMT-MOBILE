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
