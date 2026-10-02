---
id: OPS-02
title: Fintava test keys: the first real calls
owner: YOU
area: OPS
order: 3
priority: launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-02 · Fintava test keys: the first real calls

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Money is built from Fintava's published docs (`docs/fintava/`), so nothing waits on this task. When the test (sandbox) keys arrive, this task runs the real calls and corrects anything the docs got wrong before money goes live (CHECK-2).

## Scope

The published docs are already in `docs/fintava/reference/`, digested in `docs/fintava/naira-api.md`. Still needed: sandbox keys in the backend's local `.env` (not committed), one file per sandbox call with request and full response (keys and BVNs masked), webhooks with their headers, and written answers to the questions at the end of `naira-api.md`. Correct `naira-api.md` wherever a real response differs.

## Capability checks

- [ ] docs/fintava/ has every sandbox call listed in docs/PLAN.md, each with request and response.
- [ ] Every question at the end of `docs/fintava/naira-api.md` has a written answer or 'unknown'.
- [ ] No secret or real BVN is committed (gates and a manual read).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
