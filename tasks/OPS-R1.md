---
id: OPS-R1
title: The app's name with its question mark on the logo and launcher, and unique gap ids
owner: YOU
area: OPS
order: 231
priority: launch
repo: wawu-wmt-mobile
type: setup
status: review
depends_on: []
decisions: [R-69, R-37]
passes: [V1]
artboards: []
tier: T0
---
# OPS-R1 · The app's name with its question mark on the logo and launcher, and unique gap ids

## Current state

As of 17 Oct 2026, built by a Sonnet builder (T0); accepted by the lead.
- **Status:** merging (lead). Accepted by the lead (T0, 17 Oct 2026). Stacked in batch 11 by MERGE-11 (mobile `9e69b451` merged into `wmt/MERGE-11`; it holds DV2-COPY `af5a2760`). Branch `wmt/OPS-R1` in the mobile repo only, from `origin/wmt/DV2-COPY` `af5a2760`. No backend change.
- **Brand:** `BrandMark.tsx` `APP_NAME` (the logo's accessibility label) and `app.json` `expo.name` (the launcher name) say "Who Made This?" (R-69). `brand.test.tsx` and `auth-welcome.test.tsx` expect the question mark; `Avatar.tsx` has the comment only. SHARED-CHANGES DV2-COPY #2 is marked applied (the brief from the lead names it approved, R-69). The launcher name shows from the next development build.
- **Gap ids:** 6 ids were used by more than one row in `BACKEND_GAPS.md`. 11 rows are renamed, 422 ids now, none twice. DV2-05 G-DV2-05-1 (was G-827, A6); DV2-01 G-DV2-01-1 (was G-828); REF-03 G-REF-03-1 and -2 (was G-830, G-831); EVENTS-06 G-EVENTS-06-1 and -2 (was G-827, G-828); EVENTS-08 G-EVENTS-08-1 and -2 (was G-830, G-831); INBOX-15 G-INBOX-15-1 (was G-827, I20); ME-04 G-ME-04-1 and -2 (was G-690, G-691).
- **Kept on purpose:** MONEY-16's own G-690 and G-691 keep their ids, because `wawu-backend` cites G-690 in five places (`.env.example`, `docs/contract/CONVENTIONS.md`, `mock-wawu-id/server.js`, `src/money/check/money-check-mailer.ts`, `test/money/wawu-id-mail-double.ts`) and this task changes one repo.
- **References updated:** `liveness.ts`, `organiserFormat.ts` (two), `hostedSelfie.test.tsx` (a comment), the task files DV2-01, DV2-05, EVENTS-06, EVENTS-08, INBOX-20, LINKS-01, ME-04, REF-03, SWEEP-APP, and `docs/LOG.md` (`docs/PROGRESS.md` regenerated). Comments and records only, no behaviour.
- **Not edited:** `tasks/history/*` (round records; they keep the ids of the day they were written).
- **Checks:** all exit 0 (builder report).
- **Next:** the batch 11 pull request.

Status set to review by the records sync, 25 Oct 2026: merged as app 170f8f56, lead acceptance in this file (accepted by the lead, T0).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `SHARED-CHANGES.md` row DV2-COPY #2, `tasks/DV2-COPY.md`, `tasks/FIX-55.md` (the same kind of rename)

## Goal

The app names itself "Who Made This?" everywhere it can be read: the strings (DV2-COPY), the logo's label and the launcher. Every gap in `BACKEND_GAPS.md` has one id, so a task file or a code comment that names a gap points at one row.

## Scope

`src/components/BrandMark.tsx`, `src/components/Avatar.tsx` (a comment), `app.json`, `src/__tests__/brand.test.tsx`, `src/__tests__/auth-welcome.test.tsx`, `SHARED-CHANGES.md` (one status), `BACKEND_GAPS.md` (ids only), and the references to the renamed ids listed above. Nothing else.

## Capability checks

- [ ] A person who hears the logo read aloud, and who sees the app's name under its icon after the next build, gets "Who Made This?".
- [ ] A search of `BACKEND_GAPS.md` finds each gap id once.
- [ ] A task file or code comment that names a renamed gap reads the new id.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/OPS-R1.md](history/OPS-R1.md).

## Owner sign-off
