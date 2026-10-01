---
id: HOME-09
title: TGIF reader
owner: DEV3
area: HOME
day: 3
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [HOME-10]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [H29, H30, H31, H32, H34, H35]
---
# HOME-09 · TGIF reader

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py H29 H30 H31 H32 H34 H35` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 3.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| H29 | Verse | Full-screen TGIF card (TODAY'S VERSE) for Friday 26 September, series 'SONS, NOT SLAVES': Psalm 118:24 (KJV) quoted. With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'. |
| H30 | What it means | Full-screen TGIF card (THE REALITY) for Friday 26 September, series 'SONS, NOT SLAVES': 'Today is not a leftover from yesterday…' With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'. |
| H31 | The line to carry | Full-screen TGIF card (REMEMBER) for Friday 26 September, series 'SONS, NOT SLAVES': 'I don't have to earn today. I get to live it.' With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'. |
| H32 | Prayer | Full-screen TGIF card (PRAYER) for Friday 26 September, series 'SONS, NOT SLAVES': prayer text with an inline Amen. With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'. |
| H34 | One thing to do | Full-screen TGIF card (TAKEAWAY) for Friday 26 September, series 'SONS, NOT SLAVES': 'Before your first meeting, write down one thing today that you're glad for.' 'No streak to lose.' Done returns to Today. With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'. |
| H35 | Share the verse | From any TGIF card · Share: 'Share today's verse. Posted as an image with a link back to TGIF.' Preview image (TGIF · 26 SEP, verse, Psalm 118:24, wawu/tgif); targets WhatsApp, Story, WAWU chat, Save. |

## Capability checks

- [ ] **H29**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H30**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H31**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H32**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H34**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H35**: a user can share to WhatsApp / Story; send in WAWU chat; save image.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H35.

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| H29 | missing | The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking. |
| H30 | missing | The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking. |
| H31 | missing | The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking. |
| H32 | missing | The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking. |
| H34 | missing | The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking. |
| H35 | missing | No share-image renderer (client canvas or server OG image) and no wawu/tgif link resolver; WAWU chat target depends on free P2P chat. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H29: Amen 2.1K
- H29: 3.4K (unlabelled second count)
- H29: Psalm 118:24 (KJV) verse text
- H30: Amen 2.1K
- H30: 3.4K (unlabelled second count)
- H31: Amen 2.1K
- H31: 3.4K (unlabelled second count)
- H32: Amen 8.9K
- H32: 3.4K
- H34: Amen 2.1K
- H34: 3.4K (unlabelled second count)
- H35: link format wawu/tgif

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
