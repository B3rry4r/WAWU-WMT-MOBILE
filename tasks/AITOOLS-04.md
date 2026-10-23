---
id: AITOOLS-04
title: Captions and Clean audio, with the person's own audio or video going in (backend)
owner: YOU
area: POINTS
order: -123
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-02]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-04 · Captions and Clean audio, with the person's own audio or video going in (backend)

## Current state

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T2 (third-party, spends points). About 60 minutes of building; if it runs past that, push what is done and hand back what remains.
- **Real prerequisites (not in `depends_on`):** AITOOLS-01 (backend) and POINTS-03 are merged to backend main. They sit at orders 267 and 213, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order (like FIX-nn) and `depends_on` lists only the tasks cut with it. Both are on backend main as of 23 Oct 2026 (`src/ai-tools/`).
- **Pattern:** a file the person records or picks goes in (audio or video), one provider call, a result comes back (text and subtitles, or cleaned audio), priced by the minute of the file. This task also builds the Hub's way to take a person's file for a tool, which Dubbing (AITOOLS-05) reuses.
- **Provider:** the AI voice provider, through the one seam `AI_VOICE_PROVIDER`. NOT RUN against the real provider until a run with the owner's key on the Hub (its read-only access was checked 23 Oct 2026: `docs/elevenlabs/API-FACTS.md`). Built and tested against `scripts/dev/voice-standin.cjs`.
- **Next:** a builder session (Sonnet) on branch `wmt/AITOOLS-04`; then a verifier.

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

- [ ] `GET /ai-tools` lists Captions at 15 points a minute and Clean audio at 400 a minute before anyone runs them (only when the provider is configured).
- [ ] A person uploads a 90 second recording: the quote prices 2 minutes from the Hub's own reading of the file, not from any number the phone sends.
- [ ] A Captions job holds, runs, commits and returns the transcript text and an SRT; a Clean audio job returns an audio link; a failed or refused job releases everything.
- [ ] A file whose length cannot be read, a type the Hub does not take, a file over the byte cap, a length over the minute cap, and another person's `fileKey` are each refused with the reason and nothing held (V2, with one wrong-format input).
- [ ] The uploaded file is deleted when the job ends either way, and the provider's copies are deleted after a successful run (the stand-in's state shows the delete calls).
- [ ] The same `Idempotency-Key` twice runs one job; two jobs at once never take points below zero; a late finish after the stale sweep cannot commit twice (V8).
- [ ] VoiceOver, Quick voice, Sound effect and Music still pass their specs untouched.

## History

None yet. Reports go to tasks/history/AITOOLS-04.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
