# AITOOLS-02 · round history

Moved out of [tasks/AITOOLS-02.md](../AITOOLS-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/AITOOLS-02` `0a29c9a`. Pickup: judged an earlier builder's uncommitted diff against this file, kept all of it (registry, pipeline, Quick voice, job list, migration, stand-in route table, settings), added the migration spec, fixed formatting, finished the checks.
- **Files:** new `src/ai-tools/tools/` (`ai-tool.ts`, `index.ts`, `voiceover.tool.ts`, `quick-voice.tool.ts`), migration `20261101100000_ai_tool_job_outputs` (+ `rollback.sql`), specs `ai-tools-pipeline.contract.spec.ts` and `ai-tools-migration.contract.spec.ts`. Changed (additive): `prisma/schema.prisma` (3 nullable columns), `ai-job.service.ts`, `ai-tools.service.ts`, `ai-tools.controller.ts`, `ai-tools.dto.ts`, `ai-tools-view.type.ts`, the voice seam and adapter, plan-settings registry and defaults, `voice-standin.cjs`, `contract/openapi.json`, `docs/contract/PLANS.md` section 12, `README.md`.
- **Check 1** (VoiceOver as before): AITOOLS-01 contract 26 and provider 9 pass; one assertion changed (catalogue length 1 to 2, see Current state); protected 253/253.
- **Check 2** (catalogue): spec lists Quick voice at 125 with `input.kind`, same voices, shows an admin change at once, lists nothing for an unbuilt tool, and drops Quick voice (VoiceOver stays `enabled: false`) with no provider.
- **Check 3** (Quick voice job): spec: holds, stand-in `lastModel` is the faster model, commits, audio as `audioUrl` and as an `audio` output; 500, 422, a web page and a store failure release everything; same key twice runs one job and holds once (other words or VoiceOver under the key: 409); two at once for one job's points: 202 and 402, balance 0; a VoiceOver quote does not pay for Quick voice (409).
- **Check 4** (caps): characters, minutes and daily (VoiceOver and Quick voice count in one day) name the cap, zero holds, zero jobs.
- **Check 5** (job list): only the caller's jobs of both tools, newest first, pages of two give three pages with no repeat; bad cursor and limit 400; another person's id 404; a working job on the list follows a stale-hold sweep.
- **Check 6** (migration): spec on a real database: rollback keeps every row (state, cost, `audioKey`) and the migration re-applies on those rows; rollback refuses for words, subtitles, a foreign audio output, `providerRef`, `inputRef`.
- **Check 7** (strings): no provider name, model name or em-dash in catalogue, job or list answers (spec).
- **Gate counts** (mobile, before to after): gates 0 fail, 18 warn, 0 accepted, to the same; `check_tasks` 414 tasks, same. Backend gates 0 fail, 133 warn, 88 accepted.
- **Gaps:** G-AITOOLS-02-1 stays closed; G-POINTS-08-3 server half closed (the screen is G-POINTS-09-1's); G-AITOOLS-01-5 now also names `speakQuick`. No new row. Shared changes: SHARED-CHANGES AITOOLS-02 #1 (migration) and #2 (contract).
- **Could not do:** the real provider run (no key); the local test stack run.

## History

None yet. Reports go to tasks/history/AITOOLS-02.md.


## Verifier report

Verifier: Sonnet agent (did not build any of it), T2, 24 Oct 2026. Backend `origin/wmt/AITOOLS-02` `0a29c9a` against `origin/main` `b2f4df6`; mobile `1fdd8dc7`. Own database `ait02v_wawu_hub_test` (stack `ait02v`, Hub 7860, voice stand-in 7920, storage stand-in 7921, mock id 7864), nothing Fintava touched, no live host.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | tsc EXIT 0; eslint (no --fix) on the 16 changed `.ts` files EXIT 0 (the `.cjs` stand-in is outside the lint project, as for every script); gates 0 fail, 133 warn, 88 accepted, 1753 files scanned (main: 1747 files, same counts, warn list identical at file level); check_baseline EXIT 0; `contract:build` EXIT 0 and `git diff contract/openapi.json` empty |
| V2 Contract | passed | live over HTTP and specs: ai-tools specs in band 63/63 (AITOOLS-01 26, provider 9, pipeline 20, migration 8) EXIT 0; plan-settings, admin plan-settings, home-17, voice-intro, own-voice specs 101/101 EXIT 0 (the two plan-settings specs that import the Fintava double were not run) |
| V3 Regression | passed, with a note | `test:protected` after `db:seed` on a fresh database: 245/253 on the branch and 245/253 on main, the identical 8 failing (verification ticks grant/revoke/purchase verify, professionals approve/unlist/listing/get): not caused by the branch; `.pipeline/protected-registry.json` untouched |
| V4 Field trace | passed | a job's `outputs` and `audioUrl` are written by the run, read by `GET /ai-tools/jobs/{id}` and the list, same link; a job written before the column (audioKey only) still answers its audio as an output (spec) |
| V6 States | passed | working, done and failed reached through real causes on the stand-in: 500, 422 and a web page each end `failed` with the words "No points were taken", balance unchanged, no audio, no outputs |
| V7 Flow walk | passed | as three people over HTTP: catalogue, quote, job, poll, read, list, and another person's id; cold start each time |
| V8 Money | passed | same Idempotency-Key twice: 202 then 200 replay (`Idempotent-Replayed`), one provider call, held once; same key with other words or under VoiceOver: 409; no key or a short key: 400, nothing held; two jobs at once for one job's points: 202 and 402, balance 0; six at once for two jobs' points: two 202, four 402, balance 0; failure releases every point; DB left with no stuck hold |
| V9 Live seam | passed | real Hub build from the branch, mock identity login (RS256 token), the real Postgres, storage stand-in; plus the real provider (below). The real wawu-id was not started |

Capability checks (each live over HTTP unless said):
- **VoiceOver as before:** AITOOLS-01 contract and provider specs pass with only line 125 changed; live VoiceOver job: 202, 250 held and kept, no model sent, one audio output; branch specs on a main worktree: the 25 other AITOOLS-01 tests pass there and only the edited line fails (below).
- **Catalogue:** lists VoiceOver then Quick voice at 125 a minute with `input.kind: text`, 900 characters a minute, 5000 maximum and the same voices. A Hub with no provider set lists VoiceOver `enabled: false` and no Quick voice, and both job routes answer 503 "No points were taken". The registry holds exactly the two built tools. An admin row for `ai.quick_voice_chars_per_minute` showed in the catalogue within 6 s.
- **Quick voice job:** 202 working, holds 125; stand-in `lastModel` `eleven_flash_v2_5` (VoiceOver sends none); done with `audioUrl` equal to the `audio` output, the link serves 1,668 bytes of audio/mpeg; committed, balance 1000 to 875.
- **Caps:** 5001 characters: 422 `characters_per_job`; 12 minutes at 400 characters a minute: 422 `minutes_per_job` ("up to 10 minutes. This one is 12"); exactly 10 minutes allowed; after 5000 points in the day (Quick voice and VoiceOver together) the next is 422 naming today's limit and midnight. Nothing held, no job row in each refusal.
- **Job list:** only the caller's jobs of both tools, newest first; 8 jobs in pages of 3 give 3 pages, identical order to one page, no repeat and none missed; pages of 4 give exactly 2 pages; an empty list is `{items: [], nextCursor: null}`; bad cursor, limit 0, 101 and `abc`: 400; no token: 401; another person's job id and a missing id give the same 404 body.
- **Migration:** main's migrations on a new database, 4 `AiToolJob` rows shaped like AITOOLS-01's (done with audio key, done, failed, working); `prisma migrate deploy` applies, the 4 rows are byte-identical, 3 new columns all NULL, `prisma migrate diff` against `schema.prisma` empty; `rollback.sql` through `psql -1` leaves the 4 rows identical and the columns gone; the migration then applies again. Rollback refuses and changes nothing for a text output, a subtitles output, a `providerRef`, an `inputRef` and an audio output with a key other than the job's `audioKey`; it goes through for the job's own audio. Stamp `20261101100000` is later than every migration on main (newest `20261031100000_flix_movies`) and on every one of the 277 `origin/wmt/*` backend branches, and no other branch holds it.
- **Strings:** 17 live responses (catalogue, jobs done and failed, list, 402, 409, 422, 400, 404, 503) scanned: no provider name, model name, `stand-in` or dash of any kind; the new source text has no em-dash.

**The changed assertion** (`ai-tools.contract.spec.ts:125`, `toHaveLength(1)` to `toHaveLength(2)`): the honest new count. With the provider set, the registry has two built tools and the live catalogue returns two; the entry assertions after it (VoiceOver first, every field) are untouched and still pass; run on main code the edited line fails (expected 2, received 1) while the other 25 tests pass, so the edit follows the scope and hides no defect. The new pipeline spec fails on main (`Cannot find module '../tools'`) and the migration spec fails on main (no migration file); both pass built.

**Real provider (check 4):** Hub from the branch, started with `AI_VOICE_*` pointed at the real provider through a local logging forwarder (no headers logged), four premade provider voices configured as `george`, `sarah`, `alice`, `roger` (one `GET /v1/voices` read to learn the ids, since none are configured in either repo). Two Quick voice jobs through `POST /ai-tools/quick-voice/jobs`, voice `george`:
1. 59 characters: Hub sent `model_id` `eleven_flash_v2_5`; provider status 200; audio/mpeg came back, 62,736 bytes, about 3.9 s at 128 kbps (ID3 header, MPEG layer III, 44.1 kHz); 125 points committed.
2. 45 characters: same model, status 200, 51,452 bytes, about 3.2 s; 125 points committed.
The key was never refused. Both Hubs, the forwarder and the stand-ins were stopped afterwards.

**Findings**
- **Medium M1 (defect):** `src/ai-tools/tools/quick-voice.tool.ts:22`. The catalogue description says "at half the points", a price relation nothing in the system backs: the price is an admin setting (R-65, `points.action.quick_voice_per_min`). Repro: set that setting to 240 (VoiceOver is 250), `GET /ai-tools` after the 6 s refresh: `costPointsPerUnit` 240, description still "A fast read of your words, at half the points." The app draws this line (POINTS-08/09 are entry-driven). Fix: drop the clause, or build it from the live figures. No spec pins the words.
- **Low L1 (defect, not reachable today):** `prisma/migrations/20261101100000_ai_tool_job_outputs/rollback.sql:18`. A non-list `outputs` value (a JSON object) is read as empty, so the rollback goes through and drops it. Repro: `UPDATE "AiToolJob" SET outputs='{"kind":"text","text":"x"}'`, then `psql -1 -f rollback.sql`: succeeds. The pipeline writes lists only; make the guard refuse any `outputs` that is not NULL or an empty or own-audio list.
- **Low L2 (report accuracy):** the builder's file list omits `test/ai-tools/voice-standin-for-specs.ts`, which the diff changes (the `models` and `lastModel` fields).
- **Low L3 (test gap):** mutation checks NOT RUN (step budget). The live checks above cover the same claims (model, hold once, release, race, own jobs only, caps).
- **Note, not a finding of this branch:** the protected suite shows the same 8 failures on main on this machine (see V3); the lead may want to know the builder's 253/253 did not reproduce for main either.

**Verdict: FIX** (M1 only needs a one-phrase change; the rest is merge-ready: re-verify M1 and nothing else).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AITOOLS-02.md](history/AITOOLS-02.md).

