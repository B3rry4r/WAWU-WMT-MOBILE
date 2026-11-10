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
- **Status:** round 1 built, back to verifying. Fix round 1 on wawu-wmt `wmt/HUB-IMG-LINKS` (`966c637`). GitHub's full run failed on `fad6147` in 3 suites (16 tests); both causes are fixed without editing any existing test.
- **Built:** one helper (`src/storage/read-link.ts`) signs every picture, preview, cover and avatar read link (`StorageService.readUrlFor`, so `freshUrlFor`, `coverUrlFor`, profile pictures, chat and AI media links; `CoverLinkService`) with `signingDate` rounded down to the start of the UTC day. **No `ResponseCacheControl` any more** (lead decision, 10 Nov): every read link has exactly the length and query parameter names it has on main; only the X-Amz-Date, X-Amz-Expires (same digit count) and X-Amz-Signature values differ. Default link signed for 7 days (the SigV4 maximum): shortest life 6 days and 1 second. A request for a life of one day or less (a chat attachment, 900 s), or whose lengthened expiry would have more digits (86401 to 99999 s, no caller asks), is signed at the second, as before.
- **Community message media (FIX-71)** are signed at the current second as on main: `readUrlFor`/`freshUrlFor` take an explicit `{ atCurrentSecond: true }`, set only by `withFreshMedia` (`src/community-message/message-media.ts`).
- **Avatar bug:** `GET /creators` (creator-discovery) signs the stored avatar through the shared `freshOwnImage` (`src/storage/own-image.ts`, also now used by Explore). A stored value that is not the creator's own key is returned as stored, as before (`photo-position.contract.spec.ts` holds it).
- **Not changed:** `presignUpload` (byte-identical to main), `signedReadUrl` (KYC, 900 s), `downloadUrlFor`, the bucket probe.
- **Verifier (10 Nov 2026, on `fad6147`):** MERGE, no blocker, high or medium; three lows in [history/HUB-IMG-LINKS.md](history/HUB-IMG-LINKS.md). Low 2 and 3 (`immutable` on paid files and on the in-place video clean) are gone with the cache header.
- **Next:** verifier re-checks round 1 (all suites named in history), then the lead merges.

## Goal

The same picture has the same link for a day, the browser is told it may keep it, and a second visit loads pictures from the browser's own cache.

## Scope

- Sign picture and preview read links with a signing time rounded down to a fixed window (the AWS SDK's `signingDate`), with an expiry that still leaves every link valid for at least as long as today (state the window and the shortest life a link can have).
- ~~Ask the bucket to answer with a long private cache (`ResponseCacheControl`)~~ dropped in round 1 (lead decision, 10 Nov): it made every read link about 70 characters longer. The stable link alone lets the browser revalidate.
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
