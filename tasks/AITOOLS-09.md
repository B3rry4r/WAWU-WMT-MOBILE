---
id: AITOOLS-09
title: Make an image and Edit a photo (backend)
owner: YOU
area: POINTS
order: -52
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [AITOOLS-08]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-09 · Make an image and Edit a photo (backend)

## Current state

**Built 30 Oct 2026 (S2-HUB-1, Sonnet builder, T2; backend branch `wmt/S2-HUB-1` (head `5789a0a`) on `origin/main` `b8627925`; status verifying).** Done on the stand-in only (no real provider call, the owner's credits are not bought yet):
- Tools `image` ("Make an image") and `photo-edit` ("Edit a photo"), one file each (`tools/image.tool.ts`, `tools/photo-edit.tool.ts`), `input.kind: image`, unit `use`, flat price per picture: `points.action.image_per_use` and `points.action.photo_edit_per_use`, both 100 as the labelled placeholder (**PROVISIONAL `STUDIO2-PLACEHOLDER`, points cost: owner sets**, not derived from anything). The catalogue carries `input.options` (`shapes` 1:1, 4:5, 9:16, 16:9; `photo` required for an edit) and `input.maxCharacters` from `ai.image_max_prompt_chars` (1,000, PROVISIONAL `STUDIO2-LIMITS`: the longest prompt per model is NOT KNOWN).
- Routes: `POST /ai-tools/image/jobs`, `POST /ai-tools/photo-edit/jobs` (202 working, 200 replay), the quote is the existing `POST /points/quote` with the tool's action. Seam methods `startImage`, `readImage`, `uploadAsset`, `removeAsset`, `openGeneration` on `AiVoiceProvider` (one seam, `HttpVoiceProvider`). Model, size and resolution are settings, never shown: `ai.image_model` (`gemini-3.1-flash-image`), `ai.image_resolution` (`1K`).
- Edit: the photo is uploaded as a provider asset for the one run and deleted when the job ends, however it ends; a delete the provider refuses stays noted on the row (`asset:<ids>`) and the copy sweep retries it; account deletion waits until none is left. A photo the Hub cannot open as a picture is refused before anything is held.
- Failures: `moderated` is "That picture can't be made. No points were taken."; every other failure is "That didn't work. No points were taken. Try again."; every failure RELEASES; `invalid_parameters` is logged as the Hub's own bug.
- Stand-in: `POST /v1/assets`, `DELETE /v1/assets/<id>`, `POST /v1/flows/image|video`, `GET /v1/flows/image|video/<id>`, the file link, with `[[fail]]`, `[[reject]]`, `[[moderated]]`, `[[slow:n]]`, `[[stuck]]`, `[[invalid]]`, `[[type:..]]`, `[[bytes:n]]`, `[[outfail]]`, `[[asset-fail]]`, `[[asset-delete-fail]]` markers read from the input.
- Specs: `src/ai-tools/tests/ai-media-pipeline.contract.spec.ts` (32 tests: hold and keep, every failure gives back, idempotency, two at once, restart, late finish after the sweep, 60 MB flat, refusals hold nothing, assets deleted), `ai-media-provider.spec.ts` (13), `src/storage/tests/ai-media-storage.contract.spec.ts` (11).

**Proof call (the one real provider call per tool): NOT RUN, waiting for credits.** The smallest request, when the lead names it: ONE `POST /v1/flows/image` with `model_id gemini-3.1-flash-image`, `prompt "a red circle on white"`, `aspect_ratio 1:1`, `resolution 512`, no `images`, one read of `GET /v1/flows/image/{id}` until `completed`, one fetch of `content_url`. Log: credits before and after (needs the key's `user_read` permission or the owner's dashboard number), `content_mime_type`, byte size, seconds taken, whether Flows is enabled for the key. Expected credits: NOT KNOWN. (Run it by setting `ai.image_resolution` to `512` for that one call; the Hub's default is `1K`.) Edit a photo, only if named separately: one 512 px photo of about 100 KB, "make it black and white"; delete the asset afterwards.

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-1. Order -52 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-1 (T2, backend), tasks AITOOLS-08, AITOOLS-09, AITOOLS-10 in that order, one builder, branch `wmt/AITOOLS-08`, budget 210 steps (130 plus 40 for each extra task); one lean-to-full T2 verifier, 90 steps plus 20 per extra task.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** the provider's image routes are in the boss's file and the public file, 11 models, and no note, ruling or task mentioned them (the audit, 30 Oct). Studio has no image tool.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

A person describes a picture and gets it (Make an image), or sends their own photo with a change in words and gets the edited picture back (Edit a photo), paid in points, kept only on success.

## What a person does

- Make an image: types what they want, picks a shape (square, portrait, wide), sees the cost, runs it and sees the picture.
- Edit a photo: picks a photo from their library or camera, types the change ("make the background a market at dusk"), sees the cost, runs it and sees the edited photo.

## Scope

- Two tools in the registry, one file each: `image` ("Make an image", `input.kind: image`, no photo) and `photo-edit` ("Edit a photo", `input.kind: image`, photo required). Unit `use`; the price is flat per picture. Catalogue entries carry the options the app draws: `input.options.shapes` (1:1, 4:5, 9:16, 16:9, the subset the default model takes) and the prompt limit (setting `ai.image_max_prompt_chars`).
- Seam methods `startImage` (the POST) and `readImage` (the GET) on `AiVoiceProvider`; the tool uses the pipeline's follow pattern (as Dubbing): the provider's generation id is the job's `providerRef`, a follower polls every 3 seconds up to a ceiling setting (`ai.image_max_run_seconds`, default 300), survives a restart, and on `completed` fetches `content_url` once, stores the file and COMMITS.
- Model: setting `ai.image_model`, default `gemini-3.1-flash-image` (no approval, up to 14 reference images, 512 to 4K). Resolution setting `ai.image_resolution`, default `1K`. The model maker's name is never in a response or a string (R-68).
- Edit: the person's photo comes from `ai/input-image` (AITOOLS-08); the Hub uploads it as a provider asset (`POST /v1/assets`), sends `images: [{type:'asset', asset_id}]`, and deletes the asset when the job ends (`DELETE /v1/assets/{asset_id}`), so the provider keeps no copy. A photo the Hub cannot open as a picture is refused before anything is held.
- Failures: `moderated` becomes "That picture can't be made. No points were taken."; `timeout`, `model_error`, `dependency_failed`, `internal_error` and `charging_failed` become "That didn't work. No points were taken. Try again."; `invalid_parameters` is a Hub bug and is logged. Every failure RELEASES. A `completed` answer whose type the Hub does not serve fails and releases. No em-dash in any string.
- The stand-in (`scripts/dev/voice-standin.cjs`) gets each route above with its `[[fail]]`, `[[reject]]`, `[[slow:n]]` and `[[moderated]]`-style markers read from the input, so every state is tested with no real call.
- Account deletion removes everything of the person's this task keeps: files in the task's folders, rows, and any provider copy (the account-purge, account-data-map and data-export-map specs list them).

## Hub routes

- The quote is the existing `POST /points/quote` with the tool's action. `POST /ai-tools/image/jobs` (`prompt`, `shape`, `quoteToken`, `Idempotency-Key`) and `POST /ai-tools/photo-edit/jobs` (`prompt`, `shape` optional, `photoKey`, `quoteToken`, `Idempotency-Key`); 202 working, 200 replay; the job is read with the existing `GET /ai-tools/jobs/{id}`.
- `GET /ai-tools` lists both tools (only with `ai.listed.image` and `ai.listed.photo-edit` on, AITOOLS-08).

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- `POST /v1/flows/image` (`model_id`, `prompt`, `aspect_ratio`, `resolution`, `images` for an edit), then `GET /v1/flows/image/{generation_id}` until `completed` or `failed`, then one fetch of `content_url`. Asset upload and delete for an edit. Facts: API-FACTS, "Make an image, Edit a photo".

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Settings `points.action.image_per_use` and `points.action.photo_edit_per_use`, both PROVISIONAL: **points cost: PROVISIONAL, owner sets.**
- Provider cost per image: NOT KNOWN (no price field anywhere in the files; the key cannot read credits). So no figure can be derived from the ratio yet. Placeholder so the setting exists and the tests have a number: 100 points for each, labelled `STUDIO2-PLACEHOLDER`, not derived from anything.
- How the proof call measures it: credits before and after the one 512 px call (API-FACTS, "Credits are limited"); price then is credits times the ratio of the nearest basis (the by-character ratio 0.278 or the by-minute ratio 0.400, per the owner's choice of basis for pictures) and the owner reviews it.

## Capability checks

- [ ] A signed-in person with enough points runs Make an image: points are held at once, the stand-in's picture is stored and served, the job is `done` with an `image` output, the points are kept; a stand-in `[[fail]]`, `[[moderated]]` or `[[slow]]` run gives every point back with the Hub's own sentence.
- [ ] A person uploads a photo to `ai/input-image` and runs Edit a photo: the stand-in records the asset upload, the request with the asset id, and the asset delete after the job ends either way (its state shows the delete call).
- [ ] A file that is not a picture, a type outside png, jpeg, webp, a photo over 25 MB, another person's `photoKey`, an empty prompt and an over-long prompt are each refused with the reason and nothing held (V2, with one wrong-format input).
- [ ] The same `Idempotency-Key` twice runs one job and holds once; two jobs at once never take points below zero; a late finish after the stale-hold sweep cannot commit twice; a restart mid-run resumes the follower (V8).
- [ ] A finished picture answers `pieceFormat: image` and `piece` (AITOOLS-08) returns a `content/full` key `POST /content` accepts for format `image`.
- [ ] The tools are absent from `GET /ai-tools` until their `ai.listed` switches are on, and listed whole when on.
- [ ] No provider or model name, no provider id and no em-dash in any response string; every earlier tool still passes its specs untouched.

## Proof call (the one real provider call, only when the lead names it)

When the lead names it: ONE `POST /v1/flows/image` with `model_id gemini-3.1-flash-image`, `prompt "a red circle on white"`, `aspect_ratio 1:1`, `resolution 512`, no reference images, one read until `completed`, one fetch of the link. Log: the credits used (before and after), the `content_mime_type`, the byte size, the seconds it took, and whether Flows is enabled for the key. Expected credits: NOT KNOWN. A second real call, for Edit a photo (one 512 px photo of about 100 KB, "make it black and white"), only if the lead names it separately. Delete the asset and nothing else is left at the provider.

## Gaps and defaults

- Default (lead), owner may override: one model per tool, picked by a setting, never shown to a person; no mask editing, no style presets, no reference-image gallery in the app's first version.
- NOT KNOWN: credits per image; the longest prompt per model; the size of an output; whether our key may use Flows (the 23 Oct read calls did not test it).

## History

None yet. Reports go to tasks/history/AITOOLS-09.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
