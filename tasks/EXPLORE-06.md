---
id: EXPLORE-06
title: Popular communities need 10 members
owner: YOU
area: EXPLORE
order: 256
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [EXPLORE-05]
decisions: [R-57]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EXPLORE-06 · Popular communities need 10 members

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** S. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): EXPLORE-05.
- **History:** none yet. Reports go to tasks/history/EXPLORE-06.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-57 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

"People are searching" and any popular list name a community only once it has 10 or more members (R-57).

## Scope

- `GET /search/popular` (EXPLORE-05, G-340) counts a community name only when the community has at least 10 members. The number is a setting (`popular_community_min_members`, launch value 10).
- Other popular names (content titles, creator handles, categories) are unchanged.

## Capability checks

- [ ] A community with 9 members is not listed as popular however many people searched it; at 10 members it is.
- [ ] The setting changes the threshold without a deploy.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
