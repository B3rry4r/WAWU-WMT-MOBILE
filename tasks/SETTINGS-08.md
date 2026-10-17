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
- **Status:** verifying. Branch `wmt/SETTINGS-08` in wawu-id @ 01b751f (from origin/main 8e4ee10), and in wawu-backend @ 4491120 (from origin/wmt/MERGE-10 3cf5a4b; the Hub half of G-SETTINGS-08-1, 17 Oct 2026). Mobile branch `wmt/SETTINGS-08` holds this file, the gap rows and the SHARED-CHANGES row.
- **Hub half (backend @ 4491120):** the Hub's mark-deletion call carries its `purgeAfter` and is asked again until WAWU ID confirms; the purge never starts on a row WAWU ID has not confirmed (it waits and reports `identity_unconfirmed`). Additive migration `20261025141000_account_deletion_identity_mark`.
- **Built (wawu-id, additive):** table `deletion_windows` and column `wawu_users.sessions_revoked_at` (migration `20261017120000_deletion_window`, rollback in its header). `mark-deletion` opens a 30 day window (the Hub's `purgeAfter` when within a day of 30 days, else 30 days from the call), asked twice the dates do not move.
- **Sign-in during the 30 days** (`POST /auth/login`, `/auth/otp/verify`, SMS reset): takes a claim under the account's lock, calls the Hub's `POST /api/hub/account/cancel-deletion` with a two minute token of that person holding nothing, then restores the account only if the Hub cancelled or had nothing scheduled. Two sign-ins together tell the Hub once. Refusals: 403 `ACCOUNT_DELETION_PERIOD_ENDED`, 403 `ACCOUNT_DELETION_IN_PROGRESS` (the Hub's own sentence), 503 `DELETION_CANCEL_UNAVAILABLE`, 503 `DELETION_CANCEL_BUSY`.
- **Day 30 is the Hub's:** its sweep deletes its data, then asks WAWU ID to anonymise. WAWU ID does not delete the identity on its own clock (only the Hub sees money still owed); its clock only ends the cancel by sign-in. The anonymise now runs once however often it is asked.
- **Open for the verifier / lead:** G-SETTINGS-08-1 fixed in the Hub (verify it); G-SETTINGS-08-2 open; G-SETTINGS-08-3 low (BACKEND_GAPS). Merge note: wawu-id `wmt/H1` (FIX-53, data-export mail) selects the account without `status` and `deletedAt`; once both are on main `provenEmail` stops compiling until it selects them. That is deliberate, so the export link is never mailed to a deleted account.
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

Not done: the data-export route (FIX-53) is not on this base, so only the merge tripwire covers it. No mobile screen (the delete-account screen is another task). V10 device NOT RUN.

### Builder report: the Hub half (backend @ 4491120, G-SETTINGS-08-1)

- **Code (wawu-backend `src/account/`):** `AccountDeletionIdentityService` (new) makes the one mark-deletion call with the row's `purgeAfter` and records the answer on `AccountDeletion` (`identityMarkedAt`, `identityMarkAttempts`, `identityMarkNextAt`); it matches the row by `purgeAfter`, so an answer to an earlier deletion never confirms a later one. Failures wait 5 min doubling to 6 h. Nothing is held across the call; the client call has a 10 s timeout. The hourly sweep asks again first (a claim keeps two servers off one row; three failures in a row end the ask), then purges. A due row WAWU ID has not confirmed waits: `purgeBlockedBy = identity_unconfirmed`, a warning, `identityUnconfirmed` in the pass result; the claim to `purging` names `identityMarkedAt` too. A new request after a cancel resets the confirmation.
- **Checks (builder scratchpad `settings-08-b/`):** `npx tsc --noEmit` EXIT 0; eslint on the changed files, no error added; migration applied to a fresh database, no schema drift on the new columns. Nuvion specs `account.contract`, `zz-v2-nuvion`, `zz-v3-nuvion` and the new `account-deletion-identity.contract` (9 cases: sent and equal, failing then recovering with the growing wait, the purge waiting then purging, the claim refusing, takeover reset, outage stop, two passes at once): 4 suites, 26 of 26, EXIT 0. The Fintava-harness account specs were not run (rule); CI runs them.
- **Spec changes (ruling-driven):** two pinned call arguments gained `purgeAfter`: `account.contract.spec.ts` (the date equals the answer) and `account-deletion.contract.spec.ts` (`[id, any Date]`). SHARED-CHANGES SETTINGS-08 #1.
- **Rows already `scheduled` before this ships** have no confirmation: the first pass asks WAWU ID for each (idempotent there) before any is purged. A row already `purging` is asked too, and waits if WAWU ID is down.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
