---
id: GEO-03
title: Every country in the app: a phone with its country code, a country of residence, and a region and city in the profile
owner: YOU
area: GEO
order: -150
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-85, R-27, R-47, R-29]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# GEO-03 · Every country in the app

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B26), mobile `wmt/GEO-03` on `origin/main` `b1e6681f`. App only: no backend or WAWU ID change. The Hub side is read from backend `wmt/GEO-02` `28634ce` and WAWU ID `wmt/GEO-01` `1e0faf1` (neither merged; the contracts are copied from those commits, SHARED-CHANGES GEO-03 #4). `depends_on` is empty because the GEO-01 and GEO-02 task files are on other branches; this task needs both. Status verifying.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | A3's Phone number was a plain box: "0803..." as typed went to WAWU ID | the one `PhoneField`: a country button (flag and calling code) beside the number, opening a sheet of every country the Hub lists (flag, name, calling code, search by name or code) |
| 1b | no country | starts on the device's own country (`Intl`, no native module) when the Hub's list holds it with a calling code, else Nigeria |
| 1c | the number was never checked on the phone beyond 7 digits | shown in the country's grouping as it is typed ("0803 123 4412"), read in that country's rules (libphonenumber-js, the Hub's own package and version; Nigeria's own rule as WAWU ID has it) and sent in full international form ("+2348031234412"); a Nigerian "0803..." still works with Nigeria chosen; a number typed with its code ("+233...") moves the country to Ghana |
| 2 | no country of residence | A3's Country row, starting as the phone's country and following it until the person picks their own; sent as `countryCode` (left out when the Hub's list did not load) |
| 3 | M8's Location was one free-text box ("City, country") | Country (the picker), then Region (that country's list from the Hub, labelled in the Hub's own word: State, Province, County, else Region; a country the Hub lists no regions for takes typed text), then City (80 characters); changing the country clears the region; Save writes the free-text `location` the web reads from the three ("Ikeja, Lagos, Nigeria") |
| 3b | the profile showed the free text | M4's About and M5/M33 show "City, Region, Country"; a profile with only the older text still shows it |
| 4 | A4 and Z2 masked a non-Nigerian number to its last four, or leaked a digit of the code | a masked number keeps its own country code: "+233 ••• 4567"; a Nigerian number is still "0803 ••• 4412" as drawn |
| 5 | "Use a Nigerian number that starts with 0 or +234." | A3's refusal says the real rule: "Texted codes go to some countries only. Codes sent by email work for every country." (also under the phone field, for a non-Nigerian number, while the code is texted); an invalid number names the country and shows how its numbers are written; `COUNTRY_INVALID` is handled |
| 6 | the Hub never learned where a person was | once per sign-in the app calls `GET /me/location` (`PlaceBridge`, mounted by the root layout) |

- **Default (lead), owner may override:** (a) the residence follows the phone's country until the person picks one; (b) Save also writes the free-text `location` from the three, so the web, which reads that line, agrees; (c) the order is Phone, then Country, then Password on A3; (d) a country with no region list takes the region as typed text (the Hub accepts it); (e) the refusal and the hint do not name Nigeria, because the texted prefix is WAWU ID's setting (`SIGNUP_ALLOWED_PHONE_PREFIX`) and no route serves it (G-GEO-03-2).
- **Existing assertions changed, each pinned a behaviour this task replaces:** `auth-signup.test.tsx` A3's POST body now carries `+2348031234412` (was the text as typed); `editProfile.test.tsx` four cases type into `edit-city` where they typed into `edit-location`, and the PATCH body is `{ city, location }`; `settings/logic.test.ts` `maskPhone('+447911123456')` is `+44 ••• 3456` (was `••• 3456`); `form.test.ts` fixture gains the five place keys the contract now requires (no assertion).
- **Not drawn, filed:** G-GEO-03-4 (no board draws the country button, the sheet, A3's Country or M8's three rows), G-GEO-03-1 (the Hub's `city` limit 80 against the DTO's 100), G-GEO-03-2 (a person outside the texted countries cannot sign up while codes are texted; the app cannot offer them the mailed code), G-GEO-03-3 (recipient search by a foreign number), G-GEO-03-5 (old free text is not matched to a region).
- **Open (blocker, high, medium):** none known. Lows go to the sweep.
- **Checks (each EXIT line in the builder report, `history/GEO-03.md`):** tsc EXIT 0; eslint (no --fix) on the 33 changed `.ts`/`.tsx` files EXIT 0; jest, the folders and files this touches: 41 suites, 715 tests, EXIT 0 (`src/features/geo`, `auth`, `profile-edit`, `me`, `visitor`, three `settings` files, `schools` `enrolFlow`, and `auth-signup`, `auth-signup-channel`, `auth-guard`, `identity-contract`, `route-graph`, `components`, `textFieldTapBox`, `kit-components`, `hubSharedProps`, `session`), then after the last contract sync 13 suites, 146 tests, EXIT 0, and `placeBridge` 3 tests EXIT 0; gates 0 fail, 18 warn, 0 accepted, `check_baseline` EXIT 0; `check_tasks --write` EXIT 0.
- **Pictures (390 px, light and dark):** `scratchpad/geo-03-b/pics/` (390 by 844, drawn at 2x, Chromium, dark then light): the phone field closed `phone-field-closed-<theme>.png`, open `phone-field-open-<theme>.png` and searched `phone-field-search-<theme>.png`; sign-up with Country `signup-country-<theme>.png`; Edit profile `edit-location-<theme>.png` and the region list `edit-region-open-<theme>.png`; each beside its board in `cmp-signup-<theme>.png` (A3) and `cmp-edit-profile-<theme>.png` (M8). A3 and M8 draw no country button, sheet or Country row (G-GEO-03-4); M8's board does draw Location as a tap-to-choose row with a chevron, which Country, State and City follow.
- **Not run:** a phone; the real Hub and WAWU ID (pictures use a local stand-in that serves the Hub's own country and region data); `settingsScreens.test.tsx` (it names the Fintava double; CI runs it); the full suites.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `DECISIONS.md` R-85
- `src/features/auth/` (`SignUpScreen.tsx`, `signupFlow.ts`, `signupFailure.ts`), `src/features/profile-edit/` (`EditProfileScreen.tsx`, `form.ts`)
- The Hub: backend `wmt/GEO-02` (`src/geo/`), WAWU ID `wmt/GEO-01` (`src/common/phone.util.ts`, `src/auth/phone-signup.service.ts`)

## Goal

A person from any country signs up with their number and its country code, says where they live, and sets a region and city in their profile. The lists come from the Hub; the app carries none.

## Scope

`wawu-wmt-mobile` only: `src/features/geo/` (new), `src/components/CountryPicker.tsx` and `PhoneField.tsx` (new) and one prop on `TextField.tsx`, `src/features/auth/` (A3, the refusal lines, A4's masked number), `src/features/profile-edit/` (M8), `src/features/me/MeScreen.tsx` and `src/features/visitor/` (the place line), `src/features/settings/phone.ts`, `src/app/sign-up.tsx` and `_layout.tsx` (one line), the contracts, and their tests.

## Capability checks

- [x] A user can pick a country in the phone field by searching its name or calling code, type the number the way it is written there, and Continue sends it in full international form (`signupCountry.test.tsx`).
- [x] A user in Nigeria can still type "0803 123 4412" and it is sent as "+2348031234412" with Nigeria as the country.
- [x] A user can pick a country of residence that differs from the phone's, and it is the one sent.
- [x] A user can set Country, Region (in the country's own word) and City in Edit profile, and only what changed is sent (`editProfilePlace.test.tsx`).
- [x] A user sees their city, region and country on their profile, and a visitor sees them on theirs.
- [x] A user who gets the texted-code refusal is told the real rule, and no failure line says "Nigerian number".
- [ ] On a phone: NOT RUN (no device in this session).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/GEO-03.md](history/GEO-03.md).

