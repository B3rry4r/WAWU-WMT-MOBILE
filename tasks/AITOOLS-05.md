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

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T2 (third-party, spends points). About 60 minutes of building; if it runs past that, push what is done and hand back what remains.
- **Real prerequisites (not in `depends_on`):** AITOOLS-01 (backend) and POINTS-03 are merged to backend main. They sit at orders 267 and 213, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order (like FIX-nn) and `depends_on` lists only the tasks cut with it. Both are on backend main as of 23 Oct 2026 (`src/ai-tools/`).
- **Pattern:** the one long, asynchronous tool. A file goes in, the provider makes a project and a language target, and the Hub follows it until it completes. Reuses AITOOLS-04's file intake.
- **Provider:** the AI voice provider, through the one seam `AI_VOICE_PROVIDER`. NOT RUN against the real provider until a run with the owner's key on the Hub (its read-only access was checked 23 Oct 2026: `docs/elevenlabs/API-FACTS.md`). Built and tested against `scripts/dev/voice-standin.cjs`.
- **Next:** a builder session (Sonnet) on branch `wmt/AITOOLS-05`; then a verifier.

Status set to review by the records sync, 25 Oct 2026: merged as backend 30f2435, lead acceptance in the lead's merge log, 24 Oct (verifier FIX on one medium, closed and accepted on the lead's diff read; PR #195 Branch checks green).

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

- [ ] `GET /ai-tools` lists Dubbing at "from 1,500 points a minute" and its languages before anyone runs it (only when the provider is configured).
- [ ] A person starts a dub: points are held, the job answers `working` at once, and the finished audio and subtitles are readable on the job after the stand-in completes it.
- [ ] A failed dub, a dub the provider never finishes, and a failed store each release everything; a Hub restart mid-dub still ends the job (done or failed) and settles the hold once (V8).
- [ ] The same `Idempotency-Key` twice starts one provider project and holds once; two dubs at once never take points below zero.
- [ ] A language outside the list, a length over the minute cap and another person's `fileKey` are refused with nothing held.
- [ ] The uploaded file and the provider's project are deleted when the job ends.
- [ ] Every earlier tool still passes its specs untouched.

## History

None yet. Reports go to tasks/history/AITOOLS-05.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
