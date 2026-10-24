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

