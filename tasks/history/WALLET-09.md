# WALLET-09 · round history

Moved out of [tasks/WALLET-09.md](../WALLET-09.md) word for word, oldest first. The current state is in that file.

## Builder report

Files (backend): `src/money/transfers/wallet-transfer.service.ts` (`sendToBank`, bank branches in the view, ledger movement, completion and `settle`), `bank-send-target.ts` (new: the gate and its guard), `money-transfers.controller.ts`, `saved-accounts/money-banks.controller.ts` (new), `beneficiary.service.ts` (`confirmCurrentName`), `src/nuvion/nuvion-wallet-provider.ts` (seam routing), DTOs, enums and error reason, `account-data-map.ts` (the four bank columns go with the sender), schema and migration, `contract/openapi.json`, `docs/contract/` (CONVENTIONS section 24, WALLET.md). Deleted: `money-transfer.controller.ts`.
Checks: `bank-transfer.contract.spec.ts` (10 tests over HTTP, Fintava double: ₦25,000 debits ₦25,065 and the double holds the same; unconfirmed account refused before the PIN with no try used and the key given back; a refused send is pending, then failed, then reversed once; same key twice is one send; `quote_changed`; 402 figures; WAWU's per-transaction limit and the provider's daily limit; own wallet; a changed holder is `account_name_changed` and sent to after `confirmCurrentName`; a lost answer is pending and settled from the record with one call), `bank-send-target.spec.ts` (10), `nuvion-bank-reconcile-seam.spec.ts` (4: a bank send reference `wawu-bank-` is asked of the payouts area, any other the book log never held is not). Typecheck, lint on the changed files and the gates (5 FAIL lines, none in these files) were run; the full suite runs in CI.
Gate counts: executable gates 5 FAIL before and after (none mine); baseline unchanged.
Gaps filed: G-762 to G-766 and closing notes on G-57, G-64, G-410, G-481, G-652, G-653. Shared changes: SHARED-CHANGES WALLET-09 #1 (schema, contract) and #2 (mobile re-sync).
Not done: real-provider checks (sandbox payouts blocked); a Nuvion bank send over HTTP (no stand-in for it; the area is covered by NUV-06's specs and the gate by the unit spec); a per-person rate limit on the name check (G-764).
Test edits (all four lists the serving task must update): `money-contract.spec.ts`, `money-moving-coverage.spec.ts`, `wallet-gate-coverage.spec.ts`, `wallet-gate.contract.spec.ts`; the `> 0` guard on declared controllers is now `>= 0` because the last declaration was served.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

