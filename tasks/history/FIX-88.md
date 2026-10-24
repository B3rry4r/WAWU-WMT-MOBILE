# FIX-88 · round history

Moved out of [tasks/FIX-88.md](../FIX-88.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Heads:** backend `wmt/FIX-88` `42a151d` (from `origin/wmt/MERGE-12` `98efeef`); mobile `wmt/FIX-88` (this record, from `origin/wmt/MERGE-25` `eb2ffa3b`). Scratch merge on `origin/wmt/MERGE-25` `223fe89` (local only, `f81d0c5`): the same three files pass there with no extra change, so no `wmt/FIX-88b`.
- **Red before:** `earning-settlement` 21 of 29 red on MERGE-12 (local, EXIT 1) and on MERGE-25 (CI run 39120028842, shard 1). The old slow-body case under load (average 8 to 11): 6 of 8 red; the new case under the same load: 8 of 8 green. The T6b miss did not repeat (see G-FIX-88-1).
- **Five runs in a row, every EXIT 0, MERGE-12 then MERGE-25:** `fintava-stall.spec.ts` 120 of 120, 5/5 and 5/5; `earning-settlement.contract.spec.ts` 29 of 29, 5/5 and 5/5; `account-deletion-round4.contract.spec.ts` T6b only (the changed step) 2 of 2, 5/5 and 5/5; the whole file 18 of 18, 5/5 and 5/5 (one MERGE-25 run was killed from outside, EXIT 143, and was run again: 18 of 18).
- **tsc --noEmit EXIT 0 and eslint on the three files EXIT 0, on both trees.** Prettier clean on the two files that were. Gates and baseline: no product file, gate or baseline changed.
- **CI on `42a151d`:** Branch checks 39259442190 (contract, deploy-test-in-sync, netns, suite shards 1 to 3: all success), Gates 39259442352 success, Protected routes (V3) 39259442084 success. Nothing red.
- **Not done:** the T6b cause is not proven (G-FIX-88-1, low); `npm run tasks` ends with one line, "decision R-70 is not in DECISIONS.md" (R-70 is not in DECISIONS.md at MERGE-25; it clears when the lead adds the ruling).
- **Machine:** Postgres cluster 16/main was down at 12:55 (a restart) and was started. The builder's databases (`fix88_test`, `fix88_test25`) and its mock WAWU ID on port 7807 are removed.

