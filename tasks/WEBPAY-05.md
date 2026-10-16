---
id: WEBPAY-05
title: Buy points on the website
owner: YOU
area: WEB
order: 220
priority: launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [POINTS-01, POINTS-02, TIER-05, WEBPAY-03]
decisions: [R-44, R-43]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
---
# WEBPAY-05 · Buy points on the website

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs POINTS-01, POINTS-02, TIER-05, WEBPAY-03 built first.
- **History:** none yet. Reports go to tasks/history/WEBPAY-05.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawuafrica` (the website, Next.js). Start the session with that repo and `wawu-wmt-mobile` both attached; follow the web repo's CLAUDE.md: Tailwind tokens only, every call in `src/lib/api/`, shared UI from `src/components/ui/`, no em-dashes in anything a person reads. Sync the contract from a backend checkout that has the routes merged (`npm run contract:sync`, then `npm run contract:types`); never hand-write a response type.
- DECISIONS.md R-44 (the web's payment scope: same as the app, same Hub routes, no card), R-42 and R-43
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/POINTS-01.md`, `tasks/POINTS-02.md`

## Goal

PT4 and PT5 on the website: the packs in the person's currency (a Founding Maker sees the bonus), paid from the
wallet or by transfer, then added; Your points: balance, lots with their expiry, the last 20 movements. Converting
to cash and the AI tools are not on the website: R-44 names buying points only (Default (agent), owner may override).

## Scope

- New web routes for Buy points and Your points; `src/lib/api/points.ts`; the pay sheet from WEBPAY-03.

**V5 (picture):** the round 2 boards this screen follows are not in `design/` yet (R-43: tasks are cut from the new boards once exported). Build from the round 2 brief's text in the web's design system; V5 compares with the boards once the export lands, and is NOT RUN until `design/canvas-inventory.json` lists the ids named in the Goal. The backend runs locally with Nuvion stood in (no wawuafrica.com host, no Nuvion host).

## Capability checks

- [ ] A person can buy a pack from the wallet with the PIN and see the points added and the new balance from the server.
- [ ] Paying by transfer completes when the transfer lands.
- [ ] A Founding Maker sees the bonus on each pack, with the server's figure.
- [ ] Your points shows each lot's expiry date and the last 20 movements; a new person sees the empty state.
- [ ] Points always show as points, never as naira or dollars.

## Builder report

## Verifier report

## Owner sign-off
