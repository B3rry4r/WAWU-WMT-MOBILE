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
- **Status:** verifying. Built and pushed; backend CI is green (the 16 gate FAIL lines are main's). The verifier is next.
- **Branches:** backend `wmt/FIX-22` at ba3c59f (the build `11eb3bf` on top of a merge of main `18ac5f9`). Mobile `wmt/FIX-22` holds this record and the SHARED-CHANGES row. No migration (`none`), no route change, `contract/openapi.json` unchanged.
- **Merged and live:** nothing of this task.
- **Built:** `GeminiChatRequest.responseSchema?: object`; `chat()` sends `responseMimeType: "application/json"` and the schema in `generationConfig` when it is there (a new `buildChatBody`), and sends the body it always sent when it is not. `LegalAssistantService.turn` passes `buildTurnSchema(intake.matter)`. SHARED-CHANGES LEGAL-01 #3 is marked applied.
- **Open findings:** none yet.
- **Next:** a verifier (not the builder) runs V1 to V4 and V9 and checks the backend CI run.

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

**Builder report, 16 Oct 2026 (Sonnet builder).** Backend `wmt/FIX-22` from main, with main `18ac5f9` merged in (no conflict). Mobile: this file and the SHARED-CHANGES row only.

**Files (backend).** `src/common/ai/gemini-client.interface.ts` (the option and its comment); `src/common/ai/real-gemini.adapter.ts` (`buildChatBody(request)`, which `chat()` now sends: the old body key for key, plus `responseMimeType` and `responseSchema` inside `generationConfig` only when a schema is passed, in the order `generateBrief()` writes them); `src/legal-intake/assistant/legal-assistant-prompt.ts` (`buildTurnSchema(matter)`: the seven keys the instruction names, with the matter's own questions and option values under `answers`, the matter limited to the fourteen values or null, the lists to the server limits); `src/legal-intake/assistant/legal-assistant.service.ts` (`responseSchema: buildTurnSchema(intake.matter)` on the turn). `parseTurn` and `validAnswers` still read the reply defensively. No fenced file other than the two the row names.

**Specs I wrote.** `src/common/ai/tests/real-gemini.adapter.spec.ts` (4): a request with no schema is byte for byte the body it was before (compared to the old literal), an undefined schema equals an absent one, a schema goes out as `application/json` plus the schema, and nothing else in the body changes. `src/legal-intake/assistant/tests/legal-assistant-turn-schema.spec.ts` (the schema's shape per matter, and the service's profiling turn sends it, with the AI stood in at its seam, never a real model). Callers that pass none are unchanged.

**Capability checks.**
- [x] A request with a schema carries it; one without is byte-identical to main (`real-gemini.adapter.spec.ts`).
- [x] The profiling turn sends its schema (`legal-assistant-turn-schema.spec.ts`, on the service with the model stood in).
- [x] Protected routes 253/253 (GitHub run 38911008890 on ba3c59f: 253 passed, 253 total).

**Checks.** Backend on ba3c59f: `tsc --noEmit` EXIT 0, eslint and prettier on the changed files EXIT 0, the three touched suites 45 tests passed, `prisma generate` EXIT 0. GitHub on ba3c59f: Branch checks run 38911009116 success (suite shards, contract, netns), Protected routes run 38911008890 success, Gates run 38911008985 red with the same 16 FAIL lines main has (none in a file this task touches). Mobile `npm run check` as its steps with two jest workers, EXIT 0: 155 suites / 2832 tests passed, gates 0 fail / 5 warn, 283 tasks.

**Not done.** Nothing open. No picture (no screen).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
