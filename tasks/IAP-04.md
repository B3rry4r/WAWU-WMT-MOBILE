---
id: IAP-04
title: Admin dashboard Store page (the owner maps every Google Play and App Store product to what it grants, sets each store's switch and cut, reads purchases and refunds)
owner: YOU
area: IAP
order: -1269
priority: launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: [IAP-01]
decisions: [R-86, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T2
---
# IAP-04 · The Store page in the admin dashboard

## Current state

As of 25 Oct 2026, built by a Sonnet builder (T2): dashboard `wmt/IAP-04` `5cb78a3` on `origin/main` `433c710` (pictures in `audits/IAP-04/`), mobile records `wmt/IAP-04` on `origin/main` `1fcf0fd7`. Status review. The Hub routes are `admin/store/*` (IAP-01, on backend main) and the fifth product kind `extra_products` (IAP-03, backend `wmt/IAP-03` `04d5069`, not merged: the page's types are generated from that ref and will read the merged head once it lands).

| # | Before | After |
|---|---|---|
| 1 | the dashboard had no page for the store product map, so the owner could not say which Play Console or App Store Connect id grants what | `/store` ("Store" in the Money section), for superadmin and finance (the routes' own roles; any other role is shown a refusal and nothing is requested) |
| 2 | no list of store products | **Products** tab: every row of the map with store, id, kind (points, WAWU Credits, tier, community pass, more products), what one purchase grants (read from the Hub's resolved grant), worth in naira, order and On or Off; filters by store and kind |
| 3 | no way to add or change one | **Add product** and **Edit**: store, product id, kind, title, the one grant field its kind uses (points pack id, credits pack, tier id, days a pass runs, products added), the worth in naira where the Hub needs it (a pass: required; credits: optional, the Hub defaults it to the pack price), order, on or off. The store, id and kind are fixed once added, as the Hub fixes them. **Turn off** and **Turn on** confirm first |
| 4 | a Hub refusal was a bare status | shown in the form by cause: the Hub's `reason.code` (`store_product_invalid`, `store_product_unknown`) names the cause, and the Hub's own sentence is kept word for word (for example "That points pack is not in the plan."); a 400 with no code, a 403, a 5xx and no answer each get their own cause and say that nothing was changed |
| 5 | store switch, cut and keys were not visible | **Stores** tab: Google Play and App Store, each with Purchases On or Off (Turn off and Turn on confirm), the cut in percent (Change, and Use the Hub's cut to put back its own), and Keys at the Hub: Present or Missing. A key is never sent or shown |
| 6 | purchases and refunds could not be read | **Purchases** and **Refunds** tabs, read only, newest first, cursor pages (Load more). Filters: store, kind, person's WAWU id, and status on purchases (the Hub ignores it on refunds, so it is not offered there). Each row: what the store charged in the buyer's own currency, the worth, the store's cut, the net and the host's share, the period or what was taken back, and the Hub's flag (`member_removed`) |
| 7 | no loading, empty or error state for these | each tab has all three; the empty Products tab says nothing is sold until a product is added and offers the first Add |

Hub gaps, none blocking: the page offers nothing the Hub does not serve (no delete, no refund action, no key entry, no way to clear a worth: the Hub cannot). A pass is changing from an auto-renewing subscription to a one-time 30-day purchase per room (lead ruling, 25 Oct 2026; the Hub change is on `wmt/IAP-03`); the page labels a pass product by what the Hub returns (days and worth) and says "subscription" only of a tier. The pass's `days` field and `referenceKobo` are unchanged on the Hub as it stands, so the page needed no change for it.

Proof (local stack on the Nuvion stand-in from backend `wmt/IAP-03` `04d5069`, Google configured with a placeholder so the picture shows both states, a superadmin, a finance and a support admin; never a live host, never Fintava): 16 pictures at 1440 px, light and dark, in `audits/IAP-04/` (empty, products, add refused by the Hub, loading, error, stores, purchases, refunds). A driven run against the real Hub passed 28 checks: add (Hub defaults the credits worth), a duplicate id refused by cause, a pass with no worth cannot be sent, edit sends only what changed, product off and on, both stores' switches, the cut set to 12.5% and put back, all four filters, finance can read, support is refused. The purchase rows in the pictures were inserted into the local database (no store was called). Dashboard: `tsc`, `eslint` on changed files, `npm test` (13, 7 new), gates, `check_baseline`, `check:invariants`, `check:contrast`, `check:store-contract` all EXIT 0.

Default (lead), owner may override: (a) the page is one route with four tabs, not four routes. (b) The page reads the Hub's own plan: it asks the Hub to check a points pack id or a tier id and shows its refusal, because no admin route lists the plan's ids. (c) A store's cut is typed in percent and sent in basis points, as the Hub takes it. (d) `wawu-dashboard` `scripts/generate-store-contract.mjs` is a fifth generator; it reads the newest backend ref that has `extra_products`: regenerate at the merged head with `HUB_API_PATH=<backend> npm run gen:store-contract`.

### The owner's steps on the page

1. Sign in as superadmin or finance and open **Store** in the Money section.
2. In Play Console and App Store Connect create the products with the ids in `tasks/IAP-02.md` ("Store products the owner must create").
3. **Products**, **Add product**, once per store product and store: pick the store and the kind, type the same product id the store uses, a title, and what it grants (points pack `s`, `m`, `l`; credits `starter`, `popular`, `pro`; tier `verify`, `plus`, `founding`; days for a pass; the count for "Add 5 more products"). For a pass, type what one purchase is worth in naira. The Hub says at once if the plan has no such pack or tier.
4. **Stores**: when the Hub has the store's keys (`IAP-01` "What the owner sets up"), Keys at the Hub reads Present and the store reads Selling. Check the cut (15% unless changed) and leave Purchases On.
5. **Purchases** and **Refunds** show what the stores have sold and paid back.

## Read first

- `DECISIONS.md` R-86; `tasks/IAP-01.md`, `tasks/IAP-02.md`; `docs/WORKFLOW.md`
- Backend `src/store/admin-store.controller.ts`, `store-catalog.service.ts`, `store-grants.ts`
- Dashboard `src/components/store/`, `src/lib/api/admin-store.ts`

## Goal

The owner can map every store product to what it grants, switch and set the cut of each store, and read purchases and refunds, without a database or a script, before the store build sells anything.

## Scope

`wawu-dashboard`: `src/components/store/*`, `src/app/(app)/store/page.tsx`, `src/lib/api/admin-store.ts`, `src/lib/api/contract/store.generated.ts`, `scripts/generate-store-contract.mjs`, `scripts/hub-api-source.mjs` (a generator may require extra files or text in a ref), `src/lib/api/client.ts` (`ApiError.reasonCode`, additive), `src/lib/format.ts` (`formatMicros`), the Money nav entry, `package.json` (`check:store-contract`, `test`). No backend change.

## Capability checks

- [x] An admin can add a store product with every field the Hub takes, including the fifth kind, and see what it grants.
- [x] An admin can edit a product (only what changed is sent) and turn it off and on.
- [x] The Hub's refusal is shown by cause, with its own sentence.
- [x] An admin can switch each store, set its cut and put it back to the Hub's, and see whether keys are present, never a key.
- [x] An admin can read purchases and refunds with the Hub's filters; nothing on those tabs changes a purchase.
- [x] A role the Hub refuses (support, reviewer) is shown a refusal and no request is sent; finance can read and write.
- [ ] Against the merged IAP-03 head: NOT RUN (the page was built on `wmt/IAP-03` `04d5069`; regenerate the contract at the merged head).
