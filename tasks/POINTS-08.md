---
id: POINTS-08
title: One AI tool: VoiceOver, working, done, failed
owner: YOU
area: POINTS
order: 278
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [POINTS-07, AITOOLS-01, VERIFY-01]
decisions: [R-43, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [PT2, PT2a, PT2b, PT2c]
---
# POINTS-08 · One AI tool: VoiceOver, working, done, failed

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 6 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): POINTS-07, AITOOLS-01, VERIFY-01.
- **History:** none yet. Reports go to tasks/history/POINTS-08.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person runs VoiceOver from text: the input, the voice, the cost, Run; sees it working; gets the audio to play, save and use in a product; or a failure that says no points were taken. The pattern serves every tool the Hub adds later.

## Scope

- New files under `src/features/points/`. Input up to the Hub's character limit, voice list, cost line from the quote ("This uses 250 points"), Run calls `POST /ai-tools/voiceover/jobs`, working polls `GET /ai-tools/jobs/{id}`, done shows a player (not the Voice Intro player), Save and "Use in a product" attach the audio to a draft (VERIFY-01 drafts). PT2c: the failed state reads "No points were taken" from the Hub.
- Built as one reusable tool screen driven by the tool's description from `GET /ai-tools`, so a later tool is a catalogue entry, not a new screen.

## Capability checks

- [ ] A person types text, sees the cost first, runs it, and plays the finished audio.
- [ ] A failed job shows that no points were taken and the balance is unchanged.
- [ ] A person can attach the audio to one of their drafts.
- [ ] Each board above (PT2, PT2a, PT2b, PT2c) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
