---
id: POINTS-05
title: Your points, and convert them to cash
owner: YOU
area: POINTS
order: 275
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [POINTS-04, POINTS-01, DV2-COMP, WALLET-01]
decisions: [R-43, R-65, R-16]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [PT5, PT5a, PT6, PT6a, PT6b]
---
# POINTS-05 · Your points, and convert them to cash

## Current state

As of 17 Oct 2026, builder rounds 1 and 2 done (Sonnet builder; mobile `wmt/POINTS-05` from `origin/wmt/MERGE-7` `04e49020`; no backend or wawu-id change, no migration). Round 1 passed the verifier (verdict merge) with one required change, which round 2 made: PT5a no longer draws its "Buy a pack" clause. Status: verifying.
- **Branch:** mobile `wmt/POINTS-05`. Hashes are in the Builder report (`tasks/history/POINTS-05.md`).
- **Built (`src/features/points/`, routes `src/app/points.tsx` and `src/app/points-convert.tsx`):**
  - PT5 and PT5a (`PointsScreen`): `GET /me/points`. The balance (`PointsFigure` with `fit`, the one place it is passed), a row for each live lot with the day it ends (the lots that end at the Hub's `nextExpiry` in the warning tone; the year only when it is not this one, Lagos time), "The soonest-ending points are spent first.", and the last movements in the Hub's own labels with the day and a signed count. Nothing yet is the designed empty view; a failed read is the error view with Try again.
  - PT6, PT6a, PT6b (`ConvertScreen`): the field starts as the whole balance (the Hub quotes the whole balance when none is asked), typing asks the Hub again after a pause (400 ms). Rate, cash, minimum and the reason a figure cannot convert come from the quote; PT6a is the Hub's `blockedBy` written with the quote's figures. Convert is off unless the quote for exactly those points says `canConvert`. A person billed in dollars (`409 currency_not_supported`) gets the Hub's plain words and no field or button (G-741); no wallet is "Open your wallet".
  - Once, fresh quote per attempt (V8): tapping Convert asks for a new quote of those points; a closed quote or moved figures put the new figures on screen and stop; the same figures open the PIN sheet and the request carries that quote's token. One `Idempotency-Key` per attempt; a wrong PIN, a request with no answer and a second submit send the SAME request (`submitPin` shares one in-flight request). The request is kept on the phone (`intent.ts`, secure store) before it leaves and dropped on the Hub's final answer: after the app is closed the next visit sends the same request again, or reads a `pending` conversion by its id. `409 quote_changed` is a new attempt with the quote in `reason.pointsQuote` and the Hub's sentence. `pending` shows the Hub's words and is read every 4 s; `failed` shows the Hub's `failureReason`.
  - Wallet: the "To cash" button on W1's actions row is NOT added. `src/features/wallet/__tests__/WalletScreen.test.tsx` (not mine) asserts W1's exact buttons and six cases fail the moment a "To cash" button is drawn (SHARED-CHANGES POINTS-05 #2 has the two-line change, written and tested, and the six cases to update). PT6 opens from PT5's round button and PT5 from `/points`; neither has a way in from Wallet until the lead rules on #2 and DV2-02 draws the Points card.
- **Not drawn (R-47), each a BACKEND_GAPS row:** the line "Spent on AI tools, points go further than cash." (G-836: the Hub serves no figure behind it); the per-row detail and kind marks on PT5's movements (G-835); more than 50 lots (G-837). PT5a's "Buy a pack, or" clause (round 2): the empty view says "Get them with a tier or by inviting people." until POINTS-06 builds buying and puts the clause back. The Buy points and Buy buttons are POINTS-06's. "Example values" is a designer note.
- **Shared:** SHARED-CHANGES POINTS-05 #1: `ScreenFrame` has no right button and no foot, so `PointsFrame` (a local frame, as `ProFrame`) draws them until it does.
- **Compared picture with picture** (390 px, light and dark, from a web export beside `render_design.py` PT5 PT5a PT6 PT6a PT6b; the app's pictures are in the builder's scratch folder `points-05-b/pics`, not committed): see the Builder report for the differences. The pictures come from a local stand-in for the points routes, not a Hub: V9 (live seam) is NOT RUN (the lead's rule is a Nuvion-mode stack and `scripts/dev/stack.sh` at 0be61a4 has none; it would start the Fintava adapter).
- **Open:** none known.
- **Next:** the verifier. DV2-02 adds the Points card on W1 (opens `/points`).
- **History:** reports go to tasks/history/POINTS-05.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65, R-16 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person sees their points, when each lot ends, and the last movements (PT5), and converts points to wallet cash at the Hub's rate with the PIN (PT6).

## Scope

- New files under `src/features/points/`. PT5, PT5a: `GET /me/points` (`balance`, `lots` with expiry, `nextExpiry`, `movements`; nothing yet is PT5a). PT6, PT6a, PT6b: `GET /points/convert/quote` (rate, minimum, cash, `canConvert`, `blockedBy`), `POST /points/convert` (PIN, Idempotency-Key), `GET /points/convert/{id}` for the pending state (G-740 to G-745 apply). A person billed in dollars is told in plain words why they cannot convert (G-741).
- The rate and every figure are read from the Hub (R-65: 1,000 points = ₦500 at launch). Points are a count, never naira (R-5); the line "spending on AI is worth more" is printed only if the Hub serves the numbers behind it.
- This task adds the taps as drawn: the Points card on Wallet (W1) opens PT5 and "To cash" opens PT6 (DV2-02 draws the card).

## Capability checks

- [ ] A person sees their balance and lots with end dates, and the last movements.
- [ ] A person converts 1,000 points: the quote shows ₦500 before they confirm, they enter the PIN, and the wallet rises once.
- [ ] Below the minimum, PT6a shows the Hub's reason and Convert is off.
- [ ] The same confirm sent twice converts once (V8).
- [ ] Each board above (PT5, PT5a, PT6, PT6a, PT6b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-05.md](history/POINTS-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
