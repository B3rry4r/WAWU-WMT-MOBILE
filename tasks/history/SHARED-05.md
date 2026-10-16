# SHARED-05 · round history

Moved out of [tasks/SHARED-05.md](../SHARED-05.md) word for word, oldest first. The current state is in that file.

## Builder report

Built by a Sonnet builder, 16 Oct 2026, on `wmt/SHARED-05` from `origin/main` 3117807 (nothing newer to merge). Mobile only.

**Files.** `src/app/_layout.tsx` (the route graph and `useStoredTheme`); the eight route files `payout-account`, `edit-profile`, `social-links`, `open-wallet`, `open-wallet-details`, `open-wallet-selfie`, `open-wallet-account`, `open-wallet-pin` (own sign-in check and its doc lines gone); `SHARED-CHANGES.md` (seven rows applied); new `src/__tests__/route-graph.test.tsx`; `src/features/wallet/__tests__/payoutAccountRoute.test.tsx` (its signed-out case removed with the check it tested).

**Decisions.**
- All listed signed-in routes sit in the same group as `(tabs)` (`signedIn && !gate.needsEmail && !offer.visible`), as the rows ask "beside `(tabs)`". SETTINGS-01 #3 (b) names `signedIn && !gate.needsEmail` without the offer term; the stricter group is the one `(tabs)` already uses, so an unanswered claim offer still comes first.
- `about`, `terms` and `privacy-policy` are plain `Stack.Screen`s after the signed-out group, not inside it: signed-in Settings must open them, and listed before `welcome` they would be the first route of a signed-out cold start.
- KYC-05 R1 says the open-wallet redirect "can stay" once the guard covers it; it was removed anyway, as this task's scope says, so the guard is the one place.

**Capability checks.**
- [x] A signed-out visit to each of the 13 listed routes lands on welcome and a signed-in one draws it (`route-graph.test.tsx`, real Expo Router, the real root layout; 18 of the 39 cases fail on main's layout).
- [x] About, Terms and Privacy policy read signed out and signed in, and a cold start still opens welcome (signed out) or Home (signed in).
- [x] The saved theme (dark, light, system, nothing, unreadable store) is applied to the phone before the first screen is drawn, and nothing is drawn while the store is read (test with a slow store). The phone itself was not run: the web build cannot pin a scheme.
- [x] Affected suites (30 files, 476 tests) pass; full local check (typecheck, lint, 156 suites with 2870 tests, gates 0 fail and 5 warn as on main, tasks): EXIT 0. No mobile CI is available (billing), so this local run is the check.


## Verifier report

_Not started._

