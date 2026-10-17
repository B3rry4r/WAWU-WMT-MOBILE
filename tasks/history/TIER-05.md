# TIER-05 · round history

Moved out of [tasks/TIER-05.md](../TIER-05.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder (Sonnet), 17 Oct 2026. Backend `wmt/TIER-05` `30c3e73` on batch 6 (`fbf391f`); mobile `wmt/TIER-05` on `70a7895`. Nuvion stood in; no provider or wawuafrica.com host called.

**Files (backend):** new `src/plans/purchases/plan-transfer.service.ts` (order, sweep, settlement, recovery) and `plan-transfer-order.ts` (states, words, rules); changed `plan-purchase.service.ts`, `plan-purchases.controller.ts`, `plan-purchases.module.ts`, `plan-purchase-view.type.ts` (`PlanTransferOrderView`), `plan-purchase.dto.ts`, `plan-purchase-terms.ts`; `src/money/payments/wallet-payment.service.ts` (additive: `vouch`, `currentQuote`, `availableOrNull`); `src/plan-settings/*` (the window setting); `src/account-purge/account-data-map.ts` and `src/data-export-request/data-export-sections.ts` (the new table); `prisma/schema.prisma` and the migration; `docs/contract/PLANS.md`; `contract/openapi.json`. New specs: `plan-transfer-order.spec.ts` (5), `plan-transfer.contract.spec.ts` (15).

**Capability checks:** (1) details and complete once: account number, bank, name, Bank charge, amount needed shown; a stand-in credit of exactly the amount completes and grants once (tier, points lot, one send). (2) less leaves it waiting with the new amount; more completes and leaves the rest. (3) ten parallel settlements, a second credit row, two sweeps and a 70 minute payment sweep: one payment, one grant (V8); a Nuvion `pending` first answer grants only when successful, once. (4) after the window: expired, money stays, nothing taken, even for money sent later. (5) two waiting purchases paid oldest first, each once, the second only when the balance covers it; one credit covering both pays both in order. Also tested: a changed price closes the order, a stale quote is 409 at the PIN step, paid another way closes it, asking again replaces it, the PIN and ownership, a person without a wallet, a dead claim recovered, nothing held across a 3 s provider.

**Counts:** backend CI shard 1: 4460 of 4461 (the one known red above); gates same as main (run green). Mobile full check: see the last line of the log below.

**Shared changes:** SHARED-CHANGES TIER-05 #1 (schema and migration) and #2 (contract and API types). No gaps filed: the fields the screens need are served.

**Not done:** screens; TIER-04 and POINTS-02 kinds; no pictures (no screen here).

## Verifier report

