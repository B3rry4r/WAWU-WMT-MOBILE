---
id: WALLET-09
title: Send money to a bank
owner: YOU
area: WALLET
order: 143
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-07, MONEY-08, WALLET-15]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-09 · Send money to a bank

## Current state

As of 16 Oct 2026, from the lead's log (12 Oct 17:25).
- **Status:** todo. No branch. It waits for the NUV-06 merge.
- **Next:** a builder starts after NUV-06 merges. NUV-06's verifier left notes for it (F1: call `forBeneficiary` or `forPayoutAccount`, not the private `prepare`; N2, N3, N5, N6 from NUV-05); they are in the lead's log, 12 Oct 13:00 and 17:25.
- **History:** none yet. Reports go to tasks/history/WALLET-09.md.

## Lead note (11 Oct 2026): from MONEY-19's verification

- A send this task builds that the wallet cannot cover must answer MONEY-19's `402 insufficient_funds` with `balanceKobo`, `totalKobo` and `shortfallKobo` (G-481); today `walletProviderErrorToHttp('insufficient_funds')` builds a 402 with no figures.

## Lead note (11 Oct 2026): from NUV-06's verification

NUV-06 (the payouts area and the bank outflow handler) is built and checked; these four findings of its verifier are for the routes this task builds. Nothing here is built by NUV-06. Wording: the verifier's N2, N3, N5 and N6.

- **N2, the order of calls.** The error flags speak for the call that failed. After an unknown outcome, a second `bankTransfer` under the same reference that fails before the transfer says `requestNotSent` true and `recordMayExist` false, while the first call's transfer exists. The send route keeps the sequence: call once; on `outcome_unknown`, `not_confirmed` or `duplicate_reference` the send is pending and is found by its reference (`reconcileBankSend` through the seam); a resend only when the FIRST call's error says the request never left (MONEY-18). Never "call again and read the flags".
- **N3, the gates are the route's.** `bankTransfer` sends whatever it is asked (any bank in Nuvion's list, any ten digits, any name). The route is the only gate: it calls `SavedAccountTargetService.prepare` and sends only on `ready`; `name_changed` carries a `target` with the old payee ids and is shown for confirmation, never sent to; `refused`, `unavailable` and `missing` send nothing. It also owns `@RequireFeesSet`, `assertMayMove`, the PIN and the quote (R-10).
- **N5, the bank behind a code.** A saved code that is in Nuvion's list for another bank is matched by code (a row saying Access Bank under `000014` came out `ready` at Zenith, because Nuvion's list has `000014` as Zenith). Only the name check guards it. The route shows the bank's name from Nuvion's list beside the holder's name on the confirm step, and compares the saved bank name with Nuvion's name for that code; a difference is not `ready` (treat it as `name_changed`).
- **N6, write the row first.** The send route writes its pending ledger row (R-10 quote: `feeKobo`, `totalKobo`, and the split in `providerFeeKobo` and `wawuFeeKobo`; `customerReference`) BEFORE it calls `bankTransfer`. A delivery that lands first creates the row at Nuvion's figures, and the route's row then disagrees (the completed row goes back to `pending` with a note). The handler compares Nuvion's stated charge with the row's `providerFeeKobo`, so the route must fill it; if Nuvion charged another figure the row takes Nuvion's and says both in its `discrepancy`.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W8, W10-W14, W17-W19: send to any Nigerian bank account, beside today's Flutterwave withdraw, which the web
keeps until WALLET-30.

## Scope

Bank list and name check, NIP transfer with the quoted fee (WALLET-15), note, PIN, Idempotency-Key. A timed-out
send is checked with Fintava's status endpoint before any retry (MONEY-08); a failed send arrives as
`debit_transfer_reversal` (MONEY-07) and is reversed once.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

**Lead note (4 Oct 2026, from KYC-04):** a money action here that answers `409 pin_not_set` opens A9 (route `open-wallet-pin`, KYC-04) and comes back to this screen once the PIN is set; it never shows the bare error.

## Capability checks

- [ ] The account name is confirmed before the user can send.
- [ ] A failed transfer reverses once.
- [ ] A ₦25,000 bank send shows ₦40 + ₦25 = ₦65 and debits ₦25,065; Fintava's record matches.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
