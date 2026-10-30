---
id: AITOOLS-08
title: Studio media pipeline, the result into Create, and the listing gate (backend)
owner: YOU
area: POINTS
order: -54
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [AITOOLS-02, AITOOLS-07]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-08 · Studio media pipeline, the result into Create, and the listing gate (backend)

## Current state

**Built 30 Oct 2026 (S2-HUB-1, Sonnet builder, T2; backend branch `wmt/S2-HUB-1` (head `5789a0a`) on `origin/main` `b8627925`; status verifying).** Done, whole (the verifier reads the diff):
- **Media pipeline.** `AiToolRunResult.media` (a stream, kind `image | video`, type, declared size) is stored by the new seam `AI_MEDIA_STORE` (`src/ai-tools/media/ai-media-store.ts`): `StorageService.putGeneratedStream` writes the stream to a temporary file and then to the bucket from that file with its exact length (memory flat: 80 MB stored with +29 MB RSS after a forced collection, 60 MB picture and 50 MB clip through the whole job with +25 and +0 MB), recorded as a confirmed `StorageObject` of the person in `ai/image` or `ai/video` (outside the R-7 allowance). Served types: `image/png`, `image/jpeg`, `image/webp`, `video/mp4`; a type outside the list fails the job with `output_type` and every point goes back. The two new folders are in `GENERATED_KEY_FOLDERS`, `AI_AUDIO_FOLDERS` (two specs hold those equal) and the purge table (`FILE_KINDS`, DELETE).
- **Followed generations.** `AiFlowService` (`src/ai-tools/flow/ai-flow.service.ts`) follows the provider's background generations like Dubbing: the generation id (and the ids of the person's assets) on `providerRef` (`genrun:image|video:<id>[:<asset>+<asset>]`), a read every 3 s for a picture and 5 s for a video, restart-safe (the row alone), fetch of the signed link ONCE (https to a name, no key, no redirect, size and type bound), commit, done; a failed generation, a link that will not open after 3 passes, or a run past `ai.image_max_run_seconds` (300) / `ai.video_max_run_seconds` (600) releases.
- **Result shape (additive).** `outputs[]` files gain `contentType`, `bytes`, `name`, `downloadUrl` (attachment link, `studio-image-30-oct-2026.png`) and `pieceFormat` (`audio | video | image | null`; null for a FLAC dub or an AAC clip). The new fields are added when the media store is wired (always in production), so the older specs' exact `outputs` shapes are untouched. `kind` gains `image` and `video`.
- **The person's photo in.** Folder `ai/input-image` (png, jpeg, webp; 25 MB; own constant, `AI_INPUT_FOLDERS` still pins the two older folders), checked from its first bytes (`sniffImage`) before anything is held.
- **Result into Create.** `POST /ai-tools/jobs/{id}/piece` (`AiToolsPieceController`, behind `@GatesPublishing`, `@Throttle` 30 a minute, `Idempotency-Key`): copies the output inside the bucket (`StorageService.copyIntoContent`, the presign's gate and room checks first, a reservation under the person's storage lock) to `content/full/<id>/<uuid>.<ext>` as a confirmed upload counted against storage; answers `{ format, full: { key, fileUrl, contentType, bytes, name }, suggestedTitle }`; the same call again returns the same key until `POST /uploads/release`, then a new copy. `409 no_format` for a type no format takes and for words; `409 job_not_ready`; `404 not_found`. No preview is made; nothing is published.
- **Listing gate.** `ai.listed.image`, `ai.listed.photo-edit`, `ai.listed.video`, `ai.listed.talking-photo` (group Studio, default 0, PROVISIONAL `STUDIO2-LISTED`). `GET /ai-tools` lists a new tool only when built, configured AND the switch is 1; the job routes answer `503 ai_tool_unavailable` with nothing held while it is 0. The new tools sit in `AI_STUDIO2_TOOLS` beside the seven in `AI_TOOLS` (that list still pins the launch set); the catalogue passes a copy of the live app's `readAiTools` rules with every entry whole.
- **Input kinds.** `AiToolInputKind` gains `image`, `video`, `dialogue`, `chat`; `AiToolUnit` gains `second` (plan `per: second`).
- **Long-job notice.** A job that ran longer than `ai.job_ready_notice_seconds` (60) writes ONE `ai_job_ready` notification when it ends (target kind `ai_job`, resolved in `GET /me/notifications` for the owner only; pushed; listed in `NOTIFICATION_CATEGORY`, `PUSH_RULE`, `push-policy.spec`), written by the one write that ended the job so a replay writes nothing. **Default (lead), owner may override:** it applies to every tool as the task says, so a Music track or a Dubbing over 60 s now writes it too; the live app's push and list routes tolerate an unknown kind (`routes.ts`), and `ai.job_ready_notice_seconds` set high silences it.
- **Migration: none.** Everything rides existing columns (`outputs` JSON, `providerRef`, `inputRef`); no CHECK constrains `outputs` or `tool`. Stamp not used.
- **Proof call:** none (this task makes no provider call).
- **Checks (EXIT lines in the hand-back):** tsc EXIT 0; eslint (47 changed files, no --fix needed after the last pass) EXIT 0; 100 backend spec files (the whole ai-tools folder, storage, push, notification, me, plan-settings, plans, points/spend, account-purge, data-export, voice-intro, route-shadowing; none importing the Fintava double) 99 suites passed, 1,470 tests, the one red suite (data-export.contract.spec.ts) fails the same 16 tests on origin/main b8627925; new specs ai-media-pipeline 32, ai-media-provider 13, ai-media-storage 11, ai-input-image-folder 3 all passed; test:protected EXIT 0 (253 tests); gates EXIT 0; check_baseline EXIT 0; contract:build EXIT 0 (contract/openapi.json regenerated); src/tests/hub-rate-limits.contract.spec.ts imports Fintava code so it was NOT run here (its expected @Throttle list gained one row, CI runs it).

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-1. Order -54 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-1 (T2, backend), tasks AITOOLS-08, AITOOLS-09, AITOOLS-10 in that order, one builder, branch `wmt/AITOOLS-08`, budget 210 steps (130 plus 40 for each extra task); one lean-to-full T2 verifier, 90 steps plus 20 per extra task.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Why T2:** it changes the one pipeline every tool's points hold, keep and give back run through (AITOOLS-02), so every earlier tool's specs must pass untouched. Points are money-adjacent; when unsure between two tiers take the higher.
- **Before:** the pipeline stores audio only (`AiToolRunResult.audio`, `AiAudioStore.put`, `AI_AUDIO_CONTENT_TYPES`), a job's `outputs[].kind` is `audio | text | subtitles`, there is no way from a result into a creator listing except `mediaJobId` on a product draft (audio only), and every listed tool is listed as soon as its code and the provider exist.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

