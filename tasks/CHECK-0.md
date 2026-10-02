---
id: CHECK-0
title: Checkpoint 0: safe to start building
owner: YOU
area: CHECK
order: 8
priority: launch
repo: all
type: ops
status: todo
depends_on: [SETUP-01, OPS-03, MONEY-01]
decisions: []
passes: []
artboards: []
---
# CHECK-0 · Checkpoint 0: safe to start building

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nobody builds on a foundation that hasn't been proven.

## Scope

Read the report on SETUP-01, the protected-route suite (MONEY-01), the rulings, and the local backend (OPS-03).

## Capability checks

- [ ] SETUP-01 was verified (it was built by the setup session, so any person's session can verify it) with no open defects.
- [ ] The protected-route suite (MONEY-01) passes on the live backend's main branch.
- [ ] The decision defaults in DECISIONS.md have been read, and any you disagree with are changed.
- [ ] The backend runs locally from `docs/LOCAL.md` in the backend repo (OPS-03), and the mobile app signs in against it.

## Builder report

Evidence gathered by the planning session, 2 Oct 2026, for the owner to sign:

- **SETUP-01:** verified by the developer's session (builder, verifier, fix, second verifier: no open defects). Not yet pushed: the developer's GitHub access to MOXN-AFRICA has to be fixed first. Sign once branch `wmt/SETUP-01` is on GitHub.
- **MONEY-01:** independently verified in 4 rounds. 235 web and dashboard routes are locked, and 253/253 pass on main locally. It merged in wawu-backend #23; CI's protected route check passed, and the deploy that ran the full test suite passed (Deploy Hub API run 55, b7d4e63).
- **OPS-03:** independently verified in 3 rounds. The backend and wawu-id start locally from `docs/LOCAL.md`, sign-in works against the real local wawu-id (V9), and the mobile web build reaches it (through a probe; re-check on the first real API screen). Merged in wawu-backend #23.
- **Rulings:** R-1 to R-20 and the defaults in DECISIONS.md, recorded with the owner in the planning session.
- **Open, not blocking:** BACKEND_GAPS G-2 (wawu-id returns tokens before email confirmation) and G-3 (seed bio mentions tiers), and four bugs on main recorded in MONEY-01 (POST /kyc 404 after writing, enrol 403, nested notifications envelope, mock name route).

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
