# VIDEO-PRIVACY · round history

Moved out of [tasks/VIDEO-PRIVACY.md](../VIDEO-PRIVACY.md) word for word, oldest first. The current state is in that file.

## Builder report

Files (Hub): src/storage/video-privacy/{types,clean-mp4,clean-webm,clean-video,apply-patches,clean-stored}.ts; hooks in storage.service.ts (confirmUpload, settleUpload, ensureVideoClean, sweepVideoPrivacy), storage-sweep.service.ts, content-piece.service.ts (settleSlowUploads); specs video-privacy, -stored, -ffmpeg; scripts/sweep-stored-videos.ts. No schema change, no route change, no protected route touched.
Real files (ffmpeg fixtures, ffprobe): mp4 moov-at-end, mp4 faststart, mov at end and start, fragmented mp4, 64-bit mdat, 64-bit mdat and moov, webm, and an mp4 with a subtitle track turned into a `meta` track. Before: location, make, model, creation_time in ffprobe. After: none; same codecs, durations and frame counts; same size; `ffmpeg -v error -i out -f null -` EXIT 0 for all; a second run makes 0 patches.
Stack vp (Hub 16100, storage stand-in 16115): real routes presign, PUT, `POST /uploads/confirm` for an mp4 (profile/work), a mov (community/message-video) and a webm (ai/input-video): stored before confirm had the location bytes; read back after: none, ffprobe shows no location/make/model, same size, decodes EXIT 0. A random file named .mp4 is stored byte for byte and logged `left`.
Checks (Hub, after merging origin/main e8aa92e): new specs 24 tests, EXIT 0 (video-privacy, -stored, -ffmpeg); `npm run test:contract` on the affected folders (storage, content-piece, chat, user-profile, community-message; 67 suites, 974 tests, seeded stack database): 9 tests in 3 suites fail (display names from the mock identity: profile-work-owner, feed-cards, chat) and the same 9 fail on origin/main; tsc EXIT 0; eslint on changed files EXIT 0; `python3 scripts/gates/run.py` EXIT 0 (0 fail, 139 warn, none mine); check_baseline EXIT 0. The full 699-spec contract run is CI's.
PHONE CHECK: an iPhone and an Android video filmed with location on, uploaded from the app, plays back in the app after the clean.
NOT RUN: the sweep for videos already stored (script written, count and plan only against the stack's own database); a real iPhone or Android file; the live Hub and the real bucket; the Hub on a server without ffmpeg (the cleaner uses none).

### The sweep for videos already stored (for the owner's word)
`scripts/sweep-stored-videos.ts` (wawu-backend). `count` reads the database only: rows `confirmed`, not released, not being removed, key ending .mp4, .mov or .webm; prints files and bytes by type. `plan` reads each file by ranges and says how many carry tags, writes nothing. `apply` cleans them and refuses unless `VIDEO_SWEEP_OWNER_OK=yes`. Safe to stop and run again; same cleaner, same leave-and-log rule.
Estimate: worst case every file is rewritten once, so transfer is 2x the stored video bytes plus about 1 MB of small reads per file. Time = that over 20 MB/s per file, 2 files at once. For example 1,000 videos averaging 60 MB is 60 GB stored, about 120 GB moved, about 50 minutes. Real numbers come from `count` on the live database, which the owner's word allows.

## Verifier report

