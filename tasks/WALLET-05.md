---
id: WALLET-05
title: Add money and withdraw
owner: YOU
area: WALLET
order: 153
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, WALLET-09, WALLET-10, WALLET-14, MONEY-12, UI-02, HOME-12, WALLET-03]
decisions: [R-10, R-1, R-16, R-28, R-33, R-6, R-42, R-53, R-67, R-69]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W15, W17, W19, W45, W46]
---
# WALLET-05 · Add money and withdraw

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder, T2; mobile `wmt/WALLET-05` on `origin/wmt/FIX-55` `d6ceb228` with `origin/wmt/S1` `9d221172` merged; no backend change, no migration, no contract change; status verifying).
- **Built:** W15 Add money (`src/features/addmoney/`, `/add-money`): the wallet's own account name, number and bank from `GET /money/wallet`, each with Copy, "Free", Share details (the phone's share sheet), the clock line, and a note when a pay sheet sent the person (`?short=<kobo>`). W45 (waiting) starts when the person copies or shares; W46 (received) shows the credit's amount, sender, the bank's new balance and the reference once the balance changes with a transfer-in row on the ledger. W17 Withdraw (`src/features/withdraw/`, `/withdraw`): balance, amount with Max, the payout account with Change, Bank charge + WAWU's fee + Fees, "Withdraw ₦total" with "Your bank gets ₦amount", then the PIN sheet. W19 (`/withdraw/receipt`): on its way, timeline from the Hub's stamps, reference, fee parts, Total paid, Share receipt, Done; a withdrawal the bank fails goes to W14 (`/withdraw/failed`, the send's own screen).
- **States:** loading, error, no wallet (leads to Open your wallet), opening, no payout account (leads to A21), account not in the person's name (blocked, R-51), over balance, fees over balance, over today's limit, wrong PIN, short refusal, unanswered, fee moved.
- **Once (V8):** a fresh quote on every tap; one Idempotency-Key per attempt, kept on the phone (`send/intent`) so a wrong PIN, a lost answer and a closed app send the same request; a tap while a request is out does nothing.
- **Entries (R-41):** W1 Add money and Withdraw (five actions), H1 Add, W13 "Add money", and every pay sheet's "Add ₦X" restored (send review, events ticket buy, credits buy, chat send and request pay, feed tip and unlock), each opening W15 with the shortfall. FIX-55's test edits reversed (SHARED-CHANGES WALLET-05 #1, #2).
- **Checks:** tsc EXIT 0; eslint on 34 changed files EXIT 0; jest on wallet, send, pay-sheet, events, credits, chat, home, tips, unlock, communities, points, addmoney, withdraw: 68 suites, 1182 tests pass; `npm run gates` EXIT 0 (0 fail, 11 warn, 875 files). New: `addMoney.test.tsx` (17), `withdrawFlow.test.tsx` (18), `withdrawModel.test.ts` (17).
- **On the stack w05_test** (backend `c78b796`, Nuvion stand-in, ports 7840-7847, down and dropped; each attack once, light and dark): withdraw double tap + wrong PIN then right: one row, one debit of the quoted total; short balance: the field blocks it and the Hub's 402 carries the bank's figures; lost answer then retry: same key, one debit; a withdrawal the stand-in fails: W14, and the balance before and after the withdrawal are equal (amount and fees back); add money: the person's own account number shown, one 5,000,000 inflow raised the balance once and the ledger has one row for it, W46 shown.
- **Pictures:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-05-b/pics/` every state, 390 wide, light and dark, with `board-*` and `side-*` (board left, built right) for W1, W15, W17, W19, W45, W46, W14.
- **Gaps:** G-WALLET-05-1 (contract omits `at` on the timeline), -2 (no arrival time: W17 Arrives and W19's last line not drawn), -3 (the board's "Free" and "arrives in a few minutes" are copy), -4 (a stack inflow names no sender). **Not run:** V10 (phone). **Next:** the verifier.

## Design v2 update (16 Oct 2026)

- W15 is bank transfer only (R-42): the card draws the wallet's own account number, bank name and account name (all from `GET /money/wallet` `account`, bank "Nuvion" as the Hub says) each with Copy, and Share details. "Free" replaces "Free · instant"; the "1.5%" card line, the "instant" line and the FX line are gone. W16 (card) is removed from the canvas and WALLET-36 is cancelled.
- W45 "Add money · waiting" and W46 "Add money · received" are states of this screen and belong to this task (decided in DESIGN-V2-CUT): after the person copies or shares the details the screen shows "Waiting for your transfer, usually a few minutes" and polls `GET /money/wallet/balance`; when the balance rises it shows W46 with the amount, the new balance, the sender line and the reference from the credit (`GET /money/transactions`). WALLET-39 sends the matching notice.
- W17 and W19 fee lines: the provider's part is labelled "Bank charge" (R-53); WAWU's part keeps its own label. The licence line stays hidden (R-67). Bills are off (R-52): the "Add from a bill" entry from S11 is not built.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W15 W17 W19` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for W15, W17, W19 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Artboards

- **W15 · Add money**: Bank transfer only (16 Oct board): the wallet's own account number, bank name and account name, each with Copy, "Free", and Share details. Bank transfer details first (account name, number, the bank name from the API (Loma Bank), share). The other ways (Debit card, USSD, From your Dollar account) are not built at launch (BRIEF W15, R-16).
- **W17 · Withdraw to bank**: Withdraw: available NGN, amount with Max, destination defaulting to the saved payout account with Change, the fee breakdown (₦40 + ₦25), arrival estimate; the button shows the total and a line says what the bank gets (BRIEF W17).
- **W19 · Withdraw · on its way**: Withdrawal receipt with a timeline (Requested, Sent to bank, In your bank account), reference, the fee breakdown and Total paid (BRIEF W19); Share receipt is the phone's share sheet (R-33).

## Launch scope

At launch W15 shows bank transfer only. Debit card is added with its screen by WALLET-36 (after launch, on WALLET-25),
and USSD by WALLET-26; "From your Dollar account" waits for the dollar account (R-16).

W18 ("Withdraw · waiting on KYC") is not built: a wallet only exists after the BVN and selfie checks pass, so it
has no real cause. It is built when Fintava names an account status that blocks withdrawals (R-28,
`DECISIONS.md` "Artboards that are not built").

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Top-up at launch is a bank transfer to the account number (`account_funded`). The canvas prints the bank as "Fintava MFB"; Fintava's own examples say Loma Bank (Iyin Ekiti MFB). Show the bank name the backend gets from Fintava, never the canvas's.

## Brief changes (build these, not the canvas)

- **W15**: Bank shows the bank name slot (sample "Loma Bank", long name must fit). The card row's fee reads as a breakdown hint, for example "Card provider's charge + 1.5%". Keep the Dollar option drawn; the app hides it at launch. (Why: R-1 for the bank. R-10 for the card: WAWU's 1.5% is added to the card provider's own charge (Fintava doesn't take cards, so it is another provider; card top-up comes after launch). R-16 for the Dollar option.)
- **W17**: the fee breakdown: ₦40 + ₦25 = ₦65 (on ₦50,000, so ₦50,065.00 leaves the wallet). The button shows the total, "Withdraw ₦50,065", with a line "Your bank gets ₦50,000". (Why: R-10, Fintava's price list (a withdrawal is a bank send); rule 5.)
- **W19**: the fee breakdown: ₦40 + ₦25 = ₦65, and a "Total paid ₦50,065.00" row. The heading "₦50,000 on its way" stays. (Why: R-10 and rule 5.)

## Capability checks

- [ ] **From W1:** a user on the Wallet tab taps Add money and lands on its first screen (this task replaces `unbuilt('WALLET-05')` in `src/features/wallet/home/`; COMPLETE-05).
- [ ] **W15**: a user can copy and share the account details.
- [ ] **W17**: a user can enter an amount; Max; Change destination; see ₦40 + ₦25 = ₦65 and "Withdraw ₦50,065" with "Your bank gets ₦50,000" for ₦50,000; Withdraw (then PIN W11).
- [ ] **W19**: a user can Share receipt through the phone's share sheet; Done.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From H17 (HOME-12) and W13 (WALLET-03), a user can tap Add and reach W15 with the shortfall filled in (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **W15**: partial. Missing: Account details exist (Flutterwave MFB). Missing: card funding, USSD funding, USD-to-NGN funding, inbound deposit recording.
- **W17**: partial. Missing: Withdraw exists (Flutterwave, KYC-gated, min ₦1,000, whole naira). Missing: default payout account lookup (bank stored as name), fee, PIN, arrival estimate.
- **W19**: partial. Missing: Only pending/completed/failed and settledAt; no intermediate 'sent to bank' timestamp, no fee.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W15: Bank transfer Free · instant
- W15: 'It lands in seconds'
- W15: Debit card Instant · 1.5% fee
- W15: $1 = ₦1,580.00
- W15: Bank Fintava MFB
- W17: Fee ₦25.00
- W17: Arrives In a few minutes
- W19: Fee ₦25.00
- W19: 'Usually within minutes'
- W19: Reference WAW-W9L2-33RT

## Designer notes (⚠, unresolved)

- W15: “⚠ From your Dollar account $1 = ₦1,580.00”

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-05.md](history/WALLET-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
