---
id: COMPLETE-01
title: Unbuilt entries are drawn and inert, and a gate keeps them honest
owner: YOU
area: SHARED
order: 237
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [SHARED-04]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6]
artboards: []
---
# COMPLETE-01 · Unbuilt entries are drawn and inert, and a gate keeps them honest

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `scripts/gates/run.py`, `scripts/gates/checks/dead_controls.py`, `scripts/gates/gates.config.json`, `scripts/gates/tests/`

## Goal

R-46: every screen draws its whole artboard; an entry whose screen is not built is drawn and does nothing. This task adds the one way to write that, and the gate that stops it rotting: an inert entry always names the task that will wire it, and the build fails once that task is built and the entry is still inert.

## Scope

- `src/lib/unbuilt.ts` (or the place `docs/WORKFLOW.md` section 4 puts shared helpers): `unbuilt(task: TaskId): () => void` returns one stable no-op per task id (safe in dependency arrays). No toast, no log in release.
- `scripts/gates/checks/unbuilt_entries.py`, on by default in `gates.config.json`: finds every `unbuilt('<ID>')` in `src/`; fails when the id has no task file, when that task's status is `review` or `done`, or when the argument is not a string literal. Prints a list of inert entries by task (a `--list` flag or the gate's own output).
- Gate tests in `scripts/gates/tests/` for each failure and a pass.
- No screen changes here (COMPLETE-02 to COMPLETE-06 use it).
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [x] A screen can write `onPress={unbuilt('ME-03')}` and tapping it does nothing. `src/__tests__/unbuilt.test.ts`: the same id gives the same function every call, a different id a different one, and calling it (bare or with a press event) returns `undefined` and calls none of `console.log/info/warn/error/debug`. No screen uses it yet (COMPLETE-02 to COMPLETE-06 do), so no on-screen tap was tested here.
- [x] The gate fails for an unknown task id, for a built task, and for a non-literal argument; passes otherwise (tests). `scripts/gates/tests/test_unbuilt_entries.py`, 31 tests, one class per failure (`UnknownTask`, `BuiltTask`, `NotOneLiteral`) plus `Passes`, `Comments`, `Listing`, `Registered`. Also run by hand over a planted screen on the real tree: review, unknown id and a variable each printed FAIL and exit 1; the other three printed as inert.
- [x] `dead_controls` still fails an empty handler (`() => {}`). `scripts/gates/tests/test_dead_controls.py` (3 tests, none existed before): seven empty-handler forms fail, `onPress={unbuilt('ME-03')}` and a real handler pass. Mutant D1 (the empty-handler pattern deleted) fails it.
- [ ] Every element on each artboard is on the built screen. NOT APPLICABLE here: this task has `artboards: []` and changes no screen. The element tables belong to COMPLETE-02 to COMPLETE-06.
- [x] `npm run check` exit 0, as one command, on the branch with origin/main (907c3c5) merged: typecheck, lint, 96 suites / 1608 tests (main: 95 / 1606; the two added are the helper's), gates 10 run (was 9), 398 files scanned, 0 findings, 0 baseline entries, task check 269 tasks.

## Builder report

Branch `wmt/COMPLETE-01`. Mobile only, no package change, nothing under `src/features` or `src/app` touched.

**What changed**
- `src/lib/unbuilt.ts` (new): `unbuilt(task: TaskId): () => void`, `TaskId = ` + "`${Uppercase<string>}-${number}`" + `. One no-op per id, kept in a Map, so it is the same function every call and safe in dependency arrays. No toast, no log, no navigation, in any build.
- `scripts/gates/checks/unbuilt_entries.py` (new) and its entry in `scripts/gates/gates.config.json`, on by default. Reads ids and statuses from the front matter of `tasks/*.md` (skipping `INDEX.md` and `TEMPLATE.md`, as `check_tasks.py` does) and every `unbuilt(...)` in `src/` (test files skipped, like `dead_controls`). FAIL: the id has no task file; the task is `review` or `done`; the argument is not exactly one string literal (variable, `${}` template, concatenation, cast, second argument, no argument); the task has a status the gate does not know. WARN, one line per task: the entries still inert (`todo`, `building`, `verifying`) with the task title, status, count and files; `--gate unbuilt_entries --json` carries every call site. Nothing is printed for the gate when no entry is inert.
- The gate reads source with a small scanner that blanks comments and string contents first, so a call named in a comment or a string is not a call, `//` inside `'https://...'` does not hide a later call, and an apostrophe in JSX text (`Don't`) does not start a string. The helper's own `function unbuilt(` declaration is not a call.
- `scripts/gates/tests/test_unbuilt_entries.py` (31 tests) and `test_dead_controls.py` (3 tests); `src/__tests__/gates.test.ts` already runs the whole folder inside `npm test`, so `npm run check` covers them. `src/__tests__/unbuilt.test.ts` (2 tests) for the helper.
- `docs/WORKFLOW.md` "Links between screens": one bullet now says to import from `@/lib/unbuilt`, what the gate fails on, and how to list the inert entries.
- Task file status `verifying`, a `docs/LOG.md` line, `check_tasks.py --write` run (INDEX.md and PROGRESS.md regenerated).

**Mutants of my own against the gate** (each one edit, `python3 -m unittest discover -s scripts/gates/tests` run, original restored after; every one made at least one test fail). Script: scratchpad `c01/mutants.py`.
M1 `review` no longer counts as built (test_review_fails). M2 `done` no longer counts as built (test_done_fails). M3 an unknown id is let through (15 tests). M4 any argument accepted as a literal (14). M5 comments not blanked (2). M6 string contents not blanked (20). M7 the `function unbuilt(` declaration counted as a call (1). M8 test files scanned (3). M9 gate registered `enabled: false` (1). M10 inert entries not listed (13). M11 apostrophes in JSX text start a string (1). M12 a `${}` template read as a plain literal (3). M13 an unknown status passes (4). M14 the id read from the file name instead of the front matter (1). D1 `dead_controls` empty-handler pattern deleted (3).
Helper mutants against `unbuilt.test.ts`: H1 new function every call, H2 `console.log` in the handler, H3 one shared function for every id, H4 returns a value. All four fail a test; the file passes again once restored. Two mutants (M1, M2) first survived because an unknown status also fails; the review and done tests now assert the message "so its screen is built", which killed them.

**Counts, before and after** (`npm run check`): main 907c3c5 per BRAND-01's verifier, 95 suites / 1606 tests, 9 gates, 0 findings. This branch: 96 suites / 1608 tests, 10 gates, 398 files, 0 findings. Gate unit tests inside jest: 44 (were 10).

**Secret scan** of the staged diff: no key-shaped string (no long hex or base64 run, `sk_`, `FLWSECK`, bearer token or private-key header).

**Decisions (Default (agent), owner may override)**
- The helper is `src/lib/unbuilt.ts`, imported as `@/lib/unbuilt`. WORKFLOW section 4 names no home for shared helpers; the task file names this one.
- The inert list is the gate's own output (a WARN per task), not a `--list` flag, so `scripts/gates/run.py` is unchanged. A warning never fails the run.
- A task whose status is not one of the five the task check knows fails the entry rather than passing it, because the gate cannot tell whether its screen is built.
- `TaskId` is a template-literal type, not a generated union of task ids, so the type does not need regenerating when a task is filed; the gate does the real check.
- A no-substitution backtick string (`unbuilt(`ME-03`)`) counts as a string literal; a template with `${}` does not.

**Limits of the gate (stated, not hidden)**: it reads the call by name. `import { unbuilt as x }` or `const f = unbuilt; f(id)` is not seen; the import line is the only place the name appears, and tests are skipped. Nothing in `src` does either today.

**NOT RUN**
- Pictures (V5) and states (V6): this task draws no screen. They are COMPLETE-02 to COMPLETE-06's.
- Tapping an inert entry in a rendered screen: no screen uses `unbuilt` yet. Unblocked when COMPLETE-02 (Explore) lands; its tests assert "tapping it opens nothing".
- A phone check (V10): no device touched.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
