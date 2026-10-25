---
id: FIX-17
title: A bad character or value in any query answers 400, not 500, across the Hub
owner: YOU
area: FIX
order: 196
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: [FIX-07]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-17 · A bad character or value in any query answers 400, not 500, across the Hub

## Current state

As of 17 Oct 2026 (H1 bundle, Sonnet builder, round 2 fix, tests only).
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/H1.md`: FIX-17 behaviour right, one medium for CI shard 3 that the test-only round 2 fix `13fe440` closed; the lead saw the branch checks of `13fe440` all green on 17 Oct). Stacked in batch 11 by MERGE-11 (backend `13fe440` merged into `wmt/MERGE-11`, no conflict, no migration; mobile H1 `00ee90b8`). The verifier's lows are in `tasks/SWEEP-MONEY.md` (4 rows: FIX-53 F2 and F3, FIX-17 F5 and F6).
- **Branches:** backend `wmt/H1` `13fe440` (tests only on top of `a5d0a7d`) = `origin/wmt/MERGE-9` `4e444ca` + `wmt/FIX-17` `6726b3c` merged (one conflict, CONVENTIONS section 15 now sits between 14 and 16) + the D1/D3 commit + the docs line. Mobile `wmt/H1` (this commit): this file, the contract copy, SHARED-CHANGES, LOG. The earlier `wmt/FIX-17` branches are folded in; do not merge them again.
- **Merged and live:** nothing of this task (it is in `wmt/MERGE-11`, not on main).
- **Done this round:** D1: `src/hub-app-config.ts` `configureHubApp(app)` holds everything `main.ts` did between creating the app and listening, including the check; `main.ts` is now create, `configureHubApp`, listen. The Hub spec builds its app with the same function and pins (comments stripped by the compiler) that `main.ts` calls it once, right after creating the app, with no `init()` in `main.ts` or in `configureHubApp`. D3: the sweep spec allows 410 for a retired shop route.
- **Open findings:** none for the fix round. D2 was ruled by the lead and is done (below). Verifier lows stay on the sweep list: `GET /wallet/history?take=`, a repeated `token` on the export download (both 500 on main), the protected suite not wiring the pipe.
- **Fix round (CI run 39048156767 shard 3 red):** `hub-rate-limits` and `body-parser-refusals` read `src/hub-app-config.ts` for the settings and filter and still check `main.ts` creates the app with `HUB_APP_OPTIONS` and calls `configureHubApp(app)`; `money-recipient` and `explore` build their apps with `configureHubApp` and expect 400 for a NUL. Ruled changes, no assertion weakened (SHARED-CHANGES FIX-17 #4).
- **Next:** the batch 11 pull request. OPS-08 (PR #26) is still unmerged: follow SHARED-CHANGES FIX-17 #3 when it merges (the 410 allowance is already in).

Status set to review by the records sync, 25 Oct 2026: merged as backend aef2c337, verifier PASS in this file (H1 verifier: behaviour right; the one medium closed by the test-only round 2, branch checks green).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-17.md](history/FIX-17.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
