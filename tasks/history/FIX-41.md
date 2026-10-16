# FIX-41 · round history

Moved out of [tasks/FIX-41.md](../FIX-41.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-41` `cefbd0a`, on `wmt/WALLET-09` `b113e63` (mobile on `bd0aaa3`).
- **Red on `b113e63`:** the five new cases of `bank-transfer.contract.spec.ts` fail there: R1 for the three kinds ("until: the condition never held": no review flag), the sweep case (no lookup made), N3 (`403` from the PIN guard where `400` is expected). Log `red.log` in the builder's scratch folder.
- **Green:** the seven FIX-41 cases pass (R1 x3, the sweep read, the sweep that leaves alone, N3 x2); the whole spec file with `bank-send-target.spec.ts` passes (35 of 35) before the last spec edit; `npm run test:contract -- src/money`: 73 of 74 suites, 1822 of 1826 tests. The one failing suite is `src/money/receipts/tests/receipt-units.spec.ts` (4 cases on the Unicode digit table against this machine's Node 22.22.0), not touched by this branch; it fails the same 4 cases on a clean checkout of `b113e63`.
- **Spec helper:** the `send` helper of `bank-transfer.contract.spec.ts` now asks the name check and sends its token, as the app does, with a token kept per body object so a repeat of one body carries the same token (a new token would change the body fingerprint). A test that wants none writes `nameToken: undefined`. The old case that sent without a token and expected 201 now ends at the good token.
- **Decisions in the code:** the lookup waits one hour after the failure (the sandbox's orphan record was still pending 37 minutes on), stops at 48 hours, and marks a send as asked with the existing `checks` counter (0 means never asked; no new column). `sentToBankAt` null stands for "no provider record". An unreachable provider puts the counter back so it is asked again. The webhook path reads the ledger row the sighting was noted on (`status failed vs completed`, or a row revived to `completed`).
- **Checks:** `tsc --noEmit` EXIT 0; eslint --no-fix on the touched files EXIT 0; `contract:build` twice, the two `openapi.json` byte-equal, one description changed.

## Verifier report

_Not started._
