---
id: VIDEO-PRIVACY
title: A video someone uploads carries no location or device data
owner: YOU
area: FIX
order: 372
priority: after-launch
repo: wawu-backend
type: flow
status: todo
depends_on: []
decisions: [R-127]
passes: [V1, V3, V4, V9]
artboards: []
tier: T1
---
# VIDEO-PRIVACY · A video someone uploads carries no location or device data

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-07 walk (walker C, low) and WEBAPP-08 F16 (report only).
- **Found:** photos are redrawn before upload on the phone and the web, so no Exif or GPS reaches storage (WEBAPP-04). A video goes up untouched on both: walker C's stored MP4 was byte-identical to the file picked and kept its `location` tag (`+06.4542+003.3925`). Anyone who can play the video can read where it was filmed.
- **Smallest fix (WEBAPP-08 builder):** the Hub removes the metadata from a video after upload (the app cannot rewrite a video cheaply on a phone or in a browser).
- **Waits for:** the owner's word to merge, as every Hub change does (a Hub merge deploys the live server). Videos already stored keep their tags until a one-off sweep, which this task also proposes with its cost.
- **Next:** a builder on wawu-backend `wmt/VIDEO-PRIVACY`.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/WEBAPP-04.md` (how photos are cleaned) and wawu-backend `src/storage/` (how uploads land and are processed)

## Goal

No video a person uploads, from the phone or the web, keeps where it was filmed or the device it was filmed on, and it still plays everywhere it played before.

## Scope

- wawu-backend: after a video upload lands, its container metadata (location, device make and model, creation tags) is removed without re-encoding where possible; the file still plays on iPhone, Android and the web.
- A one-off sweep for videos already stored, run only on the owner's word, with how many files and how long.
- Nothing in the app.

## Capability checks

- [ ] A person uploads a video filmed with location on, from the phone and from the web; the stored file has no location or device tags (read back from storage on the stack) and still plays.
- [ ] Every protected route behaves as before (V3).

## Builder report

## Verifier report

## Owner sign-off
