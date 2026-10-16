---
id: HOME-16
title: Daily TGIF notification
owner: YOU
area: HOME
order: 260
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SETTINGS-01, HOME-11, INBOX-03]
decisions: [R-59]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-16 · Daily TGIF notification

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 1 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below. Nothing blocks it; ready to schedule.
- **History:** none yet. Reports go to tasks/history/HOME-16.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-59 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

People who keep "TGIF each morning" on (Z2) get a notification every morning; tapping it opens the TGIF reader (H29). The Home TGIF card is gone, so this is how TGIF reaches Home (R-59, H36).

## Scope

- A scheduled job (the existing scheduler, `src/scheduler/`) creates one `tgif_daily` notification per opted-in person each morning, with the title of that day's TGIF, and sends the phone push through INBOX-03. The time of day is a setting (`tgif_notification_time`, PROVISIONAL, default 07:00 Africa/Lagos, owner may override). Idempotent per person per day.
- `GET` and `PATCH /settings/tgif` keep their shape; the switch now means "send me TGIF each morning". Existing values are kept.
- App side: tapping the notice or the push opens the reader route (`src/app/tgif.tsx`); H36 draws it as a notification over Today. No card is drawn on Today (that removal is DV2-RM).

## Capability checks

- [ ] A person with TGIF on gets exactly one notice a day; turning it off in Settings stops the next one.
- [ ] Tapping the notice opens that day's reader.
- [ ] A day with no TGIF sends nothing.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
