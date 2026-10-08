---
id: FIX-06
title: An admin's unlist cannot be undone by the professional
owner: YOU
area: FIX
order: 186
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [PROS-02]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-06 · An admin's unlist cannot be undone by the professional

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/PROS-02.md` (the professionals backend) and `tasks/PROS-03.md` ("Verifier report, independent (lead)", Outside this task)

## Goal

Found by PROS-03's independent verifier (8 Oct 2026): the admin "unlist" route writes the same `listed = false` as a professional's own Hide, so the professional can Show again a listing an admin pulled. An admin's decision must hold until an admin reverses it.

## Scope

Keep the admin's unlist apart from the person's Hide (for example its own column or state with who set it and when), so the person's Show cannot list a profile an admin unlisted, and the person's P8 says it was taken down (the app's wording comes from PROS-03; this task returns a state the app can read). Existing rows keep their meaning: a migration with a backfill that treats today's `listed = false` rows as the person's own Hide unless an admin audit row says otherwise. If the admin route is on the protected list, its answers stay the same; say which routes are protected.

## Capability checks

- [ ] An admin unlists a listing; the professional's Show answers a refusal and the directory still hides it.
- [ ] An admin lists it again; the professional can Hide and Show as before.
- [ ] A professional's own Hide and Show behave exactly as today.
- [ ] Protected routes 253/253; any web caller of the admin route sees the same answer.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
