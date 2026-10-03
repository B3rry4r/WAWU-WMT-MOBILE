---
id: FIX-01
title: Fintava timeout covers the whole answer, garbage collection included
owner: YOU
area: FIX
order: 50
priority: launch
repo: wawu-backend
type: third-party
status: done
depends_on: [MONEY-06]
decisions: [R-25]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# FIX-01 · Fintava timeout covers the whole answer, garbage collection included

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/MONEY-06.md` (the Fintava client this fixes) and `tasks/KYC-02.md`, Verifier report round 4, "Findings (not defects)" 1 and 2 (where the bug was found, with the reproductions)

## Goal

A Fintava call never waits longer than its configured timeout (read, check or money), whatever Fintava does
with the body. The bug is on backend main from MONEY-06: `FintavaClient.request` passed
`AbortSignal.timeout(...)` to `fetch` and kept no reference to it. Once the headers arrived, garbage collection
could take the signal and its timer, so an answer that sent headers and then stalled the body was held until
undici's own 300 s body timeout instead of the 5 to 30 s check timeout (KYC-02 round 4: a selfie with no answer
at 60 s under load, and KYC-01's BVN check on main the same).

## Scope

`src/fintava/fintava-client.ts` only, plus its tests: one deadline per request that covers the headers and the
body and survives garbage collection, for every method (the selfie's capped stream reader included). A
deadline that passes during the body ends on the client's existing timeout path (`unavailable` on a read or a
check, `outcome_unknown` on a send, so the selfie and BVN routes answer their counted 503
`provider_unreachable`), never a hang and never a match. Low, in scope because it falls out of the same
change: a 400 whose body stalls is no longer read as a failed match (KYC-02 round 4 finding 2). No route,
contract, schema or config changes; the timeouts keep their values and their `PROVISIONAL(FINTAVA-TIMEOUTS)`
marker.

## Capability checks

- [ ] For every client method (balance, BVN, selfie, phone, customers, history, banks, name checks, lookups,
      sends, reconcile and the retries, freeze, bills), a Fintava that sends headers and then stalls the body
      ends the call within the configured timeout plus a small margin, with forced garbage collection between
      the headers and the deadline and without it, with the same error the client gives when no headers come
      at all.
- [ ] The same test on main's client hangs.
- [ ] A stalled 400 on a check is `unavailable` (a counted 503), never `identity_refused` (a failed match);
      a stalled 400 on a send is `outcome_unknown`, never a refusal.
- [ ] A body that keeps trickling ends at the deadline; a slow body that finishes in time is still read, and
      the deadline's timer is cleared once it is.
- [ ] The client drops the connection when the deadline passes mid-body.

## Builder report

Builder, 3 Oct 2026, branch `wmt/FIX-01` in both repos: wawu-backend `9ea3b90` on main `13b6ac4`; mobile on main `983418c` (neither main moved).
- **Fix (`src/fintava/fintava-client.ts`):** every request runs under one `FintavaDeadline`: a plain `setTimeout` that holds an `AbortController` and the body's reader until `end()` clears it in a `finally`, once the body is read or the read failed. At the deadline it aborts the controller, **cancels the reader** (ends the pending read and drops the socket) and rejects a `fetch` still waiting for headers. Every body, the selfie's capped stream included, is read through that reader (`readBody`; `readCapped` and `res.text()` are gone). A deadline mid-body throws the existing timeout error (`unavailable "timed out"` on a read or check, `outcome_unknown` on a send, status null); a cut-short body is never parsed.
- **Why the reader and not only a kept controller:** undici follows our signal to its own request controller through a WeakRef, and a collection after the headers can take that controller, so aborting a strongly held controller still hangs: mutant M1 below (34 of 34 GC runs hang). The brief's controller-plus-`setTimeout` alone would not have fixed it.
- **Tests (`src/fintava/tests/fintava-stall.spec.ts`, 108; raw TCP server `test/fintava/fintava-stall-server.ts`):** all 34 client methods (balance, BVN, selfie, phone, customers, history, banks, name checks, lookups, three sends, reconcile, three retries, freeze, unfreeze, bill lists and four purchases) against headers-then-stall, with GC forced from the headers to the deadline and without; each must equal the no-headers outcome and end in 280 to 1,000 ms for a 300 ms timeout. Plus: connection closed at the deadline; stalled 400 on BVN, selfie, phone is `unavailable`, on a send `outcome_unknown`; a dripping body ends on time; a body landing at half the timeout is read and the deadline timer is cleared; a `fetch` that ignores its abort still ends on time.
- **Old hangs, new ends on time:** main's client on this spec: 70 of 108 fail, 40 still waiting at the 3 s watchdog (all 34 GC runs); without GC the stalls end as `bad_response`/`not_confirmed`, not the timeout path. FIX-01: 108/108 (also under `node --expose-gc`), stalled calls end at 302 to 310 ms. Mutants, each killed: M1 reader not cancelled 39 fail; M2 cut-short body parsed 36; M3 no headers race 1; M4 no timeout on a mid-body deadline 64; M5 timer never cleared 1. The verifier's own `vk4-stall-main`/`vk4-stall-gc` specs (2 s timeouts): main hangs at 8 s under GC (balance, BVN, selfie), FIX-01 `unavailable` at 2.0 s in all 10 runs.
- **Built Hub (:4871, stand-in WAWU ID :4872, `f01_hub_test`), KYC-01's BVN check, check timeout 5 s, Fintava stand-in sends 200 headers (Content-Length 600) and no body:** FIX-01 `503 provider_unreachable` at 5,256 ms under load (3,030 GETs) and 5,018 ms without, socket closed at 5,001 ms, `checksLeft` 2 (counted); main `13b6ac4` under load (50,370 GETs): no answer at 60 s, socket never closed.
- **Behaviour changes (all toward the timeout path):** a stalled 2xx on a send is `outcome_unknown` (was `not_confirmed`; both `recordMayExist`); a stalled 400 on a check is a counted 503, not a failed match (KYC-02 round 4 finding 2). Default (agent), owner may override: a body that fails mid-way for any other reason (reset) is still read as empty, as before.
- **Checks:** `tsc --noEmit` 0; eslint 0 on the 3 files; Fintava, KYC, money and rate-limit specs (`src/fintava src/money src/kyc-submission hub-rate-limits`) 23 suites, 1,085 passed; full `test:contract` on a fresh `f01_contract_test` 116 suites, 2,801 passed, 3 skipped, 0 failed (my mock on :4001 after `lsof` showed it free, stopped straight after); `run.sh --fresh wmt/FIX-01` 253/253, all 244 required, no lock, registry, contract or prisma file touched, `contract:build` byte-identical; gates 16 fail / 8 warn / 76 accepted, line-for-line the same as main (608 files against 607), baseline check passes; CI tripwire 0 added lines; key scan 0 of 58 windows on the diff.
- **Mobile:** `npm run check` exit 0 (typecheck 0, lint 0, 19 suites 345 tests, gates 0 fail / 0 warn on 90 files, tasks check passes); task file, LOG line and the regenerated INDEX and PROGRESS only.
- **Order:** FIX-01 sits at 50, right after MONEY-06 (49); every task from 50 on moved down one (152 files, the OPS-11 precedent).
- **NOT RUN:** the selfie route on a built Hub with a stalled answer (it needs a passed BVN check first); unblocked by running KYC-02's `vk4/v9/drive.mjs` stall case (u4) against a built `wmt/FIX-01` Hub. No Fintava call (none needed: a stall cannot be asked of the sandbox). CI's `ci-check.sh`: tripwire and lock check run by hand; unblocked by the pull request's CI run. V10: no screen and no device path.

## Verifier report

Verifier, 3 Oct 2026. This is a fresh session that wrote none of FIX-01's code. I checked wawu-backend `wmt/FIX-01` `9ea3b90` (on main `13b6ac4`) and mobile `wmt/FIX-01` `f2342d0` (on main `983418c`), in fresh detached worktrees `/home/user/wt/vf1b` and `/home/user/wt/vf1m`. Neither main moved during verification (`origin/main` was still `13b6ac4` and `983418c` at the end).

- **Databases:** `vf1_hub_test`, `vf1_protected_test` and `vf1_contract_test`, all dropped afterwards.
- **Ports:** built Hub :4881 and stand-in WAWU ID :4882. Fintava stand-ins used OS-assigned 127.0.0.1 ports, plain and TLS (self-signed, `NODE_EXTRA_CA_CERTS`). :4001 was used only for the 4 suites that hard-code it: `lsof` was empty before, my mock ran there, then it was stopped and `lsof` was empty after.
- **No Fintava call was made.**
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vf1/ev/` (file names below).
- **My harness, written apart from the builder's:**
  - `stall-srv.mjs`: a raw TCP and TLS server in a child process that reports accept, headers and close times.
  - `drive-stall.cjs`, `drive-late-leak.cjs` and `drive-noread.cjs`: these drive the built `dist` client.
  - `make-clients.sh`: puts main's client and my mutants beside the built client.
  - `v9/`: my copy of KYC-02's `vk4/v9/drive.mjs` with ports 4881/4882 and unique phones. Also in `v9/`: the stand-in with BVN `stall`/`stall400` and selfie `stall400` modes added, `drive-bvn.mjs`, `drive-selfie400.mjs`, and `gc-preload.cjs`, which forces a full GC every 50 ms inside the Hub.

