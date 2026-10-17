# LEGAL-06 · round history

Moved out of [tasks/LEGAL-06.md](../LEGAL-06.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Builder report (backend half of F1, B3a round 2, 17 Oct 2026)

Lead ruling 4 (17 Oct): `quote()` (`src/legal/legal.service.ts`) refuses a re-quote once the letter is signed or the matter is paid or in progress, 409 with a clear sentence, and never moves a paid matter back to `quoted`.
Files: `src/legal/legal.service.ts` (`requoteRefusal`, the conditional write), `src/legal/tests/legal-ops.contract.spec.ts`.
Checks: `tsc --noEmit` EXIT 0; `legal-ops.contract.spec.ts` 38 of 38 (EXIT 0); on `ed45009` the signed and the paid/waiting tests fail.
Not run: the app half; Fintava (rule).

