---
id: SUPPORT-01
title: Support chat that opens with the payment or piece it is about
owner: YOU
area: SUPPORT
order: 174
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: flow
status: todo
depends_on: [INBOX-06, INBOX-19, HOME-12, WALLET-04, WALLET-06]
decisions: [R-30]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
---
# SUPPORT-01 · Support chat that opens with the payment or piece it is about

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV2).

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
