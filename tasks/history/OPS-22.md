# OPS-22 · round history

Moved out of [tasks/OPS-22.md](../OPS-22.md) word for word, oldest first. The current state is in that file.

## Verifier report

Verifier round 1, 24 Oct 2026 (Sonnet verifier, built none of it). local stack v14dash (Hub 8300 on the Nuvion stand-in and the mock WAWU ID, dashboard dev server 8303), 1440 px, dark and light. Pictures: scratchpad/dash-b14-v/ (settings-1..3, policies-0..5, featured-1..3 in dark and light, role-*-*.png, btn-*.png).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 gates | passed, with notes | as in OPS-20; the two new routes are in `contract/openapi.json` and `contract:build` leaves no diff |
| V6 States | passed | the Hub's refusal for a creator with nothing published shows as written (`featured-2-dark.png`); empty rail state; non-superadmin roles see "Your role cannot open this list" and no controls |
| V7 Flow walk | passed | superadmin featured two creators, moved one up, reloaded and the rail read the saved order (`featured-3-*.png`); finance, support and reviewer see no controls |
| V9 Live seam | passed | `GET /admin/featured-creators` equals the screen; the app's own `GET /explore/featured-creators` (creator token) returns the same order after the move (chidi-creates, v14-third); routes: no token and a user token 401, finance, support, reviewer 403 on both new routes, superadmin 200 (`roles.sh`); order write is one transaction (forced third-write failure left the old order); wrong-set orders are a 400 and move nothing; no protected route changed (253 of 253) |


Role probe on `GET /admin/featured-creators` and `POST /admin/featured-creators/order`: none 401, user 401, superadmin 200 and 400 (set differs), finance 403, support 403, reviewer 403. Additive: 6 files, only two new paths and three schemas in `contract/openapi.json`, the existing `PUT` and `DELETE` untouched.

Checks (verifier, 24 Oct 2026, backend `82bd466`, dashboard `40dff8c`):
- Backend: tsc EXIT 0; eslint without --fix on the 5 changed files EXIT 0; `admin-featured-creators.contract.spec.ts` 7 of 7 EXIT 0; `test:protected` (db:seed first) 253 of 253 EXIT 0 (a first run against the stack's own mock WAWU ID showed 8 red rows, all WAWU ID calls with another service key; the rerun on the suite's own mock is green, the branch is not the cause); route inventories (`publishing-gate-coverage`, `publishing-contract-shape`, `money-moving-coverage`) 70 of 70 EXIT 0; `contract:build` EXIT 0, `contract/openapi.json` no diff; gates 9 run, 1803 files, 0 fail, 135 warn, 88 accepted EXIT 0; check_baseline 124 entries EXIT 0. `git merge-tree` of the branch with backend `origin/main` `b69aa7f` is clean.
- Dashboard: typecheck EXIT 0; lint EXIT 0 (one warning in `scripts/generate-contract-types.mjs`, not this branch); invariants clean (145 files) EXIT 0; contrast 58 pairs EXIT 0; `npm run build` EXIT 0 (all three routes listed); gates 1 fail, the pre-existing `src/app/(app)/finance/payouts/page.tsx:39`, 6 accepted; baseline EXIT 0. `check:contract` and `check:ops-contract` EXIT 1: `setGlobalPrefix not found in src/main.ts`, the generators cannot read backend `origin/main` (the global prefix moved to `hub-app-config.ts`); `scripts/` is not in this diff, so it fails the same on dashboard `origin/main` (B13 repairs it, G-OPS-20-1). `npm test` EXIT 1: the dashboard has no `test` script (not this branch).

Findings:
- No blocker, high or medium.
- LOW, test-gap (OPS-22): the spec has no case where a write fails part way (`a refused order leaves every place as it was` is refused before any write), so a mutant that drops `$transaction` in `reorder` survives. The code is atomic: with a trigger in the test database failing the third update, `POST /admin/featured-creators/order` answered 500 and the old order stood (`atomic.sh` run, before and after rows equal). Kill test: fail the second `tx.featuredCreator.update` and assert the old positions.
