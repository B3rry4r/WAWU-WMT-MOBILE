---
id: NUV-12
title: Capital: fixed-return and share-offering products from the wallet (list, reserve, confirm with the PIN, portfolio, history, early liquidation)
owner: YOU
area: MONEY
order: -1212
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: []
decisions: [R-84, R-83, R-39, R-20, R-10, R-29, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUV-12 · Capital

## Current state

As of 24 Oct 2026, built by a Sonnet builder (bundle B22, T2): backend `wmt/NUV-12` on `origin/main` `38be72e`, mobile `wmt/NUV-12` on `origin/main` `7e65293b`. Status building: the verifier (24 Oct) found one high and one medium, see "Verifier report". No PR.

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
- Pictures (390 px, light and dark, from the web export with the Hub's answers stood in by fixtures, so they show the screens, not a live Hub): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/nuv-12-b/shots/` `wallet-row`, `capital-home-invest`, `capital-home-mine`, `capital-product`, `capital-review`, `capital-holding`, `capital-withdraw`, each `-light.png` and `-dark.png`. No board draws Capital, so there is no artboard to set beside them (R-29, G-NUV-12-1). The PIN sheet over the review and the result views are covered by the flow tests, not pictured.
- NOT RUN: a live stack and a real sign-in (V9; the local stand-in now serves Capital, `scripts/dev/stack.sh`); a phone (V10); an order from a person's own (child) entity against Nuvion dev (no funded child entity: the call path is proven on the stand-in, G-NUV-12-3); Nuvion's Capital webhooks (dev endpoint blacklisted); the full backend suite and `npm run check` (CI and the merge agent run them); the Fintava specs (rule).

### Open

Blocker: none. High: none. Medium: none known. Lows: G-NUV-12-3 and G-NUV-12-4 in `BACKEND_GAPS.md` (notifications for payouts; dev webhooks). Default (lead), owner may override: Capital is on; WAWU's fee is 0; no daily limit of ours. Shared-file rows: SHARED-CHANGES NUV-12 #1 to #4. Next: a verifier (T2, full) runs V8 on the stack (`scripts/dev/stack.sh`, the stand-in now serves Capital) and checks the pictures.

## Verifier report (24 Oct 2026, T2 lean check, backend `26107b6`, mobile `6e8c7a11`): FIX

| Pass | Result | Evidence |
|------|--------|----------|
| V3 protected routes | passed | `npm run test:protected` 253 pass on a seeded DB (EXIT 0). Contract: 13 new paths, 0 changed, none removed; `contract:emit` and `enrich` reproduce the committed file byte for byte. Rollback refuses with 9 confirmed orders stored, drops both tables when none. |
| V4 gates | passed | backend gates 9 run, 1850 files, 0 fail; baseline 124 entries EXIT 0; app gates 10 run, 1317 files, 0 fail, 56 unit tests; check_tasks 433 EXIT 0; tsc both EXIT 0; eslint (no --fix) on the 29 changed backend files EXIT 0 |
| Specs | FAILED | 7 specs, 6 pass, 107 of 108 tests; `money-contract.spec.ts` fails (finding 1). App: jest `src/features/wallet` and `src/features/capital` 28 suites, 388 tests pass |
| V8 money (stand-in Hub, real sign-in) | passed | reserve twice with one key: one order, nothing taken; no PIN 403, wrong PIN 403 (4 tries left), nothing taken; confirm twice at once with one key: 201 and 409 in progress, one debit (₦50,000 to ₦48,000); same key again: the same order; new key on a confirmed order: no second debit; withdraw twice at once: one payout, balance back; expired reservation: refused plainly, nothing taken; reserve over the balance: 402 with the shortfall; below or above a setting's limit refused; daily limit refused; fee 2,500 flat + 1% on ₦2,000 = ₦45, debit ₦2,045, fee paid once; `capital.enabled` 0 refuses every route within seconds and the Wallet row goes |
| Admin | passed | support and reviewer 403 on list and freeze; finance and superadmin list, freeze, unfreeze, cancel a reservation; cancel of an invested order 409; frozen order refuses withdraw; 3 audit rows (none for the refused calls) |
| V9 live seam | partly | Real sign-in through the app's login screen (web export 390 x 844) on the local Hub. Nuvion DEV (`api.nuvion.dev` only): a wallet opened through the Hub (entity submitted, approved, naira account active; Nuvion's webhooks do not reach a local Hub, so the verifier signed `entities.updated` and `accounts.created` locally with the stack's own secret); `GET /capital/availability`, `products` (11 real products) and `products/{id}` answered through the child entity; an order with no money is refused plainly (402, ₦50.00 more). NOT RUN: funding that wallet (EUR session needs the Plaid browser steps; no steps left), so reserve, confirm, withdraw and the 15 minute expiry were not seen against dev. Nothing was put into dev, so nothing to withdraw. |
| V10 phone | NOT RUN | no device |

Pictures (390 px, light and dark, from the real app on a local Hub and stand-in; the builder's are fixtures): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/nuv-12-v/shots/` `wallet`, `capital-invest`, `capital-mine`, `capital-product`, `capital-review`, `capital-pin`, `capital-result`, `capital-holding`, `capital-withdraw`. No board draws Capital (G-NUV-12-1). Not pictured against live dev (the export points at the local Hub).

### Findings

1. **high** `defect`: the money contract spec is red. `src/capital/capital.dto.ts:78-81` types `amountKobo` with `@IsInt()` only, so `contract/openapi.json` says `CapitalReserveDto.amountKobo: number`, and `src/money/tests/money-contract.spec.ts` "types every field and parameter whose name ends in Kobo as an integer" fails (`/components/schemas/CapitalReserveDto/amountKobo: number`). The builder's report said money-contract passes. Repro: `npm run test:contract -- src/money/tests/money-contract.spec.ts` on the backend branch. Fix: `@ApiProperty({ type: 'integer' })` on that field (as `src/money/dto/money-error.dto.ts` does), then `npm run contract:build`.
2. **medium** `defect`: a promised return reaches the screen. The app draws the provider's own product description (`src/features/capital/ProductScreen.tsx:120-122`, passed through at backend `src/capital/capital-mapping.ts:263`). Nuvion dev's "30 Days Fixed Returns" reads "Earn a guaranteed fixed return on your investment ... both your capital and returns are paid out at maturity ... grow your money with confidence", on the same screen family whose footer says the figures "are not a promise of a return". The task's Words rule is that the app promises no return. Repro: a person with an open wallet on the dev Hub, `GET /capital/products`, open that product. Fix: do not draw the free-text description (keep the structured terms), or strip it, and say which in the task; a rule on any other free text the provider sends.
3. **low**: migration stamp `20261110120000` is earlier than `20261112090000_fx_accounts` on `origin/wmt/WALLET-21-HUB` (pushed 13:36, after this branch's 13:04 stamp commit). `prisma migrate deploy` still applies both; the lead's stamp registry should rule on the order at merge.
4. **low**: an admin-cancelled reservation answers a confirm with "This investment is on hold. Contact support to continue." (`src/capital/capital.service.ts` `assertMayConfirm`, `row.state === 'cancelled'` uses the hold message). It is a cancelled reservation, not an investment on hold.
5. **low**: with `capital.enabled` 0 a person who already holds an investment cannot read or withdraw it either (`GET /capital/orders` 409 on the stack). Matches the capability check as written; flagged so the owner knows switching it off also closes the exit.
6. **low**: the Wallet transaction list names the fee row after WAWU's own account ("Who Made This", "Transfer") and the purchase "Transfer" under "Capital . 90 Days Treasury Bills" (picture `wallet-dark`); no "Capital fee" label.
7. **low**: the PIN sheet reads "₦2,000 for Invest in 90 Days Treasury Bills" (picture `capital-pin-*`).
8. **low** (dev, not code): the first `GET /capital-portfolio` after the wallet opened timed out at Nuvion dev and the Hub answered 503 "Payments are not available right now" (retries 200 in about 1.2 s). The app's Capital home was not seen on that path.
9. note: `npm run money:check` on the stack reports one mismatch, `wawu-account` 100,000,000 kobo, which equals the stand-in's `STANDIN_OPERATIONAL_KOBO` opening for WAWU's operational account, not a Capital movement. The Hub's balance (which it reads from the provider) moved by exactly the amounts in the V8 row; the money check's account list was not read further.

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
- [ ] V9 on the stack with a real sign-in: NOT RUN (the pictures use fixtures); the verifier runs it on the stack.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-12.md](history/NUV-12.md).
