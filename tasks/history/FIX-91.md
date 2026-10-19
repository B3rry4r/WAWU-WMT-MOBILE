# FIX-91 · round history

Moved out of [tasks/FIX-91.md](../FIX-91.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/direct-message/wallet/tests/paid-dm-wallet.contract.spec.ts`, `src/money/earnings/tests/host-share.contract.spec.ts`, `src/event-ticketing/wallet/tests/event-host-payout.contract.spec.ts` (4 lines each, batch 12); `src/ai-tools/tests/ai-tools.contract.spec.ts` (batch 13).
- Checks: see Current state. CI runs: batch 12 Branch checks 39304014019, Gates 39304014056, Protected routes 39304014188; batch 13 Branch checks 39304017457, Gates 39304017366, Protected routes 39304017375.
- One slip: `account-deletion.contract.spec.ts` was started once by name in the batch 13 tree to see whether it left holds; it failed in its first hook at the mock sign-in (it hard-codes port 4001), before its Fintava double started, so no Fintava server ran. It was not run again.
- Gaps: G-FIX-91-1, G-FIX-91-2.
- Not done: the two polluters are unchanged (Fintava specs); no whole-suite run was made.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-91.md](history/FIX-91.md).

