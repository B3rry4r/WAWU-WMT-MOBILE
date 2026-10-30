---
id: AITOOLS-11
title: Voice changer, Dialogue and a saved clone of your own voice (backend)
owner: YOU
area: POINTS
order: -48
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-08]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-11 · Voice changer, Dialogue and a saved clone of your own voice (backend)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-2. Order -48 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-2 (T2, backend), tasks AITOOLS-11, AITOOLS-12 in that order, one builder, branch `wmt/AITOOLS-11`, budget 170 steps; one T2 verifier, 110 steps.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** VoiceOver and Quick voice read words aloud; "Your voice" (AITOOLS-07) clones from a short recording for one run only and deletes the clone. None of speech to speech, dialogue or a kept clone exists.
- **Why T2:** a migration (the saved clone), a person's voice as biometric-like data, and third-party spend.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

A person turns a recording into another voice (Voice changer), writes a scene for several voices and hears it (Dialogue), and keeps a clone of their own voice that every voice tool can use (Clone your own voice).

## What a person does

- Voice changer: picks or records a clip, picks a voice (a Hub voice, or their saved voice), sees the cost for its length, runs it and hears the same words and timing in the new voice.
- Dialogue: writes lines, gives each line a voice (up to 10 different voices), sees the cost, runs it and hears the scene.
- Clone your own voice: reads the consent line, records or picks a short sample, names the voice, and from then on "Your voice" is a choice in VoiceOver, Quick voice, Dialogue and Voice changer; removes it any time.

## Scope

- Tools `voice-changer` (`input.kind: file`, audio only, unit `minute`, length read by the Hub as Captions), `dialogue` (`input.kind: dialogue`, lines of `{text, voiceId}`, unit `minute` priced on characters at `ai.dialogue_chars_per_minute`, default 900), and `my-voice` (the clone: `input.kind: file`, audio, unit `use`, creates once).
- Voice changer: seam `changeVoice` (`POST /v1/speech-to-speech/{voice_id}` multipart `audio`, `model_id`, `remove_background_noise` off); model by setting `ai.voice_changer_model` (default the provider's; the account's two speech to speech model ids are NOT KNOWN, read once from `GET /v1/models` `can_do_voice_conversion`); synchronous; the input is deleted when the job ends; output mp3 to `ai/voice-changer`.
- Dialogue: seam `makeDialogue` (`POST /v1/text-to-dialogue`, `inputs`, `model_id` default `eleven_v3`, mp3); at most 10 different voices and 2,000 characters in all (setting `ai.dialogue_max_chars`, default 2,000: the provider's own advice); synchronous; output mp3 to `ai/dialogue`. Voices are the Hub's voice list plus the person's saved voice.
- Saved clone: reuse AITOOLS-07's consent line and recording path, but keep the voice: `POST /v1/voices/add` with the recording, the provider voice id is kept in a new additive table `AiClonedVoice` (`wawuUserId`, `providerVoiceId`, `name`, `createdAt`, `removedAt`) with a migration, a stamp later than every migration on `origin/main` and every `origin/wmt/*` branch, and a rollback that refuses to lose rows. One clone per person (setting `ai.clones_per_person`, default 1) and a Hub-wide ceiling (`ai.clones_total_max`, because the plan's voice slots are NOT KNOWN). `DELETE /ai-tools/my-voice` deletes the provider voice (`DELETE /v1/voices/{id}`) and the row; account deletion does the same and the account-purge, data-map and export specs list the table.
- The saved voice joins `voices` in the entries of VoiceOver, Quick voice, Dialogue and Voice changer for its owner only, named "Your voice" (the same row as the Voice Intro voice today when both exist: the saved clone wins). VoiceOver's own behaviour for a person with no clone is unchanged.
- The stand-in (`scripts/dev/voice-standin.cjs`) gets each route above with its `[[fail]]`, `[[reject]]`, `[[slow:n]]` and `[[moderated]]`-style markers read from the input, so every state is tested with no real call.
- Account deletion removes everything of the person's this task keeps: files in the task's folders, rows, and any provider copy (the account-purge, account-data-map and data-export-map specs list them).

