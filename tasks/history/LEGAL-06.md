# LEGAL-06 · round history

Moved out of [tasks/LEGAL-06.md](../LEGAL-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/legal/{matter,fixed}/`, `cards.tsx`, `pay/` (shared with LEGAL-04), routes `legal-matter.tsx`, `legal-fixed.tsx`; tests in `LegalPayments.test.tsx` (S21 to S23, S26) and `legalModels.test.ts`.
Checks: as LEGAL-04 (one branch): tsc EXIT 0; eslint EXIT 0; jest legal 112 passed; gates 0 fail, 12 warn (before 9).
Capability checks: S21 read the letter, type the name, sign (test: the sign call carries the typed name); S22 sees ₦ price + charge = total, taps "Pay ₦X to start", PIN (test + live: one debit); S23 opens a document (test: `Linking.openURL`); S24 Start this request opens S26 (card test and route); S26 name, price, charge, total, "Continue · ₦X" (test; one request however often tapped).
Gaps filed: G-880, G-881, G-882, G-884. Shared change: LEGAL-06 #1. Not done: S24 and S26 are not reachable until G-881 is answered; the board's order Continue to PIN (G-884).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

