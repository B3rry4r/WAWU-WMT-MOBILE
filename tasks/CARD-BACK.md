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
| 1 | W1 drew no card row (`CardRow.tsx` deleted by WALLET-BLANK) | `CardRow.tsx` is back as at `88d0b779`; W1 draws it under the actions, while the Hub says cards are on (`enabled` on `GET /money/cards`) |
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

## Tests (a user can ...; Android and iOS, real handlers)

`src/features/cards/__tests__/cardsFlow.test.tsx` (33 tests: 16 on Android, 16 on iOS, and the Add money one): the card row leads to `/cards` (none yet), says active and frozen, is not drawn when cards are off or the read failed; the Cards row summary; `/cards`, `/cards/<id>` and `/cards/new` draw their screens, not a redirect; Details asks the PIN (sent as `X-Transaction-Pin`), shows the number and CVV, Hide details takes them off; a wrong PIN shows nothing; Freeze needs no PIN and shows Card frozen; offline: the card says it could not load, with Try again, and Details with no connection shows no number; on Android the phone's back button leaves the card screen (to the list when nothing is behind it); on iOS the round back button does; Add money draws no card option. There is no Copy control on the card screens (none was built, so none is drawn, R-47).

## Pictures

Boards rendered (`render_design.py W1 W29 W31 W32`) into `scratchpad/card-back-b/shots/`. The built screens at 390 px dark and light (W1 with the card row, Wallet settings with Cards, the cards list with none, one active and one frozen, get a card and its PIN step, the card screen hidden and revealed with the number masked, Add money with no card option): **NOT RUN** (no signed-in web export against a Hub stand-in was possible inside this task's budget; the verifier's picture pass runs them). Nothing of this is claimed as seen.

## PHONE CHECK (only a real phone can prove)

- On the owner's phone with cards on: Wallet shows the card row under the actions; Wallet settings shows Cards; tapping opens the list.
- Get a card (virtual, then single-use): the PIN or fingerprint prompt, the fee line (NGN 657.72 on dev; the Hub's quote on production), the card appears.
- Details: the PIN or fingerprint, the number and CVV show for 30 seconds then hide by themselves; leaving the screen hides them; the phone's screenshot or recents view while they show (not blocked by design).
- Freeze and Unfreeze; the Android back button from the card screen returns to the list.
- Airplane mode on the card screen: the load error and Try again.

## Capability checks

- [x] A user sees the card row on the Wallet and the Cards row in Wallet settings while the Hub says cards are on, and neither while it says off (`cardsFlow.test.tsx`).
- [x] A user can open /cards, get a card, open a card, reveal and hide its details, freeze it (`cardsFlow.test.tsx`; the get-a-card flow itself is unchanged since WALLET-22).
- [x] A user sees no card option in Add money (`cardsFlow.test.tsx`, `otherWays.test.tsx`).
- [ ] Pictures of the built screens: NOT RUN (see above).
- [ ] On a phone: NOT RUN (no device in this session).
