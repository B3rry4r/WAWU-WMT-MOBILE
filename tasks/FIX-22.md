---
id: FIX-22
title: A profiling turn asks the model for one JSON object
owner: YOU
area: FIX
order: 230
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-22 · A profiling turn asks the model for one JSON object

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

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
