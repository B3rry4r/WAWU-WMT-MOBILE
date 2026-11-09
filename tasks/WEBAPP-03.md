---
id: WEBAPP-03
title: The web app's small seams work in a browser
owner: YOU
area: WEB
order: 363
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-127, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-03 · The web app's small seams work in a browser

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-00 readiness check (`docs/analysis/WEB-APP-READINESS.md`).
- **Next:** a builder starts from the brief below.
- **History:** none yet. Reports go to tasks/history/WEBAPP-03.md.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

The everyday paths behave in a browser the way they do on a phone: share works everywhere, a link opened while signed out lands on that page after sign-in, every route draws, and the tier offer does not come back on every page load.

## Scope

- A web share helper used by every `Share.share` call (about 30, readiness section 2): `navigator.share` where it exists, otherwise copy the link or text with a plain "Link copied" note; no false failure after a good share.
- Sign-in return: a signed-out visitor to any app path is sent to sign in and lands back on that path (today only `/r/<code>` is kept).
- `/send/abroad/new` draws for a signed-in person without a wallet (today blank).
- The tier offer (`tier_offer.every_start_on`): on the web a "start" is a browser session, not a page load.
- On the web, entries whose feature cannot work in a browser (push switches in Settings, the invite card Save, the subtitles row) are not drawn (R-47); never a dead button.
- Hub: `exposedHeaders: ['Retry-After']` in the CORS setup (wawu-backend `src/hub-app-config.ts`, additive).

## Capability checks

- [ ] A user on desktop Chrome taps Share on a receipt, a piece and their profile and gets the link copied with a note; on a phone browser the system share opens.
- [ ] A signed-out user opens a usewmt.com piece link, signs in, and lands on that piece.
- [ ] A signed-in user without a wallet opens /send/abroad/new and sees the screen (or the open-wallet step), not a blank page.
- [ ] A tierless user sees the tier offer once per browser session, not on every refresh.
- [ ] A user sees no control on the web that does nothing.

## Builder report

## Verifier report

## Owner sign-off
