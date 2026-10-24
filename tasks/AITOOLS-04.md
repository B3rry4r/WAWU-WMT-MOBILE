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

As of 24 Oct 2026, **building (round 2 verifier said FIX)**. Tier T2, backend only. Verifier (Sonnet, not the builder) checked backend `wmt/AITOOLS-04` `01a9704` (r2 range `d571fbd..01a9704`). Full report: [history/AITOOLS-04.md](history/AITOOLS-04.md), section "Verifier report, round 2".
- **Heads:** backend `wmt/AITOOLS-04` `01a9704` (unchanged by the verifier); mobile `wmt/AITOOLS-04` carries these records.
- **Passed:** findings 1 to 7 of round 1 except the real-provider delete. The sniff and worker hold against every hostile file tried (278-byte ASF, ASF behind ID3, huge box and EBML sizes, 150k nested boxes, 1M WAV chunks, 4M-entry stsd, 60 MB stts, 40 MB atom flood, 8 MB of 0xFF as AAC): each is 422, `/health` answered every time, the parser never ran past its 15 s limit, worker memory was cut at the 384 MB watchdog (Hub RSS peaked at +420 MB for one hostile file). MOV (`qt  `), 60.000 s = 1 minute, 61 s = 2, 90 s = 2, fragmented MP4 refused, all live over HTTP. Restart mid-retry: the note survived, the sweep deleted the copy once. Clean audio: id from `audio-isolation-id`, 4 of 4 real history items gone with no manual delete.
- **Checks:** tsc `EXIT 0`; eslint (no --fix, 17 changed .ts) `EXIT 0`; 32 suites, 460 tests in band (ai-tools 11, storage 17, plan-settings 4; none imports the Fintava double) `EXIT 0`; `test:protected` 253/253 `EXIT 0` (the suite's own mock-id; db:seed first); contract:build `EXIT 0`, no diff; gates 0 fail, 133 warn, 88 accepted (1772 files) `EXIT 0`; check_baseline `EXIT 0`. The two changed assertions in `ai-file-provider.spec.ts` are honest (the API changed from void to a result; the 60.01 s case pinned finding 6).
- **Open findings (fix round):**
  1. **HIGH, real provider keeps the transcript.** `voice/provider-copy.service.ts:106, 117, 222` treat any 2xx of the first DELETE as "gone" and clear the note. The real provider answers 200 (or 404) to a DELETE sent 0.1 to 0.3 s after its answer and the transcript still appears afterwards: 4 of 6 real Captions runs left the transcript readable (GET 200) 2 to 9 minutes later, no retry ever came. Repro: one Captions job through the Hub on the real key, then GET `/v1/speech-to-text/transcripts/<id>` (the id is in the Hub's DELETE path). Needs: keep the note until a GET of the copy says 404 (or delete again after the provider has had time to store it), in the retry and the sweep both; the stand-in needs an "acknowledged, then appears" marker.
  2. **HIGH, the parser queue is unbounded and holds every waiting file in the Hub's memory.** `input/media-length.ts:26, 77-85` (`takeTurn`, `waiting`) and `input/ai-input-files.ts:140` (the whole file is read before it waits). 6 hostile 100 MB files in flight: Hub RSS 268 to 1821 MB and a good quote waited 29.5 s; 12 hostile 8 MB files: a good quote waited 89 s (it queues, it does not fail). The throttle is 200 requests a minute per IP, each hostile file holds a worker for 15 s. With the 500 MB cap the memory is the queued bytes. Needs: take the turn before reading the file, a bound on waiting reads (a busy answer past it), one read in flight per account.
- **LOW:** (a) `input/media-sniff.ts:60` accepts any file that opens `FF F1` as ADTS AAC: 8 MB of 0xFF holds a worker for the full 15 s (check the next frame header too). (b) The note on a job whose copy is already gone blocks the AITOOLS-02 `rollback.sql` for up to about 11 minutes (404 inside the 10 minute window; `providerRef IS NOT NULL` refuses); a done Captions job already blocks it by its words. (c) LOW 8 (abandoned uploads, G-AITOOLS-04-2) unchanged.
- **Real provider (one account key, through a local pass-through, 5 s clips):** Captions `POST /v1/speech-to-text` 594 to 626 ms, job done in about 1.2 s; Clean audio `POST /v1/audio-isolation` 488 to 842 ms, job done in about 1.15 s. All provider data I made was deleted by hand at the end (transcripts 200 then 404; history list empty).
- **Next:** a Sonnet builder fixes 1 and 2 on backend `wmt/AITOOLS-04` (continue the branch), then a fresh verifier re-runs the real-provider check (8 Captions jobs, every GET 404 with no manual delete) and the flood check (bounded memory, good quote answers or is told busy).

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

