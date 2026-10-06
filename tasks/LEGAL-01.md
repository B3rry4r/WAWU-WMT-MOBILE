---
id: LEGAL-01
title: Legal starts as a chat
owner: YOU
area: LEGAL
order: 28
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-14]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# LEGAL-01 · Legal starts as a chat

Taken over by the lead's agents on 6 Oct 2026 (unstarted by DEV3).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

S14-S17: the assistant chat comes first and writes the brief; today it only opens after payment.

## Scope

Assistant on an unpaid intake, brief written into the intake, consultant can join before payment (per R-14). The matter options the assistant offers come from the API, as a named schema (BACKEND_GAPS G-1).

## Capability checks

- [ ] A user can describe a problem and receive a brief without paying.
- [ ] A consultant who joins from today's legal admin tooling in wawu-dashboard (the builder names the screen in the report) sees the brief before any payment.

## Builder report

**Built (backend `wmt/LEGAL-01`, a29c4dd; additive).** The Gemini assistant now runs on an UNPAID intake, extending the existing legal-intake code (same `LegalIntake` table, matters, `LegalBrief` shape, request lifecycle, `GEMINI_CLIENT` and consultant chat routes). New routes, all named schemas (G-1): `GET /legal/assistant/topics` (S14's taps, `LegalAssistantTopic`, each mapped to an intake matter), `POST /legal/assistant` (open or resume: the design's two lines and the taps, no AI call), `GET /legal/assistant/{id}`, `POST {id}/messages` (`body` or `quickReplyId`), `POST {id}/reply` (ask again after a 503), `POST {id}/send` ("Send to a consultant"), and for consultants `GET /legal/ops/intakes/{id}/assistant` (superadmin, support). Each client message is one AI turn returning a reply, up to 4 taps, the matter, the brief rows and any intake answers; the server keeps only what passes its checks and writes the brief into the intake (`draftBrief`). Send writes it into `LegalIntake.brief` (form shape), opens the matter at `awaiting_quote` (nothing charged), and the conversation continues on the matter's thread, where a consultant joins through the existing `POST /legal/ops/intakes/chat/{requestId}`; once one has written the assistant stops (`assistantStopped`, consultant name from the admin record). Refusals carry `reason.code`: `message_empty`, `quick_reply_unknown` (400), `not_found` (404, someone else's too), `brief_not_ready`, `nothing_to_answer`, `assistant_conversation_full` (409), `assistant_rate_limited` (429, `retryAfterSeconds`), `assistant_unavailable` (503, the message is kept). Files: `src/legal-intake/assistant/` (service, two controllers, prompt, topics, config, types, DTO, two specs), `legal-intake.module.ts`, one line in `legal-intake.service.ts` (the form's resume skips assistant intakes; every existing row has a null channel), migration `20261006210000_legal_assistant`, purge and export maps, `scripts/enrich-contract.js` (nullable named fields as `allOf` for this folder), `contract/openapi.json` (7 paths, 9 schemas added, nothing existing changed). Mobile: contract and types from the branch (SHARED-CHANGES LEGAL-01 #2), G-201, G-202, G-1 note, SHARED-CHANGES LEGAL-01 #1 to #3.

**What is sent to the AI provider (Gemini, server-side only, key from `GEMINI_API_KEY`, never committed).** Per profiling turn (`chat`): a fixed instruction; the 14 matter values and labels; the current matter's intake question ids, prompts and option values (the `gender` question and document uploads left out); the brief rows, headline and intake answers earlier turns took from the client's words; and the conversation: the client's messages and the assistant's replies, newest 30. Left out: the scripted lines (the opener carries the first name), the name, email, phone, account id, intake id, documents, anything from the profile or wallet. On Send (`generateBrief`): the existing brief instruction, the matter label, the rows the client confirmed (for S16's example: the matter headline, lease, rent review clause, location) and a document count of 0; never the transcript. What the client types is sent as typed (they may write personal details themselves). Proved by the spec and the live walk: no payload contains the first name, email, phone, sub or intake id.

**Capability checks.** (1) A user can describe a problem and receive a brief without paying: `legal-assistant.contract.spec.ts` "S14 to S16 ..." (topic tap, two typed answers, a quick reply, brief card rows Matter / Lease / Rent review clause / Location, Send; the matter is `awaiting_quote` with every money field null) and the live walk below. (2) A consultant sees the brief before any payment and joins: tested on the Hub with a real admin login (support): `GET /legal/ops/intakes/queue` (summary), `/{id}` (brief rows), `/{id}/assistant`, then the consultant writes and the client's thread shows the consultant and `assistantStopped: true`; "Message Adaora" goes to the consultant with no AI turn. The dashboard screen today is Legal (`wawu-dashboard src/app/(app)/legal/page.tsx`, "awaiting a quote" tile, `LegalRequestDetail`): the matter appears there before payment, but that screen shows no brief and cannot join (G-201), so on the dashboard itself this check is NOT RUN.

**Live seam (V9 locally).** The built AppModule on :5071 (real HTTP, real WAWU ID sign-in on the mock :5072, real `POST /admin/auth/login`), AI provider a recording stand-in: topics, open ("Hi Chidi. ..."), tap, typed, tap, brief, send (`awaiting_quote`, fees null), queue/detail/transcript as support, the dashboard's `GET /legal/ops/requests?status=awaiting_quote` lists it, consultant joins, client sees "Adaora Nnaji", replies; another user gets 404. Output: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/lg01live/live-out.txt` (script `live.js` beside it).

**Counts.** Backend before (main a94f338): gates 16 fail, 34 warn, 76 accepted. After: tsc 0; eslint 0 on every changed file; LEGAL-01 specs 32/32 (23 contract, 9 unit); `src/legal-intake` 45 passed, 3 skipped (the old form spec's real-Gemini tests, no key); protected suite `--fresh HEAD` 253/253, lock unchanged; gates the same 16 fail lines, 37 warn (+3: this task's PROVISIONAL markers), 76 accepted; tripwire 0; `contract:build` stable; migration diff against the schema only main's own `DROP INDEX "ContentPiece_specializations_idx"`. Full suite (own network namespace, fresh seeded DB): 154 suites, 3534 passed, 160 failed, 3 skipped; the failures are in 5 suites this task does not touch: `hub-rate-limits` (needs a non-loopback interface; 22/22 on the host), `admin-payments` (mock sign-in "other side closed" during the run; passes on rerun), `receipt-units` (timing; passes on rerun), `money-pin` (one 5 s timeout at load average about 30; passes with a 60 s timeout), `fintava-stall` (timing; the same test fails 6 of 6 on an `origin/main` export run interleaved with this branch at the same load). Mobile `npm run check` exit 0: tsc 0, lint 0, 43 suites / 754 tests, gates 9 / 195 files / 0 fail, 207 tasks (a first run had one 20 s timeout in `OpenWalletScreen.test.tsx` at load average 35; that file alone 37/37, then the whole check again exit 0). Mobile before-counts were not recorded on a separate checkout (NOT RUN); this task changes only docs and generated contract types there.

**Defaults (agent), owner may override.** (1) Taps: A tenancy problem (property), Register a business (business_registration), Check a contract (contract), Something else (other); the matter starts as `other` and the assistant may re-classify while profiling (answers of the old matter dropped). (2) The opener, "Nothing is charged ..." and "I've sent your brief to a consultant." are written by the server in the design's words, not by the AI. (3) Between Send and the consultant joining, the assistant does not reply; messages wait for the consultant. After payment the existing paid-wait rule applies unchanged. (4) The brief is offered when the AI says it is ready, or after 8 client messages; limits 30 client messages an hour per person and 40 per conversation, counted after the token (PROVISIONAL `LEGAL-ASSISTANT-*`, no `@Throttle`, so the rate-limit spec is unchanged). (5) The AI never answers the gender question. (6) AI text loses em-dashes and is cut to size. (7) The consultant's name shown to the client is the admin record's name. (8) No new AI adapter: the turn uses the existing `chat()` with a JSON-only instruction and a defensive parse; SHARED-CHANGES LEGAL-01 #3 asks for schema mode.

**NOT RUN.** A real model: no `GEMINI_API_KEY` here, so prompt quality, JSON compliance and the safety review the analysis asked for are unproved; unblocked when a non-production Gemini key is in a local `.env` and the S14 to S16 walk is repeated. The dashboard half of check 2 (G-201). Purge of `LegalChatMessage` (G-202, SETTINGS-06). V9 against the droplet (deploy). Screens (LEGAL-02).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
