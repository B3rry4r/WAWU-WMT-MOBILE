---
id: BRAND-01
title: The app icon fits the phone, the welcome page has a cover picture, and Settings has a way in
owner: YOU
area: SHARED
order: 235
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [SHARED-04]
decisions: [R-37, R-45]
passes: [V1, V2, V5, V6, V10]
artboards: [A1]
---
# BRAND-01 · The app icon fits the phone, the welcome page has a cover picture, and Settings has a way in

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/BUILDS.md`
- `CLAUDE.md` (the logo is drawn only with `<BrandMark>`; the app's own icon files are the exception this task fixes)
- The owner's phone screenshot (8 Oct 2026, Samsung One UI): the launcher icon shows the logo too large, with "WHO", the top of the P and the drip cut off by the icon shape.

## Goal

The owner tested build c8427c15 and found three things a person sees first:
1. **The launcher icon** is clipped. `assets/images/android-icon-foreground.png` holds the logo at 55% of the canvas and launchers that crop more than the 66% safe zone cut it.
2. **The welcome page (A1)** draws only a brand gradient where the canvas has a cover photo. A video will replace it later; until then it shows a picture from the website.
3. **Settings has no way in.** `src/app/settings/*` exists, but no screen opens it.

## Scope

- Icon: redraw the adaptive foreground so the whole logo, drip included, sits inside the circle safe zone with clear margin (about 40 to 45% of the canvas, centred on the logo's visual weight), on the brand purple background; regenerate `icon.png` and the monochrome icon the same way. Check it under circle, squircle and rounded-square masks (render each) and on a light and a dark wallpaper.
- Opening screen: the splash logo is shown at a sensible size (not 96 px on near-black) and does not shrink or zoom away as the app opens; follow Expo SDK 57's splash options.
- Welcome cover: a picture taken from the website (wawuafrica `public/` or its live landing images), saved in the app's assets, under the existing shade and words; light and dark as drawn. Note the file's source in the report.
- Settings: add the entry where the canvas draws it (find the artboard: the Me tab's header or rows, Z1/Z2 Settings flow), opening `/settings`.
- The rule (R-45): if any of these screens has a section whose task is not built, draw it as designed and leave its tap inert; never hide it.
- The icon and splash change native assets, so a new preview build is needed; the lead runs it after merge.

## Capability checks

- [ ] Icon renders uncut under circle, squircle and rounded-square masks (pictures in the report).
- [ ] The opening screen shows the logo at a sensible size with no zoom-out.
- [ ] A1 shows the website picture under the shade, light and dark, beside `render_design.py A1`.
- [ ] A user can reach Settings from where the canvas puts its entry, signed in.
- [ ] `npm run check` exit 0.

## Builder report

Built 8 Oct 2026 by the lead's builder session. Mobile `wmt/BRAND-01` from origin/main `d29ee55` (R-46 and COMPLETE-01 to COMPLETE-06 already on it). Mobile only: no backend, no contract, no package change (`package.json` and the lockfile untouched), no `_layout.tsx` edit.

**Files.** New: `assets/images/welcome-cover.jpg`, `assets/images/notification-icon.png`, `src/features/me/MeMenuSheet.tsx` (Z1), tests `src/__tests__/brand-assets.test.ts` (10), `src/features/me/__tests__/meMenuRoute.test.tsx` (1). Changed: `assets/images/android-icon-foreground.png`, `android-icon-monochrome.png`, `icon.png` (regenerated); `app.json` (splash `imageWidth` 96 to 128; the notification plugin's `icon` to `notification-icon.png`); `src/features/auth/WelcomeScreen.tsx` (the cover); `src/features/me/MeScreen.tsx`, `ProfileHeader.tsx` and `src/app/(tabs)/me.tsx` (Menu, Z1, `/settings`); `src/features/me/__tests__/MeScreen.test.tsx` (+6 Z1 tests, one old test updated: it asserted Menu absent), `src/__tests__/auth-welcome.test.tsx` (+2); `BACKEND_GAPS.md` G-35; `SHARED-CHANGES.md` SETTINGS-01 #4. Scripts and logs are in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/brand01/` (`make_icons.py`, `make_cover.py`, `preview_masks.py`, `preview_splash.py`, `shots.py`, `standin.js`, `mutants.sh`).

**1. The icon.** The old foreground was the pack's `submark.png` resized to 563 x 614 px of a 1024 canvas (55 to 60%, pixel-identical to the pack file, checked), with its centre of weight above and left of the canvas centre. Samsung's One UI shows about 66 dp of the 108 dp canvas, so the old logo filled 88% of the tile and the circle took its corners (the "before" rows below reproduce the owner's screenshot). Now `make_icons.py` rebuilds all three PNGs from `assets/brand/submark.png` (nothing redrawn): the foreground logo is 413 x 451 px, 44.0% of the canvas tall, centred half way between its visual weight (alpha centroid) and its smallest enclosing circle; its farthest opaque pixel is 272 px from the centre, 87% of the 66 dp safe radius (313 px). The monochrome is the same placement as a white silhouette with the letters knocked out (the rule matches the old file: mean difference 1.5 of 255). `icon.png` (iOS, store) is the logo at 56% on the accent #9411C9, full square. The background layer is untouched. Mask previews, light and dark wallpaper, before and after, circle, squircle and rounded square, 66 dp and 72 dp windows: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/brand01/preview/masks-light.png` and `masks-dark.png`; also `preview/after-geometry.png` (canvas, 72 dp window, 66 dp safe circle), `after-themed-light.png` and `after-themed-dark.png` (the themed monochrome icon), `after-icon-png.png` (store icon, square, rounded, circle), `before-*.png`.

**2. The opening screen.** Read SDK 57's `expo-splash-screen` docs and plugin source, not memory. On Android 12 and later the system shows the splash icon cut to a circle 192 dp across (2/3 of the 288 dp square the plugin draws), so `imageWidth` is also the largest the logo may be. The sticker's farthest pixel is 0.638 of its height from its centre, so 128 dp puts it 82 dp out, 85% of the circle's 96 dp radius (the plugin's own `setSplashImageDrawablesForThemeAsync` was run on this config to make the picture: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/brand01/preview/splash-android.png`, 96 dp beside 128 dp, with the 192 dp circle drawn). The splash colour (near-black, the page colour) is unchanged. On "does not shrink or zoom away": SDK 57's own exit is only a fade (`SplashScreenManager.kt`: alpha to 0 over 400 ms; iOS `SplashScreenManager.swift`: a cross-dissolve; neither scales anything), and the app draws no logo of its own while it starts (`_layout.tsx` returns nothing until fonts and the session are ready, then `hideAsync`). So nothing in the app resizes the logo; a zoom seen on the phone is One UI's own app-open animation, which an app cannot switch off. Not checked on a phone (NOT RUN, V10).

**3. The welcome cover (A1).** Source, read only: the website repo `/home/user/wawuafrica`, `public/wawu-hero-mobile-creators.png` (1024 x 1536 RGBA, the creators hero of its landing page, `LandingContent.tsx` line 359), at website HEAD `c5e6462` when read. The other candidates were rejected: `landing-poster.jpg` is a 270 x 480 blurred frame with the words "Your audience. Your content. Your money." baked in; `services-hero.jpg` is a 1160 x 390 strip; `public/mock/*` are landscape stock scenery; the video cannot be decoded here. The hero shows the web dashboard (with a "WAWU" line) under the five people, so `make_cover.py` cuts at row 975 where the dashboard starts, fades the people out over the last 140 rows, and lays them on the accent purple at 1080 x 2340: `assets/images/welcome-cover.jpg`, 196 KB (the source is 2.5 MB). `WelcomeScreen` draws it first, full screen with `contentFit="cover"`, under the existing shade, words and buttons; it is the same in light and dark, as A1 draws its cover. BACKEND_GAPS G-35 now says the picture is the website's and the owner's own photo or the video is still open.

**4. Settings.** The canvas puts the way in at M1's header: a Menu button (the right-hand glass button) raises the Me menu sheet (Z1, the same rows as M7), and its last row, Settings, opens Z2. Built: `ProfileTop` draws the Menu button (`me-menu-button`) after Share; `MeMenuSheet` is the Z1 sheet (shared `BottomSheet`, `GroupedList`, `ListRow`, `IconTile`) with the canvas's eight rows, order and icons; `MeScreen` holds the open state and the Settings row closes the sheet and calls `onOpenSettings`; `src/app/(tabs)/me.tsx` pushes `/settings`. The Menu button needs no profile, so Settings is reachable while the profile is loading and after it failed (offline). R-46: the seven rows whose screens are not built (Creator dashboard and My content ME-07, My purchases, Saved and Notifications ME-14, My courses SCHOOLS-08, Verification ME-12) are drawn with their icon and chevron and do nothing; they are plain rows, not buttons (no `unbuilt` helper exists yet: COMPLETE-01 adds it, and COMPLETE-04 or ME-03 swaps these for `unbuilt('<task>')`; the task id is in `MENU_ROWS.owner`). The line under each title on the canvas (the month's earnings, counts, the tick state) is a figure the Hub serves to that task's screen, so it is not drawn (rule 7, R-46 "never an invented figure"). QR, the tick prompt and Create on M1 are COMPLETE-04's and are still not drawn.

**Capability checks.** Pictures from the web export (private TMPDIR, `npx expo export -p web --clear`, built with the Hub at :5973 and WAWU ID at :5974 only; the bundle holds no live address) driven by Playwright Chromium at 390 px, 2x, light and dark, against a stand-in Hub and WAWU ID I wrote (`standin.js`, ports 5971 to 5974, all stopped after); every request outside 127.0.0.1:597x was blocked, 0 were made. `shots.py`: 18 of 18 checks passed (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/brand01/shots/report.json`).
- Icon renders uncut under circle, squircle and rounded square: previews above; `brand-assets.test.ts` reads the PNG pixels (farthest opaque pixel inside 90% of the safe circle; logo 40 to 45% tall; centred on its weight; monochrome white with the letters knocked out; icon.png RGB on the accent, inside 75% of a full circle). Not seen on a phone (V10, NOT RUN).
- The opening screen at a sensible size: `imageWidth` 128, at least 120 and inside the 192 dp circle (test reads `splash-icon.png`); no zoom by the app (above). Phone check NOT RUN.
- A1 shows the website picture under the shade, light and dark: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/brand01/shots/A1-light.png`, `A1-dark.png`, beside the canvas at `shots/compare-A1-light.png`, `compare-A1-dark.png` (render left, build right); the cover filled 390 x 844 and loaded at 1080 x 2340 in both; jest checks the source, the fill and that the cover is drawn before the shade, in both themes.
- A signed-in user reaches Settings from where the canvas puts it: `shots/M1-*.png` (Me with Menu), `Z1-*.png` (the sheet), `Z2-*.png` (Settings), `compare-M1-*`, `compare-Z1-*`, `compare-Z2-*`; Playwright: signed in at `/me`, Menu, the eight rows in canvas order, Saved opens nothing and the sheet stays, Settings opens `/settings` and the sheet is gone. With the Hub unreachable (the real cause of the profile error, `M1-offline-*.png`, `Z1-offline-*.png`) Settings still opens. Jest: `meMenuRoute.test.tsx` walks the real route table (root layout, tabs, `settings/index`) signed in with every request failing: Menu, Settings, `/settings`.
- `npm run check`: exit 0 (below).

**Counts.** `npm run check` exit 0 on this branch (origin/main `d29ee55`, no newer main yet): tsc 0, lint 0 errors (2 warnings, both in `src/features/events/__tests__/eventsFocus.test.tsx`, on main and not touched here), jest 95 suites, 1606 tests, gates 9 / 396 files / 0 findings, baseline 0, 269 tasks. Before: not run separately on main; it is that minus the 19 tests this task adds (10 + 1 + 6 + 2) and the 2 new suites, so 93 suites, 1587 tests. Revert proofs (`mutants.sh`, files restored and checked by sha1 each time): 9 mutants, 9 killed: splash back to 96 dp (1 test fails); foreground logo at 55% (2); monochrome without the letters knocked out (1); cover not drawn (2); Menu button never opens the sheet (7); Settings row calls nothing (4); route pushes `/` (1); Menu disabled until the profile loads (3); unbuilt rows wired to Settings (1).

**Defaults (agent), owner may override.** (1) The cover is the website's creators hero with the dashboard cut away, on the accent purple, not a video frame (no decoder here). (2) Foreground 44% of the canvas, `icon.png` 56%, centre half way between visual weight and enclosing circle. (3) Splash 128 dp, same colour; one width for Android and iOS. (4) The notification icon is its own file (white, 88% of 256 px) instead of the adaptive monochrome, which at 44% would have made the status-bar glyph a quarter smaller than before; `app.json`'s notification `icon` points at it. (5) The Z1 sheet is built here with all eight rows (R-46), the same for every account type; ME-03 keeps ownership of the lines under the titles and the wiring of the other rows. (6) Unbuilt rows are plain rows with a chevron (not buttons), until `unbuilt()` exists. (7) Copy: only the canvas's own row titles and "Menu" as the button's screen-reader name. No em-dashes anywhere.

**Known differences from the canvas.** A1: the WAWU logo is the Who Made This mark (R-37); the line under the title is shorter (G-34); the title wraps after "you" (React Native has no `text-wrap: pretty`); the cover is the website picture, not the canvas's stand-in silhouette. M1: QR, the tick prompt and Create are not drawn yet (COMPLETE-04). Z1: no line under the row titles (above); the web page has no status bar and no cover photo under the sheet in these pictures (the stand-in account has none). Z2: no "Wallet and PIN" row or "Delete account" line (WALLET-06, SETTINGS-05).

**Gaps and shared changes.** No new BACKEND_GAPS row (G-35 updated). SHARED-CHANGES SETTINGS-01 #4 updated (Settings entry done here, rest of ME-03 open). Still open and untouched, as `_layout.tsx` is fenced: SETTINGS-01 #3(b), the five settings routes are not inside the signed-in group, so a signed-out visitor can open `/settings` by link.

**NOT RUN.**
- V10 on a phone (the launcher icon under the real mask, the splash at 128 dp and its exit, the notification icon in the status bar, the A1 cover on a real screen, the Menu sheet, Settings): needs the lead's preview build after merge (the icon and splash are native assets, so `runtimeVersion` changes and `eas update` will not carry them). Unblocked by: `eas build -p android --profile preview` from the merged main, installed over c8427c15.
- V9 against the real Hub and WAWU ID: the pictures used a stand-in Hub that answers only what M1, Z2 need; Settings and Me were not walked against a real backend here. Unblocked by: `docs/LOCAL.md` stack (OPS-03) and the SETTINGS-01 and ME-01 V9 runs, which already cover those screens' calls.
- iOS: the splash width and `icon.png` are for the later iPhone release (R-24); nothing on an iPhone.
- A video for the cover: unblocked by the owner supplying it (G-35).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
