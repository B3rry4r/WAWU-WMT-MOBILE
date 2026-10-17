---
id: EXPLORE-06
title: Popular communities need 10 members
owner: YOU
area: EXPLORE
order: 256
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [EXPLORE-05]
decisions: [R-57]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EXPLORE-06 · Popular communities need 10 members

## Current state

As of 17 Oct 2026, round 1 (builder, Sonnet).
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EXPLORE-06.md`): verdict merge, nothing medium or worse; three lows are in `tasks/SWEEP-APP.md`. Stacked in batch 7 (backend and mobile `wmt/MERGE-7`).
- **Branches:** wawu-backend `wmt/EXPLORE-06` `24e0c48` (head `2915f00`, code `24e0c48`; from backend main `a5e48fc`, EXPLORE-05 live there; CI: Branch checks run 38996297861 and Protected routes run 38996297709 passed, Gates run 38996297750 has main's same 5 FAIL lines); mobile `wmt/EXPLORE-06` (docs only; the commit that carries this report). No migration (the stamp `20261024120000` is not used), no route, no contract change.
- **Built:** `GET /search/popular` names a community only when it has `popular_community_min_members` or more `joined` members (launch value 10, R-57). The count is the one the room's row shows as `memberCount` (joined, the host not counted; a person waiting for approval is not a member). A content title, a creator handle and a category are not held to it. If a content title has the same name as a room under the threshold, the name still shows (as the title).
- **The setting:** TIER-06's registry is NOT on backend main (its branch `wmt/TIER-06` is `361df74`, unmerged), so the figure is `popularCommunityMinMembers()` in `src/search-response/search-history.config.ts`: the environment variable `POPULAR_COMMUNITY_MIN_MEMBERS`, read on every refresh of the 60 s answer, default 10; a value that is not a whole number of 1 or more keeps 10. SHARED-CHANGES EXPLORE-06 #1 says it moves into the registry key `popular_community_min_members` when TIER-06 is on main (change the body of that one function, drop the variable).
- **Capability check 2 is half met:** the number is a setting and a changed value shows within 60 s, but "without a deploy" needs the admin registry; until TIER-06 merges, a change is an environment edit and a restart.
- **Tests:** new `search-popular-members.contract.spec.ts` (9 then 10 members, pending requests, no members, many members, the other names, a same-named title, two rooms of one name, the setting and its bad values). The three EXPLORE-05 popular specs got one line each so their rooms have 10 members (helper `tests/popular-members.ts`); R-57 changes what they assert.
- **The website:** 69 calls (the website's `GET /search`, `/search/suggestions`, `/search/closest` for three callers, plus the app's `include=` calls and `GET /communities`) on the old build and the new build over the same seed: byte-identical (32,695 bytes). Only `GET /search/popular` differs, as ruled (the 9-member rooms and the empty room left; the 10 and the 14 stayed).
- **Records:** this file's history, `SHARED-CHANGES.md` EXPLORE-06 #1, `BACKEND_GAPS.md` G-340 (one clause), `docs/LOG.md`.
- **Open findings:** none yet.
- **Next:** the lead merges it with batch 7 (backend `wmt/EXPLORE-06` is on top of `wmt/EXPLORE-05`, already on main).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-57 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

"People are searching" and any popular list name a community only once it has 10 or more members (R-57).

## Scope

- `GET /search/popular` (EXPLORE-05, G-340) counts a community name only when the community has at least 10 members. The number is a setting (`popular_community_min_members`, launch value 10).
- Other popular names (content titles, creator handles, categories) are unchanged.

## Capability checks

- [ ] A community with 9 members is not listed as popular however many people searched it; at 10 members it is.
- [ ] The setting changes the threshold without a deploy.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EXPLORE-06.md](history/EXPLORE-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
