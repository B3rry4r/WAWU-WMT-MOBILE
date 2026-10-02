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

Write `docs/designer/BRIEF.md`: every change the designer must make, one per artboard id, with the ruling or fact behind it. At least: Shop to Schools on the Home tile and Me menu (R-2); no profile Shop tab (M3, R-9); no "Move to wallet" (W39, W40, R-11); NIN and address fields in Open your wallet, and no "blink" or liveness wording on A6 (`docs/fintava/naira-api.md`); fee lines showing Fintava's charge plus WAWU's (R-10, `docs/fintava/fees.md`), including bills, which are not free; the bank and licence lines from config (Loma Bank, R-1); crypto without BTC and a 90-second quote (`docs/fintava/cardex.md`); the ₦ glyph (D15). Then the owner sends it, and when the new export arrives: replace `design/`, re-run `render_design.py --inventory`, and record the changed hashes.

## Capability checks

- [ ] `docs/designer/BRIEF.md` lists every change above by artboard id, each with its ruling or fact, in words the designer can act on without this repo.
- [ ] The new export has no Shop tile on H1 and no 'My purchases → orders' Shop link.
- [ ] design/canvas-inventory.json is regenerated and the changed artboards are listed in the PR.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
