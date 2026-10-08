---
id: SHARED-04
title: Native modules: the phone can take the wallet selfie, pick photos and copy
owner: YOU
area: SHARED
order: 226
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V4, V5, V6, V7, V10]
artboards: [A6, A8, M8, M36]
---
# SHARED-04 · Native modules: the phone can take the wallet selfie, pick photos and copy

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files: this task IS the lead's shared-change pass, so it may edit the fenced files its rows name, and nothing else that is fenced)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `SHARED-CHANGES.md` rows: 8, KYC-03 #1, KYC-04 #1, ME-06 #1, ME-11 #1, HOME-02 #2, ME-11 #5, HOME-09 #2 (each row says what to change and why; the status cells were audited on 8 Oct 2026, mobile `fb01391`)
- `docs/BUILDS.md` (the `fingerprint` runtime policy: after this merges, updates wait for a new build) and `docs/EXPO-AGENTS.md` (SDK 57; the QR renderer choice)
- `tasks/KYC-03.md`, `tasks/KYC-04.md`, `tasks/ME-06.md`, `tasks/ME-11.md` (the callers this task turns on)

## Goal

Eight SHARED-CHANGES rows ask for native modules that were never installed, because no task owned the batch. So on a phone today:
- A6 cannot take the wallet selfie (`src/features/open-wallet/selfie/capture.ts` answers `unavailable`), so **nobody can open a wallet on a phone**.
- M8 has no avatar or cover camera button, and M36 has no "Add photos or a video" box.
- A8 copies through React Native's deprecated clipboard.
- Ten todo tasks (MONEY-02, INBOX-14, INBOX-19, INBOX-21, BILLS-02, EVENTS-03, EVENTS-04, EVENTS-06, EVENTS-09, LEGAL-04, PROS-03) wait on row 8's modules (notifications, camera, brightness, calendar, image and document pickers, clipboard, a QR renderer).

## Scope

