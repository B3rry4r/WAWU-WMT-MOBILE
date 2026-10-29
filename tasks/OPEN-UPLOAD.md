---
id: OPEN-UPLOAD
title: Open your wallet on Android: the ID and bill upload reaches the Hub, a lost photo is asked for again, ID photos are brought down in size, and a failed upload keeps the saved details in view
owner: YOU
area: APP
order: -10901
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-6, R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# OPEN-UPLOAD · The ID and bill upload on the phone

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T2), mobile `wmt/OPEN-UPLOAD` on `origin/main` `b426f8fb`. App code only: no backend change, no native change, `package.json`, `app.json` and `eas.json` untouched. Status verifying.

**The report (owner, Android store build 4, Nuvion test system):** on "Proof of address" Submit showed "No connection. Check your internet and try again." with internet on; Nuvion had the person (status incomplete) and 0 documents; the postal code and the document type were gone from the screen afterwards.

**The cause (proved):** not a deleted photo. The phone's global `fetch` is Expo's (`expo` 57 installs `expo/fetch` over React Native's in `src/winter/runtime.native.ts`; `EXPO_PUBLIC_USE_RN_FETCH` is not set). Expo's fetch builds a form body in JavaScript (`convertFormDataAsync`) and cannot read React Native's `{ uri, name, type }` part: it throws `Unsupported FormDataPart implementation` before any request starts (its own unit test says so: "should throw an error if the react-native FormData passing an uri"). `appendFile` in `api/documents.ts` sent every phone file as that `{ uri }` part, and the client's `onError` turns any throw into "No connection". So no document ever left the phone, on any Android or iOS build; the open call (plain JSON) had already succeeded, which is why the person existed with no documents. Jest and the web build never saw it: jest's `FormData` is Node's (a `{ uri }` object becomes the text "[object Object]") and the web sends the blob.

**The lead's hypothesis (a deleted photo) is killed as the cause:** nothing deletes the held copies between the pick and Submit (`discard` runs only on replace, on `clearFiles` after a full success, and when the last of A26 and A27 closes; `documentsFlow.test.tsx` already pins that A26 to A27 keeps them, and `openUpload.test.tsx` pins that a failed upload keeps them). Even a present file would have failed, because the throw is before any file is read. A file lost later would fail the same way, so the check below is kept as asked.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | every phone upload threw in Expo's fetch, shown as "No connection"; 0 documents sent | the phone sends each file as its bytes with the picker's name and type (`api/documents.ts`), the way the browser does; `uploadPhone.test.ts` runs the phone's own runtime (React Native `FormData` with Expo's patch, whatwg `Request`, Expo's real `fetch` and form conversion, `Platform.OS` android): 3 tests fail before ("Unsupported FormDataPart implementation"), pass after |
| 2 | a photo or file the phone had lost would go on to fail the same way | `PickedFile.stillThere` (set by `documents/pick.ts` from the file system); `sendOpening` checks all held files before the details go up and again before the files; a gone one is dropped and asked for again: "Take the photo of your ID again" / "Choose your bill or statement again"; nothing is sent; never "No connection" |
| 3 | an ID photo kept the camera's full size (a 12 to 50 MP JPEG at 0.9) | camera or library ID photos: long side 2000 px, JPEG at 0.8 (`readPicked` options `maxSide`, `jpeg`, `quality`; default for every other caller unchanged); a bill photo is brought down to 2000 px and keeps its kind; a PDF goes as it is; the Hub's limits are unchanged |
| 4 | after a failed upload the opening existed, so the postal code and the document type were hidden with no word | the screen says "Your details are saved" / "Your photos didn't upload. Check your internet and tap Try again." and the button reads Try again (only the photos are sent again; the open call is not repeated); the postal code, document type and address stay on view, read only; a Hub sentence about a refused file is kept as it is with "Your details are saved." beside it |

Defaults (lead), owner may override: 2000 px and JPEG 0.8 for ID photos; the same 2000 px cap for a bill photo; the lost-file check is belt and braces (the bytes are held in memory, so a lost cache file would not stop the upload).

Changed assertion, named: `documentsFlow.test.tsx` "Sending a file from the phone" pinned the `{ uri, name, type }` part (the defect). It now asserts a Blob part with the name and the type (comment in the test).

Checks (logs in the scratchpad `openup-b/`, each with its EXIT line): `npx tsc --noEmit` EXIT 0; eslint (no fix) on the 12 changed ts and tsx files EXIT 0; jest `--ci` on `src/features/open-wallet` plus the two `phonePicker` tests: 29 suites, 419 tests, EXIT 0 (new: `uploadPhone` 3, `openUpload` 6, `idPhotoSize` 9; red before on the old code: 3 of 3, 6 of 6, 8 of 9); jest on profile-edit, media, create, works: 22 suites, 384 tests, EXIT 0; gates 10 run, 1526 files, 0 fail, 17 warn (none in these files), EXIT 0; `check_baseline.py` EXIT 0; `check_tasks.py --write` EXIT 0. Android fingerprint (`npx expo-updates fingerprint:generate --platform android`) `d3ad6df32e76fc60956c6d4a22606452a0e8d1c0` on this branch, on a clean `origin/main` `b426f8fb` tree and on the lead's checkout: identical, so unchanged by this task (the `17ffb13d` figure in older task files does not reproduce in this environment, on main either).

NOT RUN: a phone, an Android build, the live Hub, Nuvion (no eas, no live host). The first proof on a device is one Open your wallet run on a build that carries this change; the app-side change alone moves no native code, so it is JavaScript only.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `src/features/open-wallet/api/documents.ts`, `submit.ts`, `ProofOfAddressScreen.tsx`, `documents/pick.ts`, `src/features/profile-edit/readPicked.ts`
- `node_modules/expo/src/winter/fetch/convertFormData.ts` (the `uri` part is refused there)

## Goal

On an Android or iOS phone, Submit on Proof of address puts the ID and the bill on the wire, a photo the phone lost is asked for again in plain words, ID photos are small enough for a data connection, and a failed upload says the details are saved and keeps them in view.

## Scope

`wawu-wmt-mobile` only: `src/features/open-wallet/` (`api/documents.ts`, `submit.ts`, `documentCopy.ts`, `ProofOfAddressScreen.tsx`, `documents/pick.ts`, `documents/types.ts`), `src/features/profile-edit/readPicked.ts` (optional second argument), `src/features/media/manipulatorCache.ts` (`fileExists`), and their tests.

## Capability checks

- [x] A user on the phone's own fetch can send an ID with both sides and a bill, and each reaches the network layer as a multipart request with its bytes, name and type (`uploadPhone.test.ts`).
- [x] A user whose photo the phone no longer holds is asked to take it again before anything is sent, and is not told "No connection".
- [x] A user taking an ID photo with the camera gets a JPEG whose long side is at most 2000 px.
- [x] A user whose photos did not upload sees that the details are saved, keeps the postal code and document type on view, and taps Try again to send only the photos.
- [ ] On a phone: NOT RUN (no device or build in this session).
