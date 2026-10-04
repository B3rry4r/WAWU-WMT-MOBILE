---
id: RELEASE-01
title: Store listings and production builds
owner: YOU
area: RELEASE
order: 172
priority: launch
repo: wawu-wmt-mobile
type: setup
status: verifying
depends_on: [SHELL-03, KYC-04]
decisions: [R-24]
passes: [V1, V10]
artboards: []
---
# RELEASE-01 · Store listings and production builds

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

The stores need listings, screenshots and privacy answers before they will review anything. This takes longer than people expect.

## Scope

The Google Play listing, its data-safety form (BVN, NIN, selfie, payments), screenshots from the real app, and an
EAS production profile pointing at production. Testing and the first release are Android (R-24); the App Store
listing waits for RELEASE-03. Submission is the owner's alone, from their own machine, with the store keys kept
off Expo (`docs/BUILDS.md`).

## Capability checks

- [ ] A production build installs from Play internal testing on the owner's Android phone and reaches the production backend.
- [ ] The Play listing is complete and passes Google's own pre-submission checks.

## Builder report

Builder, 4 Oct 2026. Mobile `origin/main` 794b3ed, docs and `eas.json` only, no store account, key, credential or EAS call touched (no `eas` command was run; Expo's token and Fintava's key were not read). Backends read through `git show origin/main:` only.
- **Produced:** `docs/release/PLAY-LISTING.md` (owner checklist first, then name, 69-character short description, 2,126-character full description, category, content rating answers, target audience, ads, financial features, app access text for a review account with no credentials, and a claims table tracing every description paragraph to a ruling or task); `docs/release/DATA-SAFETY.md` (the form item by item with code or doc evidence); `docs/release/SCREENSHOTS.md` (8-shot plan, built versus not built, how to capture at Play's sizes). `eas.json`: the `production` profile (app bundle, channel `production`, both live URLs) already existed from SHELL-03; I added `distribution: store` and changed nothing else (the `development` and `preview` profiles and `cli` compare equal to main, JSON validated, no credentials, no `submit` block). `docs/BUILDS.md` profile bullet updated to match.
- **Capability check 1 (production build installs from Play internal testing on the owner's Android phone and reaches the production backend): NOT RUN.** Needs the owner and a device. The owner: create the Play app (`africa.wawu.wmt`), run `eas build -p android --profile production`, create a Google service-account key and keep it off Expo, run `eas submit -p android` from their machine, add themselves as an internal tester, install from Play, sign in with the review account and see a value only the server has. Steps are in `PLAY-LISTING.md` section 1.
- **Capability check 2 (the Play listing is complete and passes Google's own pre-submission checks): NOT RUN.** Needs the owner, the Console and a build. The owner: fill every App content declaration from the three files, then read Console's policy status and the pre-launch report. It cannot pass today (see B1 to B5 below).
- **Draft screenshots:** 5 signed-out screens (A1, A2, A3, A22, A23) from the web export at 1,080 x 1,920 in the scratchpad, not committed, marked drafts. No signed-in screen was shot: the tabs are placeholders and no hub links to the built signed-in screens.
- **Findings the owner must rule on or unblock (full text in `PLAY-LISTING.md` section 0):** B1 account deletion has no screen (SETTINGS-05, 06, 08 `todo`), the Hub's grace is 48 hours with no cancel against R-17's 30 days, and no public web deletion page exists; B2 the public privacy text predates the app and names no BVN, NIN, selfie or Fintava; B3 Play Billing policy versus wallet-paid digital items (content unlocks, WAWU Credits, ticks); B4 no in-app "report" control is drawn for user content; B5 `expo-camera`, `expo-image-picker` and the rest of SHARED-CHANGES row 8 are not installed, so the selfie and profile pictures cannot work on a phone.
- **OWNER TO CONFIRM** items are marked in the three files (age 18+, contact email, category, Fintava and Loma Bank as shared, where Play files BVN and NIN, retention after deletion, Gemini legal chat, push and Expo Updates disclosures, TLS grade, real manifest permissions, personal versus organisation Play account).
- **Gate counts:** `npm run check` exit 0 after (typecheck, lint, jest 40 suites 725 tests, gates 9 run 183 files 0 fail 0 warn 0 accepted, 207 tasks); only docs, one JSON line and generated task files changed, so no gate count moved.

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
