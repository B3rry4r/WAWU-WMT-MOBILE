---
id: WEBAPP-06
title: On the web, paid things are paid from the wallet, and bills work
owner: YOU
area: WEB
order: 366
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: verifying
depends_on: []
decisions: [R-127, R-128, R-44, R-86, R-101]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WEBAPP-06 · On the web, paid things are paid from the wallet, and bills work

## Current state

As of 9 Nov 2026.
- **Status:** verifying. Built by the WEBAPP-05/06 bundle builder on branch `wmt/WEBAPP-05`.
- **Done:** on the web build a tier (and renew, upgrade), a points pack, the upload pack, a WAWU Credits pack and a community pass are paid from the wallet through the Hub's existing wallet routes at the list price (PIN, `Idempotency-Key`, the signed quote; the shared pay sheet shows the shortfall and Add). The phone is unchanged (R-86).
- **Bills:** the other path of the ticket. No bills entry is drawn on the web (Home card, Wallet tab; `/bills` goes home), because the payment window needs the provider's real sandbox and keys, which this task cannot reach (the stack has no bills provider, no key file was opened). `src/features/bills/offered.ts`, tested. `CheckoutModal.web.tsx` is not built.
- **No Hub change:** every route existed (`plans/purchases`, `credits/purchase/wallet`, `communities/{id}/pass`).
- **Defaults taken:** Restore purchases is not drawn on the web; a plan list in a currency other than naira draws nothing (R-16); the fees on the sheet are the Hub's quote; the web's unlock, tip, ask and ticket wallet paths are untouched.
- **PHONE CHECK:** none new (the phone app is unchanged); a phone browser on usewmt.com paying a tier from the wallet is worth one run.
- **NOT RUN:** a pass bought end to end on the stack (no community with a pass was seeded; the code path is typed and shares the flow, not exercised); the "confirming" and "failed" pay-sheet states in pictures (the stack stand-in settles at once); a real bill on the provider sandbox; the upload pack purchase (the Hub refused the quote for a person holding the Verify tier with `pack_not_allowed`, its own rule).
- **Next:** the verifier runs the money attacks again on its own stack.

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
