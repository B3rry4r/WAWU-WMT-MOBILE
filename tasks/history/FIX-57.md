# FIX-57 · round history

Moved out of [tasks/FIX-57.md](../FIX-57.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 17 Oct 2026, Sonnet. Backend `447887f`. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix-57-b/`.
- **Self-test:** `scripts/dev/stack-selftest.sh` (ports 7850-7857 only, no database): 18 checks, `EXIT 0`, run twice. Starts dummy listeners (inside the range, a wildcard one on the Hub port), a foreign HTTP server plus a service that dies on EADDRINUSE, a service that holds its own port, one that holds it through a child, and fake `pids` files for `status`. It stops everything it started, children first.
- **Real stack, happy path:** `up --ports 7850-7853` printed mock-id, nuvion and hub UP in 64 s; `status` listening on all three, exit 0; a second `up` on the same range refused naming the three holder PIDs ("Nothing was started"); `down` clean, database dropped.
- **Real stack, the race:** a dummy answering 200 on the mock's port after the pre-check passed. `up` printed mock-id FAILED, `why: the process (pid N) exited, and port 7853 is held by pid M (node), not by this service`, the log tail, exit 1. `status` said NOT OURS and exit 1. The old check would have printed UP.
- **Checks:** `bash -n` on the three scripts; `python3 scripts/gates/run.py` EXIT 0 (0 fail, 127 warn, 88 accepted, same as before); `check_baseline.py` EXIT 0. No test, gate or baseline edited.
- **Not run:** GitHub CI (the lead watches), a stack with `--with id,web,mobile` (the same `service` path serves them).
- **Limits:** Linux only (reads `/proc`; it already did for PID start times). A listener owned by another user cannot be identified, so it is refused as "a process this user cannot see".
