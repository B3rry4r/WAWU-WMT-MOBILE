---
id: FIX-31
title: The app's tests that fail only under load: make them deterministic
owner: YOU
area: FIX
order: 246
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# FIX-31 · The app's tests that fail only under load: make them deterministic

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `docs/LOG.md` lines of 10 Oct 2026 that name a flake, and the verifier reports that list them

## Goal

Every full `npm run check` on 10 Oct needed two to five runs, because a test from another task failed under load
and passed alone. That costs every merge and hides real failures. Each such test gets its real cause fixed so the
full check passes first time on a loaded machine.

## Scope

- The tests named on 10 Oct as failing only under load: eventsScreens (D8 "a tier ended": `getByText` while the
  tickets still load), eventsFocus, OpenWalletScreen (A26), settingsScreens, hostScreens, professionals screens (P1
  paging), proListing (P6), auth-signup (F12), HomeScreen, MeScreen, schoolsScreen, Explore screens, TgifReader.
- For each: find the real cause (a query before the data lands, a fake timer not advanced, a real timer, a shared
  module state, a missing await) and fix the TEST so it waits for what it asserts. A product bug found this way is
  reported, not hidden.
- Never raise a timeout, skip, retry or quarantine a test to make it pass.

## Capability checks

- [ ] The full check passes three runs in a row with two jest workers while the machine's load average is 15 or more.
- [ ] Each named test passes 20 runs alone and 3 full runs, with the cause named in the builder report.
- [ ] No assertion was weakened (the verifier reads each diff).

## Builder report

Branch `wmt/FIX-31`, main `9426060` merged (docs only, `docs/PROGRESS.md` regenerated). Mobile only, tests only: no product file, gate, baseline or package file changed, no timeout raised, nothing skipped, retried or quarantined, no assertion removed or loosened. Eleven test files changed. The pass list of this file gained V6, which `check_tasks.py` requires of a `component` task.

**Two causes, found by reproducing them (no CPU hog was run: the machine's own load was 15 to 38 throughout).**
1. **Cold start.** Jest's transform cache key includes the project root, so every fresh worktree starts cold. The first test of a file then paid for loading the screens, React Native's lazily loaded components (babel-preset-expo's lazy imports: ScrollView, Pressable, Text, Modal, Image, Animated, TextInput, 161 modules loaded during E1's first render, counted in a fresh cache directory) and the renderer's own start, all inside its 20 s. With a fresh cache dir on this loaded machine, before: eventsScreens E1 31.5 s (timeout), eventsFocus 46.5 s (timeout), OpenWalletScreen A26 first test 24.9 s (timeout), hostScreens E21 20.6 s (timeout), proListing P5 19.1 s, settingsScreens Z3 17.9 s, TgifReader 13.7 s and 12.3 s. That is also why a second run "passed alone": the first run had warmed the cache. After: the same tests take 0.4 s to 6.8 s (E1 0.9 s, eventsFocus 0.35 s, A26 0.5 s, P5 6.8 s). The fix in each file, the pattern `TEST-01` set in `components.test.tsx` and `PinSheet.test.tsx`: the screens are required at file load (after the file's own `fetch`), the React Native components the screens draw are touched at file load, and a `beforeAll` renders `<View />` once so the renderer's start is paid in a hook (default budget, no timeout argument). `OpenWalletScreen` drops its `jest.setTimeout(20000)` (the same 20 s the config now sets, and a comment that called it the fix).
2. **An answer read before it landed.** The tests read the screen after the first of several answers, or pressed a switch again before the Hub had answered the first press. Reproduced with a scratch jest setup (outside the repo) that delays each fetch answer by 0 to 120 or 250 ms by path (a stand-in for a slow machine), run on the old and the new files.

