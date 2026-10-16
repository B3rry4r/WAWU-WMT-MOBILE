---
id: REF-03
title: Invite and earn
owner: YOU
area: REFERRAL
order: 279
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [REF-02, DV2-COMP, ME-01]
decisions: [R-43, R-65, R-68, R-33]
passes: [V1, V4, V5, V6, V9, V10]
artboards: [RF1, RF1a, RF1b, RF2, RF3, RF3a, RF4]
---
# REF-03 · Invite and earn

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 3 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): REF-02, DV2-COMP.
- **History:** none yet. Reports go to tasks/history/REF-03.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-65, R-68, R-33 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person shares their link and code, watches brought, verified, earned and pending points, sees their level and next milestone, and is told when a referred person pays and is verified (RF1 to RF4).

## Scope

- New files under `src/features/referral/`. `GET /me/referrals` (REF-02, G-802). RF1, RF1a (nothing yet), RF1b (a milestone close); RF3, RF3a: the reward moment when the Hub says points became available; RF4: the plain rules, with the hold days and multipliers read from the Hub, never typed.
- RF2: the share card is drawn on the phone and shared through the phone's share sheet (R-33), not an Instagram card (R-68); the image needs `react-native-view-shot`: SHARED-CHANGES row REF-03 #1.
- Default (agent), owner may override: no board draws where a new person types a referral code. Opening a `wawu/r/<code>` link in the installed app claims the code after sign-in (V10 for the deep link); nothing else is drawn (G-815).
- Entry as drawn: "Invite and earn" on Me (M1).

## Capability checks

- [ ] A person can copy and share their link and code from RF1.
- [ ] RF1 shows brought, verified, earned and pending apart and the next milestone from the Hub.
- [ ] RF4 prints the Hub's hold days and level multipliers, not literals.
- [ ] The share card shows no outside brand name.
- [ ] Each board above (RF1, RF1a, RF1b, RF2, RF3, RF3a, RF4) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
