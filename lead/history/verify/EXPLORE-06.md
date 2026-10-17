# EXPLORE-06 verifier report (17 Oct 2026, Sonnet verifier)

Verdict: merge (nothing medium or worse). Backend wmt/EXPLORE-06 2915f00 (code 24e0c48) on main a5e48fc; mobile 9de1a4e (docs).
Evidence folder: /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/explore-06-v/ (logs/, probe-main/, probe-new/, seed.sql, probe.sh, flow.py, flow2.py).

## Passes
| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | 8 search-response suites, 244 of 244 (builder's 7 suites 235 + my 9 attack tests), seeded like CI; tsc, eslint, prettier on the 7 touched files EXIT 0 |
| V2 | passed | 3 mutants killed by the builder's spec (`>=` to `>`, drop `status='joined'`, constant 1); logs/mut-*.log |
| V3 | passed (CI) | Protected route suite success on 24e0c48 and 2915f00; website probe byte-identical (below) |
| V4 | passed | attacks below |
| V9 | passed | real HTTP flow on stack explore_06 (join, leave, request, approve, remove) |

## Checks with counts
- Before/after probe on main a5e48fc and the branch, same SQL seed (11 rooms, 12 names): 81 calls (GET /search with tab and include=communities, /search/closest, /search/suggestions, with and without include=recent, 14 texts; 73 x 200, 8 x 400 for non-uuid ids), with a Bearer token: `diff -rq` identical, 15,630 bytes each.
- GET /search/popular: main 8 names (cap): Lagos Creators 9, Abuja Makers 10, Kano Beats 11, Ibadan Empty 0, Waiting Room 5+6 pending, Split Name 5+5, Afrobeats Night, Secret Society (private 10). Branch 6 names: Abuja Makers, Kano Beats, Afrobeats Night (title), Secret Society, Highlife Vibes (category), adaeze (handle). Rooms at 9 (open and private), 0, 5+6 pending, two rooms of one name at 5+5 are out. 10 and 11 in.
- Real flows (61 s apart): open room 8 to 9 (absent), pro joins 10 (listed after the cache), pro leaves 9 (still listed inside 60 s, gone after). Private room 9 + 1 pending (absent), host approves 10 (listed), host removes 9 (gone). Stale at most 60 s each way, as EXPLORE-05 designed.
- Env values, 24 tried (route 200 for all): '', ' ', 0, -1, 2.5, abc, 1e3, 0x10, +5, Arabic-Indic digits, '10 ', 010, 1_0, Infinity, NaN, '10\n', 99999999999999999999 keep 10; 1 and 2 lower it (9 and 2 member rooms listed); 13, 3000000000, 2147483647, 2147483648, 9007199254740991 raise it (no 500, nothing listed).
- Same-name rooms 5+5 and 9+9 do not add up; "Vatk Fold Room" 9 plus "VATK   FOLD room" 10: the 10-member spelling shows. A removed room (cascade) leaves after the cache. A room renamed after it was popular follows the new name; a 9-member room renamed to a live content title still shows as the title (as ruled). 23 of 25 searchers marked deleted: a 15-member room stays out (EXPLORE-05 rule holds). A big room named "Vatk 12345 Room" or "Vatk.dots" stays out (character rule holds).
- Gates job: 5 FAIL lines (4 deferrals, 1 fork), 6 hardcoded warn, 113 provisional warn: identical to main's run, none new in search code. Main's Executable gates job is red too (pre-existing, GATES-02).
- Three edited EXPLORE-05 specs: one `joinMembers(...)` line each, in the rooms' creation. Follows from R-57, weakens nothing: every "not shown" assertion in them rests on text, character rule, deletion or count of people, none on a room having no members.

## Findings (none medium or worse)
1. low, `src/search-response/search-history.service.ts` (the community branch of `names`): the member count runs for every room with a showable name, searched or not. On 20,000 rooms and 200,000 joined rows one refresh takes 1.0 to 1.4 s against 0.4 s on main (5 runs each, same data). It runs at most once a minute per Hub process, but the first caller after expiry waits for it. Fix for the sweep: count only the rooms whose folded name matches a searched text (join to `keys` first). Repro: insert 20k Community and 200k CommunityMembership rows, time `SearchHistoryService.popular()` after `resetPopularCache()`.
2. low, `.env.example` / README: `POPULAR_COMMUNITY_MIN_MEMBERS` is documented only in the code comment and the task file. Capability check 2 ("without a deploy") is half met: an environment edit and a restart until TIER-06's registry merges (lead ruling: accepted; SHARED-CHANGES EXPLORE-06 #1 moves it). Add the variable to `.env.example` or the registry move covers it.
3. low, unclear (informational): members whose accounts are scheduled for deletion still count toward the 10 until the purge removes their rows (the room's own `memberCount` shows them too, so the two agree). Room with 10 members, 2 of them stopped accounts: listed. Only worth a ruling if the owner wants "members" to exclude people leaving.

Pre-existing, not this task: CI shard 1 `publishing-gate.contract.spec.ts` flake on the first push (429 for 402 under parallel publishes) re-ran green on 2915f00; nothing in src/plans changed.

## Clean-up
Stack explore_06 down (ports 7500-7507 closed, database dropped), worktrees v-explore-06-new and v-explore-06-main removed, my untracked attack and perf specs deleted, no process of mine left, nothing pushed, no real provider called.
