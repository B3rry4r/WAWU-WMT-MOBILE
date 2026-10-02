# WAWU WMT mobile app

WMT ("Who Made This") is WAWU's mobile app: a Nigerian creator marketplace
with a Fintava wallet. Expo SDK 57, Expo Router, TypeScript. **The mobile app
is the product**: the backend (`wawu-backend`, `wawu-id`) changes to fit it,
and the web (`wawuafrica`) follows it later.

## Start here

You were given a task: `tasks/<ID>.md`. Open it and read what it lists under
**Read first**. Whoever owns a feature owns its screens AND its backend. Always read `docs/WORKFLOW.md` and your role file
(`docs/roles/BUILDER.md`, `VERIFIER.md` or `AUDITOR.md`). If no task was named,
ask for one; don't pick work yourself.

## Rules that are never broken

1. The builder never verifies their own task. The verifier never fixes.
2. Every task is small, and nobody starts one before its `depends_on` tasks
   are built and verified (`review` or `done`; the owner's sign-off happens at
   merge and never blocks the next task). `npm run tasks` enforces the rules.
3. A check passes by exit code, never by opinion. `npm run check` must exit 0.
4. Screens are compared picture against picture:
   `python3 scripts/design/render_design.py <ID>` beside a screenshot.
5. Checks are written as "a user can ...", never "the screen renders".
6. The live product keeps working: backend changes are additive until the old
   path has no callers.
7. The design decides the UI, never the facts. Fees, prices, rates and legal
   text come from the system, the docs or the owner; never invent one. Any
   other question with a sensible default is decided, recorded in the task
   file and the work carries on (`docs/WORKFLOW.md` section 10 lists the few
   real stops).
8. Every blocker names the fact that unblocks it. Adding something also
   removes what it replaces.
9. Report what ran and what didn't. NOT RUN is a valid result; leaving it out
   is not.

## Code

- Colours, spacing, radii and type come from `@/theme` (generated from
  `design/_ds/wawu/tokens`). Never a literal. Fonts by family: `font(600)`.
- API calls go through `@/api/client` with types generated from the backend
  contract (`npm run api`). Never hand-write a response type.
- Shared files are fenced (`docs/WORKFLOW.md` section 4): request changes in
  `SHARED-CHANGES.md`.
- No em-dashes in anything a user reads. No "Flutterwave" in the app. Links
  are written `wawu/...`. WAWU Credits are a count, never naira.
- Never `git stash`, `git reset --hard`, `git checkout -- .`, or force-push.
- Expo changes every SDK: read `docs/EXPO-AGENTS.md` and the SDK 57 docs, not
  memory. Install packages with `npx expo install`.

## Commands

```
npm run check      typecheck, lint, tests, gates, task check (must exit 0)
npm run web        run in the browser
npm run tokens     regenerate the theme from the design tokens
npm run api -- --backend ../wawu-backend   copy the backend main contract and regenerate API types
npm run tasks      check task files (add -- --write to refresh tasks/INDEX.md)
python3 scripts/design/render_design.py <IDs>    render artboards to build/design_shots/
```

## Where things are

| | |
|---|---|
| `docs/PROGRESS.md` | Where everything stands (generated) and the latest work |
| `docs/LOG.md` | One line per thing done, newest first |
| `docs/WORKFLOW.md` | How every task is built and verified |
| `docs/PLAN.md` | Who owns what, how the lists work, what's needed from outside |
| `docs/BUILDS.md` | Builds, testers, store releases (owner submits) |
| `docs/people/` | One file per person: what they own end to end |
| `DECISIONS.md` | Rulings, what is not built, and what is still open |
| `tasks/` | One file per task; `tasks/INDEX.md` lists them |
| `design/` | The canvas (authoritative for UI) and `canvas-inventory.json` |
| `BACKEND_GAPS.md` | What screens need that the backend doesn't serve |
| `SHARED-CHANGES.md` | Requested changes to fenced files |
| `docs/analysis/` | The analysis behind the backlog |
