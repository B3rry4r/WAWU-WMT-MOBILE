---
id: OPS-24
title: Admin dashboard: /join registrations and referral codes (list, make, turn off)
owner: YOU
area: OPS
order: -151
priority: launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: []
decisions: [R-48, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-24 · /join registrations and referral codes

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B15), dashboard `wmt/OPS-23` on `origin/main` `c1dfca6`, Hub read at `origin/main` `3d33a05`. Status review: verifier PASS on 24 Oct 2026 (Sonnet verifier, dashboard `ca16990`, Hub `origin/main` `b69aa7f`), see the verifier report. The pictures are at 1440 px under `dash-b15/` in the builder's scratchpad (light and dark), taken against a local stack (Nuvion stand-in, seeded test rows). No Hub change: the six routes were already served (JOIN-01, REF-01).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | The Hub served the registrations from wawuafrica.com/join (R-48): list, summary, CSV export; the dashboard had no screen | Registrations (`/join`, Join offer section): the offer in four numbers (people paid, money paid, kept for a refund, started and not paid), the split by referral code with a "No code" row, then the table (person, phone, status, amount, code, claimed, registered) with a status filter, an exact referral code, "Registered with no code", paging and Export CSV (the file the Hub builds, saved as its own `fileName`) |
| 2 | The Hub served the referral codes: list, make, change | Referral codes (`/join/referral-codes`): every code with its price, limit, paid, holding one, money paid and state |
| 3 | no way to make a code | New code (superadmin): code, community, price in whole naira (stored as kobo), optional limit; the Hub's own refusal (a price above the offer's standard price) is shown in its words |
| 4 | no way to switch a code | Turn off / Turn on (superadmin) behind a confirm that says people who already paid keep what they paid; a code is never deleted |
| 5 | support and finance see phones and emails; reviewer is refused | roles read off the handlers: reading is `superadmin`, `finance`, `support`; making or switching a code is `superadmin` only (the buttons are not drawn for the others); a refused role sees a plain refusal |

The numbers above the table are for the whole offer; the filters narrow the table and the export only. Registrations are read only: no route changes one, so there is no such control. The access code is not shown (it claims the offer).

Default (lead), owner may override: no offer filter (one offer exists, `event-oct-2026`); a code's community, price and limit are not edited here (only on or off), because "list, make, turn off" is the ask; the price is typed in naira and the Hub checks the ceiling.

Not done: (a) editing a code's price, community or limit (the route exists, `PATCH`; no screen); (b) a per-person detail page (the Hub has no single-registration route).

Verified (24 Oct 2026, live as each of the four admin roles, 1440 px light and dark): the filters and Export CSV work (the file is the Hub's own, byte for byte); a price above the ceiling is refused; a code turns off and on; support and finance see no New code or Turn off. Open: F1 (not this task's), F2 to F5 are lows for the sweep.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `wawu-dashboard`'s `CLAUDE.md`, `AGENTS.md` and the guide in `node_modules/next/dist/docs/`
- `scripts/generate-oversight-contract.mjs` (how the wire types of these screens are derived from the Hub source)
- `src/components/join/`, `src/lib/api/admin-registrations.ts`
- Hub `src/waitlist/waitlist-admin.controller.ts`, `src/waitlist/referral/referral-admin.controller.ts` (`origin/main` `3d33a05`)

## Goal

Staff see who registered at /join and what each referral code did, and make or turn off a code.

## Scope

`wawu-dashboard` only: `src/components/join/`, `src/app/(app)/join/`, `src/lib/api/admin-registrations.ts`, the oversight generated file, two nav entries.

## Capability checks

- [x] An admin can see the registrations and the offer's numbers, split by code (live, eight seeded rows).
- [ ] The status and code filters, and Export CSV: NOT RUN live (not clicked); the filters go to the Hub's own query fields and the export saves the file the Hub builds.
- [x] A superadmin can make a code and see the Hub refuse a price above the ceiling in its own words (live).
- [x] A superadmin can turn a code off and on again behind a confirm (live: PARTNER26 went Off, the confirm for On was drawn).
- [ ] A support or finance admin reads the list and is not offered New code or Turn off: NOT RUN live (only a superadmin was signed in); the buttons are drawn only when `routeAllowsRole` passes for the create route.
- [ ] On a phone: NOT RUN (no device in this session).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OPS-24.md](history/OPS-24.md).

