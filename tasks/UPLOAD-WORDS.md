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

## Owner sign-off
