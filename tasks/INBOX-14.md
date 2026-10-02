---
id: INBOX-14
title: Private communities, hosting, join requests
owner: DEV2
area: INBOX
order: 171
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-01, INBOX-03, INBOX-05, WALLET-17, UI-02, UI-03, AUTH-06, ME-04, ME-07, INBOX-04]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [I30, I31, I37, I32, I33, I34]
---
# INBOX-14 · Private communities, hosting, join requests

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I30 I31 I37 I32 I33 I34` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for I30, I31, I37, I32, I33, I34, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

I32's "You keep 85% of every credit spent in your room" is backed by WALLET-17, which pays hosts their share; this task depends on it. I33's wawu/c/ link is a deep link (V10).

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-image-picker` (I32 picture), `expo-clipboard` (I33 Copy link). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **I30 · Private · ask to join**: Private room landing with cover image header, host name, "The host approves every member", avatars "Bisi and 12 people you follow are members", member count, host "Answers requests usually within a day", Ask to join.
- **I31 · Request sent**: "Request sent. Adaeze will see it in her join requests. We'll let you know when she answers." Waiting for the host, Cancel request.
- **I37 · Approved · inside**: Inside the private room after approval; cover stays as the room header, credit balance, host welcome message, Message · 1 credit.
- **I32 · New community**: New community form: picture, name, what it's for, Open vs Private ("You approve every member. Needs a cover image."), "Free to host. You keep 85% of every credit spent in your room." Creator accounts only.
- **I33 · Created**: "Aba tailors circle is live. Open · you're the host" with share link wawu/c/aba-tailors, Copy, Share link, Open room.
- **I34 · Join requests**: Host queue for a private room: requester name, headline and city, how long ago, Decline / Approve.

## Capability checks

- [ ] **I30**: a user can Ask to join.
- [ ] **I31**: a user can Cancel request.
- [ ] **I37**: a user can read; send (1 credit).
- [ ] **I32**: a user can add picture; enter name/description; pick Open or Private; Create community.
- [ ] **I33**: a user can Copy link; Share link; Open room.
- [ ] **I34**: a user can Approve; Decline.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I31.
- [ ] From A11 (AUTH-06), M19 (ME-04), M18 (ME-07) and I1 (INBOX-04), a user can reach I32 to start a community, and from I24 (INBOX-05) tap Ask (private) and reach I30 (this task adds them, as drawn).
- [ ] A user who opens wawu/c/aba-tailors on their Android phone lands in that room.

## What the backend serves today (from the analysis)

- **I30**: partial. Missing: No host display name on the community payload (only hostWawuId); no "people you follow who are members" query (FollowRelationship x CommunityMembership); no host approval-time metric. Cover is optional server-side though the board says every private room has one.
- **I31**: partial. Missing: No notification to the requester when the host approves or declines ("We'll let you know" is not backed); no community kind in notification-event.ts.
- **I37**: served. Missing: Room itself is served; the approval is not announced to the member (see I31).
- **I32**: partial. Missing: Create is served. "Needs a cover image" for Private is not enforced (imageUrl optional for both kinds). The host's 85% is computed into CreditSpendEarning but WalletFundingService only funds purchases and answered DMs, so credit-spend earnings never reach the wallet (admin finance service says the whole lifetime figure is outstanding).
- **I33**: partial. Missing: No community slug or short-link route; only a uuid id. A wawu/c/<slug> link needs a unique slug column, generation, and a resolve route.
- **I34**: partial. Missing: Queue and actions are served; payload lacks display name, headline ("Brand designer") and location ("Enugu") shown on the board.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I30: 640 members
- I30: Bisi and 12 people you follow
- I30: Usually within a day
- I37: 48 credits
- I37: 640 members
- I32: Free to host
- I32: You keep 85% of every credit spent in your room
- I33: wawu/c/aba-tailors
- I33: Members pay 1 credit a message
- I34: asked 2h ago

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
