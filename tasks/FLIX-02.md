---
id: FLIX-02
title: Flix movies: the Flixora adapter
owner: YOU
area: MOVIES
order: 124
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [FLIX-01]
decisions: [R-74, R-75, R-39]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# FLIX-02 · Flix movies: the Flixora adapter

## Current state

As of 22 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Waits for:** FLIX-01 (the seam and the stand-in), and from the owner the Flixora test key (`flx_test_...`), the test sign-in secret and the partner slug from the Flixora partner portal. The live key and live secret come after Flixora approves the account (until then live keys and live sign-ins answer 403).
- **Lead default:** built and checked against Flixora's TEST environment with the test key only (test sign-ins make sandbox accounts; plays never count). Never a `flx_live_` key; a live key stays on the server and is set by the lead at release.
- **Facts:** `docs/flixora/PARTNER-API.md` (the owner's paste of Flixora's docs, 22 Oct 2026). Real test responses go beside it under `docs/flixora/`, like `docs/fintava/`. Nothing is guessed.
- **History:** none yet. Reports go to tasks/history/FLIX-02.md.

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

- `src/flixora/`: an adapter for the FLIX-01 interface. Nothing outside it imports `src/flixora/`.
- Catalog: `GET /v1/movies` paged, with `updatedSince` and `region` (setting `FLIXORA_REGION`, default NG), and `GET /v1/movies/{id}`.
- Sign-in link: the HS256 sign-in token (claims `iss` = the partner slug, `aud` "flixora", `sub`, `email`, `given_name`, `family_name`, `email_verified`, `jti`, `iat`, `exp` 60 seconds) and the link `https://www.flixora.com/partner/<slug>/login#token=...&redirect=<flixoraPath>`. Only the allowed fields go in the token (R-75); never phone, BVN, NIN, ID documents or wallet data.
- Settings: `FLIXORA_API_BASE_URL`, `FLIXORA_API_KEY`, `FLIXORA_SSO_SECRET`, `FLIXORA_PARTNER_SLUG`, `FLIXORA_SITE_URL`, `FLIXORA_REGION`. Missing ones stop a `flixora` server at boot, naming them. The `X-Flixora-Environment` header is logged at boot. Secrets are never committed and never in the app.
- Errors: 401, 403, 404 and 429 map to plain answers (the Hub's `503 movies_unavailable` for the ones a person cannot fix). Never log a token or a link.
- Flixora's webhooks only if the docs require them (they do not today).

## Capability checks

- [ ] (key) Against the test environment, the sync copies the real catalog: titles, posters, ratings and dates come from Flixora.
- [ ] (key) A link opens Flixora signed in as a sandbox user (checked once in a real browser by the lead).
- [ ] A second tap makes a new token (V8: a new `jti` each time).
- [ ] A missing setting stops a `flixora` server at boot and names the setting.
- [ ] A live key (`flx_live_...`) is never used by a spec, a stack or a test run.
- [ ] 401, 403, 404 and 429 each map to the plain answer; no token or link appears in a log.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
