---
id: FIX-28
title: The schools order spec tells lower from upper, and the communities list has a tie-break
owner: YOU
area: FIX
order: 326
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [FIX-27]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-28 · The schools order spec tells lower from upper, and the communities list has a tie-break

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-28.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-15` (this branch contains it); API types regenerated from backend `wmt/FIX-28` (48f710d).
- **Built:** `schools-collation.contract.spec.ts` has four new names and one test that pins them, so `lower(` turned into `upper(` in `schools-order.ts` now fails 6 of its 8 tests. `GET /communities` orders by `name`, then `id`; a new spec (`community-list-order.contract.spec.ts`) makes 7 communities on 2 shared names and walks the list at 9 page sizes.
- **Not changed:** any route, contract or migration (migration stamp: none; `20261022160000` unused).
- **Checks (builder):** `lower(` to `upper(` in `schools-order.ts` fails 6 of 8 in `schools-collation`; with the `id` taken out of the communities order the new spec fails 3 of 3 (seven communities seen, five distinct); with both in, `src/community` and `src/schools` pass 204 of 205 locally, the one failure being `community-rooms` "a member sees the last message" (sender name empty, identity lookup, code this change does not touch). `tsc` 0, eslint 0 problems on the three files.
- **CI on backend `72ebba9`:** full suite 3 shards, contract, netns, protected routes, baseline and deploy-in-sync green (runs 38902268343, 38902268194, 38902268311); gates red with the same 16 FAIL lines as main, none in a file this change touches (job 116977138153).
- **Mobile check (file-only branch):** typecheck and lint clean; jest 153 of 155 suites on the full run, the 2 others killed for memory (SIGKILL) and green on rerun (61 of 61); gates 0 fail; tasks index ok.
- **Open:** the verifier's pass.
- **For SCHOOLS-03:** its Read first now carries the `nextCursor` note; the screen already does it.
- **History:** none yet. Reports go to tasks/history/FIX-28.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: the builder's note says lower() to upper() in schools-order.ts fails 6 of 8 schools-collation tests; the verifier measured 4 of 8 (the check still holds). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 3 head, for the owner to merge after batch 2; then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-28.md](history/FIX-28.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
