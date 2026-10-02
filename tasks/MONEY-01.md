---
id: MONEY-01
title: Protected route list and regression suite
owner: YOU
area: MONEY
order: 7
priority: launch
repo: wawu-backend
type: setup
status: building
depends_on: []
decisions: []
passes: [V1, V3]
artboards: []
---
# MONEY-01 · Protected route list and regression suite

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Nothing the live web uses may change behaviour while the backend grows. This suite is the tripwire for every backend task (V3).

## Scope

`.pipeline/protected-registry.json`: every route the web and dashboard call today, with auth and response shape. Contract tests generated from it. Run against main; lock when green.

## Capability checks

- [ ] The suite passes on current main.
- [ ] Changing a protected route's response shape in a scratch branch makes it fail.
- [ ] README explains how to run it (V3) against any branch.

## Builder report

wawu-backend `wmt/MONEY-01` @ 5f2658a (one commit on origin/main 231cb64). Files: `.pipeline/protected-registry.json` (new `protectedRoutes` section only; rest untouched), `src/protected-routes/{protected-routes.regression,shape}.spec.ts`, `test/protected-routes/{shape,registry,harness,pin-environment,route-table,db-snapshot}.ts`, `scripts/protected-routes/{run.sh,extract-callers.py}`, `package.json` (test:protected, protected:lock, protected:callers), `README.md` ("Protected route suite").
- Protected: 235 routes = every Hub call in wawuafrica origin/main 235945b (169) and wawu-dashboard origin/main c1dfca6 (72; 6 shared), read by `extract-callers.py` from git refs (both working trees were on other branches). Each entry: callers, auth kind + guards + admin roles, probe, locked status + response shape; lock sha256 over setup + routes. Coverage: 215 success, 6 refusal, 14 unavailable (no Flutterwave/storage/Gemini/WellaHealth in CI env).
- Check 1, passes on main: `PROTECTED_LOCK_REF=wmt/MONEY-01 scripts/protected-routes/run.sh --fresh origin/main` (code = main 231cb64, fresh money01_runner_test, mock :4401) -> 246/246, exit 0. Also `npm run test:protected` on money01_hub_test 246/246 (x3), and on a fresh money01_fresh_test; DB checksums identical before/after a run.
- Check 2, shape change fails: dangling scratch commits built with a temporary index (no branch, not in wmt/MONEY-01, `git branch -a --contains` empty): rename `slotsTotal`->`slotLimit` (7755429) -> exit 1, GET /creator/state + PATCH /creator/dm-settings report "missing (removed or renamed)" + "not in the lock (widened)"; retype to string (fe3d0bb) -> exit 1 "locked as number, now string"; drop CreatorAccountGuard on /dm/response-stats (fd4fd2a) -> exit 1 (guards changed, non-creator 403 -> 200). Hand-loosened registry via PROTECTED_REGISTRY -> lock-hash test fails.
- Check 3: README "Protected route suite" explains this checkout, any ref (code from ref, suite + lock from PROTECTED_LOCK_REF, default origin/main), --fresh, re-locking, caller diff.
- Gates before -> after: tsc 0 -> 0; eslint 4497 -> 4497 (new files clean); scripts/gates 16 fail / 76 accepted -> same (523 -> 525 files); full jest (money01_hub_test, mock :4401) 1372 pass/40 fail -> 1609 pass/40 fail. The 40 are 4 suites that hardcode localhost:4001 (account, credits-state, kyc-submission, privacy-settings), environmental here, same on main.
- Found on main, locked as-is, not fixed (owner): POST /kyc for a creator with no CreatorState row (no upload yet) writes the submission then answers 404 "Not found."; POST /learn/courses/:id/enrol 403 cites the removed subscription ("free-course slots ... paid creator subscription"); GET /notifications nests a second envelope inside `data.items`; mock-wawu-id has no /internal/users/:id/name, so a name in PATCH /users/me 502s locally (probes send no name).
- Not done: no PR, per run instructions. Lock was recorded locally, not on CI; CI runs it inside `npx jest` (mock :4001, wawu_hub_test). Until merged, origin/main has no lock: use PROTECTED_LOCK_REF=wmt/MONEY-01.

