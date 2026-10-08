---
id: FIX-16
title: The dashboard and the web catch up with admin takedowns
owner: YOU
area: FIX
order: 187
priority: launch
repo: wawu-dashboard, wawuafrica
type: admin-screen
status: todo
depends_on: [FIX-06]
decisions: []
passes: [V1, V6, V7, V9]
artboards: []
---
# FIX-16 · The dashboard and the web catch up with admin takedowns

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/FIX-06.md` (the backend: takedown, relist, the admin and owner visibility reads, the 409 `listing_taken_down`)
- wawu-dashboard `src/components/professionals/ProfessionalDecisionPanel.tsx`; wawuafrica `src/lib/api/professionals.ts` and the listings page that calls it. Follow each repo's CLAUDE.md.

## Goal

FIX-06 makes an admin's unlist hold. Two surfaces still say otherwise: the dashboard's unlist toast tells the admin "They can be shown again by flipping it back" (untrue once FIX-06 is live), and has no way to list a taken-down professional again or to tell a takedown from the person's own Hide; the web's listings page swallows the new 409 and its pill keeps saying "Listed".

## Scope

Dashboard: the professional's panel reads the admin visibility route and shows Listed, Hidden by them, or Taken down (with the date); a "List again" action calls relist (same roles as unlist), with a confirm; the unlist toast says the listing stays hidden until an admin lists it again. Web: the listings page shows a plain sentence for `listing_taken_down` and the pill reads the real state. On the web's apply form, a field whose listing an admin took down says so (from the owner's visibility read), instead of main's 409 sentence "You are already listed as a professional in this category." No em-dashes. Ship together with or right after FIX-06's backend deploy.

## Capability checks

- [ ] An admin unlists, sees "Taken down" with the date, lists it again, and sees the person's own choice restored.
- [ ] The dashboard's unlist toast no longer says the person can flip it back.
- [ ] On the web, a person whose listing was taken down sees why, and the pill never says "Listed" for it.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
