# Verifier report: FIX-34 and FIX-35 (16 Oct 2026)

Backend wmt/FIX-34 2bf6e97 and wmt/FIX-35 0d5acda, both from main 3797fb2. Mobile 3d907c5 / 7e81f62 change only
tasks/, docs/LOG.md, docs/PROGRESS.md, tasks/INDEX.md. Logs: scratchpad/fix-34-v/logs/.

## FIX-34: verdict merge
- Diff is one spec file (helper withoutKnownIds, the two scan lines, one new case). Patterns unchanged. No product file.
- Ids ending in 11 digits (jest.mock of crypto.randomUUID): main's spec fails 2 of 11 (response scan, line 188);
  branch spec passes 12 of 12.
- Row id with 11 digits (rows[0].id overwritten in a scratch copy): main's audit scan fails 2; branch passes 12.
- Plants in admin-identity-holds.service.ts (restored by copy, git clean after), branch spec fails the audit-row scan
  (2 tests each): number 2221234xxxx in detail; a bvn key in detail; the holder id glued to 2221234xxxx.
- Plants in the response (scratch spec without the exact-data toEqual, so only the scan can catch): extra field
  2221234xxxx, extra bvn key: both fail the response scan (2 tests each). Clean control: 12 of 12.
- 10 runs in a row: 12 of 12 each. tsc EXIT 0, eslint EXIT 0, prettier EXIT 0.
- CI on 2bf6e97: 3 shards, netns, contract, deploy-test-in-sync, baseline, protected routes green; Executable gates
  red with the same 18 FAIL lines as main 3797fb2 (diffed, identical).

## FIX-35: verdict merge
- Diff is one spec file (helper tmpEntriesHolding, one import, the snapshot line, the one assertion). No product file.
- Planted write in src/nuvion/areas/documents.ts uploadDocument (restored by copy, cmp same, git clean), case
  "WAWU keeps no document content" fails and names the written entry for: raw bytes, base64, hex, nested 4 deep,
  nested 7 deep, first 60 bytes only. A write that is removed again passes (correct).
- Churn (a loop making runc-process-* folders and churn-*.log files, leaving fix35-left-behind.log): branch passes;
  main's spec fails the same case on the listing compare.
- Full file, 5 runs with the churn running throughout: runs 1 to 4 130 of 130; run 5 3 failed in the concurrency
  describe (see finding 1, pre-existing); the tmp case passed in all 5. tsc/eslint/prettier EXIT 0.
- CI on 0d5acda: same as FIX-34; gates have the same 18 FAIL lines as main.

## Findings (all low, none block)
1. low, pre-existing, not this diff: src/nuvion/tests/nuvion-documents.contract.spec.ts, describe "when both documents
   are accepted the opening is submitted for review exactly once" (lines ~850 to 915): the parallel-request cases
   ("the last upload sent twice", "both documents at the same moment", "five GETs ... at once", "any file after the
   opening was sent") get a 500 sometimes under machine load. Reproduced on MAIN (1 run in 6 failed 4 tests) and on
   the branch (1 in 6, 1 test). Repro: run that describe repeatedly with -t under load (load average 9 to 12). Cause
   not found (no server log in the output). Candidate for its own FIX task.
2. low: tmpEntriesHolding looks only for the markers, so a copy the service compresses (gzip of the file) is missed
   (plant tested: passes). The old listing compare caught any new entry. A trade-off the goal accepts.
3. low: an entry written INTO a folder that already existed at the start of the file is skipped (same as main's
   top-level compare; tested, passes). Not a regression.
4. low: the task text says "up to four levels"; the code has no depth limit (7 deep was caught), only a budget of
   5000 entries looked at per top-level entry. Align the task text, or the code.

## Cleanup
Stack fix_34 taken down, worktrees v-fix-34-a, -b, -main removed, no listener on 7340 to 7347.
