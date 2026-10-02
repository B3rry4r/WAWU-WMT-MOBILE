---
id: MONEY-01
title: Protected route list and regression suite
owner: YOU
area: MONEY
order: 7
priority: launch
repo: wawu-backend
type: setup
status: review
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

### Round 2 (backend ddb5727 on 5f2658a)
- Fix 1, success shapes: provider doubles (`test/protected-routes/providers.ts`) answer Flutterwave, WellaHealth and Gemini through `sealNetwork`. Storage has dummy credentials and signs locally. The wallet gateway uses the production client against the double. The probes are reordered. Result: 240 of 241 entries lock a 2xx (round 1: 215 of 235). The exception is a NEW course enrolment, refused for everyone on main (slots tied to the removed subscription; registry `why`); its `already enrolled` variant locks the success shape.
- Fix 2: the six lists and search content/creators now have items. Search `communities` is `[]` for every query on main. Runner, lock = this branch: verifier's 98aeab4 (bills wrap) recreated as 7ae419d -> exit 1 "locked as an array, now an object"; 4a5389f (search title rename) as 3239787 -> exit 1 "title missing / headline widened".
- Fix 3 + 6: `run.sh` checks host (localhost/127.0.0.1/::1) and name before any migrate or drop; the suite checks the host too. Results: money01_prodlike -> exit 1, 0 tables; db.invalid -> exit 1 for run.sh, --fresh and the suite. A lock ref with no suite now gets a clear refusal.
- Fix 4: new `.github/workflows/protected-routes.yml` (pull requests only; deploy.yml untouched). It runs PR code against the base branch's lock and puts `lock-diff.py` in the job summary. A lock change needs the owner's `relock-approved` label. Proof: dc6b9fc changes the bills shape and rewrites its own lock with a recomputed hash. It is green on its own lock (the old in-tree run) and red on this branch's lock (what the workflow does); lock-diff exits 1 naming the entry. The workflow file was not run on GitHub.
- Fix 5: six variant entries (GET /credits, /settings/notifications, /settings/privacy, /creator/state [returning user]; GET /users/me [new account]; enrol [already enrolled]). Verifier's ed86dd2 and 76ea3b5 (existing-row credits) recreated as 1af6ccc and 7172efa -> exit 1 on `GET /credits [returning user]`. Optional inputs filled. null/[]/unknown leaves went from 820 of 3897 to 645 of 4430. What remains:
  - lifecycle fields the entity has not reached (deliveredAt, cancelledAt, refundedAt and similar);
  - `nextPage` on single-page lists;
  - fields no protected route writes (recap*, durationLabel, lessons);
  - WAWU ID fields the mock lacks (gender, occupation, state);
  - search `communities`.
- Main still passes: `run.sh --fresh origin/main` -> 252/252. `npm run test:protected` x2 on money01_hub_test -> 252/252; DB checksums identical. All scratch commits are dangling (`git branch -a --contains` empty).
- Gates: tsc 0; eslint 4497 (unchanged); gates 16 fail / 76 accepted (unchanged); full jest 1624 pass / 40 fail (the same 4 :4001 suites). Round 1's "1609" was wrong; the correct figure was 1618.

