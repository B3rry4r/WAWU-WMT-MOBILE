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
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-36.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/FIX-35` (this branch contains it); API types regenerated from backend `wmt/FIX-36` (d3c5550).
- **Id and order:** filed after-launch at order 287, the way FIX-35 (order 286) is.
- **History:** none yet.
- **Open findings:** blocker 0, high 0, medium 0, low 0.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-36.md](history/FIX-36.md).

## Owner sign-off
