---
id: AITOOLS-13
title: Audiobook and Podcast maker (backend)
owner: YOU
area: POINTS
order: -44
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-08, AITOOLS-11]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-13 · Audiobook and Podcast maker (backend)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-3. Order -44 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-3 (T2, backend), tasks AITOOLS-13, AITOOLS-06 in that order, one builder, branch `wmt/AITOOLS-13`, budget 170 steps (push at the budget and hand back what remains; the lead may split the Receptionist off); one T2 verifier, 110 steps.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Before:** the audit (30 Oct) put "Audiobooks and podcasts" under the provider's Studio API, which only allowlisted accounts can use; no tool exists.
- **Cut decision (Default (lead), owner may override):** the Audiobook runs on the speech route the Hub already proved on the real key (chapter by chapter), so it does not wait on the allowlist; the Podcast maker uses the Studio API and stays unlisted until the owner's allowlist request is answered and its proof call has passed.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

A person turns a long text into an audiobook, or a text or a web page into a podcast with one or two voices, and it ends as a long audio they can move into Create as a piece.

## What a person does

- Audiobook: pastes or picks a text file, chooses a voice, sees the number of chapters, the length and the cost, runs it, and is told when it is ready; the result is one audio file.
- Podcast maker: gives a text or a web link, chooses one host or two, a length (short, standard, long) and a language, sees the cost, runs it and plays the podcast.

## Scope

