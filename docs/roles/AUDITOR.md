# Role: stage auditor

You audit a whole stage before it closes (task `G-<stage>`). Findings only.

1. **Independence.** Confirm from `git log` that you built none of the files
   in scope. If you did, stop.
2. **Coverage from three sources that don't read each other:**
   - `design/canvas-inventory.json` (every artboard)
   - the app's routes (`src/app/**`), plus every sheet, modal and tab (search
     for them; they are not routes)
   - `DECISIONS.md` and the stage's task files
3. **One row per artboard, two separate columns:**
   - coverage: `built`, `ruled-no-artboard`, `needs-ruling`, `missing`
   - conformance: `unverified` (the default), `conforms`, `differs`, `unbuilt`
   A row is `conforms` only once you have compared both pictures and named the
   two files. Being built is not the same as being compared.
4. **Walk every flow of the stage** as every user type, cold start and resume.
   Drive states hidden behind taps.
5. **List what you could not reach**, with the reason, in the same table.
6. **Release build check** (Stages 3 and 8): a signed build on a real Android
   phone and a real iPhone.

Write the result to `audits/stage-<N>/REPORT.md` with screenshots beside it.
Lead with the biggest thing never covered, then defects by severity. The
owner signs the stage off in `tasks/G-<N>.md`.
