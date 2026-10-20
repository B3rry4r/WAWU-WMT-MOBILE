# FIX-92 · round history

Moved out of [tasks/FIX-92.md](../FIX-92.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: the two spec files above. Nothing else in the backend.
- Red (`origin/wmt/MERGE-12` `3d64d85`, fresh DB from `prisma migrate deploy` and `npm run db:seed`, mock WAWU ID on 7860, `npx jest --runInBand --forceExit` per spec, in the order above): search 12/12, identity 9/9, credit-purchase 12/12, credits-state 3 of 4 (EXIT 1: `typeof trialEndsAt` expected string, received object), event-host-wizard 18/18, event-door-scan 5/5, learn-entitlement 5/5, course-lesson 8/8. Seeded user's AccountDeletion rows: 0, then 1 after step 1 and 1 after every spec after it.
- Green (same order, a new fresh DB): all eight suites pass, 73 tests, every EXIT 0. Seeded user's AccountDeletion rows: 0, then 0 after every spec.
- Only (b), the search spec as on `MERGE-12`: all eight pass; the seeded row stays `scheduled`, `purgedAt` null, lease and next-ask marks back to null.
- `credits-state.contract.spec.ts` names `http://localhost:4001` in the file; the runs sent that one address to my mock with a `--require` shim in my own scratch folder (NODE_OPTIONS), not in the repo.
- Gates: 0 fail, 128 warn, 88 accepted (EXIT 0). `npx tsc --noEmit` EXIT 0. eslint on the two files EXIT 0. Fintava: none of the eight specs imports the double.
- Gap: G-FIX-90-1 is added to `BACKEND_GAPS.md` here as its FIX-90 text with the last cell "closed by FIX-92" (the row exists only on `wmt/FIX-90`, so merging both conflicts on that one line: keep this one).
- Not done: nothing. Freezing rows another spec left (mid-request) are not held; none exists in the whole-suite run.

## Verifier report

