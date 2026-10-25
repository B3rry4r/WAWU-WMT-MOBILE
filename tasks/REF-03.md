---
id: REF-03
title: Invite and earn
owner: YOU
area: REFERRAL
order: 279
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [REF-02, DV2-COMP, ME-01]
decisions: [R-43, R-65, R-68, R-33]
passes: [V1, V4, V5, V6, V9, V10]
artboards: [RF1, RF1a, RF1b, RF2, RF3, RF3a, RF4]
---
# REF-03 · Invite and earn

## Current state

As of 17 Oct 2026, built by a Sonnet builder. Status: merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/REF-03.md`, verdict merge, five lows). Stacked in batch 8 by MERGE-8. App only: no backend, wawu-id or web change, no migration.
- **Branch:** mobile `wmt/REF-03`, code `ff15a8f1` on `origin/wmt/DV2-03` `d4a0e956` plus a merge of `origin/wmt/DV2-COMP` `c6da2af7` (PointsFigure `fit`). The Hub is REF-02 on batch 7 (`origin/wmt/MERGE-7` `9c40478`); the app's types already had `/me/referrals` (REF-02 #2), so nothing was regenerated.
- **Built (`src/features/referral/`, routes `invite`, `invite-rules`, `invite-card`, `r/[code]`):** RF1, RF1a and RF1b are one screen over `GET /me/referrals`: link and code with Copy, Share, Brought / Verified / Points / Pending, the level row from the Hub's ladder, the next milestone ("then +X at N" from the milestones), the "one more" note when `remaining` is 1, "Nobody yet" while `brought` is 0. RF4 prints `holdDays` from the Hub. RF2 draws the card on the phone, captures it with `react-native-view-shot` and hands the PNG to the phone's share sheet; Save puts it in the photos. RF3 and RF3a tell a reward the Hub lists as `available` and a milestone it granted, once each per phone and account. The gift button on Me (M1) is the entry. A `wawu/r/<code>` link keeps the code and `POST /me/referrals/claim` is sent once the person is signed in (Home calls it), with nothing drawn.
- **Differs from the boards, each on purpose:** RF2 draws Share and Save, not WhatsApp, Story and Who Made This? chat (R-68: no outside brand; the chat target is not built, R-47); the web build draws Share only (no share sheet or photos there, as TGIF's). RF4's sixth rule stops after "never cash." until POINTS-05 builds Convert to cash (G-REF-03-2, R-47). "Example values" captions are the board's, not drawn. The card's shadow is the `cover` token, the nearest to the board's.
- **Decisions made (agent, owner may override):** the first look on a phone tells nothing and takes everything the Hub already lists as seen (a reinstall never replays old rewards); a milestone's "level is now" is the person's level now; several unseen moments are told one after another, oldest first; a refusal of a claim is final and silent, a claim that could not reach the Hub keeps the code for the next Home.
- **Shared:** SHARED-CHANGES REF-03 #1 applied with `npx expo install react-native-view-shot` (5.1.0; the native module needs the next dev or store build). Nothing else.
- **Gaps filed:** G-812 (the shared text `wawu/r/lennox` has no scheme and no https address opens the app), G-REF-03-1 (the Hub sends no notice when a reward lands, so RF3 is told on opening the screen), G-REF-03-2 (RF4 rule 6).
- **PROVISIONAL:** none added: every figure on RF1 to RF4 is the Hub's; the owner's list is TIER-06's.
- **Checks:** see the builder report (history). Pictures: NOT RUN or run, see the report.
- **Next:** a verifier checks V1, V4, V5, V6, V9, V10; the lead merges on batch 7.
- **History:** tasks/history/REF-03.md.

Status set to review by the records sync, 25 Oct 2026: merged as app 860dd446, verifier PASS in the lead's merge log, 17 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/REF-03.md](history/REF-03.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
