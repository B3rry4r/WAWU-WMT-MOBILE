---
id: EXPLORE-05
title: Search: communities, recent and popular searches, ticks
owner: YOU
area: EXPLORE
order: 99
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SCHOOLS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EXPLORE-05 · Search: communities, recent and popular searches, ticks

## Current state

As of 16 Oct 2026, round 1 (builder, Sonnet).
- **Status:** verifying. Backend only: this task has no screen (artboards: []), so there are no pictures; the screens are EXPLORE-02 (X5, X6) and EXPLORE-04 (X8, X9, X11).
- **Branches:** wawu-backend `wmt/EXPLORE-05` `9e6b4bc` (from main `18ac5f9`); mobile `wmt/EXPLORE-05` (contract copied from the backend branch, SHARED-CHANGES EXPLORE-05 #1 and #2). Migration `20261022190000_search_history` (one new table `SearchHistory`; the lead renames the stamp at merge if needed).
- **Merged and live:** nothing of this task.
- **What the app calls (new, additive):**
  - X5 Recent, Clear: `POST /search/recent` `{ q }` when the person submits a search (signed in; same text again moves to the top; the newest 20 are kept), `DELETE /search/recent` (Clear, answers `{ cleared }`), and `recentSearches` on `GET /search/suggestions` (the caller's own, newest 10; `[]` signed out).
  - X5 People are searching: `GET /search/popular` (public; a search appears when at least 3 different people made it in the last 30 days; empty on a new install, so the section is not drawn, G-340). The app never reads `popularSearches` from `GET /search/suggestions`, which still gives the web the titles of the most viewed content.
  - X6, X9 Communities: `GET /search` fills `communities` on `tab=all` and `tab=communities` (name contains `q`, any case, prefix first, then more members; same `memberCount` and `messagesToday` as `GET /communities`; a room hosted by someone blocked either way is not a result). No viewer state on the row (G-341).
  - Ticks (X5, X6, X8, X9, X11): creator rows already carry `verification` (`creator` and `professional`, each `verified` and `expiresAt`, derived on the server from the expiry) in `creators` and `suggestedCreators`; the analysis row "no tick" was stale. A spec now pins both lists, a lapsed tick and both ticks together.
- **Decisions:** popular is read from `SearchHistory` itself, so Clear removes a person's text from it and no second count can outlive a Clear; email-like and number-like text is never offered. Every figure is config with `PROVISIONAL(...)` (`src/search-response/search-history.config.ts`). `SearchHistory` is in the account purge map and the data export.
- **Two old tests changed (they pinned the Wave 3 stub):** `search-response.contract.spec.ts` "always returns communities: []" and "tab=communities ... always empty" now expect the seeded "SEEDED: WAWU Founders Circle". Both said in their own comments they must change when community search went live; the lead may check the two hunks.
- **Open findings:** none known. Not done: pictures (no screen here).
- **Next:** a verifier runs V1 V2 V3 V4 V9 on the stack (`scripts/dev/stack.sh up`, source `env.sh`, `npm run test:contract -- src/search-response`), and the protected route suite.
- **Records:** this file's Builder report.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Search finds communities, remembers a user's recent searches with Clear, shows popular searches from real queries, and marks ticked creators (X5, X6, X8, X9, X11). Schools come from SCHOOLS-04, which builds the schools search. Additive only.

## Scope

Communities in search, saved recent searches with clear, popular searches from real queries, ticks on creator rows. The schools tab is SCHOOLS-04's; this task depends on it so search covers schools.

## Capability checks

- [ ] A user's recent searches survive a restart and can be cleared.
- [ ] Search returns communities by name.

## Builder report

Builder, 16 Oct 2026 (Sonnet). Backend `wmt/EXPLORE-05` `9e6b4bc`; mobile `wmt/EXPLORE-05`.
- **Files (backend):** `prisma/schema.prisma` + migration `20261022190000_search_history` (model `SearchHistory`: person, normalised text, newest text, time; primary key person and text); `src/search-response/` new `search-history.{service,controller,config}.ts` and `dto/record-recent-search.dto.ts`, edits to `search-response.{service,module}.ts`; `src/account-purge/account-data-map.ts` (OWNED) and `src/data-export-request/data-export-sections.ts` (`recentSearches`); `contract/openapi.json` regenerated (+3 operations on 2 paths, +3 schemas, 0 removed).
- **Files (mobile):** `contract/` and `src/api/schema.generated.ts` copied and regenerated from the branch, `BACKEND_GAPS.md` (G-340, G-341), `SHARED-CHANGES.md` (EXPLORE-05 #1, #2), this file, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/INDEX.md`.
- **Capability check 1 (recent searches survive a restart and can be cleared):** spec `search-history.contract.spec.ts` saves two searches, closes the Nest app, builds a new one and reads the same list through `GET /search/suggestions`; Clear returns the count, empties the list, leaves another person's list alone and is not an error twice; signed out is 401 on POST and DELETE; odd bodies (empty, blank, NUL, 5000 characters, number, null, array, object, extra key, no body) are 400, never 500. Also run by hand over HTTP on the stack Hub.
- **Capability check 2 (search returns communities by name):** same spec: name match in any case on `tab=all` and `tab=communities`, empty on the other tabs and for a name nobody has, a description-only match is not a result, ranking, counts equal to `GET /communities/{id}`, a blocked host's room hidden, `%00` is 400 and `%_\` is 200.
- **Popular and ticks:** spec seeds people directly: 40 people shown, 2 people not, a 40-day-old search not, email-like and number-like text never; one person repeating a search counts once; a Clear drops a search below 3 people; the public route ignores a bad token; creators and Creators to know carry purple, lapsed (false), both, none.
- **Specs run:** new spec 20/20; with the existing search-response, searchable-query, schools-public, account-purge and export-map specs 102/102 locally (and `data-export.contract` 16/16 on a second run; one race test failed once under load); `block-hides-people` 37/37. `tsc` and eslint clean on the changed files.
- **CI on backend `9e6b4bc`:** Branch checks run 38919420272 (3 suite shards, netns, contract, deploy-test-in-sync) passed; Protected routes (V3) run 38919420054 passed; Gates run 38919419790 failed with the same 16 FAIL lines as main (flutterwave and admin files), none in search code; baseline entries passed.
- **Gate counts (mobile):** after: 10 gates, 0 fail, 5 warn, 0 accepted (not measured before; no gate reads the files this change touches). Full local check (typecheck, lint, 155 suites 2832 tests, gates, tasks) EXIT 0; the mobile change is docs and generated types only.
- **Gaps and shared changes:** G-340 (popular is empty until 3 people search the same thing), G-341 (no viewer state on a community row); SHARED-CHANGES EXPLORE-05 #1 (schema, contract), #2 (mobile contract copy).
- **Not done:** nothing in scope. No pictures (no screen). The web still reads `popularSearches` as content titles (kept on purpose, V3).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
