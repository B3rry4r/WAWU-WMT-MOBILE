---
id: RELEASE-02
title: Fix QA defects, re-verify, submit to the stores
owner: YOU
area: RELEASE
order: 300
priority: launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: [CHECK-3]
decisions: [R-20, R-24]
passes: []
artboards: []
---
# RELEASE-02 · Fix QA defects, re-verify, submit to the stores

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after these are done (or in review): CHECK-3.
- **History:** none yet. Reports go to tasks/history/RELEASE-02.md.
- **R2-SOCIAL (25 Oct 2026, Sonnet builder, T2; mobile `wmt/R2-SOCIAL` on `origin/main` `a3fdaf71`; app only, no backend change, no native change, no route added):** the CHECK-3 social defects (audit `audits/CHECK-3/social.md`), status of the task unchanged (todo, the other areas are not in yet).

| # | CHECK-3 defect | Before | After |
|---|---|---|---|
| 1 (high) | I1: no + above the tab bar | never wired: INBOX-04 gave "the + button" to INBOX-19, which read it as a new-message compose with no person picker (G-882) and drew none. The board's + is the shared Create button (kit.js `Fab`, R-38) that Home, Explore and Me draw through `CreateEntry` | the Inbox tab draws it for creator accounts over every chip, opening Create; a fan sees none, as on Home, Explore and Me |
| 2 (med) | H22, I33: `wawuafrica.com/...` where the boards write `wawu/c/...` | shown as the real link | REPORTED, no change: nothing the Hub serves opens `wawu/c/<slug>` (G-R2S-1); the shared link stays the one that opens |
| 3 (med) | Explore "Who Made This?" empty | the rail read only the admin-featured list, empty until someone is featured | nobody featured: the rail is the first of All creators (what See all opens); featured creators still lead; empty only if both are |
| 4 (low) | H14, E3 "Bank charge / Total", E3 "Pay · ₦5,000", H14 no thumbnail | a zero fee drew a ₦0 charge line | a quote with no fee at all draws "Fee: No fee" (H14 without Total, E3 with); any fee is its parts; E3 button "Pay ₦7,500"; H14 thumbnail when the preview is a picture (a clip has none, G-1724) |
| 5 (low) | detail heart under H19, H20, H24, H25 | the like count | "N% liked" from the Hub's `ratingPct` when the piece has one, else the like count |
| 6 (low) | X5 "People are searching", X10 "Closest things we have" | not seen on the audit stack | NOT A DEFECT: both are built (`/search/popular`, empty until three people search the same thing; `/search/closest`) and tested; the stack had no data |
| 7 (low) | I32, I33 copy lines | both missing | I33: written from `GET /communities/message-cost` (R-62). I32: not drawn, no route serves the host's share (G-INBOX-14-1) |
| 8 (low) | E7 brightness caption | held back, `expo-brightness` "not installed" | it is (package.json); the screen goes to full brightness while a valid ticket is open and back after; the caption shows on a phone, not on the web |

Tests that pinned the old behaviour and were updated (the item names the defect, so it is the ruling): `buyTickets.test.tsx` `payButton` matched `Pay · `, now `Pay ₦`; `screens.test.tsx` and `slider.test.tsx` answer the All creators page the rail now reads when nobody is featured.

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nothing new is built here. Each CHECK-3 defect is fixed by the owner of that feature and re-verified by a different session; then the Android app is submitted to Google Play (R-24; iOS is RELEASE-03). Review time is the stores' decision, typically one to three days.

## Scope

Fixes for CHECK-3 defects only, each re-verified. Money launches with the app (R-20).

## Capability checks

- [ ] Every CHECK-3 defect is fixed and re-verified.
- [ ] The Android app is submitted to Google Play with the final build.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
