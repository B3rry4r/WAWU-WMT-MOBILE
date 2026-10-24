# AITOOLS-04 · round history

Moved out of [tasks/AITOOLS-04.md](../AITOOLS-04.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/AITOOLS-04` `d571fbd`. No migration.
- **Files (backend):** new `src/ai-tools/input/` (`ai-input-files.ts`, `media-length.ts`), `tools/captions.tool.ts`, `clean-audio.tool.ts`, `file-limits.ts`, `subtitles.ts`, specs `ai-tools-files.contract.spec.ts`, `ai-file-provider.spec.ts`, `src/storage/tests/ai-input-folders.spec.ts`; changed the pipeline (`ai-job.service.ts`), seam and adapter (`ai-voice-provider.ts`, `http-voice-provider.ts`: one `longCall` now serves Music, Captions and Clean audio), `ai-tool.ts`, controller, dto, service, view, error, module, audio store; storage (two folders, optional settings cap), purge table, settings registry and defaults, `points-spend.module.ts` (exports the quote service), `scripts/dev/voice-standin.cjs`, the spec harness, `contract/openapi.json`, `README.md`, `docs/contract/PLANS.md`, `package.json` and lock (`music-metadata` 7.14.0).
- **Length reader:** `music-metadata` (pure JavaScript, no ffmpeg). The declared type is a hint; a file it does not fit is read again from its own bytes. Minutes round up, at least 1. Tested on WAV and MP3.
- **Check 1** catalogue: spec. 15 and 400 a `minute`, `input.kind: file` with folders, accepted types, `maxBytes` (setting, changes at once), `maxMinutes`. **Check 2** quote: spec. 90 s gives 2 minutes and 30 points, 61 s MP3 gives 2, 60 s gives 1; a body with a length is 400.
- **Check 3** jobs: spec. Captions: hold, run, commit, `text` (180 words) and an SRT of 30 cues, model `scribe_v2`, word times and language sent, transcript deleted (stand-in list), file removed. Clean audio: link under `ai/clean-audio`, history item deleted. Provider fault 500, 422, 402, a web page, an unserved type (`audio/ogg`), a reported length 181 s against 2 priced minutes (180 s is kept) and an unreadable file at run time each release every point, delete the file and the provider copy.
- **Check 4** refusals: spec. Text declared as WAV, empty and cut-off files `422 ai_file_unreadable`; over `ai.input_max_bytes` `422 ai_file_too_large`; 90 s with the minute cap at 1 `422 points_cap_reached` (`minutes_per_job`) and the quote says `canRun: false`; another person's key, a file that never landed and a missing key `404`. No hold, no job, no provider call, the file still there.
- **Check 6** V8: spec. Same key twice: one job, one hold, 200 replay (also after the file is gone); another file or language under the key 409. Two jobs at once for one balance 202 and 402. A finish after the sweep: failed, no words kept, points back, file deleted.
- **Also fixed here:** a done job's words are written to its row before the points are kept (a transcript lives nowhere else); `reconcile` reads the audio key from the outputs.
- **Gates:** 0 fail, 133 warn, 88 accepted before and after. `test:protected` 253/253. **Gaps filed:** G-AITOOLS-04-1, -2, -3. **Shared changes filed:** AITOOLS-04 #1 (contract), #2 (shared files; no migration).
- **Could not do:** a real provider run (no key); the stack run (HTTP specs only); mutation checks; MP4, AAC, QuickTime and WebM length files.

## History

None yet. Reports go to tasks/history/AITOOLS-04.md.

