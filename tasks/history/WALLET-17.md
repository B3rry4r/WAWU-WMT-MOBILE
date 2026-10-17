# WALLET-17 · round history

Moved out of [tasks/WALLET-17.md](../WALLET-17.md) word for word, oldest first. The current state is in that file.

## Builder report

Bundle B3a, 17 Oct 2026 (Sonnet builder), backend `wmt/B3a` `ed45009`.
- Files: `src/money/earnings/earning-settlement.service.ts` (host shares adopted, members without a payment in the move, the lease check, the landing and the ledger link) and `earning-rules.ts`; `prisma/schema.prisma` and migration `20261025160000_host_share_earnings` (`paymentId` nullable, `creditSpendEarningId` unique with its FK, the source and reference CHECKs, the two guard functions replaced); `src/event-ticketing/wallet/event-host-payout.service.ts` and its module; `.env.example` (`EVENT_PAYOUT_DELAY_HOURS`); `docs/contract/WALLET.md`; `test/payments/wallet-pay-harness.ts` (removes a host's share rows at cleanup); `src/money/earnings/tests/host-share.contract.spec.ts` (5 tests) and `src/event-ticketing/wallet/tests/event-host-payout.contract.spec.ts` (5 tests).
- Checks: tsc 0; eslint 0 on changed files; gates 0 fail, baseline ok; 10 of 10 new tests; the earnings, daily move, sweep start, hold and Nuvion earnings specs pass; `prisma migrate diff` shows only the older ContentPiece index.
- Not done: a mutation run; folding event holds into the daily move (see the task file); the Fintava specs (never run).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Builder report (round 2, B3a, 17 Oct 2026)

Files: backend `src/event-ticketing/wallet/event-host-payout.service.ts` (release as earning), `src/money/holds/wallet-hold.service.ts` and `hold-rules.ts` (`asEarning`), migration `20261025170000_hold_release_earnings`, `src/money/earnings/earnings-view.service.ts`, `src/account/account-deletion-money.service.ts`, docs WALLET.md and CONVENTIONS.md section 18.
Checks: `tsc --noEmit` EXIT 0; gates 0 fail; 36 suites, 721 passed, 3 skipped (EXIT 0).
`event-host-payout.contract.spec.ts`: 3 of its 5 fail on `ed45009` (one transfer per order; a host without a wallet; the delay), pass after; all 5 pass. `host-share.contract.spec.ts` unchanged and green.
Not run: Fintava specs (rule); the app.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-17.md](history/WALLET-17.md).

