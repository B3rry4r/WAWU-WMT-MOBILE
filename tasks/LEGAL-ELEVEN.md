---
id: LEGAL-ELEVEN
title: The legal assistant's AI turns run on ElevenLabs' agent platform, typed only, with no app change
owner: YOU
area: LEGAL
order: 390
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-137]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# LEGAL-ELEVEN · The legal assistant's AI turns run on ElevenLabs' agent platform, typed only, with no app change

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-137.
- **Today** (Hub `origin/main` bf3f4a3b): `src/legal-intake/assistant/legal-assistant.service.ts` (the profiling turn near 679 and `generateBrief` near 531), `src/legal-intake/legal-chat.service.ts` (near 232 and 398) and `src/legal-intake/legal-intake.service.ts` inject `GEMINI_CLIENT` (`src/common/ai/`, a fenced folder) and call Gemini with a response schema (JSON shaped by the provider).
- **Already in the Hub:** an ElevenLabs agent client in `src/ai-tools/voice/http-voice-provider.ts` (create and update an agent, `text_only` conversation override, a text chat that answers `{ reply, conversationId }`, conversation deletion for REC-DELETE), used by the Receptionist (`src/ai-tools/receptionist/`), with the model chosen by a plan setting (`ai.receptionist_llm`).
- **Next:** builder on wawu-backend `wmt/LEGAL-ELEVEN`, then a T1 verifier.

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

## Builder report

## Verifier report
