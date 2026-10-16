---
id: GATES-02
title: Record the five gate lines in the backend baseline
owner: YOU
area: GATES
order: 254
priority: launch
repo: wawu-backend
type: backend-refactor
status: todo
depends_on: []
decisions: [R-60]
passes: [V1, V2, V3, V9]
artboards: []
---
# GATES-02 · Record the five gate lines in the backend baseline

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** S. **Wave:** 1 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below. Nothing blocks it; ready to schedule.
- **History:** none yet. Reports go to tasks/history/GATES-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-60 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The backend gates' baseline holds the gate findings the owner said to record on 16 Oct 2026 (R-60), each with an owner and a reason, so the gates stop re-reporting them. No gate, test or rule changes.

## Scope

- The baseline file the gates read (`python3 scripts/gates/check_baseline.py` names it) and nothing else. This is the owner's explicit instruction to record these lines; it is not a way to make a check pass.
- The entries: the four false positives of the deferral check listed in `tasks/SWEEP-APP.md` row GATES-01 L2 (`admin-notifications.controller.ts:40`, `compose-campaign.dto.ts:44`, `notification-event.ts:496`, `flutterwave-wallet.gateway.ts:72`). The owner counted five; this repo lists four. The lead names the fifth in the dispatch prompt. If it does not, record the four, report "five asked, four listed" and stop; never invent an entry.
- The two stale entries of row GATES-01 L1 stay as they are unless the lead says to remove them.

## Capability checks

- [ ] `python3 scripts/gates/run.py` reports the recorded lines as accepted findings, not new ones.
- [ ] `python3 scripts/gates/check_baseline.py` passes: every entry has an owner and a reason.
- [ ] The gate fail count on main does not go up, and no gate or test file is edited (diff shows only the baseline).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
