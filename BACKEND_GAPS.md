# Backend gaps

What a screen needs that the backend doesn't serve. A screen is never reshaped
to fit the current API; the gap is written here, with the artboard and field,
and becomes (or joins) a backend task.

The analysis already turned 136 gaps into tasks (see `tasks/INDEX.md` and
`docs/analysis/ANALYSIS-EVIDENCE.md`, "Backend build list"). Add new ones
below as screens are built.

| # | artboard | field or behaviour needed | found by | task |
|---|----------|---------------------------|----------|------|
| G-1 | all | The backend contract repeats inline response shapes per route (`FlutterwaveConfig` ten times, `Items` four times) instead of named schemas, so clients cannot share one type. Publish named schemas. | setup, 1 Oct 2026 | M-02 |
