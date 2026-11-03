---
id: WEB-HOLD
title: Pieces from the new web upload flow wait for the creator's wallet before they go live (R-126)
owner: YOU
area: CONTENT
order: -1270
priority: launch
repo: wawu-backend
type: backend-endpoint
status: built
depends_on: []
decisions: [R-126, R-101, R-118, R-6, R-11, R-8]
passes: [V1, V2, V3]
artboards: []
tier: T2
---
# WEB-HOLD · Collect web uploads, show them after the wallet step

## Current state

As of 3 Nov 2026, built by a Sonnet builder (T2), Hub `wmt/WEB-HOLD` from `origin/main` `6c5cf82`. Hub only: no app change. Not deployed.

| What | Where |
|---|---|
| The marker | request header `X-Wawu-Client: site` (`src/price-list/app-client.ts`, `isSiteRequest()`); the app sends `app`, today's web sends none |
| Price list | with `site` or `app`, a paid price off the list is refused with the app's `price_not_on_list` (nearest prices in the answer); without either, as before |
| Preview | with `site` and no `previewAsset`, the Hub cuts it (`previewFromFile` is implied); send none |
| Places, tier | unchanged: `POST /uploads/presign` and `POST /content` answer 402 `tier_required` / `product_limit_reached` exactly as for the app; places come from `GET /creator/state` `slotsTotal` |
| The piece | stored `uploadedVia = 'site'`, status `pending` |
| Approval | admin approve: with an open wallet (row in the wallet table, as `WalletGate.requireOpen`) it is `live`; without, `status` stays `pending` and `heldForWalletAt` is set |
| Release | the wallet row being written by the Nuvion `accounts.ts` recorder (production runs WALLET_PROVIDER=nuvion). Under WALLET_PROVIDER=fintava held pieces are NOT released automatically; accepted, because Fintava is not used. The legacy `WalletOpeningService.record` is untouched sets every held piece of that person `live` in the same transaction; an advisory lock per creator serialises it against an approval |
| Owner reads | `GET /content/mine/library` and `/mine/library/:id`: `waitingFor: "wallet"` or `null`. `GET /content/mine`: the key `waitingFor` appears only on a held piece |
| Admin | queue leaves held pieces out; `GET /admin/content/queue?held=only` lists them |

### For the web builder (WEB-UPLOAD)

- Send `X-Wawu-Client: site` on `POST /uploads/presign`, `POST /content`, `GET /creator/state`, and the price list read `GET /prices`. Do not send `app`.
- Folders: `content/full`, `content/cover` (cover picture, png/jpeg/webp, at most 5 MB). No `content/preview`. A picture piece sends its own smaller copy as `previewAsset` (the Hub cannot cut a picture); audio, video and pdf paid pieces send none.
- Read the library with `GET /content/mine/library` (it carries `coverUrl`, `rejectionReason` and `waitingFor`). Say, for `waitingFor === "wallet"`: "Approved: goes live when you open your wallet in the app". `status === "pending"` with `waitingFor === null` is "In review".
- Courses: the lesson route (`PUT /content/:id/lessons`) does not look at the client, but the web has not proven a course end to end; the web offers no course kind until it does.

### Web side: WEB-UPLOAD (3 Nov 2026)

Web `wmt/WEB-UPLOAD` f5eee9a (from `wmt/BRAND-SITE` c1e171a), not deployed. Join-only mode now also opens `/sign-in`, `/sign-up`, `/forgot-password`, `/create/new`, `/create/library`, each served by a trimmed page (`src/app/upload-site/`). Every content and upload write sends `X-Wawu-Client: site`. Walked on a local stack (Hub with WEB-HOLD and JOIN-TIERS merged): paid /join email, web sign-up, tier Verify with 4 places, upload with cover at a list price, In review, admin approve, "Approved. It goes live when you open your wallet in the WAWU app", wallet opened with the stand-in, Live.

### Not changed (proof)

The protected route suite (`src/protected-routes`, 253 tests) passes: no response widened. The two new columns are never served as they are (public piece shapes, search, feeds). `src/search-response/tests/search-app-links.contract.spec.ts` computes "the stored row" and now leaves out the two new columns as it leaves out `coverKey` (one helper, `asBefore`).

## PHONE CHECK (owner, on the phone, before the update)

1. A person who uploaded on the site and was approved, with no wallet: in the app, the piece is not visible to anyone else.
2. That person opens their wallet in the app (R-6): within a minute the piece shows in their profile and the feed.
