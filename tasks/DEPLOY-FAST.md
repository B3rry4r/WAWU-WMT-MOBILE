---
id: DEPLOY-FAST
title: The deploy runs its tests as Branch checks' 3 shards, and skips them for a tree already tested
owner: YOU
area: OPS
order: -121
priority: launch
repo: wawu-backend
type: ops
status: verifying
depends_on: []
decisions: []
passes: [V1, V9]
artboards: []
tier: T2
---
# DEPLOY-FAST · The deploy runs its tests as Branch checks' 3 shards, and skips them for a tree already tested

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2), backend `wmt/DEPLOY-FAST` `6e29183` on `origin/main` `0cd8f8e`; this record on mobile `wmt/DEPLOY-FAST` (from `origin/main` `fcbf81d4`). Order -121, free. Status verifying. CI files only (shared-file row in SHARED-CHANGES.md): no source, test, gate, baseline, schema or Fintava file, and nothing in the jest suite, changed.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | The deploy's `test` job ran the whole suite in one job (`npx jest --runInBand --forceExit`): run 40050932395, Contract tests 01:43 to 02:32 (49 min), then 2 min to deploy | `suite` is Branch checks' own job: matrix shards 1 to 3, `npx jest --runInBand --forceExit --shard=N/3` in each, its own Postgres; `netns` beside it. Deploy needs `decide`, all three shards and `netns` |
| 2 | Every merge re-ran tests its pull request had just passed | First job `decide` skips the tests only for a tree already tested (below) |
| 3 | `check_deploy_in_sync.py` compared one deploy job to two Branch checks jobs | Compares `suite` to `suite` and `netns` to `netns` one to one (steps, runner, Postgres, env, shard matrix), checks the matrix against `--shard=x/N`, the `decide` wiring and the concurrency, and proves on every run that 27 changes are reported |
| 4 | `workflow_dispatch` had no inputs | `dry_run` (decide and test, never deploy) and `force_tests` (test even when the decision is to skip) |

### The skip rule

The tests are skipped only when the commit being deployed has a tree byte-identical to a candidate commit: itself, or for a merge its second parent when `HEAD^{tree}` equals `HEAD^2^{tree}` (the branch already contained main). On that exact sha, the newest run of each of Branch checks (all 6 jobs: deploy-test-in-sync, 3 shards, netns, contract), Gates and Protected routes must be completed, success, with every job success, from a push (or a dispatch; Protected routes also its pull_request run, which checks out the head), in this repository. Anything else runs the tests: trees differ, a run missing, failed, cancelled or running, a job missing, the checkout is not the commit, any API error. Never skipped: migrate, build, restart, smoke test. The token has `actions: read` and `contents: read` on the `decide` job only. The job log and summary print the candidates, the decision and the run ids.

### Expected time

| Case | Before | After |
|---|---|---|
| Branch was up to date with main when merged (tree identical) | about 51 min | about 3 min (decide about 30 s, deploy 2 min) |
| Anything else (main moved since the branch's last push) | about 51 min | about 19 min (decide 30 s, slowest shard about 15 min as in Branch checks run 40053141180: shards 15, 8 and 10 min of tests; netns 1 min; deploy 2 min) |

### Proof (24 Oct 2026)

- `check_deploy_in_sync.py` EXIT 0 on the branch. EXIT 1 on three throwaway copies, never committed: jest flag changed in `deploy.yml` only; `tsc` step dropped from `branch-checks.yml` only; `test:netns` step dropped from `deploy.yml` only. `--self-test` EXIT 0 (27 changes, all reported).
- `test_decide_skip_tests.py`: 20 tests on a real throwaway git repository (merge with the branch's tree, merge with a different tree, one-parent commit) and a fake API: EXIT 0.
- `decide_skip_tests.py` run live against this branch's head `6e29183` (read-only API calls): Branch checks run 40056100590 in progress, so `DECISION skip_tests=false`. The skip answer for the same head is in the hand-back.
- `actionlint` 1.7.12 on `deploy.yml` and `branch-checks.yml`: EXIT 0. Backend gates 0 fail; `check_baseline` EXIT 0.
- Real data: of the last 12 merges on `origin/main`, 5 had a tree equal to their second parent's (for example `90bb0ef`, PR 183, whose branch head `9d50fc6` has Branch checks run 40053141180, success).
- NOT RUN: the `workflow_dispatch` dry run (the builder's token cannot dispatch: 403). The owner or the lead runs Actions, Deploy Hub API, Run workflow, branch `wmt/DEPLOY-FAST`, `dry_run` on; add `force_tests` to see the 3 shards. The `deploy` job is skipped by `dry_run` and by any ref that is not main.

### Notes for the lead

- Concurrency: real runs keep the group `deploy-hub-api` (one deploy at a time, a newer push replaces a pending older one, a running one is never cancelled). A dry run uses its own group so it cannot replace a pending real deploy.
- The old deploy ran one process on one database; FIX-89 found specs that failed only there. The deploy now sees what Branch checks sees, so that class of failure goes away; the stale-main case runs the same 3 shards.
- Low: shard 1 is the long pole (15 min of tests against 8 and 10); rebalancing would change what Branch checks runs, so it was left.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- Backend `.github/workflows/deploy.yml`, `.github/workflows/branch-checks.yml`, `scripts/ci/`

## Goal

A merge to main reaches the droplet in minutes when its tree was already tested, and in about a branch's own CI time when it was not.

## Capability checks

- [x] The deploy's tests are Branch checks' 3 shards plus netns, and `deploy` needs all of them.
- [x] The tests are skipped only for a tree identical to one that passed every Branch checks job, Gates and Protected routes on that sha; any doubt runs them.
- [x] A step dropped or changed on one side only fails the sync check.
- [x] The migrate, build, restart and smoke test steps are untouched.
- [ ] A dry run from the branch in Actions: NOT RUN.
