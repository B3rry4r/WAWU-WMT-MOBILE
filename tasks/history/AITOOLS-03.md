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

