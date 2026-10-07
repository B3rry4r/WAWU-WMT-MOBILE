---
id: HOME-10
title: TGIF reactions, readers and shares
owner: DEV
area: HOME
order: 151
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-10 · TGIF reactions, readers and shares

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

H29-H35 show reactions, readers today and share counts that nothing records today.

## Scope

TgifReaction, TgifRead; GET stats for a date; POST react, read, share.

## Capability checks

- [ ] A user's reaction shows as theirs on reopening, and the count includes it once.
- [ ] 'Readers today' equals distinct readers recorded for that date.

## Builder report

Backend only (`wmt/HOME-10`, uncommitted: the session was told not to commit). Routes, all new, under `/api/hub/tgif`: `GET /tgif/{date}/stats` (Amen per card for all five cards, readers, shares, and the caller's own flags), `POST /tgif/{date}/react` (body `card`, optional `kind`), `DELETE /tgif/{date}/react/{card}`, `POST /tgif/{date}/read`, `POST /tgif/{date}/share`. Files: `prisma/schema.prisma` and migration `20261004144723_tgif_engagement` (`TgifReaction`, `TgifRead`, `TgifShare`), `src/tgif/**` (module, controller, service, pipes, DTO, `tests/tgif.contract.spec.ts`), `src/app.module.ts` (one import), `src/account-purge/account-data-map.ts` (3 OWNED), `src/data-export-request/data-export-sections.ts` (3 sections: day, card, kind, when; own rows), `contract/openapi.json` (regenerated: 5 paths, 0 lines removed). Shared-change rows HOME-10 #1 to #3; gaps G-160 to G-163.

- [x] A user's reaction shows as theirs on reopening, and the count includes it once: spec "a user can say Amen, see it as theirs on reopening..." (POST twice, stats shows `amenByMe` and count+1; another user sees the count without the flag); also take-back twice.
- [x] Readers today equals distinct readers recorded: spec compares `readers` with the row count for the day after a repeat read.
- Races (12 parallel trials, real DB): one person, 12 parallel reacts, reads and shares leave exactly one row each; 12 people at once add exactly 12 to the count; every count equals its rows (counts are computed from rows, there is no counter column). Revert proof: dropping the unique index on `TgifRead` fails 3 tests.
- Blocks: reactions, reads and shares of a hidden person (either direction) are left out of every number the caller sees, in stats and in the write replies; the caller's own rows stay. Revert proof: removing the filter fails the block test. There is no per-person id on these routes, so there is no 404 to differ between hidden and missing.
- Input: `date` must be `YYYY-MM-DD` and a real day (`2026-02-30`, `2024-02-30`, NUL, newline, `%ff` are 400); writes only for yesterday to tomorrow (UTC), reads from 2020-01-01 to tomorrow; `card` and `kind` are exact enum values; `kind: null`, extra fields, arrays, objects, lone surrogates and truncated JSON are 400; never a 500, nothing stored. Revert proof: `IsOptional` instead of `ValidateIf` let `kind: null` through as a 500 (found and fixed by the spec).
- Legacy: no existing route, response or table touched. Protected route suite `scripts/protected-routes/run.sh --fresh` on a fresh database: 253 of 253 jest tests, "all 244 required tests passed".
- Gates and lint: `tsc` 0; eslint clean on every file this task touched; `scripts/gates/run.py` 16 fail / 33 warn, all in files this task does not touch (Flutterwave and wallet files, as on main); baseline check passes. Account purge map and data export map specs pass.
- Full `npm run test:contract` compared by test name against origin/main (38bbe4c): 843 failed on this branch (unseeded h10_ database, 52 suites) against 1321 on main in the same kind of database; by test name, 0 tests fail here that pass on main once the 37 timing-sensitive ones that failed only while two full runs shared the machine (`fintava-stall` 34, `data-export-request` 3) are re-run alone: 123 of 123 pass on both. 9 new tests, all pass. The main run was noisier (it ran beside this one), so the figure is a by-name comparison, not a count match.
- NOT RUN: merge of the newest origin/main (a94f338, SETTINGS-02) into the branch, because the session was told not to commit. Rehearsed in a throwaway worktree: `git apply --3way` conflicts only in `prisma/schema.prisma` (both sides append a model at the end; keep both), then `prisma migrate deploy` applies cleanly, `migrate diff` shows only main's own `DROP INDEX "ContentPiece_specializations_idx"`, `tsc` is clean, `npm run contract:build` adds 317 lines and removes 0, and the tgif, purge and export-map specs pass (18 of 18). The lead must merge, then run `npx prisma generate` and `npm run contract:build`. V9 against the app: no screen calls these routes yet (HOME-09 does), so the live seam is the contract spec through real tokens from the mock WAWU ID.
- Defaults (agent), owner may override: five card slugs `verse`, `reality`, `remember`, `prayer`, `takeaway` (the five H29 to H34 cards); `kind` is `amen` only; one reaction per person per card per day, take-back is `DELETE`; readers and shares are one per person per day, a repeat answers `counted: false`; the day is the phone's calendar day, writes held to yesterday..tomorrow UTC; the second count on the cards is not served (G-160); shares are per day, not per card.

## Verifier report

Verdict: **PASS**. No open defects. Verifier session was separate from the builder. Own databases `h10v_*`, own mocks on :4721 and :4723 (the :4001 mock belonged to another agent and was not touched). Nothing committed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 (gates, tsc, specs) | passed | `tsc --noEmit` 0; `prisma validate` valid; tgif spec 9/9, account-data-map and data-export-map specs pass; mobile `npm run check` exit 0 (gates 195 files, 0 findings; 207 tasks), no `tasks --write` needed |
| V2 (contract and input) | passed | Builder spec re-run, plus a throwaway probe spec (deleted afterwards, worktree clean): 401 with no token and a junk token on all five routes; forged `amen`/`readers` in the body is 400 and counts come from rows; delete of a reaction you do not have answers 200 with no row written and another user's reaction untouched; 15 trials each of 10 parallel same-user react/read/share plus 8 other users, every count equal to its rows and one row per person per day; raw SQL INSERT of a bad card or kind is refused by the CHECKs; blocker, blocked and bystander views correct in both directions |
| V3 (existing routes) | passed | `scripts/protected-routes/run.sh --fresh wmt/HOME-10` on a fresh `h10v_protected_test`: 253/253 jest, "all 244 required tests passed". `contract:build`: no diff against the committed file; 0 lines removed against origin/main (317 added). Schema: `git diff origin/main -- prisma/schema.prisma` shows additions only |
| V4 (data) | passed | Migration replay on a scratch db from empty, then rollback (DROP the 3 tables, delete the migration row), then redeploy: tables gone, then back. `migrate diff` after replay shows only main's own `DROP INDEX ContentPiece_specializations_idx`. CHECKs on kind and card present and enforced. Purge map and export map cover the 3 tables (export reads `userWawuId = me` only, no other person's rows). Dropping the `tgifShares` export section in a scratch copy fails data-export-map (1 failed); dropping the TgifRead purge rule fails account-data-map (1 failed); both restored byte-identical |
| V9 (live seam) | passed with a note | Real tokens from the mock WAWU ID through the real Nest stack and real Postgres. No screen calls these routes yet (HOME-09), so there is no app seam to walk |

