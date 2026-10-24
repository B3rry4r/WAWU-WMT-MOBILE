---
id: AITOOLS-05
title: Dubbing (backend)
owner: YOU
area: POINTS
order: -122
priority: launch
repo: wawu-backend
type: third-party
status: review
depends_on: [AITOOLS-04]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-05 · Dubbing (backend)

## Current state

24 Oct 2026: the verifier's one medium (the two NOT_GATED entries) fixed in b5da5fc; lead accepted it on the diff read (Fable rule, a fix of 30 lines or fewer); the four lows go to SWEEP-AI.

As of 24 Oct 2026, **building (verifier said FIX: 1 medium, 4 low; a Sonnet builder continues backend `wmt/AITOOLS-05`)**. Backend only, no migration. Verifier (Sonnet, built none of it) checked backend `4aeff65`; report in "Verifier report" below. Everything it ran on the stack passed except the two items under Findings 1 and 2.
- **Heads:** backend `wmt/AITOOLS-05` `4aeff65` (commit `fc2e066` on `origin/wmt/AITOOLS-04` `4dac644`, then `origin/main` `c3a2c7a` merged: AITOOLS-04 is in main); mobile `wmt/AITOOLS-05` carries these records.
- **Built vs before (`origin/main` has no Dubbing):**

| # | Before | After |
|---|---|---|
| 1 | no Dubbing tool, six tools listed | `dubbing` is the seventh: `POST /ai-tools/dubbing/quote` and `/dubbing/jobs` (`fileKey`, `targetLanguage`, `sourceLanguage?`, `quoteToken`, `Idempotency-Key`), 1,500 a minute for one language (the Hub's own reading of the file), `GET /ai-tools` lists it with `input.file.dubbing.languages` |
| 2 | every job is one provider call | a followed job: the provider takes the file, the job stays `working` with the project and language ids on its row (`dubrun:`); `AiDubService` reads each working dub every 15 s and ends it; a restart picks every row up again |
| 3 | one stale-hold limit (`points.job_max_run_minutes`, 30) | a dub has its own, `ai.dubbing_max_run_minutes` 60 (PROVISIONAL `AITOOLS-DUB-RUN`); the points sweep leaves a working dub's hold alone until then |
| 4 | `ai.dubbing_languages` did not exist | the setting holds the provider's Dubbing v2 list, 94 base languages, read 24 Oct 2026 (PROVISIONAL `AITOOLS-DUB-LANGUAGES`); a language off it, or the source language again, is `422 ai_language_unsupported` with nothing held |
| 5 | the Hub stored four audio types | `audio/flac` is served (additive); the dub's FLAC and WebVTT subtitles are kept as `outputs` (`audio`, `subtitles`); no dubbed video |
| 6 | a provider copy was a transcript or a cleaned item | the project is a third copy: deleted when the job ends, the row notes `dub:<id>` and clears it only after two clean reads of 404, 10 and then 5 minutes on (AITOOLS-04 round 4) |

- **AITOOLS-04 findings applied:** the file goes in behind the same sniff, read gate and streaming (the run opens it streamed, one place per account); provider copies cleared by two clean 404 reads 5 minutes apart (spec: a provider that hides and shows the project); the provider's status goes to the log only and no line a person reads names a price or the provider (spec). The signed links the provider names are not trusted: https to a name (or the configured host), no key sent, no redirect, a size bound from the priced minutes, FLAC and WEBVTT markers checked, one fetch at a time.
- **Checks (backend, own database `b1dub_wawu_hub_test`):** 44 suites, 570 tests in band (src/ai-tools 18 suites incl. the new `ai-dubbing.contract.spec.ts` with 17 tests and `ai-dub-provider.spec.ts` with 8, src/storage 19, plan-settings 4, account-purge 2, voice-intro 1; none imports the Fintava double) `EXIT 0`; on the merged tree the five dub-related suites again 74 tests `EXIT 0`; tsc `EXIT 0`; eslint (no --fix, 30 .ts) `EXIT 0`; `test:protected` 253/253 `EXIT 0` (db:seed first); contract:build `EXIT 0` (additive diff: two operations, `CreateDubbingJobDto`, `dubbing` in two enums, `targetLanguage`); gates 0 fail, 134 warn, 88 accepted (133 before the merge) `EXIT 0`; check_baseline `EXIT 0`. Mutation checks: the sweep without the dub's limit, and the confirm rule without the 10 minute window, each fail their spec. NOT run: `plans.contract`, `plan-settings-readers`, `plan-settings-round2` and `points-spend.contract` (they reach the Fintava double; CI runs them). Four assertions that pinned the six tools or Dubbing as unbuilt were changed with a comment each (see SHARED-CHANGES AITOOLS-05 #2).
- **NOT RUN against the real provider** (no key on a build machine): `ai.dubbing_max_run_minutes` is the lead's pick (60), not measured (G-AITOOLS-05-3). Built and tested against `scripts/dev/voice-standin.cjs`.
- **Defaults (lead), owner may override:** the subtitles are kept in the job as text (like Captions' SRT), not as a separate file; a project with no language id ends the job and is deleted; a missing or non-WebVTT subtitle file drops the subtitles and keeps the dub; the Hub does not compare the provider's length with the priced one (the provider's project reports `media.duration_s` only on a separate read).
- **Owner questions for the report:** what premium dubbing is and whether to offer it (the 6,500 figure is in the plan file only, G-AITOOLS-05-2); a dub of a video returns audio and subtitles, not a video (G-AITOOLS-05-1); the app must play FLAC (POINTS-11 checks it).
- **Next:** a fresh verifier re-runs the stack check (a dub through the stand-in with a restart in the middle) and, when the owner's key is on a test Hub, one real short dub.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `docs/elevenlabs/API-FACTS.md` (the provider's routes, limits and what the free read calls showed: every provider fact in this task comes from it or from a real response)
- `DECISIONS.md`: R-78, R-43, R-61, R-65, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/AITOOLS-01.md` (the job and points flow this task reuses) and `tasks/POINTS-03.md` (hold, commit, release, caps)
- Backend `src/ai-tools/` (`ai-job.service.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `tests/ai-tools.contract.spec.ts`) and `scripts/dev/voice-standin.cjs`
- `design/Points Flow.dc.html` board PT1 (tile "Dubbing, From 1,500 a minute"); PT2a ("You can leave this screen") to PT2c
- `docs/elevenlabs/API-FACTS.md` section "Dubbing" and "Uploads the Hub must take"
- `tasks/AITOOLS-04.md` (file intake and the length reading, which this task reuses)

## Goal

A person picks a recording and a language and gets it back dubbed into that language, for 1,500 points a minute (the board's "From" figure, PROVISIONAL), kept only on success. The tool is slow, so the job stays `working` and the person can leave and come back.

## Scope

- **Calls.** Seam methods `startDub` (provider `POST /v1/dubbing/project` with the file, `source_language` when given, `target_language`) and `readDub` (provider `GET /v1/dubbing/project/{project_id}/language/{language_id}`), plus `removeDub` (delete the project once stored). Route `POST /ai-tools/dubbing/jobs` (`fileKey`, `targetLanguage`, optional `sourceLanguage`, `quoteToken`, `Idempotency-Key`). One language per job (the unit is a minute for each language, so a second language is a second job until a board draws more).
- **Price.** Plan action `dub_standard_per_min_lang` (1,500) times the file's minutes (the Hub's own reading, as AITOOLS-04) times 1 language. The premium action (`dub_premium_per_min_lang`, 6,500) is NOT built: the design draws no choice and the provider pages do not say what premium means (G-AITOOLS-05-2).
- **Following the job.** The provider's project and language ids are kept on the job (`providerRef`, from AITOOLS-02's migration). A repeating job advances every `working` dub by reading the language target (queued, processing, completed, failed), holding no transaction, connection or lock across the read; it survives a Hub restart (a read of the job also repairs it, as AITOOLS-01's `reconcile`). Polling, not the provider's webhook: a webhook needs a public URL and a provider-side setup, and polling needs only the key. The stale-hold limit for a dub is its own setting, not the VoiceOver one.
- **Result.** On `completed` the Hub fetches the signed outputs once (they last an hour), stores the dubbed audio and the WebVTT subtitles as the person's files, COMMITS the hold, marks the job done, and deletes the provider's project. `outputs` holds the audio and the subtitles. The provider answers a lossless FLAC: the Hub must serve `audio/flac` (an additive change to the storage types) and the app must play it (checked in POINTS-11), or the builder reports that it cannot and the job fails and releases. There is NO dubbed video: a person who uploads a video gets the dubbed audio (G-AITOOLS-05-1).
- **Failure.** A failed project or language, a project stuck past the stale limit, or a failed store RELEASES the hold. The provider's first-language charge at project creation is the provider's, never the person's.
- **Languages.** `input.languages` in the catalogue entry comes from a setting holding the provider's supported list (the builder reads https://elevenlabs.io/docs/help-center/product/dubbing/which-languages-are-supported-in-dubbing, records the date and the list). A language outside it is refused with nothing held.
- **The stand-in** gets the three dubbing routes with a configurable delay, a `failed` marker, a `stale` marker and FLAC and WebVTT outputs.

## Provisional figures (R-65: the owner confirms, an admin changes them any time)

- `points.action.dub_standard_per_min_lang` 1,500: the PT1 tile's "From" figure (exists; PROVISIONAL `DV2-BOARD-FIGURE`).
- `ai.dubbing_languages`: the supported list, PROVISIONAL (`AITOOLS-DUB-LANGUAGES`), the owner may shorten it.
- `ai.dubbing_max_run_minutes`: how long a dub may stay working before the hold is given back. The provider states no time, so the builder measures one real run, or leaves the setting PROVISIONAL at the lead's pick and reports it NOT RUN.
- Owner questions for the report: what premium dubbing is and whether to offer it (the 6,500 figure is in the plan file only); and that a dub of a video returns audio and subtitles, not a video.

## Capability checks

- [x] `GET /ai-tools` lists Dubbing at "from 1,500 points a minute" and its languages before anyone runs it (only when the provider is configured).
- [x] A person starts a dub: points are held, the job answers `working` at once, and the finished audio and subtitles are readable on the job after the stand-in completes it.
- [x] A failed dub, a dub the provider never finishes, and a failed store each release everything; a Hub restart mid-dub still ends the job (done or failed) and settles the hold once (V8).
- [x] The same `Idempotency-Key` twice starts one provider project and holds once; two dubs at once never take points below zero.
- [x] A language outside the list, a length over the minute cap and another person's `fileKey` are refused with nothing held.
- [x] The uploaded file and the provider's project are deleted when the job ends.
- [x] Every earlier tool still passes its specs untouched.

## Verifier report

Backend `wmt/AITOOLS-05` `4aeff65` against `origin/main` `c3a2c7a`, 24 Oct 2026, a Sonnet verifier (built none of it). Local stack on the voice stand-in (a pass-through in front of it swapped the signed links), own database, the Hub killed and restarted by the verifier. Verdict: **FIX** (0 high, 1 medium, 4 low).

| Check | Result | Evidence |
|---|---|---|
| tsc (3072 MB) | passed | `EXIT 0` |
| eslint, no --fix, 30 changed .ts | passed | `EXIT 0` |
| 50 suites, 694 tests in band (all of src/ai-tools/tests, src/storage/tests, src/account-purge/tests, src/voice-intro/tests, 4 of the 6 plan-settings specs, points-spend-rules; not the three Fintava-double specs) | passed | `EXIT 0` |
| `publishing-gate-coverage.spec.ts` | **FAILED** | `EXIT 1`, 1 test fails (Finding 1; the other 41 of 42 tests across it and the rate-limits spec passed) |
| `hub-rate-limits.contract.spec.ts` | passed | `EXIT 0`, 24 tests |
| `test:protected` (db:seed first) | passed | 253/253 `EXIT 0` |
| contract:build | passed | `EXIT 0`, `git status` clean (no diff) |
| gates | passed | 9 gates, 1797 files, 0 fail, 134 warn, 88 accepted, `EXIT 0` |
| check_baseline | passed | `EXIT 0`, 124 entries |

**1. Points (all passed).** Quote then job: a 40 s file quotes 1 minute = 1,500, a 90 s file 2 minutes = 3,000. The job answers `working` at once with the hold `held`. Success commits (done, audio FLAC served with `fLaC`, WebVTT text, input file deleted, project deleted). Released with the points back and the job `failed`: provider failed (`dub-failed`), stale, start answers 500 and 422, no language id, no audio link, audio link answers 500 (3 tries, 41 s), not a FLAC (37 s), a store that is down (`store_failed`, storage process killed mid-dub). Bad subtitles or none: done with audio only, committed. The sweep: with `points.job_max_run_minutes` at 1, a dub with `[[dub-delay:200000]]` stayed `held` for 215 s and committed (not released early); a `[[dub-stuck]]` dub stayed `held` past the 1 minute mark, and was released at 307 s with `timed_out` when `ai.dubbing_max_run_minutes` was 5. Restart: the Hub killed 25 s into a dub and back 13 s later, the dub finished (done, committed once). Same Idempotency-Key twice: 202 then 200 replay, one provider project, one hold. Three jobs of 1,500 at once on 3,000: 202, 202, 503 busy, balance 0, never below. A language off the list or the same as the source: 422 `ai_language_unsupported`, nothing held.

**2. Hostile input and memory (passed).** Crafted ASF (as WAV and MP4) and an MP4 with a size-0 `stsd` entry: 422 "We couldn't read that file" in 53 to 659 ms, nothing held, `/health` max 307 ms. 8 jobs at once from one account on a 100 MB file: 2 served, 6 refused busy in 0.13 to 0.53 s, 2 holds, RSS 290 to 427 MB, `/health` max 131 ms. 20 accounts x 100 MB hostile MP4 at once: 4 read (422), 16 refused busy (0.28 to 0.7 s), RSS 327 to 523 MB, `/health` max 112 ms (457 probes, 0 over 500 ms). The Dubbing routes add no read of their own: they use the AITOOLS-04 `input.open` and `openForRun`.

**3. Signed output links.** Refused before any fetch (no attempt in the Hub log, nothing stored, hold released): `http://` to another port, `http://169.254.169.254`, `https://127.0.0.1`, `https://[::1]`, decimal IP `https://2130706433`, `https://user:pw@host`, `file:///etc/passwd`. A 302 from an https host is not followed (the "secret" listener was never hit). A `Content-Length` of 5 GB is refused, an endless chunked body is cut at the cap, an HTML body fails (not FLAC): each job fails `output_fetch_failed`, hold released. No fetch carried the provider key (stand-in `dubKeyLeaks` 0, the https listeners saw no key or authorization header). Gap: Finding 2.

**4. Provider copy (passed, one gap).** The project is deleted when the job ends: counting the stand-in's projects `dub-1` to `dub-20`, only `dub-16` was left (Finding 3), and the failed-store project `dub-38` answered 404 afterwards. Later runs were not counted again. With the two settings at 1 and 1 minute, a stand-in that hides the project after a delete and shows it again: the first 404 was taken back when the copy showed again (200), the delete went through, and the note cleared only after two clean 404 reads. With nothing hiding it, notes cleared on their own. Account deletion mid-dub (G-AITOOLS-05-4): Finding 4, rated low.

**5. Changed assertions (honest, none hides a defect).** Tool count 6 to 7 (`ai-tools.contract.spec.ts:130`), id lists in `ai-tools-pipeline.contract.spec.ts` (two, now name `dubbing`), the unbuilt action `dub_standard_per_min_lang` swapped for `dub_premium_per_min_lang` (really unbuilt), the `/dub|receptionist/` check narrowed to `/receptionist/` (Dubbing is built; the Receptionist is still checked), the folder list gains `ai/dubbing`, and the harness maps `audio/flac` to `flac`. Each carries a comment and each still fails on a real regression.

### Findings

1. **MEDIUM (CI fails): the publishing-gate coverage spec does not list the two Dubbing routes.** `src/plans/tests/publishing-gate-coverage.spec.ts` (`NOT_GATED`, next to the Captions and Clean audio entries at about lines 163 to 177) has no `POST ai-tools/dubbing/quote` and `POST ai-tools/dubbing/jobs`, so `expect(ungated).toEqual([])` at line 543 fails with exactly those two. Repro: `npm run test:contract -- src/plans/tests/publishing-gate-coverage.spec.ts` (`EXIT 1`). Fix: two entries with `files: ['fileKey']` and a reason, as AITOOLS-04 did (`d57780e`).
2. **LOW: the link guard blocks IP literals and `localhost` but not names that reach this machine.** `src/ai-tools/voice/http-voice-provider.ts` `download()` (`named`): `https://localhost.:8044/...` and `https://foo.localhost:8044/...` pass the check (the fetch was attempted; it did not connect on this box), and `https://int.v05.test:8044/audio.flac` (a name the verifier's resolver sent to 127.0.0.1) was fetched, stored and committed. Reach: only a provider answer naming such a link, https only, blind GET with no key and no redirect, and the body must start `fLaC`. Fix: refuse a trailing dot, `.localhost`, `.local`, `.internal`, or resolve the name and refuse private and loopback addresses (or keep a list of allowed link hosts as a setting).
3. **LOW (G-AITOOLS-05-4 part 1, agree with the builder): a Hub restart while the file is still going up to the provider.** Repro: `[[slow:30000]]` file, kill the Hub at 6 s, restart: the job stays `working` with no project id for the dub's whole longest run (`ai.dubbing_max_run_minutes`, 60 in production), then `timed_out`, points back. The project the in-flight call made (`dub-16`) was never deleted. Every Hub deploy during an upload can do this.
4. **LOW (G-AITOOLS-05-4 part 2, rated low, agree): account deletion while a dub works.** `src/account-purge/account-data-map.ts:495` removes `AiToolJob` rows (OWNED) and the deletion sweep (`account-deletion-sweep.service.ts`, step 3) releases AI-job holds first, so the follower never sees the job again and the project, which holds the person's recording, stays at the provider. The window is the dub's run (60 minutes at most) at the instant a due purge runs, after a 30 day grace. Read from code, not run live. Fix: in step 3, delete the project named by each working `dubrun:` row before the rows go.
5. **LOW (test-gap note, not a defect): fixed ports in two specs** (`R4_SINK_PORT` 7921, `R4_STORE_PORT` 7922, carried from AITOOLS-04 round 4 low (a)). The verifier set them to 8046 and 8047 for the run.

Not run: a real provider call (no key), `plans.contract`, `plan-settings-readers`, `plan-settings-round2`, `points-spend.contract` (they reach the Fintava double; CI runs them). Rig: a pass-through in front of the stand-in swapped the links; a copy of `block-net.cjs` and a DNS shim lived in the verifier's scratch folder only; the repo files are untouched.

## History

None yet. Reports go to tasks/history/AITOOLS-05.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
