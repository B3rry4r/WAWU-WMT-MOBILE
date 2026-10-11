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

## Verifier report

Verifier session (Sonnet), independent of the builder. Mobile `origin/wmt/FIX-31` `066906d` in a detached worktree; main when I started `9426060` (already inside the branch). Jest only, no server, nothing left the machine. **Verdict: the two causes are real and the fixes hold almost everywhere; one defect (finding 1): HomeScreen H1 "never themselves" still reads before an answer lands and fails under delayed answers on the branch exactly as on main. Status `building` for that one test.** Product code and the branch's tests were not changed. Scratch, logs and scripts: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/v31/`.

| Pass | Result | Evidence |
|---|---|---|
| V1 | passed for this task | the diff is tests and docs only; no control, screen or product file |
| V5 Picture | NOT RUN | tests only, no screen changed |
| V6 States | NOT RUN | tests only, no state drawn differently; the states the tests assert are unchanged (below) |

### What was checked

| Check | Result | Evidence |
|---|---|---|
| Diff scope (`git diff origin/main...origin/wmt/FIX-31 --stat`) | CONFIRMED | 17 files: 12 test files, `tasks/FIX-31.md`, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/INDEX.md`, `SHARED-CHANGES.md` (one new row). No product file, gate, baseline, jest config or package file (`git diff` on `package.json`, `package-lock.json`: empty) |
| Nothing weakened | CONFIRMED, with the meaning changes named below | all 12 test diffs read line by line (the builder's report says eleven; LegalChatScreen was added later and is the twelfth). No assertion removed (test counts equal in every file; `expect(` counts equal or higher: auth-signup 168 to 169, eventsScreens 148 to 151, Explore 200 to 201, HomeScreen 108 to 109, professionals 82 to 84, settings 176 to 177, the rest equal). No `skip`, `only`, `todo`, retry, `jest.resetModules` or raised timeout (grep on the diff). Removed: `jest.setTimeout(20000)` in OpenWalletScreen (the config sets the same 20000), `{ timeout: 8000 }` in Explore and LegalChat, the `15000` and `20000` test limits |
| Cause 1, cold start (fresh `--cacheDirectory` per run, one file at a time) | CONFIRMED | table below |
| Cause 2, answers read before they land (delay harness, 3 seeds) | CONFIRMED for 12 of 13 files; finding 1 for HomeScreen | table below |
| Repeat runs, each named file alone on the branch, warm cache | CONFIRMED: **10 of 10, 13 files, 130 of 130 passed** | load 19 to 31 while three of my jobs ran; wall 10 to 60 s a run; `rep.A.log`, `rep.B.log` |
| TgifReader `mutations.gcTime` | CONFIRMED test-only | the change is in the test's own `new QueryClient(...)`; no product file. Alone with no `--forceExit`: main hangs ("Jest did not exit", killed at 100 s by `timeout`), branch exits in 17 s |
| Main has moved | note | `origin/main` is `0dd7ac8`, 45 commits past `9426060`. It changed `auth-signup.test.tsx` and `HomeScreen.test.tsx`, which this branch also changed: a trial merge auto-merges both test files and conflicts only in docs: `SHARED-CHANGES.md` (both sides added rows at the end of the table) and the generated `docs/PROGRESS.md` and `tasks/INDEX.md` (`check_tasks.py --write` rebuilds them) |

### Cause 1: first-test time on a cold cache (seconds; main, then branch)

| File and first test | main | branch |
|---|---|---|
| eventsScreens E1 | 30.9 (timeout, fails) | 0.34 |
| eventsFocus | 52.9 (timeout, fails) | 0.27 |
| OpenWalletScreen A26 | 21.8 (timeout, fails) | 0.76 |
| hostScreens, first test | 9.2 | 0.39 |
| proListing P5 | 17.2 | 2.7 |
| settingsScreens, first test | 18.2 | 0.54 |
| TgifReader, first two | 13.9 and 9.9 | 0.22 and 2.2 |

These match the builder's figures (31.5, 46.5, 24.9, 19.1, 17.9, 13.7). Main at the same time also failed eventsScreens D8 (175 ms, a cause 2 failure in a natural run). The branch passed all seven files, with one stall: hostScreens "writes the ticket note ..." took 30.0 s in the first cold run (load 24.5, 1 GB free; 1.5 s on main, 2.5 s on the branch) and the same cold run again passed 24 of 24 (`cold.br.hostScreens.rerun.out`). That is the machine, not a wait (finding 3).

### Cause 2: delay harness

My own copy of the builder's idea (`slowfetch.js`): every `globalThis.fetch = jest.fn(impl)` a test installs answers after a path-dependent 0 to 249 ms, a different mapping per seed; it counts the calls it delayed (3 to 413 a file, shown in each `SLOWFETCH` line). Seeds 21, 22, 23 at 250 ms, new files on the branch, old files on main:

| File | main (old), failed runs of 3 | branch (new), failed runs of 3 |
|---|---|---|
| eventsScreens | 3 (9, 7, 7 tests, among them E1, D13-E1, See all, open by tapping, Going on a row, E2 Going, P1 and D8) | 0 |
| settingsScreens | 3 (Z2 TGIF switch) | 0 |
| auth-signup | 3 (A15, F1, F2: the four wrong codes) | 0 |
| Explore screens | 3 (X1 Follow a featured creator, and "the refusal line stays up for 4 seconds") | 3, only "the refusal line ..." |
| professionals screens | 1 (P1 paging, seed 22) | 0 |
| HomeScreen | 2 (seed 21: the follow switch; seed 22: "never themselves") | **1 (seed 22: "never themselves")** |
| eventsFocus, OpenWalletScreen, hostScreens, proListing, TgifReader, MeScreen, schoolsScreen | not run on main (cold start causes, or no failure) | 0 |

The Explore refusal test is a harness artifact, as the builder said: the test fakes the clock, the harness's delay is a `setTimeout` on that same fake clock, and the test advances it 1 ms at a time for 40 turns; with the real mock (promises only, no timers) there is nothing for load to reorder. It fails the same on main and on the branch, at every seed. Not counted.

### Mutants of my own (one wait put back the old way, in a throwaway worktree, run under the harness)

| Mutant | Seeds run | Result |
|---|---|---|
| M1: D8 `findByText('Ended 6 Oct')` back to `getByText` | 21 | killed: the D8 test |
| M2: both `await idle('settings-tgif')` removed | 21 | killed: Z2 TGIF switch |
| M3: professionals P1 wait back to `await settle()` (50 ms) | 21, 22, 23 | killed on seed 23 only: P1 paging (weak catch: 1 of 3) |
| M4: Explore follow `followsAnswered()` back to `settle()` | 23, 21 | killed on both: "Follow a featured creator" |
| M5: auth-signup `fourWrongCodes()` back to the typed-back-to-back loop | 21 | killed: A15, F1, F2 |
| M6: HomeScreen follow, the busy wait before the second press removed | 21, 22, 23, 24, 25, 26 | killed on seed 22 only (weak catch: 1 of 6) |
| M7: eventsScreens `goingSettled` removed from the row toggle | 21, 22 | killed on both: "toggle Going on a row" |
| Product mutant P1: `useGoing`'s in-flight guard and the row's `busy` both removed, run against main's test and the branch's | none | "a double tap sends one request" fails in both: the `findBy`/`waitFor` change did not weaken it. (With only the in-flight guard removed it passes in both, because the button's busy flag also stops the second press; unchanged by this task) |

### Meaning changes (no assertion lost; named as asked)

| Test | Old | New |
|---|---|---|
| eventsScreens E1 "shows the featured event" | the name anywhere on the screen | the name inside the featured card (`events-featured`): stricter; the "from" and "Free" lines are awaited |
| eventsScreens "a double tap sends one request" | `toHaveLength(1)` at once | `waitFor` the same length: same strength (P1 above) |
| eventsScreens P1 "does not retry", T3 | a fixed 50 or 200 ms window | wait for the prices call first, then the same window for "not again" |
| professionals P1 paging | `settle()` (50 ms) | wait for the cache to stop fetching and the skeleton to go, then the same `queryByTestId(...)` null assertion |
| Explore "when creators cannot load" and LegalChat S17 "a failed refresh keeps the conversation" | the app's real 1 s and 2 s retry waits under an 8 s `findBy` and a 15 or 20 s limit | the same steps on the fake clock; the same assertions (error shown, text, Try again, the row comes back). They no longer prove that the waits are 1 s and 2 s in wall time; they prove the three tries and the recovery |
| auth-signup `fourWrongCodes()` | typed four codes back to back | waits for each answer, and asserts "That code isn't right" after each of the first three (extra). The line goes when the next digit is typed (`CodeScreen.onDigit`), so it is a real wait for the answer |
| HomeScreen / eventsScreens / settingsScreens / Explore switches | pressed the second time at once | waits for the busy flag or `isMutating()` to clear first, then the same call-list assertions |
| `beforeAll` warm-ups (seven files; auth-signup's and HomeScreen's hooks widened) | none | require the screens, touch the React Native components, render `<View />` once; no assertion |

### Findings

1. **defect (medium, this task): HomeScreen H1 "a user sees creators to discover, never themselves, with the tick each has" still fails when the answers are delayed.** Seed 22, 250 ms: the branch fails it (`slow.br-250-s22.home_HomeScreen.out`) and so does main (`slow.mn-250-s22.HomeScreen.out`), the same assertion at line 233 (`queryByTestId(today-creator-<ME>)` is not null). The test waits for the first other creator and then asserts the viewer's own card is absent, but the viewer's id comes from `GET /users/me`, a separate answer that can land after `GET /creators`. The builder's HomeScreen fix covered the follow switch and the hook, not this test, and its own seeds (0, 3, 5 at 120; 1, 2 at 250) did not hit it. A one-line fix, tried in a throwaway and passing at seeds 21, 22 and 23: before that assertion, `await rtl.waitFor(() => expect(clients.every((c) => c.isFetching() === 0)).toBe(true));` (the assertion keeps its meaning for the settled screen). The mutant M6 also fails this test at seed 22, which is the same race.
2. **not this task's, product, low: Today's creator rail draws the viewer's own card until `GET /users/me` answers.** `TodayScreen` passes `me.data` to `discoverable(items, myId)` in `model.ts`, which keeps every item when the id is `undefined`. On a slow link a viewer briefly sees themselves under "creators to discover" (the rule the test names). Report only; a fix is to draw the rail after the id is known, in a later task.
3. **not this task's, machine: stalls of otherwise short tests.** One hostScreens test took 30 s at load 24.5 with 1 GB free, then 2.5 s; the builder records the same class of stall in other files. No test change helps; a full check under load can still stop on one.
4. **test-gap note: M3 and M6 are caught on one seed in three or six.** The harness is a timing tool, so a wait put back in the professionals P1 paging test or HomeScreen's follow test is not always caught. A deterministic version would hold the answer (a promise the test releases) instead of delaying it.
5. **test-quality note, low: a new `console.error`.** Explore's fake-clock retry test prints "You called act(async () => ...) without await" (`check1.log` line 14141, pointing at its `jest.advanceTimersByTime(100)` inside `act`). It does not fail, and it is the only such print the task added; it is the kind of output that can turn into a flake if the loop is changed.
6. **note: SHARED-CHANGES `FIX-31 #1`** (a shared jest setup) is an optional row for the lead; the eleven repeated warm-up blocks are the cost of not having it.
7. **for the lead, not this task's: the merge brings two racy tests of main's own.** A scratch merge of `origin/main` `0dd7ac8` into this head (the generated docs taken from main and `SHARED-CHANGES.md` left conflicted, which no test reads; never committed), auth-signup and HomeScreen under the harness at seeds 21, 22, 23: auth-signup 94 tests, 2 fail at all three seeds, both new from AUTH-07 and not touched by this task: "A15: a wrong code shows 'That code isn't right' ... the fourth wrong 400 in a row ends the sign-up" (types the codes back to back; `fourWrongCodes()` is the same wait) and "asks again on a later visit when the first ask failed" (reads `GET /auth/signup/channel` call counts before the answer lands). HomeScreen (34 tests) passes at 21 and 23 and fails at 22 on finding 1's test only. A follow-up round of this task, or the next one, should take those two.

### Checks

| Check | Result |
|---|---|
| Full check, the common-rules form (`typecheck && lint && npm test -- --maxWorkers=2 && gates && tasks`), run 1 on the builder's head `066906d` | **EXIT 0**: typecheck 0, lint 0 errors and 5 warnings (none in a line this task wrote), 120 suites and 2064 tests passed in 579 s (load average 27 at the start, 2 workers), gates 10 run, 473 files scanned, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`), tasks check clean (`check1.log`) |
| Full check, the same command, run 2 on the tree with this report (status `building`, before the commit) | **EXIT 0**: 120 suites and 2064 tests passed in 500 s (load average 31 to 33 at the start, 2 workers), gates 10 run, 473 files scanned, 0 fail, 1 warn, tasks check clean (`check2.log`). Two EXIT 0 runs in a row at load 27 and 31 |

## Owner sign-off

Lead ruling, 11 Oct 2026 (Default (lead), owner may override): the verifier's one defect (H1 on HomeScreen reads before `GET /users/me` lands, at one delay seed) fails the same way on main, so merging this round makes nothing worse and removes most of the load timeouts that block every push. Under the owner's 10 Oct direction to merge on review and carry findings after, this counts as review. Merged by the lead, 11 Oct 2026: mobile main (merge of `1c2decc`; SHARED-CHANGES keeps both sides' rows). Round 2 on the same branch: H1 (the verifier's one-line wait), the two AUTH-07 auth-signup tests that race at every delay seed ("A15 ... mailed code", "asks again on a later visit when the first ask failed"), and the Explore fake-clock test's act warning. The product finding (Today's creator rail draws the viewer's own card until `/users/me` answers) is recorded for its owning task, not built here.

## Builder report, round 2

Branch `wmt/FIX-31`, continued from `1c2decc` (merged into main by the lead); mobile `origin/main` `a8d6383` merged in (it carries AUTH-07 round 4, merge `4f2549b`, and EVENTS-09). Tests only: four test files changed (`HomeScreen`, `auth-signup`, Explore `screens`, `LegalChatScreen`; no product file, gate, baseline, jest config or package file). No assertion removed or loosened, nothing skipped, retried or given a longer timeout. Delay runs below use the verifier's harness (every fetch answer delayed 0 to 249 ms by path, a different mapping per seed; scratch only, not committed), seeds 0 to 5 and 21 to 23.

| Ruling | Before | Cause | Fix | After |
|---|---|---|---|---|
| 1. HomeScreen H1 "creators to discover, never themselves" | fails at seed 22 (verifier, 250 ms), same on main | the viewer's id comes from `GET /users/me`, a separate answer that can land after `GET /creators`; the null assertion read the rail before it | `waitFor` every client to stop fetching, then the same assertion (the verifier's line) | 34 of 34 at all 9 seeds; 10 of 10 alone |
| 2a. auth-signup A15 "... mailed code ... fourth wrong 400" | fails at seed 21 (confirm calls 2, expected 3) | the confirm call is logged when the request starts, so the `waitFor` on the call count passed before the answer; the keys are not read while a check is on its way, so the next code was dropped | after the second and third wrong codes, `waitFor` "That code isn't right" (what `fourWrongCodes()` does) | 97 of 97 at all 9 seeds; 10 of 10 alone |
| 2b. auth-signup "asks again on a later visit when the first ask failed" | stops at the 20 s limit at seed 21 | two reads: "no line drawn" was asserted while the first ask had not been answered; and `await signupChannel()` never returned, because `renderRouter` puts the clock on fake timers (expo-router's testing library calls `jest.useFakeTimers()`), where an answer that arrives a turn late lands only while `waitFor` moves the clock | `requestsAnswered()` waits for the first ask to have failed before the "no line" lines; `askChannel()` waits for the second on the test's clock; same expectations (resolves `email`, two asks) | passes at all 9 seeds |
| 2c. auth-signup "asks WAWU ID each time ..." (AUTH-07 round 4, now on main) | stops at 20 s at seed 21 (found by the full-file harness run) | the same bare `await signupChannel()` | `askChannel()` | passes at all 9 seeds |
| 3. Explore "when creators cannot load" act warning | one `console.error` "You called act(async () => ...) without await" per run of the file | jest's modern fake timers also fake `queueMicrotask`; React's `act` queues its "was it awaited?" check on it, and the faked check ran inside the next `advanceTimersByTime`, before the `await` had reached the act | `jest.useFakeTimers({ doNotFake: ['queueMicrotask'] })`; the loop and every assertion are the same | 0 warnings in 10 of 10 runs alone (55 of 55); the test takes about 1 s |
| 3b. LegalChatScreen S17 "a failed refresh keeps the conversation" (this task's round 1 test, same code) | the same warning | the same | the same line | 0 warnings in 10 of 10 runs alone (43 of 43) |

**Added at the lead's request** (the AUTH-07 round 4 verifier's two low test gaps), in `auth-signup.test.tsx`, each shown by a mutant of the product file in this worktree (run with the repo's jest config, the whole file, restored byte for byte after):
- **D5** "a failed ask on a later visit clears the line the earlier visit drew, and the next good ask draws it again": mutant M3a (`signupChannel` keeps the last answer when the ask fails) KILLED, 1 of 97 failing, D5 by name; mutant M3b (`sign-up.tsx` ignores a null answer) KILLED, 1 of 97, D5 by name.
- **N-1** "an answer to an earlier visit that lands after a later visit has drawn its own is not drawn over it" (the earlier visit's answer is held by a gate the test releases, so the order does not depend on timing): mutant M5 (the `if (current)` stale-answer guard removed) KILLED, 1 of 97, N-1 by name.
- Unmutated, both pass, at all 9 seeds.

**Delay runs, changed files, 250 ms, seeds 0 to 5 and 21 to 23** (one jest per file): HomeScreen 9 of 9 clean; auth-signup 9 of 9 clean (97 tests); Explore screens: only "the refusal line stays up for 4 seconds" fails, at 8 of 9 seeds (seed 3 clean), the harness artifact the round 1 report named (the harness delay is a timer on the same fake clock the test drives), unchanged by this round; LegalChatScreen: see Findings.

**Findings (not built, for the lead)**
1. **LegalChatScreen (LEGAL-02's tests, not on this task's list) has three tests that read before an answer lands**, found by running the changed LegalChatScreen file under the harness: "a consultant's message arrives without a refresh when the live connection says the conversation changed" (reads "no join line" before the thread has loaded), "a conversation whose matter has moved past 'awaiting a quote' is not reopened: a new one starts" (the OPEN call count), and "an unfinished conversation is picked up, an older form intake that answers 404 is passed over" (the OPEN call count). Failing seeds: 0 and 21 (all three), 1 (two), 4 (one); clean at 2, 3, 5, 22, 23. Alone and in full runs they pass. They need the same wait for the answers; left for a round 3 or LEGAL-02.
2. **Explore "the refusal line ..." prints the same act warning, but only under the delay harness** (0 in the 10 ordinary runs). It is the test's own `jest.useFakeTimers()` (no `doNotFake`); the harness adds fake-clock timer jobs that make the faked `queueMicrotask` run early. Not changed: it prints nothing in ordinary runs and the test fails under the harness anyway.
3. Not this round, as ruled: the creator rail's own card before `/users/me` answers (a product finding, recorded for its owning task) and SHARED-CHANGES `FIX-31 #1`.

**Checks**
- Each changed file alone, 10 times, warm cache, two jest runs at a time at most, load average 15 to 17: HomeScreen 10 of 10, Explore screens 10 of 10, LegalChatScreen 10 of 10, auth-signup 10 of 10; no `act ... without await` in any run.
- Full check (the common-rules form, two workers): see the next line.

**NOT RUN**: pictures and states (V5, V6): tests only, no screen changed.

