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


## Verifier report

Verdict: **FIX** (T1 verifier, 10 Nov 2026, Hub head 2717d15, own worktree, stack `vpv` on 16100-16109 with the storage stand-in on 16115; nothing real touched).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 privacy | passed for ffmpeg-made phone-style files; leftovers listed below | 18 fixtures (iPhone-style MOV moov at start and end, `mebx` track, Android `loci` and `(c)xyz` in `udta`, XMP `uuid` and `XMP_`, 64-bit moov and XMP, fragmented, WebM with Tags): raw grep for the location, make and model strings: 0 hits; ffprobe tags: none; creation_time: none |
| V3 protected | passed | no route, DTO, schema or contract file in the diff (only src/storage, the sweep script, 4 lines in content-piece.service); contract run on storage, content-piece, chat, user-profile, community-message: branch 67 suites / 974 tests, main 64 / 950 (the 3 new suites, 24 tests, all pass); the failures are the unseeded stack database's, in the same suites on both, and the two suites that differed (profile-experience, profile-stats) pass alone, EXIT 0 |
| V4 / V6 / V7 / V9 | passed for the routes driven | presign, PUT, confirm on the stack for mov (community/message-video), webm (ai/input-video), mp4 with XMP (community/message-video), mp4 64-bit (profile/work): object read back from the stand-in has no tags, same size, `ffmpeg -f null -` EXIT 0 |
| gates | passed | `python3 scripts/gates/run.py` EXIT 0 (9 gates, 2228 files, 0 fail, 139 warn); check_baseline EXIT 0; eslint on the 11 changed .ts files EXIT 0 |

Attack results
1. Privacy: see V1. Leftovers: (a) an unknown `uuid` box with device text, a top-level `free` box with text, and bytes after the last box (Samsung SEFT-style trailer) all keep their text (fixtures uuid_other, free_tail, trail_junk); (b) WebM `Info/Title` stays ("Alice at home"); (c) iPhone `mebx` and Apple players not tried on a real device.
2. Playback: 11 cleaned files have identical stream list, codec, duration, width, height and frame count to the input, decode EXIT 0, size diff 0, display-matrix rotation 90 kept (rotated.mp4). The dropped `mebx` track makes 2 streams instead of 3, as built.
3. Never breaks a file: truncated, zero-byte, text named .mp4, huge 32 and 64-bit box size, box loop (5000 free boxes), truncated webm: all left byte for byte, logged `left`, confirm 200 `confirmed`, no crash. Exception: see finding 1.
4. Cost: first look per key per process is 1 HEAD + 5 ranged GETs (about 4 KB); a clean or cleaned key is then remembered in memory, so over 2 hours of 10-minute sweeps it is 0 more reads (12 rounds measured). A restart or a second Hub instance repeats the 4 KB once. A file that is `left` is re-read every sweep (12 times in 2 hours, HEAD + 3 GETs each). Memory: 500 MB file, rewrite streamed, peak RSS 106 MB (baseline about 70 MB); transfer 1 full GET + 1 PUT of the same length, about 4.6 s on loopback.
5. Races: a replacement written to the same key during the rewrite is overwritten by the old patched bytes (lost update; no If-Match / ETag check, only the length is compared). A release during the rewrite is handled (spec, `stillWanted`).
6. Additive: see V3. tsc --noEmit: NOT RUN to an EXIT (OOM-killed 3 times at 2.0 GB to 3.0 GB heap on this shared machine, EXIT 137); the stack's `nest build` of the branch compiled and the 3 new specs and 64 storage specs compiled under ts-jest.
7. Stack: see V4 row. Publish of a piece whose video was a slow upload: NOT RUN on the stack (needs a ticked creator); by reading, `settleSlowUploads` ends with `ensureVideoClean` for every named key.
8. Sweep script: `apply` without `VIDEO_SWEEP_OWNER_OK=yes` refuses ("apply needs the owner's word"), exit 1; `count` and `plan` wrote nothing (stand-in key list and a dirty object's bytes identical, `plan` reported wouldClean 1); `apply` with the flag, on my stack only, cleaned it.

Findings
- **high / defect: one small file freezes the Hub.** `sampleRuns` in clean-mp4.ts loops `per` samples per chunk with `per` and the sample count read from the file (`stsc` samples-per-chunk 0xFFFFFFFF, `stsz` uniform size 1, count 0xFFFFFFFF, handler `mebx`). A 650-byte `.mp4` (tmp /tmp/vpv/fx/cpu.mp4) blocks the Node event loop: 5.6 to 6.9 s on the stack Hub (a /health call during it waited 3.5 s), 72 s in a plain node run. Reachable by any signed-in account (community/message-video is open to all) through confirm, repeatable. The same file stalls the sweep script. Needs a bound on `per` and on the total samples against the `stsz` size and the file length, and the walk must not run for an unbounded time.
- **medium / defect: text that stays.** An unknown `uuid` box, a top-level `free`/`skip` body, and bytes after the last box are not cleaned (and a trailing-bytes file logs only a note). Phones that write device data there keep it. Zero top-level `free`/`skip` bodies and the unread tail, or list them under "Stays" in the task so the owner can rule. (Same for WebM `Info/Title`: low.)
- **medium / defect: rewrite is not guarded against a changed object.** Plan is built from ranged reads, then the whole object is read again and patched by offset; only `ContentLength` is compared. A same-length replacement between the two would get patches at the wrong offsets, and a replacement during the rewrite is overwritten with the old bytes. Read the ETag from the HEAD, send `IfMatch` on the full GET, and `If-Match` is not available on PUT, so check the ETag again just before the PUT or accept and say so.
- **low: a `left` file is retried every 10 minutes for 2 hours** (a failed PUT of a big file would move 2x its size up to 12 times). Remember failures for a while.
- **low: `settleSlowUploads` cleans every key named in the request, not only the caller's own** (harmless but an extra rewrite for another person's file).
- **low: confirm waits for the whole rewrite.** For a big file with tags the confirm request takes the 2x transfer time (about 5 s per 500 MB on loopback, about 50 s at 20 MB/s) and waits behind 2 at once; the app's confirm timeout was not checked.
- test-gap notes: no spec for a crafted sample table (finding 1); no spec for the settleSlowUploads hook.

