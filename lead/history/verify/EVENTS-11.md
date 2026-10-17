# EVENTS-11 refresh verification (backend wmt/EVENTS-11 a4b61fa, mobile 794b7e7)

Verdict: merge.

Scope: lean check of the refresh (merge of main 3797fb2, the two EVENTS-09 door spec setups, migration rename).

Findings: none at medium or worse.
1. low (stack, not the branch): scripts/dev/stack.sh does not run `npm run db:seed`; CI does. On a stack database
   with no seeded profile for sub ...0001 both door specs (and event-edit-races for ...0003) fail in beforeAll with
   "No record was found for an update" (18 of 18). With the profile present they pass. CI seeds, and CI passed them.

Checks:
- Diff of both door specs against main 3797fb2: 73 added lines, 2 removed lines (both the "Fixtures:" header comment).
  `expect` count identical (scan 28 = 28, idempotency 96 = 96). No expectation weakened.
- Added setup: tick snapshot + write in beforeAll, restore in afterAll (columns read back null after the run),
  event set to published after the tiers PUT.
- Locally (own mock WAWU ID on 7336 with a made-up internal key, so names resolve): 18 of 18 pass.
- Mutation attacks on event-running.service.ts (restored byte for byte afterwards), all killed:
  M1 once-only claim removed: 5 red. M2 key fingerprint check off: 1 red. M3 no replay of a kept answer: 7 red.
  M5 removed staff allowed: 1 red. M6 other event's ticket accepted: 1 red. M7 check-in outside the key's
  transaction: 1 red.
- Merge kept main: merge base equals main head 3797fb2; branch vs main has no deleted or renamed file in src or
  prisma; event-running.service.ts untouched; package-lock identical.
- Migration 20261021350000_event_ticket_type_retired sorts after main's newest (20261021320000); one nullable
  column, matches schema.prisma retiredAt; old name 20261014100000 appears nowhere. `prisma migrate diff` against a
  database migrated from the branch: only an unrelated ContentPiece specializations index (not in this diff).
- `npm run contract:build` regenerates contract/openapi.json with no change to the committed file.
- CI on a4b61fa: shard 1 failure is only src/nuvion/tests/nuvion-documents (tmpdir listing lost a runner-owned
  `runc-process...` entry); 105 suites / 4143 tests passed; no nuvion file in the diff; the same commit's other run
  passed shard 1; both door specs PASS in CI. Executable gates fails on main 3797fb2 too (pre-existing). Protected
  route check red is the held relock (RELOCK_APPROVED 0): 3 routes and 2 checker files change, owner's label.
- Not run: the full backend suite (GitHub's job).
Cleanup: stack events_11 down, own mock stopped by PID, ports 7330-7337 closed, database dropped, worktree removed.
