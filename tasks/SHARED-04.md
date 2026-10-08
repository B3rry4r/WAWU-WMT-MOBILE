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
- **Checks:** RECHECK.
- **Also updated:** SHARED-CHANGES ME-06 #1 and ME-11 #1 (`applied (SHARED-04, 41e35ee, 6224f24)`), and `docs/release/DATA-SAFETY.md` CL-03 (the phone sends no photo location; the web build does until the lead's task).
- **NOT RUN:** the real encoder on a phone (Android `Bitmap.compress`, iOS `UIImage.jpegData`) writing no Exif block, and the picture staying upright once the orientation tag is gone (on Android, Glide applies the orientation when the manipulator loads the file). jest models the encoder. Unblocked by V10 on the lead's preview build: pick a photo with location on the phone, then read the uploaded object's bytes for an APP1 segment.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
