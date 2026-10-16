---
id: ADS-07
title: Adverts: artwork required, and the Explore slider placement
owner: YOU
area: ADS
order: 257
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [ADS-01, ADS-04, ADS-06]
decisions: [R-59, R-68, R-15]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-07 · Adverts: artwork required, and the Explore slider placement

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): ADS-01.
- **History:** none yet. Reports go to tasks/history/ADS-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-59, R-68, R-15 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A campaign cannot be saved without artwork (R-59; G-761), and the Hub can serve the Explore slider its adverts (X1, X16, X17), so the slider can take turns between events and adverts.

## Scope

- `POST` and `PATCH /admin/ads` refuse a campaign with no `artworkUrl` (`422`, "Add artwork before you save this campaign"). Campaigns already saved without artwork are not served by `GET /ads` and are listed to the admin for fixing. The dashboard form marks the field required (ADS-02).
- New placement `explore_slider` on `GET /ads` (additive): an ordered list of live campaigns for the slider, same view and count rules as the other placements (ADS-04, ADS-05).
- App side, one change after ADS-01 merges: remove the card variant that draws without a picture in `src/features/ads/` (it can no longer occur). The line "Ads keep TGIF free" stays out (G-760).
- Sample advertisers ("Kora Foods", "Lagos Leather Co.") are board drawings only; seed data and tests use neutral names (R-68).

## Capability checks

- [ ] An admin cannot save a campaign without artwork; with artwork it saves and serves.
- [ ] `GET /ads?placement=explore_slider` returns the live campaigns in order and counts a view once.
- [ ] The Today card and the slider never draw a campaign without a picture.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