## Verifier report

Verifier: fresh session, 2 Oct 2026. Own clone of wawu-backend `wmt/MONEY-01` @ 5f2658a with origin/main = 231cb64 (confirmed as GitHub main by `git ls-remote`). Own databases `money01v_*_test` (all dropped afterwards), mock WAWU ID on :4601, app on :3601. Callers read only from `origin/main` (web 235945b, dashboard c1dfca6) via `git archive`. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money01/` (logs named below).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (nothing went up; same pre-existing failures) | tsc 0 -> 0 errors. eslint (no `--fix`) 3646 errors + 851 warnings = 4497 -> 4497; new files 0. `scripts/gates/run.py` 16 fail / 0 warn / 76 accepted on both, files scanned 523 -> 525, the failure, warning and accepted lists identical item for item; `check_baseline.py` exit 0 both. Full jest (`--runInBand`, mock :4601): main 1372 pass / 40 fail / 3 skipped of 1415; branch 1618 pass / 40 fail / 3 skipped of 1661. Same 40 failures by name: kyc-submission 22, privacy-settings 9, account 5, credits-state 4, all suites that hardcode `http://localhost:4001` (`jest_main.json`, `jest_branch2.json`, `gates_*.log`, `eslint_*.json`) |
| V3 Regression (this task's suite, on main) | passed | `PROTECTED_LOCK_REF=wmt/MONEY-01 scripts/protected-routes/run.sh --fresh 231cb64` -> 246/246, exit 0 (`run_main.log`). `npm run test:protected` on this checkout x3 -> 246/246 each (`tp_1.log`, `tp_2.log`, `tp_trace.log`) |
| Capability: suite passes on main | passed | as V3 |
| Capability: a shape change in a scratch branch fails | failed for some routes (passed for most) | 9 own scratch commits, none of them the builder's, see findings 1 and 2 |
| Capability: README explains running it against any branch | passed, with finding 3 | followed it as written, see check 6 below |

### What I checked, and what came back

1. **Diff vs report.** `git diff 231cb64...wmt/MONEY-01 --stat`: 13 files, 14948 insertions, **0 deletions**. Exactly the builder's file list. Registry: the 20 old top-level sections compare equal, and the old file minus its final `}` is a byte-for-byte prefix of the new one, so the only change is `,` plus the new `protectedRoutes` section.
2. **Coverage.** I wrote my own extractor, not `extract-callers.py`. Web: it parses every `apiFetch`/`apiFetchPaginated` call (balanced parens, comments stripped, mocks and `api.generated.ts` excluded), takes the method from the `method:` expression (both methods where a ternary chooses), adds every `verifyPath:` literal as a POST (the payment-return page posts to it) and both paths in `profile.ts`'s variable. Dashboard: actual call sites of `request`/`requestList`/`opsRequest*`, resolving `LEGAL_ROUTE_FOR`, `APPLICATION_ROUTE_FOR` and admin-events `spec.route`, plus `adminAuthRefresh` in client.ts and the ops proxy's `GET /admin/auth/me`. Result: web 169, dashboard 72, shared 6, union **235**, identical to the registry's 235, method and path, in both directions. The only declared-but-uncalled routes are the 6 dashboard keys the registry lists under `notProtected`. Raw `fetch` in the web goes only to WAWU ID (`/auth/refresh`) and a static `/tgif` file, and XHR only to the presigned storage URL. `npm run protected:callers` against the real repos (read-only `git archive`) also reports 0 differences.
3. **Breakage is caught**, using dangling commits built with a temporary index on 231cb64 and run through `run.sh <sha>` with the lock from `wmt/MONEY-01` (`mutations.txt`, `mut_*.log`):
   - removed `userWawuId` from GET /credits (controller): exit 1, "missing (locked key removed or renamed)"
   - added a key to GET /credits: exit 1, "not in the lock (response widened)"
   - `@HttpCode(200)` on POST /users/me/experience: exit 1, "locked status 201, now 200"
   - added `support` to POST /admin/kyc/:id/approve roles: exit 1 (roles changed, and support got 200 where 403 was locked)
   - content CreatorAccountGuard lets any profile through (guard list unchanged): exit 1, "a non-creator account: expected 403, got 200/201"
   - deleted DELETE /users/me/experience/:id: exit 1, "no longer mounted" plus 404s where 401 was locked
   - GET /learn/courses `hours` number to string inside the list: exit 1, "locked as number, now string"
   - a branch that deletes a route AND drops its registry entry AND recomputes the sha256: red with the lock from `wmt/MONEY-01`, green with its own lock (finding 4)
   - **not caught (stayed green, exit 0):** removing or adding a key on GET /credits in the service's existing-row branch (finding 5); renaming `title` on GET /search content items (finding 2); changing the success shape of GET /bills/categories (finding 1).
   The scratch commits are on no branch (`git branch -a --contains` is empty) and only exist in my scratch clone.
4. **The 14 routes locked on a 5xx and the 6 on a 4xx:** see finding 1. These routes are protected for being mounted, for their guards and roles, for the 401/403 checks and for the error status. They are **not** protected for the response the web reads when the route works.
5. **Safety.** A non-test name is refused by the suite (`money01v_notdisposable`: "does not look like a test database", exit 1) and by `run.sh --fresh` ("refusing to recreate", the database is not created). The database is restored: my own per-table, order-independent checksums plus sequence values were identical before and after two `test:protected` runs and after the 11 `run.sh` runs on the runner DB (`sum_*.txt`). Two gaps: findings 3 and 6.
6. **README as written.** Both `npm run test:protected` and `run.sh --fresh <ref>` work as described: the suite starts the mock itself when the port is free and stops it afterwards. `protected:callers` works too. Before merge, running `run.sh` without `PROTECTED_LOCK_REF` fails with `fatal: pathspec 'src/protected-routes' did not match any files` / `tar: This does not look like a tar archive`. The README warns about this, but the error itself does not tell you what is wrong. It goes away on merge.
7. **Gates and jest:** see the V1 row. The 40 failures are the same 40 on main, confirmed. The builder's branch figure of 1609 pass does not add up: 1372 + the suite's 246 new tests = 1618, which is what I got. The report has a small arithmetic error here; it hides nothing. (A first branch run of mine showed 75 failures. All were 401s caused by my mock serving a different `private.pem` from the one the specs read, so I re-ran it with a mock started from the branch's own `mock-wawu-id`. It was my setup, not the code.)
8. **The builder's five problems on main**, all live-checked against main 231cb64 on :3601:
   - POST /kyc 404 after the write: **confirmed.** A creator with no CreatorState row gets 404 "Not found." and the `KycSubmission` row is written (status `pending`).
   - Enrol 403 citing the subscription: **confirmed.** Message "...come from an active, paid creator subscription (basic=1, pro=3)." (`course-enrollment.service.ts:67`).
   - Nested notifications envelope: **confirmed.** `data.items` is `{statusCode, message, data: [...], pagination}`.
   - Mock has no name route: **confirmed.** The mock has no `/internal/users/:id/name` (it 404s). PATCH /users/me with `firstName`+`lastName` gives 502 "Your name could not be saved." (A body field literally called `name` is rejected 400 by the whitelist instead.)
   - Hardcoded :4001: **confirmed**, in credits-state, kyc-submission and privacy-settings (constant `MOCK_WAWU_ID_URL`) and account (`WAWU_ID_BASE_URL_TEST ?? 'http://localhost:4001'`).

### Findings

1. **defect: 20 protected routes have no success shape locked, so a shape change on them is not caught.** 14 are locked on a 5xx and 6 on a 4xx, each with `data: null`, and a `null` lock accepts anything. What is pinned is that the route is mounted, its guards and roles, its 401/403 behaviour, and the same error status. The JSON the web parses when the route works is not pinned at all. Proven: scratch commit 98aeab4 wraps the GET /bills/categories result in `{wrapped: ...}` and the suite stays green. For most of these routes this is avoidable, not forced by the environment:
   - POST /uploads/presign and the three `.../document-url` routes only sign locally (`getSignedUrl`, `storage.service.ts`) and write to the DB. With dummy `STORAGE_*` values they would answer 2xx with no network. This is the upload path, the one behind WORKFLOW's "uploads broke while every test was green".
   - The Flutterwave and WellaHealth routes (bills x5, care x2, payments/hosted-link, legal payment/consultation verify) all go through `fetch`, which the suite already intercepts (`sealNetwork`), so canned provider answers could be served there.
   - Four of the six 4xx locks come from the scenario order, not the product. POST /legal/intake/:id/complete gets 400 "Still needed..." (no answers were sent). POST /legal/ops/requests/:id/deliver gets 409 (the request is still awaiting payment). consultation/complete gets 400 (no paid consultation). POST /care/subscriptions/:id/verify gets 404 (its init 502'd).

   Related: 6 lists are locked as an empty array, so their elements are not pinned: GET /professionals, /wallet/history, /shop/orders, /bills/ops/stuck, /care/subscriptions, /care/ops/subscriptions/stuck. So are the result lists of GET /search (content, creators, communities) and GET /search/closest. Scratch commit 4a5389f renames `title` in search content items and the suite stays green. The builder's "215 success" therefore overstates what is shape-locked. Where: `.pipeline/protected-registry.json` `protectedRoutes.routes[*].expect`, the probes and setup there, and `test/protected-routes/harness.ts` `PINNED_ENV`/`sealNetwork`.
2. **defect: the capability check "changing a protected route's response shape makes it fail" does not hold for the routes in finding 1**, as shown by 98aeab4 and 4a5389f. It holds for every other mutation I tried.
3. **defect: `run.sh` without `--fresh` migrates the database before anything checks that it is a test database.** The `else` branch runs `npx prisma migrate deploy` against `DATABASE_URL`, and the name check only happens later inside jest. Proven: an empty database named `money01v_prodlike` ended up with 66 migrations and 76 tables applied, and only then did the suite refuse it. Anyone who runs `run.sh wmt/<task>` with their `.env`'s dev, staging or production `DATABASE_URL` would apply that branch's unmerged migrations to it. The README does not warn about this. Where: `scripts/protected-routes/run.sh`, the `npx prisma migrate deploy` in the `else` branch, which runs before `assertDisposableDatabase`.
4. **unclear (owner): CI's in-tree run cannot catch a branch that rewrites its own lock.** `npx jest` and `npm run test:protected` read the branch's own registry, and the sha256 is just a hash of its content, so anyone can recompute it. Proven: 6ce263f deletes a route, drops its entry and rehashes. With its own lock that gives 245/245 green; with the lock from `wmt/MONEY-01` it is red. The guarantee "a branch cannot pass by editing its lock" only holds for `run.sh` with the lock from main. The README sentence "It also runs inside ... the CI `npx jest` step" can be read as CI enforcing V3. The owner should decide whether CI should run `run.sh` with the lock taken from origin/main.
5. **unclear (owner): each route is probed once, by a brand-new account, so only that one code path is pinned.** Removing `userWawuId`, or adding a key, in `CreditsStateService.getOrCreate`'s existing-row branch (the branch every returning user hits) stays green (ed86dd2, 76ea3b5), because the probe account never has a row yet. The same applies to any route whose answer branches on prior state. Related leniency, which the builder documented and chose on purpose: 820 of 3897 locked leaves are `null`, `[]` or `unknown` and accept any value (153 of the 215 success routes have at least one), e.g. GET /credits `trialEndsAt`. The owner decides whether that is acceptable for V3.
6. **unclear (owner): no database host check.** Only the name is checked. `DATABASE_URL=postgresql://...@db.invalid:5432/remote_hub_test` was accepted and the suite tried to connect (ENOTFOUND). `run.sh --fresh` would `DROP DATABASE` on any remote host whose database name contains "test" or "protected". Outbound HTTP to non-local hosts is refused (`sealNetwork`, and `fetch` is the only HTTP client in `src`; no route actually tried it in my runs).
7. Not a finding on the code: the builder's databases `money01_fresh_test`, `money01_hub_test` and `money01_runner_test` were still on the local Postgres when I started. I left them alone.

Status back to `building`: findings 1-3 are open defects.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
