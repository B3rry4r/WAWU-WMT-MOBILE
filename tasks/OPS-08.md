---
id: OPS-08
title: Retire Shop on the backend
owner: YOU
area: OPS
order: 37
priority: launch
repo: wawu-backend
type: removal
status: verifying
depends_on: [MONEY-01]
decisions: [R-2]
passes: [V1, V3, V4, V7, V9]
artboards: []
---
# OPS-08 · Retire Shop on the backend

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Shop is retired (R-2). Its routes stop taking orders without breaking past orders or anything else.

## Scope

Before deleting anything, search for every reference. Shop routes return 410; past orders stay readable in
purchases; Shop is removed from search and from any Home payload. The web already hides Shop (SHOP_LIVE=false).

In the same pull request:
- change the deploy smoke test, which probes `https://$API_DOMAIN/api/hub/shop/products` and accepts only 200 or
  401 (wawu-backend `.github/workflows/deploy.yml`), to a route that stays (for example `/api/hub/health`), or
  every deploy after this one fails;
- relock the protected-route list (MONEY-01) for the Shop routes only; the owner applies `relock-approved`.

## Capability checks

- [ ] Production logs show no Shop order calls for the two weeks before the change (docs/WORKFLOW.md section 6, Remove).
- [ ] A buyer can still see a past shop order in their purchases.
- [ ] Placing a new shop order is refused with a clear message.
- [ ] Search never returns a shop product.
- [ ] The deploy after this change goes green with the new smoke-test route.
- [ ] V3: every other protected route behaves the same.

## Builder report