### Round 3 (backend 9d93ed3)
- CI: `.github/workflows/protected-routes.yml` (`permissions: contents: read`) checks out the BASE branch and runs the base's `ci-check.sh`, `run.sh`, `lock-diff.py` and suite against the PR's head commit. `run.sh` now uses its own jest config and fails unless every locked entry ran and passed. Any change under src/, test/ or scripts/protected-routes, or to the workflow, counts as a relock. `relock-approved` counts only on the run its own `labeled` event triggers, so a later push needs it again. The first-PR exception is kept.
- Proof: I ran the workflow's run step locally. Attack deca03e (dangling) changes the bills shape, rewrites and rehashes its own lock, makes run.sh use its own lock, and adds `testPathIgnorePatterns` to package.json. With no label: exit 1 on GET /bills/categories, 243 of 244 passed, and the lock diff lists the entry and run.sh. With the label: exit 0. An unchanged PR passes; the first PR (base = origin/main) is checked against its own lock and passes. The README now lists the two repository settings for the owner (required check; CODEOWNERS).
- New entry `GET /admin/finance/wallets [withBalances]` (`balance.ngn` is a number). The receipt fixture now carries a real `charge.completed` payload, so the `charge` block is locked on GET receipts/:id and reverify. Totals: 242 entries; null/[]/unknown leaves 631 of 4475.
- Main: `run.sh --fresh origin/main` -> 253/253, all 244 required passed. Full jest 1625 pass / 40 fail (the same 4 :4001 suites). tsc 0, eslint 4497, gates 16/76 (all unchanged).

### Round 4 (backend 5832830)
- Scope corrected per the owner: the README and comments now say the suite catches accidental shape, auth and status changes and accidental or casual lock and checker edits. Deliberate tampering in PR code (seed scripts, prisma.config.ts, app code patching the checker) is not blocked; it is caught by review.
- `ci-check.sh` fails when a line a PR adds outside the checker (Markdown aside) names `test/protected-routes`, `src/protected-routes`, `compareShape` or `protected-registry`, unless the owner approved. Lock and checker changes are now measured from `git merge-base`. The workflow drops `workflow_dispatch` and checks out base and head separately with `persist-credentials: false`.
- Proof (the workflow's run step run locally, base 5832830, verifier's attack.py): A1b (28cd3ea) exit 1 naming scripts/postseed.js; A3 (6aae754) exit 1 naming the controller's compareShape patch; A2 (8fb1ae0) exit 1 naming prisma.config.ts. Control A0 (2afbab6, plain shape change) does not trip the tripwire and fails in the suite, 243 of 244. Main: `run.sh --fresh origin/main` -> 253/253, all 244 required passed.

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

### Round 2 (backend ddb5727, mobile 991b289)

Fresh clone of `wmt/MONEY-01` @ ddb5727, origin/main = 231cb64. Own databases `money01v_*_test`, all dropped afterwards. Mock on :4601, stopped by pid. Callers' origin/main unchanged (235945b, c1dfca6). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money01-r2/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (nothing went up) | tsc 0 errors. eslint 3646 + 851 = 4497 (main 4497); `protected-routes` files 0 problems. gates 16 fail / 0 warn / 76 accepted, item-for-item identical to main; files scanned 525; baseline exit 0. Full jest: main 1372 pass / 40 fail of 1415; branch 1624 pass / 40 fail of 1667. Same 40 failures by name (the four `:4001` suites). The protected spec passes inside the full run (243 + 9). Logs: `jest_main.json`, `jest_branch.json`, `gj_*.json`, `eslint_branch.json`, `tsc.log` |
| V3 Regression (suite on main) | passed | `PROTECTED_LOCK_REF=wmt/MONEY-01 run.sh --fresh 231cb64` -> 252/252, exit 0 (`run_main.log`). `npm run test:protected` x2 -> 252/252 (`tp_1.log`, `tp_2.log`) |
| Capability: suite passes on main | passed | as V3 |
| Capability: a shape change in a scratch branch fails | passed | 14 of 14 scratch commits red, below |
| Capability: README explains running it against any branch | passed | followed as written; the new safety and CI paragraphs match the behaviour I saw |

