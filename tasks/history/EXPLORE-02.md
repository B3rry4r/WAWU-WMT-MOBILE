# EXPLORE-02 · round history

Moved out of [tasks/EXPLORE-02.md](../EXPLORE-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Files (mobile): `src/features/search/{api,model,hooks,parts,SearchScreen}.ts*` (new), `src/app/search.tsx`, `src/app/creators.tsx`, `src/features/explore/{CategoriesScreen,ExploreBar,ExploreScreen,parts,follow}.ts*` (title and search props, the pill, See all, a looser `toggle` type), `src/features/home/{HomeScreen,TodayScreen,CreatorRail}.tsx`, `src/features/feed/FeedScreen.tsx` (optional entries), `src/app/(tabs)/{explore,index}.tsx` (wiring), `contract/` and `src/api/schema.generated.ts` (from backend `2d0d5d9`). Backend: `src/search-response/{search-people.service.ts,dto/search-people-query.dto.ts,search-response.controller.ts,search-response.module.ts}`, `contract/openapi.json`.
Checks: the 20 new mobile tests and the backend spec pass; the full mobile check is in the hand-back. Gaps filed: none new (G-341 stands). Shared-change rows: EXPLORE-02 #1 (contract copy), #2 (a third search field).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

