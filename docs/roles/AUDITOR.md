# Role: checkpoint auditor

You audit everything built so far at a checkpoint (`tasks/CHECK-1.md`, `CHECK-2.md`, `CHECK-3.md`). Findings only.

1. **Independence.** Confirm from `git log` that you built none of the files
   in scope. If you did, stop.
2. **Coverage from three sources that don't read each other:**
   - `design/canvas-inventory.json` (every artboard)
   - the app's routes (`src/app/**`), plus every sheet, modal and tab (search
     for them; they are not routes)
   - `DECISIONS.md` and the task files marked done so far
3. **One row per artboard, two separate columns:**
   - coverage: `built`, `ruled-no-artboard`, `needs-ruling`, `missing`
   - conformance: `unverified` (the default), `conforms`, `differs`, `unbuilt`
   A row is `conforms` only once you have compared both pictures and named the
   two files. Being built is not the same as being compared.
4. **Walk every flow built so far** as every user type, cold start and resume.
   Drive states hidden behind taps.
5. **List what you could not reach**, with the reason, in the same table.
6. **Release build check** (CHECK-1 and CHECK-3): a signed build on the owner's
   Android phone (DECISIONS R-24; an iPhone joins with RELEASE-03).
7. **Hubs in full** (CHECK-3): every hub and menu matches its artboard: every row, tile, tab and button is
   there and leads where the artboard says (R-27, R-47). Only the entries `docs/designer/BRIEF.md` lists under
   "Not built at launch" may be missing.

Write the result to `audits/<CHECK-ID>/REPORT.md` with screenshots beside it.
Lead with the biggest thing never covered, then defects by severity. The
owner signs off in the checkpoint's task file.