wawu-backend `wmt/OPS-08` @ a37e95f: bf9538c (code) + a37e95f (relock), on origin/main 5c07568. Files: `src/shop/{shop.controller,shop.service,shop-admin.service,shop-retired,dto/shop.dto}.ts` (`shop.constants.ts` deleted), `src/admin/shop/admin-shop.controller.ts`, `src/admin/notifications/campaign-destination.ts`, `src/shop/tests/shop.contract.spec.ts` (rewritten for the retired contract), `.github/workflows/deploy.yml`, `.pipeline/protected-registry.json`, `contract/openapi.json` (regenerated). Mobile: this file and the log only.
- **Shop references found first:** routes in `src/shop/shop.controller.ts` (12) and `src/admin/shop/admin-shop.controller.ts` (6); `shop.service.ts`, `shop-admin.service.ts`; webhook `payment-webhook.service.ts:586-598` (a shop txRef goes to `verifyOrder`); `payment-link.service.ts:101` (txRef owner lookup); admin finance `admin-finance.service.ts:151,497` and `finance-streams.ts:128` (the shop stream); `campaign-destination.ts:27` (`/shop`); `account-purge/account-data-map.ts:133`; `app.module.ts:60,326`; the deploy smoke test. Search (`search-response.service.ts`) and the Home payloads (GET /content?scope=feed, GET /creators) never read Product. No job or cron touches Shop. `ShopKind` (marketplace saves) is WAWUBasket/WAWUBeauty: untouched.
- **Built:** shop browse (products, `:slug`, subcategories), the four cart routes and checkout answer 410 `{statusCode, message, data: null, reason: {code: "shop_retired", message}}`; admin product POST/PUT answer 410. Guards are unchanged, so no token is still 401. Still served: GET /shop/orders, GET /shop/orders/:orderId, POST verify (and the webhook), the admin product reads, the order queue and fulfilment. The `/shop` campaign destination is removed. The smoke test probes GET /api/hub/health (`src/app.controller.ts`, no guard, `{ok: true, service: "wawu-hub-api"}`), 200 only.
- **Defaults (agent), owner may override:** verify stays (refusing it would leave a charge opened before the cutover with no paid order); admin catalogue reads and fulfilment stay (a paid order is still a box owed); admin product writes are 410; `reason.code` is `shop_retired`; past orders are not added to GET /content/purchases (that would widen a protected response, and ME-03 has no Shop orders); the unreachable browse, cart, checkout and upsert code and DTOs are deleted. Copy with no design: the two 410 sentences in `shop-retired.ts`. Also removed an em-dash from verify's sold-out message.
- **Check 1, logs: NOT RUN** (no droplet access). Unblock: the owner, or anyone with droplet SSH, runs `ls -l --time-style=+%F /var/log/nginx/access.log*` (the oldest file must reach back 14 days), then `sudo zgrep -hE '"[A-Z]+ /api/hub/shop/(cart|checkout|orders)' /var/log/nginx/access.log* | awk '{print substr($4,2,11), $6, $7, $9}' | tr -d '"' | sort | uniq -c`. Empty output passes. nginx is the record: the app logs no requests to its journal. What ran here: a freshly seeded database has 0 ShopOrder rows (no latest date); local wawu_hub_test, ops03_hub, ops03_fresh_hub and ops03r2_hub also have 0. The web has gated every /shop page since 12 Sep. **Merge waits on this grep.**
- **Checks 2 to 4:** `src/shop/tests/shop.contract.spec.ts`, 16/16: a past paid order is listed and opens (no refundError, 403 for another buyer, unpaid ones stay out); a pre-cutover charge settles once (stock moves once) and then shows in the list; checkout is 410 with the message and writes no order; the cart is 410 and writes nothing; no token is still 401; search (all four tabs, closest, suggestions), the feed and /creators never contain a live product; `/shop` is no campaign destination; /health is 200. **Check 5, deploy green: NOT RUN.** It runs on the first deploy after merge (unblock: the merge). /health = 200 is proved in the spec.
- **Check 6, V3:** main `run.sh --fresh origin/main` 244/244. Branch on its own lock 244/244. `ci-check.sh origin/main wmt/OPS-08 0` (no label) 230 of 244: the 14 failures are all Shop entries (10 relocked + GET /admin/shop/products/:id, verify, GET /shop/orders/:orderId and fulfilment, whose ids came from the retired probes; "needs {{productId}}/{{shopOrderId}}"). Every non-Shop entry passes. With the label (`... 1`, fresh database) 244/244, and the lock diff lists exactly the 10 Shop entries.
- **Relock:** 10 entries re-recorded to 410 (POST and PUT /admin/shop/products, GET /shop/products, /shop/:slug, /shop/categories/:category/subcategories, the four cart routes, POST /shop/checkout). Probes: the product and a paid past order are now written by `before` SQL steps, and DELETE cart no longer fills a cart. All 232 other entries keep main's expectation byte for byte. GET /admin/finance/transactions and /admin/finance/wallets [withBalances] re-record differently on main itself today, so they were left as locked. The sha256 was recomputed with the suite's `lockHash`.
- **Owner, to apply the relock:** open the backend PR `wmt/OPS-08` to main. In the "Protected routes (V3)" job summary, check that the lock diff lists only those 10 entries. Then add the label `relock-approved` after the latest push. Only the run that the label triggers counts, so after any later push, remove the label and add it again. Merge only after the check 1 grep is empty.
- **Gates, before to after:** tsc 0 to 0. eslint without --fix, whole repo: 3645 errors / 851 warnings to 3614 / 807. Changed files are clean except 2 prettier findings already on main in `campaign-destination.ts`. scripts/gates: 16 fail / 1 warn / 76 accepted to identical findings. Full contract suite: 1720 pass / 0 fail / 3 pending. The event and admin-finance specs need a mock on :4001: they are 91/91 on both branch and main with it running, and give 91 "fetch failed" without it. Mobile `npm run check`: exit 0 to exit 0 (250 tests, gates 0/0/0).
- **Web, already hidden:** wawuafrica origin/main 80c3671, `src/app/(app)/shop/layout.tsx:18` `const SHOP_LIVE = false;` gates every /shop route (line 29). The Home tile is `src/lib/platform-services.ts:111` `soon: true`. Finding: the web's "Shop orders" row (`src/app/(app)/settings/page.tsx:122`, which goes to /shop/orders) is under that gate, so web buyers see "coming soon" there. The API serves the orders.
- **Mobile:** no code change. The app calls no Shop route, and `contract/mobile-exclusions.json:20` already drops the Shop tag. After the backend merge, `npm run api -- --backend ../wawu-backend` drops the removed schemas. No BACKEND_GAPS or SHARED-CHANGES rows were needed. The contract was regenerated, not hand-edited. No PR was opened: per the run instructions, the branches are pushed only.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
