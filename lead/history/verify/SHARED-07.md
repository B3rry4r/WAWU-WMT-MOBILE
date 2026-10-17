# SHARED-07 verifier report, round 3

Sonnet verifier. Mobile `wmt/SHARED-07` 35d7ddd (was 3080926), main 3117807. Mobile only. Replaces the round 2 report.

## Verdict: merge (nothing medium or worse; one new low for the sweep list)

## Checks
- Diff 3080926..35d7ddd: 8 files. Product: `reader/index.tsx`, `ShareSheet.tsx`. Tests: `PdfReaderPhone.test.tsx`, `ShareSheetPhone.test.tsx`. Bookkeeping: docs/LOG.md, docs/PROGRESS.md (one line in, one out, count 166 both), tasks/SHARED-07.md, tasks/history/SHARED-07.md. No WebView prop touched.
- Full check, normal command (typecheck, lint, jest `--maxWorkers=2`, gates, tasks), run twice: EXIT 0 and EXIT 0. Each: 161 suites, 2898 tests pass; gates 590 files, 0 fail, 5 warn, baseline 0; 283 tasks. Logs: shared-07-v/logs/check1.log, check2.log.
- The three new tests on 3080926 (the two test files from 35d7ddd copied over the old code): exactly those 3 fail, 26 pass (logs/old-new-tests.log).
- Double hand-over, every order (scratch test, 35d7ddd, Android, fake timers): all 24 orders of {pdf:failed, onError, onHttpError, 45 s timeout} open the viewer once; ready then timeout opens nothing; iOS error+httpError either order opens once. 27/27 pass. The same file on 3080926: 26 fail (every order and both iOS), so the test has teeth. Round 2 low 3 is closed.
- `waitForAnswer: false` judged: that phone answers false and draws no Save tile, so waiting for Save would time out. Not vacuous: mutating `asPicture` to `phone.data !== undefined` in a scratch tree makes that test fail (logs/mutation.log); mutation reverted.
- Round 2 low 2 (WhatsApp tap before the first answer): closed by `ensureQueryData` on the same query (new test passes; it fails on 3080926). `canShareCard` never rejects (it catches), so `ensureQueryData` cannot throw into `once()`.
- No stack started; worktrees v-shared-07-a/b/c removed; nothing listening on 7270-7277.

## Findings
1. LOW (product, new in round 3). `src/features/tgif/ShareSheet.tsx` `sharesPicture()` / `whatsapp()` (about lines 123-130): if the phone's `Sharing.isAvailableAsync()` never answers, a WhatsApp tap waits for ever with nothing shown. Observed in a scratch test (shared-07-v/scratch/ShareHang.scratch.test.tsx, `canShareCard` returns a promise that never settles): after 1.5 s no spinner, no error line, no wa.me, no share sheet; a second tap is ignored (`busy` stays set); Chat still opens its picker; Story and Save are never drawn; closing and reopening the sheet does not help (the query stays pending in the cache, `staleTime: Infinity`), so it lasts until the app restarts. On 3080926 the same tap opened WhatsApp with the verse as text. Reachability is very low: `isAvailableAsync` is a local native call that resolves at once, and `canShareCard` catches throws. Optional hardening: race the wait against about 2 s and fall back to the text, as round 2 did. Sweep list.
2. LOW (already in SWEEP-APP, SHARED-07 #1): iOS has no non-web-address short-circuit. Unchanged.
3. Note, not a finding: a PDF over 400 pages shows its first 400 with no sign it was cut (the task's stated design).

## Pre-existing (also on main 3117807)
- "Jest did not exit" with `--maxWorkers=1`; "worker failed to exit gracefully" with `--maxWorkers=2` (round 2).
