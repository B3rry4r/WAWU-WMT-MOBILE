---
id: AITOOLS-12
title: Music for a video and Split a song (backend)
owner: YOU
area: POINTS
order: -47
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-11]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-12 · Music for a video and Split a song (backend)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-2. Order -47 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-2 (T2, backend), tasks AITOOLS-11, AITOOLS-12 in that order, one builder, branch `wmt/AITOOLS-11`, budget 170 steps; one T2 verifier, 110 steps.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** API-FACTS listed video to music and stem separation as "exists, not built". Music track makes music from words only.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

A creator gets music made for their own clip (Music for a video) and splits a finished song into its parts (Split a song), paid in points.

## What a person does

- Music for a video: picks a video from their library, optionally says the mood in words, sees the cost, runs it and plays the music made for it.
- Split a song: picks a song, chooses two parts (voice and the rest) or six, sees the cost, runs it and plays each part.

## Scope

- Tools `video-music` (`input.kind: file`, video, unit `track`) and `stems` (`input.kind: file`, audio, unit `use`, option `parts` of two or six). Both are long synchronous provider calls like Music track (a long timeout, not a follower).
- Music for a video: seam `makeMusicForVideo` (`POST /v1/music/video-to-music`, multipart `videos` with the one video, optional `description` up to 1,000 characters, `model_id` the same as Music track so the price stays comparable, `output_format mp3_44100_128`). Limits are settings: `ai.video_music_max_seconds` (default 120; the provider's own is 600 in all) and the byte cap `ai.input_max_bytes` (never above the provider's 200 MB). The provider returns music only: the Hub does NOT mix it onto the video (no tool for that), so the result is an audio file, stated plainly on the screen's done view by the app.
- Split a song: seam `splitStems` (`POST /v1/music/stem-separation`, multipart `file`, `stem_variation_id` `two_stems_v1` or `six_stems_v1`, `output_format mp3_44100_128`). The answer is a ZIP: the Hub opens it with a pure-JavaScript reader (the builder names the library and checks its safety limits: entry count, total size, path names never trusted, a zip bomb refused), stores each stem as its own mp3 under `ai/stems`, and the job's `outputs` lists the stems with plain names. The provider's own stem names inside the zip are NOT KNOWN: the stand-in guesses, the proof call reads the real ones and the mapping to plain words is written then. Each stem has `pieceFormat: audio`.
- Both inputs are the person's own files (`ai/input-video`, `ai/input-audio`), their length read by the Hub, deleted when the job ends. A 403 `Subscription required` from the provider becomes "This isn't available right now. No points were taken." and a logged owner item (the plan).
- The stand-in (`scripts/dev/voice-standin.cjs`) gets each route above with its `[[fail]]`, `[[reject]]`, `[[slow:n]]` and `[[moderated]]`-style markers read from the input, so every state is tested with no real call.
- Account deletion removes everything of the person's this task keeps: files in the task's folders, rows, and any provider copy (the account-purge, account-data-map and data-export-map specs list them).

## Hub routes

- `POST /ai-tools/video-music/quote`, `POST /ai-tools/video-music/jobs` (`fileKey`, optional `description`, `quoteToken`, `Idempotency-Key`); `POST /ai-tools/stems/quote`, `POST /ai-tools/stems/jobs` (`fileKey`, `parts` 2 or 6, `quoteToken`, `Idempotency-Key`).

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- `POST /v1/music/video-to-music`, `POST /v1/music/stem-separation`. Facts: API-FACTS, "Music for a video" and "Split a song".

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Settings `points.action.video_music_per_track` and `points.action.stems_per_song`: **points cost: PROVISIONAL, owner sets.**
- Provider cost: NOT KNOWN for both (no price field in any file; the plan must be paid for the Music API). Placeholders, not derived (`STUDIO2-PLACEHOLDER`): 500 points a track for Music for a video (the same as Music track, 500) and 300 for Split a song.
- How the proof calls measure it: credits before and after the one smallest call each; price then is credits times the basis ratio the owner picks.

## Capability checks

- [ ] A person uploads a 20 second video and runs Music for a video on the stand-in: the Hub reads its length, holds, sends it, stores the mp3, commits; over the length setting, over the byte cap and a file that is not a video each refuse with the reason and nothing held (V2).
- [ ] A person runs Split a song for two and for six parts: a stand-in zip becomes that many stored mp3 files, each listed in `outputs` with its plain name; a zip with a path outside its folder, too many entries or a size over the limit fails the job and gives every point back.
- [ ] The provider's 403 and 422 answers (stand-in markers) give every point back with the Hub's own sentence; the same `Idempotency-Key` twice runs one job; two jobs at once never take points below zero (V8).
- [ ] Each stem answers `pieceFormat: audio` and `piece` with that `outputIndex` returns a key `POST /content` accepts for format `audio`.
- [ ] Music track and every earlier tool still pass their specs untouched; the tools are absent until their `ai.listed` switches are on.

## Proof call (the one real provider call, only when the lead names it)

When the lead names it, two separate calls, each the smallest: (1) video to music: one 3 to 5 second mp4 under 1 MB, no description, the default model. (2) stems: `two_stems_v1`, a 5 second mp3 fixture. Log credits before and after each, the zip's entry names and sizes, the output type, the seconds taken, and the 403 if the plan lacks the Music API. Expected credits: NOT KNOWN for both.

## Gaps and defaults

- Default (lead), owner may override: no mixing of the music onto the video (no provider route and no ffmpeg on the Hub); the person receives the music as audio.
- NOT KNOWN: credits for both; the stems' names and the input limits; whether our plan covers the Music API.

## History

None yet. Reports go to tasks/history/AITOOLS-12.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
