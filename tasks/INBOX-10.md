---
id: INBOX-10
title: Ask a creator a paid question
owner: YOU
area: INBOX
order: 166
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, INBOX-02, INBOX-17, ME-02, UI-02, ME-11, HOME-07, INBOX-04, PROS-01]
decisions: [R-6, R-10, R-19, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I2, I3, I4, I5]
---
# INBOX-10 · Ask a creator a paid question

## Current state

As of 18 Oct 2026, merging (lead): round 2 verified (MERGE) and stacked in batch 17.
- **Status:** merging (lead). The verifier's round 1 said NOT merge (F1 and F2, both medium; report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S3.md`); round 2 said MERGE for INBOX-10 and INBOX-11, F1 to F5 closed, two lows (N1, N2; report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S3-r2.md`). Mobile `wmt/S3` `9b2f4446`, backend `wmt/S3` `2ae42ab`. Stacked in batch 17 by MERGE-17 (backend `wmt/MERGE-17`, mobile `wmt/MERGE-17`); not on main.
- **Merge (MERGE-17):** S3 was built without INBOX-18 in its base, so `src/features/inbox/rows.tsx` combines the two paid renderers as SHARED-CHANGES INBOX-10 #2 says: the `paid_dm` entry draws `PaidInboxRow` (a creator's side, INBOX-18) or `PaidFanRow` (a fan's side, this task) by `item.paidDm.side`, and `draws` accepts either side. Both sides are drawn, no behaviour lost; `unread.test.tsx` changed one comment only. The route `paid-thread/[wawuId]` is listed in the signed-in group of `src/app/_layout.tsx` (FIX-63's `route-guard.test.tsx`). The backend part (`usualReplyMinutes`, the hold view's `transferKobo`) is in `wmt/MERGE-17` with no conflict and no migration. The merged contract requires `creatorEarning` (INBOX-18) on every `PaidDmQuestion`, which S3's `model.test.ts` fixture does not carry, so `ThreadQuestion` in `src/features/paid-ask/api.ts` makes that one field optional (a type only, the fan's screens never read it; no test changed). The verifier's lows are SWEEP-INBOX rows INBOX-10 N1, N2 and F6.
- **Copy (16 Oct 2026, R-69, R-53, DESIGN-V2-CUT):** print the app's name as "Who Made This?" with the question mark, and label the provider's part of a fee "Bank charge"; the 16 Oct boards of this task differ from the old ones only by that wording. DV2-COPY re-checks this task last.
- **Branches (round 1):** mobile `wmt/S3` on `origin/wmt/ME-02` `0bf05b8c` with `origin/wmt/MERGE-13` `4c7b2acd` merged (conflicts kept every side: BACKEND_GAPS, SHARED-CHANGES, PROGRESS, SOURCE_COMMIT, the Home props of ME-02 with MERGE-13's pay handlers). Backend `wmt/S3` on `origin/wmt/MERGE-13` `6bc7b20` with `origin/wmt/ME-02` `e8e8a1d` merged (conflicts in `user-profile.controller.ts` and `.module.ts`: kept both). **INBOX-18 is not in this base** (its branch is on MERGE-12): the creator answered in the stack run through the Hub's reply route; its `rows.tsx` change is the same `draws` filter (SHARED-CHANGES INBOX-10 #2 says how to combine the two paid renderers).
- **Built:** `src/features/paid-ask/`, `/paid-thread/<creator>`. I2: Message with its price beside Follow on the profile (M5), drawn when the Hub says paid messages are on and the route can open the thread. I3: the ask sheet (words, window, what comes back, who holds it, the breakdown, Pay from wallet, "Send · total") then the PIN. I4, I5, I7: the fan's thread with the Hub's state under each question (countdown and where the money is; the creator's bubbles and "Replied in"; the refund with the amount and time from the wallet's hold). The composer is locked while one waits, then "Ask a follow-up" or "Try again" (the old words come back). The Inbox row for a fan's paid question (I1). One draft per rested words, a fresh quote per tap of Send, one Idempotency-Key per attempt kept until the Hub decides.
- **Backend (additive, no migration):** `PaidQuestionDraftView.usualReplyMinutes` (I3's "Usually replies in", G-146 closed for the wallet path). Spec case added to `paid-dm-wallet.contract.spec.ts` (13 pass). No route was missing.
- **Truth over the brief's words:** the refund line says the quote's total ("your ₦1,523.25 comes back"), not the price: the Hub returns the charge too since B3a round 2 (G-INBOX-10-4). "so they've been paid" for "he's" (G-INBOX-10-3). "Bank charge" for "Fintava's charge" (R-53).
- **Not drawn, by R-47:** the "+" in the I5 and I7 composers and the "..." in the thread header (nothing built behind them); the Ask a question button on P2 (`professionals/ProfileScreen`), Message on H10's card and on M35: those routes do not pass the ask sheet yet, so INBOX-10's capability check for them is NOT DONE (one prop and one route line each, the hook `useAsk` and `AskSheets` are ready).
- **Gaps and shared changes:** `BACKEND_GAPS.md` G-INBOX-10-1 to 5 (G-146, G-ME-02-1 noted); `SHARED-CHANGES.md` INBOX-10 #1 to #4.

Round 2, built after the check (18 Oct 2026, Sonnet builder, T2). Mobile `wmt/S3` from `674a9eff`, backend `wmt/S3` from `0723005`.
- **F1 (medium) fixed:** I7 printed ₦1,500 when ₦1,523.25 came back. Root cause: `WalletHoldService.settle()` stores the held PRICE in `WalletHold.refundedKobo` (a database CHECK pins it to `amountKobo`) and `HoldView.refundedKobo` served that column, though the refund moved price + the payment's charge (`transferKobo`). The hold view is not in the protected registry and the dashboard does not read it, so it is corrected in place: `refundedKobo` now serves what the refund moved (`transferKobo`, the figure the provider's record matched), no migration. The app prints the Hub's figure and adds nothing up. Round 1's stack charged ₦0, which hid it.
- **F2 (medium) fixed:** the ask sheet asks its quote again, once, when the screen is in front again after Add money (`useAsk(..., focused)`; the profile route and the thread pass `useIsFocused()`), and when the wallet balance read moves while the sheet says short. Same draft, words kept.
- **F3, F4, F5 (low) fixed:** "its own 24-hour window"; the I4 held and late lines say "your money" with no figure (the thread cannot know the total); an empty thread offers "Ask a question · ₦1,500" (lead default: the board draws no empty thread).
- **Live (stack `s3r2_test`, 7890 to 7897, bank charge 2,325 kobo, taken down):** fan asked, paid ₦1,523.25, window passed: refunded 152,325 (stored column 150,000, transfer 152,325), I7 "you got ₦1,523.25 back"; a ₦900 wallet saw I6, Add ₦623.25, a ₦1,200 deposit, back: one fresh quote, "₦2,100.00 available", Send, paid, debit 152,325. Hub = ledger = stand-in after each step, WAWU's account too. Pictures: scratchpad `s3r2-b/e2e/pics/` (I4, I6-after-return, I7, empty-thread, light and dark).
- **Checks:** mobile tsc 0, eslint 0, jest paid-ask, visitor, inbox, chat pass (F2 tests fail on `674a9eff`, pass now), gates 0 fail. Backend tsc 0, eslint 0, `paid-dm-wallet.contract.spec.ts` (new case fails on the old view), `wallet-hold-nuvion.contract.spec.ts`, `hold-rules.spec.ts` pass; `contract:build` no change.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I2 I3 I4 I5` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I3 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I2 · Profile · Message**: Creator profile header with Follow and "Message · ₦1,500"; the price sits on the button. I2 is ME-02's profile (M5) with the Message button added here, never a second profile.
- **I3 · Write the question**: Ask sheet: question text, "Usually replies in about 3 hours", reply window, the refund line "No reply in time, your ₦1,500 comes back" (no "in full"), "Held by WAWU until Chidi answers", the breakdown (₦1,500 + Fintava's ₦23.25 = ₦1,523.25), Pay from wallet with the Naira wallet balance, "Send · ₦1,523.25" then PIN (BRIEF I3).
- **I4 · Waiting for a reply**: Fan thread with the paid question, countdown "17h 52m left to reply", held-by-WAWU note, and the composer locked "You can send once Chidi replies".
- **I5 · Replied**: Thread after the creator answered with two message bubbles, "Replied in 2h 14m", "Chidi answered, so he's been paid", and Ask a follow-up · ₦1,500 (a new paid message with its own window).

## Brief changes (build these, not the canvas)

- **I3**: add the breakdown: Fintava's charge ₦23.25, Total ₦1,523.25; button "Send · ₦1,523.25". The refund line names the amount that comes back without "in full": "No reply in time, your ₦1,500 comes back." (Why: R-10 and the purchases default; rule 6 for the refund.)

## Capability checks

- [ ] **I2**: from M5 (ME-02), P2 (PROS-01), H10 (HOME-07) and M35 (ME-11), a user can tap "Message · ₦price" or "Ask a question · ₦price" and reach I3 (this task adds those buttons, as drawn).
- [ ] **I3**: a user can type a question; see ₦1,500 + ₦23.25 = ₦1,523.25; tap "Send · ₦1,523.25"; enter their PIN (W11).
- [ ] **I4**: a user can wait; view countdown.
- [ ] **I5**: a user can read reply; Ask a follow-up · ₦1,500.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From I1 (INBOX-04), a fan can tap a paid DM row and reach I4 (this task adds the row, as drawn).
- [ ] A user with no wallet who taps Send lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **I2**: served.
- **I3**: partial. Missing: Send exists but is a Flutterwave inline-checkout charge, not a wallet debit; no payer wallet for non-creators (WalletService.getWallet rejects accountType != creator); no transaction PIN anywhere; no "usually replies in" metric (median respondedAt - sentAt is computable from DirectMessage but no endpoint returns it).
- **I4**: partial. Missing: Backend does NOT stop a fan from opening a second paid DM while one is awaiting_response (sendInit checks only block list, dmEnabled, dmPrice). No pair-level thread: each DirectMessage is its own "thread" (id == threadId), so the history view shown here needs grouping by (senderWawuId, creatorWawuId). Countdown is client-side from deadlineAt; live update on reply needs real-time or polling.
- **I5**: partial. Missing: DirectMessage holds ONE responseText string, so the two creator bubbles shown are not representable (needs a reply-message child table or multi-part reply). No notification to the fan on reply (only dm_received to creator, dm_deadline, dm_refunded exist). Follow-up as a new paid DM works via the existing send flow but is not linked to the prior message.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I2: Message · ₦1,500
- I2: Chidi Eze 41K followers
- I3: ₦1,500 per message
- I3: 24 hours to reply
- I3: Usually replies in about 3 hours
- I3: Naira wallet · ₦485,250.75 available
- I3: Held by WAWU until Chidi answers
- I3: No reply in time, your ₦1,500 comes back in full
- I4: 17h 52m left
- I4: ₦1,500 paid
- I4: No reply by tomorrow 09:51 and it comes back to your wallet
- I5: Replied in 2h 14m
- I5: ₦450K a month (seeded copy)
- I5: Ask a follow-up for ₦1,500
- I5: Each paid message gets its own 24-hour window

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-10.md](history/INBOX-10.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
