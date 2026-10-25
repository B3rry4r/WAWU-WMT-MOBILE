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

---

# RELEASE-02 · R2-LEGAL2: the way back to the matter, the fixed-price path, true words (CHECK-3 legal H-1, H-2, M-1 to M-4, some lows)

Built 25 Oct 2026 by a Sonnet builder (T2). Backend `wmt/R2-LEGAL2` `62629ec` on `origin/main` `29a265e`; mobile `wmt/R2-LEGAL2` on `origin/main` `25d24f0a`. Source: `audits/CHECK-3/legal.md` on `origin/wmt/CHECK-3-legal` (`6babc6a4`). Tests were written before the code for the pure Hub functions and the Hub assistant routes (red: 8 of 9 failed against the old service, then 9 of 9); the quote-notice spec and the app tests were written beside the code and pass.

## What was wrong, and what it does now

| # | Finding | Cause | Fix | Proof |
|---|---|---|---|---|
| 1 | H-1 no way back to the quote and the payment | `resolveThread` kept a sent conversation only at `awaiting_quote`; the Hub wrote no line or notice for a quote | Legal opens the person's open matter at every step up to delivery (`isOpenMatter`), its card opens the matter. The Hub writes the quote into the chat as the consultant who priced it, signals the open screen, and sends a `legal_quote_ready` notification that opens the matter (only for a matter that began in the app's assistant conversation) | Hub specs (`legal-quote-notice.contract.spec.ts` 4, `legal-assistant-r2-legal2.contract.spec.ts` 9), app `LegalChatScreen.test.tsx` (the six open steps), live stack below |
| 2 | H-1 a notification's words ("in your legal chat") were not true | the chat was a fresh one | words now say "Open your request to see it" and the tap opens the matter; the delivery now signals the open matter at once (L-4, G-502) | `legal-consultations-round3` U2 (two assertions updated to the new words, they pinned the false ones) |
| 3 | H-2 "Register a business" ended in a matter nobody could book or pay | the matter was sent as a consultation request for a `simple` service; the card was hidden because the service `requiresDocuments` | `thread.fixedPrice` (the service and the admin price, how long it takes and what to hand over) and `POST /legal/assistant/{id}/start`: the request is made at the admin price with no consultation, the conversation stays as its chat and the assistant says what to send. Send is refused for such a matter (409 `fixed_price_matter`); a `simple` matter's card never offers Book | Hub specs above, app S24 and S26 tests, live stack below |
| 4 | M-1 raw option ids as quick replies | the model returned ids | `readableOption` at write and at read: `business_owner` is "Business owner" | `ai-text.spec.ts`, contract spec |
| 5 | M-2 a control character in the brief | only NUL and em-dashes were cleaned | `cleanAiText` strips every control character (each becomes a space), at write and at read of rows stored before | same |
| 6 | M-3 S16 lacked "Nothing is charged yet." | G-500 | the brief carries `note` while it can be sent; the spec reads the request after Send and finds no fee on it, so the sentence is true | contract spec, app S16 tests |
| 7 | M-4 daily cap said "taking a while" for ever | every provider failure was the same 503 | a provider 429 answers 503 `assistant_at_capacity`: "The assistant is busy right now. Your message is saved." with Ask again, the same words and button if it is still busy | contract spec, app M-4 test |
| 8 | L-1 titles cut | one line | two lines, centred | not pictured |
| 9 | L-4 S23 not live | the delivery sent no signal | it does (above) | not driven live |

## Live proof (local stack `r2l2`, ports 9290 to 9295, the Hub on the Nuvion stand-in, the app's web export at 390 px, dark and light; no Fintava, no model call: the two conversations were seeded by SQL and the consultant acted through the Hub's own admin routes)

