# AITOOLS-03 · round history

Moved out of [tasks/AITOOLS-03.md](../AITOOLS-03.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/AITOOLS-03` `542bc86`. No migration.
- **Files (backend, 34):** new `src/ai-tools/tools/` (`sound-effect.tool.ts`, `music.tool.ts`, `prompt-limits.ts`); changed `ai-tool.ts`, `index.ts`, `voiceover.tool.ts`, `quick-voice.tool.ts` (narrow the request kind), `ai-job.service.ts` (`createJob` reads the request of the tool's input kind; hash of a text job unchanged), `ai-tools.controller.ts`, `ai-tools.dto.ts`, `ai-tools.service.ts`, `ai-tools-view.type.ts`, `ai-tools-error.ts`, `audio/ai-audio-store.ts` (folder per tool), `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts` (one `postForAudio` for all three audio calls); `src/storage/storage.service.ts` (two folders), `src/account-purge/purge-files.ts`, `src/plan-settings/plan-setting-registry.ts` and `plan-settings.defaults.json`, `scripts/dev/voice-standin.cjs`, `test/ai-tools/` (harness store takes a folder; stand-in state type), `contract/openapi.json`, `README.md`, `docs/contract/PLANS.md`; specs listed in Current state.
- **Check 1** (listed before anyone runs): spec. 75 a `use` and 500 a `track`, `input.kind: prompt`, length range from the settings, `voices: []`; equals the quote; an admin change of cost or limit shows at once; not listed with the provider off, and a job is refused 503 with nothing held.
- **Check 2** (hold, run, commit, audio link; fail releases): spec for both tools. Done with a link under `ai/sound-effect/<person>/<job>.mp3` and `ai/music/...`, the stand-in saw the asked length and switch, hold committed; 500, 422, a web page and a store failure each release everything with "No points were taken".
- **Check 3** (length and description limits): spec. 31 s sound and 301 s track refused naming 30 and 300; a lowered setting names the new figure; a track over `points.max_audio_min_per_job` is `points_cap_reached` `minutes_per_job`; a description over its setting is `ai_prompt_too_long`, over the plan cap is `characters_per_job`; nothing held in any.
- **Check 4** (idempotency, concurrency, V8): spec. Same key twice runs one job and holds once (both tools); same key with another prompt, length or switch is 409; two jobs for one balance give 202 and 402; four track jobs for two run two; a late finish after the sweep fails and drops its audio; a dead run reads failed (released) or done (committed, under `ai/music`).
- **Check 5** (caps): spec. Daily cap named with `usedPoints`/`remainingPoints`; short points 402; wrong, old, other person's and other tool's quote 409.
- **Check 6** (account deletion): the purge table has both folders (`DELETE`), the key-folder list and `purge-files.spec` list them, and `purge-files.contract.spec` uploads one file of each and sees both removed. The store test proves `put` uses the tool's folder.
- **Check 7** (VoiceOver, Quick voice): AITOOLS-01 and -02 specs pass; only the counts listed above changed.
- **Gate counts** before and after: 0 fail, 133 warn, 88 accepted (AITOOLS-02 head and this head). `test:protected` 253/253.
- **Gaps filed:** G-AITOOLS-03-1 (the owner reads the Music terms). **Shared changes filed:** AITOOLS-03 #1 (contract), #2 (shared files).
- **Could not do:** a real provider run (no key), the stack run (HTTP specs only, real database and tokens), mutation checks. The default Music timeout is the longest allowed track times two, not a measured time.

## History

None yet. Reports go to tasks/history/AITOOLS-03.md.


## Verifier report

Backend `wmt/AITOOLS-03` `542bc86` against `wmt/AITOOLS-02` `5d36fea`. Own worktree and database; the Hub on the Nuvion stand-in; nothing Fintava; the voice stand-in for every check but the two real jobs. **Verdict: FIX** (1 medium, 4 lows).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | tsc EXIT 0; eslint (no --fix) on the 29 changed .ts files EXIT 0; gates 0 fail, 133 warn, 88 accepted, the warn list identical to the base's (diff empty); check_baseline EXIT 0 (124 entries); contract:build EXIT 0 and `git status` clean (no diff) |
| V2 Contract | passed | live HTTP, 58 of 58 checks on a stack (details below); specs 102/102 (7 ai-tools suites) and 90/90 (plan-settings, admin plan-settings, key folders, purge files and data map) |
| V3 Regression | passed | `test:protected` 253/253 after `db:seed` (a first run failed 8 because the stack's mock needs a service key; rerun on a plain mock: green) |
| V4 Field trace | passed | the description is never stored (job keeps its length); the length and switch live only in the request hash; audio key `ai/sound-effect/<person>/<job>.mp3` and `ai/music/...`, a `StorageObject` of the person, `confirmed`; `GET /ai-tools/jobs` shows both tools to their owner and 404 to another person |
| V6 States | passed | working, done, failed (`[[fail]]`, `[[reject]]`, `[[html]]` each tool: all points back, hold `released`, no audio), refused (nothing held) |
| V7 Flow walk | passed | catalogue, quote, job, poll, audio link, list, as the three seeded people |
| V8 Money | passed with one finding | same key twice: one job, one hold, 202 then 200 `Idempotent-Replayed`; six simultaneous same-key requests: one job, one hold, one charge; four music jobs racing on 500 points: one runs, three 402, balance never below 0; five sfx on 150: two run; daily cap 5000 refuses naming it, nothing held; a job finishing after the stale sweep (hold backdated, cron at 01:20:00 gave it back) is `failed timed_out`, ledger `hold -500, release +500` only, no audio, no storage row, balance restored |
| V9 Live seam | passed | sign-in through the mock login, real tokens, real routes, a value only the server has (job ids, hold ids) |

Capability checks, as written: (1) catalogue lists Sound effect 75 a `use` and Music track 500 a `track` before any run, flat for 0.5 s and 30 s and for 3 s and 300 s, `voices: []`, `input.length` and `instrumental`; an admin change (50 characters, 120 s, plan cap 1 minute) shows within 16 s. (2) holds, runs, commits, returns a link; failure gives every point back. (3) 31 s sound, 301 s track, 5,001 characters refused naming the limit (`ai_length_too_long`, `ai_prompt_too_long`, `cap`, `capLimit`, `capUnit`), a track over `points.max_audio_min_per_job` is `points_cap_reached` `minutes_per_job`, nothing held and no job row each time. (4) idempotency, races, late finish: above. (5) caps: above. (6) purge: both folders are `DELETE` in `FILE_KINDS`; `purge-files` specs green (16 objects removed); a live account deletion was NOT RUN. (7) VoiceOver and Quick voice live: 250 and 125 a minute, voice kept, audio under `ai/voiceover`, Quick voice on the faster model, failure refunds, unknown voice 400, a prompt body 400; their specs untouched and green.

Changed assertions, judged: `toHaveLength(2)` to 4 and the two id lists gain the two ids (honest new counts); the unbuilt-tool regex dropped `music|sound` and gained `clean` (honest, stronger); the key-folder and purge specs use all three audio folders and `objectsRemoved` 14 to 16 for the two files the spec now uploads (honest). No hidden defect.

Text a person reads: names, descriptions, every refusal and failure message scanned live (35 strings) and the source diff: no price, provider, model name or em-dash.

Settings: `ai.sfx_max_prompt_chars` and `ai.music_max_prompt_chars` default 5,000 (the plan's own cap, not a new figure), `ai.sfx_max_seconds` 30 and `ai.music_max_seconds` 300, all PROVISIONAL `AITOOLS-LIMITS` with a reason; they match API-FACTS (0.5 to 30 s; 3 to 300 s, the API allows up to 600 and the setting accepts 3 to 600).

**Real provider** (key from the agent file, never printed; the Hub pointed at a local pass-through that allowed one call per route): Sound effect (a short door knock, 0.5 s): provider 200, `audio/mpeg`, 8,820 bytes, 0.52 s of audio, call 1.6 s, job done in 2.0 s, 75 points kept. Music track (a short calm piano melody, 3 s, instrumental): provider 200, `audio/mpeg`, 48,945 bytes, 3.06 s, call 3.6 s, job done in 3.8 s, 500 points kept. No refusal, so the key and plan cover both tools today. Not measured: a long track (only the shortest was allowed).

Findings:
- **medium, defect.** `src/ai-tools/voice/http-voice-provider.ts` (`postForAudio`, the Music call): `AI_VOICE_MUSIC_TIMEOUT_MS` (default 600000) is cut at 300 s, the wait Node's built-in fetch allows for a first answer. Repro: voice stand-in, a Music job whose prompt holds `[[slow:330000]]`: the job is `failed` `provider_unavailable` after 301 s (points returned). README (AI voice section) and `docs/contract/PLANS.md` state 600000. Fail-safe (nothing kept), but a stated behaviour does not hold.
- **low, defect.** `src/ai-tools/ai-tools.dto.ts` (both prompt DTOs): `durationSeconds: "abc"` answers "durationSeconds must not be greater than 3600"; a 20,001-character prompt answers "Describe what you want to hear." (the too-short text).
- **low, unclear.** `src/ai-tools/ai-job.service.ts` (`run`, the provider catch): the provider's status (`status 401`, `422`) is dropped, so an owner whose key lacks a scope or whose plan refuses a tool sees only `provider_failed` and cannot tell why. Inherited from AITOOLS-01; it now matters for two plan-gated tools. A log line with the number (no body) would do.
- **low, defect.** `src/ai-tools/voice/http-voice-provider.ts` (`configured`): Sound effect and Music track need a non-empty `AI_VOICE_VOICES` to be listed though neither uses a voice.
- **low, record.** The builder report counts 34 changed .ts files; the diff has 34 files, 29 of them .ts. "up to 1 minutes" when an admin sets the audio cap to 1.
- **info.** `wmt/AITOOLS-02` is now `79435c2`; this branch sits on `5d36fea`.

Cleaned up: stack down, voice, storage and pass-through stand-ins stopped, extra Hub (7861) and mock (7863) stopped, databases `ait03v_*` dropped, worktrees removed.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/AITOOLS-03.md](history/AITOOLS-03.md).

