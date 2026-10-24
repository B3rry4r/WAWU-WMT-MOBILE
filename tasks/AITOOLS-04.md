---
id: AITOOLS-04
title: Captions and Clean audio, with the person's own audio or video going in (backend)
owner: YOU
area: POINTS
order: -123
priority: launch
repo: wawu-backend
type: third-party
status: building
depends_on: [AITOOLS-02]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-04 · Captions and Clean audio, with the person's own audio or video going in (backend)

## Current state

As of 24 Oct 2026, **building (verifier said FIX)**. Tier T2, backend only. Verifier (Sonnet, not the builder) checked backend `wmt/AITOOLS-04` `d571fbd` against `origin/main` `0cd8f8e`. Full report: [history/AITOOLS-04.md](history/AITOOLS-04.md), section "Verifier report".
- **Heads:** backend `wmt/AITOOLS-04` `d571fbd` (unchanged by the verifier); mobile `wmt/AITOOLS-04` carries these records.
- **Passed live over HTTP on the stand-in (own database):** catalogue (Captions 15 and Clean audio 400 a minute, `input.kind: file`); quotes priced from the Hub's own reading (WAV 90 s = 2 min, MP3 61 s = 2, real MP4 with AAC 90 s = 2, M4A, ADTS AAC, WebM); jobs for both tools; every provider failure gives every point back; refusals hold nothing (unreadable, wrong type, over the byte cap, over the minute cap, another person's key, unconfirmed key, other folder, traversal); input file deleted either way; same key = one job and one hold (8 at once); 5 jobs on a balance for 3 = three 202 and two 402; late finish after the stale sweep fails with no words kept and the points back. VoiceOver, Quick voice, Sound effect, Music: live jobs done, specs pass; the changed counts (4 to 6 tools) and the two "not built" assertions are right.
- **Checks:** tsc `EXIT 0`; eslint (no --fix, 32 changed files) `EXIT 0`; 21 suites, 252 tests in band `EXIT 0`; `test:protected` 253/253 on the branch and on main, both `EXIT 0`; contract:build `EXIT 0`, no diff; gates 0 fail, 133 warn, 88 accepted (1768 files; main 1759, same counts) `EXIT 0`; check_baseline `EXIT 0`. `POST /uploads/presign` IS in `.pipeline/protected-registry.json` (probe folder `content/preview`); the change only adds two folders, so nothing the web sends changes.
- **Real provider (one Captions job, one Clean audio job, each on a 5 s clip, through a pass-through logger):** both answered 200 (key has access to both). Captions: 702 ms, correct text, 33 word entries (`word` and `spacing`), `audio_duration_secs` 5.095, SRT of 3 cues. Clean audio: 664 ms, `audio/mpeg`, 205,888 bytes, 5.12 s. **Neither provider copy was deleted** (findings 2 and 3).

