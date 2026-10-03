---
id: MONEY-08
title: Status checks and the pending sweep
owner: YOU
area: MONEY
order: 67
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [MONEY-07, MONEY-10]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-08 · Status checks and the pending sweep

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A transfer stuck 'pending' because a webhook never came gets settled anyway.

## Scope

Port the existing reconcile-pending pattern to Fintava's status endpoint, on a schedule.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

Work from the ledger (MONEY-10), not the event rows: MONEY-10 marks `customer_bank_transfer` and `debit_transfer_reversal` deliveries `processed` once applied, so this task settles `pending` ledger rows (`LedgerConsumerService.reconcileEntry` asks Fintava for one) and reads a reversal as the row's `reversed` status (`BACKEND_GAPS.md` G-33).

## Capability checks

- [ ] A transfer whose webhook is withheld settles correctly within one sweep.
- [ ] A transfer Fintava reports failed is reversed exactly once.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-08` 0eb32a9 on main `e8535d8`; mobile `wmt/MONEY-08` on main `176a56d` (neither main moved).
- **Built (`src/money/ledger/`):** `LedgerStatusService` (`ledger-status.service.ts`), exported by `LedgerModule` (no change to `money.module.ts` or `app.module.ts`): `@Cron` every minute over `pending` `FintavaLedgerEntry` rows older than 2 minutes (`LEDGER_STATUS_CHECK_AFTER_MINUTES`, `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)`), oldest first, 50 a pass; `check(entryId)` for one row. Works from the ledger, never the event rows (G-33). The bills sweep's reconcile-pending pattern, on Fintava's status endpoint: our send is asked by our reference through MONEY-06's `reconcile` (lookup, then the sender's history) and `decideFintavaRetry`; anything else (money in, a bill) by its own references (lookup, then by id). `ledger.service.ts`: status rules below, `markAbsentFailed`, `noteDiscrepancy`. `ledger-consumer.service.ts`: `reconcileEntry` now calls `check` instead of duplicating it. `.env.example`; read-only `scripts/fintava/status-sandbox-check.ts`. No route, schema, migration or contract change.
- **What a check does:** SUCCESS: completed. FAILURE/CANCELLED: failed ("Fintava reports this transfer failed."); only Fintava's `debit_transfer_reversal` makes it `reversed`. PENDING, `{}`, unreadable or unreachable: unchanged, asked again after 1, 2, 4 ... 60 minutes (in memory). Fintava's own 404 and no history row for OUR reference, past the money timeout plus resend safety: failed, "Fintava has no record of this transfer, so no money moved." (never for bills, which carry no reference of ours at Fintava, or for references not ours). Another amount at Fintava: a stop: written on `discrepancy`, status not moved, row no longer swept. It never sends money (no resend, no refund) and never sums.
- **Check 1, a withheld webhook settles within one sweep:** `ledger-status.contract.spec.ts` (real database, real MONEY-06 client against the Fintava double with the sandbox's record shapes, deliveries signed locally and posted to MONEY-07's route): WAWU's send found by lookup, completed in one `sweep()` with Fintava's references filled, and the late webhook lands on the same row; a person's bank send with a `{}` lookup found in their history, one sweep; a row under 2 minutes not asked, then settled in the next sweep; money in settled by its own reference; the sweep's check, the webhook and two more checks at once: one row. Sandbox, read only (`docs/fintava/sandbox/31-money08-status.md`): MONEY-10's real ₦10 sends, webhooks withheld, settled in one sweep; a never-used reference failed as absent; a ₦20 row against Fintava's ₦10 recorded, not settled; 8 GETs.
- **Check 2, a transfer Fintava reports failed is reversed exactly once:** same spec: FAILURE with the reversal withheld: one sweep fails it; three checks and a sweep at once change nothing; no POST reached Fintava and no credit row exists; two reversal deliveries consumed at once: one "marked reversed", one "was already reversed", one row with the reversal figures; a late SUCCESS and another check leave it reversed. Reversal first: reversed, then the sweep never asks. Bank sends: NOT RUN in the sandbox (below).
- **Mutations** (each alone, ledger specs re-run, files restored by sha1): absent never failed, completed may become failed, no amount check, bills checked by our reference, no 2-minute age, any non-found answer failed, no revival, a recorded disagreement ignored, no resend window, no failure reason, no rest: 11 of 11 killed.
- **Decisions, Default (agent), owner may override:** (1) U-1: a completed row never becomes `failed`; a later FAILED is recorded on `discrepancy` (`ledgerStatusMayMove('completed','failed')` is false; only a reversal moves a completed row). (2) U-2: `" 10.00 "` stays exactly 1000 kobo (nothing is rounded; MONEY-06's helper unchanged; tested through a status answer). (3) Fintava having no record of our send past the resend window fails the row with no money moved; a later sighting of that reference (a resend under it, or a record Fintava did not serve) undoes it, noted on `discrepancy`. (4) An amount that differs from Fintava's record settles nothing and leaves the row for review. (5) The check returns MONEY-06's decision and never resends; resending under a lock is the sending feature's (G-34). (6) A FAILURE ends `failed`, not `reversed`, until Fintava's reversal arrives (G-35). (7) Every minute, 2 minutes after a row is recorded, backoff in memory (a restart re-checks every waiting row once, harmless).
- **Checks:** `tsc --noEmit` 0; eslint 0 on the 9 changed `.ts` files; ledger, Fintava and webhook specs (`src/money/ledger src/fintava`) 12 suites, 716 passed; the new specs 18 (contract) + 2 (unit); full `test:contract` on a fresh seeded `m08_full_test`, WAWU ID stand-in on :4892: 118 suites, 2,781 passed, 3 skipped, 40 failed, all `fetch failed` in the 4 suites that hard-code `localhost:4001` (`account`, `credits-state`, `kyc-submission`, `privacy-settings`); those 4 on a fresh seeded `m08_p4001_test` with a mock on :4001 (`lsof` empty before and after, stopped straight after): 4/4 suites, 40/40, so 2,821 passed, 0 failed; protected `run.sh --fresh` 253/253, all 244 required (lock `origin/main`; no lock, registry, contract, prisma or protected-suite file touched); gates before 16 fail / 8 warn / 76 accepted (608 files), after 16 / 9 / 76 (611 files): the same 16 fails, the new warn is `PROVISIONAL(LEDGER-STATUS-CHECK-AFTER)`; `check_baseline.py` passes; CI tripwire 0 added lines; key scan 0 of 58 windows on the backend diff, the sandbox output and the mobile diff. Mobile `npm run check` on the branch: exit 0 (typecheck 0, lint 0, 19 suites / 345 tests, gates 0 fail / 0 warn on 90 files, 202 tasks; the same counts FIX-01 recorded on main, not re-run on main here).
- **Gaps:** G-34 (resends belong to the sending features: WALLET-07, WALLET-09, MONEY-17, MONEY-18), G-35 (a failed bank send whose reversal never arrives, and rows left with a disagreement, for MONEY-16); G-33 notes MONEY-08 is built on the ledger rows. No shared-change request.
- **NOT RUN:** bank sends, their FAILURE and `debit_transfer_reversal`, and bills against the sandbox: the sandbox refuses every payout with `400 "Unable to find customers"` (question 17); unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers". A real (not locally signed) delivery: unblocked by OPS-10 registering the production webhook URL (G-19). V10: no screen.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
