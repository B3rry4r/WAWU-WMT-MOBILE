# INBOX-25 history

## Builder report, round 1 (19 Oct 2026, Sonnet builder, T2)

Backend `wmt/INBOX-25` `26fdf0d` from `wmt/MERGE-25` `223fe89`; mobile `wmt/INBOX-25` from `eb2ffa3b`.

Built: the removal's refund (`CommunityPassRemoval.decide`, in the removal's own transaction), the payout (`CommunityPassRefundService`, the hold refund's lease, ask-never-resend and one-new-try-per-confirmed-failure rules through `WALLET_PROVIDER`), the host's take-back (`EarningDeduction` applied by the daily move), the Hub quote route, the notification, migration `20261029090000_community_pass_removal_refund` with `rollback.sql`.

Tests (Nuvion stand-in stack, ports 7840 to 7847): `community-pass-removal-refund.contract.spec.ts` 12 of 12; 9 of the 12 fail with the refund decision switched off, the 3 that pass are the no-refund cases (0 unused days, leaving, guards). Touched specs on a fresh database: 8 suites, 134 tests. Protected suite on its own mock WAWU ID (port 7843): 251 of 253; the 2 red are `GET` and `POST /communities/:id/messages` widened by `videoUrl` and `voiceUrl` from MERGE-25's `20261027090000_community_message_media`.

Assertions changed in tests this task did not write, because R-71 reverses what they pinned: `community-pass-nuvion.contract.spec.ts` (three removal cases: the balance now includes the refund, and a pass ended by the removal means 403 until a new pass), `push-policy.spec.ts` (the closed list of kinds and of push-only gates gains `community_pass_refunded`).

Not done: no remove sheet is mounted (no board draws a member list or a remove entry, G-INBOX-25-1). A real Android phone (V10) not run. The mobile full check is the merge agent's.
