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

As of 17 Oct 2026, built (bundle INBOX-24, Sonnet builder), waiting for a verifier.
- **Status:** verifying. Backend `wmt/INBOX-24` `28cea21` (from `wmt/B3a` `242ce9d`, WALLET-17's earnings); mobile `wmt/INBOX-24` (records only). Migration `20261025180000_community_pass`. Nothing merged.
- **Size:** L. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a verifier; passes V1, V2, V3, V4, V6, V7, V8, V9. Then INBOX-14 builds I30 to I34 on these routes.
- **Records:** SHARED-CHANGES INBOX-24 #1 to #4; BACKEND_GAPS G-INBOX-24-1 to -5.

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

- **Built** (backend `src/community/pass/`): kind `community_pass` on MONEY-17's pay from wallet (target: the community id, price: the host's, payee: the host, not held). Routes `GET /communities/{id}/pass` (no wallet needed), `GET .../pass/quote`, `POST .../pass` (Idempotency-Key, PIN), `GET .../pass/{paymentId}` (poll). The host types the price on `POST /communities/rooms` (`passPriceKobo`, private only, N100 to N500,000, G-INBOX-24-2); a private room without one keeps the older requests.
- **Pass:** 30 days from the later of today and the current end; one row per payment (unique), granted under a per-person-per-room lock so two payments chain. A person who pays is `joined`. A room that sells a pass is not joined by a request (`POST /join` is 409 without a running pass; someone who left with time on theirs rejoins free).
- **After the end:** the membership row stays; messages (read and post), the read mark, live push, live catch-up and the inbox leave the room; `room` shows `none`; `mine` lists it with no message and no unread count; `membership` carries `passUntil` and `canRenew` for a pass room only (every other room answers the same keys as before, so V3's lock holds).
- **Reminder:** `community_pass_ending`, once per pass, 3 days before the end, not for a renewed pass; in-app and pushed (G-INBOX-24-1); `actionHref` `/communities/{id}/renew`. Nothing is debited by time or by the reminder.
- **Money:** fee on top from config (R-10); the host's 85% is an ordinary sale earning in their one move a day (R-55), owed if they have no wallet (R-11). A pass that cannot be given (room stopped selling, host and person blocked) is paid back in full, the charge included; the payment keeps no earning.
- **Checks (capability list):** all five covered in `src/community/pass/tests/community-pass-nuvion.contract.spec.ts` against the Nuvion stand-in: pays N2,000 (wallet drops once by price plus charge, 30 days, host earns 170,000 kobo and it lands in the one move); same key twice and at once, and a lost answer then a retry, debit once and give one pass; wrong PIN (5 lock), short balance (402), no wallet; extend from the end, from today after it; the end removes read, post, read mark, room role; reminder once; refund after the room stopped selling returns every naira. After the flows each account's ledger equals the stand-in's balance, WAWU's operational account included. Fintava address counter: 0 hits.
- **Run (stack `inbox24`, ports 7890 to 7892, down at the end):** the new contract spec 11 passed, EXIT 0; rules spec 6 passed; `tsc --noEmit` EXIT 0; eslint on the 32 changed files EXIT 0; gates 0 fail, 124 warn, 88 accepted, PASSED; `check_baseline` passes; `contract:build` done. Neighbouring specs (money-moving and wallet-gate coverage, account-data-map, data-export-map, push-policy, live, notification-emitter, community, inbox) pass except 19 tests in 4 suites (community, community-rooms, inbox, notification-wiring) that fail the same 19 on `wmt/B3a` unchanged (an unseeded stand-in database and identity names).
- **Spec lists extended, nothing loosened:** the two money-route coverage specs and `push-policy.spec.ts` list what is mounted or pushed and must grow with each such task (SHARED-CHANGES INBOX-24 #4).
- **NOT RUN:** the full backend suite and the protected-route suite V3 (GitHub runs both on the push); the app (no screen here); a call to any real provider (none made).
- **Not done:** refunds on leaving or removal and a route to change the price later (not ruled, G-INBOX-24-3, -2); a host notice when someone buys a pass.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
