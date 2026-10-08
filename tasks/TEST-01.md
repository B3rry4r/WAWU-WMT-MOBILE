---
id: TEST-01
title: Tests pass on a cold cache and a loaded machine
owner: YOU
area: TEST
order: 220
priority: after-launch
repo: wawu-wmt-mobile
type: ops
status: done
depends_on: []
decisions: []
passes: []
artboards: []
---
# TEST-01 · Tests pass on a cold cache and a loaded machine

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `src/components/pin-sheet/__tests__/PinSheet.test.tsx` (the pattern this follows)

## Goal

`npm run check` gives the same answer on a cold Jest cache (CI) and on a busy
machine as it does on a warm, idle one. Three verifiers saw
"filter chips › lets a user pick Money out" and other first tests in a suite
time out at Jest's 5 s, because the first test paid for loading React Native's
primitives (Modal alone is about 5 s cold) inside its own budget. A check that
fails by machine speed is not a check (WORKFLOW rule 3).

Order 200 and `after-launch` only because 200 is the one free number after
every not-done YOU task; the checker puts anything after CHECK-3 in
after-launch. The work itself is done now.

## Scope

- `src/__tests__/lists.test.tsx`, `components.test.tsx`, `kit-components.test.tsx`,
  `shell.test.tsx`, `focus.test.tsx`: setup only. No assertion changed, no test
  skipped, no timeout raised.
- `src/features/showcase/Showcase.tsx`: split its state into one component per
  section, so a press re-renders one section, not the page. Same sections, order
  and labels (Lead authorised, 2 Oct 2026: the Showcase is a developer page).
- `docs/LOG.md`, `docs/PROGRESS.md` (generated).

## Capability checks

- [ ] A developer can run `npx jest --ci --cacheDirectory $(mktemp -d)` with 4
      busy-loop node processes and a second cold run going at once, and all 219
      tests pass, 5 rounds out of 5 (10 runs).
- [ ] A developer sees the Showcase page exactly as before: the same rendered
      tree, before and after presses.
- [ ] `npm run check` exits 0.

## Builder report

Builder session, 2 Oct 2026. Branch `wmt/TEST-01`.

- Cause: babel-preset-expo makes `react-native` a lazy import, so a suite's first render loaded RN's primitives inside that test's 5 s budget (cold: Modal 5.4 s, Text 1.2 s). The other cost was that every press in the Showcase re-rendered the whole page (about 170 ms each with React in development mode).
- Files: `lists`, `components` and `kit-components` touch every RN primitive at module scope and render `<Showcase />` once in a `beforeAll` (60 s). The `lists` showcase walk runs on Jest's fake clock. `shell` and `focus` render the router once in a `beforeAll` (60 s). `Showcase.tsx`: `LargeButtons`, `Inputs`, `Tabs`, `Chips`, `Sheet` and `States` each hold their own state, and "Last pressed" reads a small external store, so only its caption re-renders.
- Showcase sameness: a throwaway test (not committed) rendered the old and new Showcase and compared `toJSON()`. Both were identical on first render, and still identical after pressing Continue, Send, Back, Error, Try again, Money out and Today and typing an email.
- Load setup for every run below: 4 `node -e 'for(;;){}'` busy loops plus 2 concurrent cold runs of `npx jest --ci --cacheDirectory $(mktemp -d)`, on 4 CPUs.
- Before the fix: 2 of 2 runs failed with 3 failures each (pick Money out, the components showcase, the lists showcase walk). One cold run with no load also failed: pick Money out took 5195 ms.
- After the preloads alone: 9 of 10 runs passed. One run failed the two lists showcase walks (5337 and 6568 ms).
- After the Showcase split: 10 of 10 passed, 219/219 each. Worst times: Icon "renders every canvas icon" 3196 ms; shell "lands on Home" 4581 ms (over 4 s); focus first tab-bar test 3860 ms. So `shell` and `focus` got the router warm-up.
- Final proof on the committed tree, same load: 10 of 10 runs pass 219/219. Worst times: Icon 2530 ms, shell "lands on Home" 538 ms, focus tab bar 345 ms, lists showcase walk 1932 ms, unlock sheet 2515 ms, components showcase 2591 ms (the slowest test in any run), pick Money out 319 ms.
- Gates: before and after, 0 fail / 0 warn over 63 files, 0 baseline entries; 219 tests before and after; `npm run check` exits 0.
- Not done: Icon.test.tsx is untouched (worst 3196 ms, under 4 s). No PR opened: the prompt asked for a push only.

## Verifier report

