---
id: AITOOLS-10
title: Make a video and Talking photo (backend)
owner: YOU
area: POINTS
order: -51
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-09]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-10 · Make a video and Talking photo (backend)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-1. Order -51 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-1 (T2, backend), tasks AITOOLS-08, AITOOLS-09, AITOOLS-10 in that order, one builder, branch `wmt/AITOOLS-08`, budget 210 steps (130 plus 40 for each extra task); one lean-to-full T2 verifier, 90 steps plus 20 per extra task.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** the provider's video routes (7 models) are in both files and nothing in our notes mentions them. Studio has no video tool and the pipeline cannot store video until AITOOLS-08.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

A person describes a clip (optionally starting from their own photo) and gets a short video, or gives a photo and a voice and gets the photo speaking, paid in points, kept only on success.

## What a person does

- Make a video: types what happens, picks wide or tall and a length (4, 6 or 8 seconds), optionally adds a photo to start from, sees the cost, runs it, and is told when it is ready (it takes minutes).
- Talking photo: picks a photo and a voice recording (their own, or one of their finished voice results), sees the cost for its length, runs it and gets a video of the photo speaking.

## Scope

- Two tools: `video` ("Make a video", `input.kind: video`) and `talking-photo` ("Talking photo", photo plus audio). Units: `second` (a second of video; a second of speech). Catalogue entries carry the lengths (4, 6, 8), the shapes (16:9, 9:16) and the audio limit (setting `ai.talking_photo_max_seconds`, default 60: the provider's own limit is NOT KNOWN).
- Seam methods `startVideo`, `readVideo` (and the follow pattern of AITOOLS-09). The ceiling is `ai.video_max_run_seconds` (default 600); the follower polls every 5 seconds; a finished long job writes the `ai_job_ready` notification (AITOOLS-08).
- Models by setting, never shown: `ai.video_model` default `veo-3.1-fast-generate-001`; `ai.talking_photo_model` default `creatify-aurora`. Resolution `720p` (`480p` for the talking photo's proof). `generate_audio`: setting `ai.video_with_sound`, default on (the provider's own default); the setting exists because its credit effect is NOT KNOWN. The ByteDance models need approval and are not used.
- Photo to video: the person's photo (`ai/input-image`) goes up as an asset and is the `start_frame`. Talking photo: the photo as the `image`, the speech as the `audio` (the person's recording from `ai/input-audio`, or a finished voice job of theirs; the Hub reads its stored mp3; both uploaded as assets and deleted when the job ends). The speech length is read by the Hub itself (as Captions) and prices the job; over the setting it is refused before anything is held.
- Output: `video/mp4` streamed to `ai/video` (never held whole in memory), `pieceFormat: video`. Failures map as AITOOLS-09 (`moderated` has its own sentence). A video the provider returns in a type the Hub does not serve fails and releases.
- The stand-in (`scripts/dev/voice-standin.cjs`) gets each route above with its `[[fail]]`, `[[reject]]`, `[[slow:n]]` and `[[moderated]]`-style markers read from the input, so every state is tested with no real call.
- Account deletion removes everything of the person's this task keeps: files in the task's folders, rows, and any provider copy (the account-purge, account-data-map and data-export-map specs list them).

## Hub routes

- `POST /ai-tools/video/jobs` (`prompt`, `shape`, `seconds`, optional `photoKey`, `quoteToken`, `Idempotency-Key`) and `POST /ai-tools/talking-photo/jobs` (`photoKey`, and one of `audioKey` or `sourceJobId`, `quoteToken`, `Idempotency-Key`); the existing `POST /ai-tools/captions/quote` pattern gives a `POST /ai-tools/talking-photo/quote` that reads the audio's length. Jobs read with `GET /ai-tools/jobs/{id}`.

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- `POST /v1/flows/video` (Veo: `prompt`, `duration_secs`, `aspect_ratio`, `resolution`, `generate_audio`, `start_frame`; Aurora: `image`, `audio`, `resolution`), `GET /v1/flows/video/{generation_id}`, one fetch of `content_url`; asset upload and delete. Facts: API-FACTS, "Make a video, Talking photo".

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Settings `points.action.video_per_sec` and `points.action.talking_photo_per_sec`: **points cost: PROVISIONAL, owner sets.**
- Provider cost per second: NOT KNOWN for both (no price field in any file). No figure can be derived. Placeholder, not derived (`STUDIO2-PLACEHOLDER`): 250 points a second of video (a 4 second clip 1,000, an 8 second clip 2,000) and 200 a second of speech for the talking photo.
- How the proof calls measure it: credits before and after each one 4 second or 480p call; the price is then credits per second times the basis ratio the owner picks. Note the daily cap (`daily_points_per_user` 5,000): an 8 second clip at the placeholder is 2,000 of it; the owner decides whether video has its own cap.

## Capability checks

- [ ] A signed-in person runs Make a video on the stand-in: the clip is held per second, polled while `pending` and `generating`, stored as `video/mp4`, `done` with a `video` output and the points kept; the stand-in's `[[fail]]`, `[[moderated]]` and `[[slow]]` give every point back.
- [ ] Photo to video sends the person's photo as the `start_frame` asset and deletes the asset when the job ends; Talking photo sends photo and speech, prices the speech length the Hub read, and refuses a speech longer than the setting before holding anything.
- [ ] A restart while a clip is `generating` resumes the follower; a late finish after the stale sweep cannot commit twice; two jobs at once never take points below zero; the same `Idempotency-Key` twice runs one job (V8).
- [ ] A 50 MB stand-in video is stored with the Hub's memory flat; a returned type the Hub does not serve fails and releases.
- [ ] A finished clip answers `pieceFormat: video` and `piece` returns a key `POST /content` accepts for format `video`.
- [ ] A job longer than the setting writes one `ai_job_ready` notification; the tools are absent until their `ai.listed` switches are on.
- [ ] An audio file that is not speech-length readable, a photo that is not a picture, another person's key, a `sourceJobId` that is not theirs or has no audio each refuse with the reason and nothing held (V2, one wrong-format input).

## Proof call (the one real provider call, only when the lead names it)

When the lead names it, two separate calls: (1) Make a video: `veo-3.1-fast-generate-001`, `prompt "a red ball rolls across a table"`, `duration_secs "4"`, `aspect_ratio 16:9`, `resolution 720p`, `generate_audio false`, one read loop, one fetch. (2) Talking photo: `creatify-aurora`, `resolution 480p`, one 512 px photo, one speech clip of about 2 seconds (a recorded fixture, not a provider voice call). Log for each: credits before and after, `content_mime_type`, byte size, seconds taken, and whether Flows is enabled for the key. Expected credits: NOT KNOWN for both. Delete the assets afterwards.

## Gaps and defaults

- Default (lead), owner may override: Talking photo takes an uploaded or recorded voice, or a finished voice job; it does not run text to speech inside the same tool (one provider call and one price per tool).
- NOT KNOWN: credits per second or clip; the longest speech the talking-photo model takes; output size and frame rate; whether our key may use Flows or Veo.

## History

None yet. Reports go to tasks/history/AITOOLS-10.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
