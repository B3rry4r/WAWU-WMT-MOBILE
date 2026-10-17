# FIX-15 verifier report (16 Oct 2026)

Backend `wmt/FIX-15` 850dec4 (merge-base 56f94d0; main is bac39c4), mobile 6239878 (docs only).
Verdict: **fix** (one medium).

## Findings

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

## Checks that held (counts)
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

## Not tested
- A real S3/R2 endpoint (loopback bucket enforces no content-length; the real signed header would, and an attacker sends the
  honest size). No real provider was called.

Cleanup: stack `fix_15` down (database dropped, ports 7210-7217 closed), worktrees v-fix-15-be and v-fix-15-main removed, no
process of mine left. My throwaway specs and logs are under `.../scratchpad/fix-15-v/` (spec/, logs/, obs-attack.json, cmp-*.json).

---

# Round 2 (16 Oct 2026)

Backend `wmt/FIX-15` 1d757b5 (code 06a003a), mobile 4610e2b (docs and task files only). Verdict: **merge** (nothing medium or worse).

## Findings
1. LOW (design consequence, not a defect against the capability check). A refused upload confirmed at once answers `pending`
   and keeps its space for 6 minutes (second confirm) or 15 minutes (sweep). Measured: 300 MB stored, 500 MB PUT refused (403),
   confirm now = `pending`, usage 800 MB, retry presign 413; after 7 minutes the same confirm = `abandoned`, usage 300 MB, retry 200;
   sweep-only path: 800 MB to 300 MB after 16 minutes. Capability check 1 says "after the confirm or the sweep", so it holds.
   Matters only when a screen calls the route (none does yet); the app task should confirm again after 6 minutes or accept the wait.
2. LOW (same class as main, new variant). `presignUpload` takes no part in the per-person advisory lock, so a presign racing a late
   file coming back can overshoot the limit: 4 of 20 rounds (1000 MB used, 20 MB presign vs 20 MB late file, room 24 MB). Two parallel
   presigns do it 19 of 20 rounds on the same rig, and on main (round 1: 10 parallel presigns, 6 accepted). The lock does what the
   builder claims (late file vs late file); presign is not in it. Bounded by the number of parallel calls (throttle 200 per minute).
3. LOW (carried, unchanged). A PUT that is still running when the sweep (15 min) or a confirm after 6 min asks the bucket is seen
   as absent and its row goes `abandoned`; the file is uncounted until confirm is called again, and then comes back only if it fits.
   The sweep already did this on main (15 min), so no new hole; the 6-minute confirm shortens the window. Already SWEEP-APP row FIX-15 4.
Pre-existing, not FIX-15: parallel presigns overshoot the limit (finding 2); the sweep and confirm treat HEAD 403 as absent.

## Round 1 medium: closed
- 8 x {presign 500 MB, confirm before PUT}: presigns 200, 200, then 413 x 6; both confirms `pending`; usage 1000 MB before and
  after the PUTs; confirm after the PUTs `confirmed`, usage 1000 MB; 9th presign 413. Confirm spam x20 (parallel) on a young absent
  row: 20 of 20 `pending`, row `pending`, usage 500 MB, next presign 200 then 413. Key and fileUrl forms both tested.
- Age edge (file absent): 0 s, 120 s, 340 s, 355 s `pending` and counted; 365 s, 380 s, 14 min, 16 min `abandoned`, usage 0.

## Round 2 changes
- Late file, abandoned row: fits (400 MB abandoned, 900 MB used) refuses with 413, body identical to a presign 413 for the same
  size (code storage_limit_reached, needed/used/limit/tickHeld), file deleted from the bucket, row stays `abandoned`, usage unchanged,
  a second confirm answers 200 `abandoned`. Another person's confirm on that key: 404, file and row untouched. Exact fit
  (1000 MB + 24 MB = limit) `confirmed`; 24 MB + 1 byte refused and deleted. Avatars (not counted) come back with no fit check.
  A sweep-abandoned row (no confirm) behaves the same. Delete failing (bucket 500): still 413, row `abandoned`, file stays, next
  confirm removes it.
- Two or more late files together: 10 rounds (3 x 500 MB room 2; 6 x 300 MB room 3), each file confirmed twice in parallel plus
  usage reads: exactly the room taken every round (2 or 3 rows `confirmed`, bucket the same, usage 1000 or 900 MB, no 5xx). Storm:
  150 x 10 MB parallel confirms plus 20 usage reads on one person: 102 `confirmed`, 48 refused 413, usage 1020 MB of 1024, no 5xx.
  Mutation: with the advisory-lock line removed the same spec fails (6 of 6 confirmed, expected 3), so the test has power; file restored.
- Confirm racing the sweep: 6 rounds of 4 present + 4 absent aged rows, each confirmed twice with usage reads interleaved: present
  rows all `confirmed`, absent all `abandoned`, usage exact, 0 non-200. File landing between the sweep's HEAD and confirm's HEAD (delayed
  answers): row `confirmed`, usage right. Young pending row, file landing mid-storm, 6 rounds: always ends `confirmed`, usage 50 MB.
- Control characters: 17 keys with NUL, C0, DEL, tab, CR LF, trailing NUL on a real key, `%00` and `%0a` in a URL, 100 NULs: all 404 with
  the unknown-key message, zero bucket calls, the real row untouched; 60 parallel NUL keys then a normal confirm still works. 20 other odd
  keys (C1, U+2028, lone surrogates, emoji, `%zz`, `..`, 2048 chars, upper-case, `null`, `{}`) 404, none 5xx. Bodies empty, number, null, ``, extra field: 400 x 5. No token: 401.
- Outage (HTTP 500 and connection reset) on a young pending, an aged pending and an abandoned row: 503 x 3, rows unchanged.
- Presign: the 21 recorded behaviours of round 1 rerun on 1d757b5 against round 1's recording from main: 21 of 21 identical.
- Other readers of the row status (frames check, chat, profile work, legal) take `pending` as before; nothing there depends on confirm.
- CI on 1d757b5: suite 3 of 3, netns, protected routes, contract, baseline, deploy-test-in-sync green; Executable gates red with
  16 FAIL lines, identical to main 18ac5f9's run (diffed from both job logs), none in src/storage. `contract/openapi.json`: 62 insertions,
  no deletions (one path, enum confirmed/pending/abandoned). Mobile branch: 6 markdown files, no screen (R-47 holds).

## Not tested
A real S3/R2 bucket (loopback bucket, real AWS SDK and real database; no real provider called); a presigned URL's real expiry.

Cleanup: stack fix_15 down (database dropped, ports 7210-7217 closed), worktree v-fix-15-be removed, no process of mine left.
My specs and logs: .../scratchpad/fix-15-v2/ (spec/, logs/, obs-*.json).
