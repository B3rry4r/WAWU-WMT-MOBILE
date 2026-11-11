---
id: LEGAL-ELEVEN
title: The legal assistant's AI turns run on ElevenLabs' agent platform, typed only, with no app change
owner: YOU
area: LEGAL
order: 390
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-137]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# LEGAL-ELEVEN · The legal assistant's AI turns run on ElevenLabs' agent platform, typed only, with no app change

## Current state

As of 11 Nov 2026.
- **Status:** review. Verifier round 1 re-check: MERGE (no medium or worse; three lows). Hub `wmt/LEGAL-ELEVEN` head 5e8c6654 (round 0 was 37dd5f3a); records on mobile `wmt/LEGAL-ELEVEN`, verifier report on `wmt/LEGAL-ELEVEN-verify`.
- **Fixed and re-proved:** F-1 (one agent however many boots; a pin makes no list call; the race clean-up can only delete the agent the process just made), F-2 (preamble then JSON accepted, prose fails as before), F-3 (legal-only turn joining; Receptionist unchanged), F-4 (owner notes).
- **Open:** three lows for the legal sweep (L1 log a failed race delete, L2 socket close after a response, L3 missing created time). NOT RUN against the real provider.
- **Next:** lead merges the Hub branch; the first real run on the provider is the owner's V9.

## Owner notes (LEGAL-ELEVEN)

- **Server config:** legal on ElevenLabs needs `AI_VOICE_BASE_URL` and `AI_VOICE_API_KEY`, the same two Studio and the Receptionist already use. Without them legal answers as it does when its AI is unavailable. No voice list is needed.
- **Rollback:** `legal.ai_provider=gemini` (a plan setting) takes effect at the next plan-settings refresh, with no restart. It is read on every call.
- **The agent:** found at the provider by the exact name "WAWU Legal assistant" (made if none), so restarts add none. `legal.ai_agent_id` pins a specific agent instead. If two Hubs boot at the same moment the older agent stays and the other deletes its own.

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
- [ ] `legal.ai_provider=gemini` brings back today's path at the next settings refresh (no restart).

## Platform facts relied on (read 11 Nov 2026, public documentation only; no provider call was made)

| Fact | Source |
|---|---|
| A text-only conversation runs on the agent socket with `conversation_config_override.conversation.text_only = true`; the agent can also be made with `conversation.text_only`. Already built and used by the Receptionist (`askAgent`). | `docs/elevenlabs/API-FACTS.md` (Agents); `elevenlabs.io/docs/eleven-agents/guides/chat-mode` |
| A single conversation can replace the agent's prompt (`agent.prompt.prompt`) and model (`agent.prompt.llm`), but only if the agent allows it: `platform_settings.overrides.conversation_config_override.agent.prompt.{prompt,llm} = true` (the flags are described as "Whether to allow overriding the prompt/llm field"). `text_only` has its own flag. | `elevenlabs.io/docs/eleven-agents/customization/personalization/overrides` and the create-agent API reference (override-permission schemas) |
| The platform's model list (agent `prompt.llm` enum) includes `gemini-3-flash-preview`, `gemini-3.5-flash`, `gemini-2.5-flash` (deprecated, removed 30 Nov 2026), `gpt-5.x`, `claude-sonnet-5-5` and others. | `elevenlabs.io/docs/eleven-agents/customization/llm`; create-agent API reference |
| The platform has NO structured output (no response schema or JSON mode on an agent). Its pages list none. So the shape is demanded in words in the prompt and checked by the Hub. | `elevenlabs.io/docs/eleven-agents/customization/llm` (no mention); create-agent reference (JSON schema only for tools and webhooks) |
| Conversation privacy is `platform_settings.privacy`: `retention_days` (default -1, forever), `record_voice`, `delete_transcript_and_pii`, `delete_audio`, `zero_retention_mode` (enterprise only per `API-FACTS.md`). `DELETE /v1/convai/conversations/{id}` exists; its page gives no timing. | create-agent API reference (PrivacyConfig); delete-conversation reference; `src/ai-tools/voice/ai-voice-provider.ts` (`AGENT_PRIVACY`, REC-PRIVACY) |
| A delete sent before the conversation is `done` is answered 204 and ignored (real provider, 30 Oct 2026). | `src/ai-tools/voice/ai-voice-provider.ts` and `scripts/dev/voice-standin.cjs` headers (REC-DELETE) |

| List agents: `GET /v1/convai/agents`, query `search` ("Search by agents name", match kind not stated), `page_size` (max 100), `cursor`, `sort_by`; answer `agents[].{agent_id,name,created_at_unix_secs}`, `has_more`, `next_cursor`. | `elevenlabs.io/docs/api-reference/agents/list` (read 11 Nov 2026) |
| Agent websocket has `agent_response` and `agent_response_complete`; the page does not say when the latter fires. | `elevenlabs.io/docs/eleven-agents/api-reference/eleven-agents/websocket` |

NOT RUN: every call to the real provider. Whether the real platform accepts the `llm` override key as sent, and how fast a real
turn answers, are proven only by the first real run (the docs page for overrides says it shows no exact key for `llm` or text-only
in the permission block, so the permission keys above come from the API reference's schema names).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LEGAL-ELEVEN.md](history/LEGAL-ELEVEN.md).

