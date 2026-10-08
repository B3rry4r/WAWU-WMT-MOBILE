---
id: FIX-24
title: A delivered legal document can only be the client's own file or one the legal team uploaded
owner: YOU
area: FIX
order: 232
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [LEGAL-03]
decisions: [R-14]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-24 · A delivered legal document can only be the client's own file or one the legal team uploaded

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/LEGAL-03.md`, "Verifier report, independent round 4 (lead)" (defect N2 and its reproduction, `h/n1.mjs` last block) and the N1 ruling it builds on
- wawu-backend: the LEGAL-03 delivery code (the key rule `deliverable-key`), `POST /legal/ops/requests/:id/deliverables`, the older protected `POST /legal/ops/requests/:id/deliver`, the deliverables list that signs links, and `StorageObject` (one row per uploaded key, with the uploader's `wawuUserId`)

## Goal

LEGAL-03 (merged, live) accepts any key under `legal/document/` on our bucket. That folder also holds what clients attach to their own legal matters, and support sees those keys in `GET /legal/ops/requests`. So support can deliver client B's own document to client A, and A's list hands A a fresh link to B's file (reproduced live: 132 of 132 bytes). The older `/deliver` route is a second way in, because the new list re-signs whatever it stored. A key nobody uploaded is also accepted and signed.

## Scope

- **Lead ruling (8 Oct 2026).** A delivered key is accepted only when all hold:
  - it passes LEGAL-03's N1 rule;
  - a `StorageObject` row exists for that exact key, so a key nobody uploaded is refused;
  - that row's uploader (`wawuUserId`) is the request's owner (a client's own file given back) or one of the legal team's accounts in a new setting, `LEGAL_DELIVERY_UPLOADER_IDS`.
- **The setting.** `LEGAL_DELIVERY_UPLOADER_IDS` is a comma-separated list of WAWU ids. Boot refuses a malformed value, naming the setting. It is empty by default and marked `PROVISIONAL`; the owner supplies the legal team's account ids. Until then, only a client's own files can be delivered back to them.
- **Refusals.** Anything else answers 400 naming `files.N.url` with a plain message (no em-dashes) saying the file must be one the legal team uploaded, and nothing is stored.
- **Both write routes.** Apply this to the new deliverables route and the older `/deliver`. `/deliver` is protected: if the lock captures a request this changes, stop and say so (it needs the owner's relock label).
- **Reads.** Signing applies the same rule. A stored key that fails it, a legacy `deliverableUrl` included, is shown without a link and logged once at warn level. It is never signed.
- **Stored rows.** Change no stored row without a lead ruling. Count stored deliveries whose key fails the rule and put the count in the report.
- **When LEGAL-07 lands.** Its admin upload route gives ops its own folder; the rule then also accepts that folder for that request. Leave a note in SHARED-CHANGES LEGAL-03 #2.

## Capability checks

- [ ] The verifier's N2 reproduction is refused on both write routes (400 `files.N.url`, nothing stored, no link anywhere), and A's list never returns a link to B's file, even for a row written by hand.
- [ ] A key with no `StorageObject` row is refused.
- [ ] A client's own file can be delivered back to them, and a file uploaded by a listed legal-team account is delivered and downloads with identical bytes (V9, real WAWU ID sign-in).
- [ ] Protected routes 253/253 with the lock unchanged; every protected `/legal` answer for clean input is byte-identical to main.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