NOT RUN: real iPhone or Android file and Apple players on the cleaned `mebx`-less file; tsc --noEmit to an EXIT; publish of a slow-upload piece on the stack; content/full through the real routes (tier gate); the sweep on a live-sized set; the full 699-spec contract run (CI's).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/VIDEO-PRIVACY.md](history/VIDEO-PRIVACY.md).


## Builder report (fix round 1)

Round 1 (fix of the verifier's findings, Hub 02c0344 on top of 2717d15). Files: video-privacy/{clean-mp4,clean-webm,clean-stored}.ts, storage.service.ts (ensureVideoClean takes a background flag), content-piece.service.ts (settleSlowUploads), scripts/dev/storage-standin.cjs (ETag and If-Match, 412), specs video-privacy (19), -stored (8), -ffmpeg (8), content-piece/tests/settle-slow-video-clean.
1 HIGH crafted table: every loop bounded by what the file can hold (samples no more than the file's bytes, chunks inside the file, 100,000 boxes per parent, a 1.5 s planning budget). Stack: the verifier's cpu.mp4 confirmed in 90 ms, /health stayed 1.6 to 13 ms during it (20 samples), file stored unchanged. Spec: the same table (0xFFFFFFFF per chunk and count) planned in under 500 ms, track left, the rest cleaned; also a count over the table and a chunk past the end of the file; a moov of 110,000 boxes refused. WebM Info loop capped at 1000 elements; the WebM top walk was already capped at 2000.
2 Leftovers: unknown top-level uuid, top-level free and skip bodies, bytes after the last box, WebM Title, MuxingApp, WritingApp: all zeroed on real files (ffmpeg mp4 plus uuid, skip, free and a SEFT-style trailer; ffmpeg webm with a Title): no text left in the bytes, same size, ffmpeg decode EXIT 0, same duration; on the stack the same through the routes. Kept: structure boxes (ftyp, styp, moov, mdat, moof, sidx, mfra), non-XMP uuid inside moov (stream setup or DRM), unknown-type top-level boxes, handler and encoder strings. A trailer that starts like a box is a cut-short file and the file is left.
3 ETag: If-Match on every read of the version HEADed, ETag compared on the full read and again just before the PUT; changed means no write, left for the next sweep. Specs: a replacement during planning and just before the write (no PUT, replacement kept). Window left: from the last check to the bucket committing the PUT (the transfer time); If-Match on PUT is not relied on.
4 settleSlowUploads cleans only the caller's own confirmed, unreleased uploads (spec). 5 Tries: unreadable file once, failed read or write 3 times per process, then no more reads until restart (specs). 6 Confirm limit: the phone's confirm is a POST without Idempotency-Key, so the app never aborts it (src/api/client.ts); the confirm waits for files up to 100 MiB (about 10 s at 20 MB/s each way); larger ones (only content/full and ai/input-video) are cleaned 0.1 s after the answer and by the sweep; served unclean for about their transfer time (roughly 50 s for 512 MB at 20 MB/s). Stack: a 110 MB ai/input-video confirmed in 26 ms, location bytes present right after, gone 4 s later. Web: no uploads/confirm call found in the web repo.
7 Test gaps closed. Checks: jest new specs 36 tests EXIT 0; eslint on changed files EXIT 0; gates EXIT 0, baseline EXIT 0; `NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit` EXIT 0 on try 1. Round 0 contract result stands (no route touched). Stack vp torn down, database dropped.
NOT RUN: real phone files; Apple players; the live Hub and bucket; the sweep `apply`; a bucket that ignores If-Match on GET (then the second ETag check and the length check are what is left).

## Verifier report

Round 1 re-check (T1 verifier, 10 Nov 2026), Hub head 02c0344, stack `vpv` on 16100-16109, storage stand-in 16115. Verdict: **FIX** (one medium, the rest low).

| Check | Result | Evidence |
|-------|--------|----------|
| 1 freeze | passed | cpu.mp4 plus crafted huge stco, co64, stsc rows, 20,000-deep box nests, 500,000 small boxes, 300,000 top-level boxes, WebM element of size 2^56, 2,000,000-element EBML loops: each plans in 0.04 to 0.10 s (was 72 s); through the real confirm route 66 to 145 ms each, 6 at once, /health 2 to 4 ms throughout (was 3.5 s). A 250,000-sample file (180,000 video + 70,000 audio samples, 8.9 MB, made with ffmpeg) plans in 0.11 s and is cleaned in full: location and make gone, decode EXIT 0. |
| 2 leftovers | passed | uuid_other, free_tail, trail_junk, webm_tags: raw grep 0 hits, streams, frame counts, size and duration identical, decode 0 errors, size diff 0; WebM Title, MuxingApp, WritingApp zeroed. Zeroing every top-level `uuid`: no phone file needs one (players ignore unknown top-level uuid; the XMP one is the only one phones write; PIFF/Smooth Streaming uuid boxes live inside `traf`, not at the top). Safe for phone files; an ISMV file would lose its manifest uuid, which no phone writes. |
| 3 ETag | passed | stand-in with ETag and If-Match (a dev script): a same-length replacement written during planning, just before the full read, and between the full read and the pre-write HEAD each ends `changed`, and the object afterwards is the replacement, byte for byte. Open window as the builder says: from the pre-write HEAD to the bucket's commit of the PUT. |
| 4 own keys, tries | partly | own keys: the publish check cleans only confirmed rows of the caller (finding 1). Tries: an unreadable file is tried once (then 0 requests), a failed read 3 times then "given up", 0 requests. |
| 5 confirm | passed with notes | a 125.9 MB file (ai/input-video): confirm 21 ms, cleaned right after (log + read back, no tags); small files cleaned before the answer. The phone's confirm (chat/attachments.ts, communities/api.ts, points/fileToolApi.ts, verify/voiceApi.ts) is `api.POST` with no Idempotency-Key and no `resendsUnderKey`, so `timeoutOf` gives null: never aborted. The web app never calls `/uploads/confirm` at all (finding 1). Who can read a large unclean file: content/full only after a purchase (nobody can have bought within the 50 s window of a new piece; the creator can), ai/input-video only the owner and the AI job. |
| 6 checks | passed | tsc --noEmit EXIT 0 (4 GB heap, alone); eslint on changed files EXIT 0; gates EXIT 0 (9 gates, 2229 files, 0 fail, 139 warn); check_baseline EXIT 0; new and changed specs (video-privacy x3, settle-slow-video-clean): 4 suites, 36 tests, EXIT 0. |

Findings
- **medium / defect: a web upload is no longer cleaned at publish.** The web never calls `/uploads/confirm`, so its video rows stay `pending`. `assertFilesNotGivenUp` accepts `pending` rows, but round 1's own-keys query in `settleSlowUploads` (content-piece.service.ts, `status: 'confirmed'`) skips them, and `sweepVideoPrivacy` also reads only `confirmed` rows. A `pending` row becomes `confirmed` only when a usage read or the sweep settles it (storage.service.ts, line 1872 path, no clean call there), then the 10-minute sweep must catch it (20 per pass, most recent first). Round 0 cleaned every named key at publish. So a web-published content/full video can be served unclean until that settle plus a sweep, which is not bounded by the 2 hours the report claims for confirmed rows. Found by reading the code; not driven on the stack (needs a ticked creator). Fix: in the publish check clean each named key whose row is the caller's own and not released or removing, whatever its status (the key's own prefix names the owner).
- **low: giving up is for the life of the process.** Three failed reads or writes (a bucket outage across three confirms or sweeps) stop all later tries for that key until the Hub restarts, so a tagged file stays tagged. Expire the count (for example after an hour).
- **low: a WebM walk has no time budget.** Up to 2,000 sequential ranged reads per confirm (a crafted 4 MB WebM with 2,000,000 void elements: confirm took 3.8 s on loopback; on a real bucket at 50 ms per read about 100 s, non-blocking, 2 at once). Pre-existing cap, not new; a real recording has hundreds of clusters.
- **low: window from the pre-write HEAD to the commit of the PUT** still overwrites a replacement (as built, stated).
- test-gap: no spec drives a `pending` row through the publish check.

NOT RUN: the publish of a web-uploaded piece on the stack (needs a ticked creator); real iPhone or Android file and Apple players; the web app's upload code beyond a grep for `uploads/confirm`; content/full through the real routes; the full 699-spec contract run (CI's); a real bucket's If-Match behaviour (the stand-in's is a dev script).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/VIDEO-PRIVACY.md](history/VIDEO-PRIVACY.md).

