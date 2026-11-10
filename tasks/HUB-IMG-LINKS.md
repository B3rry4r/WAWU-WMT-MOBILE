---
id: HUB-IMG-LINKS
title: A picture keeps the same link for a day, so browsers can reuse it
owner: YOU
area: WEB
order: 380
priority: after-launch
repo: wawu-backend
type: flow
status: verifying
depends_on: []
decisions: [R-47]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# HUB-IMG-LINKS · A picture keeps the same link for a day, so browsers can reuse it

## Current state

As of 10 Nov 2026.
- **Status:** verifying. Built on wawu-backend `wmt/HUB-IMG-LINKS` (`fad6147`).
- **Built:** one helper (`src/storage/read-link.ts`) signs every picture, preview, cover and avatar read link (`StorageService.readUrlFor`, so `freshUrlFor`, `coverUrlFor`, profile pictures, chat and AI media links; `CoverLinkService`) with `signingDate` rounded down to the start of the UTC day and `ResponseCacheControl: private, max-age=31536000, immutable`. Window: one UTC day (01:00 in Lagos). Default link signed for 7 days (the SigV4 maximum): **shortest life 6 days and 1 second** (at the last second of a window). A request for a life of one day or less (a chat attachment, 900 s) is signed at the second with no cache header, as before.
- **Avatar bug:** `GET /creators` (creator-discovery) signs the stored avatar through the shared `freshOwnImage` (`src/storage/own-image.ts`, also now used by Explore). A stored value that is not the creator's own key is returned as stored, as before (`photo-position.contract.spec.ts` holds it).
- **Not changed:** `presignUpload` (proved byte-identical to main for three uploads at a fixed clock), `signedReadUrl` (KYC, 900 s), `downloadUrlFor` (a saved file), the bucket probe.
- **Verifier (10 Nov 2026):** MERGE, no blocker, high or medium; three lows in [history/HUB-IMG-LINKS.md](history/HUB-IMG-LINKS.md).
- **Next:** lead merges the Hub branch.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/WEBAPP-12.md` and `tasks/history/WEBAPP-12.md` (on `wmt/WEBAPP-12`): the numbers and the line references

## Goal

The same picture has the same link for a day, the browser is told it may keep it, and a second visit loads pictures from the browser's own cache.

## Scope

- Sign picture and preview read links with a signing time rounded down to a fixed window (the AWS SDK's `signingDate`), with an expiry that still leaves every link valid for at least as long as today (state the window and the shortest life a link can have).
- Ask the bucket to answer with a long private cache (`ResponseCacheControl` on the signed GET, never on the upload: a changed upload signature would break the phones' uploads in the field).
- `creator-discovery.service.ts:187` signs the avatar like `explore.service.ts:173`.
- Additive: no route or response shape changes; every protected route behaves as before.

## Capability checks

- [ ] Two reads of the same feed a minute apart give the same picture links; a browser's second visit downloads no picture again.
- [ ] A link handed out at the end of a window still works for at least the stated time.
- [ ] A creator's avatar in the suggestions still loads after 8 days.
- [ ] Every protected route behaves as before (V3).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HUB-IMG-LINKS.md](history/HUB-IMG-LINKS.md).

## Owner sign-off