- H-1, a person with a funded wallet and a booked consultation: the consultant joined, completed the consultation and quoted ₦45,000. The Hub wrote "I have sent you a quote of ₦45,000. Open your request to read the agreement and sign it." into the chat and a `legal_quote_ready` notification ("Your quote is ready", opens `/legal/requests/<id>`). Legal on Home opened that conversation with the Open card, not a new chat (`H1-1`); Open went to the quote (S21, `H1-2`), the name was signed, the fee paid with the PIN (S22, `H1-3`, `H1-4`) and the matter reads "Pay and start" done (`H1-5`); the database shows `in_progress`, paid.
- H-2, a person with a funded wallet who tapped "Register a business": the Hub served `fixedPrice` (₦35,000 set through the admin route, 5 to 7 working days, ID, 2 name options, address), the chat drew the fixed-price card (`H2-1`), S26 drew Takes, You'll need, Price, Bank charge, Total and "Continue · ₦35,000" (`H2-2`; the stand-in charges no bank fee, so the charge is ₦0 and the total equals the price), Continue made the request, the matter asked for the signature (`H2-3`), then the fee with the PIN (`H2-4`, `H2-5`); the database shows `cac-registration`, `simple`, `in_progress`, paid, `documents` empty.
- Pictures: `scratchpad/r2l2/H1-*` and `H2-*`, `-dark.png` and `-light.png` (780 x 1688 = 390 px at 2x). The light run stops before the irreversible step of each flow.

## Defaults (lead), owner may override

- The assistant's line after a fixed-price request starts reads "To file it we need: ID, 2 name options, address. Write them here and your consultant will pick them up." The words "5 to 7 working days" and "ID, 2 name options, address" are the boards' own (`FIXED_PRICE_TERMS`, `cac-registration` only); the price is never in code.
- A delivered or cancelled matter is finished: Legal then opens a new conversation (its documents are reached from the notification). One open matter at a time.
- A fixed-price matter's documents are asked for in the chat as text: the chat has no attach button (BACKEND_GAPS G-R2-LEGAL2-1).

## Checks

- Backend: tsc EXIT 0; eslint on the changed and new files EXIT 0; `ai-text.spec`, the assistant, quote-notice, ops and round-3 contract specs, `hub-rate-limits`, `publishing-gate-coverage`, `live-legal` all pass (the three suites that failed on the first run were the brief shape I changed on purpose, and two suites that needed a mock WAWU ID on their port); `contract:build` EXIT 0 and `contract/openapi.json` committed; gates EXIT 0 (0 fail, 138 warn, 88 accepted); baseline check EXIT 0.
- App: tsc EXIT 0; eslint on changed files EXIT 0; jest `src/features/legal`, `push`, `notifications` and `route-guard` (16 suites, 602 tests) pass; gates EXIT 0 (0 fail, 17 warn); contract synced from backend `62629ec` by hand (the script reads main only), `SOURCE_COMMIT` names it.
- NOT RUN: a phone; Gemini (the specs use the stand-in, the live stack seeds its conversations by SQL, so no model call was spent).

## Not built (the lows that no board makes clear or true)

- L-2 "Details are in your email." stays out: the Hub sends no email (G-LEGAL-04-1).
- L-3 the raw request id in the engagement letter: the letter text is the web's too, so changing it is not additive (BACKEND_GAPS G-R2-LEGAL2-2).
- L-5 the person's own held hour greyed on S18, L-6, L-7, L-8, L-9, L-10: left on the sweep list.


---

# RELEASE-02 · R2-LEGAL2 · Verifier report (T2 check, v-R2-LEGAL2, 25 Oct 2026)

Verdict: **PASS (merge)**. Nothing medium or worse. Checked: backend `wmt/R2-LEGAL2` `62629ec` on `29a265e`, mobile `wmt/R2-LEGAL2` `add21afc` on `25d24f0a`. The verifier wrote none of it. Pictures (390 px, dark and light): scratchpad `v-r2l2/` (`H1-*`, `H2-*`, `cmp-S16/S24/S26-*`).

## Passes

