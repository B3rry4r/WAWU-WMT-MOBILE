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
- **Check 1, logs: NOT RUN** (no droplet access). Round 2 widens this grep to all 10 retired routes (see Round 2); the round 1 command was: the owner, or anyone with droplet SSH, runs `ls -l --time-style=+%F /var/log/nginx/access.log*` (the oldest file must reach back 14 days), then `sudo zgrep -hE '"[A-Z]+ /api/hub/shop/(cart|checkout|orders)' /var/log/nginx/access.log* | awk '{print substr($4,2,11), $6, $7, $9}' | tr -d '"' | sort | uniq -c`. Empty output passes. nginx is the record: the app logs no requests to its journal. What ran here: a freshly seeded database has 0 ShopOrder rows (no latest date); local wawu_hub_test, ops03_hub, ops03_fresh_hub and ops03r2_hub also have 0. The web has gated every /shop page since 12 Sep. **Merge waits on this grep.**
- **Checks 2 to 4:** `src/shop/tests/shop.contract.spec.ts`, 16/16: a past paid order is listed and opens (no refundError, 403 for another buyer, unpaid ones stay out); a pre-cutover charge settles once (stock moves once) and then shows in the list; checkout is 410 with the message and writes no order; the cart is 410 and writes nothing; no token is still 401; search (all four tabs, closest, suggestions), the feed and /creators never contain a live product; `/shop` is no campaign destination; /health is 200. **Check 5, deploy green: NOT RUN.** It runs on the first deploy after merge (unblock: the merge). /health = 200 is proved in the spec.
- **Check 6, V3:** main `run.sh --fresh origin/main` 244/244. Branch on its own lock 244/244. `ci-check.sh origin/main wmt/OPS-08 0` (no label) 230 of 244: the 14 failures are all Shop entries (10 relocked + GET /admin/shop/products/:id, verify, GET /shop/orders/:orderId and fulfilment, whose ids came from the retired probes; "needs {{productId}}/{{shopOrderId}}"). Every non-Shop entry passes. With the label (`... 1`, fresh database) 244/244, and the lock diff lists exactly the 10 Shop entries.
- **Relock:** 10 entries re-recorded to 410 (POST and PUT /admin/shop/products, GET /shop/products, /shop/:slug, /shop/categories/:category/subcategories, the four cart routes, POST /shop/checkout). Probes: the product and a paid past order are now written by `before` SQL steps, and DELETE cart no longer fills a cart. All 232 other entries keep main's expectation byte for byte. GET /admin/finance/transactions and /admin/finance/wallets [withBalances] re-record differently on main itself today, so they were left as locked. The sha256 was recomputed with the suite's `lockHash`.
- **Owner, to apply the relock:** open the backend PR `wmt/OPS-08` to main. In the "Protected routes (V3)" job summary, check that the lock diff lists only those 10 entries. Then add the label `relock-approved` after the latest push. Only the run that the label triggers counts, so after any later push, remove the label and add it again. Merge only after the check 1 grep is empty.
- **Gates, before to after:** tsc 0 to 0. eslint without --fix, whole repo: 3645 errors / 851 warnings to 3614 / 807. Changed files are clean except 2 prettier findings already on main in `campaign-destination.ts`. scripts/gates: 16 fail / 1 warn / 76 accepted to identical findings. Full contract suite: 1720 pass / 0 fail / 3 pending. The event and admin-finance specs need a mock on :4001: they are 91/91 on both branch and main with it running, and give 91 "fetch failed" without it. Mobile `npm run check`: exit 0 to exit 0 (250 tests, gates 0/0/0).
- **Web, already hidden:** wawuafrica origin/main 80c3671, `src/app/(app)/shop/layout.tsx:18` `const SHOP_LIVE = false;` gates every /shop route (line 29). The Home tile is `src/lib/platform-services.ts:111` `soon: true`. Finding: the web's "Shop orders" row (`src/app/(app)/settings/page.tsx:122`, which goes to /shop/orders) is under that gate, so web buyers see "coming soon" there. The API serves the orders.
- **Mobile:** no code change. The app calls no Shop route, and `contract/mobile-exclusions.json:20` already drops the Shop tag. After the backend merge, `npm run api -- --backend ../wawu-backend` drops the removed schemas. No BACKEND_GAPS or SHARED-CHANGES rows were needed. The contract was regenerated, not hand-edited. No PR was opened: per the run instructions, the branches are pushed only.

