---
id: RESET-APP
title: The Forgot password email's link opens the app's New password screen (R-123)
owner: YOU
area: AUTH
order: -1301
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-123, R-48, R-27, R-29, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# RESET-APP · The mailed reset link opens the app

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T2, identity), mobile `wmt/RESET-APP` on `origin/wmt/STORE-BUY-APP` `2a9dadcb`, web `wmt/RESET-APPLINK` on `origin/main` `b7b014a` (**HELD: never merge until the build with this screen is on phones**). Status verifying. Lead defaults, owner may override.

Cause (lead, live): the app's Forgot password (A23) asks WAWU ID with `method: email`; WAWU ID mails `https://wawuafrica.com/reset-password?token=...&email=...`. That address was not an app link, so a phone opened the browser, and the website's join-only mode sent it to /join (`wmt/RESET-WEB` opens the page on the website today). This task makes the same link open the app for a person who has it.

| # | Before | After |
|---|--------|-------|
| 1 | `/reset-password` was no app link: the phone opened the browser | `app.json` Android intent filter gains `path: /reset-password`; the website's Apple file lists it (web `wmt/RESET-APPLINK`, held); iOS `associatedDomains` unchanged |
| 2 | no screen set a password from a link; the app had only Change password (signed in) | route `src/app/reset-password.tsx` (outside every guard, listed in `route-guard.test.tsx` PUBLIC with the reason) opens `ResetPasswordScreen`: the email (read only), New password, Confirm password, show/hide, Save password |
| 3 | `identity.ts` had no reset call | `resetPasswordRequest(token, email, password)` posts `{ token, email, password }` to WAWU ID `POST /auth/reset-password` (the email-link fields of `ResetPasswordDto`, 8 to 128 characters; no session on this path) |
| 4 | an expired or used link could not be told apart | WAWU ID answers one 401 for a wrong, expired or used token: one plain screen "This link no longer works / It has expired or was already used. Ask for a new one." with "Back to Forgot password" (email filled in) |
| 5 | sign-in always opened empty | after "Password changed", Sign in opens `/sign-in?email=` with the email filled in; the password is not |

### Decisions (lead defaults, owner may override)

- **Signed in already: the link works.** The token in the link is the proof (the mailbox), so a session adds nothing and asking someone to sign out first only adds a step. After "Password changed", Sign in ends this phone's session first (WAWU ID has already ended every session of that account; sign-in is a signed-out screen) and opens sign-in with the email filled in. An expired link opened by someone signed in shows "Close" (to Home) instead of Forgot password, which is a signed-out screen, and keeps the session.
- **No board draws New password.** `design/_gen/auth.js` line 25 (`reset`: bar "New password", fields "New password" with "At least 8 characters" and "Confirm password" with "Passwords match", button "Save password") is drawn and emits no artboard; A24 says "The emailed link opens New password". Built from that line and A23's frame. The read-only email field, "Password changed" and "This link no longer works" are drawn by no board; they use existing parts (`TextField` disabled, the kit `result` layout through `OpenWalletEnd`, as A24) (R-29, gap row below).
- **WAWU ID does not sign the person in on this path** (it answers a message only), so success goes to Sign in, not Home.
- A link with no token, no email, or an email that is not one opens the "no longer works" screen at once and sends nothing.
- WAWU ID's published contract does not list `POST /auth/reset-password`, so the body is typed by hand (G-RESET-APP-1).

### Fingerprints (`npx fingerprint fingerprint:generate`, computed)

| Platform | Before (`2a9dadcb`) | After |
|---|---|---|
| android | `e871fe1a355ac5a50d47a0b1325fe54fc159c80b` | `90f8c05211fd9208d72510c114a2bf07a8a55ee0` |
| ios | `e8e7de8550c68bf499b295c2b0ed6414e50d12b8` | `db378ce77f1004becd5d1da501b56de38e52fbd9` |

