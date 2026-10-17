---
id: FIX-57
title: The local test stack never reports UP on a port it does not own
owner: YOU
area: FIX
order: -57
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: []
passes: [V1]
artboards: []
tier: T0
---
# FIX-57 · The local test stack never reports UP on a port it does not own

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Tier T0 (tooling). Backend `wmt/FIX-57` `447887f` from `origin/wmt/MERGE-9` `4e444ca`; mobile `wmt/FIX-57` (this record) from `origin/wmt/MERGE-9` `72bc8d6c`. No product code, schema, contract or gate touched.
- **Order:** -57, free (the FIX number; -2 to 0 are taken).
- **Cause:** `scripts/dev/stack.sh` called a service UP when its URL answered, not when its own process held the port. Two stacks started in the same second on the same ports: one Hub, mock ID and stand-in died on EADDRINUSE while the other stack's process answered, and the script printed UP.
- **Fix:** `up` refuses when any port of the range is listening (names the holder). A service is UP only when its own PID or a child of it is the listener, read from `/proc`; else FAILED, a `why:` line, the last 15 log lines, exit 1. `status` prints `NOT OURS` with the holder and the log tail. Every option and output line is kept; new lines are added.
- **Stand-in starter:** `nuvion-standin.cjs` has no port check of its own; the check lives only in `stack.sh`, so nothing else changed.
- **Open findings:** none. One low for the sweep: `mock-wawu-id/server.js` (Express 5) calls the `app.listen` callback on EADDRINUSE too, so its log says "listening" after it lost the port and it exits 0; the `why:` line now says the truth, the log line stays misleading.
- **Next:** a fresh verifier.

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

## Builder report

Builder, 17 Oct 2026, Sonnet. Backend `447887f`. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix-57-b/`.
- **Self-test:** `scripts/dev/stack-selftest.sh` (ports 7850-7857 only, no database): 18 checks, `EXIT 0`, run twice. Starts dummy listeners (inside the range, a wildcard one on the Hub port), a foreign HTTP server plus a service that dies on EADDRINUSE, a service that holds its own port, one that holds it through a child, and fake `pids` files for `status`. It stops everything it started, children first.
- **Real stack, happy path:** `up --ports 7850-7853` printed mock-id, nuvion and hub UP in 64 s; `status` listening on all three, exit 0; a second `up` on the same range refused naming the three holder PIDs ("Nothing was started"); `down` clean, database dropped.
- **Real stack, the race:** a dummy answering 200 on the mock's port after the pre-check passed. `up` printed mock-id FAILED, `why: the process (pid N) exited, and port 7853 is held by pid M (node), not by this service`, the log tail, exit 1. `status` said NOT OURS and exit 1. The old check would have printed UP.
- **Checks:** `bash -n` on the three scripts; `python3 scripts/gates/run.py` EXIT 0 (0 fail, 127 warn, 88 accepted, same as before); `check_baseline.py` EXIT 0. No test, gate or baseline edited.
- **Not run:** GitHub CI (the lead watches), a stack with `--with id,web,mobile` (the same `service` path serves them).
- **Limits:** Linux only (reads `/proc`; it already did for PID start times). A listener owned by another user cannot be identified, so it is refused as "a process this user cannot see".
