---
id: PRICE-LIST
title: Prices come from a list (R-101, Hub)
owner: YOU
area: MONEY
order: -1267
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: []
decisions: [R-101, R-8, R-40, R-65, R-79, R-86]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# PRICE-LIST · Prices come from a list (Hub)

## Current state

As of 27 Oct 2026. Round 2: the app header and the Hub's use of it (backend `30225bd`, mobile see the hand-back). Round 1: Hub built by a Sonnet builder (T2), backend `wmt/PRICE-LIST` on `origin/main` `53f3cb3`; records on mobile `wmt/PRICE-LIST` on `origin/main` `4dccecae` (R-101 and its three "Updated by" lines in `DECISIONS.md`, this file).

- **Settings (R-101 point 1):** `prices.list_naira` (25 prices, ₦100 to ₦1,000,000) and `prices.tip_list_naira` (6 tips), admin plan settings of unit `lines` (digits, one price a line), strictly ascending, unique, above 0 and at most 1,000,000. A save that leaves a tip off the price list is `400` (judged on the pair, so both change in one request). Read live.
- **The read:** a new route `GET /prices` (any signed-in person), not `GET /content/sale-terms`: sale-terms is creators only and a fan picking a tip is not a creator. `{ prices: [{ priceNaira, priceKobo }], tips: [...] }`. Sale-terms and its presets are unchanged. Documented in `docs/contract/PRICES.md`.
- **The rule:** `PriceListService.assertOnList` answers `400` with reason code `price_not_on_list` (CONVENTIONS section 3) and `nearestLowerNaira` and `nearestHigherNaira`. Enforced on the routes only the app uses: `PATCH /content/{id}` (a new price), `PUT /paid-dm/settings` (a new price), `POST /communities/rooms` (`passPriceKobo`).
- **The app header (round 2, lead ruling, option A):** the app sends `X-Wawu-Client: app` on every Hub request (`src/api/client.ts`, set before the auth middleware so a repeat after a refresh carries it; `src/__tests__/client-app-header.test.ts`). With it, the Hub also holds a price to the list on `POST /content`, the draft publish (a draft's price is judged when it is published), `PUT /events/{id}/tickets` and `POST /events` (paid ticket types; free is 0). Without it those routes behave exactly as before (protected suite 253 of 253). It is read per request like `X-Pay-Source-Currency` (`AppClientMiddleware` in `PriceListModule`); CORS reflects requested headers already, so `src/hub-app-config.ts` (not fenced) is unchanged and a spec pins it. Documented in the Hub's CONVENTIONS section 3a. `PATCH /creator/dm-settings` and `POST /tips` are untouched.
- **Migration:** `20261212090000_price_list` moves paid pieces (not removed), paid-message prices, private room passes and unsold, unretired ticket types off the list to the nearest list price (the lower on a tie, above the top to the top) and keeps each old price in `PriceListMove`; `rollback.sql` restores them and refuses when a moved price was changed since. `PriceMoveNoticeService` tells each owner once per item (`price_moved`).
- **Not done:** the price picker (PRICE-PICKER); drafts' saved prices are not moved by the migration (judged at publish); events are not sent back to review when a ticket price moves; the live-chat connection (`features/inbox/live.ts`) does not carry the header (it sets no price).

## Read first

- `DECISIONS.md` R-101, R-8, R-40, R-65, R-79, R-86; `docs/WORKFLOW.md`; the Hub's `docs/contract/PRICES.md`.

## Goal

Every price a person sets is on the owner's price list, so the store ladder (STORE-LADDER) can have one product for each price.

## Capability checks

- [x] Settings validated; tips a subset of the price list; read live.
- [x] `GET /prices` carries both lists.
- [x] A price off the list is `400 price_not_on_list` with the nearest two on the three app routes; a list price and free (where R-8 allows) pass.
- [x] The migration moves live-shaped rows, leaves the rest, is safe to run twice, notifies once; the rollback restores and refuses.
- [x] `POST /content`, the draft publish and the ticket routes refuse a price off the list for requests with `X-Wawu-Client: app` only; without it nothing changes.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/PRICE-LIST.md](history/PRICE-LIST.md).
