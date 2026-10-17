# WALLET-05 · round history

Moved out of [tasks/WALLET-05.md](../WALLET-05.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

Round 1, Sonnet builder, 17 Oct 2026. Mobile only; the backend at `wmt/FIX-54` `c78b796` served everything (bank send for the withdrawal, `GET /money/wallet` account, balance, ledger, `GET /money/payout-account`).
- **Files:** new `src/features/addmoney/` (model, api, useLanding, AddMoneyScreen, entry, tests), `src/features/withdraw/` (model, api, WithdrawScreen, WithdrawReceiptScreen, tests), routes `src/app/add-money.tsx` and `src/app/withdraw/{index,receipt,failed}.tsx`. Edited: `WalletActions`, `WalletScreen`, `MoneyCard`, `TodayScreen`, `AmountScreen` (W13 Add money), the routes `chat/[id]`, `chat/send`, `events/[id]`, `send/review`, `send/amount`, `(tabs)/index`, `BuyCreditsEntry` (Add restored), and the prop comments FIX-55 wrote.
- **Capability checks:** W1 tap Add money lands on W15 (WalletScreen test); copy and share (addMoney.test); W17 amount, Max, Change, ₦40 + ₦25 = ₦65 shape and "Withdraw ₦50,065" / "Your bank gets ₦50,000" (withdrawFlow.test, the Hub's fee numbers; the stack's own are 25 + 25), then PIN; W19 share receipt and Done; H17, W13 and W10 Add reach W15 with the shortfall (bankSendFlow, HomeScreen, restored pay-sheet tests).
- **Design:** the board's "Arrives" row (W17) and "Usually within minutes" (W19) are not drawn (G-WALLET-05-2); the three words of the board and the task's own W45 text are drawn as written (G-WALLET-05-3). The fee card shows Bank charge, WAWU's fee and Fees as the pay sheet does.
- **Bug found on the stack and fixed:** the bank's balance moves before the Hub writes the ledger row (its webhook tick), so W46 first never showed. A balance change with no transfer-in row is remembered and the ledger asked again for three minutes (`useLanding`), with a test.
- **Tests changed:** see SHARED-CHANGES WALLET-05 #1 and #2 (FIX-55's edits reversed; "not drawn until WALLET-05" cases now expect the entry). Gates before: 0 fail, 11 warn on `d6ceb228`; after: 0 fail, 11 warn.
- **Not done:** V10 on a phone; W18 (R-28); W16 card and USSD (later tasks). Pictures and stack results are under Current state.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 and WALLET-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

