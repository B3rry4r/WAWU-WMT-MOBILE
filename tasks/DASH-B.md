---
id: DASH-B
title: The dashboard shows the app's real money (wallets, merchant wallet, revenue)
owner: YOU
area: DASHBOARD
order: 254
priority: launch
repo: wawu-backend, wawu-dashboard
type: money-path
status: building
depends_on: [NUV-01, STORE-BUY-HUB, JOIN-TIERS]
decisions: [R-1, R-5, R-19, R-39, R-101, R-125]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# DASH-B · An operator sees the app's money, not the website's

## Current state

Hub half built on branch `wmt/DASH-B` (DASH-B-HUB): four new read routes under `/api/hub/admin/money`, superadmin and finance only (support and reviewer get 403), `Cache-Control: no-store`, all in `contract/openapi.json`. Nothing existing changed; `/admin/finance/*` (the website's Flutterwave routes) is untouched. Dashboard half is DASH-B-WEB.

The balance rule: a balance is the wallet provider's own answer through `WALLET_PROVIDER`, never a sum of our rows. If the provider does not answer, the row says why (`balanceUnavailable`) and has no figure. Only rows of the provider the server runs are listed or asked about.

## Routes for the dashboard builder (kobo, cursor pages: `?cursor&limit`, `{ items, nextCursor }`)

1. `GET /admin/money/wallets?cursor&limit&q&withBalance=true`
   Page of `{ wawuId, handle, displayName, provider, openedAt, status: "open" (a wallet row exists only once the wallet is open), accountLast4, balance?: { availableKobo, bookedKobo, source: "provider", asOf }, balanceUnavailable?: "<plain reason>" }`, newest first. `q` finds by handle, WAWU id, account name or last digits. `balance` and `balanceUnavailable` appear only with `withBalance=true`; the page is then at most 25 rows. `displayName` is the name the provider holds the account under (the Hub has no other name).
2. `GET /admin/money/wallets/{wawuId}?cursor&limit`
   `{ wallet: (as above, always with balance or balanceUnavailable), recordsNote, records: [{ id, direction, status, category, amountKobo, feeKobo, totalKobo, counterpartyName, linkKind, linkTitle, reference, occurredAt }], nextCursor }`. Records are our ledger rows, newest first, labelled by `recordsNote` as records and not a balance. 404 for a person with no wallet on the running provider.
3. `GET /admin/money/merchant?cursor&limit`
   `{ provider, account: { accountLast4, accountName, balance } | null, balanceUnavailable?, recordsNote, heldByKind: [{ kind, count, heldKobo, payeeShareKobo, wawuShareKobo }], holds: [{ id, kind, title, payerWawuId, payerHandle, payeeWawuId (null = WAWU), payeeHandle, amountKobo, payeeShareKobo, wawuShareKobo, heldAt, waiting, inReview }], nextCursor }`. `account.balance` is WAWU's merchant wallet as the provider answers; `heldByKind` and `holds` (status `held`, oldest first) are our records.
4. `GET /admin/money/revenue?from&to`  (window `[from, to)`, ISO 8601; no bounds = this month, UTC)
   `{ period, split: { creatorsPercent: 85, wawuPercent: 15 }, streams: [{ key, label, rail, source, statuses, count, grossKobo, keptKobo, refundedKobo, wawuKobo, creatorsKobo, unpricedCount, grossBasis, bases?, foreignCharges?, breakdown?: [{ key, label, count, grossKobo, unpricedCount, bases? }] }], note }`.
   Streams: `wallet_content_unlock`, `wallet_tip`, `wallet_paid_dm`, `wallet_event_ticket`, `wallet_bill`, `wallet_credit_pack` (always listed, zero when empty; any other wallet-paid kind with money follows), `store_apple`, `store_google` (breakdown by product kind), `join_web` (breakdown by tier, rail Flutterwave). `rail` is Nuvion (the running provider), Apple, Google or Flutterwave. No Shop stream (R-2). Streams are not added into one total: different rails and bases.
   Refunds (all streams): `grossKobo` is the money taken. `refundedKobo` is "refunded to payers" (null where it does not apply: join, and non-held wallet kinds). `keptKobo` = gross - refunded. Wallet `wawuKobo` and `creatorsKobo` are the 85/15 shares stored on each payment, worked on the money kept (a refunded held payment contributes 0). Store streams count `granted`, `refunded` and `revoked` sales bought in the window; a sale refunded or revoked later stays in the window it was bought in, shown as refunded there (the route `note` says so).
   Store pricing: each sale is priced once, first basis that can: (a) `store_charge` "As charged by the store, before its cut" (`priceMicros` when `currency` is NGN); (b) `recorded_list_price` (`referenceKobo`); (c) `todays_list_price` "Today's list price" (live plan tier price or plan-settings pack price). `bases: [{ basis, label, count, grossKobo }]` shows the count and amount under each basis, on the stream and on each breakdown row; a sale no basis can price is `basis: "unpriced"` and counted in `unpricedCount`. Charges in other currencies are never converted or added into naira: `foreignCharges: [{ currency, count, amountMinor }]` (hundredths of that currency), and such a sale is still priced in naira on (b) or (c).
   Pages with `withBalance=true` have one 20 second deadline for the whole page: a row still waiting gets `balanceUnavailable: "Nuvion did not answer in time"` (the provider's name) and no number.

## Rules that hold

- Show nothing the Hub does not answer: a row with `balanceUnavailable` shows the reason, never 0.
- Draw the merchant `holds` and `heldByKind` as records beside the provider balance, never as a balance.
- The three held-money lines (paid DMs, tickets, bills) plus school fees are the kinds in `heldByKind`.

## Capability checks

- [ ] A finance or superadmin operator can see each open wallet with the balance the wallet provider reports, and a wallet the provider does not answer for shows its reason and no figure.
- [ ] A finance or superadmin operator can see WAWU's merchant wallet balance beside the held-money records (paid DMs, tickets, bills, school fees) as records, never as a balance.
- [ ] A finance or superadmin operator can see revenue per stream for a chosen period, with the 85/15 split, refunds and the rail each stream ran on.
- [ ] A support or reviewer admin cannot open any of the money pages or routes.
