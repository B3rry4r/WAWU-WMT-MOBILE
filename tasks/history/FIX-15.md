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

_Not started._

