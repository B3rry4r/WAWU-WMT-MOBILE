---
id: AITOOLS-04
title: Captions and Clean audio, with the person's own audio or video going in (backend)
owner: YOU
area: POINTS
order: -123
priority: launch
repo: wawu-backend
type: third-party
status: review
depends_on: [AITOOLS-02]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-04 · Captions and Clean audio, with the person's own audio or video going in (backend)

## Current state

As of 24 Oct 2026, **review (round 4 verifier said PASS)**. Tier T2, backend only. A fresh Sonnet verifier (built none of it) checked backend `wmt/AITOOLS-04` `4dac644` (r4 range `df00794..4dac644`). Full report: [history/AITOOLS-04.md](history/AITOOLS-04.md), section "Verifier report, round 4".
- **Heads:** backend `wmt/AITOOLS-04` `4dac644` (unchanged by the verifier; it merged `origin/main` `0e87d06`); mobile `wmt/AITOOLS-04` carries these records.
- **HIGH 1, transcript note: fixed, shown on the real provider.** Settings for the run only: `ai.copy_confirm_after_minutes` 2 and `ai.copy_confirm_gap_minutes` 1 (defaults 10 and 5). 6 real Captions jobs on a 3.8 s clip through the Hub (done in 0.4 to 1.3 s): the Hub cleared all 6 notes by its own schedule (5 at 277 s after the jobs started: first 404 written at 06:00:00, 155 s after they ended, second read two sweeps later), no manual delete. Every provider read of every transcript answered 404 from 6 s after the job to the end (about 14 reads each), then 404 again 17 s and 130 s after the clear (round 3: 8 of 9 transcripts answered 200 for 100 s). Nothing left at the provider; the DELETE-by-hand step had nothing to do.
- **HIGH 2, provider-run read: fixed, shown over HTTP.** 8 jobs created one after another from one account on 100 MB files, the provider holding each 15 s: 8 running at once, Hub RSS 288 to 302 MB against a base of 292 MB (round 3: +1603 MB). 20 accounts x 100 MB at once: 5 served, 15 refused busy in 0.08 to 0.21 s, RSS +274 MB (the 5 quote reads, round 3: +339 MB), `/health` 82 of 82 (slowest 36 ms), nothing held for a refused job (3000 points each), a refused account served again 0.6 s after. Spec numbers reproduce: +9 MB for 20 x 100 MB, +0.1 MB for 4 x 150 MB.
- **Checks:** tsc, eslint (no --fix, 15 .ts), gates (9, 1784 files, 0 fail, 133 warn, 88 accepted), check_baseline, `test:protected` 253/253, contract:build (no diff): all `EXIT 0`. 40 suites, 529 tests in band (ai-tools 16, storage 19, plan-settings 5 that do not reach Fintava) all pass; two specs need a free port (LOW a).
- **Not run:** 2 real Clean audio jobs (the key is out of credits: 21 left, 85 needed for 9 s; a 1.75 s clip is refused 400 audio_too_short, minimum 4.6 s; the clean-audio path is unchanged since round 3, which proved one item deleted); `plans.contract`, `plan-settings-readers`, `plan-settings-round2` (they reach the Fintava double; no spec pins the settings count, see the report).
- **Open (all LOW, go to the sweep):** (a) two r4 specs listen on fixed ports 7921 and 7922; (b) SHARED-CHANGES.md and the task's Provisional figures do not list the two new settings; (c) a run that ends `busy` also deletes the person's uploaded file; (d) the Hub does not refuse a clip under the provider's 4.6 s minimum; (e) the sweep takes 50 rows a minute, oldest first.
- **Owner questions:** the key has run out of credits (Clean audio cannot be shown again until it is topped up); the PROVISIONAL `AITOOLS-COPY-CONFIRM` figures (10 and 5 minutes) and whether Captions is also offered on a video the person already published (not drawn, not built).

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

