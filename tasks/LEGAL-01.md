---
id: LEGAL-01
title: Legal starts as a chat
owner: DEV3
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

Branches: backend `wmt/LEGAL-01` (adf26db), this repo `wmt/LEGAL-01`. Built by an agent session; verified by none yet.

**What was built (backend, additive).** The chat that writes the brief, before any payment: eight new routes under `/legal/intake/assistant` (`options`, `current`, start, `:id`, `:id/messages`, `:id/reply` to retry an unanswered message, `:id/brief`, `:id/send`). The WAWU Legal Assistant takes the problem in the person's words; the brief (facts card plus the analysis, same `LegalBrief` the form writes) is stored on the intake and shown to be checked; sending it opens the matter `awaiting_quote` through the same `openRequest` the form uses (claimed with a conditional update, so two sends open one matter), with nothing charged and no price. The matter chat (`/legal/intake/chat/:requestId`) now opens before payment for a matter that came from an intake, one thread across the handover; a consultant writing ends the assistant's turn as before, and the thread names the consultant's first name (`consultantName`, for "Adaora joined"). The matter options and quick replies come from `GET /legal/intake/assistant/options` as named schemas (G-1, partly closed for these routes). Files: `src/legal-intake/assistant/*`, `legal-thread.ts`, `legal-chat.service.ts`, `legal-intake.service.ts`, the controller, module and DTOs, migration `20261006120000_legal_assistant_chat`, `src/account-purge/account-data-map.ts`, `src/data-export-request/data-export-sections.ts`, `scripts/enrich-contract.js`, `contract/openapi.json` (regenerated), spec `src/legal-intake/tests/legal-assistant.contract.spec.ts` (53 cases).

**Capability checks.**
1. A user can describe a problem and receive a brief without paying: spec (Gemini HTTP stand-in, as the protected suite does) and a live walk on the built app (port 4160): start, send, brief, send to a consultant; the matter has no fee, payment or quote. With the stand-in only; the same flow on the real model is **NOT RUN** (no `GEMINI_API_KEY`; the live case in the spec is written and skipped). Unblocks it: a Gemini key in `.env`.
2. A consultant sees the brief before any payment: proven on the API with a real admin login (spec and live walk): `GET /legal/ops/intakes/queue`, `/:id` (brief and facts), `/chat/:requestId` (whole conversation) and a reply that makes `consultantJoined` true; the assistant then makes no model call. The screen: today's dashboard legal tooling is the Legal requests screen (`legalOpsRequests`, `GET /legal/ops/requests`, protected), which lists the sent matter but redacts `details`; the dashboard calls no `legal/ops/intakes` route (protected registry), so the brief is not on that screen yet: **gap G-210**. The dashboard repo is not attached here, so no dashboard screen was opened (**NOT RUN**). Unblocks it: a `wawu-dashboard` task over the intake routes.

**Probed live (no 500 from this feature):** null, array, string and non-JSON bodies; body null, number, object, 4001 characters, only spaces, a NUL (removed), a lone surrogate; bad and upper-case ids; no and garbage tokens; matter null, array, unknown. Found, not mine: a body over the 100 KB parser limit answers 500 on every route (open SHARED-CHANGES row KYC-02 #3, `src/common` is fenced).

**Checks, before and after.** Backend `tsc --noEmit`: clean both. Gates (`scripts/gates/run.py`): before 16 fail, 51 warn, 76 accepted (799 files); after 16 fail, 52 warn, 76 accepted (803 files); the +1 warn is `PROVISIONAL(ASSISTANT-MAX-CLIENT-MESSAGES)`, the cap of 60 client messages per chat; `check_baseline.py` ok. Protected routes (`run.sh --fresh`): main 244 passed, branch 244 passed, both exit 0. Contract suite: main 126 of 162 suites pass (36 fail, run while other runs shared the machine); branch 155 of 163 pass, 3907 tests pass, 75 fail. Re-run alone on main, the 7 failing suites fail the same 72 tests as on the branch (Fintava and mail outbox in this sandbox); the other 3 branch failures are `fintava-stall` timing, which passed alone on main and is not touched. New: 53 tests (52 pass, 1 skipped for the key). Mobile `npm run check`: before typecheck and lint clean, jest 753 of 754 (one 20 s timeout under load in `OpenWalletScreen.test.tsx`, passes alone, 37 of 37), gates 0 fail, tasks 207 ok; after: see the pull request (this repo changed docs only).

**Filed.** SHARED-CHANGES `LEGAL-01 #1` (schema, migration, enrich script, contract). BACKEND_GAPS G-210 (dashboard cannot show the brief) and G-211 (nothing tells a consultant a brief arrived; needs G-69's mail provider); G-1 note. G-144 to G-149 and the ids up to G-202 taken on other branches were avoided.

**Defaults (agent), owner may override.** The cap of 60 client messages; the greeting text (fixed, not a model call); `matter` starts as "other" and the model's reading replaces it when it names a real matter; a brief older than the person's last message cannot be sent; the retry route; the assistant's replies have em-dashes replaced (R-5). Not done: the mobile screens (LEGAL-02); a mobile contract regeneration (the routes are not on main until the backend merges; LEGAL-02 runs `npm run api` then).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
