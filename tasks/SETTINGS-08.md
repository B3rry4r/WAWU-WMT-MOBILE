---
id: SETTINGS-08
title: Delete account in WAWU ID: 30 days, cancelled by signing in
owner: YOU
area: SETTINGS
order: 177
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: [SETTINGS-06]
decisions: [R-17]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-08 · Delete account in WAWU ID: 30 days, cancelled by signing in

## Current state

As of 17 Oct 2026, builder round 1 done.
- **Status:** verifying. Branch `wmt/SETTINGS-08` in wawu-id @ 01b751f (from origin/main 8e4ee10). No backend change was needed and no backend branch exists. Mobile branch `wmt/SETTINGS-08` holds this file and two gap rows.
- **Built (wawu-id, additive):** table `deletion_windows` and column `wawu_users.sessions_revoked_at` (migration `20261017120000_deletion_window`, rollback in its header). `mark-deletion` opens a 30 day window (the Hub's `purgeAfter` when within a day of 30 days, else 30 days from the call), asked twice the dates do not move.
- **Sign-in during the 30 days** (`POST /auth/login`, `/auth/otp/verify`, SMS reset): takes a claim under the account's lock, calls the Hub's `POST /api/hub/account/cancel-deletion` with a two minute token of that person holding nothing, then restores the account only if the Hub cancelled or had nothing scheduled. Two sign-ins together tell the Hub once. Refusals: 403 `ACCOUNT_DELETION_PERIOD_ENDED`, 403 `ACCOUNT_DELETION_IN_PROGRESS` (the Hub's own sentence), 503 `DELETION_CANCEL_UNAVAILABLE`, 503 `DELETION_CANCEL_BUSY`.
- **Day 30 is the Hub's:** its sweep deletes its data, then asks WAWU ID to anonymise. WAWU ID does not delete the identity on its own clock (only the Hub sees money still owed); its clock only ends the cancel by sign-in. The anonymise now runs once however often it is asked.
- **Open for the verifier / lead:** G-SETTINGS-08-1 and -2 (BACKEND_GAPS). Merge note: wawu-id `wmt/H1` (FIX-53, data-export mail) selects the account without `status` and `deletedAt`; once both are on main `provenEmail` stops compiling until it selects them. That is deliberate, so the export link is never mailed to a deleted account.
- **Records:** this file only (builder report below).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: R-17 (ruled; build what it says)

## Goal

Z6 to Z8: deleting an account waits 30 days, and signing in during that time cancels it (R-17). This is the
WAWU ID half; the wallet and content half is SETTINGS-06.

## Scope

In WAWU ID: the 30-day grace period on a scheduled deletion (today 48 hours); sign-in during the grace period
clears it and tells the Hub (SETTINGS-06's cancel route), so the wallet unfreezes and content comes back.

## Capability checks

- [ ] A user who schedules deletion and signs in 10 days later keeps their account, wallet and content.
- [ ] A user who doesn't sign in for 30 days can no longer sign in, and their account is deleted.

## Builder report

Files (wawu-id): `prisma/schema.prisma`, migration `20261017120000_deletion_window`, `src/auth/deletion-window.ts` (rules and messages), `deletion-window.service.ts` (mark, claim, record), `hub-account.client.ts` (the one Hub call, no default host), `dto/mark-deletion.dto.ts`, edits to `auth.service.ts`, `tokens.service.ts`, `session-reader.ts`, `internal.controller.ts`, `auth.controller.ts`, `contract/openapi.json` (login refusals only), docs `WAWUAfrica_API_Contracts.md`, `deploy/ENV.md`.

Checks (EXIT lines in the builder's scratchpad `settings-08-b/`):
- New spec `src/auth/deletion-window.spec.ts`, 27 cases on a real Postgres and a fake Hub over HTTP: 27 of 27, twice in a row. Mutants of my own, all killed: claim never busy, anonymise guard removed, token cut-off removed, end date ignored, date moved by a repeat mark, claim check at record removed.
- `src/auth` 31 suites, 539 tests, EXIT 0. `src/contract` 5 of 5. `npx tsc --noEmit` EXIT 0. Gates: 0 fail (22 warn, all older). The changed files add no lint error (the two left in `tokens.service.ts` and the two in `internal.controller.ts` are on older lines).
- Real pair, `stack.sh` name `s08_test`, ports 7760-7767, Hub (Nuvion stand-in) plus this wawu-id: Hub `DELETE /account` gave pending in WAWU ID with a 30 day window equal to the Hub's; a sign-in made WAWU ID active and the Hub row `cancelled`; a second delete then sign-in after the window gave 403 period ended with the Hub still `scheduled`; with the Hub row `purging` the 403 carried the Hub's sentence; three sign-ins together gave three 200 and one cancelled row. Stack down, databases dropped.

Attacks: delete asked twice (dates and sessions unchanged); sign-in during the window cancels once and the Hub is told once (2 and 5 parallel); day 30 runs once with two workers (one scrub counted by a trigger); a token from before the delete stays dead, also after a cancel; the email routes (ditto, unpaid, money check) send nothing to a deleted or deleting account; a ban is never lifted; nothing of another account changes (row, sessions, window compared before and after).

Not done: the data-export route (FIX-53) is not on this base, so only the merge tripwire covers it. The Hub does not yet send `purgeAfter` (G-SETTINGS-08-1). No mobile screen (the delete-account screen is another task). V10 device NOT RUN.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
