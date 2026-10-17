---
id: HARNESS-NUV
title: The shared backend test helpers run on Nuvion, not the Fintava double
owner: YOU
area: FIX
order: 131
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HARNESS-NUV · The shared backend test helpers run on Nuvion, not the Fintava double

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built once; not yet checked by an independent verifier.
- **Id and order:** filed at launch priority, order 131, a free number below CHECK-3 (order 298; 131, 135 and 311 were the only unused numbers up to 339). The work is test setup only and changes nothing a person sees.
- **History:** the builder report is in [history/HARNESS-NUV.md](history/HARNESS-NUV.md).
- **Open findings:** none yet.
- **Next:** an independent verifier repeats the before and after runs. Backend branch `wmt/HARNESS-NUV` from `432f017` (batch 7).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-38 task file (the same kind of fix: test setup only)

## Goal

Nuvion is the wallet provider (R-39, R-45) and Fintava is out. Four shared backend test helpers still booted the Fintava double for specs whose subject is not Fintava (TIER-04's check counted 0 requests to it). They now boot `WALLET_PROVIDER=nuvion` with Nuvion stood in at the seam, and the specs that use them are unchanged.

## Scope (test setup only; no product file, no Fintava file, no gate, baseline or assertion)

- `test/nuvion/harness-wallets.ts` (new): the Nuvion rig and the list `FINTAVA_BOUND_SPECS`. It gives the specs the handles they already use (`h.wallets.kobo`, `mode`, `sends`, `hidden`, `failures`; `h.double.seen`, `pause`, `resume`) on top of the Nuvion stand-in. Fee bands are spec values equal to the old `liveFee` numbers, so balance arithmetic is unchanged.
- Switched helpers: `test/events/event-wallet-harness.ts`, `test/plans/tier-purchase-harness.ts` (`bootTierApp`), `test/credits/credit-wallet-harness.ts`, `test/schools/school-enrolment-harness.ts`. A spec that passes its own Nuvion stand-in keeps it.
- Two EVENTS-07 specs (`event-wallet-order.contract.spec.ts`, `event-wallet-order-round2.contract.spec.ts`): the host gets a current tick in setup only (`h.tick`), as EVENTS-11 did; no assertion changed.
- Left on the Fintava double, listed in `FINTAVA_BOUND_SPECS`: `event-call-off-refund`, `plan-transfer-provider-errors`, `plan-transfer-sweep`, `referrals` (Fintava endpoint scripting), `plan-purchase-delivery`, `plan-purchase-failures` (they write Fintava-provider payment rows by hand), `credit-wallet.contract` (matches the ledger to Fintava's merchant account number).
- Not touched at all: the bills harness (bills ride on Fintava only, R-45), the PIN approval harness (reset codes go by Fintava SMS), `FintavaCashOut`, the account deletion rig, and every spec that boots the double inline.

## Capability checks

- [ ] The 14 spec files on the Nuvion rig pass with the same test names and counts as on `432f017` (164 tests), and boot no Fintava double.
- [ ] The 7 Fintava-bound spec files pass as before.
- [ ] `git diff --stat` touches no file under `src/fintava/`, no Fintava double file and no assertion.
- [ ] Backend `tsc --noEmit` EXIT 0; eslint on the changed files EXIT 0; CI gates unchanged.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HARNESS-NUV.md](history/HARNESS-NUV.md).

## Owner sign-off
