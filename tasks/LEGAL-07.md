---
id: LEGAL-07
title: Admin screens: legal prices
owner: YOU
area: LEGAL
order: 73
priority: launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: [LEGAL-03]
decisions: [R-14]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# LEGAL-07 · Admin screens: legal prices

## Current state

As of 24 Oct 2026, verified by a Sonnet verifier (T1, bundle B13): PASS. Dashboard `wmt/ADS-02` `0d16895`; status review; nothing is merged or live.

- Every capability check passed live: a price set in the dashboard is what the user's `GET /legal/consultation/options` returns on the next call (₦50,000, 45 minutes), a user token is 401 on every price route, reviewer 403, support reads only, finance reads and writes.
- `CONSULTATION_FEES` has no reader left; the legal queue footer links to the prices screen.
- One low for the sweep (F1: Chat is shown as offered "in the app", the app does not list chat). One note (N1: the contract is pinned to `8fca5dd`; re-pin at merge).
- Inherited gate failure `finance/payouts/page.tsx:39` is identical on dashboard main.
- **Next:** the merge agent (one dashboard PR for ADS-02, LEGAL-07 and SCHOOLS-05); re-pin the contract at the merge ref.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LEGAL-07.md](history/LEGAL-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