## Hub routes

- `POST /ai-tools/voice-changer/quote`, `POST /ai-tools/voice-changer/jobs` (`fileKey`, `voiceId`, `quoteToken`, `Idempotency-Key`); `POST /ai-tools/dialogue/jobs` (`lines`, `quoteToken`, `Idempotency-Key`); `GET /ai-tools/my-voice` (state, name), `POST /ai-tools/my-voice` (`fileKey`, `name`, consent id, `quoteToken`, `Idempotency-Key`), `DELETE /ai-tools/my-voice`.

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- `POST /v1/speech-to-speech/{voice_id}`; `POST /v1/text-to-dialogue`; `POST /v1/voices/add` and `DELETE /v1/voices/{voice_id}`; `GET /v1/models` (one free read). Facts: API-FACTS, the Voice changer, Dialogue and Clone sections.

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Settings `points.action.voice_changer_per_min`, `points.action.dialogue_per_min`, `points.action.voice_clone_once`: **points cost: PROVISIONAL, owner sets.**
- Dialogue: priced like VoiceOver, by character. 900 characters a minute at 1 credit a character (the factor for `eleven_v3` is NOT in the files) is 900 credits; times the by-character ratio 0.278 gives **250 a minute**.
- Voice changer: provider cost per minute NOT KNOWN. If it bills like the isolator (1,000 credits a minute, unverified for this route) the by-minute ratio 0.400 gives **400 a minute**; shown as working, not as a fact.
- Clone: provider cost NOT KNOWN (a clone may cost no credits and only needs a voice slot). Placeholder, not derived (`STUDIO2-PLACEHOLDER`): 100 points once. The proof calls measure the two NOT KNOWNs.

## Capability checks

- [ ] A person runs Voice changer on a recording: the Hub reads the length itself, prices it, holds, sends the recording to the stand-in with the chosen voice, stores the mp3, commits; a failed or refused run gives everything back and deletes the input.
- [ ] A person writes a scene of 3 lines with 2 voices and hears it; 11 different voices, 2,001 characters, an empty line and a voice id that is not on their list each refuse with the reason and nothing held (V2).
- [ ] A person consents, records, names and clones: the row exists, the provider voice exists on the stand-in, and "Your voice" appears in the entries of the four voice tools for them and for no one else; removing it deletes both and the entries lose it; account deletion does the same.
- [ ] The migration applies on a database with existing rows and rolls back without losing them; `prisma migrate diff` after applying is empty.
- [ ] The same `Idempotency-Key` twice runs one job and holds once; two jobs at once never take points below zero; the clone is never made twice by a double tap (V8).
- [ ] A finished voice-changer or dialogue result answers `pieceFormat: audio` and `piece` returns a key `POST /content` accepts for format `audio`.
- [ ] AITOOLS-07's per-run clone and VoiceOver, Quick voice, Captions, Clean audio and Dubbing still pass their specs untouched; the tools are absent until their `ai.listed` switches are on.

## Proof call (the one real provider call, only when the lead names it)

When the lead names it, three separate calls, each the smallest: (1) Dialogue: two lines ("Hi." and "Hello.") with two premade voices, `eleven_v3`, mp3. (2) Voice changer: the shortest clip the route accepts (a 5 second fixture), one premade voice, the default model, no noise removal. (3) Clone: one short sample (about 10 seconds), then `DELETE /v1/voices/{id}` at once. Log credits before and after each, the error text if a sample is too short or too long (that is how the limits are learned), and the voice-slot error if any. Expected credits: Dialogue about 1 credit a character if `eleven_v3` bills like the standard models (NOT KNOWN); the other two NOT KNOWN.

## Gaps and defaults

- Default (lead), owner may override: one saved clone per person; the clone is the person's own voice only (consent line shown and recorded, as AITOOLS-07), never another person's.
- NOT KNOWN: the shortest and longest clone sample; the voice slots the plan holds; the voice-changer input limits; credits for all three tools.

## History

None yet. Reports go to tasks/history/AITOOLS-11.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
