---
id: COVERS-APP
title: The app draws a piece's cover and lets a creator set, change and remove it (part B of PREVIEWS-APP, R-114)
owner: YOU
area: ME
order: -10978
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47, R-29]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# COVERS-APP · Draw `coverUrl` everywhere a piece has a picture, and let the creator send one

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/COVERS-APP` on `origin/wmt/STORE-BUY-APP` `0d730a7a` (contains PREVIEWS-APP). App only. The Hub's cover is live in code on backend `origin/main` `34af393` (PR #242, `docs/contract/COVERS.md`); the contract was copied with `python3 scripts/api/sync_contract.py --backend ../wawu-backend` (SOURCE_COMMIT `34af393`, the generated types regenerated, never hand-edited). No new package, no native change: fingerprints must stay android `e871fe1a`, ios `e8e7de85` (printed below). Held for the next batch; nothing sent to a phone.

| # | Brief item | Before | After |
|---|---|---|---|
| 1 | `X-Wawu-Client: app` on every Hub request | already true (R-101, PRICE-LIST): `api.use(appClient)` in `src/api/client.ts`, one place | unchanged; the spec on the client is `src/__tests__/client-app-header.test.ts` (a read, a write, a body, the repeat after a token refresh). The raw `fetch` calls left in the app go to storage upload links and WAWU ID, not the Hub |
| 2 | draw `coverUrl` through the shared rule | rows and cards decided picture or mark from the preview file only | `pictureCandidates(piece, previewUrl)` (`feed/model.ts`): cover first, then `rowPicture`; `usePicture` (`feed/usePicture.ts`) draws the first that has not failed, so a cover that will not load gives way to the preview's picture and then the kind mark. Used by: the piece page (course and template before their preview, video under the player until its first frame, audio in place of its mark, the "From the course" row), the feed (video and course under the player until the first frame, audio square, template frame, creator-card works), Search rows, My content, Rejected, the Content tab (own and visitor), Purchases, Saved, and both pay sheets' thumbnail (the quote's `coverUrl`). Not drawn, by design: a PDF card and a PDF piece page keep their generated book (H4, H19 draw a book); earnings rows and school rows draw no picture today (R-47: nothing is added where no board draws a picture) |
| 3 | Create: a Cover choice | none | "Cover" under "How it will look" on the preview step (M22): Video frame (the default for a video or course with a readable frame), Picture (the phone's photo picker; png, jpeg, webp), None. A picked picture goes to `content/cover` at once; the tiles of "How it will look" and the price step's card draw what the listing will carry (`listingStill`); `coverAsset` goes on `POST /content` (the frame is written as a JPEG with `expo-image-manipulator`, already installed, and sent at Send; a frame that cannot be written or sent leaves the piece without a cover and the piece still goes). Edit details (from M26) gets a Cover row: Change (new picture, sent on Save as `coverAsset`), Remove (`coverAsset: null`), nothing sent unchanged; a picture that went up and is not saved is given back to the Hub |
| 4 | refusals | n/a | the Hub's own sentence is shown (`cover-failure`, `edit-cover-failure`): over 5 MB, a type the Hub does not take, no room in storage; nothing invented |

**No artboard draws a cover choice** (Default (lead), owner may override): the row sits under "How it will look" on M22 in the step's own parts (label, muted line, `SegmentedTabs`, a picked row with a 64 px thumbnail), the way the preview row sits; the Edit details row is built in the same parts as that screen's other fields. The feed's cover under a video before its first frame and the course page's cover are gap rows (R-29): no board draws a loading state.

**Changed assertions: none.** Fixtures typed from the regenerated contract gained `coverUrl: null` (`feed/__tests__/model.test.ts`: the piece and a card work), because `FeedItem` and `CardWork` now require the field; no `expect` changed. `readUnlockQuote` and `asFeedItem` carry the field (`?? null`).

## Capability checks

- [x] A user sees the cover on the course and template pages, a video's page under the player, an audio's page, the "From the course" row (`coverMedia.test.tsx`, Android), with the first frame, the book, the preview picture or the mark returning when the cover will not load.
- [x] The feed draws the cover on video, course, audio, template and creator-card work tiles (`coverPosts.test.tsx`).
- [x] Search, My content, Rejected, Content tab (own and visitor), Purchases, Saved: cover first, fallback to the preview picture, then the mark (the `rowPictures.test.tsx` and `gridPictures.test.tsx` files).
- [x] Create: the default frame cover is written, uploaded to `content/cover` (no `format` in the presign body) and sent as `coverAsset`; a picked picture likewise; None sends nothing; a Hub refusal is shown in its own words; a frame that fails sends no cover and the piece goes (`create/__tests__/cover.test.tsx`, Android).
- [x] Edit: Change, Remove and the refusal (`library/__tests__/editCover.test.tsx`, Android, `pickFile` given the three cover types).
- [ ] On a phone: NOT RUN (no device); see PHONE CHECK.

## Pictures

390 px, dark and light, built beside the board, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/covers-app/shots/`: `<name>-vs-<board>-{dark,light}.png` for `course-vs-H25`, `template-pdf-vs-H19`, `search-vs-X7`, `library-vs-M28`, `purchases-vs-M29`, `saved-vs-M30`, `feed-vs-H2`, `me-vs-M1`, `cover-default-vs-M22`, `cover-picture-vs-M22`, `cover-none-vs-M22`, `price-cover-vs-M24`, `edit-vs-M26` (Edit details has no artboard; M26 is the screen that opens it). Taken from this branch's web export against a local Hub stand-in (`stub.py`, `shoot.py`, `compose.py` in `covers-app/`) that serves `coverUrl` ONLY on a request carrying `X-Wawu-Client: app`, as the Hub does; a temporary route for the create steps, never committed. A local Hub stack (`scripts/dev/stack.sh`) was not run: this round's step budget ended first (NOT RUN: an end-to-end upload against the real Hub's presign and create).

## PHONE CHECK (owner's phone list, before the update)

- Create a video: Cover shows "Video frame" selected; send; the listing shows the frame as its cover in My content, Search and the feed (the frame is written as a JPEG by the phone's image manipulator: the first time that path runs on a phone).
- Pick a picture from the gallery as the cover (Android and iPhone); a picture over 5 MB: the Hub's sentence; Back from the photo picker leaves cleanly.
- Edit details on a rejected piece: Change, Remove, Save; leaving without saving after a picture went up leaves no stray file counted in storage.
- Feed and piece page: the cover shows under the video until its first frame, and the player's 2 s read-ahead is unchanged.

## Read first

- backend `docs/contract/COVERS.md`, `docs/contract/CONVENTIONS.md` 3a; `tasks/PREVIEWS-APP.md`
- `src/features/feed/model.ts` (`pictureCandidates`), `src/features/feed/usePicture.ts`, `src/features/create/CoverChoice.tsx`, `src/features/library/EditCover.tsx`

## Goal

Every surface that draws a piece's picture draws its cover when it has one, and a creator can send, change and remove it.

## Scope

`wawu-wmt-mobile` only. The regenerated contract and types (`contract/**`, `src/api/schema.generated.ts`, by `npm run api`), the surfaces above, the Create steps (`draft.ts` keeps the cover apart from the draft's own three fields so a piece with no cover reads as before), `upload.ts` and `api.ts` (the `content/cover` folder, no format), Edit details. No route, no package, no native change.