**Both change, not only Android's.** The only source that differs on either platform is `expoConfig` (checked source by source, before and after): `@expo/fingerprint` hashes the whole Expo config, `android.intentFilters` included, for the iPhone too, so the one `app.json` hunk (5 lines, the `/reset-password` data entry) moves the iOS fingerprint from `e8e7de85` to `db378ce7`. Consequence: once that hunk is merged, an over-the-air update no longer reaches store builds that carry the old fingerprints (iOS `e8e7de85`, Android `e871fe1a`). The screen, route, call and tests are plain JavaScript and are safe over the air on their own; the `app.json` hunk (and its pin in `src/__tests__/appLinks.test.ts`, three lines) is the only part that needs the next native build. If the batch must still go over the air to the current builds, leave that hunk out until the native build; nothing else depends on it. On iOS the link opens the app only when the website's Apple file lists the path (held web branch) and the build has the route.

Proof (local WAWU ID reset round trip, jest counts): `tasks/history/RESET-APP.md`.

### PHONE CHECK (only a real phone proves these)

1. iPhone, build with this route AND the website's Apple file live: tap the link in Mail. The app opens on New password (not Safari). A phone without the app opens the website's reset page.
2. Android, the new store build: tap the link in Gmail. The app opens on New password. (The app link verifies only after the new build is installed and wawuafrica.com serves `assetlinks.json`; long-press the link, Open with Who Made This? if the phone asks.)
3. Save a new password, tap Sign in: the email is already in the field; the new password signs in and the old one is refused.
4. The keyboard on both phones: the New password field is focused on open; Save is never under the keyboard; Next moves to Confirm and Go saves.
5. Android back on the screen opened from Gmail: it returns to Gmail, not to a blank app.
6. The password manager (iCloud Keychain, Google) offers to save the new password against the email.

### Gap rows

| # | Board | Gap | Built from |
|---|-------|-----|------------|
| 1 | none for New password | read-only Email field above the two fields; "Password changed"; "This link no longer works" | `TextField disabled`; `OpenWalletEnd` (kit `result`, A24's layout) |

### Records

`DECISIONS.md` R-123 (app half; the website half is `wmt/RESET-WEB`), `docs/LOG.md` (one line), `BACKEND_GAPS.md` G-RESET-APP-1, `SHARED-CHANGES.md` RESET-APP #1 (`src/app/_layout.tsx`), `tasks/INDEX.md` (`check_tasks --write`).

### The held web branch

`B3rry4r/WAWUAfrica` `wmt/RESET-APPLINK` (from `origin/main` `b7b014a`): `APP_LINK_PATHS` gains `/reset-password`, so the Apple file lists it. **HOLD: never merge** until the build with the app route is on phones (an iPhone on build 8 would open the app, which has no such screen). `wmt/RESET-WEB` (the website's page for a phone without the app) is separate and may go first.

Pictures (390 dark and light, 360 x 640 light, beside A23 and A24; no board draws New password), checks with EXIT lines and the changed assertions: `tasks/history/RESET-APP.md`.

## Scope

`src/app/reset-password.tsx`, `src/features/auth/ResetPasswordScreen.tsx`, `src/features/auth/resetPassword.ts`, `src/api/identity.ts` (one call), `src/app/sign-in.tsx` (reads `email`), `src/app/_layout.tsx` (one loose screen), `src/app/preview/auth.tsx` (development), `src/lib/appLinks.ts`, `app.json` (the intent filter), the tests above and `src/__tests__/route-guard.test.tsx` / `appLinks.test.ts` (the lists they pin), and the records named. Nothing else.

## Capability checks

- [x] A person with the app taps the mailed link and lands on New password with their email shown; Save sets the password; Sign in opens with the email filled in and the new password signs in; the old one is refused (local WAWU ID `origin/main`, mail stand-in; jest on Android and iPhone).
- [x] An expired, used or mangled link, and an address with no token, each show "This link no longer works" and change nothing (local WAWU ID; jest).
- [x] Signed in, the link still works, and Sign in ends the phone's session first (jest, real router and session).
- [x] The form checks length and match before it sends, one tap sends once, a refusal keeps what was typed (jest on Android and iPhone).
- [x] Android back and the round back button (jest, real handlers); the keyboard pads the screen by the phone's own events on both phones (jest).
- [x] Pictures at 390 dark and light and 360 x 640 beside A23 and A24 (no board for New password).
- [x] Fingerprints computed: both change (the Expo config is hashed for each platform), see the table.
- [ ] PHONE CHECK 1 to 6 above (a real phone, the new Android build, the held Apple file live).
- [ ] Verifier: pictures and a read of the code (a separate Sonnet verifier, not the builder).
