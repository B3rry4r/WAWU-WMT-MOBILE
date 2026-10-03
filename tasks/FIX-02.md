---
id: FIX-02
title: The concurrent-tap contract tests hold under load (backend main's deploy)
owner: YOU
area: FIX
order: 80
priority: launch
repo: wawu-backend
type: setup
status: verifying
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

_Verifier: fill in._

## Owner sign-off

_Owner: date, and "evidence pack reviewed"._