Every Studio result can become a piece in the right format with one call, images and videos can be stored and served like audio, and no new tool is listed until its own switch is on. This is the base AITOOLS-09 to -13 and -06 build on.

## What a person does

- A creator finishes any Studio job and taps "Make it a piece": the Hub copies that result into their own content folder as an upload counted like any upload, and the app opens Create on the next step with the format and the file already there (POINTS-13).
- Anyone can download a finished result: the result carries a link that saves with a plain file name.

## Scope

- **Media results.** `AiToolRunResult` gains `media` (kind `image | video | audio`, a stream or buffer, content type). The pipeline stores it under the tool's own folder (`ai/image`, `ai/video`, plus the existing audio folders), streamed to storage so a 100 MB video never sits in memory (the read-gate rule from AITOOLS-04 round 4), and serves it by a short-lived link. Types the Hub serves: `image/png`, `image/jpeg`, `image/webp`, `video/mp4`; a type outside the list fails the job and gives every point back. The new folders join `AI_AUDIO_FOLDERS`-style purge lists.
- **Result shape (additive).** `outputs[]` entries gain `contentType`, `bytes`, `name` (a plain label, never a provider or model name), `downloadUrl` (the same file with an attachment file name such as `studio-image-30-oct-2026.png`) and `pieceFormat` (`audio | video | image | null`: the Create format that takes this type, from `GET /uploads/formats`; `null` for a type no format takes, such as the dub's FLAC and AAC).
- **The person's photo in.** A new private input folder `ai/input-image` (png, jpeg, webp; at most 25 MB, the provider's inline limit; never served to anyone else; deleted when the job ends and with the account), through the existing presign, confirm and `readStored` path as `ai/input-audio`.
- **The result into Create.** `POST /ai-tools/jobs/{id}/piece` (body `{ outputIndex }`, owner only, `Idempotency-Key`): the job must be `done` and the output must have a `pieceFormat`; the Hub copies the stored file into `content/full/<wawuId>/<uuid>.<ext>` as a confirmed `StorageObject` (counted against the person's storage like any upload, R-7), and answers `{ format, full: { key, fileUrl, contentType, bytes, name }, suggestedTitle }`: exactly what Create's draft holds. A person with no room left gets the storage-full answer the presign gives (nothing copied). The same call again returns the same key until the key is released (`POST /uploads/release` gives it back, as for any abandoned upload). No `previewAsset` is made: the preview stays the person's step (Default (lead), owner may override). It never publishes; `POST /content` and its tier and place gates run as today.
- **The listing gate.** Each new tool id has a setting `ai.listed.<tool-id>` (group "Studio", default OFF, PROVISIONAL, one-line reason). `GET /ai-tools` lists a new tool only when its code is built, the provider is configured for it AND its setting is on. The seven existing tools are unchanged. Every entry the Hub writes is whole (`id`, `name`, `costPointsPerUnit` a count, `enabled` a boolean); a spec parses the catalogue with the live app's `readAiTools` rules.
- **Input kinds for the next tasks.** `AiToolInputKind` gains `image` (prompt plus an optional photo), `video`, `dialogue` and `chat` as the later tasks need them; this task adds only the type room and the `GET /ai-tools` shape rules (additive), so each tool task adds its own.
- **A long job tells the person.** A job that ran longer than a setting (default 60 seconds) writes one notification when it ends (a new kind `ai_job_ready`, target the job), through the existing notification writer; a spec lists the kind in the Hub's kind registry and the push rules.
- **Contract and records.** `npm run contract:build`; SHARED-CHANGES rows for `contract/**` and any fenced file touched; BACKEND_GAPS rows; the publishing-gate coverage spec (`POST /ai-tools/jobs/{id}/piece` takes a key and is gated or in NOT_GATED with its reason) and the rate-limit spec (a `@Throttle`).
- Account deletion removes everything of the person's this task keeps: files in the task's folders, rows, and any provider copy (the account-purge, account-data-map and data-export-map specs list them).

## Hub routes

- `POST /ai-tools/jobs/{id}/piece` (new, above). `GET /ai-tools`, `GET /ai-tools/jobs`, `GET /ai-tools/jobs/{id}`: additive fields only (`outputs[].contentType, bytes, name, downloadUrl, pieceFormat`).
- `POST /uploads/presign` gains the folder `ai/input-image` (additive).

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- None. This task makes no provider call and needs no proof call.

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- No new price. Every earlier tool keeps its points (VoiceOver 250 a minute, Quick voice 125, Captions 15, Clean audio 400, Music track 500, Sound effect 75, Dubbing from 1,500).
- points cost: PROVISIONAL, owner sets (nothing new here). The new settings are `ai.listed.<tool>` switches only.

## Capability checks

- [ ] A signed-in creator finishes a job of each existing audio tool and calls `piece`: an mp3 or wav result answers format `audio` with a key under `content/full/<their id>/`; a FLAC dub or an AAC result answers no `pieceFormat` and the route refuses (409 `no_format`).
- [ ] The copied key is counted in the person's storage; with the storage full, `piece` is refused with the presign's own answer and nothing is copied; releasing the key gives the space back.
- [ ] Calling `piece` twice on one output returns one key and one `StorageObject`; another person's job id answers not found; a job that is not `done` answers `job_not_ready`.
- [ ] `POST /content` accepts the returned `fullAsset` for the answered format on the live gates (a tier, a free place); nothing is published by `piece` itself (V3, V4).
- [ ] A new tool is absent from `GET /ai-tools` while its `ai.listed.<tool>` is off even with the provider set; with it on it is listed; the catalogue passes the live app's `readAiTools` parse with every entry.
- [ ] A video or image result of 60 MB is stored with the Hub's memory flat (the AITOOLS-04 style spec), and a type the Hub does not serve fails the job and gives every point back (V8).
- [ ] A job that ran longer than the setting writes exactly one `ai_job_ready` notification, none for a short job, none twice (a replay).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their specs untouched (named files, none importing the Fintava double); `test:protected`, `contract:build`, the two route inventories and the data-map specs pass.

## Proof call (the one real provider call, only when the lead names it)

No provider call. The proof for this task is the stand-in and the specs. Expected credit cost: none.

## Gaps and defaults

- Default (lead), owner may override: the preview of a piece made from a Studio result is the person's own step in Create as drawn; the Hub makes none.
- Default (lead), owner may override: a piece made from a result is one file (one output); a task whose result has several files (stems) lets the person choose which.

## History

None yet. Reports go to tasks/history/AITOOLS-08.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
