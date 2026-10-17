# SCHOOLS-11 · round history

Moved out of [tasks/SCHOOLS-11.md](../SCHOOLS-11.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** backend `prisma/schema.prisma`, migration `20261025131000_school_settlement`, `src/schools/settlement/` (rules, DTOs, views, `SchoolPayeeService`, `SchoolSettlementService`, admin controller, module), `src/admin/schools/admin-schools.module.ts`, `src/account-purge/account-data-map.ts`, `contract/openapi.json`, `test/payments/nuvion-seam-standin.ts` (bank sends), `test/schools/school-nuvion-harness.ts`, spec `src/schools/settlement/tests/school-settlement.contract.spec.ts`.
- **Check 1** (settlement equals the ruled amount, the ledger shows WAWU's share): tested; the merchant ledger takes the price in and pays 85% out, so 15% stays, less the bank's charge.
- **Check 2** (V8, a replayed settlement does not pay twice): tested with five parallel sweeps, repeated sweeps, a lost answer and a refused retry.
- **Gate counts:** gates and baseline green on the base and on this head; no gate or baseline edited.
- **Not run:** any bank send on a real Nuvion or sandbox; the sandbox payout blocker note in the brief concerned Fintava and is not touched.
- **Gaps:** none filed; school ratings stay off (R-32).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Round 2 · builder report · 17 Oct 2026

Backend `wmt/B2` `be8d9cb` (on `9b41f13`). Fixes the verifier's M1 and two lows.
- M1: the payout's ledger `out` row is `pending`, written in the transaction that takes the lease, and completes as the same row on the provider's confirmation. The provider's own charge replaces the quote on the pending row. A payout the provider says failed, or the bank returned, reverses its row; a send the provider never took reverses it and revives as the same row when taken later; a retry under `-2` has its own row and only one row per settlement is live at any moment. Six new specs fail before and pass after.
- Low: `GET /admin/school-settlements` is a cursor page (`limit`, `cursor`, `nextCursor`). Contract and API types follow.
- Low (SCHOOLS-09): a token with no name, email or phone is not "removed their account"; only a cleared `wawuUserId` is. One new spec, fails before and passes after.
- Checks: tsc 0, eslint 0 on changed files, settlement spec 21 passed, report spec 12 passed.
