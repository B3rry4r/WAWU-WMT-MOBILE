---
id: UPLOAD-WORDS
title: Every screen states the upload places the tier gives
owner: YOU
area: CREATE
order: 375
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-129, R-7, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# UPLOAD-WORDS · Every screen states the upload places the tier gives

## Current state

As of 10 Nov 2026.
- **Status:** verifying. Built on `wmt/UPLOAD-WORDS` (from `wmt/RULINGS-1110`). Builder report: `tasks/history/UPLOAD-WORDS.md`.
- **Done (R-129):** one number for upload places. Every meter and line that states them reads the Hub's `uploads.allowed` (`GET /uploads/allowance`): Create, My content (library), the dashboard, the Me page meter, Your tier, the publish screen and the limit sheet (VF13). The tier read keeps the tier's name, state and end day only. The verification page's "Every tick gives you" draws "Up to N uploads" only for a person whose tick still lifts the Hub's allowance to the tick level (`tickHeld` and `uploads.allowed >= withTick.uploads`), with N the Hub's own number; nobody else is promised 25. The library-space row keeps R-7's storage figures (the Hub applies them to a tick or a tier).
- **Screens that state upload places or space (grep of the code):** `verification/model.ts givesOf` (changed), `create/UploadsMeter.tsx` meterLine, SlotsFullNotice, UploadsMeter, AllowanceMeter (changed), `create/CreateScreen.tsx` meter and limit routing (changed), `create/UploadScreen`, `LessonsScreen`, `FormatScreen` (SlotsFullNotice, changed through it), `create/ReviewScreen.tsx` usedLine (already `uploads.allowed`), `library/LibraryScreen` and `creator/DashboardScreen` (AllowanceMeter), `me/MeScreen.tsx` TierMeter (changed), `me/MeMenuSheet.tsx` "N of N uploads" (already `uploads.allowed`), `verify/YourTierScreen.tsx`, `verify/PublishScreen.tsx`, `verify/ProductsFullSheet.tsx` (changed), `verify/TiersScreen`, `tier-offer`, `purchaseModel grantRows` (the tier list's own "products" per tier, the Hub's plan list; not changed).
- **Does buying a tick today still raise `uploads.allowed`? Yes.** Hub `src/plans/publishing-allowance.service.ts` lines 76 to 78 (`const tickHeld = holdsTick(...)`, `const tickAllowed = tickHeld ? TICK_UPLOADS : 0`, `const productsAllowed = Math.max(tierAllowed, tickAllowed)`) give any running tick 25 places (and line 96 gives `TICK_STORAGE_BYTES` to a tick), whenever the tick is bought. R-129 says a new tick adds none. Follow-up (not made here, no Hub changes in this task): count a tick's 25 only for a tick whose `creatorVerifiedAt` / `professionalVerifiedAt` is before the day tiers went live (a named constant in `src/common/creator-allowance.ts`, line 22 `TICK_UPLOADS` is the figure), in `allowanceFrom` lines 76 to 78 and the matching `basis`; `uploadAllowanceFor` in `creator-allowance.ts` (line 69) has the same flat rule for any other caller. The app needs no change when that lands: it reads `uploads.allowed`.
- **NOT RUN:** the limit sheet (VF13) and the "N of N used" notice with real pieces on the web export (needs filling the places; proven in jest only); a phone (PHONE CHECK: none, no phone-only path touched).
- **Next:** a verifier.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-129, R-7, R-47
- wawu-backend `src/storage/storage.service.ts` (`UploadAllowanceView`), `src/plans/publishing-allowance.service.ts`, `src/common/creator-allowance.ts`

## Goal

A person sees one number for how many pieces they may publish, everywhere: their tier's, or a pre-tier tick's 25 while it lasts (R-129).

## Scope

- The verification page and every other screen that states upload places or library space read `uploads.allowed` (and the tier list for what a tier would give); "Up to 25 uploads" appears only to a person whose tick from before tiers still gives it.
- Say whether buying a tick today still raises the Hub's `uploads.allowed`; if it does, R-129 says it must not: name the Hub change (file and line) for a follow-up, do not make it here.
- Phone and web alike.

## Capability checks

- [ ] A Founding Maker sees the same number of upload places on the verification page, Create, My content and the limit sheet.
- [ ] A person with a tick from before tiers still sees and gets 25.
- [ ] Every screen touched has pictures at 390 light and dark beside its board, and at 1440 on the web.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/UPLOAD-WORDS.md](history/UPLOAD-WORDS.md).

