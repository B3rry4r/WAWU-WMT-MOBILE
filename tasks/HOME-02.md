---
id: HOME-02
title: For you feed: video, photo set, book, locked, audio
owner: DEV3
area: HOME
day: 2
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [HOME-04]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [H2, H3, H4, H5, H6]
---
# HOME-02 · For you feed: video, photo set, book, locked, audio

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py H2 H3 H4 H5 H6` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 2.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| H2 | For you · video | Full-bleed dark video post in the For you feed with a right rail (avatar, 12.4K, 340, 1.1K, ₦ Tip), tap-to-pause and a scrubber above the caption. |
| H3 | Photo set | Photo-set post ('Approved F1'): sideways frames with the next frame peeking, 1/6 counter, and a paid offer bar 'Golden Hour presets · Template · 12 presets ₦2,500'. |
| H4 | PDF / book | PDF post ('Approved F2'): cover, '12 pages free', read in place, offer bar 'Read the full playbook · Yours forever · Pay from wallet ₦3,000'. NOT in MANIFEST.json (regex missed it) but is a real artboard on the board. |
| H5 | Locked | Locked video ('Approved F3, with Subscribe removed'): frame frosts when the preview ends, 'Preview ended' message, offer bar 'Unlock the full video · 18 min · Pay from wallet ₦2,500'. |
| H6 | Audio · Following | Audio post ('Approved F6') with a scrubbable waveform; author tagged 'Following'. |

## Capability checks

- [ ] **H2**: a user can tap to pause/play; scrub; swipe up to next post; tap ₦ Tip (H26); tap caption (H19); tap avatar (profile).
- [ ] **H3**: a user can swipe sideways through frames; tap offer bar (H19 / unlock); tip; swipe up.
- [ ] **H4**: a user can read free pages in place; tap offer bar to unlock (H14).
- [ ] **H5**: a user can tap Unlock (H14); swipe on.
- [ ] **H6**: a user can play/pause; scrub waveform; swipe on.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| H2 | partial | Feed list exists (trending sort). Missing: content like/unlike route and liked-by-me state, share counter, view counting, mixed card kinds; no streaming/transcoding metadata beyond durationLabel. |
| H3 | partial | No multi-asset (photo set) storage on ContentPiece; no link from a free post to a separate paid offer piece (offer bar). |
| H4 | partial | No free-page-range field (e.g. freePages) and no paged in-place reader asset; unlock is Flutterwave not wallet. |
| H5 | partial | Locked state and preview asset exist; preview end time not modelled; unlock path is Flutterwave hosted/inline charge not wallet+PIN. |
| H6 | partial | No waveform data; follow state per item needs batch lookup (only single GET .../follow status). |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H2: rail counts 12.4K / 340 / 1.1K
- H2: Video · 1:50
- H3: Golden Hour presets ₦2,500
- H3: Photo set · 6
- H4: ₦3,000
- H4: 84 pages · 12 pages free
- H4: 'Yours forever'
- H5: ₦2,500
- H5: Locked · 18 min
- H5: 'How I built a ₦2M a month agency from Enugu'
- H6: Audio · 12 min

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
