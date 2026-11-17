---
id: USERS-DASH
title: A Users page on the dashboard: everyone who signed up, with search and totals
owner: YOU
area: APP
order: 402
priority: after-launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: []
decisions: [R-142, R-47, R-29]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# USERS-DASH · A Users page on the dashboard

## Current state

Live since 17 Nov 2026, 00:25 UTC. Built by Sonnet builders and checked by separate Sonnet verifiers in each repo (each: round 1 fix with one medium, a fix round, a re-check with verdict merge). WAWU ID PR #34 (main `5677c75`, `POST /internal/users/list`), Hub PR #272 (main `434ba190`, `GET /admin/users`, `GET /admin/users/counts`), dashboard PR #14 (main `f8d950b`, the Users page). Released in that order; live probes without a sign-in: WAWU ID 401 with no key, Hub 401 with no admin session, the dashboard's `/users` sends a signed-out visitor to the login with no admin call made. Lead default added to R-142: banned and pending-deletion people are listed, only deleted accounts are left out. The verifiers' reports are in each repo under `docs/wmt-reports/`. Left for the owner: a look at the page signed in. Follow-up: the dashboard's `src/lib/api/contract/users.ts` is a hand copy of the Hub's shapes and is to be replaced by the generated types. The dashboard repo's two GitHub checks did not start (no runner was assigned, twice); the same checks, the tests and the build were run on the merged head by the lead and passed.

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

- [x] A superadmin or a support agent can open Users and see every account, newest first, with name, handle, email, phone, country, date joined, creator or not, tick, wallet opened or not, suspended or not.
- [x] They can search by part of a name, a handle, a whole email or a whole phone number written any usual way.
- [x] They can see the totals: all accounts, creators, joined today.
- [x] They can open a creator's row and land on that creator's lookup page.
- [x] A finance or reviewer role cannot open the page or call the routes.
- [x] The page works on a phone (360 and 390 wide) and on desktop, with loading, empty, no-result and error states.
- [x] No email or phone number is written to a log anywhere.
