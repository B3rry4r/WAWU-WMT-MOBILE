---
id: POINTS-07
title: Studio: the AI tools, not enough points, the daily limit
owner: YOU
area: POINTS
order: 277
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [AITOOLS-01, POINTS-03, POINTS-06, DV2-COMP, ME-04, HOME-01]
decisions: [R-43, R-61, R-68, R-47]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT1, PT1a, PT3, PT3a, PT3b, PT7]
---
# POINTS-07 · Studio: the AI tools, not enough points, the daily limit

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 14.
- **Status:** merging (lead). Verdict: PASS (the shortfall bought once on a double tap, a wrong PIN, a lost answer; the PIN only in the header; no provider name); 3 lows and a note (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/POINTS-07.md`). Stacked in batch 14 by MERGE-14 (backend `wmt/MERGE-14`, mobile `wmt/MERGE-14`); not on main.
- **Branch:** mobile `wmt/POINTS-07` on `origin/wmt/AITOOLS-01` `8e5591a4` (contract synced from backend `wmt/AITOOLS-01` `90ab9aa`). No backend change, no PR.
- **Built:** `/studio` (PT1, PT1a, loading, error with Try again, empty), the Studio tile on Home (first, every account), the Studio card on the Create hub with the points count (M19), PT4c "Back to AI tools" when Studio opened Buy points. `useJobCheck` (`src/features/points/JobCheck.tsx`): quotes a job, then PT7, or PT3, PT3a, PT3b; Confirm buys exactly the missing points with the PIN (one key kept on the phone, same key on retry, pending read by id).
- **For POINTS-08:** mount `useJobCheck({ onReady, onBuyPoints, onForgotPin, onSetPin, onLeave })` on the VoiceOver Run button and pass `onOpenTool` to `StudioScreen` in `src/app/studio.tsx` (the tile is a plain card until then, R-47). `onReady` gets the quote whose `quoteToken` the job carries. Until POINTS-08 the sheets are reached only through the dev harness `/preview/studio-job`.
- **Gaps:** G-POINTS-07-1 (no board draws where "Use wallet" is switched on), -2 (PT3b Add money, WALLET-05), -3 (the other seven tiles, one task each), -4 (the Hub's cap sentence).
- **NOT RUN:** a real provider (never called); V10 on a device.
- **Next:** the batch 14 pull request (the lead). The verifier's lows are in SWEEP-APP (L3) and SWEEP-MONEY (L2, N1); L1 is G-POINTS-07-1.
- **History:** none yet. Reports go to tasks/history/POINTS-07.md.

Status set to review by the records sync, 25 Oct 2026: merged as app 2f0657fc, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-07.md](history/POINTS-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
