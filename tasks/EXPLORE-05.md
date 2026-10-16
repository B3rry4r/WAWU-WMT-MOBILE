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

As of 16 Oct 2026, round 3 (builder, Sonnet; the verifier of round 2 closed M1 and M2 and found the popular text rules only partly closed, a medium; round 3 replaces those rules with an allow-list).
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EXPLORE-05.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/ADS-01` (this branch contains it); API types regenerated from backend `wmt/EXPLORE-05` (649187a).
- **Branches:** wawu-backend `wmt/EXPLORE-05` `ba55a42` (round 2 `343e913`, round 1 `9e6b4bc`; backend main `b32f9c0` merged); mobile `wmt/EXPLORE-05` (the commit after `4d95eee` that carries this report) (contract unchanged this round, so the copy and the generated types are as they were; SHARED-CHANGES EXPLORE-05 #1 and #2). Migration `20261022240000_search_history` (stamp `20261022190000` until the batch 4 merge preparation of 16 Oct, which moved it after SCHOOLS-10's `20261022230000`; contents unchanged; one new table `SearchHistory`).
- **Merged and live:** nothing of this task.
- **What the app calls (new, additive):**
  - X5 Recent, Clear: `POST /search/recent` `{ q }` when the person submits a search (signed in; same text again moves to the top; the newest 20 are kept), `DELETE /search/recent` (Clear, answers `{ cleared }`), and `recentSearches` on `GET /search/suggestions?include=recent` (the caller's own, newest 10; `[]` signed out). **The app sends `include=recent`**; without it `recentSearches` is `[]`, as it always was for the web (the route is protected).
  - X5 People are searching: `GET /search/popular` (public; round 3 rule: an entry is the NAME of a public thing a signed-out visitor can find (a content title, a creator handle with a creator state, a community name, a category name) that at least 3 different accounts searched in the last 30 days (none of them an account whose deletion is scheduled), the searched text EQUALS the name once both are folded (NFKC, lower case, Cyrillic and Greek lookalikes as Latin, circled and keycap digits as digits, spaces collapsed), and the name is made only of Latin letters with their accents, spaces and `' & -` with at most 4 digits in all; the text shown is the name's own spelling, never a searcher's; the answer is kept 60 seconds in the Hub process; empty on a new install, so the section is not drawn, G-340). The app never reads `popularSearches` from `GET /search/suggestions`, which still gives the web the titles of the most viewed content.
  - X6, X9 Communities: `GET /search?include=communities` fills `communities` on `tab=all` and `tab=communities` (name contains `q`, any case, prefix first, then more members; same `memberCount` and `messagesToday` as `GET /communities`; a room hosted by someone blocked either way is not a result). **The app sends `include=communities`**; without it `communities` is `[]` on every tab, as on main (the route is protected). No viewer state on the row (G-341).
  - Ticks (X5, X6, X8, X9, X11): creator rows already carry `verification` (`creator` and `professional`, each `verified` and `expiresAt`, derived on the server from the expiry) in `creators` and `suggestedCreators`; the analysis row "no tick" was stale. A spec now pins both lists, a lapsed tick and both ticks together.
- **Decisions:** popular is read from `SearchHistory` itself, so Clear removes a person's text from it and no second count can outlive a Clear. Round 2 (lead rulings, 16 Oct 2026): the two new answers are opt-in by `include` so the website's answers do not change (diffed: 39 real website calls on main and the branch, same database, 0 differences); an account with a scheduled deletion is not counted (the `PushStoppedAccount` mark, which main and SETTINGS-06 both write at deletion and SETTINGS-06 removes at cancel; the rows stay until the purge); the privacy test by spelling (a list of forbidden forms) was tried in round 2 and the verifier found new forms past it, so round 3 turned it round: the allow-list above. Every figure is config with `PROVISIONAL(...)` (`src/search-response/search-history.config.ts`), unchanged; the owner list is unchanged too: SEARCH-RECENT-KEPT 20, SEARCH-RECENT-SHOWN 10, SEARCH-POPULAR-MIN-PEOPLE 3, SEARCH-POPULAR-DAYS 30, SEARCH-POPULAR-SHOWN 8. `SearchHistory` is in the account purge map and the data export.
- **Tests of main:** the two round-1 hunks in `search-response.contract.spec.ts` are put back (the file is byte-identical to main's, because `communities` is `[]` again without `include`). The round-1 spec `search-history.contract.spec.ts` (mine) now sends `include`, and its popular texts each name a public room.
- **Records:** this file's Builder report.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 6 new (a lookalike letter takes over a shown name, a ranking by people can be filled by 4 accounts, refresh cost grows with the data, a scheduled deletion still shows its handle, the contract summary of popular, private history of a deleted account) plus the 3 rows the branch already added (V1-4, V1-5, R3-1). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EXPLORE-05.md](history/EXPLORE-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
