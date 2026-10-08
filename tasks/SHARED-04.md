---
id: SHARED-04
title: Native modules: the phone can take the wallet selfie, pick photos and copy
owner: YOU
area: SHARED
order: 226
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
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

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
