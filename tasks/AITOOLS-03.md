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

As of 24 Oct 2026, verifying (builder fix round 3 done). Tier T2. Builder report and verifier reports of every round: [history/AITOOLS-03.md](history/AITOOLS-03.md).
- **Heads:** backend `wmt/AITOOLS-03` `9d50fc6` (on `207fabf`, new commit only). Mobile `wmt/AITOOLS-03` carries this file. No migration, no new column. Round 3 touched 6 .ts files and the README.

| r3 row | Fix | Proof |
|--------|-----|-------|
| F1 medium | `fail()` no longer writes `providerRef`; the provider's status stays in the log line (`ai job <id> (...) answered 402`) only. A failed job leaves `providerRef` as it was and does not block the AITOOLS-02 rollback | `round 3: a provider refusal's HTTP status ...` (both tools, 401 and 402): the log line carries the status, every failed job has `providerRef` null, and the `DO` check of `rollback.sql`, run as written on those jobs, passes (and refuses once one has a provider id, so the check is live). `round 3: a provider id set on a working job ...` sets `providerRef` on a working job, fails it by 402 and by 500, both tools, and reads it back unchanged. A mutant (`fail()` writing `http_402`) fails both. The round 2 assertions that pinned `http_NNN` now assert the log line and null (lead ruling: they pinned the round's own defect) |
| F2 low | The Music call sends `user-agent: node`, the value `fetch` sends (the repo has none of its own) | provider spec on a capture server: the Music call's `user-agent` equals the one a `fetch` call sends |
| F3 low | The Music call follows up to 3 redirects (301, 302, 303, 307, 308) inside the one deadline: 307 and 308 repeat the POST with the same body and headers; 301, 302 and 303 become a GET with no body, as `fetch` does; a fourth, a redirect with no `location` or to a scheme other than http(s) fails as a 3xx answer did before (`rejected`, status kept) | provider spec on the capture server: each status compared with the `fetch` call on the same server; a chain of 3 is followed, a chain of 4 stops after 4 requests; no `location` and `ftp://` fail; two hops of 700 ms fail against a 1 s deadline and finish inside 5 s |
| F4 low | The shared cap text reads "One job can run up to 1 minute. This one is 2 minutes." (singular for 1, "up to 0 minutes. This one is 1 minute.") | `points-spend-rules.spec.ts` `capStop` case. Callers: `capStop` is called twice in `points-spend.service.ts` (quote and hold) and nothing else builds the text; `prompt-limits.ts` already ends "seconds"; no spec or mobile file pinned the old text |

- **Checks (backend, own worktree and database `ait03r3_wawu_hub_test`, mock on 7867, stand-in only, nothing Fintava):** tsc `EXIT 0`; eslint (no --fix) on the 6 changed .ts files `EXIT 0`; `src/ai-tools` 7 suites 118/118 in band `EXIT 0`; `points-spend-rules.spec.ts` with the provider spec 32/32 `EXIT 0` (the six Fintava-double `src/points` specs NOT RUN, by rule); contract:build `EXIT 0`, no diff; gates 0 fail, 133 warn, 88 accepted (same as the base) `EXIT 0`; check_baseline (124 entries) `EXIT 0`. Mobile: `check_tasks.py --write` `EXIT 0` (415 tasks); gates `EXIT 0` (10 run, 1215 files, 0 fail, 18 warn, same as before).
- **Not done:** `test:protected` was not re-run (no route, DTO or contract change this round). TLS and a real host were not run (no live host by rule). The key header goes on every redirect hop, as `fetch` sends it.
- **Owner question G-AITOOLS-03-1** (Music terms, per plan) stays open for the owner.
- **Next:** a verifier re-checks the rollback case with a failed 402 job (`rollback.sql` through psql) and the three lows on a capture server.

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

