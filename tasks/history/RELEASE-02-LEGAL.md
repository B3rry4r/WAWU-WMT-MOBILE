# RELEASE-02 · R2-LEGAL: the Legal chat shows no assistant answer (CHECK-3 M-01)

Built 25 Oct 2026 by a Sonnet builder (T2). Backend `wmt/R2-LEGAL` `7f78ef1` (fix `01e6907`, then a comment-only correction) on `origin/main` `dcee8af`; this record on mobile `wmt/R2-LEGAL` on `origin/main` `a3fdaf71`. The app needed no change: no app code, no route, no native change. Source: `audits/CHECK-3/money-work-p2.md` M-01 on `origin/wmt/CHECK-3-money-work-p2`.

## What was wrong

| # | Cause | Proof | Fix |
|---|---|---|---|
| 1 | Every Gemini call sent `thinkingConfig.thinkingLevel`, which only the Gemini 3 family accepts. A Hub pointed at `gemini-2.5-flash` got HTTP 400 "Thinking level is not supported for this model" on every turn, so the assistant never replied, although a direct probe of the model (no thinking setting) answered 200. This is why the chat stayed silent "with either model". | Local stack, real key, unfixed Hub on `gemini-2.5-flash`: send answered `503 assistant_unavailable` in 0.2 s, Hub log `Gemini chat returned HTTP 400`; the same Hub on `gemini-3.5-flash` answered | `thinkingConfigFor(model)`: a level for Gemini 3, `thinkingBudget` 1024 for 2.5, no thinking setting for a model of unknown family (an alias, a newer name). Fixed Hub on `gemini-2.5-flash`: answered in 1.7 s |
| 2 | The default model `gemini-3.7-flash` answered 503 "high demand" or ran past the Hub's 20 s limit in most probes (1 of 7 calls answered, in 9 s). | the Hub's real chat body, small calls, 25 Oct 2026 | default is `gemini-3-flash-preview`: 9 of 9 direct probes answered in 1.1 to 3.6 s, and every Hub turn on it but one 429. Others on the same key: `gemini-2.5-flash` 7 of 8 (about 2 s; one 503), `gemini-3.5-flash` mostly answered but in 5 to 17 s, with some 503, one 429 and one 20 s abort, `gemini-3.6-flash` mixed, `gemini-3.7-flash` and `gemini-3.8-flash` mostly 503 or no answer in 30 s, `gemini-3.1-flash-lite` 2 of 5 |
| 3 | `GEMINI_MODEL=` (the empty line `.env.example` carried) kept an empty string through `??` and asked the provider for a model with no name | spec `real-gemini.model.spec.ts` | an unset, empty or blank value is the default |

The app side was read and run, not changed: `sendMessage` returns the thread, `keep` stores it in the query cache and `chatRows` draws every assistant message; on a 503 it keeps the message and draws "The assistant is taking a while to answer. Your message is saved." with "Ask again" (picture below, and the existing test "a 503 keeps the message, shows it, and offers Ask again": 48 of 48 in `LegalChatScreen.test.tsx`).

## Live proof (local stack `r2l`, ports 9150 to 9157, real Gemini key, no Fintava, one scratch copy of `stack.sh` and `block-net.cjs` that let the one Gemini host through; the committed stack still blocks every outside host, so a committed stack's assistant cannot answer, by design)

- Default model, `GEMINI_MODEL` empty: a question in the chat at 390 px is answered and drawn in about 1.5 s with the four taps (`S15-answer-390-dark.png`, `-light.png`). A whole conversation: four profiling turns in 1.5 to 2.7 s, the brief ready after the fourth (9 rows), "Send to a consultant" in 4.9 s opened the matter at `awaiting_quote`.
- A model id the provider does not have (`gemini-r2l-no-such-model`, a second Hub on the same database, the chat sent to it): `Gemini chat returned HTTP 404`, the app shows the saved message, the note and "Ask again", never silence (`S15-model-fails-ask-again-390-dark.png`).
- One 429 (the key's per-minute limit) appeared after six calls in 10 s; the chat took the same "Ask again" path.
- Pictures: `scratchpad/r2-legal/` (`S14-opened`, `S15-answer`, `S15-model-fails-ask-again`, 780 x 1688 = 390 px at 2x).

## Owner console line

`GEMINI_MODEL=gemini-3-flash-preview` on the Hub (optional: the same value is now the default, so a Hub with the variable missing or empty also uses it). If the provider ever retires that id, the Hub log says `Gemini chat returned HTTP 404`: set `GEMINI_MODEL=gemini-2.5-flash`.

## Checks (backend, from `wmt/R2-LEGAL`; the specs ran on `01e6907`, the next commit changes one comment and was rerun for eslint, tsc and `src/common/ai/tests`: EXIT 0, 28 of 28)

- spec red first (13 of 13 failed: `resolveGeminiModel` and `thinkingConfigFor` did not exist), then green: `real-gemini.model.spec.ts` (new) and `real-gemini.adapter.spec.ts` 28 of 28.
- tsc EXIT 0; eslint on the two changed files EXIT 0; `contract:build` EXIT 0 and `contract/` unchanged (no route changed).
- legal-intake specs (assistant prompt, turn schema, contract, concurrency, opener, intake), `publishing-gate-coverage` and `hub-rate-limits` together with the adapter specs: 10 suites, 228 passed, 3 skipped, EXIT 0 (no Fintava spec among them).
- gates EXIT 0 (9 gates, 0 fail, 138 warn, 88 accepted); baseline check EXIT 0.
- app: not touched, so tsc, route-guard, gates and fingerprint were not rerun; `LegalChatScreen.test.tsx` 48 of 48. NOT RUN: a phone.

## Open

- A 503 or a 429 from the provider is still a failed turn that the person retries with "Ask again". No retry or second model was added (no ruling asks for one).
- `gemini-3-flash-preview` carries a preview name; see the console line for the move if it is retired.
