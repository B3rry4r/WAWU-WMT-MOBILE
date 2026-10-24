---
id: OPS-21
title: Terms and privacy publishing: an admin writes, previews and publishes the text the app shows
owner: YOU
area: OPS
order: -147
priority: launch
repo: wawu-dashboard
type: admin-screen
status: building
depends_on: []
decisions: [R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-21 · Terms and privacy publishing

## Current state

Verifier round 1, 24 Oct 2026: FIX. One medium defect: the preview date line says `Updated 5 Oct 2026`, the app says `Updated 5 October 2026` (`policyDraft.ts:74-96`). Everything else passed live. The fix is one table of month names, then a re-check of OPS-21 only. Evidence under `scratchpad/dash-b14-v/`. Backend `82bd466` and dashboard `40dff8c` unchanged.

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B14): dashboard `wmt/OPS-20` `40dff8c`. The Hub already serves the read (`GET /policies/:slug`, the app's own route) and the write (`PUT /admin/policies/:slug`, superadmin only, replaces the whole document), so no backend change. Status verifying. Default (lead), owner may override: nav "Terms and privacy" in the "App" section; a draft is kept in the browser only, because the Hub holds no draft.

| # | Before | After |
|---|---|---|
| 1 | the text could only be put in by a request by hand | `/policies` has a tab each for Terms and Privacy policy: a title, a date, and sections of heading and text, added, removed and moved |
| 2 | no way to see how it reads | a preview beside the form draws it as the app does (the app's header name, the "Updated 5 Oct 2026" line, headings, paragraphs split at a blank line, as `PolicyScreen` does) |
| 3 | the app shows "not available" until a document exists | the badge says so; Publish asks first, names what it replaces, and the Hub's refusal (title, date or size) is shown as written |
| 4 | no wording of ours | the screen holds no heading, clause or sentence: a document starts empty, or as what the app serves now (the live test text on the stack was typed in the browser) |

Only a superadmin can publish; any other role sees the live document and no editing controls. A typed draft survives a refresh (browser storage, wrapped in try and catch).

Live look: typed two sections, previewed, published (modal with "Publish now"), reloaded and read it back from the Hub. Pictures: `scratchpad/dash-b14/policies-1.png`, `policies-2.png`, `policies-3.png`, `policies-5.png`.

Open low: `PUT /admin/policies/:slug` writes no audit row and the old text is not kept (`G-OPS-21-1`); the modal says there is no undo. The size and date limits the Hub holds the document to (POLICY-LIMITS, provisional) are shown as counters only; the Hub decides.

## Read first

- Backend `src/admin/legal-documents/`, `src/about/policies.service.ts`; mobile `src/features/about/PolicyScreen.tsx`

## Goal

An admin writes, previews and publishes the terms and the privacy policy the app shows, without the screen supplying any legal text.

## Scope

`wawu-dashboard`: `src/components/policies/`, `src/lib/api/admin-policies.ts`, `src/app/(app)/policies/`, the nav entry.

## Capability checks

- [x] A superadmin can write a document, preview it as the app draws it, publish it, and see it live after a reload.
- [x] A superadmin is asked before the live text is replaced.
- [x] No wording is supplied by the screen (empty start).
- [ ] The app itself showing the new text: NOT RUN (no phone or app session; the app reads the same route).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: none yet.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OPS-21.md](history/OPS-21.md).

