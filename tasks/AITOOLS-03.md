---
id: AITOOLS-03
title: Sound effect and Music track (backend)
owner: YOU
area: POINTS
order: -124
priority: launch
repo: wawu-backend
type: third-party
status: building
depends_on: [AITOOLS-02]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-03 · Sound effect and Music track (backend)

## Current state

As of 24 Oct 2026, building (verifier FIX, round 1). Tier T2. Builder report and verifier report: [history/AITOOLS-03.md](history/AITOOLS-03.md).
- **Heads:** backend `wmt/AITOOLS-03` `542bc86` on `wmt/AITOOLS-02` `5d36fea` (verified base). That base branch has since moved to `79435c2`: when the pipeline reaches origin/main, merge origin/main into this branch, never rebase. Mobile `wmt/AITOOLS-03` carries this file.
- **Open (1 medium):** the Music call cannot run past 300 s whatever `AI_VOICE_MUSIC_TIMEOUT_MS` says (Node's built-in fetch ends a call that has sent no answer in 300 s). The README and `docs/contract/PLANS.md` say 600000. Fix: give the provider call its own connection settings with header and body waits at least as long as its timeout (or say plainly that 300 s is the limit and lower the default), then add a spec that waits past it against the stand-in.
- **Lows (4):** in the verifier report in history; the lead routes them to the sweep.
- **Everything else passed**, live over HTTP on the stand-in (58/58 checks), 102/102 ai-tools specs, 90/90 plan-settings, key-folder and purge specs, protected routes 253/253, tsc, eslint, contract:build with no diff, gates 0 fail and the same 133 warn list as the base, check_baseline.
- **Real provider (ElevenLabs), one job each through the Hub's routes:** Sound effect 0.5 s: provider 200, audio/mpeg, 8,820 bytes, 0.52 s long, call 1.6 s. Music 3 s, instrumental: provider 200, audio/mpeg, 48,945 bytes, 3.06 s long, call 3.6 s. The key and plan accept both tools. The time of a long track is still unmeasured (only the shortest was run).
- **Owner question G-AITOOLS-03-1** (Music terms, per plan) stays open for the owner.
- **Next:** a builder fixes the medium; a verifier re-checks the Music wait with the stand-in (`[[slow:330000]]`).

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
