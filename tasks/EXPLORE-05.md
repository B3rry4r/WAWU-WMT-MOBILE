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

As of 16 Oct 2026, round 2 (builder, Sonnet; the verifier of round 1 reported three medium findings, all fixed here).
- **Status:** verifying. Backend only: this task has no screen (artboards: []), so there are no pictures; the screens are EXPLORE-02 (X5, X6) and EXPLORE-04 (X8, X9, X11).
- **Branches:** wawu-backend `wmt/EXPLORE-05` `343e913` (round 1 `9e6b4bc`; backend main `3797fb2` merged); mobile `wmt/EXPLORE-05` (the commit after `8c93c8f` that carries this report) (contract copied from the backend branch, SHARED-CHANGES EXPLORE-05 #1 and #2). Migration `20261022190000_search_history` (one new table `SearchHistory`; unchanged this round, no new migration; the lead renames the stamp at merge if needed).
- **Merged and live:** nothing of this task.
- **What the app calls (new, additive):**
  - X5 Recent, Clear: `POST /search/recent` `{ q }` when the person submits a search (signed in; same text again moves to the top; the newest 20 are kept), `DELETE /search/recent` (Clear, answers `{ cleared }`), and `recentSearches` on `GET /search/suggestions?include=recent` (the caller's own, newest 10; `[]` signed out). **The app sends `include=recent`**; without it `recentSearches` is `[]`, as it always was for the web (the route is protected).
  - X5 People are searching: `GET /search/popular` (public; a search appears when at least 3 different accounts made it in the last 30 days, none of them an account whose deletion is scheduled, the text is not a phone number, an email address, a link or text with an invisible character, and `GET /search` finds something for a signed-out visitor with it; empty on a new install, so the section is not drawn, G-340). The app never reads `popularSearches` from `GET /search/suggestions`, which still gives the web the titles of the most viewed content.
  - X6, X9 Communities: `GET /search?include=communities` fills `communities` on `tab=all` and `tab=communities` (name contains `q`, any case, prefix first, then more members; same `memberCount` and `messagesToday` as `GET /communities`; a room hosted by someone blocked either way is not a result). **The app sends `include=communities`**; without it `communities` is `[]` on every tab, as on main (the route is protected). No viewer state on the row (G-341).
  - Ticks (X5, X6, X8, X9, X11): creator rows already carry `verification` (`creator` and `professional`, each `verified` and `expiresAt`, derived on the server from the expiry) in `creators` and `suggestedCreators`; the analysis row "no tick" was stale. A spec now pins both lists, a lapsed tick and both ticks together.
- **Decisions:** popular is read from `SearchHistory` itself, so Clear removes a person's text from it and no second count can outlive a Clear. Round 2 (lead rulings, 16 Oct 2026): the two new answers are opt-in by `include` so the website's answers do not change (diffed: 39 real website calls on main and the branch, same database, 0 differences); an account with a scheduled deletion is not counted (the `PushStoppedAccount` mark, which main and SETTINGS-06 both write at deletion and SETTINGS-06 removes at cancel; the rows stay until the purge); text is normalised (NFKC, other digits to 0 to 9, lower case) before the privacy test; a popular text must find a public result. Every figure is config with `PROVISIONAL(...)` (`src/search-response/search-history.config.ts`), unchanged; the owner list is unchanged too: SEARCH-RECENT-KEPT 20, SEARCH-RECENT-SHOWN 10, SEARCH-POPULAR-MIN-PEOPLE 3, SEARCH-POPULAR-DAYS 30, SEARCH-POPULAR-SHOWN 8. `SearchHistory` is in the account purge map and the data export.
- **Tests of main:** the two round-1 hunks in `search-response.contract.spec.ts` are put back (the file is byte-identical to main's, because `communities` is `[]` again without `include`). The round-1 spec `search-history.contract.spec.ts` (mine) now sends `include`, and its popular texts each name a public room.
- **Open findings:** none known. Lows of round 1 that are not in this round are in `tasks/SWEEP-APP.md` (rows EXPLORE-05 V1-4 and V1-5). Not done: pictures (no screen here); no screen of the app calls these routes yet, so no hook sends `include` yet (EXPLORE-02 and EXPLORE-04 say they must).
- **Next:** a verifier runs V1 V2 V3 V4 V9 again on the stack (`scripts/dev/stack.sh up`, source `env.sh`, `npm run test:contract -- src/search-response`), repeats the verifier's 39 website calls against main and the branch, and the protected route suite.
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

### Builder report, round 2

Builder, 16 Oct 2026 (Sonnet). Backend `wmt/EXPLORE-05` `343e913` (code `83df312`, then the registry put back; round 1 `9e6b4bc`; backend main `3797fb2` merged); mobile `wmt/EXPLORE-05` (the commit after `8c93c8f` that carries this report). No new migration (`20261022190000_search_history` stays).
- **Finding 1 (medium, protected routes). Before:** `GET /search` filled `communities` for any query that matched a room name and `GET /search/suggestions` filled the caller's `recentSearches`; 27 of the verifier's 39 website calls differed from main; the registry probe note said `communities` was `[]` on main for every query and SHARED-CHANGES #1 said the two answers were unchanged. **After:** both are opt-in. `GET /search?include=communities` fills `communities` (tab `all` and `communities`), `GET /search/suggestions?include=recent` fills `recentSearches`; without `include` the answers are main's. An unknown `include` is 400. The parameter is in the contract (`contract/openapi.json`, +28 -1: two `include` query parameters and one summary) and in the mobile types (`include?: "communities"`, `include?: "recent"`). **The 39 website calls (3 callers x 10 queries, suggestions, closest), run on main `3797fb2` and on the branch over ONE database (data copied, the 11 tables search reads compared by md5 or counted): 0 differences, 38,616 bytes each, `cmp` identical; identical again with recent searches and 6 matching rooms present.** With `include`: 6 rooms and `["Founders"]`. SHARED-CHANGES EXPLORE-05 #1 and #2 say exactly this. The registry probe notes are NOT changed: they sit under the protected route lock and an edit is a relock (the owner's decision); CI refused my edit ("the registry still matches its lock") and it was put back. The replacement text is in SHARED-CHANGES #1; with the opt-in the old note holds for every request without `include`, only its parenthetical is out of date. The two round-1 hunks in `search-response.contract.spec.ts` are put back (the file is byte-identical to main's, and passes). No app hook calls these routes yet; EXPLORE-02 and EXPLORE-04 say theirs must send `include`.
- **Finding 2 (medium, deleted accounts). Before:** a text stayed in popular up to 30 days after one of its three accounts called `DELETE /account`. **After:** popular does not count an account with a scheduled deletion, and does not show its spelling. Read on main: `DELETE /account` writes `PushStoppedAccount` (`PushTokenService.stopAccount`) and nothing else that says "deleted" (the purge, `AccountPurgeService`, has no caller outside tests). Read on `wmt/SETTINGS-06` (not edited): it adds `AccountDeletion` (status `freezing`, `scheduled`, `purging`, `cancelled`, `purged`), and after the row is `scheduled` it calls `stopAccount` too; its cancel calls `resumeAccount` (removes the mark); its purge deletes the mark with the account's data. So the one filter, `NOT EXISTS (PushStoppedAccount)` in the popular query, is right on both, inside the search code (no change to account code, no new table read). Rows stay until the purge. Spec: the real `DELETE /account` (gateway stubbed) after plain and basic searched with a third account: the text leaves popular at once; a text with three other people stays and shows their spelling; removing the mark (a cancel) brings it back.
- **Finding 3 (medium, privacy of popular). Before:** 0801.234.5678, (0801) 234 5678, 0801/234/5678, 0801_234_5678, Arabic digits, a zero-width character in the digits, chidinma(at)gmail.com, "chidinma at gmail dot com", chidinma[at]gmail[dot]com, a URL, any name, any sentence reached the public list from three accounts. **After:** `popular-search-text.ts` normalises (NFKC, every Unicode digit to 0 to 9, lower case) and refuses: any control or format character (zero-width space and joiner, direction marks, word joiner, BOM inside, soft hyphen, fillers); an email in any spelling (`@` also full-width, `(at)`, `[at]`, `{at}`, `<at>`, `(dot)`, or the word at or dot between two words); a link or domain (http, https, ftp, www, `://`, name.tld); 7 or more digits in a row once `. / _ ( ) -` and spaces are taken out. And the search must find something: a signed-out `GET /search` result (content, creator with a creator state, or a community, the same three clauses in `search-matchers.ts` that `GET /search` reads), so a sentence, a private person's name (accents too), hidden content and a creator with no state never show. Work is bounded (pages of 32, 4 pages, 40 questions to the database per call). One decision written in a spec: "afrobeats at home" is refused (a word, at, a word reads as an email spelled out) while "at home" is kept. Specs: 21 phone forms, 10 email forms, 6 links, 7 invisible forms, 13 ordinary searches kept, each form again through the database with a room named as the text (so only the rules refuse it), five texts with no public result, a good search behind 40 refused ones on a later page, and `hasPublicResult` equal to what `GET /search` answers for the same texts. Normal searches listed: "Afrobeats" (content), a creator's handle, a community name. The 3-account threshold (PROVISIONAL SEARCH-POPULAR-MIN-PEOPLE) is unchanged and stays on the owner list; the verifier's point that one person can open three accounts is the owner's to rule.
- **Finding 4 (low, wrong sentence). Before:** a number, array, null or missing `q` on `POST /search/recent` said "q must be shorter than or equal to 100 characters". **After:** missing or null says "q is required"; a number, array, object or boolean says "q must be text"; an empty text and a long one say what they said. Spec in the new file.
- **Sweep (not fixed here, by ruling):** the recent-cap race under parallel POSTs and blocked accounts counted in the global popular list are rows V1-4 and V1-5 in `tasks/SWEEP-APP.md` (report path in the rows). The five PROVISIONAL figures go to the owner list unchanged.
- **Checks (backend, own stack `explore_05`, seeded like the verifier's; full logs in the builder's scratch folder):**
  - `npx tsc --noEmit` EXIT 0; eslint with `--no-fix` on the 10 touched files EXIT 0 (the main-owned `search-response.contract.spec.ts` is untouched, so not linted).
  - `npm run test:contract -- src/search-response src/account-purge src/data-export-request/tests/data-export-map` EXIT 0: 6 suites, 168 of 168 (new spec 77 tests; the round-1 spec 20; main's two search specs unchanged and passing).
  - `scripts/protected-routes/run.sh --fresh HEAD` (code at `83df312`, suite and lock from main `3797fb2`): 216 of 244 passed, 28 failed (events, admin events, professionals, learn enrol: "Only verified accounts can host an event" and the fixtures that follow). The same 28 fail on `--fresh origin/main` (diffed: identical sets). `GET /search`, `GET /search/suggestions` and `GET /search/closest` pass against main's lock. None of the 28 is a search route.
  - `npm run contract:build` twice: byte-identical (`cmp`); the mobile copy has the same md5 (`dec4ed46...`).
  - `scripts/protected-routes/lock-diff.py origin/main HEAD` on the final branch: no entry changed (the registry is main's).
  - CI on `343e913` (checked at https://github.com/B3rry4r/WAWU-Backend/commit/343e913e2c55973f9f3863072329d8a2553683c6): 3 suite shards, netns, contract, deploy-test-in-sync, Protected route suite against the base's checker and lock, Baseline: success. Executable gates: failure, 18 FAIL lines, identical text to main `3797fb2` (also 18), none in search code. On the earlier push `83df312` two things failed and are explained: shard 1 refused my registry edit ("the registry still matches its lock"; put back in `343e913`), and shard 3 failed `wallet-transfer.contract.spec.ts` (WALLET-07) because it greps the log for "1397" and a random reference `wawu-send-e1397f65-...` held it (a flake in that test, nothing to do with search; it passed on `343e913`).
- **Checks (mobile):** `(npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks; echo "EXIT $?")` EXIT 0 (155 suites, 2832 tests, 10 gates 0 fail 5 warn 0 accepted; the change is docs and generated types, no mobile test touched); `npm run tasks` again after the last doc edit EXIT 0; `contract/openapi.json` md5 equals the backend branch's.
- **NOT RUN:** the round 2 specs against the `wmt/SETTINGS-06` branch (not merged; read, not run: its account code was not edited); pictures (no screen); a pull request (not opened by rule); the dashboard's routes (none touched).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
