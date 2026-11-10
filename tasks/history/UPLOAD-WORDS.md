# UPLOAD-WORDS · round history

Moved out of [tasks/UPLOAD-WORDS.md](../UPLOAD-WORDS.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/me/model.ts` (`placesOf`, `productsMeterOf(tier, allowance)`), `create/CreateScreen.tsx`, `create/UploadsMeter.tsx`, `me/MeScreen.tsx`, `verify/YourTierScreen.tsx`, `verify/PublishScreen.tsx`, `verify/ProductsFullSheet.tsx`, `verification/model.ts`. No fenced file, no Hub change.
Tests updated (their expected words changed by this task): `create.test.tsx` (two lines of copy; two new R-129 meter tests), `library.test.tsx`, `entries.test.tsx` (copy), `verificationFlow.test.tsx` (the D-7 M16 test split into three: a pre-tier tick sees 25, a tier or no tick sees no uploads row), `meMenuRoute.rows.test.tsx` (the fan's fixture now holds no tier, so the Me meter does not ask the allowance; assertion unchanged).
Web export on a stack (`uw`, real wawu-id, Nuvion stand-in, tiers bought through the Hub with a funded wallet and PIN; the pre-tier tick set in the stack's own two databases), served behind `vercel.json` headers, 0 CSP violations: free person: no meter, space row only; Verify: "0 of 4" on Create, My content and Your tier, no uploads row on the verification page; Founding Maker: "0 of 15" on all of them, no uploads row; person with a tick from before tiers: "Up to 25 uploads" on the verification page and "0 of 25 used" on Create and My content. Pictures (looked at): `/tmp/wmt-shots/upload-words/board-vs-{verification,create,library}-390-{light,dark}.png` (board M16, M19, M28 then the four people) and `four-*-1440-light.png`.
Stack artifacts, not app findings: the pre-tier tick person's verification page still draws "Get your tick" because the tick was set by SQL in the stack's two databases and the page reads another field of it; accounts were made with wawu-id `/auth/register` and confirmed in the stack's database, then signed in through the real sign-in screen; Chromium ran with `--disable-web-security` because the Hub's CORS list holds only the stack's own origins.
Gaps filed: none.

## Verifier report



## Round 1 (builder, 10 Nov 2026)
Fix for the verifier's defects (the lead's list): a person whose places come from a tick bought before tiers (no running tier, Hub allows 25).
- `src/features/me/model.ts`: new `atPlacesLimit(tier, allowance)`: allowed above 0 and used at or above it; a running tier's own count only until the allowance has answered. `CreateScreen.tsx` uses it for the Content tile; `FormatScreen.tsx` opens VF13 whenever the Hub says every place is used (no longer only for a person with a running tier; its tier read and imports are removed).
- `PublishScreen.tsx`: `mayPublish = running || uploads.allowed > 0`; while the allowance is still loading and no tier runs, the skeleton shows (not "Make it official"). `YourTierScreen.tsx`: no tier and `uploads.allowed` above 0 says "Your tick still gives you N places to publish until it ends. See tiers for what a tier gives." with See tiers; with none it says what it said.
- The 402 handlers in UploadScreen and LessonsScreen already open VF13 on `product_limit_reached`, with no tier test.
- Tests changed: `entries.test.tsx` "a person with no tier is not sent the sheet" now says the opposite by this ruling (the sheet follows the places alone), plus one "places left" test. Full `npx jest -w 2`: 518 of 521 suites passed, 7740 tests; `entries` (the test above, fixed), and `dubbingFlow` and `bankSendFlow` (failed to run or timed out under load) passed re-run alone with -w 1. Tests added: `create.test.tsx` (tick-only person 25 of 25 pressing Content opens the sheet with `Platform.OS` android; 24 of 25 starts a piece), `publishAndTier.test.tsx` (the publish screen is open for a tick-only person; Your tier's words). No existing assertion changed.
- Web export (same stack recipe, plus the storage stand-in on 16055 and its address added to my page's connect-src and img-src, stack only; ticks set by SQL in the stack's two databases): a person with a tick and no tier (a) published one piece through the app's own "Send for review" ("Sent for review", "1 of 25 used", the piece is pending in the Hub); (b) at 25 of 25 (the places set by SQL on the stack's CreatorState) pressing Content opens "You have used 25 of 25" with Open library; (c) Your tier and the publish screen read as above. Pictures: `/tmp/wmt-shots/upload-words/round1-390-light.png` (Your tier, Publish, limit sheet, Sent for review), `round1-390-dark.png`, `round1-1440-light.png` (Your tier and Publish), plus the single files beside them.
- A one-page PDF piece is refused for its preview by the Hub's own rule (not this task).


## Round 2 (builder, 10 Nov 2026)
From the batch walk (`tasks/history/WALK-1110.md`): a tick-only person (no tier, Hub allows 25) was sent to /tiers from a product draft's Publish, and had no places meter on Me.
- `src/app/shop-product.tsx`: Publish asks the Hub's allowance first; `uploads.allowed` above 0 goes on to /publish, else the old rule (no tier to /tiers, ended to /your-tier, a failed read to /publish).
- `src/features/after-signup/CreatorSetupScreen.tsx`: `uploadingCard(state, places)`: no tier with places says "Uploading is open".
- `src/features/me/MeScreen.tsx` TierMeter: creators read the allowance; no running tier but places above 0 draws the same "N of M used" card (`UploadsMeter`). A fan still does not ask for it.
- Grep for other tier-only gates (`state === 'none'`, `runningTier`, `tier_required`, `onNeedTier`): listed in Current state; the rest are Hub rules, not place gates.
- Tests added: `publishAndTier.test.tsx` (the shop-product route over the real route: tick-only goes to Publish with `Platform.OS` android; no places goes to /tiers), `tierAndDrafts.test.tsx` (the Me meter), `afterSignup.screens.test.tsx` (the setup card).
- Web export (stack uw; the tick set by SQL in the stack's two databases; wallet through the seed tool): a creator with a tick and no tier: Me shows "Uploads 0 of 25 used"; the draft's Publish opens the Publish screen ("Products 0 of 25"), not /tiers. Pictures looked at: `/tmp/wmt-shots/upload-words/round2-390-light.png` and `round2-390-dark.png` (Me, the draft form, Publish); the setup card "Uploading is open": `draftform-tickonly-390-light.png`.
- Checks (each to an EXIT line): typecheck EXIT 0, lint EXIT 0, `npx jest -w 2` EXIT 0 (no suite failed to run), gates EXIT 0, `tasks -- --write` EXIT 0.
- Harness note: a cold deep link to `/me`, `/shop` or `/shop-product` right after sign-in landed on Set up your account (the setup list) on this stack, so the walk went in through Me and the draft tile; I did not look into why (it was the same before this round's changes for `/me`).
