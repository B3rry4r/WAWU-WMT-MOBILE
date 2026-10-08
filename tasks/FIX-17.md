---
id: FIX-17
title: A bad character or value in any query answers 400, not 500, across the Hub
owner: YOU
area: FIX
order: 196
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [FIX-07]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-17 · A bad character or value in any query answers 400, not 500, across the Hub

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/FIX-07.md` (its verifier report: "Not this task: 23 other GET routes", the closest length note, and the two non-NUL 500s; evidence `otherroutes.json` in the verifier's scratch folder)

## Goal

FIX-07 fixed `/search`. Its verifier found 23 other GET routes that still answer 500 when a query or path value holds a NUL (Postgres error 22021): public (`/shop/products?search=`, `/shop/:id`, `/creators?category=`, `/learn/guides?country=`, `/users/public/:id`, `/content/public/creator/:id/content`), signed in (`/events?host=`, `/me/purchases?q=`, `/content?category=`, `/feed?category=`, `/feed/entries?category=`, `/services?category=`, `/services/mentors?category=`, `/users/:id/public-profile` and its `/profile-fields` and `/content`, `/legal/requests/:id` and `/contract`) and admin (`/admin/creators?q=`, `/admin/finance/wallets?q=` and `/:id`, `/admin/shop/products?search=`, `/admin/payments/receipts?txRef=` and `?flow=`). Also two non-NUL 500s: `GET /shop/categories/<not in the enum>/subcategories`, and `GET /admin/shop/orders` with an unknown `fulfilment` or a non-numeric `page` or `perPage`. And `GET /search/closest` has no length limit on `q` (an 8,000-token `q` costs 2.6 s of ILIKE work).

## Scope

One rule, applied once: a NUL (or anything else Postgres refuses in text) in a query or path value answers 400 naming the field, before any query runs, on every route. Prefer one global place (a pipe or middleware) over per-route edits, keeping every answer that is not a 500 today byte-identical, and pick the single NUL policy the code base follows from now on (today it is stripped in money and AI text, refused in legal documents, the assistant and profile audience, replaced in the Fintava webhook): write it in `docs/contract/CONVENTIONS.md`. The two enum and paging 500s become 400s naming the field. `closest` gets the same 100-character cap as `/search` (check the protected lock first; if it captures a longer `q`, stop and say so). Many of these routes are protected: every change is a former 500, and the PR lists them.

## Capability checks

- [ ] Each of the 23 routes, the two enum and paging cases, answers 400 naming the field for its bad value, and byte-identically to main for clean text (a recorded sweep).
- [ ] A NUL anywhere in any query or path value of any GET route answers 400, never 500 (a sweep over every GET route in the route registry).
- [ ] `closest` refuses a `q` over 100 characters; the lock is unchanged.
- [ ] Protected routes 253/253.

## Builder report

Builder, 8 Oct 2026. wawu-backend `wmt/FIX-17` `@@BHASH@@` (from `origin/main` `965280e`); mobile `wmt/FIX-17` (from `origin/main` `1219790`). Lead-owned fix.

**Built.** One rule, applied once: a query or path value holding text Postgres cannot take (a NUL, or a lone UTF-16 surrogate) answers `400 {"statusCode":400,"message":"<field> must have text in it, with no null characters or broken characters","data":null}`, naming the field, before any query runs, on every route the Hub mounts (435 routes, every method). `checkStorableTextOnEveryRoute(app)` (`src/storable-text/storable-text.pipe.ts`, called once in `src/main.ts` before `listen`) puts one pipe last on every handler argument at startup, so a route added later is covered with no line of its own. The rule is `isCleanText` less its blank half (`isStorableText`), the sentence is FIX-07's for `q` (one function; FIX-07's constants are now built from it).
- Not a global pipe, on purpose: Nest runs global pipes before an argument's own pipes, so a global one would have replaced `ParseUUIDPipe`'s 400 on 59 GET path values. Last on the argument, every check that already refused a value keeps its answer.
- The pipe sits on every argument Nest pipes (bodies too, read by nobody: it hands every body, file and custom value back unread). Each pipe in a chain delays a refusal in that chain by one step; with one more on every chain, two refusals in two arguments still arrive in the order they did. Put on query and path values only, the first sweep found `POST /tgif/<NUL>/react` with an empty body answering the body's 400 instead of the date's; the spec now pins that race with a pipe that throws at once and one that answers a turn later.
- Its own refusal waits one turn (`setImmediate`), so a fault in another argument (an undeclared key, a bad body) answers as before.
- Enum and paging: `GET /shop/categories/<not a category>/subcategories` is 400 `category must be one of the following values: audio_music, ...` (the words `GET /shop/products?category=` already answers; `src/shop/product-category.pipe.ts`). `GET /admin/shop/orders`: a `fulfilment` outside the enum or sent twice is 400 `fulfilment must be one of the following values: awaiting_dispatch, dispatched, delivered`; a `page` or `perPage` that is not a number (or sent twice) is `page must be a number` / `perPage must be a number`; a `page` whose offset passes a 64-bit integer (`Infinity`, `1e18`, `perPage=1&page=9223372036854775296`) is `page must be a smaller number`. Every value that answered 200 still does, read as before (`page=0`, `-1`, `1.5`, `0x10`, `1e17`, `-Infinity`; `perPage=0`, `1000`, `1.5`, `Infinity`; an empty `fulfilment`). The check sits in `ShopAdminService.orders`, beside the clamps it depends on.
- `GET /search/closest` takes the same 100 characters as `GET /search` (`@MaxLength`, declared first so a missing, empty or repeated `q` keeps its old 400). The lock was checked first: its one closest probe is `q=Protectd suite` (14 characters), and it holds no `%00`, `\u0000` or longer `q`. Lock unchanged.
- The one NUL policy is written in the backend's `docs/contract/CONVENTIONS.md`, section 14.

**Files.** Backend: `src/storable-text/storable-text.ts`, `storable-text.pipe.ts` (new), `src/storable-text/tests/storable-text.contract.spec.ts` (new, 11 tests: the rule, and two copies of one controller, with and without the check, answering 30 requests byte for byte alike), `storable-text-hub.contract.spec.ts` (new, 37 tests on the full AppModule), `src/main.ts` (one call), `src/shop/product-category.pipe.ts` (new), `src/shop/shop.controller.ts` (the pipe on `category`), `src/shop/shop-admin.service.ts` (the orders check), `src/search-response/dto/closest-search-query.dto.ts` (the cap), `src/search-response/searchable-query.ts` (built from the shared rule and sentence), `contract/openapi.json` (regenerated: one line, closest's `maxLength: 100`), `docs/contract/CONVENTIONS.md`. Mobile: this file, `docs/LOG.md`, `SHARED-CHANGES.md` (FIX-17 #1, #2), `contract/openapi.json`, `contract/openapi.mobile.json`, `contract/SOURCE_COMMIT` (copied from the branch; `src/api/schema.generated.ts` regenerates unchanged), regenerated `tasks/INDEX.md` and `docs/PROGRESS.md`.

**Capability checks.**
1. *The 23 routes and the two enum and paging cases answer 400 naming the field, and byte-identically to main for clean text.* Spec: 28 exact bodies (each of the 23, plus `subcategory`, `/search`, closest and the orders `page`), the orders and subcategories refusals and the 200s they keep. Recorded sweep (below): on each of the 23, every NUL request that reached the route (five spellings, each caller the route lets in) answered 500 on main and the refusal naming its field on the branch; an anonymous caller still gets 401 on the signed-in ones, and a `/me/purchases?q=` under 2 characters keeps its `MinLength` 400. The enum and paging cases answered 500 on main and 400 naming the field here. Clean text byte-identical.
2. *A NUL anywhere in any query or path value of any GET route answers 400, never 500.* Sweep over every route the router mounts (213 GET, 149 others with a path value): branch 5xx for a request carrying a NUL: 0 caused by the NUL (8 x 502 remain, a NUL in a key the route never reads on the bills and WAWUCare reads, answered as on main because those providers are not configured here). Spec: a NUL in every declared query and path value of every GET route, as anonymous and as a signed-in caller (superadmin on admin routes), is 400 or a guard's 401/403/409; never 2xx, never 5xx. One declared field is not text by the time it is read (`GET /shop/products?wawuPick=`, a boolean): it answers as on main, never 5xx.
3. *`closest` refuses a `q` over 100 characters; the lock is unchanged.* Spec (101 characters, 4,000 words, 100 and a NUL: the length sentence; 100 characters: 200; missing, empty and repeated `q`: their old sentences) and sweep. `.pipeline/protected-registry.json` untouched.
4. *Protected routes 253/253:* `scripts/protected-routes/run.sh --fresh HEAD` (code `6bf2919`, lock `origin/main` `965280e`): 253/253, all 244 required. That suite builds its own app with the ValidationPipe only, so it checks the closest cap and the shop changes but not the new check; the new check changes only answers carrying a NUL or a lone surrogate, and the lock holds none.

**Recorded sweep** (`scratchpad/bf17/`: `plan2.json`, `sweep-m2.json`, `sweep-b2.json`, `analysis-2.txt`, scripts in `py/`). Main's Hub (`965280e`) and this branch's, both built, each on its own copy of one seeded database (prisma seed, the admin seed, and FIX-07's verifier's rows: content with `%`, `_`, `\`, accents, emoji and control characters, four more creators, two blocks), outbound HTTP sent to a dead proxy (nothing left the machine). Routes read from the router's own metadata (435; 213 GET). Clean values picked by trying real ids on main first, so clean requests reach their handlers (1,265 answers of 200 carry the seed's rows). Per GET route: clean; a NUL as `%00`, `a%00b`, `<value>%00`, `%00%00` and `%00<value>` in each path value; U+FFFD, broken UTF-8, `%01`, `%7F` and an encoded surrogate in each path and query value; per declared query key four clean values (an enum's first, `abc`, `1`, empty, blank), five NUL spellings, the key repeated with a NUL, a NUL beside an unknown key, two keys with a NUL; a NUL path value beside an unknown key, a bad query value and a NUL query value; a NUL in an undeclared key and in a key's name. Every other route with a path value: a NUL in each, with no body and with `{}`. Two faults and no NUL: a bad path value beside an unknown key or a bad query value (GET), beside `{}`, an unknown body key and no body (others). 6,716 probes x callers (anonymous, buyer, creator; anonymous and superadmin on admin routes) = 18,118 requests per build. Main asked twice: 16,557 of 16,590 byte-identical, the other 33 differ only in fields that change by themselves (time stamps, the dev wallet stand-in's generated account, token times, live cursors).
- Main against the branch: 17,384 byte-identical, 27 identical after masking those same fields, 707 differ, every one a request that answered 500 before or that carries a NUL:
  - 378 were 5xx, now the refusal (the 23 routes; also `GET /wallet/history?take=`, `GET /settings/privacy/export/download?token=%00&token=x`, `DELETE /marketplace/saves/<id>`, `PATCH` and `DELETE /users/me/experience/<id>`, `POST /legal/requests/<id>/payment/init`, and the bills reads, which answered 502 because the provider is not configured here).
  - 50 were 500, now the enum and paging 400s.
  - 279 carry a NUL and were not 500; now the refusal (decision 1): 165 were 404 (`/policies/<slug>`, `/communities/links/<slug>`, `/r/<code>` (its HTML not-found page), `/users/<id>/featured-works`, `/featured-works/<id>`, `/education`, `GET /settings/privacy/export/download?token=`, `GET /chats/<id>/messages?cursor=`, `/paid-dm/threads/<id>?cursor=`, and on writes `PATCH`/`DELETE /users/me/featured-works/<id>` and `/users/me/education/<id>`, `PUT /admin/featured-creators/<id>`); 90 were the handler's own 400 for a `cursor` it could not read (`/chats`, `/inbox`, `/live/catch-up`, `/me/earnings/sales`, `/me/notifications`, `/me/purchases`, `/me/saved`, `/paid-dm/queue`, `/paid-dm/threads`, `/paid-dm/threads/<id>`); 24 were 200 (`/users/me/featured-works?category=`, `/users/<id>/featured-works?category=`, and `DELETE /admin/featured-creators/<NUL>`, which answered `{"wawuId":"\u0000","featured":false}`).
  - Requests without a NUL: 9,074; 9,021 byte-identical, 21 identical after masking, 32 differ, all former 500s now the enum and paging 400s. Every two-fault request is byte-identical.
- Branch 5xx: 76, all answered alike by main and none carrying a NUL in a value the route reads: 66 x 502 (bills and WAWUCare not configured here) and 10 x 500 `GET /wallet/history?take=<not a number>` (finding below). The branch's Hub logged no error but those.
- Also (`plan3.json`, `sweep-m3.json`, `sweep-b3.json`): every declared query key sent twice and bracketed (`k=abc&k=abc`, `k=1&k=2`, `k[]=a`, `k[x]=a`), 2,616 requests per build: 2,610 byte-identical, 6 differ (the orders 500s, now 400s); two 500s remain alike on both (findings below).

**Mutants** (each applied to an archive copy of the branch, never the worktree; both specs run; `git restore`; tree clean after): 14 of 14 killed (failing tests of 48 in brackets). The refusal not waiting for the other arguments (1); the pipe on query and path arguments only (3); the pipe first instead of last (4); query values unchecked (20); a lone surrogate let through (3); a whole query object named `value` instead of its key (22); the pipe added again on a second call (1); closest without the cap (1); closest's cap checked first (1); the orders check without the offset bound (1), taking any `fulfilment` string (1), letting a NaN `page` through (1); subcategories without the category pipe (1); `src/main.ts` without the check (1). `scratchpad/bf17/mutants.json`, `mutant-M*.log`.

**Checks.** `npx tsc --noEmit` 0; eslint on the changed files 0; `src/storable-text` 48/48; `src/search-response` 62/62 (FIX-07's 41 and the module's 21; run with `--testTimeout=60000`, since at the 5 s default one test timed out with the machine at a load average of 40); `src/shop` 23/23 (alone; run in one jest process with the others on the host, its own mock WAWU ID did not come up in time and all 23 failed in `beforeAll`); full suite: @@FULL@@; gates 16 fail, 58 warn, 76 accepted, every fail and warn line the same as `origin/main`'s; `check_baseline.py` ok; tripwire: no added line matches; `npm run contract:build` leaves `contract/openapi.json` as committed (one line changed by this task, SHARED-CHANGES FIX-17 #1); mobile `npm run check` @@MCHECK@@. Staged diffs scanned for key-shaped strings: none.

**Merging with other branches.** `git merge-tree` against every `origin/wmt/*` branch: two conflicts come from this task's files. OPS-08 (PR #26) rewrites `src/shop/shop.controller.ts`'s subcategories handler to the 410 with no arguments: whichever merges second takes OPS-08's handler, deletes the `PRODUCT_CATEGORY_PIPE` import and `src/shop/product-category.pipe.ts`, and in `storable-text-hub.contract.spec.ts` drops the three shop rows of `NAMED` (`/shop/products?search=`, `?subcategory=`, `/shop/<slug>`) and the subcategories case: those routes then answer 410 before any value is read. The orders check in `ShopAdminService.orders` merges cleanly (OPS-08 keeps the queue). MONEY-17 also appends a section 14 to `docs/contract/CONVENTIONS.md`: keep both, the second renumbered.

**Decisions** (Default (agent), owner may override):
1. A NUL in a value a handler reads is refused even where the handler coped (279 answers above: 404, the handler's own 400, three 200s). Capability check 2 says a NUL in any query or path value answers 400; it is the FIX-07 precedent (`tab=communities`); none of these answers is in the lock, and every one carries a NUL, which no real link or id holds. It includes `/r/<code>`: a NUL code now gets the JSON 400, not the receipt check's HTML not-found page; every code a person can type still gets that page.
2. Guards answer first: a NUL from a caller without a token on a signed-in route is still 401, a person without a wallet still gets `409 wallet_not_open` on money routes, roles still 403.
3. Every method, not only GET (17 path values on writes reach a handler without their own pipe); request bodies are untouched, as the brief asks.
4. Money routes follow the rule with no money file edited: `GET /money/transactions?q=` and `/money/recipients?q=` stripped a NUL; for a person with a wallet the refusal now answers first, and a refused recipient search does not count towards the person's limit. The strip code stays for the money owner to remove (CONVENTIONS section 14).
5. FIX-07's own check in the `/search` handlers stays: over HTTP the new check answers first with the same sentence; it remains the guard for a direct call to the handlers, which FIX-07's spec makes.
6. The orders sentences (`page must be a number`, `perPage must be a number`, `page must be a smaller number`) are new copy: plain, no em-dash. Only what Prisma refused is refused; the clamps stay.
7. Non-NUL 500s found by the sweep outside this task's list are listed, not fixed (findings).

**Findings, for a follow-up.**
- `GET /wallet/history?take=<not a number>` (and `take` sent twice) answers 500 on main and here: the controller passes `Number(take)` (NaN) to Prisma's `take`. Legacy Flutterwave wallet code, left alone by this task's brief.
- `GET /settings/privacy/export/download?token=a&token=b` (a repeated `token`) answers 500 on main and here: an array reaches `verifyExportLink`. The route's own rule is one 404 for every failed link, so the fix is a `typeof token === 'string'` test before verifying (SETTINGS-04's file).
- Request bodies were not swept with a NUL (out of scope here); no body 500 was seen.

**NOT RUN.**
- V9 live: unblocked when this branch is merged and deployed (`GET /api/hub/users/public/%00` then answers the 400 above); agents do not call the live host. No app screen sends a NUL.
@@NOTRUN@@

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
