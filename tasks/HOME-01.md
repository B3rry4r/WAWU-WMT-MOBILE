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

Verifier session, 7 Oct 2026, independent of the builder (this session wrote none of HOME-01). Head `52b4142` (it contains mobile origin/main `a167415`), checked out detached in `/home/user/wt/vh01m`. Backend: origin/main `3041887` in a detached worktree, `prisma generate`, `nest build`, on a fresh migrated and `db:seed`ed database `vh01_hub_test`. **The real WAWU ID**, origin/main `fb8717e`, in its own detached worktree on a fresh migrated `vh01_id_test` seeded by the backend's `scripts/local/seed-wawu-id.js` (its local `node_modules` lacked `@nestjs/swagger`, so that package and its three missing dependencies were hard-linked from `shared-be`; no code changed). Hub :5395, WAWU ID :5396, web export :5397 (`expo export --platform web --clear` with a private TMPDIR). The bundle names `http://localhost:5395` and `http://localhost:5396` as its only API origins (no `wawuafrica.com`). Every browser request in every run went to localhost:5395, :5396 or :5397. The one exception is `storage.seed.local`, the seed's media host, which does not resolve; it was asked for only on the feed tabs. Each run signed in through the app's own Welcome, then Sign in, against the real WAWU ID: no token was injected and no answer was rewritten. Fintava was **unset** (no key, no base URL), so a wallet holder's real answer is `503 provider_unreachable`. Nothing called the sandbox or live. Chromium (/opt/pw-browsers) at device scale 2: 390 x 845 in light and dark, plus 320 x 568. Evidence is in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vh01/`: `shots/` (55 captures), `pairs/` (design left, built right), `design/` (renders of H1, H11, H36, H2 and H12), `drive-log.jsonl`, `logs/batch1.log`, `logs/batch2.log`, `mutants.json`, `check-1.log`, `jest-rerun-2.log`, `check-final.log` and `tools/` (driver, seed steps, mutant runner).

Seed changes for this run (scratch database only):
- `creator-basic` got a `FintavaWallet` row, so the real answer is `provider_unreachable`.
- `creator-pro` got a `FintavaWalletOpening` row in state `opening`.
- `user` has no wallet.
- `creator-pro` was renamed in WAWU ID to "Tamunotonye Briggs", with interest "Pottery and ceramics" and a creator tick. `creator-basic` got a professional tick.
- 1,234 and then 2,535 `TgifRead` rows for 7 Oct.
- `user`'s seeded follow of `creator-pro` was removed, so the app could write it.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 code | passed, with findings D3 | **First `npm run check`** (`check-1.log`, machine load about 10): typecheck and lint clean; jest 65 suites, 1,171 tests, 2 failed. Both were 20 s timeouts in suites HOME-01 does not touch (`OpenWalletScreen.test.tsx` A26 loading, `settingsScreens.test.tsx` Z3). Rerun alone with `--runInBand`: 2 suites, 128 of 128 passed (`jest-rerun-2.log`). **Final `npm run check`** on the report commit: see the "V1 final run" row. **Diff against the builder's list:** it matches. The 23 files are `src/features/home/` (14), `src/app/(tabs)/index.tsx`, the deleted `src/app/(tabs)/feed.tsx`, `src/features/feed/FeedScreen.tsx`, two shared tests and five docs. No `_layout.tsx`, `src/components`, `src/theme`, `src/api`, `package.json` or `app.json` is touched. `FeedScreen.tsx` sits outside `src/features/home/`, but SHARED-CHANGES HOME-02 F1 asks HOME-01 to put Today in that tab row; the change only swaps its own `Tabs` for `HomeTabs` and adds `initialScope`/`onToday`, and HOME-02's feed tests pass unchanged. **Shared tests:** `shell.test.tsx` still asserts the bar's five tabs in order and exactly one lit; it now leaves out Home's own `feed-tab-*` row, which is not the bar. That is not a weaker test. `auth-guard.test.tsx` points `@/api/env` at `127.0.0.1:9`. Home now reads the Hub once signed in, and without the mock the jest run would call `api.wawuafrica.com`. No assertion changed. **`feed.tsx` deletion:** justified by HOME-02 R1 (Home shows the feed in place). `grep` finds no remaining link to `/feed`. **Copy and literals:** no em-dash, hex, `rgb(` or `Flutterwave` in added code. No canvas figure (485,250.75, 12.4K, "2 min", 26 SEP, "Sons, not slaves", Adaeze, Funmi, Zainab) in product code; these appear only in test fixtures. Tokens only (gates 0 findings). |
| R-41 rule | passed | Every H1 and H36 entry is either built or in the left-out table. Each left-out destination belongs to a task that is still `todo`: EXPLORE-02 (X4, X5), ME-14 (M31), WALLET-02 (W7; UI-03's W7 is the avatar component, not the screen), WALLET-05 (W15), BILLS-01 (S2), EVENTS-01 (E1), LEGAL-02 (S14), SCHOOLS-03 (SC1), ME-02 (M5), ME-04 (M19), ADS-01 (H33), WALLET-20 (W24) and WALLET-21 (W2). `src/app/` has no route for any of them: `settings/notifications` is Z3, not M31; `works/[wawuId]` is M34, not M5; `add-work` is M36, not M19; `(tabs)/wallet` and `(tabs)/explore` are shell placeholders. Nothing drawn opens nothing, and no "coming soon" is shown. The browser text of every capture holds no Send, Add, Bills, Scan, tiles, See all, search, bell or Create, and jest asserts the same. The built entries open existing screens: the TGIF card goes to `/tgif` (`tgif-opens-reader-light.png`), Open your wallet goes to `/open-wallet` (`H1-no-wallet-opens-A26-light.png`), and Following and For you show the feed in place. |
| V4 field trace | passed (live figure NOT RUN) | Traced from writer to reader. **Balance:** Fintava, then `GET /money/wallet/balance` (MONEY-11, `no-store`), then `fetchWalletBalance` (refuses a non-integer figure), then `balanceView`, then `<Money minorUnits>`. **TGIF day and series:** the Hub's book (`assets/tgif`), then `GET /tgif/{date}`, then `tgifDayLabel(day.date)` and `day.series`. **Readers:** `TgifRead` rows, then `GET /tgif/{date}/stats` `readers`, then `compactCount`. **Creators:** `UserProfile` plus WAWU ID names, then `GET /creators`, then the cards. **Follow:** `FollowRelationship`, then `following` on `GET /creators`. Non-canvas values followed on screen: 1,234 readers showed "1.2K reading today" and 2,535 showed "2.5K" (`V4-readers-light.png`). With the browser clock set to 14 Mar 2026, the card read "TGIF · SATURDAY 14 MAR", "SONS, NOT SLAVES" and "5 cards" with no readers part; the Hub served `"series":"SONS, NOT SLAVES"` for that day (`V4-day-0314-light.png`). The renamed creator showed as "Tamunotonye Briggs · Pottery and ceramics" with a creator tick, and `creator-basic` showed a professional tick. The viewer was left out of the rail: `creator-basic` saw only `creator-pro`, and the reverse. A live Fintava figure is NOT RUN (see below); the figure path is covered by jest and by mutants M5 and M11. |
| V5 picture | failed (D1) | `pairs/H1-{light,dark}.png` compares H1 with the figure state. The balance answer was written by the browser **for the picture only** (₦12,345.67), and that capture is not V9 evidence. Also compared: `pairs/H1-nowallet-*`, `pairs/H11-*` and `pairs/H36-*`, plus 320 x 568 (`H1-320-*`, `H1-figure-320-light`, `H36-320-light`): nothing overflows sideways and the figure fits at 320. **Matches:** the tab row (position, weight, underline); the money card (radius, ground, glow, chip, figure size and the faint kobo); the TGIF card (height, glows, play disc, three lines of words); the section heading; the rail's card size and spacing; the bar. The feed's tab row sits about 6 pt higher than Today's, as H2 sits higher than H1 on the canvas (measured). Every other difference is classified under Findings. |
| V6 states | failed (D2) | Each state was entered by its real cause. **Loading (H11):** the Hub's answers held (`H11-loading-*`). **No wallet:** the real `409 wallet_not_open`, and Open your wallet lands on `/open-wallet` (A26). **Opening:** the real `409 wallet_opening` and "Check again" (`balance-opening-*`). **Bank unreachable:** the real `503 provider_unreachable` with Fintava unset (`balance-unreachable-*`). **Page error:** the browser cut from the Hub ("Today didn't load"); Try again with the Hub back draws Today (`error-offline-*`, `error-retried-*`). **Creators error alone:** shows in place, and Try again brings them back (`creators-error-*`). **Empty rail:** `creator-basic` blocked the only other creator through `POST /settings/privacy/blocked` (`creators-empty-*`). **TGIF off (H36):** switched off on Z2 in the app (`H36-tgif-off-*`). **Tabs:** on Following and on For you the bar's Home tab has `aria-selected=true` and no other bar tab is selected; Today comes back (`tab-following-*`, `tab-for-you-*`). **Failed TGIF day read:** no state at all (D2). **Frozen:** NOT RUN. |
| V9 live seam | passed | Real WAWU ID sign-in through the app's sign-in screen. **Follow:** the database had 0 rows, then `user` tapped Follow on Tamunotonye Briggs. The button turned to Following and one `FollowRelationship` row appeared (`…0001` to `…0003`, 15:37:59). The Hub's `GET /creators` as `user` answered `"following":true`. A fresh sign-in drew Following (`H1-after-follow-dark.png`). Unfollow from the app sent `DELETE`; the database was back to 0 rows and the button to Follow (`H1-unfollowed-dark.png`). **TGIF switch:** before, there was no `TgifPreference` row. Switched off on Z2 in the app: the row is `show=f` and `GET /settings/tgif` answers `{"show":false}`. Today then had no TGIF card and no empty frame. Switched back on in the app: `show=t` and the card returned (`tgif-back-on-light.png`). The no-wallet sentence, the readers and the wallet answers above came from the server only. |
| V1 final run | passed | **Final `npm run check`** on the report commit's tree (`check-final.log`): exit 0. Typecheck and lint clean; jest 65 of 65 suites, 1,171 of 1,171 tests (HOME-01's 2 suites hold 28 of them); gates 9 run, 309 files scanned, 0 findings, baseline 0; 210 tasks, 279 artboards covered. |
| Mutants | 14 of 14 killed | `tools/mutants.py`, home suite `--runInBand`, each mutant applied and then restored (the worktree was clean afterwards). Killed: M1 readers 0 shown; M2 a failed switch hides TGIF; M3 viewer not filtered; M4 tick order swapped; M5 unreachable shows the Hub's words; M6 page error ignores the wallet's answer; M7 no wallet opens `/wallet`; M8 refused follow not reverted; M9 title from `seriesTheme`; M10 month not shortened; M11 eye on a no-wallet card; M12 feed ignores the tab pressed; M13 TGIF off still asks for the day; M14 unfollow sends POST (`mutants.json`). |

Capability checks:
- **H1, as far as this task builds it: passed.**
  - Following and For you: passed, live and in jest.
  - Open the TGIF card (H29): passed, live.
  - Follow in place: passed, live, with a database readback.
  - Search, bell, Send, Add, Bills, Pay bills, Events, Legal, Schools, See all, the profile and Create belong to the tasks in the left-out table (R-41).
- **H36: passed.** Today has no TGIF card and no empty frame. The Schools tile comes with SCHOOLS-03, as the four tiles do (R-41).
- **Picture: failed** (D1).
- **Every value from the API: passed** (V4).
- **States: failed** (D2).
- **No wallet leads to A26: passed**, live.

### Findings

**D1 · defect (V5, small).** The balance card's eye is drawn in full white. H1 paints it white at 70%, which reads as a soft lilac over the glow: sampled (204,185,212) in both canvas themes, against (255,255,255) on the built card. `look.ts` names this as `eyeFaint: 0.7` ("The eye: 19, white at 70%"), but nothing uses it. It is the only unused metric in `look.ts`. `EyeToggle` in `BalanceCard.tsx` passes `color={cardInk.ink}` with no opacity. Reproduction: any wallet holder with a figure, or `pairs/H1-light.png` at the card's top right.

**D2 · defect (V6).** A TGIF day that cannot be read removes the card with no message and no Try again, so Today looks exactly as it does with TGIF switched off.

Reproduction: TGIF on, then cut `GET /api/hub/tgif/2026-10-07` (`tgif-day-error-light.png`). The page shows the balance and the creators and no trace of TGIF. In `TodayScreen.tsx`, `tgifOn && tgifDay.data ? <TgifCard/> : null` swallows `tgifDay.isError`. Only a page reload asks again.

The creators part, failing the same way, says so and offers Try again, and builder decision 7 says "each part says its own problem". Decision 4 ("a day that cannot be read leaves the card out") is an agent default, not a DECISIONS.md or BRIEF ruling. The capability check "Loading, empty and error states exist" is not met for this part.

**D3 · defect (VERIFIER.md check 2, no stand-ins for what main has).** `SuggestionCard` in `CreatorRail.tsx` redraws `MediaCard`'s stacked layout itself: the picture filling the card, the `gradients.scrimCard` scrim through `gradientEnds`, and the caption 10 in from the sides. SHARED-CHANGES HOME-01 #2 defers the swap to `MediaCard`. The role file names exactly this ("A copy, or a SHARED-CHANGES row deferring the swap, is a defect"). It is the only copy of the stacked scrim in `src/`. The fix needs the fenced change HOME-01 #2 (`footer` and `titleAccessory` on `MediaCard`). The card then becomes `MediaCard layout="stacked"`, and its own picture, scrim and caption are deleted.

**Differs for a recorded reason:**
- **Entries left out under R-41 and R-27, each added by its own task (left-out table):** search and bell; Send, Add, Bills and Scan; the chip's chevron; "What would you like to do today?" with its four tiles; See all; the FAB (+); H36's sponsored card. Scan also appears under BRIEF "Not built at launch".
- **BRIEF H1 and H36 (Schools tile, R-2, R-29):** not checkable yet. No tile is drawn, and no Shop tile appears anywhere. SCHOOLS-03 must add the tile as Schools.
- **"2 min" is left out:** G-280, and the task's "Figures on these artboards are not facts".
- **Creator cards have no photo** (initials on a hue over the sunken ground, where the canvas has coloured photos): G-282.
- **TGIF label lilac and warm glow use the nearest tokens:** SHARED-CHANGES HOME-01 #1.
- **H11 skeleton heights take the built cards' heights, and no tile shapes are drawn:** H11's own note ("skeletons match the real layout") and R-41.
- **The canvas phone chrome** (9:41, the notch, the home indicator) is not part of the app.

**Not drawn by any artboard, decided by the builder (agent defaults, owner may override; not defects):**
- The no-wallet, opening, unreachable and error contents of the balance card (decision 2).
- The series in the book's capitals, for example "FREE FROM…" (decision 4).
- The rail being the directory's first page, including people already followed (decision 5, G-281).
- The copy in decision 8.

**Unclear (small, web only):**
- On the web build, Home's own tab row (Today, Following, For you) carries no `aria-selected`, while the bar's tabs do. `HomeTab` passes `accessibilityState={{ selected }}`, which the native app reads. The pattern comes from HOME-02's earlier `Tab`.
- Facts: "Your money is safe…" is W6's own wording and the Hub's own sentence. "New creators show up here as they join and publish" matches `GET /creators` eligibility (a creator with a live piece). No other fee, limit or promise is on screen.

### NOT RUN

| Item | Why | What unblocks it |
|------|-----|------------------|
| A live Fintava figure on the card, and the eye on it | Fintava was left unset for this verifier. The sandbox key is not readable by verifiers. | A Hub run with `FINTAVA_API_KEY` set for `dev.fintavapay.com` (lead's environment), reading sandbox customer A (`docs/fintava/sandbox/07-`). Jest, mutants M5 and M11, and the picture capture cover the rest. |
| The frozen wallet state | Nothing stores a freeze; `423 wallet_frozen` is never answered (G-10). | G-10 |
| "Check again" on a live opening wallet | Pressed only in jest. The live state was captured. | Flipping the `FintavaWalletOpening` row to `open` while the screen is up |
| A phone | V10 is not in this task's passes. | A development build on a phone reaching a Hub (`docs/LOCAL.md`) |

Cleanup: the Hub, WAWU ID and web server (PIDs this session started) are stopped. `vh01_hub_test` and `vh01_id_test` are dropped. The backend and WAWU ID worktrees are removed, and the export and keys are deleted. The worktree `/home/user/wt/vh01m` is kept with this report commit.

## Builder report, round 2

Lead's agent, 7 Oct 2026. Merged the verifier's report (`9a4c356`) and origin/main `44ce9c9` (SHARED-02, WALLET-01, ME-01) with merge commits; in `SHARED-CHANGES.md` and `BACKEND_GAPS.md` every row is kept, with the newer status where both sides had a row (HOME-01 #1 and #2 now "applied by SHARED-02"; G-290 to G-311 from main kept).

**D1, the eye at 70%.** The eye is now `BalanceEye`, the Wallet tab's own eye, exported from `src/features/wallet/home/BalanceCard.tsx`: Eye 19, white, inside a view at 0.7 opacity, in both themes. In the browser, the eye's subtree has opacity 0.7 in light and dark (`eye` events in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/drive-log.jsonl`, crops `eye-crop-*`). Jest: "the eye is painted white at 70%, as H1 draws it". The local `eye`/`eyeFaint` metrics are gone.

