---
id: WALLET-39
title: A notice for all money in
owner: YOU
area: WALLET
order: 261
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [INBOX-03, WALLET-10, NUV-05, MONEY-10]
decisions: [R-54]
passes: [V1, V2, V3, V4, V7, V8, V9]
artboards: []
---
# WALLET-39 · A notice for all money in

## Current state

As of 17 Oct 2026, built on `wmt/WALLET-39`; waiting for a verifier.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-39.md`): verdict merge, nothing medium or worse. Stacked in batch 6 (backend and mobile `wmt/MERGE-6`). Backend `wmt/WALLET-39` 2194ffb on backend main a5e48fc (batch 5). This repo: the same branch, with this file, SHARED-CHANGES rows `WALLET-39 #1` and `#2`, BACKEND_GAPS (G-730, G-731, G-732 closed) and LOG.
- **Built (backend, additive):** the WALLET-10 sweep now tells every credit to a person's wallet: a received send (`transfer`), earnings landing (`earning`, WALLET-16's rows included, no hook needed), a refund (`refund`) and a bank transfer in (`top_up`). One `money_in` notification per ledger row, the mark `MoneyInNotice` as before.
- **Words:** "You received ₦5,000 from Tolu B.", "...in earnings.", "...from your points.", "You received a refund of ₦1,200.", "...by bank transfer." / "...from Ada Obi (****1291)." (the WALLET-10 words, unchanged). Never a whole account number; no person's number at all for a send from inside WAWU.
- **Opens the right screen:** the notice carries the ledger row's id as a `transaction` target in `GET /me/notifications` and in the push `data` (`target: {kind: "transaction", id}`), the id `GET /money/transactions/{id}` answers. The app (INBOX-21 routes the tap) opens the receipt (WALLET-04), or W46 for a bank transfer in while the person is on W45.
- **Corrections:** a told credit the ledger later reverses is followed by one `money_in_reversed` notice ("The ₦5,000 you received from Tolu B. was reversed."), written with `MoneyInNotice.correctedAt` in one transaction, up to 30 days after the credit. The list always carries it; "Money in" off silences only its push. A credit nobody was told of (muted, before, reversed before it was told) is not corrected.
- **Migration:** `20261024070000_money_in_all_credits` (two nullable columns, backfills so old credits and old reversals are not news, `rollback.sql`). The lead renames it at merge if needed.
- **After the merge:** run `npm run api -- --backend ../wawu-backend` (the contract gains `transaction` as a `NotificationTargetView.kind`); nothing in the app calls it yet.
- **Decisions (Default (agent), owner may override):** (1) target kind is `transaction`, not `ledger_entry` (G-731's guess): the app thinks in transaction ids. (2) The correction is a second kind, not a second `money_in`, so a list never has two "received" rows for one credit. (3) A told credit is corrected even with "Money in" off (a stale "received" must not stand); only the push is muted. (4) A person from inside WAWU is "Tolu B." (first name and last initial); one with no name on record is "a WAWU user". (5) Earnings and refunds name nobody. (6) The correction window is 30 days from the credit (PROVISIONAL(MONEY-IN-CORRECTION-WINDOW), owner=YOU).
- **Not done / open:** the bank's name appears in the words only when a provider gives one (none does today, so "from GTBank ****0921" shows only if one starts to); WALLET-16 is not merged, so its earning rows were checked in the shape its branch writes them. `dm_refunded` (the web's DM refund) is a separate event and still fires beside a wallet refund's `money_in`.
- **Next:** the lead merges it with batch 6.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-54 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Every credit to a wallet sends the person a notice: money from a Who Made This? user, earnings that land, refunds, and bank transfers in (R-54). Tapping it opens the right screen (W46 for a bank transfer in).

## Scope

- One `money_in` notification kind written from the ledger credit (one per ledger entry, idempotent), in the app's notification list and as a phone push (INBOX-03). Text names the amount and the source ("from Tolu B.", "earnings", "refund", "from GTBank ••0921") and never prints a full account number. No em-dash in any text.
- Sources covered: wallet-to-wallet receipts (NUV-05), earnings landed (WALLET-16 when it merges: register the hook, do not wait), refunds and releases (NUV-05 holds), bank transfers in (WALLET-10, NUV-04 `account_funded`).
- The notice carries the transaction id so the app opens the receipt (WALLET-04) or, for a bank transfer in while the person is on W45, the W46 screen.

## Capability checks

- [ ] A friend's send, a landed earning, a refund and a bank transfer each make exactly one notice; a repeated delivery makes none more.
- [ ] The notice shows the amount and source, no account number.
- [ ] A reversed credit does not leave a "received" notice standing without a following correction notice.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WALLET-39.md](history/WALLET-39.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
