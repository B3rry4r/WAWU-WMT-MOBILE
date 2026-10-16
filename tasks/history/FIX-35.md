# FIX-35 · round history

Moved out of [tasks/FIX-35.md](../FIX-35.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-35` `0d5acda`, from main `3797fb2`. One file.
- **Red (the fix still catches a write):** a write of the uploaded front image to `os.tmpdir()` planted in `documents.service.ts` (a scratch edit, put back from a saved copy; `git status` showed only the spec afterwards) fails the case: `Expected: []`, `Received: ["planted-...bin", "planted-...bin"]` (the two uploads of the run that reached the planted line).
- **Red (the defect, before):** main's spec with another process creating and removing entries in the temporary folder during the run (a loop making `runc-process-*` folders and `*.log` files and leaving one file) fails the case on the listing compare (`fix35-other-21.log` in the before list, `fix35-other-29.log` in the after list, the kept file in both).
- **Green:** the changed spec with the same churn running throughout passes, and passes alone with none. 10 runs in a row green (130 of 130 tests each) on the local stack `fix_35` with the churn running for all ten.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `0d5acda`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 16 FAIL lines as on main (`gates run: 1249 files scanned, 16 fail`, the same as `3797fb2`; none in this spec).

## Verifier report

_Not started._

