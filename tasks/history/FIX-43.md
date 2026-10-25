# FIX-43 · round history

Moved out of [tasks/FIX-43.md](../FIX-43.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-43` `018f09a`; the check log ends `EXIT 0` for typecheck, eslint (no fix), the common/ai and legal assistant unit specs (56 tests) and `contract:build` twice (equal).
- **Thinking:** `generationConfig.thinkingConfig.thinkingLevel` (Google's generateContent reference, ThinkingConfig and ThinkingLevel: MINIMAL, LOW, MEDIUM, HIGH; recommended for Gemini 3 and later, an error on earlier models). Chosen LOW: every Gemini 3 model lists it, while MINIMAL is listed for some Flash models only and an unsupported level is an HTTP 400. `GEMINI_THINKING_LEVEL` moves it without a deploy.
- **Limits:** `maxOutputTokens` is a named room for thinking (2048) plus a named room for the answer: structured chat 2048 (schema worst case about 1400) = 4096, prose chat 1024 = 3072, brief 2048 = 4096. They were 700, 700 and 1200.
- **Reading:** the answer is the join of every part without `thought: true`; a finish reason other than `STOP` logs `finishReason` with prompt, thoughts, answer and total counts once and fails the call as before.
- **Specs:** `src/common/ai/tests/real-gemini.adapter.spec.ts`. The FIX-22 expectations of the old 700 body were updated to the new body (the change is the point of this task); new block for the body of each call, a thought part first, and `MAX_TOKENS` and other reasons.
- **Not done:** no call to Gemini (agents never call AI providers); the live check is the lead's.

## Verifier report


Lean verifier (T2 check), Sonnet, 25 Oct 2026. Backend `origin/main` `dcee8af`, worktree detached there. Verdict: **PASS** (status `review`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `tsc --noEmit` EXIT 0; eslint (no fix) on the 3 files EXIT 0; prettier --check EXIT 0; `gates/run.py` EXIT 0 (9 gates, 1977 files scanned, 0 fail, 138 warn, 88 accepted); `check_baseline.py` EXIT 0 |
| V2 | passed | Diff of `018f09a` is 2 files (adapter and its spec); no route, DTO or schema; every Gemini call in `src` goes through this adapter (grep: only `real-gemini.adapter.ts`) |
| V3 | NOT RUN here | No route touched; the protected route suite runs in CI, which the lead watches |
| V4 | passed | No stored field. The only new input is the env `GEMINI_THINKING_LEVEL` (MINIMAL, LOW, MEDIUM, HIGH, any case; anything else is LOW; probed with `minimal`, `Medium`, `bogus`, empty) |
| V9 | NOT RUN | Needs a real Gemini call. Agents never call an AI provider. This is capability check 1, the lead's live turn |

Capability checks:
- Check 1 (live profiling turn `STOP` with a full JSON object): NOT RUN, the lead's.
- Check 2 (chat with and without a schema, and the brief, carry the same `thinkingConfig` and a larger limit): passed. The 3 request bodies read 4096 (chat with schema), 3072 (prose chat), 4096 (brief), each `{"thinkingLevel":"LOW"}`, from a probe that stubs `fetch` and reads the body the adapter sends.
- Check 3 (thought part first parses; `MAX_TOKENS` fails the turn and logs reason and counts once): passed. Probe: a thought part then a text part gives only the text; `thought: false` parts are kept; a thought-only answer fails as "no content" with no log; `MAX_TOKENS` throws "ended early" with one log line (`prompt ?, thoughts ?, answer ?` when usage is missing) and the text is never logged; the brief fails the same way; a missing `finishReason` is read as a finished answer.
- Specs by name (none imports a Fintava file): `real-gemini.adapter.spec.ts`, `legal-assistant-prompt.spec.ts`, `legal-assistant-turn-schema.spec.ts`: 3 suites, 56 tests, EXIT 0 (the builder's count).
- The FIX-22 assertions changed in the spec are only the body figures (700 to 3072 and 4096, plus `thinkingConfig`); the rest of each assertion is unchanged.

Findings (all low):
- `unclear` low: Google's acceptance of `thinkingConfig.thinkingLevel: "LOW"` for the pinned model (and the upper-case spelling) is shown only by the docs the builder cites. A refusal would be HTTP 400 on every turn (`real-gemini.adapter.ts:44-48`, `:69`). The lead's live check (capability check 1) settles it; nothing in this verification can.
- `defect` low: `TIMEOUT_MS` is still 20 s (`real-gemini.adapter.ts:25`) while the output limit grew from 700 to 3072 or 4096 tokens, thinking included. A long turn that used to be cut short at 700 may now time out at 20 s and come back as `assistant_unavailable`. Not reproduced (no live call). Watch it in the lead's live check; raise it in the sweep if the turn takes more than about 12 s.
- `defect` low: `GEMINI_THINKING_LEVEL` is not in `.env.example` (lines 58 to 61 list `GEMINI_API_KEY` and `GEMINI_MODEL` only), so the way to move it without a deploy is written only in a code comment.

