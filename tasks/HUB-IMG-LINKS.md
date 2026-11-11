---
id: HUB-IMG-LINKS
title: A picture keeps the same link for a day, so browsers can reuse it
owner: YOU
area: WEB
order: 380
priority: after-launch
repo: wawu-backend
type: flow
status: todo
depends_on: []
decisions: [R-47]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# HUB-IMG-LINKS · A picture keeps the same link for a day, so browsers can reuse it

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from WEBAPP-12's measurements (owner, 10 Nov: "we need to optimize those areas").
- **Found (WEBAPP-12):** the Hub signs every picture link at the current second (wawu-backend `src/storage/storage.service.ts` `readUrlFor` about lines 734-757, `cover-link.ts` 31-39, `freshUrlFor` and `coverUrlFor` about 771 and 791), so the same picture gets a new address on every response and the browser downloads it again: 3.2 to 8.4 MB and 7 to 45 s on a second visit at 1.6 Mbps. A link stored unsigned already cached (2 KB on a second visit). Also a bug: `creator-discovery.service.ts:187` returns the stored avatar link unsigned, so it stops working after 7 days.
- **Next:** a builder on wawu-backend `wmt/HUB-IMG-LINKS`.

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

## Builder report

## Verifier report

## Owner sign-off
