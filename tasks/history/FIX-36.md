# FIX-36 · round history

Moved out of [tasks/FIX-36.md](../FIX-36.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-36` `a3fd7ce`, from main `3797fb2`. One file.
- **Red (the fix still catches a leak):** on a scratch worktree, `views()` in `recipient.service.ts` read the identity row and put `bvnLast4` into `avatarUrl`; the case fails with `secret: "qz4321xk"`, `leaked: true` (1 failed, 40 skipped by the name filter).
- **Red (the defect, before):** main's spec with `person()` forcing every id to start with `4321` fails the case on `secret: "4321"` (1 failed, 40 passed).
- **Green:** the changed spec with the same forced ids passes (41 of 41), and 10 runs in a row are green (41 of 41 each) on the local stack `fix_36` (down, database dropped).
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `a3fd7ce`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 16 FAIL lines as on main (`files scanned: 1249, findings: 16 fail`, the same as `3797fb2`; none in this spec).

## Verifier report

_Not started._

