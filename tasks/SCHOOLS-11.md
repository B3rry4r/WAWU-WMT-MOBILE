---
id: SCHOOLS-11
title: Pay schools their share of course fees
owner: YOU
area: SCHOOLS
order: 146
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [SCHOOLS-07, WALLET-09]
decisions: [R-12, R-10, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# SCHOOLS-11 · Pay schools their share of course fees

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Backend `wmt/B2` (from `origin/wmt/MERGE-7` 432f017), SCHOOLS-11 at 9b41f13 on top of SCHOOLS-09 (1ba6884). Mobile `wmt/B2` carries the records, the contract copy and the API types only. Migration `20261025131000_school_settlement` (`CourseIntake.cancelledAt`, tables `SchoolPayee` and `SchoolSettlement`).
- **Built** (backend `src/schools/settlement/`): at a class's start (Lagos date, per enrolment) the school's 85% is sent from WAWU's merchant account to its bank account through the seam (`provider.bankTransfer` from `{ kind: 'merchant' }`, reference `wawu-bank-sch-<id>`); a class called off sends the whole fee back to the student's wallet through the hold (`holds.refund`; the charge on the original payment is not returned, R-10). The bank's charge on the payout is WAWU's, from its 15% (R-31). `SchoolPayee` is saved only after the bank's name check confirms the account (`PUT /admin/schools/{id}/payee`, holder's name kept, a miss saves nothing). Dashboard routes for finance and the superadmin: payee get and put, `GET /admin/school-settlements`, `POST /admin/school-intakes/{id}/cancel`, `POST /admin/school-enrolments/{id}/refund`.
- **One decision per enrolment:** `SchoolSettlement.enrolmentId` is unique and decisions run under a lock on the enrolment. A payout not yet handed to the provider can become a refund; one handed over cannot (409). A payout is leased (`sentAt`), confirmed only from the provider's record (`reconcileSend`), asked about and never re-sent on an unknown outcome, retried once under `-2` only after the provider's record says failed, and a second failure goes to review with the money held. The ledger gets the movement, then the hold is released (no WAWU payee, nothing moves), then the settlement is `paid`.
- **Attack results (spec `school-settlement.contract.spec.ts`, 14 tests green):** five parallel sweeps pay three enrolments once each; a failed payout is retried once and never doubles (balance and send count asserted), twice failed goes to review; a lost answer is never re-sent; a refund after the payout is refused with nothing moved; cancel and payout racing leave each fee one way only; school share + WAWU's 15 = fee to the kobo on odd fees (database CHECK too); the ledger's completed payouts equal the stand-in's successful bank sends after each.
- **Checks:** `tsc --noEmit` 0; eslint 0 on touched files; `wallet-hold-nuvion.contract.spec.ts` (11) still green on the extended stand-in; account purge and export map specs green. Contract additive (five admin routes, nothing changed). CI on 9b41f13: Branch checks run 39040062677, Gates 39040062651 (green), Protected routes 39040062684 (green).
- **NOT RUN:** a real Nuvion call or sandbox (stood in at the seam, `test/payments/nuvion-seam-standin.ts` gains bank sends); the real adapter's bank send over HTTP in this task's specs (NUV-06's own specs cover it); the app. Nothing Fintava was run.
- **Defaults I set:** a payout is due on the class's start date (Lagos), as enrolment closes after it; payee rests and review bound are the hold sweep's (1 to 60 minutes, PAYMENT_REVIEW_AFTER_HOURS); a school is paid by bank transfer only (schools are not WAWU users, so there is no wallet path).
- **Fences touched:** SHARED-CHANGES SCHOOLS-11 #1 (schema, contract, purge map not-a-user row, `AdminSchoolsModule` import).
- **Next:** a verifier. Passes V1, V2, V3, V4, V6, V7, V8, V9.
- **History:** reports go to tasks/history/SCHOOLS-11.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Enrolment money reaches the school at the ruled split.

## Scope

School payee details and verification; settlement from WAWU's merchant wallet at R-12's split. A school that isn't
on WAWU is paid by bank transfer (WALLET-09; Fintava's ₦40 is WAWU's, R-31). Paid at intake start; a cancelled
intake refunds the student's course fee to their wallet (the R-10 refund default).

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Capability checks

- [ ] After an enrolment, the school's settlement equals the ruled amount and the ledger shows WAWU's share.
- [ ] V8: a replayed settlement does not pay twice.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SCHOOLS-11.md](history/SCHOOLS-11.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
