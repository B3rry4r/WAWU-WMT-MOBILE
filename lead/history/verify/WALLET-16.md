# WALLET-16 round 2 verification (verifier, 16 Oct 2026)

Backend `wmt/WALLET-16` 315b69b, mobile `wmt/WALLET-16` 0da32a7. Verified by a session that built none of it. No product code changed; no push. Stack `wallet_16` (ports 7021-7028) used for specs, then `down` (ports closed, database dropped). Worktrees `v-wallet-16-*` removed. Logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-16-v/logs/`.

## Verdict: merge (nothing medium or worse)

## Checks

| Check | Result |
|---|---|
| CI on 315b69b (`gh api .../check-runs`) | 3 suite shards, netns, contract, baseline, deploy-test-in-sync, protected routes: success. Gates: failure, 16 FAIL |
| Gates, run here, branch vs main bac39c4 | 16 fail / 76 accepted on both; FAIL lines identical (diff empty); `check_baseline.py` EXIT 0 |
| `tsc --noEmit` | EXIT 0 |
| eslint (no fix) on 4 changed .ts files | EXIT 0, tree unchanged |
| `earning-settlement.contract.spec.ts` | 29/29 |
| Area specs (hold 33, earning-rules, both Nuvion earnings, wallet-gate-coverage, money-contract) | 6 suites, 89/89 |
| `contract:build` | EXIT 0, sha256 592eefac8a9ae47c = committed file = mobile copy; 0 removed lines vs main |
| Mobile CommunitiesView, LegalChatScreen, hostScreens, components.test.tsx, one worker | 4/4 suites, 156/156 tests, EXIT 0 |
| Mobile `npm run gates`, `npm run tasks` | EXIT 0 (0 fail), EXIT 0 (283 tasks) |
| Em-dash in added lines (both repos, round 2) | 0 |
| Trial merge with current main | backend: 2 textual conflicts (docs/contract/CONVENTIONS.md; src/money/money.module.ts, two providers added side by side: keep both). Mobile: 3 doc conflicts (BACKEND_GAPS.md, SHARED-CHANGES.md, docs/PROGRESS.md which is generated). Migration `20261021180000` still sorts before main's last (`20261021280000`): the lead renames at merge |

## F1 and F2 tests really pin the rules (my own mutants, whole spec each)

14 mutants applied by me from the builder's descriptions, each killed by the test named for it:
M14 absent read as failed (3 tests fail: F1 absent, F2 bound, round-1 silence test); M15 pending read as completed (F1 pending); M17 amount check off (F1 other amount); M04 lease without `completed` (F2 reversed sale); M44 both lease guards off (F2 two callers); M11 bound `>` (F2 72nd hour); M21 month end inclusive and M21b month start exclusive (F2 Lagos edge); F3 earning: bound never read, bound `>`, every wait reviewed (all killed by the F3 tests); F3 hold: the same three (all killed). 14 of 14.

## F3 attacks (my own specs, run and removed)

- Two services refused at once past the bound (earning and hold): one review mark, one note, one attempt at the provider; three later days of driving on both change nothing. Pass.
- Refused 30 h, provider recovers, retry due at 73 h (earning and hold): it lands, no review. Review needs a refusal. Pass.
- Frozen wallet, missing wallet, provider away: wait past the bound (builder's tests, mutant-killed). Pass.

## Findings (all low; none needs a round)

1. low, `src/money/earnings/earning-settlement.service.ts` `retryAfterFailure` (line 666) and the same in `src/money/holds/wallet-hold.service.ts` (line 695): a provider that accepts the send and then records it FAILED every time gives `waiting: refused`, a new reference each time, and no bound. Repro: 14 rounds (send gets 500, record says FAILURE) over 98 h: attempt 15, `reviewSince` null. Money is safe (the record says nothing moved) and a warn is logged each time. Code is unchanged from before round 2. Sweep list.
2. low, for the lead (builder's note 2, confirmed): the bound counts from the earning's creation, so a creator who waited more than 72 h for a wallet and then gets ONE generic refusal goes straight to review (repro: wait 100 h, open wallet, one `refuse`: `reviewSince` set, attempts 1). Nothing can resume a reviewed earning yet (no admin path in this repo). A `refusedSince` column would fix it; sweep list unless the lead wants it now.
3. low, `tasks/SWEEP-MONEY.md` lines 74-75: F6 and F7 point at "tasks/WALLET-16.md, Verifier report, line 113/114"; that report now lives in `tasks/history/WALLET-16.md` lines 77 and 78. Fix the pointer.

## Not run

Real sandboxes (R-20), F8 production count (the lead's), Nuvion process of my own (specs only), the Hub's own cron (round 2 changed no cron code), V5/V10 (no screen).
