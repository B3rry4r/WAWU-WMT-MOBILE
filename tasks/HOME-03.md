---
id: HOME-03
title: Content detail: preview, unlocked, comments, share, rate
owner: YOU
area: HOME
order: 141
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [HOME-04, HOME-06, INBOX-06, UI-02, HOME-02, HOME-12, HOME-13, EXPLORE-02]
decisions: [R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [H19, H20, H21, H22, H23]
---
# HOME-03 · Content detail: preview, unlocked, comments, share, rate

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): HOME-12, HOME-13, EXPLORE-02.
- **History:** none yet. Reports go to tasks/history/HOME-03.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H19 H20 H21 H22 H23` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H19 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H19 · Detail · locked preview**: Content detail (/content/[id]) locked: preview pages 1–4 of 84, title, 2,140 views, Updated Sep 2026, creator with Follow, price card 'Unlock · ₦3,000 · Pay from wallet · ₦485,250 available', 96% liked, Share, Save, Rate, 48 comments.
- **H20 · Detail · unlocked**: Unlocked detail: All 84 pages, 'Bought 26 Sep', Following, Read now, Download, Tip Kemi, Saved filled.
- **H21 · Comments**: Comments list with indented replies; Reply fills the input with @name.
- **H22 · Share sheet**: Share sheet: WAWU chat, Copy link, WhatsApp, More; link wawu/c/pricing-playbook; 'Send to' recent people (Amaka, Chidi, Bisi, Tolu).
- **H23 · Rate**: Rate this piece, 1–5 stars, 'only after buying' (from the code), Submit rating -> 'Thanks for rating' -> H20.

## Brief changes (build these, not the canvas)

- **H19**: if this button opens the H14 sheet, it keeps the price ("Unlock · ₦3,000") and the sheet shows the total. If you mean it to go straight to the PIN, it shows the total instead: "Unlock · ₦3,023.25" (₦3,000 + Fintava's ₦23.25). (Why: rule 5 and the purchases default.)

## Capability checks

- [ ] **H19**: a user can Unlock (H14–H16); Follow; Share (H22); Save; Rate (H23); open comments (H21).
- [ ] **H20**: a user can Read now; Download; Tip (H26); Rate; Share; unsave.
- [ ] **H21**: a user can reply to a comment; like a comment; post.
- [ ] **H22**: a user can copy link; share to WhatsApp / OS share; send inside WAWU chat to a person.
- [ ] **H23**: a user can choose stars; Submit rating.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From H2's caption (HOME-02) and a content result on X6 (EXPLORE-02), a user can reach H19 (this task adds both links, as drawn).

## What the backend serves today (from the analysis)

- **H19**: partial. Missing: Detail, comments, save, rate exist. Missing: preview page range, views increment, ContentPiece has no updatedAt column, wallet unlock.
- **H20**: partial. Missing: Purchase date per viewer not on the detail response (needs join); tip is Flutterwave.
- **H21**: served.
- **H22**: partial. Missing: No free P2P chat to share into; no shared-content message type; no wawu/c/{slug} resolver; no share counter.
- **H23**: partial. Missing: Route exists but does NOT check purchase and stores no per-user row: it averages the new score into ratingPct ((old + new)/2), so one user can rate repeatedly and skew it. Needs ContentRating(userWawuId, contentId, stars) unique + purchase check.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H19: ₦3,000
- H19: 84 pages · 2,140 views
- H19: 96% liked · 48
- H19: Preview · pages 1–4 of 84
- H20: Bought 26 Sep
- H22: link format wawu/c/pricing-playbook
- H23: '1–5 stars, only after buying'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
