---
id: HOME-08
title: Content detail: free video and course layouts
owner: YOU
area: HOME
order: 144
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [HOME-03, UI-02, HOME-13, HOME-12]
decisions: [R-8]
passes: [V1, V4, V5, V6, V9]
artboards: [H24, H25]
---
# HOME-08 · Content detail: free video and course layouts

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 14.
- **Status:** merging (lead). Verdict: FIX round for one medium (the locked course's foot covered the comments and the action row); closed in S1b round 2 (mobile e2748258) on the lead's diff read; H24 passed (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S1b.md`). Stacked in batch 14 by MERGE-14 (backend `wmt/MERGE-14`, mobile `wmt/MERGE-14`); not on main. Built: Same branches as HOME-03 (`wmt/S1b`, mobile and backend). H24 and H25 are layouts of the one screen `src/features/content-detail/ContentDetailScreen.tsx`: a free piece (H24) and a course (H25, lessons list, "See all N lessons", the unlock at the foot).
- **Built:** H24: "Free · 1:50", "Video · 12.4K views · 3 days ago", Tip instead of a price, Follow, Share/Save/Rate, the comments. H25: "12 lessons · 2h 40m" (the lessons' own lengths added up), "Course · 1,280 students" (the Hub's `studentCount`), Free lesson tag and locks from `isFree`, "Unlock course · ₦8,000" (the price; the sheet shows the total), and the wallet line above it.
- **Not built:** the parent-course row on H24 (G-HOME-08-1: no link from a free piece to its course); playing a free lesson (G-HOME-08-2: no file per lesson); a course total from the Hub (G-HOME-08-3).
- **Round 2 (17 Oct 2026, finding 1):** the locked course's foot now lies over the screen's bottom and the list is padded by the foot's measured height (plus 16), so the five marks and the comments scroll up clear of it on every screen size (web export 360x640, 390x844 and 430x932: lowest mark or comment 16 above the foot). Not reproduced on the build as verified: scrolled to the end, the list already stopped at the foot's top, and the verifier's "scrolled" picture is the unscrolled page (marks cut at the fold). The change makes it hold whatever the list does when laid out. Tests: `contentDetail.test.tsx` "the foot never sits over the page" (3).
- **Next:** the batch 14 pull request (the lead). No low is left open.

Status set to review by the records sync, 25 Oct 2026: merged as app 099cf130, lead acceptance in the lead's merge log, 17 Oct (verifier FIX on one medium, round 2 accepted on the lead's diff read).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-8 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py H24 H25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H25 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H24 · Detail · free video**: Free video detail: Free · 1:50, 12.4K views, Tip instead of a price, link 'From the course VFX for Beginners · 12 lessons ₦8,000', 340 comments.
- **H25 · Detail · course**: Course detail: 12 lessons · 2h 40m, 1,280 students, lesson list with lesson 01 tagged Free and the rest locked, Unlock course · ₦8,000, Pay from wallet.

## Brief changes (build these, not the canvas)

- **H25**: as H19: a price if it opens the unlock sheet, or the total "Unlock course · ₦8,015.75" (₦8,000 + Fintava's ₦15.75) if it goes straight to the PIN. (Why: rule 5 and the purchases default.)

## Capability checks

- [ ] **H24**: a user can Tip (H26); open parent course (H25); Follow; Share/Save/Rate.
- [ ] **H25**: a user can play free lesson; See all 12 lessons; Unlock course.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **H24**: partial. Missing: Free content is supported; no relation from a free piece to its parent course.
- **H25**: partial. Missing: No per-lesson free flag, no per-lesson asset, no student count on the response, wallet unlock absent.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H24: ₦8,000 course
- H24: 12.4K views · 3 days ago
- H25: ₦8,000
- H25: 1,280 students
- H25: 12 lessons · 2h 40m

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-08.md](history/HOME-08.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
