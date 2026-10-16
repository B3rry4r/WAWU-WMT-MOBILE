---
id: INBOX-16
title: Buy WAWU Credits from the wallet (backend)
owner: YOU
area: INBOX
order: 102
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-13, MONEY-16, WALLET-15]
decisions: [R-5, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-16 · Buy WAWU Credits from the wallet (backend)

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): MONEY-16.
- **History:** none yet. Reports go to tasks/history/INBOX-16.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A user buys WAWU Credits from their wallet with the PIN; credits are a count, never naira (R-5). The web keeps Flutterwave until after launch.

## Scope

Credits purchase pays from the wallet (I28); credit lots and the 85/15 split unchanged; the web's Flutterwave purchase keeps working. The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A user buys 120 credits for ₦1,000: their wallet drops by ₦1,023.25 once and their credits go up by 120, shown as a count (R-5).
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
