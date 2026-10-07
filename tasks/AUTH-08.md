---
id: AUTH-08
title: Refreshing and signing out stay fast however many times a person has signed in
owner: YOU
area: AUTH
order: 182
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: [AUTH-03]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# AUTH-08 · Refreshing and signing out stay fast however many times a person has signed in

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/CHECK-1.md`, Verifier report, finding F-5; `tasks/SETTINGS-01.md`, gap G-264
- wawu-id `src/auth/tokens.service.ts` (`rotateRefreshToken`, `revokeRefreshToken`) and `src/auth/session-security.spec.ts`

## Goal

A refresh or a sign-out finds the presented refresh token directly instead of password-hash-checking it against every token the account has ever stored. Today both read all of the account's stored refresh tokens and run argon2 on each until one matches, and nothing deletes expired ones: the CHECK-1 audit saw a refresh take over 20 s for an account with 53 stored tokens, and SETTINGS-01 saw sign-out take 13 to 49 s.

## Scope

wawu-id only. Each new refresh token carries an id (a `jti`) stored with its record; rotation and revocation look up that one record and verify it once. Tokens issued before this change (no `jti`) still work until they expire, by the old path limited to unexpired records. Expired records are removed (on issue, or by a sweep). Single-use rotation, the account lock, and every rule in `session-security.spec.ts` stay exactly as they are. Additive migration only.

## Capability checks

- [ ] With 200 stored refresh tokens on one account, a refresh and a sign-out each answer in under 1 s, and the same refresh at 2 tokens is no slower than before.
- [ ] A refresh token issued before the change still refreshes once, and only once.
- [ ] Every existing session-security rule still holds (reuse refused, a password change or sign-out sweeps every token, a rotation racing a sign-out loses).

## Builder report

**Branches.** wawu-id `wmt/AUTH-08` at `dd4326a` (one commit on origin/main `4715d17`, no pull request); mobile `wmt/AUTH-08` (docs only: this file, `docs/LOG.md`, `docs/PROGRESS.md`). No mobile source, no SHARED-CHANGES row, no BACKEND_GAPS row.

**One fact the task text had wrong.** It says tokens issued before the change have "no `jti` in the payload". They do have one: `issueTokens` already signed `jti: randomUUID()` into every refresh token, it was just never stored. So a pre-change token cannot be told from a new one by its payload. The rule built is therefore: look the record up by (account, `jti`); if a row holds that jti, verify that one row and stop (a bad hash is refused, no fallback); if no row holds it, run the old scan over this account's rows with a null `jti` that have not expired. A token with no `jti` at all goes straight to that scan. The scan never hash-checks a row that carries a `jti`.

**The change (wawu-id).**
- `prisma/schema.prisma` and migration `20261007120000_refresh_token_jti`: `refresh_tokens.jti TEXT NULL` plus unique index `refresh_tokens_jti_key`. Postgres allows many NULLs, so the existing rows do not collide. `prisma migrate diff` against the migrated database: no difference. The migration sorts after every folder on origin/main and on every origin branch (latest other is AUTH-07's `20261006120000`).
- `src/auth/tokens.service.ts`: `issueTokens` stores the jti it signs; new private `findRefreshRecord` (above) used by `rotateRefreshToken` and `revokeRefreshToken`; new private `deleteExpiredRefreshTokens`. Single-use rotation, the account row lock and its ordering against sign-out and password change, the phone-pending refusal, and every response shape are the same lines as before (`session-security.spec.ts` is byte-identical and passes).
- Expired records: on every issue (sign-in, refresh, password change, any route that mints a pair) and on every sign-out, the account's expired rows are deleted, at most 50 per call (`EXPIRED_SWEEP_BATCH`, single-row deletes, best effort: a failure is logged and never fails the sign-in or sign-out). **A separate sweep is not needed for speed**: an expired row is never scanned any more (lookup is by jti, the old scan skips expired rows), so rows of an account that never signs in again are inert storage only. If the table's size ever matters, a scheduled `DELETE FROM refresh_tokens WHERE expires_at < now()` is safe and wants an index on `expires_at` (not added: no evidence it is needed). The backlog on an account like CHECK-1's `creator-pro` (53 rows) clears in two sign-ins.
- `src/auth/refresh-token-lookup.spec.ts` (new, 20 tests) and `test/refresh-lookup.local.mjs` (new, `npm run test:refresh-local`, real server and Postgres).

**Proof 1, timing, one account with 200 stored refresh tokens** (real argon2 at the production cost, 0.17 to 0.26 s per check on this box, load average 7 to 10 from other agents).

| | origin/main `4715d17` | `wmt/AUTH-08` |
|---|---|---|
| Over HTTP, real Postgres: refresh | 31559 ms | 356 ms |
| Over HTTP, real Postgres: sign-out | 29235 ms | 236 ms |
| Spec (in-memory rows): refresh | 25087 ms, 200 hash checks | 291 ms, 1 hash check |
| Spec: sign-out | 29175 ms, 201 hash checks | 118 ms, 1 hash check |
| 2 stored tokens: refresh, HTTP | 244 ms | 246 ms |
| 2 stored tokens: refresh, spec | 216 ms, 1 check | 261 ms, 1 check |

The same spec fails on main: copied unchanged into a detached checkout of `4715d17`, 10 of its 20 tests fail, the first on "Expected: < 1000, Received: 25087" (`refresh-token-lookup.spec.ts`, "with 200 stored refresh tokens"). The spec also counts argon2 verifications (a `jest.mock` wrapper) so it fails on cost, not only on a busy machine's clock. The refresh answers about 0.35 s because it is one verify plus one hash of the new token (both unchanged work); with 2 tokens it is the same, so "no slower than before" holds.

**Proof 2, a pre-change token refreshes once and only once.** Spec: a token minted with no `jti` and a token naming a `jti` no row holds (what was shipped), each with a row whose `jti` is null: first refresh true, second false, and what it was swapped for refreshes; the scan costs exactly 1 hash check with 30 jti-carrying rows or 5 expired null-jti rows present; a pre-change token signed out stays out; an expired one is refused. HTTP (`test:refresh-local`, same two cases, tokens signed with the run's own key, rows inserted with a null `jti`): 200, then 401, and the replacement refreshes. These also pass on main (the old path is unchanged for them).

**Proof 3, still refused.** Spec and HTTP: reuse of a rotated token 401 and the newer token still works; a real token whose row was deleted (HTTP: `delete from refresh_tokens where jti = ...`) is refused 401 and its sign-out answers 200 and ends nothing else; a row whose hash fails is refused after exactly 1 hash check (no fallback scan); a token signed for one account that names another account's jti is refused and the other account's token still works; an access token, an unknown refresh token and garbage end nothing. A password change ends new-style and null-jti tokens alike (spec: 4 tokens ended, 1 left; HTTP: Cee holds 1 row, the pre-change tokens with and without a jti answer 401, the handed-over pair 200). Races: the existing 24-trial refresh-vs-password-change and refresh-vs-sign-out specs pass; `test:session-local` (the SETTINGS-03 live script, real Postgres, including its 24 + 24 racing trials) 38 of 38 PASS on this branch.

**Proof 4, expired records are gone after an issue.** Spec: expired rows (with and without a jti) of the account removed, its live rows kept, another account's expired rows untouched; the same after a refresh and after a sign-out; bounded (120 expired: one issue leaves 70, three issues leave 0); a failing prune does not fail the sign-in. HTTP: Ada held 9 rows (7 expired), one sign-in left 3 (her 2 live and the new one), Bola's 3 expired rows were untouched by Ada's sign-in and gone after his own.

**Proof 5, checks in wawu-id.** `npx tsc --noEmit` 0 on both. `npm run contract:build` leaves `contract/openapi.json` unchanged. eslint over `src` and `test` (without `--fix`): 43 errors on main and 43 on the branch, the identical set (8 of them in `tokens.service.ts` on lines this change did not touch, left alone); the new spec has 0. Full jest: main 18 suites, 205 tests, 1 to 2 failures per run (and 21 in the first run while the box was busiest), all in `phone-signup.service.spec.ts` (5000 ms test timeouts from argon2 under load); branch 19 suites, 225 tests (+20), 1 failure in the same file, the same kind. That file run alone: 44 of 44 pass on both main and the branch. `session-security.spec.ts`: 24 of 24 on the branch, file byte-identical to main. `node_modules` was stale for main (`@nestjs/swagger` missing), so the worktree took `npm ci`.

**Proof 6, real HTTP on a fresh database** (`ba08_test_auth08_new`, all migrations applied from empty, built `dist/main.js`, port 5341, no outside call): `npm run test:refresh-local` 29 of 29 PASS: login 200 with a pair and a row whose jti equals the token's; refresh 200 and a different token; the same token again 401; the newer token still 200; logout 200 `{ signedOut: true }`; refresh after logout 401; logout again the same 200. The same script on a built main (`ba08_test_auth08_main`) passes 22 and fails the 4 that are this task (two expired-record checks, 31559 ms and 29235 ms).

**Migration and rollback.** Additive, one nullable column, one unique index; the index build takes a short write lock on `refresh_tokens` (small: one row per live sign-in). Applied over a database holding 3 pre-existing rows (`ba08_test_migr`): 3 rows, 0 with a jti, no row touched. The rollback in the migration's header (`DROP INDEX`, `DROP COLUMN`, delete its `_prisma_migrations` row) was run: 3 rows kept, column gone, and `migrate deploy` re-applied it cleanly. Old code ignores `jti` and finds a token by its hash, so rolling the code back without touching the database is also safe and no refresh token stops working in either direction.

**Release note for the wawu-id deploy.** `npm run start:prod` runs `prisma migrate deploy` first, so one deploy applies the migration and then starts the new code; if deploying by hand, migration first. Nobody is signed out: every refresh token in the wild keeps working by the old path (null-jti scan, unexpired rows only) until it expires, 30 days at most, and each refresh swaps it for a new-style token. While those old tokens last, a refresh with a token that no row holds (a reused or signed-out one) still scans the account's remaining null-jti rows, so that one refusal is as slow as today for an account with many old rows; it is gone after 30 days. Nothing the web or dashboard calls changes, the contract is unchanged, no new environment variable.

**Mutants** (each made in `tokens.service.ts`, specs run, file restored from git): lookup ignoring the account (13 failures, all in the old spec, because its loose stand-in ignores a `jti` filter; the new spec's wrong-account test does NOT kill it, the hash check still refuses the token, so the account filter there is defence in depth and not proved by a test); old scan over every row (2 killed); sweep removing live rows (9 killed); a bad hash falling through to the old scan (1 killed); no sweep on issue (3 killed).

**G-264 / F-5.** SETTINGS-01's G-264 guessed the slow sign-out might be "decoy work in `session-security.service.ts`". It is not: `logout` has no decoy; the 13 to 49 s was this scan (29 s measured here for 200 rows). The gap row is on `wmt/SETTINGS-01`, not on main, so it is not edited here; it is answered by this deploy. CHECK-1 F-5 is the same cause.

**Defaults (agent), owner may override.** Sweep batch 50 per issue or sign-out; the sweep runs on sign-out as well as on issue; no `expires_at` index and no scheduled sweep.

**Mobile checks.** `npm run check` exit 0 before and after (209 tasks, 279 artboards covered; docs-only change).

**NOT RUN.**
- Timing on the production droplet (the numbers above are this 4 core box under load). Unblocked by: deploying `wmt/AUTH-08` and timing `POST /auth/refresh` with an account that holds many sign-ins.
- The phone-side effect (the app's cold-start refresh no longer shows a blank page for 20 s): not built or driven, no app code changed. Unblocked by: CHECK-1's `refresh2.py` against a stack running this wawu-id.
- Secret scan of the real key: the lead runs it. My scan of the staged diff for key-shaped strings (`sk_`, `FLWSECK`, private-key headers, bearer tokens, 40+ hex or 60+ base64 runs) found nothing; the test script makes its own throwaway keys at run time.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "evidence reviewed"._
