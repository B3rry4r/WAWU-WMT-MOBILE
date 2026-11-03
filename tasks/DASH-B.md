---
id: DASH-B
title: The dashboard shows the app's real money (wallets, merchant wallet, revenue)
owner: YOU
area: DASHBOARD
order: 295
priority: launch
repo: wawu-backend, wawu-dashboard
type: money-path
status: doing
depends_on: [DASH-A, NUV-01, STORE-BUY-HUB, JOIN-TIERS]
decisions: [R-1, R-5, R-19, R-39, R-101, R-125]
passes: [V1, V2, V3, V4]
artboards: []
---
# DASH-B · An operator sees the app's money, not the website's

## Current state

Hub half built on branch `wmt/DASH-B` (DASH-B-HUB): four new read routes under `/api/hub/admin/money`, superadmin and finance only (support and reviewer get 403), `Cache-Control: no-store`, all in `contract/openapi.json`. Nothing existing changed; `/admin/finance/*` (the website's Flutterwave routes) is untouched. Dashboard half is DASH-B-WEB.

The balance rule: a balance is the wallet provider's own answer through `WALLET_PROVIDER`, never a sum of our rows. If the provider does not answer, the row says why (`balanceUnavailable`) and has no figure. Only rows of the provider the server runs are listed or asked about.

## Routes for the dashboard builder (kobo, cursor pages: `?cursor&limit`, `{ items, nextCursor }`)

1. `GET /admin/money/wallets?cursor&limit&q&withBalance=true`
   Page of `{ wawuId, handle, displayName, provider, openedAt, status: "open", accountLast4, balance?: { availableKobo, bookedKobo, source: "provider", asOf }, balanceUnavailable?: "<plain reason>" }`, newest first. `q` finds by handle, WAWU id, account name or last digits. `balance` and `balanceUnavailable` appear only with `withBalance=true`; the page is then at most 25 rows. `displayName` is the name the provider holds the account under (the Hub has no other name).
2. `GET /admin/money/wallets/{wawuId}?cursor&limit`
   `{ wallet: (as above, always with balance or balanceUnavailable), recordsNote, records: [{ id, direction, status, category, amountKobo, feeKobo, totalKobo, counterpartyName, linkKind, linkTitle, reference, occurredAt }], nextCursor }`. Records are our ledger rows, newest first, labelled by `recordsNote` as records and not a balance. 404 for a person with no wallet on the running provider.
3. `GET /admin/money/merchant?cursor&limit`
   `{ provider, account: { accountLast4, accountName, balance } | null, balanceUnavailable?, recordsNote, heldByKind: [{ kind, count, heldKobo, payeeShareKobo, wawuShareKobo }], holds: [{ id, kind, title, payerWawuId, payerHandle, payeeWawuId (null = WAWU), payeeHandle, amountKobo, payeeShareKobo, wawuShareKobo, heldAt, waiting, inReview }], nextCursor }`. `account.balance` is WAWU's merchant wallet as the provider answers; `heldByKind` and `holds` (status `held`, oldest first) are our records.
4. `GET /admin/money/revenue?from&to`  (window `[from, to)`, ISO 8601; no bounds = this month, UTC)
   `{ period, split: { creatorsPercent: 85, wawuPercent: 15 }, streams: [{ key, label, rail, source, statuses, count, grossKobo, unpricedCount, grossBasis, wawuKobo, creatorsKobo, refundedKobo, breakdown?: [{ key, label, count, grossKobo, unpricedCount }] }], note }`.
   Streams: `wallet_content_unlock`, `wallet_tip`, `wallet_paid_dm`, `wallet_event_ticket`, `wallet_bill`, `wallet_credit_pack` (always listed, zero when empty; any other wallet-paid kind with money follows), `store_apple`, `store_google` (breakdown by kind), `join_web` (breakdown by tier, rail Flutterwave). `rail` is Nuvion (the running provider), Apple, Google or Flutterwave. Wallet streams: gross is the price before the provider's charge; `wawuKobo` and `creatorsKobo` are the 85/15 shares stored on each payment; `refundedKobo` only on held kinds. Store streams: gross is the list price before the store's cut (`referenceKobo`); tiers and points packs carry no list price in our records, so they are counted in `unpricedCount` and not priced. No Shop stream (R-2). Streams are not added into one total: they are different rails and bases.

## Rules that hold

- Show nothing the Hub does not answer: a row with `balanceUnavailable` shows the reason, never 0.
- Draw the merchant `holds` and `heldByKind` as records beside the provider balance, never as a balance.
- The three held-money lines (paid DMs, tickets, bills) plus school fees are the kinds in `heldByKind`.
