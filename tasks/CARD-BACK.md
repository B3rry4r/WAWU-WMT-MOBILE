---
id: CARD-BACK
title: The virtual card comes back on the Wallet, in Wallet settings and at /cards; add money by card stays off
owner: YOU
area: WALLET
order: -10951
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-84, R-104, R-124, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# CARD-BACK · The virtual card is back (R-124)

## Current state

As of 2 Nov 2026, built by a Sonnet builder (T2), mobile `wmt/CARD-BACK` on `origin/wmt/STORE-BUY-APP` `ce303c99`. App only: no Hub change, no `package.json` or `app.json` change. Status review, not verified.

Owner, 2 Nov 2026: "test again and put back on the app". Nuvion's answer of 27 Oct ("Card settlements take 6 days. Card acquiring is SUSPENDED") is about card ACQUIRING (add money by card), not ISSUING; R-104 (30 Oct) had hidden the issued card too. R-124 reverses that part and keeps add money by card off.

| # | Before (`ce303c99`) | After |
|---|---------------------|-------|
| 1 | W1 drew no card row (`CardRow.tsx` deleted by WALLET-BLANK) | `CardRow.tsx` is back as at `88d0b779`; W1 draws it under the actions while the Hub says cards are on (`enabled` on `GET /money/cards`). With cards off, nothing is drawn for a person with no live card (active, frozen or being made) and `/cards` says it is not available; a person who holds a live card keeps the row, the Cards row and the list so they can freeze or block it (money safety, round 1 L5; lead ruling, 2 Nov) |
| 2 | Wallet settings drew no Cards row | the Cards row is back (`wallet-settings-cards`), its second line from `GET /money/cards`, drawn only while cards are on |
| 3 | `/cards`, `/cards/new`, `/cards/<id>` redirected to `/wallet` | the three route files are the live screens again (get a card, list, card detail and frozen); a signed-out visit still goes to `/welcome` |
| 4 | Add money | unchanged: it draws only the ways the Hub says are available; `money.add_money_card_on` stays 0, so no card option |

Every other WALLET-BLANK item stands (blank fix, error boundary, Bills as the fifth action, no To cash, no bill tiles, the pill strip R-106). Records: DECISIONS `R-124` (and R-104 says it is updated by R-124), `docs/LOG.md`, `docs/nuvion/DEV-RESULTS.md` ("CARD-BACK").

## A. Dev test (Nuvion DEV only, 2 Nov 2026)

Done before any app change; details in `docs/nuvion/DEV-RESULTS.md`. Issuing is NOT refused. Virtual and disposable USD cards were made on a naira account (201 both), each time Nuvion took **65,772 kobo (NGN 657.72)**; listed, details (16-digit number, 3-digit CVV, expiry, holder, billing), freeze and unfreeze (idempotent), transactions (empty: dev cannot pay with a card), delete (then 404), a EUR card refused (400 `error_operation_invalid_for_state`). The same cycle ran through the Hub's own cards area (`src/nuvion/areas/cards.ts`, Hub `origin/main` `94c33c6`): create, find by reference, get, reveal, transactions, freeze, unfreeze, delete, delete again (not_found). All four cards made were deleted. Changed since 24 Oct: the create answer no longer carries the number and CVV (the Hub reads them from `GET /card-details`, so nothing breaks) and `last4` is empty on dev. Finding for a Hub follow-up: the 29 Oct docs add the status `deactivated` (a used disposable card); the Hub's `readCard` accepts only `active`, `blocked`, `fraud`.

## C. The Hub (read only)

`enabled` on `GET /money/cards` is the admin plan setting **`cards.enabled`** (`src/money/cards/wallet-card.service.ts` `enabled()`; registry `src/plan-settings/plan-setting-registry.ts`; default **1** in `plan-settings.defaults.json`; read on every request). It is also false when the running provider has no `cards` (Fintava). Nothing ties it to acquiring: NUVION-FIX's "suspended" handling (`isServiceRefusal`, `src/nuvion/areas/add-money.ts`) is applied only to the add-money calls (`start add money`, the intent and funding session), and the migration `20261219090000_nuvion_fix` touches only `money.add_money_card_on` and `money.add_money_ussd_on`. So the Hub needs no change. To check on production: the stored value of `cards.enabled` (an admin may have set 0 after R-104; the app draws the card only when it reads 1) and that `NUVION_FEE_CARD_CREATE` is set (no default: unset, getting a card answers `503 fees_not_set`; dev measured 65772) with `WAWU_FEE_CARD_KOBO` 0.

## Grep proof (R-124 carried out everywhere)

- No redirect to the Wallet is left in `src/app/cards/*` (the only `Redirect`s there are the signed-out guard to `/welcome` and an empty id to `/cards`).
- `CardRow` is imported and drawn on W1: `src/features/wallet/home/WalletScreen.tsx` lines 22 and 330.
- The Cards row: `wallet-settings-cards` in `WalletSettingsScreen.tsx` line 251, fed by `useCardsSummary()` in `src/app/wallet-settings.tsx`.
- Add money has no card entry of its own: `OtherWays.tsx` draws `waysToDraw(options.rails)`, the Hub's `available` ways; no code in the app names `money.add_money_card_on`. The test "Add money draws no card option" in `cardsFlow.test.tsx` pins it with the Hub listing the card way as not available.

