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

## Verifier report (v-IAP-04, lean T2 check, 25 Oct 2026)

**Verdict: PASS.** No blocker, high or medium. Three lows go to the sweep, two notes. Checked: dashboard `wmt/IAP-04` `5cb78a3` on `origin/main` `433c710`, mobile `19bb7354`, and a local Hub on backend `wmt/IAP-03` `25a2edf` (round 2, on the Nuvion stand-in, ports 9650 to 9653, a Google placeholder for the keys state). Never Fintava, never a live host. Nothing was edited; the verifier built none of it.

| # | Rank | Finding |
|---|---|---|
| 1 | low | The Store entry stays in the nav for support and reviewer, who are then shown "Your role cannot read the store" and send no request. The brief asked for the entry hidden. The nav has no role field and the sidebar shows every entry to every role (`nav.ts`, the KYC comment); IAP-04 follows that, so hiding one entry is a nav-wide change, not an IAP-04 one. |
| 2 | low | A refused write for a 5xx joins the Hub's sentence and "Nothing was changed." with no stop when the Hub's sentence has none (`describeRefusal`, for example "Internal server error Nothing was changed."). |
| 3 | low | The Purchases "Until" column is blank for a pass bought once (round 2: the Hub's `expiresAt` is the store's period end, null for a one-time purchase, and the admin purchase view carries no pass end). A Hub gap, not a page fault; the owner cannot read from the page how long a pass bought once runs. |
| 4 | note | The 16 pictures were taken on `04d5069`, before round 2 and before the take-back wording was settled (the refunds picture still shows "GrantedCredits 50", the page now says "Granted credits: 50"; passes show "Runs to"). They show every state and both themes and match the page's layout; they were not retaken at `25a2edf`. |
| 5 | note | The task's own last capability check ("against the merged IAP-03 head: NOT RUN") is answered for the unmerged round-2 head `25a2edf`: contract current, page drives clean. It still wants one look after the merge. |

**Does the committed contract go stale at `25a2edf`? No.** `HUB_API_PATH` on a worktree at `25a2edf` with `HUB_API_REF=25a2edf`, `npm run gen:store-contract` in a scratch worktree of `5cb78a3`: "wrote 7 routes, 17 types" and `git diff` empty, so `store.generated.ts` is byte-identical. `check:store-contract` says "current (25a2edf)" and, with no ref given, "current (wmt/IAP-03)". Round 2 removed `cancelInStore` from the community pass view and changed the `subscription` comment; neither is an admin store type. A pass's `grants.days` and `referenceKobo` are unchanged on the Hub, and the page reads nothing round 2 removed.

**The generator change does not break the other four.** `hub-api-source.mjs` keeps `hubApiSource()` with no argument as before. The four older generators were run on `origin/main` `433c710` and on `5cb78a3` against the same ref: `generated.ts`, `ops.generated.ts`, `oversight.generated.ts` and `money.generated.ts` come out byte-identical in both trees (`cmp` and `diff -rq`). `check:oversight-contract` and `check:money-contract` are current in both. "Stale" is pre-existing as claimed: `check:ops-contract` and `check:contract` fail identically on `433c710` and on the branch, and the whole difference is the header lines ("Source of truth: /home/user/wawu-backend @ a0e7b20" against the checkout and ref the check ran on, and the web app's path); no type differs. `check:contract` also needs `WAWU_WEB_PATH` on this machine.

**Driven against the local Hub (Playwright, 1440 px; over 100 assertions in 5 runs; every failure in the first runs was the verifier's own script reading the table before the refetch or on its skeleton rows, and passed once rechecked with waits).**

| Area | Result |
|---|---|
| Add, one of each kind | Points (pack `s`), credits (no worth: the Hub defaulted it to the pack price, shown ₦500), tier, pass (days 30, worth ₦500 and ₦500.50 sent as 50000 and 50050 kobo), `extra_products` with no count (body `grants: {}`, the Hub's default 5 shown) and with 10. A pass cannot be sent without a worth. No "subscription" word on any pass form, row or dialog; "subscription" appears once, in the tier id hint, which is true |
| Edit | Only what changed is sent: title alone, grants alone (`{"grants":{"packId":"m"}}`), credits pack and worth, tier id, pass days, worth and order together, `extraProducts` 7; no change keeps Save off and says so; store, id and kind are shown, not offered |
| Turn off and on | Points, credits, tier, `extra_products` and pass: each asks first, sends `{"active":false}` then `{"active":true}`, the row reads Off then On |
| Refusals by cause | Duplicate id and unknown pack or tier (`store_product_invalid`, Hub sentence word for word); a row deleted under an open edit (`store_product_unknown`, "That product is not in the map."); a 400 with no code (days 400, extraProducts 0: the Hub's validator sentence); 403, 5xx and no answer each say so and say nothing was changed |
| Roles | Superadmin and finance read and write (finance edited a product). Support and reviewer: refusal page, zero requests to `/admin/store` (counted at the browser). Nav not hidden (finding 1) |
| Stores | Keys read Missing for both with no placeholder, Present for Google with one; the placeholder's key text is in neither the API answer nor the page. Switch asks first and sends `enabled`; cut 12.5 sent as 1250 and shown "Set by an admin"; "Use the Hub's cut" sends -1 and returns to 15%; 101% refused in the form |
| Purchases and refunds | Read only (no control but Refresh, Narrow, Load more); 25 rows then Load more with the Hub's `s1.` cursor to 32; store, kind, status and person filters each reach the Hub as `platform`, `kind`, `status`, `wawuUserId`; refunds list exactly the refunded and revoked rows, offer no status filter, send no `status`, show what was taken back; currency amounts, store cut, worth, net, host share, room and the `member_removed` flag show |
| Loading, empty, error | Each of the four tabs: skeleton while held, error with Try again on a 500 (a failed Refresh over loaded data shows the error too), the Try again recovers; empty Products offers Add the first product; filtered empties say "Nothing matches" |
| Copy | No em-dash or en-dash in the source of the page, nor in the text of ten rendered views (products, stores, purchases, refunds, four errors, two refusals) |

**Checks (all in `/home/user/wt/viap4-dash`, `5cb78a3`, dependencies by `npm ci`):**

| Check | Result |
|---|---|
| `npx tsc --noEmit` | EXIT 0 |
| `npx eslint` (whole repo) | EXIT 0, 1 warning (`SHOP_DTO` unused in `generate-contract-types.mjs`, a file this branch does not touch) |
| `npm test` | EXIT 0, 13 of 13 (7 new) |
| `python3 scripts/gates/run.py` | EXIT 0, 9 gates, 222 files, 0 fail, 0 warn, 6 accepted |
| `python3 scripts/gates/check_baseline.py` | EXIT 0, 6 entries, each with an owner and a reason |
| `node scripts/check-invariants.mjs` | EXIT 0, 222 files |
| `node scripts/check-contrast.mjs` | EXIT 0, 58 pairs, both themes |
| `check:store-contract` at `25a2edf` | EXIT 0, current |
| `check:oversight-contract`, `check:money-contract` | current (EXIT 0) |
| `check:contract`, `check:ops-contract` | stale on `433c710` and on `5cb78a3` alike (header lines only), not caused by this branch |
| mobile `python3 scripts/tasks/check_tasks.py` on `19bb7354` | EXIT 0, 446 tasks |
