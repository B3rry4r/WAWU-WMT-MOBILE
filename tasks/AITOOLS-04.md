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

As of 24 Oct 2026, **building (round 3 verifier said FIX)**. Tier T2, backend only. Verifier (Sonnet, not the builder) checked backend `wmt/AITOOLS-04` `df00794` (r3 range `01a9704..df00794`). Full report: [history/AITOOLS-04.md](history/AITOOLS-04.md), section "Verifier report, round 3".
- **Heads:** backend `wmt/AITOOLS-04` `df00794` (unchanged by the verifier); mobile `wmt/AITOOLS-04` carries these records.
- **Passed:** the read gate holds against the upload-path attacks: 20 accounts sending a 100 MB hostile MP4 at once cost the Hub **+339 MB RSS** (bound 1168 MB), 4 parsed, 16 refused busy (15 in under 370 ms), `/health` 152 of 152, a good quote refused busy in 21 to 154 ms while the line was full and served in 7.2 s after; a second quote from one account waits, a third is 503 in 55 to 82 ms, nothing held, the account free after; slow-loris bodies change nothing. The ADTS sniff refuses 8 MB of 0xFF in 9 ms. The rollback comment is honest. Clean audio: the item is deleted at the provider (1 real run).
- **Checks:** tsc `EXIT 0`; eslint (no --fix, 16 changed .ts) `EXIT 0`; 35 suites, 490 tests in band (ai-tools 14, storage 17, plan-settings 3 of 4: `plan-settings-round2` imports the Fintava double through `test/points/cash-out-harness.ts` and `test/plans/tier-purchase-harness.ts`, so it is not a spec to run; the builder's "none imports the Fintava double" is wrong for it) `EXIT 0`; `test:protected` 253/253 `EXIT 0` (db:seed first, the suite's own mock); contract:build `EXIT 0`, no diff; gates 0 fail, 133 warn, 88 accepted (1776 files) `EXIT 0`; check_baseline `EXIT 0`.
- **Open findings (fix round):**
  1. **HIGH, real provider still keeps the transcript (round 2 finding 1 is NOT fixed).** `voice/provider-copy.service.ts:155-168` (`tryOnce`, used at 122): a DELETE then a GET that says 404 is read as "gone". The real provider answers GET 404 for about the first second after its answer and the transcript is then readable. Real key, 9 Captions jobs through the Hub: the Hub cleared 8 notes 62 to 209 ms after writing them; at the provider **8 of 9 transcripts answered 200** (GET 200 at every poll from 2 s to 100 s) with no note left to retry. Repro: run a Captions job on a 5 s clip, poll the job row's `providerRef` and GET `/v1/speech-to-text/transcripts/{id}` at 2 s and 70 s. Fix: a transcript is gone only when a DELETE sent after the copy exists is followed by a GET of 404 (keep the note for at least 60 s after the answer, as the 10 minute rule does for a cleaned item, or until a GET has shown 200 and a later one 404); model "GET 404 for the first second, then 200" in `voice-standin.cjs` (`[[appear-after:MS]]`, GET) and bring back the transcript case of the r2 assertion (finding 3).
  2. **HIGH, the provider-run read is not behind the gate: one account can pull the Hub's memory with 15 points a job.** `ai-job.service.ts:419` (`this.input.read`, whole file, up to the 500 MB cap) then `voice/http-voice-provider.ts:696` (`Buffer.concat`, a second copy), per running job, for the whole provider call; nothing limits running jobs. Repro: one account, a WAV whose header says 5 s followed by 100 MB of padding (priced 1 minute, 15 points), 8 `POST /ai-tools/captions/jobs` one after another (202 in 0.4 to 2.1 s each; the gate's one-per-account rule only bites a burst): Hub RSS **366 to 1969 MB** while the jobs run. At the 500 MB cap about 1 GB a job, 10 jobs is an out-of-memory kill for every user. Fix: take a gate turn (with the file's bytes) around the read and the provider call in `run`, or stream the multipart body from storage and cap running file jobs per account and overall.
  3. **MEDIUM, a correct assertion was changed to make the new rule pass.** `ai-tools-files-r2.contract.spec.ts` (about line 269): the transcript case "a 404 inside the window is kept" became an isolation-id case. That assertion pinned what the real provider needs (finding 1), not the defect round 2 named (a 2xx clears). Restore it for transcripts.
- **LOW:** (a) `scripts/dev/storage-standin.cjs:54` ignores `Range`, so on the stack every head read downloads the whole object (20 x 100 MB flood: +1626 MB and RSS did not come back, an artifact); honour `Range` with a 206. (b) A good quote from an account that already has a read in flight can wait the account's 20 s and then the line's 20 s: served at 30.5 s in the race (`input/read-gate.ts` `claimAccount` then `takeTurn`); a fresh account is served or refused within 20 s. State the bound as "20 s a stage" or share one deadline. (c) The byte budget uses the row's declared `bytes` (`ai-input-files.ts:188`), not the object's real length; the signed `ContentLength` makes a real store enforce it, the stack's stand-in does not. (d) Two valid ADTS frames followed by junk still reach the parser (15 s, bounded by the gate): expected. LOW 8 (abandoned uploads, G-AITOOLS-04-2) unchanged.
- **Real provider:** the key lists transcripts with `GET /v1/speech-to-text/transcripts?page_size=50` (API-FACTS line 21 says 422: it needs `page_size`); Captions done in 0.5 to 2.0 s; Clean audio done in 0.9 s; later Clean audio attempts answered 400 (a 4.5 s WAV) and 401. All 8 leftover transcripts were deleted by the verifier (DELETE 200, GET 404 after 3 s).
- **Next:** a Sonnet builder fixes 1 to 3 on backend `wmt/AITOOLS-04` (continue the branch), then a fresh verifier re-runs: 6 Captions jobs on the real key (every transcript GET 404 after one sweep, with no manual delete) and the 8-job single-account memory test (RSS bounded).

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

