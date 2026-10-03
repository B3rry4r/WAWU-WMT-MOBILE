---
id: INBOX-09
title: Pause paid questions for creators who stop replying
owner: DEV2
area: INBOX
order: 15
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-13]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-09 · Pause paid questions for creators who stop replying

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Creators who leave too many paid questions unanswered are warned, then paused for 7 days (R-13). Additive only.

## Scope

Rolling 30-day unanswered rate, warning and switch-off per R-13, enforced when sending and shown on the profile.

## Capability checks

- [ ] A creator at 21% unanswered over 30 days is warned once; at 31% paid questions switch off for 7 days and a fan sees I8. The thresholds (20% and 30%) come from config.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

Builder, 3 Oct 2026, branch `wmt/INBOX-09` in both repos (wawu-backend `5d72d9b`, from main `1e6b807`; main unchanged at hand-over, so nothing to merge).
- **Rule built (R-13, config `src/direct-message/paid-dm-pause.config.ts`):** of the paid questions sent in the last 30 days whose outcome is known (answered, or past the deadline; the sweep need not have run), the share left unanswered. At or over 20% the creator is warned, once per crossing; at or over 30% paid messages are off for 7 days, fixed (never extended), ending by the clock alone. After a pause the count restarts from its end. Lines, window and pause length come from `PAID_DM_*` config; defaults are R-13's. Compared in integers.
- **Routes (new):** `GET /paid-dm/standing` (creator: state ok/warning/paused, share, counts, lines, `pausedUntil`), `GET /paid-dm/creators/:wawuId/availability` (anyone signed in: `paused`, `pausedUntil`, for I8). **Enforcement:** the live `POST /dm/:creatorWawuId/send` answers 403 `reason.code: paid_messages_paused` (+ `pausedUntil`) before any charge; unchanged for everyone else (ticket requires it; SHARED-CHANGES `INBOX-09 #1`). A cron sweep (`paid-dm-standing.sweep.ts`, every 10 min) warns, pauses and resumes without anyone looking. Two notification kinds, `paid_dm_warning` and `paid_dm_paused`. No migration: the existing `CreatorNoResponseTracker` row holds the state, written only when the standing moves, so `GET /dm/response-stats` reads the same for everyone else.
- **Files (backend):** `src/direct-message/{paid-dm-pause.config,paid-dm-pause.service,paid-dm-standing.sweep}.ts`, `paid-dm.controller.ts`, `paid-dm-view.type.ts`, `direct-message.{module,service}.ts`, `src/notification/notification-event.ts`, `contract/openapi.json` (regenerated, +128 lines, 0 removed), `src/direct-message/tests/paid-dm-pause.contract.spec.ts` (30 tests).
- **Check "21% warned once; 31% switches off for 7 days and a fan sees I8":** the spec over HTTP with mock WAWU ID tokens. 19, 20, 21, 29, 30, 31 of 100 give ok, warning, warning, warning, paused, paused; 21% sends exactly one `paid_dm_warning` across 12 parallel and 3 later reads, and a second only after the share drops under 20% and crosses again; 31% refuses a fan with 403 `paid_messages_paused` and an end time 7 days out, creates no `PendingCharge`, and `availability` shows `paused` and the end to a fan. Config: the lines, window and pause length moved by env and an invalid value is ignored.
- **State transitions under parallel requests:** 12 simultaneous sends at the crossing give 12 refusals, one pause, one notification, one end time; 16 simultaneous evaluations with the row already stored give one warning or one pause (checked: with the row lock removed this test fails); a pause ending while 10 look at once resumes once; more misses, more looks and the sweep never move the end. Boundaries: question sent exactly 30 days ago counts, 1 ms older does not; a deadline at the exact instant is still answerable, 1 ms later it lapsed; paused 1 ms before the end, open at it (and `assertAccepting` agrees); 1 of 5 is 20% and warns, 1 of 6 is 16.67% and does not; a paused creator can still reply to waiting questions.
- **Gates before (main `1e6b807`) / after:** tsc 0 / 0; eslint (no --fix) 4,460 problems (3,610 errors, 850 warnings) / 4,459 (3,609 / 850), new files 0; `gates/run.py` 9 run, 16 fail, 14 warn, 76 accepted on 656 files / 16 fail, 15 warn (the new PROVISIONAL), 76 accepted on 660; `check_baseline.py` 108 entries, all owned / same; `test:contract` (own Postgres :5454, `wawu_hub_test`, seeded, own mock :4001) after: 138 of 138 suites, 3,327 passed, 3 skipped. Before: a detached checkout of main in `/var/tmp` ran 115 of 137 suites with 22 failing money and KYC suites (401 from the mock, not diagnosed, an environment fault of that checkout; the same suites pass on the branch); NOT RUN as a clean before. `scripts/protected-routes/run.sh --fresh HEAD`: 244 required tests passed (253 in 2 suites). Mobile `npm run check`: before exit 1 (485 tests, 1 timed out in a cold first run of `OpenWalletScreen.test.tsx`, unrelated), after exit 0 (28 suites, 485 tests, gates 9 run on 123 files, 0 findings); no app code changed.
- **Filed:** G-77 (owner: minimum questions before the share counts, at-or-over, which questions count), G-78 (web and the profile routes still show a paused creator as on; the app reads the new routes; two new notification kinds). SHARED-CHANGES `INBOX-09 #1` (contract and the one live-route refusal).
- **Provisional (owner):** `PROVISIONAL(PAID-DM-MIN-QUESTIONS)` default 1: a creator's first missed question reads as 100% and pauses them (R-13 read literally). Owner to name a minimum (G-77).
- **Not done:** `PATCH /creator/dm-settings` is not gated (the send refusal holds whatever the settings say, and gating it changes a protected route); refund and money handling untouched (INBOX-17); the screens I8, I21 to I23 are INBOX-11 and INBOX-12 (G-78). `npm run api` not run (it copies backend main, which lacks these routes until merge).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
