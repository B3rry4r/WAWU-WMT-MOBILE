---
id: HOME-03
title: Content detail: preview, unlocked, comments, share, rate
owner: YOU
area: HOME
order: 141
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [HOME-04, HOME-06, INBOX-06, UI-02, HOME-02, HOME-12, HOME-13, EXPLORE-02]
decisions: [R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [H19, H20, H21, H22, H23]
---
# HOME-03 · Content detail: preview, unlocked, comments, share, rate

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 14.
- **Status:** merging (lead). Verdict: MERGE after one medium fix round (the locked course's foot covered the comments; closed in S1b round 2, mobile e2748258, on the lead's diff read); backend b5f5538 MERGE; the comment double post and the preview pill lows were closed in the same round, one low left (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S1b.md`). Stacked in batch 14 by MERGE-14 (backend `wmt/MERGE-14`, mobile `wmt/MERGE-14`); not on main. Built: Mobile `wmt/S1b` (from `origin/wmt/MERGE-11` `47555987`, `origin/wmt/S1` `9d221172` and `origin/wmt/EXPLORE-02-R2` `fb2eb0ba` merged, never rebased). Backend `wmt/S1b` (from `origin/wmt/B3a` `d89e47c`), one additive change.
- **Built:** `/content/<id>` (`src/app/content/[id].tsx`, `src/features/content-detail/`): H19 locked, H20 unlocked, H21 comments (sheet), H22 share (sheet), H23 rate (sheet); HOME-08's H24 free video and H25 course are the same screen (see HOME-08).
- **Backend:** `GET /content/{id}/detail` now carries `creator` (name, ticks, headline, followers): the Hub served no name for a piece's maker. Contract regenerated (SHARED-CHANGES HOME-03 #1, #2). Spec case added to `content-detail.contract.spec.ts`.
- **Entries added:** a feed caption (H2) and a Search content result (X6) open the page (SHARED-CHANGES HOME-03 #4). **Not added:** ME-07's library rows: `origin/wmt/ME-07` is not in this base (no library screen exists here), so that entry waits for the merge or a small follow-up.
- **Money:** Unlock uses HOME-12's sheets (H14 to H18) and Tip HOME-13's (H26 to H28): a fresh quote before the PIN, one Idempotency-Key per attempt. The price card keeps the price ("Unlock · ₦3,000"); the sheet shows the total.
- **Not drawn (R-47):** "Yours forever" (G-HOME-03-3), "96% liked" as a percentage (G-HOME-03-1). Share link is `wawuafrica.com/content/<id>` (G-HOME-03-2). Download opens the file's address (G-HOME-03-4). Star words other than "Really good" are a default (G-HOME-03-5).
- **Merge fallout fixed:** the Explore pill and Search field said "Search Who Made This??" after R-69 (SHARED-CHANGES HOME-03 #3).
- **Round 2 (17 Oct 2026, findings 2 and 3):** Send posts once: a ref is set before the request and cleared on its answer (two presses in one frame, one POST; a failed post lets go too). The preview pill sits 12 from the picture's foot as drawn (`Pill` `flush`, SHARED-CHANGES HOME-03 #5) and the book's last line has the board's 24 under it: 6 px between the line and the pill, no shared area (H19, H20). H25's foot is HOME-08's.
- **Next:** the batch 14 pull request (the lead). The verifier's lows are in SWEEP-APP (S1b F4).
- **Copy (16 Oct 2026, R-69, R-53, DESIGN-V2-CUT):** print the app's name as "Who Made This?" with the question mark, and label the provider's part of a fee "Bank charge"; the 16 Oct boards of this task differ from the old ones only by that wording. DV2-COPY re-checks this task last.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-03.md](history/HOME-03.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
