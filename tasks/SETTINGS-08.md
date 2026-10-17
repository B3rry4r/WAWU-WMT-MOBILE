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

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: PASS (2 lows, 1 merge item done here: sendDataExportLink selects status and deletedAt in wawu-id) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-08.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main. Built: Branch `wmt/SETTINGS-08` in wawu-id @ 01b751f (from origin/main 8e4ee10), and in wawu-backend @ 4491120 (from origin/wmt/MERGE-10 3cf5a4b; the Hub half of G-SETTINGS-08-1, 17 Oct 2026). Mobile branch `wmt/SETTINGS-08` holds this file, the gap rows and the SHARED-CHANGES row.
- **Hub half (backend @ 4491120):** the Hub's mark-deletion call carries its `purgeAfter` and is asked again until WAWU ID confirms; the purge never starts on a row WAWU ID has not confirmed (it waits and reports `identity_unconfirmed`). Additive migration `20261025141000_account_deletion_identity_mark`.
- **Built (wawu-id, additive):** table `deletion_windows` and column `wawu_users.sessions_revoked_at` (migration `20261017120000_deletion_window`, rollback in its header). `mark-deletion` opens a 30 day window (the Hub's `purgeAfter` when within a day of 30 days, else 30 days from the call), asked twice the dates do not move.
- **Sign-in during the 30 days** (`POST /auth/login`, `/auth/otp/verify`, SMS reset): takes a claim under the account's lock, calls the Hub's `POST /api/hub/account/cancel-deletion` with a two minute token of that person holding nothing, then restores the account only if the Hub cancelled or had nothing scheduled. Two sign-ins together tell the Hub once. Refusals: 403 `ACCOUNT_DELETION_PERIOD_ENDED`, 403 `ACCOUNT_DELETION_IN_PROGRESS` (the Hub's own sentence), 503 `DELETION_CANCEL_UNAVAILABLE`, 503 `DELETION_CANCEL_BUSY`.
- **Day 30 is the Hub's:** its sweep deletes its data, then asks WAWU ID to anonymise. WAWU ID does not delete the identity on its own clock (only the Hub sees money still owed); its clock only ends the cancel by sign-in. The anonymise now runs once however often it is asked.
- **Open for the verifier / lead:** G-SETTINGS-08-1 fixed in the Hub (verify it); G-SETTINGS-08-2 open; G-SETTINGS-08-3 low (BACKEND_GAPS). Merge note: wawu-id `wmt/H1` (FIX-53, data-export mail) selects the account without `status` and `deletedAt`; once both are on main `provenEmail` stops compiling until it selects them. That is deliberate, so the export link is never mailed to a deleted account.
- **Records:** this file only (builder report below).
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-AUTH (L1, L2).

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SETTINGS-08.md](history/SETTINGS-08.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
