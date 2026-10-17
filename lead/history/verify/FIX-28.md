# FIX-28 verifier report (backend wmt/FIX-28 72ebba9, mobile e896b6d)

Verdict: merge. Nothing medium or worse.

## Findings
1. low - report accuracy. The builder's note says `lower(` to `upper(` in schools-order.ts fails 6 of 8 in
   schools-collation. Reproduced here (all four `lower(` including the two in comments, DB C.UTF-8): 4 of 8 fail
   (big page order, cursor-at-any-school, cursor-of-last-school, and the new FIX-28 test). The walk test stays green
   because cursor and order both turn upper, which is expected. The task's check (a spec fails) holds. Task file
   tasks/FIX-28.md and tasks/history/FIX-28.md line 11 state 6; the count is wrong, nothing else is.
2. low (pre-existing, not this change) - Executable gates job is red on main and on the branch with the same 16 FAIL
   lines (diffed: identical sets, none in src/community/community.service.ts or src/schools/**).

## Checks
- Mutants on the branch (worktree, restored each time, tree clean):
  - `lower(` -> `upper(` : schools-collation 4 failed / 4 passed of 8, the new "punctuation between Z and a" test fails.
  - `lower(` removed : 5 failed / 3 passed of 8, new test fails.
  - id tie-break removed : community-list-order 3 failed of 3.
  - id desc instead of asc : 2 failed / 1 passed of 3 (the ascending-id test and the page-edge test).
- Both new specs green unmutated: 11 of 11 (schools-collation 8, community-list-order 3).
- Real Hub (stack fix_28), GET /communities over HTTP, DB truth `ORDER BY name, id`:
  - 30 distinct names (case, accent, underscore, digits): 16 page sizes (1..11,13,29,30,31,100), 0 mismatches, and
    `ORDER BY name` equals `ORDER BY name, id` on that data, so the answer for distinct names is unchanged.
  - 47 rows, 32 names, three tie groups of 6, 6 and 5: 17 page sizes (1..13,17,29,45,100), 0 mismatches, no repeat,
    no skip, `total` correct.
  - Control, same data, `ORDER BY name` only (main's query) by limit/offset: repeats or skips at page sizes
    2,3,4,5,6,9,10,11,12,13 (10 of 13). The bug was real and the tie-break removes it.
- Protected route suite: `scripts/protected-routes/run.sh --fresh origin/wmt/FIX-28` with lock from origin/main:
  253 of 253, 2 suites. (A first run on the dirty stack DB had 33 failures in learn, events, admin, verification, none
  in communities: dirty data, not the change; the fresh run is the answer.)
- CI on 72ebba9: 3 suite shards, contract, netns, deploy-in-sync, baseline, protected: success; gates: failure (finding 2).
- eslint --no-fix on the 3 changed files: EXIT 0. tsc --noEmit: EXIT 0.
- Scope: backend diff is 3 files (community.service.ts one-line order, 2 specs); no route, contract or migration change.
- Mobile diff: docs/LOG.md, docs/PROGRESS.md, tasks/FIX-28.md, tasks/SCHOOLS-03.md, tasks/history/FIX-28.md only;
  `npm run tasks` EXIT 0 (283 tasks). SchoolsScreen.tsx on main already uses `getNextPageParam: last.nextCursor ?? undefined`.
- Not in scope, noted: community-rooms.service `mine()` and `discover`-style lists were not touched by this task.

## Cleanup
Stack fix_28 down (hub pid 29722, mock-id pid 29701 stopped, 7220 and 7227 closed, database dropped); worktrees
v-fix-28-be and v-fix-28-mob removed; temp database fix_28_prot_test dropped; nothing pushed.
Logs: /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix-28-v/logs/
