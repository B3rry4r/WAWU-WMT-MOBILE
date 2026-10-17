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
- **Status:** verifying. Backend specs only; no product file, no app change.
- **Backend:** `wmt/FIX-45` `153a36e` on backend main `a5e48fc`. Mobile: this record.
- **Next:** an independent verifier; CI on the backend head decides the rest.
- **Open findings:** none yet.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-33, FIX-34 and FIX-36 task files (the same kind of fix: a random value that lands in a scan)

## Goal

Two specs failed on CI with nothing wrong in the code, in files the failing branch did not touch.

1. `src/money/pin/tests/pin-request-key.contract.spec.ts:202`, "the stored answer is the PIN state and nothing else": `expect(row.fingerprint).not.toContain(next)`. The fingerprint is `hmac-sha256:v1:` and 64 random hex characters, so a given four-digit PIN is inside it by chance about 1 time in 1,070 (61 windows, each 1 in 65,536). Seen on `wmt/TIER-06`, run 38986682069, shard 3: `not "7497"` against `...ca7497698582`.
2. `src/plans/tests/publishing-gate.contract.spec.ts:497`, "cannot be sent past the limit by two publishes at once": four publishes of one person sent together, expected `[201, 402, 402, 402]`, got `[201, 402, 402, 429]`. Seen on `wmt/EXPLORE-06`, runs 38995689552, 38995689614 and 38995689618, shard 1. The 429 is `storage_busy` from the per-person queue (`src/storage/storage-lock.ts`, ME-04 round 6): one request runs, two wait, one more at that moment is refused. It is not a rate limit shared by the requests, not a per-address limit and not a row left by another spec (the spec mounts no throttler).

## Scope (the two specs only; no product file, harness, gate or baseline)

- `pin-request-key.contract.spec.ts`: `pinOutsideFingerprint(who, key)` draws the next PIN after the person and the key are known and works out the fingerprint that PUT will be stored under (it is a pure function of person, route, key and body), and takes a PIN that is not inside it. The assertion is unchanged. Twelve candidates in a row inside their own fingerprint (a Hub that put the PIN into it) throws. The two sibling scans of a stored key row (the PIN regex scan, and the reset code `not.toContain`) read the row through `scannable(row)`: its UUIDs and its keyed digest set aside, the rest (answer, route, state) still scanned. About 1 scan in 1,000 failed for the PIN scan, from UUID groups and the digest.
- `publishing-gate.contract.spec.ts`: the burst sends `STORAGE_LOCK_WAITERS_PER_PERSON + 1` publishes (what the queue admits) and expects exactly `[201, 402, ...]`. A new case, "a crowd of publishes at once for the last place", sends three times that and expects exactly one 201, every other answer a 402 `product_limit_reached` or a 429 `storage_busy`, and the count unchanged, so the crowd past the queue is still covered.

## Capability checks

- [ ] On a copy of main's spec where the stored fingerprint is forced to hold the PIN whenever its first digit is even, main's case fails on `not "<PIN>"` (7 of 10 runs); the changed spec passes 30 of 30 under the same force.
- [ ] Planted on the changed spec: the PIN in clear in a shape-valid fingerprint fails `not "<PIN>"`; every candidate inside its fingerprint throws "the fingerprint carries the PIN"; the PIN in the stored answer or in `resourceId` fails the scan; the PIN as one UUID group passes (a collision, not a leak).
- [ ] After a warm-up of twelve parallel requests, main's burst of four fails 30 of 30 with `[201, 402, 402, 429]`; the changed spec's two cases pass 30 of 30.
- [ ] Each changed spec passes 30 runs in a row.
- [ ] Backend `tsc --noEmit` and eslint (no fix) on both files exit 0; CI gates show the same FAIL lines as main.

## Builder report

Sonnet builder. Backend `wmt/FIX-45` `153a36e` on main `a5e48fc`; two spec files changed (+81 -7), no product file. Stack `fix_45` (ports 7520 to 7527), taken down.
- **Spec 1, the number:** a four-digit PIN is inside 64 random hex characters in 61 places, each 1 in 65,536: 0.093%. Measured on 1.5 million draws made the way `reservePins` draws: 0.094% (1 in 1,064) for the fingerprint line, 0.099% (1 in 1,008) for the PIN scan of the whole stored row (UUID groups and the digest), 0.00033% for the reset code. The CI failure is exactly this: PIN `7497` inside `...ca7497698582`.
- **Spec 1, reproduced:** on main's spec with the stored fingerprint forced to hold the PIN whenever its first digit is even, 7 of 10 runs fail, all on `not "<PIN>"` (the line 202 assertion). The changed spec under the same force: 30 of 30 pass. Forced on every PIN, the helper throws "the fingerprint carries the PIN".
- **Spec 1, plants on the changed spec:** the PIN in clear in a shape-valid fingerprint fails `not "<PIN>"`; the PIN in the stored answer fails the scan; the PIN as the row's `resourceId` fails the scan; the PIN as one UUID group passes (a collision, the intended exception).
- **Spec 2, the cause:** the 429 is `storage_busy` from `inPersonsTurn` (one request runs, `STORAGE_LOCK_WAITERS_PER_PERSON` = 2 wait, the next is refused). It is not a rate limit, a per-address limit or a leftover row: the spec mounts no throttler and each person is new. Four of one person sent together get `[201, 402, 402, 429]` on every burst once the Hub is warm: 147 of 150 bursts in one process, the first burst of a process passing (cold), and after a warm-up of twelve parallel requests the first burst fails too (3 runs of 4 bursts, all 429). A CI machine that was warm at that point failed it.
- **Spec 2, reproduced:** main's burst with that warm-up added: 0 of 30 pass, every run `[201, 402, 402, 429]`. The changed spec's two burst cases with the same warm-up: 30 of 30 pass.
- **Spec 2, the change:** the burst sends waiters plus one (3) and expects exactly `[201, 402, 402]`; a new case sends 12 and expects one 201, the rest 402 `product_limit_reached` or 429 `storage_busy`, count unchanged. No limit raised, no assertion dropped or loosened.
- **Runs:** `pin-request-key.contract.spec.ts` 30 runs, 43 of 43 each, 30 of 30 green; `publishing-gate.contract.spec.ts` 30 runs, 62 of 62 each, 30 of 30 green. `tsc --noEmit` EXIT 0, eslint (no fix) EXIT 0 and prettier clean on both files.
- **Record:** area `FIX` (the area every FIX task uses), priority `launch` at free order 294 (before CHECK-3).

## Verifier report

## Owner sign-off
