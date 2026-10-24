# FIX-15 · round history

Moved out of [tasks/FIX-15.md](../FIX-15.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/FIX-15` `850dec4` (from main `56f94d0`). No migration, no schema change.
- **Found:** presign already reserves a `pending` row and `reconcileStale` already settled stale ones 15 minutes on (on usage reads, 50 rows per read), but nothing released a refused upload before that, so a retry near the limit got a 413 for its own failed attempt.
- **Built:** `POST /uploads/confirm` (`StorageService.settleUpload`, `ConfirmUploadDto`, `StorageController.confirm`), one `bucketHolds` HeadObject helper shared by `confirmUpload`, the sweep and the new route (same 404/403 = absent, anything else = unknown rule), and the sweep now loops (50 per pass, 10 passes) and writes with `updateMany ... status: 'pending'`. `contract/openapi.json` regenerated: +61 lines, none removed.
- **Files:** `src/storage/storage.service.ts`, `storage.controller.ts`, `dto/confirm-upload.dto.ts`, `tests/upload-settle.contract.spec.ts`, `contract/openapi.json`; here SHARED-CHANGES row `FIX-15 #1`, `docs/LOG.md`.
- **Check 1, refused upload leaves quota as it was:** spec presigns 400 MB at 574 MB used, the host answers the PUT 403, usage stays 974 MB and a second presign is 413; confirm answers `abandoned`, usage is back to 574 MB, the retry presigns. The sweep path: reservation aged 16 minutes, usage read gives the space back, a reservation still inside the 15 minutes is kept; 120 stale rows are all settled in one read; with the bucket down the 120 stay counted and the read ends.
- **Check 2, completed upload counts as today:** PUT accepted, usage counts it before and after confirm, confirm twice changes nothing, the `fileUrl` form works, a file that lands after being given up on counts again.
- **Also covered:** 401 without a token, 400 for a missing or extra field, 404 for another person's key (same message as an unknown key, row untouched), 503 with the bucket down (row stays pending).
- **How tested:** the spec runs the real S3 client and a real PUT against an S3-style server on loopback that refuses chosen PUTs; real database; no SDK call replaced. 10 of 10 pass.
- **Checks:** `tsc --noEmit` 0; eslint on the 4 files 0. Other specs reading storage rows (profile works, feed cards, chat): the same failing tests as unmodified main (14 on main in those three files, all 404 or mock-ID lookups; one extra timeout in a race test on a loaded machine passed on rerun).
- **Not done:** no screen calls the route (app task, see Current state); the mobile copy of the contract is not regenerated for that reason.

## Verifier report

Backend `wmt/FIX-15` 850dec4 (merge-base 56f94d0; main is bac39c4), mobile 6239878 (docs only).
Verdict: **fix** (one medium).

### Findings

1. **MEDIUM. A person can store any amount past the storage limit with POST /uploads/confirm sent before the PUT.**
   `src/storage/storage.service.ts` `settleUpload` (lines ~654-684): HEAD says absent, so the row goes `abandoned` at once,
   whatever the row's age. The presigned URL stays valid for 300 s, so the PUT then lands and nothing counts it: `usageAndTick`
   counts only `pending` and `confirmed`, and the sweep touches only `pending`. A later confirm flips `abandoned` to
   `confirmed` with no quota check.
   Reproduced on the branch (real S3 client, loopback bucket, real DB, free account, limit 1 GiB): 8 times
   {presign 500 MB, confirm}; every presign answered 200; then 8 PUTs, all 200. Bucket held 8 files (4 GB), `GET /uploads/usage`
   `usedBytes` = 0, a 9th presign still 200. Confirming the 8 files then gave `usedBytes` 4.5 GB against 1.0 GB (counted but over the
   limit, files usable). On main the same presigns go 200, 200, 413 and `/uploads/confirm` does not exist.
   Not "low": the builder's residual note says only a person working against their own quota gets here, but that person is exactly
   who the limit (R-7, the tick upsell) is for; two extra calls beat it, repeatedly and with no bound (throttle is 200 per minute).
   It also breaks capability check 2 ("a completed upload counts as today") for any PUT that finishes after a confirm.
   Fix direction for the lead: confirm must not abandon (or must not leave counted-as-nothing) a row whose URL is still valid
   (younger than ~5 min plus slack), or the abandoned-to-confirmed flip must re-check the limit and `usageAndTick` must count
   a row that later proves present. The sweep's 15-minute window already covers the slow-upload case.
2. **LOW. `POST /uploads/confirm` answers 500 for a key containing a NUL character** (`{"key":"a\u0000b"}`, also
   `{"key":"https://h/a\u0000b"}`): Postgres rejects the `findUnique` value. Expected 404 or 400. No data effect. Line:
   `settleUpload`, the `findUnique({ where: { key } })` (~line 664); add a NUL check or catch. Other odd keys (`..`, lone surrogate,
   2048 chars, blanks, bad %-escapes) answer 404.
3. **LOW. The confirm answer can disagree with the row.** If the file lands after confirm's HEAD (absent) and the sweep confirms
   the row before confirm's guarded write, confirm still answers `abandoned` while the row is `confirmed` (reproduced with a
   slowed HEAD). Quota is right; only the answer is stale. Re-read the row before answering.
4. **LOW (builder's named residual, graded).** The in-flight race itself (finding 1 without intent): confirm called while the
   person's own PUT is still running leaves the file uncounted until confirm is called again (reproduced, `usedBytes` stays
   without the file). No screen calls the route yet, so the app cannot trigger it; the risk is finding 1.

