---
id: MONEY-01
title: Protected route list and regression suite
owner: YOU
area: MONEY
order: 7
priority: launch
repo: wawu-backend
type: setup
status: verifying
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
