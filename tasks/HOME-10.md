---
id: HOME-10
title: TGIF reactions, readers and shares
owner: DEV
area: HOME
order: 151
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