**Scratch breakages.** Each is a dangling commit on 231cb64, run with `run.sh <sha>` and the lock from `wmt/MONEY-01` (`mutations.txt`, `mut_*.log`). All 14 exit 1, each naming the right route and reason:
- Round 1's nine: removed key, widened key, 201 to 200, admin role added, guard internals loosened, route deleted, nested retype.
- Round 1's misses, recreated: bills wrap (was 98aeab4) gives "body.data: locked as an array, now an object". Search title rename (was 4a5389f) gives "content[0].title missing / headline widened". Existing-row credits key removed or added (were ed86dd2 and 76ea3b5) fails on `GET /credits [returning user]`.
- New, previously 5xx-locked: POST /uploads/presign `fileUrl` renamed to `url` gives "fileUrl missing / url widened".
- New, previously 4xx-locked: POST /wallet/withdraw `amount` number to string gives "locked as number, now string".
- New, returning-user branch: GET /settings/privacy existing row widened fails on `GET /settings/privacy [returning user]`.
- The self-relock (was 6ce263f) recreated on ddb5727 as 2938b63: red against the `wmt/MONEY-01` lock (2 failed). `lock-diff.py wmt/MONEY-01 2938b63` exits 1, naming the removed entry and the hash change. It is green against its own lock.
- Runner DB checksums (tables and sequences) were identical before and after all of this.

**Round 1 findings, closed or not:**
1. **Closed** (defect 1, success shapes). 241 entries, 240 locked on a 2xx. The one exception is the NEW-enrolment 403, which has a recorded `why` and an `already enrolled` variant that locks the success shape. In the trace, presign, document-url, hosted-link, bills, care plans and the wallet all answer 200 with real bodies. The six lists and search content/creators now have items; search `communities` is always `[]` on main. Coverage was re-checked with my own extractor: still 235 distinct routes, exact match both ways. `protected:callers` reports 0 differences.
2. **Closed** (defect 2, the capability check): see the breakages above.
3. **Closed** (defect 3, `run.sh` migrating a non-test DB). These are refused with 0 tables touched:
   - empty `money01v_prodlike` via `run.sh <ref>` and via `run.sh` with no ref;
   - `db.invalid` via `run.sh`, via `--fresh` and via the suite (even with `PROTECTED_ROUTES_ALLOW_DB` set);
   - `127.0.0.2`.
4. **Partly closed, still unclear (owner)** (CI lock). `.github/workflows/protected-routes.yml` parses and has no `secrets.*`. It is `pull_request` only (not `pull_request_target`), so forks get no secrets. Its DB is the localhost service container, which run.sh's host check also enforces, so it cannot touch production. I simulated its steps locally: `lock-diff origin/main HEAD` gives exit 2 (this PR uses its own lock); `lock-diff wmt/MONEY-01 HEAD` gives exit 0. It has never run on GitHub: NOT RUN there. What it does not close:
   - **It runs the PR's own `scripts/protected-routes/run.sh`, `lock-diff.py` and (on `pull_request`) its own workflow file.** Proven: c26400a is the self-relock plus one changed line in run.sh. Run the way the workflow step runs it (`PROTECTED_LOCK_REF=<base> run.sh --fresh HEAD` from that checkout), it reports `lock: HEAD` and passes 251/251 with no label. The lock-diff summary would still say "This branch changes the lock" unless lock-diff.py is edited too. Mitigation is the owner's call: take run.sh and lock-diff.py from `origin/$BASE_REF`, put CODEOWNERS on `.github/` and `scripts/protected-routes/`, and make this job a required check.
   - The `relock-approved` label stays on after later pushes, so lock changes in later commits pass unreviewed.
   - `lock-diff.py` only diffs the registry. A PR that loosens `test/protected-routes/shape.ts` is checked with the base's suite and lands without the label gate.
   - There is no `permissions:` block, so the token gets the repo default (`contents: read` would do).
