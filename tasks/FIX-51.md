---
id: FIX-51
title: ID and address documents leave the app with their files in them
owner: YOU
area: FIX
order: 135
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-6]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-51 · ID and address documents leave the app with their files in them

## Current state

As of 17 Oct 2026.
- **Status:** verifying (builder round 1, Sonnet). Branch `wmt/FIX-51` in the mobile repo only, from `origin/wmt/MERGE-7` `ff5e90fb`. No backend or wawu-id change.
- **Id and order:** order 135, one of the two free launch slots on this base (131 is FIX-50's). FIX-47 and FIX-48 both claim 176; the lead renumbers at merge.
- **Cause:** `uploadDocument` passed `body: undefined` with a `bodySerializer`. openapi-fetch 0.17.0 calls the serializer only when `body` is not undefined, so the POST went out with no body and no content type. The Hub answered 400 "Say which document this is" and A27 showed "We can't use that file". Found by the FIX-47 verifier (finding 1). Unit tests mock the client, so none saw it.
- **Fix:** `src/features/open-wallet/api/documents.ts` hands the multipart form in `body` and the serializer returns it as it is. One line pair, no screen change.
- **Same pattern elsewhere:** none. `bodySerializer` and `FormData` appear in this one file; the contract has one multipart route (this one); the other uploads (works, profile, pro listing, events, chat card) are a plain `fetch` PUT of a blob to a signed URL.
- **Test:** new `__tests__/documentsWire.test.ts` (3 tests). The real `api` client and the real `uploadDocument` talk to an HTTP server on 127.0.0.1 that reads multipart the way the Hub does; only the transport is swapped (jest's global `fetch` is Expo's native one and reaches no socket). On the old code all 3 fail (the Hub's 400); with the fix all 3 pass.
- **Stack proof:** stack `fix51_test` (backend `wmt/MERGE-7` `432f017`, the Nuvion stand-in, mock WAWU ID, mobile web export of this branch). A new person walked A31 to A27 and pressed Submit with no route rewrite: both document POSTs were multipart, no HTTP error, the Hub then listed identity (front and back) and proof of address as `uploaded`, `submitted` true, and the stand-in took two documents (201 each).
- **Not run:** a real device (the phone's `{ uri, name, type }` file part goes through the same `body`, but node cannot build it), GitHub CI, a real Nuvion page, the full suite (the batch merge runs it). The web export, after Submit, ended on A26 in a shallow browser history (the flow's own `history.go(-3)`), not touched here.
- **Open findings:** none.
- **Next:** a fresh verifier.
- **History:** tasks/history/FIX-51.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/history/FIX-47.md` (the verifier's finding 1)

## Goal

Submit on A27 sends the ID (front, and back when it has one) and the proof of address as real multipart requests that carry the file parts and the `kind` field, so the Hub stores them.

## Scope

`src/features/open-wallet/api/documents.ts` and the new `src/features/open-wallet/__tests__/documentsWire.test.ts`. No gate, baseline or existing test is changed.

## Capability checks

- [ ] A person walks A31 to A27 on the Nuvion stack and presses Submit: the Hub lists both documents as uploaded and no request answers 4xx or 5xx.
- [ ] `documentsWire.test.ts` fails on `ff5e90fb`'s `documents.ts` (the Hub's 400) and passes with this change.
- [ ] No other call in `src/` builds a multipart body through a serializer.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-51.md](history/FIX-51.md).
