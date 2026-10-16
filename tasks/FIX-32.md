---
id: FIX-32
title: The last tests that read an answer before it lands, and one that depends on the clock
owner: YOU
area: FIX
order: 247
priority: launch
repo: wawu-wmt-mobile
type: component
status: done
depends_on: [FIX-31]
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# FIX-32 · The last tests that read an answer before it lands, and one that depends on the clock

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-31.md` in full: the two causes (cold start, an answer read before it lands), the delay harness, the rule that nothing is weakened
- `tasks/INBOX-05.md` (defect 38, note 37), `tasks/LEGAL-02.md`

## Goal

No test in the app fails because of the machine's load or the time of day. The full check blocks a push only for a real fault.

## Scope (tests only; no product file, gate, baseline, jest config or package file)

1. `src/features/explore/__tests__/screens.test.tsx`: "X2, X3, X13 · Categories › a creator card in a category is not pressable yet (M5 is ME-02), and its Follow still follows" reads `categories-creator-p1` before the creators land (failed the lead's full check on 11 Oct; passes alone).
2. `src/features/legal/__tests__/LegalChatScreen.test.tsx` (or where LEGAL-02's chat tests live): the three tests FIX-31 round 2 found racing under delayed answers: "a consultant's message arrives without a refresh", "... matter has moved past awaiting a quote ... a new one starts", "an unfinished conversation is picked up ... 404".
3. `src/features/communities/__tests__/RoomScreen.test.tsx`: INBOX-05 defect 38. Its `message()` helper stamps messages about 16.5 minutes ago and expects the day separator `Today`, so it fails in the 17 minutes after local midnight. Pin the clock, as the test at its line 286 already does.
4. INBOX-05 note 37: a test that a refused next page is asked for once (dropping `!isFetchNextPageError` must fail it).
5. `MeScreen` M1 and `events/host/hostScreens` E13 to E15: stalls seen under load in other agents' full checks; find whether either reads before an answer lands or pays a cold start, and fix it the FIX-31 way, or record that it is load only.

## Capability checks

- [ ] Each fixed test fails on the old file at a delay-harness seed (or at the clock just after midnight) and passes on the new one at seeds 0 to 5 and 21 to 23.
- [ ] Each changed file passes alone 10 times in a row.
- [ ] Nothing is weakened: no assertion removed or loosened, no skip, retry or raised timeout.
- [ ] The full check, common-rules form, exits 0.

## Builder report

Branch `wmt/FIX-32` from main `3b35731`, main `610cc57` merged (no conflict). Tests only: six test files (`explore/screens`, `legal/LegalChatScreen`, `communities/RoomScreen`, `communities/CommunitiesView`, `me/MeScreen`, `events/host/hostScreens`) and this task file (`order` is 247, the one free slot before CHECK-3: 282 fails `npm run tasks`). No product file, gate, baseline, jest config or package file; no assertion removed or loosened, nothing skipped, retried or given a longer timeout. Scratch (never committed): the verifier's delay harness `v31/slowfetch.js`, a **stall harness** (`fix32/stall.js`: the first call to a named path blocks the whole thread 1.3 s with `Atomics.wait`, once per test, which is what a stopped worker does to a `findBy`'s one second and which a delay cannot show, since a delay is a timer), and a clock pin (`fix32/clockpin.js`).

| Item | Before | Cause | Fix | After |
|---|---|---|---|---|
| 1. Explore "a creator card ... not pressable yet" | the lead's failure reproduced: stall at `/explore/creators`, "Unable to find ... categories-creator-p1", and **8** tests of the Categories group fail the same way (X2, X3, switch chip, X13, refused Follow, G-300, next page); the delay harness at 250 ms never breaks it (only the unchanged "refusal line" test, an artifact FIX-31 named) | the creators are asked for after the categories land, so the card is two answers away, and a `findBy` has one second of wall time for both; a stall spends it | the file runs on the fake clock (`useFakeTimers({ doNotFake: ['queueMicrotask'] })` in `beforeEach`, real in `afterEach`); `settle` still waits 50 real ms, then moves the clock; the raw `await fetchCategories()` is a `waitFor` | stall at `/explore/creators`, `/explore/featured-creators`, `/users/me`: 55 of 55; delay seeds 0 to 5, 21 to 23: only "refusal line" fails (8 of 9 seeds, as before) |
| 2. LegalChat: "a consultant's message arrives", "matter has moved past", "unfinished conversation ... 404" | delay 250 ms, old file: seed 0 fails all three, 1 two, 4 one, 5 one, 21 two; seeds 2, 3, 22, 23 clean | not these tests: the **tests before them end while their request is in flight**. "a user can Message Adaora" and "writes to the consultant before any payment" wait for the sent words, but the dimmed copy of the words (`legal-bubble-sending`) shows them at once, so they end before the Hub answers, and the late answer is written into the shared cache during the next test (`known` thread, so no `POST /legal/assistant`, and the next test finds `Adaora joined` before its own read). Found with a counter around the fetch mock | both wait for the dimmed copy to go (`messageConfirmed`) before reading the confirmed message; the two "leaving and coming back" tests wait for the reread to end | new file 43 of 43 at seeds 0 to 12 |
| 3. RoomScreen "a member reads the messages oldest at the top" (INBOX-05 defect 38) | pinned clock 00:05 and 00:16:30: 61 of 62 (this test); 00:17:30: 62 | `message()` stamps 16.6 min ago, `Today` needs the same day | `pinDate()`: `Date` alone frozen at local noon (every timer real), real again in `afterEach` | pinned 00:05, 00:16, 12:00, 23:55: 62 of 62 |
| 4. INBOX-05 note 37 | mutant Dc (`!isFetchNextPageError` dropped from `readingOn`) survives all 55 tests | no test of a refused next page | two tests: the hook asks the refused page once (a second answer waits to be read if it asked again), then `fetchNextPage` asks again; the screen says "Couldn't load more communities." and its Try again asks the second time | Dc: **2 failed, 55 passed**, the two new ones; unmutated 57 of 57; file restored byte for byte (`cmp`) |
| 5a. MeScreen M1 | stall at `/users/u1/content`: **4** fail (`me-grid-empty`, `me-grid-error`, D1 veil, D3), the `findBy` failures seen in other agents' checks; no cold start (FIX-31) and no read before an answer; the two 20 s stops seen elsewhere ("a 403 from creator/state", "a plain account sees Services empty") are load only | the grid is asked for after the profile lands: two answers in a row, one second | whole file on the fake clock; D2 waits for `isFetching` to end instead of `await invalidateQueries` | stall at the grid and `/users/me`: 30 of 30; delay seeds 0 to 5, 21 to 23: 30 of 30 |
| 5b. hostScreens "shows a skeleton while the Hub answers" (the lead's message; failed six other agents' full checks) | stall at `/events/options`: "Unable to find ... host-loading" | the test looked at the skeleton after the answers had landed | both answers held (`hold`), skeleton asserted, answers released, then the form (plus: no form while held, no skeleton after) | stall: pass; delay seeds 0 to 5, 21 to 23: 24 of 24 |
| 5c. hostScreens E13 to E15 | tests take 0.1 to 3.1 s alone; the 20 s stops in other agents' checks hit wizard tests and also a 138 ms E21 test | **load only**: a stopped worker, no wait or answer is read | none | none |

**Checks.** Every changed file alone, 10 runs in a row, warm cache, `--maxWorkers=1`, load 8 to 14: RoomScreen, CommunitiesView, MeScreen, hostScreens, Explore screens, LegalChatScreen **60 of 60**. **Full check, the common-rules form, EXIT 0** on the tree with main `610cc57` merged (load 13 at the start, 11 GB available): typecheck 0, lint 0 errors (5 warnings, none in a line this task wrote), **152 suites, 2756 tests passed in 640 s**, gates 10 run, 569 files, 0 fail, 5 warn (all `PROVISIONAL(...)` of other tasks), baseline 0, tasks check clean (`fix32/check1.log`). Old and new files were run in two worktrees; the stall and delay runs are the files `fix32/out/*.out`.

**For the lead.** (1) The delay harness cannot show the stall class (items 1, 5a, 5b): a delay is a timer, a stall is wall time with the thread stopped; the stall harness reproduces the exact messages of the failed full checks and is the "before". (2) The Explore and Me files now run every wait on the fake clock; a new test there that awaits a fetch answer directly (not through `findBy`, `waitFor` or `settle`) hangs under the delay harness. (3) Left, not on the list: explicit raised limits remain in tests this task did not touch and they wait the app's real 1 s and 2 s retry waits: LegalChatScreen "offline: says so" (`timeout: 8000`, 20 s), and in CommunitiesView "keeps the person's rooms and says suggestions failed" (8 s, 20 s), "lists every open room when private rooms fill the pages" (5 s) and the `expectEight` waits (4 s); FIX-31 moved the same kind in Explore and Legal S17 to the fake clock, and the same move would take these. (4) LegalChatScreen and hostScreens did not need the fake clock: a 1.3 s stall at `/legal/intake/mine` or `/legal/assistant` (old Legal file, 43 of 43) and at either read of the host form (whole file, 24 of 24) breaks none of their tests. (5) RoomScreen prints a VirtualizedList "not wrapped in act" error in ordinary runs; it did before this task.

**NOT RUN**: pictures and states (V5, V6): tests only, no screen changed.

## Builder report, round 2

Branch `wmt/FIX-32` from `d901bc1`, main `39c472b` merged (one conflict in the generated `docs/PROGRESS.md`, rebuilt by `check_tasks.py --write`). Tests only: two files, `me/__tests__/MeScreen.test.tsx` and `explore/__tests__/screens.test.tsx`. No product file, gate, baseline, jest config or package file; no other test's meaning changed.

| Item | Before | Fix | After |
|---|---|---|---|
| Finding 1 (medium): MeScreen D2 "a refresh that fails keeps the profile on screen ..." | the test waited for the cache only (`client.isFetching()` at 0), so `me-error` was read before React drew the failed refresh. Mutant PM6 (`MeScreen.tsx` line 96, `(stats.isError && !stats.data)` to `stats.isError`, in a throwaway worktree): round 1 test **passes 30 of 30, three runs** | after the cache wait, `await act(async () => { jest.advanceTimersByTime(100); })` moves the test's clock so React draws the failure, then `me-error` is asserted absent; a comment says why | PM6: **fails (1 of 30), three runs** (this test only, 120 to 146 ms); unmutated: **30 of 30, three runs**; the mutated product file restored and `cmp`ed byte for byte against the saved original and against the branch's; unmutated also 30 of 30 at delay seeds 0, 1, 21 (250 ms harness) |
| Ruling 2: two-line comment at the top of the fake-clock `beforeEach` | none | Explore: "every wait goes through `findBy`, `waitFor` or `settle`; a bare `await` of a fetch answer hangs behind a timer" and a second line saying a wait on the cache alone does not move the clock (use `settle`). Me: the same first line (the Me file has no `settle`, so it names `findBy` or `waitFor`) and the second line that after a cache wait that should show on screen the clock is moved too | comment only |

**Checks.** The two changed files alone, 10 runs each in a row on the merged tree, one worker, load 17 to 24: MeScreen 30 of 30 x10, Explore screens 55 of 55 x10, **20 of 20 runs**. **Full check, the common-rules form, EXIT 0** with main `39c472b` merged (7 GB available at the start, load 21): typecheck 0, lint 0 errors (5 warnings, none in a line this round wrote), **152 suites, 2756 tests passed in 582 s**, gates 10 run, 569 files, 0 fail, 5 warn (all `PROVISIONAL(...)` of other tasks), baseline 0, tasks check clean (`fix32r2/check1.log`). Finding 2 (the host skeleton stall is intermittent), finding 3 (LegalChat seed 4) and finding 4 (leftover `timeout: 8000` in Explore) are recorded notes and not changed, as ruled. No server was started.

**NOT RUN**: pictures and states (V5, V6): tests only, no screen changed.

## Verifier report

Verifier session (Sonnet), independent of the builder. Mobile `origin/wmt/FIX-32` `0664baa`; main `5b9851b` merged in a worktree as `3291bba` (docs only, one generated-file conflict in `docs/PROGRESS.md`, rebuilt by `check_tasks.py --write`). Jest only, no server, nothing left the machine. **Verdict: the causes are real and the fixes hold, with one defect (finding 1): the new MeScreen D2 test passes without ever reaching the state it names, because it now reads the screen before React has drawn the failed refresh. A mutant the old test kills survives the new one. Status `building` for that one test.** Product code and the branch's tests were not changed. Scratch, logs, harness: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfix32/`.

| Pass | Result | Evidence |
|---|---|---|
| V1 | passed for this task, apart from finding 1 | the diff is tests and docs only (below); two full checks EXIT 0 |
| V5 Picture | NOT RUN | tests only, no screen changed |
| V6 States | NOT RUN | tests only, no state drawn differently |

### What was checked

| Check | Result | Evidence |
|---|---|---|
| Diff scope (`git diff origin/main...origin/wmt/FIX-32 --stat`) | CONFIRMED | 10 files: six test files, `tasks/FIX-32.md`, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/INDEX.md`. No product file, gate, baseline, jest config or package file. Main has moved only in docs since the branch's merge (`610cc57` to `5b9851b`: LOG, PROGRESS, `tasks/BILLS-01.md`) |
| Order 247, not 282 | CONFIRMED | with `order: 282` `npm run tasks` fails: "FIX-32.md is a launch task ordered after CHECK-3 (order 282 > 253)"; 247 passes |
| Nothing weakened, by count | CONFIRMED | `it` counts equal in five files, 44 to 46 in CommunitiesView (the two new tests); `expect(` counts equal or higher (Explore 201 to 201, Legal 134 to 137, Room 179 to 179, CommunitiesView 129 to 139, Me 98 to 99, host 64 to 67). No `skip`, `only`, `todo`, retry or raised timeout in the diff; the only `setTimeout` added is a 250 ms real wait in a new test ("asked once", below) |
| Nothing weakened, by mutant | **finding 1** | ten testID mutants (a state made unreachable): the old and the new Explore and Me files fail the same tests, all ten (PE1 to PE5 in Explore, PM1 to PM5 in Me). One semantic mutant (PM6, below) is killed by the old Me file and survives the new one |
| Explore before and after (stall harness: the first call to a path blocks the whole thread 1.3 s, once per test) | CONFIRMED | old, stall at `/explore/creators`: 8 of 55 fail (the Categories group), at `/users/me`: 5 fail, at `/explore/featured-creators`: 55 pass; new: 55 of 55 at all three. Delay harness (0 to 249 ms, seeds 0, 1, 21, new): only "the refusal line stays up for 4 seconds" fails; the old file fails the same test at seeds 0 and 1 (a harness artifact: its own fake clock against the harness's timers, as FIX-31 found) |
| LegalChat at delay seeds (old, then new) | CONFIRMED, seed 4 not reproduced | old: seed 0 fails 3 (the three named tests), 1 fails 2, 5 fails 2, 21 fails 3; **seed 4 passed in 3 of 3 runs** (the builder saw one failure). New: 43 of 43 at seeds 0 to 5 and 21 to 23. The builder's cause (the tests before them end while a send is in flight) holds: mutant E, "a user can Message Adaora" without `messageConfirmed()`, fails the victim test "a consultant's message arrives" at 8 of 9 seeds |
| RoomScreen D38, clock pinned | CONFIRMED | old: 1 of 62 fails (the day-separator test) at 00:05 and 00:16:30, passes at 00:17:30 and 23:55; new: 62 of 62 at all four. Mutant D (the `pinDate()` call removed) fails at 00:05 |
| Note 37, CommunitiesView | CONFIRMED | mutant Dc (`!isFetchNextPageError` dropped from `readingOn`): **2 failed, 55 passed**, exactly the two new tests; unmutated 57 of 57; file restored and `cmp`ed byte for byte |
| MeScreen at a stall on `/users/u1/content` | CONFIRMED | old: 4 fail (D3, D1 veil, `me-grid-empty`, `me-grid-error`); new 30 of 30; new also 30 of 30 at a stall on `/users/me` and at delay seeds 0, 1, 21. Mutant B (the fake clock removed again): the same 4 fail |
| hostScreens skeleton at a stall on `/events/options` | PARTLY, finding 2 | the old test is racy, but a stall does not fail it every time: one stall per test, whole file: old 24 of 24 (builder's harness and mine); that test alone: old failed 2 of 4 (builder's harness) and 1 of 4 (mine); a 30 ms stall on every request: 2 of 3; 200 ms: 1 of 3. New: 24 of 24 at stalls on `/events/options` and `/verification/me`, delay seeds 0, 1, 21, and 6 of 6 of that test alone under the 30 ms stall. Mutant C (the old test put back): fails 1 of 6 |
| Repeat runs, each changed file alone, 10 times, branch tree, one worker, warm cache | CONFIRMED | **60 of 60**: RoomScreen 62 tests x10, CommunitiesView 57 x10, MeScreen 30 x10, hostScreens 24 x10, Explore screens 55 x10, LegalChatScreen 43 x10, every run all passed; load average 18 to 35 while my other jobs ran (`reps.log`) |
| Full check, common-rules form (two workers), branch with main merged (`3291bba`) | CONFIRMED, twice | run 1: EXIT 0, typecheck 0, lint 0 errors (warnings only), **152 suites, 2756 tests, 639 s**, gates 10 run, 569 files, 0 fail, 5 warn (all `PROVISIONAL(...)` of other tasks), baseline 0, tasks 276; started at load 19.7, ended at 23.3, 7 GB available. Run 2: EXIT 0, the same 152 and 2756, 773 s, load 23.1 at the start and 28.5 at the end, 5 GB available, with my own repeat runs going beside it. Logs `check1.log`, `check2.log` |
| Fake-clock note (a bare `await` of a fetch answer in Explore or Me) | RECORDED, below | mutant A |

### Findings

1. **`medium` MeScreen "a refresh that fails keeps the profile on screen; the page error is only for a profile never shown (D2)" no longer reaches the state it names.** The builder changed `await client.invalidateQueries(...)` to `void`, then waits for the stats call to be asked twice and for `client.isFetching()` to be 0, then asserts that `me-error` is absent. On the fake clock the cache has finished, but React has not drawn the failure yet: react-query hands its results to React on a timer of the test's clock, and a `waitFor` on cache state, which passes at its first look, does not move that clock (the experiment below shows it: move the clock and the failure is drawn). Mutant PM6 (`MeScreen.tsx` line 96: `(stats.isError && !stats.data)` to `stats.isError`, which makes a refresh that fails replace the profile with the page error, the defect D2 fixed): old file **fails** (1 of 30), new file **passes 30 of 30** (three runs). With one line added after the `isFetching` wait, `await act(async () => { jest.advanceTimersByTime(100); });`, the same new test **fails** under PM6 and passes unmutated, so that is the fix (tried in a scratch copy only). Searched for the same pattern: the Explore and Me files hold 58 absence assertions (`toBeNull`, `toHaveLength(0)`); read one by one, the other 57 follow a wait on the rendered tree (`findBy`, a `getBy` of a render already seen, `settle()`), which moves the clock. A scratch run with a 100 ms clock advance put before all 58 passes 85 of 85, so none of them hides a later state in the unmutated app. Only D2 waits on cache state alone.
2. **`low` hostScreens "shows a skeleton": the stall is not a deterministic "before".** The new test is right (it holds both answers, looks at the skeleton, then releases them: stricter than the old one, which also did not assert that the form is absent while held), but the builder's table says a stall at `/events/options` fails the old test; it fails it between one run in three and one in two, and never in the two whole-file runs. Record it as racy, not as reproduced every time.
3. **`info` LegalChat seed 4 on the old file did not fail** (3 of 3 passes); seeds 0, 1, 5 and 21 did.
4. **`info` leftovers, not this task's:** `{ timeout: 8000 }` and `}, 15000)` remain on Explore "when Explore cannot load" although the file is on the fake clock now (harmless; the fake wait is 3 s of retries inside an 8 s window).

### The fake-clock note

A new test in Explore or Me that awaits a fetch answer directly: **in an ordinary run it works** (mutant A, the old `expect(await fetchCategories())` put back: passes alone), because the mock answers with promises only. **Under the delay harness it hangs** to the 20 s limit (mutant A at seed 0: fails), and so would any await that sits behind a timer of the app (a retry wait, a toast). It is a trap worth a two-line comment in both `beforeEach` blocks ("a bare await of anything behind a timer never returns here; use findBy, waitFor or settle, and after a cache wait that should show on screen, move the clock"), mostly for the next FIX-31 style delay run and for finding 1. Not added: the files are the branch's.

### Meaning changes (no assertion lost except finding 1; named as asked)

| Test | Old | New |
|---|---|---|
| Explore, all 52 tests | waits in real time | every wait on the fake clock (`queueMicrotask` real); `settle` is 50 real ms plus 50 fake ms plus a 0 ms real turn, so "nothing more was asked" is read after the same 50 real ms |
| Explore "when Explore cannot load" | 3 s of the app's real 1 s and 2 s retry waits | the same three tries and the recovery, counted in fake time |
| Explore "drops a category ... blank id or label" | `expect(await fetchCategories())` | the answer is read with `waitFor`; same expected value |
| Me, all 30 tests | real clock | fake clock; D2 is finding 1; the "Profile saved" test keeps its own fake |
| hostScreens "shows a skeleton while the Hub answers, then the form" | skeleton looked at after the answers could have landed | both answers held, skeleton asserted, form absent while held, answers released, form shown, skeleton gone: stricter |
| Legal: "a user can Message Adaora", "writes to the consultant before any payment", and the two "leaving and coming back" tests | ended while a request was in flight | wait for the dimmed copy of the words to go (`legal-bubble-sending`), or for the reread to end, before the end: stricter |
| Room "a member reads the messages oldest at the top" | real `Date` | `Date` frozen at 2026-10-07 12:00 local, every timer real; it no longer proves "Today" against the real now, which is the point |
| CommunitiesView | 44 tests | 46: a refused next page is asked for once, then "Couldn't load more communities." and Try again asks again (screen), and the same through `useSuggestedCommunities` (hook) |

### Mutants of my own

| Mutant | Harness | Result |
|---|---|---|
| A: Explore "drops a category" put back to a bare `await` | ordinary run, then delay seed 0 | passes in the ordinary run (no catch there), **killed** at seed 0 |
| B: MeScreen: the fake clock removed from `beforeEach` | stall at `/users/u1/content` | **killed**: the 4 tests |
| C: hostScreens skeleton: the old test put back | 30 ms stall on every request, 6 runs | killed 1 of 6 (weak: the old test is racy, finding 2) |
| D: RoomScreen: `pinDate()` removed | clock pinned at 00:05 | **killed** (the day-separator test) |
| E: Legal "a user can Message Adaora": `messageConfirmed()` removed | delay seeds 0 to 5, 21 to 23 | **killed** at 8 of 9 (not seed 4), the victim test each time |
| Dc: `!isFetchNextPageError` dropped | the two new CommunitiesView tests | **killed**, exactly 2 |
| PE1 to PE5, PM1 to PM5 (testIDs renamed: `explore-loading`, `explore-error`, `categories-loading`, `follow-notice`, `categories-creator-*`, `me-loading`, `me-error`, `me-grid-error`, `me-grid-empty`, `me-services-error`) | old and new file each | all ten: the same tests fail in both |
| PM6: a failed refresh drawn as the page error | old and new Me file | old fails, **new survives** (finding 1) |


## Owner sign-off

Merged by the lead, 11 Oct 2026: mobile main (merge of `47e75e3`). Round 1's verifier found one defect (MeScreen D2 asserted before the failed refresh was drawn; mutant PM6 survived) and named the fix; round 2 builds exactly that (the test moves the clock inside `act` after the cache wait; PM6 now fails only D2, three runs, and the file passes unmutated) and adds the two-line fake-clock notes the lead ruled. The lead read the round 2 diff (one `act` and two comments, no product file) and merged it on the round 1 verdict without a second verifier round. Recorded: the host skeleton stall is intermittent on the old test, the leftover `timeout: 8000` on Explore's "cannot load" test (not this task's), and the tests that still wait the app's real retry seconds (LegalChat offline, CommunitiesView suggestions, `expectEight`), which the same fake-clock move would take.