### Round 2 (backend 4f57d62 on a37e95f; verifier report 4664b3d)

Fixes as Lead defaults (coordinator, 2 Oct 2026), owner may override:
- **Defect 2, payment links:** `POST /payments/hosted-link` now answers 410 `shop_retired` for a Shop order's txRef (`payment-link.service.ts`: `resolveCharge` marks a ShopOrder, and `create` refuses it after the ownership check). No pre-cutover pending order can get a new payment page, and Flutterwave is never called. Somebody else's Shop txRef is still 404, so a ref cannot be probed. Verify and the webhook are unchanged for charges already in flight before the cutover. The 410 is documented in the contract; the 200 schema is unchanged. New spec `src/payment-link/tests/payment-link-shop.contract.spec.ts`, 4/4: owner 410 (order stays pending, no provider call); other buyer 404; a credits txRef still gets its page (the refusal is Shop only); unknown 404. On the round 1 code the spec fails (200, link minted). **No other route can start a Shop charge:** outside tests nothing writes a new ShopOrder (`shopOrder.create` or `upsert`). The only writes left are verify (pending to paid or failed) and fulfilment, and no `initCharge` has a shop purpose. Residual: a client still holding a round 1 checkout response could try the inline modal with it; verify would settle that, by the same in-flight default.
- **Defect 1, dashboard:** an admin saving the dashboard's ProductForm gets the 410 message (accepted default). Follow-up filed as SHARED-CHANGES section 3, row OPS-08 #1: hide create and edit in wawu-dashboard (`src/lib/api/admin-shop.ts:114,118`, `shop/page.tsx:128`, `/shop/new`, `/shop/[id]`, `ProductForm`), keep the read-only list and detail, the orders queue and fulfilment. Applied by SCHOOLS-05 (DEV3) or the owner.
- **Check 1, the merge-gating grep, widened to all 10 retired routes** (replaces round 1's). Run on the droplet. First confirm the oldest log reaches back 14 days: `ls -l --time-style=+%F /var/log/nginx/access.log*`. Then run: `sudo zgrep -hE '"[A-Z]+ /api/hub/shop/|"(POST|PUT) /api/hub/admin/shop/products' /var/log/nginx/access.log* | grep -vE '"[A-Z]+ /api/hub/shop/orders' | grep -v '"curl/' | awk '{print substr($4,2,11), $6, $7, $9}' | tr -d '"' | sort | uniq -c`. Empty output passes.
  - What it covers: every `/api/hub/shop/*` call except the order routes that stay (`/shop/orders`, `/shop/orders/:id` and `/shop/orders/:id/verify`), which covers browse, `:slug`, subcategories, cart and checkout; plus admin product create and edit.
  - What it leaves out: the old deploy smoke test, which probed `GET /api/hub/shop/products` with curl, so curl user agents are dropped.
  - What it can't see: hosted-link calls for a Shop txRef, because nginx does not log the body. Those are refused now anyway.
  - Merge still waits on this grep.
- **Copy:** the 410 sentence is now "Shop has closed. Orders you already paid for are not affected." (no screen shows past Shop orders, verifier finding 3). The admin one is "Shop has closed, so products can no longer be added or changed. Orders already paid for can still be read and dispatched." The `shop_retired` code is unchanged. The spec now checks that the sentence makes no "purchases" promise.
- **Ran:** shop and payment-link specs 20/20. tsc 0. eslint on the changed files matches main's count, file by file. scripts/gates: same 16 fail / 1 warn / 76 accepted findings (544 files, +1 the new spec). Protected suite, the CI check with the 4001 mock held by another session, so mine ran on :4502: without the label 230 of 244, the 14 failures the same Shop entries as round 1, with `POST /payments/hosted-link` passing (its probe uses a tip txRef); with the label 244/244, and the lock diff is still exactly the 10 Shop entries (the registry is unchanged in round 2). Full contract suite on :4501: 94 suites, 1724 pass / 0 fail / 3 pending, with the event and admin-finance specs green on the same run (round 1 was 1720 + the 4 new cases). Mobile `npm run check` after merging main (AUTH-03): exit 0, 13 suites / 250 tests, gates 0/0/0.

## Verifier report

Verifier session, 2 Oct 2026, fresh (wrote none of this task's code). Backend `wmt/OPS-08` at a37e95f (bf9538c + a37e95f) on main 5c07568; mobile `wmt/OPS-08` at 5c0fe23. Detached worktrees with `node_modules` symlinked (lockfiles identical to main), own databases (`v_ops08_*`, dropped afterwards). Evidence in the verifier scratchpad (`ops08/`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (same as main) | Backend `tsc --noEmit` 0 on branch and main. `eslint` (no --fix) on the 8 changed .ts files: 2 prettier errors, both in `campaign-destination.ts` lines 37 and 42, identical on main. `scripts/gates/run.py`: 9 gates, 543 files scanned, 16 fail / 1 warn / 76 accepted, output byte-identical to main; `check_baseline.py` exit 0. Mobile `npm run check` exit 0: 13 suites / 250 tests, gates 9 run, 69 files scanned, 0/0/0, task check passes. |
| V3 Regression | passed | `run.sh --fresh origin/main`: 244/244. Branch against its own lock (`PROTECTED_LOCK_REF=origin/wmt/OPS-08 run.sh --fresh`): 244/244. `ci-check.sh 5c07568 a37e95f 0` (no label, fresh DB): base checker and lock, 230 of 244, exit 1, the 14 failures all Shop (the 10 relocked plus GET /admin/shop/products/:id, POST verify, GET /shop/orders/:orderId, PATCH fulfilment). `ci-check.sh ... 1` (label): the PR's own lock, 244/244, exit 0. `lock-diff.py`: Changed (10), exactly the 10 Shop entries; nothing added or removed; setup unchanged; no checker file changed; no "outside code refers to the checker" hit. The other 232 entries are byte-identical to main and in the same order. Lock hash recomputed with the suite's own `lockHash` (`test/protected-routes/registry.ts`, unchanged): main 755ce4fa...7591f matches its file; branch `1916cf7aa5b8482d254ff67e6bb1811798d229a7683ac217d77072766fe92321` matches its file. |
| V4 Field trace | passed (API) | ShopOrder written by main's code before the cutover, read after it by the branch: buyer list and detail (403 for another buyer), admin queue and fulfilment, webhook and verify, finance stream (admin-finance spec 39/39 green). No reader in search, feed, creators or `/content/purchases`. The UI side: see finding 3. |
| V7 Flow walk | passed (API); web UI NOT RUN | Walked over HTTP as a buyer with a past order, a second buyer, no token, a malformed token, and a superadmin (below). No browser walk of the web: its Shop pages are statically gated (check 5). Mobile has no Shop screens (R-2). |
| V9 Live seam | passed | Booted `dist/src/main.js` of main, then of the branch, on the same database. Users signed in through the mock WAWU ID's register (as the suite does), the admin through the real `POST /admin/auth/login` (seeded with `npm run admin:seed`). Values only the server has: order ids, stock moving 10 to 8 to 5, `paidAt`. |

**Check 1, capability checks with real HTTP** (`ops08/br_checks.py`, 66/66). Main created the product (stock 10), one paid order and two pending charges, then stopped; the branch booted on the same database. Flutterwave's verify endpoint was answered by a local fake (`fakeflw.js`, preloaded; it logs each call).
- New orders refused: checkout with a token is 410 `{statusCode: 410, message, data: null, reason: {code: "shop_retired", message}}`; cart GET, POST, PATCH, DELETE (and PATCH with a non-uuid) 410; browse (products, `?search=`, `:slug`, subcategories) 410 with and without a token. Order count, cart quantity and stock identical before and after (3, 4, 10). No token and a malformed token are 401 on all 8 user routes; admin POST/PUT product: no token 401, a WAWU ID token 401, superadmin 410 `shop_retired`.
- A past paid order: listed for its buyer, pending ones not listed, opens with its line, 403 "This order is not yours." for another buyer, absent from that buyer's list; verify by another buyer 403.
- A pre-cutover charge settles once: browser verify 201 paid; verify again 201 paid; webhook replay "settled" with no second effect; stock 10 to 8 (qty 2) once, `paidAt` unchanged; Flutterwave called once for it. A second charge settled by the webhook first, its replay "duplicate / Already settled", browser verify after it returns paid; stock 8 to 5 (qty 3) once. Forged `verif-hash` 401. Both now appear in the buyer's list.
- Search, feed, creators: 60 calls (4 tabs, suggestions, closest; 5 terms incl. the product's name; with and without a token), all 200, none containing the product's id, slug or name, while the product is `live` in the table. Positive control: "SEEDED" finds 3 content items. `/content?scope=feed`, `/content`, `/creators`, `/content/purchases`: no product. Code: `prisma.product` is read only in `src/shop/`.
- `/health` 200 `{ok: true, service: "wawu-hub-api"}`. Admin product list, detail, order queue 200; fulfilment dispatch 200. `/admin/notifications/destinations` no longer lists `/shop` (the dashboard reads this endpoint, so its composer follows).

**Check 2, reference inventory.** Grepped the branch for shop/Shop/SHOP, `prisma.product|cartItem|shopOrder`, raw `"Product"`/`"ShopOrder"`, cart, checkout. Matches the builder's list: webhook router (`payment-webhook.service.ts:590`), payment link (`payment-link.service.ts:101`), finance (`admin-finance.service.ts:151,512`, `finance-streams.ts:128`), account purge (`account-data-map.ts:66` CartItem, `:133` ShopOrder, both still purge the user's rows), `app.module.ts`, deploy smoke test, marketplace saves (`shop: basket|beauty`, not this Shop). No scheduler job touches ShopOrder. Two things that still reach Shop were not handled: findings 1 and 2.

**Check 4, deploy workflow.** `deploy.yml` parses (jobs test, deploy, notify); 15 steps on both sides, only "Smoke test the live service" differs; job settings and top-level keys identical. The step probes `/api/hub/health` and exits 0 only on "200". `/health` is `AppController` (unchanged from main), no auth guard; only the global throttler (20/s, 200/min), far above 15 probes 4 s apart. Check 5 of the task (deploy green): NOT RUN, it runs on the first deploy after merge.

**Check 5, web.** wawuafrica origin/main 80c3671: every `/api/hub/shop` caller is `src/lib/api/shop.ts`, imported only from `src/components/shop/*` and `src/app/(app)/shop/*`; nothing outside those imports either. `src/app/(app)/shop/layout.tsx:18` `const SHOP_LIVE = false;` returns `ServiceComingSoon` for every /shop route and never mounts `WowCartProvider` (the cart fetch). The Settings "Shop orders" row (`settings/page.tsx:122`) lands on that gate. No user-reachable web call hits a 410 route.

**Check 6, gates and tests.** Shop spec 16/16. Full contract suite on the branch, own database: 93 suites, 1629 passed, 91 failed, 3 pending. The 91 were the event (52) and admin-finance (39) specs, `connect ECONNREFUSED 127.0.0.1:4001`: the mock I started was replaced mid-run by another session's mock on the shared port. Re-run of those two specs plus shop with the mock up: 107/107. Total 1720 pass / 0 fail / 3 pending (the Gemini-backed legal-intake cases). Contract: `contract:emit` + `contract:enrich` on the branch reproduce `contract/openapi.json` byte for byte; the 10 retired operations list 410 and `x-wawu-retired-by: OPS-08`.

**Check 7, the builder's defaults.**
- Verify stays: safe and consistent with R-2 and rule 6 (proved exactly-once above). But together with the hosted link it is not limited to charges opened before the cutover: finding 2.
- Admin fulfilment and catalogue reads stay: safe; a paid order is still owed, and order lines point at those rows.
- Past orders not added to `/content/purchases`: consistent with rule 6 (that response is protected and would widen). It leaves the capability check without a screen: finding 3.

**Check 8, the log grep.** NOT RUN (no droplet access). The command is correct for nginx's default `combined` format (the site in `deploy/install-services.sh` sets no `access_log`, so `/var/log/nginx/access.log` in combined): `$4` is `[dd/Mon/yyyy:...`, so `substr($4,2,11)` is the date, `$6` the quoted method, `$7` the path, `$9` the status; `zgrep -h` reads rotated `.gz` files; Ubuntu's default logrotate keeps 14 days. It covers only `shop/(cart|checkout|orders)`, which is what the check says, but not the other retired routes: finding 1.

### Findings

1. **defect: the dashboard still calls two of the retired routes, and no evidence covers them.** wawu-dashboard origin/main c1dfca6: nav "Shop" (`src/components/layout/nav.ts:147`) to the product list, its "New product" button (`src/app/(app)/shop/page.tsx:128`) and edit page use `ProductForm`, which calls `adminShopCreate` and `adminShopUpdate` (`src/lib/api/admin-shop.ts:114,118`): POST and PUT `/admin/shop/products`, both now 410. The builder's report does not mention the dashboard, and the merge-gating grep does not look at `/api/hub/admin/shop/products` (or at browse). WORKFLOW section 6 (Remove) and rule 6 need the logs to show no calls to each route being removed. Unblocks it: widen the grep to every retired route, e.g. `'"(POST|PUT) /api/hub/admin/shop/products|"[A-Z]+ /api/hub/shop/(cart|checkout|products|categories)'` with the deploy smoke test's `curl/` user agent left out, and record the dashboard consequence (a SHARED-CHANGES or BACKEND_GAPS row naming the task that hides "New product" and edit there, or a recorded default).
2. **defect: a retired Shop order can still be charged after the cutover.** `POST /payments/hosted-link` resolves a ShopOrder txRef (`payment-link.service.ts:101,109`) and mints a new Flutterwave payment page, whatever the order's age or status. Shown on the booted branch: a pending order dated 20 days back, hosted link 200 (`/v3/payments` called with tx_ref and 20000), then verify 201 paid, stock claimed. The builder listed this reference but recorded no decision. Unblocks it: refuse a ShopOrder txRef there (410 `shop_retired`, the same shape) so only charges already opened before the cutover settle, or record a default with the reason. Note `POST /payments/hosted-link` is protected (web caller `src/lib/flutterwave.ts:372`); refusing only Shop txRefs leaves its locked probe untouched, which V3 will confirm.
3. **unclear (owner): where a buyer sees a past Shop order.** The API serves them (proved above), but no screen does: the web row is behind `SHOP_LIVE = false` since 12 Sep, mobile has no Shop orders (ME-03, R-2). The 410 sentence the builder wrote says "Orders you already placed are still in your purchases", which nothing a user can open backs today. No UI calls these routes, so nobody sees it yet; if the owner does not want a surface, the sentence should drop that clause.

NOT RUN: capability check 1 (droplet logs, see check 8 and finding 1); capability check 5 (the first deploy after merge); a browser walk of the web (static check only). V10 is not in `passes`.

Verdict: 2 open defects. Status `building`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
