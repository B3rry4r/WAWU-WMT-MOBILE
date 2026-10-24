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

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge (the second phone answers 'still confirming' in 1.7 s with no Pay; branch CI 39056271768 all 6 green) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-58.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main. Built: Built by a Sonnet builder (tier T1); round 2 on the lead's rulings. Backend `wmt/FIX-58` `8aa5914` (round 1 `5587c3c`, from `wmt/MERGE-10` `3cf5a4b`); this record and the gap row on mobile `wmt/FIX-58` (from `wmt/MERGE-10` `4b854ee4`). No schema, no migration, no Fintava file touched, no app code.
- **Found by:** S5 check F2 (low, G-SCHOOLS-06-1); a CI flake on FIX-54's branch (run 39051857709, job 117451936677).
- **Built (1, G-SCHOOLS-06-1), round 2 scope:** `GET /money/payments/quote` answers `409 payment_in_progress` with `reason.paymentId` and the pay route's own message for a SCHOOL FEE only (`QUOTE_REFUSES_OPEN_KINDS = ['school_fee']`, `wallet-payment.service.ts`), when the SAME payer holds the open payment (`openKey`: pending, under review, or paid and not yet delivered) for the SAME target. Read after the item (`target_not_found` and `target_not_payable` first, as for pay), before pricing. Every other kind keeps today's 200 while open and meets the 409 at the PIN tap; a kind joins the list when its app caller reads the 409. Other payers, other items, ended payments and the service's other callers (plan, points pack, bill, credit pack, event order) are unchanged. Round 1 refused every kind; the lead narrowed it so no Fintava-double spec turns red.
- **Fintava-double check (static read only, none run):** the three `wallet-payment.contract.spec.ts` cases that re-quote while open (about lines 1499, 1600, 2873) all use kind `content_unlock` ('piece-1000'), never a school fee. The only Fintava-double spec with `school_fee` is `school-enrolment.contract.spec.ts`: every `quote` there comes before its payment or on a place that is released, hidden, free or walletless (no open payment), and the second-fee case quotes a different enrolment.
- **Specs (Nuvion):** `wallet-payment-nuvion.contract.spec.ts` 60 of 60: school fee open is 409 (nothing stored or sent, same answer as the tap); school fee unchanged for another payer, another place, a place not there, the service call and after the payment fails; `content_unlock` still quotes 200 while open and the tap is 409; a delivered purchase keeps `target_not_payable`. Contract rebuilt (one summary line).
- **Mobile callers of the quote:** none on this base (`grep payments/quote src` finds only `schema.generated.ts`). The one caller is on `wmt/S5`: `src/features/schools/enrolApi.ts` `fetchFeeQuote` (via `useEnrolPay.askQuote`), which turns this 409 into `OpenPaymentError`: no Pay is drawn and the screen waits on `reason.paymentId`. The events, credits and plans quotes the app calls never reach the new branch.
- **Flake, cause found:** the scan failed on `NuvionEntity` only (the log names a table). An ID-number secret (`A` + 8 digits) can equal a run inside a stand-in id (`01ENT`, `01PER`, `01ACC` + 21 uppercase hex): about 2.8 in 10,000 per run (31 such runs among 1056 rows; planting one reproduces the CI failure on `NuvionEntity.entityId`). No code stores a secret.
- **Built (2, spec only):** the scan names `Table.column (secret shaped A99999999)` when it fails (round 1), and ID-number secrets are now `Q` + 8 digits (round 2, lead ruling: Q is not a hex digit and starts no id prefix). `ulid()`, uuids, BVN and NIN untouched (BVN and NIN stay at about 2.5 in a million per run). The assertion and the hit query are unchanged (SHARED-CHANGES FIX-58 #1). `nuvion-opening` 365 of 365.
- **Checks:** tsc 0, eslint 0 on the four changed files, `contract:build` 0, gates passed, baseline ok; the two specs above 425 of 425.
- **Next:** the batch 12 pull request (the lead). No low is left open.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-SCHOOLS-06-1; wawu-backend `docs/contract/CONVENTIONS.md` section 14 ("One open payment per buyer and item")

## Goal

A second phone is never shown a live Pay for a school fee its payer already has an open payment for, and a failure of the stored-secret scan says which column matched.

## Scope (backend only)

`src/money/payments/wallet-payment.service.ts` and `money-payments.controller.ts`, `contract/openapi.json` (generated), `docs/contract/CONVENTIONS.md`, `src/money/payments/tests/wallet-payment-nuvion.contract.spec.ts` (4 cases added), `src/nuvion/tests/nuvion-opening.contract.spec.ts` (failure report; ID-number secrets `Q` + 8 digits).

## Capability checks

- [x] The quote of a school fee this payer has open is `409 payment_in_progress` with the open payment's id and the pay route's message; nothing stored, sent or moved.
- [x] Another payer, another place, an ended payment, every other kind and the feature quotes are unchanged.
- [x] A delivered purchase keeps `target_not_payable` at the quote.
- [x] The scan names table, column and secret shape on a hit (shown by planting one).

## Owner sign-off

Not needed.
