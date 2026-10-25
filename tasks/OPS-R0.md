---
id: OPS-R0
title: Records pass and the approved workflow change
owner: YOU
area: OPS
order: 33
priority: launch
repo: wawu-wmt-mobile
type: setup
status: review
depends_on: []
decisions: [R-49]
passes: [V1]
artboards: []
tier: T0
---
# OPS-R0 · Records pass and the approved workflow change

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Accepted by the lead on a read of the diff (T0, tasks and docs only, 0 em-dashes; no verifier agent). Stacked in batch 9 by MERGE-9. Records and docs only. No app code, no stack, no jest.
- **Branch:** `wmt/OPS-R0` from `origin/wmt/MERGE-7` `ff5e90f`. Mobile repo only.
- **Done:** 27 tasks live on main flipped to `status: done` (each branch checked as an ancestor of `origin/main` first; none skipped). 15 tasks moved to `priority: after-launch`.
- **Moved, with the ruling in each Current state:** WEBPAY-01 to 05, FIX-23, FIX-25, FIX-16 (R-49); BILLS-02, 03, 05, 06 (R-42, R-52); OPS-09, OPS-10 (R-39, R-45; NUV-10 replaces OPS-10); NUV-09 (R-16, R-64, R-65).
- **Forced by the task check:** after-launch tasks must come after RELEASE-02 (order 299), so the 15 got orders 339 to 353 in their old relative order, and SWEEP-WEB moved from 327 to 354 (it depends on WEBPAY-01). A launch task cannot depend on an after-launch one, so these `depends_on` entries were dropped: CHECK-2 (BILLS-03, WEBPAY-04, WEBPAY-05), CHECK-3 (BILLS-05), NUV-10 (NUV-09), WALLET-15 (OPS-09). NUV-10's "Next" line says NUV-09 is no longer a dependency.
- **WORKFLOW.md:** the eight approved changes (owner approved, 17 Oct 2026): section 4 (steps 3 and 5, budgets), new section 4a (effort tiers), section 5 (passes per tier), section 6 (inbound links), section 8 (steps 1, 3, 4, new step 10 bundles), section 9 (mobile check per batch), section 10 (six cases, defaults listed). `tasks/TEMPLATE.md` shows the optional `tier` line.
- **check_tasks.py:** unchanged. It does not reject unknown front matter keys, so `tier` already passes.
- **Open findings:** none known. FIX-25 lists the mobile repo (the app's web build) beside the website; R-49 pauses its web half, so the lead may want a separate app-half task.

Status set to review by the records sync, 25 Oct 2026: merged as app 685f4938, lead acceptance in this file (accepted by the lead on a read of the diff).

## Read first

- `docs/WORKFLOW.md`

## Goal

The task files say what is true: tasks live on main are done, and work the rulings take out of launch is after launch. The workflow file matches the way the owner approved on 17 Oct 2026.

## Scope

`tasks/*.md` front matter and Current state lines, `tasks/TEMPLATE.md`, `docs/WORKFLOW.md`, and the files `check_tasks.py --write` regenerates (`tasks/INDEX.md`, `docs/PROGRESS.md`).

## Capability checks

- [ ] `python3 scripts/tasks/check_tasks.py` exits 0 with the 27 flipped and the 15 moved.
- [ ] `docs/WORKFLOW.md` carries the eight changes and no em-dash.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OPS-R0.md](history/OPS-R0.md).

## Owner sign-off
