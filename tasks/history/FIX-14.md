# FIX-14 · round history

Moved out of [tasks/FIX-14.md](../FIX-14.md) word for word, oldest first. The current state is in that file.

## Builder report

**Builder report, 16 Oct 2026 (Sonnet builder, one session).** Mobile `wmt/FIX-14` from main `3117807`; no backend, wawu-id or contract change; migration none.

**Files.** `src/components/FilterChips.tsx` (row chip: `rowBorder` hairline kept, padding is 15 less it, as `optionChipMetrics` already does; the `chipMetrics` and `chipIconMetrics` comments now say how the outline is counted), `Avatar.tsx` (`aria-hidden` beside the two native props when `decorative`), `MediaCard.tsx` (placeholder slot `aria-hidden`), `src/features/open-wallet/ConfirmDetailsScreen.tsx` (`aria-checked={agreed}`), `scripts/gates/checks/forks.py` (function components), `src/features/settings/__tests__/settingsScreens.test.tsx` (client `mutations.gcTime`). New: `src/__tests__/sharedFollowups.test.tsx` (8 tests), `src/features/open-wallet/__tests__/consentBoxAria.test.tsx` (1), `scripts/gates/tests/test_forks.py` (12).

**R1, chips, with pictures.** Web export of this branch through `stack.sh` (`--with mobile`, ports 7240 to 7247, only 7240 and 7247 baked in), signed in as the mock's user, 390 px at 2x, dark and light. Scratch `fix-14-b/`: `pairs/` (artboard left, app right, and the chip row artboard over app) for X2, X3, I1 and M34; `probe/canvas.json` against `shots/app_chips.json`. Widths, canvas then app: X2 All 42.64 / 42.64, Music & Audio 139.56 / 139.56, Film & Video 130.23 / 130.22; I1 All 47.64 / 47.64, Communities 114.95 / 114.95; M34 All 47.64 / 47.64, Brand films 105.42 / 105.42, Photography 114.45 / 114.44, Workshops 101.88 / 101.89. Every chip on Categories (X2 and X3 with a chip picked), Inbox, Works, Wallet history, My tickets, Directory and Schools, both themes: 106 chips, padding plus border is 15 and 15, or 11 and 14 in an icon row, 0 odd; a chip does not change size when picked. The Hub's categories differ from the canvas's and Inbox shows All and Communities only (Paid DMs and Money are not built); Apply's and the host day picker's chips were not reachable.

**N1 and A5.** `sharedFollowups.test.tsx` checks `aria-hidden`, the two native props and no label on a decorative avatar, a normal avatar unchanged, the placeholder slot hidden. `consentBoxAria.test.tsx` watches the props the screen gives the Pressable (RNTL 14 shows the host only, and RN folds `aria-checked` into the state) and checks `aria-checked` false, true, false with the state. The live DOM was not checked (see NOT RUN); the chips' `aria-checked` did reach the web DOM as `true` and `false`, the same path.

**Hang.** A probe (a temporary setup file, scratch `probe/`) found 7 pending 300000 ms timers from `Mutation.scheduleGc` on unmount; `QueryClient.clear()` does not cancel them. Before: the file alone ran about 5.5 minutes after the last pass (`logs/hang1.log`); after: 22 s wall for the whole file, exit on its own (`logs/hang2.log`).

**Fork gate.** A planted `function ErrorState()` in `src/features/me` fails with its file and line (`logs/planted.log`); the real tree has 0 findings from it. 12 unit tests cover each way of writing a component, a subfolder, a platform pair, a test file, same name in two features (left alone) and the old class check.

**Edited tests that were not mine:** `hubSharedProps.test.tsx` (3 assertions) and `lists.test.tsx` (1): padding plus border instead of padding alone, for the same numbers.

**Checks.** Full local run, one command with two jest workers (`logs/mobile-check.log`): typecheck 0 errors; lint 0 errors (5 warnings, none in files I touched); jest 157 suites, 2,841 tests passed, 0 failed; gates 10 run, 583 files, 0 fail, 5 warn, baseline 0; the tasks step failed only for a stale `docs/PROGRESS.md`, regenerated with `--write` and rerun (see the LOG line). The first run stopped at a lint error in my new test (an unnamed `forwardRef`), fixed in `5238c29`; its log is `logs/mobile-check-1-lint-fail.log`.

**NOT RUN.** A phone; the live web DOM of a decorative avatar (a stubbed Inbox answer was not served cross-origin) and of the consent box (needs a full A3 to A5 sign-up); no mutants run.

**Procedure.** I ran `git checkout -- <file>` once, on my own uncommitted line in `ConfirmDetailsScreen.test.tsx`, to move that test into its own file; nothing else was discarded.

## Verifier report

_Not started._

