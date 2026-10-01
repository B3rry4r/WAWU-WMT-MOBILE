---
id: OPS-04
title: Designer: Shop to Schools, the ₦ glyph, real numbers
owner: YOU
area: OPS
order: 5
priority: launch
repo: design
type: ops
status: todo
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-04 · Designer: Shop to Schools, the ₦ glyph, real numbers

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

The canvas still draws Shop, and its figures are placeholders. Screens built from it inherit both.

## Scope

Ask the designer to swap the Home tile and Me-menu entry to Schools (R-2), answer D15 (₦ glyph), and replace each ⚠ placeholder once Fintava's numbers are in. Re-export the bundle; re-run `render_design.py --inventory` and record changed hashes.

## Capability checks

- [ ] The new export has no Shop tile on H1 and no 'My purchases → orders' Shop link.
- [ ] design/canvas-inventory.json is regenerated and the changed artboards are listed in the PR.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
