---
id: FLIX-01
title: Flix movies on the Hub: catalog, watch link and partner accounts (on a stand-in)
owner: YOU
area: MOVIES
order: 119
priority: launch
repo: wawu-backend
type: third-party
status: review
depends_on: []
decisions: [R-74, R-75, R-39, R-67, R-68]
passes: [V1, V2, V3, V4, V6, V8, V9]
artboards: []
---
# FLIX-01 · Flix movies on the Hub: catalog, watch link and partner accounts (on a stand-in)

## Current state

As of 22 Oct 2026, review (verifier PASS: no blocker, high or medium; 4 lows). Built by a Sonnet builder (T2), verified by a separate Sonnet verifier. No PR.
- **Branches:** backend `wmt/FLIX-01` `b5913a1` (contract commit `312f16c`, then the build) on `origin/main` `1955fd1`; mobile `wmt/FLIX-01` (this file, SHARED-CHANGES FLIX-01 #1 to #3, DATA-INVENTORY I-418, DATA-SAFETY HK-09, the three G-FLIX rows). The verifier pushed nothing to the backend.
- **Routes (unchanged since `312f16c`):** `GET /movies`, `/movies/browse`, `/movies/filters`, `/movies/search`, `/movies/{movieId}`, `POST /movies/{movieId}/watch` (200). FLIX-03 builds from `contract/openapi.json`. Migration `20261031100000_flix_movies` (4 new tables; rollback proven both ways).
- **Verified (EXIT lines in the report):** tsc, eslint, 6 FLIX-01 specs (53 tests), `test:protected` 253/253, `contract:build` with no diff, gates 0 fail, baseline; plus a live stack: off, consent, links, deletion, rollback by psql.
- **Open lows for the sweep (the report has file, line, repro):** L1 sign-up time is `UserProfile.createdAt` because WAWU ID exposes none (a WAWU ID change would fix it; /join registrants before the date who first open the app after it count as agreed); L2 no catalog pass at boot (empty rails for up to 5 minutes); L3 a full pass can drop a boundary title if the partner unpublishes mid-pass; L4 FLIX-02 needs one wiring line in `src/movie-partner/movie-partner.module.ts`.
- **Not done:** the real Flixora adapter (FLIX-02: `MOVIE_PARTNER=flixora` stops the server at boot until then); every provider-dependent check is NOT RUN until FLIX-02 and the owner's key; `data-export-request.contract` (needs a running Hub) NOT RUN.
- **Next:** the lead merges backend and mobile `wmt/FLIX-01` together; FLIX-03 starts from the contract.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (additive only, the protected route suite, `npm run contract:build`).
- `DECISIONS.md`: R-74, R-75, R-39 (the provider seam this copies), R-67 (the sign-up agreement box), R-68
- `docs/flixora/PARTNER-API.md` (the movie object, paging, `updatedSince`, the sign-in token and link, the 1,000 requests per 15 minutes limit)
- Flow MV in `design/Flix Movies Flow.dc.html` (MV1 to MV12) for the fields the screens need
- `src/wallet-provider/` and `src/money/` in the backend: the seam and the boot-time adapter pick this task copies in shape

## Goal

The Hub serves Flixora's catalog and a signed-in watch link through one seam, treats a person's first "Watch on Flixora"
as the opening of their Flixora account as R-75 says, and unplugs with `MOVIE_PARTNER=off`. Built and verified against
a stand-in; the real Flixora adapter is FLIX-02.

## Scope

- `src/movie-partner/`: the `MOVIE_PARTNER` token and a small interface shaped on `docs/flixora/PARTNER-API.md`: list movies a page at a time with `updatedSince`, one movie, and a signed-in link for one person to one movie. Adapters: `off` (the default; empty is off) and `standin` (fixtures of made-up titles with every field of the docs' movie object, some with a file trailer, some with a YouTube trailer, some premiering). `flixora` is FLIX-02. A spec checks nothing outside the adapter imports `src/flixora/`.
- Catalog copy: a sync job keeps an additive table of the partner's movies (incremental with `updatedSince`, a full pass now and then for removals), so screens never call the partner and the 1,000 requests per 15 minutes limit is never near. Browse (sort newest, rating, views, title; genre; language; premiering only; a total), search, filter options (the genres and languages present) and rails (New on Flixora: newest; Most watched: views; Top rated: rating; Premiering soon: premiering) are served from that table. The trailer is served with its kind: `file` or `youtube`.
- Routes under `/api/hub/movies` (signed in), each in the contract (`npm run contract:build`): `GET /movies` (`enabled`, hero, rails; when off `{ enabled: false, hero: null, rails: [] }`), `GET /movies/browse`, `GET /movies/filters`, `GET /movies/search`, `GET /movies/{movieId}` (includes `mustAgreeTerms` for this person), `POST /movies/{movieId}/watch` (body `{ agreeToTerms?: boolean }`; answers `{ url, expiresAt }`, 409 `terms_not_agreed`, 503 `movies_unavailable` with a plain sentence). When off, every route but `GET /movies` answers 404 `movies_off`.
- Additive tables (a new migration with a rollback that starts with `\set ON_ERROR_STOP on` and refuses while rows exist): the movie copy; partner links (provider, WAWU user, first and last link time, link count: the Flixora account exists on the partner's side from the first link); partner consents (provider, WAWU user, agreed time, how: sign-up or MV4). Nothing existing changes.
- The watch tap: R-75's agreement check (`FLIXORA_TERMS_FROM`; empty means nobody counts as agreed by sign-up; find the most reliable sign-up time the Hub has for a person and name it in the report), then a fresh link from the seam per tap (never stored, never logged: the link carries a one-time token), and the partner-link row updated.
- Account deletion: the purge stops further links for that person and marks their partner-link row. Closing the Flixora account is by hand (BACKEND_GAPS G-FLIX-2). Find where SETTINGS-06's purge runs; the change is additive.
- Data sent: only `sub` (the person's permanent WAWU id), email, first and last name, and whether WAWU verified the email; never phone, BVN, NIN, ID documents or wallet data (a spec checks what the seam is given).
- Docs: `.env.example` and `deploy/README.md` list `MOVIE_PARTNER`, `FLIXORA_TERMS_FROM` and the catalog sync settings, with no secret. In the mobile repo, DATA-INVENTORY and DATA-SAFETY each get a line for "name and email shared with a movie partner" (mobile branch).
- BACKEND_GAPS: G-FLIX-1 (MV4's consent box for people who agreed to older terms), G-FLIX-2 (no API call closes a Flixora account), G-FLIX-3 (a YouTube trailer on MV3) are already written by the records pass; this task closes or updates them as it builds.

## Capability checks

- [x] `MOVIE_PARTNER=off` (and empty): `GET /movies` answers `enabled: false`, every other movie route answers 404 `movies_off`, no call is made to any partner and no link is given.
- [x] `standin` serves every route above, and every route is in the contract (`npm run contract:build`).
- [x] The sync copies new titles, updates changed ones with `updatedSince`, and removes titles the partner dropped; screens read only the copy.
- [x] A person who signed up on or after `FLIXORA_TERMS_FROM` gets a link straight away from `POST /movies/{movieId}/watch`; a person before it (or with the setting empty) gets 409 `terms_not_agreed` until `agreeToTerms: true`, which stores the consent first, with its time and how.
- [x] Each tap gets a fresh link; a link is never stored and never logged (V8: a second tap is a new link, a repeated consent stores one row).
- [x] After account deletion no link is given for that person.
- [x] The seam is given only the allowed fields (a spec checks it).
- [x] Protected routes unchanged (`npm run test:protected`); the new migration's rollback refuses while rows exist.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FLIX-01.md](history/FLIX-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
