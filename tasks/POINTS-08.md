---
id: POINTS-08
title: One AI tool: VoiceOver, working, done, failed
owner: YOU
area: POINTS
order: 278
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [POINTS-07, AITOOLS-01, VERIFY-01]
decisions: [R-43, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [PT2, PT2a, PT2b, PT2c]
---
# POINTS-08 · One AI tool: VoiceOver, working, done, failed

## Current state

As of 17 Oct 2026, built (Sonnet builder, T2). Status: verifying. Not yet checked by a verifier.
- **Branch:** mobile `wmt/POINTS-08` on `origin/wmt/POINTS-07` `1cd84d3b` (contract synced from backend `90ab9aa`, no backend change, no PR).
- **Built:** `/studio-tool?tool=voiceover` (`ToolScreen`, PT2, PT2a, PT2b, PT2c), driven by the tool's description from `GET /ai-tools` (name, text limit, characters per minute, cost, voices); Studio's VoiceOver tile now opens it. Run mounts `useJobCheck` (PT3, PT3a, PT3b, PT7) then `POST /ai-tools/voiceover/jobs` with one `Idempotency-Key` kept on the phone (`voiceoverIntent.ts`); working reads `GET /ai-tools/jobs/{id}` every 2 s; done plays the audio (`ResultPlayer`) and says what it took; failed shows the Hub's own sentence.
- **Not drawn (R-47), gaps filed:** the play button on each voice row (G-POINTS-08-1), Save and "Use in a product" (G-POINTS-08-2, same fact as G-AITOOLS-01-4, so the capability check "attach the audio to a draft" is open), "Your voice" (G-AITOOLS-01-1), the "Bio" chip (it names the Voice Intro), "Example values". G-POINTS-08-3: the Hub has no job list, so a finished job seen once cannot be found again.
- **Shared-change rows:** POINTS-08 #1 (`VoicePlayer` takes a `name`; until then `ResultPlayer` stands in and goes with it), #2 (one `studioFlow` case changed because its tile is now a button).
- **NOT RUN:** a real voice provider (never called); V10 on a device; playing the audio on a phone (web export only: a click plays the stand-in's file).
- **Next:** a lean verifier (V1, V4, V5, V6, V9 on the stack); the lead merges with the next batch.
- **History:** none yet. Reports go to tasks/history/POINTS-08.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person runs VoiceOver from text: the input, the voice, the cost, Run; sees it working; gets the audio to play, save and use in a product; or a failure that says no points were taken. The pattern serves every tool the Hub adds later.

## Scope

- New files under `src/features/points/`. Input up to the Hub's character limit, voice list, cost line from the quote ("This uses 250 points"), Run calls `POST /ai-tools/voiceover/jobs`, working polls `GET /ai-tools/jobs/{id}`, done shows a player (not the Voice Intro player), Save and "Use in a product" attach the audio to a draft (VERIFY-01 drafts). PT2c: the failed state reads "No points were taken" from the Hub.
- Built as one reusable tool screen driven by the tool's description from `GET /ai-tools`, so a later tool is a catalogue entry, not a new screen.

## Capability checks

- [ ] A person types text, sees the cost first, runs it, and plays the finished audio.
- [ ] A failed job shows that no points were taken and the balance is unchanged.
- [ ] A person can attach the audio to one of their drafts.
- [ ] Each board above (PT2, PT2a, PT2b, PT2c) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

Mobile `wmt/POINTS-08` (T2). No backend change.
- **Files:** new `src/features/points/` `ToolScreen`, `ResultPlayer`, `voiceoverApi`, `voiceoverModel`, `voiceoverIntent`, tests `toolFlow` (21) and `voiceoverModel` (6), `src/app/studio-tool.tsx`. Changed: `PointsFrame` (optional `subtitle`, PT2's "Points: 1,250"), `src/app/studio.tsx` (`onOpenTool`), `studioFlow.test.tsx` (one case, SHARED-CHANGES #2).
- **Checks (user can ...):** type words and see the length and the Hub's own cost ("This uses 250 points", from `POST /points/quote`, minutes from the Hub's `charactersPerUnit`) before Run; Run once and play the finished audio; a failed job shows the Hub's words and the balance is unchanged; a cost that moved is shown again before anything runs; too few points opens PT3 and the daily limit PT7, nothing is sent; leave while it works and come back to the same job; a lost answer then Try again is one job (same key). Not done: attach the audio to a draft (G-POINTS-08-2).
- **Stack (V9, `pts08`, ports 7860-7867, Nuvion and voice stand-ins, backend `90ab9aa`):** real jobs through the web export. Double tap Run: 1 request, balance 1,000 to 750. Lost answer (response dropped), then Try again: the same key twice, 750 to 500, one job. Failed job (stand-in refuses): banner "That didn't work / No points were taken. Try again." (the Hub's), balance 1,000 to 1,000. Daily limit after 3 big jobs: PT7. Pictures (390 px, light and dark, beside each board): `scratchpad/points-08-b/pics/beside-PT2`, `-PT2a`, `-PT2b`, `-PT2c` (`-light`, `-dark`); alone: PT2-empty, PT2-unsent, PT7, PT2-error (refused connection to `GET /ai-tools`), PT2-loading.
- **Differences from the boards (recorded):** no play button on voice rows, no "Your voice" row, no "Example values", no "Bio" chip, no Save and Use in a product rows (gaps above); "Points: N" and "N points used · M left" are the Hub's reads (the board's 1,250 and 1,000 are examples); the player shows 0:00 until the audio reports its length; the screen reader hears "Play VoiceOver" not "Bio" (SHARED-CHANGES #1). The pictures with `[[slow:9000]]` or `[[fail]]` in the box are the stand-in's own commands to make a job slow or fail.
- **Checks run:** tsc EXIT 0; eslint on changed files EXIT 0; jest `src/features/points` 6 suites 92 pass (toolFlow 21, voiceoverModel 6, studioFlow with one case changed); gates 0 fail, 9 warn, 0 accepted (`files scanned: 898`; first run had 4 fails in `ToolScreen`, fixed in the code).
- **Not done:** Save and Use in a product; voice previews; the player's error state (the audio source reports none).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
