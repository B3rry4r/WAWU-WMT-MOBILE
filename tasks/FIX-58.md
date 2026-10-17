---
id: FIX-58
title: The payment quote refuses an item the same payer has open, and the secret scan names where it matched
owner: YOU
area: FIX
order: -58
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-58 · The payment quote refuses an item the same payer has open, and the secret scan names where it matched

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder (tier T1). Backend `wmt/FIX-58` `5587c3c` (from `wmt/MERGE-10` `3cf5a4b`); this record and the gap row on mobile `wmt/FIX-58` (from `wmt/MERGE-10` `4b854ee4`). No schema, no migration, no Fintava file touched, no app code.
- **Found by:** S5 check F2 (low, G-SCHOOLS-06-1); a CI flake on FIX-54's branch (run 39051857709, job 117451936677).
- **Built (1, G-SCHOOLS-06-1):** `GET /money/payments/quote` answers `409 payment_in_progress` with `reason.paymentId` and the pay route's own message when the SAME payer holds the open payment (`openKey`: pending, under review, or paid and not yet delivered) for the SAME kind and target. Read after the item (`target_not_found` and `target_not_payable` come first, as for pay), before anything is priced. Another payer, another item, or an ended payment: the quote is unchanged. The service's other callers (plan, points pack, extra products, bill, credit pack and event order quotes) do not set the option and are unchanged. Contract rebuilt (two lines), CONVENTIONS section 14 says it. Specs: 3 added in `wallet-payment-nuvion.contract.spec.ts` (59 of 59).
- **Mobile callers of the quote:** none on this base (`grep payments/quote src` finds only `schema.generated.ts`). The one caller is on `wmt/S5`, not yet in this base: `src/features/schools/enrolApi.ts` `fetchFeeQuote` (via `useEnrolPay.askQuote`) already turns this 409 into `OpenPaymentError`: no Pay is drawn and the screen waits on `reason.paymentId`. The feature quotes the app does call (`/events/orders/wallet/{id}/quote`, `/credits/purchase/wallet/quote`, `/plans/purchases/quote`) never reach the new branch.
- **Flake, cause found:** the scan failed on `NuvionEntity` only. The log names a table, not a column. A local run holds 1056 `NuvionEntity` rows and about 800 ID-number secrets (`A` + 8 digits); the stand-in ids (`01ENT`, `01PER`, `01ACC` + 21 uppercase hex) contain 31 `A`+8 digit runs (22 `entityId`, 8 `personId`, 1 `accountId`). One run draws a matching secret with chance about 2.8 in 10,000. Planting such a run as a secret reproduces the CI failure exactly (`["NuvionEntity"]`, column `entityId`). BVN and NIN (11 digits) can only collide with the 141 eleven-digit digit runs inside hex ids and uuids, about 2.5 in a million per run. No code stores a secret: 2410 secrets, no hit in a normal run.
- **Built (2, spec only):** the scan now reports `Table.column (secret shaped A99999999)` (shape only, never the secret) when it fails; the assertion is unchanged (SHARED-CHANGES FIX-58 #1). 365 of 365.
- **Proposal for the lead (not applied):** ID numbers `A` + 8 digits become `Q` + 8 digits (Q is not a hex digit and starts no id prefix), which removes the 2.8 in 10,000. To make the BVN and NIN case impossible too: `ulid()` and the spec's user uuids re-draw until they hold no run of 11 digits, and BVN and NIN start with 5 to 9 (phones start 2 to 4, epoch times 1).
- **Checks:** tsc 0, eslint 0 on the four changed files, gates passed, baseline ok; payment, plan, hold, Nuvion book, schools settlement and report, points convert specs all pass (no Fintava-double spec run).
- **Next:** CI on `wmt/FIX-58`, then a verifier.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-SCHOOLS-06-1; wawu-backend `docs/contract/CONVENTIONS.md` section 14 ("One open payment per buyer and item")

## Goal

A second phone is never shown a live Pay for an item its payer already has an open payment for, and a failure of the stored-secret scan says which column matched.

## Scope (backend only)

`src/money/payments/wallet-payment.service.ts` and `money-payments.controller.ts`, `contract/openapi.json` (generated), `docs/contract/CONVENTIONS.md`, `src/money/payments/tests/wallet-payment-nuvion.contract.spec.ts` (3 cases added), `src/nuvion/tests/nuvion-opening.contract.spec.ts` (failure report only).

## Capability checks

- [x] The quote of an item this payer has open is `409 payment_in_progress` with the open payment's id and the pay route's message; nothing stored, sent or moved.
- [x] Another payer, another item, an ended payment and the feature quotes are unchanged.
- [x] A delivered purchase keeps `target_not_payable` at the quote.
- [x] The scan names table, column and secret shape on a hit (shown by planting one).

## Owner sign-off

Not needed.