5. **Closed for the cases tested; leniency still the owner's call** (one probe per route). Six variant entries; the existing-row breakages are now caught. Loose leaves went from 820 of 3897 to 645 of 4430 (613 `null`, 32 `[]`). Sampled by field name, they mostly fit the builder's categories:
   - `expiresAt` 50 (tick expiries);
   - `nextPage` 35;
   - delivered, cancelled and refunded lifecycle fields;
   - recap, durationLabel and lessons;
   - gender, occupation and state;
   - search `communities`.

   Two clusters do not fit those categories, and are left to the owner:
   - `GET /admin/payments/receipts/:id` and `POST .../reverify`: the whole `charge` block, 7 fields x 2 = 14 leaves. It is null only because the probe's webhook payload carries no `data`, yet the dashboard renders `charge.amount`/`flwRef`/`chargedAmount` (`ReceiptDetail.tsx`).
   - `GET /admin/finance/wallets` `balance.ngn` is null because `?withBalances=true`, which the dashboard's toggle sends, is not probed.
6. **Closed** (DB host check), as in 3.

**Provider doubles are test-only: confirmed.**
- `test/protected-routes/providers.ts` is imported only by `test/protected-routes/harness.ts`, which only the two `src/protected-routes/*.spec.ts` import.
- `tsconfig.build.json` excludes `test` and `**/*spec.ts`; `tsc -p tsconfig.build.json --listFilesOnly` lists 0 `protected-routes` files.
- The branch changes nothing in `src/` except those two spec files. The doubles are reached only through the suite's in-process `globalThis.fetch` replacement, and no env variable in `src/` switches them on.
- Informational, pre-existing on main: under jest `NODE_ENV=test` makes five modules pick their in-src Mock Flutterwave adapter, so the real adapters' parsing is not exercised by this suite for those modules. The README says so.

**Status: `review`.** No open defects. Points 4 and 5 are left to the owner.

### Round 3 (backend 9d93ed3, mobile 2b8cc6b)

