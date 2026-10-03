---
id: FIX-01
title: Fintava timeout covers the whole answer, garbage collection included
owner: YOU
area: FIX
order: 50
priority: launch
repo: wawu-backend
type: third-party
status: verifying
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

_Filled in by the verifier._

## Owner sign-off

_Owner: date, and "evidence pack reviewed"._
