---
id: FIX-61
title: A paid-question spec that failed for ten minutes of every day no longer meets Lagos midnight
owner: YOU
area: FIX
order: -61
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-55]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-61 · A paid-question spec that failed for ten minutes of every day no longer meets Lagos midnight

## Current state

As of 17 Oct 2026, merging (lead): a T0 record, accepted on the lead's diff read (no verifier), stacked in batch 15.
- **Status:** merging (lead). Verdict: ACCEPTED on the lead's diff read (test files only: the harness keeps a Lagos-day spec inside one Lagos day, no assertion changed, no `src/` change). Stacked in batch 15 by MERGE-15 (backend `wmt/MERGE-15`, mobile `wmt/MERGE-15`); not on main. Built: Backend `wmt/FIX-61` `cc0da36` on `origin/wmt/MERGE-13` `6bc7b20`; this record on mobile `wmt/FIX-61` (from `origin/wmt/MERGE-13` `4c7b2acd`). Test files only: no `src/` product file, no schema, no migration, no Fintava file, no app code.
- **Failing test:** `paid-dm-wallet.contract.spec.ts` (INBOX-17, Nuvion stood in), "two answers in a day land in the creator's one move, once; a later answer waits for the next day's (R-55)", line 731: expected `owed`, received `landed`. CI shard 2 of 3 on `wmt/SWEEP-W4b` `78d7b33` (run 39073944817, job 117517148047) and `wmt/INBOX-18` `3381b7c` (run 39074367685).
- **Cause (b), a test, not the product:** the earnings sweep takes the Lagos day from the clock it is given (`lagosDay`, R-55). The pay harness gives it a clock of its own: `max(clock, now) + 2 minutes` per `pass()`, so it runs ahead of the wall clock by every pass the earlier tests of the file made. In the window 22:11 to 22:21 UTC (23:11 to 23:21 in Lagos) at the start of the file, the third answer's sweep fell after Lagos midnight (23:00 UTC) and rightly made the creator's next move. A person would have seen nothing wrong: money after midnight Lagos is the new day's one move, and `earning-daily-move` (23:59 waits, 00:05 moves) and `earning-day.spec` already pin that on both sides.
- **Reproduced, no wall clock needed:** the spec run with the date started at 22:12, 22:14, 22:16, 22:18, 22:20 UTC fails the same line; 22:05, 22:08, 22:10, 22:22, 22:25, 22:50 and 12:00 pass (that is why it passed locally at 22:25).
- **Fix:** the harness gains `keepInLagosDay(hours = 2)`: when fewer than that remain of the sweeps' Lagos day, the clock goes to the start of the next day (never back, no sweep run). The two tests that assert "today's move is made, the rest waits" call it first: the failing one, and `host-share` "a creator gets one move a day" (same class, a smaller window). No assertion changed.
- **After:** the same spec passes at 22:11:30, 22:12, 22:14, 22:16, 22:18, 22:20, 22:20:50, 21:00, 21:55, 22:45, 22:58 and 23:05 UTC.
- **Open findings:** none. Lows: none.
- **Next:** the batch 15 pull request (the lead). No low is left open.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-55; `src/money/earnings/earning-rules.ts` (`lagosDay`) and `test/payments/wallet-pay-harness.ts` (`pass`) in `wawu-backend`

## Goal

No spec that asserts "today's move is made, the rest waits for tomorrow" fails because CI started it a few minutes before Lagos midnight.

## Scope (backend only, test files)

`test/payments/wallet-pay-harness.ts` (`keepInLagosDay`, `clockWithRoomInLagosDay`), `src/money/earnings/tests/pay-harness-day.spec.ts` (new), one call each in `paid-dm-wallet.contract.spec.ts` and `host-share.contract.spec.ts`. Nothing else.

## Capability checks

- [x] The failing spec passes with the date started anywhere in 22:11 to 22:21 UTC (it failed there before).
- [x] The rule is pinned on both sides of Lagos midnight with no database (`pay-harness-day.spec.ts`, 5 cases).
- [x] No product file changed; the one-move-a-day specs (`earning-daily-move`, `host-share`, `earning-settlement-nuvion`, `nuvion-earnings`) and the other harness specs pass.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-61.md](history/FIX-61.md).

## Owner sign-off

Not needed.
