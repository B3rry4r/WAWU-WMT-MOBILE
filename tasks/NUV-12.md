---
id: NUV-12
title: Capital: fixed-return and share-offering products from the wallet (list, reserve, confirm with the PIN, portfolio, history, early liquidation)
owner: YOU
area: MONEY
order: -1212
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-84, R-83, R-39, R-20, R-10, R-29, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUV-12 · Capital

## Current state

As of 24 Oct 2026, built by a Sonnet builder (bundle B22, T2): backend `wmt/NUV-12` on `origin/main` `38be72e`, mobile `wmt/NUV-12` on `origin/main` `7e65293b`. Status verifying. No PR.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | No Capital anywhere; the provider seam had no investment products | `WalletProvider.capital` (optional, `src/wallet-provider/wallet-provider-capital.ts`); the Nuvion adapter's area `src/nuvion/areas/capital.ts` makes every call; the Fintava adapter has none, so every route answers `409 capital_unavailable` there |
| 2 | No route | `GET /capital/availability`, `products`, `products/{id}`, `portfolio`, `orders`, `orders/{id}`, `orders/{id}/transactions`, `orders/{id}/withdrawal`; `POST /capital/orders` (reserve, `Idempotency-Key`, no PIN), `POST orders/{id}/confirm` and `POST orders/{id}/withdrawal` (PIN or device approval, `Idempotency-Key`) |
| 3 | No record of an order | tables `CapitalOrder`, `CapitalAdminAudit` (migration `20261110120000_capital_orders`, rollback refuses while a confirmed order is stored); the sweep settles an order left `confirming`, expires reservations, reads holdings and retries a fee |
| 4 | A `capital-*` payout inflow would have been "review" in the inflow handler | `src/nuvion/handlers/capital.handler.ts` writes the payout and the purchase to the ledger once, on the order's own row; `inflows.ts` leaves `capital-*` to it |
| 5 | No owner controls | on/off: plan setting `capital.enabled` (default 1); limits and WAWU's fee from settings (`CAPITAL_MIN_KOBO`, `CAPITAL_MAX_KOBO`, `CAPITAL_DAILY_MAX_KOBO`, `CAPITAL_WAWU_FEE_KOBO`, `CAPITAL_WAWU_FEE_BPS`, all off or 0 by default, R-10); admin `GET admin/capital/orders`, `POST .../{id}/freeze`, `unfreeze`, `cancel` for superadmin and finance, each with an audit row |
| 6 | Wallet tab ends at the Points and Passes cards | one row, Capital, under them, drawn only when `GET /capital/availability` is true; `/capital` (portfolio, Invest and Mine), `/capital/product`, `/capital/review` (the PIN sheet over it), `/capital/order`, `/capital/withdraw` |

### What dev showed (24 Oct, `docs/nuvion/DEV-RESULTS.md` "Capital")

A reservation is 15 minutes and moves nothing. A second confirm of an APPROVED order is `400 invalid for state`, so the Hub reads the order before it speaks. A payout settles in seconds and comes back as a `capital-early-liquidation-withdrawal` inflow whose counterparty is the holding. `capital-transactions` filters by the capital ACCOUNT id. A third product kind, `PRIVATE_EQUITY`, has no terms and is left out. A document is affirmed by its exact name, extension included. Dev `GET /capital-portfolio` once answered a 503 page.

### Words

The app says what the provider's terms say (rate, term, what leaving early costs, deductions) and promises no return: "These figures are the provider's own and are not a promise of a return." The Hub never works out a rate, a return or a payout; a figure the provider did not give is `null` and not drawn. No provider name reaches a person.

### Checks run (24 Oct 2026)

