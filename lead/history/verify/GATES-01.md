# GATES-01 verifier report (backend cf5038a on main 3797fb2, mobile e30b210)

Verdict: merge. Nothing medium or worse.

1. Guard fold: the 5 old copies are logically identical to the new src/common/guards/creator-account.guard.ts (same
   findUnique on UserProfile, same accountType check, same 403 text). The other 19 src files change one import line each;
   no decorator, guard order or route moved. Live differential: 56 probes (8 guarded routes x 7 identities: signed out,
   garbage token, buyer, creator, no-profile/deleted, banned-claim buyer and creator) against a Hub built from main and one
   from the branch: status and body identical on all 56. Mobile SHARED-CHANGES.md has row "GATES-01 #1" (+1 line only).
2. Baseline: 108 -> 119 entries, 0 removed, 0 changed, 11 added (9 forks Flutterwave types/adapters, 1 forks FlwEnvelope,
   1 fake_data wallet.module.ts:7), all owner "owner-approved 16 Oct 2026 (after-launch Flutterwave removal)", all with an
   R-1 reason, no em-dash. git diff --stat vs main: baseline.json + src only. No gate script, no spec changed.
   check_baseline.py EXIT 0.
3. run.py: main 16 fail -> branch 4 fail, all deferrals (the 12 others = 1 folded guard + 11 accepted). Judgement:
   admin-notifications.controller.ts:40 "belongs to the role..." is prose about who may dispatch (false positive);
   compose-campaign.dto.ts:44 "nobody reads the end of it anyway" is the reason for a 70-char limit (false positive);
   notification-event.ts:496 "does NOT say anything in the future tense" explains a deliberate omission, not a deferral
   (looks like one; nothing is promised); flutterwave-wallet.gateway.ts:72 "belongs to the name" is the doc of
   resolveAccount (false positive). All four are owner's call to baseline or reword.
4. tsc EXIT 0. eslint on changed files: 2 errors (creator-no-response-tracker.controller.ts:24 unused _query,
   direct-message.module.ts:58 prettier), identical on main (pre-existing). Contract specs touching the guard (8 files,
   187 tests): 186 pass, 1 fails (community-rooms "a member sees the last message", sender name "" vs host name), same
   failure on main (pre-existing, local mock-id name). Protected suite (run.sh cf5038a against origin/main lock):
   244 of 244 pass (a first run with the stack's mock ID gave 28 failures in verification/events/professionals routes,
   an environment effect: they vanish when the suite starts its own mock ID).
   CI on cf5038a: all green except Executable gates (the 4 deferrals) and suite shard 1 (nuvion-documents tmpdir listing,
   a runner /tmp flake in a file this branch does not touch).
Low: baseline keeps 2 stale entries pointing at the deleted community guard file (b7bffa59d00f3f1c forks CreatorAccountGuard,
   cbc3a51cae99f054 deferral at creator-account-guard.ts:21). Harmless (check_baseline passes); the brief says exactly 11 added.
Stack gates_01 down, ports 7370-7377 closed, database dropped, worktrees removed. Nothing pushed.
