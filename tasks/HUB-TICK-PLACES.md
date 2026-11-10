---
id: HUB-TICK-PLACES
title: A tick that starts after the cut-off adds no upload places
owner: YOU
area: CREATE
order: 376
priority: after-launch
repo: wawu-backend
type: flow
status: todo
depends_on: [UPLOAD-WORDS]
decisions: [R-129, R-7]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# HUB-TICK-PLACES · A tick that starts after the cut-off adds no upload places

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from UPLOAD-WORDS's builder finding (R-129, its "When before tiers ends" line).
- **Found:** wawu-backend `src/plans/publishing-allowance.service.ts` `allowanceFrom` (about lines 76 to 78) gives any running tick `TICK_UPLOADS` (25) through `Math.max(tierAllowed, tickAllowed)`, and `uploadAllowanceFor` in `src/common/creator-allowance.ts` has the same flat rule. So a tick bought today still raises `uploads.allowed`, which R-129 says it must not once the app stops promising it.
- **Waits for:** UPLOAD-WORDS merged and its over-the-air update on phones (the owner's word), so no screen still promises 25 to a person who buys a tick after the cut-off. The cut-off date is that update's day; the lead sets it at merge.
- **Next:** a builder on wawu-backend `wmt/HUB-TICK-PLACES`, merged only after the update ships.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-129, R-7
- wawu-backend `src/plans/publishing-allowance.service.ts`, `src/common/creator-allowance.ts`, the tick's columns and payment rows (`holdsTick`)

## Goal

A person who gets a tick after the cut-off has the upload places their tier gives and no more; everyone whose tick started before it keeps 25 until that tick ends.

## Scope

- wawu-backend: the tick's 25 places count only for a tick whose start is before one dated cut-off, in every place that computes upload places (the publishing allowance and `GET /uploads/allowance`), from the tick's own stored start (say which column or row, and what a renewal counts as). Storage is unchanged (R-7's storage figures stand where the Hub applies them).
- Specs: a tick before the cut-off keeps 25 with and without a tier; a tick after it adds nothing; a renewal of a pre-cut-off tick; a tier plus extra products unchanged.
- Nothing in the app.

## Capability checks

- [ ] A person who buys a tick after the cut-off sees and gets their tier's places only, on every screen (the app reads `uploads.allowed`).
- [ ] A person whose tick started before the cut-off still publishes 25 until it ends.
- [ ] Every protected route behaves as before (V3).

## Builder report

## Verifier report

## Owner sign-off
