---
id: WALLET-03
title: Send to a bank, not enough money, failed send
owner: YOU
area: WALLET
order: 147
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [WALLET-02, WALLET-09, WALLET-14, MONEY-19]
decisions: [R-10, R-6, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W8, W13, W14]
---
# WALLET-03 · Send to a bank, not enough money, failed send

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder; mobile `wmt/WA` from `origin/wmt/MERGE-8` `cc436a53`; the backend (WALLET-09, MONEY-19) is served on MERGE-8, so no backend change, no migration). Status: verifying.
- **Built (`src/features/send/`, routes `src/app/send/{bank,failed}.tsx`):** W7 draws the Bank account tab beside Who Made This? user; W8 (`BankRecipientScreen`): the bank (`GET /money/banks`, the A21 sheet), ten digits, the BANK's name for them (`POST /money/banks/name-check`, with its `nameToken`) before Continue opens, a refused account or a wait for the hour's checks in the Hub's words, Try again when the bank did not answer, then "Saved": My payout account (tagged withdraw) and each saved bank account (a tap goes straight to W9, no name check). W9 is W13: an amount over the bank's balance is drawn in danger with "Over your balance of ₦485,250.75" and Continue stays off; the board's Add money is WALLET-05's (R-47).
- **W10 and W11 for a bank:** `ReviewScreen` takes the bank as a payee: the fee quote is `kind=bank_transfer`, the parts are "Bank charge" and "WAWU's fee" with Fees and Total, the button is the total ("Send ₦25,065"), "They get ₦25,000", the bank and number as rows. One request on one `Idempotency-Key`, kept on the phone with its `nameToken` (`intent.ts`): a wrong PIN, a lost answer and a second tap send the same request. A saved account sends no name token.
- **W12:** the receipt names the account, prints "Bank charge", and "Save as a beneficiary" saves the BANK account (the Hub keeps the bank's name). **W14 (`FailedScreen`):** a transfer the Hub accepted and the bank did not take. "Reversed to your wallet", "Returned to your wallet" (the Hub's `returnedKobo`), "Charge kept" (its `keptKobo`), the reference, the date, "Your money is back / ₦25,025 is back in your Naira wallet.". No reversal on record yet: the Failed pill, no word about the money, read again every 4 seconds. Try again starts from W8 with the bank, the number and the amount (a new name check, quote and key).
- **Tests changed:** `sendFlow.test.tsx` one assertion (the tab is now drawn; SHARED-CHANGES WALLET-03 #1). New `bankSendFlow.test.tsx` (18 cases).
- **Gaps:** G-880. **Not drawn:** W13's Add money (WALLET-05).
- **Next:** the verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W8 W13 W14` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for W14 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Artboards

- **W8 · Send · to a bank account**: Bank + account number entry; account name resolves from the bank before Continue unlocks; saved beneficiaries incl. 'My payout account' (withdraw).
- **W13 · Send · insufficient balance**: Amount over balance: inline error, Continue disabled, Add money one tap away.
- **W14 · Send · failed**: Transfer the receiving bank did not confirm in time; shows automatic reversal to wallet, amount incl. fee, reference, Done / Try again.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /bank/credit` (sourceId is the customerId) after `GET /name/enquiry`; bank codes from `GET /banks`. The user pays Fintava's bank-send fee plus WAWU's ₦25 (R-10); WALLET-15 gives the total.

## Brief changes (build these, not the canvas)

- **W14**: the Amount row is "Returned to your wallet" with a slot the app fills (sample ₦25,000.00); if a charge was kept, a second row shows it. Replace the note's heading "Nothing was taken" with a plain one such as "Your money is back", and the line with "₦25,000 is back in your Naira wallet." No "full", no "nothing was taken". (Why: rule 6. The total now includes Fintava's charge (R-10), and whether Fintava returns its charge on a reversal is not confirmed.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W13: Add money (opens W15): added by WALLET-05

## Capability checks

- [ ] **W8**: a user can pick a bank; type a 10-digit account; Continue after the name resolves; pick a saved beneficiary or My payout account.
- [ ] **W13**: a user sees the shortfall including the fee (BRIEF rule 5) and Continue stays disabled.
- [ ] **W14**: a user sees "Returned to your wallet" with the amount that came back (no "Nothing was taken", BRIEF W14); Done; Try again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W13, W14.
- [ ] From W7 (WALLET-02), a user can switch to the Bank account tab and reach W8 (this task adds the tab, as W7 draws it).
- [ ] A user sending ₦25,000 to a bank sees ₦40 + ₦25 = ₦65 and "Send ₦25,065", with "They get ₦25,000" (BRIEF W10).

## What the backend serves today (from the analysis)

- **W8**: partial. Missing: Bank list and name enquiry exist on Flutterwave. Missing: beneficiaries store, and KYC stores payoutBankName as free text, not a bank code, so 'My payout account' cannot be sent to without mapping.
- **W13**: partial. Missing: Server-side check exists for withdraw only.
- **W14**: partial. Missing: Failure settlement exists for withdrawals, but nothing records a reversal credit or fee refund, and no per-transaction read endpoint exists for the client to poll.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W8: Guaranty Trust Bank 0123456789 -> Chidinma Adaeze Okoro (sample)
- W8: Kuda MFB · 2011458890 (sample)
- W14: 'the money is reversed automatically' (provider behaviour claim)
- W14: Amount ₦25,010.00
- W14: Reference WAW-8F2K-91QX

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-03.md](history/WALLET-03.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
