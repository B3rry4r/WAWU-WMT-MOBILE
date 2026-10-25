---
id: EVENTS-11
title: Changing ticket prices on a live event needs a current verification and goes back to review
owner: YOU
area: EVENTS
order: 185
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: [EVENTS-02]
decisions: [R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-11 · Changing ticket prices on a live event needs a current verification and goes back to review

## Current state

As of 16 Oct 2026, from the lead's log (10 Oct) and the branch.
- **Status:** review on its branch (round 5: no open defect). This file on main still says todo.
- **Branches:** mobile `wmt/EVENTS-11` 9fcc932 (the verifier checked 9106928; what changed after: unknown, ask the lead). Backend `wmt/EVENTS-11` b92a591, PR #83.
- **Merged and live:** nothing of this task.
- **Stacked (MERGE-17, 18 Oct 2026):** the backend (`wmt/EVENTS-11` `71117e4`, with its migration `20261025090000_event_ticket_type_retired` and its lock change) is in backend `wmt/MERGE-17` through `wmt/S9` (EVENTS-12 and FIX-12 sit on it; the S9 verifier ran the suite on it). This mobile file and the mobile branch `wmt/EVENTS-11` are not in the batch. Not on main; the batch's backend pull request needs the owner's `relock-approved` label, as PR #83 does. SWEEP-EVENTS rows O7 and O8 are fixed by FIX-12.
- **Held by:** the owner's `relock-approved` label on backend PR #83.
- **Open findings:** blocker 0, high 0, medium 0. Lows O7 and O8 are in tasks/SWEEP-EVENTS.md. NOT RUN by the verifier: the full backend suite (it needs a network namespace).
- **Next:** the owner applies the label; the lead merges #83 and signs off mobile.
- **Records:** on the branch, `wmt/EVENTS-11`, in tasks/EVENTS-11.md there (60 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py EVENTS-11`; the history goes to tasks/history/EVENTS-11.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend 33b627f0, verifier PASS in the lead's merge log, 16 Oct (v EVENTS-11 rf MERGE).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-40, and B3 in the hosting rules (hosting an event is verified-only)
- `tasks/EVENTS-02.md`: finding F6, "F6 proof", and the lead merge note
- backend `src/event/` (`PUT /events/:id/tickets`, the hosting gate used by POST and PATCH /events) and `.pipeline/protected-registry.json`

## Goal

Today `PUT /events/:id/tickets` lets a host whose verification has lapsed, or who was never verified, change the ticket tiers and prices of an event an admin already approved, and the event stays public with no second look. POST and PATCH /events already refuse such a host and send edits back to review. The ticket route must follow the same two rules.

## Scope

1. `PUT /events/:id/tickets` runs the same hosting gate as POST and PATCH /events: same 403 reasons and the same error shape (`account_type_required`, `verification_required`), checked before anything is written.
2. A tier change on a `published` event sets the event back to `pending`, as a PATCH does today: strangers get 404 until an admin approves it again, and the host still reads it. An edit to a `pending` or `rejected` event leaves it `pending`.
3. Once any ticket on the event is sold, the existing 409 stays exactly as it is (it is checked first, and nothing changes).
4. A request that changes nothing (the same tiers sent again) changes nothing, including the status.
5. Additive only in shape: no field renamed, retyped or removed. This is a deliberate behaviour change to a protected route, ruled by the owner (R-40). If the protected suite (`scripts/protected-routes/run.sh`) has a test that asserts the old behaviour (an unverified host succeeding, or a published event staying published after a tier change), do NOT edit the test, the lock or the registry: stop and report the test name to the lead, who takes it to the owner.

## Capability checks

- A verified host changes a tier price on an approved event: 200, the event is `pending`, a stranger gets 404, an admin approves it, and the new price is public.
- The same host after their tick lapses: 403 `verification_required`, nothing written, the event stays public at the old price.
- A buyer account and a never-verified creator: 403 with the right reason, nothing written.
- With one ticket sold: 409 as today, nothing written.
- The web's own event pages and checkout still read the event as before (V3 byte compare on a verified host's flow).

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
