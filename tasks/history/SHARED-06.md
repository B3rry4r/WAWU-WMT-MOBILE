# SHARED-06 · round history

Moved out of [tasks/SHARED-06.md](../SHARED-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Built by a Sonnet builder, 17 Oct 2026, on `wmt/SHARED-06` from `origin/wmt/MERGE-7` f45ffbd. Mobile only (no backend, wawu-id or migration).

**Rows.** 17 of 19 applied and marked in SHARED-CHANGES.md (7, AUTH-01 #4, KYC-05 #1 to #3, WALLET-11 #1, ME-11 #2, SETTINGS-02 #2, KYC-04 #2, ME-06 #2 and #4, SETTINGS-01 #1 and #2, HOME-09 #5, HOME-02 #1 and #3, KYC-02 #4). Not applied: HOME-02 #4 (the feed's floating tab bar changes the geometry of all five post layouts) and row 11 (`unwrap` returning `data` breaks about 60 callers in 40 files that read `body.data`); both need their own task, see Current state.
**Files.** Shared: `src/components/` (`Banner`, `Switch`, `SwitchRow`, `ScreenFrame` new; `TextField`, `ListRow`, `Button`, `PaySheet`, `pin-sheet/PinDots`, `SegmentedTabs`, `BottomSheet` changed), `src/theme/tokens.generated.ts` (from `elevation.css`, generator prefix `media-`), `src/api/` (`errors.ts`, `client.ts`, `identity.ts`, `session.ts`, `kobo.ts`), `icons.generated.ts` (`gen_icons.js` `EXTRA_BRANDS`). About 40 screens and data layers moved onto them; 14 stand-in files deleted.
**Tests edited (not written by me; same assertions, new path or shape):** `logic.test.ts` (the wait is now read through `toApiError`, same five cases), `settingsScreens.test.tsx` (mock adds `replaceTokens`; `SwitchRow` path), `lists.test.tsx` (the shadow objects gain `spreadDistance: 0`: they come from the theme token now, the drawn shadow is the same), `Icon.test.tsx` (the brand list), `model.test.ts` (import path).
**Pictures.** 28 screens at 390 px, light and dark (56 pairs), before (f45ffbd) and after, signed in against the stack, pixel compared: 48 identical, 8 differ, each explained: pay sheet no-wallet (row KYC-05 #1: Open your wallet), TGIF reader (row HOME-09 #5: pills and the lift arrow), pay sheet short (43 px of anti-aliasing in the banner's second line), Home (a data line: the TGIF card's "1 reading today" appeared because the earlier run opened TGIF). The PIN sheet preview did not open in either run (both timed out), so the shared `PinDots` is pictured only through the Wallet PIN screen and covered by the existing `PinEntry` and screen tests. Files: `scratchpad/shared-06-b/pics/before` and `after`.
**Gate counts.** Full check (typecheck, lint, jest `--maxWorkers=2`, gates, tasks): jest 191 suites, 3327 tests passed; gates 701 files, 0 fail, 5 warn (the same five PROVISIONAL warns), 0 accepted; tasks 330. The first run failed two gates on this change (a local `Banner` function in `PaidMessagesScreen.tsx` copies the shared one, a literal `gap: 6` in `TextField.tsx`): the function became `StandingNote` and the key `iconGap`, no gate or baseline touched. The base was not run separately.
**Not run.** A phone. The shared `Switch`, `ScreenFrame` keyboard avoiding and `TextField` picker mode were checked on the web build and in jest only.

## Verifier report

_Not started._

