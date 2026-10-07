---
id: HOME-01
title: Today: home screen, loading, TGIF off
owner: YOU
area: HOME
order: 170
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
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

## Verifier report, round 2

Verifier session, 7 Oct 2026. It is the same verifier as round 1, and it wrote none of HOME-01.

**Setup**
- **Head:** `158708f`, checked out detached in `/home/user/wt/vh01m2`. It contains my round-1 report `9a4c356` and mobile main `44ce9c9`.
- **Hub:** backend origin/main `3041887`, in a fresh worktree with its **own `npm ci`**. `prisma generate` and `nest build` ran there, with nothing hard-linked. The database was fresh, migrated and `db:seed`ed: `vh01r2_hub_test`.
- **WAWU ID:** the real one, origin/main `fb8717e`, with its own `npm ci`, `prisma generate` and build. Its database was `vh01r2_id_test`, seeded by `scripts/local/seed-wawu-id.js`.
- **For the Wallet comparison:** a detached main worktree at `44ce9c9`.
- **Ports:** Hub :5395, WAWU ID :5396, and :5397 for the web exports. The branch and main exports were served in turn on :5397. Both were built with `expo export --platform web --clear` and a private TMPDIR. Each bundle names only `localhost:5395` and `localhost:5396` as API origins, and every browser request went only to :5395, :5396 or :5397.
- **Sign-in:** through the app's own screens, against the real WAWU ID.
- **Fintava:** unset. A wallet holder's real answer is therefore `503 provider_unreachable`.
- **Picture-only balances:** where a figure had to be drawn (₦12,345.67, ₦98,765,432.10, ₦999,999,999.99), the browser wrote the balance answer **for the picture only**. Those captures are not V9 evidence.
- **Seed:** as in round 1. `creator-basic` holds a `FintavaWallet` row, `creator-pro` is `opening`, and `user` has no wallet. "Tamunotonye Briggs" has a creator tick, Chidi Umeh a professional tick, and there are 1,234 readers.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vh01r2/`: `shots/`, `pairs/` (design or main left, branch right; `walletdiff-*` adds a third panel, the difference at 8x), `design/`, `logs/batch-*.log`, `drive-log.jsonl`, `mutants.json`, `check-1.log`, `check-final.log` and `tools/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 code | passed, with D3 still open | `npm run check` as one command on `158708f`: exit 0 (`check-1.log`). Typecheck and lint clean; jest 73 of 73 suites and 1,317 of 1,317 tests; gates 9 run, 333 files scanned, 0 findings, baseline 0; 211 tasks. The final run on the report commit is in the "V1 final" row. **Scope:** compared with `44ce9c9`, the branch touches `src/features/home/`, the two `(tabs)` route files, `src/features/feed/FeedScreen.tsx`, the two shared tests from round 1, and three WALLET-01 files (`src/features/wallet/home/BalanceCard.tsx`, `model.ts`, `WalletScreen.tsx`). It also touches docs. No `src/components`, theme, `src/api`, `_layout.tsx` or `package.json` is touched, and no WALLET-01 test changed. |
| R-41 | passed, unchanged | The left-out table is the same as round 1, and every destination task is still `todo`. The browser text of every capture holds no Send, Add, Bills, Scan, tiles, See all, search, bell or Create, and the jest test asserts the same. |
| V4 | passed | The same traces as round 1. Home's money card now reads WALLET-01's `GET /money/wallet` first, then the balance (MONEY-11). TGIF readers came through as "1.2K reading today". The renamed creator and both ticks came from WAWU ID and the Hub. |
| V5 picture | passed | Pairs for H1 (figure, and no wallet), H11 and H36, light and dark, plus the TGIF day error. Classified under Findings. |
| V6 states | passed | Every state was entered by its real cause. **Loading:** Hub held (`H11-loading-*`). **No wallet:** real; Open your wallet opens `/open-wallet`. **Opening:** real. **Unreachable:** real, with Fintava unset. **TGIF day cut:** an error card with Try again, which recovers (D2). **Creators error:** Try again recovers. **Page error:** offline, then retried. **Tabs:** the bar's Home tab is `aria-selected` on Following and on For you. **TGIF off:** set through Settings Z2 (H36). |
| V9 live seam | passed | **Follow:** the database had 0 rows before. `user` tapped Follow, and a `FollowRelationship` row (`…0001` to `…0003`, 19:45:08) appeared. The Hub's `GET /creators` answers `"following":true`. **TGIF switch:** there was no row before. Off in Z2 gives `TgifPreference.show=f`, and `GET /settings/tgif` answers `{"show":false}`. Today then has no card, no error and no empty frame. On again gives `show=t`, and the card is back. |
| Wallet sharing | passed | Details under "Wallet sharing" below. |
| Mutants | 20 of 22 killed | Details in the list after this table. |
| V1 final | passed | `npm run check` on the report commit's tree, as one command (`check-final.log`): exit 0. Typecheck and lint clean; jest 73 of 73 suites, 1,317 of 1,317 tests; gates 333 files scanned, 0 findings, baseline 0; 211 tasks. |

