---
id: INBOX-25
title: A removed member gets the unused pass days back
owner: YOU
area: INBOX
order: 355
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [INBOX-14, INBOX-24]
decisions: [R-71, R-63, R-19, R-39, R-55, R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-25 · A removed member gets the unused pass days back

## Current state

As of 19 Oct 2026, verifying. Builder (Sonnet, T2): backend `wmt/INBOX-25` `26fdf0d` and mobile `wmt/INBOX-25`, both from `wmt/MERGE-25` (`223fe89`, `eb2ffa3b`).
- **Where it was:** `DELETE /communities/{id}/members/{userWawuId}` (`CommunityService.removeMember`) moved a joined member of a pass room to pending and gave nothing back (G-INBOX-24-3, Q-43, R-71).
- **Lead defaults used:** refund = floor(price paid x whole unused days / pass days); a started day counts as used; pass days are the pass's own start to end; "price paid" is the pass price (the provider charge and WAWU fee on the purchase are not refunded). Several passes are summed, each floored.
- **Money path:** the removal and the decision are one transaction; each pass paid back is marked (`CommunityPass.refundId`) and ended that moment, so one removal is one refund (double tap, two servers, a retry). `CommunityPassRefund` is paid at once from WAWU's merchant account to the member's wallet through `WALLET_PROVIDER` under `wawu-pref-<id>`: lease, ask-never-resend, one new try per confirmed failure under a new reference, review past the bound. No wallet: it waits and lands when they open one (R-11). One ledger `in` row (category refund) and one notification (`community_pass_refunded`, "Money in" mutes its push).
- **Host's 85%:** `EarningDeduction` (85% of the refund). The host's next daily move (R-55) is smaller by what it can spare while staying at the N200 floor; the rest stays owed and comes out of the next move. Never taken from the host's wallet. WAWU's 15% is WAWU's loss. Leaving still gives nothing.
- **Hub:** `GET /communities/{id}/members/{userWawuId}/removal-quote` (host only) answers `refundKobo`, `unusedDays`, `asOf`. Migration `20261029090000_community_pass_removal_refund` (3 tables, 1 nullable column) with `rollback.sql` that refuses to lose data.
- **App:** `fetchRemovalQuote`, `removeMember` and `removalRefundLine` in `src/features/community-host/`. No remove sheet is mounted: no board draws a member list or the host's way to remove (G-INBOX-25-1, R-47).
- **Checks:** new spec `community-pass-removal-refund` 12 of 12 (9 fail with the refund switched off); touched specs 8 suites 134 tests pass on a fresh database; tsc, eslint changed files, gates 0 fail, contract:build twice equal. Protected suite 251 of 253: the 2 red are `/communities/:id/messages` widened by MERGE-25's `videoUrl` and `voiceUrl`, not this task. Mobile jest community-host 3 suites 19 tests; mobile tsc has one existing error (`react-native-view-shot` missing).
- **Test edits:** INBOX-24's three removal cases and `push-policy.spec` pinned "a removal returns no money" and a closed list of kinds; updated for R-71 (balance plus the refund; a pass ended by removal means 403 until a new pass).

## Read first

- `DECISIONS.md` (R-71 is the lead's ruling of 19 Oct 2026; Q-43 answered), `tasks/INBOX-24.md`, `tasks/INBOX-14.md`.

## Goal

A member a host removes gets the unused days of their paid monthly pass back, once, to their wallet, and the host's share of those days is taken back from the host's earnings.

## Scope

Backend only for the money; the app reads the Hub's quote. Additive: new tables, one nullable column, one new route.

## Capability checks

- [ ] Removing a member with 1, 15 and 29 unused days pays 6,666, 100,000 and 193,333 kobo (price N2,000).
- [ ] No unused days gives nothing; leaving gives nothing.
- [ ] A double remove, two Hubs and a retry pay once; a provider failure then success and an unknown then answer pay once.
- [ ] The host's share comes out of unmoved earnings, then the next move; never the host's wallet.

## History

Round reports: [history/INBOX-25.md](history/INBOX-25.md).

## Owner sign-off
