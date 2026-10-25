---
id: FIX-43
title: The legal assistant's answers are no longer cut off by the model's thinking
owner: YOU
area: FIX
order: 338
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: [FIX-22]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-43 · The legal assistant's answers are no longer cut off by the model's thinking

## Current state


As of 25 Oct 2026.
- **Status:** review. Independent lean verifier (T2 check, 25 Oct): PASS, no open defect. Built by a Sonnet builder; checked on backend `origin/main` `dcee8af` (the change is `018f09a`, in main).
- **Still the lead's:** capability check 1, the one live profiling turn (`STOP` with a full JSON object). Agents never call an AI provider, so it was NOT RUN here. It is also the only proof that Google accepts `thinkingLevel: "LOW"` for the pinned model.
- **Open findings:** none medium or worse. Three lows, for the lead to place in a sweep (see the history file).
- **History:** [history/FIX-43.md](history/FIX-43.md).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-22.md`, `tasks/LEGAL-01.md`; wawu-backend `src/common/ai/real-gemini.adapter.ts`

## Goal

Every legal assistant turn failed in production with `assistant_unavailable`. The model pin, `gemini-3.7-flash`, is a thinking model, and its thoughts are spent from `maxOutputTokens`. The live profiling turn used 669 of 700 on thinking, ended `MAX_TOKENS` with 17 answer tokens, and `parseTurn` found no JSON. Chat without a schema and the brief share the limit and the problem.

## Scope

- `src/common/ai/real-gemini.adapter.ts` and its spec only: every Gemini call sends a thinking level and a limit with room for thinking and the answer, reads every part that is not a thought, and fails with one log line (reason and token counts, never the text) when the finish reason is not `STOP`.
- Nothing else changes: no route, schema, prompt or caller.

## Capability checks

- [ ] A profiling turn with a schema comes back `STOP` with a full JSON object (the lead's one live check).
- [x] Chat without a schema and a brief carry the same thinking level and a larger limit (specs on the built request body).
- [x] An answer with a thought part first parses; a `MAX_TOKENS` answer fails the turn and logs the reason and counts once.

## Owner sign-off
