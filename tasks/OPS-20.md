---
id: OPS-20
title: Admin settings screen: points, TGIF time, thresholds and every plan figure the Hub serves
owner: YOU
area: OPS
order: -146
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-47, R-65]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-20 · Admin settings screen

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B14 with OPS-21 and OPS-22): dashboard `wmt/OPS-20` `40dff8c` on `origin/main` `c1dfca6`. The Hub already serves `GET` and `PATCH /admin/plan-settings` (backend `origin/main` `3d33a05`), so no backend change. Status verifying. Default (lead), owner may override: the screen sits under a new "App" nav section as "Settings".

| # | Before | After |
|---|---|---|
| 1 | no screen for the Hub's settings; a figure was changed by a request by hand | `/settings` lists all 82 settings in the Hub's own groups (points, TGIF time and notice days, popular-community size, community credit costs, tiers, packs, referral rungs, AI tool costs, event passes, and the rest), each with its default, who last set it, and where it is used |
| 2 | a figure the owner has not named was only a note in the seed | each such setting carries a Provisional mark with the Hub's reason (59 of 82 on the stack) |
| 3 | no way to check a figure before it reached the app | a save is `PATCH` as typed and the Hub's own check answers: a refused figure shows the Hub's message word for word (`popular_community_min_members must be 1 or more.`) and nothing in the request is saved; the screen holds no rule of its own |
| 4 | no way back to a default | "Use the default" sends `null` for the key; a set figure shows "Set by an admin" |

Roles follow the Hub: superadmin, finance and support read; superadmin and finance save; other roles see the screen read only (reviewer gets the Hub's 403 as a permission message). One save is one group (the Hub saves every key in a request or none).

Live look: local stack (Hub, Nuvion stand-in, mock WAWU ID), a seeded superadmin, the dashboard dev server at 1440 px. Saved the TGIF time to 07:30 (shown as set, default 07:00), tried 0 for the popular-community size (refused with the Hub's words). Pictures: `scratchpad/dash-b14/settings-1.png`, `settings-3.png`, `settings-4.png`.

Open: (a) the wire types are in `src/lib/api/contract/settings-policies-featured.ts`, copied field by field from the backend types, because `generate-contract-types.mjs` and `generate-ops-contract.mjs` stop on the current backend (`setGlobalPrefix not found in src/main.ts`) and another branch (B13) is repairing them; fold them into `generated.ts` once that merges (`G-OPS-20-1`). (b) The shared icon-only Button kept its size padding and drew its icon as a dot (the sign-out icon too); one line, `px-0!`, fixes it (SHARED-CHANGES OPS-20 #2). (c) `nav.ts` gained an "App" section; another dashboard branch edits the same file, so the merge may need a hand join.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- Backend `src/admin/plan-settings/`, `src/plan-settings/plan-settings.service.ts`, `plan-setting-registry.ts`

## Goal

An admin can read every setting the Hub serves, see which are provisional, and change one with the Hub's own checks.

## Scope

`wawu-dashboard`: `src/components/settings/`, `src/lib/api/admin-plan-settings.ts`, `src/lib/api/contract/settings-policies-featured.ts`, `src/app/(app)/settings/`, the nav entry, the shared Button padding.

## Capability checks

- [x] An admin can open Settings and see every group the Hub serves, with defaults and provisional marks (live, 82 settings).
- [x] An admin can change the TGIF time, save it, and see it set; the Hub's refusal of a bad figure is shown as the Hub wrote it.
- [x] A role that cannot save sees no save button (superadmin and finance only).
- [ ] A reviewer role live: NOT RUN (only a superadmin was seeded); the role gate is read off the controller's `@AdminRoles`.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: none yet.
