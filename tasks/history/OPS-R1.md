# OPS-R1 · round history

Moved out of [tasks/OPS-R1.md](../OPS-R1.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Brand (4 files and a comment):** `BrandMark.tsx`, `app.json`, `brand.test.tsx`, `auth-welcome.test.tsx`, plus the `Avatar.tsx` comment. Nothing else in `src` says the name without the question mark where the app names itself.
- **Gap ids:** found with a script over `BACKEND_GAPS.md` (6 ids used twice or three times: G-690, G-691, G-827 x3, G-828, G-830, G-831). Which row owns a reference was read from the row's artboard and the task that filed it (`git log -S` gave the filing order). Re-run after the edit: no id twice, no bare use of a renamed id outside `tasks/history/`.
- **Checks (full output in the builder's scratchpad `ops-r1-b/`):** `npx tsc --noEmit` EXIT 0; `eslint` on the 7 changed source files EXIT 0; jest on `brand.test`, `auth-welcome.test` and `hostedSelfie.test` EXIT 0 (3 suites, 69 tests); `check_tasks.py --write` EXIT 0; `npm run tasks` EXIT 0 (345 tasks); `npm run gates` EXIT 0 (0 fail, 9 warn, baseline 0 entries).
- **Not run:** the full jest suite and the app on a phone (the full check runs once per batch). The launcher name needs a development build to show.
- **For the lead:** `tasks/history/*` still says the old bare ids; `CLAUDE.md` still says `The app is "Who Made This" (R-37)` (a doc line, not in this task's scope).

## Verifier report

