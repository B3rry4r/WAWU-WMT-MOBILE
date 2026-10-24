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

As of 24 Oct 2026, building (verifier FIX on round 2: 1 medium, 3 lows). Tier T2. Builder and verifier reports of every round: [history/AITOOLS-03.md](history/AITOOLS-03.md).
- **Heads:** backend `wmt/AITOOLS-03` `207fabf` (merged `wmt/AITOOLS-02` `79435c2`, new commits only). Mobile `wmt/AITOOLS-03` carries this file. No migration. Nothing was changed on the backend by the verifier.
- **Round 2 checked (verifier, own worktree and database `ait03v2_test`, stand-in only, nothing Fintava, no live host):**

| r2 row | Result |
|--------|--------|
| 1 Music wait | passed. Real 330 s case on the stand-in: default 600000 ms gives `done` in 330.7 s (hold committed, balance 0, one file); `AI_VOICE_MUSIC_TIMEOUT_MS=300000` gives `failed provider_unavailable` in 300.5 s, hold released, 500 points back, no file. Wire compared with the `fetch` call: same method, path, query, body bytes, `content-type`, `accept`, `xi-api-key`, `host`, `content-length`; every status, empty, not-audio, cut-off and refused answer maps the same; a silent server and a body that never stops both end at the timeout (1.50 s for 1.5 s), sockets closed, an abort sends nothing. Local TLS (SNI and Host right, an untrusted certificate refused) |
| 2 providerRef | **medium finding F1 below** |
| 3 two old assertions | passed. Both pin the new rule honestly; the real off state (no host or key) is still asserted |
| 4 texts and the shared cap text | passed. Only a cap of 1 changes ("1 minute") for every caller; no em-dash, price, provider or model name in the new texts |
| 5 listing without voices | passed (provider spec on real config; contract case) |

- **Checks (EXIT 0 each):** tsc; eslint (no --fix) on the 11 round-2 .ts files; 11 suites of `src/ai-tools` and `src/points`, 194/194 in band (six `src/points` specs that use the Fintava double or a Fintava table were NOT RUN, by rule); `test:protected` 253/253 after `db:seed`; contract:build, no diff; gates 0 fail, 133 warn, 88 accepted (same as the base); check_baseline (124 entries).
- **Open findings (fix round 3):**
  - **F1 medium.** `providerRef` holds `http_<status>` on a failed job. A failed job now stops the AITOOLS-02 rollback (`rollback.sql` refuses on any `providerRef`), and `fail()` writes `providerRef` (null or `http_<n>`) on every failure, which wipes the provider ids AITOOLS-05 keeps there while a dub works. Round 1 asked only for a log line, which is in. Fix: do not write the status to `providerRef`; leave `providerRef` untouched in `fail()`.
  - **F2 low.** The Music call sends no `User-Agent` or `Accept-Encoding` (the `fetch` call sent `user-agent: node`). Unproven against a real host.
  - **F3 low.** The Music call does not follow a redirect (the `fetch` call did); a 3xx fails the job, points back.
  - **F4 low, before this round.** The shared cap text reads "up to 1 minute. This one is 2." with no unit for the second number.
- **Owner question G-AITOOLS-03-1** (Music terms, per plan) stays open for the owner.
- **Next:** a builder fixes F1 (F2 to F4 go to the POINTS sweep); a verifier re-runs the rollback case from the report.

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