### Open findings (fix round)
1. **HIGH, blocker class: one crafted file freezes the whole Hub.** `src/ai-tools/input/media-length.ts:20-22` re-reads any file with `parseBuffer(view, {}, ...)` (type detected from its bytes) inside the Hub process. `music-metadata` 7.14.0 has a synchronous infinite loop in its ASF parser (GHSA-v6c2-xwv6-8xf7, high; also memory and crash advisories GHSA-53v6-4h7p-p4gj, -jjpr-9cvf-cq55, -5gfj-9q3v-qfp3, -8j4c-6x6g-rq3j, -f94x-6692-553q). Repro: upload a 278-byte ASF file with a zero-size sub-object as `audio/mpeg` (presign, PUT, confirm), then `POST /ai-tools/captions/quote`: the quote never answers and `GET /api/hub/health` gets no answer either, for every route, until the process is killed (seen on the stack). Any signed-in account can do it. Needs: read only the container the declared type names after checking the file's magic bytes (refuse ASF/DSF/anything else before parsing), run the read off the main thread with a time limit, and move to a fixed `music-metadata` (12.2.3 is a major, ESM, Node 22+) or another reader.
2. **HIGH: the transcript is not deleted at the provider.** `http-voice-provider.ts:728-795` sends the DELETE once, 89 ms after the answer; the real provider answered 404 `transcript_not_found` (it had not stored it yet), and a GET by id returned 200 with the full text until I deleted it by hand about 40 s later (200, then GET 404). The scope says the provider keeps no copy of a person's words. Needs: retry the delete after a delay (for example 3 tries over a minute, outside the job) and log when it never succeeds.
3. **HIGH: the cleaned recording's history item is never deleted.** The real answer has no `history-item-id` header; it carries `audio-isolation-id` (`http-voice-provider.ts:757` reads the wrong name), so `historyId` is null and no DELETE is sent. After the real job the provider's history held the item (1); `DELETE /v1/audio-isolation/history/<id>` by hand answered 204 (then 0). Closes the assumption in G-AITOOLS-04-1.
4. **MEDIUM: every QuickTime file (.mov, the iPhone camera format) is refused as unreadable.** `music-metadata` 7.14.0 throws "Guessed MIME-type not supported: video/quicktime" for both reads in `media-length.ts:20`, although `ai/input-video` accepts `video/quicktime` and the builder record says QuickTime is read. Repro: a 30 s H.264/AAC `.mov` (brand `qt  `), quote answers `422 ai_file_unreadable`. The same file read with `{ mimeType: 'video/mp4' }` gives 30.064 s (checked). Safe (nothing held).
5. LOW: a fragmented MP4 (`empty_moov`, as some browser and Android recorders write) reads as 0 s and is refused (`media-length.ts`).
6. LOW: container padding makes a "1:00" recording read 60.06 s (the real 90 s MP4 reads 90.064), which rounds up to 2 minutes; no tolerance (`media-length.ts` `minutesOf`).
7. LOW (by reading, not reproduced): `ai-job.service.ts:488-505`: the words are written to the row before the commit; if a read reconciles the job to failed in that window, the clearing `mark(... Prisma.JsonNull)` matches no row (state is no longer `working`) and the words stay on a failed row.
8. LOW (already filed G-AITOOLS-04-2): refused and unreadable uploads stay in storage (6 left after my refusal tests).

- **Dependency `music-metadata` 7.14.0:** licence MIT (all 11 added packages MIT); pure JavaScript (no `.node`, no gyp, no install scripts, engines node>=10), 2.1 MB on disk (1.3 MB itself); `package-lock.json` adds those 11 packages and only flips `"dev": true` off for `base64-js` and `events` (they become production dependencies through it). `npm audit --omit=dev`: music-metadata high (6 advisories, range <=11.15.0), file-type moderate (GHSA-5v7r-6r5c-r473); fix is 12.2.3 (major). Reported, not fixed.
- **Not run:** nothing in the scope was skipped. Stack and stand-in ports closed, databases dropped, worktrees removed.
- **Next:** a Sonnet builder fixes 1 to 4 on backend `wmt/AITOOLS-04` (continue the branch), then a fresh verifier. Owner questions are unchanged (G-AITOOLS-04-1: the key's access is now answered, both routes work).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `docs/elevenlabs/API-FACTS.md` (the provider's routes, limits and what the free read calls showed: every provider fact in this task comes from it or from a real response)
- `DECISIONS.md`: R-78, R-43, R-61, R-65, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/AITOOLS-01.md` (the job and points flow this task reuses) and `tasks/POINTS-03.md` (hold, commit, release, caps)
- Backend `src/ai-tools/` (`ai-job.service.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `tests/ai-tools.contract.spec.ts`) and `scripts/dev/voice-standin.cjs`
- `design/Points Flow.dc.html` board PT1 (tiles "Captions, 15 a minute" and "Clean audio, 400 a minute"); PT2a to PT2c, PT3, PT7 for the shared states
- `docs/elevenlabs/API-FACTS.md` sections "Speech to text", "Voice isolator" and "Uploads the Hub must take"
- Backend `src/storage/dto/presign-upload.dto.ts` and `src/storage/storage.service.ts` (`presignUpload`, `readStored`, `putGenerated`, `removeGenerated`) and how VOICE-01 added `voice/sample` (`src/voice-intro/`)

## Goal

A person picks a recording, sees the cost for its length, and gets back a transcript with subtitles (Captions, 15 points a minute) or the same recording with the noise taken out (Clean audio, 400 points a minute): the board's figures, PROVISIONAL, kept only on success.

## Scope

