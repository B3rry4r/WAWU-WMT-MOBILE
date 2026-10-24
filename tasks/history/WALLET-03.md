# WALLET-03 · round history

Moved out of [tasks/WALLET-03.md](../WALLET-03.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** new `BankRecipientScreen.tsx`, `FailedScreen.tsx`, `src/app/send/{bank,failed}.tsx`, `__tests__/bankSendFlow.test.tsx`; changed `api.ts` (`sendToBankAccount`, `saveBankBeneficiary`, quote kind), `model.ts` (bank payee, "Bank charge", W14's words), `intent.ts` (`nameToken`), `parts.tsx` (`Reference` moved here from the receipt), `AmountScreen`, `ReviewScreen`, `ReceiptScreen`, `RecipientScreen`, the amount, review and index routes.
- **Checks:** send suite 87 tests pass (18 new, flow on the real router with a stand-in Hub); typecheck and eslint clean as for DV2-02. Attacks as tests: double tap (one send), wrong PIN then right (same key, one payment), short balance (W9 off; W10 "Not enough" before the PIN), a lost answer then a retry (same key and body, one payment), a quote that changed (new total shown, nothing sent, new key), a holder that changed (`account_name_changed` shown, nothing sent), a failed send with and without a reversal shown as recorded. The stack run is in the lead's hand-back.
- **Capability checks:** W7 to W8 by the tab; a bank, ten digits, the bank's name before Continue; a saved account and My payout account; the shortfall with Continue off; ₦40 + ₦25 = ₦65 and "Send ₦25,065" with "They get ₦25,000"; W14's "Returned to your wallet" with the amount that came back.
- **Differs for a recorded reason:** the shortfall including the fee is W10's "Not enough" (the fee quote is asked there); W9's line compares the amount with the balance, as W13 draws it. W14's "Try again" always goes through W8 (a name token is needed for an account that is not saved).
- **NOT RUN:** a real Nuvion or Fintava bank payout (the stack's stand-in answers; sandbox payouts do not work, `docs/fintava/sandbox/README.md`).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

