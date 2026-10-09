---
id: WEB-01
title: Port web-only features after launch
owner: YOU
area: OPS
order: 269
priority: after-launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [OPS-07]
decisions: [R-34]
passes: [V1, V3, V4, V5, V6, V7, V9]
artboards: []
---
# WEB-01 · Port web-only features after launch

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 6, add then move then remove)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/WEB-ONLY-FEATURES.md` (the 89 rows and the money and data groups; this task is the "web-port task" every row names)
- This task changes `wawuafrica`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: Authority (owner, 1 Oct 2026) and R-34

## Goal

The web follows the app after launch (R-34). `docs/WEB-ONLY-FEATURES.md` lists what the web has that the app does not. When this is done, the web team has taken each of those rows through the web in small slices, and nothing a web user owns (money or data) was lost on the way.

## Scope

Work in `wawuafrica`, one small slice per pull request (rule 2). Split this task into slices before starting; each slice names the rows it carries.

First concern, before any screen: the money and data groups in section 2 of `docs/WEB-ONLY-FEATURES.md` (M1 to M20). Each slice that touches one of them follows add, then move, then remove (`docs/WORKFLOW.md` section 6) and keeps what the group's "Migrate or keep" line says.

Whether a listed feature is built, kept or cut on the web is not decided here and not decided by `docs/WEB-ONLY-FEATURES.md`. Three questions are open and need an owner ruling before the slice that depends on each:
- M1: whether old Flutterwave ledger history is copied into the new wallet's history or stays on the web only.
- M6: which name wins when a typed sign-up name and a BVN name differ.
- M9: what the app shows a creator already at `disabled_30d`.

Rows the document marks "built in the app" or "drawn on the canvas, task X todo" are re-checked against `origin/main` of `wawu-wmt-mobile` when the slice starts, because the app keeps moving.

## Capability checks

- [ ] For each money and data group a slice touched, the rows the web read before the port are still readable after it with the same values (V4 field trace, before and after counts).
- [ ] No Flutterwave path the web still uses is removed before WALLET-30's two weeks of zero calls.
- [ ] Each of the 89 rows in `docs/WEB-ONLY-FEATURES.md` has a recorded outcome (ported, left as is, or ruled out by the owner with the ruling cited).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
