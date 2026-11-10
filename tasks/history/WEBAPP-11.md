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

