---
id: HOME-07
title: Feed: course, template, creator and professional cards, empty and error
owner: DEV
area: HOME
order: 143
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [HOME-04, HOME-05, PROS-02, UI-02, UI-03, HOME-08, HOME-12, PROS-01, EXPLORE-02]
decisions: [R-18]
passes: [V1, V4, V5, V6, V9]
artboards: [H7, H8, H9, H10, H12, H13]
---
# HOME-07 · Feed: course, template, creator and professional cards, empty and error

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-18 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py H7 H8 H9 H10 H12 H13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H10 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H7 · Course**: Course post: lesson 1 free, offer bar 'VFX for Beginners · 12 lessons · Pay from wallet ₦8,000'.
- **H8 · Template · Following**: Template post with offer bar 'Aba Collection · patterns · Template · Pay from wallet ₦3,500'.
- **H9 · Creator card**: Interstitial creator card in the feed ('F4, reworked'): portrait, 18.2K followers, 64 posts, 4.9 rating, 'Followed by Amaka and 12 people you know', swipeable strip of free and locked work, Follow and Profile.
- **H10 · Professional card**: Interstitial professional card ('F5, reworked for paid DMs'): 'Professional near you', portrait, 4.9 rating, 212 reviews, ~3h usual reply (no Trust Score: R-18, BRIEF H10), service tags, 'Online now. No reply in 24 hours and your ₦1,500 comes back.', Message · ₦1,500 and Profile.
- **H12 · Following · empty**: From H1 Following tab when the user follows no one: 'You're not following anyone yet', 'Find people to follow' and the creators rail.
- **H13 · Feed · couldn't load**: From H2 when the feed fails: 'The feed didn't load … Anything you've bought is still in My purchases.' Try again.

## Brief changes (build these, not the canvas)

- **H10**: remove the Trust Score figure and its label; keep rating, reviews and usual reply time. Drop "Trust Score" from the note. (Why: R-18. No Trust Score on professional cards: a number nothing calculates never ships.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- H9: Profile (opens M5): added by ME-02
- H10: Message · ₦price (opens I3): added by INBOX-10

## Capability checks

- [ ] **H7**: a user can play free lesson; tap offer bar (H25 / H14).
- [ ] **H8**: a user can tap offer bar; swipe on.
- [ ] **H9**: a user can Follow; swipe the work strip; open a work item (H19).
- [ ] **H10**: a user can open Profile (P2); the card shows rating, reviews and usual reply, and no Trust Score.
- [ ] **H12**: a user can Find people to follow; Follow from rail.
- [ ] **H13**: a user can Try again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H12, H13.

## What the backend serves today (from the analysis)

- **H7**: partial. Missing: CourseLesson has no isFree/preview flag, so 'lesson 1 free' cannot be expressed.
- **H8**: partial. Missing: Offer-bar linkage to a separate paid piece not modelled; wallet payment absent.
- **H9**: partial. Missing: Feed does not return interstitial card kinds; no mutual-follower query ('Followed by … people you know': grep mutual|followedBy src: none); no creator-level aggregate rating.
- **H10**: partial. Missing: No location field on ProfessionalProfile or UserProfile (no 'near you'); no public per-professional reply-time; no presence/lastActiveAt (grep lastSeen|isOnline|presence: none); 'Trust Score' has no defined source (EvgScore is closest); feed does not interleave professional cards.
- **H12**: missing. Missing: No scope=following on GET /content and no 'who I follow' list/count endpoint, so neither the populated Following feed nor this empty state can be decided server-side.
- **H13**: n/a.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H7: ₦8,000
- H7: 12 lessons
- H8: ₦3,500
- H8: Template · 9 patterns
- H9: 18.2K followers · 64 posts · 4.9 rating
- H9: ₦5,000 Course, ₦1,500 PDF
- H10: 4.9 · 212 reviews
- H10: 91 Trust Score
- H10: ~3h usual reply
- H10: Message · ₦1,500
- H10: No reply in 24 hours and your ₦1,500 comes back

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
