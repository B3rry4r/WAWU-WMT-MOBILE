---
id: TEST-01
title: Tests pass on a cold cache and a loaded machine
owner: YOU
area: TEST
order: 200
priority: after-launch
repo: wawu-wmt-mobile
type: ops
status: verifying
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