Mutants (`tools/mutants.py`, run against the home and wallet suites and `hubSharedProps`; the worktree was clean afterwards):
- **Round 1's 14, mapped onto round-2 code:** all killed. M5 is now "unreachable retries the wallet read instead of the balance", and M11 is now "eye on a no-figure card".
- **8 new mutants, 6 killed:**
  - N1: the TGIF error card is never shown.
  - N2: TGIF Try again asks for the creators instead.
  - N3: the eye loses its 70%.
  - N5: "opening" offers Open your wallet.
  - N6: the balance is asked for with no open wallet.
  - N8: the TGIF error shows with TGIF off.
- **Survived:**
  - N4: Home's figure drawn at W1's 42 instead of H1's 38.
  - N7: Home's glow reusing the Wallet tab's SVG id.

Both are test gaps, not wrong code; see T1 and T2.

### Round-1 defects

**D1 · closed.** The eye is WALLET-01's `BalanceEye`, white inside a 0.7-opacity view. Its effective opacity in the browser is 0.7 in both themes. The brightest eye pixel is (202,185,210) on the built card against (203–204,185,212) on the canvas (`pairs/H1-*`). Mutant N3 is killed.

**D2 · closed.** With TGIF on and `GET /tgif/2026-10-07` cut, Today shows `TgifProblem`: the card's ground and label, "Today's TGIF didn't load." as an alert, and the shared `Button` (glass, sm) Try again. No TGIF card is shown (`tgif-day-error-*`). With the request let through, Try again brings the card and the error goes (`tgif-day-retried-*`). The card is hidden only when TGIF is really off, set through Settings. Mutants N1, N2 and N8 are killed.

