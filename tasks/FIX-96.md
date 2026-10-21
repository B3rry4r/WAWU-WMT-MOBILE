---
id: FIX-96
title: Every backend rollback.sql stops at its first error, so a guard that raises is never followed by the drops
owner: YOU
area: OPS
order: -96
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: []
passes: [V1, V3]
artboards: []
tier: T1
---
# FIX-96 · Every backend rollback.sql stops at its first error, so a guard that raises is never followed by the drops

## Current state

As of 21 Oct 2026, verifying: built by a Sonnet builder (tier T1; backend `wmt/FIX-96` `d6dd667` on `origin/main` `56e6ec0`; this record on mobile `wmt/FIX-96` from `origin/main` `905e391f`). No schema change, no route, no table: 24 text files gain one line, one new spec, two specs' file readers changed.

- **Why.** Every `prisma/migrations/*/rollback.sql` guards its drops with a DO block that raises while data exists. Run with a bare `psql -f rollback.sql`, psql prints the raise and carries on to the next statement, so the drops still ran and the data was lost. The control run below shows it happening on the old file.
- **R1.** The first line of all 24 rollback files is `\set ON_ERROR_STOP on`; nothing else in any file changed (24 insertions, 0 deletions). Two of the 24 name a Fintava table in a `DROP INDEX` or `ALTER TABLE` (`money_in_notices`, `webhook_body_retention`); neither is only Fintava's (one drops WAWU's `MoneyInNotice` table, the other also drops the Nuvion twin), and the line is text, nothing was run against them.
- **Runners that are not psql.** Searched `src`, `test`, `scripts`, `.github`, `deploy`, `docs`, `package.json`: three specs read a `rollback.sql`. `refund-notice-dash-migration.contract.spec.ts` (pg `Client.query`) and `voice-intro.contract.spec.ts` (Prisma `$executeRawUnsafe`) run the whole file, and a raw `\set` line is a syntax error for them (shown with pg: `syntax error at or near "\"`). Both now read the file and leave out lines that start with a backslash; every assertion is unchanged. `account-deletion-round8.contract.spec.ts` reads only the DO block (`/DO \$\$[\s\S]*?END \$\$;/`), so it is unaffected (checked on the two files it reads: guard found, no backslash line inside it). I did not run that spec: it imports the Fintava double. No script, gate, CI step or doc runs a rollback.
- **R2.** `src/migration-rollbacks/tests/rollback-stop-on-error.spec.ts` (3 tests, no database): finds the rollbacks (at least 24), fails for any `rollback.sql` whose first line is not exactly `\set ON_ERROR_STOP on` (naming the file), and tests its own check on crafted text (missing, after a comment, after a blank line, `off`, trailing space, no value, empty). With the voice-intro rollback's first line deleted locally it failed (1 failed, 2 passed, `20261030140000_voice_intro/rollback.sql: its first line is "-- Rollback of ..."`); with it restored: 3 passed. Log: `fix-96-b/logs/r2-fail.log`.
- **R3.** On a throwaway test database migrated from this branch, with the voice-intro rollback (not Fintava's) run by bare `psql -X -f`:
  - the **old** file with one consent row stored (control): the raise printed, then `DROP TABLE` three times, `VoiceProfile` and the other two tables gone, psql exit 0. The data was lost.
  - the **new** file with one consent row stored: the raise printed and psql stopped at it, exit 3; `VoiceProfile`, `VoiceIntroRun`, `VoiceNamePreview` all still there, the one row still there with its consent line.
  - the **new** file with the row removed: `DO`, `DROP TABLE` x3, exit 0, the three tables gone.
  - `psql -1 -f` with the first line also works (the line in the file is a plain meta-command).
- **Checks (each with an EXIT line in a log):** `tsc --noEmit` EXIT 0; eslint and prettier on the three changed `.ts` files EXIT 0; the new spec, `refund-notice-dash-migration.contract` and `voice-intro.contract` in band, 3 suites, 37 tests, EXIT 0; `npm run test:protected` 2 suites, 253 tests, EXIT 0 (database migrated and seeded with `db:seed` first; the base lock, never relocked); `scripts/gates/run.py` EXIT 0 (0 fail, 131 warn, 88 accepted; no finding names a file of this change); `check_baseline.py` EXIT 0 (124 entries). Mobile: `check_tasks.py --write` EXIT 0 then `check_tasks.py` EXIT 0 (392 tasks); gates (`run.py`, `check_baseline.py`, the 56 gate unit tests) EXIT 0 (0 fail, 17 warn, 0 accepted).
- **Not run:** the whole backend suite (CI runs it); the account-deletion round-8 spec (imports the Fintava double); anything Fintava.
- **Next:** the verifier re-runs R2 (revert one file, see it fail) and R3 on its own database; then the lead merges backend `wmt/FIX-96`. A new migration's rollback must start with the line or the new spec fails the build.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- backend `CLAUDE.md` ("a rollback never loses data"), `prisma/migrations/20261030140000_voice_intro/rollback.sql` (the guard this protects)

## Goal

A rollback that is run with a bare `psql -f` stops where its guard raises and loses nothing.

## Scope

`wawu-backend`: the 24 `prisma/migrations/*/rollback.sql` (one line each), `src/migration-rollbacks/tests/rollback-stop-on-error.spec.ts` (new), and the file readers in `src/notification/tests/refund-notice-dash-migration.contract.spec.ts` and `src/voice-intro/tests/voice-intro.contract.spec.ts`. `wawu-wmt-mobile`: this file, `tasks/INDEX.md`, `docs/PROGRESS.md`, `docs/LOG.md`.

## Capability checks

- [x] Every `rollback.sql` starts with `\set ON_ERROR_STOP on` and nothing else in any file changed.
- [x] A spec fails for any rollback without it (shown failing with one file reverted, passing with it).
- [x] A bare `psql -f` of a guarded rollback stops at the raise with the table and row still there, and with no rows runs to the end (voice-intro rollback, test database).
- [x] No runner that is not psql fails on the new line (the two specs that run a whole rollback skip backslash lines; no script, gate, CI step or doc runs one).
- [x] `tsc`, eslint, prettier, the three specs in band, `npm run test:protected` (base lock), the gates and the baseline check pass.
- [ ] The full backend run (CI, Branch checks, and the deploy's Test job) is green on the head.

## Builder report

- **Files (backend):** 24 `prisma/migrations/*/rollback.sql` (`+\set ON_ERROR_STOP on` as line 1, 24 insertions); new `src/migration-rollbacks/tests/rollback-stop-on-error.spec.ts`; `src/notification/tests/refund-notice-dash-migration.contract.spec.ts` and `src/voice-intro/tests/voice-intro.contract.spec.ts` (the file is read with backslash lines left out; 7 lines each, no assertion touched).
- **Test setup.** Postgres on this machine was down and was started with `service postgresql start`. Database `fix96_wawu_hub_test` (migrated with `prisma migrate deploy`, seeded with `db:seed`) for the specs and `test:protected`; the suite started its own mock WAWU ID on port 7867. Two copies of it (`fix96_ctrl_test`, `fix96_r3_test`) held the R3 runs, because a rollback that runs to the end drops tables. All three dropped at the end.
- **Fintava.** Nothing Fintava was run. Two rollbacks mention a Fintava table name in their SQL (text only, edited by one line, not run).
- **Gate counts.** Backend gates after: 0 fail, 131 warn, 88 accepted, none in a changed file. Mobile: 0 fail, 17 warn, 0 accepted; this task changes no mobile code, only its records.
- **Not done:** CI on the head (the lead watches it).
