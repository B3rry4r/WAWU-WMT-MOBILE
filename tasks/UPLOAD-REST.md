---
id: UPLOAD-REST
title: The rest of R-118 (Edit details free to paid, VF12 Publish) and R-120 (a buyer never sees what the creator gets)
owner: YOU
area: ME
order: -10976
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [PREVIEW-AUTO]
decisions: [R-118, R-8, R-27, R-47, R-29]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# UPLOAD-REST · no separate preview upload anywhere; a buyer never reads the creator's pay

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), partial. Mobile `wmt/UPLOAD-REST` on `origin/wmt/PREVIEW-AUTO` `d2929832`; Hub `wmt/UPLOAD-REST` on `origin/main` `6054c4e`. No package, no native change. Fingerprints: NOT RUN here (no `expo fingerprint`).

| # | Item | Before | After |
|---|---|---|---|
| 2 | Edit details, a free piece to paid | the Hub refused "Paid content needs a separate free preview" and the app had no way to send one | Hub `PATCH /content/:id` takes `previewFromFile: true` (additive, no flag is today's behaviour): for a piece the edit leaves paid whose preview is its own file, the Hub makes the preview from the stored full file with the existing preview-cut code (audio, video, PDF, a course's first lesson, a template's cover), counted once, given back if the edit fails, refusals in the Hub's words. App: Save sends `previewFromFile: true` when the price goes from free to paid; a picture (the Hub has no image library) is made on the phone: the piece's own picture comes down, `smallCopyOf` writes the 640 px JPEG, it goes up as `content/preview`, and Save sends it as `previewAsset`; a copy that went up and was not saved is given back when the person leaves |
| 3 | "Not sent" banner on the price step | drawn in the footer, it shrank the body and clipped the Listing fee card | drawn at the end of the body under the Listing fee card, and the body scrolls to it (`CreateFrame` `endKey`); Edit details' "Not saved" the same |
| 4 | R-120, the asker's cards | "{name} earned nothing." on every refund card; "{name} answered, so they've been paid" | refund cards say only what the asker gets back ("It went back to your Naira wallet today at 10:05.", "It is on its way to your Naira wallet.", "Your money went back to your Naira wallet."); the answered card says "{name} answered" |
| 1 | VF12 Publish (`/publish`) | still asks "Add a preview" | NOT DONE (step budget). See Not done |

**Not done (hand back):** (1) VF12 `PublishScreen.tsx`: replace `PreviewTile` and the `preview` slot with the cover step (`CoverChoice`, which needs optional `value`/`onChange` props so Publish keeps its own cover instead of the Create draft's global one), the kind's muted line (`previewLine(format, previewWayOf(format, full))`, not for a free draft: `draft.accessType === 'free'`), and `publishDraft(id, { fullAsset, coverAsset, previewFromFile: true })` for a paid piece that is not a picture, `previewAsset` (the phone-made copy, as `previewFor` does in `PriceScreen`) for a paid picture, neither for a free one; `publishApi.publishDraft` needs the new body shape (`previewFromFile`, `coverAsset` are on `PublishProductDraftDto` already); `canPublish` no longer needs `preview.state === 'ready'`, and a template or a course with no video first needs a cover (`coverRequired`). `previewHint` in `create/model.ts` is then unused and goes. (2) Pictures (hard rule 1): none taken. A local Hub of this branch was brought up on 11800-11802 for the Hub specs only and taken down. (3) `contract/SOURCE_COMMIT` is unchanged: the app's contract copy got the one new property by hand from the Hub's built contract (Hub `dd58a9f`), then `npm run api` regenerated the types.

**Changed assertions (R-120 names the defect each pinned):** `paid-ask/__tests__/model.test.ts` (answered card title "Chidi answered, so they've been paid" is now "Chidi answered"; refund bodies lost "Zainab earned nothing."; the no-record refund body is "Your money went back to your Naira wallet." instead of "Zainab earned nothing."), `paid-ask/__tests__/askFlow.test.tsx` (the answered title; the refund body regex). Added: one model test that no answered or refunded card names the creator's pay, six Hub contract tests in `preview-auto.contract.spec.ts`, six app tests in `library/__tests__/editPaid.test.tsx` (Platform.OS android).

**PHONE CHECK (add):** edit a free picture piece to paid on the phone: the picture comes down, the preview is a small copy, Save works; edit a free audio, PDF and video piece to paid: Save works, the preview is the first 30 seconds or 3 pages.

## Capability checks

- [x] A free audio piece edited to paid with `previewFromFile` has a 30 second preview made by the Hub, counted once; the same edit without the flag is refused as before; a picture, a file too short and a template with no cover are refused in words; a failed edit gives the cut back (Hub `preview-auto.contract.spec.ts`, 22 tests).
- [x] Edit sends `previewFromFile` for a free to paid change and nothing for a paid piece; a picture is made on the phone and sent as `previewAsset` (`editPaid.test.tsx`, Android).
- [x] No answered or refunded card names the creator's pay (`model.test.ts`).
- [ ] Pictures: NOT RUN. VF12: NOT BUILT.
