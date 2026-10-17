# WALLET-13 · round history

Moved out of [tasks/WALLET-13.md](../WALLET-13.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, T1, 17 Oct 2026. Files: `src/features/wallet/earnings/{api,model}.ts` and `EarningsScreen.tsx`, `src/app/earnings.tsx`, `src/features/wallet/__tests__/earnings{Model,Screen}.test.ts(x)`, BACKEND_GAPS G-WALLET-13-1 to 4, this file, LOG and PROGRESS. Reuses `MoneyGround` and `FittedBalance` (the money card), `TransactionRow`, `Card`, `Banner`-style note, `EmptyState`, `ErrorState`, `ProsNav`, `SectionHeading`; no component forked, no theme literal.
- W39 sees what they earned, this month and all time, by stream and by piece: earningsScreen "shows what the Hub says" asserts every figure from the stand-in Hub (none of the canvas's), the month asked for is the Hub's, no "Move to wallet" or "Ready to move".
- No wallet and money waiting sees it and can tap Open your wallet (A26): "tells a creator with no wallet" (the press calls `onOpenWallet`); on the stack the tap opens A31 and back returns to W39.
- States: loading, error and retry, offline, a body that is not an earnings view (an error, never zeros), nothing earned yet (no pieces asked for), a month with nothing, pieces failing alone, a second page by the Hub cursor; each by its own jest test and on the stack as listed in Current state.
- Gates before/after: `npm run gates` after only (886 files, 0 fail, 9 warn, 0 accepted); I did not run it before. typecheck 0, lint 0 on changed files, 17 new tests pass.
- Defaults (agent), owner may override: the hero leads with this month and shows all time under it; the three named streams are always drawn (a stream the Hub lists none of is nothing earned); "once a day" is R-55's rule and is the only promise about timing; figures show kobo only when there are some (the hero always).
- NOT RUN: V10; the month-with-nothing state on the stack by a real cause; the Fintava adapter (never touched).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

