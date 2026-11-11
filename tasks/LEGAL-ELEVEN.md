---
id: LEGAL-ELEVEN
title: The legal assistant's AI turns run on ElevenLabs' agent platform, typed only, with no app change
owner: YOU
area: LEGAL
order: 390
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-137]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# LEGAL-ELEVEN · The legal assistant's AI turns run on ElevenLabs' agent platform, typed only, with no app change

## Current state

As of 11 Nov 2026.
- **Status:** building (verifier round 1: FIX). Hub `wmt/LEGAL-ELEVEN` head 37dd5f3a.
- **Open findings:** F-1 medium (the legal agent is made again on every restart while `legal.ai_agent_id` is empty; fix it by finding the agent by name at the provider or saving the id in the Hub, with a spec across two boots), F-2/F-3/F-4 low (see the report below). Everything else passed; NOT RUN against the real provider.
- **Next:** builder round 2 for F-1 (and F-2 if cheap), then a short re-verify.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-137, and the legal rulings the legal-intake code cites
- wawu-backend: `src/legal-intake/**` (every Gemini call, the prompt files, `ai-text.ts`, what is sent and what is trusted), `src/common/ai/gemini-client.interface.ts` and `real-gemini.adapter.ts` (read only: fenced), `src/ai-tools/voice/http-voice-provider.ts` (the agent client and text chat), `src/ai-tools/receptionist/` (how an agent is made, its model setting, REC-PRIVACY and REC-DELETE)
- The provider's docs: the repo's `docs/elevenlabs/` first, then ElevenLabs' public docs for the agent platform (text-only conversations, prompt overrides, the models it offers, privacy and conversation retention). Facts from docs and real behaviour only.

## Goal

A person using the legal assistant gets the same answers, words and brief as today, and every AI turn behind it goes through ElevenLabs.

## Scope

