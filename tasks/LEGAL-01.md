---
id: LEGAL-01
title: Legal starts as a chat
owner: DEV3
area: LEGAL
order: 28
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-14]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# LEGAL-01 · Legal starts as a chat

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

Branches: backend and this repo, `wmt/LEGAL-01-b` (pushed under this name because `wmt/LEGAL-01` already holds another session's complete build of this task, backend a29c4dd and mobile 51c3876, with its own `LegalIntakeMessage` table and `/legal/assistant` routes; the two cannot both merge, so the lead picks one). Built by an agent session; verified by none yet.

**What was built (backend, additive).** The chat that writes the brief, before any payment: eight new routes under `/legal/intake/assistant` (`options`, `current`, start, `:id`, `:id/messages`, `:id/reply` to retry an unanswered message, `:id/brief`, `:id/send`). The WAWU Legal Assistant takes the problem in the person's words; the brief (facts card plus the analysis, same `LegalBrief` the form writes) is stored on the intake and shown to be checked; sending it opens the matter `awaiting_quote` through the same `openRequest` the form uses (claimed with a conditional update, so two sends open one matter), with nothing charged and no price. The matter chat (`/legal/intake/chat/:requestId`) now opens before payment for a matter that came from an intake, one thread across the handover; a consultant writing ends the assistant's turn as before, and the thread names the consultant's first name (`consultantName`, for "Adaora joined"). The matter options and quick replies come from `GET /legal/intake/assistant/options` as named schemas (G-1, partly closed for these routes). Files: `src/legal-intake/assistant/*`, `legal-thread.ts`, `legal-chat.service.ts`, `legal-intake.service.ts`, the controller, module and DTOs, migration `20261006120000_legal_assistant_chat`, `src/account-purge/account-data-map.ts`, `src/data-export-request/data-export-sections.ts`, `scripts/enrich-contract.js`, `contract/openapi.json` (regenerated), spec `src/legal-intake/tests/legal-assistant.contract.spec.ts` (53 cases).

**Capability checks.**
1. A user can describe a problem and receive a brief without paying: spec (Gemini HTTP stand-in, as the protected suite does) and a live walk on the built app (port 4160): start, send, brief, send to a consultant; the matter has no fee, payment or quote. With the stand-in only; the same flow on the real model is **NOT RUN** (no `GEMINI_API_KEY`; the live case in the spec is written and skipped). Unblocks it: a Gemini key in `.env`.
2. A consultant sees the brief before any payment: proven on the API with a real admin login (spec and live walk): `GET /legal/ops/intakes/queue`, `/:id` (brief and facts), `/chat/:requestId` (whole conversation) and a reply that makes `consultantJoined` true; the assistant then makes no model call. The screen: today's dashboard legal tooling is the Legal requests screen (`legalOpsRequests`, `GET /legal/ops/requests`, protected), which lists the sent matter but redacts `details`; the dashboard calls no `legal/ops/intakes` route (protected registry), so the brief is not on that screen yet: **gap G-210**. The dashboard repo is not attached here, so no dashboard screen was opened (**NOT RUN**). Unblocks it: a `wawu-dashboard` task over the intake routes.

**Probed live (no 500 from this feature):** null, array, string and non-JSON bodies; body null, number, object, 4001 characters, only spaces, a NUL (removed), a lone surrogate; bad and upper-case ids; no and garbage tokens; matter null, array, unknown. Found, not mine: a body over the 100 KB parser limit answers 500 on every route (open SHARED-CHANGES row KYC-02 #3, `src/common` is fenced).

**Checks, before and after.** Backend `tsc --noEmit`: clean both. Gates (`scripts/gates/run.py`): before 16 fail, 51 warn, 76 accepted (799 files); after 16 fail, 52 warn, 76 accepted (803 files); the +1 warn is `PROVISIONAL(ASSISTANT-MAX-CLIENT-MESSAGES)`, the cap of 60 client messages per chat; `check_baseline.py` ok. Protected routes (`run.sh --fresh`): main 244 passed, branch 244 passed, both exit 0. Contract suite: main 126 of 162 suites pass (36 fail, run while other runs shared the machine); branch 155 of 163 pass, 3907 tests pass, 75 fail. Re-run alone on main, the 7 failing suites fail the same 72 tests as on the branch (Fintava and mail outbox in this sandbox); the other 3 branch failures are `fintava-stall` timing, which passed alone on main and is not touched. New: 53 tests (52 pass, 1 skipped for the key). Mobile `npm run check`: before typecheck and lint clean, jest 753 of 754 (one 20 s timeout under load in `OpenWalletScreen.test.tsx`, passes alone, 37 of 37), gates 0 fail, tasks 207 ok; after (main merged in): exit 0, 43 suites, 754 of 754 tests, gates 0 fail, tasks 207 ok (this repo changed docs only).

**Filed.** SHARED-CHANGES `LEGAL-01 #1` (schema, migration, enrich script, contract). BACKEND_GAPS G-210 (dashboard cannot show the brief) and G-211 (nothing tells a consultant a brief arrived; needs G-69's mail provider); G-1 note. G-144 to G-149 and the ids up to G-202 taken on other branches were avoided.

**Defaults (agent), owner may override.** The cap of 60 client messages; the greeting text (fixed, not a model call); `matter` starts as "other" and the model's reading replaces it when it names a real matter; a brief older than the person's last message cannot be sent; the retry route; the assistant's replies have em-dashes replaced (R-5). Not done: the mobile screens (LEGAL-02); a mobile contract regeneration (the routes are not on main until the backend merges; LEGAL-02 runs `npm run api` then).

## Verifier report

Verified 7 Oct 2026 by an independent agent session (did not build it). Checked as the branch will land: `origin/main` merged into both `wmt/LEGAL-01-b` branches (backend `adf26db` + main `4892a59` = merge `f9bd27b`, conflict in `scripts/enrich-contract.js` kept both sides, `contract/openapi.json` regenerated with `npm run contract:build`: no change; mobile `3bdd808` + main `ce161d6`, `docs/PROGRESS.md` taken from main then `npm run tasks -- --write`). Own databases (`wawu_hub_test_*_legal_01b_v`), ports 4175 (API) and 4176 (mock WAWU ID). Note: the prompt named backend head `a29c4dd`; that is the other build on `wmt/LEGAL-01`. This build's backend head was `adf26db`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Mobile `npm run check` exit 0: typecheck, lint, jest 46 suites 797 of 797, gates 216 files scanned 0 fail 0 warn 0 accepted, tasks 208 ok. Backend `tsc --noEmit` clean. Gates: main 832 files, 16 fail, 51 warn, 76 accepted; branch 836 files, 16 fail, 52 warn, 76 accepted; the fail lists are identical, the one new warn is `PROVISIONAL(ASSISTANT-MAX-CLIENT-MESSAGES)` at `src/legal-intake/assistant/legal-assistant.ts:88`; `check_baseline.py` ok. ESLint on the changed non-spec files: clean. The new spec carries the same `no-unsafe-*` supertest errors every contract spec has (main's `legal-intake.contract.spec.ts`: 67). |
| V2 Contract | failed (D2, D3, D4) | `legal-assistant.contract.spec.ts`: 53 cases, 52 pass, 1 skipped (needs `GEMINI_API_KEY`); with `legal-intake.contract.spec.ts`: 65 pass, 4 skipped. Contract: the eight routes, six named schemas, `consultantName` on `ChatThreadView`, regenerated file identical after the merge. Live probes, none 500 from this feature: bodies null, array, string, non-JSON, `{}`; `body` null, number, object, array, spaces, NULs only (400), NUL inside (stored without it), lone surrogate, 4000 (201) and 4001 (400) characters, 90 KB (400); `matter` null, array, object, unknown, upper case; bad, upper-case and unknown ids; no, garbage and admin tokens on user routes (401); another user on every route (403); form `answers` and `complete` on a chat intake (409); ops queue `status` garbage, empty, array, `in_progress` (400). Bodies over 100 KB answer 500 on these routes and on main's own `POST /legal/intake` (open row KYC-02 #3, not this feature). Five parallel starts: one intake. Five parallel sends: one matter. Cap: 59 seeded, 4 parallel messages: 60 stored, then 409. |
| V3 Regression | passed | Protected suite `run.sh --fresh`, lock `origin/main`: main `4892a59` 253 of 253, branch `f9bd27b` 253 of 253, both exit 0. Full contract suite (`npm run test:contract`, each on its own fresh seeded database, shared machine at load 12): main 12 failed suites, 152 failed tests; branch 12 and 189. The branch-only failures (42 `fintava-stall`, 1 `money-pin` log scan, 1 `receipt-units` 300 ms timing) re-run alone: all pass except the 4 `receipt-units` Unicode digit tests, which fail identically on main. No failure is in a legal file. |
| V4 Field trace | failed (D2, D3) | Brief: written by `POST .../:id/brief` into `LegalIntake.brief`, read by the assistant view, `GET /legal/ops/intakes/:id`, the ops queue summary, and copied into `LegalRequest.details.brief` on send, which the unpaid matter chat's instruction reads (checked in the database). Matter: quick reply `property` to `LegalIntake.matter` to `brief.matter` to service `property-documentation`. `consultantName`: the first consultant message's `authorAdminId` to `AdminUser.name`, shown in both the assistant view and the matter thread. Cross-user: the client's words reach the consultant (queue, detail, thread) and the consultant's reply reaches the client's thread. The dashboard's `GET /legal/ops/requests` shows the matter with `details: null` (G-210). But what the person writes does not always reach the brief (D2, D3). |
| V9 Live seam | passed (model NOT RUN) | Built branch app on :4175. Client signed in through mock WAWU ID `/auth/login` (no injected token); three admins through `POST /admin/auth/login` (superadmin "Adaora Okafor", support "Bola support", finance). Without a key the app boots and every model call is a plain 503 that keeps the message (`live-nokey`); with a verifier-only Gemini HTTP stand-in loaded by `node -r` from outside the repo: retry, reply, ready marker, brief, send, idempotent re-send, 409 after send, matter `awaiting_quote` with `consultationFee`, `quoteAmount`, `consultationPaidAt`, `servicePaidAt` all null and no `PendingCharge` row; the client reads the same thread on `/legal/intake/chat/:requestId` before payment; support's reply sets `consultantJoined` and `consultantName: "Bola"`; the client's next message gets no assistant reply; finance gets 403. The real model is NOT RUN (no `GEMINI_API_KEY`); unblocked by a Gemini key in `.env`. |

**Capability checks.**
1. A user can describe a problem and receive a brief without paying: **NOT RUN on the real model** (no `GEMINI_API_KEY`; unblocked by one in `.env`). The flow itself works end to end with the stand-in (V9) and nothing is charged; but see D2 and D3, where the brief the person receives leaves out what they said.
2. A consultant who joins from today's legal admin tooling in wawu-dashboard sees the brief before any payment: **NOT RUN** as written. The API half passed live with real admin logins (queue, detail with brief and facts, whole thread, reply before payment). The dashboard repo is not in this checkout, and by the protected registry the dashboard calls none of the `legal/ops/intakes` routes while its Legal requests screen gets `details: null`, so today's dashboard cannot show the brief (G-210). Unblocked by a `wawu-dashboard` task over the intake routes.

**The Gemini stand-in (asked to judge).** Test scaffolding only, not a forbidden mock. It lives in the spec file (`geminiDouble`, swapped into `global.fetch` only when `GEMINI_API_KEY` is unset) and answers only Gemini's host. Production code has one adapter (`RealGeminiAdapter`), no fallback, no flag, and no copy of canned text: with no key the live app answers 503 and saves the message. The protected suite on main does the same (`test/protected-routes/providers.ts`). R-20 ("no mocks, no stand-ins") is about Fintava money. The one mismatch is `src/common/ai/ai.module.ts` saying "Tests run against it with a test key", and that comment was already out of date on main.

**Findings.**
- **D1 · defect (merge).** The migration `20261006120000_legal_assistant_chat` sorts before three of main's migrations (`20261006133700_ads_event_counts`, `20261006200000_me_saved_progress_targets`, `20261007090000_inbox_feed_index`). `prisma migrate deploy` did apply it on a database already at main (checked), but the rule is that a migration sorts after main's newest. SHARED-CHANGES `LEGAL-01 #1` is wrong in two places: it says the timestamp sorts after main's newest, and it names branch `wmt/LEGAL-01` (this build is `wmt/LEGAL-01-b`, and `wmt/LEGAL-01` is the other build). Fix: rename the migration to a timestamp after `20261007090000` and update the row.
- **D2 · defect.** The brief is written from the last 40 messages only (`messages.slice(-HISTORY_WINDOW)` in `writeBrief`), but a person may send 60. Once they have sent about 20 (each gets a reply), the problem they first described drops out of the brief, and the brief still shows `briefCurrent: true`. Shown live: with 30 client messages, the first one ("FIRST: my landlord changed the locks and my court date is 12 October") was not in the transcript sent to the model, which started at "detail 6".
- **D3 · defect.** A message sent while the brief is being written is not in it, yet the brief counts as current and can be sent. `writeBrief` reads the transcript before the model call but stamps `generatedAt` after it, and `briefCurrent` and `sendToConsultant` compare the last client message with `generatedAt`. Shown live with a 6 s model: brief started 03:01:42.7, the person's message "the landlord changed the locks yesterday and I have a court date on Friday" saved at 03:01:43.8, `generatedAt` 03:01:48.8, then `briefCurrent: true` and send 200. The consultant gets a summary without the court date. The design keeps the composer open under the brief (S16, "Add anything else").
- **D4 · defect (low).** A double tap on "Send to a consultant" opens one matter (good), but the losing request gets `409 "This intake is already complete and has been sent to a consultant."` in 5 of 6 two-request races. The builder report and the service say sending twice returns the same matter, and the app would show an error for a send that worked. `openRequest`'s claim fails and the 409 is not turned back into the converted view.
- **D5 · defect (low).** `plainDashes` replaces en-dashes as well as em-dashes with ", ", including inside the facts the person stated: "Rent went from 500,000–800,000 for 2024–2025" becomes "Rent went from 500,000, 800,000 for 2024, 2025" (run against the built code). R-5 bans em-dashes only. A range in a brief now reads as two figures.
- **U1 · unclear (owner, already decided).** `wmt/LEGAL-01` holds a second, independent build (backend `ca1fd42`, migration `20261007120000_legal_assistant`, `/legal/assistant` routes) with its own `LegalIntakeMessage` model. The two cannot both merge. The owner chose this (`-b`) build, so `wmt/LEGAL-01` should be closed rather than merged.
- Not findings against this task, for LEGAL-02 (which owns the screens and the backend behind them): S17 shows the consultant's full name ("Adaora Nnaji · Consultant") but the API gives only the first name. S14 greets by name ("Hi Lennox") in two bubbles, but the served greeting is one unnamed message and adds "I'm not a lawyer and I can't give legal advice". S17's "I've sent your brief to a consultant." is not a stored message, so the app must draw it. Also, a missing or null `body` is refused with "body must be shorter than or equal to 4000 characters", the same decorator order as main's `SendChatMessageDto`.
- Checked and clean: gap ids G-210 and G-211 appear on no other branch or main except as references to this build. The G-1 note is accurate. `LegalIntakeMessage` is OWNED in the purge map and is in `EXPORT_EXCLUDED`. The form routes keep their behaviour for existing rows (`channel` null), and the protected suite is unchanged. The greeting's promise (nothing charged, no price before a consultant reads it) holds: the matter opens `awaiting_quote` with no fee, quote or payment, and R-14 puts prices in admin.

Status set back to `building` (D1 to D5 open).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
