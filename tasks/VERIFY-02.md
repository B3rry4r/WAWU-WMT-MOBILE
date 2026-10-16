---
id: VERIFY-02
title: Hear your name, and write your Voice Intro
owner: YOU
area: VERIFY
order: 271
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [VERIFY-01, VOICE-01, ME-12, DV2-COMP]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [VF3, VF3a, VF3b, VF4, VF4a, VF4b]
---
# VERIFY-02 · Hear your name, and write your Voice Intro

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 4 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): VERIFY-01, VOICE-01, ME-12, DV2-COMP.
- **History:** none yet. Reports go to tasks/history/VERIFY-02.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-66, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person hears their name said in a studio voice (free), fixes it with a phonetic spelling, writes a few lines about themselves, and taps "Hear it in my voice" (VF5 if they have no tier yet).

## Scope

- New files under `src/features/verify/`. Calls VOICE-01's routes (G-800): name preview, save name, save intro text (character count and the "too long" state from the Hub's limit). Nothing here calls a provider.
- "Hear it in my voice" opens VF5 (ME-12) when `GET /me/tier` says no active tier, and VF8 (VERIFY-03) when there is one. This task adds those two taps as drawn.
- Entry points as drawn: the Voice Intro prompt on Me and the Create sheet (once VERIFY-01 has added them).

## Capability checks

- [ ] A person can play their name, type a phonetic spelling, hear it again and save it.
- [ ] A person can write an intro, see the count, and is stopped with a plain message when it is too long; the button is off while empty.
- [ ] "Hear it in my voice" without a tier lands on VF5; with a tier it lands on VF8.
- [ ] Each board above (VF3, VF3a, VF3b, VF4, VF4a, VF4b) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
