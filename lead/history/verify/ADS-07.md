# ADS-07 verifier report (backend cf6da4a on main a5e48fc; mobile 50dc44e on 7de785d)

Verdict: FIX (one mechanical item). Nothing wrong in product code.

## Findings
1. MEDIUM, mobile docs/PROGRESS.md is stale on wmt/ADS-07 (50dc44e): `npm run tasks` EXIT 1 ("docs/PROGRESS.md is out of date").
   Same check passes on app main 7de785d. Repro: `python3 scripts/tasks/check_tasks.py` in a worktree of the branch.
   Fix: `python3 scripts/tasks/check_tasks.py --write`, commit docs/PROGRESS.md (one line: the ADS-07 round 2 entry replaces the oldest).
2. LOW, stale text: tasks/ADS-07.md "Current state" names backend 14b0774 (head is cf6da4a); SHARED-CHANGES ADS-07 #2 says the contract copy is from 4ec121e (it is cf6da4a, and contract/SOURCE_COMMIT says cf6da4a).
3. LOW, no rollback script ships with the migration (Postgres cannot DROP an enum value). A working one is in scratchpad ads-07-v/rollback.sql (recreate type, move explore_slider rows to ended; AdEvent/AdDailyTotal foreign keys are RESTRICT so rows cannot be deleted).
4. PRE-EXISTING (also on main): `prisma migrate diff` shows drift `DROP INDEX "ContentPiece_specializations_idx"`; gates run.py shows the same 5 FAIL lines on main and branch (identical output).

## Checks
- Migration: applied to a database built from main with live-shaped rows (6 campaigns: both placements, with/without artwork, ended, draft, paused; 3 events, 2 daily totals): data md5 identical before/after, enum gains explore_slider, `migrate diff` shows no drift for it, re-apply is a no-op, rollback worked with explore_slider rows holding counts, roll-forward worked again.
- Admin attack suite (HTTP, real parallel requests, 55 checks, 0 fail): POST none/null/""/spaces/number/http/javascript artwork (422 for none/null, 400 others), nothing written; PATCH clear (422, artwork+updatedAt+audit unchanged), legacy edit of headline/weight/advertiser/empty/null (422 each, nothing written), with artwork 200, legacy live 409 first; schedule/resume of legacy 422 with no audit row, pause/end never refused, 409 for wrong state comes before 422; roles 403/401.
- Serve/count suite (34 checks, 0 fail): order weight desc, start, booking, id (7 cases, stable across calls and viewers); excludes draft, paused, ended, not started, window over, cancelled/pending/past/missing event, no-artwork live and scheduled; tgif_card and today_slot still one card or null and skip a higher-weight no-artwork campaign; `data: []`, no-store; 60 live adverts all returned in 81 ms; pause gone on the next call; bad placement forms all 400.
- Counting/races (26 checks, 0 fail): 16 parallel views one viewer = 1 row, total 1; 3 viewers x 6 = 3; mixed parallel view/tap/skip once each; refused events (legacy live, legacy paused, after pause) write nothing, 404 body identical to unknown id; 10 parallel schedules = 1 winner, 1 audit row; 12 rounds schedule vs PATCH-add-artwork, 12 schedule vs PATCH-null, 10 resume vs PATCH, delete/schedule/PATCH and pause/end/PATCH races: never on air without artwork, no 5xx.
- Admin read side (17 checks, 0 fail): needsArtwork on list/detail/create/patch, ?artwork=missing alone and with status/placement/phase/paging, bad value 400, report needingArtwork and filters.artwork echo, servingNow false for legacy, ended legacy not flagged.
- Before/after probe, 173 requests on main vs branch (admin ad routes: every validation error, roles, lifecycle, lists, reports; user /ads and events; 18 other admin GETs; 40 registry GET routes): identical after removing the new fields (needsArtwork, filters.artwork, needingArtwork, explore_slider keys and the placement-enum message) plus one JWT iat. GitHub on cf6da4a: suites x3, contract, netns, deploy-test-in-sync, Protected routes, Baseline green; Gates red on the same 5 FAIL as main.
- Builder's ads specs on the stack: serve + events + data-model 173 passed.
- App (50dc44e): typecheck EXIT 0; eslint on ads and tgif EXIT 0; jest ads, tgif, today, home, shell 175 tests pass; gates passed; contract copy byte-identical to the backend's and `sync_contract.py` regenerates with no diff; tasks check FAILS (finding 1).
- NOT RUN: pictures at 390 px (the task draws no artboard; a card with a picture is unchanged); full 3248-test mobile suite (CI unavailable, focused suites run).
- Stack ads_07 down, databases dropped, worktrees removed, nothing listening on 7490-7497.
