# POINTS-07 · round history

Moved out of [tasks/POINTS-07.md](../POINTS-07.md) word for word, oldest first. The current state is in that file.

## Builder report

Mobile `wmt/POINTS-07` (T2). No backend change. Contract copied from backend `90ab9aa` (SHARED-CHANGES POINTS-07 #1).
- **Files:** new `src/features/points/` `StudioScreen`, `StudioRow`, `JobCheck` (hook, `ShortfallSheet`, `CapReachedScreen`), `studioApi`, `studioModel`, `shortfallIntent`, `__tests__/studioFlow.test.tsx`; `src/app/studio.tsx`, dev harness `src/app/preview/studio-job.tsx`. Changed: Home `Services`/`TodayScreen`, `CreateScreen` and `create.tsx`, `BuyScreen` (`doneLabel`) and `points-buy.tsx`, `HomeScreen.test.tsx` (five assertions moved by the Studio tile, SHARED-CHANGES #2), `create.test.tsx` (three tests added).
- **Checks (user can ...):** see the Hub's tools and costs from Home and from Create; too few points with Use wallet on shows the wallet money and takes nothing until the PIN (jest: 0 purchases before the PIN, 1 after, PIN only in its header); Use wallet off offers Buy points; a wallet too low says so; past the cap the Hub's sentence names it. Wrong PIN then right sends the same key (1 debit); double tap Confirm asks once; a lost answer retried sends the same request (1 debit); pending is read by id, never sent again.
- **Stack (V9, `pts07`, ports 7880-7887, Nuvion and voice stand-ins):** real purchase through the web export: 1,000 points + the missing 250 = 1,250, a `shortfall` lot, wallet debited 1,250 naira, after a wrong PIN first. Daily limit reached by 3 real jobs (4,500 points), then the Hub's cap sentence on PT7. Pictures (light and dark, 390 px, beside each board): `scratchpad/points-07-b/pics/beside-*.png` for PT1, PT1a, PT3, PT3a, PT3b, PT7, H1, M19; alone: PT1-error, PT1-loading, PT3-pin, PT3-wrongpin, PT3-after. The error picture is a refused connection to `GET /ai-tools`.
- **Differences from the boards (recorded):** the PT1 caption line "Every AI voice tool, paid in points" is drawn under the bar because the task and R-68 ask for it (the board has it as a caption outside the phone); PT1 draws only VoiceOver (the Hub lists one tool; its tile is half width, not a button); PT3 has no "Use wallet is on in Settings." line (G-POINTS-07-1) and its second line is the Bank charge or "Nothing is taken until you enter your PIN."; PT3b has "Not now" in place of Add money; PT7's words are the Hub's.
- **Checks run:** tsc EXIT 0; eslint on 17 changed files EXIT 0; jest `src/features/points`, `create`, `home` 8 suites 170 pass (studioFlow 24, create +3, HomeScreen +1); gates 0 fail, 9 warn, 0 accepted, none in these files (`files scanned: 890`); `npm run tasks -- --write` EXIT 0 (348 tasks).
- **Not done:** Add money (WALLET-05); the seven other tools; a Settings row for Use wallet; the VoiceOver screens (POINTS-08).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

