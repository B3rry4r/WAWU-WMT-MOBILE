---
id: WALLET-29
title: Move existing creators off Flutterwave
owner: YOU
area: WALLET
order: 270
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [RELEASE-02]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-29 · Move existing creators off Flutterwave

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs RELEASE-02 built first.
- **History:** none yet. Reports go to tasks/history/WALLET-29.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Creators with a Flutterwave payout balance are moved last, after the new wallet is proven.

## Scope

On the owner's date: pay out or move each Flutterwave balance, then close the subaccount. No balance is lost.

## Capability checks

- [ ] Every Flutterwave subaccount ends at zero with a matching ledger entry.
- [ ] Each creator was told before the move.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
