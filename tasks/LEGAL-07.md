---
id: LEGAL-07
title: Admin screens: legal prices
owner: YOU
area: LEGAL
order: 73
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: [LEGAL-03]
decisions: [R-14]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# LEGAL-07 · Admin screens: legal prices

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B13), dashboard branch `wmt/ADS-02` `0d16895` (wawu-dashboard, on the ADS-02 branch `95e1085`), mobile `wmt/ADS-02` (records). Status verifying; nothing is merged or live. No backend change: the screens use LEGAL-03's three routes on backend `8fca5dd` as they are.

| # | Before | After |
|---|---|---|
| 1 | staff had nowhere to set a legal price; the legal queue footer quoted the old code constants (₦25,000 and ₦45,000) | `/legal/prices` ("Legal prices" under Services): each consultation kind's price, length and switch, and each fixed-price service's price, with what the app offers read from the server's `offered` |
| 2 | `CONSULTATION_FEES` is gone from the backend, so the ops generator failed on it | the ops generator no longer reads it; `CONSULTATION_FEE_OPTIONS` is removed from the generated file; the queue's footer links to the prices screen; the matter's consultation label no longer reads a price table |
| 3 | `ConsultationMedium` had no phone | `phone` comes with the regenerated contract; the label map has all four kinds |

Capability checks, live on the stack: an admin sets Video call to ₦50,000 and 45 minutes in the browser and a user token's `GET /legal/consultation/options` then returns `minutes 45, priceKobo 5000000` (the app's next quote); the fixed price of CAC registration and of tax registration is set and cleared the same way; a user token is 401 on `GET` and `PUT` of every price route; reviewer is 403 on both, support reads (200) and is refused the write (403), finance reads and sets (200). Pictures `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13/` `legal-1` to `legal-6` at 1440 px (the list as the migration seeded it, the edit modal, after save, a price with no length held as not offered, the service edit, after save).
- **Next:** a verifier session.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Legal prices are set by WAWU in admin, never in the app or in code (R-14). Today they are code constants
(`CONSULTATION_FEES`); this gives staff the screen that sets them.

## Scope

Dashboard screens over LEGAL-03's price settings: the price and length of video, phone and in-person
consultations, and the price of each fixed-price service (for example business name registration).

## Capability checks

- [ ] An admin can set the price and length of a video, phone and in-person consultation and the price of each fixed-price service.
- [ ] After an admin changes a price, the app shows the new price on the next quote and charges it.
- [ ] A user token is refused on every price route.

## Builder report

Built by a Sonnet builder, bundle B13, 24 Oct 2026. Dashboard `wmt/ADS-02` `0d16895`; mobile `wmt/ADS-02` (this file, `BACKEND_GAPS.md` G-1725, `SHARED-CHANGES.md` B13 #1, `docs/LOG.md`). **No backend change.**
- **Files (dashboard):** new `src/app/(app)/legal/prices/page.tsx`, `src/components/legal/LegalPriceModals.tsx`, `src/lib/api/legal-prices.ts` (and its barrel exports); `src/components/layout/nav.ts` ("Legal prices"); `src/app/(app)/legal/page.tsx` and `src/components/legal/LegalRequestDetail.tsx` (the code-constant fees removed); `scripts/generate-contract-types.mjs` (the prices controller, views, DTOs, `MIN_CONSULTATION_MINUTES`, `MAX_CONSULTATION_MINUTES`, `DEFAULT_MERCHANT_MAX_PER_TXN_KOBO`) and `scripts/generate-ops-contract.mjs`. No response shape is written by hand.
- **Behaviour:** a price is typed in whole naira and sent as kobo (the only factor of 100 is `nairaToKobo`); the bounds are the server's (₦1 up to the per-transaction ceiling, 5 to 480 minutes); an empty price or length is sent as null, which leaves a call not offered, and the screen says so before saving; Save is held when nothing changed; Clear price sends null so the service is quoted. Roles are `ROUTE_ROLES`: superadmin and finance edit; support reads with no controls; reviewer sees "Not your screen".
- **Defaults (agent), owner may override:** the price screen is its own page and not a tab on the legal queue; an in-person kind may be saved with no price and no length ("On request"), as the server allows; the labels are the app's (Video call, Phone call, In person, Chat).
- **Dashboard checks:** `npm run check` exit 0 (contract and ops contract at `8fca5dd`, `tsc` 0, eslint 0 errors and the one existing `SHOP_DTO` warning, invariants clean, contrast 58 pairs); `npm run build` exit 0 (adds `/legal/prices`, `/schools`, `/schools/new`, `/schools/[id]`); `python3 scripts/gates/run.py` 1 fail, 0 warn, 6 accepted, the same `finance/payouts/page.tsx:39` deferral as before this bundle. The contract check needs `HUB_API_PATH=/home/user/wawu-backend HUB_API_REF=8fca5dd WAWU_WEB_PATH=/home/user/wawuafrica`.
- **Not done:** the per-route tests (the dashboard has no test runner for components; the behaviour above was driven in the browser and over HTTP). Role pages for support and finance on the price screen were checked over HTTP and in code, not pictured.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
