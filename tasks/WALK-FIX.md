---
id: WALK-FIX
title: Full user walk of 29 Oct (grid opens a piece, region read, "No connection" only for the network, bills off, Done on Sent, paste a code, consent tap, popular banks, price strips, Legal once)
owner: YOU
area: APP
order: -1271
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47, R-107]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# WALK-FIX · Fixes from the 29 Oct 2026 user walk

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T2: it touches the API client every money screen uses), mobile `wmt/WALK-FIX` on `origin/wmt/STORE-BUY-APP` `2d563eb3` (what the phones run). App only: no `package.json` or `app.json` change, no native change. Fingerprints unchanged: android `c2474bd9`, ios `240378f1` (`@expo/fingerprint` on this tree). Each row was written red first (a test that fails on the old code and passes now); the lines under Red name it. Status verifying.

| Id | Before | After | Red test (fails before, passes after) |
|---|---|---|---|
| H1 | a published tile in the profile grid was a plain View; a buyer could not open a creator's piece | a published tile opens `/content/<id>` on the visitor profile AND on the creator's own grid; a draft keeps the shop opener | `me/__tests__/gridOpens.test.tsx`; `VisitorProfileScreen.test.tsx` (WALK-FIX H1); `MeScreen.test.tsx` (WALK-FIX H1) |
| H3 | the sign-up phone field started on +1 for a phone set to "English (United States)" in Nigeria (region read from the language locale) | the phone's zone names the country when it is an African zone (Nigeria, Ghana, Kenya and the rest), else the locale's region; none gives Nigeria; a US phone in the US still starts on US | `geo/__tests__/place.test.ts` (WALK-FIX H3) |
| H4 | any throw on the phone before a request left (and a serializer that threw) came out as "No connection. Check your internet and try again." or as a raw TypeError | "No connection" only for a real network failure (RN "Network request failed" and its timeout, browser "Failed to fetch" / "Load failed", Node "fetch failed", an abort); every other throw is `ApiError` kind `client`, "Something went wrong on this phone. Try again, and if it keeps happening, tell us.", with a `console.error` of its name and message (long digit runs masked) | `__tests__/client-failures.test.ts`; `auth/__tests__/phoneSideFailure.test.ts`; `open-wallet/__tests__/clientThrow.test.ts` |
| M2 | a Hub 502 "Bill payments are not configured on this server." or 503 `bills_unavailable` read "We could not reach the bills service. Try again in a moment." with Try again | "Bills are not available right now. Please check back soon." with no Try again; a provider that did not answer (also 502) and a real network failure keep their words | `bills/__tests__/billsScreens.test.tsx` (WALK-FIX M2, six tests) |
| M3/B10 | Done on "Sent for review" did nothing on the web export (`dismissTo('/')`); the events-host Sent screen swallowed Android Back | Done always lands on Home (`leaveToHome`: close the flow and bring Home up, or replace with Home when nothing is behind); Android Back on the Sent screens does what Done does; pro-listing's Sent screen already did (D6) | `create/__tests__/sentRoute.test.tsx`; `events/host/__tests__/hostScreens.test.tsx` (WALK-FIX M3) |
| M4 | the six-digit code (phone and email code screens) was keypad-only | a see-through field over the boxes takes a paste ("123456", "123 456", a line with words around the code; a standalone run of exactly six digits wins over an earlier number, "2 min, code 123456") or the phone's code offer (iOS `oneTimeCode`, Android `sms-otp`); the keypad still works | `auth/__tests__/codePaste.test.tsx` |
| M5 | a tap on the sign-up consent sentence could land on its trailing "Read them" link and open the Legal list | the link is its own line under the sentence; the sentence ticks the box | `open-wallet/__tests__/consentTap.test.tsx` (the "link is not part of the sentence" test is red before) |
| M6 | 539 banks A to Z with OPay, PalmPay, Moniepoint, Kuda, GTBank, Access, Zenith, First Bank, UBA buried | a "Popular" group of those nine (matched by the provider's bank code, a bank the list lacks is skipped), then "All banks" A to Z; Search unchanged | `wallet/__tests__/popularBanks.test.tsx` |
| M8 | price strips opened scrolled to the design's stop with no price chosen (first chips off the left edge) | no price chosen: the strip stays at its start; a chosen price is placed in view, and placed again once the strip's content has its padded size | `components/__tests__/PricePickerOpens.test.tsx` (two of four red before) |
| S1 | Settings drew Terms, Privacy policy AND Legal | Settings draws Legal once, always; Terms and Privacy policy live inside it (R-107); the "Privacy" row (account privacy) stays | `settings/__tests__/settingsLegalOnce.test.tsx` (route-level) |

### Changed assertions (a test that pinned the old behaviour)

- `settings/__tests__/settingsScreens.test.tsx`: "a user can open Notifications, Privacy, Password, About, Terms and Privacy policy, and their own details" now taps `settings-legal` instead of `settings-terms` and `settings-policy` and expects `onOpenLegal` once. "LEGAL-DOCS . a user can open the Legal list from a Legal row, and Privacy policy stays reachable beside it" is replaced by "... from the one Legal row, and Terms and Privacy policy have no rows beside it". "LEGAL-DOCS . draws no Legal row where the route gives no place to open it (R-47)" is removed: Legal is always drawn, so there is no such state. Seven other Settings tests (claim `settingsEntry`, wallet `walletSettingsFlow`, `sessionEnd`, `settingsMusic`, `deleteAccount`, and two blocks of `settingsScreens`) only swap the props they pass: `onOpenTerms` and `onOpenPolicy` became `onOpenLegal`.
- `__tests__/networkGuard.test.ts`, "stops the API client when its address is a real host, even though the client turns the failure into an answer": expected `kind: 'network'`, now expects `kind: 'client'`. The jest guard throws a plain Error, which is not a network failure and so is a client-side throw under H4. LEAD RULING, 30 Oct 2026 (verifier of 0e437444): change that one assertion and nothing else in the file. No other assertion was changed.

### S1 · the Legal list holds the Terms and the Privacy policy

Confirmed before the rows were removed. `LegalDocumentsScreen` (`/legal-documents`) lists the documents the Hub serves at `GET /policies`; the backend (`origin/main`, `src/about/tests/policies-nine.contract.spec.ts` and `about.contract.spec.ts`) names `terms` and `privacy` among the nine slugs, and the app test fixture `about/__tests__/legalDocuments.test.tsx` lists "TERMS OF SERVICE" and "PRIVACY POLICY: WHO MADE THIS? (WMT)" with their slugs. `SettingsScreenProps.onOpenTerms` and `onOpenPolicy` were used only by Settings and are removed; `/terms` and `/privacy-policy` stay as routes (the movie consent sentence and account privacy link them). Grep: `grep -rn "settings-terms\|settings-policy" src` finds only the two tests that assert their absence.

### H4 · screens whose wording changes

A client-side throw used to read "No connection" on every screen; now it reads "Something went wrong on this phone" (kind `client`). The full list of screens and of the wrappers changed is in [history/WALK-FIX.md](history/WALK-FIX.md), "H4 wording list". Sign-in, the reset request, the code steps and sign-up Continue are reworded explicitly. A refusal from the Hub, a real network failure and a write that got no answer read as before; every money screen's handling of `network` is unchanged.

### Defaults (lead), owner may override

- H3: `expo-localization` is not in this app, and a native module is not added. The phone's region is read from the JS runtime: the time zone first (an African zone names its country), then the locale's region. A phone set to "English (United States)" whose zone is outside Africa still starts on US. Outside Africa the zone is not mapped.
- M6: the Hub's bank codes for the nine banks were not read live in this task (no key may be used here). `wallet/popularBanks.ts` holds the codes each bank is known by: the CBN three digits for the commercial banks (058, 044, 057, 011, 033) and the NIBSS six digits for the others (100004, 100033, 090405, 090267), with the other forms as fallbacks. LIVE CHECK for the lead: read one `GET /money/banks` and confirm the nine appear under Popular; add any code the list uses that this file lacks.
- M3: Done on a Sent screen uses `dismissAll` then `navigate('/')` when something is behind it, `replace('/')` when not.

### Pictures (390 px, dark and light, beside the artboard)

Web export of the built screens (a temporary preview route, not committed, a mock Hub on port 11080) at 390 px, dark and light, each beside its artboard from `render_design.py`, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/walk-fix-b/pics/` (`<screen>-<theme>-beside-<board>.png`, the app on the left, the artboard on the right; `<screen>-<theme>.png` is the app alone):

| Screen | Pictures | Artboard | Seen |
|---|---|---|---|
| Settings (S1) | `settings-dark-beside-Z2.png`, `settings-light-beside-Z2.png` | Z2 | Legal is the one row under About; no Terms or Privacy policy row. The artboard still draws Terms, Privacy policy and the Sound row: R-107 and R-99 outrank it (BRIEF) |
| Sign-up consent (M5) | `consent-dark-beside-A3.png`, `consent-light-beside-A3.png` | A3 | the sentence, then "Read them" on its own line. The artboard draws the older "terms and privacy policy" form; the Legal list form is LEGAL-DOCS (26 Oct) |
| Price strip (M8) | `price-dark-beside-M24.png`, `price-light-beside-M24.png`, `price-chosen-*` | M24 | no price chosen: "Pick a price", the strip at its start with the first chip in view; with 50,000 chosen the strip is on it |
| Bank list (M6) | `bank-dark-beside-A21.png`, `bank-light-beside-A21.png` | A21 | the "Popular" heading and the popular banks first. A21 draws the field, not the list (its own comment): no artboard to compare |
| Bills when off (M2) | `bills-dark-beside-S2.png`, `bills-light-beside-S2.png` | S2 | the "Bills are not available right now. Please check back soon." state; S2 draws the working list, not this state (a gap row, R-29) |
| Code screen (M4) | `code-dark-beside-A4.png`, `code-light-beside-A4.png` | A4 | unchanged to the eye: the see-through field is over the boxes |
| Sent for review (M3) | `sent-dark-beside-M25.png`, `sent-light-beside-M25.png` | M25 | unchanged |
| Profile grid (H1) | `grid-dark-beside-M5.png`, `grid-light-beside-M5.png` | M5 | unchanged: the tiles are pressable, not redrawn |

Not pictured: the events-host Sent screen (E16) and the professional listing's Sent screen (P7): only their Back handler changed, no drawing.

### PHONE CHECK (only a real phone proves these)

- Android Back and Done on "Sent for review" (create) and on the events-host Sent screen land on Home with `dismissAll` + `navigate`; proven in jest with the real handlers on `Platform.OS = 'android'` and a recording router, not on a device.
- Pasting a code and the phone's own offer: iOS QuickType "From Messages" and Android Autofill on the see-through code field (`showSoftInputOnFocus={false}`, `caretHidden`); jest proves the handler and the props, not the offer.
- The consent sentence tap on Android (the old inline link could take a tap beside the last word); jest cannot show a text-span hit test.
- The region read on an Android phone set to "English (United States)" in Nigeria (zone Africa/Lagos).
- The price strip opening with a price far along the list, on Android (the first scroll is clamped to the content laid out so far).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, `docs/EXPO-AGENTS.md`
- `src/api/client.ts`, `src/api/errors.ts`, `src/features/me/ContentGrid.tsx`, `src/features/settings/SettingsScreen.tsx`

## Goal

The walk's findings are fixed at their source, each with a test that failed first.

## Scope

`wawu-wmt-mobile` only, and the files named above and in the table's tests. Not touched: the wallet home, fx pills, cards, bills tiles, the music button (M1), categories (M7), who sees "Access code" and "Host your event" (M9), the tier offer.

## Capability checks

- [x] A buyer can tap a creator's piece in the profile grid and its page opens; a creator can open their own piece the same way.
- [x] A phone set to English (United States) in Nigeria starts sign-up on +234.
- [x] A client-side throw says "Something went wrong on this phone", never "No connection".
- [x] Bills that are off say so once, with no Try again.
- [x] Done on a Sent screen lands on Home, and Android Back does what Done does.
- [x] A pasted or offered six-digit code fills the boxes.
- [x] The consent sentence ticks the box; "Read them" opens the Legal list.
- [x] The bank list leads with the popular banks.
- [x] A price strip opens at its start, or with the chosen price in view.
- [x] Settings shows Legal once.
- [ ] On a phone: NOT RUN (no device in this session). See PHONE CHECK.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALK-FIX.md](history/WALK-FIX.md).
