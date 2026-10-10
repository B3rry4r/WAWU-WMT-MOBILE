---
id: FIX-28
title: The schools order spec tells lower from upper, and the communities list has a tie-break
owner: YOU
area: FIX
order: 271
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [FIX-27]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-28 · The schools order spec tells lower from upper, and the communities list has a tie-break

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-27.md` (its verifier report: D1, N1, N2, and the builder's D7)

## Goal

Two small follow-ups from FIX-27, merged by lead ruling because production deploys were blocked on it:
1. **The order spec's gap (FIX-27 verifier D1).** `schools-collation.contract.spec.ts` passes if `lower(` becomes `upper(` in `schools-order.ts`, although 97 of 170 positions change (`[ \ ] ^ _` and the back-quote move relative to letters). Add names that tell them apart (for example `"A_B School"` beside `"AB School"`, and `"_Under First"`), so that mutant fails.
2. **Communities paging (FIX-27 builder D7).** `GET /communities` orders by `name` alone and the name is not unique, so equal names can repeat or be skipped between offset pages. Add an `id` tie-break, with a spec of two communities sharing a name across a page edge.

## Scope

- Specs and a one-line order change only; no route, contract or migration change.
- Note for SCHOOLS-03 (FIX-27 verifier N1): the directory screen continues on `nextCursor`, never on a full page (a school hidden between the two reads shortens a page).

## Capability checks

- [ ] Changing `lower(` to `upper(` in `schools-order.ts` fails a spec.
- [ ] Two communities with the same name never repeat or go missing across pages.
- [ ] Protected suite 253/253; full suite green.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
