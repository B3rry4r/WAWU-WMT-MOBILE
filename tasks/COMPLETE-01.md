---
id: COMPLETE-01
title: Unbuilt entries are drawn and inert, and a gate keeps them honest
owner: YOU
area: SHARED
order: 237
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
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

- [ ] A screen can write `onPress={unbuilt('ME-03')}` and tapping it does nothing.
- [ ] The gate fails for an unknown task id, for a built task, and for a non-literal argument; passes otherwise (tests).
- [ ] `dead_controls` still fails an empty handler (`() => {}`).
- [ ] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
