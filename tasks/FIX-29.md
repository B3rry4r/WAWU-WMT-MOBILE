---
id: FIX-29
title: Unbuilt screens' entries are not drawn (R-47)
owner: YOU
area: FIX
order: 239
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [COMPLETE-01]
decisions: [R-47, R-27, R-41]
passes: [V1, V5, V6]
artboards: [X1, W1, Z1]
---
# FIX-29 · Unbuilt screens' entries are not drawn (R-47)

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-47 (the owner withdrew R-46 on 9 Oct 2026), R-27, R-41
- `tasks/COMPLETE-02.md`, `tasks/COMPLETE-05.md`, `tasks/BRAND-01.md` (what R-46 added)

## Goal

The owner, 9 Oct 2026: "UI isn't even necessary to be there if the tasks are not complete." R-46 had drawn every entry of an unbuilt screen as an inert button. This task takes them out again, so the app shows only what works.

## Scope

- Remove every `unbuilt('<ID>')` entry in `src/` (list them with `python3 scripts/gates/run.py --gate unbuilt_entries --json`): on Explore (search pill, bell, Featured creators' See all, Find a school, Create) and on the Wallet tab (scan, settings, the Dollar and Crypto tabs and Swap, Send, Add money, the bills tiles, the WAWU card row, See all). A card or row that shows real data but whose detail screen is not built stays drawn and is not pressable (a creator card, a transaction row).
- BRAND-01's Me menu sheet (Z1): only rows whose screen exists are drawn (Settings today); the seven do-nothing rows go. If one row is left, the sheet still opens as drawn with that row.
- Sections whose own task is complete stay drawn, with their designed empty state when the Hub serves nothing (keep COMPLETE-02's failed-read banner and its kept sections). Entries that are already wired (for example PROS-01's Find a professional door, merged by Developer 3) stay exactly as they are.
- Tests that asserted an inert entry is drawn now assert it is not drawn; keep the tests that pin wired entries.
- After this task `unbuilt_entries` lists nothing. The helper and the gate stay (R-47).

## Capability checks

- [ ] A user on Explore, the Wallet tab and the Me menu sees no button that does nothing (`python3 scripts/gates/run.py --gate unbuilt_entries` lists none, and a tap sweep of every pressable element lands somewhere).
- [ ] Every wired entry still lands on its screen (Find a professional, List your services, events, categories, Open your wallet, Settings).
- [ ] Nothing runs off the screen from 320 to 430 px.
- [ ] `npm run check` exit 0.

## Builder report

Branch `wmt/FIX-29`, built on main `d1a4a89`. Mobile only, no package change, no shared component forked. Continued the stopped builder's uncommitted work (Explore, Wallet, Me menu, `CreateButton`; its wallet test rewrite was half done and did not typecheck), merged main into it (clean, no conflicts), then found and removed the inert entries EVENTS-04 had added since (`unbuilt_entries` listed 3 on the merged tree) and finished the tests. `python3 scripts/gates/run.py --gate unbuilt_entries` now lists nothing. The `unbuilt` helper and its gate stay, unused (R-47).

**Entries removed, by screen** (each is added back, as drawn, by the task named):

| Screen | Removed | Added back by |
|---|---|---|
| Explore (X1, X14, X15) | search pill | EXPLORE-02 |
| | bell and its unread dot (and the unread read behind it) | ME-14 |
| | Featured creators' See all | EXPLORE-02 |
| | Find a school door | SCHOOLS-03 |
| | Create button (and the account-type read behind it, and the room under the last row) | ME-04 |
| | creator card press on the rail and in the Categories grid: the card stays drawn with its Follow, not pressable | ME-02 |
| Wallet tab (W1, W4, W5, W6) | scan icon | WALLET-20 |
| | settings icon | WALLET-06 |
| | account tabs Naira, Dollar, Crypto | WALLET-21 |
| | Send | WALLET-02 |
| | Add money | WALLET-05 |
| | Swap | WALLET-21 |
| | the five bills tiles | BILLS-01 |
| | WAWU card row | WALLET-22 |
| | See all, and a transaction row's press (rows stay drawn, not pressable) | WALLET-04 |
| | W4's loading shapes for the tabs, actions and tiles | with their entries |
| Me menu (Z1) | Creator dashboard, My content | ME-07 |
| | My purchases, Saved, Notifications | ME-14 |
| | My courses | SCHOOLS-08 |
| | Verification | ME-12 |
| Events (E1, E13 to E15, E16, E21), added by EVENTS-04 after the first builder started | My events tab (E1 and the host wizard) | EVENTS-08 |
| | My events button on E16 (Done stays, now the one full-width button) | EVENTS-08 |
| | Get verified button on E21 (the gate keeps its words and price) | ME-12 |

**Kept, wired, unchanged**: Find a professional, List your services, the category tiles, Upcoming events' See all, an event card, Follow, Open your wallet, the eye and Copy on the balance card, Try again, Settings (the one Me menu row), Host event tab, Host your event Start, Done, Back. Sections whose task is built keep their empty states and Explore's failed-read banner.

**What the stopped builder had done / what I added.** It had done Explore, Wallet and the Me menu in code (and `CreateButton` made prop-driven), plus the Wallet test rewrite (unfinished). I added: the three Events removals above, `explore-bar` test id, the rest of the test rewrites (Explore `screens.test.tsx`, `MeScreen.test.tsx`, professionals `routes.test.tsx`, `walletTabFlow.test.tsx`, the unfinished tail of `WalletScreen.test.tsx`, `hostScreens.test.tsx`), a new `src/__tests__/createButton.test.tsx` (the button has no screen now, so it is pinned alone), removal of the dead `fetchUnreadNotifications` and `unreadKey`, an unused `space` import, and stale R-46 comments. Merge commit `a5715a0` carries git's default message (no trailers); every later commit carries them (no amend, by rule).

**Tests.** Each test that asserted an inert entry is drawn now asserts it is absent, by test id, by role and by words, for every state (data, new account, bank down, loading, no wallet, opening, frozen, failed reads). New: "every button on Explore does something" (lists every button and presses each: opens a built screen or follows; the creator card has no role), "every button on W1 does something" (the eye and Copy are the only two), Me menu "draws none of the seven rows and every row it draws is a button". Order and wiring tests kept (doors in order, List your services lands on P5 or P8, Find a professional opens P1, Settings opens Z2).

**Pictures** (V5), in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/pictures/` (contact sheets in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/sheets/`): web export (`npx expo export -p web`, private TMPDIR) on port 5985 in Chromium from `/opt/pw-browsers`, at 360 and 390 px, light and dark, `<screen>-<width>-<theme>.png`. **The Hub and WAWU ID were a stand-in** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/standin.js`, ports 5986 and 5987, local only; the browser refused every other address and refused 0 requests). The stand-in's names, figures and events are samples, not the app's data. Screens: `explore-data` (a creator account with unread notifications, so Create and the bell's dot would show if they were drawn), `explore-empty`, `explore-failed` (the banner), `wallet-data`, `wallet-new`, `wallet-bank-down`, `wallet-loading`, `me-menu`, `events-e1`, `host-gate`, `host-sent`; `explore-*` and `wallet-data` also have `-scrolled` pictures (the doors card, the last rows).

**Tap sweep** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/sweep.log`, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/pictures/report-sweep.json`): every pressable element on those 11 screens at 390 px (97 presses, each from a fresh load). Each one lands somewhere (a URL change, a request, or a visible change). The only presses that change nothing are the already-selected tab (the tab bar's current tab on 7 screens, the selected Discover tab): a selected tab is not a dead entry. On `me-menu` the sheet covers the tab bar, so a press at a tab's centre lands on the sheet's Settings row (opens `/settings`): the sweep's artefact, not a defect.

**Widths** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/widths.log`, `report-widths.json`): the same 11 screens at 320, 340, 360, 375, 390, 412 and 430 px (77 loads): the page never scrolls sideways (`scrollWidth` equals the viewport) and no element runs off the screen except inside a rail that scrolls on its own (category tiles, creators, events, which run off the edge by design).

