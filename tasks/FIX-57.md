---
id: FIX-57
title: The local test stack never reports UP on a port it does not own
owner: YOU
area: FIX
order: -57
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: []
passes: [V1]
artboards: []
tier: T0
---
# FIX-57 · The local test stack never reports UP on a port it does not own

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Accepted by the lead (T0, 17 Oct). Stacked in batch 11 by MERGE-11 (backend `447887f` merged into `wmt/MERGE-11`, clean; mobile `8653ccc4`). On the merged head `stack.sh up --ports 7920-7927` refused with `port 7920 is held by pid 9196 (node)` and started nothing (an orphaned mock ID from a deleted worktree held 7920); `scripts/dev/stack-selftest.sh` needs 8 free ports from its base, so MERGE-11 did not run it.
- **Order:** -57, free (the FIX number; -2 to 0 are taken).
- **Cause:** `scripts/dev/stack.sh` called a service UP when its URL answered, not when its own process held the port. Two stacks started in the same second on the same ports: one Hub, mock ID and stand-in died on EADDRINUSE while the other stack's process answered, and the script printed UP.
- **Fix:** `up` refuses when any port of the range is listening (names the holder). A service is UP only when its own PID or a child of it is the listener, read from `/proc`; else FAILED, a `why:` line, the last 15 log lines, exit 1. `status` prints `NOT OURS` with the holder and the log tail. Every option and output line is kept; new lines are added.
- **Stand-in starter:** `nuvion-standin.cjs` has no port check of its own; the check lives only in `stack.sh`, so nothing else changed.
- **Open findings:** none. One low for the sweep: `mock-wawu-id/server.js` (Express 5) calls the `app.listen` callback on EADDRINUSE too, so its log says "listening" after it lost the port and it exits 0; the `why:` line now says the truth, the log line stays misleading.
- **Next:** the batch 11 pull request. The low (the mock ID's log line) is in `tasks/SWEEP-APP.md`.

Status set to review by the records sync, 25 Oct 2026: merged as backend aef2c337, lead acceptance in this file (accepted by the lead, T0).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `scripts/dev/stack.sh`, `scripts/dev/stack-ports.sh`, `scripts/dev/stack-selftest.sh` in `wawu-backend` (README, "Local test stack")

## Goal

A developer who runs `stack.sh up` is never told a service is UP when another process holds its port.

## Scope

`wawu-backend`: `scripts/dev/stack.sh`, new `scripts/dev/stack-ports.sh` and `scripts/dev/stack-selftest.sh`, and the "Local test stack" lines of `README.md`. Nothing else.

## Capability checks

- [ ] `up` on a range with any port already listening refuses, names the port and the holding process, and starts and creates nothing.
- [ ] A service whose process died on EADDRINUSE while another process answers on its port is FAILED, with the log tail and a non-zero exit.
- [ ] A service whose own process (or a child of it) holds its port is UP; `status` agrees, and says NOT OURS otherwise.
- [ ] `scripts/dev/stack-selftest.sh` ends `EXIT 0`.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-57.md](history/FIX-57.md).

