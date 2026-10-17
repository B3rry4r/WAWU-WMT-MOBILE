---
id: FIX-45
title: Two backend specs stop failing at random: the PIN scan of a digest, and four publishes sent together
owner: YOU
area: FIX
order: 294
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-45 · Two backend specs stop failing at random: the PIN scan of a digest, and four publishes sent together

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Backend specs only; no product file, no app change. Checked by an independent Sonnet verifier on round 1 (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-45.md`: 1 medium, 3 low); round 2 (`a842113`) answers all four and the lead accepted it on the round 1 check (the diff is +8 -1, exactly the findings; same course as FIX-32 round 2).
- **Backend:** `wmt/FIX-45` `a842113` (round 2, on `153a36e`), stacked on batch 7 (`wmt/MERGE-7`). Mobile: this record.
- **Open findings:** none. Round 1's medium (the reset-code scan weakened by `scannable(row)`) is closed in round 2: the scan is `JSON.stringify(row)` again and the fingerprint is checked on its own; the verifier's low 2 (9 requests, not 12), 3 (`together` above 1) are fixed; low 4 is information.
- **Next:** the lead merges it with batch 7.
- **History:** tasks/history/FIX-45.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-33, FIX-34 and FIX-36 task files (the same kind of fix: a random value that lands in a scan)

## Goal

Two specs failed on CI with nothing wrong in the code, in files the failing branch did not touch.

1. `src/money/pin/tests/pin-request-key.contract.spec.ts:202`, "the stored answer is the PIN state and nothing else": `expect(row.fingerprint).not.toContain(next)`. The fingerprint is `hmac-sha256:v1:` and 64 random hex characters, so a given four-digit PIN is inside it by chance about 1 time in 1,070 (61 windows, each 1 in 65,536). Seen on `wmt/TIER-06`, run 38986682069, shard 3: `not "7497"` against `...ca7497698582`.
2. `src/plans/tests/publishing-gate.contract.spec.ts:497`, "cannot be sent past the limit by two publishes at once": four publishes of one person sent together, expected `[201, 402, 402, 402]`, got `[201, 402, 402, 429]`. Seen on `wmt/EXPLORE-06`, runs 38995689552, 38995689614 and 38995689618, shard 1. The 429 is `storage_busy` from the per-person queue (`src/storage/storage-lock.ts`, ME-04 round 6): one request runs, two wait, one more at that moment is refused. It is not a rate limit shared by the requests, not a per-address limit and not a row left by another spec (the spec mounts no throttler).

## Scope (the two specs only; no product file, harness, gate or baseline)

- `pin-request-key.contract.spec.ts`: `pinOutsideFingerprint(who, key)` draws the next PIN after the person and the key are known and works out the fingerprint that PUT will be stored under (it is a pure function of person, route, key and body), and takes a PIN that is not inside it. The assertion is unchanged. Twelve candidates in a row inside their own fingerprint (a Hub that put the PIN into it) throws. The sibling PIN regex scan of a stored key row reads the row through `scannable(row)`: its UUIDs and its keyed digest set aside, the rest (answer, route, state) still scanned. About 1 scan in 1,000 failed for the PIN scan, from UUID groups and the digest. The reset-code scan (reset-confirm case) reads the whole row as stored, `JSON.stringify(row)`, as it did on main, and also asserts `row.fingerprint` does not contain the code (round 2): a six-digit code by chance in the row's random hex is about 0.00033%.
- `publishing-gate.contract.spec.ts`: the burst sends `STORAGE_LOCK_WAITERS_PER_PERSON + 1` publishes (what the queue admits) and expects exactly `[201, 402, ...]`. The case first asserts it sends more than one at once (round 2), so it still races if the waiters setting were 0. A new case, "a crowd of publishes at once for the last place", sends three times that (9) and expects exactly one 201, every other answer a 402 `product_limit_reached` or a 429 `storage_busy`, and the count unchanged, so the crowd past the queue is still covered.

## Capability checks

- [ ] On a copy of main's spec where the stored fingerprint is forced to hold the PIN whenever its first digit is even, main's case fails on `not "<PIN>"` (7 of 10 runs); the changed spec passes 30 of 30 under the same force.
- [ ] Planted on the changed spec: the PIN in clear in a shape-valid fingerprint fails `not "<PIN>"`; every candidate inside its fingerprint throws "the fingerprint carries the PIN"; the PIN in the stored answer or in `resourceId` fails the scan; the PIN as one UUID group passes (a collision, not a leak).
- [ ] After a warm-up of twelve parallel requests, main's burst of four fails 30 of 30 with `[201, 402, 402, 429]`; the changed spec's two cases pass 30 of 30.
- [ ] Each changed spec passes 30 runs in a row.
- [ ] Backend `tsc --noEmit` and eslint (no fix) on both files exit 0; CI gates show the same FAIL lines as main.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-45.md](history/FIX-45.md).

## Owner sign-off
