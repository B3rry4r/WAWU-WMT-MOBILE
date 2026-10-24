# HOME-18 · round history

Moved out of [tasks/HOME-18.md](../HOME-18.md) word for word, oldest first. The current state is in that file.

## Builder report

Fresh Sonnet builder, 18 Oct 2026, T1. Worktree from `origin/wmt/MERGE-18` ba548d9f (not moved). Files: `src/features/home/*` (`TodayScreen`, `HomeScreen`, `HomeTabs`, `Services`, `look`, three test files), `src/features/notifications/NotificationsBell.tsx` (new), `src/features/explore/ExploreBar.tsx`, `src/app/(tabs)/index.tsx`, this file, `SHARED-CHANGES.md` (HOME-18 #1, #2) and the generated `tasks/INDEX.md`, `docs/PROGRESS.md`.

**Decisions (default, the lead may override)**
1. The ticket's `type` is `component`, not `mobile-screen`, and its `order` is 233 (COMPLETE-03's freed slot): `check_tasks.py` allows an artboard in exactly one mobile-screen task (H1 and H11 are HOME-01's) and refuses a launch task ordered after CHECK-3 (299). `passes` still lists V1 V4 V5 V6 V9.
2. `depends_on` is `[HOME-01]` only: ME-14 built the bell but is `verifying`, so a dependency on it would fail the task check.
3. "Reuse that component, never fork it": Explore's bell was inline in `ExploreBar`, so it is lifted into one `NotificationsBell` (a `today` size, 40 round with the dot 9 and 10 in, and an `explore` size, 44 with 10 and 11), and Explore draws it too (same labels, same test ids). Filed as SHARED-CHANGES HOME-18 #1 (another task's file) and #2 (the route file).
4. The bell is hidden when the session is `signedOut`, drawn while it is `restoring` (H11 draws it over the loading shapes), and the dot is read only for `signedIn`; a count that has not come or failed draws no dot.
5. The board does not draw a scroll's end (the rail runs off the artboard), so the creator's gap is the one that clears the button: `createButtonMetrics.bottom` (16) + its size (58) + 16 = 90, derived from the button's own metrics, not typed. Everyone else keeps 32. Creator is the same answer Create reads (`GET /users/me`, same query key).
6. The tab row steps down as COMPLETE-03's did (`tabFitSteps`: the gap between tabs 20, 16, 12, then the labels 92%, 85%, 80%), read from the row's own measured width, so a larger text size is covered too. The feed's row is untouched (`fit` is off there).

**What changed, measured in the web export (`H1-creator-unread-*`, `report.json`, DOM)**
| | 320 | 360 | 390 |
|---|---|---|---|
| tab row (room beside the buttons) | 168.7 of 184, gap 8, labels 85% | 219.8 of 224, the design | 219.8 of 254, the design |
| any word clipped | none | none | none |
| search 40, bell 40, 8 apart | yes | yes | yes |
| bell dot 8 across, 9 from top, 10 from right | yes | yes | yes |
| page wider than the phone | no | no | no |
Money card: padding 18 above and 16 below, 204 high (the board's card is 204 in its render). Services heading: 24 high, line height 24. A creator's scroll content ends with 90 under the rail; a buyer's with 32 (H11 loading: 32 until the account is read). With the scroll at its end, Create sits clear of every card's Follow (`pics/H1-creator-unread-390-light-end.png`).

**Checks (all on this tree)**
- `npx tsc --noEmit`: EXIT 2 with one error, `src/features/communities/__tests__/RoomScreen.test.tsx(105,3)` (`videoUrl` optional against a required type). It is in a file this task does not touch; nothing in the changed files errors. Reported, not fixed.
- `npx eslint --no-fix` on the 11 changed `.ts` and `.tsx` files: EXIT 0, no findings.
- `npx jest src/features/home src/features/explore src/features/notifications`: 11 suites, 178 tests, all pass (EXIT 0). The new cases: `HomeScreen.test.tsx` 14 (the bell: 8, the spacings: 5, the shared bell: 1), `HomeTabs.test.tsx` 6, `homeRoute.test.tsx` 1.
- Across all 24 web runs (4 states, 3 widths, 2 themes): no page wider than the phone, no clipped label, the tab row at least 8 clear of the search button, the dot present with a count and absent at 0 and while loading, a creator's 90 and everyone else's 32 under the rail.
- Mutants of my own (one edit each, the HOME-18 cases run, the file restored by `cmp`): 5 applied, 5 killed: the card's padding back to 18, a creator's gap back to 32, the heading without its line height, a literal dot, the bell drawn when signed out.
- `python3 scripts/gates/run.py`: EXIT 0, 10 gates run, 1150 files scanned, 0 fail, 16 warn (the PROVISIONAL list, none from this change), 0 accepted.
- `python3 scripts/tasks/check_tasks.py --write` then `npm run tasks`: see the EXIT line in the hand-back.

**Pictures (V5)** web export of this tree (`expo export --platform web`, own TMPDIR, API origins `.invalid`) over a stand-in Hub done with request interception; 0 external requests (the page blocks anything not local or `.invalid`; 24 runs, 0 blocked). Folder `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/home-18-b/`: `cmp/cmp-H1-H1-creator-unread-<320|390>-<light|dark>.png` and `cmp/cmp-H1-H1-buyer-unread-*` (board left, built right), `cmp/cmp-H11-H11-loading-*`; the raw shots at 320, 360 and 390 in `pics/`, and `shoot.cjs`, `montage.py`, `report.json`. The bell, its dot and the bar match the board at 390 in both themes; at 320 the tab row is the stepped one.

**Differences seen, not this task's**
- G-HOME-18-1 (low): H11 draws Create while loading; the built Today draws it once `GET /users/me` has said the account is a creator (`CreateEntry`, shared).
- G-HOME-18-2 (low): H11's loading shapes draw an ad slot and four tiles; the built shapes draw no ad slot (R-59 serves one only when a campaign exists) and three tiles (Monetize is a creator's, known after the account read).
- The board draws Scan and the AD card; neither is built (R-47), so neither is drawn.

**NOT RUN**
- V9 (the real Hub): the pictures use a stand-in; `GET /me/counts` is the contract's own route, answered here with the contract's shape. Unblocked by a build against a Hub that answers `GET /api/hub/me/counts` with a session.
- V10 (a phone): no device touched; what only a phone shows is the real font's widths at 320 (the tab row's steps were measured in the browser's Alan Sans).
- The full `npm run check`: the merge agent runs it once per batch (WORKFLOW section 3).
