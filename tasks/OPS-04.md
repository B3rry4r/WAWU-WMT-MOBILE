---
id: OPS-04
title: Designer: Shop to Schools, the ₦ glyph, real numbers
owner: YOU
area: OPS
order: 5
priority: launch
repo: design
type: ops
status: verifying
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

Builder, 2 Oct 2026. Status `verifying` covers the brief only; checks 2 and 3 wait on the designer's new export.

- **Files:** added `docs/designer/BRIEF.md`; this report. Nothing in `design/` touched.
- **Check 1 (brief), ready for the verifier:** 60 entries grouped by flow (Everywhere 1, Home 4, Me 10, Shop 2, Schools 2, Open your wallet 7, Wallet 23, Bills 7, Events 1, Settings 3), each with artboard id, what's drawn now, what to show, and the ruling or Fintava/Cardex fact. Found by splitting `design/*.sections.json` per artboard and searching for Shop, Fintava MFB, CBN, No fee, Fee, blink, BTC, 30 seconds, Move to wallet. Rendered 61 artboards (H1 H36 M1-M7 M10 M29 M33 SH9 W39 W40 A3 A5-A8 A14 A16-A20 W1-W3 W5 W10-W12 W14-W17 W19-W23 W29 W30 W35 W41-W43 Z9 Z10 S3 S5 S6 S8 S9 S11 S12 S30 H14 E3 SC5) and looked at the light renders.
- **Check 2 (no Shop tile on H1, no My purchases to orders link): NOT RUN.** The new export doesn't exist yet.
- **Check 3 (inventory regenerated, changed artboards listed): NOT RUN.** Same reason.
- **Gates:** before, the first run exited 2 because the worktree had no `node_modules` (tsc couldn't find expo/jest/node types); with the main checkout's `node_modules` linked in (untracked, removed after), exit 0: tsc clean, lint clean, 4 of 4 tests, gates 9 run / 5 files / 0 findings, baseline 0, tasks 187 / 280 artboards. After: identical.
- **Can't be placed on one artboard:** the Home, Me, Schools, Shop and Settings "Start here" maps (no ids); D15 (₦ glyph) is the font, not an artboard.
- **For the owner, not ruled:** (1) whether a buyer pays Fintava's wallet-to-wallet charge on unlocks, tickets and school fees (H14, E3, SC5 draw a breakdown that must also work at ₦0); (2) what A17 to A20 become, now NIN and address are taken when the wallet opens and Fintava has no tiers; (3) if the designer deletes SH1-SH15, M3 or W40, the `not-built` list in DECISIONS.md needs updating with the new inventory.
- **No gaps or shared-change requests filed.**

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