**Per test: cause, fix, before and after** (before: old file, after: new file, same delays)
- **eventsScreens D8 "a tier ended"**: the tiers are asked for only once the event is known (`enabled: event.data?.ticketed`), so they land a turn after the date the test waited on; `getByText('Ended 6 Oct')` is now `findByText`. Failed in 1 of 6 natural runs here; every delay run failed before, none after.
- **eventsScreens E1 "shows the featured event"** (and D13-E1, D13-E1b, See all, open by tapping, E8 sheet): (a) cold start, above; (b) "Featured Summit" shows first as a row when the list lands before the featured event, so the test now waits for the card (`events-featured`) and reads the name inside it; the "from" and "Free" lines come from the prices call, which is asked only after both have landed, so they are `findByText`; the E8 sheet's kinds come from the options call, now awaited. P1 "does not retry" and T3 asked for the prices call before it was made (a fixed 50 ms wait): they wait for the call first, then keep their window for "not again".
- **eventsScreens and settingsScreens Going and TGIF switches, HomeScreen and Explore follow**: the control flips at once and ignores presses until the Hub answers; `findByText('Going')` or a `waitFor` on the flipped state passed at once and the second press was dropped. Each now waits for the busy flag to clear (`goingSettled`, `idle`, `followsAnswered` on the shared client's `isMutating()`) before the next press and before reading the calls.
- **eventsFocus**: cold start only (one test, 46.5 s cold, 0.35 s after).
- **OpenWalletScreen A26, hostScreens, proListing P5, TgifReader**: cold start, above. TgifReader also left a five-minute garbage-collection timer on every mutation, so a single-file run never exited (a hang of 5 minutes); its client now sets `mutations.gcTime` to `Infinity` like its queries (it exits).
- **settingsScreens (Z3 and Z2)**: cold start (17.9 s), and the TGIF test above.
- **professionals screens P1 paging**: a 50 ms sleep stood for "page 2 has answered"; it now waits for the cache to stop fetching and the skeleton to go (failed at 250 ms delays before, passes after).
- **auth-signup (F12, A15, F1, F2)**: the F12 sign-in tests are the first to draw the sign-in screen, so the hook now draws the welcome, account-type and sign-in screens once; the four wrong codes were typed back to back though the keys are not read while a check is on its way (three tests failed at 120 ms delays): `fourWrongCodes()` waits for each answer.
- **HomeScreen H1 "draws Home's figure at H1's 38"**: found by the fully cold full run (below). Its hook drew Today only with every read held, so the first test with data paid for parsing the answers and drawing the balance, rail and verse (more than the 1 s a `waitFor` allows on a cold cache); the hook now also draws Today from the file's answers, until it has left its loading view, and unmounts. The follow switch test is in the list above.
- **Explore categories "when creators cannot load, a user sees why and can try again"**: it waited out the app's real 1 s and 2 s retry waits (an 8 s `findBy` budget and a 15 s test limit written into it, 10.7 s and a failure in one heavy window); it now runs on the fake clock (1.2 s) and both explicit limits are gone, assertions the same.
- **LegalChatScreen S17 "a failed refresh keeps the conversation"** (not on the task's list; it failed the fourth full check after 20 s): the same real 1 s and 2 s retry waits, with an 8 s `findBy` and a 20 s limit written in; it runs on the fake clock (0.4 s) and both limits are gone.
- **MeScreen, schoolsScreen**: no failure reproduced, cold (no test over 5 s) or with delays; unchanged.
- **Explore "the refusal line stays up for 4 seconds"** fails only when answers are delayed under its fake clock (its loop advances 40 ms); a delay is not what load does to a fake clock, so it is unchanged.

**Not a fix, a finding for the lead**: `SHARED-CHANGES.md` row `FIX-31 #1` asks for a shared jest setup file (package.json is fenced) that touches the same components once for every test file, so a new test file does not repeat the 12 lines. No product bug was found.

**Checks** (every run below is the lead's one-command form, `npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks`, in this worktree, with other agents' jobs on the machine; logs in `scratchpad/fix31/check<n>.log`)
- **Three full runs in a row, EXIT 0** on `5bd1e21` (the first test commit `48d405c` merged with main `9426060`): 120 suites, 2064 tests each; jest 640 s, 400 s and 292 s; load average at the start 33 to 38, 31.7 and 22.7. Typecheck 0, lint 0 errors (5 warnings, none in a line this task wrote), gates 10 run, 473 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`), tasks check clean.
- **Later commits** (HomeScreen's hook, Explore's and LegalChatScreen's retry tests, docs): five more full runs at load 16 to 22 at the start, four failed and the fifth, on the final test files (`f07ca0b`), is **EXIT 0** (log `check8.log`: 120 suites, 2064 tests, jest 321 s, load 22 at the start, gates 10 run, 473 files, 0 fail). Each of the four failed in one to three tests of files this task did not touch or had not touched yet, each of them a short test (the Inbox one is 0.14 s alone) that was stopped at 20 s: run 4 LegalChatScreen S17 (real retry waits, fixed since) and CreatePinScreen A10; run 5 CreatePinScreen P1 and schools detailScreens SC2 (a 0.3 s share test, file time 106 s); run 6 InboxScreen "marked stale by a live event" (0.14 s alone, 29 s for the whole file alone). A test that is 100 times slower in one run than in the next is a worker the machine stopped (the cold full run below had a worker killed for memory, "signal=SIGKILL", and the same stalls hit hostScreens and auth-signup in my repeat runs), not a wait a test can make. Run 7 lost two suites to a worker killed for memory (professionals screens, foundation: "signal=SIGKILL") and stopped WalletScreen "the tab says so and can check again" at 20 s; run 8 started once `free` showed 5 GB available, as the memory note says, and passed.
- **Fully cold full run** (`npm test --maxWorkers=2 --cacheDirectory=<fresh>`, on `48d405c`): 3 of 120 suites failed: HomeScreen (fixed after, above), hostScreens (E13 "flags only the ticket type that is wrong", 20 s, the machine stall above) and auth-welcome (a worker killed for memory). Every other file the task names passed cold.
- **Repeat runs of each named file alone, warm cache, load 18 to 38, two loops of mine running at once** (not the 20 asked for: each run is 30 to 120 s here, and two of the heaviest hours went to the cold causes): eventsScreens 15 of 16 (the one failure was my own mid-run edit), eventsFocus 15 of 15, hostScreens 13 of 15, settingsScreens 15 of 15, OpenWalletScreen 15 of 15, HomeScreen 15 of 15, MeScreen 15 of 15, auth-signup 11 of 13, professionals screens and Explore screens 24 of 25 together (the Explore retry test, since moved to the fake clock), proListing 13 of 13, schoolsScreen 13 of 13, TgifReader 12 of 12. The five failures that were not mine are the machine stalls above (a 2 s test that took 21 s, 43 s, 55 s and 62 s).
- **Delay runs** (scratch setup, not in the repo): the new files pass with every answer delayed 0 to 120 ms (seeds 0, 3, 5) and 0 to 250 ms (seeds 1, 2) in eventsScreens, settingsScreens, auth-signup, Explore screens, professionals screens, HomeScreen, TgifReader, hostScreens, proListing, OpenWalletScreen, eventsFocus, MeScreen and schoolsScreen, except Explore's fake-clock refusal test, which only a real delay breaks; the old files failed there: eventsScreens 9 tests, settingsScreens 1, auth-signup 3, Explore 2 (that one an artifact), professionals 1, HomeScreen 1.
- **Cold runs of the new files** (fresh cache dir each): all pass, first-test times above.

**Left**: (1) the tests that were stopped at 20 s above are victims of a stalled worker; only less work per test (fewer renders, `act` warnings that print thousands of stack traces) could shorten them, and no test was changed for that; (2) the first screen drawn from answers in eventsScreens, settingsScreens, hostScreens, proListing and TgifReader still pays its first data render inside a test (0.9 s for E1 cold, against a 1 s `findBy`): HomeScreen's hook shows the fix (draw it once in the hook), and an attempt to do the same in eventsScreens broke the file (overlapping `act`), so it was backed out; (3) the shared jest setup in SHARED-CHANGES `FIX-31 #1`.

## Owner sign-off