- **One batch, one build.** With `npx expo install` in a worktree with its own `npm ci` (never through hard-linked node_modules), install every module the rows name: `expo-notifications expo-camera expo-image-manipulator expo-brightness expo-calendar expo-image-picker expo-document-picker expo-clipboard expo-video expo-audio react-native-webview expo-sharing expo-media-library`, plus the QR renderer `docs/EXPO-AGENTS.md` names (`react-native-svg` is already in). Versions are the ones `expo install` picks for SDK 57.
- **Config plugins in `app.json`**, with the permission wording the rows give (the camera text from KYC-03 #1, no microphone, `recordAudioAndroid: false`; the photo library and media library wording; notifications). No permission is asked for that no screen uses.
- **Turn on the four small callers, exactly as their rows say:** KYC-03 A6 selfie (`capture.ts`: the front camera's live preview in the oval, a capture downscaled and re-encoded with `expo-image-manipulator` to fit the server's limits of 100,000 base64 characters and 2,048 px a side, carrying nothing after the image's end); ME-06 `pickImage.ts` and `canPickImage`; ME-11's M36 box; KYC-04 `copy.ts` with `expo-clipboard`.
- The player, the reader and the share picture (HOME-02 #2, ME-11 #5, HOME-09 #2) are SHARED-07. This task only installs their modules.
- Mark each row `applied (SHARED-04, <sha>)` in `SHARED-CHANGES.md`.
- The web build must keep working unchanged (each caller keeps its `.web.ts` file).

## Capability checks

- [ ] `npx expo-doctor` passes; `npx expo prebuild -p android --no-install` in a scratch copy resolves every plugin and writes the permission strings the rows give (show the manifest lines).
- [ ] A6, M8, M36 and A8 draw their controls on the phone build (jest with the modules mocked: the camera button, the oval preview, the capture path's size and encoding limits, the copy call).
- [ ] The web export still builds and A6, M8, M36 and A8 behave as on main there (screenshots).
- [ ] `npm run check` exit 0. V10 on a phone needs the preview build the lead runs after merge: NOT RUN until then, with that reason.

## Builder report

Built by the lead's agent, 8 Oct 2026, mobile only, on `wmt/SHARED-04` from `origin/main` c8928e3 with its own `npm ci` (no hard-linked `node_modules`), then `origin/main` 49ef608 (TIER-01 and NUV-01 merged, no conflict) and 5597ba7 (lead task files; only the generated `docs/PROGRESS.md` conflicted, taken from main and regenerated) merged in. No backend or dashboard change, so the backend and dashboard checks do not apply. Evidence `$E` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bsh04/`.

**Installed** with `npx expo install`, at the versions it picked for SDK 57:
- the rows' modules: expo-notifications 57.0.22, expo-camera 57.0.6, expo-image-manipulator 57.0.21, expo-brightness 57.0.2, expo-calendar 57.0.5, expo-image-picker 57.0.20, expo-document-picker 57.0.3, expo-clipboard 57.0.2, expo-video 57.0.5, expo-audio 57.0.5, react-native-webview 13.16.1, expo-sharing 57.0.22, expo-media-library 57.0.5;
- the QR renderer `react-native-qrcode-svg` 6.3.26 over `react-native-svg` 15.15.4 (`docs/EXPO-AGENTS.md` names none, so row 8's own choice);
- three more, each for a stated reason: `expo-file-system` 57.0.7 (already in the tree under `expo`; now direct, so the selfie's cache file can be deleted), `expo-asset` 57.0.19 (expo-doctor: a required peer of expo-audio, "your app may crash outside of Expo Go without this dependency"), and the four patch bumps expo-doctor asks for, which main was already behind on: expo 57.0.27, expo-linking 57.0.12, expo-router 57.0.25, expo-updates 57.0.25 (`npx expo install --fix`; the lock moves 19 packages by a patch).

**`app.json`** (`$E/AndroidManifest-final.xml`, `$E/ios-usage-final.txt`):
- `expo-camera`: KYC-03 #1's wording, "Allow $(PRODUCT_NAME) to use your camera to take the selfie that opens your wallet.", `microphonePermission: false`, `recordAudioAndroid: false`.
- `expo-image-picker`: "Allow $(PRODUCT_NAME) to open your photos so you can choose a profile picture or add photos and videos to your works.", no microphone.
- `expo-media-library`: "Allow $(PRODUCT_NAME) to save a picture to your photos when you choose Save.", `granularPermissions: []` (no `READ_MEDIA_*`: the only caller, H35's Save, only writes).
- `expo-notifications`: the monochrome app icon in the accent. `expo-calendar`: write-only on iOS, "Allow $(PRODUCT_NAME) to add an event you have a ticket for to your calendar.", no reminders. `expo-audio`: no microphone, no recording, no background playback. `expo-video`, `expo-sharing`, `expo-asset`: as `expo install` added them, without options.
- `android.blockedPermissions`: `RECORD_AUDIO`, `WRITE_SETTINGS`, `READ_CALENDAR`, `WRITE_CALENDAR`, `READ_MEDIA_VISUAL_USER_SELECTED` (why each: decision 1).

**Callers turned on, as their rows say.**
- **A6 (KYC-03 #1), `selfie/capture.ts`.**
  - The front camera's live picture fills the oval once the person allows the camera. The first tap on Take selfie asks and takes nothing; they see themselves, then tap again.
  - A camera turned off for the app (the phone will not ask again) shows "Allow your camera" / "Turn on the camera for this app in your phone's settings, then take your selfie." with **Open settings**. Back from the settings with it allowed, the camera is there (the permission is read again when the app returns to the foreground).
  - A camera that will not start shows A6's "We can't open your camera", its line now "Your phone's camera did not start. Go back and try again." (the old line described a build without the module, which no longer exists).
  - The capture is the camera's in-memory picture (`pictureRef`, never a full-size file), resized to 640 on the long side (never up) and re-encoded as JPEG at 0.85, 0.7, 0.55, then 0.4 until it fits 100,000 base64 characters.
  - Before anything is sent (`selfie/encoding.ts`): whole padded base64 groups; the JPEG start marker first and the end marker as the last two bytes (KYC-02 refuses a byte after it); no side over 2,048 px; at least the server's smallest photo. Anything else is "That photo could not be used".
  - The manipulator can only answer through a file in the app's cache. That file is deleted as soon as its base64 is read, and every native image is released.
  - `SelfieScreen.tsx`: the page colour over the camera rectangle's corners (`ovalMask`), so the live picture shows only inside the oval; the camera-off state and its button. `selfie/types.ts`: `settings` on a ready capture. `capture.web.ts` takes the 640 and the qualities from `encoding.ts` (the same values; nothing else changed).
- **M8 (ME-06 #1), `pickImage.ts`.** `launchImageLibraryAsync({ mediaTypes: 'images' })`, then `fetch(uri)` to a `Blob` (`readPicked.ts`). `canPickImage` is true, so both camera buttons draw. Every picked photo goes up written again as a JPEG, without its Exif block (see "Builder update" below). A library that fails or a file that cannot be read picks nothing.
- **M36 (ME-11 #1), `pickMedia.ts`.** Photos and videos, several at once (`selectionLimit` 8, `WORK_LIMITS.media`; `orderedSelection`), read as M8's are. `canPickMedia` is true. A file that cannot be read is left out.
- **A8 (KYC-04 #1), `copy.ts`.** `Clipboard.setStringAsync(value)` from expo-clipboard, answering what it answered (false on a refusal or an error, so the button never says Copied for nothing).
- The player, the reader and the share picture are not built (SHARED-07); `canPlay` stays false.

**Capability checks.**
- **`npx expo-doctor`: 21 of 21 passed** (`$E/expo-doctor.log`).
  - Its config-schema check fetches from `exp.host`, which this task may not call. The run had a preload (`$E/doctor-pkg/guard.js`, through `NODE_OPTIONS` into every node process) that refuses `exp.host` and asks `api.expo.dev/v2/project/configuration/schema/57.0.0` instead, the address `@expo/cli` itself uses for the same schema.
  - Network log `$E/doctor-net.log`: api.expo.dev and reactnative.directory; the one exp.host request was redirected, never sent.
  - The first run, with exp.host simply refused, found the missing `expo-asset` peer and the four patch versions; both are fixed.
- **Prebuild resolves every plugin:** `npx expo prebuild -p android --no-install` in a scratch copy (deleted after; `android/` never committed) exits 0. Its manifest against main's (`$E/manifest.diff`, `$E/manifest-final-perms.txt`):
  ```
  + <uses-permission android:name="android.permission.CAMERA"/>
  + <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
  + <uses-permission android:name="android.permission.READ_CALENDAR" tools:node="remove"/>
  + <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" tools:node="remove"/>
  + <uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>
  + <uses-permission android:name="android.permission.WRITE_CALENDAR" tools:node="remove"/>
  + <uses-permission android:name="android.permission.WRITE_SETTINGS" tools:node="remove"/>
  + android:requestLegacyExternalStorage="true", and the notification icon and colour meta-data
  ```
  - The packages' own manifests, which Gradle merges in (`$E/library-manifest-permissions.txt`), add `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `CAMERA`, the two storage permissions capped at API 32, and `INTERNET`. No `READ_MEDIA_*`, `ACCESS_MEDIA_LOCATION`, `FOREGROUND_SERVICE*` or `RECORD_AUDIO` survives.
  - iOS (`npx expo config --type introspect`): the camera, photo library, add-to-photos and calendar strings above (write-only, and the pre-iOS 17 key); no microphone, no reminders, no background mode.
  - `docs/release/DATA-SAFETY.md` section 5 and `PLAY-LISTING.md` B5 now list this set.
- **A6, M8, M36 and A8 draw their controls on the phone build:** jest, each module replaced in the test file, as `expo-local-authentication` is in `PinSheet.test.tsx`.
  - `selfieCapture.test.tsx` (13):
    - the first tap asks and takes nothing; once allowed, the front camera and the oval mask show;
    - one tap takes it, resized `{ height: 640 }`, saved `{ format: 'jpeg', compress: 0.85, base64: true }`, sent once as `{ image, checkHandle }`, and the account opens;
    - the quality steps 0.85, 0.7, 0.55 until it fits;
    - never sent when still too large, with bytes after the end marker, not a JPEG, too small, empty, over 2,048 px, or when the camera failed; not enlarged below 640;
    - cache files deleted and native images released;
    - camera off, then Open settings, then back with the camera; a camera that will not start.
  - `selfieEncoding.test.ts` (3).
  - `profile-edit/__tests__/phonePicker.test.tsx` (4) and `works/__tests__/phonePicker.test.tsx` (3): see "Builder update" below.
  - `phoneCopy.test.tsx` (3): A8's Copy calls `setStringAsync('8123456789')` and says Copied; a refusal or an error never does.
  - Changed tests: `editProfile.test.tsx`'s "a phone build without a photo picker draws no camera buttons" now asserts the phone draws both (the change ME-06 #1 asks for; the old assertion described the build this task replaces). `SelfieScreen.test.tsx` and `editProfile.test.tsx` gained mocks of the new modules (they hand A6 their own capture, or never open the library).
  - No test reaches a native call. A probe (`$E/probe/`: every new module mapped to a file that throws on import) shows only `expo-clipboard` is imported by suites that do not mock it: 11, through Home and Wallet's `BalanceCard`, none of which presses Copy. expo-clipboard ships its own jest mock (`mocks/ExpoClipboard.ts`), which jest-expo uses.
- **The web build is unchanged.**
  - Main (c8928e3) and this branch were exported with `npx expo export -p web --clear` (private `TMPDIR`) and served on :5801 and :5802 against a stand-in Hub on :5803 (`$E/web/api.js`: made-up people in the contract's shapes; a made-up session in localStorage, since these are picture checks, not V9).
  - Playwright Chromium at 390 px (`$E/web/drive.py`): A6 reached through A26 and A5, then A8, M8 and M36, light and dark.
  - **All 8 pairs are pixel-identical** (`$E/shots/base-*.png` against `$E/shots/branch-*.png`), and again after main 49ef608 was merged (`$E/shots/merged-*.png`; `$E/shots/sheet-branch.png`). M8 has both camera buttons and M36 the box on web, as on main.
  - 0 requests left 127.0.0.1, and no bundle names a native module.
- **`npm run check` on the merged branch: exit 0** (`$E/check-final2.log`, with main 5597ba7 in): typecheck and lint clean, 81 suites and 1,403 tests passed, gates 9 run on 353 files with 0 fail, 0 warn, 0 accepted, 259 tasks.

**Mutants: 12 of my own, 11 killed, 1 equivalent** (`$E/mutants.json`; each was applied, the 7 spec files run, then `git restore`, and the file checked clean).
- Killed: end-marker check removed (2 tests failed), back lens (1), never downscaled (3), cache file kept (2), copy always true (2), one file at a time (1), HEIC sent as it is (2), camera-off state not offered (1), oval mask removed (1), 2,048 px unchecked (1), quality not stepped (1).
- Equivalent: the first tap going on to take a picture after asking. The camera is only mounted once allowed, so that tap finds none and takes nothing either way.

**Counts before and after.**
- Before (main c8928e3, `$E/check-base.log`): typecheck and lint clean; 76 suites and 1,377 tests, 1,375 passed and 2 timed out at 20 s. Those were A26's and Z3's first tests, the known load timeouts; the load average was about 20 on 4 cores. Gates 9 run, 346 files, 0 fail, 0 warn, 0 accepted. The task check failed on main's FIX-22, fixed on main since.
- After: exit 0, as above.
- Secret scan of the staged diffs: no key-shaped string. The only long run is the base64 alphabet in `encoding.ts`; lock `integrity` hashes were excluded. No em-dash added.

**Decisions (Default (agent), owner may override).**
1. No permission is asked for that no screen uses, so Android blocks:
   - `RECORD_AUDIO`: nothing records.
   - `WRITE_SETTINGS`: expo-brightness's plugin adds it for the system brightness. EVENTS-03's "Brightness goes up" is the app's own (`setBrightnessAsync`), which needs none.
   - `READ_CALENDAR` and `WRITE_CALENDAR`: EVENTS-06's Add to calendar can use the phone's own calendar screen (`createEventInCalendarAsync` from `expo-calendar/legacy`), which needs none. A direct write needs a SHARED-CHANGES row that unblocks them.
   - `READ_MEDIA_VISUAL_USER_SELECTED`, and no `READ_MEDIA_*`: H35's Save only writes, so SHARED-07 asks `requestPermissionsAsync(true)`.
   - expo-audio has no recording and no background playback: both would add permissions, and playback a foreground-service declaration. The microphone strings are removed on iOS too.
2. The permission wording for photos, saving and the calendar (no row gave it). The notification icon is `android-icon-monochrome.png` (white on clear) in the accent.
3. A6: the first tap asks and takes nothing; the camera-off and camera-failed copy above (not drawn); the oval mask; the selfie's cache file deleted (`expo-file-system`). A capture that fails any check is "That photo could not be used", as on web.
4. Pickers: a failed library or an unreadable file counts as nothing chosen. (Every photo going up as a JPEG is now the lead's ruling, below.)
5. `react-native-qrcode-svg` as the QR renderer; the four expo patch bumps and `expo-asset` (expo-doctor).
6. The 11 suites that import expo-clipboard only through Home and Wallet are left as they are (jest-expo's own mock of it; none presses Copy).

**Findings for the lead (not changed here).**
- `SYSTEM_ALERT_WINDOW` is in the main app manifest the prebuild template writes (main has it too), so it ships in release builds; DATA-SAFETY said "debug only". LEAD CHECK on the built APK.
- Firebase Messaging (expo-notifications) can add `com.google.android.gms.permission.AD_ID` at the Gradle merge. PLAY-LISTING's Advertising ID row now says to check the built APK.
- A picture went up as the person chose it, so a JPEG kept its camera data, location included. Ruled by the lead on 8 Oct 2026 and fixed on the phone (below); the web build's side is filed separately by the lead.
- An iPhone's library video is QuickTime, and `profile/work` takes only `video/mp4`, so it fails at upload with the existing "That file did not upload" (Android gives MP4). iOS is after launch (R-24).

**NOT RUN.**
- **V10 (the phone):** there is no device here, and no EAS command may run in this task. Unblocked by the lead's preview build of the merged main (`eas build -p android --profile preview`; the `fingerprint` policy holds updates until it exists).
- **The merged Android manifest and the APK's real permission list:** there is no Android SDK or Gradle here, so the prebuild manifest and the packages' own manifests were read instead. Unblocked by the same build (`bundletool dump manifest`, or Play Console's App bundle explorer).
- **The live camera in the oval, the real encoder's bytes passing the server's JPEG walk, and Open settings on a real phone:** jest replaces the camera and the encoder, and the web build has no live camera. Unblocked by V10 on the preview build, then a sandbox selfie match once the wallet provider's sandbox takes one (G-25).
- **iOS:** only introspected (the Info.plist strings); no iOS build (RELEASE-03).
- **Push:** Android push needs the owner's FCM credentials on Expo (INBOX-21).

## Builder update: photos go up without their place (lead ruling, 8 Oct 2026)

Ruling: "a photo a person uploads must not carry where it was taken". Same builder, same branch, from 5ded313; the worktree was re-created with its own `npm ci`.

- **The change, `src/features/profile-edit/readPicked.ts`** (shared by M8's `pickImage.ts` and M36's `pickMedia.ts`).
  - Every picked photo, whatever its format (JPEG, PNG, WebP, HEIC, GIF), is written again with `expo-image-manipulator` as a JPEG at 0.9, and that file is what goes up and what the screen previews. The encoder writes the pixels and no EXIF block, so no GPS, time or phone details.
  - The photo keeps the size it was picked at (no resize). The only limit is the Hub's own per-upload limit, as before: `MAX_UPLOAD_BYTES` 512 MB, and 100 MB for `profile/work`. The app has no byte limit of its own to apply.
  - A video goes up as it was chosen, with the type the library reports. Its own metadata is not touched: the ruling covers photos, and the phone has no video re-encoder installed.
  - The web build is not changed (`pickImage.web.ts` and `pickMedia.web.ts` still upload the browser's `File`); the lead files that side separately.
- **Specs** (jest; both modules replaced; the encoder modelled as Android's `Bitmap.compress` writes: a JFIF APP0 header, then the image's own segments).
  - `profile-edit/__tests__/phonePicker.test.tsx` (4):
    - The avatar's photo is written again once (`{ format: 'jpeg', compress: 0.9 }`, no resize), and the presign's `contentLength` and the PUT body are the encoder's bytes.
    - **"a photo taken with its place in it goes up without it".** The fixture JPEG carries an APP1 Exif block whose IFD0 points (tag 0x8825) to a GPS block with a latitude, and the test first proves all three are in it. The cover's PUT body then starts with the JPEG start marker and has no APP1 segment, no "Exif" anywhere and no GPS pointer, while the image's own segments (DQT, SOF0) are still there.
    - A PNG cover and a HEIC go up as JPEGs. Closing, a failing library, or a file the encoder cannot read picks nothing.
  - `works/__tests__/phonePicker.test.tsx` (3):
    - A photo taken with its place and a video, picked together, go up in order. The photo's body is the encoder's JPEG, with markers APP0, DQT and SOF0 only and no "Exif"; the video's body is byte-for-byte what was chosen, as `video/mp4`.
    - A WebP, a HEIC and a GIF go up as JPEGs; an unreadable file is left out; closing adds nothing.
- **Mutants: 4, all killed** (`$E/mutants-exif.json`; each applied, both spec files run, then `git restore`, and the file checked clean):
  - E1, the old rule (JPEG, PNG and WebP go up as picked): 5 tests failed, the GPS spec among them.
  - E2, the original bytes go up behind the re-encoded preview: 3 failed, the GPS spec among them.
  - E3, videos written again too: 1 failed.
  - E4, a photo keeps the library's type: 2 failed.
- **Checks:** `npm run check` exit 0 on the branch with main 98f16c6 merged in (`$E/check-r2.log`): typecheck and lint clean, 81 suites and 1,403 tests passed, gates 9 run on 353 files with 0 fail, 0 warn, 0 accepted, 260 tasks. The web build is untouched by this change (no `.web.ts` file and nothing the browser bundle imports changed), so the pixel comparison above stands. Secret scan of the diff: no key-shaped string; no em-dash added.
- **Also updated:** SHARED-CHANGES ME-06 #1 and ME-11 #1 (`applied (SHARED-04, 41e35ee, 6224f24)`), and `docs/release/DATA-SAFETY.md` CL-03 (the phone sends no photo location; the web build does until the lead's task).
- **NOT RUN:** the real encoder on a phone (Android `Bitmap.compress`, iOS `UIImage.jpegData`) writing no Exif block, and the picture staying upright once the orientation tag is gone (on Android, Glide applies the orientation when the manipulator loads the file). jest models the encoder. Unblocked by V10 on the lead's preview build: pick a photo with location on the phone, then read the uploaded object's bytes for an APP1 segment.

## Verifier report

Independent verifier, 8 Oct 2026, mobile `wmt/SHARED-04` at `0b4f3e6` (main `d85492b` differs only in task files and the log), wawu-backend main `657a152` for the server's selfie rules. I wrote none of this code. Fresh detached worktree with its own `npm ci`; a second worktree from main with hard-linked `node_modules` for the web comparison. Evidence `$V` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vsh04/`. Every Expo command ran with the proxy variables unset and a preload (`$V/guard/guard.js`) that refuses and logs any host but loopback: nothing reached exp.host, api.expo.dev or any wawuafrica.com host (logs `$V/guard/net-*.log`). No EAS command.

**Verdict: `building`. Two defects open (D1, D2), both on the M8 and M36 pickers. A6 (the wallet selfie) and A8 hold against every limit I could test.**

| Pass | Result | Evidence |
|---|---|---|
| V1 | **passed, with the known load timeouts.** Typecheck 0, lint 0. Jest: 81 suites, 1,403 tests; 1,401 passed and 2 timed out at 20 s (A26's first test, Z3's first test) at load 13 to 14 on 4 cores. Those two suites rerun alone: 128 of 128 passed. Gates: 9 run, 353 files, 0 fail, 0 warn, 0 accepted. Tasks: 260. **`npm run check` on the report tree at load 4 to 11: exit 0**, 81 suites, 1,403 of 1,403 tests, the same gates, 260 tasks. | `$V/v1-check.log`, `$V/v1-rerun2.log`, `$V/v1-gates-tasks.log`, `$V/final-check.log` |
| V2 | **failed (D1, D2)**; everything else held: the install, the plugins and manifest, A6 against the server's rules, A8, the mocks. | below |
| V4 | **failed (D1, D2)** on odd input; A6's odd input held. | `$V/specs/`, `$V/own-specs.log` |
| V5 | **passed.** Web export of main and the branch, 390 px, light and dark: A6, A8, M8, M36 first states plus 8 states after an action, 16 pairs, all pixel-identical. | `$V/web/shots/`, `pixel-compare.json`, `sheet-branch.png` |
| V6 | **passed on the web** (identical behaviour, below). The phone states are V10. | `$V/web/shots/*-results.json` |
| V7 | NOT RUN: the phone flow needs a device (V10). | |
| V10 | NOT RUN: no device and no EAS here. | |

### The install
- `npm ci` from the lock in a fresh worktree: exit 0, 1,140 packages, 36 s (`$V/npm-ci.log`).
- `package.json` adds exactly the 13 modules the rows name, `react-native-qrcode-svg`, `expo-file-system` and `expo-asset`, and bumps `expo`, `expo-linking`, `expo-router`, `expo-updates` by a patch. devDependencies unchanged. Lock against main: 46 entries added, 22 moved by a patch, 6 moved under another parent (`$V/lock-*.json`).
- `EXPO_OFFLINE=1 npx expo install --check`: "Dependencies are up to date". Offline it reads `expo@57.0.27`'s own `bundledNativeModules.json`; every SDK package in `package.json` matches it, including `expo-asset ~57.0.19` and the four bumps (`$V/expo-install-check.log`). The online list (api.expo.dev) was not read: see NOT RUN.
- The extras are justified: `expo-file-system` is imported by `capture.ts` (the cache delete); `expo-asset` is `expo-audio`'s peer (expo-doctor's peer check passes with it); the QR renderer is row 8's own choice; the bumps are what expo 57.0.27 lists.
- The web bundles differ only in A6's code (`SelfieScreen`, `capture.web.ts`, the new `encoding.ts`) and in two `expo-router` modules (the patch reworks how a `+route.web.tsx` platform suffix is read; `src/app` has no platform-suffixed route). No native module name is in either bundle (`$V/bundle/`).

### `app.json`, the manifest, Info.plist
- `npx expo prebuild -p android --no-install` in scratch copies of main and the branch: both exit 0, no network. The manifest diff is the builder's, line for line (`$V/manifest.diff`, `$V/AndroidManifest-branch.xml`).
- Each permission is used or blocked:
  - `CAMERA`: A6.
  - `MODIFY_AUDIO_SETTINGS`: expo-audio, for SHARED-07's player.
  - `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED`: expo-notifications, INBOX-21.
  - The two storage permissions, capped at API 32: the template and the pickers on old Android.
  - `USE_BIOMETRIC` and `USE_FINGERPRINT`: MONEY-02.
  - `VIBRATE`: the template, notifications.
  - Blocked with `tools:node="remove"`: `RECORD_AUDIO`, `WRITE_SETTINGS` (expo-brightness's plugin applies itself although it is not listed), `READ_CALENDAR`, `WRITE_CALENDAR`, `READ_MEDIA_VISUAL_USER_SELECTED`. No `READ_MEDIA_*`, `ACCESS_MEDIA_LOCATION` or `FOREGROUND_SERVICE*` anywhere.
- I confirmed the two "needs none" claims in the native code:
  - Android `createEventInCalendarAsync` runs no permission check (`CalendarModule.kt`).
  - expo-media-library's write-only request asks for no `READ_MEDIA_*` (`getManifestPermissions`).
- Firebase adds `WAKE_LOCK` and `com.google.android.c2dm.permission.RECEIVE` (normal). I read 19 AAR manifests from Google Maven: firebase-messaging 25.0.1 and its direct dependencies, and the ML Kit barcode tree that expo-camera includes by default (EVENTS-09's door scanner needs it).
- `npx expo config --type introspect` (iOS):
  - The camera string is KYC-03 #1's wording exactly. The photo, add-to-photos and calendar strings are as the builder wrote them, with write-only calendar access.
  - No microphone, no reminders, no background mode.
- `app.json` type-checks against `@expo/config-types` 57.0.2 `ExpoConfig` (tsc 0). Every plugin option it uses exists in that plugin's source (`$V/schema/`).

**The builder's findings, judged:**
- **`SYSTEM_ALERT_WINDOW` in release: correct.** It is in the template's main manifest (main has it too), so a release build declares it. It can be removed now through config: adding it to `android.blockedPermissions` writes `<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" tools:node="remove"/>` in the main manifest, while the template's debug manifest keeps it for development builds (`$V/AndroidManifest-with-AD_ID-block.xml`, `$V/prebuild-block.log`). It is not this task's addition, so it is not counted against SHARED-04.
- **`AD_ID` from Firebase: not found.** None of the 19 AARs above declares `com.google.android.gms.permission.AD_ID`. It can still be blocked now at no cost: `com.google.android.gms.permission.AD_ID` in `blockedPermissions` writes the same `tools:node="remove"` line (shown in the same scratch prebuild). The built APK stays the proof.
- **An iPhone video goes up as `video/quicktime` and `profile/work` refuses it: confirmed** (`V-M3`). iOS is after launch.

### A6 against the server (KYC-02, wawu-backend `src/money/identity/dto/identity-request.dto.ts` and `selfie-image.ts` on main)
| Server rule | Phone | Verdict |
|---|---|---|
| at most 100,000 base64 characters | `<=` 100,000 in the loop and in `isSendableSelfie` | same; exactly 100,000 is sent, 100,004 steps down (V-S1, V-S2) |
| length a multiple of 4; plain base64 | `isWholeJpeg` groups and the same regex | same; a line break or a `data:` prefix is never sent (V-S6) |
| at least 1,000 bytes | 1,024 bytes (1,368 characters) | stricter, matching the contract's "1 KB": 1,024 sent, 1,023 and 1,000 not (V-S5) |
| at most 2,048 px a side (SOF) | the rendered image's sides, `> 2048` refused before any write | same; 2,048 taken, 2,049 refused (V-S4); the real output is 640 |
| a JPEG walked marker by marker, EOI the last two bytes | the first group starts `FF D8`, the last two bytes are `FF D9` | agrees on real encoder output (below); weaker on a crafted file (F1) |

- **Real encoder bytes.**
  - The web selfie's JPEG (Chromium's canvas, which is Skia over libjpeg-turbo, the encoder family Android's `Bitmap.compress` uses): 84,280 characters, 480 x 640, segments APP0, APP2, DQT, SOF0, DHT, then the scan; the backend's own walker passes it.
  - 20 libjpeg samples (PIL; a face-like 480 x 640 at three noise levels, pure noise, 1 x 1; at qualities 0.85, 0.7, 0.55 and 0.4): the phone's check equals the server's verdict for every one (V-S13; `$V/encoder/`, `$V/server/run.js`).
- **Base64 of what.** Android `saveAsync` encodes the compressed bytes with `Base64.NO_WRAP` (no line breaks). The file and the base64 come from two identical `compress` calls. The `PictureRef` is decoded with the EXIF orientation applied and never written to a file (expo-camera `ResolveTakenPicture.kt`).
- **The quality ladder.** It is exactly 0.85, 0.7, 0.55 and 0.4, with no fifth try (V-S3). A capture still too large at 0.4 is "That photo could not be used / Take it again". The samples say this needs pure noise: heavy sensor noise fits at 0.55 (91,252 characters), while pure noise is 142,572 at 0.4. Noted as F2.
- **A capture that fails.** `takePictureAsync` throwing, or the encoder throwing, is `unusable`; nothing is sent. A picture that fails a check is released once (V-P5, V-S10, V-S12).
- **The cache.**
  - Every file the encoder returns is deleted, at every quality and on every refusal. That includes the earlier files when a later save throws (V-S2, V-S3, V-S10).
  - A delete that throws does not stop the capture (V-S11).
  - The one path left is F3.
- **Permissions.**
  - The first tap only asks (V-P1).
  - Refused once while the phone will still ask: no settings button, and the next tap asks again (V-P2).
  - Turned off for good: Open settings. Back still off keeps it; back with the camera allowed brings the camera (V-P3).
  - A tap before `onCameraReady` takes nothing (V-P4).
  - A camera that will not start is `unavailable` (V-P6).
- The selfie's DTO is validated before the handler (global `ValidationPipe`), so a refused image is a 400 and never a charged match.

### M8 and M36 (V2, V4)
- Cancel does nothing: no encoder call, no file read, no request (V-M1).
- The preview is what goes up: `previewUri` is the re-encoded file and the blob is read from it (V-M2).
- A video goes as chosen, with the library's type (V-M3).
- A 1 x 1 photo and a 10,000 px photo are re-encoded at the picked size (V-M4). The builder's GPS spec stands.
- The orientation is applied when Glide loads the file (`expo-image-loader`, default `Downsampler`).
- A picker error and a photo that cannot be read are silent: **D1**.
- A PNG with transparency loses it: **D2**.

### A8 and the mocks
- A8: `copy.ts` answers `setStringAsync`'s boolean.
- On web, main and branch both put the number on the clipboard and say "Copied". The account number keeps `selectable` (`user-select: text` on web).
- Probe run (`$V/probe/`): the full suite again, with each of the 13 new modules mapped to a file that throws on import, and expo-clipboard to a recorder.
  - 0 suites import a new native module unmocked.
  - Exactly 11 suites import expo-clipboard, and 0 calls reach it.
  - The only failures were the same two load timeouts.
- jest-expo's mock answers `false`, so a suite that pressed Copy unmocked would visibly lose "Copied". Nothing is hidden. No test reaches a native call.

### Web unchanged (V5, V6)
- Main `d85492b` and the branch exported with `npx expo export -p web --clear` (private `TMPDIR`; both exit 0), served on :5841 and :5842 against my own stand-in Hub on :5843 (made-up people). Playwright Chromium at 390 px, light and dark; 0 requests left 127.0.0.1 (`$V/web/`).
- Pictures: all 16 pairs identical.
- Behaviour identical on both builds:
  - M8 avatar (a GPS-tagged JPEG) and cover (a PNG): the same presign bodies and the same uploaded bytes by hash. The web still sends the Exif; that is FIX-25.
  - M36: two files, the same two uploads.
  - A6: a corrupt file, a 1 x 1 and a 0-byte file each give "That photo could not be used". A noisy photo sends the same 84,280-character selfie, same hash, then opens the wallet.
  - A8: the clipboard holds `8123450412`, "Copied".
- Not this task: the web M8 presigns and uploads a 0-byte file as a cover (main too).

### expo-doctor and the fingerprint
- **expo-doctor** 1.20.4, with the guard: 19 of 21 passed on the branch, the same as on main (`$V/expo-doctor-*.log`).
  - The schema check needs exp.host and was refused before connecting: NOT RUN.
  - The React Native Directory check needs reactnative.directory: NOT RUN.
  - The SDK version check fell back to the local list.
  - It has no offline flag.
- **Fingerprint** (`@expo/fingerprint` 0.20.13, Android): main `9d9088e07ff7...` and branch `867d75549151...`. 72 sources added (the new plugins) and 12 changed (`expoConfig`, autolinking, the bumped modules) (`$V/fingerprint/`).
  - An update published after the merge reaches only a build with the new runtime. Phones on today's build keep running the last update published before the merge.
  - **The owner must install the new preview APK** that the lead builds from merged main (`eas build -p android --profile preview`).

### Mutants: 16 of mine, each applied alone, the 7 builder spec files and my 2 run, then the file written back byte for byte and `git diff` clean (`$V/mutants/mutants.json`)
- Killed by both the builder's specs and mine: V4 end marker read one byte early, V6 cache file deleted only when it fits, V9 short side to 640, V10 a JPEG goes up as picked, V12 settings whenever refused, V13 no re-read on return, V15 picture never released.
- Killed by the builder's only: V11 re-encode resizes, V16 copy says yes whatever.
- **Killed by mine only: the selfie limits at their boundaries.** V1 `<` not `<=` 100,000; V2 0.4 dropped; V3 0.25 added; V7 2,048 exclusive; V8 a 900-byte minimum. Finding T1.
- Survive both:
  - V14 (asking, then trying to take): equivalent, as the builder found; no camera is mounted yet.
  - V5 (the `% 4` check removed): equivalent in effect, because the tail decode already refuses a partial group, and the encoder always pads.
- 14 of 16 killed, 2 equivalent.

### Findings
- **D1 · defect (M8, M36): a picker error, or a picked photo that cannot be read, is silent.** The brief for this check asks that "a picker error says so plainly".
  - `pickImage` answers `null` for a cancel, a library that throws, and a photo the encoder cannot load (a 0-byte or corrupt file; on a phone, also a HEIC the OS cannot decode or a picture too large to decode). M8's `choose` then returns with nothing on screen.
  - `pickMedia` drops an unreadable file from a pick without a word: pick 3, see 2.
  - The re-encode step is new with this task, so a photo that used to upload as it was can now vanish.
  - Reproduction (`$V/specs/zzVerifierPicker.test.tsx`, run inside the worktree, then removed):
    - V-M7: the library throws, the user presses the avatar's camera button, and `edit-banner` never appears.
    - V-M8: a 0-byte photo on the cover, the same.
    - V-M6: three picked, the middle one corrupt; `pickMedia` returns two and M36 shows no notice.
  - The builder's decision 4 ("counts as nothing chosen") is the cause. I disagree with it: a person who chose a photo and sees nothing has no way to know why.
  - Fix direction: tell a failure from a cancel and show a plain sentence in the banner M8 already has, and in M36's pick notice.
- **D2 · defect, minor (M8, M36): a photo with transparency loses it.**
  - `readPicked` writes every photo as a JPEG, which has no alpha channel. Android's encoder drops the alpha of premultiplied pixels, so a PNG logo's transparent area goes up black.
  - All three upload folders (`avatars`, `profile/cover`, `profile/work`) accept `image/png` and `image/webp` (backend `FOLDER_CONTENT_TYPES`). The web build uploads the same PNG as a PNG and draws it transparent (`$V/web/shots/*M8-after-*`).
  - The lead's own FIX-25 says "PNG kept as PNG where transparency matters".
  - Reproduction: V-M5. An RGBA PNG picked on M8 is saved with `format: 'jpeg'` and goes up as `image/jpeg`.
  - Fix direction: PNG and WebP written again in their own format (Android's PNG and WebP encoders write no Exif), with JPEG for the rest. The location ruling holds either way.
- **T1 · test gap (low, not a defect):** the builder's 7 spec files do not pin the selfie limits at their boundaries; 5 boundary mutants survive them (above). My specs pin them.
- **F1 · unclear (low):** the phone's end check reads only the last two bytes.
  - A JPEG with a second JPEG appended (an Android 14 Ultra HDR file's layout) passes the phone and is refused by the server's walk (V-S7). The refusal is a 400 with no charge, but A6 would then show the server's validator sentence.
  - `Bitmap.compress` appends a gain map only for a bitmap that carries one, and CameraX's default capture has none, so I do not expect it.
  - V10 on an Android 14 or later phone settles it.
- **F2 · low:** no fallback below quality 0.4: a capture still over 100,000 characters there gets "Take it again" with nothing changed. Only pure-noise input does this.
- **F3 · low:** if the native encoder writes its file and then fails, JS never gets that file's address, so it stays in the cache. Separately, M8 and M36's re-encoded copies are never deleted after upload (they carry no Exif).
- **F4 · low (V10):** `takePictureAsync` decodes the full-resolution capture with `maxDownsampling` 1, so no out-of-memory retry. A low-memory phone could get "That photo could not be used" on every try. Check on a low-end phone at V10.
- **Docs (low):**
  - `DATA-SAFETY.md` CL-01 still says `expo-calendar` "is planned" and asks the lead to check its read permission, which is now blocked.
  - Section 5 does not list Firebase's `WAKE_LOCK` and `c2dm.permission.RECEIVE` (both normal).
  - On iOS the camera string names only the selfie, though EVENTS-09 will use the camera to scan tickets. iOS is after launch.

**Decisions, judged:**
1. Blocked permissions: agree, each confirmed in the native code.
2. Wording and the notification icon: agree (iOS camera note above).
3. A6's first tap, the camera-off and camera-failed copy, the mask and the cache delete: agree.
4. Pickers silent on failure: disagree (D1).
5. QR renderer, `expo-asset` and the patch bumps: agree.
6. The 11 clipboard suites: agree; the probe shows 0 calls.

The "every photo as a JPEG" part of the ruling's implementation: disagree for transparent formats (D2).

### NOT RUN
- **V7 and V10 on a phone**, including the live camera in the oval, the real `Bitmap.compress` bytes through the server's walk, Open settings, D1 and D2 on a device, F1 and F4. Unblocked by the lead's preview build of merged main (`eas build -p android --profile preview`).
- **The APK's merged manifest** (no Android SDK or Gradle here). Unblocked by `bundletool dump manifest` on that build, or Play Console's App bundle explorer.
- **expo-doctor's schema and React Native Directory checks**, and the online `expo install --check`. They need exp.host, reactnative.directory and api.expo.dev, which this task may not call. Unblocked by running them where those hosts are allowed.
- **iOS** (RELEASE-03).

## Lead rulings after the verifier (8 Oct 2026)

On mobile `wmt/SHARED-04` c26d229 ("Verifier report"), as the lead sent them:

1. D1: a cancel stays silent, but a picker that throws, or a photo the encoder cannot read (0-byte, corrupt), says so plainly: on M8 a short message ("We couldn't open that photo. Try another one."), on M36 the box says how many could not be added ("1 photo couldn't be added. Try it again or choose another."). Your decision 4 is withdrawn. Use the shared toast or the screen's existing error line; no new component. The verifier's V-M6, V-M7, V-M8 become passing specs.
2. D2: keep transparency. PNG stays PNG and WebP stays WebP (re-encoded with expo-image-manipulator in the same format, which still drops Exif and GPS); JPEG, HEIC and HEIF become JPEG at 0.9; a GIF becomes PNG (first frame). Spec: an RGBA PNG goes up as PNG with no metadata chunk (eXIf, tEXt with GPS) and its alpha intact.
3. T1: add the verifier's selfie boundary specs to the task's own specs (copy from the evidence folder /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vsh04/; never edit the originals) so the five boundary mutants die in our suite.
4. F1: the phone's end-of-image check must match the server's rule exactly (read it in wawu-backend main); a JPEG with a second JPEG appended must be refused on the phone too.
5. F3: delete the leftover cache path and M8/M36's re-encoded copies after upload (success or failure).
6. Block SYSTEM_ALERT_WINDOW and AD_ID in release through android.blockedPermissions (debug may keep the first, as the verifier showed). Confirm with a scratch prebuild that both carry tools:node="remove".
7. Docs: DATA-SAFETY.md CL-01 (calendar), section 5 (Firebase's permissions after the blocks), PLAY-LISTING B5 to match. The iOS camera string stays as is (EVENTS-09 updates it when it scans tickets; note it in SHARED-CHANGES).
8. F2 and F4 stay as notes for V10.

## Builder report, round 2

Same builder (the lead's agent), 8 Oct 2026, on `wmt/SHARED-04` from c26d229, with `origin/main` d85492b and then d1549cb merged in (each time only the generated `docs/PROGRESS.md` conflicted: taken from main and regenerated). Fresh worktree with its own `npm ci`. Code commit 6c1e286. Evidence `$E` = `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bsh04/`.

**1. D1, a failure is said; a cancel is not.**
- `pickImage.ts` (phone) resolves null for a cancel only. A library that throws, and a photo the encoder cannot read or that reads as 0 bytes (`PickFailed`, `readPicked.ts`), now reject.
- M8 (`EditProfileScreen.choose`) catches that and puts "We couldn't open that photo. Try another one." (`PICK_FAILED`, `failure.ts`) in the screen's existing banner (`edit-banner`).
- `pickMedia.ts` (phone) leaves an unreadable file out and tells `onUnreadable` the kind of each one; a library that fails rejects.
- M36 (`AddWorkScreen.add`) puts the count in the box's existing pick notice: "1 photo couldn't be added. Try it again or choose another." (`mediaUnreadable`, `form.ts`; "2 photos ... Try them again or choose others.", "video" or "file" when that is what failed). It comes before the "A work can carry up to 8" sentence when both apply. A library that fails says "We couldn't open your photo library. Try again." (`MEDIA_LIBRARY_FAILED`; no ruling gave M36 a sentence for this case, written in the canvas's tone).
- No new component. The web files (`.web.ts`) are unchanged: they never fail that way, and `pickMedia.web.ts` ignores the callback.
- Decision 4 of round 1 is withdrawn.
- Specs:
  - V-M7: the library fails on M8, and the banner says so.
  - V-M8: a 0-byte photo and a corrupt one on M8, and the banner says so.
  - V-M6: three picked with the middle one corrupt; two go up and the notice says one could not be added.
  - Also: a 0-byte video, the count's wording by kind, M36's library failure, and a cancel that stays silent on both screens.

**2. D2, transparency kept** (`readPicked.ts` `rewriteFor`):

| Picked type | Written as | Goes up as |
|---|---|---|
| PNG | PNG (lossless) | `image/png` |
| WebP | WebP at 0.9 | `image/webp` |
| GIF | PNG of its first frame | `image/png` |
| JPEG, HEIC, HEIF, or an unnamed type | JPEG at 0.9 | `image/jpeg` |

- Every photo is still written again by the encoder, so no Exif, eXIf or text chunk travels with it.
- Spec (`profile-edit/__tests__/phonePicker.test.tsx`): a 2 x 2 RGBA logo with real CRCs carries an `eXIf` chunk with a GPS pointer and a `tEXt` "GPS" chunk.
- The encoder is modelled as Android's PNG writer: the signature and the critical chunks only.
- The upload is checked to be `image/png`, with chunks IHDR, IDAT and IEND only, and no "eXIf", "tEXt" or "GPS" anywhere. IHDR is colour type 6, and the inflated pixels equal the source's, with the transparent pixel still at alpha 0 and the half-transparent one at 0x80.

**3. T1, the verifier's selfie specs in our suite.** `open-wallet/__tests__/selfieLimits.test.tsx` is a copy of `vsh04/specs/zzVerifierSelfie.test.tsx` (the original untouched) with three changes:
- Its fixture JPEGs are ones the server's walk accepts, because the phone now walks them.
- V-S7 now expects the appended JPEG to be refused (F1), and the same first JPEG alone to be sent.
- V-S13 is not copied, because it read the verifier's encoder samples from outside the repo. Instead I ran those 22 real samples (20 libjpeg, 2 Chromium) once against the new walk: the phone's verdict equals the server's for every one (`$E/agree-pil-samples.json.txt`, `$E/agree-web-selfies.json.txt`).

18 specs (V-S1 to V-S12, V-P1 to V-P6). The five boundary mutants now die in the task's own specs:

| Verifier mutant | Killed by |
|---|---|
| V1, `<` for `<=` 100,000 | V-S1 |
| V2, 0.4 dropped | V-S3 |
| V3, 0.25 added | V-S3 |
| V7, `>=` 2,048 | V-S4 |
| V8, a 900-byte minimum | V-S5 |

**4. F1, the server's rule exactly.**
- `selfie/encoding.ts` now holds wawu-backend main 657a152's `isJpeg`, `sofIsSane` and `sosIsSane` (`src/money/identity/selfie-image.ts`), ported line for line, as `isServerJpeg`. `isWholeJpeg` is that walk over `base64Bytes`, a full decoder that takes padding only at the very end, as the server's regex and length check do.
- A JPEG with a second JPEG appended is refused, as are bytes after EOI, a cut-off file, a stray marker in a scan, a frame over 2,048 px or of 0 px, a missing or second frame, and a bad scan header.
- Stuffed `FF 00`, restart markers and a progressive file's between-scan tables are taken (`selfieEncoding.test.ts`, 9 specs).

**5. F3, no copy left.**
- **The selfie.** `encodeSelfie` lists the manipulator's cache folder (`<cache>/ImageManipulator/`, the same on Android and iOS) before it starts. When it ends, it deletes any file written meanwhile, which covers a file the encoder wrote before failing, whose address never reached the app. Spec: a save that writes and then throws leaves the cache empty. The helpers are in `src/features/media/manipulatorCache.ts`.
- **M8 and M36.**
  - `readPicked` gives each photo a `discard` that deletes the app's copy. `uploadPicture` and `uploadWorkFile` call it in `finally`, so once the upload settles, whether it worked or not. A retry sends the bytes already in memory.
  - A file beyond the 8 a work can carry is discarded at once.
  - The library's own copy of a photo, which still holds its Exif, is deleted as soon as it has been written again, but only when it sits in the app's cache (`Paths.cache`); a file of the phone's own is never touched. A video's library copy in the app cache goes after its upload.
  - Because M8 shows its preview only after the upload, on the phone the preview is now the uploaded picture's own address (`fileUrl`). The web build, which has no `discard`, keeps its local preview.
  - M36's thumbnails are drawn as each pick is added. expo-image reloads only when the address changes, so a drawn thumbnail stays after its file goes; one that had not loaded yet falls back to M36's existing placeholder. V10 checks this.

**6. The two blocks.** `android.blockedPermissions` adds `android.permission.SYSTEM_ALERT_WINDOW` and `com.google.android.gms.permission.AD_ID`. A scratch `npx expo prebuild -p android --no-install` (deleted after) writes both into the main manifest with `tools:node="remove"`; the template's debug manifest still declares `SYSTEM_ALERT_WINDOW` for development builds (`$E/manifest-r2-perms.txt`, `$E/manifest-r2-debug-perms.txt`, `$E/AndroidManifest-r2.xml`).

**7. Docs.**
- `DATA-SAFETY.md` CL-01: the calendar is installed, permissions removed, add through the phone's own calendar screen, write-only on iOS.
- Section 5: Firebase's `WAKE_LOCK` and `c2dm.permission.RECEIVE` (normal); `SYSTEM_ALERT_WINDOW` and `AD_ID` removed; the removed list confirmed in a scratch prebuild.
- `PLAY-LISTING.md`: B5, Advertising ID and Photo and video permissions rows match.
- SHARED-CHANGES:
  - 8 and KYC-03 #1 carry round 2. The iOS camera string stays the selfie's wording; EVENTS-09 updates it when it scans tickets.
  - ME-06 #1 and ME-11 #1 read `applied (SHARED-04, 41e35ee, 6224f24, 6c1e286)` with D1, D2 and F3.

**8. F2 and F4** stay notes for V10, below.

**Checks.**
- **Specs this round:** `selfieEncoding` 9 (rewritten), `selfieLimits` 18 (new), `selfieCapture` 14 (+1, F3), M8 `phonePicker` 8 (rewritten), M36 `phonePicker` 8 (rewritten).
- **`npm run check`:** exit 0 on the branch with main d1549cb merged in (`$E/check-r3.log`, load about 12 on 4 cores): typecheck and lint clean, 82 suites and 1,437 tests passed, gates 9 run on 355 files with 0 fail, 0 warn, 0 accepted, 262 tasks.
- **Web unchanged:** the branch re-exported (`npx expo export -p web --clear`, private `TMPDIR`), served on :5802 against my stand-in Hub on :5803, Playwright Chromium at 390 px. A6 (through A26 and A5), A8, M8 and M36, light and dark: **all 8 pixel-identical** to main's (`$E/shots/round2-*.png` against `$E/shots/base-*.png`). 0 requests left 127.0.0.1, and no native module name is in the bundle.
- **Typecheck and lint:** clean.
- **Secret scan:** no key-shaped string. No em-dash added.

**Mutants: 21 run** (`$E/mutants-r2.json`; each applied, 10 spec files run, `git restore`, the file checked clean).
- **The verifier's five boundary mutants:** V1, V2, V3, V7 and V8 are all killed by `selfieLimits`.
- **16 on round 2: 15 killed, 1 equivalent.**

| Mutant | Tests failed |
|---|---|
| R1, M8 silent on a failed pick | 2 |
| R2, M36 silent when the library fails | 1 |
| R3, unreadable files not reported | 2 |
| R4, a 0-byte file taken | 1, killed by the 0-byte video spec, added after it first survived |
| R5, PNG as JPEG | 2 |
| R6, WebP as JPEG | 2 |
| R7, GIF as JPEG | 2 |
| R8, bytes after EOI taken | 5 |
| R9, the frame side unchecked | 1 |
| R11, the selfie sweep removed | 1 |
| R12, M36's copy kept | 2 |
| R13, M8's copy kept | 2 |
| R14, the library copy with Exif kept | 1 |
| R15, M8 previewing the deleted copy | 1 |
| R16, the copies beyond the limit kept | 1 |

- **Equivalent:** R10, a stray marker in a scan making the inner loop `break` instead of `return false`. The outer loop then refuses every marker except the between-scan ones and SOS, which are exactly the ones the inner loop breaks on, so the server's own second check is redundant.

**Decisions (Default (agent), owner may override).**
1. M36's sentence when the library itself fails, and the count's "video" and "file" wording (only the photo sentence was given).
2. On the phone, M8 previews the uploaded picture once its copy is deleted.
3. The library's own copy of a photo, which holds its Exif, is deleted from the app's cache once the photo has been written again.
4. A 0-byte file, photo or video, counts as unreadable.
5. A WebP is written at 0.9 (lossy, alpha kept); a PNG is lossless.
6. V-S13 checked once against the verifier's samples rather than committed, because the samples live outside the repo.

**NOT RUN.**
- **V10 and the merged APK manifest:** no device here, and no EAS command may run in this task. Unblocked by the lead's preview build of merged main (`eas build -p android --profile preview`; `bundletool dump manifest` for the merged manifest). On it:
  - the banner and notice on real failures (a HEIC the phone cannot decode, a cloud photo not downloaded);
  - a transparent PNG staying transparent through Android's encoder;
  - M36's thumbnails after their copies go;
  - M8's preview loading the uploaded picture.
- **F2:** no fallback below quality 0.4; only pure noise is still over 100,000 characters there. Check on the phone.
- **F4:** the full-resolution decode has no out-of-memory retry. Check on a low-end phone.
- **iOS:** RELEASE-03.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
