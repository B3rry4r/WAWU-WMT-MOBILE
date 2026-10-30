---
id: MIC-PERMS
title: The microphone is asked for on Android and iPhone (app.json stops blocking it), and a gate reads the built permissions
owner: YOU
area: APP
order: -10980
priority: launch
repo: wawu-wmt-mobile
type: setup
status: verifying
depends_on: []
decisions: [R-27, R-47]
passes: [V1]
artboards: []
tier: T1
---
# MIC-PERMS · The microphone permission was never asked for

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/MIC-PERMS` on `origin/wmt/STORE-BUY-APP` `a77f50bb` (the phones' line). Native config: **it ships only in a new store build, never over the air** (the fingerprint changes, below). No screen changed, so there are no pictures; the Voice Intro screen's ask-first behaviour is proved in jest on Android. Status verifying.

**The report (owner, Android, Voice Intro "Record 30 seconds"):** "The microphone permission is never even asked for."

**The cause (proved by running `npx expo config --type introspect --json` on `a77f50bb`):** the built Android manifest has `android.permission.RECORD_AUDIO` with `tools:node="remove"`, and the iPhone Info.plist has no `NSMicrophoneUsageDescription`. `app.json` passed `microphonePermission: false` to `expo-image-picker` (its plugin then blocks RECORD_AUDIO) and to `expo-camera` (its plugin deletes the iPhone key). Both overrode `expo-audio`, whose `recordAudioAndroid: true` is what asks. An app whose manifest does not declare a permission is refused by the phone with no dialog, so the screen (right) showed "We can't use your microphone".

| # | Before (`a77f50bb`) | After |
|---|---|---|
| 1 | manifest: RECORD_AUDIO `tools:node="remove"`; Info.plist: no microphone text | manifest: RECORD_AUDIO and CAMERA present, six unrelated permissions still removed as before; Info.plist: microphone text from `expo-audio` |
| 2 | `expo-image-picker` and `expo-camera` carried `microphonePermission: false` | both options removed; the microphone is declared once, by `expo-audio` |
| 3 | iPhone microphone text "...record your voice for your Voice Intro." | "Allow $(PRODUCT_NAME) to use your microphone to record your voice." (serves Voice Intro and Studio) |
| 4 | iPhone camera text named the wallet selfie only (G-STUDIO2-APP-3) | "Allow $(PRODUCT_NAME) to use your camera for your wallet selfie and to take photos for your work." |
| 5 | nothing read the built permissions | `src/__tests__/native-permissions.test.ts` (6 tests) runs the real introspect; part of `npm test`, so of `npm run check` |

`expo-camera`'s `recordAudioAndroid: false` stays: `withCamera.js` only leaves RECORD_AUDIO out of the permissions it adds (`recordAudioAndroid && 'android.permission.RECORD_AUDIO'`); it never blocks or removes one, and the built manifest shows RECORD_AUDIO present with it set. The iPhone microphone text is expo-audio's (the camera and picker plugins' default sentence did not win; the gate fails if a plugin default ever does).

**The gate.** Asserts on the built config: Android RECORD_AUDIO and CAMERA present and not `tools:node="remove"` (manifest entries and `android.blockedPermissions`); iPhone `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` present, non-empty and not a plugin default sentence; and every permission the code under `src/` needs is not blocked and its iPhone text is there (the code is read for `expo-audio` recording, `expo-camera`, `expo-image-picker` camera or library, `expo-media-library`, `expo-local-authentication`, `expo-calendar`). A new Expo module that asks for something unmapped (`expo-location`, `expo-contacts` and four more) fails until it is added to `NEEDS`. `NATIVE_PERMS_ROOT=<folder>` runs the same check on another project folder.
**Proof it fails on the old config:** a copy of the project with `a77f50bb:app.json` (`cmp` identical), same plugins and node_modules: the real-introspect test FAILS with 4 problems (`RECORD_AUDIO is blocked (tools:node="remove")`, `NSMicrophoneUsageDescription is missing or empty`, and both again as "the code needs it: src/features/verify/voiceRecorder.ts"). On the new `app.json` it passes (`gate-new.log`, `gate-on-old.log`).

**Item 3, the Voice Intro screen: it already asks first, no code change.** `VoiceTakeScreen` shows no refusal on open (`rec.refused` starts null and nothing reads the permission on mount). The first tap on record calls `useVoiceRecorder.start`, which calls `requestRecordingPermissionsAsync()` before `prepareToRecordAsync` and `record`, and only a result with `granted` false sets the refusal ("We can't use your microphone", Allow microphone, or Open settings when `canAskAgain` is false). New `voiceMicAsk.test.tsx` (5 tests, `Platform.OS` android, the real screen and recorder hook; only `expo-audio` is a stand-in) pins: no ask and no refusal before the tap; ask, then prepare, then record, in that order; a real refusal shows the message and never records; Allow microphone asks again; a refusal that cannot be asked again opens the settings.

**Fingerprints** (`npx expo-updates fingerprint:generate`, same machine, before then after; only the `expoConfig` source changed): Android `c2474bd97132baaffa84f36b8dee6109a3e49331` to `59e18905923ba6f82251ff750f11aa45a3b8517a`; iOS `240378f19fb16a59d3be716e17e283dc02166f7a` to `12b4163c535616025f2538ad539e329c7abd5c6f`. Every installed build keeps the old fingerprint, so an OTA update from this branch does not reach them (right: they cannot run it).

**Other native-config items waiting for the next build, found in `tasks/` and in the branches:** none is new. `origin/main` (`aecd5093`) and every `origin/wmt/*` branch touched since 27 Oct have the same `app.json` and `package.json` as `a77f50bb` apart from this task (a branch behind it only lacks lines the phones' line added). Open: (a) SHARED-CHANGES EVENTS-09 #3: the camera text could also say the door scanner reads tickets ("...and to scan tickets at the door"); this task wrote the lead's wording, which does not name the scanner, and the row stays open. (b) The held Studio tools (AITOOLS-06, -08 to -10, cut 30 Oct) will use this microphone and camera text and carry no native config of their own in their task files.

**PHONE CHECK (owner's phone list, on the new store build, never found by him after):** (1) Android: Voice Intro, tap record the first time: the system dialog "Allow Who Made This? to record audio" appears; Allow records; Don't allow shows "We can't use your microphone" with Allow microphone (it asks again once); denied twice shows Open settings. (2) Android App info, Permissions: Camera and Microphone are listed. (3) iPhone: the microphone dialog reads "Allow Who Made This? to use your microphone to record your voice." and the camera dialog the new camera sentence. (4) Wallet selfie, door scanner, the photo pickers and Save to photos behave as before.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `node_modules/expo-camera/plugin/build/withCamera.js`, `expo-image-picker/plugin/build/withImagePicker.js`, `expo-audio/plugin/build/withAudio.js`
- `src/features/verify/voiceRecorder.ts`, `VoiceTakeScreen.tsx`, `SHARED-CHANGES.md` VERIFY-03 #1 and EVENTS-09 #3

## Goal

A recording in the app asks the person for the microphone on Android and iPhone, and a check fails the build of any `app.json` that would stop that again.

## Scope

`app.json` (fenced: SHARED-CHANGES MIC-PERMS #1), `docs/release/DATA-SAFETY.md` (the quoted text), the new gate, the new Voice Intro test, the records. No app code changed.

## Capability checks

- [x] A user on Android who taps record in Voice Intro for the first time is asked by the phone for the microphone (RECORD_AUDIO is in the manifest the build writes and is not removed; the screen asks before it prepares or records).
- [x] A user on an iPhone gets a microphone prompt with the words "to record your voice" (`NSMicrophoneUsageDescription` is in the Info.plist the build writes, non-empty, expo-audio's).
- [x] A user who refuses sees "We can't use your microphone" only after the phone really refused, and can allow again or open the settings.
- [x] A user taking the wallet selfie or scanning at the door is still asked for the camera (CAMERA present; the iPhone camera text names the selfie and photos).
- [x] A builder who puts `microphonePermission: false` (or `cameraPermission: false`) back, or imports a module that needs an unmapped permission, fails `npm test`.
- [ ] On a phone: NOT RUN (no device, and no build may be started). The PHONE CHECK list above goes to the owner before the build.

## Checks (logs in the scratchpad `micperms-b/`, each with its EXIT line)

`tsc --noEmit` EXIT 0; eslint (no fix) on the two new tests EXIT 0; jest `--ci --maxWorkers=2` on `src/features/verify` (all 19 files, the new one included), `native-permissions`, `route-guard`, `appLinks`, `brand`, `brand-assets`, `route-graph`: 25 suites, 614 tests, EXIT 0 (new: `native-permissions` 6, `voiceMicAsk` 5); `python3 scripts/gates/run.py` 10 gates, 1566 files, 0 fail, 17 warn (none in these files), EXIT 0; `check_baseline.py` EXIT 0; gate unit tests 63 OK EXIT 0; `check_tasks.py --write` EXIT 0.
