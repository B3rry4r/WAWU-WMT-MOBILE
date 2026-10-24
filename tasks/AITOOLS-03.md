---
id: AITOOLS-03
title: Sound effect and Music track (backend)
owner: YOU
area: POINTS
order: -124
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [AITOOLS-02]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-03 · Sound effect and Music track (backend)

## Current state

As of 24 Oct 2026, verifying. Tier T2 (third-party, spends points). Builder report in [history/AITOOLS-03.md](history/AITOOLS-03.md).
- **Branches:** backend `wmt/AITOOLS-03` `542bc86` on `wmt/AITOOLS-02` `5d36fea` (the pipeline is PR #182, not merged yet: when origin/main has it, merge origin/main into this branch, never rebase); mobile `wmt/AITOOLS-03` (this file, SHARED-CHANGES AITOOLS-03 #1 and #2, BACKEND_GAPS, the log line) on origin/main `c47c9c84`. No PR.
- **Before:** the job pipeline ran two text tools (VoiceOver, Quick voice); the catalogue had input kind `text` and unit `minute` only; the audio store had one folder (`ai/voiceover`).
- **After:** Sound effect and Music track are two more files in `src/ai-tools/tools/`, registered after Quick voice. Input kind `prompt`: a description in words, an optional length, one provider call, one audio file out, flat price (`sfx` 75 a use, `music_per_track` 500 a track, the PT1 figures, PROVISIONAL).
- **Routes added (2):** `POST /ai-tools/sound-effect/jobs` (`prompt`, optional `durationSeconds`, `quoteToken`, required `Idempotency-Key`) and `POST /ai-tools/music/jobs` (`prompt`, optional `lengthSeconds`, optional `instrumental`, `quoteToken`, required `Idempotency-Key`). 202 working, 200 replay. Seam methods `makeSoundEffect` (`POST /v1/sound-generation`) and `makeMusic` (`POST /v1/music`).
- **Answer shapes (additive):** a catalogue entry's `unit` may be `use` or `track`; `input.kind` may be `prompt`, with `input.length { field, min, max, whole }` (seconds) and, for Music, `input.instrumental: true`; `voices` is `[]`; `charactersPerUnit` equals `maxCharacters` (one use or track covers any allowed description). A job view for these tools has `voiceId: ""` and `units: 1`. New refusals: `422 ai_prompt_too_long`, `422 ai_length_too_long` (each names its limit: `reason.cap`, `capLimit`, `capUnit`), `400 ai_prompt_empty`. Both tools are listed only when the provider is configured (R-47).
- **Settings added (4, admin, PROVISIONAL `AITOOLS-LIMITS`):** `ai.sfx_max_prompt_chars` and `ai.music_max_prompt_chars` (default = `points.max_chars_per_job`, 5,000, not a new figure), `ai.sfx_max_seconds` 30 and `ai.music_max_seconds` 300 (the provider's own maximums; the owner may lower them). A length over `points.max_audio_min_per_job` is `points_cap_reached` (`minutes_per_job`). Nothing is held in any refusal.
- **Music timeout:** `AI_VOICE_MUSIC_TIMEOUT_MS`, default 600000 (10 minutes), set from the longest track the Hub allows (300 s) because NO real run has happened; a real run sets it. It stays inside the 30 minute stale-hold sweep.
- **Output:** MP3 under `ai/sound-effect` and `ai/music` as the person's own `StorageObject` (account deletion removes it). The purge table (`FILE_KINDS`), the Hub-written folder list and their specs list both folders. The description is never stored.
- **No migration.** A prompt job keeps `voiceId` empty and the length and switch only in the request hash; the AITOOLS-02 columns are enough.
- **Lead ruling (AITOOLS-02 price pattern):** not needed. Neither new name or description has a digit or any of save, more, less, so the AITOOLS-02 pattern is unchanged; the new spec runs it with all four costs and limits changed.
- **Assertions changed (flag for the verifier):** only counts of what the catalogue and folders hold, because this task adds to them: `ai-tools.contract.spec.ts` `toHaveLength(2)` is now 4; `ai-tools-pipeline.contract.spec.ts` the two registry/catalogue id lists gain the two ids and the unbuilt-tool regex drops `music|sound`; `object-key-folders.spec.ts` and `purge-files.spec.ts` use `AI_AUDIO_FOLDERS` (3 folders) where they used the one; `purge-files.contract.spec.ts` uploads the two new folders and `objectsRemoved` is 16 (14 plus those two). Every VoiceOver and Quick voice assertion is untouched.
- **Checks (backend, EXIT 0 each unless stated):** tsc; eslint (no --fix) on all 34 changed `.ts` files; ai-tools specs in band 102/102 (7 suites: AITOOLS-01 contract, pipeline, voice provider, migration unchanged plus new `ai-tools-sound.contract` 25, `ai-sound-provider` 8, `ai-audio-store-folders` 2; no spec imports the Fintava double); plan-settings, admin plan-settings, key-folder and purge specs 86/86; `test:protected` 253/253 after `db:seed`; `contract:build` (2 operations, 2 schemas, 2 schemas changed, committed); gates 0 fail, 133 warn, 88 accepted (as AITOOLS-02); `check_baseline`. Own database `ait03_wawu_hub_test`, no live host, nothing Fintava.
- **Mistake to know:** one jest command also named `src/plans/tests/plans.contract.spec.ts`, which touches a Fintava table row (it failed, 35 tests, in my own test database; no double or service was started; nothing was changed because of it). It is not part of any count above.
- **NOT RUN against the real provider** (G-AITOOLS-01-5 stays open for these routes): built and run against `scripts/dev/voice-standin.cjs`, which now serves both routes. The real answer bodies, the true time of a track, and whether the key's scopes cover sound effects and music are unknown (API-FACTS).
- **Owner question (G-AITOOLS-03-1):** the provider's Music API is for paid plans and its terms (https://elevenlabs.io/music-terms) say what each plan may be used for. This task reports it and does not decide it. Also for the owner to see: both prices are flat while the provider's own cost grows with length.
- **Not done / next:** a verifier; mutation checks NOT RUN; the app screens are POINTS-09 (they read `input.length`, `input.instrumental`, `unit`).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `docs/elevenlabs/API-FACTS.md` (the provider's routes, limits and what the free read calls showed: every provider fact in this task comes from it or from a real response)
- `DECISIONS.md`: R-78, R-43, R-61, R-65, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/AITOOLS-01.md` (the job and points flow this task reuses) and `tasks/POINTS-03.md` (hold, commit, release, caps)
- Backend `src/ai-tools/` (`ai-job.service.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `tests/ai-tools.contract.spec.ts`) and `scripts/dev/voice-standin.cjs`
- `design/Points Flow.dc.html` board PT1 (tiles "Music track, 500" and "Sound effect, 75", flat points, no "a minute"); PT2a to PT2c for the working, done and failed states
- `docs/elevenlabs/API-FACTS.md` sections "Sound effects" and "Music" (limits, models, the plan note)

## Goal

A person describes a sound or a track in words and gets audio back: a sound effect for 75 points, a music track for 500 points (the board's figures, PROVISIONAL), kept only if it succeeds.

## Scope

- **Sound effect.** Seam method `makeSoundEffect` (provider `POST /v1/sound-generation`, text, optional `duration_seconds` 0.5 to 30, MP3). Route `POST /ai-tools/sound-effect/jobs` (`prompt`, optional `durationSeconds`, `quoteToken`, `Idempotency-Key`). Plan action `sfx` (75 a use, flat, whatever the length).
- **Music track.** Seam method `makeMusic` (provider `POST /v1/music`, `prompt`, optional `music_length_ms`, `force_instrumental`, MP3). Route `POST /ai-tools/music/jobs` (`prompt`, optional `lengthSeconds`, optional `instrumental`, `quoteToken`, `Idempotency-Key`). Plan action `music_per_track` (500 a track, flat). One request with no provider job id: a long timeout set by `AI_VOICE_MUSIC_TIMEOUT_MS` (the builder sets the default from a real run, or from the longest track the Hub allows when none has run, and says which in the report).
- **Catalogue entries** (`input.kind: prompt`, with the prompt's character limit and, for each tool, the optional length's range) added to `GET /ai-tools` through the AITOOLS-02 registry, one tool file each. The cost reads "a use" and "a track" (unit `use` and `track`).
- **The caps.** `points.max_audio_min_per_job` bounds a track's length; the prompt's character limit is a setting. A prompt the provider refuses (a 4xx) fails the job with "No points were taken".
- **Output.** MP3 stored through the same audio store as VoiceOver under its own folder (`ai/sound-effect`, `ai/music`), recorded as the person's (their account deletion removes it).
- **The stand-in** gets `/v1/sound-generation` and `/v1/music` with the failure markers; it makes silent MP3 frames of the asked length.
- **The plan.** The provider's Music API is for paid plans and its terms say what each plan may be used for (https://elevenlabs.io/music-terms). The task reports this to the owner (G-AITOOLS-03-1); it does not decide it.

## Provisional figures (R-65: the owner confirms, an admin changes them any time)

- `ai.sfx_max_prompt_chars` and `ai.music_max_prompt_chars`: the default is the existing `points.max_chars_per_job` (5,000), not a new figure; if a real response shows a lower provider limit, the builder records it. PROVISIONAL (`AITOOLS-LIMITS`).
- `ai.sfx_max_seconds` 30 and `ai.music_max_seconds` 300: the provider's own maximums (API-FACTS), PROVISIONAL (`AITOOLS-LIMITS`), the owner may lower them.
- `points.action.sfx` 75 a use and `points.action.music_per_track` 500 a track: the PT1 figures (exist; PROVISIONAL `DV2-BOARD-FIGURE`). Both are flat, while the provider's own cost grows with length: for the owner to see, not for this task to change.

## Capability checks

- [x] `GET /ai-tools` lists Sound effect at 75 points a use and Music track at 500 points a track before anyone runs them (only when the provider is configured).
- [x] A sound effect job and a music job each hold, run, commit and return an audio link; a failed or refused job releases everything and says no points were taken.
- [x] A length over the setting's maximum is refused naming it, with nothing held; a prompt over the character limit is refused the same way.
- [x] The same `Idempotency-Key` twice runs one job and holds once; two jobs at once never take points below zero; a late finish after the stale sweep cannot commit twice (V8).
- [x] Over a points cap the answer is `points_cap_reached` naming the cap, nothing held.
- [x] The stored audio is the person's: an account deletion removes it (the account-purge spec lists the new folders).
- [x] VoiceOver and Quick voice still pass their specs untouched.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AITOOLS-03.md](history/AITOOLS-03.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
