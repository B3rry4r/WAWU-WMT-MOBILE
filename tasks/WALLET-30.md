---
id: WALLET-30
title: Remove the Flutterwave payment paths
owner: YOU
area: WALLET
order: 271
priority: after-launch
repo: wawu-backend
type: removal
status: todo
depends_on: [WALLET-29]
decisions: []
passes: [V1, V3, V4, V7, V9]
artboards: []
---
# WALLET-30 · Remove the Flutterwave payment paths

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs WALLET-29 built first.
- **History:** none yet. Reports go to tasks/history/WALLET-30.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Remove each Flutterwave path once its logs show no calls for two weeks.

## Scope

One path at a time, with every reference found first.

## Capability checks

- [ ] Logs show zero calls to each removed path for the two weeks before removal.
- [ ] V3 passes on the rebuilt route list.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
