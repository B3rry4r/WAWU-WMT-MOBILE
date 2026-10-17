---
id: POINTS-07
title: Studio: the AI tools, not enough points, the daily limit
owner: YOU
area: POINTS
order: 277
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [AITOOLS-01, POINTS-03, POINTS-06, DV2-COMP, ME-04, HOME-01]
decisions: [R-43, R-61, R-68, R-47]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT1, PT1a, PT3, PT3a, PT3b, PT7]
---
# POINTS-07 · Studio: the AI tools, not enough points, the daily limit

## Current state

As of 17 Oct 2026, built (Sonnet builder, T2). Status: verifying. Not yet checked by a verifier.
- **Branch:** mobile `wmt/POINTS-07` on `origin/wmt/AITOOLS-01` `8e5591a4` (contract synced from backend `wmt/AITOOLS-01` `90ab9aa`). No backend change, no PR.
- **Built:** `/studio` (PT1, PT1a, loading, error with Try again, empty), the Studio tile on Home (first, every account), the Studio card on the Create hub with the points count (M19), PT4c "Back to AI tools" when Studio opened Buy points. `useJobCheck` (`src/features/points/JobCheck.tsx`): quotes a job, then PT7, or PT3, PT3a, PT3b; Confirm buys exactly the missing points with the PIN (one key kept on the phone, same key on retry, pending read by id).
- **For POINTS-08:** mount `useJobCheck({ onReady, onBuyPoints, onForgotPin, onSetPin, onLeave })` on the VoiceOver Run button and pass `onOpenTool` to `StudioScreen` in `src/app/studio.tsx` (the tile is a plain card until then, R-47). `onReady` gets the quote whose `quoteToken` the job carries. Until POINTS-08 the sheets are reached only through the dev harness `/preview/studio-job`.
- **Gaps:** G-POINTS-07-1 (no board draws where "Use wallet" is switched on), -2 (PT3b Add money, WALLET-05), -3 (the other seven tiles, one task each), -4 (the Hub's cap sentence).
- **NOT RUN:** a real provider (never called); V10 on a device.
- **Next:** a lean verifier (V1, V5, V6, V9 on the stack); the lead merges with the next batch.
- **History:** none yet. Reports go to tasks/history/POINTS-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-61, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person opens Studio from Home or from Create, sees the AI tools the Hub lists with their cost in points, and when points run short is offered the wallet top-up or Buy points, with nothing running until they confirm.

## Scope

- New files under `src/features/points/`. PT1, PT1a: `GET /ai-tools` and `GET /me/points`; only the tools the Hub lists are drawn. The heading line reads "Every AI voice tool, paid in points" (R-68: no outside name).
- PT3, PT3a, PT3b: `POST /points/quote`, `PUT /me/points/settings` (Use wallet), `POST /points/shortfall` (PIN, Idempotency-Key) for "Use ₦X from your wallet for the missing points?"; wallet too low sends to Add money. PT7: `points_cap_reached` named cap and reset time in a friendly message.
- This task adds the entries as drawn: the Studio tile on Home (R-61, the services row from DV2-01) and the Studio row on the Create hub with the points balance (M19).

## Capability checks

- [ ] A person can open Studio from Home and from Create and sees the Hub's tools and costs.
- [ ] With too few points and Use wallet on, the sheet shows the wallet money for the shortfall and nothing is taken until the PIN is entered.
- [ ] With Use wallet off, the sheet offers Buy points; with a wallet too low it offers Add money.
- [ ] Past the daily cap the friendly PT7 message names the reset time.
- [ ] Each board above (PT1, PT1a, PT3, PT3a, PT3b, PT7) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
