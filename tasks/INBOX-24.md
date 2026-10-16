---
id: INBOX-24
title: Private community monthly pass (backend)
owner: YOU
area: INBOX
order: 259
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [WALLET-17, INBOX-16, MONEY-19]
decisions: [R-63, R-10, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-24 · Private community monthly pass (backend)

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** L. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): WALLET-17, INBOX-16.
- **History:** none yet. Reports go to tasks/history/INBOX-24.md.

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
- Default (agent), owner may override: the host's 85% is paid when the pass is bought (no hold), and a failed or reversed charge gives no access. Refund rules are not ruled; none are built.

## Capability checks

- [ ] A member pays ₦2,000 from the wallet: the wallet drops once, access lasts 30 days, the host gets ₦1,700.
- [ ] The same request twice debits once (V8). A wrong PIN 5 times locks as every wallet payment does.
- [ ] Three days before the end the member gets one reminder; tapping Renew extends the pass by 30 days from its end.
- [ ] After the end date the member can no longer read or send until they renew.
- [ ] No pass is ever renewed without a PIN-confirmed request.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
