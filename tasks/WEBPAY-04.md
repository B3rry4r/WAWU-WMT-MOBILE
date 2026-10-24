---
id: WEBPAY-04
title: Buy a tier on the website
owner: YOU
area: WEB
order: 350
priority: after-launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [TIER-02, TIER-03, TIER-04, TIER-05, WEBPAY-02, WEBPAY-03]
decisions: [R-44, R-43]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
---
# WEBPAY-04 · Buy a tier on the website

## Current state

As of 16 Oct 2026.
- **Priority:** after-launch, set by OPS-R0 (records pass, 17 Oct 2026). Not launch work by R-49 (owner, 10 Oct 2026): website tasks are paused until the owner says otherwise; the site serves only the registration link.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): TIER-02, TIER-04, TIER-05, WEBPAY-02, WEBPAY-03.
- **History:** none yet. Reports go to tasks/history/WEBPAY-04.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawuafrica` (the website, Next.js). Start the session with that repo and `wawu-wmt-mobile` both attached; follow the web repo's CLAUDE.md: Tailwind tokens only, every call in `src/lib/api/`, shared UI from `src/components/ui/`, no em-dashes in anything a person reads. Sync the contract from a backend checkout that has the routes merged (`npm run contract:sync`, then `npm run contract:types`); never hand-write a response type.
- DECISIONS.md R-44 (the web's payment scope: same as the app, same Hub routes, no card), R-42 and R-43
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/TIER-01.md` to `tasks/TIER-05.md` (routes and answers)
- The web's current verification checkout (`src/lib/api/verification.ts`, `src/app/(app)/profile/verification/`)

## Goal

VF5, VF6, VF7, VF13 and VF14 on the website: Make it official (three tiers, Founding Maker pre-selected, prices in
the person's currency), checkout (wallet or bank transfer, the points bump), paying, failed, You're official, the
limit sheet (add 5 more or upgrade), and Your tier. The web's publish and upload screens open Make it official on
`tier_required` and the limit sheet on `product_limit_reached`.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- The web's Flutterwave verification checkout (`POST /api/hub/verification/purchase`): the website's way to get verified moves to the tier checkout. The old route stays until a removal task (WORKFLOW section 6).

## Scope

- New web routes for the tier screens, `src/lib/api/plans.ts`; the publish and upload screens' handling of the two 402 answers.
- The web's CLAUDE.md product notes follow R-43 and R-44 (tiers with 3, 6 or 10 products instead of the 5-item cap and "no subscription"; dollar prices for people billed in dollars).

**V5 (picture):** the round 2 boards this screen follows are not in `design/` yet (R-43: tasks are cut from the new boards once exported). Build from the round 2 brief's text in the web's design system; V5 compares with the boards once the export lands, and is NOT RUN until `design/canvas-inventory.json` lists the ids named in the Goal. The backend runs locally with Nuvion stood in (no wawuafrica.com host, no Nuvion host).

## Capability checks

- [ ] A naira-billed person can pick a tier, pay from the wallet with the PIN, and see You're official with the points, products and event pass the server granted.
- [ ] Paying by transfer shows the account number and the amount still needed, and completes when the transfer lands.
- [ ] A person on a tier sees Upgrade with "pay only the difference" and the server's difference.
- [ ] At the limit, publishing opens the limit sheet, and adding 5 more lets them publish.
- [ ] A dollar-billed person sees only $ prices and a naira-billed person only ₦.
- [ ] Your tier shows active, ending and ended from `GET /me/tier`.

## Builder report

## Verifier report

## Owner sign-off
