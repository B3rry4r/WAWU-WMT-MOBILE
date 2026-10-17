# TIER-07 verifier report (17 Oct 2026)

Backend `wmt/TIER-07` 493a276 on main a5e48fc; mobile 5e94116 (docs only). Verdict: **merge** (nothing medium or worse).

## Checks
| Check | Result | Evidence (scratchpad/tier-07-v/) |
|---|---|---|
| Migration on live-shaped rows (8 makers: 5 founding incl. 1 ended and 2 tied on createdAt, verify, plus, a retired tier id) | passed: numbers 1..5 oldest first, tie broken by user id, ended founder numbered, non-founders null, counter 5 | seed.sql, rollback.sql |
| Rollback from the file, then re-apply | passed: column, index, table gone, 8 rows intact; re-apply gives identical numbers and counter; running the file twice fails cleanly ("already exists"), as any Prisma migration | |
| Parallel grants: 40 founding persons x 3 replays of each ref + 10 verify + 5 rolled back, all at once | passed: 40 distinct numbers, contiguous, counter +40, rolled-back and verify persons have none, one pass per person, 0 rejections, 0 fetch/http/https/non-DB sockets inside the grant path (spies), 650 to 1270 ms for all | logs/attack-all.log, attack-a.log |
| One person, 12 parallel renewals with different refs | passed: one number, counter +1 | |
| Lifecycle: ended, Verify in between, Founding again, upgrade verify to founding, upgrade replay in parallel | passed: number kept throughout, shown only while a numbered tier runs (Verify badge has number null), counter moves once | |
| Rollback gives the number back (gap-free; the task's choice), next buyer gets it; deleted holder's number not reissued; counter row missing or set low repaired from MAX; negative counter refused | passed | |
| Real purchase route, 20 buyers x same Idempotency-Key twice at once, 3 s wallet provider | passed: 20 x 201 and 20 x 409, 20 distinct numbers, counter +20, a second purchase with a fresh key refused (409), sweeps change nothing; another person's GET /me/tier max 362 ms, p95 101 ms (35 probes) | logs/attack-http.log |
| Lost provider answer (3 buyers) plus a failing points write after the number was taken | passed: first sweep leaves counter untouched and no tier; after recovery consecutive numbers, one purchase each, counter +3 | logs/attack-lost.log |
| 40 parallel grants against the same DB while the Hub served another person's GET /users/me and /profile-fields | passed: max 39 ms over 4812 requests | |
| Transaction body (grantOnce, grant, upgrade, waitlist claim) read for provider calls | passed: database only; refunds and payments run outside it | |
| Badge only while active or ending, on the app routes | passed on a live Hub: founding active #7001, verify with 3 days left (ending) shown, ended null, plus shown as Verify Plus; profile-fields (visitor and own), directory list | probe.py |
| Before/after probe, main code vs branch code on one database: 130 requests (every parameterless GET of the protected registry, public-profile, users/public, /creators, /professionals, /professionals/{id}, /search, /me/tier, as two users, with and without tiers) | passed: the only key-path differences are `badge` on `/users/{id}/profile-fields`, `/users/me/profile-fields`, `/professionals/directory`; none on /users/me, public-profile, /professionals, /professionals/{id}, /creators, /me/tier | |
| CI on 493a276 (gh check-runs) | contract, shards 1 to 3, netns, deploy-test-in-sync, baseline, Protected route suite all success; Executable gates failure = the same 5 FAIL lines as main a5e48fc (pre-existing) | logs/gates-*.log |
| contract:build twice | passed: run1 == run2 == committed file; vs main only the 13 expected changes: `PersonBadgeView` added, nullable `badge` (allOf + nullable) and its `required` entry on CreatorCard, ExploreCreatorCard, ProfessionalCard, ProfessionalDirectoryEntry, ProfessionalDirectoryProfile, ProfileFieldsView; no other schema changed type | |
| Builder specs re-run locally (tier-badge, contract-shape, tier-grant, plans-contract-shape) | 33 of 33 passed | |

## Findings
1. low. Merge: `src/plans/tier-grant.service.ts` conflicts with `wmt/TIER-06` (361df74; `git merge-tree` reports a content conflict; `schema.prisma` and `openapi.json` auto-merge). Keep the two `ensureBadgeNumber` calls BEFORE the points write (TIER-03 round 2 spec pins points last), then `npm run contract:build`. Not tested (TIER-06 is building).
2. low. Deploy order: a Founding Maker granted by the OLD code between the migration and the new code gets no number until their next grant, so `badge.number` is null while the badge shows. The type allows null; the app must draw "Founding Maker" without a number then. Deploy migration and code together.
3. info (pre-existing, not a defect of this task). `grant()` on a person whose Verify/Plus tier still runs extends that tier whichever tier was asked (waitlist claim), so no Founding number is given; the purchase route refuses that case.

## Not tested
`/explore/creators`, `/explore/featured-creators`, `/feed/entries` and `/professionals/directory/{id}` with live rows (the probe database had no content pieces); they rest on the builder's `tier-badge-views.contract.spec.ts` and green CI shards. TIER-06 merge not tested (as asked).

## Cleanup
Stack tier_07 down (Hub 12699, mock 12685 stopped, ports 7470 to 7477 closed), extra main-code Hub on 7471 (pid 15261) killed, databases tier_07_wawu_hub_test and tier_07_mig_test dropped, worktrees v-tier-07-be and v-tier-07-main removed. My three attack specs lived only in the removed worktree (copies are not kept; the findings above are the record). Nothing pushed.
