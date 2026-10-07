---
id: AUTH-08
title: Refreshing and signing out stay fast however many times a person has signed in
owner: YOU
area: AUTH
order: 182
priority: launch
repo: wawu-id
type: backend-endpoint
status: review
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

**Verifier:** independent session (wrote none of this). wawu-id `wmt/AUTH-08` `dd4326a` (one commit on origin/main `4715d17`, 6 files, matches the builder's list) against `4715d17`; mobile `origin/main` for the app. Built `dist/main.js` of both, real Postgres (`va08_test_*`, all dropped), real argon2 at the production cost, tokens minted by the real code. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/va08/` (below `va08/`). **The box was shared and busy:** load average 4 to 7 for the timing runs in pass 2, 20 to 58 for the mutant, jest and app runs.

**Verdict: no open defect.** Every security probe held. One low note on a sweep failure inside a refresh (F-1), one test gap (F-2), one brittle spec timing (F-3), and the transition-period cost is real and now measured (F-4). Status `review`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | **passed**: wawu-id `tsc` 0 on both, eslint 43 `.ts` errors on both (identical set), mobile `npm run check` exit 0 (46 suites, 797 tests, gates 9 run, 216 files scanned, 0 findings; a first run at load 30 had one 20 s jest timeout in `OpenWalletScreen.test.tsx`, a file this docs-only change does not touch, and passed on the second) | `va08/eslint-*.json`, section Regression |
| V2 Contract (security: reuse, signed-out, bad hash, wrong account, password change, races, sweep, code rolled back) | **passed** 32 of 32, 3 races x 40 trials, 15 of 15, 10 of 10 (one observation, F-1) | `va08/pass1.out`, `pass1b.out`, `pass1b-r1wide.out`, `pass1c.out`, `pass1d.out` |
| V3 Regression and migration | **passed**; full jest has load-only failures (re-run alone below) | `va08/rerun-summary.txt`, `jest-*.out`, section Migration |
| Capability check 1 (speed) | **passed for rows that carry a jti; pre-change rows cost what they cost today** (F-4) | `va08/pass2-branch.out`, `pass2-main.out`, `logintime.out` |
| Capability check 2 (pre-change token once only) | **passed** (T1, T2, P4a, R1 to R3 on null-jti tokens) | `va08/pass1.out` |
| Capability check 3 (every session-security rule) | **passed** (T7, R1, R2, `session-security.spec.ts` 24 of 24, `test:session-local` 38 of 38) | `va08/pass1*.out`, `session-local-branch.out` |
| V4 Field trace | **passed**: writer `issueTokens` (every route that mints a pair) stores `jti`; readers `rotateRefreshToken`, `revokeRefreshToken` by (account, jti) with the null-jti scan only when no row holds it; every other place that touches the table (`session-security.service.ts:112`, `auth.service.ts:765,805,1054,1092`) deletes by account and so ends null-jti and new rows alike | `va08/pass1.out` T7, code read |
| V9 Live seam, the Expo app | **passed for sign-in and refresh after expiry; sign-out NOT RUN in the app** (it has none) | `va08/appdrive.out`, `app-*.png` |
| Mutants | **10 of 11 live mutants killed by my probes, the 11th by the repo's race spec; 2 equivalent** | `va08/mutants.txt`, `mutants2.txt` |

**Security (all over HTTP, :5351 branch and :5352 main, DB `va08_test_auth08_x`).** Tokens were minted on main first (real main login and refresh), the branch migration applied over those rows, then the branch served them. Main's tokens carry a signed `jti` in the payload but no row holds it (confirmed: payload keys `sub,jti,type,iat,exp`).
- Reuse of a rotated token, old and new style: 401 each; the replacement works once (200), the next use 401, and what that replacement was swapped for works (T1 to T3). A pre-change token that was never used refreshes once only.
- A signed-out new-style token: 401, no row appears or vanishes, sign-out again 200 and kills no other row, while the account held live null-jti rows that the fallback scan could have matched (T4). Contrast only (needs a DB write): a null-jti row that holds the hash of that exact token does work, which is the intended meaning of a pre-change row.
- A new-style token whose jti row exists but whose hash fails: 401 even with a bait null-jti row holding the right hash; its sign-out deletes neither row (T5).
- Cross-account: a token for A (signed with the run's key) naming B's jti, with B's row hash set to the hash of that very token, so only the account filter stands in the way: 401, B's row survives, sign-out answers 200 and deletes nothing, no row of A or B added or removed (T6). This kills the builder's surviving M5 (probe P1 in `va08/probe.mjs`); the builder's own wrong-account spec does not (F-2).
- Password change: 5 tokens ended (two minted by main, one new-style, two crafted pre-change with and without a jti), C holds exactly 1 row (the hand-over) and it refreshes, another account's old and new tokens untouched (T7). There is no sign-out-all route; the other places that clear every token (`auth.service.ts` reset, delete, phone change) delete by account, which includes null-jti rows by construction.
- Races (40 trials each, half the trials on null-jti pre-change tokens): rotation vs password change 0 bad (jitter 0 to 40 ms: rotation won 40; jitter 100 to 700 ms: rotation won 7, password change won 33, so both orders ran), and every time the only live token was the hand-over; rotation vs sign-out of the same token 0 bad (refresh won 10, sign-out won 30; when sign-out won, no row was left; when refresh won, the presented token is dead and the new one lives, as the SETTINGS-03 spec already allows); 2 to 4 parallel rotations of one token: exactly one winner in 40 of 40, one row left.
- Sweep: deletes only the account's own expired rows (7 of 7 removed, 5 live rows kept including one expiring in 20 s, another account's expired and live rows untouched, also by sign-out); at most 50 per call (120 expired: 70, 20, 0 over three sign-ins, 423 ms for the first); also runs on refresh and sign-out; an expired token's sign-out answers 200 and refresh 401. 36 concurrent logins, refreshes and sign-outs on an account with a 60-row expired backlog: no 5xx; the server log holds no token.
- Code rolled back to main with the column present: new-style tokens refresh once (found by hash), sign-out ends them, a password change ends them all; a token main issued during the rollback (null jti) then refreshes once on the branch again through the fallback.

**Speed, HTTP, real Postgres, load 4 to 7 (ms; `va08/pass2-*.out`).**

| Case | main | branch |
|---|---|---|
| 2 stored: refresh / sign-out | 430 / 378 | 410 / 205 |
| 200 rows carrying a jti, live token newest: refresh / reuse refused / sign-out | 42991 / 28967 / 25816 | **400 / 10 / 186** |
| 200 NULL-jti rows (the transition), live token newest: refresh / reuse refused / sign-out of the replacement | 23200 / 30980 / 42977 | **41681 / 36589** / 148 |
| 200 null-jti rows, live token oldest: refresh | 471 | 259 |
| 200 null-jti rows plus a new-style live token: refresh / reuse refused / sign-out / refresh after sign-out (refused) | 41990 / 33634 / 34314 / 33748 | **378 / 29078 / 227 / 53811** |
| sign-in (median of 6, two runs): 200 live rows | 245, 457 | 263, 316 |
| sign-in (median of 6, two runs): 200 expired rows (branch sweeps 50 per sign-in) | 280, 478 | 300, 386 |

Reading: once rows carry a jti, refresh and sign-out are under half a second at 200 rows (main 26 to 43 s); a sign-in costs the same (the sweep adds at most about 100 ms). With the builder's own driver (`test:refresh-local`) the branch passes 29 of 29 (refresh 569 ms, sign-out 205 ms at 200 tokens, 2 tokens 515 ms) and main fails the same 4 checks the builder named (67207 ms and 97501 ms under load).

**The transition (F-4).** Pre-change rows still cost what they cost today, and so does the refusal path while they last. With 200 unexpired null-jti rows: a pre-change token that sits late in the scan refreshes in 41.7 s (23.2 s on main for the same row; it is position dependent, 0.26 s when it is first), and any refusal (a reused or signed-out token of any style, since a new-style token cannot be told from a pre-change one by payload) scans all 200: 29 to 54 s. A new-style token with 200 null-jti rows beside it refreshes in 0.38 s. So the speed-up reaches an account when its device has done one refresh; an account like CHECK-1's `creator-pro` (53 old rows) still pays up to 53 hash checks on each old token's first refresh and on each refusal until those rows expire (30 days at most). Not a defect against the task text ("tokens issued before this change still work ... by the old path limited to unexpired records") but it is what the owner should expect on deploy day.

**Migration.** Applied over a database holding 5 rows (md5 of id, user, hash, expiry, created_at identical before and after, 0 rows with a jti); `prisma migrate diff --from-config-datasource --to-schema` on the migrated database: "No difference detected" (and it does report the removed column and index against main's schema, so the check is not vacuous); the header's three rollback statements run as written: 5 rows kept, column gone, `migrate status` shows it pending, `migrate deploy` re-applied it and the diff is clean again (rows that held a jti come back with null, and their tokens work through the fallback). `20261007120000_refresh_token_jti` sorts after every folder on origin/main (latest `20261003120000_signup_sequence`) and every origin branch (latest other `20261006120000_signup_code_channel`, AUTH-07).

**Regression.** `npx tsc --noEmit` 0 on both. eslint over `src test`: 43 errors in `.ts` on both with the identical file and rule set (`eslint test` also reports a parse error for each `test/*.mjs` script because the project service does not cover them: 4 on the branch, 3 on main, the new script being the same class as its three siblings). `session-security.spec.ts` byte-identical (same git blob `0141a72`) and passes 24 of 24 on the branch (rerun alone). `npm run contract:build` leaves `contract/openapi.json` unchanged (git status clean). `npm run test:session-local` 38 of 38 PASS and `npm run test:refresh-local` 29 of 29 PASS on the branch. Full jest at load 20 to 58, first pass: branch 4 failed suites / 29 failed tests, main 2 / 28, all `phone-signup`, `signup-sequence`, `pending-signup-no-session` argon2 timeouts plus the AUTH-08 speed test; different names on each side between runs. Re-run alone with `--testTimeout=180000` (flag only): branch: `phone-signup.service` 44 of 44, `pending-signup-no-session` 14 of 14, `signup-sequence.service` 22 of 22, `session-security` 24 of 24, `refresh-token-lookup` 19 of 20 (the 1000 ms clock line only: 2067 ms and 2369 ms at load 34 to 36, with one hash check; see F-3); main: the same three suites 44, 14, 22 of 44, 14, 22. No test fails by name on one side only. `refresh-token-lookup.spec.ts` is a new file (20 tests, +20 over main).

**The app** (mobile `origin/main`, web export with a private `TMPDIR` and `--clear`, `EXPO_PUBLIC_ID_URL=http://localhost:5351`, `EXPO_PUBLIC_API_URL=http://localhost:5352`; the bundle holds exactly those two URLs and no `wawuafrica.com`; every other request was aborted by the harness and none was attempted). The Hub was a stand-in on :5352 that checks the bearer the way the Hub does (RS256 and expiry), because only wawu-id was under test. Access tokens were set to 20 s. Real sign-in screen: signed in, the refresh token carries a jti and its row was stored; with 200 stored rows and the access token expired, a reload made the app call `GET /auth/signup/progress` (401), `POST /auth/refresh` (200, 2926 ms at load about 40), repeat (200), then the Hub calls (200); the stored refresh token was replaced, the old row gone and the new one stored. `POST /auth/logout` with the refresh token the app held: 200; after the next expiry the app's refresh got 401, the tokens were cleared and it landed on `/welcome` (`app-3-after-signout.png`). No app change was needed. The app has no sign-out button and `signOut()` never calls `/auth/logout` on mobile main, so sign-out was driven with the same endpoint and token, not by the app.

**Mutants** (own, in a separate worktree, each rebuilt and run against my HTTP probes `va08/probe.mjs` and the repo's two specs; timing probes were re-read at the load noted):

| # | Mutation | Probes | Specs |
|---|---|---|---|
| M1 | account removed from the lookup (where and the belt check) | killed (P1) | only by the old spec's loose stand-in (13 SETTINGS-03 failures), not by the AUTH-08 wrong-account test |
| M2 | account removed from the where only | equivalent (the belt check still refuses another account's row) | same noise |
| M3 | a bad hash falls through to the scan | killed (P2) | killed |
| M4 | scan includes rows that carry a jti | killed (P6 timing, 7215 ms) | killed |
| M5 | sweep without the 50 bound | killed (P5c) | killed |
| M6a | sweep query takes live rows, guard kept | equivalent (guard) | survives |
| M6b | sweep query takes live rows, guard removed | killed (4 probes) | killed (9) |
| M7 | sweep not scoped to the account | killed (P5b) | killed |
| M8 | scan not limited to unexpired rows | killed (P7 timing, 9844 ms) | killed |
| M9 | no hash check when a jti row is found | killed (P2) | killed |
| M10 | rotation ignores the delete count | killed (P8, 3 parallel) | survives (F-2) |
| M11 | no scan for a token that names a jti | killed (P4a, P4b, P7) | killed |
| M12 | sign-out without the account lock | survives my probes (no race probe) | killed by the SETTINGS-03 race spec on the second run, survived the first |

**Findings.**
- **F-1 (unclear, low): a refresh fails 500 if the expired-row sweep statement fails.** The sweep catches its error, but inside the rotation transaction a failed statement aborts the Postgres transaction, so the insert after it fails and the refresh answers 500 (the old token's row is kept, a retry once the cause is gone works). Reproduced with a trigger that refuses deletes of expired rows (`va08/pass1c.out` S4): sign-in 200, sign-out 200 and ended, refresh 500, `Could not prune` logged. Sign-in and sign-out are not blocked, as the builder says; refresh is, and the builder's comment says so ("inside a transaction a failure here fails the statement after it anyway"). A real cause would be a deadlock or lock timeout on those deletes; 36 concurrent mixed calls over a 60-row backlog gave none. Not a security issue and not blocking. Default (agent), owner may override: accept; the fix is to run the sweep outside the transaction or inside a savepoint.
- **F-2 (note): two specs gaps.** No repo spec kills M1 for the right reason (the cross-account probe that does: B's row hash set to the hash of A's forged token) and none kills M10 (two parallel rotations of one token). Both properties hold over HTTP here (P1, R3 and P8).
- **F-3 (note): the AUTH-08 spec asserts a 1000 ms wall clock** on the 200-token refresh and sign-out: it failed at load 35 (2067 ms) with one hash check, and in every mutant run at load above 20. Its sibling assertions count hash checks and are load-proof; the clock one is the only flaky line. Passes when the box is quiet (builder 291 ms).
- **F-4 (recorded): transition cost**, above.

**NOT RUN.**
- Timing on the production droplet and how many unexpired null-jti rows production holds. Unblocked by: deploying `wmt/AUTH-08` and running `select user_id, count(*) from refresh_tokens where expires_at > now() group by 1 order by 2 desc limit 10;` on the production wawu-id database, then timing `POST /auth/refresh` for the top account.
- Sign-out through the app. Unblocked by: SETTINGS-01 (todo) building a sign-out that calls `POST /auth/logout`.
- The real Hub (a stand-in checked the bearer). Unblocked by: `scripts/local/up.sh` from the backend repo, not needed for a wawu-id-only change.
- A quiet-machine run of the full jest suite and of the AUTH-08 speed spec. Unblocked by: running `npx jest` when the load average is under 4.
- The owner's phone.

**Secret scan** of my staged diff (task file, LOG, PROGRESS): nothing found (`sk_`, `FLWSECK`, private-key headers, bearer tokens, `eyJ` tokens, 40+ hex or 60+ base64 runs), and no em-dash added. I wrote no product or test code; mutants live only in my own worktree `va08mut` (restored from git after each, removed with it).

## Owner sign-off

_Owner: date, and "evidence reviewed"._
