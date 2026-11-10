---
id: CREATE-FRAMES
title: A video the person uploads is drawn as a frame of itself in Create (How it will look, and the price step's card)
owner: YOU
area: ME
order: -10980
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# CREATE-FRAMES · A video is drawn as a frame of itself while it is being made

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/CREATE-FRAMES` on `origin/wmt/STORE-BUY-APP` `a77f50bb`. App only: no backend change, no new package, no native change (`expo-video` ~57.0.5 is already installed; fingerprints android `c2474bd9`, ios `240378f1`, unchanged). Held for the next batch; nothing sent to a phone. Status verifying.

Owner, 30 Oct 2026, uploading a 4 MB mp4 on Android: "Is this network or is preview just broken?" Neither: M22's three tiles and M24's card drew a still only for a photo, so a video showed a play icon in empty boxes.

| # | Before (`a77f50bb`) | After |
|---|---|---|
| 1 | M22 "How it will look" drew a picture only when the preview file was an image; a video gave three boxes with a play icon | a video preview is drawn as a frame read from the person's own file: the frame twice, then the frosted locked tile with the lock, as a photo is drawn |
| 2 | M24's piece card drew the play icon for a video | it draws the same frame |
| 3 | no way to tell a slow file from a missing feature | a file whose frame cannot be read keeps today's icon: no error line, no spinner, the upload goes up as before |
| 4 | My content row of a video: icon | unchanged, by the Hub (row below) |

How it works (`src/features/create/`): `frames.ts` opens the file with `expo-video`'s `createVideoPlayer`, waits for `readyToPlay` (an iPhone opens a .mov after the player exists), reads one frame with `generateThumbnailsAsync` at 0.5 s (the middle for a clip under a second), at most 480 px on the long side, and lets the player go. Android reads a gallery `content://` link with `MediaMetadataRetriever`, iOS reads with `AVAssetImageGenerator`; both apply the video's rotation. It never throws and gives up after 4 s (`FRAME_TIMEOUT_MS`), so a hung file costs at most 4 s before the upload starts, then keeps the icon. The frame is read BEFORE the upload because the phone's own copy of the file is deleted when the upload settles (`uploadFile` calls `discard`). The frame is held in the draft (`UploadedFile.frame`, memory only) and is never sent anywhere. `frames.web.ts` does the same in a browser with a canvas (null when the browser cannot play the file). `still.ts` (`stillOf`) is the one rule for "the picture of a file": a photo is itself, a video is its frame, anything else none; `PreviewScreen` `LookTile` and `PriceScreen` `PieceCard` both use it.

**Item 2, My content: not possible, a Hub gap.** The contract (`schema.generated.ts`, backend main) has no cover, poster or thumbnail field on `CreateContentDto` or `UpdateContentDto`; `PUT /content/{id}/media` `frames` takes pictures for a photo set (`contentType: image`) only; `MyContentItem.previewAssetUrl` is the clip itself. Nothing invented. Row **G-CREATE-FRAMES-1** in `BACKEND_GAPS.md` (Hub: poster frame for a video piece; same cause as G-218, G-290, G-ME-14-3); My content, the grid and the feed still draw the icon for a video.

**The artboards (M22, M24):** M22 draws three tiles of one sample photo (a PDF piece) and nothing specific for a video; ME-04 decision 3 read that as "the picture for an image, the format's icon otherwise" because the canvas photo is not the person's file. Now a video draws the person's own frame in the same tiles (3:4, 10 corners, third frosted with an 18 lock), so it reads as the board does. M24's card draws a sample photo as the cover; a video's cover is now its frame. No artboard draws a failed frame: built from the existing parts (the icon tile, as before), no new element.

## Pictures

390 px, dark and light, built beside the board, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/create-frames-b/shots/`: `M22-vs-preview-{dark,light}.png` (board | landscape video | portrait video | failed frame) and `M24-vs-price-{dark,light}.png` (board | landscape | failed frame); single shots `preview-{landscape,portrait,fallback}-{theme}.png` and `price-{landscape,portrait,fallback}-{theme}.png`. Taken from this branch's web export (`frames.web.ts`, a VP9 mp4 made with ffmpeg, a Hub stand-in on the browser's own requests; script `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/create-frames-b/shoot.py`, temporary route `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/create-frames-b/crframes-route.tsx`, never committed). The phone's reader (`expo-video`) cannot run on the web: it is proven in jest and by the PHONE CHECK below. The M24 board's price block (picker, "Price per sale") differs from the built price step; that is older work, not touched.

## PHONE CHECK (owner's phone list, before the update)

- A real 4 MB mp4 from the Android gallery as the preview: frames on M22's tiles within about a second of the bar starting, and on M24's card.
- A 100 MB mp4 from the gallery: the frame still arrives, the upload is not held up by more than a moment.
- A portrait video and a landscape video: upright, not sideways, not stretched (tiles crop to fill).
- An iPhone .mov: frame appears (the iOS reader waits for the file to open).
- A video the phone cannot open (a damaged file): icon, no error line, upload as before.
- Back during the frame read: leaves cleanly.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `src/features/create/PreviewScreen.tsx`, `PriceScreen.tsx`, `frames.ts`, `still.ts`
- `node_modules/expo-video/android/.../MediaMetadataRetriever.kt` and `ios/Thumbnails/VideoThumbnailGenerator.swift` (what the reader does with a link and with rotation)

## Goal

A person making a video piece sees their own video's frame wherever Create shows the preview, instead of an empty box with an icon.

## Scope

`wawu-wmt-mobile` only: `src/features/create/` (`chosen.ts` the `Frame` type, `draft.ts` one optional field, `frames.ts`, `frames.web.ts`, `still.ts`, `PreviewScreen.tsx`, `PriceScreen.tsx`) and two new test files. `pickFile`, `upload`, the lessons screens, My content, the feed: untouched.

## Capability checks

- [x] A user picking a video from the Android gallery (a `content://` link, the real `pickFile` and `readPicked`) sees a frame in the two tiles and the frosted locked tile (`framesScreen.test.tsx`, `Platform.OS` android).
- [x] The same frame is the cover on the price step's card.
- [x] The frame is read before the upload starts (the phone's copy goes when the upload settles).
- [x] A frame that fails (the reader errors, answers nothing, never opens, never answers) keeps the icon; the upload still lands; no failure line; Continue works (`frames.test.ts` 8 cases, `framesScreen.test.tsx`).
- [x] A tile whose picture cannot be drawn falls back to the icon.
- [x] Leaving while the frame is read starts no upload.
- [x] An image preview is drawn as before and an audio preview keeps its icon; neither opens a video reader. No existing assertion changed.
- [ ] On a phone: NOT RUN (no device in this session); see PHONE CHECK.
