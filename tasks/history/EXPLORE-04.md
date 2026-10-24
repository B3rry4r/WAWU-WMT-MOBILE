# EXPLORE-04 · round history

Moved out of [tasks/EXPLORE-04.md](../EXPLORE-04.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: nothing new of its own beyond the fixes: `src/features/search/{SearchScreen.tsx,parts.tsx,model.ts}` and `__tests__/search.test.tsx` (the placeholder line), the rest taken from `wmt/EXPLORE-02` as described above.
- X8 a user can Follow (test, `search.test.tsx`); X9 a user can Ask (private) and Join (open) (tests); X10 a user can tap a closest result's row (rows drawn; M5 and H19 are ME-02 and HOME-03's, so no tap opens a screen yet); X12 a user can Try again (test). X11 shows "No recent searches yet." from an empty history and the popular and creator lists.
- Each state entered by its cause: empty history, no match (empty lists, then `/search/closest`), a failed `GET /search` (offline), pictures in `pics/`.
- Gates before: not measured on the base; after: 0 fail, 896 files. Gap: G-EXPLORE-04-1. Shared change: EXPLORE-04 #1.
- Not done: the entries to open Search (EXPLORE-02's); a content or creator row opening its screen (HOME-03, ME-02).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

