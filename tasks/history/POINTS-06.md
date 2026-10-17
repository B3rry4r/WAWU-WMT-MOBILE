# POINTS-06 · round history

Moved out of [tasks/POINTS-06.md](../POINTS-06.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** new `buyApi.ts`, `buyIntent.ts`, `buyModel.ts`, `BuyScreen.tsx`, `src/app/points-buy.tsx`, `__tests__/buyFlow.test.tsx`; changed `parts.tsx` (BalanceCard takes `buy`), `PointsScreen`, `ConvertScreen`, `model.ts` (PT5a words), the points and convert routes and `WalletScreen` (the action).
- **Checks:** points suite 37 tests pass (12 new, flow on the real router); wallet, send and points together 446 pass; typecheck, eslint and gates as for DV2-02.
- **Attacks as tests:** double tap (one fresh quote, one sheet, one purchase), wrong PIN then right (same key, one payment), a short wallet (Pay off), a lost answer then a retry (same key and body, one pack and one debit), a quote that changed (new total shown, nothing sent), a refusal in the Hub's words, a pending purchase read until paid, a transfer completing when the money lands.
- **Capability checks:** a person picks a pack, sees the Hub's price and points, pays with the PIN and sees the points added once; a Founding Maker sees the bonus the Hub returns and nobody else does (chip and the 6,600 points added); by transfer it completes when the money lands; every figure is the Hub's.
- **Differs for a recorded reason:** the board's "Example values" line is a designer note and is not drawn; the sheet's "Back to AI tools" is "Done" until AI tools has a screen (G-881); the pay button shows the total with the Bank charge (BRIEF rule 5), not the price alone as the board's example does.
- **NOT RUN:** a real provider (V9 on a stack with the Nuvion stand-in is in the lead's hand-back); the dollar packs (PT4a, R-16).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

