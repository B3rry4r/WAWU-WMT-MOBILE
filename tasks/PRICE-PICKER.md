---
id: PRICE-PICKER
title: Every price is picked from a list (R-101, app)
owner: YOU
area: MONEY
order: -1265
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [PRICE-LIST]
decisions: [R-101, R-8, R-37, R-47, R-64, R-5]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# PRICE-PICKER · Every price is picked from a list

## Current state

As of 27 Oct 2026. Round 1 by a Sonnet builder (T1), JS only: branch `wmt/PRICE-PICKER` on `origin/wmt/BATCH-PRICES-APP` `4f582b0e`. `app.json` and `package.json` are untouched; the Android fingerprint is unchanged (see Checks).

- **The component:** `src/components/PricePicker.tsx`, the approved design (owner, 27 Oct, `store-plan/price-picker.html`): a 52 price, "You earn ₦X a sale" in the success colour (85% of the list price, rounded down, R-5), a strip of every list price that snaps the chosen one to the middle (accent ring, tick, fading edges), four popular shortcuts (₦1,000, 2,500, 5,000, 10,000, only those on the list), and the store note. It reads `GET /prices` (`src/features/prices/api.ts`, react-query, 5 minutes) and returns the chosen list price in whole naira. Each stop and shortcut is a button named by its price (selected state); the strip is `adjustable` with increment and decrement.
- **Store note:** "In the app, Apple and Google add their fee. Fans there pay ₦X." is drawn only when the Hub's answer carries `storePriceNaira` for the chosen price. The Hub does not serve it yet, so today it is not drawn (R-47). A test pins both cases. Tickets pass `storeNote={false}` (a wallet purchase, R-101 point 3).
- **Used by:** the create price step (M24, Paid/Free switch stays, R-8), edit details of a piece, the paid question price (paid-DM settings; the picker's own words "Price per question" and "when you answer", the screen title is still "Paid messages"), a community pass (new private community, "a pass"), event ticket types (the wizard's step and E18; each type gets a Paid/Free switch because ₦0 is a free ticket, R-8; "a ticket"), and the draft form (VF2). The typed inputs, quick prices, the Hub's earn rows ("You earn per message", "Your share", "Listing fee") and the earn read are removed there.
- **Off-list saved price:** the nearest list price (lower on a tie) is selected with one line "Pick a price from the list."; it is never sent unless the person picks (edit and draft send only what changed; ticket types refuse Save with the same line; a raise in paid-DM settings snaps up to the lowest list price at or above the Hub's figure).
- **Starts on 2,500:** a price not chosen yet starts on ₦2,500 (or the nearest list price) and the picker tells the screen once, so what is drawn is what is sent. Decided here (the design starts there); a paid-DM settings screen with no price therefore has Save enabled on open.
- **Tip sheet (H26):** six tiles from the Hub's tip list, each the amount the fan pays today (the tip itself; the Hub's fees stay in the breakdown) and "{name} gets ₦X" (85%); the other-amount field is removed; the note, breakdown, wallet and PIN path are unchanged. The sheet still opens on ₦2,000 (the design preselects ₦1,000; kept so the payment-path tests stay as they are). "Paid with Google Play" is not drawn: store tips are a later task (R-47).
- **Errors:** a `400 price_not_on_list` from the Hub refetches `GET /prices` (`refetchIfNotOnList`) and the screen shows the Hub's sentence, on the create step, edit details, paid-DM settings, new community and ticket types. The Hub does not enforce tips, so the tip sheet has no such path.
- **Not drawn (R-47):** the design's paid-question line "No answer in time? The asker gets a free question at that price." (the question credit is not built, R-101 point 6) and the tip sheet's "Paid with Google Play".
- **Tests changed (rulings, not a gate):** the suites that pinned typed prices, quick prices, the Hub's earn rows or the tip's other-amount field were rewritten for the picker: `create/details`, `create/saleTerms`, `library/fix`, `paid-messages` (screen and model), `community-host/newCommunity`, `events/host` (editEvent, hostScreens, hostForm), `verify` (model, screens), `tips` (model, tipFlow). Their payment-path and non-price assertions are unchanged.
- **Written after the code:** the picker's own tests (`src/components/__tests__/PricePicker.test.tsx`, `src/features/prices/__tests__/model.test.ts`) were written after the component, not red first. The screen and tip tests were red first (82 failing tests on the first run after the screens changed, before they were rewritten).

## Read first

- `DECISIONS.md` R-101, R-8, R-37, R-47, R-64, R-5; `docs/WORKFLOW.md`; `tasks/PRICE-LIST.md`.

## Goal

A person never types a price: every price in the app is picked from the owner's list, so each one has a store product (STORE-LADDER).

## Capability checks

- [x] The picker draws the Hub's list in order, snaps and selects, has the four popular shortcuts, shows "You earn" at 85%, and draws the store note only for a price the Hub gives a store price for.
- [x] Each stop is a button named by its price; the strip is adjustable.
- [x] The create step, edit details, paid-DM settings, a community pass, ticket types and the draft form send only list prices.
- [x] A saved price off the list shows the nearest list price and the line, and is not sent.
- [x] The tip sheet is six tiles with "{name} gets ₦X" and no custom amount.
- [x] A `400 price_not_on_list` refetches the list and shows the Hub's sentence.
- [x] Screenshots at 390 wide (dark, and the create step in light), looked at beside the design page; one defect found and fixed (the strip's edges faded into the page colour inside a ticket card, now the card's). See the round report.

## Checks

The round's EXIT lines and the screenshot paths are in `history/PRICE-PICKER.md`.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/PRICE-PICKER.md](history/PRICE-PICKER.md).
