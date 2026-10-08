---
id: FIX-17
title: A bad character or value in any query answers 400, not 500, across the Hub
owner: YOU
area: FIX
order: 196
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
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

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
