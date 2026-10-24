# GEO-03 · round history

Moved out of [tasks/GEO-03.md](../GEO-03.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, T1, bundle B26, 24 Oct 2026. Mobile `wmt/GEO-03` on `origin/main` `b1e6681f`; contracts from backend `wmt/GEO-02` `28634ce` and WAWU ID `wmt/GEO-01` `1e0faf1` (an earlier copy from `10857b8` and `7fb7dea` was replaced when both branches moved: the admin place schemas left the Hub's contract, nothing the app reads changed). No backend or WAWU ID change.

Files: new `src/features/geo/` (`geoApi.ts`, `useGeo.ts`, `deviceRegion.ts`, `phone.ts`, `usePhoneInput.ts`, `place.ts`, `PlaceBridge.tsx`), new `src/components/CountryPicker.tsx` and `PhoneField.tsx`, one prop on `TextField.tsx`; `src/features/auth/` (`SignUpScreen.tsx`, `AuthField.tsx` gains `scrollToSpot`, `signupFlow.ts`, `signupFailure.ts`), `src/app/sign-up.tsx`, `src/app/_layout.tsx` (one line), `src/features/profile-edit/` (`EditProfileScreen.tsx`, `form.ts`, `limits.ts`), `src/features/me/MeScreen.tsx`, `src/features/visitor/` (`model.ts`, `VisitorProfileScreen.tsx`), `src/features/settings/phone.ts`; contracts and generated clients; `package.json` and the lock (`libphonenumber-js` 1.13.15 only).

Capability checks: each is a test that fails without the feature: `src/features/auth/__tests__/signupCountry.test.tsx` (12 cases: Nigeria default, device region, picking and searching a country, searching by calling code, a pasted +233 number, a residence that differs, an invalid number named by country, the list not loaded, the text-reach line, the refusal lines, the masked number), `src/features/profile-edit/__tests__/editProfilePlace.test.tsx` (8 cases against the Hub's own response shapes), `src/features/geo/__tests__` (phone 15, place 8, profileShows 3, placeBridge 3). Live look: a web export at 390 by 844 against a stand-in that serves the Hub's own country and region data (the Hub's `geo-data` code path and packages) and made-up profile reads; the real Hub and WAWU ID were NOT run (3 GB of disk: the stack's 5 GB minimum could not be met). `GET /me/location` was seen arriving once after the sign-in.

Gate counts: gates 0 fail, 18 warn, 0 accepted after; before was not run ahead of the first edit, and the same 18 warnings are named by other builders' logs on `origin/main`.

Existing assertions changed (each pinned a behaviour this task replaces): `auth-signup.test.tsx` A3's POST body (`+2348031234412`); `editProfile.test.tsx` four cases (`edit-city` for `edit-location`, PATCH `{ city, location }`); `settings/logic.test.ts` one assertion and its title (`+44 ••• 3456`); `form.test.ts` a fixture gains the five place keys (types only).

Filed: SHARED-CHANGES GEO-03 #1 to #4; BACKEND_GAPS G-GEO-03-1 to -5. Not done: a phone; `settingsScreens.test.tsx` (it names the Fintava double, so it was not run: CI runs it); the full suites. One slip: `git checkout src/features/auth/AuthField.tsx` was used once to put back that file after a refactor the linter refused (the file held only my own edit; nothing of anyone else's was touched).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/GEO-03.md](history/GEO-03.md).