Revert proofs, spot-checked 4 in scratch and restored (9/9 green after): drop unique index on TgifRead fails 3; no block filter fails 1; `IsOptional` for `ValidateIf` fails 1; no write date window fails 1.

Full `npm run test:contract`, seeded dbs, by test name, branch against a separate origin/main (a94f338) worktree `/home/user/lanes/h10v/main`: branch 3409 pass / 262 fail of 3674; main 3357 / 305 of 3665. 0 tests fail on the branch that do not also fail on main; 43 fail only on main (env noise); the 9 extra tests on the branch are the new tgif tests, all passing. Failures on both are the known environment ones; not re-run alone one by one.

Findings:
1. low, `unclear` (Default (agent), owner may override): DELETE of a reaction you do not have answers 200 with the current state, not 404. The task allowed either; it is a clean no-op with no side effect, which suits take-back twice.
2. low, note: protected-route and contract runs used the committed branch head `1a4f92c`; the working tree was clean, so that is the code reviewed.

NOT RUN: a run of the mobile app against these routes (no screen calls them yet); each of main's env-caused failures re-run alone.

## Lead merge note (6 Oct 2026, merge train)

Merged in train wmt/TRAIN-1 (second of eight), verifier PASS with no defect open (backend 1a4f92c). Backend migration renamed from `20261004144723_tgif_engagement` to `20261005100000_tgif_engagement`: the old timestamp sorted before ME-16's `20261004200000`, which is earlier in train order. The rollback note inside the SQL and the SHARED-CHANGES row HOME-10 #1 name the new folder; nothing else referenced the old one. The merge itself was clean (the builder's NOT RUN item, merging main a94f338, is now done by the train). No interaction needed a fix.

Open follow-ups from the verifier: no screen calls these routes yet (HOME-09 does), so V9 through the app is NOT RUN; a take-back (`DELETE`) of a reaction you do not have answers 200 with the current state, a recorded default (agent), owner may override.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
