# EXPLORE-06 · round history

Moved out of [tasks/EXPLORE-06.md](../EXPLORE-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 17 Oct 2026 (Sonnet). Backend `wmt/EXPLORE-06` `24e0c48`; mobile `wmt/EXPLORE-06` (docs only).
- **Files (backend):** `src/search-response/search-history.config.ts` (`popularCommunityMinMembers()`, key, env name, default 10), `search-history.service.ts` (the community branch of the one popular query counts `joined` memberships), new `tests/popular-members.ts` and `tests/search-popular-members.contract.spec.ts`, one line each in `tests/search-history`, `search-popular-allowlist`, `search-popular-privacy` specs. No schema, route, DTO or contract change.
- **Files (mobile):** `SHARED-CHANGES.md` (EXPLORE-06 #1), `BACKEND_GAPS.md` (G-340), this file, `tasks/history/EXPLORE-06.md`, `docs/LOG.md`, `docs/PROGRESS.md`, `tasks/INDEX.md`.
- **Check 1 (9 members not listed, 10 listed):** new spec: 60 people searched a room with 9 members, absent; one more joined member, present, and `GET /search?include=communities` shows `memberCount` 9 then 10. Also: 5 waiting requests do not count; 0 members absent; 30 members present; two rooms with one name, the one with enough members is the name.
- **Check 2 (the setting changes the threshold):** met as far as main allows, see Current state. Spec: `POPULAR_COMMUNITY_MIN_MEMBERS` 5 lists a room of 6, 7 does not, `0`, `-3`, `2.5`, `ten`, `1e3`, empty and a huge number all keep 10.
- **Other names unchanged:** spec: a content title, a creator handle and a category are listed with no room at all; a title named like a 9-member room is listed.
- **Website unchanged:** own stack `explore_06`, same seed on the old build (backend main `a5e48fc`) and the new: 69 calls, `cmp` identical. Popular before: 8 names; after: 5 (three rooms under 10 left).
- **Mobile check (local, once, at the end):** typecheck, lint, 184 suites 3243 tests, gates (10 run, 0 fail, 5 warn, 0 accepted), tasks: EXIT 0.
- **Specs run (local):** `src/search-response` 7 suites, 235 of 235 (the new spec 13; the three edited specs and main's `search-response.contract.spec.ts` unchanged and passing). `npx tsc --noEmit` EXIT 0; eslint and prettier on the 7 touched files EXIT 0.
- **CI on backend (head `2915f00`, code `24e0c48`):** Branch checks run 38996297861 passed (3 suite shards, netns, contract, deploy-test-in-sync); Protected routes (V3) run 38996297709 passed; Gates run 38996297750 failed with the same 5 FAIL lines as main (admin notifications, `notification-event.ts`, `flutterwave-wallet.gateway.ts`, `content-piece.service.ts`), none in search code. The first push (`24e0c48`, runs 38995689552 Protected routes passed, 38995689614 Gates same 5 lines, 38995689618 Branch checks) had one red: shard 1, `src/plans/tests/publishing-gate.contract.spec.ts` ("cannot be sent past the limit by two publishes at once": one of four parallel publishes answered 429 instead of 402, twice); it passes 79 of 79 on this branch locally, nothing here touches `src/plans`, and the empty commit `2915f00` re-ran it green.
- **Gaps and shared changes:** SHARED-CHANGES EXPLORE-06 #1; G-340 now says 10 members.
- **Not done:** the admin registry (TIER-06's, not on main). No pictures (no screen).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

