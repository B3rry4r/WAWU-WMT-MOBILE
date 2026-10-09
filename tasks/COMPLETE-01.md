---
id: COMPLETE-01
title: Unbuilt entries are drawn and inert, and a gate keeps them honest
owner: YOU
area: SHARED
order: 237
priority: launch
repo: wawu-wmt-mobile
type: component
status: review
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

Fresh Sonnet verifier, 9 Oct 2026, branch `wmt/COMPLETE-01` at 620b70f (detached worktree). I wrote none of this code and changed none on the branch: every plant and mutant ran in scratch copies made with `git archive`, restored by checksum. Evidence folder: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vcomplete-01/` (`cases/` has the scripts and their `.out`; `check_*.txt`, `gates_*.txt`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` exit 0 on 620b70f: typecheck 0 errors, lint 0 errors (2 warnings, both in `src/features/events/__tests__/eventsFocus.test.tsx`, not this branch), 96 suites / 1608 tests, gates 10 run, 398 files scanned (every one of the 398 non-generated `.ts`/`.tsx` under `src/`), 0 findings, 0 baseline entries, task check 269 tasks (`check_branch.txt`). After a trial merge of origin/main 7e74460 (local commit, never pushed): exit 0, 96 / 1608, 10 gates, 398 files, 0 findings, 270 tasks (`check_trial_merge.txt`). The merge conflicts in `docs/PROGRESS.md` (a generated file, both sides moved the counts); `python3 scripts/tasks/check_tasks.py --write` resolves it. Whole gates suite, main 7e74460 vs branch: 9 gates / 396 files / 0 findings vs 10 / 398 / 0; the two outputs differ only in that counts line (`gates_main.txt`, `gates_branch.txt`); `check_baseline.py` 0 entries on both; gate unit tests 10 on main, 44 on the branch, all OK. A planted `unbuilt('PROS-03')` (PROS-03 is `review`) in a scratch copy made `npm run check` exit 1 after typecheck, lint and all 1608 tests passed, at the gates step (`check_planted.txt`). |
| V5 Picture | NOT RUN | The task has `artboards: []` and changes no file under `src/features` or `src/app`, so there is no built screen to put beside `render_design.py`. Unblocked when COMPLETE-02 (Explore) lands a screen that uses `unbuilt`; its own V5 covers the picture. |
| V6 States | passed for the states this task owns, NOT RUN for any screen state | Gate states reached through the real `scripts/gates/run.py` and its exit code: inert and listed (`todo`, `building`, `verifying`), FAIL for a `review` task, a `done` task, an unknown id, a lower-case id, ids with spaces or quotes, a variable, a `${}` template, concatenation, two arguments (`cases/cases1.out`, `cases/cases2.out`, `cases/cases3.out`: 99 planted sources). The tap, on the real shared components: in a scratch jest test, `ListRow` and `Button` with `onPress={unbuilt(...)}` accept the handler under tsc, a press changes nothing in the rendered tree, calls no mocked router method, prints nothing, shows no "soon" text; an effect, a memo and a callback keyed on the handler ran once across three renders (scratch only, not added to the branch). On-screen state of a real screen: NOT RUN, no screen uses `unbuilt` yet; unblocked by COMPLETE-02. |