**Mutants of my own** (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix29r2/mutants.py`, `mutants.log`): 10 applied, 10 killed, each file restored from a copy and compared. M1 Find a school put back inert (Explore), M2 Find a professional dropped, M3 creator card made pressable to nowhere, M4 wallet row made pressable to nowhere, M5 a Me menu row put back (Saved), M6 My events tab put back, M7 Get verified put back, M8 wallet scan icon put back, M9 Create put back on Explore, M10 Featured creators' See all put back.

**Checks.** `npm run check` exit 0 as one command: typecheck 0, lint 0 errors (7 warnings, none in a file this task touched), 114 suites / 1899 tests, gates 10 run, 455 files, 0 fail, 1 warn (`PROVISIONAL(HOST-PICKER)`, EVENTS-04's), `unbuilt_entries` lists nothing, 271 tasks. The first full run failed once, only in `src/features/events/__tests__/eventsScreens.test.tsx` ("a user sees when a tier ended and when one opens in the event's zone", D8: the known load flake, machine load average about 7); that file alone passed 47 of 47 once and failed that same test once, and the test alone (`-t`) passed; the second full run was green. Secret scan of the diff (key-shaped strings, `sk_`, `FLWSECK`, bearer tokens, private-key headers): none; no em-dash in anything a user reads.

**Decisions (Default (agent), owner may override)**
- Where one button is left, it stays as drawn but alone: E16 shows Done full width; the Me menu sheet opens with Settings only (R-47 text).
- E21 keeps its words and the price from the system; the only way out is Back in the bar, until ME-12 adds Get verified.
- E22 (Sent back, `/events/sent-back/[id]`) is a built screen with no entry until EVENTS-08 adds My events; it is not an entry, so it stays.
- `ExploreBar` and `WalletBar` keep their 44 high row and title so the body sits where it will once the icons are added.
- `CreateButton` stays in `src/components/` with a required `onPress`, unused until ME-04; the dead unread-count read was removed (ME-14 reads its own count).
- A creator card on Explore and in Categories stays drawn with its Follow and is not pressable (R-47: real data, detail not built).

**NOT RUN.** A real device or the real Hub (the pictures use a stand-in; unblocked by a Hub the verifier can run against). The design comparison of each picture against its artboard and the V-passes (the verifier decides). A tap on a physical phone. The inert-entry gate against EVENTS-08, ME-12, EXPLORE-02 and the other tasks when they land (each must add its entry, as drawn, when it builds its screen).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
