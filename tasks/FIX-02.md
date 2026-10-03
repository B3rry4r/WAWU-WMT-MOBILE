---
id: FIX-02
title: The concurrent-tap contract tests hold under load (backend main's deploy)
owner: YOU
area: FIX
order: 80
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: [MONEY-12]
decisions: [R-25]
passes: [V1, V2, V3]
artboards: []
---
# FIX-02 · The concurrent-tap contract tests hold under load (backend main's deploy)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/MONEY-12.md` (the opening and its contract spec, `src/money/opening/tests/wallet-opening.contract.spec.ts`)

## Goal

Backend main `13a6f77` (MONEY-12, PR #38) did not deploy: the deploy workflow's contract step
(`npx jest --runInBand --forceExit`, mock WAWU ID on :4001, Postgres on the runner) failed one test, "3 WAWU
accounts with the same BVN and phone, 8 taps each at once: one create, one wallet", with `read ECONNRESET`.
Production stays on `e8535d8` until main is green. Making the spec listen on one port (the obvious one-line
fix) traded it for a second failure under CPU load: the double tap got a `503` where it expected `200`. Both
are found by their cause and fixed there, never by a retry, a skip or a looser assertion.

## Scope

Test files only, no product code, route, contract, schema or config: the MONEY-12 opening spec (one listening
server for the file; Fintava timeouts with room for a busy machine) and every other contract spec that sends
HTTP requests at once to an unlistened Nest server (one listening server). Decide with evidence whether the
`503` is the product answering wrongly; if it is, the product is fixed instead.

## Capability checks

- [ ] Many taps at once on one person never see a connection reset: a request still waiting to be accepted
      when another finishes is answered.
- [ ] Under CPU load (load average 8 or more) the opening spec passes 20 times running, with no assertion
      changed.
- [ ] A tap that should be told "opening" or "open" is never told `503` because the machine is slow; a
      `503 provider_unreachable` comes only from a Fintava call that did not answer within its timeout.
- [ ] The whole contract suite, run as the deploy runs it on a fresh migrated database, passes twice.

## Builder report

Builder, 3 Oct 2026, branch `wmt/FIX-02` in both repos: wawu-backend `82c139a` on main `13a6f77`; mobile on main `ba3a8a8` (neither main moved). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fx02b/` (`*.summary` per loop, `*.log`, `*.diag` from a diagnostics-only jest setup file `diag-setup.js` that records server listens and closes, every Fintava call's time and outcome, every opening failure and 503, and event-loop lag; nothing of it is committed).
- **ECONNRESET, cause:** the specs handed supertest `app.getHttpServer()` unlistened. Supertest then calls `listen(0)` for the first request, the concurrent ones reuse that port, and the first to finish calls `server.close()`. Closing the listening socket makes the kernel reset every connection still in its accept queue, and Node 22's `close()` also drops accepted connections whose request is not parsed yet: those taps get `read ECONNRESET`. It needs the taps to be slower to accept than the first one is to finish, so it shows on a busy machine (CI) and with many taps (24 here). Not keep-alive (superagent sends with `agent: false`), not a body limit, not a crash. **Reproduced:** main `13a6f77` at load 8.1 to 9.7: 1 of 10 runs, the CI test with `read ECONNRESET`; its diagnostics show the per-request server closed under the 24 taps with 19 connections open (`orig-4.*`). Minimal repro on Node 22.22.2 (`repro-reset.js`), 30 rounds of 1 fast and 20 slow concurrent requests with a 30 ms handler stall: unlistened 540 of 630 reset, listening 0 of 630; with `closeIdleConnections` disabled still 540, so the accept queue alone does it.
- **ECONNRESET, fix:** `await app.listen(0, '127.0.0.1')` after `app.init()`, so one server serves the file and `app.close()` ends it. Same cause, same fix in the five other specs that send requests at once to an unlistened app: `money-identity` (6 checks), `selfie-match` (10), `money-pin` (10 verifies), `community-rooms` (3 approves/declines), `payment-webhook` (6 deliveries, webhook racing verify). Under load each of them closed its per-request server with requests still open (4, 4, 4, 25 and 4 times in 4 runs), the hazard without the reset; after the fix their servers close only at teardown. `ledger` has no concurrent HTTP (its `Promise.all` calls services), left alone; the specs whose `Promise.all` only logs in to the mock WAWU ID too.
- **503, cause (the one-line listen fix exposed it):** reproduced on the listen-only patch at load 14.6 to 20.3: 5 of 6 runs failed the double tap at line 706 with 503 (`lead16-*`). In all 5, the tap that claimed the opening asked Fintava's details lookup first, and the lookup ended `unavailable` after 728 to 1,132 ms against the spec's 300 ms timeout, right after a 524 to 877 ms event-loop stall; the opening went `failed` (`lookup_unavailable`) and that tap answered `503 provider_unreachable` (`wallet-opening.service.ts:302`); the next tap's lookup answered in 1 to 98 ms and made the one create. The stand-in answers the lookup at once; it runs in the test's own process, so a CPU stall holds its answer and the client's 300 ms deadline together, and the deadline fires first. **Deterministic:** a 900 ms stall injected during that lookup (`stall-setup.js`): at 300 ms, `["timed out"]`, 503, the test fails as in the load runs; at 2 s, lookup ok in 924 ms, 200.
- **503, decision: the test's timing, not a product defect.** Only the claiming tap can get this 503, only when its own lookup gave no answer in time, and nothing has been sent then: the row is `failed` and the next tap starts a new attempt, so "opening" would be untrue. Every other tap reads the row (`opening`, `unknown`, `open`) and answers 200 without a Fintava call that can 503. A wall-clock deadline cannot tell a slow Fintava from a starved server; in production the read timeout is 15 s (`FINTAVA_DEFAULTS`), and a stall past it is an outage. With the fix, a 2.5 s stall still gives the 503 with `["timed out"]`: the product is unchanged. Checked and ruled out: the claim or row-lock wait (taps never wait on a lock that times out; a unique clash answers 200 or 409), a Prisma transaction or pool timeout (would be a 500; the filter maps only P2002 and P2025), the 503 path for an `opening` row (there is none).
- **503, fix (`wallet-opening.contract.spec.ts` only):** Fintava timeouts 2 s (were 300 ms), `LATE_MS = TIMEOUT_MS + 500` (was 700 ms), `jest.setTimeout(30_000)` for the file because a lost answer now waits out a 2 s timeout. A late answer stays late however slow the machine: the stand-in sets its timer after the request arrives, after the client set its deadline, and it runs out later, so the deadline always fires first. No assertion, count or expected state changed. The file takes 23 s instead of about 13 s.
- **Load runs after the fix:** `wallet-opening` 50 runs, two loops in parallel, 16 burners, load 17.5 to 20.7: **50 of 50 passed** (75/75 each, `fixA.summary`, `fixB.summary`); one listening app per file; the slowest on-time lookup in the double tap took 400 ms, which would have been a 503 at 300 ms. The five other specs, 4 runs each at load 18.9 to 21.8: all passed. Before the fix the same five passed 4 of 4 each at load about 20 (no reset hit, the hazard counted above). Burners and loops started by me, killed by PID.
- **Full suite, as the deploy runs it** (`npx jest --runInBand --forceExit`, fresh migrated and seeded `fx02_full_a_test` and `fx02_full_b_test`, mock WAWU ID on :4932 with a keypair made as the workflow makes it, `WAWU_ID_BASE_URL`/`WAWU_ID_JWKS_URL` on it): both runs 2,873 passed, 3 skipped, **40 failed, all `ECONNREFUSED 127.0.0.1:4001`** in the four suites that hard-code :4001 (`kyc-submission` 22, `privacy-settings` 9, `credits-state` 4, `account` 5; nothing listened on :4001 before or after). The six changed specs and the protected suite passed in both. An earlier pair on databases named without "test" also failed the protected suite (it refuses such a name) and once `notification` (401; it reuses or spawns a mock on :4001 itself); both dropped and rerun as above.
- **Checks:** `tsc --noEmit` 0; eslint on the 6 files: 5 at 0, `payment-webhook` 27 errors / 3 warnings on main and on the branch alike; `run.sh --fresh HEAD` (`fx02_protected_test`): 253/253, all 244 required, lock "No change"; gates 16 fail / 9 warn / 76 accepted on 616 files, line for line the same as main; `check_baseline.py` OK; CI tripwire 0 of 44 added lines; no em-dash added. No Fintava, WAWU ID or production call.
- **Mobile:** `npm run check` exit 0 (typecheck, lint, 20 suites 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks); the task file, the LOG line, INDEX and PROGRESS regenerated. Order: FIX-02 depends on MONEY-12 (79), so `check_tasks.py` refused it at 51 ("depends on MONEY-12, which comes later"); it sits at 80, right after MONEY-12, and the 123 tasks from 80 on moved down one.
- **NOT RUN:** the four :4001 suites in my full runs (the port rule for this task); unblocked by the pull request's or main's deploy CI run, which starts the mock on :4001, or by a free :4001 a session may use. CI's own run of this branch: no pull request opened, by instruction; unblocked by opening one. Finding, not a defect: the window-boundary test's "2 s before the window waits" case has 2 s of slack against a stall between its two reads, unchanged by this task.

## Verifier report

Verifier, 3 Oct 2026. Fresh session that wrote none of this. Detached worktrees `/home/user/wt/vfx02b` (wawu-backend `82c139a` on main `13a6f77`) and `/home/user/wt/vfx02m` (mobile `8a2ca01`). Databases `vfx02_*_test`, mock WAWU ID on :4941 for spec loops and on :4001 only for the full suites (free before, stopped right after). Every database is dropped, every burner killed by its PID and every throwaway worktree removed. No Fintava, WAWU ID or production call. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfx02/` (abbreviated `vfx02/` below).

**Verdict: no open defect. Status `review`.** The diff is test-only and loosens nothing. The reset's cause and fix hold. The `503` is the product answering correctly for a Fintava lookup that did not answer before its deadline, and no tap gets a `503` while Fintava answers within the timeout.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Backend: `tsc --noEmit` exit 0; gates 16 fail / 9 warn / 76 accepted on 616 files, output byte-identical to main `13a6f77`; eslint on the 6 files the same as main (5 at 0, `payment-webhook` 27 errors / 3 warnings on both). Mobile `npm run check` exit 0: 20 suites, 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks | `vfx02/tsc.log`, `vfx02/gates-vfx02b*.log`, `vfx02/mobile-check.log` |
| V2 Contract | passed. Full suite as the deploy runs it (`npx jest --runInBand --forceExit`, fresh migrated and seeded DB, mock on :4001 with a keypair made as `deploy.yml` makes it): `82c139a` twice, 119/119 suites, 2,913 passed, 3 skipped, **0 failed** each; the branch merged locally with today's main `cdcb2bc` once, 121/121 suites, 2,976 passed, 3 skipped, **0 failed** | `vfx02/full-A-82c139a.log`, `full-B-82c139a.log`, `full-D-merged.log` |
| V3 Regression | passed. `scripts/protected-routes/run.sh --fresh HEAD`: 253/253, all 244 required, lock origin/main unchanged (the diff touches no lock, suite or registry file); CI tripwire 0 of 44 added lines | `vfx02/protected.log`, `vfx02/diff.patch` |

Focus checks:

1. **Only tests changed, nothing loosened.** `git diff 13a6f77..82c139a`: 6 files, all `*.spec.ts`, 44 added and 7 removed lines. The removed lines are the old doc comment and `TIMEOUT_MS = 300`, `LATE_MS = 700`. No added or removed line contains `expect`, `it(`, `describe`, a matcher, `.skip`, `.only`, `.todo`, `xit` or `xdescribe`. Per file, the `expect` and `it(` counts are identical on both commits (opening 275/51, money-identity 122/26, selfie-match 194/31, money-pin 86/21, community-rooms 104/29, payment-webhook 61/14), with 0 skip/only/todo on both. No em-dash added. Coverage of the listen fix is complete: every other spec with `Promise.all` and an unlistened app runs its concurrency at service level (ledger, ledger-status) or only logs in to the mock. That includes MONEY-08's new `ledger-status` spec on today's main.
2. **The `503` is not a product defect.** Code (`wallet-opening.service.ts` `open()`): `503 provider_unreachable` comes from only three places. (a) Fintava unconfigured. (b) The request that just claimed an attempt, when its own pre-create lookup (details, plus the by-id read when found) gives no answer: the row goes `failed` (`lookup_unavailable`) and nothing is sent. (c) The claimer's create refused with a kind that is neither "may have opened" nor about the details. A tap that finds the row `opening` returns the view, and one that finds it `unknown` reconciles (every Fintava error inside `reconcile` is `wait`). A tap that loses the claim returns the view. None of them can `503`. Experiments in a throwaway copy, my own fault injector (`vfx02/inject-setup.js`):
   - E1, every lookup fails in the double tap: 15 taps, 2 lookups (attempts 1 and 2), exactly 2 `503`s, 13 `200`s, 0 creates. So `503`s equal claims.
   - E2, a 900 ms event-loop stall during the claimer's lookup at the 2 s timeout: lookup ok in 921 ms, 1 create, test passes.
   - E3, the same with a 2,500 ms stall: that claimer `503` (lookup `timed out` at 2,541 ms), row `failed` attempt 1. The next claimer's lookup took 7 ms and made **exactly 1 create**.
   - E4, Fintava healthy but slow (every read answered 1.2 s late, inside 2 s), 3 runs of the 4 concurrent-tap tests (double tap, 3 accounts × 8 taps, same BVN two phones, second instance): 192 taps, lookups 1,202 to 2,436 ms, **0 `503`**, all 5 tests pass.
   - E5, production's read timeout (15 s, `FINTAVA_DEFAULTS.readTimeoutMs`) with the 2,500 ms stall: no `503`, lookup ok in 2,537 ms.

   Production: `.env.example` and `deploy/README.md` leave `FINTAVA_TIMEOUT_MS` / `FINTAVA_MONEY_TIMEOUT_MS` empty, so they default to 15 s and 30 s. A stall long enough to `503` there is an outage, not load. The `503` is also not new: unmodified main `13a6f77` pinned to one contended CPU failed the double tap with `503` in 4 of 10 runs (`vfx02/main-pinfull.summary`); the fix passed 10 of 10 under the same pinning (`vfx02/fix-pinfull.summary`).
3. **The longer timeout masks nothing.** The stand-in arms its late timer when the request arrives, after the client armed its deadline, and `LATE_MS = TIMEOUT_MS + 500` expires later, so the deadline always fires first. The late test asserts it every run (`opening`, row `unknown`). Mutants, each run against the fixed spec (`vfx02/mut*.patch`, `mut*-1.log`):
   - M1, the pre-create lookup's error handling removed (an unanswered lookup treated as none): caught by "when the lookup before a create cannot be read".
   - M2, a lost answer marked `failed`, so the next tap resends blindly: caught by 26 tests, the late-answer test and the CI test among them.
   - M3, `LATE_MS` inside the deadline: caught by the 2 tests that assert lateness ("a create that lands after the timeout", "details too slow").
   - M4, the resend window ignored: caught by 3 window tests.
4. **ECONNRESET.** Mechanism, my own minimal repro (`vfx02/mini-reset.js`, Node 22.22.2, supertest 7.2.2, 30 rounds of 1 fast and 20 slow requests): unlistened 540 of 630 reset, listening 0 of 630. Supertest calls `listen(0)` only when `app.address()` is empty and closes only a server it opened itself. Hazard count (`vfx02/hazard-others.txt`, `hz-*.txt`), with `http.Server.close()` instrumented:
   - On `13a6f77`, the six specs close a per-request server mid-test 290 / 59 / 551 / 98 / 90 / 24 times (opening, money-identity, selfie-match, money-pin, community-rooms, payment-webhook), and close with connections still open in every one of them (up to 8 open, money-pin).
   - On `82c139a`, only at teardown (1 or 2 closes per file), always with 0 open.

   Under load: opening spec on `82c139a`, **24 of 24 valid runs passed at load 15.9 to 19.7** (`vfx02/fix-load.summary`). 10 of 10 pinned to a contended CPU, and 5 of 5 on the local merge with main `cdcb2bc` (`merged-load.summary`). The five other specs 3 of 3 each at load 16.3 to 19.1 (`others-*.summary`). 0 `ECONNRESET` in any `82c139a` run (the full-suite logs carry only the MONEY-06 stand-in's canned `read ECONNRESET` 500 body, `MONEY06-W-1`). Burners: 12 free and 3 pinned to CPU 0, PIDs in `vfx02/burn.pids.used`, all killed.
5. **Mobile.** The 123 tasks at order 80 to 202 each changed only `order: N` to `N+1`, FIX-02 sits at 80 after MONEY-12 (79), and there are no duplicate orders. `check_tasks.py` passes, and `--write` on `8a2ca01` produces no diff, so INDEX and PROGRESS are as generated.

Findings:
- `note` **Both mains moved during verification.** Backend main is `cdcb2bc` (MONEY-08) and mobile main is `1906f63`. Backend: no file overlap with FIX-02 and the lock is unchanged. The local merge passed the full suite (on a database migrated from the merged tree) and the opening spec 5 of 5 under load. Mobile: a trial merge conflicts only in the generated `docs/PROGRESS.md`; after `check_tasks.py --write`, `check_tasks.py` exits 0. WORKFLOW 8.3 applies before the pull request: merge main into `wmt/FIX-02` in both repos and regenerate.
- `note` **The reset was not reproduced in the real spec in this session.** On `13a6f77` I got 0 `read ECONNRESET` in 80 valid runs: 20 full and 40 single-test at load 15 to 16, plus 10 pinned, of which 4 failed with the double-tap `503` and none with a reset. 8 pinned single-test runs are void: they hit jest's default 5 s test timeout on `13a6f77`, an artifact of pinning, and that loop was stopped. The real-spec reset stands on the CI log (`deploy_test.log` line 645) and the builder's `fx02b/orig-4.*`. The mechanism stands on the minimal repro and the hazard counts above.
- `note` **The contract suite is not parallel-safe on one database.** I ran two specs at once on `vfx02_spec_test` (my error), and each failed one lost-answer test: run 11 of `fix-load` ("a second service instance ... one create": row `unknown`) and the first hazard run ("a create that lands after the timeout": `opening`). Each process's sweep reconciles every `unknown` row in the database against its own Fintava stand-in and stamps `checkedAt`, so the owning run's taps are throttled. Both runs are excluded. The same tests passed in all 39 isolated runs. This is known (`package.json` `_comment:test:contract`), and production servers share one real Fintava, so it is not a product issue.
- `note` (pre-existing, unchanged by FIX-02): "a second service instance ... create late" and the 3-account race do not themselves assert that the answer was late; M3 left them green. They are race tests for "one create", and lateness holds by the timer order above. The window-boundary test's name says "50 ms before" while it ages the row to the window minus 2 s, as the builder noted.

NOT RUN:
- CI's own run of `wmt/FIX-02`: no pull request is open. Unblocked by opening the pull request (after merging main in, per the first note), whose `deploy.yml` test job runs the suite on a GitHub runner.
- Real-spec reset reproduced by this verifier on `13a6f77`: see the second note. Unblocked by a run on a runner with the CI's core count (2 vCPU), or by the existing CI log, which already shows it.

## Owner sign-off

_Owner: date, and "evidence pack reviewed"._