**D2, a failed TGIF day read.** With TGIF on and the day's read failed, Today draws `TgifProblem` (`TgifCard.tsx`): the card's ground and label, "Today's TGIF didn't load." (an alert) and Try again, which asks for the day again. The card is hidden only when the switch is off. Jest: the error card shows, the TGIF card does not, Try again brings the card; with TGIF off neither shows. Browser: `GET /tgif/<today>` cut, then Try again with the read back (`tgif-day-error-*`, `tgif-day-retried-*`).

**D3, the creator card.** `SuggestionCard` is now the shared stacked `MediaCard` (146 by 196): `titleAccessory` for the tick and `footer` for Follow. Its own picture, scrim and caption are deleted. I chose `footer`, not `action`: `action` draws the shared `Button` (13.5 label, glass with a hairline ring once followed), while `cCard`'s Follow is a 13 label on white at 20% with no ring, so the canvas's pill goes in through `footer` and nothing is forked. MediaCard has no slot for a no-photo placeholder, so a creator without a photo now shows MediaCard's plain sunken block, not their initials, until SHARED-CHANGES HOME-01 #3 (a `placeholder` slot) exists. G-282 says so.

**Tokens (HOME-01 #1).** The TGIF card reads `tgifVerseGround` (ground and play mark), `tgifLabel` and `tgifWarmGlow` (through `stopOf`). The purple glow is the accent at H1's own 85%. The money card carries `shadows.money` (`--shadow-money`, both themes). No stand-in constant is left (`cardInk` holds only tokens and the canvas's white strengths). `CardGlows` remains for the TGIF card's two positioned glows.

**Wallet agreement (WALLET-01 on main).** Home's card no longer reads the balance by itself.
- **Same reads:** it uses the Wallet tab's queries (`walletHomeQuery(owner)` for `GET /money/wallet`, then `homeBalanceQuery(owner, open)`), keyed by the same account, so both share one cached answer.
- **Same decision:** it decides with the tab's `homeView`.
- **Same words:** shared `stateWords(view)` in `src/features/wallet/home/model.ts`, which `WalletScreen` now uses too. For example, an unreachable bank is the title "We couldn't reach your account" plus the Hub's own sentence. The canvas's "Your money is safe…" is no longer written by the app (G-310).
- **Same drawing:** the shared `MoneyGround` (`--surface-money`, `--glow-money`), `BalanceEye` and `FittedBalance` (at H1's 38: a large balance shrinks and is never cut off). All three are exported from WALLET-01's `BalanceCard.tsx`, which now uses them itself.
- **Not shared:** the eye's hidden state is kept per screen (Home and Wallet each start shown). Default (agent), owner may override.

Today's queries and the follow mutation use the provider's client, else the app's `queryClient` (`src/features/home/client.ts`), as the Wallet tab does, so Home renders under WALLET-01's router test with no provider.

**Files.**
- New: `src/features/home/MoneyCard.tsx` (replaces `BalanceCard.tsx`, deleted), `src/features/home/client.ts`.
- Changed in `src/features/home/`: `TodayScreen.tsx`, `TgifCard.tsx` (`TgifProblem`), `CreatorRail.tsx`, `model.ts` (`moneyCard` replaces `balanceView`), `look.ts`, both test files.
- Changed in WALLET-01's feature folder: `src/features/wallet/home/BalanceCard.tsx` (exports `MoneyGround`, `BalanceEye`, and `FittedBalance` with `base` and `testID`), `src/features/wallet/home/model.ts` (`stateWords`), `src/features/wallet/home/WalletScreen.tsx` (uses `stateWords`). WALLET-01's tests pass unchanged.
- Docs: `SHARED-CHANGES.md` HOME-01 #3 (new), `BACKEND_GAPS.md` G-282 (wording).

**V9 again** (backend origin/main `3041887` in a fresh worktree, its own `npm ci`, `prisma generate` and `nest build` there, nothing through hard links; Hub :5361, stand-in WAWU ID :5362, web export :5363 with only those two API origins; fresh `bh01_hub_test`; sign-in through the app's screen; Fintava sandbox read of documented customer A only). Re-shot in light and dark, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/shots/`:
- the figure and its states: H1-wallet (₦250.00 from the sandbox), H1-wallet-scrolled, H1-masked, eye-crop;
- no wallet: H1-no-wallet, H1-no-wallet-opens-A26;
- follow: H1-followed (one `FollowRelationship` row each, read back after a fresh sign-in);
- loading and TGIF off: H11-loading, H36-tgif-off (`TgifPreference.show` false, then back to true);
- the TGIF day error: tgif-day-error, tgif-day-retried;
- the creators part: creators-error, creators-empty;
- the wallet states: balance-opening (a held `conflict` opening row, which `GET /money/wallet` answers as `opening`), balance-unreachable (Hub restarted with `FINTAVA_TIMEOUT_MS=50`);
- compare-H1, compare-H11, compare-H36.

The round-1 shots of the feed tabs, the reader and the page error are not retaken (that code did not change). Every process was stopped, the database dropped and the backend worktree removed.

**After the shots:** `MoneyGround` takes its glow's gradient id (`glowId`; Home passes `today-balance-glow`, the Wallet tab keeps `wallet-balance-glow`), because on the web an SVG id is shared by the whole document and both tabs stay mounted. SHARED-02's `hubSharedProps.test.tsx` looks the Wallet tab's glow up by that id. Only the id changed, so the shots stand.

**Checks.** `npm run check` as one command, exit 0: typecheck and lint clean, jest 73 suites and 1,317 tests all passed, gates 333 files 0 findings, baseline 0, 211 tasks. The run before it failed one test, Z3 `settingsScreens` ("loading view, then a retry"). That test is outside HOME-01, failed the same way on main before round 1, and passed alone (91 of 91) and in the next full run. The home suites hold 31 tests (12 model, 19 screen), up from 28. Mutants were not run this round.

**Decisions (Default (agent), owner may override).** (1) `footer`, not `action`, for Follow (above). (2) No initials until HOME-01 #3. (3) The card's no-figure words are the Wallet tab's, replacing round 1's server sentences and W6 reassurance. (4) The eye state is per screen. (5) The TGIF error card shows the phone's day in its label.

**NOT RUN.** A phone (V10; unblocked by a development build reaching a Hub). The frozen state on screen (G-10: nothing stores a freeze). V5 is the verifier's.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