**Verdict: no defect. Status `review`.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | **Backend:** `tsc --noEmit` 0; eslint 0 on the 3 changed files (`tsc-branch.txt`, `eslint-branch.txt`). Gates: main `13b6ac4` 9 run / 607 files / **16 fail / 8 warn** / 76 accepted; branch 9 / 608 / **16 / 8** / 76. The two 71-line finding lists are identical (`gates-main.txt`, `gates-branch.txt`, `g-main.lst`, `g-branch.lst`). `check_baseline.py`: 108 entries OK. 0 em-dashes and 0 key patterns added in either diff. **Mobile:** `npm run check` exit 0 with typecheck, lint, 19 suites / 345 tests, gates 9 run / 90 files / 0 fail / 0 warn, and 202 tasks (`mobile-check-branch.log`). |
| V2 Contract | passed | **Full contract suite** on a fresh migrated and seeded `vf1_contract_test`, WAWU ID :4882: 116 suites, 2,804 tests: 2,755 passed, 46 failed, 3 skipped (`contract-full.json`). The 46 failures break down as: <br>- 40 in the 4 suites that hard-code :4001. With my mock there they pass **40/40** (`contract-4001.log`, `lsof-4001-*.txt`). <br>- 6 in `marketplace-save`, whose own spawned mock WAWU ID was not healthy within 15 s. It passes 6/6 rerun alone (`contract-marketplace-save-rerun.log`); finding 3. <br>So 2,801 passed, 3 skipped, 0 failed. **Inside the full run:** `fintava-stall` 108, `fintava-client` 224, `fintava-units` 120, `fintava-selfie-answer` 156, `fintava-selfie-size` 9, webhook 23 + 17, ledger 25 + 13, `selfie-match` 182, `money-identity` 26, `hub-rate-limits` 10. **Builder's stall spec** under `node --expose-gc`: 108/108 three times running (`builder-stall-spec-exposegc-*.log`). **Contract file:** `contract:emit` + `contract:enrich` rebuild `contract/openapi.json` byte for byte (sha256 `a8ea9013...`), unchanged from main, and mobile's copy is equal. No route, contract, schema or config change. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh 9ea3b90` (`vf1_protected_test`, lock `origin/main` `13b6ac4`): **253/253, all 244 required** (`protected-branch.log`). `lock-diff.py 13b6ac4 9ea3b90` reports "No change" (`lock-diff.txt`). `protected-registry.json` sha256 `767e27bf...` on main and branch. CI tripwire, run as `ci-check.sh` runs it: **0 of 697 added lines** match (`tripwire.txt`). |
| V6 States | passed | Each state was reached through its real cause, on the client and on the built Hub (tables below): <br>- headers then stall; <br>- partial body then stall; <br>- drip; <br>- body done before or after the deadline; <br>- a stalled 400, 404 or 500; <br>- a mid-body reset; <br>- no headers; <br>- a request body the server never reads. |
| V8 Money | passed (what this change can reach) | **Sends at the deadline:** a stalled send is `outcome_unknown` with `recordMayExist` true. That includes a stalled 400 and a stalled 2xx; on main without GC they were `refused` with `recordMayExist` false, and `not_confirmed`. **Lookups and reconcile:** a stalled lookup or history is `unavailable`. `reconcile` and every `retry*` give `wait / unreachable`, never `absent`, so nothing is resent (`key-cases.txt`, `branch-*.json`). **Callers:** no production code calls a send yet. The only caller kinds are the ledger consumer's `reconcile` (any FintavaError is `unknown`) and `confirm` (any FintavaError is `unreachable`, never `absent`). `decideFintavaRetry` resends only on `absent`, which needs Fintava's own 404 "Transaction not found!" text. A cut-short body is never parsed, so the absent case cannot come from part of a body. No caller reads `outcome_unknown` or `not_confirmed` by name. Items this diff cannot reach are listed under NOT RUN. |
| V9 Live seam | passed | Built branch Hub (`node dist/src/main.js` :4881), run once without forced GC and once with `--expose-gc` and a GC every 50 ms. People signed in through the stand-in WAWU ID's `/auth/register` and `/auth/login` (no minted token). Check timeout 5 s. Results under "Built Hub" below (`v9-bvn.txt`, `v9-drive-*.txt`, `v9-selfie-stall400.txt`, `hub-*.log`). |

**Every client method, my harness (`drive-stall.cjs`).**
- **Setup:** all 34 public methods in 15 batches of 34 calls each, all timeouts 400 ms, pass window 395 to 650 ms.
  - Batches: no headers, then `hdr`, `hdrc`, `part`, `partc`, `drip`, `dripc` and `nolen` at 200; `hdr`, `part`, `partc` and `drip` at 400; `hdr` and `part` at 404; `hdr` at 500. That is Content-Length, chunked, and close-delimited with no length.
  - Each call must equal its own no-headers outcome and match the expected kind: `unavailable ["timed out"]` status null on a read or check, `outcome_unknown` with `recordMayExist` on a send, and `wait / unreachable` from reconcile and the retries. Its socket must be closed by the deadline plus the margin.
- **FIX-01, 510 calls per run:**

  | Run | Passed | Calls ended | Sockets closed |
  |-----|--------|-------------|----------------|
  | HTTP, forced GC | 508 | 400 to 421 ms | by 412 ms |
  | HTTP, no GC | 508 | 400 to 410 ms | by 407 ms |
  | HTTPS, forced GC | 508 | 400 to 435 ms | by 405 ms |
  | HTTPS, no GC | 508 | 400 to 426 ms | by 397 ms |

  In each run the 2 others are the selfie against `drip` with a declared Content-Length of 1,000,000. They end in 9 to 334 ms as `bad_response` (the cap), which is correct.
- **Main `13b6ac4`, same harness:**
  - **Forced GC, HTTP and HTTPS:** 474 of 476 stalled calls are still waiting at 4 s. The other 2 are the cap.
  - **No GC:** the stalls end at the deadline but as readings of an empty body: `bad_response`/`not_confirmed`, a stalled 400 on a check `identity_refused`, a stalled 400 on a wallet send `refused` with `recordMayExist` false. `drip-400` still hangs (33).
  - Files: `main-*.json`, `key-cases.txt`.
- **A body that completes, `drive-late-leak.cjs`, 400 ms:**
  - Balance, BVN, a 400 BVN answer and a wallet send, each with Content-Length and chunked.
  - Whole bodies at 100, 300 and 370 ms are read and judged: resolved, or `identity_refused` for the 400. At 430 and 600 ms they are `unavailable`/`outcome_unknown` at about 400 ms.
  - The active Timeout count drops back after every call.
  - Result: 40/40 with forced GC, without it, and over HTTPS (`late-leak-*.json`).
- **No leaks:**
  - **Load:** 1,500 mixed calls, 25 at a time, timeout 150 ms (whole bodies, 400s, sends, header stalls, no headers, resets, chunked drips, slow bodies). Run with forced GC, without it, and over HTTPS. Then 8,000 with forced GC.
  - **After each run:** 0 Timeouts at once. 0 client sockets, 0 server-side sockets and 0 Timeouts 6 s later (past undici's keep-alive).
  - **Memory and lag:** in the 8,000 run, heap after GC was flat at 18.8 to 18.9 MB from call 4,000 to 8,000 and RSS at 125.8 MB. Event-loop lag p99 was 11 to 13 ms at a 10 ms resolution, and no call exceeded 192 ms (`leak8000-branch-gc.json`).
- **A request body never read:** a server that stops reading a 1 KB to 8 MB selfie upload. The call ends at 400 to 416 ms and 0 client sockets remain, on FIX-01 and main, with and without GC (`noread-*.json`).
- **Mutants of the fix:**
  - **A**, reader not cancelled at the deadline: 474 hang under GC in my harness, and 39 fail in the builder's spec. This confirms that a strongly held controller alone is not enough.
  - **B**, cut-short body parsed: 428 fail.
  - **C**, timer never cleared: killed by my timer check (6 of 40) and by 1 builder test.
  - **E**, controller not aborted at the deadline: 34 sockets left open on no-headers calls in my harness. It survives the builder's spec (finding 2).
  - Files: `mutant-*.json`, `builder-spec-mut*.log`.

**Behaviour changes.**
- A stalled 2xx on a send is now `outcome_unknown` with `recordMayExist` true.
- A stalled 400 on BVN, selfie or phone is now `unavailable`.
- A stalled 404 lookup is `unavailable`, and reconcile gives `unreachable` (main without GC: `outcome_unknown` "a 404 that is not Fintava" and `unrecognised`; both are `wait`).
- A mid-body reset is unchanged: 136 of 136 calls (reset after 200, 400, 404 and 500) give exactly main's result, the body read as empty (`reset-compare.txt`; finding 1).

**Built Hub, KYC-01's BVN check.** Fintava sends 200 headers (Content-Length 600) and no body.

| Hub | Load | Answer | Socket closed | `checksLeft` |
|-----|------|--------|---------------|--------------|
| No GC | 2,920 GETs | `503 provider_unreachable` at 5,067 ms | 4,972 ms | 3 to 2 |
| No GC | none | 503 at 5,013 ms | 5,002 ms | |
| Forced GC | 1,500 GETs | 503 at 5,118 ms | 4,970 ms | 3 to 2 |
| Forced GC | none | 503 at 5,140 ms | 5,000 ms | |

A stalled 400 (headers plus part of a body) gives 503 at 5,027 ms (no GC) and at 5,141 ms (GC), and is counted (3 to 2). It is never 422 `bvn_not_confirmed`.

**Built Hub, KYC-02's selfie.** KYC-02's `drive.mjs` u4 case: a passed BVN check first, then a selfie while Fintava sends 200 with Content-Length 4,096 and stalls.

| Hub | Load | Answer | Socket closed | `checksLeft` |
|-----|------|--------|---------------|--------------|
| No GC | 3,190 GETs | `503 provider_unreachable` at 5,029 ms | 4,996 ms | 2 (counted) |
| Forced GC | 1,050 GETs | 503 at 5,028 ms | 4,972 ms | 2 (counted) |

- **Selfie with a stalled 400, forced GC:** 503 at 5,023 ms, counted (3 to 2), socket closed at 4,999 ms.
- **KYC-02's cap cases on the FIX-01 Hub:** unchanged. 200 MB with Content-Length, 200 MB chunked, endless, the `gzip, gzip` bomb, the big 401 and 4,097 bytes are each a counted 503 in 14 to 226 ms. The accepted shape and exactly 4,096 bytes are 200 with the server's `matchedAt`.
- **Main's client in the same built Hub, forced GC:** the BVN check and the u4 selfie both have no answer at 60 s (16,410 and 8,980 GETs), and their sockets were never closed (`v9-bvn.txt`, `v9-drive-main-gc.txt`).

**Diff against the report:**
- **Backend:** the 3 files listed (`fintava-client.ts`, the stall spec and the stall server).
- **Mobile:** 156 files: the task file, LOG, INDEX, PROGRESS, and 152 task files whose only change is `order: N` to `N+1`. Those are exactly the 152 tasks at order 50 or above on main, 50 to 201.
- **Generated files:** `check_tasks.py --write` regenerates INDEX and PROGRESS with zero diff, so neither was edited by hand.

**Findings (not defects)**
1. **A mid-body reset is still read as an empty body**, exactly as on main (136/136 identical). This was the builder's recorded default. As a result:
   - a reset 400 on BVN or selfie is `identity_refused` (a counted failed match);
   - a reset 400 on a wallet send, customer create, freeze or bill is `refused` with `recordMayExist` false (true on the bank sends).

   Low, unchanged by FIX-01.
2. **Test gap:** the builder's 108 tests do not pin the abort of the request when no headers ever arrive. Removing `this.controller.abort(reason)` from the deadline (mutant E) passes all 108, and leaves the socket open until undici's own 300 s timeout while the call still ends on time. The code does abort, so this is not a defect. A test that the connection is closed on a no-headers timeout would pin it.
3. **`marketplace-save` flaked once in the full run.** Its own spawned mock WAWU ID was not healthy within 15 s. It passes 6/6 alone. FIX-01 does not touch it.

**NOT RUN**
- **Fintava sandbox:** no call was made. A stall cannot be asked of the sandbox, and none was needed.
- **V8 items this diff cannot reach:**
  - Same request twice, double-tap, wrong PIN, webhook replay and forgery, reversal. FIX-01 changes no PIN, webhook, ledger or route file; their specs pass inside the full contract run.
  - Ledger equals Fintava's balance. Unblocked by a sandbox key in a local `.env` (OPS-03) for the money task that writes to the ledger.
- **TLS on the built Hub:** TLS was run on the client only (4 runs above). Unblocked by a TLS Fintava stand-in trusted by the Hub's Node (`NODE_EXTRA_CA_CERTS`) if wanted; the client code path is the same.
- **CI's own `ci-check.sh`:** its tripwire and `lock-diff.py` were run by hand. Unblocked by the pull request's CI run.
- **V5, V7, V10:** not in this task's passes. There is no screen and no device path.

## Owner sign-off

_Owner: date, and "evidence pack reviewed"._
