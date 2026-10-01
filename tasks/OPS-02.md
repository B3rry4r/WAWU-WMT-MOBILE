---
id: OPS-02
title: Fintava docs, sandbox keys and the 14 sandbox calls
owner: YOU
area: OPS
day: 0
repo: wawu-wmt-mobile
type: ops
status: ready
blocked_by: ""
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-02 · Fintava docs, sandbox keys and the 14 sandbox calls

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Dev 1 builds the money layer from Fintava's real API, not from guesses. Field names come from real responses.

## Scope

docs/fintava/: the API docs (or links), and one file per sandbox call with request and full response (keys and BVNs masked). Webhooks with headers. Answers on: holds/lien, PIN, BVN/NIN/liveness, fees, tier limits, paying a non-user payee, licence wording, and whether USD, crypto and cards are in the contract.

## Capability checks

- [ ] docs/fintava/ has the 14 calls listed in docs/PLAN.md, each with request and response.
- [ ] Every question in docs/PLAN.md 'Questions for Fintava' has a written answer or 'unknown'.
- [ ] No secret or real BVN is committed (gates and a manual read).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
