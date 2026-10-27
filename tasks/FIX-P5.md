---
id: FIX-P5
title: The four lows of the CHECK-3 fifth pass (tier offer first, one ad card size, ad link in a new tab on the web, Nuvion on a local stack)
owner: YOU
area: OPS
order: -159
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-92, R-94, R-95, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# FIX-P5 · The four lows of the CHECK-3 fifth pass

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/FIX-P5` from `origin/main` `319b8894`, backend `wmt/FIX-P5` from `origin/main` `2cc4950`. Source: `audits/CHECK-3/today-p5.md` (findings L2, L3, L4, L6).

| # | Row (source) | Outcome | Commit |
|---|---|---|---|
| 1 | L2, R-94 (lead ruling, 27 Oct 2026): a new creator met "Set up your account" first and the tier offer only after Later; a person working the checklist might not meet it until a later start | Fixed. The offer is the first screen once the email, name and access-code steps are done: the `tier-offer` route no longer waits for the setup steps, and `interests`, `people-to-follow`, `creator-setup` and its voice screens now wait while the offer is up (`src/app/_layout.tsx`). Once per person, creators only, X or Subscribe ends it for good, fails open on a slow or failed `GET /me/tier-offer`, never on a sign-in, an account switch or a refresh: `offerStep.ts` logic is unchanged (comments only) and `session-cache.test.tsx` and `sessionChange.test.ts` are unedited and green. R-94 default (1) in `DECISIONS.md` says the new order. Tests in `tierOfferWalk.route.test.tsx`: the sign-up walk (fails before: A11 came first) and a creator who starts the app part-way through the checklist | FIX-P5 commit |
| 2 | L3, R-92: the Today ad card was 350 wide and the Explore ad slide 335 (both 196 high) | Fixed. Both are the one `AdSlide` and fill what their screen gives them; Explore's body showed the web build's vertical scrollbar (15 px off the slide) where Today's hides it. `ExploreScreen` now sets `showsVerticalScrollIndicator={false}`. The same width and height at 360 and at 390 (350 x 196 at 390). Test `adCardSize.test.tsx` (fails before) | FIX-P5 commit |
| 3 | L6: on the web build an ad's link replaced the app's own tab | Fixed. `openAd` opens a link ad with `window.open(url, '_blank', 'noopener,noreferrer')` on the web; on a phone it is still `Linking.openURL`; an event ad still opens its event in the app. Test `adLinkWeb.test.tsx` (fails before) | FIX-P5 commit |
| 4 | L4 (backend `wmt/FIX-P5`): `scripts/dev/stack.sh` set no `NUVION_WALLET_BANK_NAME`, so a stack's `GET /about` answered `bankName: ""` and "Powered by Nuvion" never showed | Fixed. The stack gives the Hub `NUVION_WALLET_BANK_NAME=Nuvion` (production answers Nuvion already); `README.md` "Nuvion on the stack" says so. Checked with one stack up and down: `GET /about` answers Nuvion | FIX-P5 commit (backend) |

Changed assertions: `tierOfferWalk.route.test.tsx`, test 1 only, where the new order is the point: the walk now expects the offer after the access-code step and "Set up your account" only after the offer's X (it expected "Set up your account" first, then the offer after Later); the title says "before A11". Everything else in that file is as it was (the second test and the file's setup are new, one added require for the token keys). No other existing test changed.

**NOT RUN:** the pictures at 390 dark (the sign-up end with the offer first; the Home Today card beside the Explore card): the stack's WAWU ID had no mail transport, so the web build's sign-up stopped at "We couldn't send the code" and no new creator could be walked through it; the order, the sizes and the new tab are proved by the tests that fail before and pass after, and the Hub's `GET /about` answered Nuvion on the stack. A phone (the new tab is the web build's; a phone is unchanged and pinned by the test).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `tasks/TIER-OFFER.md`, `tasks/ADS-LINK.md`; `DECISIONS.md` R-92, R-94, R-95

## Goal

The four lows of the fifth CHECK-3 pass are fixed, each with a test that fails before.

## Scope

App: `src/app/_layout.tsx`, `src/features/tier-offer`, `src/features/ads`, `src/features/explore/ExploreScreen.tsx`; `DECISIONS.md` R-94 default (1) (the new order). Backend: `scripts/dev/stack.sh` and its README line.

## Capability checks

- [x] A new creator meets "Choose your tier" before "Set up your account", and the checklist, the bonus and Home follow it.
- [x] A creator who starts the app part-way through the checklist meets it first too, and a person who has seen it does not meet it again.
- [x] The Home Today ad card and the Explore ad slide are the same width and height at 360 and at 390.
- [x] An ad's link opens in a new tab on the web and in the browser on a phone.
- [x] A local stack's `GET /about` names Nuvion.
