# The analysis behind the backlog

On 1 Oct 2026, seven read-only agents each took a set of flows and recorded,
for every artboard: what it shows, what the user does, what data it needs, how
far the live backend and web are from it (citing the route or file searched),
facts drawn on it, designer warnings, and conflicts with the product as it was.
A script merged their files and checked that every artboard came back exactly
once.

- `BRIEF.md`: the instructions every agent followed
- `evidence/A1.json` ... `A7.json`: per-artboard findings (A1 wallet; A2 auth
  and settings; A3 me; A4 home and explore; A5 inbox; A6 events, professionals
  and services; A7 schools and shop)
- `ANALYSIS-EVIDENCE.md`: everything merged: coverage, designer questions,
  68 conflicts, 357 unverified figures, 67 third-party capabilities, the
  backend build list, and 89 web features absent from the canvas
- `MANIFEST.json`, `ANALYSIS-STATS.json`: counts

It was written before two rulings: Fintava holds the money (R-1) and Shop is
retired (R-2). Where it says "needs a ruling on custody", R-1 answers it.
