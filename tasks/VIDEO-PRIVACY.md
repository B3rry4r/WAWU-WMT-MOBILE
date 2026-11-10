---
id: VIDEO-PRIVACY
title: A video someone uploads carries no location or device data
owner: YOU
area: FIX
order: 372
priority: after-launch
repo: wawu-backend
type: flow
status: verifying
depends_on: []
decisions: [R-127]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# VIDEO-PRIVACY · A video someone uploads carries no location or device data

## Current state

As of 10 Nov 2026.
- **Status:** verifying. Built on wawu-backend `wmt/VIDEO-PRIVACY` (one commit on origin/main 7dd5b22; no merge, a Hub merge deploys). Mobile: this file only.
- **Method (no ffmpeg, no re-encode, no offset rewrite):** every change keeps the size of the bytes it replaces, so each chunk offset stays valid and the file plays as before.
  - MP4 and MOV: `udta`, `meta` and XMP boxes (`XMP_`, or a `uuid` with the XMP id) under `moov`, under each `trak` and at the top of the file become `free` boxes with zeroed bodies; creation and modification times in `mvhd`, `tkhd`, `mdhd` are zeroed (version 0 and 1); `free`/`skip` bodies inside `moov` are zeroed; a timed-metadata track (handler `meta`, `mebx`, `gpmd`, `camm`: GPS and motion) becomes a `free` box and its samples are zeroed in `mdat` (not done for a fragmented file, which is logged).
  - WebM: `Tags` and `Attachments` become `Void` elements of the same size; `DateUTC` is zeroed. Walk stops at a cluster of unknown size (a live recording, no tags after it).
- **Video types the Hub accepts and what each gets:**
  - `video/mp4` (`.mp4`), `video/quicktime` (`.mov`): the MP4 clean above. moov at the start or the end, 32 and 64-bit box sizes, fragmented (moov cleaned, moof not walked).
  - `video/webm` (`.webm`): the WebM clean above.
  - Folders that take them: `content/full` (all three), `content/preview` and `profile/work` (mp4), `community/message-video` and `ai/input-video` (all three). Any other file type is never touched.
- **Where it runs (`StorageService.ensureVideoClean`, src/storage/video-privacy/):** `POST /uploads/confirm` (`settleUpload`, phone and web both call it), `confirmUpload` (chat, profile work, legal matter, preview cut), the content publish and edit check (`settleSlowUploads`), and a safety-net sweep every 10 minutes over videos confirmed in the last 2 hours. A file it cannot read, or that fails mid-write, is left as it is and logged (key and reason, never a tag value); the confirm never fails because of it.
- **Cost on the live Hub:** ranged reads of the box headers and `moov` (a few small requests); when something must change the object is streamed through and put back at the same key, same type, same length (about 2x the file in transfer, never held in memory, at most 2 at once). A clean file is not rewritten.
- **Stays:** photos are WEBAPP-04 (redrawn on the device). Creation times are zero in the file; the handler names and encoder strings (`VideoHandler`, `Lavc...`) stay, they name no device.
- **Sweep for videos already stored (NOT RUN):** wawu-backend `scripts/sweep-stored-videos.ts`, modes `count` (database only), `plan` (ranged reads, no writes), `apply` (needs `VIDEO_SWEEP_OWNER_OK=yes`, set only on the owner's word). Worst case it moves 2x the stored video bytes plus about 1 MB of reads per file; at 20 MB/s per file and 2 at once, 1,000 videos of 60 MB is about 120 GB and 50 minutes. `count` on the live database gives the real figure. Detail in the history file.
- **Waits for:** the verifier, then the owner's word to merge. The sweep of videos already stored waits for the owner's word (below).
- **Next:** verifier on wawu-backend `wmt/VIDEO-PRIVACY`.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/WEBAPP-04.md` (how photos are cleaned) and wawu-backend `src/storage/` (how uploads land and are processed)

## Goal

No video a person uploads, from the phone or the web, keeps where it was filmed or the device it was filmed on, and it still plays everywhere it played before.

## Scope

- wawu-backend: after a video upload lands, its container metadata (location, device make and model, creation tags) is removed without re-encoding where possible; the file still plays on iPhone, Android and the web.
- A one-off sweep for videos already stored, run only on the owner's word, with how many files and how long.
- Nothing in the app.

## Capability checks

- [ ] A person uploads a video filmed with location on, from the phone and from the web; the stored file has no location or device tags (read back from storage on the stack) and still plays.
- [ ] Every protected route behaves as before (V3).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/VIDEO-PRIVACY.md](history/VIDEO-PRIVACY.md).

## Owner sign-off
