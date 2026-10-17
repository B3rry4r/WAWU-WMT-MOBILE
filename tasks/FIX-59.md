---
id: FIX-59
title: My purchases lists every paid kind (tickets, credit packs, school fees, community passes)
owner: YOU
area: FIX
order: -59
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-5, R-10]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-59 · My purchases lists every paid kind (tickets, credit packs, school fees, community passes)

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder (tier T1). Backend `wmt/FIX-59` `47b0718` (from `wmt/MERGE-12` `98efeef`); this record and the gap rows on mobile `wmt/FIX-59` (from `wmt/MERGE-12` `c840ed6d`). No schema, no migration, no Fintava file touched, no app code.
- **Found by:** G-ME-14-1 (ME-14 builder): `GET /me/purchases` lists unlocks only, so M29 missed tickets, credit packs, school fees and passes.
- **Built:** a new route `GET /me/purchases/all` (same `q`, `cursor`, `limit` as `/me/purchases`). A new route, not a query value on the old one, because each row has a different shape (kind, amount, status, an id to open) and a typed client wants one shape per route; `/me/purchases` is not in the protected registry and the web does not call it, but its answer is left byte-identical anyway.
- **Row:** `kind` (`content_unlock`, `event_ticket`, `credit_pack`, `school_fee`, `community_pass`), `title`, `amountKobo` (the wallet payment's own price; a card charge keeps its stored amount; nothing recomputed), `totalKobo` (what left the wallet, null for a card charge), `purchasedAt`, `status` (`paid` or `refunded`), `openId` (piece, ticket order, enrolment or community; null for a pack), `content` and `lessons` (unlocks, as M29 draws them), `credits` (a count, never naira).
- **Source:** one table per purchase, never two: unlocks from `Purchase`, tickets from `EventOrder` (card and wallet; free orders are not purchases), packs from `CreditPurchase`, school fees and passes from the completed `WalletPayment` (a pass has no table on this base). A wallet unlock or pack that could not be delivered and was paid back has no record of its own and is listed from its payment once the provider confirmed the refund.
- **Not purchases of an item:** tips, paid questions, bills, plans, verification, legal fees. They stay in the wallet history.
- **Specs:** `src/me/tests/me-paid-purchases.contract.spec.ts` 8 of 8 (each kind once, another person's never, refunded marked, paging at five page sizes with a three-way tie and no repeat or gap, title and creator search, the old answer byte-identical while other kinds are bought) plus `me.contract.spec.ts` 37 of 37. Protected suite `run.sh --fresh` all 244 required tests passed. tsc 0, eslint 0 on the changed files, gates passed, baseline ok, `contract:build` 0 (151 lines added, none removed).
- **Open:** M7's "My purchases N" still counts unlocks only (`GET /me/counts`, G-FIX-59-2). The app adopts the new read in ME-14's follow-up.
- **Next:** an independent verifier.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-59-1, G-FIX-59-2 (and G-ME-14-1 on `wmt/ME-14`)

## Goal

M29 can list everything a person paid for, not only the pieces they unlocked, with the amount they paid and whether it was paid back.

## Scope (backend only)

`src/me/me-paid-purchases.service.ts` (new), `src/me/me.controller.ts`, `src/me/me.module.ts`, `src/me/me-view.type.ts`, `src/me/me-purchases.service.ts` (`progressFor` made public, nothing else), `contract/openapi.json` (generated), `src/me/tests/me-paid-purchases.contract.spec.ts` (new).

## Capability checks

- [x] Each kind is listed once: an unlock paid by wallet is one row, not a purchase and a payment.
- [x] Another person's purchases never appear.
- [x] A refunded ticket, pack, fee, pass or unlock is marked `refunded`; a refund still on its way that nothing confirms is not shown as paid back.
- [x] Pages never repeat or skip a row, ties at one instant included; the search finds titles (and a piece's creator's handle).
- [x] `GET /me/purchases` answers byte for byte as before; the protected suite is green.

## Owner sign-off

Not needed.
