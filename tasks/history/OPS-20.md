# OPS-20 · round history

Moved out of [tasks/OPS-20.md](../OPS-20.md) word for word, oldest first. The current state is in that file.

## Verifier report

Verifier round 1, 24 Oct 2026 (Sonnet verifier, built none of it). local stack v14dash (Hub 8300 on the Nuvion stand-in and the mock WAWU ID, dashboard dev server 8303), 1440 px, dark and light. Pictures: scratchpad/dash-b14-v/ (settings-1..3, policies-0..5, featured-1..3 in dark and light, role-*-*.png, btn-*.png).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 gates | passed, with notes | backend and dashboard lines below; two contract generators red on `origin/main` as well |
| V6 States | passed | refused figure `popular_community_min_members must be 1 or more.` shown word for word and nothing saved (`settings-3-dark.png`); reviewer gets the Hub's 403 as a permission message; read-only badge for support |
| V7 Flow walk | passed | superadmin, finance, support and reviewer each signed in through the real login and opened `/settings` (`role-*-settings.png`): superadmin and finance can save (no read-only note), support reads only, reviewer sees HTTP 403 |
| V9 Live seam | passed | Pack S points saved 1100: the app's `GET /plans` (creator token) went 1000 to 1100, `Set by an admin` showed, `Use the default` sent null and `GET /plans` read 1000 again; TGIF time saved 07:30 (default 07:00), set, then back to default; 82 settings, 59 provisional as claimed |


Shared icon Button (`px-0!`): the change sits inside `iconOnly && (...)`, so a button with text keeps its exact classes. The only other icon-only button on `origin/main` is the header sign-out (`AdminMenu.tsx:39`); its strip is pixel-identical on Overview, KYC, Payments and Shop (`btn-*.png`, 0 differing pixels) and the icon draws whole (`btn-kyc.png`).

Checks (verifier, 24 Oct 2026, backend `82bd466`, dashboard `40dff8c`):
- Backend: tsc EXIT 0; eslint without --fix on the 5 changed files EXIT 0; `admin-featured-creators.contract.spec.ts` 7 of 7 EXIT 0; `test:protected` (db:seed first) 253 of 253 EXIT 0 (a first run against the stack's own mock WAWU ID showed 8 red rows, all WAWU ID calls with another service key; the rerun on the suite's own mock is green, the branch is not the cause); route inventories (`publishing-gate-coverage`, `publishing-contract-shape`, `money-moving-coverage`) 70 of 70 EXIT 0; `contract:build` EXIT 0, `contract/openapi.json` no diff; gates 9 run, 1803 files, 0 fail, 135 warn, 88 accepted EXIT 0; check_baseline 124 entries EXIT 0. `git merge-tree` of the branch with backend `origin/main` `b69aa7f` is clean.
- Dashboard: typecheck EXIT 0; lint EXIT 0 (one warning in `scripts/generate-contract-types.mjs`, not this branch); invariants clean (145 files) EXIT 0; contrast 58 pairs EXIT 0; `npm run build` EXIT 0 (all three routes listed); gates 1 fail, the pre-existing `src/app/(app)/finance/payouts/page.tsx:39`, 6 accepted; baseline EXIT 0. `check:contract` and `check:ops-contract` EXIT 1: `setGlobalPrefix not found in src/main.ts`, the generators cannot read backend `origin/main` (the global prefix moved to `hub-app-config.ts`); `scripts/` is not in this diff, so it fails the same on dashboard `origin/main` (B13 repairs it, G-OPS-20-1). `npm test` EXIT 1: the dashboard has no `test` script (not this branch).

Findings:
- No blocker, high or medium.
- LOW, unclear (OPS-20): the save toast says the app and the Hub use the new figures "from the next request". The Hub reloads at once in the process that saved and in the others within `PLAN_SETTINGS_REFRESH_SECONDS` = 15 (`plan-settings.service.ts:32`). True on one process; another process can answer with the old figure for up to 15 seconds.
- Notes: the reviewer live check the builder left NOT RUN is now run (403 shown as a permission message).
