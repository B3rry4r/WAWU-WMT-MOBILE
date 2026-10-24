---
id: FIX-74
title: A school payout the webhook completed at the quoted charge takes the provider's real charge, not a flag
owner: YOU
area: FIX
order: -74
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-1, R-10, R-19, R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-74 · A school payout the webhook completed at the quoted charge takes the provider's real charge, not a flag

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 19.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-74.md`: 14 attack cases on the stand-in, the ledger equals the stand-in after every one, at most one audit note, no money moved, each of the 4 guards pinned by a spec). Backend `wmt/FIX-74` `09eb071` (from `wmt/MERGE-16` `7e85662`), this record `94374640` (from `wmt/MERGE-16` `5ee3994d`). Stacked in batch 19 by MERGE-19 (backend `wmt/MERGE-19`, mobile `wmt/MERGE-19`); not on main. Branch CI runs 39087166047 (gates), 39087165853 (branch checks, red only on `earning-settlement.contract.spec.ts`, Q-42, ruled in R-70), 39087165782 (protected routes). No Fintava file touched; no app code; no schema change.
- **Gap:** G-SWEEP-MONEY-1 (SCHOOLS-11 L1, SWEEP-MONEY-2 V1) is marked closed by FIX-74 in `BACKEND_GAPS.md` at MERGE-19, where SWEEP-MONEY-3's row met this branch. The SCHOOLS-11 L1 and SWEEP-MONEY-2 V1 rows in `tasks/SWEEP-MONEY.md` are marked fixed.
- **Merge (MERGE-19):** the backend merged with no conflict and no migration (`prisma/` is identical to MERGE-18; `migrate deploy` applies nothing new, fresh and from MERGE-18). The two specs and the three Nuvion payout specs pass (117 of 117 with the settlement spec). The verifier's lows are SWEEP-MONEY rows FIX-74 L1 (the settlement spec's load flake, taken by FIX-76), L2 and L3 (info).
- **Defect:** quote 2,000, provider charges 2,500, the send's answer lost. Nuvion's webhook completed the ledger row at the quoted total (and wrote its "charged 2,500, the quote was 2,000" note); the settlement's completion then stated 2,500, `restatePendingCharge` only changes a pending row, and the merge put the row back to `pending` with a disagreement and an ERROR log. The ledger stayed 500 kobo below the provider until a person cleared it. Reproduced on the base: the row ends `pending`.
- **Fix:** `LedgerService.restateCompletedCharge(reference, amount, { ourReference, feeKobo })` restates a completed merchant payout row to the provider's own recorded charge, once, with an audit note on the row's `discrepancy` (old and new charge and total, the reference, when). It acts only when the provider's record names the row's reference and states a charge, the row is the running provider's `out` row at that amount with no WAWU fee, and the row holds no disagreement the record does not explain (none, or only the provider's own "charged X, the quote was Y" note for this very difference). The audit note is also the once-only mark: a second record, even at another charge, finds a note it does not explain and changes nothing. Nothing moves money. The settlement calls it from `reconcile` only, after the amount check, when the provider's record says completed.
- **Shared words:** the provider's quote-versus-charge note now comes from one builder (`src/money/ledger/ledger-notes.ts`) that the Nuvion recorder and the ledger share; the text is byte for byte the same.
- **Unchanged:** `restatePendingCharge` and its three call sites in the settlement service (the send's receipt, a found record that is neither failed nor reversed, the completion's write); each still changes a pending row only. A real disagreement the record does not explain still flags as before (discrepancy, ERROR log, the nightly check).
- **Specs (Nuvion stand-in only):** `school-payout-charge.contract.spec.ts` 5 of 5 (webhook first: completed at 2,500, ledger equals the stand-in, one audit note, no disagreement logged; replays and later sweeps change nothing; completion first: same end state with no note; another reference never restates and flags; a pending row as before). Red on the base: the two webhook-first cases (row `pending`). `ledger-restate-completed.contract.spec.ts` 7 of 7 (the method alone: once, five at once, another reference, no stated charge, unexplained notes, WAWU fee, pending, failed, user wallet, wrong amount; `restatePendingCharge` as before). Red on the base: 6 of 7 (the method does not exist); the seventh is the `restatePendingCharge` guard.
- **Also run:** the three Nuvion payout specs (88 of 88; the shared note builder), the protected suite 253 of 253 on a seeded database (an unseeded one fails 5 learn and EVG probes, nothing to do with this task), tsc 0, eslint 0 on the 6 changed files, gates passed (0 fail, 128 warn, 88 accepted), baseline ok.
- **Not run (brief):** `school-settlement.contract.spec.ts` and `school-enrolment.contract.spec.ts`. Note for the lead: the settlement spec imports only `test/schools/school-nuvion-harness`, whose Fintava settings point at a closed counter; the enrolment spec is the one FIX-64 found to use the double. `school-settlement.contract.spec.ts` holds the existing pending-row charge test ("takes the provider's own charge when it differs from the quote"); the new spec repeats that case.
- **Left as is (decision for the lead):** the audit note lives on `discrepancy`, the ledger's only per-row note, so the nightly money check still lists the row as a ledger discrepancy (it lists every row carrying the provider's charge note, which the webhook writes today). The figures now agree with the provider; the listing is the existing convention, not a new flag. A column or a check that skips explained rows would need a schema change or a change to the check.
- **Next:** the batch 19 pull request (the lead). FIX-76 takes the load flake in `school-settlement.contract.spec.ts` (FIX-74 L1).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- wawu-backend `src/money/ledger/ledger.service.ts` (`restateCompletedCharge`, `restatePendingCharge`, `merge`), `src/schools/settlement/school-settlement.service.ts` (`reconcile`), `src/nuvion/handlers/outflows-bank.ts` (`takeProviderCharge`)

## Goal

When a school payout's real bank charge differs from the quote and the send's answer is lost, the ledger ends equal to the provider with no person needed.

## Scope (backend only)

`src/money/ledger/ledger.service.ts`, `src/money/ledger/ledger-notes.ts` (new), `src/nuvion/handlers/outflows-bank.ts` (the note's words from the shared builder), `src/schools/settlement/school-settlement.service.ts`, and two new specs.

## Capability checks

- [x] Quote 2,000, provider 2,500, answer lost, webhook first: the row ends completed at the provider's total, ledger equals the stand-in, one audit note.
- [x] The same with the completion first; a replayed webhook changes nothing more.
- [x] A provider record of another reference never restates; a pending row behaves as before.
- [x] Never to a figure we computed (no stated charge restates nothing); never twice; nothing moves money.

## Owner sign-off

Not needed.
