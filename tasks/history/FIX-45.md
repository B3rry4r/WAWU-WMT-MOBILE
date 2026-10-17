# FIX-45 · round history

Moved out of [tasks/FIX-45.md](../FIX-45.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-45` `153a36e` on main `a5e48fc`; two spec files changed (+81 -7), no product file. Stack `fix_45` (ports 7520 to 7527), taken down.
- **Spec 1, the number:** a four-digit PIN is inside 64 random hex characters in 61 places, each 1 in 65,536: 0.093%. Measured on 1.5 million draws made the way `reservePins` draws: 0.094% (1 in 1,064) for the fingerprint line, 0.099% (1 in 1,008) for the PIN scan of the whole stored row (UUID groups and the digest), 0.00033% for the reset code. The CI failure is exactly this: PIN `7497` inside `...ca7497698582`.
- **Spec 1, reproduced:** on main's spec with the stored fingerprint forced to hold the PIN whenever its first digit is even, 7 of 10 runs fail, all on `not "<PIN>"` (the line 202 assertion). The changed spec under the same force: 30 of 30 pass. Forced on every PIN, the helper throws "the fingerprint carries the PIN".
- **Spec 1, plants on the changed spec:** the PIN in clear in a shape-valid fingerprint fails `not "<PIN>"`; the PIN in the stored answer fails the scan; the PIN as the row's `resourceId` fails the scan; the PIN as one UUID group passes (a collision, the intended exception).
- **Spec 2, the cause:** the 429 is `storage_busy` from `inPersonsTurn` (one request runs, `STORAGE_LOCK_WAITERS_PER_PERSON` = 2 wait, the next is refused). It is not a rate limit, a per-address limit or a leftover row: the spec mounts no throttler and each person is new. Four of one person sent together get `[201, 402, 402, 429]` on every burst once the Hub is warm: 147 of 150 bursts in one process, the first burst of a process passing (cold), and after a warm-up of twelve parallel requests the first burst fails too (3 runs of 4 bursts, all 429). A CI machine that was warm at that point failed it.
- **Spec 2, reproduced:** main's burst with that warm-up added: 0 of 30 pass, every run `[201, 402, 402, 429]`. The changed spec's two burst cases with the same warm-up: 30 of 30 pass.
- **Spec 2, the change:** the burst sends waiters plus one (3) and expects exactly `[201, 402, 402]`; a new case sends 9 (3 times 2 waiters + 1) and expects one 201, the rest 402 `product_limit_reached` or 429 `storage_busy`, count unchanged. No limit raised, no assertion dropped or loosened.
- **Runs:** `pin-request-key.contract.spec.ts` 30 runs, 43 of 43 each, 30 of 30 green; `publishing-gate.contract.spec.ts` 30 runs, 62 of 62 each, 30 of 30 green. `tsc --noEmit` EXIT 0, eslint (no fix) EXIT 0 and prettier clean on both files.
- **Record:** area `FIX` (the area every FIX task uses), priority `launch` at free order 294 (before CHECK-3).

### Round 2 (17 Oct 2026, Sonnet builder; answers verify/FIX-45.md)
Backend `wmt/FIX-45` `a842113` on `153a36e`; two spec files, +8 -1, no product file. Stack `fix_45` (7520 to 7527), taken down.
- **Finding 1 (medium), the reset-code scan:** the reset-confirm case reads the whole row again, `expect(JSON.stringify(row)).not.toContain(reset.code)`, and adds `expect(row.fingerprint).not.toContain(reset.code)`. Planted on a scratch copy: the row's fingerprint set to `hmac-sha256:v1:` + the code + 58 zeros (shape-valid); the case fails on `Expected substring: not "<code>"`. The chance collision of a six-digit code in the row's random hex stays 0.00033%.
- **Finding 2 (low), the report:** the crowd case sends 9 (3 times (2 waiters + 1)), not 12. Corrected above.
- **Finding 3 (low), the burst still races:** `expect(together).toBeGreaterThan(1)` before the burst in "cannot be sent past the limit by two publishes at once".
- **Runs:** `pin-request-key.contract.spec.ts` 30 of 30 (43 of 43 each); `publishing-gate.contract.spec.ts` 30 of 30 (62 of 62 each), against stack `fix_45`. `tsc --noEmit` EXIT 0, eslint (no fix) EXIT 0 and prettier clean on both files. Stack down, nothing on 7520 to 7527.

## Verifier report

