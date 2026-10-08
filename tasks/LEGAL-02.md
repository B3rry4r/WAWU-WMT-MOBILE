---
id: LEGAL-02
title: Legal: chat, profiling, brief, consultant joins
owner: DEV3
area: LEGAL
order: 66
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [LEGAL-01, INBOX-02, UI-02]
decisions: [R-14, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [S14, S15, S16, S17]
---
# LEGAL-02 · Legal: chat, profiling, brief, consultant joins

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py S14 S15 S16 S17` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for S14, S15, S16, S17, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Book (S17) is added by LEGAL-04 (docs/WORKFLOW.md section 7).

## Artboards

- **S14 · Legal chat**: WAWU Legal Assistant opening chat: 'Tell me what's going on… then a consultant picks it up. Nothing is charged, and no price is quoted until a consultant has read it.' Quick replies: A tenancy problem / Register a business / Check a contract / Something else.
- **S15 · Profiling**: Assistant asks follow-ups about a 60% mid-lease rent rise (lease signed? time left? review clause?) with quick replies.
- **S16 · Brief**: Brief card for confirmation: Matter Tenancy · rent increase, Lease signed 14 months left, Rent review clause Not sure, Location Lekki, Lagos; 'Send to a consultant · Nothing is charged yet.' Add anything else.
- **S17 · Consultant joins**: Handover: 'Adaora joined. The assistant has stopped replying.' Consultant message, 'Book a consultation · Video, phone or in person', Book / Message Adaora.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- S17: Book (opens S18): added by LEGAL-04

## Capability checks

- [ ] **S14**: a user can type the problem; pick a quick reply.
- [ ] **S15**: a user can answer in free text; tap quick replies.
- [ ] **S16**: a user can Send to a consultant; Add anything else.
- [ ] **S17**: a user can Message Adaora, and the consultant's messages arrive without a refresh (INBOX-02).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **S14**: partial. Missing: The backend's assistant chat (legal-chat.service.ts, Gemini) opens ONLY after a consultation is paid (OPEN_FROM = consultation_scheduled…; send() throws 'This conversation opens once your consultation is paid for.'). Free pre-payment profiling is the structured questionnaire legal-intake (matters → answers → complete → brief), not a chat. Board makes chat the intake; needs the assistant reachable on an intake (not a paid LegalRequest) and AI-driven profiling that fills LegalIntake answers.
- **S15**: partial. Missing: Questions exist as a fixed set; no AI that asks them conversationally before payment (see S14).
- **S16**: served.
- **S17**: partial. Missing: Handover-stops-AI is implemented, but the thread is keyed by a LegalRequest and opens only after consultation payment; on the board the consultant joins BEFORE any payment. Consultant name/avatar not modelled (replies are authorRole 'consultant', no consultant id).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S14: 'Nothing is charged, and no price is quoted until a consultant has read it.'
- S16: 'Nothing is charged yet.'

## Designer notes (⚠, unresolved)

- S14: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.

## Builder report

Builder, 8 Oct 2026 (resumed after a crash; the earlier session's work reviewed and kept). Mobile `wmt/LEGAL-02` merged with main `8cabe72`+; backend `wmt/LEGAL-02` (PR #95) merged with backend main `9d90d57`.

- **Files.** New: `src/app/legal.tsx`, `src/features/legal/` (`api.ts`, `model.ts`, `draft.ts`, `look.ts`, `parts.tsx`, `LegalChatScreen.tsx`, tests), `src/features/home/Services.tsx`. Changed: `TodayScreen.tsx` (adds `Services`), `TodayLoading.tsx` (one tile shape per tile present), `HomeScreen.test.tsx` (Legal no longer in the "not built" list; new Legal tile tests). Backend: `legal.thread` live frame (SHARED-CHANGES LEGAL-02 #4).
- **S14 to S16.** One conversation (`/legal/assistant`, LEGAL-01): the opener and taps the Hub writes, typed words and taps sent by id, the brief rows as served, Send to a consultant, Add anything else as a message. Tests in `LegalChatScreen.test.tsx` (S14, S15, S16 blocks).
- **S17.** Header, "joined" notice and name label come from `consultant`/`consultantName`; the notice stands before the consultant's first message wherever it falls (mid-chat). Message Adaora writes to the messages route. New messages arrive without a refresh on the `legal.thread` frame, on live reconnect, on focus and on foreground (tests, and backend spec `live-legal.contract.spec.ts`). Book and its card are LEGAL-04's.
- **States, by real cause.** Loading skeleton; open fails offline / Hub error with Try again; 503 `assistant_unavailable` keeps the message and offers Ask again; 409 busy re-reads; a failed send puts the words back in the box in front of anything typed since, with inline Try again (none where retrying cannot work); double tap and double Send send once (ref guard); a failed refresh keeps the conversation and typed text; drafts kept across leave and return. "Empty": a person with no conversation gets a new one. Model tests kill the state branches (`model.test.ts`).
- **Hub entry (R-41).** The Legal tile in "What would you like to do today?" opens `/legal`, packed from the left (U-H1). EVENTS-01 (PR #14) builds the same row: merge note SHARED-CHANGES LEGAL-02 #5.
- **Pictures.** Web screenshots at 2x, light and dark, against the Hub's legal module on a test DB with a scripted AI stand-in (no GEMINI_API_KEY locally), beside `render_design.py S14 S15 S16 S17`. Not claimed to match; the verifier decides. Known difference: S16's "Nothing is charged yet." is left out (G-470).
- **Gaps filed.** G-470 (S16 line not served), G-471 (no route for the current conversation once sent), G-472 (LEGAL-03 deliverable lines send no live frame). Shared changes LEGAL-02 #1 (`_layout.tsx` guard), #3 (`toApiError` reads `reason.retryAfterSeconds`), #4 (backend live), #5 (services row merge); #2 not needed (contract already current on main).
- **Ran.** Mobile: tsc 0; legal + home jest 107 passed; `npm run check`: typecheck and lint pass, jest 1509 of 1509, gates 0 fail / 0 warn / 0 accepted (366 files), task check failed only because PROGRESS.md was stale from this report's own edit, then `npm run tasks -- --write` and `npm run tasks` pass. Backend: tsc 0; `src/live` + `src/legal-intake` 165 passed, 4 skipped; `src/legal/` + new spec 306 passed; gates 16 fail / 69 warn / 76 accepted on the branch and on main alike (no new finding).
- **NOT RUN.** Native iOS/Android build (web only); a real Gemini assistant (no key locally; profiling pictures used the stand-in).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