## Verifier report

Verdict: MERGE (T1, 10 Nov 2026, head bd6b0b7). No defect of medium or worse in the app. Two checks below are NOT RUN; the lead weighs them.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed, with a note | typecheck EXIT 0; lint EXIT 0 (0 errors, 10 warnings, no file edited); gates EXIT 0 (10 run, 1690 files scanned, 0 fail, 17 warn); tasks EXIT 0; full `npx jest -w 2`: EXIT 1 under machine load (4 suites failed to run or timed out: publishAndTier, hostScreens, buyTickets, fxTabs; 517 of 521 suites passed, 7714 tests); the same 4 files rerun with `-w 1`: 148 of 148 passed, EXIT 0 |
| V4/V9 | passed | web export behind vercel.json headers, no `--disable-web-security`, Hub CORS_ORIGIN set to the export's origin; 0 CORS errors; real sign-in; numbers below equal `GET /uploads/allowance` |
| V5 | partly run | pictures in /tmp/wmt-shots/upload-words-verify/ (about 130 files, 390 light and dark, 1440 light, six people, six screens, plus limit sheet and Me); boards beside them for verification, create, library, Your tier, publish (board-vs-*.png); the verification and Create pairs and the Me page and limit sheet were looked at; the rest were taken and not each looked at |
| V6 | passed | limit sheet and notice with real pieces (below) |
| V7 | passed | six people walked |

Numbers (Hub `uploads.allowed` = every screen): free (no tier, no tick) Hub 0, no meter anywhere; Verify 4 (0 of 4, then 4 of 4); Verify Plus 8 (0 of 8); Founding Maker 15 (0 of 15, then 15 of 15 on Create, My content, Me, Your tier, publish; verification page has no uploads row); Founding Maker with a tick bought today: Hub tier read says 15 but the allowance says 25, every screen says 25 (placesOf at work), verification page says "Up to 25 uploads"; tick from before tiers, no tier: Hub 25, verification "Up to 25 uploads", Create and My content "25 of 25 used" and "Verified · up to 25 uploads". Limit sheet "You have used 4 of 4", "15 of 15", "25 of 25"; the Hub refused one more with 402 product_limit_reached at 4, 15 and 25. Made by SQL: the Hub UserProfile rows (creator type, handle) and the ticks (id and Hub columns); tiers bought through the Hub's wallet purchase route with a funded stand-in wallet and PIN; pieces made through POST /content.

Test edits: every changed assertion is a words change R-129 makes (three "Get verified for up to 25 uploads" lines, the "Free accounts get 5" line removed) or an added fixture field (`places`, the fan's tier fixture); nothing weakened or deleted; two new meter tests and two new verification tests add coverage.

Grep of the app: no hard-coded upload count or library size. The only figures are the Hub's (`uploads.allowed`, `withTick.storageBytes`, `free.storageBytes`) and the tier list's own per-tier "products".

Phone: NOT RUN as asked. `jest --preset jest-expo/android` failed all 13 suites to run (the config does not take the override), so no proof on android; the diff has no platform branch and no phone-only path (no picker, upload, gesture or back handler).

Findings:
- medium, unclear (owner or Hub follow-up, not a builder defect): R-129 point 2 says a new tick adds no places, but the Hub still gives a tick bought today 25 (publishing-allowance.service.ts lines 76 to 78, `Math.max(tierAllowed, tickAllowed)`), so a person who buys a tick today is told "Up to 25 uploads" on the verification page and "25 of 25" everywhere, and the Hub enforces it. The builder's answer is confirmed: yes, it still raises `uploads.allowed`. The Hub change (count a tick's 25 only for a tick granted before tiers) is still to be made.
- low: the full jest run is not clean in one run on a loaded machine (4 suites fail to run; clean in isolation).
- low: the Me page counts "0 pieces" beside "15 of 15" (pieces awaiting review); not this task.
- low: the stack's CSP check shows one `ws://localhost` violation because the harness swapped only the http hosts; not an app finding.
- low: CreateScreen's limit routing still requires the tier read's `productsAllowed > 0` before it uses the Hub's number.

NOT RUN: Android jest of the touched screens; every picture individually looked at (only a subset); a phone.

## Owner sign-off
