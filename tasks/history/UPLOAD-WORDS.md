# UPLOAD-WORDS · round history

Moved out of [tasks/UPLOAD-WORDS.md](../UPLOAD-WORDS.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/me/model.ts` (`placesOf`, `productsMeterOf(tier, allowance)`), `create/CreateScreen.tsx`, `create/UploadsMeter.tsx`, `me/MeScreen.tsx`, `verify/YourTierScreen.tsx`, `verify/PublishScreen.tsx`, `verify/ProductsFullSheet.tsx`, `verification/model.ts`. No fenced file, no Hub change.
Tests updated (their expected words changed by this task): `create.test.tsx` (two lines of copy; two new R-129 meter tests), `library.test.tsx`, `entries.test.tsx` (copy), `verificationFlow.test.tsx` (the D-7 M16 test split into three: a pre-tier tick sees 25, a tier or no tick sees no uploads row), `meMenuRoute.rows.test.tsx` (the fan's fixture now holds no tier, so the Me meter does not ask the allowance; assertion unchanged).
Web export on a stack (`uw`, real wawu-id, Nuvion stand-in, tiers bought through the Hub with a funded wallet and PIN; the pre-tier tick set in the stack's own two databases), served behind `vercel.json` headers, 0 CSP violations: free person: no meter, space row only; Verify: "0 of 4" on Create, My content and Your tier, no uploads row on the verification page; Founding Maker: "0 of 15" on all of them, no uploads row; person with a tick from before tiers: "Up to 25 uploads" on the verification page and "0 of 25 used" on Create and My content. Pictures (looked at): `/tmp/wmt-shots/upload-words/board-vs-{verification,create,library}-390-{light,dark}.png` (board M16, M19, M28 then the four people) and `four-*-1440-light.png`.
Stack artifacts, not app findings: the pre-tier tick person's verification page still draws "Get your tick" because the tick was set by SQL in the stack's two databases and the page reads another field of it; accounts were made with wawu-id `/auth/register` and confirmed in the stack's database, then signed in through the real sign-in screen; Chromium ran with `--disable-web-security` because the Hub's CORS list holds only the stack's own origins.
Gaps filed: none.

## Verifier report

