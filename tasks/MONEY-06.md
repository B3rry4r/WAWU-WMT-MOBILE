---
id: MONEY-06
title: Fintava client
owner: DEV1
area: MONEY
day: 2
repo: wawu-backend
type: third-party
status: queued
blocked_by: ""
depends_on: [OPS-02, MONEY-04]
decisions: []
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# MONEY-06 · Fintava client

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

One place that talks to Fintava, replacing the Flutterwave wallet gateway behind the same interface.

## Scope

Auth and request signing, sandbox and live config, error mapping to our error shape, timeouts, env vars listed in the deploy checklist.

## Capability checks

- [ ] Against the sandbox, every call used by later tasks succeeds and a bad key gives a clear typed error.
- [ ] No Fintava secret appears in logs.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