**D3 · partly closed, still open.**
- **The picture, scrim and caption are closed.** `SuggestionCard` is the shared stacked `MediaCard`: the tick goes through `titleAccessory`, and the card's own picture, scrim and caption are gone.
- **The Follow pill is a redraw, not the shared Button. It is a fork.** The pill goes in through `footer` as `FollowButton` (`CreatorRail.tsx`): a `Pressable` and a `Text` with their own colours (`cardInk.accent`, `cardInk.following`), their own 32 height and their own 13/700 label.
- **Main already has the slot this pill should use.** SHARED-02 added `MediaCard`'s `action` slot for exactly this button: "Stacked only: the card's one button under the caption, 8 below the subtitle line (`cCard`'s Follow)". It draws the shared `Button` at `mediaMetrics.actionHeight` 32, primary for Follow and glass for Following (the `on` state). EXPLORE-01 #3 points Explore's creator card to it.
- **The builder's reasons are kit-level differences.** They are a 13.5 label against the canvas's 13, and a hairline ring on glass. A difference of that kind goes to the shared component as a prop or a SHARED-CHANGES row. A screen does not redraw it, or Home and Explore draw the same `cCard` Follow two ways.
- **Reproduction:** `src/features/home/CreatorRail.tsx`, `FollowButton`, passed as `footer={…}`.
- **Fix:** pass `action={{ label: following ? 'Following' : 'Follow', on: following, onPress, loading: busy, testID }}`, and delete `FollowButton`. If the owner wants cCard's exact 13 label and no ring, that change is a SHARED-CHANGES row on `MediaCard`'s `action`, applied for every creator card.

### Classifying the no-photo block

**Matches the canvas.** A creator with no photo now shows `MediaCard`'s plain sunken block. `cCard` draws `background: center/cover url(photo) var(--surface-sunken)`, so the canvas's own look for a card without its photo is exactly that sunken ground. The missing photo itself is recorded in G-282 (no cover picture is served). Initials on the block (SHARED-CHANGES HOME-01 #3) would be an addition beyond the canvas, so the bare block is not a defect.

### Wallet sharing (WALLET-01's files)

**Behaviour and picture: unchanged.** I compared W1 (figure), W4 (loading, cold, with the Hub held), W5 (new account) and W6 (unreachable) between main `44ce9c9` and the branch, in light and dark at 390 x 845.
- **Above the bar:** zero pixels differ in every pair.
- **In the bar:** the labels and icons differ only in their antialiasing. Main renders them with coloured subpixels and the branch in grey. This is a compositing effect of the mounted Home tab (Home now draws a card under its SVG). The shapes, colours and positions are the same (`pairs/walletdiff-*`, `pairs/walletbar-zoom-dark.png`).
- **W5 for a person with no wallet:** on both builds, tapping Wallet goes to `/open-wallet` (A26), and the two pages are pixel-identical.
- **W4 with Home already loaded:** on the branch, a no-wallet person who has already loaded Home gets A26 at once, without W4's skeleton in between. The tab already holds Home's cached "not open" answer. That is the shared cache working, and the end screen is unchanged.

**Tests:** WALLET-01's 4 test files are unchanged and pass in the full run. `hubSharedProps.test.tsx` finds the Wallet glow by its default id `wallet-balance-glow`.

**`FittedBalance` at 320 x 568 never cuts the figure.**

| Figure | Font size | Text width | Room |
|---|---|---|---|
| ₦98,765,432.10 | 32 px | 244 | 244 |
| ₦999,999,999.99 | 30 px | 244 | 244 |

In both cases the text's `scrollWidth` equals its `clientWidth`, so nothing is clipped (`fit-*-320-*`). The hidden measuring copy is `aria-hidden` and `importantForAccessibility="no-hide-descendants"`.

**One cached answer:** after Home had read `GET /money/wallet` and the balance, I held every Hub request and opened the Wallet tab. It drew ₦12,345.67 at once, while its own refetches (`/money/wallet`, `/balance`, `/transactions`) were still held (`cache-wallet-while-held-light.png`). Both tabs use `walletHomeQuery(owner)` and `homeBalanceQuery(owner, open)` on the app's one `queryClient`.

**Unreachable wording matches W6's ruling (G-310).** Home shows the title "We couldn't reach your account" and then the Hub's own sentence, "We could not reach your account. Your money is safe. Try again in a moment." The Wallet tab shows the same words, with Try again. The app no longer writes the canvas's custody line "Your money is safe. This is a connection problem between us and the bank.", which WALLET-01 lists as not a fact. The reassurance that does show is the server's own sentence, as G-310 says.

### V5, re-classified for round 2

| Element | Classification |
|---|---|
| Tab row; money card (chip, eye at 70%, figure size and faint kobo, ground, `--glow-money`, `--shadow-money`); TGIF card (`--tgif-verse-ground`, `--tgif-label` lilac, `--tgif-warm-glow`, play disc); heading; rail card size and spacing | **Matches** (`pairs/H1-*`) |
| H11 shapes, H36 without a TGIF card | **Matches**; skeleton heights per H11's own note |
| Creator card with no photo | **Matches** the canvas's sunken fallback; the photo itself is G-282 |
| Follow pill | **D3** (a fork) |
| Search, bell, Send, Add, Bills, Scan, the chip chevron, tiles, See all, the FAB, H36's sponsored card | **Recorded reason:** R-41 and R-27; Scan also under BRIEF "Not built at launch" |
| "2 min" | **Recorded reason:** G-280 |
| No-figure words on the money card | **Recorded reason:** the Wallet tab's own words through `stateWords` (WALLET-01, G-310), which replace round 1's |
| Canvas phone chrome | Not part of the app |

### Test gaps (not defects; the code is right today)

- **T1:** nothing fails if Home's figure is drawn at W1's 42 instead of H1's 38 (mutant N4). The picture shows 38 today.
- **T2:** nothing fails if Home's `MoneyGround` drops `glowId="today-balance-glow"` (mutant N7). The builder notes that on the web an SVG id is shared by the whole document, and both tabs stay mounted.

### Still unclear (web only, from round 1)

Home's own tab row carries no `aria-selected` on the web build; the native app reads the selection.

### NOT RUN

| Item | Why | What unblocks it |
|------|-----|------------------|
| A live Fintava figure | Fintava was unset for this verifier, and verifiers cannot read the sandbox key. | A Hub run with `FINTAVA_API_KEY` set for `dev.fintavapay.com`. The picture-only figure and jest cover the drawing. |
| The frozen state | Nothing stores a freeze. | G-10 |
| A phone | V10 is not in this task's passes. | A development build on a phone reaching a Hub (`docs/LOCAL.md`) |

Cleanup: the Hub, WAWU ID and web server (PIDs this session started) are stopped. `vh01r2_hub_test` and `vh01r2_id_test` are dropped. The backend, WAWU ID and main-comparison worktrees are removed, and the exports are deleted. `/home/user/wt/vh01m2` is kept with this commit.

## Builder report, round 3

Lead's agent, 7 Oct 2026. Merged the verifier's round-2 report (`8d81945`) and origin/main `21e0387` (SHARED-03's task file) with merge commits. Every row in `SHARED-CHANGES.md` and `BACKEND_GAPS.md` is kept; where both sides had a row, the newer status wins (one duplicate HOME-09 F1 row marked `open` was dropped beside its `done by HOME-01` copy).

**D3, closed by the lead's ruling.** Follow on a creator card is MediaCard's shared `action`: `action={ label, on: following, onPress, loading: busy, testID }` in `CreatorRail.tsx`. The hand-drawn `FollowButton` (Pressable and Text) is deleted, with the `follow`, `followWords` and `following` look values it used. The look still differs from the canvas: a 13.5 label where the canvas has 13, and Following has a hairline ring where the canvas has none. This is **not fixed per screen**. SHARED-03 (main's task list, item 6) changes it once in the shared `action` for every creator card. The initials for a creator with no photo also wait for SHARED-03's card placeholder (HOME-01 #3).

**T1 and T2, the verifier's two surviving mutants, now killed** (`src/features/home/__tests__/HomeScreen.test.tsx`):
- **T1:** "draws Home's figure at H1's 38, not the Wallet tab's 42" reads the figure's font size.
- **T2:** "gives Home's money glow its own gradient id" requires the card's only radial gradient to be `today-balance-glow`.

Mutant check: removing `base={m.figure}` fails T1 and dropping `glowId="today-balance-glow"` fails T2, each 1 of 21. `MoneyCard.tsx` was restored and its sha1 is the same before and after (`f4a3a758`).

**Pictures.** Backend main `3041887` in a fresh worktree with its own `npm ci`, `prisma generate` and `nest build`. Hub :5361, stand-in WAWU ID :5362, web export :5363 (only those two API addresses in the bundle), fresh `bh01_hub_test`, sign-in through the app, sandbox read of customer A (₦250.00). Shots in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/shots-r3/`, light and dark:
- `H1-wallet`, `H1-wallet-scrolled`, `H1-masked`;
- `H1-followed`: Follow is the shared Button. Pressing it wrote one `FollowRelationship` row each time, and a fresh sign-in read Following back.

Everything was stopped, the database dropped and the backend worktree removed. The round-2 shots in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh01/shots/` stand for every part this round did not touch.

**Files.** `src/features/home/CreatorRail.tsx`, `src/features/home/look.ts`, `src/features/home/__tests__/HomeScreen.test.tsx`; docs (`tasks/HOME-01.md`, `docs/LOG.md`, the generated `tasks/INDEX.md` and `docs/PROGRESS.md`).

**Checks.** `npm run check` as one command, exit 0: typecheck and lint clean, jest 75 suites and 1,350 tests all passed, gates 346 files 0 findings, baseline 0, 212 tasks. The home suites hold 33 tests (12 model, 21 screen).

**NOT RUN.** A phone (V10; unblocked by a development build reaching a Hub). The frozen state on screen (G-10). V5 is the verifier's.

## Verifier report, round 3

Verifier session, 7 Oct 2026. It is the same verifier as rounds 1 and 2, and it wrote none of HOME-01. This was a narrow re-check of head `737b96e`, which contains my round-2 report `8d81945` and main `21e0387`, checked out detached in `/home/user/wt/vh01m3`.

**Live setup**
- **Hub:** backend origin/main `3041887`, with its own `npm ci`, `prisma generate` and `nest build`, on a fresh migrated and seeded `vh01r3_hub_test`.
- **WAWU ID:** the real one, `fb8717e`, with its own `npm ci` and build, on `vh01r3_id_test`.
- **Ports:** Hub :5395, WAWU ID :5396, web export :5397 (`--clear`, private TMPDIR). The bundle names only `localhost:5395` and `localhost:5396` as API origins, and every request went to localhost:5395, :5396 or :5397.
- **Sign-in:** through the app's own screens.
- **Fintava:** unset. The ₦12,345.67 figure was written by the browser for the picture only.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vh01r3/`: `shots/`, `pairs/H1-*`, `logs/batch.log`, `mutants.json`, `check-1.log` and `check-final.log`.

| Check | Result | Evidence |
|---|---|---|
| D3, Follow through MediaCard `action` | closed | `CreatorRail.tsx` passes `action={{ label, on: following, onPress, loading: busy, testID }}`. `FollowButton` is gone, and so are its look values (`follow`, `followWords`, `cardInk.following`, `cardInk.accent`, `todayWords.follow`). A grep of `src/features/home` finds no `footer=`, no `FollowButton` and none of those values. The two `Pressable`s left are `HomeTabs`' tabs (role `tab`, from round 1) and the whole TGIF card, the card's own press; neither is a button. In the browser, Follow and Following are the shared `Button`: primary, then glass (`H1-after-follow-dark.png`). |
| The 13 vs 13.5 label and the Following ring | recorded, not this task's defect | SHARED-03 item 6 on main changes `MediaCard`'s `action` once, for every creator card, to the canvas's 13 label and to white at 20% with no ring. |
| T1, T2 | both killed | Re-applied my round-2 survivors. N4 (Home figure at W1's 42) now fails "draws Home's figure at H1's 38". N7 (Home's glow without its own id) now fails "gives Home's money glow its own gradient id". |
| A Follow and unfollow through the app | passed | **Follow:** the database had 0 rows before. `user` tapped Follow on Tamunotonye Briggs; one `FollowRelationship` row appeared (`…0001` to `…0003`, 20:03:51) and the Hub's `GET /creators` answered `following:true`. A fresh sign-in drew Following. **Unfollow:** `user` tapped Following; the button turned back to Follow, the database was back to 0 rows, and the Hub answered `following:false`. |
| `npm run check` as one command | passed | Exit 0 on `737b96e` (`check-1.log`). Typecheck and lint clean; jest 75 of 75 suites and 1,350 of 1,350 tests; gates 9 run, 346 files scanned, 0 findings, baseline 0; 212 tasks. The final run on the report commit is the "V1 final" row. |
| D1 still closed | passed | Effective eye opacity is 0.7 in both themes. The brightest eye pixel is (202,185,210) against the canvas's (203–204,185,212). |
| D2 still closed | passed | `GET /tgif/2026-10-07` cut: the error card with Try again shows, and Try again with the read back brings the card (`tgif-day-error-*`, `tgif-day-retried-*`). |
| Merge rows | passed | Every `SHARED-CHANGES.md` and `BACKEND_GAPS.md` row key from both parents (`8d81945` and `21e0387`) is in the merge, with no duplicate key. **The dropped HOME-09 F1 row was a true duplicate:** main had it as `open` and the branch as `done by HOME-01`, and every other column is byte-identical. The merge keeps the one row with the newer status. |
| V5, H1 pairs re-classified | passed | `pairs/H1-{light,dark}.png`. **Matches:** the tab row, the money card (chip, eye at 70%, figure and faint kobo, ground, glow, shadow), the TGIF card, the heading, and the rail card size and spacing. **Recorded:** the Follow label and the Following ring (SHARED-03 item 6); the no-photo sunken block (the canvas's own `var(--surface-sunken)` fallback, with the photo itself in G-282); the left-outs (R-41, R-27; Scan under BRIEF "Not built at launch"); "2 min" (G-280). |
| R-41 left-outs | unchanged | The same left-out table as round 1, and still no left-out entry on screen. |
| Mutants | 23 of 25 killed | All 22 from round 2 are now killed, N4 and N7 included. Of 3 new mutants on the round-3 `action` wiring, 1 is killed (R3: the label never switches). 2 survive; see T3 and T4. |
| V1 final | passed | `npm run check` on the report commit's tree, as one command (`check-final.log`): exit 0. Typecheck and lint clean; jest 75 of 75 suites, 1,350 of 1,350 tests; gates 346 files scanned, 0 findings, baseline 0; 212 tasks. |

**Test gaps (not defects; the code is right today, as the Following capture shows):**
- **T3:** mutant R1 survives. Passing `on: false` would draw Following on the accent instead of glass, and no test fails.
- **T4:** mutant R2 survives. Passing `loading: false` would hide the spinner during a follow, and no test fails.

**No defect is open, so the status is `review`.**

**NOT RUN**

| Item | What unblocks it |
|---|---|
| A live Fintava figure | A Hub run with `FINTAVA_API_KEY` set for `dev.fintavapay.com` |
| The frozen state | G-10 |
| A phone (V10 is not in this task's passes) | A development build reaching a Hub (`docs/LOCAL.md`) |

Cleanup: the Hub, WAWU ID and web server (PIDs this session started) are stopped. `vh01r3_hub_test` and `vh01r3_id_test` are dropped. The backend and WAWU ID worktrees are removed, and the export and keys are deleted. `/home/user/wt/vh01m3` is removed after the push.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