**A flake, reported.** One `npm run check` run made after my report edits failed 1 of 1608 tests: `src/features/events/__tests__/eventsScreens.test.tsx` ("a user sees when a tier ended ... Ended 6 Oct", with React's "overlapping act() calls" warnings) at load average 5.5 while other agents ran jobs. That file passed alone twice (47 of 47), and the next full `npm run check` on the same tree exited 0 (96 suites, 1608 tests, 10 gates, 398 files, 0 findings, 269 tasks; `check_report2.txt`). No events file differs between this branch and main, so it is a timing flake, not this task.

**Diff against the report.** `git diff --stat 7e74460...620b70f` is 10 files, exactly the builder's list (helper, helper test, gate, config, two gate test files, WORKFLOW bullet, task file, LOG, PROGRESS). `dead_controls.py` and `run.py` are untouched. No em-dash and no banned phrase in any added line. `scripts/**` is a fenced path, but the ticket's scope names the gate and its config, so it is in scope. No stand-in copy of anything main has.

**Capability checks as written.** 1. Same id gives the same function, another id another; bare call and call with an event return `undefined`; no `console` method called: passed (`src/__tests__/unbuilt.test.ts`, and in my probe against real `ListRow`/`Button`). 2. Gate fails unknown id, built task, non-literal; passes otherwise: passed (my 99 planted cases below, not the builder's). 3. `dead_controls` still fails `onPress={() => {}}` and `onPress={noop}`, and `unbuilt` does not trip it: passed (planted file, `exit 1` with two dead_controls FAILs and three inert warnings together). 4. Artboard elements: not applicable here, agreed. 5. `npm run check`: passed (V1).

**The helper.** `unbuilt(task)` returns one `() => undefined` per id from a `Map`: stable, no side effect. The type `${Uppercase<string>}-${number}` accepts all 269 real task ids (compiled each one with tsc 6.0.3) and refuses a variable, a number, no argument and a second argument; it refuses `me-03`, `ME-`, `ME03`, `''`, `03`, `ME-03b`, `ME-03-04`. It also ACCEPTS 18 of 30 junk probes (`'ME 03-03'`, `'ME-03 '`, `"ME'-03"`, `'ME-0x10'`, `'ME-1e3'`, `'ME-3.5'`, `'ME- 3'`, `'ME$-03'`, `'-03'`, `'MÉ-03'`, `'../ME-03'`), because `Uppercase<string>` and `${number}` are loose (`cases/types.out`). The gate fails every one of them (no such task file), so the build cannot go green on them. The type is not tested anywhere (mutant H5).

**The gate, planted cases** (`cases/cases1.out`, `cases2.out`, `cases3.out`; each run through the real `run.py --json`, expected vs got):
- Behaved as the brief wants (43 of the 59 in `cases1.out`, all 26 in `cases2.out`, all 14 in `cases3.out`): `ME-03` todo passes and is listed inert; `PROS-03` (review) FAIL; `ADS-03` (done) FAIL; unknown `ZZZ-99` FAIL; `me-03` FAIL; `'ME 03'`, `'ME-03 '`, `"ME'03"`, `'ME\'03'`, `'ME-03\n'` FAIL; variable FAIL; `` `ME-${n}` `` FAIL; call split over lines, `unbuilt ( 'ME-03' )`, name and paren on separate lines, call in JSX props, in an object literal in a `.ts` file, in a `.tsx` file: all seen; calls inside `//`, `/* */`, a JSX comment, a JSDoc, a single, double and template string: ignored; a call after a `"https://..."` string, after a division, a glob string, a nested template, an escaped backslash, CRLF, a BOM, a generic arrow, `?.unbuilt(`, `ns.unbuilt(`, in `src/app/(tabs)/...`: seen; a regex with `\/\/` or a quote or a double quote on the line before: seen; `*.test.tsx` and `__tests__/` files: ignored; a wrapper `(id) => unbuilt(id)`: FAIL (non-literal); `o.unbuilt` as a property, a variable named `unbuilt`, `typeof unbuilt`, the helper's own declaration and overload: not calls.
- The other 16 of the 59 differ from what I expected. Not seen, by the gate's reading (the builder stated the first group): aliased import `import { unbuilt as soon }` then `soon('PROS-03')`; `const f = unbuilt; f('PROS-03')`; passing `unbuilt` as a value; `export { unbuilt as inert }`; `const { unbuilt: soon } = require(...)`; `lib['unbuilt'](...)`. Also not seen: a real call on the SAME line after a regex that holds `//` or a quote, after JSX text holding `http://`, or after JSX text like `{n}'s` (the scanner reads the rest of that line as a comment or string); and a regex literal holding a backtick, which opens a template that runs to the next backtick in the file. Real-tree check: the scanner ended in plain code mode on all 401 `.ts`/`.tsx` files under `src/` (none desynchronised), and `.js`/`.jsx` files plus anything outside `src/` are not scanned (there are none; same globs as every other gate; my cases N26 to N28).
- `src/__tests__/helper.ts` (a non-`.test` file directly in `src/__tests__`) is scanned because the shared `is_test` glob needs a folder level before `__tests__`; that is stricter, not weaker, and `dead_controls` behaves the same.

**Status source** (`cases/cases2.out`). `building` and `verifying`: inert allowed and listed; `review`, `done`: FAIL with "ME-03 is done, so its screen is built. Wire this entry to it and remove unbuilt()." plus file:line and the source line, so the next builder knows the action. Quoted `"done"`, CRLF files and an indented `status:` are read like `check_tasks.py` reads them. A status the five-value list does not know (`'done'` single-quoted, `Done`, `done  # note`, empty, no line at all) FAILS (it cannot tell), never passes. A task file that exists but cannot be read (BOM, no front matter, no closing `---`, a blank line before it, `id:` that differs from the file) is "no task file" for the gate: it fails safe, and `check_tasks.py` fails the same files, but the message ("there is no task file tasks/ME-03.md") would send the reader looking for a file that exists. Two files claiming one id: the later name in sort order wins in the gate; `check_tasks.py` fails that case anyway (id differs from the file name). Merging a task as `done` while a screen holds its `unbuilt`: `npm run gates` exit 1 on that tree, the scratch run of `npm run check` is exit 1 (above).

**Interplay.** `dead_controls` fails `onPress={() => {}}` ("handler is an empty function") and `onPress={noop}` ("handler is a placeholder") in the same run in which `unbuilt('ME-03')`, `unbuilt('WALLET-20')`, `unbuilt('EXPLORE-02')` raise no dead-control finding and print as three inert lines (`interplay_a.txt`, `interplay_b.txt`). Nothing else in the gates changed: config diff is the three added lines; the other nine gates print the same on main and branch. The gate costs 0.42 s over the 3.2 MB `src/` tree.

**Mutants of my own** (`cases/mutants.out`, `cases/mutants2.out`; each applied alone to a scratch copy, the original restored and its sha256 compared each time: all restored). 31 applied, 23 killed, 8 survived.
Killed (gate tests): G1 call regex lookbehind removed; G2 trailing comma not allowed; G3 line number off by one; G5 `verifying` not allowed inert; G6 TEMPLATE/INDEX read as tasks; G9 inert listing becomes a FAIL; G10 listing unsorted; G11 `src/app` skipped; G12 id `.strip()`ped; G13 id matched case-insensitively; G14 non-literal downgraded to a warning; G15 line comments not blanked; G16 only the first call per file read; G17 the check returns early; G18 `dead_controls` noop pattern removed; G19 gate switched off in config; G21 generator declaration counted as a call; G24 backtick not a literal; G25 block comments not blanked. Killed (jest, helper): H1 returns a value; H2 one handler shared by id prefix; H3 throws when tapped; H6 no cache.
Survived: **G4** quote stripping removed (no real task file quotes a value, so no behaviour changes today); **G7** nested braces inside a `${ }` not counted; **G8** the built-task message loses "Wire this entry to it and remove unbuilt()" (the test checks "so its screen is built" but not the action, which is the line the brief wants the next builder to read); **G22** backslash escapes ignored in quoted strings; **G23** the same in template text; **G26** `tasks/` read recursively (no test has a sub-folder); **H4** a side effect on tap other than a `console` call (a global write passes; nothing asserts no alert, no router call); **H5** `TaskId` widened to `string` (no `@ts-expect-error` line anywhere, so the type is untested). For G7, G22 and G23 I checked the real code on the exact inputs (`cases/cases3.out`): it is right today; the tests would not notice a regression.

**Decisions, judged**
- Helper at `src/lib/unbuilt.ts` as `@/lib/unbuilt`: agree. The ticket names it, WORKFLOW names no other home, `src/lib` is unfenced and new, and the WORKFLOW bullet now says the import.
- Inert list is the gate's own WARN output, one line per task, `--json` for call sites, `run.py` unchanged: agree. It prints on every `npm run check`, so the output grows by one line per task still inert; acceptable. (`run.py --quiet` is declared and never read, so the lines cannot be hidden; harmless, pre-existing.)
- A status outside the five fails: agree, and I verified five variants fail.
- `TaskId` as a template-literal type, not a generated union: agree for the reason given (no regeneration when a task is filed) with the caveat above that the type is loose and untested; the gate is the real check and it holds.
- A no-substitution backtick string counts as a literal, a template with `${}` does not: agree, tested both ways.
- Not seeing aliased or indirect use, and failing it instead: see finding 1.

**Findings**
1. `unclear` (hardening, my recommendation is to do it, not blocking): the gate silently misses an aliased import, `const f = unbuilt`, passing `unbuilt` as a value and a re-export (reproductions P1, P2, P3, P5, P6, P7 in `cases/cases1.out`). A screen author following CLAUDE.md and WORKFLOW would not write these, and nothing under `src` does today; I do not count it a defect. It should still fail outright rather than miss: the gate's promise is that every inert entry names its task, an alias breaks that quietly, and five tasks will be written by agents. Cheap fix: in non-test source, fail any `unbuilt` identifier that is not directly followed by `(` and is not the declaration in `src/lib/unbuilt.ts` or the plain `import { unbuilt } from '@/lib/unbuilt'` line, with the message "call unbuilt('<ID>') directly; the gate cannot read an alias". The same-line scanner misses (regex or JSX text containing `//`, a quote or a backtick, N4, N5, N7, N9, N10) are contrived and worth one sentence in the gate docstring; none occurs in the 401 real files.
2. `unclear` (test gaps, not product defects; same class as the BRAND-01 verifier's survivors): G7, G8, G22, G23, H4, H5 above. Cheapest closing: assert the built-task message contains "remove unbuilt()"; one escaped-quote and one nested-brace `${}` case followed by a real call; a `// @ts-expect-error` line for `unbuilt('me-03')` in `unbuilt.test.ts` (typecheck covers tests); a press test through a real `ListRow` asserting no router call.
3. `unclear` (small): the message for a malformed task file says "there is no task file" (see Status source); it could say "tasks/ME-03.md has no readable front matter". Safe today because `check_tasks.py` fails the same file.
4. `unclear` (process): the gate bites only when the named task becomes `review`, which is the verifier's own last edit. `docs/roles/VERIFIER.md` says run `npm run check` in step 3, before the flip, and does not say to run it again after setting `review`; a verifier who stops at the flip pushes a branch that fails `npm run check` the next time anyone runs it. This brief asked for the re-run, so it is fine here; the role file should say it.
5. `unclear` (inherent, not fixable in the gate): the gate checks that the named task exists and is not built, not that it is the task that builds where the entry leads. A far-away `todo` task keeps an entry inert for ever. Each COMPLETE-02 to COMPLETE-06 verifier should compare every `unbuilt('<ID>')` with the artboard entry it covers (WORKFLOW "Links between screens").

No open defect. Status set to `review`.

**NOT RUN**
- V5 Picture and any on-screen V6 state: no screen uses `unbuilt` yet. Unblocked by the first merge of a COMPLETE-02 to COMPLETE-06 branch that calls it.
- V10 phone check: no device; nothing in this task touches permissions, push, camera or deep links.
- `npm run check` on main 7e74460 itself (jest counts): not run; the builder's 95 / 1606 is BRAND-01's figure and I did not re-measure it. The gates suite on main was run and compared (above).
- The builder's own mutants M1 to M14, D1 and H1 to H4: not re-run; I ran 31 of mine instead.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