Fresh clone of `wmt/MONEY-01` @ 9d93ed3, main = 231cb64. Own `money01v_*_test` databases, all dropped. Mock on :4601, stopped by pid. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money01-r3/` (`attacks.txt`, `atk_*.log`, `mutations.txt`, `mut_*.log`, `run_main.log`, `jest_*.json`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (nothing went up) | tsc 0 errors. eslint 3646 + 851 = 4497 (main 4497); new files 0. gates 16 fail / 76 accepted, identical to main; baseline exit 0. Full jest: main 1372 pass / 40 fail of 1415; branch 1625 pass / 40 fail of 1668. Same 40 by name (the four `:4001` suites); protected spec 244 + 9 pass inside the full run |
| V3 Regression (suite on main) | passed | `PROTECTED_LOCK_REF=wmt/MONEY-01 run.sh --fresh 231cb64` -> 253/253, "all 244 required tests passed", exit 0 |
| Capability: a shape change in a scratch branch fails | passed with `run.sh`; **failed** through the CI check when the branch's code also tampers | 16 of 16 plain breakages red, but 2 tampering PRs green (finding R3-1) |
| Capability: README explains running it against any branch | passed, except one claim | README: "a pull request cannot loosen the checker or its own lock" is not true (R3-1) |

**Plain breakages** (dangling commits on 231cb64, `run.sh <sha>` with the lock from `wmt/MONEY-01`): all 16 exit 1. That is the 14 from round 2, plus the two new locks:
- receipt `charge.chargedAmount` to a string fails GET /admin/payments/receipts/:id and POST .../reverify ("locked as number, now string");
- the withBalances `balance.ngn` to a string fails `GET /admin/finance/wallets [withBalances]` and GET /admin/finance/wallets/:wawuId.

Runner DB checksums were identical before and after.

**Attacks on the CI run step.** Each is a dangling PR commit on base 9d93ed3 that also wraps the GET /bills/categories result, so an honest checker must go red. I ran each exactly as the workflow's run step does: `git show $BASE:scripts/protected-routes/ci-check.sh` executed from the base checkout with `<base> <pr> 0`.

| Attack | Result |
|---|---|
| A0, the bills wrap alone (control) | exit 1 |
| A4, `package.json` jest config: `testPathIgnorePatterns: [protected-routes]`, `passWithNoTests` | exit 1 (run.sh's own config and count hold) |
| A5, PR edits `test/protected-routes/shape.ts` (compareShape returns `[]`) and `describe.skip`s the spec | exit 1, flagged as a checker change and checked with the base's suite |
| A6, c26400a reproduced on 9d93ed3: route deleted, entry dropped, hash recomputed, run.sh changed to use its own lock | exit 1 (2 failed), flagged as a lock change |
| A8, PR deletes run.sh, ci-check.sh and lock-diff.py, to try for the first-PR exception | exit 1, base checker used |
| A9, PR edits the workflow file and run.sh | base checker red, exit 1 (but on GitHub the PR's own workflow file would run, see R3-3) |
| **A1b**, PR's `db:seed` script runs a new `scripts/postseed.js` that rewrites the overlaid `test/protected-routes/shape.ts` and deletes `shape.spec.ts` | **exit 0**: "Checked with the base's suite and lock", "all 244 required tests passed", while the bills shape is broken. lock-diff says "No change" |
| A2, same rewrite done from the PR's `prisma.config.ts`, which `npx prisma generate` loads in the work dir | the rewrite takes effect (244 of 244 regression tests pass). Only the 7 `shape.spec.ts` unit tests catch it; deleting that file as in A1b would make it green too |
| **A3**, two lines at the top of `src/bill-payment/bill-payment.controller.ts`: `require('../../test/protected-routes/shape').compareShape = () => []` | **exit 0**, 253/253, lock-diff "No change". The app is loaded into the checker's own jest process, so the code under test can patch the checker's module exports |

**First-PR exception:** it cannot be abused once main has the suite. The workflow uses the PR's `ci-check.sh` only when the base commit has none, and `ci-check.sh` uses the PR's checker only when the base has no `run.sh` or no `protectedRoutes` section. Both are read from `BASE_SHA`, which the PR does not control (A8).

**Relock label:** `RELOCK_APPROVED` is 1 only when the event is `labeled` with `relock-approved`, so a later push (`synchronize`) gets 0. The labeled run checks that `refs/pull/N/head` still equals the event's `head.sha`, so a push between labelling and the run fails the check rather than riding on the label. A "Re-run jobs" of an old labeled run fails the same way.

**YAML:**
- Parses. `permissions: contents: read`, and no `secrets.*` anywhere.
- The base is checked out at `pull_request.base.sha` into `./base`, and the PR head is fetched only as an object (`refs/pull/N/head`).
- Inlined expressions are a number or hex shas only. The DB is the localhost service container, and run.sh refuses anything non-local.
- It has never run on GitHub: NOT RUN there.

**Findings:**
- **R3-1 defect: the code under test can still loosen the checker, so the README and workflow claim "a pull request cannot loosen the checker or its own lock" is false.** Proven green with the bills shape broken: A1b (the PR's `db:seed`) and A3 (an in-process monkeypatch from `src/`). A2 (`prisma.config.ts`) shows the same route. Both work because `run.sh` overlays the base's suite into the PR's tree and then runs PR-controlled code in that tree: `npx prisma generate` with its `prisma.config.ts`, `npm ci` lifecycle scripts when the lockfile differs, `npm run db:seed`, and the PR's whole `AppModule` inside the jest process. Every one of these needs deliberate tampering, visible in the PR diff, and none touches a checker path, so lock-diff reports "No change". Possible fixes:
  - run PR-controlled setup before the overlay and check the overlaid files against `$LOCK_REF` right before jest;
  - run the PR's app as a separate server process that the suite calls over HTTP;
  - or at least have ci-check fail when files outside the checker paths reference `test/protected-routes` or `src/protected-routes`.

  If deliberate tampering is outside the threat model, the owner can accept this instead, and the README sentence should say so.
- **R3-2 unclear (owner): `workflow_dispatch`.** On dispatch, base and code under test are both the dispatched ref, so a branch is checked against its own lock. The check run has the same name on that sha, which may satisfy a required check on the PR's head. Suggest dropping `workflow_dispatch` or pinning the base to `main` for it.
- **R3-3 unclear (owner): settings the README asks for.** The workflow file itself still comes from the PR (A9 would pass on GitHub by replacing the run step). Only a required check plus CODEOWNERS protect it, and there is no CODEOWNERS file in the repo; the README asks the owner to add both.
- **R3-4 minor, unclear (owner):**
  - `actions/checkout` keeps its default `persist-credentials: true`, so the read-only token sits in `base/.git/config` where the code under test runs; `persist-credentials: false` would remove it.
  - Any later `labeled` event for another label re-runs with approval 0, and `cancel-in-progress` lets it supersede the approved run, so the owner has to re-apply the label.
  - lock-diff compares base..head, not the merge base. A PR behind the base therefore reports the base's later changes as its own relock (this errs on the safe side, but with the label it would be checked against its older lock).
- Note: the full jest numbers above come from my second branch run. My first run had no generated Prisma client in my clone (my setup), so I discarded it.

Status back to `building`: R3-1 is an open defect. This was a third fix round, so under WORKFLOW section 4 (step 5) and section 9 it now goes to the owner: fix it, or accept it as outside the threat model.

### Round 4 (backend 5832830, mobile c568dd1)

Scope: round 4's changes only. The owner ruled deliberate in-PR tampering (R3-1's class) out of scope. Fresh clone, `money01v_ci_test` (dropped), mock :4601 (stopped by pid). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify-money01-r4/` (`attacks.txt`, `atk_*.log`, `run_main.log`).

