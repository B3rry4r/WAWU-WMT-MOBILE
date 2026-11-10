---
id: UPLOAD-WORDS
title: Every screen states the upload places the tier gives
owner: YOU
area: CREATE
order: 375
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-129, R-7, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# UPLOAD-WORDS · Every screen states the upload places the tier gives

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from R-129 (owner delegated) after the second web walk (walker C, MEDIUM-1, `tasks/history/WEBAPP-07.md`, "Walk 2").
- **Found:** the verification page's "Every tick gives you" rows say "Up to 25 uploads" and "10 GB library space" from the Hub's `GET /uploads/allowance` `withTick` (R-7), while the publishing gate counts the tier's products (TIER-02: `uploads.allowed`), so a Founding Maker read 25 on one screen and "4 of 15" on Create and My content.
- **Next:** a builder on `wmt/UPLOAD-WORDS`.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-129, R-7, R-47
- wawu-backend `src/storage/storage.service.ts` (`UploadAllowanceView`), `src/plans/publishing-allowance.service.ts`, `src/common/creator-allowance.ts`

## Goal

A person sees one number for how many pieces they may publish, everywhere: their tier's, or a pre-tier tick's 25 while it lasts (R-129).

## Scope

- The verification page and every other screen that states upload places or library space read `uploads.allowed` (and the tier list for what a tier would give); "Up to 25 uploads" appears only to a person whose tick from before tiers still gives it.
- Say whether buying a tick today still raises the Hub's `uploads.allowed`; if it does, R-129 says it must not: name the Hub change (file and line) for a follow-up, do not make it here.
- Phone and web alike.

## Capability checks

- [ ] A Founding Maker sees the same number of upload places on the verification page, Create, My content and the limit sheet.
- [ ] A person with a tick from before tiers still sees and gets 25.
- [ ] Every screen touched has pictures at 390 light and dark beside its board, and at 1440 on the web.

## Builder report

## Verifier report

## Owner sign-off
