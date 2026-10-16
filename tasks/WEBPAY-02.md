---
id: WEBPAY-02
title: Add money by bank transfer on the website
owner: YOU
area: WEB
order: 217
priority: launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [NUV-04, WEBPAY-01]
decisions: [R-44, R-42]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
---
# WEBPAY-02 · Add money by bank transfer on the website

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs NUV-04, WEBPAY-01 built first.
- **History:** none yet. Reports go to tasks/history/WEBPAY-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawuafrica` (the website, Next.js). Start the session with that repo and `wawu-wmt-mobile` both attached; follow the web repo's CLAUDE.md: Tailwind tokens only, every call in `src/lib/api/`, shared UI from `src/components/ui/`, no em-dashes in anything a person reads. Sync the contract from a backend checkout that has the routes merged (`npm run contract:sync`, then `npm run contract:types`); never hand-write a response type.
- DECISIONS.md R-44 (the web's payment scope: same as the app, same Hub routes, no card), R-42 and R-43
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/NUV-04.md`

## Goal

W15 on the website: the wallet's own account number, bank name and account name, each with Copy, plus Share
details; "Money you send arrives in a few minutes"; waiting; received, with the amount and the new balance.
Transfer only (R-42); no card (R-44). Board to compare with once exported: W15 (round 2).

## Scope

- The Add money page and its entry from the web wallet, the pay sheet's shortfall (WEBPAY-03) and the checkout (WEBPAY-04); `src/lib/api/money.ts` additions.

**V5 (picture):** the round 2 boards this screen follows are not in `design/` yet (R-43: tasks are cut from the new boards once exported). Build from the round 2 brief's text in the web's design system; V5 compares with the boards once the export lands, and is NOT RUN until `design/canvas-inventory.json` lists the ids named in the Goal. The backend runs locally with Nuvion stood in (no wawuafrica.com host, no Nuvion host).

## Capability checks

- [ ] A person with a wallet can copy their account number, bank and name, and share the details.
- [ ] After a transfer lands (a stand-in inflow on the local backend), the page shows received with the amount and the new balance from `GET /money/wallet/balance`, without a reload.
- [ ] A person whose account number is still on its way sees that, not an empty card; a person with no wallet is taken to open one.
- [ ] The balance shown is the server's figure; the page never adds amounts.

## Builder report

## Verifier report

## Owner sign-off
