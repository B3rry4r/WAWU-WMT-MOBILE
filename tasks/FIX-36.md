---
id: FIX-36
title: The recipient leak check cannot match a random id by chance, so it stops failing at random
owner: YOU
area: FIX
order: 287
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-36 · The recipient leak check cannot match a random id by chance, so it stops failing at random

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Builder done; backend `wmt/FIX-36` `a3fd7ce` (one spec file, no product code).
- **Next:** a verifier checks the branch against the Capability checks below.
- **Id and order:** filed after-launch at order 287, the way FIX-35 (order 286) is.
- **History:** none yet.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-35 task file (the same kind of fix: a spec that failed for a reason outside the code)

## Goal

`src/money/recipients/tests/money-recipient.contract.spec.ts`, the case "a result has five fields and none of them is a phone, an account number, an email, a BVN or a NIN", stops failing at random. It looked for the plain digits `4321` (the seeded BVN ending) and `8765` (the NIN ending), and for the letters `bvn` and `nin`, anywhere in the answer text (line 942 on main `3797fb2`). A random `wawuUserId` in the answer can hold four digits by chance, so it failed with nothing leaked (seen 16 Oct on `wmt/FIX-22` `51f1bc2`, job 117059552651, shard 2).

## Scope (the spec only; no product file, gate or baseline)

The identity row the case seeds now holds `qz4321xk` and `wj8765zq` (two constants, `BVN_LAST4` and `NIN_LAST4`), which cannot occur in a hex id, a timestamp or a number, and the secret list uses the constants. The names `bvn` and `nin` are checked as JSON keys of the answer (`keysOf`), not as text, because a random handle can hold those letters. Every other secret (phones, account numbers, emails, `verifiedPhone`, `accountNumber`, `accountName`), the five-field check and the final phone sweep are unchanged.

## Capability checks

- [ ] On a scratch copy where the service reads the identity row and returns `bvnLast4` in a result, the case fails and names the secret `qz4321xk`.
- [ ] With every person's id forced to start with `4321`, the changed spec passes and the unchanged spec (main's) fails the same case on the secret `4321`.
- [ ] The changed spec passes 10 runs in a row.
- [ ] `git diff` is one file: two constants, the `keysOf` helper, the two seeded values, the secret list and the key check.
- [ ] Backend `tsc --noEmit` and eslint on the file exit 0; CI gates show the same FAIL lines as main.

## Builder report

Sonnet builder. Backend `wmt/FIX-36` `a3fd7ce`, from main `3797fb2`. One file.
- **Red (the fix still catches a leak):** on a scratch worktree, `views()` in `recipient.service.ts` read the identity row and put `bvnLast4` into `avatarUrl`; the case fails with `secret: "qz4321xk"`, `leaked: true` (1 failed, 40 skipped by the name filter).
- **Red (the defect, before):** main's spec with `person()` forcing every id to start with `4321` fails the case on `secret: "4321"` (1 failed, 40 passed).
- **Green:** the changed spec with the same forced ids passes (41 of 41), and 10 runs in a row are green (41 of 41 each) on the local stack `fix_36` (down, database dropped).
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `a3fd7ce`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 16 FAIL lines as on main (`files scanned: 1249, findings: 16 fail`, the same as `3797fb2`; none in this spec).

## Verifier report

_Not started._

## Owner sign-off
