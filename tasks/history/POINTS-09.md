# POINTS-09 · round history

Moved out of [tasks/POINTS-09.md](../POINTS-09.md) word for word, oldest first. The current state is in that file.

## Builder report

Mobile `wmt/POINTS-09` (T1). No backend change; contract synced from backend `wmt/AITOOLS-03` `542bc86`.
- **Files:** `src/features/points/` `ToolScreen.tsx` (branches on `input.kind`), `voiceoverApi.ts` (`startJob` by tool id), `voiceoverIntent.ts` (a record per account and tool), `voiceoverModel.ts` (`inputKindOf`, `toolReady` by kind, box labels), `studioModel.ts` (`isBuiltTool`, the Hub's ids, `costLine`), `studioApi.ts` (`AiTool` reads a missing `input.kind` as `text`), `StudioScreen.tsx` and `StudioRow.tsx` (draw only tools with a screen); new test `__tests__/studioToolsFlow.test.tsx` (19); `contract/openapi.json`, `openapi.mobile.json`, `SOURCE_COMMIT`, `src/api/schema.generated.ts` (additive: three routes, three request schemas, `outputs`, `input.kind`).
- **Capability checks:** Quick voice (125 a minute from the Hub, voice rows, "About N minutes", cost line, run, play): tests plus the live run. Sound effect and Music track (75 and 500 from the quote, description box and count, run, play): tests plus the live run. A failed job for each tool says no points were taken and the balance is unchanged: tests plus the live run. Too few points opens PT3 and nothing runs; the daily limit opens PT7 with the Hub's sentence: tests for each tool; PT3 also live. A tool the Hub lists that the app has no screen for, and one the Hub does not list, has no tile: tests. VoiceOver's tests pass untouched: `toolFlow` 21, `voiceoverModel` 6, `studioFlow` unchanged. Real sign-in on the local stack (V9): done, see Current state.
- **Checks (EXIT 0):** tsc; eslint on 9 changed files; jest points and create 217/217 (198 before); gates 0 fail, 18 warn, 0 accepted (as before); `check_baseline`; `check_tasks --write`. `react-native-view-shot` was missing from the shared `node_modules` on this machine, so tsc and the web export needed it unpacked into this worktree's own copy (no file of the repo changed for it).
- **Differences from the boards (recorded):** no play button on voice rows, no "Bio" tag, no Save or Use in a product rows, no "Example values", no "Your voice" row (as POINTS-08); the description box is PT2's text box with a "Description" label and the Hub's line as its placeholder (no board draws it); the Music track tile follows the Hub's list order, after Sound effect.
- **Gaps filed:** G-POINTS-09-1 (length, instrumental, history, existing row), G-POINTS-09-2 (the description box), G-POINTS-09-3 (PT2a's time line for a track). No shared-change request.
- **Not done:** the three screens are not compared picture by picture with PT2 to PT2c beyond the builder's own look (the verifier does V5); no real provider, no real run of a track; PT7 not run on the stack.


## Verifier report

Verifier (Sonnet, T1; built none of this). Mobile `origin/wmt/POINTS-09` `a44d2de6` against `origin/main` `606ced6a`; backend `origin/wmt/AITOOLS-03` `542bc86` on the Nuvion and voice stand-ins (stack `pt09v`, ports 7880 to 7887, stand-ins 7940 and 7941, web export at 390 by 844, Chromium, real sign-in through the mock WAWU ID, a person with 6,000 points granted). Pictures: `scratchpad/points-09-v/pics/` (`cmp-PT1`, `cmp-PT2`, `cmp-PT2a`, `cmp-PT2b`, `cmp-PT2c`, each `-dark` and `-light`: the rendered board beside Quick voice, Sound effect and Music track; plus each tool's own `-1-empty` to `-5-playing`, `-4-failed`, `low-sheet`, `studio-provider-off-dark`, `studio-extra-unbuilt-dark`).

**Verdict: PASS (merge).** No blocker, high or medium. Three lows (below).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | tsc EXIT 0; eslint (no --fix) on the 9 changed `.ts`/`.tsx` files EXIT 0; full jest `--ci --maxWorkers=2`: 320 suites, 5,444 tests, EXIT 0; `scripts/gates/run.py` 0 fail, 18 warn, 0 accepted, 1,219 files scanned (main: 1,218, same 18 warns); `check_baseline` EXIT 0 (0 entries); `check_tasks` EXIT 0. Logs in `scratchpad/points-09-v/logs/` |
| New tests | passed | `studioToolsFlow` (19) copied onto a main worktree: 16 fail, 3 pass (the 3 that pass are existing generic behaviour); built: all 19 pass inside the full run. No existing test edited. No `package.json` or lockfile change, no native config change: ships over the air |
| Contract | passed | `contract/openapi.json` is byte-identical to backend `542bc86`; `openapi.mobile.json` and `schema.generated.ts` regenerate identically from it; the change against main is additive (4 routes, 5 schemas, `AiJobView.outputs`, `AiToolView.input.kind`; nothing removed). `SOURCE_COMMIT` names `542bc86` |
| V4 Field trace | passed | Hub `GET /ai-tools` gives names, costs, units, limits, voices, description; the app shows them as given. The cost line is the Hub quote ("This uses 125, 75, 500 points"), "used" and the balance are the Hub's job and `GET /me/points`. Balance moved by exactly the quote for each tool (125, 75, 500; Quick voice on 2,499 characters: "About 3 minutes", 375) and the Hub's ledger agrees (6,000 granted, 4,325 spent, 1,675 left; 18 holds committed, 6 released) |
| V5 Picture | passed | PT1, PT2, PT2a, PT2b, PT2c beside the three tools, dark and light, `pics/cmp-*`. Matches except the recorded differences (no play button on voice rows, no "Your voice" row, no "Example values", no "Bio" tag, no Save or Use in a product rows: G-POINTS-09-1, as POINTS-08; the description box has no board: G-POINTS-09-2). Tile order differs (low 1) |
| V6 States | passed | Working ("Making your {name}"), done with a player, failed, too few points, unlisted tool, provider off, each through its real cause (below). PT7 NOT RUN live (covered by 3 passing tests) |
| V7 Flow walk | passed | Studio to tool to Run to working to done to play, for each tool; leave a Sound effect working, run a Music track, come back: the first job is found and ends (spent 575 = 75 + 500) |
| V9 Live seam | passed | Real sign-in (no injected token), one job of each tool, audio read back and played (the player's label went to "Pause {name}" for Quick voice on a long text, Sound effect and Music track); the Hub's stand-in saw Quick voice on the faster model (`eleven_flash_v2_5`) and VoiceOver on its own |

What was tried, live:
- Studio shows a tile only for a tool the Hub lists: with the provider off the Hub lists only VoiceOver (not enabled), the app draws that tile alone, "Not available right now"; with the real list plus `receptionist`, `captions` and an old-id `quick_voice` added, still only the four tiles; `/studio-tool?tool=captions` and `=receptionist` open "isn't available right now". The Receptionist never shows.
- One job of each tool: working, then done with a player that plays; the balance moved by the Hub's price only.
- A failed job (`[[fail]]`), each tool, dark and light: "That didn't work / No points were taken. Try again." and the balance unchanged (4,675 before and after); the Hub released the hold.
- Too few points (60 points, Sound effect at 75): "Not enough points, This costs 75, You have 60, Short by 15", Buy points, Not now; 0 requests to a job route, balance 60, no hold.
- Double tap on Run (Sound effect): 1 request, one job, 75 taken once.
- VoiceOver: no existing test changed (`toolFlow` 21, `voiceoverModel` 6, `studioFlow`); its stored record keeps the key `wmt.points.job.{owner}`. A job started on the Hub with its record written under that key (the shape main writes) was found on opening VoiceOver: the words came back, the job ended with a player, the record was dropped, 250 points taken once.
- No text a person reads states a price except the Hub's figure; no provider or model name and no em-dash in the added code or on any screen read (the placeholders are the Hub's own lines "Describe a sound and hear it." and "Describe a track and get the music.").

Findings (all low, none blocks):
1. **low, differs-from-board, unrecorded.** Tile order: PT1 draws Music track before Sound effect; the app draws the Hub's order (Sound effect, then Music track), `src/features/points/StudioScreen.tsx` line 86 (`tools.data.tools.filter(isBuiltTool)`). Repro: open Studio on a stack with the voice stand-in. Fix is one line either side: sort by the board's order in `studioModel.ts`, or list Music before Sound effect in backend `src/ai-tools/tools/index.ts`. The builder disclosed it; no ruling covers it.
2. **low, unclear.** PT2a says "About a minute. You can leave this screen." for a Sound effect and a Music track (`voiceoverModel.ts` `TOOL_WORDS.workingBody`, all tools). No real run of either exists; the Hub allows a track call up to `AI_VOICE_MUSIC_TIMEOUT_MS` (default 10 minutes). Filed as G-POINTS-09-3; the designer or the owner rules the line per tool once a real track has run.
3. **low, test-gap.** No new test double-taps Run on Quick voice, Sound effect or Music track; a mutant that drops the `starting` or `check.checking` guard would pass the 19 new tests on those paths (VoiceOver's `toolFlow` 'a double tap on Run makes one job' covers the shared path, so the full suite would still catch it). The test to add: a double press on Run for a `prompt` tool, one POST and one hold.

Not run: PT7 live (the daily cap) and a real provider (stand-in clips only; AITOOLS-03 has no real run yet). Cleaned up: stack down, stand-ins stopped, database `pt09v_wawu_hub_test` dropped, nothing listening on 7880 to 7887 or 7940 to 7947.

