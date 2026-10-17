---
id: INBOX-20
title: Request money and pay a request
owner: YOU
area: INBOX
order: 145
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, INBOX-04, INBOX-15, INBOX-19, UI-02]
decisions: [R-13, R-10, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I16, I17, I18, I19, I20]
---
# INBOX-20 · Request money and pay a request

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Verified by an independent verifier (verdict merge); stacked in batch 10 by MERGE-10 inside FIX-55 (S2 `6957df6b`). Built by a Sonnet builder in the S2 bundle: mobile `wmt/S2` from `origin/wmt/MERGE-8` `cc436a53`, `origin/wmt/INBOX-15` merged in (backend `wmt/INBOX-15` `c803256`). No backend change, no migration.
- **Built:** I16 (amount, what it is for, "Nothing moves until they tap Pay", "Request ₦12,000"), I17 ("You requested", "Waiting for Femi"), I18 (Decline and "Pay ₦12,000" in the bubble; the review before the PIN: Amount, Bank charge, WAWU's fee, Fees, Total, "Femi gets ₦12,000", "Pay ₦12,025.75"; then the PIN), I19 (Paid, flipped live by `money_request.updated`), I20 (the Money chip: requests only, G-INBOX-15-1, each opening its chat). In All a request is the chat's last words, not a second row.
- **States drawn that no board draws (the Hub has them):** Declined, Cancelled and "Payment on its way" pills on the bubble. No Cancel button (the board draws none; the asker's cancel is the Hub's only).
- **Attacks in tests:** a double tap on Pay (one quote, one sheet, one payment), a wrong PIN, a short wallet (the shared pay sheet), a lost answer then the same request (same key and body, one debit), a request paid by someone else at the same moment (says so, nothing charged), a request cancelled while being paid (Cancelled, nothing moved), a payment the provider has not confirmed (read, never paid again), a failed payment (the request stays open), the request flipping live.
- **Attacks on the stack, once each:** a request asked twice with one `clientRequestId` made one; a pay for more than B holds 402; a wrong PIN 403; a request paid twice in parallel with two keys 201 and 409 `money_request_being_paid`, B debited once and A credited once; the same pay key twice 201 and 201, one debit; a request cancelled while being paid: pay 409 `money_request_not_pending`, cancel 200, final cancelled, nothing debited. In the browser: B saw I18, the review, paid with the PIN and the bubble read Paid; a request beyond B's wallet showed Not enough; a declined and a cancelled request showed their pills.
- **Stack (backend `wmt/INBOX-15` `c803256` on the Nuvion stand-in, name `s2_test`, ports 7760 to 7767, taken down after):** the web export of `wmt/S2` ran against the real Hub with two funded wallets; pictures in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-b/pics/` (`beside-<board>-<light|dark>.png`, board left, built right); the attacks below were run once each, results in `.../s2-b/logs/live-attacks.txt`.
- **Open:** G-INBOX-15-1 (the Money chip holds requests only), G-883 (WAWU's fee not collected on the stack, same for a paid request). Build order was INBOX-13, INBOX-19, INBOX-20; the pay review is a bottom sheet, as the brief allows ("in the bubble, or a short review sheet").
- **Round 2 (17 Oct, builder, F2 and F3 lows):** the pay-a-request short sheet is headed "Pay Femi", as its review is (was "Request from Femi"); a test pins it. I16 puts the cursor in the amount field a moment after the sheet opens (`autoFocus` alone did not on the web). The empty tile before that title is the shared pay sheet's header: SHARED-CHANGES INBOX-13 #3 (open). The board's larger amount type (22) is not done: `TextField` has no size.
- **Next:** the batch 10 pull request. Passes the task needs: V1, V4, V5, V6, V7, V8, V9. NOT RUN: V10.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py I16 I17 I18 I19 I20` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I18 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I16 · Request sheet**: Request from Femi sheet: amount ₦12,000, what it's for, "Nothing moves until they tap Pay", Request ₦12,000.
- **I17 · Request sent**: Chat bubble "You requested ₦12,000 · Logo edits, round 2 · Waiting for Femi".
- **I18 · Request from someone**: Incoming request bubble from Kemi with Decline and, before the PIN, the breakdown (₦15.75 + ₦10 = ₦25.75), "Pay ₦12,025.75" and "Kemi gets ₦12,000" (BRIEF I18), then PIN W11.
- **I19 · Request paid**: The request bubble flips to Paid and the conversation continues.
- **I20 · Money filter**: Inbox filtered to money moments only: tips/transfers in, requests, sends, refunds (e.g. "Refunded ₦200 · no reply"). Moved here from INBOX-04: its rows have a real cause only once requests and sends exist.

## Brief changes (build these, not the canvas)

- **I18**: paying a request is a send to a WAWU user, so show the breakdown before the PIN (in the bubble, or a short review sheet): Fintava's charge ₦15.75 + WAWU's fee ₦10 = ₦25.75, Total ₦12,025.75, "Kemi gets ₦12,000"; button "Pay ₦12,025.75". (Why: R-10 and rule 5, as I14.)

## Capability checks

- [ ] **I16**: a user can enter amount and reason; Request.
- [ ] **I18**: a user can Decline; see ₦15.75 + ₦10 = ₦25.75 and "Pay ₦12,025.75" with "Kemi gets ₦12,000"; enter their PIN.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] **I20**: a user can tap the Money chip and see only money moments (tips and sends in, requests, sends, refunds), each opening its chat.
- [ ] From I13 (INBOX-19) a user can tap Request money and reach I16, and from I1 (INBOX-04) a money-request row and the Money chip (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **I16**: missing. Missing: Needs MoneyRequest(id, conversationId, requesterWawuId, payerWawuId, amount, memo, status pending|paid|declined|cancelled, paidLedgerRef) and POST create.
- **I17**: missing. Missing: Request bubble and status updates need the MoneyRequest model and live delivery.
- **I18**: missing. Missing: Needs POST pay (wallet debit/transfer + status paid, idempotent) and POST decline, plus notification to requester.
- **I19**: missing. Missing: As I18.
- **I20**: partial. Missing: Tips and DM refunds exist as data but there is no aggregation by counterpart; P2P transfers and requests do not exist. Tips are not linked to any chat (the entry map calls a tip "shown as a bubble" in chat).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I16: ₦12,000
- I16: Logo edits, round 2
- I17: ₦12,000
- I18: ₦12,000
- I20: Sent you ₦5,000
- I20: Requested ₦12,000
- I20: You sent ₦25,000
- I20: Refunded ₦200

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-20.md](history/INBOX-20.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
