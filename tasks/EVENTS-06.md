---
id: EVENTS-06
title: Buy a ticket: pay, PIN, ticket, still confirming
owner: DEV3
area: EVENTS
order: 107
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, EVENTS-01, EVENTS-03, EVENTS-07, UI-02]
decisions: [R-6, R-8, R-10, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9, V10]
artboards: [E3, E4, E5, E10]
---
# EVENTS-06 · Buy a ticket: pay, PIN, ticket, still confirming

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E3 E4 E5 E10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md`: its entries for E3, E4 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: a QR renderer (E5), `expo-calendar` (Add to calendar). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E3 · Pay**: Order review sheet over E2: 1 × Regular, Tickets ₦7,500, Fintava's charge ₦15.75, Total ₦7,515.75, funding source 'Pay from wallet · Naira wallet · balance available', button 'Pay ₦7,515.75' (BRIEF E3).
- **E4 · PIN**: PIN keypad over the order sheet: 'Enter your PIN · Approve ₦7,515.75 to WAWU Creators Summit' (BRIEF E4), then 'PIN accepted'.
- **E5 · Ticket**: Success: 'Your ticket · You're in. Show this at the door.' QR, code K7QX-4M2P-9WLA-3RTE, tier + holder name, Add to calendar, My tickets.
- **E10 · Still confirming**: After PIN: 'Paid, still confirming. Don't pay again. Your ticket shows up in a minute.' with Refresh.

## Brief changes (build these, not the canvas)

- **E3**: the breakdown: Tickets ₦7,500, Fintava's charge ₦15.75, Total ₦7,515.75; button "Pay ₦7,515.75". (Why: R-10 and the purchases default (ticket money is held in WAWU's own wallet until the event, R-19).)
- **E4**: "Approve ₦7,515.75 to WAWU Creators Summit". (Why: rule 5.)

## Capability checks

- [ ] **E3**: a user reviews the order, sees ₦7,500 + ₦15.75 = ₦7,515.75 and taps "Pay ₦7,515.75" (E4).
- [ ] **E4**: a user can enter their 4-digit PIN (MONEY-09).
- [ ] **E5**: a user can show QR; Add to calendar; go to My tickets (E6).
- [ ] **E10**: a user can Refresh.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E3, E4, E10.
- [ ] A user gets a ticket to a ₦0 event without a wallet, a pay sheet or a PIN (R-8).
- [ ] From E2's Get tickets (EVENTS-01), a user reaches E3 (this task adds it, as drawn).
- [ ] A user with no wallet who taps Pay lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **E3**: missing. Missing: No buyer wallet debit exists. EventTicketingService.buy() calls flutterwave.initCharge and returns flutterwaveConfig for a hosted/inline Flutterwave checkout; there is no Fintava client anywhere in wawu-backend/src (grep 'fintava' = 0 hits) and the only wallet is CreatorWallet (a Flutterwave payout subaccount, creators only) whose WalletEntryKind is earning|withdrawal|reversal, with no spend/debit kind. Change: buy() must create a pending EventOrder and either (a) return an order to be confirmed with a PIN, then debit the buyer's Fintava wallet, or (b) debit immediately; the flutterwaveConfig response field disappears.
- **E4**: missing. Missing: Needs a wallet PIN: set/change/reset endpoints, hashed storage, attempt counter + lockout, and the ticket debit authorised only after PIN verify. If Fintava issues/validates the PIN, needs that integration instead.
- **E5**: served. Missing: With wallet payment the issue step is no longer behind verifyOrder(transaction_id, tx_ref); tickets are issued on confirmed wallet debit (same issueOrder transaction).
- **E10**: partial. Missing: Today 'still confirming' is a Flutterwave charge awaiting verify/webhook. With wallet payment it becomes a Fintava debit whose status is pending: needs a GET order-status route (none exists; only verify) and a Fintava webhook/requery path replacing the Flutterwave webhook lookup on EventOrder.flutterwaveTxRef.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E3: Fee: No fee (on ticket purchase)
- E3: Naira wallet · ₦485,250.75 available
- E3: Total ₦7,500
- E5: ticket code format K7QX-4M2P-9WLA-3RTE

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
