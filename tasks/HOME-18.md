---
id: HOME-18
title: Today's bell and three spacings
owner: YOU
area: HOME
order: 233
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [HOME-01]
decisions: [R-47, R-27, R-49]
passes: [V1, V4, V5, V6, V9]
artboards: [H1, H11]
---
# HOME-18 · Today's bell and three spacings

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 20. Tier T1. Built by a Sonnet builder.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-18.md`: one shared bell and Explore unchanged; the dot follows `GET /me/counts`; the tab row fits at 320, 360 and 390 in light and dark; the three spacings match H1 and H11; 11 suites, 178 tests; the builder's 5 mutants killed and 12 of the verifier's 15). Stacked in batch 20 by MERGE-20; not on main. Mobile branch `wmt/HOME-18`, built on `origin/wmt/MERGE-18` ba548d9f (it had not moved). Mobile only, no backend change, no package change. No PR.
- **Where this came from:** the COMPLETE-03 triage (`wmt/COMPLETE-03-T`, f3c3d30f) found four pieces H1 and H11 still draw that Today lacked. COMPLETE-03 itself is struck as superseded (lead ruling); these four are this task.
- **Built:**
  1. The bell with its unread dot in Today's bar, 40 round, 8 from the search button, as `todayHead` draws it. It is the one bell Explore draws (`src/features/notifications/NotificationsBell.tsx`, lifted out of `ExploreBar`, with a `today` and an `explore` size): it opens `/notifications`, the dot is `GET /me/counts` `unreadNotifications` (none at 0, none while the count is unread or failed, never a literal), and it is not drawn when signed out or without a way to open Notifications (R-47). H11 draws it too, without a dot.
  2. The tab row fits at 320: `HomeTabs fit` steps the gap between tabs and then the label size down until every word shows (`tabFitSteps`, never below 80%); the feed's row is untouched.
  3. The money card ends 16 under its actions (`moneyPadBottom`, was 18); its loading shape follows (202).
  4. The services heading has the canvas's line height, 24 at 18.5 (was 21.8, which put the rows under it 2 px high).
  5. A creator's Today ends 90 under the rail (`bodyBottomCreator`: the Create button's 16 above the bar, its 58, and 16 more), so Create never covers a card's Follow; anyone else keeps 32.
- **Checks (builder, on this tree):** see the Builder report below for each EXIT line and count.
- **Open findings:** none. Shared-file rows filed: HOME-18 #1 and #2 in `SHARED-CHANGES.md`. The verifier's 3 lows are SWEEP-APP rows HOME-18 L1 to L3 (open): 3 mutants survive (Explore's bell size at `ExploreBar.tsx:81`, Today's `fit` at `TodayScreen.tsx:82`, the dot's ring at `NotificationsBell.tsx:47`); built item 1 below says H11 draws the bell "without a dot" where the board draws one (the built behaviour, no dot until the count arrives, is right by R-47); G-HOME-18-1 and G-HOME-18-2 are reconfirmed.
- **Merge (MERGE-20):** one conflict, in SHARED-CHANGES.md (a union: HOME-18 #1 and #2 after SWEEP-APP-4 #4); no new route file (the Home tab route gains one prop and opens the existing `/notifications`); order 233 is held by no other task.
- **Next:** the batch 20 pull request (the lead). V9 (the real Hub) and V10 (a phone) were not run.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-47 (show only what is built), R-27, R-49
- `tasks/ME-14.md` (the bell on Explore), `tasks/HOME-01.md` (Today), the COMPLETE-03 triage record on `origin/wmt/COMPLETE-03-T` (`tasks/COMPLETE-03.md`, the (c) list)
- `design/_gen/_today.js` (`todayHead`, `balanceCard`, `services`), H1 and H11 in `design/Home Flow.dc.html`

## Goal

Today (H1, H11) draws the bell with its unread dot in its top bar, and the three measures the board draws that the built screen missed are the board's.

## Scope

- The bell with its dot in Today's bar, reusing Explore's bell (never a fork); the tab row keeps fitting at 320, 360 and 390.
- The money card's bottom padding 16, the services heading's line height 24, a creator's room under the rail.
- Files: `src/features/home/*`, `src/features/notifications/NotificationsBell.tsx` (new), `src/features/explore/ExploreBar.tsx` (uses the shared bell), `src/app/(tabs)/index.tsx` (one prop). Nothing else.

## Capability checks

- [x] A user on Today sees the bell with a dot when the Hub says something is unread, and tapping it opens Notifications. Tests: `HomeScreen.test.tsx` "H1 · the bell in Today's bar (HOME-18)" (dot with a count and a press, the 40/8/9/10 geometry, no dot at 0, no dot when the count fails, the dot follows the count, drawn while loading without a dot, not drawn without a way to open it, not drawn signed out and nothing asked), `homeRoute.test.tsx` (the route pushes `/notifications`).
- [x] The tab row shows every word at 320, 360 and 390. Tests: `HomeTabs.test.tsx` (the steps); the widths are measured in the web export (below).
- [x] The three spacings are the board's. Tests: `HomeScreen.test.tsx` "H1 · three spacings the board draws (HOME-18)" (card padding 18/16, loading shape height, heading line 24, creator 90 and everyone else 32).
- [ ] Pictures beside H1 and H11 at 320 and 390 px, light and dark (V5), and against the real Hub (V9): see the Builder report.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-18.md](history/HOME-18.md).

