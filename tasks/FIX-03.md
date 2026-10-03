---
id: FIX-03
title: The PIN reset spec's leak scan never matches by chance (backend main's deploy)
owner: YOU
area: FIX
order: 105
priority: launch
repo: wawu-backend
type: setup
status: building
depends_on: [MONEY-14]
decisions: [R-25]
passes: [V1, V2, V3]
artboards: []
---
# FIX-03 · The PIN reset spec's leak scan never matches by chance (backend main's deploy)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/MONEY-14.md` (the PIN reset and its contract spec, `src/money/pin/tests/pin-reset.contract.spec.ts`)
- `tasks/FIX-02.md` (the same kind of fix: a deploy-blocking spec made reliable, never by a retry or a looser check)

## Goal

Backend main `48b9043` (MONEY-14, PR #43) carries a spec that fails now and then: "nothing secret leaves the
server" in `pin-reset.contract.spec.ts` scans every log line, answer and stored column for the codes and PINs the
file sent, and once in a full-suite run (MONEY-15 round-2 verifier) it found one that nothing had leaked. It passed
3 of 3 alone. The deploy workflow runs the whole suite, so a chance failure stops a production deploy.

## Scope

Test files only: the spec and its harness (`test/money/pin-approval-harness.ts`). No product code, route,
contract, schema or config. Reproduce first and name the cause; then make the scan unable to match by chance
without making it weaker: it must still fail when the code or a PIN is really logged or answered.

## Capability checks

- [ ] The failure is reproduced and what matched is named.
- [ ] The spec passes 100 times in a row, and the whole contract suite passes on a fresh migrated database.
- [ ] A real leak still fails it: the service made to log the code, and made to log a PIN, each fail the scan.

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
