# FIX-22 verifier report (Sonnet verifier, 16 Oct 2026)

Verdict: merge. Backend wmt/FIX-22 ba3c59f, mobile 6ac2509. Nothing medium or worse.

Claims tested
1. No schema => byte-identical request. Ran main's real RealGeminiAdapter (git show origin/main) and the branch's
   side by side against a stubbed fetch: url, method, headers and body bytes equal for 5 variants (empty history,
   unicode and quotes, 30 messages, schema undefined, schema null); a schema set on one call does not leak into the
   next; returned text equal. With a schema only responseMimeType and responseSchema are added to generationConfig,
   key order and every other field equal, the schema object not mutated. 15/15 (builder's 4 + mine 11).
2. Schema only from LegalAssistantService.turn. grep: one non-spec site passes responseSchema (service.ts:608);
   the other two chat() callers (legal-chat.service.ts:221 matter chat, :375 opener) pass none. Integration: copies of
   legal-assistant.contract.spec (24/24) and legal-chat-opener.contract.spec (23/23) with a recorder on the stand-in,
   real Postgres, mock ID: 45 profiling calls all carried buildTurnSchema(matter named in the instruction); 1 matter-chat
   call and 32 opener/matter-chat calls had no responseSchema key at all.
3. No real model called. Specs stub global.fetch or stand in GeminiClient; no key on the machine; block-net on the stack.
4. Schema well-formed for all 14 matters, 'other', an unknown matter and '': no empty OBJECT, required keys exist, enums
   unique non-empty strings, depth 3, 2.5-2.8 KB, 27-30 properties, 102-115 enum values. validAnswers keeps a
   schema-shaped answer for every matter and drops nulls; parseTurn reads an all-null reply.
5. CI on ba3c59f: suite shards 3/3, netns, contract, deploy-test-in-sync, baseline: success. Protected routes 253/253
   (job log). Executable gates red: 18 FAIL lines identical to main 18ac5f9's gates job (diffed), none in a touched file.
6. tsc --noEmit EXIT 0; eslint (no --fix) and prettier --check on the 6 changed files EXIT 0; no em-dash in added lines.
   Mobile diff is docs only (SHARED-CHANGES row, PROGRESS, task file); check_tasks.py EXIT 0.

Findings
1. low (not exercised live): the schema uses enum, nullable and maxItems; the only schema proven in production
   (generateBrief) uses type, properties, items, required. These are documented Gemini schema fields and the schema is small,
   but no key exists here to confirm the provider accepts it. If it did not, every profiling turn would end 503
   assistant_unavailable (real-gemini.adapter.ts chat(), legal-assistant.service.ts:601-625). Suggest one live smoke
   when a Gemini key is available. Not a reason to hold the merge.
2. low (info): the schema is built from the intake's matter at turn start, the same matter the instruction lists. If the model
   changes matter in a turn it cannot fill the new matter's own questions until the next turn (the instruction already
   listed only the old matter's ids). Same effect as before in practice.

Cleanup: stack fix_22 down (ports 7310-7317 closed, database dropped), worktrees removed, no process left.
Attack specs kept at scratchpad/fix-22-v/attack-specs/.
