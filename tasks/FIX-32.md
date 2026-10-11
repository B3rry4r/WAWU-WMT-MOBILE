---
id: FIX-32
title: The last tests that read an answer before it lands, and one that depends on the clock
owner: YOU
area: FIX
order: 247
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
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

## Verifier report

## Owner sign-off
