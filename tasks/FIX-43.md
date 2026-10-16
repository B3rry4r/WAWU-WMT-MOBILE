---
id: FIX-43
title: The legal assistant's answers are no longer cut off by the model's thinking
owner: YOU
area: FIX
order: 284
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [FIX-22]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-43 · The legal assistant's answers are no longer cut off by the model's thinking

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Hotfix; backend only, no app change.
- **Backend:** `wmt/FIX-43` `018f09a` on backend main `b3a4ab6`. Mobile: this record.
- **Next:** the lead runs the one live check (a profiling turn must come back `STOP` with a full JSON object), then a verifier.
- **Open findings:** none yet.

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
- [ ] Chat without a schema and a brief carry the same thinking level and a larger limit (specs on the built request body).
- [ ] An answer with a thought part first parses; a `MAX_TOKENS` answer fails the turn and logs the reason and counts once.

## Builder report

Sonnet builder. Backend `wmt/FIX-43` `018f09a`; the check log ends `EXIT 0` for typecheck, eslint (no fix), the common/ai and legal assistant unit specs (56 tests) and `contract:build` twice (equal).
- **Thinking:** `generationConfig.thinkingConfig.thinkingLevel` (Google's generateContent reference, ThinkingConfig and ThinkingLevel: MINIMAL, LOW, MEDIUM, HIGH; recommended for Gemini 3 and later, an error on earlier models). Chosen LOW: every Gemini 3 model lists it, while MINIMAL is listed for some Flash models only and an unsupported level is an HTTP 400. `GEMINI_THINKING_LEVEL` moves it without a deploy.
- **Limits:** `maxOutputTokens` is a named room for thinking (2048) plus a named room for the answer: structured chat 2048 (schema worst case about 1400) = 4096, prose chat 1024 = 3072, brief 2048 = 4096. They were 700, 700 and 1200.
- **Reading:** the answer is the join of every part without `thought: true`; a finish reason other than `STOP` logs `finishReason` with prompt, thoughts, answer and total counts once and fails the call as before.
- **Specs:** `src/common/ai/tests/real-gemini.adapter.spec.ts`. The FIX-22 expectations of the old 700 body were updated to the new body (the change is the point of this task); new block for the body of each call, a thought part first, and `MAX_TOKENS` and other reasons.
- **Not done:** no call to Gemini (agents never call AI providers); the live check is the lead's.

## Verifier report

## Owner sign-off
