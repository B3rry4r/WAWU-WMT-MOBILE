# FIX-22 · round history

Moved out of [tasks/FIX-22.md](../FIX-22.md) word for word, oldest first. The current state is in that file.

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

