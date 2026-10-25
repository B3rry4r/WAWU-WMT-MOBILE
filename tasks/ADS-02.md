---
id: ADS-02
title: Admin screens: ads
owner: YOU
area: ADS
order: 43
priority: launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: [ADS-06, ADS-05]
decisions: [R-15]
passes: [V1, V6, V7, V9]
artboards: []
---
# ADS-02 · Admin screens: ads

## Current state

As of 16 Oct 2026, from the branch (built 8 Oct). The lead's log does not mention this task.
- **Status:** verifying. Built; the verifier report is the empty template. This file on main still says todo.
- **Branches:** mobile `wmt/ADS-02` cccb84a (docs only: G-332, SHARED-CHANGES ADS-02 rows, LOG). The screens are on the dashboard repo's branch `wmt/ADS-02`; that repo is not among the three the lead keeps: its head and state are unknown, ask the lead.
- **Merged and live:** nothing. **Open findings:** none yet. G-332: the 11 admin ads routes are not in the protected list (an owner re-lock).
- **Next:** a verifier session, once the lead says where the dashboard repo is.
- **Records:** on the branch, `wmt/ADS-02`, in tasks/ADS-02.md there (11 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py ADS-02`; the history goes to tasks/history/ADS-02.md.

Status set to review by the records sync, 25 Oct 2026: merged as dashboard ee23d21c, verifier PASS in the lead's merge log, 24 Oct (v B13 dashboard PASS).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Staff book, schedule and report on ads.

## Scope

Dashboard screens over ADS-06.

## Capability checks

- [ ] An admin can schedule a sponsored card for a date and later see its views and taps.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
