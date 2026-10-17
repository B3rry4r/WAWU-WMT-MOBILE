---
id: DV2-RM
title: Removals pass: Events tile, TGIF card and toggle, Bills entries, tick card
owner: YOU
area: DESIGN
order: 293
priority: launch
repo: wawu-wmt-mobile
type: removal
status: verifying
depends_on: [DV2-01, DV2-02, DV2-03, DV2-06, EXPLORE-07, HOME-16]
decisions: [R-52, R-59, R-61, R-43, R-42]
passes: [V1, V3, V4, V7, V9]
artboards: [H1, W1, W5, W6, W26, M1, M2, Z2]
---
# DV2-RM · Removals pass: Events tile, TGIF card and toggle, Bills entries, tick card

## Current state

As of 17 Oct 2026 (builder, Sonnet; mobile `wmt/DV2-RM` from `origin/wmt/MERGE-10` 4b854ee4; no backend, wawu-id or migration change; no PR).
- **Status:** verifying. Built; a fresh session verifies, the builder does not.
- **Done:** Home's services row has no Events tile (R-61) and no Pay bills tile (R-52); the balance card has no Bills button (R-52); Today draws no TGIF card and reads no TGIF (switch, day or stats; R-59), so its loading shapes lost the TGIF bar and `todayPhase` reads only the balance and the creators.
- **Already gone before this task:** the bill tiles on Wallet and the Bills history chip (DV2-02, BILLS-04 r2), the "TGIF on Home" Settings row (DV2-06 wrote "TGIF each morning" in its place), the ad slot's "TGIF off" rule (DV2-01), and the Me tick card (Me never drew it; DV2-03). Only stale comments changed there (`MeScreen.tsx`, `home/api.ts`, `look.ts`).
- **Kept on purpose:** `TgifCard.tsx` and `TgifProblem` (Explore draws them, EXPLORE-07), the reader screen and `/tgif`, the tick mark beside a name (`ticksOf`), `src/app/bills/` and `src/features/bills/` (switched off, unreachable from Home, Wallet and history), the contract's `bills` history filter value (no chip offers it).
- **Not touched:** the dead share files DV2-01 left unreferenced (`ShareSheet.tsx`, `cardFile*.ts`, the share-card fetch): this task's scope names none of them, so they wait for the lead's call.
- **Pictures** (390 px, light and dark, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dv2-rm-b/pics/<home|explore|wallet|settings>-<light|dark>.png`): from this branch's web export with the Hub answered by fixtures in the browser (no stack). Home: Send only, Learn and Legal only, no TGIF card. Explore: TGIF card and Upcoming events (the events fixture was empty, so the cards are placeholders). Wallet: Send, Buy points, To cash, no bills. Settings: "TGIF each morning", no "TGIF on Home". Served on port 7921 (7920 was busy); nothing of mine is listening.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-52, R-59, R-61, R-43, R-42 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The boards the 16 Oct export dropped stop being drawn by built screens (law 6: the removals pass, after the adds). Nothing a board still draws is removed.

## Scope

- Home Events tile (R-61): `src/features/home/Services.tsx`. Events stay reachable from Explore.
- Home TGIF card and its "TGIF on Home" toggle (R-59): `src/features/home/TgifCard.tsx`, `TodayScreen.tsx`, the ADS-01 slot rule if any "TGIF off" branch remains, and `src/features/settings/SettingsScreen.tsx` (the row is replaced by DV2-06's). Remove only after the ad card, the notification (HOME-16) and the Explore card (EXPLORE-07) are in. The reader screen and its route stay.
  - Keep: Explore imports TgifCard and TgifProblem (EXPLORE-07).
- Bills (R-52, R-42): the Bills button on the balance card (`src/features/home/MoneyCard.tsx`), the Pay bills tile, the bill tiles on Wallet (`src/features/wallet/home/BillTiles.tsx`, `WalletScreen.tsx`, `WalletSkeleton.tsx`), the Bills history filter (`src/features/wallet/history/model.ts`) and every other entry into `src/app/bills/`. The bills screens and routes stay in the repo, unreachable (switched off, not deleted).
- The "Get your professional tick" card on Me (R-43): `src/features/me/MeScreen.tsx`, `ProfileHeader.tsx`, `model.ts`; the tick stays as a mark beside a name only where the Hub still serves one.
- Shop SH1 to SH15 are not built: nothing to remove. W16 and M11 to M14 are not built (not-built list). Search for every reference before deleting and move anything the removed code did that must survive (SHARED-CHANGES queue 3).

## Capability checks

- [ ] A search of `src/` finds no live entry into `src/app/bills/` from Home, Wallet or history.
- [ ] Today shows no TGIF card and Settings shows no "TGIF on Home" row; the morning notification still opens the reader.
- [ ] Home's services row has no Events tile and Explore still lists events.
- [ ] Me shows no tick-purchase card; tests that asserted the removed pieces are changed with the removal, none weakened.
- [ ] V7: walk Home, Wallet, Me, Settings and Explore as a new person, a person with a wallet and a creator: no dead end appears where an entry was.

## Builder report

- **Files:** `src/features/home/` `Services.tsx`, `MoneyCard.tsx`, `TodayScreen.tsx`, `TodayLoading.tsx`, `model.ts` (`showsTgif` removed, `todayPhase` takes balance and creators), `look.ts`, `api.ts`, `TgifCard.tsx` (comments only); `MeScreen.tsx` (comment only). Tests: `home/__tests__/HomeScreen.test.tsx` and `model.test.ts`, `ads/__tests__/TodaySponsored.test.tsx`, `bills/__tests__/billsFlow.test.tsx`, `send/__tests__/model.test.tsx`.
- **Tests removed or changed, each by a ruling, none weakened** (SHARED-CHANGES DV2-RM #5): Today TGIF card, "TGIF off" and "TGIF cannot be read" cases removed and one case added (R-59: no card, no TGIF read); Bills action, Events tile and Pay bills cases replaced by absence checks (R-52, R-61); services row now two tiles; `showsTgif` cases removed; ad tests no longer have a TGIF card beside the ad (R-59); the Home-to-Pay-a-bill walk now asserts no entry (R-52); the Send-before-Bills order is now "no Bills".
- **Checks:** typecheck EXIT 0; eslint on the 14 changed files EXIT 0; jest home, explore, wallet, settings, tgif, ads, bills, me, send, push and the two tgif root tests: 68 suites, 1196 tests, EXIT 0; `npm run gates` before 10 run, 880 files, 0 fail, 9 warn, after the same (log lines below).
- **A search of `src/`** finds no push to `/bills` and no `Pay bills` or `today-action-bills` outside the bills feature and tests that assert absence.
- **Gaps and shared-change requests:** none filed (no new data or fenced file); SHARED-CHANGES DV2-RM #1 to #4 closed, #5 records the tests.
- **Not run:** the V7 walk on a real Hub (no stack, by the brief); the pictures use fixtures.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
