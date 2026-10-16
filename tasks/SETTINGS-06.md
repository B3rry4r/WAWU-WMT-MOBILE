---
id: SETTINGS-06
title: Delete account in the Hub: empty wallet first, freeze, restore on cancel
owner: YOU
area: SETTINGS
order: 175
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-06, MONEY-11]
decisions: [R-17, R-11, R-19]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-06 · Delete account in the Hub: empty wallet first, freeze, restore on cancel

## Current state

As of 16 Oct 2026, builder round 3 done (verifier round 2 said FIX: 1 medium, 3 low; round 1 said FIX: 2 high, 1 medium, 3 low).
- **Status:** verifying (round 3 verifier next). Backend branch `wmt/SETTINGS-06` @ ff09305 (code; origin/main 18ac5f9 merged in; CI green except the same 16 gate FAIL lines as main, none in src/account). Mobile branch `wmt/SETTINGS-06` (this file, history, SHARED-CHANGES, SWEEP-MONEY). No mobile `src/` change: the delete-account screen is another task.
- **Built (backend):**
  - `DELETE /account` refuses with `409 account_deletion_blocked` (`reason.blockers`, `balanceKobo` from the provider, `openHolds`, `waitingEarnings`) while the wallet holds money, a hold is open, earnings wait, a payment is unsettled, a cash-out holds points or the wallet is opening. `503 provider_unreachable` when the balance cannot be read, never a guess. Nothing is frozen before this check passes.
  - Then the deletion is recorded (`freezing`) before the wallet is frozen through the provider seam (optional `freezeWallet`/`unfreezeWallet`; Fintava adapter); any later failure lets the wallet go, and a lost answer is undone by a cancel or a retry or, after 10 minutes, by the hourly sweep. On success the row is `scheduled`, content is hidden piece by piece, push stops, the date is 30 days out, WAWU ID is told. Asking again keeps the date.
  - `POST /account/cancel-deletion` (the person's own token) unfreezes, restores exactly the hidden pieces, resumes push; idempotent; a provider failure changes nothing. Once the purge has started it answers `200 { cancelled: false, deletionInProgress: true, message }`, never "restored".
  - Hourly sweep `account-deletion-purge` after the 30 days: re-checks the money (kept, with `purgeBlockedBy`, if any), claims the row (`purging`), releases held points, purges the Hub's data (points first), asks WAWU ID to anonymise only after the Hub side fully worked, marks `purged` only then. WAWU ID down, or a table that would not clear: the row stays `purging` and the next pass finishes it. Content a buyer paid for cannot be deleted: it is hidden and loses its title, description, preview and files, and `purgeNote` says so. It first lets go of `freezing` rows older than 10 minutes (`FREEZING_STALE_MINUTES`): wallet unfrozen through the seam, row deleted only while still the row it took and still `freezing`; a failed unfreeze leaves the row for the next pass.
- **Migrations:** `20261022050000_account_deletion` and `20261022051000_account_deletion_states` (both additive, each with `rollback.sql`; the lead renames the stamps at merge if needed). Contract regenerated. CONVENTIONS section 23.
- **Shared changes filed:** SHARED-CHANGES SETTINGS-06 #1 (schema), #2 (contract), #3 (round 2: second migration, two optional contract fields, `AccountPurgeService.purge` result). BACKEND_GAPS G-10 updated.
- **Open findings:** no blocker, high or medium (round 2's medium R2-1 and low R2-2 are fixed in round 3). Lows L4 to L8 are rows in `tasks/SWEEP-MONEY.md` (L7: the 20-row batch can starve later due rows; L8: a `purging` row has no lock between servers). Sold content (buyers lose the files at purge, R2-3) is the owner's question, raised by the lead; behaviour unchanged.
- **Open for the lead / next tasks:**
  - SETTINGS-08 (WAWU ID): call `POST /account/cancel-deletion` with the person's new token on sign-in; its 30-day clock should equal the Hub's `purgeAfter`; its anonymize route should answer ok when already anonymised (the Hub asks it at the end of the 30 days); show `message` when `deletionInProgress` is true.
  - Under Nuvion nothing is frozen (no freeze method yet); the up-front checks and the final re-check are the guard.
  - Money that becomes due during the window keeps the final purge back until an operator looks (`purgeBlockedBy`).
- **Records:** round reports and the verifier's report are in tasks/history/SETTINGS-06.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-17 (ruled; build what it says)
- This task changes `wawu-id, wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z6 to Z8: deletion waits 30 days, money is handled first, and a cancelled deletion brings everything back (R-17). The WAWU ID half (the grace period and cancel on sign-in) is SETTINGS-08.

## Scope

Refuse to schedule deletion while the wallet holds money (balance from Fintava, MONEY-11), a hold is open (R-19) or
earnings are waiting (R-11). Freeze the Fintava wallet when deletion is scheduled and unfreeze it on cancel (a cancel
route SETTINGS-08 calls). Content stays restorable for the 30 days.

BACKEND_GAPS G-10: a frozen Fintava wallet can neither send nor receive, so money due to a frozen wallet (earnings, refunds) waits in WAWU's merchant wallet and is paid on unfreeze.

## Lead note (8 Oct 2026): points

POINTS-01 (the points ledger) adds `purgePersonPoints` (`src/points/points-purge.ts`), and `AccountPurgeService.purge` calls it first. Account deletion here must reach that purge, so a deleted person's points lots, holds and ledger rows go with the account (POINTS-01 round 1 verifier, U3). Two rules from POINTS-01 apply: the points ledger refuses any other delete (a database trigger), and a hold still `held` at deletion (an AI job or a cash-out in flight) must be settled or released before the purge, never left to fail it. Add a capability check that a deleted person has no points rows left and that another person's are untouched.

## Capability checks

- [ ] A user with money in their wallet, an open hold or waiting earnings is told to move it first.
- [ ] A user who cancels within 30 days gets their wallet unfrozen and their content back.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SETTINGS-06.md](history/SETTINGS-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
