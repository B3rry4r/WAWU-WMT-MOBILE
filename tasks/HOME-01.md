---
id: HOME-01
title: Today: home screen, loading, TGIF off
owner: YOU
area: HOME
order: 170
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [SHELL-01, UI-02, UI-03, MONEY-11, MONEY-13, HOME-10, HOME-11, HOME-02, HOME-09, KYC-05]
decisions: [R-2, R-6]
passes: [V1, V4, V5, V6, V9]
artboards: [H1, H11, H36]
---
# HOME-01 · Today: home screen, loading, TGIF off

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


## Lead note (7 Oct 2026): built now, with what exists (R-41)

The owner asked for every tab to be built now. This hub is built before the tasks below; each entry on it that leads to one of their screens is left out here and added, exactly as drawn, by that task (R-27, R-41). Everything else on the artboards is built as drawn.

- HOME-07 (Feed: course, template, creator and professional cards, empty and error)
- EXPLORE-02 (All creators and search)
- ME-14 (Saved, purchases and notifications)
- WALLET-02 (Send to a WAWU user)
- WALLET-05 (Add money and withdraw)
- BILLS-01 (Pay a bill: choose biller, meter and amount)
- EVENTS-01 (Events: list, filters, detail, sold out)
- LEGAL-02 (Legal: chat, profiling, brief, consultant joins)
- SCHOOLS-03 (Schools: directory, school page, course page, no results)
- ME-02 (Someone else's profile and following)
- ME-04 (Create: pick a format, upload, preview)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H1 H11 H36` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H1, H36 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H1 · Today**: Home's Today tab: Today/Following/For you tabs, a Naira balance card (₦485,250.75) with Send, Add, Bills, Scan, the TGIF card for the day, a four-service row (Pay bills, Events, Legal, Schools; BRIEF H1), and a 'Creators to discover' rail with Follow. 'Approved E1 (b)'. Create button for creator accounts only. Entry map numbers 9 hotspots.
- **H11 · Today · loading**: From H1 while it loads: skeletons matching the real layout.
- **H36 · Today · TGIF off**: From Settings (Z2) 'TGIF on Home' off: Today without the TGIF card (Schools tile, BRIEF H36). The sponsored card that takes TGIF's place is added by ADS-01; with no live campaign nothing shows and there is no empty frame.

## Launch scope

Scan on the balance card is not built at launch: WALLET-20 adds it after launch (BRIEF "Not built at launch").

## Brief changes (build these, not the canvas)

- **H1**: the fourth tile is **Schools** (with a schools icon), and it opens SC1 Schools. (Why: R-2. Shop is retired; Schools takes its place.)
- **H36**: the fourth tile is **Schools**, opening SC1. (Why: R-2.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- H1: Scan on the balance card (opens W24): added by WALLET-20 after launch; not built at launch (BRIEF, "Not built at launch")
- H36: the sponsored card in TGIF's place (opens H33): added by ADS-01

## Capability checks

- [ ] **H1**: a user can switch to Following (H12) or For you (H2); tap search (X5); tap the bell (M31); tap Send (W7), Add (W15) and Bills (S2) on the balance card; open the TGIF card (H29); tap Pay bills (S2), Events (E1), Legal (S14) or Schools (SC1); Follow a creator in place or open a profile (M5); See all creators (X4); Create (+) (M19, creator accounts only).
- [ ] **H36**: a user with TGIF off sees Today without the TGIF card, with the Schools tile, and no empty frame where the sponsored card goes.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H11, H36.
- [ ] A user with no wallet sees the balance card lead to Open your wallet (A26).

## What the backend serves today (from the analysis)

- **H1**: partial. Missing: No wallet/balance for non-creator accounts (balance card is drawn for every user); no TGIF readers-today counter or any TGIF backend; no Scan (QR pay) route; creator suggestions exist.
- **H11**: n/a.
- **H36**: missing. Missing: No ad serving; TGIF preference is not stored server-side (only needed server-side if ad targeting/reporting must know it).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H1: Naira balance ₦485,250.75
- H1: TGIF '5 cards · 2 min · 12.4K reading today'
- H1: TGIF date FRIDAY 26 SEP, series 'Sons, not slaves'
- H36: from ₦5,000

## Designer notes (⚠, unresolved)

- None.

## Builder report

Built by the lead's agent, 7 Oct 2026, mobile only (no backend change: every route used is on backend main `3041887`). Branch `wmt/HOME-01` from origin/main `c5d3a94`, origin/main `a167415` merged (docs only).

**Files.** New `src/features/home/`: `HomeScreen.tsx` (Today and the feed under one tab row, the screen's "Home" title for a screen reader), `TodayScreen.tsx` (H1, H11, H36, page states), `BalanceCard.tsx`, `TgifCard.tsx`, `CreatorRail.tsx` (cards, Follow in place, empty and error), `TodayLoading.tsx`, `HomeTabs.tsx` (the tab row, now also the feed's), `CardGlows.tsx`, `api.ts` (`GET /creators`, `POST`/`DELETE /creators/{wawuId}/follow`), `model.ts` (every rule, pure), `look.ts`, tests `__tests__/model.test.ts` (12), `__tests__/HomeScreen.test.tsx` (16). `src/app/(tabs)/index.tsx` renders `HomeScreen`; `src/app/(tabs)/feed.tsx` deleted (HOME-02 R1: the feed is shown in place, so the Home tab is lit on all three tabs with no `_layout.tsx` change). `src/features/feed/FeedScreen.tsx`: its tab row is `HomeTabs`, Today first when Home passes `onToday`, opens on `initialScope`. Shared tests: `src/__tests__/shell.test.tsx` counts the bar's tabs apart from Home's own tab row (`feed-tab-*`); `src/__tests__/auth-guard.test.tsx` points the API at a closed local port, so a signed-in Home in that test never calls a live service. `BACKEND_GAPS.md` G-280 to G-282, `SHARED-CHANGES.md` HOME-01 #1, #2 and the statuses of HOME-02 F1, HOME-02 R1, HOME-09 F1.

**Capability checks** (each stays `[ ]` until the verifier passes it). Web export at 390 px against the local Hub (V9 below), Playwright driver `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/tools/drive.py`, log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/drive-log.jsonl`.
- H1 Following and For you: jest (tab press shows the feed on that tab, its Today returns); browser `tab-following`, `tab-for-you`, then Today again (`tabs` event).
- H1 open the TGIF card: jest (`router.push('/tgif')`); browser lands on `/tgif` (`tgif-opens-reader`). The card's words are the Hub's `series`, the day the Hub served, cards counted from the day, readers from `/stats` ("5 cards · 3 reading today" with three real `POST /tgif/{date}/read`).
- H1 Follow in place: jest (POST then DELETE, a refused follow goes back and says so); browser Follow to Following on two creators, one `FollowRelationship` row each, read back as Following after a fresh sign-in (`H1-followed`).
- H1 search, bell, Send, Add, Bills, Scan, Pay bills, Events, Legal, Schools, See all, open a profile, Create (+): **left out** (table below); jest asserts none is drawn.
- H36: TGIF switched off on Z2 in the browser (`TgifPreference.show` false in the database), Today has no TGIF card and no empty frame, and the day is not asked for (jest); switched back on after (`H36-tgif-off`).
- No wallet leads to A26: a person with no wallet (`409 wallet_not_open`) sees the Hub's sentence and Open your wallet, which opens `/open-wallet` (`H1-no-wallet`, `H1-no-wallet-opens-A26`, jest).
- Every value from the API or the user: balance (Fintava sandbox through the Hub, ₦250.00 for sandbox customer A), TGIF day, series, readers, creators, names, fields, ticks, follow state. The canvas's ₦485,250.75, "2 min", 12.4K, the date and series are not in the code (G-280 for the reading time).
- V6, each by its cause: loading (Hub answers held, `H11-loading`); page error (browser cut from the Hub from the first read, `error-offline`, then Try again with the Hub back, `error-retried`); creators error alone (`creators-error`); empty rail (a person who blocked every creator through `POST /settings/privacy/blocked`, `creators-empty`); wallet opening (a held `conflict` opening row, `balance-opening`); bank unreachable (Hub restarted with `FINTAVA_TIMEOUT_MS=50`, sandbox read timed out, `balance-unreachable`); the eye (`H1-masked`).

**Screenshots**, each `-light.png` and `-dark.png`, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/shots/`: H1-wallet, H1-wallet-scrolled, H1-masked, H1-no-wallet, H1-no-wallet-opens-A26, H1-followed, H11-loading, H36-tgif-off, balance-opening, balance-unreachable, creators-empty, creators-error, error-offline, error-retried, tab-following, tab-for-you, tgif-opens-reader; and compare-H1, compare-H11, compare-H36 (design render left, built screen right). I do not say they match; the verifier decides.

**V9 (real seam).** Hub from backend origin/main `3041887` (fresh worktree, `npm ci`, `prisma generate`, `nest build`) on :5361, fresh migrated and seeded `bh01_hub_test`, stand-in WAWU ID on :5362, web export on :5363 (bundle holds only `localhost:5361` and `localhost:5362`; every browser request went to localhost). Signed in through the app's own sign-in screen (the stand-in answers flat; Playwright wraps that answer as the real service does; nothing else injected). Fintava: the sandbox (dev.fintavapay.com) only, reads of sandbox customer A's balance (documented example data, `docs/fintava/sandbox/07-`), key read from the secrets file into the Hub's environment only. Created and read back: follows (`FollowRelationship`), the TGIF switch (`TgifPreference`). Seeds (scratch): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/tools/seed.py`, `seed2.py`.

**Counts.** Before (origin/main `c5d3a94`, own worktree): tsc 0, lint 0, jest 63 suites 1143 tests, 1 failed (`settingsScreens.test.tsx`, under load from parallel runs), gates 297 files 0 findings, 210 tasks. After (merged with origin/main `a167415`, `npm run check` exit 0, run after the container restart): tsc 0, lint 0, jest 65 suites 1171 tests all passed (+2 suites, +28 tests, all HOME-01's), gates 309 files 0 findings, baseline 0, 210 tasks. `npm run check` was run once as is (parallel jest); the other runs used `jest --runInBand` with a private TMPDIR.

**Left out (R-41), with the task that adds each.**
| Artboard | Entry | Leads to | Added by |
|---|---|---|---|
| H1, H36 | Search (header) | X5 | EXPLORE-02 |
| H1, H36 | Bell (header) | M31 | ME-14 |
| H1, H36 | Send (balance card) | W7 | WALLET-02 |
| H1, H36 | Add (balance card) | W15 | WALLET-05 |
| H1, H36 | Bills (balance card) | S2 | BILLS-01 |
| H1, H36 | Scan (balance card) | W24 | WALLET-20, after launch |
| H1, H36 | Naira chip's currency switch (chevron) | Dollar, Crypto | WALLET-21, after launch |
| H1, H36 | "What would you like to do today?" with Pay bills, Events, Legal, Schools | S2, E1, S14, SC1 | BILLS-01, EVENTS-01, LEGAL-02, SCHOOLS-03 (the heading comes with the first tile) |
| H1, H36 | See all (creators) | X4 | EXPLORE-02 |
| H1, H36 | A creator card opening the profile | M5 | ME-02 |
| H1, H11, H36 | Create (+), creators only | M19 | ME-04 |
| H36 | Sponsored card in TGIF's place | H33 | ADS-01 |
| H2 to H6 (feed) | Search beside the tabs | X5 | EXPLORE-02 |

**Decisions (Default (agent), owner may override).**
1. Home shows the feed in place (HOME-02 R1): one tab row for Today, Following and For you; `/feed` is gone.
2. The no-wallet card keeps the chip and puts the Hub's sentence and "Open your wallet" where the figure is (no artboard draws it); opening shows the Hub's sentence and "Check again"; unreachable shows W6's words and Try again; a failed balance read says the error and Try again. Never a figure the Hub did not send.
3. The eye hides the figure until the app restarts (kept on Home while the person visits the feed).
4. The TGIF card's title is the Hub's `series` (the field the reader's header uses), written as the book has it, so it reads in capitals ("FREE FROM…"); `seriesTheme` is the other choice. Readers left out at 0. A failed TGIF switch read leaves TGIF on (the Hub's own default); a day that cannot be read leaves the card out.
5. The rail is `GET /creators` page 1 (12) without the viewer (G-281); Following toggles back to Follow (DELETE). No photo: the person's initials on their hue (G-282).
6. The skeletons take the built cards' heights (H11's note "skeletons match the real layout"), not H11's 203 and 64, which are drawn for a card with four buttons; no tile shapes.
7. Page error only when every read fails and the wallet did not answer; otherwise each part says its own problem.
8. Copy the canvas does not draw: "Today didn't load", "Check your connection, then try again.", "The creators didn't load...", "No creators to suggest yet", "New creators show up here as they join and publish.", "<name> wasn't followed. Try again.", "Check again", "Your wallet is on hold at the bank." (frozen, only when the Hub sends no sentence).
9. Colours the tokens lack are the nearest tokens (HOME-01 #1); the creator card draws its own picture, scrim and caption until `MediaCard` takes a footer (HOME-01 #2).

**NOT RUN.**
- A phone (V10 not in this task's passes): unblocked by a development build on a phone reaching a Hub (docs/LOCAL.md). What only a phone shows: the status bar over the header, the card glows drawn by react-native-svg on Android, the shadow under the light money card.
- The frozen wallet state on a screen: nothing stores a freeze (`423 wallet_frozen` is never answered, G-10); tested by the model test only.
- Picture match (V5): the verifier's.
- Cleanup: the Hub, stand-in and web server were stopped, `bh01_hub_test` dropped and the Hub and baseline worktrees removed before the container restart; nothing of this task was left running.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
