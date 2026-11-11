---
id: TIER-RENEW
title: Renew shows only when a tier is ending or has ended
owner: YOU
area: CREATE
order: 378
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: review
depends_on: []
decisions: [R-132, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# TIER-RENEW · Renew shows only when a tier is ending or has ended

## Current state

As of 10 Nov 2026.
- **Status:** review (lead, 11 Nov 2026): verified MERGE with no findings (`wmt/TIER-RENEW-verify` df61324e), merged into `wmt/BATCH-1111` for main.
- **Done:** `YourTierScreen.tsx` draws Renew only when the Hub's state is `ending` or `ended` (and the tier is sold). Upgrade is unchanged (drawn when a higher tier exists); an active highest tier (Founding Maker) has no buy button.
- **Grep of every Renew offer:** `your-tier-renew` was the only button. `checkout.tsx` takes `kind=renew` only from that button; the tier offer, Me (the meter says "Until"/"Ends", never Renew), push routes (pass reminder only) and the web-wallet path (`webwallet/api.ts`, a spec for the checkout) draw no Renew for the held tier. Nothing else changed.
- **Pictures:** /tmp/wmt-shots/tier-renew/ (verify-active, founding-active, ending, ended; 390 light and dark, 1440 light and dark), looked at; board `VF14a` rendered to build/design_shots/. Web export served behind vercel.json's headers (CSP's api, id and ws hosts swapped for the stack's, CORS headers added by the browser harness), against stack `tr` with wawu-id. The tier end dates were set by SQL in my own `tr` database (+300 days, +3 days, -3 days); the Hub computed the states.
- **Tests changed because R-132 changes the expected value:** `publishAndTier.test.tsx` "a user sees the Hub's dates..." (active Verify used to expect Renew and open the checkout; now expects Upgrade and no Renew; the Renew press moved to new ending/ended cases); `productsFullStore.test.tsx` "a tier the store does not sell has no price on Renew" (held tier state `active` became `ended`, same assertions). Added R-132 cases: active Verify and active Founding Maker on ios and android, ending and ended on ios and android.
- **PHONE CHECK:** none new (a button is drawn or not).
- **NOT RUN:** a real phone; the checkout reached by a typed `/checkout?kind=renew` URL is not blocked (not an offer).
- **Verifier (T1):** MERGE, no findings; report in history/TIER-RENEW.md.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-132, R-47

## Goal

A person on an active tier is never offered Renew; a person whose tier is ending or has ended is.

## Scope

- Your tier: Renew only for `ending` and `ended`; Upgrade as now when a higher tier exists; the highest tier while active shows no buy button.
- Every other place that offers Renew for the held tier (grep: the checkout, Me, the tier offer, notifications) follows the same rule.
- Phone and web alike (shared screens).

## Capability checks

- [ ] A person on an active Verify sees Upgrade and no Renew; on an active Founding Maker sees no buy button.
- [ ] A person whose tier ends within the Hub's window, or has ended, sees Renew with its price.
- [ ] Pictures of each state at 390 light and dark and at 1440.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/TIER-RENEW.md](history/TIER-RENEW.md).

## Owner sign-off