- **Where the change lives:** inside `src/legal-intake/` (and the plan-settings registry for a setting). Bind a legal-only adapter that does what the legal services ask of `GeminiClient` today (the profiling chat turn and the brief) through the ElevenLabs agent platform, text only. Do not edit `src/common/**` or `prisma/schema.prisma` (fenced); if you truly need either, stop and record why.
- **The agent:** one legal agent at the provider (or the fewest the platform needs), its instruction sent the way the platform allows (agent prompt or a per-conversation override), the model a Hub setting `legal.ai_llm` with a sensible default from the models the platform offers (record the choice and why). Reuse the existing agent client; add to it only what is missing.
- **Structured answers:** today Gemini returns JSON shaped by a schema. Get the same shape from the agent (the platform's structured output if it has one, else a strict JSON instruction) and keep every check the code already makes (matter one of the fourteen, answers only of this matter's questions and options, text cut to size, no em-dash). A reply that does not parse fails the turn exactly as a Gemini failure does today.
- **Privacy:** exactly what is sent today and nothing more. The legal agent keeps no conversation at the provider (retention off, or delete each conversation after the turn, as REC-DELETE does). Record which.
- **Rollback:** a setting picks the provider for legal (`legal.ai_provider`: `elevenlabs` default, `gemini` keeps today's path), so a restart can roll back. Gemini's code stays.
- **Not configured:** if the provider's agent keys are not set, legal answers exactly as it does today when its AI is unavailable.
- **Tests:** stand-ins only, never the live provider. The existing legal specs pass unchanged on the ElevenLabs path; new specs for the adapter (request shape, text-only, the model setting, JSON parsing and a bad reply, privacy deletion, the rollback setting). `npm run contract:build` leaves `contract/openapi.json` unchanged (no route changes) or regenerate it if a doc comment changes.

## Capability checks

- [ ] A person profiles a legal matter and sends a brief, with the same screens and answers as today, and the provider stand-in received every turn as a text-only agent conversation.
- [ ] A reply that is not the expected JSON fails the turn with today's message and holds nothing.
- [ ] No legal conversation stays at the provider.
- [ ] `legal.ai_provider=gemini` brings back today's path after a restart.

## Platform facts relied on (read 11 Nov 2026, public documentation only; no provider call was made)

| Fact | Source |
|---|---|
| A text-only conversation runs on the agent socket with `conversation_config_override.conversation.text_only = true`; the agent can also be made with `conversation.text_only`. Already built and used by the Receptionist (`askAgent`). | `docs/elevenlabs/API-FACTS.md` (Agents); `elevenlabs.io/docs/eleven-agents/guides/chat-mode` |
| A single conversation can replace the agent's prompt (`agent.prompt.prompt`) and model (`agent.prompt.llm`), but only if the agent allows it: `platform_settings.overrides.conversation_config_override.agent.prompt.{prompt,llm} = true` (the flags are described as "Whether to allow overriding the prompt/llm field"). `text_only` has its own flag. | `elevenlabs.io/docs/eleven-agents/customization/personalization/overrides` and the create-agent API reference (override-permission schemas) |
| The platform's model list (agent `prompt.llm` enum) includes `gemini-3-flash-preview`, `gemini-3.5-flash`, `gemini-2.5-flash` (deprecated, removed 30 Nov 2026), `gpt-5.x`, `claude-sonnet-5-5` and others. | `elevenlabs.io/docs/eleven-agents/customization/llm`; create-agent API reference |
| The platform has NO structured output (no response schema or JSON mode on an agent). Its pages list none. So the shape is demanded in words in the prompt and checked by the Hub. | `elevenlabs.io/docs/eleven-agents/customization/llm` (no mention); create-agent reference (JSON schema only for tools and webhooks) |
| Conversation privacy is `platform_settings.privacy`: `retention_days` (default -1, forever), `record_voice`, `delete_transcript_and_pii`, `delete_audio`, `zero_retention_mode` (enterprise only per `API-FACTS.md`). `DELETE /v1/convai/conversations/{id}` exists; its page gives no timing. | create-agent API reference (PrivacyConfig); delete-conversation reference; `src/ai-tools/voice/ai-voice-provider.ts` (`AGENT_PRIVACY`, REC-PRIVACY) |
| A delete sent before the conversation is `done` is answered 204 and ignored (real provider, 30 Oct 2026). | `src/ai-tools/voice/ai-voice-provider.ts` and `scripts/dev/voice-standin.cjs` headers (REC-DELETE) |

NOT RUN: every call to the real provider. Whether the real platform accepts the `llm` override key as sent, and how fast a real
turn answers, are proven only by the first real run (the docs page for overrides says it shows no exact key for `llm` or text-only
in the permission block, so the permission keys above come from the API reference's schema names).

## Verifier report

**Verdict: FIX** (one medium, three lows). Verifier session `session_01YVWyVbutb6jEWsPXBkYeY9`, 11 Nov 2026. Hub `wmt/LEGAL-ELEVEN` 37dd5f3a against `origin/main` bf3f4a3b. Own database `legal_v` (127.0.0.1:14001), own mock WAWU ID on 14877, dropped and stopped afterwards. No call to ElevenLabs, Gemini or any live address; public docs read only.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 (specs and gates) | passed | 45 suites, 754 passed, 3 skipped, 0 failed (`src/legal-intake`, `src/legal/`, receptionist, voice-provider, voice-tools, `src/plan-settings`, `src/admin/plan-settings`); `tsc --noEmit` exit 0; eslint (no --fix) on the 9 changed .ts files exit 0; `scripts/gates/run.py` exit 0 (9 gates, 2245 files, 0 fail, 139 warn, 88 accepted); `check_baseline.py` exit 0 (125 entries) |
| V2 (what is sent, privacy) | passed with F-2, F-4 | probes below |
| V3 (nothing the app sees changes) | passed | `npm run contract:build` exit 0, `contract/openapi.json` byte-identical (cmp); no route, DTO or message text changed |
| V4 (structured answers) | passed with F-3 | probe table below |
| V9 (live seam) | NOT RUN | needs the real provider |

### Findings

- **F-1 medium, defect: agent sprawl, one new agent at the provider per restart.** `src/legal-intake/ai/elevenlabs-legal-ai.ts:117-131` (`agent()`): `this.ready` lives in the process, and with `legal.ai_agent_id` empty (its default, registry `plan-setting-registry.ts` `legal.ai_agent_id`) the first turn calls `createAgent` and only logs the id. PROVED with the voice stand-in and three fresh `ElevenLabsLegalAi` instances (three app boots) sharing one provider: 3 turns created agent-1, agent-2, agent-3 (3 creates, 0 reuse); the same three boots with the id pinned created 0 and patched 3 times. So every deploy and every restart leaves one more "Legal assistant" agent behind until the owner pins the id from a log line; two Hub instances booting together make two. Nothing breaks for the person, but the provider account fills with orphans nobody tracks, and the builder's own header comment ("set legal.ai_agent_id so a restart does not make another") admits the gap. Smallest sound fix, any one of: (a) before `createAgent`, list the provider's agents and reuse the one named exactly "Legal assistant" (needs a list-by-name call on `AiVoiceProvider`, none exists today); (b) have the Hub save the made id into `legal.ai_agent_id` itself (`PlanSettingsService.set` needs an `AdminActor`, so this needs a small system-actor write, and a race note for two instances); (c) at minimum, refuse to make an agent in production and say so in the deploy note, so the owner pins the id before the first deploy (the builder's task file does not tell the owner to). It blocks merge in my grading because the lead named it the main worry and (a) or (b) is a few lines; (c) alone would make it a low.
- **F-2 low (test-gap note): strict JSON read is stricter than the code it feeds.** `elevenlabs-legal-ai.ts:58-70` (`readJsonObject`) tolerates one markdown fence only. A reply of text then a JSON object, which `parseTurn` (`legal-assistant-prompt.ts:259-274`, takes the first `{` to the last `}`) would have accepted, fails the turn with the unavailable message. The platform has no JSON mode, so a model preamble on the first real runs is plausible. Not a wrong answer, a lower success rate; the fix is to pass the reply on to `parseTurn` and `normaliseBrief` without the pre-check, or to cut from the first `{` to the last `}` the same way. Test that would kill it: prose plus JSON must succeed on chat.
- **F-3 low, unproven: the first `agent_response` ends a turn.** `http-voice-provider.ts` `askAgent` (around line 2305) resolves on the first `agent_response` event. If the real platform splits a long reply (a long brief JSON) into more than one event, the JSON is cut and the turn fails closed (unavailable). Same code the Receptionist uses for short chat replies. Only the first real run shows it.
- **F-4 low, deploy note: the default flips legal on deploy.** `legal.ai_provider` defaults to `elevenlabs`. A host without `AI_VOICE_BASE_URL` and `AI_VOICE_API_KEY` answers legal with today's AI-unavailable message even though its Gemini key works (`ask()` throws "AI_VOICE_API_KEY is not set"). Tell the owner to check those two keys, or set `legal.ai_provider=gemini` first, before deploying.

### Probes (scratch spec, not committed; stand-in only)

| Probe | Result |
|---|---|
| 1 Sprawl, 3 boots, unpinned / pinned | 3 agents created, 0 patches / 0 created, 3 patches (F-1) |
| 4 Delete after a failed turn (prose reply) | conversation deleted, 0 left open |
| 4 Restart in the delete window | the in-memory tries (`forget`, `.unref()` timers) die with the process; a conversation the stand-in still holds as `processing` stays after the tries are spent and the Hub logs "not confirmed deleted"; the backstop is the agent's `retention_days: 1` plus `delete_transcript_and_pii: true` (`AGENT_PRIVACY`, `ai-voice-provider.ts:396`), sent on create and on every update, so it holds for agents the Hub made or pinned. A deploy inside the roughly 7 minute window leaves at most that turn's conversation for up to a day. Matches the builder's claim. |
| 5 prose | turn fails: "Legal chat returned unparseable JSON" (service answers `assistant_unavailable`) |
| 5 fenced JSON | accepted, unfenced by `parseTurn` |
| 5 two JSON objects | fails (unparseable) |
| 5 prose plus JSON | fails (F-2) |
| 5 JSON with an extra field | accepted, the field is ignored |
| 5 wrong matter (not one of the fourteen) | accepted, matter null, the intake keeps its own |
| 5 answer to another matter's question | dropped by `validAnswers` |
| 5 em-dash in the reply | replaced by a comma (`cleanReply`) |

### The questions asked

1. **Sprawl:** proved, F-1 above.
2. **Platform facts, re-read 11 Nov 2026 (public pages only):**
   - Overrides page: text-only is `conversation_config_override.conversation.text_only`, prompt is `...agent.prompt.prompt`, model is `...agent.prompt.llm`. Overrides are off by default, and "for most fields" an override sent without permission throws an error (so for some it may be ignored silently). The page's permission example shows `agent.prompt.prompt` but NOT `llm` or `text_only`; it says the Security tab holds them.
   - API reference (create agent) schemas: `PromptAgentAPIModelOverrideConfig` has booleans `prompt`, `llm`, `tool_ids`, `tool_ids_strict`, `native_mcp_server_ids`, `knowledge_base`; `ConversationConfigOverrideConfig` has `text_only`, `max_duration_seconds`. So the keys the Hub sends (`platform_settings.overrides.conversation_config_override.agent.prompt.{prompt,llm}` and `conversation.text_only`) HOLD.
   - Model ids: the `llm` enum has `gemini-3-flash-preview` and `gemini-3.5-flash`; the LLM page lists display names only and says Gemini 2.5 Flash and Flash Lite are removed 30 Nov 2026 (agents move in stages from 15 Nov). Default HOLDS. The LLM page mentions no structured output or JSON mode, so the prompt-and-check approach is right.
   - Privacy: `retention_days` (-1 is forever), `delete_transcript_and_pii`, `zero_retention_mode` ("no PII data is stored") exist under `platform_settings.privacy`. I could not read the zero-retention page (403), so enterprise-only rests on the repo's own API-FACTS. `DELETE /v1/convai/conversations/{id}`: the page gives no timing; the 204-ignored-before-done fact is the repo's own real run of 30 Oct and I could not re-check it.
   - No fact failed. If the real provider refuses the overrides as sent (a rejected permission, an unknown key, an empty first message on the agent), the socket errors or closes, the turn throws, the person sees today's failure message ("Your message was saved. The assistant could not reply just now. Try again in a moment."), nothing is written (no assistant line, no draft), the conversation, if one opened, is deleted, and `legal.ai_provider=gemini` brings the Gemini path back within the settings refresh interval (the cache refreshes on a timer, no restart; the builder's "after a restart" is conservative). The worse case is a SILENT ignore of the prompt override: the agent answers on its standing one-line prompt, produces prose, fails the JSON check, same message. A silently ignored `llm` override runs on the agent's own model, which is the same value from the same setting. All of this is NOT RUN against the real provider.
3. **App sees nothing new:** no route, DTO or message text changed; contract identical. `generatedBy` sits in the stored brief (`LegalBrief`, `legal-brief.ts:28`, plain `string` in the contract) that the lawyer and dashboard side read; new briefs say `elevenlabs:gemini-3-flash-preview` where they said the Gemini model. In `WAWUAfrica` it is only a type (`src/types/legal-intake.ts:54`), in the mobile app only the generated schema; nothing branches on or shows it. The admin dashboard repo is not on this machine, so I could not grep it: the field is a free string, so a new value cannot break a typed reader, and only code matching on "gemini" in the string would. NOT RUN for the dashboard.
4. **Privacy:** the diff leaves the inputs of every `chat`/`generateBrief` call untouched; the adapter sends the instruction, the earlier lines and the last message, and the agent's static name and prompt. The builder's contract spec checks name, email, phone tail, account id and intake id are absent, and the brief path goes through the same adapter. The adapter and the provider client log ids, statuses and counts only. Failed turns are deleted (probe 4). Restart window: above.
5. Structured answers: probe table.
6. **Rollback picker** `legal-ai.client.ts` `pick()` reads `legal.ai_provider` on each call (settings cache, timer refresh); `gemini` goes to the Gemini adapter, anything else to ElevenLabs. Keys unset gives the thrown error the services turn into today's unavailable answer (builder spec, and F-4 for the default).
7. Run: V1 row.

NOT RUN: every call to the real provider (override acceptance, empty first message, real latency, multi-part replies, real deletion timing); the admin dashboard's read of `generatedBy`; the whole `npm run test:contract` (CI); `src/about`, `src/live`, `src/me` legal-named specs outside the listed scope.


## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LEGAL-ELEVEN.md](history/LEGAL-ELEVEN.md).

