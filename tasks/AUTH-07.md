---
id: AUTH-07
title: The sign-up sequence end to end
owner: DEV2
area: AUTH
day: 3
repo: wawu-id
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: [AUTH-03, AUTH-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# AUTH-07 · The sign-up sequence end to end

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

The mobile sign-up (A2-A10) is one sequence the server enforces: no wallet before BVN, no money before PIN.

## Scope

The registration state machine and its endpoints; each step refuses to run before the previous one completed.

## Capability checks

- [ ] Skipping straight to PIN creation without BVN is refused.
- [ ] Quitting after the selfie and coming back resumes at the next step.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
