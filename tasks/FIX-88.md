---
id: FIX-88
title: Three old backend specs that run on the Fintava double stop failing CI, by chance or by design
owner: YOU
area: OPS
order: -88
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: [R-70]
passes: [V1]
artboards: []
tier: T0
---
# FIX-88 · Three old backend specs that run on the Fintava double stop failing CI, by chance or by design

## Current state

As of 19 Oct 2026, built by a Sonnet builder (tier T0, test files only, owner ruling Q-42 to R-70): backend `wmt/FIX-88` `42a151d` (from `origin/wmt/MERGE-12` `98efeef`). Proved on `origin/wmt/MERGE-25` `223fe89` in a scratch merge: the same three files, no extra change, so there is no `wmt/FIX-88b`. No product code, no gate, no baseline changed. This record is on mobile `wmt/FIX-88` (from `origin/wmt/MERGE-25`).

- **The owner's narrow exception (R-70):** for these three spec files only, the builder may edit the file and run that one spec. Nothing else that is Fintava was touched.
- **`src/fintava/tests/fintava-stall.spec.ts`, "a balance whose body lands at half the timeout is read, and the deadline is cleared".** Failed by chance in CI (job 117393825747, 17 Oct): the Hub's client timed out (`unavailable "timed out"`). The stall server and the client share one event loop, so a stall that spans the body's arrival and the deadline fires the deadline first; the case ran a 300 ms timeout with the body at 150 ms and forced garbage collection every 20 ms. Now this case alone runs its own 4000 ms timeout with the body at 2000 ms (still half), so only a stall of 2 s can fail it. It still proves the same two things: the body is read, and exactly one deadline timer is set and cleared.
- **`account-deletion-round4.contract.spec.ts`, the T6/T6b seeded rounds (line 490 is the "stranded not healed" check).** Failed by chance in CI (run 39101878929, seed 5637, the 50th round of the first T6b set). Before the healing sweep the provider is now recovered for every wallet the spec made (not only the round's own), and the check allows the next passes, up to three, as the hourly pass does. The assertion (the row is cancelled or gone AND the wallet is unfrozen) is unchanged. `account-deletion.contract.spec.ts` is untouched (the earlier one-argument change stays, as the owner kept it).
- **`src/money/earnings/tests/earning-settlement.contract.spec.ts`: 21 of 29 failed by design since R-55** (one earnings move per creator per Lagos day, WALLET-16). All 21 now pin R-55 as the Nuvion earning specs do: one `EarningMove` per creator per day carries every earning, its reference is `moveReference(creator, day)`, the lease, the unknown outcomes and the 72 hours after the FIRST refusal belong to the move, the ledger holds one pair per move (a move of one sale keeps that sale's link), a second sale on the same day waits for the next day's move. Every money check is kept: amounts to the kobo, the provider's charge paid once per move, once only under replay, two Hub processes, a crash and a lost answer. Teardown now also deletes the moves. Two hand-made cases (a sale that stops being finished) test both places the rule is read: the planner (no move) and the lease (a move that is withdrawn, nothing sent).
- **Checks:** see the builder report. CI on the backend head is green (Branch checks, Gates, Protected routes).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-55, R-70; the backend's `src/money/earnings/tests/earning-settlement-nuvion.contract.spec.ts` and `earning-daily-move.contract.spec.ts`

## Goal

The three specs pass on every run, on the batch that brought R-55 and on the newest batch, without proving less than before.

## Scope

`wawu-backend`: the three spec files named above (test files only). `wawu-wmt-mobile`: this file and BACKEND_GAPS.md.

## Capability checks

- [x] `fintava-stall.spec.ts` passes five runs in a row on MERGE-12 and on MERGE-25.
- [x] `account-deletion-round4.contract.spec.ts` passes five runs in a row on both.
- [x] `earning-settlement.contract.spec.ts` passes 29 of 29, five runs in a row on both.
- [x] No product file, gate, baseline or other test changed.

## Builder report

- **Heads:** backend `wmt/FIX-88` `42a151d` (from `origin/wmt/MERGE-12` `98efeef`); mobile `wmt/FIX-88` (this record, from `origin/wmt/MERGE-25` `eb2ffa3b`). Scratch merge on `origin/wmt/MERGE-25` `223fe89` (local only, `f81d0c5`): the same three files pass there with no extra change, so no `wmt/FIX-88b`.
- **Red before:** `earning-settlement` 21 of 29 red on MERGE-12 (local, EXIT 1) and on MERGE-25 (CI run 39120028842, shard 1). The old slow-body case under load (average 8 to 11): 6 of 8 red; the new case under the same load: 8 of 8 green. The T6b miss did not repeat (see G-FIX-88-1).
- **Five runs in a row, every EXIT 0, MERGE-12 then MERGE-25:** `fintava-stall.spec.ts` 120 of 120, 5/5 and 5/5; `earning-settlement.contract.spec.ts` 29 of 29, 5/5 and 5/5; `account-deletion-round4.contract.spec.ts` T6b only (the changed step) 2 of 2, 5/5 and 5/5; the whole file 18 of 18, 5/5 and 5/5 (one MERGE-25 run was killed from outside, EXIT 143, and was run again: 18 of 18).
- **tsc --noEmit EXIT 0 and eslint on the three files EXIT 0, on both trees.** Prettier clean on the two files that were. Gates and baseline: no product file, gate or baseline changed.
- **CI on `42a151d`:** Branch checks 39259442190 (contract, deploy-test-in-sync, netns, suite shards 1 to 3: all success), Gates 39259442352 success, Protected routes (V3) 39259442084 success. Nothing red.
- **Not done:** the T6b cause is not proven (G-FIX-88-1, low); `npm run tasks` ends with one line, "decision R-70 is not in DECISIONS.md" (R-70 is not in DECISIONS.md at MERGE-25; it clears when the lead adds the ruling).
- **Machine:** Postgres cluster 16/main was down at 12:55 (a restart) and was started. The builder's databases (`fix88_test`, `fix88_test25`) and its mock WAWU ID on port 7807 are removed.

## Owner sign-off

Not needed.
