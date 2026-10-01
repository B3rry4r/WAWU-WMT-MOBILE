---
id: SETTINGS-01
title: Settings, notifications, privacy and blocked
owner: DEV
area: SETTINGS
order: 33
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, SHELL-02]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [Z2, Z3, Z4, Z5, Z12]
---
# SETTINGS-01 · Settings, notifications, privacy and blocked

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py Z2 Z3 Z4 Z5 Z12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **Z2 · Settings**: Header card (initials LE, name, lennox@wawu.africa · 0803 ••• 4412). Rows: Notifications; Privacy; Password; Wallet and PIN (Tier 2 · W35); TGIF on Home (Daily verse and prayer, toggle); Sound (Taps and alerts); Theme (System); About WAWU; Terms; Privacy policy; Sign out; Delete account.
- **Z3 · Notifications**: Toggle groups: Money (Money in: tips, sales, transfers; Refunds), Messages (Paid questions incl. reply deadlines; Community messages), Content (Reviews: approved or sent back; New followers), From WAWU (News and offers).
- **Z4 · Privacy**: Your profile: Show what I have bought (Off, nobody sees your purchases), Show my saved items, Show who I follow; Communities: Show me in member lists (Your messages are visible either way); Blocked accounts (2); Download my data (Sent to your email); Privacy policy.
- **Z5 · Blocked**: Blocked accounts list (Spam Account, Tunde K.) each with Unblock; caption 'They can't message you, see your profile or find you in search.'
- **Z12 · Nobody blocked**: Empty state: 'Nobody blocked. Block someone from their profile menu.'

## Capability checks

- [ ] **Z2**: a user can open each row; toggle TGIF; toggle sound; pick theme; sign out; delete account.
- [ ] **Z3**: a user can toggle each category.
- [ ] **Z4**: a user can toggle each; open Blocked accounts; request data download; open privacy policy.
- [ ] **Z5**: a user can unblock.
- [ ] **Z12**: a user can none.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states Z12.

## What the backend serves today (from the analysis)

- **Z2**: partial. Missing: Missing: change-password (signed-in, current+new), transaction PIN and tier, server-side session revoke on sign-out.
- **Z3**: partial. Missing: Keys exist for Refunds (refunds), New followers (newFollowers), News and offers (promotions), Paid questions (≈ dmReminders + newReplies). MISSING keys: moneyIn (tips, sales, transfers), communityMessages (current key is a weekly digest, not per-message), contentReviews (approved/sent back). Dispatch code must also honour the new keys.
- **Z4**: partial. Missing: Toggles and blocked list served. Data export only records a 'pending' row (data-export-request.service.ts:13 'only ever writes status: pending'); nothing compiles or emails the export, so 'Sent to your email' is not fulfilled.
- **Z5**: partial. Missing: Not enforced in search (search-response module) or public profile (user-profile module) - grep shows no blockedAccount reference there, so the caption's 'see your profile or find you in search' is not true today.
- **Z12**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z2: 'Tier 2' on Wallet and PIN row

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
