---
id: INBOX-24
title: Private community monthly pass (backend)
owner: YOU
area: INBOX
order: 259
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [WALLET-17, INBOX-16, MONEY-19]
decisions: [R-63, R-10, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-24 · Private community monthly pass (backend)

## Current state

As of 18 Oct 2026, merging (lead): round 3 (backend `wmt/PASS-r3` `1fdcf7a`) stacked in batch 16.
- **Merge (MERGE-16):** round 3 is in backend `wmt/MERGE-16` (a removal survives `leave` and a payment in flight; `community-pass-nuvion.contract.spec.ts` gained its cases) and was accepted on a diff read. The earlier owner question Q-43 (a removed member re-joining a pass room) is answered by it. The refund when a host removes a member (G-INBOX-24-3) was asked as Q-43 too and is ruled by R-71, task INBOX-25. Stacked in batch 16 by MERGE-16; not on main.
- **Status:** merging (lead). Verdict: PASS (no blocker, high or medium; 3 lows); round 2 (backend 0116060) closed the naira sign and a removed member's re-join of a pass room on the lead's diff read; branch CI red only on the Fintava-double earning-settlement spec (red the same way on the base, owner question Q-42, ruled in R-70) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-24.md`). Stacked in batch 13 by MERGE-13 (backend `wmt/MERGE-13`, mobile `wmt/MERGE-13`); not on main. Built: Backend `wmt/INBOX-24` `0116060` (round 1 `28cea21`, from `wmt/B3a` `242ce9d`, WALLET-17's earnings); mobile `wmt/INBOX-24` (records only). Migration `20261025180000_community_pass`. Nothing merged.
- **Round 3 (17 Oct 2026, Sonnet builder, T2), backend `wmt/PASS-r3` `1fdcf7a` from `wmt/MERGE-14` `195de50`:** closes INBOX-14's HIGH-1 and MEDIUM-1. In a pass room `leave()` deletes only a `joined` row, so a removed member's DELETE then POST `/join` stays removed (join already answered the pending row as it is); only the host's approve lets them back. A pass payment that lands for a removed member is refused under a lock on the membership row and paid back in full, the charge included (WAWU bears its refund charge); the grant no longer flips a pending row to joined. Open rooms and older private rooms are unchanged. Specs in the pass contract spec: leave then join stays removed; a renewal racing a removal ends removed with a full refund (Hub = stand-in); leaving open and older rooms unchanged (2 of the 3 fail before the change, the third guards what must not change). Checks: tsc, eslint EXIT 0; pass spec 16 of 16; community and community-message specs 182 of 183 (the one red, a sender name in rooms, is red the same way without the change on this stack); protected suite 28 red, the same 28 without the change (verification, events, professionals on the stack's mock id); gates 0 fail.
- **Size:** L. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** the batch 13 pull request (the lead). The verifier's lows are in SWEEP-MONEY (L1) and SWEEP-INBOX (L3, G-INBOX-24-1, G-INBOX-24-6).
- **Records:** SHARED-CHANGES INBOX-24 #1 to #4; BACKEND_GAPS G-INBOX-24-1 to -6.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-63, R-10, R-5 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person can join a private community by paying for 30 days from the wallet and can renew with one tap; the host sets the price and keeps 85% (R-63). Nothing is debited automatically.

## Scope

- A private community has a host-set price (launch example ₦2,000, I30; the host types it on I32). `POST /communities/{id}/pass` (Idempotency-Key, the transaction PIN as MONEY-17 takes it) pays from the wallet through the pay-from-wallet path, grants 30 days of membership and pays the host's 85% (WALLET-17 path). Paying again before the end extends from the current end date; after it ends, from today.
- `GET /communities/{id}/membership` additionally returns `passUntil` and `canRenew`. A pass that has ended removes access to the room (reading included) until renewed.
- A reminder 3 days before the pass ends (in-app notice and phone push through INBOX-03) carries a deep link to the renew tap. No automatic debit exists anywhere (R-63).
- There is no host approval step to join a private room (R-63). The existing request routes stay for rooms that already hold pending requests (additive; nothing removed).
- Default (agent), owner may override: the host's 85% is paid when the pass is bought (no hold), and a failed or reversed charge gives no access. Refund rules are not ruled; none are built. Answered 19 Oct 2026 (Q-43, R-71): when the host removes a member, the unused days are paid back, worked out from the price paid (task INBOX-25); leaving on one's own pays nothing.

## Capability checks

- [ ] A member pays ₦2,000 from the wallet: the wallet drops once, access lasts 30 days, the host gets ₦1,700.
- [ ] The same request twice debits once (V8). A wrong PIN 5 times locks as every wallet payment does.
- [ ] Three days before the end the member gets one reminder; tapping Renew extends the pass by 30 days from its end.
- [ ] After the end date the member can no longer read or send until they renew.
- [ ] No pass is ever renewed without a PIN-confirmed request.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-24.md](history/INBOX-24.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