| Check | Result | Evidence |
|------|--------|----------|
| Suite on main | passed | `PROTECTED_LOCK_REF=wmt/MONEY-01 run.sh --fresh 231cb64`: "all 244 required tests passed", exit 0 |
| Wording | passed | README, workflow header, ci-check.sh, run.sh and registry.ts now state the scope: accidental breakage and casual edits are caught; deliberate tampering is left to review. The old "cannot loosen the checker / its own lock" sentences are gone (grep finds none) |
| Tripwire catches A1b, A2, A3 (rebuilt on 5832830) | passed | all three exit 1 with "Code outside the protected route checker refers to it ... Refused", naming `scripts/postseed.js`, `prisma.config.ts` and `src/bill-payment/bill-payment.controller.ts` |
| Tripwire stays quiet on a plain shape change | passed | bills wrap alone: no tripwire message, base suite red (243 of 244), exit 1 |
| Tripwire stays quiet on Markdown | passed | a new `docs/*.md` naming `test/protected-routes`, `compareShape` and the registry: no tripwire message, 244/244, exit 0 |
| Merge-base diff | passed | A PR branched from 9d93ed3 (one harmless comment) against base 5832830 gives "No change" and exit 0. The old base-tip diff reports round 4's 4 checker files as its own (lock-diff exit 1). A PR branched from main 231cb64 gives "branched off before the suite existed: checked with the base's suite and lock", exit 0 |
| YAML | passed | parses; triggers `pull_request` only (`workflow_dispatch` gone, no `github.sha` fallback); `permissions: contents: read`; both checkouts (base at `base.sha`, PR at `head.sha`) have `persist-credentials: false`; the PR commits are fetched locally from `../pr` and checked against `head.sha`. Never run on GitHub: NOT RUN there |

Nit, not a defect: `lock-diff.py` still prints "A change lands only through this reviewed diff". Read within the owner's scope (review being the control) it holds, but it is the one sentence left that sounds absolute.

**Status: `review`.** No open defects. R3-2 is fixed (`workflow_dispatch` removed) and R3-4's credentials and merge-base points are fixed. R3-3 (CODEOWNERS and the required check are repository settings) is still the owner's.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