- **The person's file.** Two new private upload folders in the Hub's existing presign flow, one for audio and one for video (`ai/input-audio`, `ai/input-video`), with the allowed types the Hub already serves (audio: mpeg, wav, mp4, aac; video: mp4, quicktime, webm), a byte cap setting, never served to anyone but the owner, never counted in the item allowance, and deleted when the job settles (done or failed) and when the account is deleted. The key of the uploaded file goes in the job request (`fileKey`), and the Hub checks it is the caller's own file in that folder (another person's key answers not found).
- **The length.** A per-minute price needs the file's length before anything is held. The Hub measures it itself from the stored file with a pure-JavaScript container reader (the builder picks the library and names it; no ffmpeg on the Hub). A file whose length cannot be read is refused ("We couldn't read that file", nothing held). Minutes are rounded up, at least 1. Over `points.max_audio_min_per_job` the answer is `points_cap_reached` naming `minutes_per_job`. After the provider answers, a length the provider reports (speech to text returns `audio_duration_secs`) that is more than 1 minute above the priced length fails the job and releases the hold (the Hub never charges less than the work, and never more than it quoted).
- **Captions.** Seam method `transcribe` (provider `POST /v1/speech-to-text`, multipart `file`, `model_id`, optional `language_code`, word timestamps). Route `POST /ai-tools/captions/jobs` (`fileKey`, optional `languageCode`, `quoteToken`, `Idempotency-Key`). Plan action `captions_per_min` (15 a minute). Result: `outputs` with `text` (the transcript) and `subtitles` (an SRT the Hub builds from the word timestamps). After storing the result the Hub deletes the provider's copy of the transcript (`DELETE /v1/speech-to-text/transcripts/{id}`), so the provider keeps no copy of a person's words.
- **Clean audio.** Seam method `isolateVoice` (provider `POST /v1/audio-isolation`, multipart `audio`). Route `POST /ai-tools/clean-audio/jobs` (`fileKey`, `quoteToken`, `Idempotency-Key`). Plan action `clean_audio_per_min` (400 a minute). The answer's content type is read from the real response: stored only if it is a type the Hub serves, else the job fails and releases (the builder records what a real run answers, or NOT RUN). The provider's history item is deleted after storing.
- **Catalogue entries** with `input.kind: file` (accepted types, the byte cap, the minute cap).
- **The stand-in** gets `/v1/speech-to-text` (returns words with timestamps and a duration), `/v1/audio-isolation` and both `DELETE` routes, with the failure markers read from the file's bytes (as the voice sample markers are).
- **Not read by anyone else:** the file is read by the provider for one run only; no log line holds its name, bytes or text.

## Provisional figures (R-65: the owner confirms, an admin changes them any time)

- `ai.input_max_bytes`: the provider's documented limits are 500 MB for the isolator and under 5.0 GB for transcripts; the default is 500 MB (the smaller documented limit), PROVISIONAL (`AITOOLS-LIMITS`), the owner may lower it.
- `points.action.captions_per_min` 15 and `points.action.clean_audio_per_min` 400 a minute: the PT1 figures (exist; PROVISIONAL `DV2-BOARD-FIGURE`).
- Owner questions for the report: the key's access to speech to text and audio isolation (the read calls on 23 Oct could not show the plan; API-FACTS), and whether Captions should also be offered on a video the person already published (not drawn, not built).

## Capability checks

- [x] `GET /ai-tools` lists Captions at 15 points a minute and Clean audio at 400 a minute before anyone runs them (only when the provider is configured).
- [x] A person uploads a 90 second recording: the quote prices 2 minutes from the Hub's own reading of the file, not from any number the phone sends.
- [x] A Captions job holds, runs, commits and returns the transcript text and an SRT; a Clean audio job returns an audio link; a failed or refused job releases everything.
- [x] A file whose length cannot be read, a type the Hub does not take, a file over the byte cap, a length over the minute cap, and another person's `fileKey` are each refused with the reason and nothing held (V2, with one wrong-format input).
- [x] The uploaded file is deleted when the job ends either way, and the provider's copies are deleted after a successful run (the stand-in's state shows the delete calls).
- [x] The same `Idempotency-Key` twice runs one job; two jobs at once never take points below zero; a late finish after the stale sweep cannot commit twice (V8).
- [x] VoiceOver, Quick voice, Sound effect and Music still pass their specs untouched.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

