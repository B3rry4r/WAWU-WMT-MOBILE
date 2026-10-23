# FLIX-02 · round history

Moved out of [tasks/FLIX-02.md](../FLIX-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, 23 Oct 2026 (T2). Backend `wmt/FLIX-02` `ebf9fc5` on `origin/main` `13e27536`; mobile `wmt/FLIX-02`.
- **Files:** backend `src/flixora/` (`flixora-settings`, `flixora-token`, `flixora-client`, `flixora-mapping`, `flixora-movie-partner`, 34-test spec), one wiring line in `src/movie-partner/movie-partner.module.ts` (a static `FlixoraMoviePartner.fromConfig`, so FLIX-01's import-boundary spec passes untouched), `movies-error.ts` and `movies.service.ts` (`movie_not_premiered`), `.env.example`, `deploy/README.md`. Mobile: this file, `docs/flixora/TEST-RESPONSES.md`, LOG, PROGRESS.
- **Capability checks:** see the ticked list above, each with what came back. Real run: test key, 6 requests, all `X-Flixora-Environment: test`. NOT RUN: the link opening Flixora (waits for the test secret and slug).
- **Watch before the premiere (FLIX-01 low):** `409 movie_not_premiered` when `premiering` is true and the date has not passed (the same test as the card's `premiering`); it comes before the agreement and the deletion checks, so nothing is stored. One new contract test: refused with the agreement ticked (no consent row, no link, no partner call), then watchable once the date has passed.
- **One FLIX-01 assertion changed:** `movies.contract.spec.ts` pinned "flixora is not built yet"; with the adapter built it now expects the missing-settings stop (it clears `FLIXORA_*` from the environment for that line). Nothing else in a FLIX-01 test changed.
- **Counts:** `tsc` EXIT 0; eslint (no fix) and prettier on the 10 changed `.ts` files EXIT 0; the 7 specs in band (my 34 + the 6 FLIX-01 suites, 54 with my new premiere test) 88 tests EXIT 0; `test:protected` 253/253 EXIT 0 on the base lock; `contract:build` EXIT 0, no diff; gates 0 fail, 133 warn, 88 accepted (same as FLIX-01), baseline EXIT 0.
- **Safeguards beyond the brief:** the client reads `ratelimit-remaining` and `ratelimit-reset` and stops calling at 25 left until the reset; a 429 pauses calls for `Retry-After`; an answer whose environment header disagrees with the key's prefix is refused; redirects are not followed; a `redirect` that is not a single-slash path is dropped from the link.
- **Not done:** the real link check (key); FLIX-01 lows L1 to L3 (not in this task). The controller's text does not list `movie_not_premiered` (that would change the contract); FLIX-03 already hides Watch before a premiere, so the 409 is a safety net.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

