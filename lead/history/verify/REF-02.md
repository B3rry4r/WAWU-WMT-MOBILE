# REF-02 verifier report (backend wmt/REF-02 1165e79 on wmt/MERGE-6 fbf391f; mobile d52ed61 docs only)

Verdict: MERGE (nothing medium or worse). 4 low findings, 3 pre-existing notes.

## Checks (counts)
- CI on 1165e79: suite shards 1-3, contract, netns, deploy-test-in-sync, baseline, gates, protected-route suite: all success.
- Local: tsc 0; gates PASSED; builder suite 36/36 (referrals.contract 28 + ladder 8); eslint clean on src/referrals and src/plans/purchases.
- Migration 20261024140000_referral_points on a DB built from the 151 earlier migrations with 200 MakerPurchase and 51 ReferralCode rows:
  up 0.25 s, table-count hash of every other table unchanged; documented rollback (with rows in the four tables) clean; re-apply clean;
  REF-01 tables untouched; `prisma migrate diff` shows no REF-02 drift.
- Database refusals probed by hand (13 cases): pending figures change, granted->anything, settledAt rewrite, second reward, self-invite, second claim,
  milestone twice, FK under a reward, bad code shape: all refused; pending->granted and delete allowed.
- My own attack spec (7 tests, 5 first run + 2 after fixing my own bugs): see below.
- Real Hub (AppModule, port 7530): GET/POST routes mount, 401 without token, own code 400, claim 200 then same code 200, /me/points and /me/tier not shadowed,
  /join lookup answers 404 as before; /users/me 30 to 65 ms while 60 referral calls ran (429 from the global throttle on part of them).

## Attacks
- One buyer, 10 parallel tier buys over two tiers + 10 hook calls + catch-up: 1 reward, on the earliest paid purchase; (route lets 1 of 10 through, rest 409).
- 12 referred persons, 4 parallel release + 2 sweeps + catch-up x3, then again: 12 reward lots + milestone 5 and 10 once, total points exact, view agrees.
- Two processes: 3 referrers x 11 due rewards, my process looped 1,566 tight rounds across the minute boundary while the running Hub's cron job
  settled 23 of the 33 (Hub log: "23 granted, 0 failed"): every reward granted once, 11 reward lots + 2 milestone lots each, no duplicate sourceRef.
- Cancel finality: cancelled never paid (job at +8 and +30 days), second cancel false, cancel after grant false, DB refuses reviving; a refund hold
  written after the hold ended but before the job cancels it.
- Claim: 15 input shapes (undefined, null, '', 5, array, object, 81 chars, ../, %00, SQL text, bare link) all 400/404, extra field 400, no body 400, text/plain 400,
  bad bearer 401; own code in 5 forms 400; A uses B's code then B uses A's: 409 referral_loop; 20 crossed claims: one row; second code 409; profile aged
  7d-30s 200, 7d+30s 409 (window); after a paid tier 409 referral_not_new; a /join code 404; no em-dash in any message.
- Parallel (3 s provider): another person's /me/referrals, /me/points, /me/tier 22 to 38 ms (limit 1 s) with 20 buys + 20 views/claims in flight.
- Purge: a referred person's claim and reward go, the referrer's points stay; purging the referrer removes rewards, claims, milestones and code. Export:
  both new sections hold no other person's id.
- Catch-up query at 300k referrals: 35 ms.

## Findings (all low; go to the TIER/REF sweep)
1. low, src/referrals/referrals.service.ts claim(), `profile !== null && Date.now() > ...`: a person with no UserProfile row is never past the claim window.
   Repro: token for an id with no profile, POST claim: 200 at any age. (Accepted default is "from the profile's creation"; the null branch is the gap.)
2. low, src/account-purge/account-data-map.ts (ReferralReward referredWawuUserId OWNED): deleting a referred account deletes their granted reward, so the
   referrer's verified/level/multiplier drop (brought 2 -> 1, verified 2 -> 1) while the points and milestones stay. Repro: purge a referred kid with a granted reward.
3. low, referral-reward.service.ts onTierPaid: a reward made cancelled because the referrer held no tier at that moment is final; a tier bought later does not revive it
   (matches "only a referrer with an active tier earns"; owner may want it said in the app copy, REF-03).
4. low, referral-reward.service.ts cancelReasonAtEnd: the referrer's tier is judged at `availableAt` from the single MakerTier row; if the job was down past
   the hold end and the referrer re-bought after a lapse, the row's activeFrom is later and a valid reward is cancelled. Not reproduced; code reading only.

## Pre-existing (also on MERGE-6, not REF-02)
- data-export.contract.spec fails on a stack DB (fixture Comment_contentId_fkey); CI green.
- eslint (no-fix) reports errors in untouched files: account-data-map.spec.ts, data-export-request.controller.ts, data-export-request.contract.spec.ts.
- `prisma migrate diff` shows ContentPiece "specializations" index in the DB but not in the schema; MoneyCheckService logs an error on a stack with no Fintava.

## Left running: nothing (stack ref_02 down, ports 7530-7537 closed, DBs dropped, worktrees v-ref-02-* removed). Attack specs kept in
/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ref-02-v/ (v-ref02-attack.spec.ts, v-ref02-realhub.spec.ts); logs in ref-02-v/logs/.
