---
id: GATES-02
title: Record the five gate lines in the backend baseline
owner: YOU
area: GATES
order: 254
priority: launch
repo: wawu-backend
type: backend-refactor
status: verifying
depends_on: []
decisions: [R-60]
passes: [V1, V2, V3, V9]
artboards: []
---
# GATES-02 · Record the five gate lines in the backend baseline

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Backend `wmt/GATES-02` at `1d03bc2` (main `a5e48fc`, batch 5, merged in; the forks entry for `FlutterwaveConfigResponse` re-keyed to its new line `content-piece.service.ts:62`, same owner and reason; gates 0 fail, baseline check passes; CI green, run 38985246402, Executable gates included); mobile `wmt/GATES-02` (this record). Migration: none. No PR.
- **Built:** five entries added to `scripts/gates/baseline.json` in the backend (88 accepted, was 83). Nothing else changed: no gate, test, source file or contract. The two stale GATES-01 L1 entries are untouched.
- **The five:** four false positives of the deferral check (`admin-notifications.controller.ts:40`, `compose-campaign.dto.ts:44`, `notification-event.ts:496`, `flutterwave-wallet.gateway.ts:72`) and the forks finding `content-piece.service.ts:48` (`FlutterwaveConfigResponse` declared in 3 files, the web's Flutterwave path kept as built until the after-launch removal, R-1). The lead named the fifth in the dispatch; the owner approved all five on 16 Oct 2026 (R-60). Owner on each entry: "YOU, owner-approved 16 Oct 2026 (R-60)".
- **Gates:** `python3 scripts/gates/run.py` 5 fail before, 0 fail after. `python3 scripts/gates/check_baseline.py` passes (124 entries).
- **Next:** a verifier checks the diff is the baseline file only, additions only, and that CI on the backend branch shows the gates job green.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/GATES-02.md](history/GATES-02.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
