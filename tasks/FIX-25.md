---
id: FIX-25
title: A photo uploaded from the website or the app's web build carries no location
owner: YOU
area: FIX
order: 233
priority: launch
repo: wawuafrica, wawu-wmt-mobile
type: web-port
status: todo
depends_on: [SHARED-04]
decisions: []
passes: [V1, V2, V3, V4, V5, V6, V7, V9]
artboards: [M8, M36]
---
# FIX-25 · A photo uploaded from the website or the app's web build carries no location

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/SHARED-04.md` (the lead's ruling, 8 Oct 2026: a photo a person uploads must not carry where it was taken; the phone re-encodes every picked photo, `src/features/profile-edit/readPicked.ts`) and `docs/release/DATA-SAFETY.md` CL-03
- wawuafrica `src/lib/api/uploads.ts` and every screen that uploads an image through it; follow wawuafrica's CLAUDE.md

## Goal

Uploads go straight from the browser to the bucket through a presigned link, so the server never sees the bytes and cannot clean them. The phone now strips a photo's camera data (Exif, including GPS location) before upload, but the website and the app's web build still send the file as chosen. Today a profile picture, cover, work, product or event image taken on a phone and uploaded from a browser can carry the exact place it was taken.

## Scope

- Every image the website uploads through `src/lib/api/uploads.ts`, and the app's own web pickers (`pickImage.web.ts`, `pickMedia.web.ts`), are re-encoded in the browser before upload (canvas to JPEG at 0.9, or PNG kept as PNG where transparency matters), keeping the picked size and the picture upright (apply the orientation before dropping it).
- Identity documents and the selfie keep the exact bytes the identity check needs: list which uploads are excluded and why.
- Videos and documents go as chosen (say so in the report).
- No em-dashes in any copy.

## Capability checks

- [ ] A fixture JPEG with GPS uploaded through each image upload on the website, and through M8 and M36 in the app's web build, reaches the bucket with no APP1 Exif segment (check the stored bytes on a local Hub's bucket stand-in).
- [ ] A rotated phone photo stays upright after re-encoding (pictures).
- [ ] Excluded uploads are listed with the reason.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
