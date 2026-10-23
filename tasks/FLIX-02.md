---
id: FLIX-02
title: Flix movies: the Flixora adapter
owner: YOU
area: MOVIES
order: 124
priority: launch
repo: wawu-backend
type: third-party
status: verifying
depends_on: [FLIX-01]
decisions: [R-74, R-75, R-39]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# FLIX-02 · Flix movies: the Flixora adapter

## Current state

As of 23 Oct 2026, verifying. Built by a Sonnet builder (T2); a separate verifier is next. No PR.
- **Branches:** backend `wmt/FLIX-02` `ebf9fc5` on `origin/main` `13e27536`; mobile `wmt/FLIX-02` (this file, `docs/flixora/TEST-RESPONSES.md`, LOG, PROGRESS).
- **Built:** `src/flixora/` (settings, HS256 link, client, mapping, adapter), the one wiring line in `src/movie-partner/movie-partner.module.ts` (FLIX-01 L4), `.env.example` and `deploy/README.md` list the six `FLIXORA_*` settings. `POST /movies/{id}/watch` refuses a title that has not premiered: `409 movie_not_premiered` ("This movie has not premiered yet. You can watch it once it does."), before any agreement or link. No route added; the contract has no diff (the new 409 code is not in the route's text; FLIX-03 shows the Hub's `message` for it).
- **Real checks against Flixora's TEST environment** (test key only, every answer `X-Flixora-Environment: test`, 6 requests): the sync copied 29 titles; a second sync asked `updatedSince` and changed nothing; one title by id matched the copy; a missing id gave null; a made-up key gave 401. Facts in `docs/flixora/TEST-RESPONSES.md`.
- **NOT RUN:** (key) the signed link opening Flixora as a sandbox user: waits for the test sign-in secret and the partner slug. The link is proved by unit tests with a known secret.
- **Real catalog notes for the lead:** all 5 `premiering: true` titles have premiere dates already past, so "Premiering soon" is empty on today's test data; no title has a rating yet, so "Top rated" is empty too; no trailer is a YouTube link; a few genres hold a pipe inside one entry ("Comedy | Thriller").
- **Next:** the verifier; then the lead sets the test secret and slug, checks the link once in a real browser, and sets the live key and secret at release.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: R-74, R-75, R-39
- `docs/flixora/PARTNER-API.md` (all of it: catalog, token claims, the link, errors, limits)
- `tasks/FLIX-01.md` and its builder report: the `MOVIE_PARTNER` interface and the stand-in this adapter must match

## Goal

`MOVIE_PARTNER=flixora` works against Flixora's partner API as `docs/flixora/PARTNER-API.md` says.

## Scope

- `src/flixora/`: an adapter for the FLIX-01 interface. Nothing outside it imports `src/flixora/`, except the one wiring line in `src/movie-partner/movie-partner.module.ts` (FLIX-01 L4).
- Catalog: `GET /v1/movies` paged, with `updatedSince` and `region` (setting `FLIXORA_REGION`, default NG), and `GET /v1/movies/{id}`.
- Sign-in link: the HS256 sign-in token (claims `iss` = the partner slug, `aud` "flixora", `sub`, `email`, `given_name`, `family_name`, `email_verified`, `jti`, `iat`, `exp` 60 seconds) and the link `https://www.flixora.com/partner/<slug>/login#token=...&redirect=<flixoraPath>`. Only the allowed fields go in the token (R-75); never phone, BVN, NIN, ID documents or wallet data.
- Settings: `FLIXORA_API_BASE_URL`, `FLIXORA_API_KEY`, `FLIXORA_SSO_SECRET`, `FLIXORA_PARTNER_SLUG`, `FLIXORA_SITE_URL`, `FLIXORA_REGION`. Missing ones stop a `flixora` server at boot, naming them. The `X-Flixora-Environment` header is logged at boot. Secrets are never committed and never in the app.
- Errors: 401, 403, 404 and 429 map to plain answers (the Hub's `503 movies_unavailable` for the ones a person cannot fix). Never log a token or a link.
- Flixora's webhooks only if the docs require them (they do not today).

## Capability checks

- [x] (key) Against the test environment, the sync copies the real catalog: titles, posters, ratings and dates come from Flixora. Passed 23 Oct: 29 titles, 29 posters, 22 file trailers, 7 none, 5 flagged premiering (all dates past); second sync with `updatedSince` changed nothing (table hash identical); one title by id matched the copy.
- [ ] (key) A link opens Flixora signed in as a sandbox user (checked once in a real browser by the lead). (key) NOT RUN: waits for the test sign-in secret and slug. Unit-proved with a known secret: HS256, every claim, `exp` 60 s, token after `#`.
- [x] A second tap makes a new token (V8: a new `jti` each time). Passed: three taps, three different tokens and `jti`s, each `exp` - `iat` = 60.
- [x] A missing setting stops a `flixora` server at boot and names the setting. Passed: the module build fails with `MOVIE_PARTNER=flixora needs FLIXORA_API_BASE_URL, ...`; a bad region, key prefix or address names its setting without quoting a value.
- [x] A live key (`flx_live_...`) is never used by a spec, a stack or a test run. Passed: no live key exists on the build machine; a spec fails if any file in `src` holds a live-looking key or a test key of real length; the client refuses an answer whose environment header disagrees with the key's prefix.
- [x] 401, 403, 404 and 429 each map to the plain answer; no token or link appears in a log. Passed: 401 (real: made-up key) and 404 (real: unknown id gives null) against the test environment; 403 and 429 by unit test only (the test account cannot provoke them); a spec scans every logged line and error message for the key, the secret, a response body, a token, a link and the email.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FLIX-02.md](history/FLIX-02.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
