---
id: BILLS-05
title: Bill reminders and the month view
owner: DEV1
area: BILLS
day: later
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [BILLS-06]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [S27, S28, S29, S30, S31, S32]
---
# BILLS-05 · Bill reminders and the month view

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- The design: `python3 scripts/design/render_design.py S27 S28 S29 S30 S31 S32` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled after launch.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| S27 | This month | Bill reminders for October 2026: 'Still to pay this month ₦38,200', 'In your wallet ₦485,250', list: DStv Compact on WAWU ₦15,700 Paid (Oct 05), Ikeja Electric on WAWU ₦10,500 in 3 days (Oct 28), House rent reminder-only ₦25,000, Gym subscription reminder-only ₦2,700; Plus to add. |
| S28 | New reminder | New reminder, 'Bill on WAWU' tab: what (Ikeja Electric · meter), usual amount ₦10,500, due every month on the 28th, Remind me (on the day / 1 / 3 days / a week before), Save. |
| S29 | Reminder | Lock-screen push notification 3 days before: 'Ikeja Electric is due in 3 days · ₦10,500 on the 28th. Tap to pay from your wallet.' |
| S30 | Pay from the reminder | Prefilled pay sheet over S27: Ikeja Electric, meter, due 28 Oct, amount ₦10,500, Pay from wallet; then PIN (S6) and receipt like S7. |
| S31 | Not on WAWU | 'Anything else' tab: name Gym membership, amount ₦2,700, due the 30th, 'We remind you. You pay it yourself, then tap Mark as paid.' |
| S32 | No reminders yet | Empty state: 'Plan your month · Add your bills and subscriptions once. We remind you before each one is due.' Add a reminder. |

## Capability checks

- [ ] **S27**: a user can add a reminder (S28); tap a due WAWU bill (S30); mark a reminder-only item paid.
- [ ] **S28**: a user can choose saved biller; set amount, due day, lead time; Save reminder.
- [ ] **S29**: a user can tap notification (S30).
- [ ] **S30**: a user can Pay ₦10,500.
- [ ] **S31**: a user can Save reminder; Mark as paid later.
- [ ] **S32**: a user can Add a reminder.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S29, S31, S32.

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| S27 | missing | No bill-reminder capability at all: no model (backend-models.txt has none), no route (backend-routes grep 'reminder' = none for bills), grep -i 'reminder' in src finds only verification-reminder.service.ts and NotificationSettings.dmReminders. |
| S28 | missing | No bill-reminder capability at all: no model (backend-models.txt has none), no route (backend-routes grep 'reminder' = none for bills), grep -i 'reminder' in src finds only verification-reminder.service.ts and NotificationSettings.dmReminders. Needs BillReminder {userId, kind on_wawu|external, billerCode, itemCode, customerRef, name, amount, dueDay, leadDays, lastPaidPeriod} + CRUD routes. |
| S29 | missing | No push-notification infrastructure (only in-app Notification rows) and no reminder scheduler job. |
| S30 | missing | Depends on reminders (missing) and on wallet-funded bill payment (missing). |
| S31 | missing | No bill-reminder capability at all: no model (backend-models.txt has none), no route (backend-routes grep 'reminder' = none for bills), grep -i 'reminder' in src finds only verification-reminder.service.ts and NotificationSettings.dmReminders. |
| S32 | missing | No bill-reminder capability at all: no model (backend-models.txt has none), no route (backend-routes grep 'reminder' = none for bills), grep -i 'reminder' in src finds only verification-reminder.service.ts and NotificationSettings.dmReminders. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S27: Still to pay ₦38,200
- S27: In your wallet ₦485,250
- S27: DStv Compact ₦15,700
- S27: Ikeja Electric ₦10,500
- S27: House rent ₦25,000
- S27: Gym membership ₦2,700
- S28: Ikeja Electric usual amount ₦10,500, due the 28th

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
