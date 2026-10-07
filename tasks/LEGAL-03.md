---
id: LEGAL-03
title: Legal consultations and deliverables
owner: DEV3
area: LEGAL
order: 70
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-14]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# LEGAL-03 · Legal consultations and deliverables

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

S18-S26: phone, video and in-person options, slots, several delivered files.

## Scope

Phone medium, per-medium length, slots; several deliverables posted into the chat; prices set by WAWU in admin (R-14).

Admin sets the prices through LEGAL-07's screens.

## Capability checks

- [ ] A user books a slot that is then unavailable to others.
- [ ] Two delivered files both appear in the chat.

## Builder report

**Built (backend `wmt/LEGAL-03`; additive; no mobile screen, the task is `backend-endpoint`).** Phone as a third medium beside video (`zoom`) and in-person, a length per medium, a calendar served per medium at that medium's length, several delivered files each posted into the chat, and prices set by WAWU in admin (R-14). Routes: `GET /legal/consultation/options`, `GET /legal/consultation/slots?medium=zoom|phone`, `POST` and `GET /legal/requests/:id/booking`, `GET /legal/requests/:id/deliverables`; ops `POST /legal/ops/requests/:id/deliverables`, `GET /legal/ops/prices`, `PUT /legal/ops/prices/consultations/:medium`, `PUT /legal/ops/prices/services/:serviceCode`. Stored: see SHARED-CHANGES "LEGAL-03 #1" (migration `20261009120000_legal_consultations`: enum values, one nullable column, three tables; seeded so the web's catalogue and booking answer byte for byte as before). Reuse: the held-hour, availability and chat code of the existing legal module is extended, nothing of LEGAL-01's assistant (backend #75) is duplicated; the merge with LEGAL-01's `legal-chat.service.ts`, `legal-intake.module.ts` and `notification-event.ts` auto-merged and both sides' specs pass.

**This session (resume after a usage-limit crash).** Merged origin/main into both worktrees (merge, no conflicts in the backend; mobile conflicted only on BACKEND_GAPS.md, resolved keeping both rows). Migration renamed again, now `20261009120000_legal_consultations`, after main's newest (`20261008100000_admin_ads_audit`) and after the newest folder on every open origin `wmt/*` branch (`20261009090000_push_tokens`, INBOX-03). My gap id G-231 was taken on main by LEGAL-01, so it is now G-269 (highest on main and every wmt branch was G-268). Review found one real defect, fixed: a lone surrogate in a delivered file name was accepted (the NUL case was already refused); it is now a 400 (`DeliveredFileDto.fileName`), with two new rows in the task's own spec (a lone surrogate name; slots `medium=` with `%00`, `%ED%A0%80`, `%FF`, blank, `ZOOM`, all 400). `npm run contract:build` after the merge leaves `contract/openapi.json` unchanged.

**Capability checks.** (1) A user books a slot that is then unavailable to others: `legal-consultations.contract.spec.ts`, "a booked hour is held": the booked start reads `available: false` for another user and for every overlapping start at that medium's length; two people picking the same hour at the same moment, exactly one gets it; two overlapping calls at different starts, exactly one; releasing lets it go. (2) Two delivered files both appear in the chat: "posts both files into the chat, in order, and lists them for the client" (two `LegalChatMessage` rows, two `LegalDeliverable` rows, listed to the client, 404 to anyone else).

**Counts (backend, local DB `wawu_hub_test_legal_03`, after the merge).** tsc 0. `src/legal` specs 236 passed, 3 skipped (85 in the consultations spec, 2 new). `account-data-map` and `data-export-map` specs 9/9. `src/legal-intake` (LEGAL-01's assistant specs) pass with the merge. Protected suite `scripts/protected-routes/run.sh --fresh`: 253 run, 244 of 244 required passed (before: 244 of 244). Gates: 9 run, 874 files, 16 fail, 56 warn, 76 accepted, `check_baseline.py` clean; no fail line is in a file this branch touches (the 16 are main's: forks, deferrals, the wallet mock import). eslint: `src/legal` non-test files show 4 prettier errors, all in files this branch does not change (`availability.ts`, `legal.controller.ts`); no lint run with `--fix`.

**NOT RUN.** `src/data-export-request/tests/data-export.contract.spec.ts` (14 of its tests fail here at `fulfil()` because the email goes through WAWU ID on :4001, which is not running; the failure is in sending the mail, not in the sections this branch added, and the data-export-map spec covers them). A paid consultation end to end (Flutterwave and Fintava keys are not here; the web booking path is covered by the protected suite and the app's pay path is MONEY work). Mobile `npm run check` exits 0 (this branch changes only BACKEND_GAPS.md, SHARED-CHANGES.md, the task file, LOG and generated lists in the mobile repo). Mobile `npm run api` is not run: the new routes are on the backend branch, not main, so the contract copy waits for the merge (as ME-10 #2).

**Not done, by design.** The admin screens that set the prices are LEGAL-07's. The consultation rota (who is free when) has no source: the calendar is every weekday on the hour, 09:00 to 16:00 Lagos, 21 days (G-269). Phone has no price row until WAWU sets one, so it is not offered until then.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
