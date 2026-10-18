---
id: FIX-12
title: Ticket price edits: the follow-ups from EVENTS-11
owner: YOU
area: FIX
order: 193
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [EVENTS-11]
decisions: [R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-12 · Ticket price edits: the follow-ups from EVENTS-11

## Current state

As of 18 Oct 2026, builder round 1 done (Sonnet builder, bundle S9). Status: verifying.
- **Branches:** backend `wmt/S9` `50066b9` (the same commit as EVENTS-12, on `origin/wmt/EVENTS-11` `71117e4` with `origin/wmt/MERGE-14` `195de50` merged in, `4c52e57`). Mobile `wmt/S9` (records only).
- **Built:** specs for R7, R8 and R10, each failing on its mutant; the sold-tickets 409 names a tier once; PATCH on a host-cancelled event is a 409 with the sentence PUT already answers.
- **No other answer changed:** PUT's cancelled 409 keeps its sentence (now one shared constant), and both routes work as before on a live event.
- **Open findings:** none yet (not verified).
- **Gap:** G-FIX-12-1 (low, for SWEEP-EVENTS): a sold-tickets 409 caused only by a sale on a retired tier names a tier the host sees as unsold (same name, other price); a plainer sentence needs the Hub to say which tier is hidden.
- **Proof:** the new spec fails 3 tests on `4c52e57` (O8 and the two PATCH tests); R7, R8 and R10 hold on the old code and are pinned by mutants, all killed (5 of 5).
- **Next:** a verifier checks `wmt/S9`. EVENTS-11 (PR #83) still waits for the owner's relock label; this branch carries its lock unchanged.
- **History:** none yet. Reports go to tasks/history/FIX-12.md.

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): EVENTS-11.
- **History:** none yet. Reports go to tasks/history/FIX-12.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/EVENTS-11.md` (round 5 verifier: O7, O8; and the note on a host-cancelled event)

## Goal

EVENTS-11 passed with three follow-ups: spec gaps R7, R8 and R10 (O7); a 409 for a duplicate tier name that names the tier twice (O8); and PATCH accepted on an event its host cancelled.

## Scope

Specs for R7, R8 and R10; the 409 names the tier once; PATCH on a host-cancelled event is refused with a clear 409 (and the price-edit route the same). No other answer changes.

## Capability checks

- [ ] Each O7 spec fails on a mutant of the rule it covers.
- [ ] The duplicate-name 409 reads naturally, naming the tier once.
- [ ] PATCH and the price edit on a host-cancelled event answer 409; on a live event they work as today.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-12.md](history/FIX-12.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
