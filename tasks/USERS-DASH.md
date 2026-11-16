---
id: USERS-DASH
title: A Users page on the dashboard: everyone who signed up, with search and totals
owner: YOU
area: APP
order: 402
priority: after-launch
repo: wawu-dashboard
type: admin-screen
status: building
depends_on: []
decisions: [R-142, R-47, R-29]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# USERS-DASH · A Users page on the dashboard

## Current state

Cut 16 Nov 2026 by the lead from the owner's question (R-142). Three builders dispatched the same hour (Sonnet, T2), branch `wmt/USERS-DASH` in each repo: WAWU ID (the internal read), Hub (`GET /admin/users`, `GET /admin/users/counts`), dashboard (the page). Nothing merged.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, `DECISIONS.md` R-142
- Dashboard: `src/components/layout/nav.ts`, `src/components/creators/` and `src/lib/api/admin-creators.ts` (the nearest screen), `src/components/places/`
- Hub: `src/admin/creators/` (roles, list shape), `src/admin/geo/`
- WAWU ID: `src/auth/internal.controller.ts`

## Goal

The owner opens Users and sees every Who Made This account in one list, finds a person by name, handle, email or phone, and sees the totals. Today the dashboard has a creator lookup (creators only, no email or phone) and counts by country, and no list of everyone.

## Scope

- `wawu-id`: one internal, key-protected read, `POST /internal/users/list` (search, paging, or a set of ids). Nothing public.
- `wawu-backend`: `GET /api/hub/admin/users` and `GET /api/hub/admin/users/counts`, superadmin and support, read only, additive; the Hub stores no name, email or phone.
- `wawu-dashboard`: the Users page under Support, with its nav row.

## Capability checks

- [ ] A superadmin or a support agent can open Users and see every account, newest first, with name, handle, email, phone, country, date joined, creator or not, tick, wallet opened or not, suspended or not.
- [ ] They can search by part of a name, a handle, a whole email or a whole phone number written any usual way.
- [ ] They can see the totals: all accounts, creators, joined today.
- [ ] They can open a creator's row and land on that creator's lookup page.
- [ ] A finance or reviewer role cannot open the page or call the routes.
- [ ] The page works on a phone (360 and 390 wide) and on desktop, with loading, empty, no-result and error states.
- [ ] No email or phone number is written to a log anywhere.
