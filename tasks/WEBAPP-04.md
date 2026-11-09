---
id: WEBAPP-04
title: Photos and voices uploaded from a browser are safe and play everywhere
owner: YOU
area: WEB
order: 364
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-127]
passes: [V1, V4, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-04 · Photos and voices uploaded from a browser are safe and play everywhere

## Current state

As of 9 Nov 2026.
- **Status:** verifying. Built on branch `wmt/WEBAPP-02` (bundle WEBAPP-02, 03, 04), mobile and Hub worktrees.
- **Branches:** mobile `wmt/WEBAPP-02`; Hub `wmt/WEBAPP-02` (aae111a, CORS only; no merge, a Hub merge deploys).
- Photos: `src/features/media/redrawPhoto.ts` used by profile-edit, works, create and chat web pickers (same kinds as the phone: PNG stays PNG, WebP stays, GIF to PNG, else JPEG 0.9; unreadable throws PickFailed).
- Voice: page converts. Recorder asks for MP4 audio where supported; the upload reads the blob's own type (the old code labelled every browser take audio/mp4 from a blob address); WebM or Ogg is decoded and written as 16-bit mono WAV, which the Hub already takes. Hub voice folder unchanged.
- **Open findings:** verifier FIX, see the Verifier report in tasks/history/WEBAPP-04.md (bundle findings 1 to 6). NOT RUN and PHONE CHECK items are in the report in `tasks/history/WEBAPP-04.md`.
- **Next:** fix round 1 built (see history); the verifier re-checks the named ids.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

A photo uploaded from the web carries no location or camera data, and a voice recorded in any browser plays on iPhone, Android and the web.

## Scope

- The web pickers that send photos as picked (profile, works, content, chat; readiness section 2) redraw the image like the ID pickers do, so Exif and GPS are gone.
- Voice recording on the web (`src/features/verify/voiceRecorder.ts`): record a format the Hub takes and every phone plays (prefer `audio/mp4` where `MediaRecorder` supports it); where the browser can only record WebM, the Hub accepts `audio/webm` for that folder (wawu-backend `src/storage/dto/presign-upload.dto.ts`, additive) and the stored voice is converted to a format iPhone plays before anyone hears it, or the page converts it. Say which, with proof.
- Nothing else.

## Capability checks

- [ ] A user uploads a phone photo with GPS from the web; the stored file has no Exif or GPS (read back from storage on the stack).
- [ ] A user records a voice in Chrome, Firefox and Safari on the web; each plays in the app on iPhone and Android (format proved by reading the stored file; PHONE CHECK for the real playback).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-04.md](history/WEBAPP-04.md).

## Owner sign-off
