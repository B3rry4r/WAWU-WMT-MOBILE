# GATES-02 · round history

Moved out of [tasks/GATES-02.md](../GATES-02.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 16 Oct 2026. Backend `wmt/GATES-02` `4b13091` from main `1f3950e`; mobile `wmt/GATES-02` from `wmt/DESIGN-V2-CUT` `d1353ae`. Migration none. Evidence in the builder's scratch folder `gates-02-b/logs/`.

- **Files changed.** Backend `scripts/gates/baseline.json` only: 40 lines added, 0 removed, keys sorted as the file already is, no trailing newline kept as before. Mobile: this task file, `docs/LOG.md`, `docs/PROGRESS.md`.
- **Entries.** Keys `11dede1fa5cff62e`, `c29f56072d78a67b`, `4994dca35d52e465`, `f43c5de9ed35d5c5` (gate deferrals) and `17eaf7bef75a96e8` (gate forks). Each has the finding's own evidence and message, owner "YOU, owner-approved 16 Oct 2026 (R-60)", and a reason. Written from `run.py --json` with a script, not `--accept`, because `--accept` would also have baselined the 117 warnings.
- **Check 1, recorded lines are accepted, not new.** Gates run before: 5 fail, 117 warn, 83 accepted, exit 1. After: 0 fail, 117 warn, 88 accepted, exit 0, "GATES PASSED".
- **Check 2, `check_baseline.py`.** Passes: 124 entries, each with an owner and a reason, exit 0.
- **Check 3, diff is the baseline only.** `git diff --name-only` lists `scripts/gates/baseline.json`; the diff has no removed line. No gate, test or source file edited.
- **Not run locally.** Backend typecheck, lint and specs: no TypeScript changed. The full suite, gates job, protected routes and contract run on GitHub for the push (run ids in the hand-back).
- **Gaps.** None. The two stale GATES-01 L1 entries stay as the task says. No shared-change request needed (the baseline is not a fenced file).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

