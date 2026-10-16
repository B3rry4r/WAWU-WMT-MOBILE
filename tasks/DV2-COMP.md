---
id: DV2-COMP
title: Shared pieces for tiers, points and the Voice Intro
owner: YOU
area: DESIGN
order: 268
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [UI-03, SHARED-06]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6]
artboards: [M1, VF11, VF14, M19, PT5]
---
# DV2-COMP · Shared pieces for tiers, points and the Voice Intro

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): SHARED-06.
- **History:** none yet. Reports go to tasks/history/DV2-COMP.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-66, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The pieces that two or more of the new screens draw are built once, in `src/components/`, so no task forks them (law 9): the tier badge, the products meter, the points figure and the Voice Intro player with its "Bio" label and "AI voice" tag.

## Scope

- `src/components/` (fenced: this task is the shared-change pass for them; SHARED-CHANGES row DV2-COMP #1). Pieces: `TierBadge` (Verify, Verify Plus, Founding Maker with an optional number, VF7a), `ProductsMeter` ("2 of 3 products", VF12, VF14, M1, M19), `PointsFigure` (points as a count with the "points" word, never naira, PT1, PT5, W1, M19), `VoicePlayer` (play and pause, progress, the label "Bio" and a small "AI voice" tag, R-66; used on M1, M5 to M7 and VF11).
- Each takes its values by props; none calls the API. Colours, spacing and type come from `@/theme` tokens only (VF7 and VF7a hard-code #C368EA, #FFB020 and #5C64FF in the confetti: map #C368EA to `--accent-fg` and ask for tokens for the other two in the same row).
- A preview route under `src/app/preview/` for each piece, as the pay sheet has, so verifiers can see every state without the API.

## Why a component task

- ME-01, ME-04, VERIFY-03, VERIFY-05, POINTS-05 and DV2-03 all draw these. Building them here, first, is what keeps two tasks from writing two badges.

## Capability checks

- [ ] Each piece draws every state its boards show (badge for each tier and numbered, meter at 0, partial and full, player idle, playing and with the tag) in light and dark.
- [ ] No piece contains a string that names an outside brand (R-68).
- [ ] Each board above (M1, VF11, VF14, M19, PT5) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
