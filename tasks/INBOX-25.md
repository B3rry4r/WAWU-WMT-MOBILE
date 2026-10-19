---
id: INBOX-25
title: A removed member gets the unused pass days back
owner: YOU
area: INBOX
order: 296
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

As of 19 Oct 2026, merging (lead): stacked in batch 26 (backend `894c058`, mobile `ecde6c0f`). The round 1 verifier said FIX (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-25.md`); round 2 fixed F1 to F4 and the lows are rows of `tasks/SWEEP-INBOX.md` (F5, F6 as the lead default, F7). Order 296 (it was 355, which check_tasks refuses after CHECK-3; it depends on INBOX-14 at 284, so only 285 to 298 were possible and all were taken: FIX-45, which has no dependency and no dependent, moved to 217 and INBOX-25 took 296). Backend `wmt/INBOX-25` `894c058` (round 1 `26fdf0d`) and mobile `wmt/INBOX-25` (round 1 `b58cee54`), both from `wmt/MERGE-25` (`223fe89`, `eb2ffa3b`).
- **Where it was:** `DELETE /communities/{id}/members/{userWawuId}` (`CommunityService.removeMember`) moved a joined member of a pass room to pending and gave nothing back (G-INBOX-24-3, Q-43, R-71).
- **Lead defaults used:** refund = floor(price paid x whole unused days / pass days); a started day counts as used; pass days are the pass's own start to end; "price paid" is the pass price (the provider charge and WAWU fee on the purchase are not refunded). Several passes are summed, each floored; one removal is one refund row and one payment, however many passes.
- **Money path:** the removal and the decision are one transaction; each pass paid back is marked (`CommunityPass.refundId`) and ended that moment (`endsAt = now`), so one removal is one refund (double tap, two servers, a retry). `CommunityPassRefund` is paid at once from WAWU's merchant account to the member's wallet through `WALLET_PROVIDER` under `wawu-pref-<id>`: lease, ask-never-resend, one new try per confirmed failure under a new reference, review past the bound. No wallet: it waits and lands when they open one (R-11). One ledger `in` row (category refund) and one notification (`community_pass_refunded`, "Money in" mutes its push).
- **Host's 85%:** `EarningDeduction` (85% of the refund), taken from the host's next daily move (R-55) while it stays at the N200 floor; the rest stays owed to the next move. Never from the host's wallet. WAWU's 15% is WAWU's loss. Leaving still gives nothing.
- **Hub:** `GET /communities/{id}/members/{userWawuId}/removal-quote` (host only). Migration `20261029090000_community_pass_removal_refund` (3 tables, 1 nullable column). **App:** `fetchRemovalQuote`, `removeMember`, `removalRefundLine`; no remove sheet is mounted (G-INBOX-25-1, R-47).
- **Round 2 (fixes, backend only, contract unchanged):** F1 high fixed: a pass not started (a renewal bought early) is all unused, its whole price goes back in the same refund, and it is ended with `endsAt = now` and its start pulled back one millisecond so `CommunityPass_period_valid` holds; the row is kept (its unique `walletPaymentId` stops a payment confirmed again from granting it twice, and it carries the refund mark). The quote already used the same figures. F2: purge map classifies the 3 columns COUNTERPARTY (kept for the ledger: a deleted member's or host's account takes no refund or deduction row with it). F3: `tgif-daily-notice-units.spec` pins the push-only list with `community_pass_refunded`. F4: `rollback.sql` is one DO block, so it refuses with plain `psql -f`, `psql -1` and a pipe, and changes nothing.
- **Lead default F6 (no build):** a host may delete their account with a deduction still open; WAWU bears what is left. F5 and F7 are lows in `tasks/SWEEP-INBOX.md`.
- **Checks (round 2):** removal spec 14 of 14 (the 2 new fail on the old code with 23514); 7 touched suites 120 tests pass; tsc, eslint changed files, gates 0 fail all EXIT 0; rollback proved on a throwaway database both ways. Round 1 notes: protected suite 251 of 253, the 2 red are `/communities/:id/messages` widened by MERGE-25's `videoUrl` and `voiceUrl`.
- **Next:** the batch 26 pull request (the lead).

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
- [ ] A member with a running pass and a renewal bought early (not started) is removed: both are paid back in one refund, the member is out, nothing answers 500.

## History

Round reports: [history/INBOX-25.md](history/INBOX-25.md).

## Owner sign-off
