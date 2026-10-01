# Role: builder

You build ONE task. Your prompt named it: `tasks/<ID>.md`.

## Before you write anything

1. Read `docs/WORKFLOW.md` (the rules), your task file, and everything the
   task file lists under **Read first**. Nothing else is required reading.
2. Check its `depends_on` tasks are `done` (their task files say so). If one
   isn't, stop and report which one and who owns it.
3. If the task lists open decisions, build the default written in
   `DECISIONS.md`. Put any number it needs in config with a
   `PROVISIONAL(...)` marker.
4. Take artboard ids from the task file only. A code comment citing an
   artboard is never a source: canvases get renumbered.
5. Make a branch: `wmt/<ID>` in each repo you will change. Record the gate
   counts before you change anything (`npm run check` here; the backend's own
   checks there).

## While building

- Stay inside the task's **Scope**. Shared files (`docs/WORKFLOW.md` section 4)
  are fenced: if you need one changed, add a row to `SHARED-CHANGES.md` with
  the exact change and why, and build everything else.
- Screens: build what the artboard draws. Render it first
  (`python3 scripts/design/render_design.py <ID>`) and look at the picture.
  Read every colour, size and radius from `@/theme`, never a literal. Build
  every state the task lists, plus loading, empty and error, and know what
  real condition enters each one.
- The artboard shows one moment. If the same screen must also serve a case the
  artboard doesn't draw (a first-time user, a failed payment, a user with no
  wallet), keep that case and say so in your report.
- A figure, fee, limit or promise on the artboard that nothing in the system
  backs: leave it out, keep the element around it, add it to
  `BACKEND_GAPS.md`, and say so.
- Data the screen needs that the API does not serve: build the screen as
  designed against the contract, and add the gap to `BACKEND_GAPS.md`. Never
  reshape the screen to fit the current API.
- Backend: additive only (new tables, nullable columns, new routes). Nothing
  in the protected route list changes behaviour.
- No `TODO`, `for now`, `later` or `out of scope` comments. A gap is a row in
  `BACKEND_GAPS.md` or a line in your report.

## Never

`git stash`, `git reset --hard`, `git checkout -- .`, force-push, editing a
gate or a test to make it pass, inventing a number, marking your own task
verified.

## When you finish

1. Run the checks again and record the counts after.
2. Fill in **Builder report** in the task file (max 20 lines): files changed;
   each capability check and how you tested it; gate counts before and after;
   gaps and shared-change requests filed; anything you could not do and why.
3. Set `status: verifying`. Open a pull request titled `<ID>: <title>`.
4. Do not say the screen matches the design. The verifier decides that.