## Fix round 1 (the verifier said FIX)

| # | Finding | Done |
|---|---------|------|
| 1 | Removing `<CardRow />` from `WalletScreen.tsx`, or `cards=` from `src/app/wallet-settings.tsx`, left every test green | Tests on the REAL Wallet tab (`WalletScreen.test.tsx`) and the REAL Wallet settings route (`WalletSettingsScreen.test.tsx`), Android and iOS: cards on with none made and with one active card (the row and the Cards row are drawn and open `/cards`), cards off with no live card (nothing drawn), cards off with a live card (kept). The stale `wallet-card-row` is out of `NOT_BUILT_IDS`. Mutations proved: without `<CardRow />` 8 of the 8 new W1 tests fail; without `cards=` 6 of the 8 new route tests fail (the 2 that expect nothing pass, as they should); both restored |
| 2 | The record said nothing is drawn with cards off, but a holder keeps the entries | Lead ruling: keep the behaviour. R-124 and this file now say it (see row 1 above) |
| 3 | The theme button (390 x 844: x 321 to 365, y 687 to 731) sits over the card row's chevron on W1 | W1's scroll content already ends `floatingRoom` (83) above the bar, the same room Home and Me use, so the last rows scroll 16 clear above the button; a test pins `paddingBottom >= floatingRoom` and `src/__tests__/floatingRoom.test.tsx` pins the geometry. At rest (not scrolled) any tab's content passes under the floating buttons, as on Home and Me: that is R-110 point 3 as built. Home and Me are untouched (no change to their files) |
| 4 | No test for the 30 s auto-hide and hide-on-leave | `cardsFlow.test.tsx`: the reveal timer is 30,000 ms and, run, hides the number and CVV; leaving the screen clears the timer and a fresh screen shows dots only; Freeze hides the details at once |

## Tests (a user can ...; Android and iOS, real handlers)

`src/features/cards/__tests__/cardsFlow.test.tsx` (39 tests: 19 on Android, 19 on iOS, and the Add money one): the card row leads to `/cards` (none yet), says active and frozen, is not drawn when cards are off or the read failed; the Cards row summary; `/cards`, `/cards/<id>` and `/cards/new` draw their screens, not a redirect; Details asks the PIN (sent as `X-Transaction-Pin`), shows the number and CVV, Hide details takes them off; a wrong PIN shows nothing; Freeze needs no PIN and shows Card frozen; offline: the card says it could not load, with Try again, and Details with no connection shows no number; on Android the phone's back button leaves the card screen (to the list when nothing is behind it); on iOS the round back button does; Add money draws no card option. There is no Copy control on the card screens (none was built, so none is drawn, R-47).

## Pictures

Boards (`render_design.py W1 W29 W31 W32 W35`) and the fix round's W1 shots are in `scratchpad/card-back-b/shots/`: W1 with one active card at 390 x 844, dark and light, at rest and scrolled to the end (`W1-active-end-dark.png`, `W1-active-end-light.png`). They come from a web export of this branch against canned Hub answers (the real screen, the real tab layout and the floating theme button). Scrolled to the end, the last transaction row ends at y 671 and the theme button (x 321 to 365, y 687 to 731) stands 16 below it: nothing sits under it, and the card row's chevron is clear. At rest the button overlays whatever scrolls beneath it, as on every tab (R-110 point 3 keeps only the END clear). The verifier's pictures of every other scene (W29, W31, W32, the list, the PIN step, Add money, cards off) are in `scratchpad/card-back-v/shots`.

## PHONE CHECK (only a real phone can prove)

- On the owner's phone with cards on: Wallet shows the card row under the actions; Wallet settings shows Cards; tapping opens the list.
- Get a card (virtual, then single-use): the PIN or fingerprint prompt, the fee line (NGN 657.72 on dev; the Hub's quote on production), the card appears.
- Details: the PIN or fingerprint, the number and CVV show for 30 seconds then hide by themselves; leaving the screen hides them; the phone's screenshot or recents view while they show (not blocked by design).
- Freeze and Unfreeze; the Android back button from the card screen returns to the list.
- Airplane mode on the card screen: the load error and Try again.
- The busy state while a card is made: Nuvion dev took 17.9 s to make one and the app's write timeout is 30 s, so the button must stay busy (no second card, no double fee) for the whole wait, and a slow answer must still end in the card, not an error.

## Capability checks

- [x] A user sees the card row on the Wallet and the Cards row in Wallet settings while the Hub says cards are on, and neither while it says off (`cardsFlow.test.tsx`).
- [x] A user can open /cards, get a card, open a card, reveal and hide its details, freeze it (`cardsFlow.test.tsx`; the get-a-card flow itself is unchanged since WALLET-22).
- [x] A user sees no card option in Add money (`cardsFlow.test.tsx`, `otherWays.test.tsx`).
- [x] Pictures of the built screens: W1 with one active card at 390 x 844, dark and light, at rest and scrolled to the end, taken in a web export against canned Hub answers (`scratchpad/card-back-b/shots/W1-active-end-dark.png` and light; the verifier took the rest of the scenes). The rest were taken by the verifier (`scratchpad/card-back-v/shots`).
- [ ] On a phone: NOT RUN (no device in this session).
