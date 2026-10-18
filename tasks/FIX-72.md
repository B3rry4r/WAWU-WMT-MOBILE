---
id: FIX-72
title: A school payout that Nuvion accepts and then fails is paid under a new reference, once
owner: YOU
area: FIX
order: -72
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-10, R-12, R-19, R-31, R-39, R-42]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-72 · A school payout that Nuvion accepts and then fails is paid under a new reference, once

## Current state

As of 18 Oct 2026, verifying: built by a Sonnet builder (tier T2), not yet checked. Backend `wmt/FIX-72` (from `wmt/FIX-70` `80f5845`, head `829d6ec`); this record and the gap row on mobile `wmt/FIX-72` (from `wmt/FIX-70` `1f5b8dfd`). No schema, no migration, no route, no Fintava file touched, no app code.
- **Closes:** G-FIX-70-1. **Found by:** FIX-70's read-only survey.
- **Cause:** `NuvionPayoutsArea.bankTransfer` (`src/nuvion/areas/payouts.ts`, `postTransfer`) threw a payout Nuvion had made and failed as a refusal that moved nothing, with no `providerFailed`. `SchoolSettlementService.afterRefusal` gave the lease back and sent again under the row's unchanged reference `wawu-bank-sch-<id>`, every one to sixty minutes with no review bound; Nuvion answers a repeat of a reference with the original failed record (api-reference__transfers.md:174), so the school was never paid. Its new-reference step (`retryAfterFailure`) was reached only from `reconcile`, that is, for a payout Nuvion first answered `pending`.
- **Fix, adapter:** `payouts.ts` sets `providerFailed` only where Nuvion's own record of the transfer says `failed` (the transfer exists: a new reference answered failed at once, or a repeat's original; api-reference__transfers.md "Transfer statuses" line 119 and `unique_reference` line 174). A refusal at the door, a 409, a timeout or a 5xx never sets it.
- **Fix, settlement:** `afterRefusal` on `providerFailed` sends nothing. It reads the provider's record (`reconcile`, a read); only a record that says `failed` reverses the pending ledger row and takes the existing `retryAfterFailure` step: one new try under `wawu-bank-sch-<id>-2`, resting 4 minutes (the sweep runs every minute), never two tries in flight (the lease and the conditional update). A second failure goes to a person at once and leaves the sweep (`MAX_ATTEMPT`). A record that cannot be read, is unfinished or is a 5xx is asked again (`stillUnknown`) and, past `PAYMENT_REVIEW_AFTER_HOURS` counted from the hand-over, goes to a person. The Fintava path never sets `providerFailed`, so its behaviour is unchanged.
- **Spec (Nuvion stand-in only, no Fintava import):** new `src/schools/settlement/tests/school-settlement-failed-payout-nuvion.contract.spec.ts`, 7 of 7, the real adapter over the stand-in's socket: accepted-then-failed lands once under `-2` (one successful transfer, one completed ledger row, the failed one reversed); a second failure sends nothing more and leaves the sweep, also past the bound; a lost answer, a 5xx after the transfer was made and a 5xx before it was never start a new reference (the first two start one only on Nuvion's failed record); an unreadable failed record is asked again; an unfinished transfer goes to a person past the bound. WAWU's operational ledger equals the stand-in after each. Red on `80f5845` for the three that depend on the fix (accepted-then-failed, second failure, unreadable failed record), run alone; green after. The other four pin paths that were already right and cannot be red there. The stand-in gains `failCreateNext` and `answerAfterNext` (additive).
- **Not done:** `school-settlement.contract.spec.ts` and `school-enrolment.contract.spec.ts` were not run (brief); CI runs them.
- **Next:** an independent verifier (V3 protected suite, gates, the settlement and payout specs).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-70-1

## Goal

A school's share that Nuvion accepts and then fails reaches the school once, under a new reference, and a second failure never loops.

## Scope (backend only)

`src/nuvion/areas/payouts.ts`, `src/schools/settlement/school-settlement.service.ts`, the spec named above and the payouts stand-in.

## Capability checks

- [ ] A payout Nuvion accepts and fails lands once under a new reference; the school is paid once and the ledger holds one completed row.
- [ ] A second failure sends nothing more and a person looks.
- [ ] A timeout, a 5xx, an unreadable or an unfinished record never starts a new reference.

## Owner sign-off

Not needed.