Verifier session, 2 Oct 2026, fresh (wrote none of this task's code). Branch `wmt/TEST-01` at 6c76f9d, on main 8f0d90c. Detached worktrees with `node_modules` symlinked; evidence in the verifier scratchpad (`t01/`, `load/`). `passes: []` (type `ops`), so the checks below are the ticket's capability checks plus the prompt's six.

| Check | Result | Evidence |
|------|--------|----------|
| 1. No hidden weakening | passed | `git diff main...wmt/TEST-01` over every test file: the only removed lines are three `react-native` import lines (widened, not dropped) and six `userEvent.press` calls, now `user.press` on Jest's fake clock (WORKFLOW 10: "a flaky suite: fix it, make it deterministic"). `expect(` calls 428 on main and 428 on the branch; `it(`/`test(` 151 and 151. No `testTimeout`, `jest.setTimeout`, `retryTimes`, `.skip`, `.only`, `xit`, `fit` anywhere in `src/**/*.test.*`; `package.json` identical to main. The only new numeric third arguments are the five `beforeAll(..., 60_000)` warm-ups (lists, components, kit-components, shell, focus). |
| 2a. Showcase, same tree (jest) | passed | Throwaway test (deleted, never committed): main's `Showcase.tsx` beside the branch's, `JSON.stringify(toJSON())` compared at 15 points, light and dark: first render, Continue, Send, Back, Error tab, Try again, Money out, Today, typing an email, Empty tab, Browse communities, open sheet, close sheet, "Tap to load for two seconds", and 2.1 s later. Identical at all 30 points; 13 distinct trees per walk, so the presses really changed the page. |
| 2b. Showcase, same picture (web) | passed | `npx expo export --platform web --dev --clear` for main and branch (exit 0 both), served, Chromium 1194 at 390 × 844, 2x, light and dark, `/dev/components`, same press sequence (Continue, Send, Back, Error, Try again, Money out, Today, email). With CSS animations frozen: 18 of 18 viewport shots pixel-identical, plus a full-height capture (390 × 6834, content 6784 px) identical on both themes (`t01/r2/`). A first pass without freezing differed only in the rotation of two spinners (Loading button, Checking field), i.e. capture timing. Page text identical; console errors only the dev-server websocket a static export can't reach, same on both. |
| 3. Load reproduction | passed | Each round: 4 `node -e 'for(;;){}'` plus 2 concurrent `npx jest --ci --cacheDirectory <fresh>`, 4 CPUs. **Main 8f0d90c, 1 round: both runs fail**, 3 failed / 216 passed, each "Exceeded timeout of 5000 ms": filter chips › pick Money out; inputs › type into a field; showcase › press a button and see which one fired. **Branch, 5 rounds: 10 of 10 runs exit 0, 219/219.** Busy loops killed after every round (0 left). Logs `load/main-r1-*.log`, `load/branch-r{1..5}-*.log`. |
| 4. `npm run check` | passed | Exit 0 on 6c76f9d: tsc and lint clean, 11 suites / 219 tests, gates run 9, files scanned 63, 0 fail / 0 warn / 0 accepted, 0 baseline entries, task check passes (`t01/check-branch.log`). |
| 5. Task file | passed | Front matter complete; `type: ops` needs no passes; `depends_on: []`. Order 200 is unique and the first free number after every not-done YOU task (the highest is 199, RELEASE-03); anything after CHECK-3 (175) can't be `launch`, and the Goal says so. `python3 scripts/tasks/check_tasks.py` exit 0 on the branch and on the branch merged with today's main. |
| 6. Merge conflicts | 2 conflicts, both trivial | See below. |

**Merge with MONEY-03 and today's main.** MONEY-03 merged into main during this verification (main moved 8f0d90c → 737e961, MONEY-03 tip 7b46885). `git merge-tree --write-tree` of this branch against `origin/wmt/MONEY-03` and against `origin/main` gives the same two conflicts:
1. `src/__tests__/lists.test.tsx`, the `react-native` import only: main added `View`; this branch's widened import already has it. Take this branch's side of that one hunk; everything else (MONEY-03's sheet hairline, card edge, MediaCard byline, IconTile stroke tests) auto-merges.
2. `docs/PROGRESS.md` (generated): take either side, then `npm run tasks -- --write`.

`src/components/Card.tsx`, the theme, `kit-components.test.tsx` and the Showcase auto-merge (MONEY-03 does not touch `Showcase.tsx`). In a scratch merge resolved exactly that way (not pushed): `npm run check` exit 0, 13 suites / 250 tests, 69 files scanned, 0 fail / 0 warn (`t01/check-merged.log`). Under the same load, today's main 737e961 still fails both runs with the same 3 timeouts (247/250), and the merged tree passes **5 of 5 rounds, 10 of 10 runs, 250/250** (`load/newmain-r1-*`, `load/merged-r{1..5}-*`). So the fix holds as it will land; the merge commit itself is the builder's step before the pull request (WORKFLOW 8.3, 8.7).

Capability checks, as written:
- A developer can run the cold, loaded suite 5 rounds out of 5: passed (10/10 at 219; and 10/10 at 250 once main is merged).
- A developer sees the Showcase page exactly as before: passed (same tree at 30 points, same pixels at 390 px both themes).
- `npm run check` exits 0: passed.

Scope: `git diff --stat main...wmt/TEST-01` matches the builder's list (five test files, `Showcase.tsx`, LOG, PROGRESS) plus this file and `tasks/INDEX.md`. No fenced file touched; no local copy of a shared component (the new `Tabs`, `Chips`, `Sheet` etc. are sections of the Showcase that use the shared `SegmentedTabs`, `FilterChips` and `BottomSheet`).

Findings: none.

Notes (not defects):
- In round 1 on the branch, both runs printed "A worker process has failed to exit gracefully" and still exited 0, 219/219. It did not recur in the other 18 branch or merged runs; main's 4 runs did not show it either, too few to say whether it is new.
- The ticket's figure "219 tests" becomes 250 once main is merged; the load proof above covers both.

NOT RUN: nothing from the list. V-passes beyond the prompt don't apply (`passes: []`); no device or backend check is relevant to a test-only and dev-page change.

Verdict: no open defects. Status `review`.
