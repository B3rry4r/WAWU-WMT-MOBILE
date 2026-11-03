---
id: JOIN-TIERS
title: /join sells the app's three tiers; a paid registration is claimed automatically
owner: YOU
area: WEB
order: 290
priority: launch
repo: wawu-backend, wawuafrica
type: money-path
status: doing
depends_on: [JOIN-03, STORE-SEED]
decisions: [R-125, R-48, R-89]
passes: [V1, V2, V3, V4]
artboards: []
---
# JOIN-TIERS · /join sells Verify, Verify Plus and Founding Maker

## Current state

Hub half built on branch `wmt/JOIN-TIERS` (JOIN-TIERS-HUB). Website half (JOIN-TIERS-WEB) not started.

Done in the Hub:
- `GET /waitlist/tiers` (public), tier on registration, tier-aware code check, per-tier admin ceiling.
- Claim by access code and the automatic claim share one transaction and the store's tier grant.
- The automatic claim runs on `GET /me/tier` and `GET /me/tier-offer`.

## Routes for the web builder (all under `/api/hub`, public, one error shape, `Cache-Control: no-store`)

1. `GET /waitlist/tiers`
   `{ currency: "NGN", bestTier: "founding", tiers: [{ id, name, priceKobo, days, products, bonusPoints, eventPass: { id, name, benefits? }, badge: { id, numbered }, packBonusPercent, firstVoiceIntroIncluded, best }] }`
   Order is the app's: verify, plus, founding. Draw the benefit lines from these fields (R-108 words): length, products, points, event pass name, "Numbered Founding badge" when `badge.numbered`, "N% bonus on points packs" when `packBonusPercent > 0`. `best` marks the preselected card.
2. `GET /waitlist/offers/current` is unchanged. Keep sending its `id` as `offerId`.
3. `POST /waitlist/registrations` takes an optional `tier` (`verify`, `plus`, `founding`). The answer is as before plus `tier`. `amountKobo` is the tier's live price, or the code's price when the code applies to that tier. A tier the Hub does not sell answers 400 `reason.code` `tier_invalid`. Without `tier` it is exactly the old registration. If `amountKobo` differs from the button the page shows, do not open the payment window: re-price (as today).
4. `GET /waitlist/referral-codes/{code}?tier=plus` answers `{ code, applies, reason?, priceKobo, tier, forTier, message? }`. `applies:false` with `reason:"other_tier"` carries a plain sentence in `message` to show as it is. Without `?tier=` it answers exactly as before. Re-check on every tier change. `reason` can also be `full` or `inactive`.
5. The page must show: Verify with a code applied at the code's price; Plus and Founding at full price, with a short line saying the code is for Verify.
6. After payment the page says: sign in to the app or website with the same email or phone you paid with and the plan appears. No code is needed (R-125). The access code may still be shown as a fallback.

## Rules that hold

- The 39 paid registrations (offer `event-oct-2026`, no tier) stay claimable as Verify for 365 days.
- A web join gives what a store purchase of that tier gives (upgrade a smaller running tier, otherwise add days); nothing moves in the Hub ledger.
- Admin: the registrations list and summary carry `tier` and `claimedVia` (`code` or `auto`); the CSV adds `Tier` and `Claimed how` only with `includeTier=true`.

## PHONE CHECK (the owner, before the update)

Sign in on a phone (build 9 or 7) with the email or phone used to pay on /join, with that contact confirmed in the app. The plan appears under Your tier with no code typed. Then pay for a second, different tier with another contact of the same account and check the bigger tier shows.
