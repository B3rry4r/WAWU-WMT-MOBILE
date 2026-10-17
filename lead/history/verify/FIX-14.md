# FIX-14 verifier report (16 Oct 2026, Sonnet verifier; mobile wmt/FIX-14 0d2900b, mobile only)

Verdict: merge. Nothing medium or worse. Five lows (sweep rows below).

## Checks (scratch: scratchpad/fix-14-v/, logs/, pairs/, canvas/, app/)
- Chip widths, canvas vs app at 390 px, light and dark (own script, own stack fix_14, own export; baked ports 7240, 7247 only):
  X2/X3 All 42.64/42.64, Music & Audio 139.56/139.56, Film & Video 130.23/130.22; I1 All 47.64/47.64, Communities 114.95/114.95;
  M34 All 47.64/47.64, Brand films 105.42/105.42, Photography 114.45/114.44, Workshops 101.88/101.89.
  Edge-to-label offsets match too (canvas and app: 11/14 in X2/X3, 15/15 in I1/M34). Same widths at DPR 1, 2 and 3.
  A picked chip keeps its width (Music & Audio 139.56 on and off). Pictures: pairs/chips-part1.png, chips-part2.png.
  Also on screen: Works, Wallet history, My tickets, Directory, Schools, Inbox (padding plus border 15, or 11 and 14 in an icon row).
- The four edited assertions are a real change, not a weakened test: mutant (row chip padding back to 15) fails 3 tests, including
  lists.test "36 high with 15 either side" and hubSharedProps "no icon: keeps its 15"; mutant (icon row not less border) fails 4,
  including hubSharedProps "11 at the start and 14 at the end". A sum of NaN fails; a drawn width of 15.5 fails. Base: 122 of 122 pass.
- Mutants for N1 and A5 (Avatar aria-hidden, MediaCard aria-hidden, consent aria-checked): each fails exactly 1 test.
- Live web DOM: decorative avatars on Directory (answer stubbed with CORS): both initials divs carry aria-hidden="true", the row
  button's label reads "Amaka Nwosu, Contracts and tax". Chips' aria-checked true/false confirmed on every chip row.
  A5's consent box is NOT reachable live (the kept BVN check is memory only and needs the identity provider). Instead, the real
  react-native-web 0.21.3 renders the same Pressable props as aria-checked="false"/"true" (and aria-disabled when busy), and
  without the prop renders none (ssr.cjs, ssr2.cjs).
- Fork gate: real tree 0 findings (gates: 10 run, 583 files, 0 fail, 5 warn, unrelated PROVISIONAL). 12 planted declarations:
  9 caught (exported, not exported, default export, arrow, typed FC, memo, forwardRef, React.memo, in a feature folder), 0 false
  positives (same helper name in two feature files left alone). Unit tests 56 pass; two mutants of forks.py fail 16 and 13 tests.
- Settings hang: branch alone 89 s wall, exits, --detectOpenHandles clean; the same file with the gcTime line reverted (what main
  does) 324 s. The timer is react-query's own 5 minute Mutation gc after unmount, not an app leak; production keeps the default.
  No test reads mutation state after unmount. 14 other files have `mutations: { retry: false }` with no gcTime (count confirmed).
- typecheck 0 errors, eslint on the 9 touched files 0, `npm run tasks` OK. Full jest not re-run (builder: 157 suites, 2,841 pass).
- Worktrees removed, stack down (ports 7240-7247 closed, database dropped), nothing of mine listening.

## Findings (all low, sweep rows)
1. scripts/gates/checks/forks.py:30-35 (ARROW_COMPONENT): misses `const Toast = function () {}`, `= async function` and an arrow
   whose `=` ends the line (`const StatusPill =\n  (p) => ...`). None in the real tree. Repro: plant them in src/features/me and
   run python3 scripts/gates/run.py (3 of 12 plants pass). Also `const ListRow = React.memo(\n function ListRow()` reports twice.
2. Same web gap as N1 in the rest of the decorative class: BrandMark.tsx:68, IconTile.tsx:35, GroupTile.tsx:30, Switch.tsx:18,
   bills/parts.tsx:135 hide with accessibilityElementsHidden only, no aria-hidden (live: the Inbox community tile has none).
   Outside the task's scope (Avatar and the placeholder).
3. scripts/gates/tests/test_forks.py (like the other three gate tests) is wired into no command (`npm run gates`, `check`), and
   mobile has no CI: it only runs by hand (python3 -m unittest discover -s scripts/gates/tests).
4. tasks/FIX-14.md Current state says nothing else in any test changed and lists 4 assertions; settingsScreens.test.tsx (a test it
   did not write) also changed, one config line. Correct, but missing from the list.
5. The 14 other QueryClient files (lead's ruling: a sweep row, not a fix round).
