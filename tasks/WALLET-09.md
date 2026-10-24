---
id: WALLET-09
title: Send money to a bank
owner: YOU
area: WALLET
order: 143
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [MONEY-17, MONEY-07, MONEY-08, WALLET-15]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-09 · Send money to a bank

## Current state

As of 16 Oct 2026, after builder round 2 (Sonnet builder).
- **Status:** live (backend main a5e48fc, PR #141). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-09.md`): verdict merge, nothing medium or worse. Stacked in batch 5 (backend and mobile `wmt/MERGE-5`). Round 2 of the check; round 1's two mediums are closed.
- **Branches:** backend `wmt/WALLET-09` `b113e63` (round 1 `6040fba`) on `origin/wmt/EXPLORE-05` `649187a` (the batch 4 head; main `b32f9c0` is inside); mobile `wmt/WALLET-09` on `origin/wmt/MERGE-4` `74b1edb` (this file, BACKEND_GAPS, SHARED-CHANGES, LOG). wawu-id and the web are not touched.
- **Migration:** `20261023200000_bank_transfers` (five nullable columns on `WalletTransfer`: `bankCode`, `bankName`, `bankAccountNumber`, `bankAccountName`, `sentToBankAt`). Additive; rollback in the file's header.
- **Round 2 (16 Oct, the lead's rulings on the verifier's report):** (1) a bank code or account number that is missing, the wrong type or the wrong shape is the route's own 400 from `BankSendTargetGuard`, before the bank is asked or the PIN looked at (17 forms specced: nothing sent, key given back, no PIN try used); (2) a bank send refused for not enough balance, a frozen wallet or payouts not available is failed at once, its pending ledger row voided, the key given back, and answers `402` with the figures, `423 wallet_frozen` or `503` (two sends, two keys, balance for one: the second ends failed with 402, nothing pending); every other refusal stays pending for the reconcile and is listed as an owner question (G-767); (3) `POST /money/banks/name-check` returns `nameToken` (signed, this person, 15 minutes) and the send to an unsaved account carries it: another holder or bank at send time is `409 account_name_changed`, nothing sent; (4) a failed or reversed send shows no `sent_to_bank` step; (5) `money-contract.spec.ts` asserts `toBe(0)`; (6) G-762 text corrected. Sweep: finding 8 is a row in SWEEP-MONEY (F8). Owner question, no build: G-764.
- **Built (backend):** `GET /money/banks`, `POST /money/banks/name-check` (no wallet needed) and `POST /money/transfers/bank` (also a withdrawal, W17): same send as WALLET-07, one row per key, row and pending ledger row written first, WALLET-23's `assertMayMove` in the claim, the provider called once, unknown outcome pending and found by our reference, a failed send followed to `reversed` by the provider's reversal. `BankSendTargetGuard` decides the account BEFORE the PIN (bank asked again, send to the name it gives, `self_transfer`, the saved-account gate, `409 account_name_changed`). The seam's Nuvion `reconcileSend` now reaches `reconcileBankSend`. `confirmCurrentName` on `POST /money/beneficiaries` is the confirm path (G-652 d). `BankTransferDto` requires `quoteToken`; the declared controller and `daily_limit_exceeded` on this route are gone.
- **Checked here:** 24 new tests pass (a contract spec over HTTP with the Fintava double, a unit spec of the gate with every `SavedAccountTargetService` answer, a Nuvion seam spec, 4); the four route-list specs were updated as their own header says a serving task must (a test edit: `money-contract.spec.ts` no longer demands one declared controller). CI on the push is in the hand-back.
- **NOT RUN:** the capability checks against real Fintava and Nuvion payouts (sandbox payouts answer "Unable to find customers", `docs/fintava/sandbox/README.md`); the Fintava double stands in. Nothing was sent to a real provider.
- **Open findings:** none known after round 2. Open for the owner: G-764 (a per-person limit on the name check) and G-767 (which bank send refusals leave no record; needs a sandbox run). Low, swept: finding 8 (SWEEP-MONEY F8).
- **Next:** a fresh verifier re-runs V1 to V4, V6 to V9 and the verifier's red specs (`v09-attack`, `v09-live`); the lead renames the migration stamp at merge if needed and a mobile session re-syncs `contract/` and `src/api/schema.generated.ts` (SHARED-CHANGES, WALLET-09 #2; it now also carries `nameToken`).
- **History:** `tasks/history/WALLET-09.md` (the lead notes of 11 Oct and the builder reports, rounds 1 and 2).

## Lead note (11 Oct 2026): from MONEY-19's verification

- A send this task builds that the wallet cannot cover must answer MONEY-19's `402 insufficient_funds` with `balanceKobo`, `totalKobo` and `shortfallKobo` (G-481); today `walletProviderErrorToHttp('insufficient_funds')` builds a 402 with no figures.

## Lead note (11 Oct 2026): from NUV-06's verification

NUV-06 (the payouts area and the bank outflow handler) is built and checked; these four findings of its verifier are for the routes this task builds. Nothing here is built by NUV-06. Wording: the verifier's N2, N3, N5 and N6.

- **N2, the order of calls.** The error flags speak for the call that failed. After an unknown outcome, a second `bankTransfer` under the same reference that fails before the transfer says `requestNotSent` true and `recordMayExist` false, while the first call's transfer exists. The send route keeps the sequence: call once; on `outcome_unknown`, `not_confirmed` or `duplicate_reference` the send is pending and is found by its reference (`reconcileBankSend` through the seam); a resend only when the FIRST call's error says the request never left (MONEY-18). Never "call again and read the flags".
- **N3, the gates are the route's.** `bankTransfer` sends whatever it is asked (any bank in Nuvion's list, any ten digits, any name). The route is the only gate: it calls `SavedAccountTargetService.forBeneficiary` (a saved payee) or `forPayoutAccount` (a payout account; `prepare` is private) and sends only on `ready`; `name_changed` carries a `target` with the old payee ids and is shown for confirmation, never sent to; `refused`, `unavailable` and `missing` send nothing. It also owns `@RequireFeesSet`, `assertMayMove`, the PIN and the quote (R-10).
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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-09.md](history/WALLET-09.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
