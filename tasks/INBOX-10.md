---
id: INBOX-10
title: Ask a creator a paid question
owner: YOU
area: INBOX
order: 166
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, INBOX-02, INBOX-17, ME-02, UI-02, ME-11, HOME-07, INBOX-04, PROS-01]
decisions: [R-6, R-10, R-19, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I2, I3, I4, I5]
---
# INBOX-10 · Ask a creator a paid question

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): INBOX-17, ME-02, HOME-07.
- **History:** none yet. Reports go to tasks/history/INBOX-10.md.
- **Copy (16 Oct 2026, R-69, R-53, DESIGN-V2-CUT):** print the app's name as "Who Made This?" with the question mark, and label the provider's part of a fee "Bank charge"; the 16 Oct boards of this task differ from the old ones only by that wording. DV2-COPY re-checks this task last.

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
