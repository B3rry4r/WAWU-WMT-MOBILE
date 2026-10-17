---
id: SUPPORT-01
title: Support chat that opens with the payment or piece it is about
owner: YOU
area: SUPPORT
order: 174
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: flow
status: verifying
depends_on: [INBOX-06, INBOX-19, HOME-12, WALLET-04, WALLET-06]
decisions: [R-30]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
---
# SUPPORT-01 · Support chat that opens with the payment or piece it is about

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Builder done (Sonnet, T1). No PR (the lead merges).
- **Branches:** backend `wmt/SUPPORT-01` `757db70` on `origin/wmt/MERGE-10` `3cf5a4b`; mobile `wmt/SUPPORT-01` on `origin/wmt/MERGE-10` `4b854ee4` with `origin/wmt/S1` `9d221172` merged (HOME-12's unlock screen holds H18; conflicts in BACKEND_GAPS.md and SHARED-CHANGES.md kept both sides, `docs/PROGRESS.md` rebuilt, `contract/SOURCE_COMMIT` re-pointed).
- **Built:** a support thread is the person's free chat with a fixed support account, so the inbox row (I1), unread count, read marks and live updates come from the chat. `POST /support/thread` opens it with a payment or wallet transaction of the caller written as the first message, once per reference; staff reply through `/admin/support/threads` (superadmin, support). No table, no migration.
- **Entries:** H18 Contact support (payment), W27 Report a problem (transaction), W35 Help with a payment (nothing attached); the chat is I12's, the row is I1's "Who Made This?" with the app's mark.
- **Not built (R-47, gaps filed):** a board for the support chat (G-SUPPORT-01-1), who replied (G-SUPPORT-01-2), a dashboard screen for staff (G-SUPPORT-01-3).
- **Shared changes asked:** SUPPORT-01 #1 (`app.module.ts`), #2 (contract and generated types), #3 (assertions that said the entries were left out).
- **Open findings:** none yet. Lows go to `tasks/SWEEP-MONEY.md` or the lead's choice.
- **Next:** a lean verifier (claims list, the affected specs, pictures beside the boards, every drawn state), then merge: backend `app.module.ts` rows first, then `npm run api -- --backend ../wawu-backend`.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: R-30
- `docs/designer/BRIEF.md` (rule 6: no promises about money the system doesn't back)
- The design: `python3 scripts/design/render_design.py I1 I12 H18 W27 W35` then open `build/design_shots/`

## Goal

H18 "Contact support", W27 "Report a problem" and W35 "Help with a payment" open a chat with WAWU that already
carries the reference of the payment or piece, so nobody has to describe it twice (R-30).

## Scope

Backend: a support thread per user (the WAWU system thread on I1) that carries a transaction or content reference,
and the route staff reply through (the dashboard's existing support tools if there are any; otherwise an admin
reply route, named in the builder report). App: the thread opens in I12's chat layout with WAWU as the other side
and the reference as its first message. No undrawn screen is invented: it is I12's chat. This task adds the
three entry points to the screens that draw them, exactly as drawn (docs/WORKFLOW.md section 7).

## Capability checks

- [ ] From H18, a user can tap Contact support and land in a chat with WAWU whose first message names that unlock's reference.
- [ ] From W27, a user can tap Report a problem and land in the same chat with that transaction's reference.
- [ ] From W35, a user can tap Help with a payment and land in the chat (this task adds all three entries, as drawn).
- [ ] A staff reply reaches the user's chat, and the thread shows on I1 as the WAWU thread.
- [ ] Another user can never read this thread.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SUPPORT-01.md](history/SUPPORT-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
