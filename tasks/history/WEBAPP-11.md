# WEBAPP-11 · round history

Moved out of [tasks/WEBAPP-11.md](../WEBAPP-11.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `public/manifest.webmanifest`, `public/index.html`, `public/pwa/*.png` (generated), `scripts/web/gen_pwa.js`, `package.json` (script `pwa`), `src/features/install/{detect.ts,InstallView.tsx,InstallAsk.tsx,InstallAsk.web.tsx}`, `src/app/_layout.tsx`, tests `installDetect`, `installScreen`, `installAskWeb`, `pwaManifest`; `SHARED-CHANGES.md`, `BACKEND_GAPS.md`.
- **Android Chrome:** persistent Chromium profile, export served behind vercel.json's headers (the CSP's two hosts swapped): `Page.getInstallabilityErrors` [] and manifest errors [], real `beforeinstallprompt` fired once, the Install button called `prompt()` on the real event (1 call). A Chrome `--app` window reported `display-mode: standalone` and drew no install screen (went to the welcome screen). Emulated standalone (matchMedia) and `navigator.standalone` the same.
- **iPhone Safari / in-app:** iPhone Safari UA at 390: Share, Add to Home Screen steps. Instagram (iOS UA): "Open this link in Safari" with Copy link; WhatsApp (Android UA): "Open this link in Chrome"; each with Continue. Chrome on iOS, Firefox on a computer, Chrome with no offer yet: own states. Jest: `installDetect` (one case per browser), `installScreen`, `installAskWeb` (standalone never shows, offer then `prompt()`, Continue, copy writes the opened address).
- **Continue:** `/r/ABC123?x=1`, `/content/abc123`, `/receipt/xyz`, `/`: the address is unchanged while the screen is up and the app opens after it. The invite ends at `/welcome` with `wmt.referral.pending` = ABC123, identical with and without the screen (the app's own signed-out behaviour); `/content` and `/receipt` are kept in `wmt.returnPath`. Reload in the same tab: no screen again.
- **Pictures:** 35 in /tmp/wmt-shots/webapp-11/ (390 light and dark, 1440), all looked at. After the pictures one gap token changed from 2 to `space.xs` (4) to pass the hardcoded-signals gate; not re-shot.
- **Phone unchanged:** `InstallAsk.tsx` imports nothing and returns false/null (jest, Platform ios); `platformPairs` passes; the layout's only phone-visible change is that false. No `app.json`, `eas.json` or native change.

## Verifier report

Verifier (T1, 10 Nov 2026), branch wmt/WEBAPP-11 4fe16e4. Export from a clean worktree (own TMPDIR) served by a node server that applies vercel.json's headers and SPA rewrite verbatim (CSP not changed at all: no hosts needed swapping; Chrome run with a resolver rule that blocks every host but 127.0.0.1, so nothing reached the live Hub). Evidence: /tmp/wmt-shots/webapp-11-verify/ (51 pictures: ua-*, state x 390 light/dark x 1440, install-button, installed, real-chrome) and scripts in /tmp/w11v/.

VERDICT: FIX (two medium defects, both small).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | typecheck EXIT 0; lint EXIT 0 (0 errors, 10 warnings, none in this diff); jest -w 2: 510 suites passed, 17 failed under machine load 30 to 50 (2205 s, a shared box), all 17 re-run alone with -w 1 --onlyFailures: 17 passed, 561 tests (fxTabs, payoutAccountScreen, editEvent, unlockFlow, InboxScreen, ResetPinScreen, hostScreens, tipFlow, buyTickets, VisitorProfileScreen, RoomScreen, auth-welcome, LegalPayments, abroadFlow, roomModeration, slider, fxStrip); gates EXIT 0 (baseline 0, 63 unit tests OK); tasks EXIT 0 (522 tasks). Diff: no existing test changed, only 4 new ones; nothing weakened. |
| V4 | passed | Real Chrome 153: Page.getInstallabilityErrors [] and getAppManifest errors []; name "Who Made This?", start_url and scope "/", display standalone, theme #9411C9 = accent token, background #0B0A0D = surfacePage token; 4 icons + apple-touch load 200 image/png at 192, 512, 192, 512, 180 exact; manifest served application/manifest+json; maskable artwork sits inside the 80 percent safe zone (looked at); zero CSP console errors; beforeinstallprompt fired once, Install pressed calls prompt() once. `npm run pwa` rewrites byte-identical files. |
| V5 | passed with findings | pictures looked at one by one (list above); see M1, M2. No board draws it (G-WEBAPP-11-1), built from shared parts, tokens only, no em-dashes (grep). |
| V6 | passed | every state reached by its real cause (user agent, real beforeinstallprompt, appinstalled event): Install, menu steps, iOS Safari steps, in-app iOS and Android, iOS other, cannot, installed. |
| V7 | passed | Continue from Android Chrome, iPhone Safari, Instagram iOS (same run): /r/ABC123?x=1 ends /welcome with wmt.referral.pending=ABC123 (identical with the screen skipped); /content/abc123, /receipt/xyz, /join, /bills keep their address while the screen is up and are saved as return path after it; reload in the same tab: no screen; a new tab: screen again. Chrome crashed under the load for a few remaining combinations (WhatsApp Android, iOS Chrome, desktop Firefox, desktop Chrome Continue not walked; their states were proved by detection) : NOT RUN for those Continue clicks. Standalone: a real Chrome --app window reports display-mode standalone and shows /welcome, no screen; emulated fullscreen, minimal-ui, standalone: no screen. |
| V9 | NOT RUN | no Hub needed; the screen touches no endpoint. |

Detection (24 user agents, headless at 390): Android Chrome, Samsung, desktop Chrome, desktop Edge, Firefox on Android: Chromium state (menu steps or Install when offered); iPhone Safari, iPad Safari, iPad desktop-mode UA (Macintosh + touch points): iOS Safari steps; iOS Chrome, Firefox, Edge: open in Safari; Instagram, WhatsApp, Facebook, TikTok, X on iOS: open in Safari; the same on Android: open in Chrome; desktop Firefox and Safari: cannot install. All correct; no wrong state.

Phone unchanged: diff touches no app.json, eas.json, ios or android file; InstallAsk.tsx imports nothing and returns false/null; platformPairs and installScreen passed in the full run; an Android-platform render of the root layout was not run separately (NOT RUN, the full suite renders it as before).

Findings:
- M1 defect (medium): in every state with steps (iOS Safari, menu steps, desktop Chrome) the steps card has no vertical padding: "STEP 1" sits against the card's top edge and the last line against the bottom, at 390 light and dark and at 1440 (ios-safari-390-dark.png, ios-safari-1440-light.png, desktop-chrome-menu-1440-light.png). Cause: `Card` without `padded` sets paddingVertical 2 and that beats the `padding: space.lg` passed in `styles.steps` on web. Fix: use `<Card padded>` (or paddingVertical in the style). The builder changed this area after its pictures.
- M2 defect (medium): on a computer (desktop Chrome and Edge with no offer) the screen says "Put Who Made This on your home screen" and step 3 "Open Who Made This from your home screen" (desktop-chrome-menu-*.png). A computer has no home screen. R-131 names Chrome and Edge on a computer. Fix: desktop wording (for example "Install Who Made This" and "Open it from your apps"), steps for the address-bar install icon.
- L1 low: iPad Safari has Share at the top, the step says "at the bottom of Safari".
- L2 low: package.json `"pwa"` line is indented two spaces, inside scripts (works, `npm run pwa` runs).
- L3 low (test-gap): no test pins the desktop wording or the steps card padding; a snapshot of the card style would kill M1.
- Note: with the screen, /bills and /receipt paths were saved as the return path where the screen-skipped baseline run read none (it read localStorage only); both end at /welcome. Not a defect.

## Builder round 1 (fix, 10 Nov 2026)

Merged `wmt/WEBAPP-11-verify` 9a071ca first.
- **M1 fixed:** the steps card is `<Card padded>` (the shared card's own padding, 16 all round); the earlier style override lost to the rows card's `paddingVertical: 2` on web. Measured: STEP 1 sits 16px under the card top at 390 and 1440, light and dark. Test: `installScreen` "M1".
- **M2 fixed (R-131 computer rule):** `detect.ts` has a `mac-safari` kind (Safari 17 or later on a Mac, not Chrome); `InstallAsk.web.tsx` shows nothing for Firefox and other browsers that cannot install, waits `OFFER_WAIT_MS` (2.5 s, blank page colour meanwhile) for a computer's Chrome or Edge offer and then steps aside, shows the Install button on an offer, Add to Dock steps for Safari on a Mac; the "open in Chrome or Edge" screen is gone. No computer copy says home screen (test).
- **Lows fixed:** iPad's Share step says "top of Safari" (`isIpad`, test); the `pwa` line in package.json indented.
- **One assertion changed on purpose:** `installDetect` "iPadOS Safari ... a Mac does not" expected a Mac Safari to be `cannot`; the lead's new rule makes it `mac-safari`, so that line now expects it (commented in the test). Nothing else edited.
- Tests added: Safari 16 and Chrome on a Mac, iPad vs iPhone, card padding, Dock steps, no "home screen" on computer states, and in `installAskWeb`: desktop Chrome with an offer, with no offer (steps aside), Firefox (no screen), Safari 17 on a Mac.
- Pictures: 28 in /tmp/wmt-shots/webapp-11/round1/ (iPhone and iPad Safari, Mac Safari, Android menu steps, Chrome install on a computer, each 390 and 1440 light and dark; Firefox and Chrome-with-no-offer showing the app straight away), all looked at.

