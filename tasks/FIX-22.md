---
id: FIX-22
title: A profiling turn asks the model for one JSON object
owner: YOU
area: FIX
order: 230
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-22 · A profiling turn asks the model for one JSON object

## Current state

As of 16 Oct 2026, after round 1 (builder, Sonnet).
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-22.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-28` (this branch contains it); API types regenerated from backend `wmt/FIX-22` (51f1bc2).
- **Branches:** backend `wmt/FIX-22` at ba3c59f (the build `11eb3bf` on top of a merge of main `18ac5f9`). Mobile `wmt/FIX-22` holds this record and the SHARED-CHANGES row. No migration (`none`), no route change, `contract/openapi.json` unchanged.
- **Merged and live:** nothing of this task.
- **Built:** `GeminiChatRequest.responseSchema?: object`; `chat()` sends `responseMimeType: "application/json"` and the schema in `generationConfig` when it is there (a new `buildChatBody`), and sends the body it always sent when it is not. `LegalAssistantService.turn` passes `buildTurnSchema(intake.matter)`. SHARED-CHANGES LEGAL-01 #3 is marked applied.
- **Open findings:** blocker 0, high 0, medium 0. Lows: the response schema (enum, nullable, maxItems) is not proven against the live Gemini API; a matter the model switches to mid-turn gets its schema from the next turn. They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head (51f1bc2: 819aa28 plus an empty commit that re-ran CI) and has one live Gemini smoke run when a key is available. The src/common/ai change is the SHARED-CHANGES row already marked applied in this task.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files: this task IS the lead's shared-change pass, so it may edit the fenced files its rows name, and nothing else that is fenced)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `SHARED-CHANGES.md` rows: LEGAL-01 #3 (each row says what to change and why; the status cells were audited on 8 Oct 2026, mobile `fb01391`)
- `tasks/LEGAL-01.md`; wawu-backend `src/common/ai/gemini-client.interface.ts`, `src/common/ai/real-gemini.adapter.ts` (fenced: this task is the shared-change pass for that row)

## Goal

LEGAL-01 #3 asked for an optional `responseSchema` on `GeminiChatRequest`, sent as `responseMimeType: "application/json"` with the schema in `generationConfig`, as `generateBrief()` already does. It was never applied, so a profiling turn relies on the model returning JSON unprompted.

## Scope

- Add the option exactly as the row says; every caller that passes none is unchanged (byte-identical request).
- LEGAL-01's profiling turn passes its schema.
- Stand the AI in at its seam in every spec. Never call a real model.
- Mark the row applied.

## Capability checks

- [ ] A request with a schema carries it; one without is byte-identical to main (a spec on the built request body).
- [ ] The profiling turn sends its schema.
- [ ] Protected routes 253/253.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-22.md](history/FIX-22.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