- Tool `audiobook` (`input.kind: text`, long, unit `minute` priced on characters at `ai.audiobook_chars_per_minute`, default 900; limit `ai.audiobook_max_chars`, default 100,000, about 110 minutes, PROVISIONAL). Seam `speakChapters`: the Hub splits the text at a heading line or at a size under the model's per-request limit (10,000 characters), calls the speech route per chunk with `previous_text` and `next_text` for continuity, joins the mp3 pieces into one file (mp3 frames of one format join; the builder checks the join plays and its length reads correctly with the Hub's own reader), and stores it under `ai/audiobook`. The job keeps its place (the chunk index in `providerRef`/job state) so a restart resumes and never pays or holds twice; the hold is for the whole text, up front.
- Model by setting `ai.audiobook_model` (default the same model VoiceOver runs on, so price parity holds). The file is at most 512 MB (a piece's cap) and the setting keeps it far below.
- Tool `podcast` (`input.kind: podcast`: a `text` or a `url`, `mode` conversation with two Hub voices or bulletin with one, `duration` short | standard | long mapped to the provider's `duration_scale`, `language` two letters from `ai.podcast_languages`). Seam `startPodcast` and `readPodcast`: `POST /v1/studio/podcasts`, then read `GET /v1/studio/projects/{project_id}` until it can be downloaded, list `.../snapshots`, fetch the audio (`POST .../snapshots/{id}/stream`), store it under `ai/podcast`, then `DELETE /v1/studio/projects/{project_id}` so the provider keeps nothing. Follower pattern, ceiling setting `ai.podcast_max_run_seconds` (default 900). A link is only `https`, at most 2,000 characters; the Hub never fetches it (the provider does).
- Listing: both tools behind `ai.listed.audiobook` and `ai.listed.podcast`; the podcast is also unlisted unless a new setting `ai.podcast_studio_api_ok` is on, which the lead turns on only after the proof call passed. A 403 or an allowlist refusal from the provider gives every point back, switches the tool off for the run and logs an owner item.
- A finished long job writes `ai_job_ready` (AITOOLS-08). The result is audio: `pieceFormat: audio`; an audiobook is one piece, as the owner ruled (R-109 point 4).
- Caps: the existing `points.daily_points_per_user` (5,000), `max_chars_per_job` (5,000) and `max_audio_min_per_job` (10) were set for short tools. The new tools carry their own per-job caps (above) and report plainly when the daily cap stops them (PT7). Whether long-form gets its own daily cap is an owner question (an hour of audiobook at 250 a minute is 15,000 points).
- The stand-in (`scripts/dev/voice-standin.cjs`) gets each route above with its `[[fail]]`, `[[reject]]`, `[[slow:n]]` and `[[moderated]]`-style markers read from the input, so every state is tested with no real call.
- Account deletion removes everything of the person's this task keeps: files in the task's folders, rows, and any provider copy (the account-purge, account-data-map and data-export-map specs list them).

## Hub routes

- `POST /ai-tools/audiobook/jobs` (`text`, `voiceId`, `quoteToken`, `Idempotency-Key`); `POST /ai-tools/podcast/jobs` (`source`, `mode`, `voiceIds`, `duration`, `language`, `quoteToken`, `Idempotency-Key`).

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- Audiobook: `POST /v1/text-to-speech/{voice_id}` per chunk (existing). Podcast: `POST /v1/studio/podcasts`, `GET /v1/studio/projects/{project_id}`, `GET .../snapshots`, `POST .../snapshots/{id}/stream`, `DELETE /v1/studio/projects/{project_id}`. Facts: API-FACTS, "Audiobook" and "Podcast maker".

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Settings `points.action.audiobook_per_min`, `points.action.podcast_short`, `points.action.podcast_standard`, `points.action.podcast_long`: **points cost: PROVISIONAL, owner sets.**
- Audiobook: spoken audio is billed by character on the same speech route as VoiceOver. 900 characters a minute at 1 credit a character is 900 credits a minute; times the by-character ratio 0.278 gives **250 a minute** (a 10 minute chapter 2,500; an hour 15,000). The credit-per-character factor for the chosen model is NOT in the files.
- Podcast: its audio is also character-billed speech; the provider's own lengths are under 3, about 3 to 7 and over 7 minutes. At 250 a minute: short **750** (3 minutes), standard **1,250** (5), long **2,500** (10). The provider's language-model cost is covered today and unpriced later: NOT KNOWN, so these figures cover the audio only and the proof call and the first real bill are read against them.

## Capability checks

- [ ] A person runs an Audiobook of 40,000 characters on the stand-in: the Hub holds for all of it up front, splits at headings and under the size limit, joins the pieces into one mp3 whose length the Hub reads, stores it, commits; a stand-in failure on chunk 3 gives every point back and removes the partial file; a restart on chunk 2 resumes and holds and charges once (V8).
- [ ] A text over `ai.audiobook_max_chars` and an empty text refuse with the reason and nothing held; a person over the daily cap is told the reset time (PT7) and nothing is held.
- [ ] A person runs a Podcast with a text and with a link in each mode on the stand-in: project created, polled, audio stored, project deleted (the stand-in's state shows the delete); a non-`https` link, a link over 2,000 characters, two voices that are the same and an unknown language each refuse (V2).
- [ ] The provider's allowlist refusal (stand-in marker) gives every point back, logs an owner item and the podcast stays unlisted; `ai.podcast_studio_api_ok` off hides it even with `ai.listed.podcast` on.
- [ ] Each finished result answers `pieceFormat: audio` and `piece` returns a key `POST /content` accepts for format `audio`; a file over the piece cap is refused.
- [ ] Two jobs at once never take points below zero; the same `Idempotency-Key` twice runs one job; a late finish after the stale sweep cannot commit twice. Earlier tools still pass untouched.

## Proof call (the one real provider call, only when the lead names it)

When the lead names it, two separate calls: (1) Audiobook: ONE speech call of about 100 characters (the chapter size of the proof), on the cheapest model that works (`eleven_flash_v2_5`), mp3; log credits and the join of two pieces on the stand-in only (a join needs no second real call). (2) Podcast (only after the owner says the allowlist is requested): `mode bulletin` with one host, `duration_scale short`, `source.text` of about 200 characters, `quality_preset standard`; log credits before and after, whether the account is allowlisted (a refusal is the answer), the seconds taken, the output type and size, and that the project was deleted. Expected credits: audiobook about 100 if the model bills 1 a character (NOT KNOWN); podcast NOT KNOWN.

## Gaps and defaults

- Default (lead), owner may override: the Audiobook takes typed or pasted text and a plain text file; PDF and EPUB are not read (no text extractor on the Hub).
- NOT KNOWN: whether our account is allowlisted for the Studio API; credits per character on the chosen model; the podcast's language-model cost; the chapter and voice limits of the Studio API (not used by the Audiobook).

## History

None yet. Reports go to tasks/history/AITOOLS-13.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
