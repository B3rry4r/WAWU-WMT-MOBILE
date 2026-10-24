# OPS-21 · round history

Moved out of [tasks/OPS-21.md](../OPS-21.md) word for word, oldest first. The current state is in that file.

## Verifier report

Verifier round 1, 24 Oct 2026 (Sonnet verifier, built none of it). local stack v14dash (Hub 8300 on the Nuvion stand-in and the mock WAWU ID, dashboard dev server 8303), 1440 px, dark and light. Pictures: scratchpad/dash-b14-v/ (settings-1..3, policies-0..5, featured-1..3 in dark and light, role-*-*.png, btn-*.png).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 gates | passed, with notes | as in OPS-20 |
| V6 States | passed | not published yet starts empty with no wording (`policies-0-empty-dark.png`); a 150 character title is refused by the Hub and its words show (`title must be shorter than or equal to 120 characters`), the live text unchanged; non-superadmin roles see the live text and no controls |
| V7 Flow walk | passed with one defect | superadmin typed two sections, previewed, Publish asked first and named what it replaces, Publish now, reload read it back (`policies-2` to `policies-4`); finance, support, reviewer read only; the preview date line differs from the app (finding) |
| V9 Live seam | passed | `GET /policies/terms` serves exactly the typed title, date and two sections; `/policies/privacy` identical before and after (still not available); `LegalDocument` holds only the terms row; the screen's own source holds no legal wording |


Checks (verifier, 24 Oct 2026, backend `82bd466`, dashboard `40dff8c`):
- Backend: tsc EXIT 0; eslint without --fix on the 5 changed files EXIT 0; `admin-featured-creators.contract.spec.ts` 7 of 7 EXIT 0; `test:protected` (db:seed first) 253 of 253 EXIT 0 (a first run against the stack's own mock WAWU ID showed 8 red rows, all WAWU ID calls with another service key; the rerun on the suite's own mock is green, the branch is not the cause); route inventories (`publishing-gate-coverage`, `publishing-contract-shape`, `money-moving-coverage`) 70 of 70 EXIT 0; `contract:build` EXIT 0, `contract/openapi.json` no diff; gates 9 run, 1803 files, 0 fail, 135 warn, 88 accepted EXIT 0; check_baseline 124 entries EXIT 0. `git merge-tree` of the branch with backend `origin/main` `b69aa7f` is clean.
- Dashboard: typecheck EXIT 0; lint EXIT 0 (one warning in `scripts/generate-contract-types.mjs`, not this branch); invariants clean (145 files) EXIT 0; contrast 58 pairs EXIT 0; `npm run build` EXIT 0 (all three routes listed); gates 1 fail, the pre-existing `src/app/(app)/finance/payouts/page.tsx:39`, 6 accepted; baseline EXIT 0. `check:contract` and `check:ops-contract` EXIT 1: `setGlobalPrefix not found in src/main.ts`, the generators cannot read backend `origin/main` (the global prefix moved to `hub-app-config.ts`); `scripts/` is not in this diff, so it fails the same on dashboard `origin/main` (B13 repairs it, G-OPS-20-1). `npm test` EXIT 1: the dashboard has no `test` script (not this branch).

Findings:
- MEDIUM, defect (OPS-21): the preview prints the date line with a short month. `src/components/policies/policyDraft.ts:74-96` (`MONTHS` holds `Oct`, `Dec`) gives `Updated 5 Oct 2026`, in the preview card and in the `Live in the app` badge (`PolicyEditor.tsx:154`, `:344`). The app's own `updatedLine` (mobile `src/features/about/format.ts`, `MONTHS` written out in full, comment: every phone and the web say it the same way) prints `Updated 5 October 2026`. Repro: publish a terms with date 2026-10-05, open `/policies`, read the preview (`policies-2-dark.png`), compare with `PolicyScreen`. The task says the preview "draws it as the app does". Fix: the same twelve full month names; OPS-21 text row 2 also says `5 Oct 2026` and needs the same edit.
