---
id: OPS-25
title: Admin dashboard: money oversight (older unpaid sales, identity holds), read and act on what the Hub offers
owner: YOU
area: OPS
order: -152
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-1, R-6, R-11, R-47, R-55]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-25 · Money oversight

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B15), dashboard `wmt/OPS-23` on `origin/main` `c1dfca6`, Hub read at `origin/main` `3d33a05`. Status verifying. The pictures are at 1440 px under `dash-b15/` in the builder's scratchpad (light and dark), taken against a local stack (Nuvion stand-in, seeded test rows). No Hub change, and no new money route: the screen reads and acts only on routes the Hub already serves to admins. Nothing on it moves a naira.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | `GET /admin/money/earnings/before-start` (WALLET-16) lists the finished sales the earnings sweep will never pay because they were made before its start; no screen | Money, Oversight (`/finance/oversight`, a fifth tab of the money strip): "Sales the earnings sweep will not pay", oldest first, with the start time and where it came from, the count, each sale's title, kind, payee, the payee's 85% and when it finished, "Load more sales" while `nextCursor` is set. Read only: the Hub offers no way to mark one paid, so there is no control for it (`superadmin`, `finance`) |
| 2 | `POST /admin/identity-holds/:wawuUserId/release` lets support let go of one account's hold on a BVN during a wallet opening; no screen | "Let go of an identity hold": paste the blocked person's WAWU account id (or arrive from a support thread with `?account=`), confirm, and see "Released" or "Already released"; the Hub's refusals (no opening, an account with a wallet, a review still going on) are shown in its words. No BVN is taken or shown (`superadmin`, `support`) |
| 3 | `GET /admin/payments/dm-refunds` and its retry exist, on the Flutterwave path (a paid DM refund by `flutterwaveTxRef`) | not drawn: it is the Flutterwave rail the web keeps until after launch, outside the three things this task names, and the route has no declared view type |

Gaps, as rows in `BACKEND_GAPS.md` (nothing built, nothing drawn for them, R-47): the Hub serves **no list of earnings a person has to look at** (R-55: a refusal goes to review 72 hours after the first), **no list of wallet openings that are stuck** (G-37: nothing but the log surfaces them), and **no list of identity holds** (the release route needs the account id). Each is a read the owner's rule "never a new money route" kept this bundle from adding.

Default (lead), owner may override: the three missing lists are gap rows, not built. If the owner allows read-only admin routes over money state, each is a small additive `GET` with the same guard as the routes above, and a section here.

Not done: a real release of a hold (the stand-in has no hold to let go of: the live run shows the Hub's own "no wallet opening with a hold" answer); sales in review.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `wawu-dashboard`'s `CLAUDE.md`, `AGENTS.md` and the guide in `node_modules/next/dist/docs/`
- `scripts/generate-oversight-contract.mjs` (how the wire types of these screens are derived from the Hub source)
- `src/components/oversight/MoneyOversight.tsx`, `src/lib/api/admin-money-oversight.ts`
- Hub `src/money/earnings/admin-earnings.controller.ts`, `src/admin/identity-holds/admin-identity-holds.controller.ts` (`origin/main` `3d33a05`)

## Goal

Finance sees which old sales the sweep will not pay, and support lets go of an identity hold, from the dashboard.

## Scope

`wawu-dashboard` only: `src/components/oversight/`, `src/app/(app)/finance/oversight/`, `src/lib/api/admin-money-oversight.ts`, the oversight generated file, one nav entry and one tab.

## Capability checks

- [x] An admin can read the sales the sweep will not pay, oldest first, and load more (live, three seeded rows, two matched the Hub's filter).
- [x] An admin can try to let go of a hold and sees the Hub's answer in its own words (live: the refusal path; the success path NOT RUN, see above).
- [x] Nothing on the screen moves money or marks a sale paid.
- [ ] A role refused on a section sees a plain refusal for that section only: NOT RUN live (only a superadmin was signed in); each section gates on its own route's role list.
- [ ] On a phone: NOT RUN (no device in this session).
