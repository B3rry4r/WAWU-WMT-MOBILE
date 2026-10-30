---
id: AITOOLS-06
title: Receptionist: a talking AI agent with the creator's own knowledge (backend)
owner: YOU
area: POINTS
order: -43
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-02, AITOOLS-08]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# AITOOLS-06 · Receptionist: a talking AI agent with the creator's own knowledge (backend)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle S2-HUB-3. Order -43 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-HUB-3 (T2, backend), tasks AITOOLS-13, AITOOLS-06 in that order, one builder, branch `wmt/AITOOLS-13`, budget 170 steps (push at the budget and hand back what remains; the lead may split the Receptionist off); one T2 verifier, 110 steps.
- **Pushing (R-109 point 7):** this Hub task is built, verified, merged and DEPLOYED as soon as it is done, so the server is ready before the app. Deploying is safe for the live app: it draws only tool ids it has a screen for (`isDrawnTool`, `studioModel.ts`, checked 30 Oct on `origin/main`), and each new tool is also listed only when its own setting `ai.listed.<tool>` is on (default off, AITOOLS-08); the lead turns it on when the app that draws the tool is released. A new entry is always whole (id, name, cost, enabled), because the live `readAiTools` refuses the whole list if one entry is malformed.
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Replaces the 23 Oct cut** (a text-only agent with free-text details, after launch, R-79 (a)). R-109 builds the Receptionist now as the talking agent, with a knowledge base from the creator's own documents, pages and text, text and voice. G-AITOOLS-06-1 (what it is for) is closed by R-109. WhatsApp, phone numbers, phone calls and call lists are NOT built, and nothing names them.
- **Why T2:** a person's words and documents held at a third party, a migration, and voice sessions priced by length after the fact.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- This task changes `wawu-backend`. Start with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md (additive only, protected routes, fenced files).
- Backend `src/ai-tools/` (`ai-job.service.ts`, `tools/ai-tool.ts`, `tools/index.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `audio/ai-audio-store.ts`, `ai-tools.controller.ts`), `src/storage/` (`putGenerated`, presign folders, `upload-formats.ts`), `scripts/dev/voice-standin.cjs`
- Backend registries a new route or table must pass: `src/plans/tests/publishing-gate-coverage.spec.ts`, the hub-rate-limits contract spec, `account-data-map.spec` and `data-export-map.spec` for any table holding a person's id, `account-purge` for any file or provider copy of a person's

## Goal

A creator sets up a Receptionist that knows their business from what they give it, and chats or talks with it in the app. Each text message and each voice minute is paid in points, kept only when the agent answers.

## What a person does

- Sets up the Receptionist (business name, what they offer, how it should reply), adds what it knows (typed text, a web page link, a document), removes anything it should forget.
- Chats with it by text (20 points a message) and, once the app's voice part exists (POINTS-19), talks to it (points a minute).

## Scope

- **The agent.** One provider agent per person, created on first save (`POST /v1/convai/agents/create`) and edited when the person changes anything (`PATCH /v1/convai/agents/{id}`); the Hub writes the prompt from the person's fields plus its own guardrail text (stay on the person's business, say when it does not know, never invent prices). Language by setting (`ai.receptionist_languages`, default English; no Nigerian language code is in the files: NOT KNOWN). The language model by setting `ai.receptionist_llm` (a cheap model from the provider's list; never shown) and the voice from the Hub's voice list. Table `ReceptionistAgent` (`wawuUserId`, `providerAgentId`, business fields, `createdAt`) and `ReceptionistKnowledge` (`id`, `wawuUserId`, `providerDocId`, `kind` text | url | file, `name`, `bytes`, `createdAt`): an additive migration with a rollback that refuses to lose rows and a stamp later than every migration on `origin/main` and every `origin/wmt/*` branch.
- **Knowledge.** `POST /ai-tools/receptionist/knowledge` with `kind text` (words, name), `url` (an `https` link, name) or `file` (a document the person uploaded to a new private input folder `ai/input-doc`, types `text/plain` and `application/pdf` until the provider's accepted types are known: NOT KNOWN), each created at the provider (`/v1/convai/knowledge-base/text|url|file`), recorded, then attached by patching the agent's `agent.prompt.knowledge_base` list. Limits are settings (`ai.receptionist_docs_max` default 10, `ai.receptionist_doc_max_bytes`, `ai.receptionist_text_max_chars`); the provider's own limits are NOT KNOWN. `DELETE /ai-tools/receptionist/knowledge/{id}` deletes the provider document (`force=true`) and the row. The creator's profile and listings are NOT read automatically in this version (Default (lead), owner may override): what it knows is what the person adds.
- **Text chat.** Seam `askAgent`: the Hub opens the agent's conversation (a signed link from `get-signed-url`) with the text-only override so no audio is priced, sends the person's `user_message`, reads the `agent_response`, and answers. `POST /ai-tools/receptionist/messages` (`message`, `quoteToken`, `Idempotency-Key`): plan action `receptionist_message` (20 a message), held, asked, reply stored, COMMIT, any failure RELEASES. Earlier turns are kept by the Hub (a bounded number, `ai.receptionist_history_turns`) and sent again so the reply has context; the builder records how in the report.
- **Voice session.** `POST /ai-tools/receptionist/voice-sessions` (`quoteToken`, `Idempotency-Key`): holds points for the longest allowed session (`ai.receptionist_voice_max_minutes`, default 5) at `receptionist_voice_per_min` (400 a minute, already in the plan config, no tile), mints a signed link with `include_conversation_id=true` through the seam and answers `{ id, signedUrl, conversationId, maxSeconds }`. `POST .../voice-sessions/{id}/end` settles: the Hub reads the conversation (`GET /v1/convai/conversations/{id}`, its length), keeps the real minutes (rounded up, at most the held amount) and gives the rest back; a session the app never ended is settled by the stale-hold sweep at the maximum. The phone's microphone and the agent's voice go straight between the phone and the provider on that signed link (POINTS-19); the Hub never carries audio.
- **Clearing.** `DELETE /ai-tools/receptionist` deletes the agent, every knowledge document at the provider and every row. Account deletion does the same and the account-purge, account-data-map and data-export-map specs list both tables and the input folder. No conversation text is logged by the Hub.
- **Not built and not to be assumed:** WhatsApp, phone numbers (importing or buying), outbound or inbound calls, batch calling and call lists, the small-business receptionist routes, agent tools and MCP servers, answering a person's real inbox, DMs or comments, simulate-conversation (removed by the provider on 31 Oct 2026).
- Catalogue entry `receptionist`, `input.kind: chat`, unit `message`, listed only with the provider configured and `ai.listed.receptionist` on. The stand-in (`scripts/dev/voice-standin.cjs`) gets each route above with its `[[fail]]`, `[[reject]]`, `[[slow:n]]` and `[[moderated]]`-style markers read from the input, so every state is tested with no real call.

## Hub routes

- `PUT /ai-tools/receptionist` (details), `GET /ai-tools/receptionist`, `DELETE /ai-tools/receptionist`; `POST` and `DELETE /ai-tools/receptionist/knowledge`; `POST /ai-tools/receptionist/messages`; `POST /ai-tools/receptionist/voice-sessions` and `.../{id}/end`; all owner only, each new route in the publishing-gate and rate-limit inventories.

## Provider calls (through the one seam `AI_VOICE_PROVIDER`)

- `POST /v1/convai/agents/create`, `PATCH` and `DELETE /v1/convai/agents/{agent_id}`; `POST /v1/convai/knowledge-base/text`, `/url`, `/file`; `DELETE /v1/convai/knowledge-base/{id}`; `GET /v1/convai/conversation/get-signed-url`; `GET /v1/convai/conversations/{id}`; the agent socket for text. Facts: API-FACTS, "Receptionist: the talking agent".

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- Existing settings: `points.action.receptionist_message` 20 a message (the PT1 tile's figure) and `points.action.receptionist_voice_per_min` 400 a minute (in the plan config, not on a tile). **points cost: PROVISIONAL, owner sets.**
- Provider cost per text message and per voice minute: NOT KNOWN (the language model and the voice are priced separately; text-only avoids the audio price; the files give neither). No figure is derived: the 20 and 400 stand as the existing placeholders. The proof call measures one message's credits (before and after); the voice minute's cost is read by the owner from one real conversation of a known length.

## Capability checks

- [ ] A creator saves their details, adds a text, a link and a document, and sends a message: the stand-in's agent holds the three documents in its knowledge list, 20 points are held then kept on the reply and given back on a failure.
- [ ] Removing a document deletes it at the stand-in and from the agent's list; clearing the Receptionist deletes the agent and every document; deleting the account does the same (the stand-in's state shows each delete).
- [ ] Details, text, a document or a link over the limits, a non-`https` link, a file type outside the list and another person's `ai/input-doc` key each refuse with the reason and nothing is created at the provider (V2).
- [ ] The same `Idempotency-Key` twice sends one message and holds once; two messages at once never take points below zero; another person's Receptionist is never readable or usable.
- [ ] A voice session holds the maximum, a signed link comes back, `end` keeps the real minutes the stand-in's conversation reports and gives the rest back; a session never ended is settled at the maximum by the sweep; a second `end` changes nothing (V8).
- [ ] The migration applies on a database with existing rows and rolls back without losing them; the data-map specs list the tables.
- [ ] Nothing in any response, string, route or table names WhatsApp, a phone number or a call list; earlier tools still pass untouched; the tool is absent until `ai.listed.receptionist` is on.

## Proof call (the one real provider call, only when the lead names it)

When the lead names it, one run on the cheapest settings: create one agent (cheap language model, text-only, English), add ONE knowledge text of about 200 characters, attach it, send ONE message that the text answers, read the reply, then delete the document and the agent. Log credits before and after the message, whether the key has the agents write scope and the plan allows agents, the signed link's lifetime if the answer says, and the knowledge-base limits if an error names them. Expected credits: NOT KNOWN. The voice session's real call is made by the owner on a phone with POINTS-19, once.

## Gaps and defaults

- Default (lead), owner may override: knowledge is what the person adds (text, link, document); their profile and listings are not read automatically.
- NOT KNOWN: credits per message and per voice minute; the knowledge base's file types, sizes and counts; the signed link's lifetime; whether the agent speaks any Nigerian language; whether our key and plan allow agents. Provider servers are in the US, EU, India and Singapore, none in Africa (owner to know).

## History

None yet. Reports go to tasks/history/AITOOLS-06.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