| Pass | Result | Evidence |
|---|---|---|
| V7 H-1, real chat | passed | Local stack (`vr2l2`, ports 9330-9335, Nuvion stand-in, scratch copy of `stack.sh` letting only the Gemini host through, `gemini-2.5-flash-lite` then `gemini-2.5-flash`; 10 provider calls in all, 4 of them refused by the provider). Fan opened Legal from Home, chatted to a brief in 4 answered turns (S16 drawn with "Nothing is charged yet."; balance and `LegalRequest` unchanged after Send, so the line is true), sent, consultant joined and quoted through the Hub's admin routes, `legal_quote_ready` ("Your quote is ready", opens `/legal/requests/<id>`) and the chat line "I have sent you a quote of ₦45,000..." arrived, Legal on Home reopened the same conversation with an Open card (no new chat), Open went to S21, signed, paid S22 with the PIN |
| V8 money H-1 | passed | stand-in balance: 500,000 to 485,000 (S19, one debit of ₦15,000, Bank charge ₦0 on the stand-in) to 440,000 (S22, one debit of ₦45,000); transfers 2 to 3 to 4; WAWU operational +15,000 and +45,000; request `in_progress`, signed, paid |
| V7 H-2 | passed | "Register a business" chip: S24 card with ₦35,000 drawn from the admin price record; S26 drew Takes "5 to 7 working days", You'll need "ID, 2 name options, address", Price, Bank charge, Total and "Continue · ₦35,000"; one request (`quoted`, `simple`, 35000) however Continue was tapped; S21 sign; S22 paid once: 500,000 to 465,000 (one ₦35,000 debit, transfers 4 to 5) |
| V3 server rules | passed | `POST /legal/assistant/{id}/send` on the fixed-price matter: 409 `fixed_price_matter` (before any brief); after start it answers the same sent thread. Price follows the record: admin 35,000 to 36,000 to cleared (no `fixedPrice`, Send allowed) to 35,000. No `35000`, `35,000` or price table in either repo's non-test source (grep); `FIXED_PRICE_TERMS` holds words only |
| route guard | passed | `POST /legal/assistant/{id}/start`: 401 without a token; 404 for another person's matter and for an unknown id; 400 for a 1-character name; owner starting twice answers the same thread, one `LegalRequest` |
| V4 M-4 live | passed | The provider answered a real 429 (daily cap on flash-lite): the screen drew "The assistant is busy right now. Your message is saved." with Ask again, and drew the same words and button after a second and a third Ask again; a real 503 drew "taking a while" (`H1-2`, `H1-4`) |
| web untouched | passed | web-style `POST /legal/requests` (`tax-registration`) then admin quote ₦20,000: status `quoted`, no `legal_quote_ready` notice, no `LegalChatMessage` row for it. Protected suite: 245 passed, 8 failed on the branch and the same 8 on `29a265e` with the same environment (verification and professionals routes: they need the WAWU ID service key and port 4001); no registry file, `prisma/`, `src/common`, `app.module.ts` or gate touched; only added route decorator is `@Post(':id/start')`; `contract/openapi.json` adds that path and one required `note`, removes nothing else; mobile copy equals backend `62629ec` byte for byte |
| V5 picture | passed | S16, S24, S26 against the boards: structure and the BRIEF rows match (Price, Bank charge, Total, button with the total, "Nothing is charged yet." under Send); L-1 two-line centred title seen on S26 |
| fingerprint | passed | in one tree and one `node_modules` (`/home/user/wt/nm-mobile2`), main `25d24f0a` and the branch give the same: Android `17ffb13d520882bf144982b61d03f3994c6e40e4`, iOS `496a3ee0`, every source hash equal. The builder's `b9901c63` and `c4fa5cc2` are not reproduced by either tree, so they came from another environment; the branch does not change the native fingerprint |

Checks with EXIT lines (logs in scratchpad `vr2l2-v/`): backend tsc EXIT 0; legal specs (15 suites incl. `legal-assistant-r2-legal2`, `legal-quote-notice`, `ai-text`, rounds 2, 3, 5, ops) pass; notification-emitter, wiring and switches pass; `notification.contract.spec` fails 11 of 11 on the branch and 11 of 11 on `29a265e` (it hard-codes a mock WAWU ID on port 4001); `contract:build` EXIT 0 and `git status contract` empty; gates EXIT 0 (9 gates, 1990 files, 0 fail, 138 warn, 88 accepted); check_baseline EXIT 0. App tsc EXIT 0; jest `src/features/legal`, `notifications`, `push`, `route-guard` (`--maxWorkers=2`) 16 suites, 602 tests, EXIT 0; gates EXIT 0 (10 gates, 1421 files, 0 fail, 17 warn); check_baseline EXIT 0; check_tasks EXIT 0 (444 tasks).

