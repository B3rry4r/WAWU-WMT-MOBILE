---
id: WEBAPP-07
title: The whole web app walked as every kind of user
owner: YOU
area: WEB
order: 367
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: review
depends_on: [WEBAPP-01, WEBAPP-02, WEBAPP-03, WEBAPP-04, WEBAPP-05, WEBAPP-06]
decisions: [R-127]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-07 · The whole web app walked as every kind of user

## Current state

As of 9 Nov 2026.
- **Status:** review. Walked 9 Nov by three fresh Sonnet walkers on mobile ffdc271 and Hub main 7dd5b22 (brief `docs/release/WALK-WEB.md`): A arriving, B money, C making. All three FAIL.
- **SERIOUS:** every web wallet purchase is a dead button (the export bundles the inert phone hook, `useWebBuy.ts` beside `useWebBuy.web.tsx`); the site's CSP blocks the live socket (`wss://api.wawuafrica.com` missing). Mediums and lows: WEBAPP-08.
- **Passed:** sign-up through the real WAWU ID, sign-in return, invite links, the tier offer once per session, Settings, share, opening a wallet with the hosted selfie in the same tab, every V8 money attack on wallet sends (ledger equals the stand-in), photo and voice uploads read back clean, paid pieces, paid questions, event hosting, the 1440 column. The export built as Vercel does (fresh clone, `npm ci`, `npm run web:export`) has one React and draws every page.
- **Gaps:** few pictures looked at one by one (A about 30 of 165, B about 20 of 211, C about 60 of 186); the walk after WEBAPP-08 looks at every picture.
- **Next:** WEBAPP-08 (the fix batch), then this walk again on the new batch head.
- **History:** tasks/history/WEBAPP-07.md (the three reports).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

Before usewmt.com goes live, fresh walkers use the merged web app as a guest, a new user, a person without a wallet, a wallet holder, a buyer, a creator and a verified user, at 390 and 1440, from a cold start and from a refresh, and every money path on the stack. Nothing goes live until it passes (owner hard rules 5 and 6).

## Scope

- Read only: no code changes. Findings go to `tasks/SWEEP-WEB.md` and a fix batch.

## Capability checks

- [ ] A user of each kind finishes every path they can take on the phone app, in a browser, at both sizes, with pictures beside the boards.
- [ ] Every money path that works on the phone completes on the web on the stack, and every attack in V8 fails.

## Builder report

## Verifier report

## Owner sign-off
