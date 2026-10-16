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

As of 16 Oct 2026, builder round 1 done.
- **Status:** verifying. Backend branch `wmt/SETTINGS-06` (the code), mobile branch `wmt/SETTINGS-06` (this file, SHARED-CHANGES, BACKEND_GAPS). No mobile `src/` change: the delete-account screen is another task.
- **Built (backend):**
  - `DELETE /account` refuses with `409 account_deletion_blocked` (`reason.blockers`, `balanceKobo` from the provider, `openHolds`, `waitingEarnings`) while the wallet holds money, a hold is open, earnings wait, a payment is unsettled, a cash-out holds points or the wallet is opening. `503 provider_unreachable` when the balance cannot be read, never a guess.
  - Otherwise it freezes the wallet through the provider seam (new optional `freezeWallet`/`unfreezeWallet`; Fintava adapter), hides the content piece by piece, stops push, answers a date 30 days out, and tells WAWU ID. Asking again keeps the date.
  - `POST /account/cancel-deletion` (the person's own token) unfreezes, restores exactly the hidden pieces, resumes push; idempotent (`cancelled: false` with nothing scheduled); a provider failure changes nothing.
  - Hourly sweep `account-deletion-purge` after the 30 days: re-checks the money (kept, with `purgeBlockedBy`, if any), releases held points, `AccountPurgeService.purge` (points first), `finalizeAccountDeletion` at WAWU ID, marks `purged`.
- **Migration:** `20261022050000_account_deletion` (additive: `AccountDeletion`, `AccountDeletionContent`), with `rollback.sql`. Data-map rows, export-map exclusion, contract regenerated, CONVENTIONS section 22.
- **Shared changes filed:** SHARED-CHANGES SETTINGS-06 #1 (schema) and #2 (contract). BACKEND_GAPS G-10 updated.
- **Open for the lead / next tasks:**
  - SETTINGS-08 (WAWU ID): call `POST /account/cancel-deletion` with the person's new token on sign-in; its 30-day clock should equal the Hub's `purgeAfter`; its anonymize route should answer ok when already anonymised (the Hub asks it at the end of the 30 days).
  - Under Nuvion nothing is frozen (no freeze method yet); the up-front checks and the final re-check are the guard.
  - Money that becomes due during the window (a hold waiting on the frozen wallet) keeps the final purge back until an operator looks (`purgeBlockedBy`).
  - The old `account.contract.spec.ts` asserted 48 hours; it now asserts 30 days (R-17) and clears its own `AccountDeletion` row per run.
- **Records:** this round's report is in tasks/history/SETTINGS-06.md.

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
