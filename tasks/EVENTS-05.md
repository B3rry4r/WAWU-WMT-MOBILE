---
id: EVENTS-05
title: Running an event: organiser numbers and door staff
owner: DEV3
area: EVENTS
order: 24
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-05 · Running an event: organiser numbers and door staff

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

E17-E20, E23-E24: sold counts, referral counts that actually count, and door staff.

## Scope

Sold count on my events, per-referral ticket counts, door staff a host can add, check-in returns the holder's name.

## Capability checks

- [ ] A host sees the same sold count on E17 and E18 as tickets actually issued, and a referral link's sales count goes up by one per ticket bought through it.
- [ ] Door staff can check people in; the same ticket twice shows 'already used'.

## Builder report

- **Built (backend `wmt/EVENTS-05`, eb2a835, additive):** the protected `GET /events/mine`, `GET /events/{id}/dashboard` and `POST /events/{id}/check-in` keep their answers byte for byte (a new key there fails V3), so the new numbers are new routes in `src/event-ticketing/event-running.{controller,service}.ts`: `GET /events/mine/sold` (E17, sold per hosted event), `GET /events/{id}/referrals` (each shared link with `ticketsSold`, one per ticket, voided ones not counted, plus `revenueNaira`), `GET`/`POST /events/{id}/door-staff` (add by `wawuUserId` or `handle`, label default "Door n"), `DELETE /events/{id}/door-staff/{staffId}` (soft remove, so "by Door 1" survives), `GET /events/door/mine` (events I work the door at), `POST /events/{id}/door/check-in` (host or door staff: `holderName`, `tierName`, `checkedInAt`, `checkedInBy {role, label}`, totals with `stillToArrive`). "Sold" is defined once in `ticket-counts.ts` and used by the dashboard, the door and E17. Table `EventDoorStaff`, migration `20261003180000_event_door_staff`, purge map OWNED. Contract regenerated (507 lines added, none removed).
- **Mobile:** `contract/` and `src/api/schema.generated.ts` copied from the branch (SHARED-CHANGES EVENTS-05 #2); schema change is EVENTS-05 #1. No screens (EVENTS-08, EVENTS-09).
- **Check 1 (sold E17 = E18 = issued; link +1 per ticket):** `src/event-ticketing/tests/event-running.contract.spec.ts` (20 tests, pass): 6 tickets issued, `mine/sold` 6 = dashboard 6; the link reads 4 then 5 after one more ticket; after the event is called off all read 0. Live on the built Hub (:4140, real mock-WAWU-ID login on :4141): sold 2 on both, link 2.
- **Check 2 (door staff check in; twice = already used):** same spec: staff 403 before being added; added, scan gives `valid` with "Chidi Umeh", second scan `already_used` with the first time and `Door 1`; two staff scanning at once give one of each; another event's code `invalid`; removed staff 403; the protected host-only route still 403s staff. Live: identical.
- **Gates (backend):** before 16 fail / 13 warn / 76 accepted (643 files); after 16 / 13 / 76 (648). Lint 4,488 problems before and after (new files clean). `tsc` 0. Protected suite `run.sh --fresh`: main 253/253, branch 253/253, lock-diff no change. Full `npm run test:contract` (mock on :4141): 133 suites, 126 passed, 3,173 tests passed; the 7 failing suites (kyc-submission, notification, blocked-account, privacy-settings, saved-item, credits-state, account) hard-code mock WAWU ID on :4001, held by another session's mock with other keys (401 at login); NOT RUN in effect, unblocked by a free :4001 or those specs reading `WAWU_ID_BASE_URL`. Mobile `npm run check` exit 0 after the merge of main.
- **For the owner / next tasks (default, agent, owner may override):** no artboard draws adding door staff (E18 has no row for it), so EVENTS-08/09 have no screen for `POST /door-staff`; label default "Door n" is agent copy. `buy` still stores any `referralCode` as sent; only codes of the event's own links are counted. NOT RUN: Fintava (not touched by this task).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
