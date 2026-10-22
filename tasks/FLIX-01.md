---
id: FLIX-01
title: Flix movies on the Hub: catalog, watch link and partner accounts (on a stand-in)
owner: YOU
area: MOVIES
order: 119
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: []
decisions: [R-74, R-75, R-39, R-67, R-68]
passes: [V1, V2, V3, V4, V6, V8, V9]
artboards: []
---
# FLIX-01 · Flix movies on the Hub: catalog, watch link and partner accounts (on a stand-in)

## Current state

As of 22 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. No dependencies; ready to schedule. FLIX-02 (the real Flixora adapter) and FLIX-03 (the app) wait for this task.
- **Rulings:** R-74 (the catalog in the app, watching on Flixora) and R-75 (the account opens on the first "Watch on Flixora"; one setting unplugs it), both owner, 22 Oct 2026.
- **Facts:** `docs/flixora/PARTNER-API.md` in this repo is the owner's paste of Flixora's partner docs. The stand-in is shaped on it; no call to Flixora is made in this task.
- **History:** none yet. Reports go to tasks/history/FLIX-01.md.

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

- [ ] `MOVIE_PARTNER=off` (and empty): `GET /movies` answers `enabled: false`, every other movie route answers 404 `movies_off`, no call is made to any partner and no link is given.
- [ ] `standin` serves every route above, and every route is in the contract (`npm run contract:build`).
- [ ] The sync copies new titles, updates changed ones with `updatedSince`, and removes titles the partner dropped; screens read only the copy.
- [ ] A person who signed up on or after `FLIXORA_TERMS_FROM` gets a link straight away from `POST /movies/{movieId}/watch`; a person before it (or with the setting empty) gets 409 `terms_not_agreed` until `agreeToTerms: true`, which stores the consent first, with its time and how.
- [ ] Each tap gets a fresh link; a link is never stored and never logged (V8: a second tap is a new link, a repeated consent stores one row).
- [ ] After account deletion no link is given for that person.
- [ ] The seam is given only the allowed fields (a spec checks it).
- [ ] Protected routes unchanged (`npm run test:protected`); the new migration's rollback refuses while rows exist.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
