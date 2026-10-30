---
id: FIX-TESTCLOCK
title: Two app tests that failed with no code change wait for the state they mean (professionals directory price, A28 title)
owner: YOU
area: APP
order: -179
priority: launch
repo: wawu-wmt-mobile
type: setup
status: review
depends_on: []
decisions: [R-27, R-47, R-101]
passes: [V1]
artboards: []
tier: T1
---
# FIX-TESTCLOCK · Two flaky app tests, fixed by waiting for what they assert

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/FIX-TESTCLOCK` on `origin/wmt/STORE-BUY-APP` `88d0b779` (the professionals test below exists only there; on `origin/main` `b426f8fb` it passes because the row has no store price). Test files only: no app code changed, because neither cause is something a person sees change at midnight. Status review.

| # | Before | Cause, with proof | After |
|---|---|---|---|
| 1 | `src/features/professionals/__tests__/screens.test.tsx` "a user reads each professional ..." failed with "Unable to find an element with text: a message" (about 5 runs in 11 around 00:00 UTC 30 Oct, none in 3 an hour earlier) | NOT the clock. Since IAP-02 (`useShownPrice`, R-101 point 10) a row says "a message" only once `GET /prices` has answered, and the row itself draws as soon as the directory has. Which answers first is a race between two fetches. Fake system date 22:30 UTC (23:30 Lagos) failed 5 of 10, 23:30 UTC (00:30 Lagos) 0 of 10, the same code, so the date does not decide it. With `/prices` held 150 ms the original assertion fails 3 of 3 with the exact error; the fixed one passes 3 of 3 | waits for "a message" in the p1 row (`waitFor`), as the test already did for the price figure two lines below |
| 2 | `src/features/push/__tests__/walletReadyPush.test.tsx` "A28 moves on as the notice lands ..." failed intermittently on CI | NOT the clock. The first ask answers "number on its way", which flips A28's title from "Checking your details" to "Your account number is being made" (`CheckingScreen`, `making`). `findByText('Checking your details')` finds the first title only if it looks before the ask has answered. With 80 ms between render and the first look, the original fails 3 of 3; the fixed one passes 3 of 3 | waits for either title |

### Assertions changed (every one)

| File | Was | Now |
|---|---|---|
| `screens.test.tsx`, test 1 | `expect(rtl.within(row).getByText('a message')).toBeTruthy();` | `await rtl.waitFor(() => expect(rtl.within(rtl.screen.getByTestId('pros-row-p1')).getByText('a message')).toBeTruthy());` (same assertion, in the same row, now waited for; its price figures were already waited for) |
| `walletReadyPush.test.tsx`, A28 test | `expect(await view.findByText('Checking your details')).toBeTruthy();` | `expect(await view.findByText(/^(Checking your details\|Your account number is being made)$/)).toBeTruthy();` (A28's two titles; everything after it is unchanged: one ask, not opened, then the notice opens it inside 2.5 s) |

Nothing deleted or skipped. No change to the app, to a gate or to the baseline.

### Checks run (all after the fix)

Each file 10 runs, 0 failures; once with `TZ=Africa/Lagos`, once with `TZ=UTC`, both green. Professionals 25 of 25 tests, push 6 of 6.

Open low, for `tasks/SWEEP-APP.md`: (a) run on its own, `screens.test.tsx` often prints "Jest did not exit one second after the test run has completed" and does not exit by itself (all tests pass; it is seen from `origin/wmt/STORE-BUY-APP` on, in one worker CI force-kills it). A handle is left by one of its tests; find it with `--detectOpenHandles`. (b) The directory row draws with no price for a moment while `/prices` loads, by design (R-101 point 10, "none where no rung sells it").

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `src/features/professionals/DirectoryScreen.tsx` (`ProRow`), `src/features/store/ladder/usePrice.ts`, `src/features/open-wallet/CheckingScreen.tsx`

## Goal

Two tests that depend on which of two fetches answers first wait for the state they mean, so they pass on any machine at any time.

## Scope

`wawu-wmt-mobile` only: the two test files above, this file, `docs/LOG.md`, `tasks/INDEX.md`.

## Capability checks

- [x] The professionals directory test passes 10 of 10, in `Africa/Lagos` and in `UTC`, and with the prices 150 ms late.
- [x] The A28 notice test passes 10 of 10, in `Africa/Lagos` and in `UTC`, and with a slow first look.
- [x] No app code, gate or baseline changed.
