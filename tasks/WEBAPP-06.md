---
id: WEBAPP-06
title: On the web, paid things are paid from the wallet, and bills work
owner: YOU
area: WEB
order: 366
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: building
depends_on: []
decisions: [R-127, R-128, R-44, R-86, R-101]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WEBAPP-06 · On the web, paid things are paid from the wallet, and bills work

## Current state

As of 9 Nov 2026.
- **Status:** back to building for round 1 (verifier FIX). Open defects: F1, F2 (and F3 for the bundle branch).
- **Verifier:** see tasks/history/WEBAPP-06.md, last section. Fix list: F1 (Add on the pay sheet to /add-money), F2 (guard every bills route), F3 (remove the node_modules symlink).
- **NOT RUN by the verifier:** hosted selfie on the stack, amount keypad in a browser, credits pack and /tiers pictures, expired quote.
- **Next:** a patch brief for F1 to F3; the verifier re-checks those ids.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

A person on usewmt.com can buy a tier, a tick, points, WAWU Credits and a community pass from their wallet (R-128), and pay a bill, where today the screens say “Buy in the app” or show a red error.

## Scope

- `src/features/store/iap.web.ts` and the screens it feeds (`/tiers`, `/checkout`, `/points-buy`, `/tier-offer`, credit packs, community pass): on the web, the wallet path through the Hub's existing wallet routes (the website's routes, R-44), at the list price with no store cut, PIN and `Idempotency-Key` as for every wallet payment. The phone app is unchanged (R-86). If a Hub route is missing, say which and add it additively in wawu-backend in this task.
- `src/features/bills/CheckoutModal.web.tsx` (new): the bills payment window without a WebView, on the provider's real sandbox. If the real sandbox cannot be reached by this task, the bills entry is not drawn on the web (R-47) and the task says so; never a dead button.

## Capability checks

- [ ] A user on the web buys a tier and points from their wallet with their PIN; the wallet moves once, the tier and points are granted once, and a double tap and a replayed request charge once (V8).
- [ ] A user with too little in the wallet sees the shortfall and the way to add money, as on the phone.
- [ ] A user on the web pays a bill end to end on the provider's sandbox, or sees no bills entry on the web.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-06.md](history/WEBAPP-06.md).

## Owner sign-off
