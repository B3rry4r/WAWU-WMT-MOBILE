# SWEEP-APP-8 · round history

Moved out of [tasks/SWEEP-APP-8.md](../SWEEP-APP-8.md) word for word, oldest first. The current state is in that file.

## Verifier report (24 Oct 2026, lean T1 check, a different Sonnet agent): PASS, status review

Merge with `origin/main` `d9b70d20`: **conflicts in 4 files, none in the branch's logic.** `docs/PROGRESS.md` and `tasks/INDEX.md` are generated (run `npm run tasks -- --write`). `ChatInboxRow.tsx`: both sides add a block after `requestLine` (keep `rowNameOf` and `avatarNameOf` AND main's `moveLine`). `content-detail/Parts.tsx`: FIX-107 moved the end mark of a lesson into a `mark` constant, so the branch's one-line wrapper no longer applies as written. Row 4 still applies by hand: draw `{mark ? <View style={styles.lessonEnd}>{mark}</View> : null}` (the `null` test keeps an unlocked lesson with no file from drawing an empty box and an extra gap). On main the bare Free pill still has `alignSelf: flex-start`, and `lessonRow.test.tsx` fails there (Received "flex-start"). With that resolution, in a scratch merge: tsc EXIT 0, eslint EXIT 0, and 44 suites / 760 tests pass (content-detail, chat, paid-ask, points, works, send, profile-edit, inbox).

| Check | Result |
|---|---|
| Red before: the 8 test files of the branch run on `48bd75a9` source | 19 fail, 102 pass; the 19 are exactly the new tests (5+1+1+4+1+1+3+3), each for the stated reason (no `@kemi`, "flex-start", limits line still there, token in the address) |
| `editReorder.test.tsx` stand-in additions | diff: the two older tests gain one line each (`GET /users/me` as `u1`); no assertion changed; the rest are the 3 new tests |
| Row 2: no token in any URL | no `nameToken` in `src/app`; every `/send/*` route is built from `payeeParams`, which has no token; W14, W9, W10 addresses hold none (test + captured address) |
| Row 2: web reload on W10 | scratch test (not committed): fresh load at the W10 address with the token never remembered, the Hub stand-in refuses a send with no token as the real Hub does (400 "Check the name on this account first, then send again."); the sentence shows on W10, the sheet closes, the screen stays, no crash, the intent is dropped |
| eslint, no `--fix`, 19 changed files | EXIT 0, 0 warnings |
| gates | EXIT 0: 10 gates, 1264 files scanned, 0 fail, 18 warn (none in a changed file), baseline 0, 56 unit tests OK |
| check_tasks | EXIT 0 (424 tasks) |

Findings:
1. **low, defect (found on the merged tree, goes to the sweep or to the merge resolution).** `MoneyMoveInboxRow` in `ChatInboxRow.tsx` (new from FIX-114 on main, lines ~135 and ~141 after the merge) still draws `move.other.name` and an avatar from it: a person with no name is a blank line. Repro: render `MoneyMoveInboxRow` with `other: { name: '', handle: 'kemi', ... }`; `@kemi` is not on screen and the row's label is "Sent you ₦5,000, 17 Oct". The branch cannot be blamed (the row is not on its base, and the task names three rows), but after the merge the Money chip's sends are the same defect row 1 fixes. Fix: `name={rowNameOf(move.other)}` and `avatarNameOf(move.other)`, plus one case in `rowName.test.tsx`; best done while resolving the conflict in the same file.
2. **note.** Row 2 trade-off confirmed as the builder wrote it. Also: a send with no token for an unsaved account spends one of the person's 30 name checks an hour at the Hub (backend `bank-send-target.ts`), so a reload then Send costs one.
3. **not done by the builder, still open (sweep list):** row 6 (M24 sale terms ask once; FIX-110 is now on main `d9b70d20`, so it can be done) and row 7 (G-FIX-99-1, W39 delay line); `PaidInboxRow.tsx` (creator side) has the same blank name.

Not run: V4/V5/V6/V9 live passes (the builder's pictures were not re-rendered; this is a lean check). Row 3's screen was walked only in `fileToolsFlow` tests, as the builder said.
