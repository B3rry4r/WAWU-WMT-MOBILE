---
id: VIDEO-PRIVACY
title: A video someone uploads carries no location or device data
owner: YOU
area: FIX
order: 372
priority: after-launch
repo: wawu-backend
type: flow
status: building
depends_on: []
decisions: [R-127]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# VIDEO-PRIVACY · A video someone uploads carries no location or device data

## Current state

As of 10 Nov 2026.
- **Status:** building (round 1 re-check found one medium: a web upload that stays `pending` is not cleaned at publish). Hub `wmt/VIDEO-PRIVACY` head 02c0344 (no merge, a Hub merge deploys). Mobile: this file only. Round 0 verifier report and round 1 builder report are in `tasks/history/VIDEO-PRIVACY.md`.
- **Method (no ffmpeg, no re-encode, no offset rewrite):** every change keeps the size of the bytes it replaces, so each chunk offset stays valid.
  - MP4 and MOV: `udta`, `meta`, XMP boxes under `moov`, each `trak` and at the top become `free` with zeroed bodies; creation and modification times in `mvhd`, `tkhd`, `mdhd` are zero; `free` and `skip` bodies are zeroed (inside `moov` and at the top); EVERY top-level `uuid` becomes `free`; bytes after the last box (a phone maker's trailer) are zeroed; a timed-metadata track (`meta`, `mebx`, `gpmd`, `camm`) becomes `free` and its samples are zeroed (not in a fragmented file).
  - Kept on purpose: `ftyp`, `styp`, `moov`, `mdat`, `moof`, `sidx`, `mfra` and the other structure boxes; non-XMP `uuid` boxes inside `moov` (they can carry stream setup or DRM); handler names and encoder strings (they name no device; the Vorbis/Opus comment header in a WebM keeps `encoder=Lavc...`). Top-level boxes of unknown type are left.
  - WebM: `Tags` and `Attachments` become `Void` of the same size; `DateUTC`, `Title`, `MuxingApp`, `WritingApp` are zeroed.
- **Types and what each gets:** `video/mp4` (`.mp4`) and `video/quicktime` (`.mov`): the MP4 clean (moov at the start or end, 32 and 64-bit sizes, fragmented = moov cleaned, moof not walked). `video/webm`: the WebM clean. Folders: `content/full` (all three), `content/preview` and `profile/work` (mp4), `community/message-video` and `ai/input-video` (all three). Anything else is never touched.
- **Where it runs:** `POST /uploads/confirm`, `confirmUpload` (chat, profile work, legal, preview cut), the publish and edit check (only the caller's own confirmed uploads), and a sweep every 10 minutes over videos confirmed in the last 2 hours.
- **Guards (round 1):** every table-driven loop is bounded by what the file can hold (samples no more than the file's bytes, chunks inside the file, 100,000 boxes per parent, a 1.5 s planning budget); a table that does not fit leaves the file as it is. Reads use `If-Match` on the ETag taken when planning; the ETag is checked again just before the PUT; a changed object is left for the next sweep (`changed`). Window left open: from that last check until the bucket commits the PUT (the transfer time; If-Match on PUT is not relied on because not every bucket supports it). A file that cannot be read is tried once; a failed read or write 3 times per process; then no more reads until the Hub restarts.
- **Large files:** the phone's confirm call is a POST with no Idempotency-Key, so the app never aborts it (src/api/client.ts); the OS network timeouts still apply. The confirm waits only for files up to 100 MiB (about 10 s at 20 MB/s each way). A bigger one (only `content/full` and `ai/input-video` take more) is cleaned about 0.1 s after the confirm answers, in the background; it can be served for about its transfer time (2x its size at the bucket's speed, roughly 50 s for 512 MB at 20 MB/s, longer if two others are ahead of it) and, if the Hub restarts in that window, until the next 10-minute sweep.
- **Sweep for videos already stored (NOT RUN):** wawu-backend `scripts/sweep-stored-videos.ts` (`count`, `plan`, `apply` with `VIDEO_SWEEP_OWNER_OK=yes` on the owner's word). Worst case 2x the stored video bytes plus about 1 MB of reads per file; 1,000 videos of 60 MB is about 120 GB and 50 minutes at 20 MB/s, 2 at once.
- **Waits for:** the verifier, then the owner's word to merge.
- **Next:** builder cleans the caller's own named keys at publish whatever the row status, expires the give-up count, then verify again (see the round 1 verifier report in history).

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