## Changed assertions, each against its defect (none weakened)

- Backend: `legal-assistant.contract.spec.ts` +`note: 'Nothing is charged yet.'` (M-3); `legal-consultations-round3` U2 two strings "It is in your legal chat" to "Open your request to see it" (H-1 item 2, the old words were false); `ai-text.spec.ts` is new (M-1, M-2).
- App: `LegalLive`, `model.test` fixtures gain `note`, `requestPath`, `fixedPrice` (types of the new fields); `LegalPayments` S26 block moves from the catalogue and `POST /legal/requests` to the conversation and `POST .../start` (H-2), the "needs documents" case goes with the removed documents gate (H-2); `legalModels.test` drops `startable` and `fixedPriceFor` with the functions (H-2); `LegalChatScreen.test` drops the "moved past awaiting a quote is not reopened" test, which pinned H-1, and the catalogue-driven card tests (H-2), each replaced; `everyKind` and `routes.test` only add `legal_quote_ready`.
- One assertion group went without a stand-in: see low 3.

## Findings

No blocker, high or medium defect.

1. **unclear (owner)**: a fixed-price matter is started with `documents: []` and the chat has no attach button (`legal-assistant.service.ts:1072`, BACKEND_GAPS G-R2-LEGAL2-1), so a person can pay ₦35,000 for a CAC filing whose ID the app cannot send as a file; the web's own route refuses this service without documents. The builder recorded it as a lead default. Repro: Bea above, S26, S21, S22: `LegalRequest.documents` is `{}` and the request is `in_progress`.
2. **low, defect**: `readableOption` writes "Other african" and "Outside africa" as quick replies (`src/legal-intake/ai-text.ts:49`; repro: Ada's second answer, location chips). The question bank already has the words "Another African country" and "Outside Africa" (`legal-intake-questions.ts:167-168, 181-183`) but the prompt gives the model option values only. Map a known option id to its label, fall back to `readableOption`.
3. **low, test gap**: `legalModels.test.ts:136` no longer asserts `matterCardOf('awaiting_consultation_payment')` is `'book'`, `('consultation_scheduled')` and `('delivered')` are `'open'`. The code still behaves so; add the three back.
4. **low, web wording**: `notification-event.ts:711-712` changes the words of `legal_delivered` for every matter, web ones included, and `legal-deliverables.service.ts:206` publishes `legal.thread` on every delivery. Wording and a live frame only, no shape or route; the web reads the feed through `GET /notifications`. Say so to the owner, or key the words to a matter that began in the app.
5. **low, differs**: S24's card is drawn while the assistant's profiling question and its taps are still shown under it, so two next steps compete (the board has the assistant say "That one has a fixed price, so you can start now." and nothing else). S26 draws the catalogue's name and blurb ("CAC business name registration") where the board says "Register your business name / With CAC. No lawyer needed." (unchanged from LEGAL-06).

## NOT RUN

- Tapping the `legal_quote_ready` notice in the app's Inbox (the Hub's `actionHref` was read through the API and the route is covered by `routes.test.ts`); push on it (held, G-265).
- L-4 live: delivery while S23 is open (no delivery was made); S23.
- Light picture of S16 (the brief needs a fourth model turn; dark taken). Light pictures taken: Legal reopened with the Open card (both fans), S24, S26, S21, S22.
- Mutation runs (no mutant was run in this check).
- A phone.
- Gemini: 10 calls (4 refused by the provider: one 503, three 429 with `gemini-2.5-flash-lite`); the Hub ran on `gemini-2.5-flash` from the fifth call; the model never returned an option id this time, so M-1 is proven by `ai-text.spec` and the contract spec, not by a live id.
