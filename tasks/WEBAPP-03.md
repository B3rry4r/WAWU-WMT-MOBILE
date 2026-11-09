---
id: WEBAPP-03
title: The web app's small seams work in a browser
owner: YOU
area: WEB
order: 363
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-127, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-03 · The web app's small seams work in a browser

## Current state

As of 9 Nov 2026.
- **Status:** verifying. Built on branch `wmt/WEBAPP-02` (bundle WEBAPP-02, 03, 04), mobile and Hub worktrees.
- **Branches:** mobile `wmt/WEBAPP-02`; Hub `wmt/WEBAPP-02` (aae111a, CORS only; no merge, a Hub merge deploys).
- Share: `src/lib/share.ts` (`shareOut`) replaces all 20 `Share.share` call sites; note `shareNote.tsx`. Return: `returnPath.ts`. Abroad new: failed or wallet-less read leads to Open your wallet or a Try again. Tier offer once per tab (sessionStorage). Alert sound row not drawn on web. Hub: `exposedHeaders: ['Retry-After']`.
- **Open findings:** none known. NOT RUN and PHONE CHECK items are in the report in `tasks/history/WEBAPP-03.md`.
- **Next:** the bundle's lean verifier.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-03.md](history/WEBAPP-03.md).

## Owner sign-off