- Backend: `src/capital/tests/capital.contract.spec.ts` 17 tests (browse, reserve once, PIN, replay, two taps, expiry, short balance before the PIN, lost answer settled by the sweep, portfolio, share offering, early liquidation, locked product refused before the PIN, switch off, no provider, limits and fee, admin acts and roles); `src/nuvion/tests/nuvion-capital.spec.ts` 7 (the area over a socket, with dev's shapes); `src/nuvion/tests/nuvion-capital-handler.contract.spec.ts` 6; money-contract, plan-settings, publishing-gate-coverage (one NOT_GATED entry added, `POST capital/orders` carries a yes, not a file) and hub-rate-limits all pass; `npm run test:protected` 253 pass on a seeded database; tsc, eslint, gates and check_baseline pass; rollback proved (refuses with a confirmed order, runs when empty).
- Mobile: `src/features/capital/__tests__` 8 flow tests and 5 model tests; the 48 Wallet tab tests pass with the new row test; tsc, eslint, gates pass.
- NOT RUN: a phone (V10); an order from a person's own (child) entity against Nuvion dev (no funded child entity: the call path is proven on the stand-in, G-NUV-12-3); Nuvion's Capital webhooks (dev endpoint blacklisted); the full backend suite and `npm run check` (CI and the merge agent run them); the Fintava specs (rule).

### Open

Blocker: none. High: none. Medium: none known. Lows: G-NUV-12-3 and G-NUV-12-4 in `BACKEND_GAPS.md` (notifications for payouts; dev webhooks). Default (lead), owner may override: Capital is on; WAWU's fee is 0; no daily limit of ours. Shared-file rows: SHARED-CHANGES NUV-12 #1 to #4. Next: a verifier (T2, full) runs V8 on the stack (`scripts/dev/stack.sh`, the stand-in now serves Capital) and checks the pictures.

## Read first

- Built on NUV-02 (opening the wallet) and NUV-04 (the naira account), both merged; `depends_on` is empty as for the FIX tasks (a negative order sits before them).

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- DECISIONS.md R-84 and R-83, R-39, R-20, R-10, R-29, R-47
- backend `CLAUDE.md` "Money", `docs/contract/CONVENTIONS.md` section 27, `src/wallet-provider/wallet-provider-capital.ts`, `src/nuvion/areas/capital.ts`, `src/capital/`
- `docs/nuvion/DEV-RESULTS.md` "Capital"

## Goal

A person with an open wallet can see what Nuvion's Capital offers in naira, reserve a product for a few minutes, confirm it with the PIN, see what they hold and what has ended, read each holding's movements, and leave a fixed return early or at its end, with the provider's own figures and no promise. The owner can switch it off, limit it and set WAWU's fee, and the team can hold or cancel an order.

## Scope

Backend: `src/capital/**`, `src/wallet-provider/wallet-provider-capital.ts` and the `capital` member, `src/nuvion/areas/capital.ts`, `src/nuvion/handlers/capital.handler.ts` (and one line in `inflows.ts`), the registry and webhook module lines, `prisma` (two tables), the plan setting, three error codes, `scripts/dev/nuvion-standin.cjs`, `docs/contract/CONVENTIONS.md`. App: `src/features/capital/**`, `src/app/capital/**`, the row in `src/features/wallet/home/WalletScreen.tsx`.

## Capability checks

- [x] A user can open Capital from one row on the Wallet tab, and the row is gone when an admin switches Capital off.
- [x] A user can read a product's rate, term, deductions, early-exit words and documents, open a document in the browser, and see why a closed sale cannot be ordered.
- [x] A user can reserve a product with a double tap and get one reservation; the review shows the provider's quote, the countdown and the total, and nothing is taken.
- [x] A user can confirm with the PIN (or the phone's fingerprint): a wrong PIN, a lost answer and a second tap send the same key and the money leaves once.
- [x] A user whose reservation ran out, or whose balance is short, is told in the Hub's words before or without the PIN and nothing is taken.
- [x] A user can see the portfolio, their investments and the ended ones, one investment's figures and movements, and withdraw a fixed return early with the PIN once.
- [x] An admin (superadmin or finance) can list orders, hold, release and cancel a reservation, each with an audit row; support and reviewers are refused.
- [ ] On a phone: NOT RUN (no device in this session).
- [ ] V9 on the stack with a real sign-in: see the pictures section of the history.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-12.md](history/NUV-12.md).
