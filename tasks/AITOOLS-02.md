---
id: AITOOLS-02
title: One job pipeline for every AI tool, the job list, and Quick voice (backend)
owner: YOU
area: POINTS
order: -125
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: []
decisions: [R-79, R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-02 · One job pipeline for every AI tool, the job list, and Quick voice (backend)

## Current state

As of 24 Oct 2026, verifying (builder done; a verifier is next). Tier T2 (third-party, spends points).
- **Branches:** backend `wmt/AITOOLS-02` `0a29c9a` on origin/main `b2f4df6`; mobile `wmt/AITOOLS-02` (this file, SHARED-CHANGES AITOOLS-02 #1 and #2, BACKEND_GAPS, the log line) on origin/main `dff9b30e`, merged not rebased. No PR. An earlier builder stopped at a usage limit with nothing committed; this builder judged its uncommitted work, kept it, added the migration spec and finished the checks.
- **Before:** one tool (VoiceOver) hard-wired in `AiJobService.createVoiceover`; `GET /ai-tools` held one entry; a job view had `audioUrl` only; no list of a person's jobs (G-POINTS-08-3).
- **After:** `AiJobService.createJob(tool, ...)` runs every tool through the one pipeline; a tool is one file in `src/ai-tools/tools/` plus one line in `tools/index.ts`. VoiceOver is the first entry, route and answer unchanged. Quick voice is the second.
- **Routes added (2):** `POST /ai-tools/quick-voice/jobs` (text, `voiceId`, `quoteToken` for `quick_voice_per_min`, required `Idempotency-Key`; 202 working, 200 replay) and `GET /ai-tools/jobs` (the caller's own jobs, newest first, `{ items, nextCursor }`, `?cursor&limit`).
- **Answer shapes (additive):** `GET /ai-tools` entries gain `input.kind` (`text`); an entry's `id` may be `quick-voice`; Quick voice is listed only when the provider can run it (VoiceOver stays listed `enabled: false`, as AITOOLS-01). A job view gains `outputs: [{ kind: audio | text | subtitles, url?, text? }]`; `audioUrl` is unchanged and equals the audio output. Contract regenerated: 2 operations, 3 schemas (`CreateQuickVoiceJobDto`, `AiJobOutputView`, `AiJobPage`), the `voiceover` enums gain `quick-voice`; nothing removed.
- **Quick voice:** the seam method `speakQuick` (same voices, the faster model `AI_VOICE_QUICK_MODEL`, default `eleven_flash_v2_5`), 125 points a minute (`points.action.quick_voice_per_min`), a minute is `ai.quick_voice_chars_per_minute` = 900 (new, PROVISIONAL `AITOOLS-CHARS-PER-MINUTE`). The stand-in records `model_id` per call and answers from a route table.
- **Migration:** `20261101100000_ai_tool_job_outputs`: nullable `outputs` (JSON), `providerRef`, `inputRef` on `AiToolJob`. Stamp sorts after every migration on backend main and on every `origin/wmt/*` backend branch (newest seen `20261031100000_flix_movies`, 24 Oct 2026). Rollback beside it loses no row and refuses while a column holds something only it keeps; `prisma migrate diff` after applying: empty.
- **Admin settings:** every `points.action.<id>` `usedBy` now names the tool's route; one new setting above. Nothing else.
- **Checks (backend, EXIT 0 each):** tsc; eslint on changed files; `src/ai-tools` specs in band 63/63 (AITOOLS-01 26, pipeline 20, provider 9, migration 8); plan-settings, admin plan-settings and voice-intro specs 101/101; `test:protected` 253/253 (244 required); `contract:build`; gates 0 fail (133 warn, 88 accepted); `check_baseline`. Mobile: `check_tasks` and gates below.
- **Changed assertion (flag for the verifier):** AITOOLS-01's `ai-tools.contract.spec.ts` line 125 `toHaveLength(1)` is now `toHaveLength(2)`: this task's scope lists Quick voice in the same catalogue, so the count cannot stay 1. Every VoiceOver assertion is untouched.
- **NOT RUN against the real provider** (G-AITOOLS-01-5): built and run against `scripts/dev/voice-standin.cjs`. Not run on the local test stack either: HTTP specs only, real database, real tokens, no payment provider.
- **Not done / next:** a verifier; the other tools (AITOOLS-03 to -06) add a file each. The job list has no screen (G-POINTS-09-1), only the route.
- **History:** tasks/history/AITOOLS-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `docs/elevenlabs/API-FACTS.md` (the provider's routes, limits and what the free read calls showed: every provider fact in this task comes from it or from a real response)
- `DECISIONS.md`: R-79 (what Quick voice is), R-78, R-43, R-61, R-65, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/AITOOLS-01.md` (the job and points flow this task reuses) and `tasks/POINTS-03.md` (hold, commit, release, caps)
- Backend `src/ai-tools/` (`ai-job.service.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `tests/ai-tools.contract.spec.ts`) and `scripts/dev/voice-standin.cjs`
- `design/Points Flow.dc.html` boards PT1, PT2, PT2a, PT2b, PT2c (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c` and look at each: the tile "Quick voice, 125 a minute", the text box, the cost line, the working, done and failed states)
- `BACKEND_GAPS.md` G-801, G-813, G-AITOOLS-01-1 to -5, G-POINTS-08-3
- Backend `prisma/schema.prisma` model `AiToolJob`, `src/plan-settings/plan-setting-registry.ts` (the `points.action.<id>` settings), `src/plans/plans.config.json` (`action_points`)

## Goal

Every tool Studio lists runs through one job pipeline, so the next tools are a tool file each, not a copy of VoiceOver. Quick voice is the first tool added through it: a fast, cheaper read-aloud: the same voices as VoiceOver on the provider's faster model, 125 points a minute (R-79, owner, 23 Oct 2026; the board's figure, PROVISIONAL under R-65). A person types text, picks a voice, and gets audio.

## Scope

- **One pipeline.** Turn `AiJobService.createVoiceover` into `createJob(tool, ...)` driven by a tool registry, one file per tool under `src/ai-tools/tools/` (id, route segment, plan action id, unit, how a request is priced into units, what the request carries, the one provider call, what the job returns). VoiceOver becomes the first registry entry with NO change to its route, its request, its answer or its behaviour: `POST /ai-tools/voiceover/jobs`, `GET /ai-tools/jobs/{id}` and every AITOOLS-01 spec pass untouched (protected, V3). Hold through POINTS-03, provider after the answer with nothing held, store, COMMIT, mark done; any failure RELEASES; a late finish and the stale-hold sweep cannot both win. All as AITOOLS-01.
- **One catalogue shape.** `GET /ai-tools` lists a tool only when its code is built and the provider is configured for it (R-47). Each entry carries `input` with a `kind` (`text` now; `prompt`, `file` and `chat` are added by the tasks that need them) and its limits, so the app builds a screen from the entry (POINTS-08's tool screen is already entry-driven). Additive fields only.
- **One result shape.** The job view gains `outputs`: a list of `{{ kind: audio | text | subtitles, url?, text? }}`. `audioUrl` stays and is filled for audio, so POINTS-08 is untouched.
- **The job list** (closes G-POINTS-08-3 on the server): `GET /ai-tools/jobs` the person's own jobs, newest first, cursor pages per `docs/contract/CONVENTIONS.md`, each with tool, state, points taken, time and its outputs. The app does not draw a list until a board does (G-POINTS-09-1), so only the route is built.
- **Migration (additive, with its rollback):** nullable columns on `AiToolJob` that every tool uses: `outputs` (Json), `providerRef` (text, the provider's own id for a long job), `inputRef` (text, the key of the person's uploaded file). The migration stamp goes in the registry. No other table changes.
- **Quick voice.** A seam method `speakQuick` on `AiVoiceProvider` (same voices as VoiceOver, the provider's faster model set by `AI_VOICE_QUICK_MODEL`, default `eleven_flash_v2_5`: see API-FACTS, "Text to speech"). Route `POST /ai-tools/quick-voice/jobs` (text, `voiceId`, `quoteToken`, required `Idempotency-Key`), priced by the plan action `quick_voice_per_min` (125 a minute, already an admin setting `points.action.quick_voice_per_min`, PROVISIONAL). Characters that make a minute: a new setting `ai.quick_voice_chars_per_minute`.
- **Admin settings.** Every tool's points cost is already a setting for each plan action (`points.action.<id>`, PROVISIONAL, the board's figure as the default). This task changes only the `usedBy` words to name the tool's routes and adds the settings above, each PROVISIONAL with a one-line reason.
- **The stand-in.** `scripts/dev/voice-standin.cjs` gets a route table (one entry per provider route) so each later tool adds its route and its `[[fail]]`, `[[reject]]`, `[[slow:n]]` markers the same way, and answers `model_id` on the speech route so a spec can see which model ran.
- **Strings.** No provider name in anything a person reads (R-68). Failed jobs say "No points were taken" as today. No em-dashes (R-5).

## Provisional figures (R-65: the owner confirms, an admin changes them any time)

- `ai.quick_voice_chars_per_minute`: 900, the same as VoiceOver's `ai.voiceover_chars_per_minute` (PROVISIONAL `AITOOLS-CHARS-PER-MINUTE`; no board gives it).
- `points.action.quick_voice_per_min`: 125 a minute, the PT1 tile's figure (exists; PROVISIONAL `DV2-BOARD-FIGURE`).
- Ruled, no owner question (R-79, owner, 23 Oct 2026): Quick voice is a fast, cheaper read-aloud: the same voices as VoiceOver on the provider's faster model, 125 points a minute. G-AITOOLS-02-1 is closed. A person's own voice from a short recording is "Your voice" on PT2 (VOICE-01), a different thing.

## Capability checks

- [ ] VoiceOver behaves exactly as before: the AITOOLS-01 contract and provider specs pass with no assertion changed, and the protected suite passes (V3).
- [ ] `GET /ai-tools` lists Quick voice with 125 points a minute before anyone runs it, only when the provider is configured, and lists nothing for a tool whose code is not built.
- [ ] A Quick voice job holds, runs on the faster model (the stand-in records `model_id`), commits and returns audio; a failed job releases everything; the same `Idempotency-Key` twice runs one job and holds once; two jobs at once never take points below zero (V8).
- [ ] Over the daily, characters or minutes cap the answer names the cap and nothing is held.
- [ ] `GET /ai-tools/jobs` returns only the caller's jobs, newest first, in cursor pages; another person's job id answers not found.
- [ ] The migration applies on a database with existing `AiToolJob` rows and rolls back without losing them.
- [ ] No provider name, no provider id and no em-dash in any response string.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AITOOLS-02.md](history/AITOOLS-02.md).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AITOOLS-02.md](history/AITOOLS-02.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
