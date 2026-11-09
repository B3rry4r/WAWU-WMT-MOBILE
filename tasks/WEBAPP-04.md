---
id: WEBAPP-04
title: Photos and voices uploaded from a browser are safe and play everywhere
owner: YOU
area: WEB
order: 364
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-127]
passes: [V1, V4, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-04 · Photos and voices uploaded from a browser are safe and play everywhere

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-00 readiness check (`docs/analysis/WEB-APP-READINESS.md`).
- **Next:** a builder starts from the brief below.
- **History:** none yet. Reports go to tasks/history/WEBAPP-04.md.

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

## Builder report

## Verifier report

## Owner sign-off
