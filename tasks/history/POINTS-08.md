# POINTS-08 · round history

Moved out of [tasks/POINTS-08.md](../POINTS-08.md) word for word, oldest first. The current state is in that file.

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

