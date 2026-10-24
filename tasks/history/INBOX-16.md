# INBOX-16 · round history

Moved out of [tasks/INBOX-16.md](../INBOX-16.md) word for word, oldest first. The current state is in that file.

## Builder report

**Builder report: INBOX-16 (Sonnet builder, 16 Oct 2026).** Backend `wmt/INBOX-16` `f92208d` (first commit `cb59e65`); mobile `wmt/INBOX-16` (docs). Branch checks on `f92208d`: run 38971168912 (CI results recorded in Current state if they changed).

- **Files (backend):** `src/credit-purchase/wallet/` (module, service, controller, DTOs, views, 3 specs), `src/credit-purchase/credit-packs.ts` (the one pack table), `test/credits/credit-wallet-harness.ts`, `prisma/schema.prisma` + migration `20261024000000_credit_purchase_wallet_payment`, `src/app.module.ts` (mount), `contract/openapi.json` (4 paths, 5 schemas, via `npm run contract:build`), `docs/contract/WALLET.md` (the `credit_pack` row and a section), the two route inventories in specs.
- **Design:** follows TIER-03's WAWU-own-sale pattern (registered kind, `presentRoute` so a replay is the first answer, delivery in one transaction) and BILLS-04's payment rules (R-19 merchant account, R-10 fees from the fee settings, R-39 seam: nothing here imports a provider, WALLET-23 limits through the payment service).
- **Capability checks (21 contract tests over HTTP, a real database, Fintava's real client to the double, plus 3 on the Nuvion stand-in: 24 in all):** 120 credits for ₦1,000: quote ₦1,000 + ₦23.25 = ₦1,023.25, one debit of ₦1,023.25, GET /credits 120, a count; 48 + 120 = 168; the three packs; same key twice debits once (replay header, no PIN try, other body is `idempotency_key_reused`); four taps with one key and three with different keys charge once; a confirmation delivered five times at once credits once; the ledger row is out, settled, for the double's amount and charge, with WAWU's account's row in, and the history shows "Credits".
- **Also tested:** 402 with the shortfall, no wallet (409, no key kept), wrong or missing PIN, key, quote, stale total, other pack's quote, unknown pack, extra price fields (400), the daily limit (`limit_reached`, nothing taken), a lost answer (pending, sweep settles, credits once), provider failure (no credits, can pay again), credits that cannot be written (rolled back whole, delivered once later), a spend of a wallet lot pays the host 85/15 on the lot's cost basis, only the buyer reads a purchase.
- **Gates:** `tsc` clean; eslint clean on every file added or changed here; `gates/run.py` 5 FAIL, all in files this task did not touch (same as main); baseline check passes; the contract diff only adds. Regression run against the stack: credit-purchase, credit-spend (after seeding), the two route inventories pass.
- **Gaps and requests:** SHARED-CHANGES INBOX-16 #1 to #3. No BACKEND_GAPS row: the buy sheet's values (packs, prices, badges, fee, total, count) are all served.
- **NOT RUN:** a payment against the Fintava sandbox (no key); the real Nuvion; the latency measurement.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

