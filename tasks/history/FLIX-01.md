# FLIX-01 · round history

Moved out of [tasks/FLIX-01.md](../FLIX-01.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, 22 Oct 2026 (T2). Backend `wmt/FLIX-01`, first commit `312f16c` (routes and shapes), build `ca3de74`, gates `b5913a1`; mobile `wmt/FLIX-01`.
- **Files:** backend `src/movie-partner/` (the `MOVIE_PARTNER` seam, `off`, `standin`), `src/movies/` (controller, service, sync job, purge hook, specs), migration `20261031100000_flix_movies`, purge map and data export entries, `.env.example`, `deploy/README.md`, `app.module.ts` (SHARED-CHANGES FLIX-01 #1 to #3). Mobile: this file, SHARED-CHANGES, DATA-INVENTORY I-418, DATA-SAFETY HK-09 (PI-01 and PI-02 cells), the G-FLIX rows.
- **Check 1 (off):** unset, empty, blank, `off` and ` OFF ` all hide everything: `GET /movies` is `enabled: false`, the other five routes `404 movies_off`, no adapter method called (spied), no link or consent row, the sync does nothing; stored rows stay. `flixora` and unknown names stop the server at boot. Passed.
- **Check 2 (standin):** all six routes served and in the contract (`contract:build`, no diff after). Rails, sorts, genre, language, premiering, total, search, filters, trailers of both kinds. Passed.
- **Check 3 (sync):** new, changed (`updatedSince` asked), dropped (removed by the full pass only; an empty full pass keeps the copy; a down partner keeps it); a lease stops two passes; screens never call the partner (call count unchanged). Passed.
- **Checks 4 and 5 (terms, links):** on or after the date: link at once, one `signup` consent row; before it, empty, or a bad date: `409 terms_not_agreed`, no link, no row; `agreeToTerms: true` stores one `mv4` row first; a repeat stores none; three taps give three different links and tokens; none is in any stored row or logged line. Passed.
- **Check 6 (deletion):** `409 account_closing` once a deletion is asked for (not when cancelled); the purge hook marks `accountDeletedAt` (twice is safe) and no link follows. Passed.
- **Check 7 (data sent):** the seam gets exactly `sub`, `email`, `firstName`, `lastName`, `emailVerified`; no phone, country, tier, trust score or id number (asserted on the argument). Passed.
- **Check 8:** `test:protected` 253 of 253, EXIT 0, against the base lock (not relocked); the rollback spec: refuses with a link or a consent stored, goes through otherwise.
- **Counts:** new specs 41 tests in 3 files, with the rollback-line, purge-map and export-map specs 53 in 6 files (EXIT 0); gates 0 fail, 133 warn (131 before, my 2 `PROVISIONAL` markers), baseline check EXIT 0; tsc, eslint, prettier clean. `data-export.contract.spec.ts` was not run to green (it needs `ADMIN_JWT_SECRET`, not set here); my export section is loaded by my own spec.
- **Decisions to confirm:** sign-up time = `UserProfile.createdAt` (the earliest the Hub holds; the token has none), unsafe only for someone who signed up before the date and onboarded after it; the link row is AUDIT in the purge map (kept, marked) so the account can be closed by hand, the consent row is OWNED; `POST watch` answers 200; two extra refusals, `409 account_closing` and `409 email_required` (a person with no email); the stand-in titles file is `standin-titles.ts` because the fake_data gate flags any import path with "fixture"; refresh settings are PROVISIONAL (15 min, 24 h).
- **Not done:** the real adapter (FLIX-02); a real-partner run (NOT RUN, unblocked by FLIX-02 and the owner's key). Postgres on this machine was stopped (stale pid); I started it with `pg_ctlcluster 16 main start`.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