Pre-existing, same on main (not FIX-15): parallel presigns at the limit overshoot it (10 parallel 500 MB presigns: 6 accepted on
main, 6 on the branch; the next presign is then 413); the sweep treats HEAD 403 as absent.

### Checks that held (counts)
- Another person's key, its fileUrl, an upper-cased key, a `..` key, an evil-host URL carrying the path: all 404, same message
  as an unknown key, row untouched; B cannot revive A's abandoned row (6 of 6). Bad bodies (empty, number, null, array, 2049 chars,
  extra field) 400 (6 of 6); no token 401.
- Bucket outage (HTTP 500, connection reset): confirm 503 for a pending row and for an abandoned row, row unchanged
  (4 of 4); a usage read during the outage answers 200 and leaves 135 stale rows pending.
- Double confirm: 10 parallel on a present file all `confirmed`, `confirmedAt` unchanged on a repeat; 10 parallel on an absent
  file all `abandoned`; quota right after.
- Sweep and confirm racing on one row, 5 rounds of 7 parallel calls: present row ends `confirmed`, absent ends `abandoned`
  (10 of 10 rows).
- Quota at the limit: presign exactly filling it 200, refused PUT 403, next presign 413 and no row left behind, confirm gives
  the space back, retry 200; three more refuse-confirm-retry cycles, no drift.
- Sweep: 130 stale rows (65 present, 65 absent) plus 5 young: one read settles 130, young stay pending (50 per pass, not 50 total);
  520 stale rows: first read settles 500, second the last 20 (1.3 s); outage read ends (0.4 s, no loop).
- Non-content folder key (avatars) confirms and leaves the content figure alone.
- `POST /uploads/presign`: 21 recorded behaviours (valid, avatar, no token, bad folder, bad type, type not in folder, missing,
  extra, zero, float, over 512 MB, profile/work cap, chat folder, three quota steps, usage, allowance, stored rows, 500/500/500
  sequence) run on main and on the branch: byte-identical after masking uuid, signature, date and port. `contract/openapi.json`
  diff is additive only (one path, one schema).
- CI on 850dec4: suite 3 of 3, netns, protected routes, baseline, contract, deploy-test-in-sync green; Executable gates red with
  the same 18 FAIL lines as main bac39c4 (compared from both job logs), none in storage. eslint on the changed files 0;
  `tsc --noEmit` 0 errors.
- Mobile branch: docs and task files only; no screen draws the route (R-47 holds).

### Not tested
- A real S3/R2 endpoint (loopback bucket enforces no content-length; the real signed header would, and an attacker sends the
  honest size). No real provider was called.

Cleanup: stack `fix_15` down (database dropped, ports 7210-7217 closed), worktrees v-fix-15-be and v-fix-15-main removed, no
process of mine left. My throwaway specs and logs are under `.../scratchpad/fix-15-v/` (spec/, logs/, obs-attack.json, cmp-*.json).

## Builder report, round 2

Backend `wmt/FIX-15` `1d757b5` (code `06a003a`, on `850dec4`, main `18ac5f9` merged). No migration (`none`), no schema change.
- **Finding 1 (medium), confirm before the PUT:** `settleUpload` no longer abandons a row whose presigned URL can still be used. File missing and the row younger than 6 minutes (the URL's 300 s plus a minute, `CONFIRM_HOLD_MS`): answer `pending`, row untouched and still counted, the sweep settles it. Older: `abandoned` as before. File present: a `pending` row becomes `confirmed` as before; an `abandoned` row comes back only if it fits (usage plus its bytes within the limit, checked in one transaction under a per-person advisory lock, so two files landing together cannot both take the last room). If it does not fit, the file is deleted from the bucket and the answer is the presign's 413 (`storage_limit_reached`); the row stays `abandoned`, so usage shows only what fits.
- **Finding 2 (low), NUL key:** a key with a control character (NUL included) answers the unknown-key 404, same message, no database lookup.
- **Specs (`src/storage/tests/upload-settle.contract.spec.ts`, 14 of 14 pass; 5 fail on the previous service):** the verifier's repro (presign 500 MB then confirm before the PUT, up to 8 times) now refuses the third presign with 413, answers `pending` each time and usage reads 2 x 500 MB before and after the PUTs; a file landing after a give-up that no longer fits answers 413 and is gone from the bucket; two given-up files landing together take the last room once (200 and 413); NUL keys answer 404. The older cases that confirm a missing file now age the row past 6 minutes first.
- **Checks:** `tsc --noEmit` 0; eslint on the three files 0; `npm run test:contract -- src/storage` 7 suites, 168 tests pass; `npm run contract:build` leaves `contract/openapi.json` as committed (answer enum `confirmed`, `pending`, `abandoned`; additive against main). CI on `1d757b5` (runs 38911367401, 38911367198, 38911367932): suite 3 of 3 shards, netns, contract, protected routes, baseline, deploy-test-in-sync green; executable gates red with the same 16 FAIL lines as main, none in `src/storage`.
- **Lows 3 and 4:** moved to `tasks/SWEEP-APP.md` (rows FIX-15 3 and 4). Row 4 is much narrower now: a confirm inside the 6 minutes answers `pending`.
- **Not done:** no screen calls the route (app task).

## Verifier report, round 2

_Not started._
