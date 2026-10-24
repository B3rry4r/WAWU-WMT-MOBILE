# LEGAL-06 · round history

Moved out of [tasks/LEGAL-06.md](../LEGAL-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/legal/{matter,fixed}/`, `cards.tsx`, `pay/` (shared with LEGAL-04), routes `legal-matter.tsx`, `legal-fixed.tsx`; tests in `LegalPayments.test.tsx` (S21 to S23, S26) and `legalModels.test.ts`.
Checks: as LEGAL-04 (one branch): tsc EXIT 0; eslint EXIT 0; jest legal 112 passed; gates 0 fail, 12 warn (before 9).
Capability checks: S21 read the letter, type the name, sign (test: the sign call carries the typed name); S22 sees ₦ price + charge = total, taps "Pay ₦X to start", PIN (test + live: one debit); S23 opens a document (test: `Linking.openURL`); S24 Start this request opens S26 (card test and route); S26 name, price, charge, total, "Continue · ₦X" (test; one request however often tapped).
Gaps filed: G-LEGAL-06-1, G-LEGAL-06-2, G-LEGAL-06-3, G-LEGAL-06-4. Shared change: LEGAL-06 #1. Not done: S24 and S26 are not reachable until G-LEGAL-06-2 is answered; the board's order Continue to PIN (G-LEGAL-06-4).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Builder report (backend half of F1, B3a round 2, 17 Oct 2026)

Lead ruling 4 (17 Oct): `quote()` (`src/legal/legal.service.ts`) refuses a re-quote once the letter is signed or the matter is paid or in progress, 409 with a clear sentence, and never moves a paid matter back to `quoted`.
Files: `src/legal/legal.service.ts` (`requoteRefusal`, the conditional write), `src/legal/tests/legal-ops.contract.spec.ts`.
Checks: `tsc --noEmit` EXIT 0; `legal-ops.contract.spec.ts` 38 of 38 (EXIT 0); on `ed45009` the signed and the paid/waiting tests fail.
Not run: the app half; Fintava (rule).

