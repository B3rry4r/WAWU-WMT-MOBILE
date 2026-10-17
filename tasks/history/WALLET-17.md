# WALLET-17 · round history

Moved out of [tasks/WALLET-17.md](../WALLET-17.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B3a, 17 Oct 2026 (Sonnet builder), backend `wmt/B3a` `ed45009`.
- Files: `src/money/earnings/earning-settlement.service.ts` (host shares adopted, members without a payment in the move, the lease check, the landing and the ledger link) and `earning-rules.ts`; `prisma/schema.prisma` and migration `20261025160000_host_share_earnings` (`paymentId` nullable, `creditSpendEarningId` unique with its FK, the source and reference CHECKs, the two guard functions replaced); `src/event-ticketing/wallet/event-host-payout.service.ts` and its module; `.env.example` (`EVENT_PAYOUT_DELAY_HOURS`); `docs/contract/WALLET.md`; `test/payments/wallet-pay-harness.ts` (removes a host's share rows at cleanup); `src/money/earnings/tests/host-share.contract.spec.ts` (5 tests) and `src/event-ticketing/wallet/tests/event-host-payout.contract.spec.ts` (5 tests).
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail, baseline ok; 10 of 10 new tests; the earnings, daily move, sweep start, hold and Nuvion earnings specs pass; `prisma migrate diff` shows only the older ContentPiece index.
- Not done: a mutation run; folding event holds into the daily move (see the task file); the Fintava specs (never run).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._
