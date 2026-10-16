---
id: BILLS-04
title: Pay bills from the wallet (backend)
owner: YOU
area: BILLS
order: 115
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-18, MONEY-19, MONEY-13, MONEY-16, WALLET-15]
decisions: [R-10, R-19, R-20, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
On hold since 6 Oct 2026: the wallet provider is moving from Fintava to Nuvion, which has no bill payments. The owner decides whether bills stay (drop, or a separate bills provider).

# BILLS-04 · Pay bills from the wallet (backend)

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs MONEY-17, MONEY-18, MONEY-19, MONEY-13, MONEY-16, WALLET-15 built first.
- **History:** none yet. Reports go to tasks/history/BILLS-04.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

A bill is paid from the user's wallet with the PIN: the money moves into WAWU's merchant wallet, then to the biller, and comes back by itself if the biller fails (R-19). Bill payments move to Fintava; the web keeps Flutterwave until after launch.

## Scope

Bills pay from the wallet into WAWU's merchant wallet, then the biller (no 85/15 on bills: the full amount goes to the biller); the electricity token and units come back (S7); a biller failure reverses the debit automatically (S12). The web stays on Flutterwave until after launch; V3 checks it still works.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Capability checks

- [ ] A user pays an electricity bill from their wallet with their PIN and gets the token (S7), or a gap is filed if Fintava's response has none.
- [ ] A biller failure returns the money to the user's wallet without anyone acting (S12).
- [ ] A bill below the disco's own minimum is refused before any debit.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
