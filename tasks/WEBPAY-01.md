---
id: WEBPAY-01
title: Open your wallet on the website
owner: YOU
area: WEB
order: 216
priority: launch
repo: wawuafrica
type: web-port
status: todo
depends_on: [NUV-02, NUV-03, NUV-04, MONEY-09]
decisions: [R-44, R-42, R-39, R-6]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
---
# WEBPAY-01 · Open your wallet on the website

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawuafrica` (the website, Next.js). Start the session with that repo and `wawu-wmt-mobile` both attached; follow the web repo's CLAUDE.md: Tailwind tokens only, every call in `src/lib/api/`, shared UI from `src/components/ui/`, no em-dashes in anything a person reads. Sync the contract from a backend checkout that has the routes merged (`npm run contract:sync`, then `npm run contract:types`); never hand-write a response type.
- DECISIONS.md R-44 (the web's payment scope: same as the app, same Hub routes, no card), R-42 and R-43
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/NUV-02.md`, `tasks/NUV-03.md`, `tasks/NUV-04.md`, `tasks/NUV-09.md` (the routes and states)
- The app's Open your wallet screens (KYC-03, KYC-04, KYC-05) for the steps

## Goal

A person on the website with no wallet can open one with the same steps as the app (R-44): BVN and NIN (none for a
person outside Nigeria), an ID document and a proof of address, Nuvion's hosted selfie with its hand-off ("You'll
finish this on a secure page") and the return, "Checking your details", approved with the account number, rejected
with the reason and what to fix, then the transaction PIN. Every web payment screen sends a person with no wallet
here (the `no_wallet` answer, MONEY-13). Boards to compare with once exported: the round 2 Open your wallet steps.

## Scope

- New web routes for the opening steps (in the focused layout), a new `src/lib/api/money.ts` for the `/money/*` routes; the old Flutterwave `/api/hub/wallet` module and wallet page stay untouched until WALLET-30.
- The web's CLAUDE.md wallet note follows R-39 and R-42 (Nuvion; WAWU's operational account holds held money).

**V5 (picture):** the round 2 boards this screen follows are not in `design/` yet (R-43: tasks are cut from the new boards once exported). Build from the round 2 brief's text in the web's design system; V5 compares with the boards once the export lands, and is NOT RUN until `design/canvas-inventory.json` lists the ids named in the Goal. The backend runs locally with Nuvion stood in (no wawuafrica.com host, no Nuvion host).

**R-45 (8 Oct 2026):** naira first; NUV-09 (dollar wallets) is no longer needed before this task. The wallet page sends a person with no wallet into these steps.

## Capability checks

- [ ] A signed-in person with no wallet can enter BVN and NIN, upload an ID (front and back) and a proof of address, finish the hosted selfie and land back on the same step, and see "Checking your details".
- [ ] Approved: they see their account number, bank and name, and set a PIN. Rejected: they see the reason, fix it and submit again.
- [ ] A file too large or of the wrong type is refused on the page, before upload, with the server's limit.
- [ ] A person outside Nigeria is never asked for BVN or NIN.
- [ ] No BVN or NIN stays in the browser after submit (storage and the network panel checked); on screen only the last 4 show.
- [ ] Every step works at phone and desktop widths, light and dark, with no em-dash in any copy (`npm run check:copy`).

## Builder report

## Verifier report

## Owner sign-off
