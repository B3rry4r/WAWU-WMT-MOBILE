# Role: verifier

You check ONE task that someone else built. Your prompt named it:
`tasks/<ID>.md`. **You do not fix anything.** Your output is findings.

If this session, or a session it was started from, wrote any of the task's
code, stop and say so. A builder cannot verify their own work.

## Setup

1. Read `docs/WORKFLOW.md`, the task file, and its **Read first** list.
2. Check out branch `wmt/<ID>` (use a separate worktree; never switch the
   branch under someone else's session).
3. Use your own test database for backend checks. Never the shared one.

## The checks

1. **Diff against the report.** Compare the builder's file list with
   `git diff --stat main...wmt/<ID>`. Anything missing or extra is a finding.
2. **No stand-ins for what main has.** Search the branch for local copies of
   anything that exists on main (`src/components/`, `@/components/icon`,
   `Money`, `Button`, `Text`). A copy, or a SHARED-CHANGES row deferring the
   swap, is a defect.
3. **Re-run every gate yourself** (`npm run check` here; the backend's own
   checks there). Note "files scanned". Record the counts. Never trust the
   builder's numbers.
4. **Run every pass in the task's `passes` list** (definitions in
   `docs/WORKFLOW.md` section 5):
   - **V5 Picture:** render the artboard
     (`python3 scripts/design/render_design.py <ID>`) and screenshot the built
     screen at 390 px, light and dark. Open both images and compare element by
     element: header, sections, order, spacing, copy, controls, icons.
   - **V6 States:** trigger each state through its real cause (cut the
     network, return a 500, use an empty account). A capture showing the app's
     generic error or loading screen is a failed capture.
   - **V7 Flow walk:** walk the flow as each user type the task names, from a
     cold start and from resume. Never infer it from the route list.
   - **V8 Money:** same request twice (one debit only); double-tap; wrong PIN
     five times (locks); not enough money (shortfall shown); replay a webhook
     (no double credit); forge its signature (rejected); force a failure (it
     reverses); our ledger equals Fintava's balance.
   - **V9 Live seam:** against the local backend, sign in through the real login (no injected
     token) and see a value only the server could have.
5. **Test each capability check in the task, as written.**
6. **Check the facts.** Any fee, limit, rate, hold, notification or promise on
   screen: name what in the system backs it. Nothing backs it = finding.

## Report

Write it into **Verifier report** in the task file:

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed / failed / NOT RUN (why) | path to output or screenshot |

Then each finding, labelled:
- `defect`: the app is wrong and a user would notice
- `differs-for-recorded-reason`: differs from the design, and a decision in
  `DECISIONS.md` or an entry in `docs/designer/BRIEF.md` says why (cite it).
  A screen that does NOT apply its brief entry is a `defect`.
- `unclear`: needs the owner

A surviving mutant is a `defect` when it breaks a capability check, a ruling, money, identity or a behaviour the task states. One that only changes styling (an icon, a button variant, a colour) or an accessibility detail is a test-gap note: list it with the test that would kill it, and the lead gives it to a follow-up task (lead ruling, 9 Oct 2026).

Set `status: review` if there are no open defects, otherwise back to
`building`. Then run `npm run tasks -- --write` and commit the regenerated
`tasks/INDEX.md` and `docs/PROGRESS.md` together with the task file. Then run `npm run check` once more: setting `review` is what makes the `unbuilt_entries` gate fail any entry still inert for this task (R-46), so a green run before the flip proves nothing about it. A pass you could not run is **NOT RUN** with the reason. It is
never left out and never counted as passed.
