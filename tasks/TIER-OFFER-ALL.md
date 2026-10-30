---
id: TIER-OFFER-ALL
title: The tier offer is asked of the Hub for every signed-in account type, on every start, and shown exactly when the Hub says so (R-105)
owner: YOU
area: VERIFY
order: -10960
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-94, R-105, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# TIER-OFFER-ALL · "Choose your tier" is the Hub's call, for everyone

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/TIER-OFFER-ALL` on `origin/wmt/WALLET-BLANK` `1027c90f` (what the phones get next). App only: no Hub change, no `package.json` or `app.json` change, no native change. Status verifying, not verified.

Owner, 30 Oct 2026: the tier offer should pop up for signed-in people, not once. R-105 (lead ruling, written into `DECISIONS.md` here) amends R-94 lead defaults 1 and 2. The Hub (`wmt/STORE-SEED` `8ec8a24`, not deployed yet) decides: every app start, any account type, no running tier, while the setting `tier_offer.every_start_on` is on (default on). The close button rule is unchanged.

| # | Before (`1027c90f`) | After |
|---|---------------------|-------|
| 1 | `useTierOfferStep(asked, accountType)` skipped the Hub for `accountType === 'user'` (a buyer): never asked, never offered, never held the splash | `useTierOfferStep(asked)`: the account type is not passed; the Hub is asked once per start for every type and the offer is shown exactly when it says `show` |
| 2 | the second look after the sign-up wrote the account type (the Hub may have had no profile when first asked) was made only when the write left a creator | made after a write of either type; a start that wrote nothing still asks once |
| 3 | comments said "shown once", "a creator account not yet shown it", "a fan has no shop for a tier to unlock" (`offerStep.ts`, `api.ts`, `TierOfferScreen.tsx`, `src/app/tier-offer.tsx`, `src/app/_layout.tsx`, `accountTypeWrite.ts`) | say the Hub decides who and how often (R-105); `settleTierOffer` still tells the Hub the offer was drawn, once per start, and the Hub's setting decides what that does |
| 4 | R-94 lead defaults 1 and 2 stood | R-105 added to `DECISIONS.md`, R-94 carries an "Updated by R-105" line |

Where the offer sits in a new person's sign-up order is unchanged (R-94, FIX-P5): after the email, name and access-code steps, before "Set up your account", "Your bonus" and Home. A buyer who closes it (X, or "Not now" when the Hub turns the X off) goes on to Home, as a creator goes on to the next step. The close button rule is untouched.

### The old Hub (live until STORE-SEED is deployed)

It answers `{ show: false, closeButton: true }` for a buyer. The app then draws nothing, marks nothing (`POST /me/tier-offer/seen` is not sent), releases the splash as soon as the answer arrives and goes to Home. A new buyer whose account type was just written gets one more ask after the write, answered no again, at most one more bounded wait of 2.5 seconds. No error, no empty screen. The offer appears on the next start after the Hub is deployed, with no new app build. Test: `tierOfferWalk.route.test.tsx`, "the Hub that has not been updated answers no for a buyer".

### Red first

Before the code change, `tierOfferWalk.route.test.tsx` was run with the four new buyer tests: 4 failed (a buyer was never asked: 0 calls to `GET /me/tier-offer`), 2 passed (the creator tests). After: 6 of 6.

### Every changed assertion and test

| File | Change |
|------|--------|
| `offerStep.test.ts` | REMOVED the test "never asks about a discoverer account (a fan has no shop for a tier to unlock)" (it asserted `fetchTierOffer` not called for `'user'`). It pinned the defect R-105 removes. Replaced by "decides nothing itself: it shows the offer for whoever the Hub says show to, and for nobody else, and asks again on every start (R-105)": a yes shows the offer, the app is "restarted" (`resetTierOffer`), the Hub is asked again and shows it again, the Hub told twice it was drawn (once per start), a no ends it. |
| `offerStep.test.ts` | REMOVED the `it.each` row "a write that left the account a fan's" (asserted `fetchTierOffer` called once). It pinned "creators only" for the second look. Replaced by "asks once more after a write that left the account a buyer's, too" (asked twice, shows on the second answer) and "a Hub that has not been updated answers no to a buyer both times" (asked twice, nothing shown, `markTierOfferSeen` not called). |
| `offerStep.test.ts` | describe title now names R-105. The other 16 calls changed from `useTierOfferStep(x, 'creator')` to `useTierOfferStep(x)` (the argument is gone); no other assertion in the file changed. |
| `sessionChange.test.ts` | the 4 calls changed the same way; no assertion changed. |
| `tierOffer.route.test.tsx` | the label of one `it.each` row, "a fan, or a person already shown it, or one who holds a tier", is now "a person the Hub does not offer it to (...)". The Hub's answer and the assertions are unchanged. |
| `tierOfferWalk.route.test.tsx` | the stand-in progress and the account-type write are now parametric (`mockAccountType`, default `creator`); the two creator tests and their assertions are unchanged. ADDED 4 buyer tests: a new buyer signs up and is offered the tiers before Home (2 asks, type written, Close to Home); a buyer who opens the app signed in is asked and shown it (1 ask); a buyer started again after closing it is shown it again when the Hub still says show; the old Hub's no for a buyer draws nothing and sends no mark. |

## Read first

- `DECISIONS.md` R-94 and R-105; `docs/WORKFLOW.md`
- `src/features/tier-offer/offerStep.ts`, `src/app/_layout.tsx` (the guards), `src/features/auth/accountTypeWrite.ts`
- Backend `wmt/STORE-SEED` `8ec8a24` (the setting, `GET /me/tier-offer` for every account type)

## Goal

A signed-in person with no running tier is shown "Choose your tier" on every app start, whatever their account type, as long as the Hub says so. The app never decides "once" or "creators only".

## Scope

`wawu-wmt-mobile` only: `src/features/tier-offer/` (`offerStep.ts`, `api.ts`, `TierOfferScreen.tsx`, five test files), `src/app/_layout.tsx` and `src/app/tier-offer.tsx` (call and comments), `src/features/auth/accountTypeWrite.ts` (comments), `DECISIONS.md` (R-105), this file, `docs/LOG.md`, `tasks/INDEX.md`. No route is added, so `route-guard.test.tsx` is not in play. The fingerprints do not move (Android `c2474bd9`, iOS `240378f1`).

## Capability checks

- [x] A buyer who opens the app signed in with no running tier is asked and shown the offer; Close goes on to Home (`tierOfferWalk.route.test.tsx`).
- [x] A new buyer's sign-up asks the Hub, asks once more after the account type is written, and shows the offer before Home.
- [x] A creator's walk is as before (the two TIER-OFFER walk tests pass unchanged).
- [x] The Hub that has not been updated answers no for a buyer: nothing is drawn, nothing is marked, Home opens.
- [x] The Hub is asked again on every start (a second start asks and shows again); the app keeps no "shown" memory.
- [ ] Against the deployed Hub with `tier_offer.every_start_on` on: NOT RUN (STORE-SEED is not deployed; no live host used).
- [ ] On a phone: NOT RUN (no device in this session).
