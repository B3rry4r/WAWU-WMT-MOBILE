---
id: WEBPAY-03
title: Pay from the wallet on the website: the pay sheet and the PIN
owner: YOU
area: WEB
order: 218
priority: launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [MONEY-14, MONEY-17, MONEY-19, NUV-01, WEBPAY-01]
decisions: [R-44, R-23, R-21]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
---
# WEBPAY-03 · Pay from the wallet on the website: the pay sheet and the PIN

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs MONEY-14, MONEY-17, MONEY-19, NUV-01, WEBPAY-01 built first.
- **History:** none yet. Reports go to tasks/history/WEBPAY-03.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawuafrica` (the website, Next.js). Start the session with that repo and `wawu-wmt-mobile` both attached; follow the web repo's CLAUDE.md: Tailwind tokens only, every call in `src/lib/api/`, shared UI from `src/components/ui/`, no em-dashes in anything a person reads. Sync the contract from a backend checkout that has the routes merged (`npm run contract:sync`, then `npm run contract:types`); never hand-write a response type.
- DECISIONS.md R-44 (the web's payment scope: same as the app, same Hub routes, no card), R-42 and R-43
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/MONEY-03.md` (the app's pay sheet), `tasks/MONEY-17.md`, `tasks/MONEY-19.md`, `tasks/MONEY-14.md`

## Goal

One web pay sheet for every web payment, as the app's MONEY-03: the amount, one Fees row (R-23), the balance after,
and the PIN; not enough money (the exact shortfall, with Add money); still confirming; failed; and forgot PIN with
an email code (R-39). WEBPAY-04 and WEBPAY-05 pay through it.

## Scope

- A shared pay sheet and PIN entry in `src/components/` (one component, variants by prop, never forked); `src/lib/api/money.ts` additions; one Idempotency-Key per sheet, kept across retries; double clicks guarded.

**V5 (picture):** the round 2 boards this screen follows are not in `design/` yet (R-43: tasks are cut from the new boards once exported). Build from the round 2 brief's text in the web's design system; V5 compares with the boards once the export lands, and is NOT RUN until `design/canvas-inventory.json` lists the ids named in the Goal. The backend runs locally with Nuvion stood in (no wawuafrica.com host, no Nuvion host).

## Capability checks

- [ ] A person can pay with their PIN and see it done; a double click or a resend sends one Idempotency-Key and is charged once (V8).
- [ ] Short of money: the sheet shows the exact shortfall, and Add money goes to WEBPAY-02 and back to the sheet.
- [ ] Still confirming and failed each show their own state; a wrong PIN five times shows the lock.
- [ ] Forgot PIN: the code arrives by email, a new PIN is set, and the payment goes on.
- [ ] Fees show as one row with the server's figure; the browser computes no amount.

## Builder report

## Verifier report

## Owner sign-off
